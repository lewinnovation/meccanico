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
  Autocomplete,
  MenuItem,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as VehicleIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Speed as MileageIcon,
  Badge as LicensePlateIcon,
  Palette as ColorIcon,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';
import type { Vehicle, CreateVehicleDto, UpdateVehicleDto, VehicleMake } from '../stores/VehicleStore';
import type { Customer } from '../stores/CustomerStore';

// ==================== VEHICLE FORM ====================
interface VehicleFormData {
  customerIds: string[];
  make: string;
  model: string;
  year: string;
  vin: string;
  licensePlate: string;
  color: string;
  mileage: string;
  notes: string;
}

const defaultFormData: VehicleFormData = {
  customerIds: [],
  make: '',
  model: '',
  year: '',
  vin: '',
  licensePlate: '',
  color: '',
  mileage: '',
  notes: '',
};

interface VehicleFormDialogProps {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
  onSave: (data: CreateVehicleDto | UpdateVehicleDto) => Promise<void>;
  isLoading: boolean;
  preselectedCustomerId?: string;
}

const VehicleFormDialog: React.FC<VehicleFormDialogProps> = observer(({
  open,
  onClose,
  vehicle,
  onSave,
  isLoading,
  preselectedCustomerId,
}) => {
  const { vehicleStore, customerStore } = useStore();
  const [formData, setFormData] = useState<VehicleFormData>(defaultFormData);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [selectedMake, setSelectedMake] = useState<VehicleMake | null>(null);
  const [customModel, setCustomModel] = useState('');
  
  // Inline creation state
  const [addMakeOpen, setAddMakeOpen] = useState(false);
  const [addModelOpen, setAddModelOpen] = useState(false);
  const [newMakeName, setNewMakeName] = useState('');
  const [newMakeCountry, setNewMakeCountry] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [newModelCategory, setNewModelCategory] = useState('');
  const [makeInputValue, setMakeInputValue] = useState('');
  const [modelInputValue, setModelInputValue] = useState('');

  useEffect(() => {
    vehicleStore.fetchMakes();
    customerStore.fetchCustomers();
  }, [vehicleStore, customerStore]);

  // Initialize form when dialog opens or vehicle changes
  useEffect(() => {
    if (!open) return; // Only run when dialog is open
    
    const loadVehicleOwners = async () => {
      if (vehicle) {
        setFormData({
          customerIds: vehicle.owners?.map(o => o.id) || [],
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year?.toString() || '',
          vin: vehicle.vin || '',
          licensePlate: vehicle.licensePlate || '',
          color: vehicle.color || '',
          mileage: vehicle.mileage?.toString() || '',
          notes: vehicle.notes || '',
        });
        // Load full customer details for owners
        if (vehicle.owners && vehicle.owners.length > 0) {
          try {
            const ownerPromises = vehicle.owners.map(owner => 
              customerStore.fetchCustomerById(owner.id).catch(() => null)
            );
            const fullOwners = await Promise.all(ownerPromises);
            const validOwners = fullOwners.filter((c): c is Customer => c !== null);
            setSelectedCustomers(validOwners);
          } catch (err) {
            console.error('Failed to fetch owner details:', err);
            // Fallback to basic owner info
            setSelectedCustomers(vehicle.owners.map(o => ({
              id: o.id,
              code: o.code,
              name: o.name,
              email: null,
              phone: null,
              address: null,
              notes: null,
              createdAt: '',
              updatedAt: '',
            })));
          }
        } else {
          setSelectedCustomers([]);
        }
        // Set selected make
        const make = vehicleStore.makes.find((m) => m.name === vehicle.make);
        setSelectedMake(make || null);
        setCustomModel(vehicle.model);
        setMakeInputValue(vehicle.make);
        setModelInputValue(vehicle.model);
      } else {
        setFormData({
          ...defaultFormData,
          customerIds: preselectedCustomerId ? [preselectedCustomerId] : [],
        });
        if (preselectedCustomerId) {
          const customer = customerStore.customers.find((c) => c.id === preselectedCustomerId);
          setSelectedCustomers(customer ? [customer] : []);
        } else {
          setSelectedCustomers([]);
        }
        setSelectedMake(null);
        setCustomModel('');
        setMakeInputValue('');
        setModelInputValue('');
      }
      setError(null);
    };
    
    loadVehicleOwners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle, open, preselectedCustomerId]); // Intentionally excluding vehicleStore.makes to prevent reset on refresh
  
  // Update selectedMake reference when makes list changes (e.g., after creating a new model)
  useEffect(() => {
    if (selectedMake && vehicleStore.makes.length > 0) {
      const updatedMake = vehicleStore.makes.find((m) => m.id === selectedMake.id);
      if (updatedMake) {
        setSelectedMake(updatedMake);
      }
    }
  }, [vehicleStore.makes, selectedMake?.id]);

  useEffect(() => {
    if (preselectedCustomerId) {
      const customer = customerStore.customers.find((c) => c.id === preselectedCustomerId);
      setSelectedCustomers(customer ? [customer] : []);
    }
  }, [preselectedCustomerId, customerStore.customers]);

  // Update selectedCustomers when formData.customerIds changes
  useEffect(() => {
    if (formData.customerIds.length > 0) {
      const customers = customerStore.customers.filter(c => formData.customerIds.includes(c.id));
      setSelectedCustomers(customers);
    } else {
      setSelectedCustomers([]);
    }
  }, [formData.customerIds, customerStore.customers]);

  const handleMakeChange = (make: VehicleMake | null) => {
    setSelectedMake(make);
    setFormData((prev) => ({
      ...prev,
      make: make?.name || '',
      model: '', // Reset model when make changes
    }));
    setCustomModel('');
    setMakeInputValue(make?.name || '');
    setModelInputValue('');
  };

  const handleModelChange = (modelName: string) => {
    setCustomModel(modelName);
    setFormData((prev) => ({ ...prev, model: modelName }));
  };

  // Check if make exists in the list
  const makeExists = (name: string) => 
    vehicleStore.makes.some((m) => m.name.toLowerCase() === name.toLowerCase());

  // Check if model exists for current make
  const modelExists = (name: string) => 
    availableModels.some((m) => m.name.toLowerCase() === name.toLowerCase());

  // Handle creating a new make
  const handleCreateMake = async () => {
    if (!newMakeName.trim()) return;
    try {
      const newMake = await vehicleStore.createMake(newMakeName.trim(), newMakeCountry.trim() || undefined);
      setSelectedMake(newMake);
      setFormData((prev) => ({ ...prev, make: newMake.name, model: '' }));
      setMakeInputValue(newMake.name);
      setCustomModel('');
      setNewMakeName('');
      setNewMakeCountry('');
      setAddMakeOpen(false);
    } catch (err) {
      console.error('Failed to create make', err);
    }
  };

  // Handle creating a new model
  const handleCreateModel = async () => {
    if (!newModelName.trim() || !selectedMake) return;
    try {
      await vehicleStore.createModel(selectedMake.id, newModelName.trim(), newModelCategory.trim() || undefined);
      // Refresh makes to get the new model
      await vehicleStore.fetchMakes();
      // Find the updated make
      const updatedMake = vehicleStore.makes.find((m) => m.id === selectedMake.id);
      if (updatedMake) {
        setSelectedMake(updatedMake);
      }
      setCustomModel(newModelName.trim());
      setFormData((prev) => ({ ...prev, model: newModelName.trim() }));
      setModelInputValue(newModelName.trim());
      setNewModelName('');
      setNewModelCategory('');
      setAddModelOpen(false);
    } catch (err) {
      console.error('Failed to create model', err);
    }
  };

  // Open add make dialog with pre-filled name
  const openAddMakeDialog = (name: string) => {
    setNewMakeName(name);
    setAddMakeOpen(true);
  };

  // Open add model dialog with pre-filled name
  const openAddModelDialog = (name: string) => {
    setNewModelName(name);
    setAddModelOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.make.trim() || !formData.model.trim()) {
      setError('Make and Model are required');
      return;
    }
    if (!vehicle && formData.customerIds.length === 0) {
      setError('At least one customer is required');
      return;
    }

    try {
      const data: CreateVehicleDto | UpdateVehicleDto = {
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year, 10) : undefined,
        vin: formData.vin || undefined,
        licensePlate: formData.licensePlate || undefined,
        color: formData.color || undefined,
        mileage: formData.mileage ? parseInt(formData.mileage, 10) : undefined,
        notes: formData.notes || undefined,
      };

      if (!vehicle) {
        (data as CreateVehicleDto).customerIds = formData.customerIds;
      }

      await onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vehicle');
    }
  };

  const availableModels = selectedMake?.models || [];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{vehicle ? 'Edit Vehicle' : 'New Vehicle'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Customers (only for new vehicles) */}
          {!vehicle && (
            <Autocomplete
              multiple
              options={customerStore.customers}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={selectedCustomers}
              onChange={(_, newValue) => {
                setSelectedCustomers(newValue);
                setFormData((prev) => ({ ...prev, customerIds: newValue.map(c => c.id) }));
              }}
              disabled={!!preselectedCustomerId}
              renderInput={(params) => (
                <TextField {...params} label="Owners" required placeholder="Select one or more customers" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={`${option.name} (${option.code})`}
                  />
                ))
              }
            />
          )}

          {/* Make */}
          <Autocomplete
            options={vehicleStore.makes}
            getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
            value={selectedMake}
            inputValue={makeInputValue}
            onChange={(_, newValue) => {
              if (typeof newValue === 'string') {
                // User typed a custom value
                setFormData((prev) => ({ ...prev, make: newValue, model: '' }));
                setSelectedMake(null);
                setCustomModel('');
              } else {
                handleMakeChange(newValue);
              }
            }}
            onInputChange={(_, value, reason) => {
              setMakeInputValue(value);
              if (reason === 'input') {
                setFormData((prev) => ({ ...prev, make: value }));
              }
            }}
            freeSolo
            filterOptions={(options, params) => {
              const filtered = options.filter((option) =>
                option.name.toLowerCase().includes(params.inputValue.toLowerCase())
              );
              return filtered;
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography>{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.country || ''}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Make"
                required
                placeholder="Select or type a make"
                inputProps={{ ...params.inputProps, 'data-testid': 'vehicle-make' }}
                helperText={
                  makeInputValue && !makeExists(makeInputValue) && !selectedMake ? (
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" color="warning.main">
                        "{makeInputValue}" not found.
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => openAddMakeDialog(makeInputValue)}
                        sx={{ minWidth: 'auto', p: 0, textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        Create it?
                      </Button>
                    </Box>
                  ) : undefined
                }
              />
            )}
          />

          {/* Model */}
          <Autocomplete
            options={availableModels.map((m) => m.name)}
            value={customModel}
            inputValue={modelInputValue}
            onChange={(_, newValue) => handleModelChange(newValue || '')}
            onInputChange={(_, value, reason) => {
              setModelInputValue(value);
              if (reason === 'input') {
                handleModelChange(value);
              }
            }}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                label="Model"
                required
                placeholder="Select or type a model"
                inputProps={{ ...params.inputProps, 'data-testid': 'vehicle-model' }}
                helperText={
                  modelInputValue && !modelExists(modelInputValue) && selectedMake ? (
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" color="warning.main">
                        "{modelInputValue}" not found for {selectedMake.name}.
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => openAddModelDialog(modelInputValue)}
                        sx={{ minWidth: 'auto', p: 0, textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        Add it?
                      </Button>
                    </Box>
                  ) : modelInputValue && !selectedMake && formData.make ? (
                    <Typography variant="caption" color="text.secondary">
                      Using custom make "{formData.make}"
                    </Typography>
                  ) : undefined
                }
              />
            )}
          />

          <Grid container spacing={2}>
            {/* Year */}
            <Grid item xs={6}>
              <TextField
                select
                label="Year"
                fullWidth
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                inputProps={{ 'data-testid': 'vehicle-year' }}
              >
                <MenuItem value="">Not specified</MenuItem>
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year.toString()}>
                    {year}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Color */}
            <Grid item xs={6}>
              <TextField
                label="Color"
                fullWidth
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                inputProps={{ 'data-testid': 'vehicle-color' }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {/* License Plate */}
            <Grid item xs={6}>
              <TextField
                label="License Plate"
                fullWidth
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                inputProps={{ 'data-testid': 'vehicle-license-plate' }}
              />
            </Grid>

            {/* Mileage */}
            <Grid item xs={6}>
              <TextField
                label="Mileage"
                type="number"
                fullWidth
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">km</InputAdornment>,
                }}
                inputProps={{ 'data-testid': 'vehicle-mileage' }}
              />
            </Grid>
          </Grid>

          {/* VIN */}
          <TextField
            label="VIN"
            fullWidth
            value={formData.vin}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
            helperText="17-character Vehicle Identification Number"
            inputProps={{ maxLength: 17, 'data-testid': 'vehicle-vin' }}
          />

          {/* Notes */}
          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            inputProps={{ 'data-testid': 'vehicle-notes' }}
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
          disabled={isLoading || !formData.make.trim() || !formData.model.trim()}
        >
          {isLoading ? <CircularProgress size={20} /> : vehicle ? 'Save' : 'Create'}
        </Button>
      </DialogActions>

      {/* Add Make Dialog */}
      <Dialog 
        open={addMakeOpen} 
        onClose={() => setAddMakeOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { zIndex: 1400 } }}
      >
        <DialogTitle>Add New Vehicle Make</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Make Name"
              fullWidth
              value={newMakeName}
              onChange={(e) => setNewMakeName(e.target.value)}
              placeholder="e.g., Toyota, Ford, BMW"
              autoFocus
            />
            <TextField
              label="Country (optional)"
              fullWidth
              value={newMakeCountry}
              onChange={(e) => setNewMakeCountry(e.target.value)}
              placeholder="e.g., Japan, USA, Germany"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMakeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateMake} disabled={!newMakeName.trim()}>
            Create Make
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Model Dialog */}
      <Dialog 
        open={addModelOpen} 
        onClose={() => setAddModelOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { zIndex: 1400 } }}
      >
        <DialogTitle>
          Add New Model to {selectedMake?.name || formData.make}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Model Name"
              fullWidth
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="e.g., Camry, F-150, 3 Series"
              autoFocus
            />
            <TextField
              label="Category (optional)"
              fullWidth
              value={newModelCategory}
              onChange={(e) => setNewModelCategory(e.target.value)}
              placeholder="e.g., Sedan, SUV, Truck"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModelOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateModel} 
            disabled={!newModelName.trim() || !selectedMake}
          >
            Create Model
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
});

