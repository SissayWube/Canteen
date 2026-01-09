import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar } from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon, MenuOpen as MenuOpenIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
    width: number;
    onToggle: () => void;
    isCollapsed: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ width, onToggle, isCollapsed }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                width: `calc(100% - ${width}px)`,
                ml: `${width}px`,
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                transition: theme => theme.transitions.create(['width', 'margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="toggle sidebar"
                    onClick={onToggle}
                    edge="start"
                    sx={{ mr: 2 }}
                >
                    {isCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    Canteen Management
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {user?.fullName || user?.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {user?.role?.toUpperCase()}
                        </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        {user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <IconButton onClick={handleLogout} color="error" title="Logout">
                        <LogoutIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
