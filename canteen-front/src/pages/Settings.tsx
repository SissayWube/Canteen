// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Alert, CircularProgress, Paper, Tabs, Tab } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { auditApi, AuditLog } from '../api/audit';
import dayjs from 'dayjs';

interface SettingsForm {
  companyName: string;
  dailyMealLimit: number;
}

const Settings: React.FC = () => {
  const [formData, setFormData] = useState<SettingsForm>({
    companyName: '',
    dailyMealLimit: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change State
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [tabValue, setTabValue] = useState(0);

  const { user } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (tabValue === 2 && user?.role === 'admin') {
      fetchAuditLogs();
    }
  }, [tabValue, auditPagination.page, user]);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setFormData({
        companyName: data.companyName || 'Company Canteen',
        dailyMealLimit: data.dailyMealLimit || 3,
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await auditApi.getAll(auditPagination.page, auditPagination.limit);
      setAuditLogs(data.logs);
      setAuditPagination(prev => ({ ...prev, total: data.pagination.total }));
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dailyMealLimit' ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.patch('/settings', formData);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMessage(null);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const auditColumns: GridColDef[] = [
    { field: 'timestamp', headerName: 'Time', width: 180, valueFormatter: (value: any) => dayjs(value).format('MMM D, HH:mm:ss') },
    { field: 'action', headerName: 'Action', width: 150 },
    { field: 'performedByUsername', headerName: 'User', width: 120 },
    { field: 'subModel', headerName: 'Target', width: 100 },
    {
      field: 'details',
      headerName: 'Details',
      width: 300,
      flex: 1,
      valueGetter: (value: any) => JSON.stringify(value)
    },
    { field: 'ipAddress', headerName: 'IP', width: 130 },
  ];

  if (loading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5 }} />;
  }

  return (
    <Box sx={{ maxWidth: user?.role === 'admin' ? 1000 : 500, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>Settings</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          {user?.role === 'admin' && <Tab label="General" />}
          <Tab label="Security" />
          {user?.role === 'admin' && <Tab label="Audit Logs" />}
        </Tabs>
      </Box>

      {/* General Settings Tab */}
      {user?.role === 'admin' && tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>System Configuration</Typography>
          {message && <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>}

          <TextField
            label="Daily Meal Limit"
            name="dailyMealLimit"
            type="number"
            value={formData.dailyMealLimit}
            onChange={handleChange}
            fullWidth
            margin="normal"
            inputProps={{ min: 1 }}
            helperText="Maximum meals per customer per day"
          />

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ mt: 2 }}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Paper>
      )}

      {/* Security Tab */}
      {((user?.role === 'admin' && tabValue === 1) || (user?.role !== 'admin' && tabValue === 0)) && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Change Password</Typography>
          {passwordMessage && <Alert severity={passwordMessage.type} sx={{ mb: 3 }}>{passwordMessage.text}</Alert>}

          <TextField
            label="Current Password"
            type="password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="New Password"
            type="password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Confirm New Password"
            type="password"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
            fullWidth
            margin="normal"
          />

          <Button
            variant="contained"
            color="secondary"
            onClick={handlePasswordChange}
            disabled={passwordSaving || !passwords.currentPassword || !passwords.newPassword}
            sx={{ mt: 2 }}
          >
            {passwordSaving ? 'Updating...' : 'Update Password'}
          </Button>
        </Paper>
      )}

      {/* Audit Logs Tab */}
      {user?.role === 'admin' && tabValue === 2 && (
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={auditLogs}
            columns={auditColumns}
            loading={auditLoading}
            getRowId={(row) => row._id}
            paginationMode="server"
            rowCount={auditPagination.total}
            pageSizeOptions={[20, 50, 100]}
            paginationModel={{ page: auditPagination.page - 1, pageSize: auditPagination.limit }}
            onPaginationModelChange={(model) => setAuditPagination(prev => ({ ...prev, page: model.page + 1, limit: model.pageSize }))}
            disableRowSelectionOnClick
          />
        </Paper>
      )}
    </Box>
  );
};

export default Settings;