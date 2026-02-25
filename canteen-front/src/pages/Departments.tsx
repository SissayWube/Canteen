// src/pages/Departments.tsx
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
    Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { departmentsApi, Department } from '../api/departments';
import TableSkeleton from '../components/TableSkeleton';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const Departments: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; item: Department | null }>({
        open: false,
        item: null,
    });
    const [formErrors, setFormErrors] = useState({ name: '' });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await departmentsApi.getAll();
            setDepartments(data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to fetch departments');
            showSnackbar('Failed to fetch departments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = { name: '' };
        let isValid = true;

        if (!formData.name.trim()) {
            errors.name = 'Department name is required';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleOpen = (item?: Department) => {
        setSelectedItem(item || null);
        setFormData(item ? { name: item.name, description: item.description || '' } : { name: '', description: '' });
        setFormErrors({ name: '' });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setFormErrors({ name: '' });
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            if (selectedItem) {
                await departmentsApi.update(selectedItem._id, formData);
                showSnackbar('Department updated successfully', 'success');
            } else {
                await departmentsApi.create(formData);
                showSnackbar('Department created successfully', 'success');
            }
            fetchDepartments();
            handleClose();
        } catch (err: any) {
            showSnackbar(err?.response?.data?.error || 'Failed to save department', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (item: Department) => {
        setConfirmDialog({ open: true, item });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDialog.item) return;

        setLoading(true);
        try {
            await departmentsApi.delete(confirmDialog.item._id);
            showSnackbar('Department deleted successfully', 'success');
            fetchDepartments();
            setConfirmDialog({ open: false, item: null });
        } catch (err: any) {
            showSnackbar(err?.response?.data?.error || 'Failed to delete department', 'error');
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
        { field: 'name', headerName: 'Department Name', flex: 1, minWidth: 200, sortable: true },
        { field: 'description', headerName: 'Description', flex: 2, minWidth: 300 },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 160,
            sortable: true,
            valueGetter: (_, row) => new Date(row.createdAt).toLocaleDateString(),
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Departments
                    </Typography>
                    <Chip label={`${departments.length} total`} color="primary" variant="outlined" />
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Add Department
                </Button>
            </Box>

            {/* Error Display */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Data Grid */}
            <Paper sx={{ height: 600, width: '100%' }}>
                {loading && departments.length === 0 ? (
                    <TableSkeleton rows={8} />
                ) : (
                    <DataGrid
                        density="compact"
                        rows={departments}
                        getRowId={(row) => row._id}
                        columns={columns}
                        loading={loading}
                        pageSizeOptions={[10, 25, 50]}
                        disableRowSelectionOnClick
                        initialState={{
                            pagination: { paginationModel: { pageSize: 25 } },
                        }}
                    />
                )}
            </Paper>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedItem ? 'Edit Department' : 'Add Department'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Department Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        margin="normal"
                        required
                        autoFocus
                        error={!!formErrors.name}
                        helperText={formErrors.name}
                    />
                    <TextField
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        fullWidth
                        margin="normal"
                        multiline
                        rows={3}
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
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, item: null })}>
                <DialogTitle>Delete Department?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{confirmDialog.item?.name}</strong>?
                        This action cannot be undone.
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Departments with assigned customers cannot be deleted.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, item: null })} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Delete'}
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

export default Departments;
