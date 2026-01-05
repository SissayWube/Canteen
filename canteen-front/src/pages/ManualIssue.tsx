// src/pages/ManualIssue.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, Button, FormControl, InputLabel, Alert } from '@mui/material';
import api from '../api/api';

interface Employee {
    _id: string;
    name: string;
    deviceId: string;
}

interface FoodItem {
    _id: string;
    name: string;
    code: string;
}

const ManualIssue: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedFoodCode, setSelectedFoodCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        Promise.all([
            api.get('/employees'),
            api.get('/food-items'),
        ]).then(([empRes, foodRes]) => {
            setEmployees(empRes.data);
            setFoodItems(foodRes.data);
        });
    }, []);

    const handleSubmit = async () => {
        if (!selectedEmployee || !selectedFoodCode) {
            setMessage({ type: 'error', text: 'Please select employee and meal' });
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/transactions/manual', {
                employeeId: selectedEmployee,
                foodItemCode: selectedFoodCode,
            });
            setMessage({ type: 'success', text: data.message });
            setSelectedEmployee('');
            setSelectedFoodCode('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Print failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom>Manual Ticket Issue</Typography>

            {message && (
                <Alert severity={message.type} sx={{ mb: 2 }}>
                    {message.text}
                </Alert>
            )}

            <FormControl fullWidth margin="normal">
                <InputLabel>Employee</InputLabel>
                <Select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                    <MenuItem value=""><em>Select employee</em></MenuItem>
                    {employees.map((emp) => (
                        <MenuItem key={emp._id} value={emp._id}>
                            {emp.name} ({emp.deviceId})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
                <InputLabel>Meal</InputLabel>
                <Select value={selectedFoodCode} onChange={(e) => setSelectedFoodCode(e.target.value)}>
                    <MenuItem value=""><em>Select meal</em></MenuItem>
                    {foodItems.map((item) => (
                        <MenuItem key={item._id} value={item.code}>
                            {item.name} (Code: {item.code})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading}
                fullWidth
                sx={{ mt: 3 }}
            >
                {loading ? 'Issuing...' : 'Issue & Print Ticket'}
            </Button>
        </Box>
    );
};

export default ManualIssue;