import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
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
  Alert,
  CircularProgress,
  Chip,
  TablePagination,
  Paper,
  Divider,
  Grid,
  Tooltip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ArrowBack as BackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as AddressIcon,
  DirectionsCar as VehicleIcon,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';
import type { Customer } from '../stores/CustomerStore';

// ==================== CUSTOMER FORM ====================
interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

const defaultFormData: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSave: (data: CustomerFormData) => Promise<void>;
  isLoading: boolean;
}

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  open,
  onClose,
  customer,
  onSave,
  isLoading,
}) => {
  const [formData, setFormData] = useState<CustomerFormData>(defaultFormData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || '',
      });
    } else {
      setFormData(defaultFormData);
    }
    setError(null);
  }, [customer, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{customer ? 'Edit Customer' : 'New Customer'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            name="name"
            required
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Customer name"
            inputProps={{ 'data-testid': 'customer-name' }}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
            inputProps={{ 'data-testid': 'customer-email' }}
          />
          <TextField
            label="Phone"
            name="phone"
            type="tel"
            fullWidth
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="555-1234"
            inputProps={{ 'data-testid': 'customer-phone' }}
          />
          <TextField
            label="Address"
            name="address"
            fullWidth
            multiline
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Street address, city, state"
            inputProps={{ 'data-testid': 'customer-address' }}
          />
          <TextField
            label="Notes"
            name="notes"
            fullWidth
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
            inputProps={{ 'data-testid': 'customer-notes' }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || !formData.name.trim()}
        >
          {isLoading ? <CircularProgress size={20} /> : customer ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==================== DELETE CONFIRMATION ====================
interface DeleteConfirmDialogProps {
  open: boolean;
  customerName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  customerName,
  onClose,
  onConfirm,
  isLoading,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Delete Customer?</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete <strong>{customerName}</strong>? This action cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={isLoading} data-testid="cancel-delete">
        Cancel
      </Button>
      <Button
        color="error"
        variant="contained"
        onClick={onConfirm}
        disabled={isLoading}
        data-testid="confirm-delete"
      >
        {isLoading ? <CircularProgress size={20} /> : 'Delete'}
      </Button>
    </DialogActions>
  </Dialog>
);

// ==================== CUSTOMER LIST ====================
const CustomerList: React.FC = observer(() => {
  const { customerStore, authStore } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    customerStore.fetchCustomers(search, page + 1);
  }, [customerStore, search, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCustomer(null);
  };

  const handleSave = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await customerStore.updateCustomer(editingCustomer.id, data);
      } else {
        await customerStore.createCustomer(data);
      }
      handleCloseForm();
      customerStore.fetchCustomers(search, page + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCustomer) return;
    setIsSubmitting(true);
    try {
      await customerStore.deleteCustomer(deleteCustomer.id);
      setDeleteCustomer(null);
      customerStore.fetchCustomers(search, page + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowClick = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Customers
        </Typography>
        {authStore.canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            data-testid="add-customer"
          >
            New Customer
          </Button>
        )}
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search customers..."
        sx={{ mb: 3 }}
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
        inputProps={{ 'data-testid': 'search-input' }}
      />

      {/* Loading State */}
      {customerStore.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : customerStore.customers.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {search ? 'No customers found' : 'No customers yet'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {search
                ? 'Try adjusting your search criteria.'
                : 'Add your first customer to start building your client base.'}
            </Typography>
            {!search && authStore.canEdit && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                Add Customer
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Customer Table */
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customerStore.customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(customer)}
                    data-testid="customer-row"
                  >
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" data-testid="customer-code">
                        {customer.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>{customer.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.secondary">
                        {customer.email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.secondary">
                        {customer.phone || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {authStore.canEdit && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(e) => handleOpenEdit(customer, e)}
                              data-testid="edit-customer"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteCustomer(customer);
                              }}
                              data-testid="delete-customer"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={customerStore.total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            data-testid="customer-count"
          />
        </Paper>
      )}

      {/* Form Dialog */}
      <CustomerFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        customer={editingCustomer}
        onSave={handleSave}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteCustomer}
        customerName={deleteCustomer?.name || ''}
        onClose={() => setDeleteCustomer(null)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </Box>
  );
});

// ==================== CUSTOMER DETAIL ====================
const CustomerDetail: React.FC = observer(() => {
  const { customerStore, vehicleStore, authStore, settingsStore } = useStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);

  const [customerVehicles, setCustomerVehicles] = useState<typeof vehicleStore.vehicles>([]);

  useEffect(() => {
    if (id) {
      customerStore.fetchCustomerById(id).catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load customer');
      });
      // Fetch vehicles for this customer
      vehicleStore.fetchVehiclesByCustomer(id).then((vehicles) => {
        setCustomerVehicles(vehicles);
      }).catch(() => {
        // Silently fail - vehicles are optional
      });
    }
  }, [id, customerStore, vehicleStore]);

  // Refetch vehicles when dialog closes
  const refreshVehicles = async () => {
    if (id) {
      try {
        const vehicles = await vehicleStore.fetchVehiclesByCustomer(id);
        setCustomerVehicles(vehicles);
      } catch {
        // Silently fail
      }
    }
  };

  const customer = customerStore.selectedCustomer;

  const handleSave = async (data: CustomerFormData) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await customerStore.updateCustomer(id, data);
      setFormOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await customerStore.deleteCustomer(id);
      navigate('/customers');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (customerStore.isLoading && !customer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/customers')} sx={{ mb: 2 }}>
          Back to Customers
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/customers')} sx={{ mb: 2 }}>
          Back to Customers
        </Button>
        <Alert severity="warning">Customer not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/customers')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={600}>
            {customer.name}
          </Typography>
          <Chip
            label={customer.code}
            size="small"
            sx={{ mt: 0.5, fontFamily: 'monospace' }}
            className="customer-code"
            data-testid="customer-code"
          />
        </Box>
        {authStore.canEdit && (
          <>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setFormOpen(true)}
              data-testid="edit-customer"
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteOpen(true)}
              data-testid="delete-customer"
            >
              Delete
            </Button>
          </>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Contact Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmailIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography>
                      {customer.email || <em style={{ color: 'gray' }}>Not provided</em>}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PhoneIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography>
                      {customer.phone || <em style={{ color: 'gray' }}>Not provided</em>}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AddressIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Address
                    </Typography>
                    <Typography>
                      {customer.address || <em style={{ color: 'gray' }}>Not provided</em>}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notes */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography color={customer.notes ? 'text.primary' : 'text.secondary'}>
                {customer.notes || <em>No notes</em>}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicles */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Vehicles {customerVehicles.length > 0 && `(${customerVehicles.length})`}
                </Typography>
                {authStore.canEdit && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setAddVehicleOpen(true)}
                    data-testid="add-vehicle-btn"
                  >
                    Add Vehicle
                  </Button>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {vehicleStore.isLoading && customerVehicles.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : customerVehicles.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <VehicleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No vehicles registered for this customer
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => setAddVehicleOpen(true)}
                  >
                    Add the first vehicle
                  </Button>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Code</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Year</TableCell>
                        <TableCell>License Plate</TableCell>
                        <TableCell>Color</TableCell>
                        <TableCell align="right">Odometer</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerVehicles.map((vehicle) => (
                        <TableRow
                          key={vehicle.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                          data-testid={`vehicle-row-${vehicle.id}`}
                        >
                          <TableCell>
                            <Chip
                              label={vehicle.code}
                              size="small"
                              sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <VehicleIcon fontSize="small" color="action" />
                              <Typography fontWeight={500}>
                                {vehicle.make} {vehicle.model}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{vehicle.year || '-'}</TableCell>
                          <TableCell>
                            {vehicle.licensePlate ? (
                              <Chip
                                label={vehicle.licensePlate}
                                size="small"
                                variant="outlined"
                                sx={{ fontFamily: 'monospace' }}
                              />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{vehicle.color || '-'}</TableCell>
                          <TableCell align="right">
                            {vehicle.odometer ? `${vehicle.odometer.toLocaleString()} ${settingsStore.odometerSettings.unit}` : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/vehicles/${vehicle.id}`);
                                }}
                              >
                                <VehicleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Form Dialog */}
      <CustomerFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        customer={customer}
        onSave={handleSave}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteOpen}
        customerName={customer.name}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />

      {/* Add Vehicle Dialog */}
      <AddVehicleDialog
        open={addVehicleOpen}
        onClose={() => {
          setAddVehicleOpen(false);
          refreshVehicles();
        }}
        customerId={customer.id}
        customerName={customer.name}
      />
    </Box>
  );
});

// ==================== ADD VEHICLE DIALOG ====================
interface AddVehicleDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

const AddVehicleDialog: React.FC<AddVehicleDialogProps> = observer(({
  open,
  onClose,
  customerId,
  customerName,
}) => {
  const { vehicleStore, settingsStore } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    licensePlate: '',
    color: '',
    odometer: '',
    odometerUnit: 'km',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        make: '',
        model: '',
        year: '',
        vin: '',
        licensePlate: '',
        color: '',
        odometer: '',
        odometerUnit: settingsStore.odometerSettings.unit,
        notes: '',
      });
      setError(null);
      vehicleStore.fetchMakes();
    }
  }, [open, vehicleStore]);

  const handleSubmit = async () => {
    if (!formData.make.trim() || !formData.model.trim()) {
      setError('Make and Model are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const newVehicle = await vehicleStore.createVehicle({
        customerIds: [customerId],
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year, 10) : undefined,
        vin: formData.vin || undefined,
        licensePlate: formData.licensePlate || undefined,
        color: formData.color || undefined,
        odometer: formData.odometer ? parseInt(formData.odometer, 10) : undefined,
        notes: formData.notes || undefined,
      });
      
      onClose();
      
      // Optionally navigate to the new vehicle
      if (newVehicle) {
        navigate(`/vehicles/${newVehicle.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Add Vehicle for {customerName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Make"
                fullWidth
                required
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                placeholder="e.g., Toyota, Honda"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Model"
                fullWidth
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g., Camry, Civic"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="Year"
                fullWidth
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="">Not specified</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Color"
                fullWidth
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="License Plate"
                fullWidth
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Odometer"
                type="number"
                fullWidth
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">{formData.odometerUnit}</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Odometer Unit</InputLabel>
                <Select
                  value={formData.odometerUnit}
                  onChange={(e) => setFormData({ ...formData, odometerUnit: e.target.value })}
                  label="Odometer Unit"
                >
                  <MenuItem value="km">km</MenuItem>
                  <MenuItem value="miles">miles</MenuItem>
                  <MenuItem value="hours">hours</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            label="VIN"
            fullWidth
            value={formData.vin}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
            helperText="17-character Vehicle Identification Number"
            inputProps={{ maxLength: 17 }}
          />

          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.make.trim() || !formData.model.trim()}
        >
          {isSubmitting ? <CircularProgress size={20} /> : 'Add Vehicle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// ==================== MAIN EXPORT ====================
export const Customers: React.FC = () => (
  <Routes>
    <Route path="/" element={<CustomerList />} />
    <Route path="/:id" element={<CustomerDetail />} />
  </Routes>
);
