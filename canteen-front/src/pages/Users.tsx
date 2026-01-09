// src/pages/Users.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import api from '../api/api';

interface Operator {
    _id: string;
    username: string;
    fullName: string;
    role: 'operator';
}

const Users: React.FC = () => {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Operator | null>(null);
    const [formData, setFormData] = useState({ username: '', fullName: '', password: '' });

    useEffect(() => {
        fetchOperators();
    }, []);

    const fetchOperators = async () => {
        const { data } = await api.get('/users');
        // Filter out admin users, only show operators
        setOperators(data.filter((user: any) => user.role === 'operator'));
    };

    const handleOpen = (op?: Operator) => {
        setSelected(op || null);
        setFormData(op ? { username: op.username, fullName: op.fullName, password: '' } : { username: '', fullName: '', password: '' });
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSubmit = async () => {
        if (selected) {
            await api.put(`/users/${selected._id}`, formData);
        } else {
            await api.post('/users', formData);
        }
        fetchOperators();
        handleClose();
    };

    const handleDelete = async (id: string) => {
        await api.delete(`/users/${id}`);
        fetchOperators();
    };

    const columns: GridColDef[] = [
        { field: 'username', headerName: 'Username', width: 150 },
        { field: 'fullName', headerName: 'Full Name', width: 200 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            renderCell: (params) => (
                <>
                    <Button onClick={() => handleOpen(params.row)}>Edit</Button>
                    <Button color="error" onClick={() => handleDelete(params.row._id)}>Delete</Button>
                </>
            ),
        },
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Manage Operators</Typography>
            <Button variant="contained" onClick={() => handleOpen()} sx={{ mb: 2 }}>Add Operator</Button>
            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={operators}
                    columns={columns}
                    pageSizeOptions={[10, 25, 50]}
                    getRowId={(row) => row._id}
                    disableRowSelectionOnClick
                />
            </Box>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{selected ? 'Edit Operator' : 'Add Operator'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        fullWidth
                        margin="normal"
                        helperText={selected ? 'Leave blank to keep current password' : ''}
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

export default Users;