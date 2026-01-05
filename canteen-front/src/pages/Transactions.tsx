// src/pages/Transactions.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Grid } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import api from '../api/api';

interface Transaction {
    _id: string;
    employee: { name: string; department: string };
    foodItem: { name: string };
    timestamp: string;
    ticketPrinted: boolean;
}

const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const fetchTransactions = async () => {
        try {
            const params = new URLSearchParams();
            if (from) params.append('from', from);
            if (to) params.append('to', to);

            const { data } = await api.get(`/transactions?${params.toString()}`);
            setTransactions(data.transactions);
        } catch (err) {
            console.error('Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
        const interval = setInterval(fetchTransactions, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, [from, to]);

    const columns: GridColDef[] = [
        { field: 'employee.name', headerName: 'Employee', width: 180 },
        { field: 'employee.department', headerName: 'Department', width: 140 },
        { field: 'foodItem.name', headerName: 'Meal', width: 160 },
        {
            field: 'timestamp', headerName: 'Time', width: 200,
            valueFormatter: (value: string | null) => value ? new Date(value).toLocaleString() : '',
        },
        {
            field: 'ticketPrinted',
            headerName: 'Printed',
            width: 100,
            type: 'boolean',
            valueFormatter: (value: string | null) => value ? new Date(value).toLocaleString() : '',
        },
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Transactions</Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                        label="From Date"
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                        label="To Date"
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Button
                        variant="contained"
                        onClick={fetchTransactions}
                        fullWidth
                        sx={{ height: '100%' }}
                    >
                        Search
                    </Button>
                </Grid>
            </Grid>

            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={transactions.map(t => ({ ...t, id: t._id }))}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                />
            </Box>
        </Box>
    );
};

export default Transactions;