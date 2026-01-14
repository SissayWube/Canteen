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
    Box
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Print as PrintIcon,
    People as PeopleIcon,
    Restaurant as FoodIcon,
    Settings as SettingsIcon,
    BarChart as BarChartIcon,
    ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/phibelalogo.png';

interface SidebarProps {
    width: number;
    isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ width, isCollapsed }) => {
    const { user } = useAuth();
    const location = useLocation();

    const commonItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Manual Order', icon: <PrintIcon />, path: '/manual-issue' },
        // { text: 'Logout', icon: <LogoutIcon />, path: '#', onClick: logout },
    ];

    const adminOnlyItems: typeof commonItems = [
        { text: 'Analysis', icon: <BarChartIcon />, path: '/analysis' },
        { text: 'Operators', icon: <ManageAccountsIcon />, path: '/users' },
        { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
        { text: 'Food Items', icon: <FoodIcon />, path: '/food-items' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ];

    const menuItems = user?.role === 'admin' ? [...commonItems, ...adminOnlyItems] : commonItems;

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
                    bgcolor: '#1a2035', // Dark distinct background
                    color: '#ffffff',
                    borderRight: 'none',
                    overflowX: 'hidden',
                    transition: theme => theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                },
            }}
        >
            <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                <Box component="img" src={logo} alt="Phibela logo" sx={{ height: 30, display: isCollapsed ? 'none' : 'block', mr: 1 }} />
                <Typography variant="h6" sx={{
                    fontWeight: 'bold',
                    letterSpacing: 1,
                    color: '#fff',
                    display: isCollapsed ? 'none' : 'block',
                    fontSize: '1rem'
                }}>
                    PHIBELA
                </Typography>
                {isCollapsed && (
                    <Box component="img" src={logo} alt="Phibela logo (collapsed)" sx={{ height: 30 }} />
                )}
            </Toolbar>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <List sx={{ px: isCollapsed ? 1 : 2, py: 2 }}>
                {menuItems.map((item) => (
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
                                mb: 1,
                                borderRadius: '12px',
                                justifyContent: isCollapsed ? 'center' : 'initial',
                                px: 2.5,
                                bgcolor: location.pathname === item.path ? 'primary.main' : 'transparent',
                                '&:hover': { bgcolor: location.pathname === item.path ? 'primary.dark' : 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            <ListItemIcon sx={{
                                color: 'rgba(255,255,255,0.7)',
                                minWidth: 0,
                                mr: isCollapsed ? 0 : 3,
                                justifyContent: 'center',
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            {!isCollapsed && (
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
                                />
                            )}
                        </ListItemButton>
                    </Tooltip>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;