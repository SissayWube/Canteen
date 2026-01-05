// src/pages/FoodItems.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Switch } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import api from '../api/api';

interface FoodItem {
  _id: string;
  code: string;
  name: string;
  isActive: boolean;
}

const FoodItems: React.FC = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '' });

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    try {
      const { data } = await api.get('/food-items');
      setFoodItems(data);
    } catch (err) {
      console.error('Failed to fetch food items');
    }
  };

  const handleOpen = (item?: FoodItem) => {
    setSelectedItem(item || null);
    setFormData(item ? { code: item.code, name: item.name } : { code: '', name: '' });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (selectedItem) {
        await api.put(`/food-items/${selectedItem._id}`, formData);
      } else {
        await api.post('/food-items', formData);
      }
      fetchFoodItems();
      handleClose();
    } catch (err) {
      console.error('Failed to save food item');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/food-items/${id}`, { isActive: !isActive });
      fetchFoodItems();
    } catch (err) {
      console.error('Failed to toggle active');
    }
  };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'name', headerName: 'Name', width: 250 },
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
      <Typography variant="h4" gutterBottom>Food Items</Typography>
      <Button variant="contained" onClick={() => handleOpen()} sx={{ mb: 2 }}>Add Meal</Button>
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={foodItems}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selectedItem ? 'Edit Meal' : 'Add Meal'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Work Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Meal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

export default FoodItems;