// ==================== DELETE CONFIRMATION ====================
interface DeleteConfirmDialogProps {
  open: boolean;
  vehicleInfo: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  vehicleInfo,
  onClose,
  onConfirm,
  isLoading,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Delete Vehicle?</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete <strong>{vehicleInfo}</strong>? This action cannot be undone.
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

// ==================== VEHICLE LIST ====================
const VehicleList: React.FC = observer(() => {
  const { vehicleStore } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    vehicleStore.fetchVehicles();
  }, [vehicleStore]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    vehicleStore.setSearch(value);
    setPage(0);
    vehicleStore.fetchVehicles();
  };

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVehicle(vehicle);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingVehicle(null);
  };

  const handleSave = async (data: CreateVehicleDto | UpdateVehicleDto) => {
    setIsSubmitting(true);
    try {
      if (editingVehicle) {
        await vehicleStore.updateVehicle(editingVehicle.id, data as UpdateVehicleDto);
      } else {
        await vehicleStore.createVehicle(data as CreateVehicleDto);
      }
      handleCloseForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteVehicle) return;
    setIsSubmitting(true);
    try {
      await vehicleStore.deleteVehicle(deleteVehicle.id);
      setDeleteVehicle(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowClick = (vehicle: Vehicle) => {
    navigate(`/vehicles/${vehicle.id}`);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    vehicleStore.setPage(newPage + 1);
    vehicleStore.fetchVehicles();
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
          Vehicles
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          data-testid="add-vehicle"
        >
          New Vehicle
        </Button>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search vehicles by make, model, plate, VIN..."
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
      {vehicleStore.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : vehicleStore.vehicles.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <VehicleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {search ? 'No vehicles found' : 'No vehicles yet'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {search
                ? 'Try adjusting your search criteria.'
                : 'Add your first vehicle to start tracking service history.'}
            </Typography>
            {!search && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                Add Vehicle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Vehicle Table */
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>License Plate</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Mileage</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicleStore.vehicles.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(vehicle)}
                    data-testid="vehicle-row"
                  >
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" data-testid="vehicle-code">
                        {vehicle.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>
                        {vehicle.year && `${vehicle.year} `}
                        {vehicle.make} {vehicle.model}
                      </Typography>
                      {vehicle.color && (
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.color}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography>
                        {vehicle.licensePlate || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {vehicle.owners && vehicle.owners.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {vehicle.owners.slice(0, 2).map((owner) => (
                            <Link
                              key={owner.id}
                              href={`/customers/${owner.id}`}
                              onClick={(e) => e.stopPropagation()}
                              sx={{ textDecoration: 'none' }}
                            >
                              <Chip
                                label={owner.name}
                                size="small"
                                sx={{ cursor: 'pointer' }}
                              />
                            </Link>
                          ))}
                          {vehicle.owners.length > 2 && (
                            <Chip
                              label={`+${vehicle.owners.length - 2} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography color="text.secondary">
                        {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenEdit(vehicle, e)}
                          data-testid="edit-vehicle"
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
                            setDeleteVehicle(vehicle);
                          }}
                          data-testid="delete-vehicle"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={vehicleStore.total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            data-testid="vehicle-count"
          />
        </Paper>
      )}

      {/* Form Dialog */}
      <VehicleFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        vehicle={editingVehicle}
        onSave={handleSave}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteVehicle}
        vehicleInfo={deleteVehicle ? `${deleteVehicle.make} ${deleteVehicle.model}` : ''}
        onClose={() => setDeleteVehicle(null)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </Box>
  );
});

// ==================== VEHICLE DETAIL ====================
const VehicleDetail: React.FC = observer(() => {
  const { vehicleStore } = useStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      vehicleStore.fetchVehicleById(id).catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load vehicle');
      });
    }
  }, [id, vehicleStore]);

  const vehicle = vehicleStore.selectedVehicle;

  const handleSave = async (data: CreateVehicleDto | UpdateVehicleDto) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await vehicleStore.updateVehicle(id, data as UpdateVehicleDto);
      setFormOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await vehicleStore.deleteVehicle(id);
      navigate('/vehicles');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (vehicleStore.isLoading && !vehicle) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/vehicles')} sx={{ mb: 2 }}>
          Back to Vehicles
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!vehicle) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/vehicles')} sx={{ mb: 2 }}>
          Back to Vehicles
        </Button>
        <Alert severity="warning">Vehicle not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/vehicles')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={600}>
            {vehicle.year && `${vehicle.year} `}
            {vehicle.make} {vehicle.model}
          </Typography>
          <Chip
            label={vehicle.code}
            size="small"
            sx={{ mt: 0.5, fontFamily: 'monospace' }}
            data-testid="vehicle-code"
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setFormOpen(true)}
          data-testid="edit-vehicle"
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteOpen(true)}
          data-testid="delete-vehicle"
        >
          Delete
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Vehicle Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vehicle Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LicensePlateIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      License Plate
                    </Typography>
                    <Typography>
                      {vehicle.licensePlate || <em style={{ color: 'gray' }}>Not provided</em>}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <VehicleIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      VIN
                    </Typography>
                    <Typography fontFamily="monospace">
                      {vehicle.vin || <em style={{ color: 'gray' }}>Not provided</em>}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ColorIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Color
                    </Typography>
                    <Typography>
                      {vehicle.color || <em style={{ color: 'gray' }}>Not provided</em>}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MileageIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Current Mileage
                    </Typography>
                    <Typography>
                      {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : <em style={{ color: 'gray' }}>Not recorded</em>}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Owners */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Owners
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {vehicle.owners && vehicle.owners.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {vehicle.owners.map((owner, index) => {
                    const isPrimary = vehicle.vehicleOwners?.find(vo => vo.customerId === owner.id)?.isPrimary || index === 0;
                    return (
                      <Box key={owner.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PersonIcon color="action" sx={{ fontSize: 40 }} />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight={500}>{owner.name}</Typography>
                            {isPrimary && (
                              <Chip label="Primary" size="small" color="primary" />
                            )}
                          </Box>
                          <Chip
                            label={owner.code}
                            size="small"
                            sx={{ fontFamily: 'monospace', mt: 0.5 }}
                            onClick={() => navigate(`/customers/${owner.id}`)}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography color="text.secondary">No owners assigned</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography color={vehicle.notes ? 'text.primary' : 'text.secondary'}>
                {vehicle.notes || <em>No notes</em>}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Service History Placeholder */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Service History</Typography>
                <Button variant="outlined" size="small">
                  New Job
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <VehicleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">
                  No service history yet
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Form Dialog */}
      <VehicleFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        vehicle={vehicle}
        onSave={handleSave}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteOpen}
        vehicleInfo={`${vehicle.make} ${vehicle.model}`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </Box>
  );
});

// ==================== MAIN EXPORT ====================
export const Vehicles: React.FC = () => (
  <Routes>
    <Route path="/" element={<VehicleList />} />
    <Route path="/:id" element={<VehicleDetail />} />
  </Routes>
);

