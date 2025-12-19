import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  MoreVert as MoreIcon,
  ContentCopy as DuplicateIcon,
  Assignment as TemplateIcon,
  CheckCircle as ApproveIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Receipt as InvoiceIcon,
  Paid as PaidIcon,
  Cancel as CancelIcon,
  ThumbDown as DeclineIcon,
  Work as JobIcon,
  Print as PrintIcon,
  Description as EstimateIcon,
  DragIndicator as DragIcon,
  DirectionsCar as VehicleIcon,
  OpenInNew as OpenIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';
import type { JobStatus, LineItemType, CreateLineItemDto, LineItem, Job } from '../stores/JobStore';
import type { Template } from '../stores/TemplateStore';
import type { Customer as CustomerType } from '../stores/CustomerStore';
import type { Vehicle } from '../stores/VehicleStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Status colors and labels
const statusConfig: Record<JobStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' }> = {
  ESTIMATE: { label: 'Estimate', color: 'default' },
  APPROVED: { label: 'Approved', color: 'info' },
  IN_PROGRESS: { label: 'In Progress', color: 'primary' },
  ON_HOLD: { label: 'On Hold', color: 'warning' },
  INVOICED: { label: 'Invoiced', color: 'secondary' },
  PAID: { label: 'Paid', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
  DECLINED: { label: 'Declined', color: 'error' },
  DISPUTED: { label: 'Disputed', color: 'warning' },
};

// Line item type colors (faint backgrounds)
const lineItemTypeColors: Record<LineItemType, string> = {
  INVENTORY: 'rgba(25, 118, 210, 0.04)', // Blue
  LABOUR: 'rgba(245, 124, 0, 0.04)',     // Orange
  SERVICE: 'rgba(56, 142, 60, 0.04)',    // Green
  TEXT: 'transparent',                    // No background for text
};

// Valid status transitions
const statusTransitions: Record<JobStatus, JobStatus[]> = {
  ESTIMATE: ['APPROVED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'DECLINED'],
  IN_PROGRESS: ['ON_HOLD', 'INVOICED'],
  ON_HOLD: ['IN_PROGRESS'],
  INVOICED: ['PAID', 'DISPUTED'],
  PAID: [],
  CANCELLED: [],
  DECLINED: [],
  DISPUTED: ['PAID'],
};

// ==================== SORTABLE LINE ITEM ROW ====================
interface SortableLineItemRowProps {
  item: LineItem;
  canEdit: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: { description?: string; quantity?: number; unitPrice?: number }) => void;
  formatCurrency: (amount: number) => string;
  formatQuantity: (qty: number) => string;
  currencySymbol: string;
}

const SortableLineItemRow: React.FC<SortableLineItemRowProps> = ({ item, canEdit, onDelete, onUpdate, formatCurrency, formatQuantity, currencySymbol }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const [editingField, setEditingField] = useState<'description' | 'quantity' | 'unitPrice' | null>(null);
  const [editValue, setEditValue] = useState('');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: lineItemTypeColors[item.type],
  };

  const isTextType = item.type === 'TEXT';

  const startEditing = (field: 'description' | 'quantity' | 'unitPrice') => {
    if (!canEdit) return;
    setEditingField(field);
    if (field === 'description') {
      setEditValue(item.description);
    } else if (field === 'quantity') {
      setEditValue(item.quantity.toString());
    } else {
      setEditValue(item.unitPrice.toString());
    }
  };

  const handleSave = () => {
    if (!editingField) return;
    
    if (editingField === 'description' && editValue.trim() !== item.description) {
      onUpdate(item.id, { description: editValue.trim() });
    } else if (editingField === 'quantity') {
      const newQty = parseFloat(editValue);
      if (!isNaN(newQty) && newQty !== item.quantity) {
        onUpdate(item.id, { quantity: newQty });
      }
    } else if (editingField === 'unitPrice') {
      const newPrice = parseFloat(editValue);
      if (!isNaN(newPrice) && newPrice !== item.unitPrice) {
        onUpdate(item.id, { unitPrice: newPrice });
      }
    }
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      {canEdit && (
        <TableCell sx={{ width: 40, cursor: 'grab' }} {...listeners}>
          <DragIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        </TableCell>
      )}
      <TableCell
        onClick={() => startEditing('description')}
        sx={{ cursor: canEdit ? 'pointer' : 'default' }}
      >
        {editingField === 'description' ? (
          <TextField
            size="small"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            fullWidth
            variant="standard"
          />
        ) : (
          <Typography sx={{ '&:hover': canEdit ? { bgcolor: 'action.hover', borderRadius: 1 } : {} }}>
            {item.description}
          </Typography>
        )}
      </TableCell>
      <TableCell
        align="right"
        onClick={() => !isTextType && startEditing('quantity')}
        sx={{ cursor: canEdit && !isTextType ? 'pointer' : 'default' }}
      >
        {!isTextType && (
          editingField === 'quantity' ? (
            <TextField
              size="small"
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              variant="standard"
              inputProps={{ min: 0, step: 1, style: { textAlign: 'right' } }}
              sx={{ width: 60 }}
            />
          ) : (
            <Typography sx={{ '&:hover': canEdit ? { bgcolor: 'action.hover', borderRadius: 1 } : {} }}>
              {formatQuantity(item.quantity)}
            </Typography>
          )
        )}
      </TableCell>
      <TableCell
        align="right"
        onClick={() => !isTextType && startEditing('unitPrice')}
        sx={{ cursor: canEdit && !isTextType ? 'pointer' : 'default' }}
      >
        {!isTextType && (
          editingField === 'unitPrice' ? (
            <TextField
              size="small"
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              variant="standard"
              InputProps={{ startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> }}
              inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
              sx={{ width: 80 }}
            />
          ) : (
            <Typography sx={{ '&:hover': canEdit ? { bgcolor: 'action.hover', borderRadius: 1 } : {} }}>
              {formatCurrency(item.unitPrice)}
            </Typography>
          )
        )}
      </TableCell>
      <TableCell align="right">
        {!isTextType && formatCurrency(item.quantity * item.unitPrice)}
      </TableCell>
      {canEdit && (
        <TableCell sx={{ width: 50 }}>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(item.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      )}
    </TableRow>
  );
};

