// src/pages/Employees.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Switch } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import api from '../api/api';

interface Employee {
  _id: string;
  deviceId: string;
  name: string;
  department: string;
  isActive: boolean;
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({ deviceId: '', name: '', department: '' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees');
    }
  };

  const handleOpen = (employee?: Employee) => {
    setSelectedEmployee(employee || null);
    setFormData(employee ? { deviceId: employee.deviceId, name: employee.name, department: employee.department } : { deviceId: '', name: '', department: '' });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (selectedEmployee) {
        await api.put(`/employees/${selectedEmployee._id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      fetchEmployees();
      handleClose();
    } catch (err) {
      console.error('Failed to save employee');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/employees/${id}`, { isActive: !isActive });
      fetchEmployees();
    } catch (err) {
      console.error('Failed to toggle active');
    }
  };

  const columns: GridColDef[] = [
    { field: 'deviceId', headerName: 'Device ID', width: 150 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'department', headerName: 'Department', width: 150 },
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
      <Typography variant="h4" gutterBottom>Employees</Typography>
      <Button variant="contained" onClick={() => handleOpen()} sx={{ mb: 2 }}>Add Employee</Button>
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={employees}
          columns={columns}
          loading={false}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
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

export default Employees;