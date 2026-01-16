// src/pages/Customers.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Switch,
    Snackbar,
    Alert,
    CircularProgress,
    Paper,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { customersApi, Customer, CustomerFilters } from '../api/customers';
import { useAuth } from '../contexts/AuthContext';
import { Delete as DeleteIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';

const Customers: React.FC = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({ deviceId: '', name: '', department: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'delete' | 'toggle' | null; customer: Customer | null }>({
        open: false,
        action: null,
        customer: null,
    });
    const [formErrors, setFormErrors] = useState({ deviceId: '', name: '', department: '' });

    // Pagination and filtering
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    // Statistics
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, departments: 0 });
    const [allDepartments, setAllDepartments] = useState<string[]>([]);

    useEffect(() => {
        fetchCustomers();
    }, [page, rowsPerPage, searchQuery, departmentFilter, activeFilter]);

    const fetchCustomers = async () => {
        setLoading(true);
        setError('');
        try {
            const filters: CustomerFilters = {
                page: page + 1,
                limit: rowsPerPage,
            };

            if (searchQuery) filters.search = searchQuery;
            if (departmentFilter) filters.department = departmentFilter;
            if (activeFilter !== 'all') filters.isActive = activeFilter === 'active';

            const response = await customersApi.getAll(filters);
            setCustomers(response.customers);
            setTotalCustomers(response.pagination.total);

            // Calculate statistics
            const allCustomers = await customersApi.getAll({});
            const active = allCustomers.customers.filter(c => c.isActive).length;
            const uniqueDepts = Array.from(new Set(allCustomers.customers.map(c => c.department).filter(Boolean))) as string[];
            setAllDepartments(uniqueDepts.sort());
            setStats({
                total: allCustomers.pagination.total,
                active,
                inactive: allCustomers.pagination.total - active,
                departments: uniqueDepts.length,
            });
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to fetch customers');
            showSnackbar('Failed to fetch customers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = { deviceId: '', name: '', department: '' };
        let isValid = true;

        if (!formData.deviceId.trim()) {
            errors.deviceId = 'Device ID is required';
            isValid = false;
        }

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
            isValid = false;
        }

        if (!formData.department.trim()) {
            errors.department = 'Department is required';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleOpen = (customer?: Customer) => {
        setSelectedCustomer(customer || null);
        setFormData(customer ? { deviceId: customer.deviceId, name: customer.name, department: customer.department } : { deviceId: '', name: '', department: '' });
        setFormErrors({ deviceId: '', name: '', department: '' });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setFormErrors({ deviceId: '', name: '', department: '' });
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            if (selectedCustomer) {
                await customersApi.update(selectedCustomer._id, formData);
                showSnackbar('Customer updated successfully', 'success');
            } else {
                await customersApi.create(formData);
                showSnackbar('Customer created successfully', 'success');
            }
            fetchCustomers();
            handleClose();
        } catch (err: any) {
            showSnackbar(err?.response?.data?.error || 'Failed to save customer', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = (customer: Customer) => {
        setConfirmDialog({ open: true, action: 'toggle', customer });
    };

    const handleDelete = (customer: Customer) => {
        setConfirmDialog({ open: true, action: 'delete', customer });
    };

    const handleConfirmAction = async () => {
        if (!confirmDialog.customer) return;

        setLoading(true);
        try {
            if (confirmDialog.action === 'toggle') {
                await customersApi.toggleActive(confirmDialog.customer._id, !confirmDialog.customer.isActive);
                showSnackbar(`Customer ${confirmDialog.customer.isActive ? 'deactivated' : 'activated'} successfully`, 'success');
            } else if (confirmDialog.action === 'delete') {
                await customersApi.delete(confirmDialog.customer._id);
                showSnackbar('Customer deleted successfully', 'success');
            }
            fetchCustomers();
            setConfirmDialog({ open: false, action: null, customer: null });
        } catch (err: any) {
            showSnackbar(err?.response?.data?.error || 'Operation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const columns: GridColDef[] = [
        { field: 'deviceId', headerName: 'Device ID', width: 150, sortable: true },
        { field: 'name', headerName: 'Name', width: 200, sortable: true },
        { field: 'department', headerName: 'Department', width: 150, sortable: true },
        {
            field: 'enrolledAt',
            headerName: 'Enrolled',
            width: 150,
            valueFormatter: (value: string | null) => value ? new Date(value).toLocaleDateString() : '',
        },
        {
            field: 'isActive',
            headerName: 'Active',
            width: 100,
            renderCell: (params) => (
                <Switch
                    checked={params.row.isActive}
                    onChange={() => handleToggleActive(params.row)}
                    color="primary"
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 180,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={() => handleOpen(params.row)} size="small" variant="outlined">
                        Edit
                    </Button>
                    {user?.role === 'admin' && (
                        <Button
                            onClick={() => handleDelete(params.row)}
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                        >
                            Delete
                        </Button>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Customers
                </Typography>
                <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => handleOpen()}>
                    Add Customer
                </Button>
            </Box>

            {/* Statistics Cards
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total Customers
                            </Typography>
                            <Typography variant="h4">{stats.total}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Active
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                {stats.active}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Inactive
                            </Typography>
                            <Typography variant="h4" color="error.main">
                                {stats.inactive}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Departments
                            </Typography>
                            <Typography variant="h4">{stats.departments}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid> */}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            label="Search by name"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(0);
                            }}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filter by department</InputLabel>
                            <Select
                                value={departmentFilter || 'all'}
                                label="Filter by department"
                                onChange={(e: SelectChangeEvent) => {
                                    const value = e.target.value;
                                    setDepartmentFilter(value === 'all' ? '' : value);
                                    setPage(0);
                                }}
                            >
                                <MenuItem value="all">All Departments</MenuItem>
                                {allDepartments.map((dept) => (
                                    <MenuItem key={dept} value={dept}>
                                        {dept}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={activeFilter}
                                label="Status"
                                onChange={(e: SelectChangeEvent) => {
                                    setActiveFilter(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="active">Active Only</MenuItem>
                                <MenuItem value="inactive">Inactive Only</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Error Display */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Data Grid */}
            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    density="compact"
                    rows={customers}
                    getRowId={(row) => row._id}
                    columns={columns}
                    loading={loading}
                    pagination
                    paginationMode="server"
                    rowCount={totalCustomers}
                    paginationModel={{ page, pageSize: rowsPerPage }}
                    onPaginationModelChange={(model) => {
                        setPage(model.page);
                        setRowsPerPage(model.pageSize);
                    }}
                    pageSizeOptions={[5, 10, 25, 50]}
                    disableRowSelectionOnClick
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: false,
                        },
                    }}
                />
            </Box>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Device ID"
                        value={formData.deviceId}
                        onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                        fullWidth
                        margin="normal"
                        required
                        error={!!formErrors.deviceId}
                        helperText={formErrors.deviceId || 'Must match the User ID/PIN enrolled on ZKTeco device'}
                        disabled={!!selectedCustomer}
                    />
                    <TextField
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        margin="normal"
                        required
                        error={!!formErrors.name}
                        helperText={formErrors.name}
                    />
                    <TextField
                        label="Department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        fullWidth
                        margin="normal"
                        required
                        error={!!formErrors.department}
                        helperText={formErrors.department}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: null, customer: null })}>
                <DialogTitle>
                    {confirmDialog.action === 'delete' ? 'Delete Customer?' : 'Toggle Customer Status?'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {confirmDialog.action === 'delete'
                            ? `Are you sure you want to permanently delete ${confirmDialog.customer?.name}? This action cannot be undone.`
                            : `Are you sure you want to ${confirmDialog.customer?.isActive ? 'deactivate' : 'activate'} ${confirmDialog.customer?.name}?`}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, action: null, customer: null })} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmAction}
                        variant="contained"
                        color={confirmDialog.action === 'delete' ? 'error' : 'primary'}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Customers;
