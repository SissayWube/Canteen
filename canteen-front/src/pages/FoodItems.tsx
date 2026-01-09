// src/pages/FoodItems.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Switch, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, OutlinedInput } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { foodItemsApi, FoodItem } from '../api/foodItems';

const FoodItems: React.FC = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    price: 0,
    subsidy: 0,
    currency: 'ETB',
    availableDays: [] as string[]
  });

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    try {
      const data = await foodItemsApi.getAll();
      setFoodItems(data);
    } catch (err) {
      console.error('Failed to fetch food items');
    }
  };

  const handleOpen = (item?: FoodItem) => {
    setSelectedItem(item || null);
    setFormData(item ? {
      code: item.code,
      name: item.name,
      description: item.description || '',
      price: item.price || 0,
      subsidy: item.subsidy || 0,
      currency: item.currency || 'ETB',
      availableDays: item.availableDays || []
    } : {
      code: '',
      name: '',
      description: '',
      price: 0,
      subsidy: 0,
      currency: 'ETB',
      availableDays: []
    });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (selectedItem) {
        await foodItemsApi.update(selectedItem._id, formData);
      } else {
        await foodItemsApi.create(formData);
      }
      fetchFoodItems();
      handleClose();
    } catch (err) {
      console.error('Failed to save food item');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await foodItemsApi.toggleActive(id, !isActive);
      fetchFoodItems();
    } catch (err) {
      console.error('Failed to toggle active');
    }
  };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 200 },
    { field: 'price', headerName: 'Price', width: 100, valueGetter: (_, row) => `${row.currency} ${row.price || 0}` },
    { field: 'subsidy', headerName: 'Subsidy', width: 100 },
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
          getRowId={(row) => row._id}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true } }}
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
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Subsidy"
              type="number"
              value={formData.subsidy}
              onChange={(e) => setFormData({ ...formData, subsidy: Number(e.target.value) })}
              fullWidth
              margin="normal"
            />
          </Box>
          <TextField
            label="Currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="available-days-label">Available Days</InputLabel>
            <Select
              labelId="available-days-label"
              multiple
              value={formData.availableDays}
              onChange={(e) => {
                const { value } = e.target;
                setFormData({ ...formData, availableDays: typeof value === 'string' ? value.split(',') : value });
              }}
              input={<OutlinedInput label="Available Days" />}
              renderValue={(selected) => selected.join(', ')}
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <MenuItem key={day} value={day}>
                  <Checkbox checked={formData.availableDays.indexOf(day) > -1} />
                  <ListItemText primary={day} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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