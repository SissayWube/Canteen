// src/components/Layout.tsx
import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 80;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);
  const currentWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar width={currentWidth} onToggle={toggleSidebar} isCollapsed={collapsed} />
      <Sidebar width={currentWidth} isCollapsed={collapsed} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Toolbar /> {/* Spacer for fixed Navbar */}
        <Outlet />  {/* This renders the current page (Dashboard, ManualIssue, etc.) */}
      </Box>
    </Box>
  );
};

export default Layout;