// ==================== JOB LIST ====================
const JobList: React.FC = observer(() => {
  const { jobStore, settingsStore } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    jobStore.fetchJobs();
  }, [jobStore]);

  const handleTabChange = (_: unknown, newValue: number) => {
    setTab(newValue);
    const statusMap: (JobStatus | null)[] = [null, 'ESTIMATE', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'INVOICED', 'PAID'];
    jobStore.setStatusFilter(statusMap[newValue]);
    jobStore.fetchJobs();
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    jobStore.setSearch(value);
    jobStore.fetchJobs();
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  // Calculate job totals
  const calculateJobTotals = (job: Job) => {
    const subtotal = job.lineItems?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0;
    let discount = 0;
    if (job.discountPercent > 0) {
      discount = subtotal * (job.discountPercent / 100);
    } else {
      discount = job.discountAmount || 0;
    }
    const afterDiscount = subtotal - discount;
    const gst = afterDiscount * (job.taxRate / 100);
    const total = afterDiscount + gst;
    return { subtotal: afterDiscount, gst, total };
  };

  const formatCurrency = (amount: number) => `${settingsStore.currencySettings.symbol || '$'}${amount.toFixed(2)}`;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Jobs
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/jobs/new')}>
          New Job
        </Button>
      </Box>

      {/* Status Tabs */}
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="All" />
        <Tab label="Estimates" />
        <Tab label="Approved" />
        <Tab label="In Progress" />
        <Tab label="On Hold" />
        <Tab label="Invoiced" />
        <Tab label="Paid" />
      </Tabs>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search jobs by code, customer, or vehicle..."
        sx={{ mb: 3 }}
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
      />

      {jobStore.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {jobStore.error}
        </Alert>
      )}

      {/* Job List */}
      {jobStore.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : jobStore.jobs.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <JobIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No jobs yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create your first job to start managing your work orders.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/jobs/new')}>
              Create Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Excl. GST</TableCell>
                <TableCell align="right">GST</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobStore.jobs.map((job) => (
                <TableRow key={job.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {job.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{job.customer?.name || 'Unknown'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.customer?.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {job.vehicle ? (
                      <>
                        <Typography fontWeight={500}>
                          {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                        </Typography>
                        {job.vehicle.licensePlate && (
                          <Typography variant="caption" color="text.secondary">
                            {job.vehicle.licensePlate}
                          </Typography>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusConfig[job.status].label}
                      color={statusConfig[job.status].color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{formatCurrency(calculateJobTotals(job).subtotal)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">{formatCurrency(calculateJobTotals(job).gst)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={500}>{formatCurrency(calculateJobTotals(job).total)}</Typography>
                  </TableCell>
                  <TableCell>{formatDate(job.createdAt)}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => navigate(`/jobs/${job.id}`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
});

// ==================== NEW JOB ====================
interface CustomerWithVehicles extends CustomerType {
  vehicles?: Array<{
    id: string;
    code: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string | null;
  }>;
}

interface VehicleOption {
  id: string;
  code: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string | null;
}

type SearchResultType = 'customer' | 'vehicle';

interface SearchResult {
  type: SearchResultType;
  customer?: CustomerWithVehicles;
  vehicle?: Vehicle & { customer?: CustomerWithVehicles };
}

// Pattern detection utilities
const detectSearchType = (input: string): 'vin' | 'licensePlate' | 'email' | 'phone' | 'name' => {
  const trimmed = input.trim();
  
  // VIN: exactly 17 alphanumeric characters
  if (/^[A-Z0-9]{17}$/i.test(trimmed)) {
    return 'vin';
  }
  
  // License plate: 2-8 alphanumeric characters, may contain spaces/hyphens
  if (/^[A-Z0-9\s-]{2,8}$/i.test(trimmed) && trimmed.length <= 8) {
    return 'licensePlate';
  }
  
  // Email: contains @ symbol
  if (trimmed.includes('@')) {
    return 'email';
  }
  
  // Phone: mostly digits with optional formatting
  const digitsOnly = trimmed.replace(/[\s\-()]/g, '');
  if (/^\d{7,15}$/.test(digitsOnly)) {
    return 'phone';
  }
  
  // Default to name
  return 'name';
};

const NewJob: React.FC = observer(() => {
  const { jobStore, customerStore, vehicleStore, settingsStore } = useStore();
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithVehicles | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createVehicleOpen, setCreateVehicleOpen] = useState(false);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  
  // Unified search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    vehicleStore.fetchMakes();
    settingsStore.fetchSettings();
  }, [vehicleStore, settingsStore]);

  // Auto-focus search input when component mounts and no customer/vehicle selected
  useEffect(() => {
    if (!selectedCustomer && !selectedVehicle && searchInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [selectedCustomer, selectedVehicle]);

  // Fetch vehicles when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerVehicles([]);
      // Capture current selectedVehicle to check after fetching
      const currentVehicle = selectedVehicle;
      vehicleStore.fetchVehiclesByCustomer(selectedCustomer.id)
        .then((vehicles) => {
          const vehicleOptions = vehicles.map(v => ({
            id: v.id,
            code: v.code,
            make: v.make,
            model: v.model,
            year: v.year || 0,
            licensePlate: v.licensePlate,
          }));
          setCustomerVehicles(vehicleOptions);
          
          // If we had a selected vehicle, verify it belongs to this customer
          // Only clear it if it doesn't belong to this customer
          if (currentVehicle && currentVehicle.id) {
            const vehicleBelongsToCustomer = vehicleOptions.some(v => v.id === currentVehicle.id);
            if (!vehicleBelongsToCustomer) {
              setSelectedVehicle(null);
            }
            // If it does belong, keep it (don't clear)
          }
        })
        .catch(() => {
          setError('Failed to fetch vehicles for customer');
        });
    } else {
      setCustomerVehicles([]);
      setSelectedVehicle(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer, vehicleStore]);

  // Debounced unified search - using same logic as CommandPalette
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchInputValue.trim() || searchInputValue.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      await performSearch(searchInputValue.trim());
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInputValue]);

  const performSearch = async (query: string) => {
    try {
      const results: SearchResult[] = [];

      // Determine what to search for based on current state
      // Step 1: Search both if nothing selected
      // Step 2: Search only the missing one
      const shouldSearchVehicles = !selectedVehicle;
      const shouldSearchCustomers = !selectedCustomer;

      // Search customers if needed - same as CommandPalette
      if (shouldSearchCustomers) {
        try {
          await customerStore.fetchCustomers(query, 1);
          const customers = customerStore.customers.slice(0, 10) as CustomerWithVehicles[];
          customers.forEach(customer => {
            results.push({
              type: 'customer',
              customer,
            });
          });
        } catch {
          // Error searching customers
        }
      }

      // Search vehicles if needed - same as CommandPalette
      if (shouldSearchVehicles) {
        try {
          const originalLimit = vehicleStore.limit;
          const originalPage = vehicleStore.page;
          const originalSearch = vehicleStore.search;
          vehicleStore.setSearch(query);
          vehicleStore.setPage(1);
          vehicleStore.limit = 10;
          await vehicleStore.fetchVehicles();
          const vehicles = vehicleStore.vehicles.slice(0, 10);
          vehicles.forEach(vehicle => {
            results.push({
              type: 'vehicle',
              vehicle: vehicle as Vehicle & { customer: CustomerWithVehicles },
            });
          });
          // Restore vehicle store state
          vehicleStore.limit = originalLimit;
          vehicleStore.setPage(originalPage);
          vehicleStore.setSearch(originalSearch);
        } catch {
          // Error searching vehicles - restore defaults
          vehicleStore.limit = 50;
          vehicleStore.setPage(1);
          vehicleStore.setSearch('');
        }
      }

      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = async (result: SearchResult) => {
    if (result.type === 'vehicle' && result.vehicle) {
      // Auto-populate vehicle first, then customer if available
      const vehicle = result.vehicle;
      
      setSelectedVehicle({
        id: vehicle.id,
        code: vehicle.code,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year || 0,
        licensePlate: vehicle.licensePlate,
      });
      
      // Always try to populate customer if vehicle has one
      // Fetch full customer details to ensure we have all required fields
      if (vehicle.customer && vehicle.customer.id) {
        try {
          const fullCustomer = await customerStore.fetchCustomerById(vehicle.customer.id);
          if (fullCustomer) {
            // Use the returned customer object
            setSelectedCustomer(fullCustomer as CustomerWithVehicles);
          } else if (customerStore.selectedCustomer) {
            // Fallback to store's selectedCustomer if return value is undefined
            setSelectedCustomer(customerStore.selectedCustomer as CustomerWithVehicles);
          }
        } catch (err) {
          console.error('Failed to fetch customer:', err);
          // If fetch fails, try to use the customer from vehicle if it has required fields
          const customer = vehicle.customer as any;
          if (customer && customer.id && customer.name) {
            setSelectedCustomer(customer as CustomerWithVehicles);
          }
        }
      }
      
      setSearchInputValue('');
      setSearchResults([]);
    } else if (result.type === 'customer' && result.customer) {
      // Auto-populate customer and load vehicles
      setSelectedCustomer(result.customer);
      setSearchInputValue('');
      setSearchResults([]);
    }
  };

  const handleCreate = async () => {
    if (!selectedCustomer || !selectedVehicle) return;

    setLoading(true);
    setError(null);

    try {
      // Get default tax rate from settings
      const defaultTaxRate = settingsStore.taxSettings.defaultRate || 0;
      
      const job = await jobStore.createJob({
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        notes: notes || undefined,
        taxRate: defaultTaxRate,
      });

      if (job) {
        navigate(`/jobs/${job.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
      setLoading(false);
    }
  };

  const handleVehicleCreated = (vehicle: VehicleOption) => {
    if (selectedCustomer) {
      // If customer already selected, just add vehicle to list and select it
      setCustomerVehicles(prev => [...prev, vehicle]);
    }
    setSelectedVehicle(vehicle);
    setCreateVehicleOpen(false);
    setSearchInputValue('');
    setSearchResults([]);
  };

  const handleCustomerCreated = async (customer: CustomerWithVehicles) => {
    setSelectedCustomer(customer);
    setCreateCustomerOpen(false);
    setSearchInputValue('');
    setSearchResults([]);
    // If vehicle was already selected, we're ready to create job
  };

  const handleClear = () => {
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setCustomerVehicles([]);
    setSearchInputValue('');
    setSearchResults([]);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/jobs')} aria-label="Back">
          <BackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight={600}>
          New Job
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Step 1: Search for Vehicle OR Customer */}
            {!selectedCustomer && !selectedVehicle && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Step 1: Find or create a vehicle or customer
                </Typography>
                <Autocomplete
                  freeSolo
                  open={searchInputValue.trim().length >= 3}
                  onOpen={() => {}}
                  onClose={() => {}}
                  options={searchResults}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    if (option.type === 'vehicle' && option.vehicle) {
                      const v = option.vehicle;
                      return `${v.make} ${v.model}${v.year ? ` (${v.year})` : ''}${v.licensePlate ? ` - ${v.licensePlate}` : ''}${v.vin ? ` [VIN: ${v.vin}]` : ''}`;
                    }
                    if (option.type === 'customer' && option.customer) {
                      return `${option.customer.name}${option.customer.phone ? ` - ${option.customer.phone}` : ''}${option.customer.email ? ` - ${option.customer.email}` : ''}`;
                    }
                    return '';
                  }}
                  inputValue={searchInputValue}
                  onInputChange={(_, value) => {
                    setSearchInputValue(value);
                  }}
                  onChange={(_, value) => {
                    if (value && typeof value !== 'string') {
                      handleSelectResult(value);
                    }
                  }}
                  loading={isSearching}
                  renderInput={(params) => {
                    const inputRef = (input: HTMLInputElement | null) => {
                      searchInputRef.current = input;
                      if (params.inputProps?.ref) {
                        if (typeof params.inputProps.ref === 'function') {
                          params.inputProps.ref(input);
                        } else if (params.inputProps.ref) {
                          (params.inputProps.ref as React.MutableRefObject<HTMLInputElement | null>).current = input;
                        }
                      }
                    };
                    return (
                      <TextField
                        {...params}
                        inputRef={inputRef}
                        label="Search by customer name, phone, email, or vehicle registration/VIN"
                        placeholder="Type customer name, phone, email, license plate, or VIN..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    );
                  }}
                renderOption={(props, option) => {
                  if (typeof option === 'string') return null;
                  return (
                    <Box component="li" {...props} key={option.type === 'vehicle' ? option.vehicle?.id : option.customer?.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Chip
                          label={option.type === 'vehicle' ? 'Vehicle' : 'Customer'}
                          size="small"
                          color={option.type === 'vehicle' ? 'primary' : 'secondary'}
                        />
                        <Box sx={{ flex: 1 }}>
                          {option.type === 'vehicle' && option.vehicle ? (
                            <>
                              <Typography variant="body2" fontWeight={500}>
                                {option.vehicle.make} {option.vehicle.model}
                                {option.vehicle.year ? ` (${option.vehicle.year})` : ''}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.vehicle.licensePlate && `Plate: ${option.vehicle.licensePlate}`}
                                {option.vehicle.vin && ` • VIN: ${option.vehicle.vin}`}
                                {option.vehicle.customer && ` • Customer: ${option.vehicle.customer.name}`}
                              </Typography>
                            </>
                          ) : option.type === 'customer' && option.customer ? (
                            <>
                              <Typography variant="body2" fontWeight={500}>
                                {option.customer.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.customer.phone && `Phone: ${option.customer.phone}`}
                                {option.customer.email && ` • Email: ${option.customer.email}`}
                              </Typography>
                            </>
                          ) : null}
                        </Box>
                      </Box>
                    </Box>
                  );
                }}
                  noOptionsText={
                    searchInputValue.trim() ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          No results found
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              const searchType = detectSearchType(searchInputValue);
                              if (searchType === 'vin' || searchType === 'licensePlate') {
                                setCreateVehicleOpen(true);
                              } else {
                                setCreateCustomerOpen(true);
                              }
                            }}
                            fullWidth
                          >
                            Create {detectSearchType(searchInputValue) === 'vin' || detectSearchType(searchInputValue) === 'licensePlate' ? 'Vehicle' : 'Customer'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              const searchType = detectSearchType(searchInputValue);
                              if (searchType === 'vin' || searchType === 'licensePlate') {
                                setCreateCustomerOpen(true);
                              } else {
                                setCreateVehicleOpen(true);
                              }
                            }}
                            fullWidth
                          >
                            Create {detectSearchType(searchInputValue) === 'vin' || detectSearchType(searchInputValue) === 'licensePlate' ? 'Customer' : 'Vehicle'}
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      'Start typing to search...'
                    )
                  }
                />
              </Box>
            )}

            {/* Step 2: If vehicle selected first, find/create customer */}
            {selectedVehicle && !selectedCustomer && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Step 2: Find or create the customer for this vehicle
                </Typography>
                <Autocomplete
                  freeSolo
                  options={searchResults.filter(r => r.type === 'customer')}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    if (option.type === 'customer' && option.customer) {
                      return `${option.customer.name}${option.customer.phone ? ` - ${option.customer.phone}` : ''}${option.customer.email ? ` - ${option.customer.email}` : ''}`;
                    }
                    return '';
                  }}
                  inputValue={searchInputValue}
                  onInputChange={(_, value) => {
                    setSearchInputValue(value);
                  }}
                  onChange={(_, value) => {
                    if (value && typeof value !== 'string' && value.type === 'customer') {
                      setSelectedCustomer(value.customer!);
                      setSearchInputValue('');
                      setSearchResults([]);
                    }
                  }}
                  loading={isSearching}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search for customer"
                      placeholder="Type customer name, phone, or email..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    if (typeof option === 'string' || option.type !== 'customer') return null;
                    const customer = option.customer!;
                    return (
                      <Box component="li" {...props} key={customer.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <Chip label="Customer" size="small" color="secondary" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer.phone && `Phone: ${customer.phone}`}
                              {customer.email && ` • Email: ${customer.email}`}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  }}
                  noOptionsText={
                    searchInputValue.trim() ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          No customer found
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => setCreateCustomerOpen(true)}
                        >
                          Create New Customer
                        </Button>
                      </Box>
                    ) : (
                      'Start typing to search for customer...'
                    )
                  }
                />
              </Box>
            )}

            {/* Step 2: If customer selected first, find/create vehicle */}
            {selectedCustomer && !selectedVehicle && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Step 2: Find or create a vehicle for this customer
                </Typography>
                <Autocomplete
                  freeSolo
                  options={searchResults.filter(r => r.type === 'vehicle')}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    if (option.type === 'vehicle' && option.vehicle) {
                      const v = option.vehicle;
                      return `${v.make} ${v.model}${v.year ? ` (${v.year})` : ''}${v.licensePlate ? ` - ${v.licensePlate}` : ''}`;
                    }
                    return '';
                  }}
                  inputValue={searchInputValue}
                  onInputChange={(_, value) => {
                    setSearchInputValue(value);
                  }}
                  onChange={(_, value) => {
                    if (value && typeof value !== 'string' && value.type === 'vehicle') {
                      const vehicle = value.vehicle!;
                      setSelectedVehicle({
                        id: vehicle.id,
                        code: vehicle.code,
                        make: vehicle.make,
                        model: vehicle.model,
                        year: vehicle.year || 0,
                        licensePlate: vehicle.licensePlate,
                      });
                      setSearchInputValue('');
                      setSearchResults([]);
                    }
                  }}
                  loading={isSearching}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search for vehicle"
                      placeholder="Type vehicle make, model, license plate, or VIN..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    if (typeof option === 'string' || option.type !== 'vehicle') return null;
                    const vehicle = option.vehicle!;
                    return (
                      <Box component="li" {...props} key={vehicle.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <Chip label="Vehicle" size="small" color="primary" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {vehicle.make} {vehicle.model}
                              {vehicle.year ? ` (${vehicle.year})` : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {vehicle.licensePlate && `Plate: ${vehicle.licensePlate}`}
                              {vehicle.vin && ` • VIN: ${vehicle.vin}`}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  }}
                  noOptionsText={
                    searchInputValue.trim() ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          No vehicle found
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => setCreateVehicleOpen(true)}
                        >
                          Create New Vehicle
                        </Button>
                      </Box>
                    ) : (
                      'Start typing to search for vehicle...'
                    )
                  }
                />
                
                {/* Also show customer's existing vehicles */}
                {customerVehicles.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Or select from existing vehicles:
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Existing Vehicles</InputLabel>
                      <Select
                        value={selectedVehicle ? (selectedVehicle as VehicleOption).id : ''}
                        label="Existing Vehicles"
                        onChange={(e) => {
                          const vehicleId: string = e.target.value;
                          const vehicle = customerVehicles.find((v) => v.id === vehicleId);
                          if (vehicle) {
                            setSelectedVehicle(vehicle);
                          }
                        }}
                      >
                        {customerVehicles.map((v) => (
                          <MenuItem key={v.id} value={v.id}>
                            {v.year ? v.year : ''} {v.make} {v.model} {v.licensePlate ? `(${v.licensePlate})` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
            )}

            {/* Selected Customer and Vehicle Display */}
            {(selectedCustomer || selectedVehicle) && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedCustomer && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Chip label="Customer" color="secondary" size="small" />
                    <Typography variant="body1" sx={{ flex: 1 }}>
                      {selectedCustomer.name}
                      {selectedCustomer.phone && ` • ${selectedCustomer.phone}`}
                      {selectedCustomer.email && ` • ${selectedCustomer.email}`}
                    </Typography>
                    <IconButton size="small" onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerVehicles([]);
                    }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}

                {selectedVehicle && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Chip label="Vehicle" color="primary" size="small" />
                    <Typography variant="body1" sx={{ flex: 1 }}>
                      {selectedVehicle.year ? `${selectedVehicle.year} ` : ''}
                      {selectedVehicle.make} {selectedVehicle.model}
                      {selectedVehicle.licensePlate && ` (${selectedVehicle.licensePlate})`}
                    </Typography>
                    <IconButton size="small" onClick={() => setSelectedVehicle(null)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}

                {selectedCustomer && selectedVehicle && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Ready to create job! Both customer and vehicle are selected.
                  </Alert>
                )}

                {(selectedCustomer || selectedVehicle) && (
                  <Button size="small" onClick={handleClear} sx={{ alignSelf: 'flex-start' }}>
                    Clear All
                  </Button>
                )}
              </Box>
            )}

            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/jobs')}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleCreate}
                disabled={loading || !selectedCustomer || !selectedVehicle}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Job'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Create Customer Dialog */}
      <CreateCustomerDialog
        open={createCustomerOpen}
        onClose={() => setCreateCustomerOpen(false)}
        onCreated={handleCustomerCreated}
        prefillData={searchInputValue}
      />

      {/* Create Vehicle Dialog */}
      <CreateVehicleDialog
        open={createVehicleOpen}
        onClose={() => setCreateVehicleOpen(false)}
        customerId={selectedCustomer?.id || ''}
        customerName={selectedCustomer?.name || ''}
        onCreated={handleVehicleCreated}
        prefillLicensePlate={detectSearchType(searchInputValue) === 'licensePlate' ? searchInputValue : undefined}
        prefillVin={detectSearchType(searchInputValue) === 'vin' ? searchInputValue : undefined}
        requireCustomer={!selectedCustomer}
      />
    </Box>
  );
});

// ==================== CREATE CUSTOMER DIALOG ====================
interface CreateCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: CustomerWithVehicles) => void;
  prefillData?: string;
}

const CreateCustomerDialog: React.FC<CreateCustomerDialogProps> = observer(({
  open,
  onClose,
  onCreated,
  prefillData,
}) => {
  const { customerStore } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Parse prefill data
      let name = '';
      let phone = '';
      let email = '';
      
      if (prefillData) {
        const trimmed = prefillData.trim();
        // Try to extract email
        const emailMatch = trimmed.match(/\S+@\S+\.\S+/);
        if (emailMatch) {
          email = emailMatch[0];
          name = trimmed.replace(emailMatch[0], '').trim();
        } else {
          // Try to extract phone (digits with formatting)
          const phoneMatch = trimmed.match(/[\d\s\-()]{7,}/);
          if (phoneMatch) {
            phone = phoneMatch[0].trim();
            name = trimmed.replace(phoneMatch[0], '').trim();
          } else {
            name = trimmed;
          }
        }
      }
      
      setFormData({
        name,
        phone,
        email,
        address: '',
      });
      setError(null);
    }
  }, [open, prefillData]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const customer = await customerStore.createCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
      });

      if (customer) {
        onCreated(customer as CustomerWithVehicles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Customer</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            required
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Phone"
            fullWidth
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            label="Address"
            fullWidth
            multiline
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !formData.name.trim()}
        >
          {saving ? <CircularProgress size={20} /> : 'Create Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// ==================== CREATE VEHICLE DIALOG ====================
interface CreateVehicleDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onCreated: (vehicle: VehicleOption) => void;
  prefillLicensePlate?: string;
  prefillVin?: string;
  requireCustomer?: boolean;
}

const CreateVehicleDialog: React.FC<CreateVehicleDialogProps> = observer(({
  open,
  onClose,
  customerId,
  customerName,
  onCreated,
  prefillLicensePlate,
  prefillVin,
  requireCustomer = false,
}) => {
  const { vehicleStore } = useStore();
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    licensePlate: '',
    vin: '',
    color: '',
  });
  const [selectedMake, setSelectedMake] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      vehicleStore.fetchMakes();
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear().toString(),
        licensePlate: prefillLicensePlate?.toUpperCase() || '',
        vin: prefillVin?.toUpperCase() || '',
        color: '',
      });
      setSelectedMake(null);
      setError(null);
    }
  }, [open, vehicleStore, prefillLicensePlate, prefillVin]);

  // Get models for selected make
  const modelsForMake = useMemo(() => {
    if (!selectedMake) return [];
    return vehicleStore.getModelsForMake(selectedMake.name);
  }, [selectedMake, vehicleStore, vehicleStore.makes]);

  const handleSave = async () => {
    if (requireCustomer && !customerId) {
      setError('Please select or create a customer first');
      return;
    }

    if (!customerId) {
      setError('Customer is required to create a vehicle');
      return;
    }

    const makeName = selectedMake?.name || formData.make;
    const modelName = formData.model;

    if (!makeName || !modelName) {
      setError('Please enter make and model');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const vehicle = await vehicleStore.createVehicle({
        customerId,
        make: makeName,
        model: modelName,
        year: parseInt(formData.year) || undefined,
        licensePlate: formData.licensePlate || undefined,
        vin: formData.vin || undefined,
        color: formData.color || undefined,
      });

      if (vehicle) {
        onCreated({
          id: vehicle.id,
          code: vehicle.code,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year || 0,
          licensePlate: vehicle.licensePlate,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle');
    } finally {
      setSaving(false);
    }
  };

  const isValid = (selectedMake?.name || formData.make) && formData.model && (!requireCustomer || customerId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {requireCustomer && !customerId ? 'Create Vehicle (Customer Required)' : `Add Vehicle${customerName ? ` for ${customerName}` : ''}`}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        {requireCustomer && !customerId && (
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            Please create a customer first before adding a vehicle.
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Autocomplete
            options={vehicleStore.makes}
            getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
            value={selectedMake}
            onChange={(_, value) => {
              if (typeof value === 'string') {
                setFormData(prev => ({ ...prev, make: value }));
                setSelectedMake(null);
              } else {
                setSelectedMake(value);
                setFormData(prev => ({ ...prev, make: value?.name || '' }));
              }
              setFormData(prev => ({ ...prev, model: '' }));
            }}
            renderInput={(params) => <TextField {...params} label="Make" required />}
            freeSolo
            onInputChange={(_, value, reason) => {
              if (reason === 'input') {
                setFormData(prev => ({ ...prev, make: value }));
              }
            }}
          />

          <Autocomplete
            options={modelsForMake}
            getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
            value={null}
            inputValue={formData.model}
            onChange={(_, value) => {
              if (typeof value === 'string') {
                setFormData(prev => ({ ...prev, model: value }));
              } else if (value) {
                setFormData(prev => ({ ...prev, model: value.name }));
              }
            }}
            onInputChange={(_, value, reason) => {
              if (reason === 'input') {
                setFormData(prev => ({ ...prev, model: value }));
              }
            }}
            renderInput={(params) => <TextField {...params} label="Model" required />}
            freeSolo
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Year"
              type="number"
              fullWidth
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              inputProps={{ min: 1900, max: new Date().getFullYear() + 2 }}
            />
            <TextField
              label="Color"
              fullWidth
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </Box>

          <TextField
            label="License Plate"
            fullWidth
            value={formData.licensePlate}
            onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
          />

          <TextField
            label="VIN"
            fullWidth
            value={formData.vin}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
            inputProps={{ maxLength: 17 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !isValid}
        >
          {saving ? <CircularProgress size={20} /> : 'Create Vehicle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// ==================== JOB DETAIL ====================
interface SelectedLineItem {
  id: string;
  name: string;
  code: string;
  unitPrice: number;
  type: 'INVENTORY' | 'LABOUR' | 'SERVICE';
}

const JobDetail: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const { jobStore, templateStore, inventoryStore, labourStore, serviceStore, settingsStore } = useStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  
  // Line item form state
  const [lineItemType, setLineItemType] = useState<LineItemType>('TEXT');
  const [selectedLineItem, setSelectedLineItem] = useState<SelectedLineItem | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [lineItemQuantity, setLineItemQuantity] = useState('1');
  const [lineItemPrice, setLineItemPrice] = useState('0');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id) {
      jobStore.fetchJobById(id);
      templateStore.fetchItems();
      inventoryStore.fetchItems();
      labourStore.fetchItems();
      serviceStore.fetchItems();
      settingsStore.fetchSettings();
    }

    return () => {
      jobStore.clearSelectedJob();
    };
  }, [id, jobStore, templateStore, inventoryStore, labourStore, serviceStore, settingsStore]);

  // Build options for line item autocomplete
  const getLineItemOptions = (): SelectedLineItem[] => {
    switch (lineItemType) {
      case 'INVENTORY':
        return inventoryStore.items.map((item) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          unitPrice: item.unitPrice,
          type: 'INVENTORY' as const,
        }));
      case 'LABOUR':
        return labourStore.items.map((item) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          unitPrice: item.hourlyRate,
          type: 'LABOUR' as const,
        }));
      case 'SERVICE':
        return serviceStore.items.map((item) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          unitPrice: item.basePrice,
          type: 'SERVICE' as const,
        }));
      default:
        return [];
    }
  };

  const job = jobStore.selectedJob;

  // Sort line items by sortOrder
  const sortedLineItems = useMemo(() => {
    if (!job?.lineItems) return [];
    return [...job.lineItems].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [job?.lineItems]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && job) {
      const oldIndex = sortedLineItems.findIndex((item) => item.id === active.id);
      const newIndex = sortedLineItems.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(sortedLineItems, oldIndex, newIndex);
      
      // Update sort order
      const reorderData = newOrder.map((item, index) => ({
        id: item.id,
        sortOrder: index,
      }));
      
      await jobStore.reorderLineItems(job.id, reorderData);
    }
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (job) {
      await jobStore.updateJobStatus(job.id, newStatus);
    }
    setAnchorEl(null);
  };

  const handleDuplicate = async () => {
    if (job) {
      const newJob = await jobStore.duplicateJob(job.id);
      if (newJob) {
        navigate(`/jobs/${newJob.id}`);
      }
    }
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    if (job) {
      await jobStore.deleteJob(job.id);
      navigate('/jobs');
    }
  };

  const handleAddItem = async () => {
    if (!job) return;

    let itemData: CreateLineItemDto;

    if (lineItemType === 'TEXT') {
      // TEXT items: no qty, no price - just description
      itemData = {
        type: 'TEXT',
        description: textDescription,
        quantity: 1,
        unitPrice: 0,
      };
    } else if (selectedLineItem) {
      itemData = {
        type: lineItemType,
        referenceId: selectedLineItem.id,
        description: `${selectedLineItem.name} (${selectedLineItem.code})`,
        quantity: parseFloat(lineItemQuantity) || 1,
        unitPrice: parseFloat(lineItemPrice) || selectedLineItem.unitPrice,
      };
    } else {
      return;
    }

    await jobStore.addLineItem(job.id, itemData);
    setItemDialogOpen(false);
    // Reset form
    setLineItemType('TEXT');
    setSelectedLineItem(null);
    setTextDescription('');
    setLineItemQuantity('1');
    setLineItemPrice('0');
  };

  const canAddLineItem = lineItemType === 'TEXT' ? textDescription.trim() !== '' : selectedLineItem !== null;

  const openAddItemDialog = () => {
    setLineItemType('TEXT');
    setSelectedLineItem(null);
    setTextDescription('');
    setLineItemQuantity('1');
    setLineItemPrice('0');
    setItemDialogOpen(true);
  };

  const handleApplyTemplate = async () => {
    if (job && selectedTemplate) {
      await jobStore.applyTemplate(job.id, selectedTemplate.id);
      setTemplateDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (job) {
      await jobStore.deleteLineItem(job.id, itemId);
      setDeleteItemConfirm(null);
    }
  };

  const handleUpdateLineItem = async (itemId: string, data: { description?: string; quantity?: number; unitPrice?: number }) => {
    if (job) {
      await jobStore.updateLineItem(job.id, itemId, data);
    }
  };

  const formatCurrency = (amount: number) => {
    const symbol = settingsStore.currencySettings.symbol || '$';
    return `${symbol}${Number(amount).toFixed(2)}`;
  };
  const formatQuantity = (qty: number | string) => {
    const num = typeof qty === 'string' ? parseFloat(qty) : qty;
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };
  const formatDate = (date: string | null) => (date ? new Date(date).toLocaleDateString() : '-');

  const handlePrint = (type: 'estimate' | 'invoice') => {
    if (!job) return;

    const shopName = settingsStore.shopSettings.name || 'Meccanico';
    const shopAddress = settingsStore.shopSettings.address || '';
    const shopPhone = settingsStore.shopSettings.phone || '';
    const shopEmail = settingsStore.shopSettings.email || '';
    const invoiceTerms = settingsStore.invoiceSettings.terms || '';
    const invoiceFooter = settingsStore.invoiceSettings.footer || '';
    const currencySymbol = settingsStore.currencySettings.symbol || '$';
    const taxName = settingsStore.taxSettings.name || 'GST';

    const title = type === 'estimate' ? 'Estimate' : 'Invoice';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${job?.code}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .shop-info h1 { font-size: 24px; color: #1976d2; margin-bottom: 8px; }
            .shop-info p { font-size: 12px; color: #666; }
            .document-info { text-align: right; }
            .document-info h2 { font-size: 28px; color: ${type === 'estimate' ? '#1976d2' : '#2e7d32'}; margin-bottom: 8px; }
            .document-info p { font-size: 14px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info, .vehicle-info { width: 48%; }
            .customer-info h3, .vehicle-info h3 { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
            .customer-info p, .vehicle-info p { font-size: 14px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f5f5f5; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #ddd; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .text-right { text-align: right; }
            .text-row td { background: transparent; font-style: italic; color: #666; }
            .totals { margin-left: auto; width: 300px; }
            .totals .row { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals .row.total { border-top: 2px solid #333; font-weight: bold; font-size: 18px; margin-top: 8px; padding-top: 16px; }
            .totals .row.discount { color: #2e7d32; }
            .totals .row.tax { color: #666; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
            .terms { font-size: 12px; color: #666; margin-bottom: 20px; }
            .terms h4 { margin-bottom: 8px; }
            .footer-text { font-size: 12px; color: #999; text-align: center; }
            @media print {
              body { padding: 20px; }
              @page { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-info">
              <h1>${shopName}</h1>
              <p>${shopAddress}</p>
              <p>${shopPhone}</p>
              <p>${shopEmail}</p>
            </div>
            <div class="document-info">
              <h2>${title}</h2>
              <p><strong>${job?.code}</strong></p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
              ${type === 'invoice' && job?.invoicedAt ? `<p>Invoiced: ${new Date(job.invoicedAt).toLocaleDateString()}</p>` : ''}
            </div>
          </div>

          <div class="details">
            <div class="customer-info">
              <h3>Bill To</h3>
              <p><strong>${job?.customer?.name || 'N/A'}</strong></p>
              <p>${job?.customer?.phone || ''}</p>
              <p>${job?.customer?.email || ''}</p>
            </div>
            <div class="vehicle-info">
              <h3>Vehicle</h3>
              <p><strong>${job?.vehicle?.year || ''} ${job?.vehicle?.make || ''} ${job?.vehicle?.model || ''}</strong></p>
              ${job?.vehicle?.licensePlate ? `<p>License: ${job.vehicle.licensePlate}</p>` : ''}
              ${job?.vehicle?.vin ? `<p>VIN: ${job.vehicle.vin}</p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${job?.lineItems?.map((item) => item.type === 'TEXT' ? `
                <tr class="text-row">
                  <td colspan="4">${item.description}</td>
                </tr>
              ` : `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-right">${Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(2)}</td>
                  <td class="text-right">${currencySymbol}${Number(item.unitPrice).toFixed(2)}</td>
                  <td class="text-right">${currencySymbol}${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No items</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <div class="row">
              <span>Subtotal</span>
              <span>${currencySymbol}${jobStore.subtotal.toFixed(2)}</span>
            </div>
            ${jobStore.discountTotal > 0 ? `
              <div class="row discount">
                <span>Discount${job?.discountPercent && job.discountPercent > 0 ? ` (${job.discountPercent}%)` : ''}</span>
                <span>-${currencySymbol}${jobStore.discountTotal.toFixed(2)}</span>
              </div>
            ` : ''}
            ${job?.taxRate && job.taxRate > 0 ? `
              <div class="row tax">
                <span>${taxName} (${job.taxRate}%)</span>
                <span>${currencySymbol}${jobStore.taxTotal.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="row total">
              <span>Total</span>
              <span>${currencySymbol}${jobStore.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          ${job?.notes ? `
            <div class="footer">
              <div class="terms">
                <h4>Notes</h4>
                <p>${job.notes}</p>
              </div>
            </div>
          ` : ''}

          ${invoiceTerms || invoiceFooter ? `
            <div class="footer">
              ${invoiceTerms ? `
                <div class="terms">
                  <h4>Terms & Conditions</h4>
                  <p>${invoiceTerms}</p>
                </div>
              ` : ''}
              ${invoiceFooter ? `
                <div class="footer-text">${invoiceFooter}</div>
              ` : ''}
            </div>
          ` : ''}

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  if (jobStore.isLoading || !job) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const canEdit = job.status === 'ESTIMATE';
  const validTransitions = statusTransitions[job.status];
  const taxName = settingsStore.taxSettings.name || 'GST';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/jobs')} aria-label="Back">
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" fontWeight={600}>
              {job.code}
            </Typography>
            <Chip label={statusConfig[job.status].label} color={statusConfig[job.status].color} />
          </Box>
          <Typography color="text.secondary">
            {job.customer?.name} • {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
          </Typography>
        </Box>
        
        {/* Print Buttons - Status aware */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {job.status === 'ESTIMATE' && (
            <Button
              variant="outlined"
              startIcon={<EstimateIcon />}
              onClick={() => handlePrint('estimate')}
            >
              Print Estimate
            </Button>
          )}
          {['INVOICED', 'PAID', 'DISPUTED'].includes(job.status) && (
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => handlePrint('invoice')}
            >
              Print Invoice
            </Button>
          )}
        </Box>
        
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreIcon />
        </IconButton>
      </Box>

      {jobStore.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {jobStore.error}
        </Alert>
      )}

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {validTransitions.includes('APPROVED') && (
          <MenuItem onClick={() => handleStatusChange('APPROVED')}>
            <ListItemIcon>
              <ApproveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Approve</ListItemText>
          </MenuItem>
        )}
        {validTransitions.includes('IN_PROGRESS') && (
          <MenuItem onClick={() => handleStatusChange('IN_PROGRESS')}>
            <ListItemIcon>
              <StartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Start Work</ListItemText>
          </MenuItem>
        )}
        {validTransitions.includes('ON_HOLD') && (
          <MenuItem onClick={() => handleStatusChange('ON_HOLD')}>
            <ListItemIcon>
              <PauseIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Put On Hold</ListItemText>
          </MenuItem>
        )}
        {validTransitions.includes('INVOICED') && (
          <MenuItem onClick={() => handleStatusChange('INVOICED')}>
            <ListItemIcon>
              <InvoiceIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Create Invoice</ListItemText>
          </MenuItem>
        )}
        {validTransitions.includes('PAID') && (
          <MenuItem onClick={() => handleStatusChange('PAID')}>
            <ListItemIcon>
              <PaidIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mark Paid</ListItemText>
          </MenuItem>
        )}
        {validTransitions.includes('DECLINED') && (
          <MenuItem onClick={() => handleStatusChange('DECLINED')}>
            <ListItemIcon>
              <DeclineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Decline</ListItemText>
          </MenuItem>
        )}
        {validTransitions.includes('CANCELLED') && (
          <MenuItem onClick={() => handleStatusChange('CANCELLED')}>
            <ListItemIcon>
              <CancelIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cancel</ListItemText>
          </MenuItem>
        )}
        <Divider />
        {canEdit && (
          <MenuItem onClick={() => { setEditDialogOpen(true); setAnchorEl(null); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Details</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDuplicate}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        {canEdit && (
          <MenuItem onClick={() => setDeleteConfirm(true)} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left Column - Line Items */}
        <Box sx={{ flex: 2 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Line Items
                </Typography>
                {canEdit && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<TemplateIcon />} onClick={() => setTemplateDialogOpen(true)}>
                      Apply Template
                    </Button>
                    <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openAddItemDialog}>
                      Add Item
                    </Button>
                  </Box>
                )}
              </Box>

              {!sortedLineItems || sortedLineItems.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No items added yet. Add parts, labour, services, or custom text.
                </Typography>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {canEdit && <TableCell sx={{ width: 40 }}></TableCell>}
                        <TableCell>Description</TableCell>
                        <TableCell align="right" sx={{ width: 80 }}>Qty</TableCell>
                        <TableCell align="right" sx={{ width: 100 }}>Price</TableCell>
                        <TableCell align="right" sx={{ width: 100 }}>Total</TableCell>
                        {canEdit && <TableCell sx={{ width: 50 }}></TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <SortableContext
                        items={sortedLineItems.map(item => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {sortedLineItems.map((item) => (
                          <SortableLineItemRow
                            key={item.id}
                            item={item}
                            canEdit={canEdit}
                            onDelete={(id) => setDeleteItemConfirm(id)}
                            onUpdate={handleUpdateLineItem}
                            formatCurrency={formatCurrency}
                            formatQuantity={formatQuantity}
                            currencySymbol={settingsStore.currencySettings.symbol || '$'}
                          />
                        ))}
                      </SortableContext>
                    </TableBody>
                  </Table>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Subtotal</Typography>
                  <Typography>{formatCurrency(jobStore.subtotal)}</Typography>
                </Box>
                {jobStore.discountTotal > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                    <Typography>
                      Discount{job.discountPercent > 0 ? ` (${job.discountPercent}%)` : ''}
                    </Typography>
                    <Typography>-{formatCurrency(jobStore.discountTotal)}</Typography>
                  </Box>
                )}
                {job.taxRate > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'action.hover', mx: -2, px: 2, py: 1 }}>
                    <Typography>{taxName} ({job.taxRate}%)</Typography>
                    <Typography>{formatCurrency(jobStore.taxTotal)}</Typography>
                  </Box>
                )}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600}>
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {formatCurrency(jobStore.grandTotal)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Right Column - Details */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Customer
              </Typography>
              <Typography fontWeight={500}>{job.customer?.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {job.customer?.code}
              </Typography>
              {job.customer?.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <a href={`tel:${job.customer.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {job.customer.phone}
                    </a>
                  </Typography>
                </Box>
              )}
              {job.customer?.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <a href={`mailto:${job.customer.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {job.customer.email}
                    </a>
                  </Typography>
                </Box>
              )}
              {job.customer?.address && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.5 }}>
                  <LocationIcon fontSize="small" color="action" sx={{ mt: 0.25 }} />
                  <Typography variant="body2" color="text.secondary">
                    {job.customer.address}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Card - Clickable */}
          <Card
            sx={{
              mb: 3,
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: 4 },
            }}
            onClick={() => setVehicleDialogOpen(true)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Vehicle
                </Typography>
                <Tooltip title="View details">
                  <OpenIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <VehicleIcon color="primary" />
                <Typography fontWeight={500}>
                  {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
                </Typography>
              </Box>
              {job.vehicle?.licensePlate && (
                <Chip
                  label={job.vehicle.licensePlate}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', mt: 1 }}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Dates
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">{formatDate(job.createdAt)}</Typography>
                </Box>
                {job.startedAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Started
                    </Typography>
                    <Typography variant="body2">{formatDate(job.startedAt)}</Typography>
                  </Box>
                )}
                {job.completedAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                    <Typography variant="body2">{formatDate(job.completedAt)}</Typography>
                  </Box>
                )}
                {job.invoicedAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Invoiced
                    </Typography>
                    <Typography variant="body2">{formatDate(job.invoicedAt)}</Typography>
                  </Box>
                )}
                {job.paidAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Paid
                    </Typography>
                    <Typography variant="body2">{formatDate(job.paidAt)}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Notes Section */}
          {(job.notes || job.internalNotes || canEdit) && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Notes
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Customer Notes
                    </Typography>
                    {job.notes ? (
                      <Typography
                        sx={{
                          whiteSpace: 'pre-wrap',
                          bgcolor: 'action.hover',
                          p: 1.5,
                          borderRadius: 1,
                        }}
                      >
                        {job.notes}
                      </Typography>
                    ) : (
                      <Typography color="text.secondary" fontStyle="italic">
                        No customer notes
                      </Typography>
                    )}
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Internal Notes
                    </Typography>
                    {job.internalNotes ? (
                      <Typography
                        sx={{
                          whiteSpace: 'pre-wrap',
                          bgcolor: 'warning.lighter',
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px dashed',
                          borderColor: 'warning.light',
                        }}
                      >
                        {job.internalNotes}
                      </Typography>
                    ) : (
                      <Typography color="text.secondary" fontStyle="italic">
                        No internal notes
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      {/* Add Item Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Line Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={lineItemType}
                label="Type"
                onChange={(e) => {
                  setLineItemType(e.target.value as LineItemType);
                  setSelectedLineItem(null);
                }}
              >
                <MenuItem value="TEXT">Text (note/description)</MenuItem>
                <MenuItem value="INVENTORY">Part (from inventory)</MenuItem>
                <MenuItem value="LABOUR">Labour</MenuItem>
                <MenuItem value="SERVICE">Service</MenuItem>
              </Select>
            </FormControl>

            {lineItemType === 'TEXT' ? (
              // Text entry - just description, no qty/price
              <TextField
                label="Text / Note"
                required
                fullWidth
                multiline
                rows={2}
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder="Enter text that will appear on the invoice (e.g., 'Customer requested extra inspection')"
                helperText="This text will appear on the invoice without price"
              />
            ) : (
              // Autocomplete for existing items
              <>
                <Autocomplete
                  options={getLineItemOptions()}
                  getOptionLabel={(option) => `${option.name} (${option.code})`}
                  value={selectedLineItem}
                  onChange={(_, value) => {
                    setSelectedLineItem(value);
                    if (value) {
                      setLineItemPrice(value.unitPrice.toString());
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`Select ${lineItemType === 'INVENTORY' ? 'Part' : lineItemType === 'LABOUR' ? 'Labour' : 'Service'}`}
                      required
                      placeholder="Search..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{option.code}</Typography>
                        </Box>
                        <Typography variant="body2" color="primary">
                          {settingsStore.currencySettings.symbol || '$'}{Number(option.unitPrice).toFixed(2)}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  loading={
                    lineItemType === 'INVENTORY'
                      ? inventoryStore.isLoading
                      : lineItemType === 'LABOUR'
                      ? labourStore.isLoading
                      : serviceStore.isLoading
                  }
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    value={lineItemQuantity}
                    onChange={(e) => setLineItemQuantity(e.target.value)}
                    inputProps={{ min: 0, step: 1 }}
                  />
                  <TextField
                    label="Unit Price"
                    type="number"
                    fullWidth
                    value={lineItemPrice}
                    onChange={(e) => setLineItemPrice(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">{settingsStore.currencySettings.symbol || '$'}</InputAdornment> }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Box>
                {selectedLineItem && (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    Total: {settingsStore.currencySettings.symbol || '$'}{(parseFloat(lineItemQuantity) * parseFloat(lineItemPrice)).toFixed(2)}
                  </Alert>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddItem} disabled={!canAddLineItem}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Apply Template Dialog */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply Template</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Autocomplete
              options={templateStore.items}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={selectedTemplate}
              onChange={(_, value) => setSelectedTemplate(value)}
              renderInput={(params) => <TextField {...params} label="Select Template" />}
              loading={templateStore.isLoading}
            />
            {selectedTemplate && selectedTemplate.items.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Template Items ({selectedTemplate.items.length}):
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTemplate.items.map((item, idx) => (
                      <TableRow
                        key={idx}
                        sx={{ bgcolor: lineItemTypeColors[item.itemType as LineItemType] || 'transparent' }}
                      >
                        <TableCell>
                          {item.itemType === 'TEXT' ? (
                            <Typography fontStyle="italic" color="text.secondary">
                              {item.description}
                            </Typography>
                          ) : (
                            item.description
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {item.itemType !== 'TEXT' && formatQuantity(item.quantity)}
                        </TableCell>
                        <TableCell align="right">
                          {item.itemType !== 'TEXT' && formatCurrency(item.unitPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyTemplate} disabled={!selectedTemplate}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vehicle Details Dialog */}
      <Dialog open={vehicleDialogOpen} onClose={() => setVehicleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VehicleIcon color="primary" />
            Vehicle Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {job.vehicle && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                  {job.vehicle.code}
                </Typography>
              </Box>
              
              <Divider />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {job.vehicle.licensePlate && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">License Plate</Typography>
                    <Typography fontWeight={500}>{job.vehicle.licensePlate}</Typography>
                  </Box>
                )}
                {job.vehicle.vin && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">VIN</Typography>
                    <Typography fontFamily="monospace" fontSize={12}>{job.vehicle.vin}</Typography>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<OpenIcon />}
                  onClick={() => navigate(`/vehicles/${job.vehicle?.id}`)}
                  fullWidth
                >
                  View Full Vehicle Details
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVehicleDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Job Confirmation */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Delete Job?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this job? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Line Item Confirmation */}
      <Dialog open={!!deleteItemConfirm} onClose={() => setDeleteItemConfirm(null)}>
        <DialogTitle>Delete Line Item?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this item?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteItemConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteItemConfirm && handleDeleteItem(deleteItemConfirm)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Job Dialog */}
      <EditJobDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        job={job}
      />
    </Box>
  );
});

// ==================== EDIT JOB DIALOG ====================
interface EditJobDialogProps {
  open: boolean;
  onClose: () => void;
  job: import('../stores/JobStore').Job | null;
}

interface EditCustomer {
  id: string;
  name: string;
  code: string;
}

interface EditVehicle {
  id: string;
  code: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string | null;
}

const EditJobDialog: React.FC<EditJobDialogProps> = observer(({ open, onClose, job }) => {
  const { jobStore, settingsStore, customerStore, vehicleStore } = useStore();
  const [formData, setFormData] = useState({
    notes: '',
    internalNotes: '',
    taxRate: '0',
    discountAmount: '0',
    discountPercent: '0',
  });
  const [selectedCustomer, setSelectedCustomer] = useState<EditCustomer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<EditVehicle | null>(null);
  // Use refs to track current values synchronously (state updates are async)
  const selectedCustomerRef = useRef<EditCustomer | null>(null);
  const selectedVehicleRef = useRef<EditVehicle | null>(null);
  const [customers, setCustomers] = useState<EditCustomer[]>([]);
  const [vehicles, setVehicles] = useState<EditVehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEstimate = job?.status === 'ESTIMATE';

  useEffect(() => {
    if (open) {
      customerStore.fetchCustomers();
    }
  }, [open, customerStore]);

  useEffect(() => {
    setCustomers(customerStore.customers.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
    })));
  }, [customerStore.customers]);

  // Track if we've initialized the form values for this dialog session
  const [initialized, setInitialized] = useState(false);

  // Reset initialized state when dialog closes
  useEffect(() => {
    if (!open) {
      setInitialized(false);
    }
  }, [open]);

  // Initialize form values ONLY when dialog first opens (not on subsequent job updates)
  useEffect(() => {
    if (job && open && !initialized) {
      setFormData({
        notes: job.notes || '',
        internalNotes: job.internalNotes || '',
        taxRate: job.taxRate?.toString() || settingsStore.taxSettings.defaultRate?.toString() || '0',
        discountAmount: job.discountAmount?.toString() || '0',
        discountPercent: job.discountPercent?.toString() || '0',
      });
      if (job.customer) {
        const customer = {
          id: job.customer.id,
          name: job.customer.name,
          code: job.customer.code,
        };
        selectedCustomerRef.current = customer;
        setSelectedCustomer(customer);
      } else {
        selectedCustomerRef.current = null;
        setSelectedCustomer(null);
      }
      if (job.vehicle) {
        const vehicle = {
          id: job.vehicle.id,
          code: job.vehicle.code,
          make: job.vehicle.make,
          model: job.vehicle.model,
          year: job.vehicle.year,
          licensePlate: job.vehicle.licensePlate,
        };
        selectedVehicleRef.current = vehicle;
        setSelectedVehicle(vehicle);
      } else {
        selectedVehicleRef.current = null;
        setSelectedVehicle(null);
      }
      setError(null);
      setInitialized(true);
    }
  }, [job, open, initialized, settingsStore.taxSettings.defaultRate]);

  // Load vehicles when customer changes
  useEffect(() => {
    if (selectedCustomer && open) {
      setLoadingVehicles(true);
      vehicleStore.fetchVehiclesByCustomer(selectedCustomer.id)
        .then((data) => {
          setVehicles(data.map((v: { id: string; code: string; make: string; model: string; year: number | null; licensePlate: string | null }) => ({
            id: v.id,
            code: v.code,
            make: v.make,
            model: v.model,
            year: v.year || 0,
            licensePlate: v.licensePlate,
          })));
        })
        .finally(() => setLoadingVehicles(false));
    } else {
      setVehicles([]);
    }
  }, [selectedCustomer, open, vehicleStore]);

  const handleCustomerChange = (_: unknown, newCustomer: EditCustomer | null) => {
    // Update ref synchronously (before state update)
    selectedCustomerRef.current = newCustomer;
    setSelectedCustomer(newCustomer);
    // Clear vehicle when customer changes
    if (newCustomer?.id !== job?.customer?.id) {
      selectedVehicleRef.current = null;
      setSelectedVehicle(null);
    }
  };
  
  const handleVehicleChange = (_: unknown, newVehicle: EditVehicle | null) => {
    // Update ref synchronously (before state update)
    selectedVehicleRef.current = newVehicle;
    setSelectedVehicle(newVehicle);
  };

  const handleSave = async () => {
    if (!job) return;
    setSaving(true);
    setError(null);

    try {
      const discountAmount = parseFloat(formData.discountAmount) || 0;
      const discountPercent = parseFloat(formData.discountPercent) || 0;

      if (discountAmount > 0 && discountPercent > 0) {
        setError('Cannot have both discount amount and discount percent');
        setSaving(false);
        return;
      }

      const updateData: import('../stores/JobStore').UpdateJobDto = {
        notes: formData.notes || undefined,
        internalNotes: formData.internalNotes || undefined,
        taxRate: parseFloat(formData.taxRate) || 0,
        discountAmount: discountAmount,
        discountPercent: discountPercent,
      };

      // Add customer/vehicle changes only if in estimate status
      // Use refs to get current values (state updates are async, refs are sync)
      if (isEstimate) {
        const currentCustomer = selectedCustomerRef.current;
        const currentVehicle = selectedVehicleRef.current;
        
        // Always send customerId if we have a selected customer (even if unchanged)
        if (currentCustomer) {
          updateData.customerId = currentCustomer.id;
        }
        // Always send vehicleId if we have a selected vehicle (even if unchanged)
        if (currentVehicle) {
          updateData.vehicleId = currentVehicle.id;
        }
      }
      await jobStore.updateJob(job.id, updateData);
      // Force refresh to ensure we have the latest data with relations
      await jobStore.fetchJobById(job.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  const taxName = settingsStore.taxSettings.name || 'GST';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Job Details</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Customer & Vehicle Selection - Only in ESTIMATE status */}
          {isEstimate && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Customer & Vehicle (only editable in Estimate status)
              </Typography>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                value={selectedCustomer}
                onChange={handleCustomerChange}
                renderInput={(params) => (
                  <TextField {...params} label="Customer" />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
              <Autocomplete
                options={vehicles}
                getOptionLabel={(option) => `${option.year} ${option.make} ${option.model}${option.licensePlate ? ` (${option.licensePlate})` : ''}`}
                value={selectedVehicle}
                onChange={handleVehicleChange}
                loading={loadingVehicles}
                disabled={!selectedCustomer}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Vehicle" 
                    helperText={!selectedCustomer ? 'Select a customer first' : ''}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography fontWeight={500}>
                        {option.year} {option.make} {option.model}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.code}{option.licensePlate && ` • ${option.licensePlate}`}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
              <Divider sx={{ my: 1 }} />
            </>
          )}

          <TextField
            label="Notes"
            multiline
            rows={3}
            fullWidth
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            helperText="Customer-visible notes"
          />
          <TextField
            label="Internal Notes"
            multiline
            rows={2}
            fullWidth
            value={formData.internalNotes}
            onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
            helperText="Internal use only - not visible to customer"
          />
          <TextField
            label={`${taxName} Rate`}
            type="number"
            fullWidth
            value={formData.taxRate}
            onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Discount Amount"
              type="number"
              fullWidth
              value={formData.discountAmount}
              onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value, discountPercent: '0' })}
              InputProps={{ startAdornment: <InputAdornment position="start">{settingsStore.currencySettings.symbol || '$'}</InputAdornment> }}
              inputProps={{ min: 0, step: 0.01 }}
              disabled={parseFloat(formData.discountPercent) > 0}
            />
            <TextField
              label="Discount Percent"
              type="number"
              fullWidth
              value={formData.discountPercent}
              onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value, discountAmount: '0' })}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              inputProps={{ min: 0, max: 100, step: 0.01 }}
              disabled={parseFloat(formData.discountAmount) > 0}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export const Jobs: React.FC = () => (
  <Routes>
    <Route path="/" element={<JobList />} />
    <Route path="/new" element={<NewJob />} />
    <Route path="/:id" element={<JobDetail />} />
  </Routes>
);
