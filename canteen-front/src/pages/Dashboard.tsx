// A dashboard page
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login'); // Redirect to login
    };
    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>Dashboard</Typography>
            <Typography variant="h6" gutterBottom>Welcome, {user?.fullName || user?.username}!</Typography>
            <Typography variant="body1" gutterBottom>Your role: {user?.role}</Typography>
            <Button variant="contained" color="secondary" onClick={handleLogout}>Logout</Button>
        </Box>
    );
}

export default Dashboard;
