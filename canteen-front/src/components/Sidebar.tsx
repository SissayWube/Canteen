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
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Print as PrintIcon,
    People as PeopleIcon,
    Restaurant as FoodIcon,
    Settings as SettingsIcon,
    ReceiptLong as TransactionsIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;

const Sidebar: React.FC = () => {
    const { user } = useAuth();

    const commonItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Manual Issue', icon: <PrintIcon />, path: '/manual-issue' },
        { text: 'Transactions', icon: <TransactionsIcon />, path: '/transactions' },
        { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
        { text: 'Food Items', icon: <FoodIcon />, path: '/food-items' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
        { text: 'Logout', icon: <SettingsIcon />, path: '/logout' },
    ];

    const adminOnlyItems = [
        { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
        { text: 'Food Items', icon: <FoodIcon />, path: '/food-items' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ];

    const menuItems = user?.role === 'admin' ? [...commonItems, ...adminOnlyItems] : commonItems;

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                },
            }}
        >
            <Toolbar>
                <Typography variant="h6" noWrap>
                    Canteen System
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItemButton
                        key={item.text}
                        component={Link}
                        to={item.path}
                        sx={{
                            '&:hover': { bgcolor: 'primary.dark' },
                        }}
                    >
                        <ListItemIcon sx={{ color: 'primary.contrastText' }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItemButton>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;