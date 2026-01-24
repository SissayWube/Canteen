// src/pages/ManualIssue.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, Button, FormControl, InputLabel, Alert, Grid, Paper, Divider, Autocomplete, TextField, CircularProgress, Switch, FormHelperText } from '@mui/material';
import { customersApi, Customer } from '../api/customers';
import { foodItemsApi, FoodItem } from '../api/foodItems';
import { ordersApi } from '../api/orders';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { handleApiError } from '../utils/errorHandler';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form Schema Validation
const manualIssueSchema = z.object({
    isGuest: z.boolean().default(false),
    customerId: z.string().optional(),
    guestName: z.string().optional(),
    foodItemCode: z.string().min(1, "Please select a meal"),
    notes: z.string().optional(),
    department: z.string().optional(), // For UI filtering only
}).superRefine((data, ctx) => {
    if (data.isGuest) {
        if (!data.guestName || data.guestName.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Guest name is required",
                path: ["guestName"]
            });
        }
    } else {
        if (!data.customerId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please select a customer",
                path: ["customerId"]
            });
        }
    }
});

type ManualIssueFormData = z.infer<typeof manualIssueSchema>;

const ManualIssue: React.FC = () => {
    const queryClient = useQueryClient();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { user } = useAuth();

    // React Hook Form Setup
    const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<ManualIssueFormData>({
        resolver: zodResolver(manualIssueSchema),
        defaultValues: {
            isGuest: false,
            guestName: '',
            customerId: '',
            foodItemCode: '',
            notes: '',
            department: '',
        }
    });

    // Watch values for UI logic (filtering, preview)
    const isGuest = watch('isGuest');
    const selectedDepartment = watch('department');
    const selectedCustomerId = watch('customerId');
    const guestName = watch('guestName');
    const selectedFoodCode = watch('foodItemCode');

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
            setFoodItems(foodResponse.foodItems.filter(f => f.isActive));
        }).catch(err => {
            console.error("Failed to load component data", err);
            setMessage({ type: 'error', text: 'Failed to load customers or meals.' });
        });
    }, []);

    const onSubmit = async (data: ManualIssueFormData) => {
        setMessage(null);
        try {
            const apiData = await ordersApi.issueManual({
                customerId: data.isGuest ? undefined : data.customerId,
                foodItemCode: data.foodItemCode,
                isGuest: data.isGuest,
                guestName: data.isGuest ? data.guestName : undefined,
                notes: data.notes
            });
            setMessage({ type: 'success', text: apiData.message });

            // Invalidate orders and analysis cache so views refresh
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['analysis'] });

            // Reset fields but keep filtered state? Or full reset.
            // Let's reset the sensitive fields only to allow quick re-issue if needed, 
            // but for now full reset is safer to prevent double billing mistakes.
            reset({
                isGuest: data.isGuest, // Keep mode
                department: data.department, // Keep filter
                customerId: '',
                guestName: '',
                foodItemCode: '', // Force re-select meal? Or keep it? Usually better to clear.
                notes: ''
            });

        } catch (err) {
            setMessage({ type: 'error', text: handleApiError(err, 'Failed to issue order') });
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
                    <Paper
                        component="form"
                        onSubmit={handleSubmit(onSubmit)}
                        sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Issue Details</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="bold">Guest Order</Typography>
                                <Controller
                                    name="isGuest"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                // Clear unrelated fields when switching mode
                                                if (e.target.checked) setValue('customerId', '');
                                                else setValue('guestName', '');
                                            }}
                                        />
                                    )}
                                />
                            </Box>
                        </Box>

                        {message && (
                            <Alert severity={message.type} sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setMessage(null)}>
                                {message.text}
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            {!isGuest ? (
                                <>
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="department"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl fullWidth variant="outlined">
                                                    <InputLabel>Filter by Department</InputLabel>
                                                    <Select
                                                        {...field}
                                                        label="Filter by Department"
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            setValue('customerId', ''); // Reset customer when dep changes
                                                        }}
                                                        sx={{ borderRadius: '12px' }}
                                                    >
                                                        <MenuItem value=""><em>All Departments</em></MenuItem>
                                                        {departments.map((dept) => (
                                                            <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="customerId"
                                            control={control}
                                            render={({ field: { onChange, value }, fieldState: { error } }) => (
                                                <Autocomplete
                                                    options={filteredCustomers}
                                                    getOptionLabel={(option) => `${option.name} (${option.deviceId})`}
                                                    value={customers.find(c => c._id === value) || null}
                                                    onChange={(_, newValue) => {
                                                        onChange(newValue ? newValue._id : '');
                                                    }}
                                                    autoHighlight
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Search Customer"
                                                            placeholder="Type name or device ID..."
                                                            variant="outlined"
                                                            error={!!error}
                                                            helperText={error ? error.message : (selectedDepartment ? `Showing customers in ${selectedDepartment}` : "Type to search by name")}
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
                                            )}
                                        />
                                    </Grid>
                                </>
                            ) : (
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="guestName"
                                        control={control}
                                        render={({ field, fieldState: { error } }) => (
                                            <TextField
                                                {...field}
                                                label="Guest Name"
                                                fullWidth
                                                required
                                                error={!!error}
                                                helperText={error?.message}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                            />
                                        )}
                                    />
                                </Grid>
                            )}

                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="foodItemCode"
                                    control={control}
                                    render={({ field, fieldState: { error } }) => (
                                        <FormControl fullWidth error={!!error}>
                                            <InputLabel>Select Meal</InputLabel>
                                            <Select
                                                {...field}
                                                label="Select Meal"
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
                                            {error && <FormHelperText>{error.message}</FormHelperText>}
                                        </FormControl>
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="notes"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Notes (Optional)"
                                            fullWidth
                                            multiline
                                            rows={2}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isSubmitting}
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
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Issue & Print Ticket'}
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
                            </Box>
                        </Paper>
                    </Box>
                </Grid >
            </Grid >
        </Box >
    );
};

export default ManualIssue;
