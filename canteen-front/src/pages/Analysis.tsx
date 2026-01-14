// src/pages/Analysis.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, TextField, Button, Grid, CircularProgress, MenuItem, Paper, Autocomplete } from '@mui/material';
import { DataGrid, GridToolbar, GridFooter, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Print as PrintIcon, PictureAsPdf, TableView } from '@mui/icons-material';
import logo from '../assets/phibelalogo.png';
import dayjs, { Dayjs } from 'dayjs';
import api from '../api/api';
import { customersApi, Customer } from '../api/customers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface OrderRow {
    _id: string;
    timestamp: string;
    customer: {
        name: string;
        department: string;
    };
    foodItem: {
        name: string;
    };
    operator?: {
        username: string;
    };
    price: number;
    subsidy: number;
}


function CustomFooter(props: any) {
    const { totalMeals, totalAmount, totalSubsidy } = props;
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
            <GridFooter {...props} />
        </Box>
    );
}

const Analysis: React.FC = () => {
    const [from, setFrom] = useState<Dayjs | null>(null);
    const [to, setTo] = useState<Dayjs | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [data, setData] = useState<OrderRow[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const totalMeals = data.length;
    const totalAmount = data.reduce((acc, curr) => acc + (curr.price || 0), 0);
    const totalSubsidy = data.reduce((acc, curr) => acc + (curr.subsidy || 0), 0);


    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const custs = await customersApi.getAll();
                setCustomers(custs);
                const uniqueDeps = Array.from(new Set(custs.map(c => c.department))).sort();
                setDepartments(uniqueDeps);
            } catch (error) {
                console.error('Failed to load filter data', error);
            }
        };
        loadInitialData();
    }, []);

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ type: 'orders' });
            if (from) params.append('from', from.format('YYYY-MM-DD'));
            if (to) params.append('to', to.format('YYYY-MM-DD'));
            if (selectedCustomer) params.append('customerId', selectedCustomer._id);
            if (selectedDepartment) params.append('department', selectedDepartment);
            const { data } = await api.get(`/analysis?${params.toString()}`);
            setData(data);
        } catch (err) {
            console.error('Failed to fetch analysis');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalysis();
    }, []);


    const handleExportPDF = () => {
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
            const tableData = data.map((row) => [
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
            const summaryTotalMeals = data.length;
            const summaryTotalAmount = data.reduce((acc, curr) => acc + (curr.price || 0), 0);
            const summaryTotalSubsidy = data.reduce((acc, curr) => acc + (curr.subsidy || 0), 0);

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
            const filename = `Orders_Analysis_${dayjs().format('YYYY-MM-DD')}.pdf`;
            console.log("Saving PDF file:", filename);
            saveAs(pdfBlob, filename);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Failed to export PDF. See console.");
        }
    };

    // handleExportCSV removed as it was unused and causing lint warnings

    const handleExportExcel = () => {
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
            data.forEach(row => {
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
            const totalMealsCalc = data.length;
            const totalAmountCalc = data.reduce((acc, curr) => acc + (curr.price || 0), 0);
            const totalSubsidyCalc = data.reduce((acc, curr) => acc + (curr.subsidy || 0), 0);

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

            // Write to file
            const filename = `Orders_Analysis_${dayjs().format('YYYY-MM-DD')}.xlsx`;
            XLSX.writeFile(wb, filename);
            console.log("Saved Excel file:", filename);
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
    ], []);

    return (
        <Box sx={{ p: 3 }}>
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
                        onClick={handleExportPDF}
                        disabled={data.length === 0}
                    >
                        Export PDF
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<TableView />}
                        onClick={handleExportExcel}
                        disabled={data.length === 0}
                    >
                        Export Excel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={() => window.print()}
                    >
                        Print Report
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }} className="no-print">
                <Grid size={{ xs: 12, sm: 3 }}>
                    <DatePicker
                        label="From"
                        value={from}
                        onChange={(newValue) => setFrom(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <DatePicker
                        label="To"
                        value={to}
                        onChange={(newValue) => setTo(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <Autocomplete
                        options={customers}
                        getOptionLabel={(option) => option.name}
                        value={selectedCustomer}
                        onChange={(_, newValue) => setSelectedCustomer(newValue)}
                        renderInput={(params) => <TextField {...params} label="Customer" fullWidth />}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                        select
                        label="Department"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        fullWidth
                    >
                        <MenuItem value="">All Departments</MenuItem>
                        {departments.map(dep => (
                            <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setFrom(null);
                            setTo(null);
                            setSelectedCustomer(null);
                            setSelectedDepartment('');
                        }}
                    >
                        Clear Filters
                    </Button>
                    <Button variant="contained" onClick={fetchAnalysis} disabled={loading} sx={{ px: 4 }}>
                        Apply Filters
                    </Button>
                </Grid>
            </Grid>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper className="print-content" sx={{ height: 600, width: '100%', '@media print': { height: 'auto', boxShadow: 'none' } }}>
                    <DataGrid
                        rows={data}
                        density="compact"
                        autoHeight={false} // Default false, overridden by CSS if needed, but for print we usually want autoHeight. Let's rely on print media query to possibly force height auto if MUI supports it, or simple hack.
                        sx={{ '@media print': { height: 'auto', '& .MuiDataGrid-virtualScroller': { overflow: 'visible' } } }}
                        columns={analysisColumns}
                        getRowId={(row) => row._id}
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
        </Box >
    );
};

export default Analysis;
