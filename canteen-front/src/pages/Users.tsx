// src/pages/Users.tsx
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
    Switch,
    Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { usersApi, User, UserFilters } from '../api/users';
import TableSkeleton from '../components/TableSkeleton';
import { PersonAdd as PersonAddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ username: '', fullName: '', password: '', role: 'operator' as 'admin' | 'operator' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'delete' | 'toggle' | null; user: User | null }>({
        open: false,
        action: null,
        user: null,
    });
    const [formErrors, setFormErrors] = useState({ username: '', fullName: '', password: '' });

    // Pagination and filtering
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    // Statistics
    const [stats, setStats] = useState({ total: 0, operators: 0, admins: 0, active: 0, inactive: 0 });

    useEffect(() => {
        fetchUsers();
    }, [page, rowsPerPage, searchQuery, roleFilter, activeFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const filters: UserFilters = {
                page: page + 1,
                limit: rowsPerPage,
            };

            if (searchQuery) filters.search = searchQuery;
            if (roleFilter !== 'all') filters.role = roleFilter as 'admin' | 'operator';
            if (activeFilter !== 'all') filters.isActive = activeFilter === 'active';

            const response = await usersApi.getAll(filters);
            setUsers(response.users);
            setTotalUsers(response.pagination.total);

            // Calculate statistics
            const allUsers = await usersApi.getAll({});
            const operators = allUsers.users.filter(u => u.role === 'operator').length;
            const admins = allUsers.users.filter(u => u.role === 'admin').length;
            const active = allUsers.users.filter(u => u.isActive).length;
            setStats({
                total: allUsers.pagination.total,
                operators,
                admins,
                active,
                inactive: allUsers.pagination.total - active,
            });
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to fetch users');
            showSnackbar('Failed to fetch users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = { username: '', fullName: '', password: '' };
        let isValid = true;

        if (!formData.username.trim()) {
            errors.username = 'Username is required';
            isValid = false;
        }

        if (!formData.fullName.trim()) {
            errors.fullName = 'Full name is required';
            isValid = false;
        }

        if (!selectedUser && !formData.password.trim()) {
            errors.password = 'Password is required for new users';
            isValid = false;
        }

        if (formData.password && formData.password.length < 4) {
            errors.password = 'Password must be at least 4 characters';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleOpen = (user?: User) => {
        setSelectedUser(user || null);
        setFormData(user
            ? { username: user.username, fullName: user.fullName || '', password: '', role: user.role }
            : { username: '', fullName: '', password: '', role: 'operator' }
        );
        setFormErrors({ username: '', fullName: '', password: '' });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setFormErrors({ username: '', fullName: '', password: '' });
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            if (selectedUser) {
                const updateData: any = { username: formData.username, fullName: formData.fullName, role: formData.role };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await usersApi.update(selectedUser._id, updateData);
                showSnackbar('User updated successfully', 'success');
            } else {
                await usersApi.create(formData);
                showSnackbar('User created successfully', 'success');
            }
            fetchUsers();
            handleClose();
        } catch (err: any) {
            showSnackbar(err?.response?.data?.error || 'Failed to save user', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = (user: User) => {
        setConfirmDialog({ open: true, action: 'toggle', user });
    };

    const handleDelete = (user: User) => {
        setConfirmDialog({ open: true, action: 'delete', user });
    };

    const handleConfirmAction = async () => {
        if (!confirmDialog.user) return;

        setLoading(true);
        try {
            if (confirmDialog.action === 'toggle') {
                await usersApi.toggleActive(confirmDialog.user._id, !confirmDialog.user.isActive);
                showSnackbar(`User ${confirmDialog.user.isActive ? 'deactivated' : 'activated'} successfully`, 'success');
            } else if (confirmDialog.action === 'delete') {
                await usersApi.delete(confirmDialog.user._id);
                showSnackbar('User deleted successfully', 'success');
            }
            fetchUsers();
            setConfirmDialog({ open: false, action: null, user: null });
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
        { field: 'username', headerName: 'Username', width: 150, sortable: true },
        { field: 'fullName', headerName: 'Full Name', width: 200, sortable: true },
        {
            field: 'role',
            headerName: 'Role',
            width: 120,
            sortable: true,
            renderCell: (params) => (
                <Chip
                    label={params.value.toUpperCase()}
                    color={params.value === 'admin' ? 'primary' : 'success'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                />
            )
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 150,
            valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
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
                    <Button
                        onClick={() => handleDelete(params.row)}
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                    >
                        Delete
                    </Button>
                </Box>
            ),
        },
    ];

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Manage Operators
                </Typography>
                <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => handleOpen()}>
                    Add Operator
                </Button>
            </Box>

            {/* Statistics Cards
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total Users
                            </Typography>
                            <Typography variant="h4">{stats.total}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Operators
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                {stats.operators}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Admins
                            </Typography>
                            <Typography variant="h4" color="primary.main">
                                {stats.admins}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
            </Grid> */}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            label="Search by username or name"
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
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={roleFilter}
                                label="Role"
                                onChange={(e: SelectChangeEvent) => {
                                    setRoleFilter(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <MenuItem value="all">All Roles</MenuItem>
                                <MenuItem value="operator">Operators Only</MenuItem>
                                <MenuItem value="admin">Admins Only</MenuItem>
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
                {loading ? (
                    <TableSkeleton rows={10} />
                ) : (
                    <DataGrid
                        density="compact"
                        rows={users}
                        getRowId={(row) => row._id}
                        columns={columns}
                        loading={loading}
                        pagination
                        paginationMode="server"
                        rowCount={totalUsers}
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
                )}
            </Box>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedUser ? 'Edit User' : 'Add User'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        fullWidth
                        margin="normal"
                        required
                        error={!!formErrors.username}
                        helperText={formErrors.username}
                        disabled={!!selectedUser}
                    />
                    <TextField
                        label="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        fullWidth
                        margin="normal"
                        required
                        error={!!formErrors.fullName}
                        helperText={formErrors.fullName}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={formData.role}
                            label="Role"
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'operator' })}
                        >
                            <MenuItem value="operator">Operator</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        fullWidth
                        margin="normal"
                        required={!selectedUser}
                        error={!!formErrors.password}
                        helperText={formErrors.password || (selectedUser ? 'Leave blank to keep current password' : '')}
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
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: null, user: null })}>
                <DialogTitle>
                    {confirmDialog.action === 'delete' ? 'Delete User?' : 'Toggle User Status?'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {confirmDialog.action === 'delete'
                            ? `Are you sure you want to permanently delete ${confirmDialog.user?.username}? This action cannot be undone.`
                            : `Are you sure you want to ${confirmDialog.user?.isActive ? 'deactivate' : 'activate'} ${confirmDialog.user?.username}?`}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, action: null, user: null })} disabled={loading}>
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

export default Users;