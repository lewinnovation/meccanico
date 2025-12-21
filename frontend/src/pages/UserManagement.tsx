import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Chip,
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  LockReset as ResetPasswordIcon,
  Block as SuspendIcon,
  CheckCircle as ActivateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';
import type { User, CreateUserDto } from '../stores/UserStore';

const UserManagement: React.FC = observer(() => {
  const { userStore, authStore } = useStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState<string | null>(null);
  const [suspendConfirm, setSuspendConfirm] = useState<string | null>(null);
  const [activateConfirm, setActivateConfirm] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUserDto>({
    name: '',
    email: '',
    role: 'MECHANIC',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authStore.isAdmin) {
      userStore.fetchUsers();
    }
  }, [userStore, authStore.isAdmin]);

  const handleOpenCreateDialog = () => {
    setFormData({ name: '', email: '', role: 'MECHANIC' });
    setError(null);
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setFormData({ name: '', email: '', role: 'MECHANIC' });
    setError(null);
  };

  const handleCreateUser = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    try {
      await userStore.createUser(formData);
      setSuccess('User created successfully. They will receive an email with their password.');
      setCreateDialogOpen(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      await userStore.resetPassword(id);
      setSuccess('Password reset successfully. User will receive an email with the new password.');
      setResetPasswordConfirm(null);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
      setResetPasswordConfirm(null);
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await userStore.suspendUser(id);
      setSuccess('User suspended successfully.');
      setSuspendConfirm(null);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to suspend user');
      setSuspendConfirm(null);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await userStore.activateUser(id);
      setSuccess('User activated successfully.');
      setActivateConfirm(null);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate user');
      setActivateConfirm(null);
    }
  };

  const handleCheckDelete = async (id: string) => {
    try {
      const result = await userStore.canDeleteUser(id);
      if (result.canDelete) {
        setDeleteConfirm(id);
        setDeleteReason(null);
      } else {
        setDeleteReason(result.reason || 'User cannot be deleted');
        setDeleteConfirm(id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check if user can be deleted');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'MECHANIC':
        return 'primary';
      case 'VIEWER':
        return 'default';
      default:
        return 'default';
    }
  };

  if (!authStore.isAdmin) {
    return (
      <Box>
        <Alert severity="error">You do not have permission to access this page.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          User Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
          Create User
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {userStore.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : userStore.users.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No users found
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userStore.users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography fontWeight={500}>{user.name}</Typography>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Suspended'}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          {user.isActive ? (
                            <Tooltip title="Suspend User">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => setSuspendConfirm(user.id)}
                                disabled={user.id === authStore.user?.id}
                              >
                                <SuspendIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Activate User">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => setActivateConfirm(user.id)}
                              >
                                <ActivateIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Reset Password">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setResetPasswordConfirm(user.id)}
                            >
                              <ResetPasswordIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              user.id === authStore.user?.id
                                ? 'You cannot delete yourself'
                                : 'Delete User'
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCheckDelete(user.id)}
                                disabled={user.id === authStore.user?.id}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MECHANIC' | 'VIEWER' })}
                label="Role"
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="MECHANIC">Mechanic</MenuItem>
                <MenuItem value="VIEWER">Viewer</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info">
              A random password will be generated and sent to the user's email. You will not see the password.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" disabled={userStore.isLoading}>
            {userStore.isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Confirmation */}
      <Dialog open={!!resetPasswordConfirm} onClose={() => setResetPasswordConfirm(null)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset this user's password? A new random password will be generated and sent to their email.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => resetPasswordConfirm && handleResetPassword(resetPasswordConfirm)}
            variant="contained"
            color="primary"
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suspend Confirmation */}
      <Dialog open={!!suspendConfirm} onClose={() => setSuspendConfirm(null)}>
        <DialogTitle>Suspend User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to suspend this user? They will not be able to access the system until reactivated.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => suspendConfirm && handleSuspend(suspendConfirm)}
            variant="contained"
            color="warning"
          >
            Suspend
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activate Confirmation */}
      <Dialog open={!!activateConfirm} onClose={() => setActivateConfirm(null)}>
        <DialogTitle>Activate User</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to activate this user?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => activateConfirm && handleActivate(activateConfirm)}
            variant="contained"
            color="success"
          >
            Activate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          {deleteReason ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {deleteReason}
            </Alert>
          ) : (
            <DialogContentText>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          {!deleteReason && (
            <Button
              onClick={() => {
                // Delete functionality would go here if implemented
                setDeleteConfirm(null);
                setError('User deletion is not yet implemented. Users with activity cannot be deleted.');
              }}
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default UserManagement;
