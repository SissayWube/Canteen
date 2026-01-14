// src/pages/Customers.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Switch } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { customersApi, Customer } from '../api/customers';

const Customers: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({ deviceId: '', name: '', department: '' });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const data = await customersApi.getAll();
            setCustomers(data);
        } catch (err) {
            console.error('Failed to fetch customers');
        }
    };

    const handleOpen = (customer?: Customer) => {
        setSelectedCustomer(customer || null);
        setFormData(customer ? { deviceId: customer.deviceId, name: customer.name, department: customer.department } : { deviceId: '', name: '', department: '' });
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSubmit = async () => {
        try {
            if (selectedCustomer) {
                await customersApi.update(selectedCustomer._id, formData);
            } else {
                await customersApi.create(formData);
            }
            fetchCustomers();
            handleClose();
        } catch (err) {
            console.error('Failed to save customer');
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await customersApi.toggleActive(id, !isActive);
            fetchCustomers();
        } catch (err) {
            console.error('Failed to toggle active');
        }
    };

    const columns: GridColDef[] = [
        { field: 'deviceId', headerName: 'Device ID', width: 150 },
        { field: 'name', headerName: 'Name', width: 200 },
        { field: 'department', headerName: 'Department', width: 150 },
        {
            field: 'enrolledAt',
            headerName: 'Enrolled',
            width: 200,
            valueFormatter: (value: string | null) => value ? new Date(value).toLocaleDateString() : '',
        },
        {
            field: 'isActive',
            headerName: 'Active',
            width: 100,
            renderCell: (params) => (
                <Switch checked={params.row.isActive} onChange={() => handleToggleActive(params.row._id, params.row.isActive)} />
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            renderCell: (params) => (
                <Button onClick={() => handleOpen(params.row)}>Edit</Button>
            ),
        },
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Customers</Typography>
            <Button variant="contained" onClick={() => handleOpen()} sx={{ mb: 2 }}>Add Customer</Button>
            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    density="compact"
                    rows={customers}
                    getRowId={(row) => row._id}
                    columns={columns}
                    loading={false}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{ toolbar: { showQuickFilter: true } }}
                />
            </Box>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{selectedCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Device ID"
                        value={formData.deviceId}
                        onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Customers;
