import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Divider,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../stores/RootStore';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = observer(({ open, onClose }) => {
  const { authStore } = useStore();
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && authStore.user) {
      setName(authStore.user.name);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(false);
    }
  }, [open, authStore.user]);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    // Validate name
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    // If password fields are filled, validate password change
    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword) {
        setError('Current password is required to change password');
        return;
      }

      if (!newPassword) {
        setError('New password is required');
        return;
      }

      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('New password and confirm password do not match');
        return;
      }
    }

    setIsLoading(true);

    try {
      const updateData: { name?: string; currentPassword?: string; newPassword?: string } = {
        name: name.trim(),
      };

      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      await authStore.updateProfile(updateData);
      setSuccess(true);
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success">Profile updated successfully!</Alert>
          )}

          {/* Email (read-only) */}
          <TextField
            label="Email"
            value={authStore.user?.email || ''}
            disabled
            fullWidth
            helperText="Email cannot be changed"
          />

          {/* Name */}
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            disabled={isLoading}
          />

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Change Password (optional)
          </Typography>

          {/* Current Password */}
          <TextField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            disabled={isLoading}
            helperText="Required if changing password"
          />

          {/* New Password */}
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            disabled={isLoading}
            helperText="Minimum 8 characters"
          />

          {/* Confirm Password */}
          <TextField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            disabled={isLoading}
            error={confirmPassword !== '' && newPassword !== confirmPassword}
            helperText={
              confirmPassword !== '' && newPassword !== confirmPassword
                ? 'Passwords do not match'
                : ''
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
