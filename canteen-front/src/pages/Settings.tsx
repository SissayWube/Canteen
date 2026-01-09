// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Alert, CircularProgress, Paper, Divider } from '@mui/material';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';

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

  const { user } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

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

  if (loading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5 }} />;
  }

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', p: 3 }}>
      {user?.role === 'admin' && (
        <>
          <Typography variant="h4" gutterBottom>System Settings</Typography>
          <Paper sx={{ p: 3, mb: 4 }}>
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
              helperText="Maximum meals per employee per day"
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
        </>
      )}

      <Typography variant="h4" gutterBottom>Account Security</Typography>
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
    </Box>
  );
};

export default Settings;