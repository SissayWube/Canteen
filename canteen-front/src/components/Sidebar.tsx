import React from 'react';
import {
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Divider,
    Tooltip,
    Box,
    Avatar,
    IconButton,
    ListSubheader
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Print as PrintIcon,
    People as PeopleIcon,
    Restaurant as FoodIcon,
    Settings as SettingsIcon,
    BarChart as BarChartIcon,
    ManageAccounts as ManageAccountsIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/phibelalogo.png';

interface SidebarProps {
    width: number;
    isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ width, isCollapsed }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isPathActive = (path: string) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    const commonItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Manual Order', icon: <PrintIcon />, path: '/manual-issue' },
        { text: 'Analysis', icon: <BarChartIcon />, path: '/analysis' },
    ];

    const adminOnlyItems = [
        { text: 'Operators', icon: <ManageAccountsIcon />, path: '/users' },
        { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
        { text: 'Food Items', icon: <FoodIcon />, path: '/food-items' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ];

    const renderNavItem = (item: { text: string; icon: React.ReactNode; path: string }) => {
        const active = isPathActive(item.path);
        return (
            <Tooltip
                key={item.text}
                title={isCollapsed ? item.text : ""}
                placement="right"
                arrow
                disableHoverListener={!isCollapsed}
            >
                <ListItemButton
                    component={Link}
                    to={item.path}
                    sx={{
                        mb: 0.5,
                        borderRadius: '12px',
                        justifyContent: isCollapsed ? 'center' : 'initial',
                        px: 2.5,
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        background: active
                            ? 'linear-gradient(90deg, rgba(25, 118, 210, 0.9) 0%, rgba(25, 118, 210, 0.5) 100%)'
                            : 'transparent',
                        boxShadow: active ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                        '&:hover': {
                            bgcolor: active ? 'primary.dark' : 'rgba(255,255,255,0.08)',
                            transform: 'translateX(4px)',
                        },
                        '&::before': active ? {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: '60%',
                            width: '4px',
                            borderRadius: '0 4px 4px 0',
                            backgroundColor: '#fff',
                        } : {},
                    }}
                >
                    <ListItemIcon sx={{
                        color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                        minWidth: 0,
                        mr: isCollapsed ? 0 : 3,
                        justifyContent: 'center',
                    }}>
                        {item.icon}
                    </ListItemIcon>
                    {!isCollapsed && (
                        <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                                fontSize: '0.95rem',
                                fontWeight: active ? 600 : 500,
                                color: active ? '#fff' : 'rgba(255,255,255,0.9)'
                            }}
                        />
                    )}
                </ListItemButton>
            </Tooltip>
        );
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: width,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                transition: theme => theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
                '& .MuiDrawer-paper': {
                    width: width,
                    boxSizing: 'border-box',
                    bgcolor: '#111827', // Deeper dark blue/grey
                    color: '#ffffff',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: theme => theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                },
            }}
        >
            <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', px: 2, py: 3, minHeight: 80 }}>
                <Box component="img" src={logo} alt="Phibela logo" sx={{ height: 32, mr: isCollapsed ? 0 : 2, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }} />
                {!isCollapsed && (
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1.5, lineHeight: 1 }}>PHIBELA</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>INDUSTRIAL PLC</Typography>
                    </Box>
                )}
            </Toolbar>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

            <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2 }}>
                <List subheader={
                    !isCollapsed && (
                        <ListSubheader sx={{ bgcolor: 'transparent', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', mb: 1 }}>
                            Menu
                        </ListSubheader>
                    )
                }>
                    {commonItems.map(renderNavItem)}
                </List>

                {user?.role === 'admin' && (
                    <>
                        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                        <List subheader={
                            !isCollapsed && (
                                <ListSubheader sx={{ bgcolor: 'transparent', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', mb: 1 }}>
                                    Administration
                                </ListSubheader>
                            )
                        }>
                            {adminOnlyItems.map(renderNavItem)}
                        </List>
                    </>
                )}
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* Profile Footer */}
            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            sx={{
                                height: 36,
                                width: 36,
                                bgcolor: user?.role === 'admin' ? 'primary.main' : 'secondary.main',
                                fontSize: '0.9rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {user?.username?.charAt(0).toUpperCase()}
                        </Avatar>
                        {!isCollapsed && (
                            <Box sx={{ ml: 1.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                                    {user?.username}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                                    {user?.role}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    {!isCollapsed && (
                        <Tooltip title="Logout">
                            <IconButton onClick={handleLogout} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#ef5350', bgcolor: 'rgba(239, 83, 80, 0.1)' } }}>
                                <LogoutIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
        </Drawer>
    );
};

export default Sidebar;