// src/pages/FoodItems.tsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { foodItemsApi, FoodItem, FoodItemFilters } from '../api/foodItems';
import TableSkeleton from '../components/TableSkeleton';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'delete' | 'toggle' | null; item: FoodItem | null }>({
    open: false,
    action: null,
    item: null,
  });
  const [formErrors, setFormErrors] = useState({ code: '', name: '', price: '' });

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Statistics

  useEffect(() => {
    fetchFoodItems();
  }, [page, rowsPerPage, searchQuery, activeFilter]);

  const fetchFoodItems = async () => {
    setLoading(true);
    setError('');
    try {
      const filters: FoodItemFilters = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (searchQuery) filters.search = searchQuery;
      if (activeFilter !== 'all') filters.isActive = activeFilter === 'active';

      const response = await foodItemsApi.getAll(filters);
      setFoodItems(response.foodItems);
      setTotalItems(response.pagination.total);

    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to fetch food items');
      showSnackbar('Failed to fetch food items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = { code: '', name: '', price: '' };
    let isValid = true;

    if (!formData.code.trim()) {
      errors.code = 'Work code is required';
      isValid = false;
    }

    if (!formData.name.trim()) {
      errors.name = 'Meal name is required';
      isValid = false;
    }

    if (formData.price < 0) {
      errors.price = 'Price cannot be negative';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
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
    setFormErrors({ code: '', name: '', price: '' });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormErrors({ code: '', name: '', price: '' });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (selectedItem) {
        await foodItemsApi.update(selectedItem._id, formData);
        showSnackbar('Meal updated successfully', 'success');
      } else {
        await foodItemsApi.create(formData);
        showSnackbar('Meal created successfully', 'success');
      }
      fetchFoodItems();
      handleClose();
    } catch (err: any) {
      showSnackbar(err?.response?.data?.error || 'Failed to save meal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = (item: FoodItem) => {
    setConfirmDialog({ open: true, action: 'toggle', item });
  };

  const handleDelete = (item: FoodItem) => {
    setConfirmDialog({ open: true, action: 'delete', item });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.item) return;

    setLoading(true);
    try {
      if (confirmDialog.action === 'toggle') {
        await foodItemsApi.toggleActive(confirmDialog.item._id, confirmDialog.item.isActive);
        showSnackbar(`Meal ${confirmDialog.item.isActive ? 'deactivated' : 'activated'} successfully`, 'success');
      } else if (confirmDialog.action === 'delete') {
        await foodItemsApi.delete(confirmDialog.item._id);
        showSnackbar('Meal deleted successfully', 'success');
      }
      fetchFoodItems();
      setConfirmDialog({ open: false, action: null, item: null });
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
    { field: 'code', headerName: 'Code', width: 100, sortable: true },
    { field: 'name', headerName: 'Name', width: 200, sortable: true },
    { field: 'description', headerName: 'Description', width: 250 },
    {
      field: 'price',
      headerName: 'Price',
      width: 120,
      sortable: true,
      valueGetter: (_, row) => `${row.currency} ${row.price || 0}`
    },
    {
      field: 'subsidy',
      headerName: 'Subsidy',
      width: 100,
      sortable: true,
      valueGetter: (_, row) => `${row.currency} ${row.subsidy || 0}`
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
          Food Items
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Meal
        </Button>
      </Box>

      {/* Statistics Cards
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Meals
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
                Avg. Price
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.avgPrice.toFixed(2)} ETB
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Search by name or code"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
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
            rows={foodItems}
            getRowId={(row) => row._id}
            columns={columns}
            loading={loading}
            pagination
            paginationMode="server"
            rowCount={totalItems}
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
        <DialogTitle>{selectedItem ? 'Edit Meal' : 'Add Meal'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Work Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            fullWidth
            margin="normal"
            required
            error={!!formErrors.code}
            helperText={formErrors.code}
          />
          <TextField
            label="Meal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            margin="normal"
            required
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
              required
              error={!!formErrors.price}
              helperText={formErrors.price}
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
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: null, item: null })}>
        <DialogTitle>
          {confirmDialog.action === 'delete' ? 'Delete Meal?' : 'Toggle Meal Status?'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.action === 'delete'
              ? `Are you sure you want to permanently delete ${confirmDialog.item?.name}? This action cannot be undone.`
              : `Are you sure you want to ${confirmDialog.item?.isActive ? 'deactivate' : 'activate'} ${confirmDialog.item?.name}?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: null, item: null })} disabled={loading}>
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

export default FoodItems;