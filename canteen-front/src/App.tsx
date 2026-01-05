import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManualIssue from './pages/ManualIssue';
import Transactions from './pages/Transactions';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Employees from './pages/Employees';
import FoodItems from './pages/FoodItems';

// Optional: Dark/Light theme (you can expand later)
const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* All protected routes use Layout (sidebar + content) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/manual-issue" element={<ManualIssue />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/food-items" element={<FoodItems />} />


              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;