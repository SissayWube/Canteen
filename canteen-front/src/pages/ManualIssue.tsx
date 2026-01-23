// src/pages/ManualIssue.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, Button, FormControl, InputLabel, Alert, Grid, Paper, Divider, Autocomplete, TextField, CircularProgress, Switch } from '@mui/material';
import { customersApi, Customer } from '../api/customers';
import { foodItemsApi, FoodItem } from '../api/foodItems';
import { ordersApi } from '../api/orders';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const ManualIssue: React.FC = () => {
    const queryClient = useQueryClient();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedFoodCode, setSelectedFoodCode] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [notes, setNotes] = useState('');
    const { user } = useAuth();

    // Derived data
    const departments = Array.from(new Set(customers.map(c => c.department))).sort();
    const filteredCustomers = selectedDepartment
        ? customers.filter(c => c.department === selectedDepartment)
        : customers;

    // Derived states for preview
    const selectedCustomer = customers.find(c => c._id === selectedCustomerId);
    const selectedFood = foodItems.find(f => f.code === selectedFoodCode);
    const currentDateTime = new Date().toLocaleString();

    useEffect(() => {
        Promise.all([
            customersApi.getAll({ limit: 1000 }), // Get all for dropdowns
            foodItemsApi.getAll({ limit: 1000 }), // Get all for dropdowns
        ]).then(([custResponse, foodResponse]) => {
            setCustomers(custResponse.customers);
            setFoodItems(foodResponse.foodItems);
        });
    }, []);

    const handleSubmit = async () => {
        // Validation logic
        if (!selectedFoodCode) {
            setMessage({ type: 'error', text: 'Please select a meal' });
            return;
        }

        if (isGuest) {
            if (!guestName.trim()) {
                setMessage({ type: 'error', text: 'Please enter guest name' });
                return;
            }
        } else {
            if (!selectedCustomerId) {
                setMessage({ type: 'error', text: 'Please select a customer' });
                return;
            }
        }

        setLoading(true);
        try {
            const data = await ordersApi.issueManual({
                customerId: isGuest ? undefined : selectedCustomerId,
                foodItemCode: selectedFoodCode,
                isGuest,
                guestName: isGuest ? guestName : undefined,
                notes
            });
            setMessage({ type: 'success', text: data.message });

            // Invalidate orders and analysis cache so views refresh
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['analysis'] });

            // Reset fields
            setSelectedCustomerId('');
            setSelectedFoodCode('');
            setGuestName('');
            setNotes('');
            // Keep isGuest toggle as is, or reset? Let's keep it.
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Print failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 1, maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>Manual Order Issue</Typography>
                <Typography variant="body1" color="text.secondary">
                    Select a customer (or guest) and meal to manually generate an order and print a ticket.
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Form Section */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Issue Details</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="bold">Guest Order</Typography>
                                <Switch checked={isGuest} onChange={(e) => setIsGuest(e.target.checked)} />
                            </Box>
                        </Box>

                        {message && (
                            <Alert severity={message.type} sx={{ mb: 3, borderRadius: '12px' }}>
                                {message.text}
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            {!isGuest ? (
                                <>
                                    <Grid size={{ xs: 12 }}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel>Filter by Department</InputLabel>
                                            <Select
                                                value={selectedDepartment}
                                                label="Filter by Department"
                                                onChange={(e) => {
                                                    setSelectedDepartment(e.target.value);
                                                    setSelectedCustomerId('');
                                                }}
                                                sx={{ borderRadius: '12px' }}
                                            >
                                                <MenuItem value=""><em>All Departments</em></MenuItem>
                                                {departments.map((dept) => (
                                                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Autocomplete
                                            options={filteredCustomers}
                                            getOptionLabel={(option) => `${option.name} (${option.deviceId})`}
                                            value={customers.find(c => c._id === selectedCustomerId) || null}
                                            onChange={(_, newValue) => {
                                                setSelectedCustomerId(newValue ? newValue._id : '');
                                            }}
                                            autoHighlight
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Search Customer"
                                                    placeholder="Type name or device ID..."
                                                    variant="outlined"
                                                    helperText={selectedDepartment ? `Showing customers in ${selectedDepartment}` : "Type to search by name"}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                                    autoFocus
                                                />
                                            )}
                                            renderOption={(props, option) => {
                                                const { key, ...otherProps } = props;
                                                return (
                                                    <li key={key} {...otherProps}>
                                                        <Box>
                                                            <Typography variant="body1" fontWeight="medium">{option.name}</Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {option.department} | ID: {option.deviceId}
                                                            </Typography>
                                                        </Box>
                                                    </li>
                                                )
                                            }}
                                        />
                                    </Grid>
                                </>
                            ) : (
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        label="Guest Name"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        fullWidth
                                        required
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />
                                </Grid>
                            )}

                            <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Meal</InputLabel>
                                    <Select
                                        value={selectedFoodCode}
                                        label="Select Meal"
                                        onChange={(e) => setSelectedFoodCode(e.target.value)}
                                        sx={{ borderRadius: '12px' }}
                                    >
                                        <MenuItem value=""><em>-- Select meal --</em></MenuItem>
                                        {foodItems.map((item) => {
                                            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                                            const isAvailable = !item.availableDays || item.availableDays.length === 0 || item.availableDays.includes(today);

                                            return (
                                                <MenuItem key={item._id} value={item.code} disabled={!isAvailable}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                        <Typography color={!isAvailable ? 'text.disabled' : 'text.primary'}>
                                                            {item.name} {!isAvailable && '(Not available today)'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ bgcolor: !isAvailable ? 'action.disabledBackground' : 'action.hover', px: 1, borderRadius: 1 }}>
                                                            {item.currency} {item.price.toFixed(2)}
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Notes (Optional)"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={loading || (!isGuest && !selectedCustomerId) || (isGuest && !guestName) || !selectedFoodCode}
                            fullWidth
                            size="large"
                            sx={{
                                mt: 4,
                                py: 1.5,
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                boxShadow: '0 8px 16px rgba(25, 118, 210, 0.2)'
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Issue & Print Ticket'}
                        </Button>
                    </Paper>
                </Grid>

                {/* Ticket Preview Section */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ position: 'sticky', top: 100 }}>
                        <Typography variant="overline" align="center" display="block" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'bold', letterSpacing: 2 }}>
                            TICKET PREVIEW
                        </Typography>
                        <Paper
                            elevation={10}
                            sx={{
                                p: 4,
                                width: '100%',
                                maxWidth: 350,
                                mx: 'auto',
                                position: 'relative',
                                fontFamily: '"Inter", "Courier New", monospace',
                                backgroundColor: '#fff',
                                borderRadius: '2px', // Ticket edges usually flat or perforated
                                minHeight: 450,
                                display: 'flex',
                                flexDirection: 'column',
                                // Thermal paper effect
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: -10,
                                    left: 0,
                                    right: 0,
                                    height: 10,
                                    background: 'linear-gradient(-45deg, #fff 5px, transparent 0), linear-gradient(45deg, #fff 5px, transparent 0)',
                                    backgroundSize: '10px 10px',
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: -10,
                                    left: 0,
                                    right: 0,
                                    height: 10,
                                    background: 'linear-gradient(-45deg, transparent 5px, #fff 0), linear-gradient(45deg, transparent 5px, #fff 0)',
                                    backgroundSize: '10px 10px',
                                }
                            }}
                        >
                            <Box sx={{ textAlign: 'center', mb: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: 0 }}>PHIBELA INDUSTRIAL PLC CANTEEN</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '0.9rem', mt: -0.5 }}>RECEIPT</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{currentDateTime}</Typography>
                            </Box>

                            <Divider sx={{ my: 0.5, borderStyle: 'dashed', borderColor: 'divider' }} />

                            <Box sx={{ my: 1.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>CUSTOMER DETAILS</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0, fontSize: '1.1rem' }}>
                                    {isGuest
                                        ? (guestName ? guestName.toUpperCase() : 'GUEST NAME')
                                        : (selectedCustomer ? selectedCustomer.name.toUpperCase() : '----------------')
                                    }
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>ID:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.8rem' }}>
                                        {isGuest ? 'GUEST' : (selectedCustomer ? selectedCustomer.deviceId : '-------')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>DEPT:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.8rem' }}>
                                        {isGuest ? 'VISITOR' : (selectedCustomer ? selectedCustomer.department : '----------------')}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ my: 1, bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>MEAL INFORMATION</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.dark', mt: 0.5 }}>
                                    {selectedFood ? selectedFood.name : '--------------'}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Base Price:</Typography>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{selectedFood ? `${selectedFood.currency} ${selectedFood.price.toFixed(2)}` : '---'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Subsidy:</Typography>
                                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                        {selectedFood ? `-${selectedFood.currency} ${selectedFood.subsidy.toFixed(2)}` : '---'}
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 0.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>TOTAL:</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {selectedFood ? `${selectedFood.currency} ${(selectedFood.price - selectedFood.subsidy).toFixed(2)}` : '---'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mt: 'auto', textAlign: 'center', pt: 1 }}>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                    CODE: {selectedFood ? selectedFood.code : '---------'}<br />
                                    OPERATOR: {user?.username?.toUpperCase() || '---'}
                                </Typography>
                                {/* <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.65rem', color: 'text.secondary' }}>
                                    * PLEASE RETAIN THIS TICKET FOR MEAL COLLECTION *
                                </Typography> */}
                            </Box>
                        </Paper>
                    </Box>
                </Grid >
            </Grid >
        </Box >
    );
};

export default ManualIssue;
