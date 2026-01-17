// src/pages/Analysis.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, TextField, Button, Grid, MenuItem, Paper, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Chip, ButtonGroup } from '@mui/material';
import { DataGrid, GridToolbar, GridFooter, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Print as PrintIcon, PictureAsPdf, TableView, Comment as CommentIcon, CalendarToday, EventNote, DateRange } from '@mui/icons-material';
import logo from '../assets/phibelalogo.png';
import Tooltip from '@mui/material/Tooltip';
import dayjs, { Dayjs } from 'dayjs';
import { customersApi, Customer } from '../api/customers';
import { foodItemsApi, FoodItem } from '../api/foodItems';
import { analysisApi, AnalysisOrderRow, AnalysisFilters } from '../api/analysis';
import { Alert } from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import TableSkeleton from '../components/TableSkeleton';

// Using AnalysisOrderRow from api/analysis.ts
type OrderRow = AnalysisOrderRow;


function CustomFooter(props: any) {
    const { totalMeals, totalAmount, totalSubsidy, ...other } = props;
    return (
        <Box>
            <Box sx={{ display: 'flex', borderTop: '1px solid #e0e0e0', p: 1, fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                <Box sx={{ flex: 1.5 }}>Totals</Box>
                <Box sx={{ flex: 1.5 }}></Box>
                <Box sx={{ flex: 1.5 }}></Box>
                <Box sx={{ flex: 1.5 }}></Box>
                {/* Total Meals */}
                <Box sx={{ flex: 1, textAlign: 'right' }}>{totalMeals}  Meals</Box>
                <Box sx={{ flex: 1, textAlign: 'right' }}>{(totalAmount || 0).toLocaleString()} ETB</Box>
                <Box sx={{ flex: 1, textAlign: 'right' }}>{(totalSubsidy || 0).toLocaleString()} ETB</Box>
            </Box>
            <GridFooter {...other} />
        </Box>
    );
}

const Analysis: React.FC = () => {
    const [from, setFrom] = useState<Dayjs | null>(null);
    const [to, setTo] = useState<Dayjs | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderRow | null>(null);
    // State for row selection (MUI v8+ uses { type, ids })
    const [selectedRows, setSelectedRows] = useState<any>({ type: 'include', ids: new Set() });

    // Build filters for React Query
    const filters: AnalysisFilters = useMemo(() => {
        const f: AnalysisFilters = {};
        if (from) f.from = from.format('YYYY-MM-DD');
        if (to) f.to = to.format('YYYY-MM-DD');
        if (selectedCustomer) f.customerId = selectedCustomer._id;
        if (selectedDepartment) f.department = selectedDepartment;
        if (selectedFoodItem) f.itemCode = selectedFoodItem.code;
        if (selectedStatus) f.status = selectedStatus;
        return f;
    }, [from, to, selectedCustomer, selectedDepartment, selectedFoodItem, selectedStatus]);

    // Fetch analysis data with React Query
    const { data = [], isLoading, isError } = useQuery({
        queryKey: ['analysis', filters],
        queryFn: () => analysisApi.getOrders(filters),
        enabled: !!(from && to), // Only fetch when date range is set
    });

    const totalMeals = data.length;
    const totalAmount = data.reduce((acc, curr) => acc + (curr.price || 0), 0);
    const totalSubsidy = data.reduce((acc, curr) => acc + (curr.subsidy || 0), 0);


    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [custResponse, itemsResponse] = await Promise.all([
                    customersApi.getAll({ limit: 1000 }), // Get all for filters
                    foodItemsApi.getAll({ limit: 1000 })  // Get all for filters
                ]);
                const custs = custResponse.customers;
                const items = itemsResponse.foodItems;
                setCustomers(custs);
                setFoodItems(items.filter(i => i.isActive)); // Only active items
                const uniqueDeps = Array.from(new Set(custs.map(c => c.department))).sort();
                setDepartments(uniqueDeps);
            } catch (error) {
                console.error('Failed to load initial data', error);
            }
        };
        loadInitialData();
    }, []);

    // Quick date range functions
    const setQuickRange = (range: 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth') => {
        switch (range) {
            case 'today':
                setFrom(dayjs());
                setTo(dayjs());
                break;
            case 'yesterday':
                setFrom(dayjs().subtract(1, 'day'));
                setTo(dayjs().subtract(1, 'day'));
                break;
            case 'last7days':
                setFrom(dayjs().subtract(6, 'days'));
                setTo(dayjs());
                break;
            case 'thisMonth':
                setFrom(dayjs().startOf('month'));
                setTo(dayjs().endOf('month'));
                break;
            case 'lastMonth':
                setFrom(dayjs().subtract(1, 'month').startOf('month'));
                setTo(dayjs().subtract(1, 'month').endOf('month'));
                break;
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'p':
                        e.preventDefault();
                        window.print();
                        break;
                    case 'e':
                        e.preventDefault();
                        if (data.length > 0) handleExportExcel();
                        break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [data]);


    const handleExportPDF = (selectedData?: OrderRow[]) => {
        const exportData = selectedData || data;
        try {
            console.log("Starting PDF Export...");
            const doc = new jsPDF();

            // --- Header Section matching Print Layout ---
            const pageWidth = doc.internal.pageSize.width;
            const leftMargin = 14;
            const rightMargin = pageWidth - 14;
            const contentWidth = pageWidth - 28;

            // Main Container Box for Header
            doc.setLineWidth(0.5);
            doc.rect(leftMargin, 10, contentWidth, 30); // x, y, w, h

            // Vertical Lines for 3 columns (approx 25% | 50% | 25%)
            const col1Width = contentWidth * 0.25;
            const col2Width = contentWidth * 0.50;

            doc.line(leftMargin + col1Width, 10, leftMargin + col1Width, 40); // Line 1
            doc.line(leftMargin + col1Width + col2Width, 10, leftMargin + col1Width + col2Width, 40); // Line 2

            // Col 1: Logo
            try {
                // Assuming 'logo' from import is a valid URL/Path handled by vite
                const img = new Image();
                img.src = logo;
                doc.addImage(img, 'PNG', leftMargin + 2, 12, col1Width - 4, 26, undefined, 'FAST');
            } catch (e) {
                doc.setFontSize(10);
                doc.text("Logo", leftMargin + 10, 25);
            }

            // Col 2: Company Name & Report Form
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text("PhiBela Industrial PLC", leftMargin + col1Width + (col2Width / 2), 20, { align: "center" });

            doc.line(leftMargin + col1Width, 25, leftMargin + col1Width + col2Width, 25); // Horizontal divider

            doc.setFontSize(12);
            doc.text("Orders Analysis Report", leftMargin + col1Width + (col2Width / 2), 33, { align: "center" });

            // Col 3: Metadata Table (Mini table inside rights column)
            // Rows: Doc No / Issue Date, Issue No / Page
            const col3Start = leftMargin + col1Width + col2Width;
            const col3Width = contentWidth * 0.25;

            doc.line(col3Start, 25, rightMargin, 25); // Horizontal Split
            doc.line(col3Start + (col3Width / 2), 10, col3Start + (col3Width / 2), 40); // Vertical Split in Col 3

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");

            // Quadrant 1
            doc.text("Doc. No.", col3Start + 2, 14);
            doc.text("PSD/OF/039", col3Start + 2, 22);

            // Quadrant 2
            doc.text("Issue Date", col3Start + (col3Width / 2) + 2, 14);
            doc.text("Oct. 2021", col3Start + (col3Width / 2) + 2, 22);

            // Quadrant 3
            doc.text("Issue No. 1", col3Start + 2, 34);

            // Quadrant 4
            doc.text("Page 1 of 1", col3Start + (col3Width / 2) + 2, 34);

            // --- Metadata Row (Date / Period) ---
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            const dateStr = dayjs().format('DD/MM/YYYY');
            const periodStr = from && to ? `${from.format('DD/MM/YYYY')} - ${to.format('DD/MM/YYYY')}` : 'N/A';

            doc.text(`Date: ${dateStr}`, leftMargin, 46);
            if (from && to) {
                doc.text(`Period: ${periodStr}`, rightMargin, 46, { align: "right" });
            }

            // --- Data Table ---
            const tableData = exportData.map((row) => [
                dayjs(row.timestamp).format('DD/MM/YYYY HH:mm'),
                row.customer?.name || 'Unknown',
                row.customer?.department || 'Unknown',
                row.foodItem?.name || 'Unknown',
                row.operator?.username || 'N/A',
                row.price,
                row.subsidy
            ]);

            autoTable(doc, {
                head: [['Date', 'Customer', 'Department', 'Item', 'Operator', 'Price', 'Subsidy']],
                body: tableData,
                startY: 50,
                theme: 'grid',
                headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' }
            });

            // --- Summary ---
            const finalY = (doc as any).lastAutoTable?.finalY || 60;
            const summaryTotalMeals = exportData.length;
            const summaryTotalAmount = exportData.reduce((acc, curr) => acc + (curr.price || 0), 0);
            const summaryTotalSubsidy = exportData.reduce((acc, curr) => acc + (curr.subsidy || 0), 0);

            doc.text(`Total Meals: ${summaryTotalMeals}`, 14, finalY + 10);
            doc.text(`Total Amount: ${summaryTotalAmount.toLocaleString()} ETB`, 14, finalY + 16);
            doc.text(`Total Subsidy: ${summaryTotalSubsidy.toLocaleString()} ETB`, 14, finalY + 22);

            // --- Footer ---
            const pageHeight = doc.internal.pageSize.height;
            doc.setLineWidth(0.5);
            doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
            doc.setFontSize(8);
            doc.setFont("times", "bold");
            doc.text("PLEASE MAKE SURE THAT THIS IS THE CORRECT ISSUE BEFORE USE", pageWidth / 2, pageHeight - 10, { align: "center" });

            const pdfBlob = doc.output('blob');
            // Dynamic filename with date range
            let filename = `Orders_Analysis_${dayjs().format('YYYY-MM-DD')}`;
            if (from && to) {
                filename = `Orders_Analysis_${from.format('YYYY-MM-DD')}_to_${to.format('YYYY-MM-DD')}`;
            }
            console.log("Saving PDF file:", filename + '.pdf');
            saveAs(pdfBlob, filename + '.pdf');
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Failed to export PDF. See console.");
        }
    };

    // handleExportCSV removed as it was unused and causing lint warnings

    const handleExportExcel = (selectedData?: OrderRow[]) => {
        const exportData = selectedData || data;
        try {
            console.log("Starting Excel (.xlsx) Export...");

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws_data: any[][] = [];

            // Header Rows
            ws_data.push(['PhiBela Industrial PLC - Orders Analysis Report']);
            ws_data.push([]); // Blank row

            // Data Headers
            ws_data.push(['Date', 'Customer', 'Department', 'Item', 'Operator', 'Price', 'Subsidy']);

            // Data Rows
            exportData.forEach(row => {
                ws_data.push([
                    dayjs(row.timestamp).format('DD/MM/YYYY HH:mm'),
                    row.customer?.name || 'Unknown',
                    row.customer?.department || 'Unknown',
                    row.foodItem?.name || 'Unknown',
                    row.operator?.username || 'N/A',
                    row.price,
                    row.subsidy
                ]);
            });

            // Summary
            const totalMealsCalc = exportData.length;
            const totalAmountCalc = exportData.reduce((acc, curr) => acc + (curr.price || 0), 0);
            const totalSubsidyCalc = exportData.reduce((acc, curr) => acc + (curr.subsidy || 0), 0);

            ws_data.push([]);
            ws_data.push(['SUMMARY']);
            ws_data.push(['Total Meals', totalMealsCalc]);
            ws_data.push(['Total Amount', `${totalAmountCalc} ETB`]);
            ws_data.push(['Total Subsidy', `${totalSubsidyCalc} ETB`]);

            // Create worksheet from data
            const ws = XLSX.utils.aoa_to_sheet(ws_data);

            // Merge cells for header formatting
            if (!ws['!merges']) ws['!merges'] = [];
            ws['!merges'].push(
                { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title row
            );

            // Set column widths
            ws['!cols'] = [
                { wch: 18 }, // Date
                { wch: 20 }, // Customer
                { wch: 15 }, // Department
                { wch: 20 }, // Item
                { wch: 15 }, // Operator
                { wch: 12 }, // Price
                { wch: 12 }  // Subsidy
            ];

            // Append worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Orders Analysis');

            // Write to file - Dynamic filename with date range
            let filename = `Orders_Analysis_${dayjs().format('YYYY-MM-DD')}`;
            if (from && to) {
                filename = `Orders_Analysis_${from.format('YYYY-MM-DD')}_to_${to.format('YYYY-MM-DD')}`;
            }
            XLSX.writeFile(wb, filename + '.xlsx');
            console.log("Saved Excel file:", filename + '.xlsx');
        } catch (error) {
            console.error("Excel Export Error:", error);
            alert("Failed to export Excel. See console.");
        }
    };

    // Memoize columns for performance
    const analysisColumns: GridColDef<OrderRow>[] = useMemo(() => [
        {
            field: 'timestamp',
            headerName: 'Date',
            flex: 1.5,
            valueFormatter: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm'),
        },
        {
            field: 'customer.name',
            headerName: 'Customer',
            flex: 1.5,
            valueGetter: (_: any, row: OrderRow) => row.customer?.name || 'Unknown',
        },
        {
            field: 'customer.department',
            headerName: 'Department',
            flex: 1.5,
            valueGetter: (_: any, row: OrderRow) => row.customer?.department || 'Unknown',
        },
        {
            field: 'foodItem.name',
            headerName: 'Item',
            flex: 1.5,
            valueGetter: (_: any, row: OrderRow) => row.foodItem?.name || 'Unknown',
        },
        {
            field: 'operator.username',
            headerName: 'Operator',
            flex: 1.2,
            valueGetter: (_: any, row: OrderRow) => row.operator?.username || 'N/A',
        },
        {
            field: 'price',
            headerName: 'Price (ETB)',
            type: 'number',
            flex: 1,
            align: 'right',
            headerAlign: 'right',
        },
        {
            field: 'subsidy',
            headerName: 'Subsidy (ETB)',
            type: 'number',
            flex: 1,
            align: 'right',
            headerAlign: 'right',
        },
        {
            field: 'notes',
            headerName: 'Notes',
            flex: 0.8,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                if (!params.row.notes) return null;
                return (
                    <Tooltip title={params.row.notes} arrow placement="left">
                        <CommentIcon color="action" fontSize="small" />
                    </Tooltip>
                );
            },
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            renderCell: (params) => {
                const status = (params.row.status || 'approved').toLowerCase();
                let color: 'success' | 'warning' | 'error' = 'success';
                if (status === 'pending') color = 'warning';
                else if (status === 'rejected') color = 'error';
                return <Chip label={status.toUpperCase()} color={color} size="small" variant="outlined" />;
            },
        },
    ], []);

    return (
        <Box sx={{ p: 2 }}>
            <style>
                {`
                    @media print {
                        @page { margin: 20px; }
                        /* Hide Sidebar, Navbar, and non-print elements globally */
                        body { background: white; }
                        nav, aside, .MuiDrawer-root, .MuiAppBar-root, .no-print { display: none !important; }
                        
                        /* Ensure content takes full width */
                        #root, main, .MuiBox-root { width: 100% !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
                        
                        /* Show Print Content */
                        .print-content { display: block !important; }
                        
                        /* Layout Adjustments */
                        .MuiDataGrid-root { border: none !important; }
                        .MuiDataGrid-footerContainer, .MuiDataGrid-toolbarContainer { display: none !important; }
                        .MuiDataGrid-virtualScroller { overflow: visible !important; }
                    }
                `}
            </style>

            {/* Report Header (Print Only) */}
            <Box className="print-content" sx={{ display: 'none', flexDirection: 'column', mb: 4 }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', border: '2px solid black', fontFamily: 'serif' }}>
                    <tbody>
                        <tr>
                            {/* Logo Section */}
                            <td style={{ border: '1px solid black', width: '25%', padding: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                                <img src={logo} alt="Phibela Logo" style={{ maxWidth: '100%', height: '60px', objectFit: 'contain' }} />
                            </td>

                            {/* Center Section */}
                            <td style={{ border: '1px solid black', width: '50%', verticalAlign: 'middle' }}>
                                <div style={{ borderBottom: '1px solid black', padding: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                                    PhiBela Industrial PLC
                                </div>
                                <div style={{ padding: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                                    Report form
                                </div>
                            </td>

                            {/* Right Section */}
                            <td style={{ border: '1px solid black', width: '25%', padding: 0 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '2px 5px', width: '50%' }}>
                                                Doc. No.<br />PSD/OF/039
                                            </td>
                                            <td style={{ borderBottom: '1px solid black', padding: '2px 5px', width: '50%' }}>
                                                Issue Date<br />Oct. 2021
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ borderRight: '1px solid black', padding: '2px 5px' }}>
                                                Issue No. 1
                                            </td>
                                            <td style={{ padding: '2px 5px' }}>
                                                Page 1 of 1
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Dynamic Metadata */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', fontFamily: 'serif', fontSize: '14px' }}>
                    <Typography variant="body2">
                        <strong>Date:</strong> {dayjs().format('DD/MM/YYYY')}
                    </Typography>
                    {from && to && (
                        <Typography variant="body2">
                            <strong>Period:</strong> {from.format('DD/MM/YYYY')} - {to.format('DD/MM/YYYY')}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Print Footer (Fixed Bottom) */}
            <Box className="print-content" sx={{ display: 'none', position: 'fixed', bottom: 0, left: 0, width: '100%', textAlign: 'center' }}>
                <div style={{ borderTop: '2px solid black', margin: '0 20px 10px 20px', paddingTop: '5px', fontFamily: 'serif', fontWeight: 'bold', fontSize: '12px' }}>
                    PLEASE MAKE SURE THAT THIS IS THE CORRECT ISSUE BEFORE USE
                </div>
            </Box>

            <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Orders Analysis</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<PictureAsPdf />}
                        onClick={() => handleExportPDF()}
                        disabled={data.length === 0}
                    >
                        Export PDF
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<TableView />}
                        onClick={() => handleExportExcel()}
                        disabled={data.length === 0}
                    >
                        Export Excel
                    </Button>
                    {(selectedRows.ids?.size > 0 || selectedRows.type === 'exclude') && (
                        <Tooltip title="Export only selected rows">
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<TableView />}
                                onClick={() => {
                                    const selectedIds = selectedRows.ids || new Set();
                                    const isExclude = selectedRows.type === 'exclude';
                                    const selectedData = data.filter(row => {
                                        const hasId = selectedIds.has(row._id);
                                        return isExclude ? !hasId : hasId;
                                    });
                                    handleExportExcel(selectedData);
                                }}
                            >
                                Export Selected ({selectedRows.type === 'exclude' ? (data.length - (selectedRows.ids?.size || 0)) : (selectedRows.ids?.size || 0)})
                            </Button>
                        </Tooltip>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={() => window.print()}
                    >
                        Print Report
                    </Button>
                </Box>
            </Box>

            {isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load analysis data. Please adjust your filters.</Alert>}
            {!from || !to ? (
                <Alert severity="info" sx={{ mb: 2 }}>Please select a date range to view analysis data</Alert>
            ) : null}

            {/* Quick Date Range Buttons */}
            <Box className="no-print" sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>Quick Ranges:</Typography>
                <ButtonGroup variant="outlined" size="small">
                    <Button startIcon={<CalendarToday />} onClick={() => setQuickRange('today')}>Today</Button>
                    <Button onClick={() => setQuickRange('yesterday')}>Yesterday</Button>
                    <Button startIcon={<EventNote />} onClick={() => setQuickRange('last7days')}>Last 7 Days</Button>
                    <Button startIcon={<DateRange />} onClick={() => setQuickRange('thisMonth')}>This Month</Button>
                    <Button onClick={() => setQuickRange('lastMonth')}>Last Month</Button>
                </ButtonGroup>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }} className="no-print">
                <Grid size={{ xs: 12, sm: 3 }}>
                    <DatePicker
                        label="From"
                        value={from}
                        onChange={(newValue) => setFrom(newValue)}
                        maxDate={to || undefined}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <DatePicker
                        label="To"
                        value={to}
                        onChange={(newValue) => setTo(newValue)}
                        minDate={from || undefined}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <Autocomplete
                        options={customers}
                        getOptionLabel={(option) => option.name}
                        value={selectedCustomer}
                        onChange={(_, newValue) => setSelectedCustomer(newValue)}
                        renderInput={(params) => <TextField {...params} label="Customer" fullWidth size="small" />}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <Autocomplete
                        options={foodItems}
                        getOptionLabel={(option) => `${option.name} (${option.code})`}
                        value={selectedFoodItem}
                        onChange={(_, newValue) => setSelectedFoodItem(newValue)}
                        renderInput={(params) => <TextField {...params} label="Food Item" fullWidth size="small" />}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                        select
                        label="Status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        fullWidth
                        size="small"
                    >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                        select
                        label="Department"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        fullWidth
                        size="small"
                    >
                        <MenuItem value="All Departments">All Departments</MenuItem>
                        {departments.map(dep => (
                            <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                        ))}
                    </TextField>

                </Grid>
                <Button
                    variant="outlined"
                    onClick={() => {
                        setFrom(null);
                        setTo(null);
                        setSelectedCustomer(null);
                        setSelectedDepartment('');
                        setSelectedFoodItem(null);
                        setSelectedStatus('');
                        setSelectedRows({ type: 'include', ids: new Set() });
                    }}
                    size="small"
                    sx={{ ml: 2 }}
                >
                    Clear Filters
                </Button>

            </Grid>

            {isLoading ? (
                <TableSkeleton rows={10} />
            ) : (
                <Paper className="print-content" sx={{ height: 600, width: '100%', '@media print': { height: 'auto', boxShadow: 'none' } }}>
                    <DataGrid
                        rows={data}
                        density="compact"
                        autoHeight={false} // Default false, overridden by CSS if needed, but for print we usually want autoHeight. Let's rely on print media query to possibly force height auto if MUI supports it, or simple hack.
                        sx={{ '@media print': { height: 'auto', '& .MuiDataGrid-virtualScroller': { overflow: 'visible' } } }}
                        columns={analysisColumns}
                        getRowId={(row) => row._id}
                        onRowClick={(params) => {
                            setSelectedOrderDetails(params.row);
                            setDetailsOpen(true);
                        }}
                        checkboxSelection
                        onRowSelectionModelChange={(newSelection) => {
                            setSelectedRows(newSelection);
                        }}
                        rowSelectionModel={selectedRows}
                        disableRowSelectionOnClick
                        slots={{
                            toolbar: GridToolbar,
                            footer: CustomFooter
                        }}
                        slotProps={{
                            toolbar: {
                                showQuickFilter: true,
                            },
                            footer: {
                                totalMeals,
                                totalAmount,
                                totalSubsidy
                            } as any
                        }}
                    />
                </Paper>
            )}

            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, overflow: 'hidden' }
                }}
            >
                {selectedOrderDetails && (
                    <>
                        <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }}>
                            <Typography variant="h6" fontWeight="bold">Order Details</Typography>
                            <Button onClick={() => setDetailsOpen(false)} sx={{ minWidth: 'auto', p: 1 }}>
                                X
                            </Button>
                        </DialogTitle>

                        <DialogContent dividers sx={{ p: 4 }}>
                            <Box sx={{ mb: 4 }}>
                                <Alert
                                    severity={selectedOrderDetails.status === 'approved' ? 'success' : selectedOrderDetails.status === 'pending' ? 'warning' : 'error'}
                                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                                >
                                    Current Status: {(selectedOrderDetails.status || 'APPROVED').toUpperCase()}
                                </Alert>
                            </Box>

                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>Customer Details</Typography>
                                    <Typography variant="h6" sx={{ mt: 0.5 }}>{selectedOrderDetails.customer.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{selectedOrderDetails.customer.department}</Typography>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>Meal Information</Typography>
                                    <Typography variant="h6" sx={{ mt: 0.5 }}>{selectedOrderDetails.foodItem?.name || 'N/A'}</Typography>
                                    {/* <Typography variant="body2" color="text.secondary">Code: {selectedOrderDetails.workCode}</Typography> */}
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>Cost Breakdown</Typography>
                                    <Box sx={{ mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Meal Price:</Typography>
                                            <Typography variant="body2">ETB {selectedOrderDetails.price?.toFixed(2)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Applied Subsidy:</Typography>
                                            <Typography variant="body2" color="success.main">- ETB {selectedOrderDetails.subsidy?.toFixed(2)}</Typography>
                                        </Box>
                                        <Divider sx={{ my: 1.5 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="subtitle1" fontWeight="bold">Balance to Pay:</Typography>
                                            <Typography variant="subtitle1" fontWeight="900" color="primary.main">
                                                ETB {((selectedOrderDetails.price || 0) - (selectedOrderDetails.subsidy || 0)).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {selectedOrderDetails.notes && (
                                    <Grid size={{ xs: 12 }}>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>Notes</Typography>
                                        <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                "{selectedOrderDetails.notes}"
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}

                                <Grid size={{ xs: 12 }}>
                                    {/* <Typography variant="caption" color="text.secondary" display="block">
                                        Order ID: {selectedOrderDetails._id}
                                    </Typography> */}
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Timestamp: {dayjs(selectedOrderDetails.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </DialogContent>

                        <DialogActions sx={{ p: 3, bgcolor: 'background.default', gap: 1 }}>
                            <Button variant="text" color="inherit" onClick={() => setDetailsOpen(false)} sx={{ borderRadius: 2 }}>
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box >
    );
};

export default Analysis;
