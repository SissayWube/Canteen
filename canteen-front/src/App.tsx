import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManualIssue from './pages/ManualIssue';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Customers from './pages/Customers';
import FoodItems from './pages/FoodItems';
import SettingsPage from './pages/Settings';
import Analysis from './pages/Analysis';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Users from './pages/Users';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalSocketHandler from './components/GlobalSocketHandler';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalSocketHandler />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

              {/* All protected routes use Layout (sidebar + content) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                  <Route path="/manual-issue" element={<ErrorBoundary><ManualIssue /></ErrorBoundary>} />
                  <Route path="/customers" element={<ErrorBoundary><Customers /></ErrorBoundary>} />
                  <Route path="/food-items" element={<ErrorBoundary><FoodItems /></ErrorBoundary>} />
                  <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
                  <Route path="/analysis" element={<ErrorBoundary><Analysis /></ErrorBoundary>} />
                  <Route path="/users" element={<ErrorBoundary><Users /></ErrorBoundary>} />
                  <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;