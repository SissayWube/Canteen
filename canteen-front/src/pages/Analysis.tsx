// src/pages/Analysis.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import { Print as PrintIcon, PictureAsPdf, TableView } from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';
import dayjs, { Dayjs } from 'dayjs';
import { customersApi, Customer } from '../api/customers';
import { foodItemsApi, FoodItem } from '../api/foodItems';
import { analysisApi, AnalysisFilters as ApiAnalysisFilters, AnalysisOrderRow } from '../api/analysis';
import { ordersApi } from '../api/orders';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import AnalysisFilters from './analysis/AnalysisFilters';
import AnalysisTable from './analysis/AnalysisTable';
import AnalysisPrintView from './analysis/AnalysisPrintView';
import { handleExportPDF, handleExportExcel } from './analysis/exportUtils';

const Analysis: React.FC = () => {
    const [from, setFrom] = useState<Dayjs | null>(dayjs());
    const [to, setTo] = useState<Dayjs | null>(dayjs());
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('approved');

    // State for row selection
    const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
    const [selectedOrder, setSelectedOrder] = useState<AnalysisOrderRow | null>(null);
    const [reprintLoading, setReprintLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });
    const queryClient = useQueryClient();

    // Build filters for React Query
    const filters: ApiAnalysisFilters = useMemo(() => {
        const f: ApiAnalysisFilters = {};
        if (from) f.from = from.format('YYYY-MM-DD');
        if (to) f.to = to.format('YYYY-MM-DD');
        if (selectedCustomer?._id) f.customerId = selectedCustomer._id;
        if (selectedDepartment) f.department = selectedDepartment;
        if (selectedFoodItem?._id) f.itemCode = selectedFoodItem.code;
        if (selectedStatus) f.status = selectedStatus;
        return f;
    }, [from, to, selectedCustomer?._id, selectedDepartment, selectedFoodItem?.code, selectedStatus]);

    // Fetch analysis data with React Query
    const { data = [], isLoading, isError, error } = useQuery({
        queryKey: ['analysis', filters],
        queryFn: () => analysisApi.getOrders(filters),
        enabled: !!(from && to), // Only fetch when date range is set
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    // Summary Calculations
    const totalMeals = data.length;
    const totalAmount = data.reduce((acc, curr) => acc + (curr.price || 0), 0);
    const totalSubsidy = data.reduce((acc, curr) => acc + (curr.subsidy || 0), 0);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [custResponse, itemsResponse] = await Promise.all([
                    customersApi.getAll({ limit: 1000 }), // Get all for filters (Recommendation: optimize this later)
                    foodItemsApi.getAll({ limit: 1000 })
                ]);
                const custs = custResponse.customers;
                const items = itemsResponse.foodItems;
                setCustomers(custs);
                setFoodItems(items.filter(i => i.isActive));
                const uniqueDeps = Array.from(new Set(custs.map(c => c.department))).sort();
                setDepartments(uniqueDeps);
            } catch (error) {
                console.error('Failed to load initial data', error);
            }
        };
        loadInitialData();
    }, []);

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
                        if (data.length > 0) handleExportExcel(data, undefined, from, to, selectedStatus);
                        break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [data, from, to, selectedStatus]);

    const handleReprint = async () => {
        if (!selectedOrder) return;
        setReprintLoading(true);
        try {
            const result = await ordersApi.reprint(selectedOrder._id);
            queryClient.invalidateQueries({ queryKey: ['analysis'] });
            setSnackbar({
                open: true,
                message: result.message || 'Ticket reprinted successfully!',
                severity: result.printed ? 'success' : 'warning'
            });
        } catch (error: any) {
            console.error('Failed to reprint ticket:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.error || 'Failed to reprint ticket.',
                severity: 'error'
            });
        } finally {
            setReprintLoading(false);
        }
    };

    const handleClearFilters = () => {
        setFrom(dayjs());
        setTo(dayjs());
        setSelectedCustomer(null);
        setSelectedDepartment('');
        setSelectedFoodItem(null);
        setSelectedStatus('approved');
        setSelectedRows({ type: 'include', ids: new Set() });
    };

    return (
        <Box sx={{ p: 2 }}>
            <AnalysisPrintView
                from={from}
                to={to}
                selectedData={data} // Print view shows currently filtered data
            />

            <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Orders Analysis</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<PictureAsPdf />}
                        onClick={() => handleExportPDF(data, undefined, from, to, selectedStatus)}
                        disabled={data.length === 0}
                    >
                        Export PDF
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<TableView />}
                        onClick={() => handleExportExcel(data, undefined, from, to, selectedStatus)}
                        disabled={data.length === 0}
                    >
                        Export Excel
                    </Button>
                    {(selectedRows.ids.size > 0 || selectedRows.type === 'exclude') && (
                        <Tooltip title="Export only selected rows">
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<TableView />}
                                onClick={() => {
                                    const isExclude = selectedRows.type === 'exclude';
                                    const selectedData = data.filter(row => {
                                        const hasId = selectedRows.ids.has(row._id);
                                        return isExclude ? !hasId : hasId;
                                    });
                                    handleExportExcel(data, selectedData, from, to, selectedStatus);
                                }}
                            >
                                Export Selected ({selectedRows.type === 'exclude' ? (data.length - selectedRows.ids.size) : selectedRows.ids.size})
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

            {isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load analysis data: {(error as any)?.message || 'Unknown error'}.
                    Please check your filters and try again.
                </Alert>
            )}
            {!from || !to ? (
                <Alert severity="info" sx={{ mb: 2 }}>Please select a date range to view analysis data</Alert>
            ) : null}

            <AnalysisFilters
                from={from} setFrom={setFrom}
                to={to} setTo={setTo}
                customers={customers} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer}
                departments={departments} selectedDepartment={selectedDepartment} setSelectedDepartment={setSelectedDepartment}
                foodItems={foodItems} selectedFoodItem={selectedFoodItem} setSelectedFoodItem={setSelectedFoodItem}
                selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
                onClearFilters={handleClearFilters}
            />

            <AnalysisTable
                data={data}
                isLoading={isLoading}
                totalMeals={totalMeals}
                totalAmount={totalAmount}
                totalSubsidy={totalSubsidy}
                onRowClick={(row) => setSelectedOrder(row)}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
            />

            <OrderDetailsModal
                open={!!selectedOrder}
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                readOnly={true}
                onReprint={handleReprint}
                reprintLoading={reprintLoading}
            />

            {/* Snackbar for reprint notifications */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    zIndex: 9999
                }}
            >
                {snackbar.open && (
                    <Alert
                        severity={snackbar.severity}
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        sx={{ minWidth: 300 }}
                    >
                        {snackbar.message}
                    </Alert>
                )}
            </Box>
        </Box>
    );
};

export default Analysis;
