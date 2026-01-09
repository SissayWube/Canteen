// src/pages/ManualIssue.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, Button, FormControl, InputLabel, Alert, Grid, Paper, Divider, Autocomplete, TextField, CircularProgress } from '@mui/material';
import { employeesApi, Employee } from '../api/employees';
import { foodItemsApi, FoodItem } from '../api/foodItems';
import { ordersApi } from '../api/orders';
import { useAuth } from '../contexts/AuthContext';

const ManualIssue: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedFoodCode, setSelectedFoodCode] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { user } = useAuth();

    // Derived data
    const departments = Array.from(new Set(employees.map(e => e.department))).sort();
    const filteredEmployees = selectedDepartment
        ? employees.filter(e => e.department === selectedDepartment)
        : employees;

    // Derived states for preview
    const selectedEmployee = employees.find(e => e._id === selectedEmployeeId);
    const selectedFood = foodItems.find(f => f.code === selectedFoodCode);
    const currentDateTime = new Date().toLocaleString();

    useEffect(() => {
        Promise.all([
            employeesApi.getAll(),
            foodItemsApi.getAll(),
        ]).then(([empData, foodData]) => {
            setEmployees(empData);
            setFoodItems(foodData);
        });
    }, []);

    const handleSubmit = async () => {
        if (!selectedEmployeeId || !selectedFoodCode) {
            setMessage({ type: 'error', text: 'Please select employee and meal' });
            return;
        }

        setLoading(true);
        try {
            const data = await ordersApi.issueManual({
                employeeId: selectedEmployeeId,
                foodItemCode: selectedFoodCode,
            });
            setMessage({ type: 'success', text: data.message });
            setSelectedEmployeeId('');
            setSelectedFoodCode('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Print failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>Manual Order Issue</Typography>
                <Typography variant="body1" color="text.secondary">
                    Select an employee and meal to manually generate an order and print a ticket.
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Form Section */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Issue Details</Typography>

                        {message && (
                            <Alert severity={message.type} sx={{ mb: 3, borderRadius: '12px' }}>
                                {message.text}
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Filter by Department</InputLabel>
                                    <Select
                                        value={selectedDepartment}
                                        label="Filter by Department"
                                        onChange={(e) => {
                                            setSelectedDepartment(e.target.value);
                                            setSelectedEmployeeId('');
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
                                    options={filteredEmployees}
                                    getOptionLabel={(option) => `${option.name} (${option.deviceId})`}
                                    value={employees.find(e => e._id === selectedEmployeeId) || null}
                                    onChange={(_, newValue) => {
                                        setSelectedEmployeeId(newValue ? newValue._id : '');
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Search Employee"
                                            placeholder="Type name or device ID..."
                                            variant="outlined"
                                            helperText={selectedDepartment ? `Showing employees in ${selectedDepartment}` : "Type to search by name"}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                                        {foodItems.map((item) => (
                                            <MenuItem key={item._id} value={item.code}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                    <Typography>{item.name}</Typography>
                                                    <Typography variant="caption" sx={{ bgcolor: 'action.hover', px: 1, borderRadius: 1 }}>{item.currency} {item.price.toFixed(2)}</Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={loading || !selectedEmployeeId || !selectedFoodCode}
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
                        <Typography variant="overline" align="center" display="block" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'bold', letterSpacing: 2 }}>
                            LIVE TICKET PREVIEW
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
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 1 }}>CANTEEN</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1rem' }}>OFFICIAL RECEIPT</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{currentDateTime}</Typography>
                            </Box>

                            <Divider sx={{ my: 1, borderStyle: 'dashed', borderColor: 'divider' }} />

                            <Box sx={{ my: 3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>EMPLOYEE DETAILS</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                    {selectedEmployee ? selectedEmployee.name.toUpperCase() : '----------------'}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                    <Typography variant="body2">ID:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{selectedEmployee ? selectedEmployee.deviceId : '-------'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">DEPT:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{selectedEmployee ? selectedEmployee.department : '----------------'}</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ my: 2, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>MEAL INFORMATION</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.dark', mt: 1 }}>
                                    {selectedFood ? selectedFood.name : '--------------'}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                    <Typography variant="body2">Base Price:</Typography>
                                    <Typography variant="body2">{selectedFood ? `${selectedFood.currency} ${selectedFood.price.toFixed(2)}` : '---'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Subsidy:</Typography>
                                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                        {selectedFood ? `-${selectedFood.currency} ${selectedFood.subsidy.toFixed(2)}` : '---'}
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>TOTAL:</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        {selectedFood ? `${selectedFood.currency} ${(selectedFood.price - selectedFood.subsidy).toFixed(2)}` : '---'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mt: 'auto', textAlign: 'center', pt: 3 }}>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                    CODE: {selectedFood ? selectedFood.code : '---------'}<br />
                                    OPERATOR: {user?.username?.toUpperCase() || '---'}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1, fontSize: '0.7rem', color: 'text.secondary' }}>
                                    * PLEASE RETAIN THIS TICKET FOR MEAL COLLECTION *
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