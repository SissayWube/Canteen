import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Container, CircularProgress, Alert, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/phibelalogo.png';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(username, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
            setIsSubmitting(false);
        }
    };

    if (loading || user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Box component="img" src={logo} alt="Phibela Industrial Logo" sx={{ height: 80, mb: 2 }} />

                    <Typography component="h1" variant="h5" fontWeight="bold" gutterBottom sx={{ textAlign: 'center' }}>
                        PHIBELA INDUSTRIAL PLC
                    </Typography>

                    <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mb: 2, textAlign: 'center' }}>
                        Canteen Management System
                    </Typography>

                    <Typography component="h2" variant="h4" gutterBottom sx={{ mb: 3 }}>
                        Login
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                width: '100%',
                                mb: 2,
                                animation: 'shake 0.3s',
                                '@keyframes shake': {
                                    '0%, 100%': { transform: 'translateX(0)' },
                                    '25%': { transform: 'translateX(-10px)' },
                                    '75%': { transform: 'translateX(10px)' },
                                }
                            }}
                            role="alert"
                            aria-live="polite"
                        >
                            {error}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ mt: 1, width: '100%' }}
                        aria-label="Login form"
                    >
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isSubmitting}
                            inputProps={{
                                'aria-label': 'Username',
                                'aria-required': 'true',
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSubmitting}
                            inputProps={{
                                'aria-label': 'Password',
                                'aria-required': 'true',
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3,
                                mb: 2,
                                height: 48,
                                fontSize: '1rem',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: 4,
                                }
                            }}
                            disabled={isSubmitting || !username || !password}
                            aria-label="Login button"
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                        </Button>
                    </Box>
                </Paper>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                    © 2026 Phibela Industrial PLC. All rights reserved.
                </Typography>
            </Box>
        </Container>
    );
};

export default Login;