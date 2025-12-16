import React, { useEffect, useState } from 'react';
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
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';
import type { JobStatus, LineItemType, CreateLineItemDto } from '../stores/JobStore';
import type { Template } from '../stores/TemplateStore';
import type { Customer as CustomerType } from '../stores/CustomerStore';

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

// ==================== JOB LIST ====================
const JobList: React.FC = observer(() => {
  const { jobStore } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    jobStore.fetchJobs();
  }, [jobStore]);

  const handleTabChange = (_: unknown, newValue: number) => {
    setTab(newValue);
    const statusMap: (JobStatus | null)[] = [null, 'ESTIMATE', 'APPROVED', 'IN_PROGRESS', 'INVOICED', 'PAID'];
    jobStore.setStatusFilter(statusMap[newValue]);
    jobStore.fetchJobs();
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    jobStore.setSearch(value);
    jobStore.fetchJobs();
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

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

const NewJob: React.FC = observer(() => {
  const { jobStore, customerStore, vehicleStore } = useStore();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerWithVehicles[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithVehicles | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerStore.fetchCustomers();
  }, [customerStore]);

  useEffect(() => {
    setCustomers(customerStore.customers as CustomerWithVehicles[]);
  }, [customerStore.customers]);

  // Fetch vehicles when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      setLoadingVehicles(true);
      setCustomerVehicles([]);
      setSelectedVehicle(null);
      vehicleStore.fetchVehiclesByCustomer(selectedCustomer.id)
        .then((vehicles) => {
          setCustomerVehicles(vehicles.map(v => ({
            id: v.id,
            code: v.code,
            make: v.make,
            model: v.model,
            year: v.year || 0,
            licensePlate: v.licensePlate,
          })));
        })
        .catch(() => {
          setError('Failed to fetch vehicles for customer');
        })
        .finally(() => {
          setLoadingVehicles(false);
        });
    } else {
      setCustomerVehicles([]);
      setSelectedVehicle(null);
    }
  }, [selectedCustomer, vehicleStore]);

  const handleCreate = async () => {
    if (!selectedCustomer || !selectedVehicle) return;

    setLoading(true);
    setError(null);

    try {
      const job = await jobStore.createJob({
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        notes: notes || undefined,
      });

      if (job) {
        navigate(`/jobs/${job.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/jobs')}>
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
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={selectedCustomer}
              onChange={(_, value) => {
                setSelectedCustomer(value);
                setSelectedVehicle(null);
              }}
              renderInput={(params) => <TextField {...params} label="Customer" required />}
              loading={customerStore.isLoading}
            />

            {selectedCustomer && (
              <FormControl fullWidth required>
                <InputLabel>Vehicle</InputLabel>
                <Select
                  value={selectedVehicle?.id || ''}
                  label="Vehicle"
                  disabled={loadingVehicles}
                  onChange={(e) => {
                    const vehicle = customerVehicles.find((v) => v.id === e.target.value);
                    setSelectedVehicle(vehicle || null);
                  }}
                >
                  {loadingVehicles ? (
                    <MenuItem disabled>Loading vehicles...</MenuItem>
                  ) : customerVehicles.length === 0 ? (
                    <MenuItem disabled>No vehicles found for this customer</MenuItem>
                  ) : (
                    customerVehicles.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.year ? v.year : ''} {v.make} {v.model} {v.licensePlate ? `(${v.licensePlate})` : ''}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
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
    </Box>
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
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printType, setPrintType] = useState<'estimate' | 'invoice'>('estimate');
  
  // Line item form state
  const [lineItemType, setLineItemType] = useState<LineItemType>('INVENTORY');
  const [selectedLineItem, setSelectedLineItem] = useState<SelectedLineItem | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [textPrice, setTextPrice] = useState('0');
  const [lineItemQuantity, setLineItemQuantity] = useState('1');

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
      itemData = {
        type: 'TEXT',
        description: textDescription,
        quantity: parseFloat(lineItemQuantity) || 1,
        unitPrice: parseFloat(textPrice) || 0,
      };
    } else if (selectedLineItem) {
      itemData = {
        type: lineItemType,
        referenceId: selectedLineItem.id,
        description: `${selectedLineItem.name} (${selectedLineItem.code})`,
        quantity: parseFloat(lineItemQuantity) || 1,
        unitPrice: selectedLineItem.unitPrice,
      };
    } else {
      return;
    }
    
    await jobStore.addLineItem(job.id, itemData);
    setItemDialogOpen(false);
    // Reset form
    setLineItemType('INVENTORY');
    setSelectedLineItem(null);
    setTextDescription('');
    setTextPrice('0');
    setLineItemQuantity('1');
  };
  
  const canAddLineItem = lineItemType === 'TEXT' ? textDescription.trim() !== '' : selectedLineItem !== null;
  
  const openAddItemDialog = () => {
    setLineItemType('INVENTORY');
    setSelectedLineItem(null);
    setTextDescription('');
    setTextPrice('0');
    setLineItemQuantity('1');
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

  const formatCurrency = (amount: number) => `$${Number(amount).toFixed(2)}`;
  const formatDate = (date: string | null) => (date ? new Date(date).toLocaleDateString() : '-');

  const getItemTypeLabel = (type: LineItemType) => {
    switch (type) {
      case 'INVENTORY':
        return 'Part';
      case 'LABOUR':
        return 'Labour';
      case 'SERVICE':
        return 'Service';
      case 'TEXT':
        return 'Text';
      default:
        return type;
    }
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/jobs')}>
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
        <MenuItem onClick={() => { setPrintType('estimate'); setPrintDialogOpen(true); setAnchorEl(null); }}>
          <ListItemIcon>
            <EstimateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print Estimate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setPrintType('invoice'); setPrintDialogOpen(true); setAnchorEl(null); }}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print Invoice</ListItemText>
        </MenuItem>
        {canEdit && (
          <MenuItem onClick={() => { setEditDialogOpen(true); setAnchorEl(null); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Details</ListItemText>
          </MenuItem>
        )}
        <Divider />
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

              {!job.lineItems || job.lineItems.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No items added yet. Add parts, labour, services, or custom text.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      {canEdit && <TableCell></TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {job.lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Chip label={getItemTypeLabel(item.type)} size="small" />
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                        {canEdit && (
                          <TableCell>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteItemConfirm(item.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                    <Typography>Discount</Typography>
                    <Typography>-{formatCurrency(jobStore.discountTotal)}</Typography>
                  </Box>
                )}
                {job.taxRate > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Tax ({job.taxRate}%)</Typography>
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
              <Typography variant="body2" color="text.secondary">
                {job.customer?.code}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Vehicle
              </Typography>
              <Typography fontWeight={500}>
                {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
              </Typography>
              {job.vehicle?.licensePlate && (
                <Typography variant="body2" color="text.secondary">
                  Plate: {job.vehicle.licensePlate}
                </Typography>
              )}
              {job.vehicle?.vin && (
                <Typography variant="body2" color="text.secondary">
                  VIN: {job.vehicle.vin}
                </Typography>
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

          {job.notes && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Notes
                </Typography>
                <Typography>{job.notes}</Typography>
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
                <MenuItem value="INVENTORY">Part (from inventory)</MenuItem>
                <MenuItem value="LABOUR">Labour</MenuItem>
                <MenuItem value="SERVICE">Service</MenuItem>
                <MenuItem value="TEXT">Text (custom description)</MenuItem>
              </Select>
            </FormControl>
            
            {lineItemType === 'TEXT' ? (
              // Custom text entry
              <>
                <TextField
                  label="Description"
                  required
                  fullWidth
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  placeholder="Enter custom line item description"
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    value={lineItemQuantity}
                    onChange={(e) => setLineItemQuantity(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    label="Unit Price"
                    type="number"
                    fullWidth
                    value={textPrice}
                    onChange={(e) => setTextPrice(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Box>
              </>
            ) : (
              // Autocomplete for existing items
              <>
                <Autocomplete
                  options={getLineItemOptions()}
                  getOptionLabel={(option) => `${option.name} (${option.code})`}
                  value={selectedLineItem}
                  onChange={(_, value) => setSelectedLineItem(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`Select ${getItemTypeLabel(lineItemType)}`}
                      required
                      placeholder={`Search ${getItemTypeLabel(lineItemType).toLowerCase()}s...`}
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
                          ${Number(option.unitPrice).toFixed(2)}
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
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    label="Unit Price"
                    type="number"
                    fullWidth
                    value={selectedLineItem ? selectedLineItem.unitPrice.toString() : '0'}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    disabled
                    helperText="Price from selected item"
                  />
                </Box>
                {selectedLineItem && (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    Total: ${(parseFloat(lineItemQuantity) * selectedLineItem.unitPrice).toFixed(2)}
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
                      <TableRow key={idx}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
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

      {/* Print Dialog */}
      <PrintJobDialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        job={job}
        printType={printType}
        subtotal={jobStore.subtotal}
        discountTotal={jobStore.discountTotal}
        taxTotal={jobStore.taxTotal}
        grandTotal={jobStore.grandTotal}
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

const EditJobDialog: React.FC<EditJobDialogProps> = observer(({ open, onClose, job }) => {
  const { jobStore } = useStore();
  const [formData, setFormData] = useState({
    notes: '',
    internalNotes: '',
    taxRate: '0',
    discountAmount: '0',
    discountPercent: '0',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (job && open) {
      setFormData({
        notes: job.notes || '',
        internalNotes: job.internalNotes || '',
        taxRate: job.taxRate?.toString() || '0',
        discountAmount: job.discountAmount?.toString() || '0',
        discountPercent: job.discountPercent?.toString() || '0',
      });
      setError(null);
    }
  }, [job, open]);

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

      await jobStore.updateJob(job.id, {
        notes: formData.notes || undefined,
        internalNotes: formData.internalNotes || undefined,
        taxRate: parseFloat(formData.taxRate) || 0,
        discountAmount: discountAmount,
        discountPercent: discountPercent,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

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
            label="Tax Rate"
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
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
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

// ==================== PRINT JOB DIALOG ====================
interface PrintJobDialogProps {
  open: boolean;
  onClose: () => void;
  job: import('../stores/JobStore').Job | null;
  printType: 'estimate' | 'invoice';
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
}

const PrintJobDialog: React.FC<PrintJobDialogProps> = observer(({ open, onClose, job, printType, subtotal, discountTotal, taxTotal, grandTotal }) => {
  const { settingsStore } = useStore();
  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const shopName = settingsStore.shopSettings.name || 'Meccanico';
    const shopAddress = settingsStore.shopSettings.address || '';
    const shopPhone = settingsStore.shopSettings.phone || '';
    const shopEmail = settingsStore.shopSettings.email || '';
    const invoiceTerms = settingsStore.invoiceSettings.terms || '';
    const invoiceFooter = settingsStore.invoiceSettings.footer || '';
    const currencySymbol = settingsStore.currencySettings.symbol || '$';

    const title = printType === 'estimate' ? 'Estimate' : 'Invoice';

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
            .document-info h2 { font-size: 28px; color: ${printType === 'estimate' ? '#1976d2' : '#2e7d32'}; margin-bottom: 8px; }
            .document-info p { font-size: 14px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info, .vehicle-info { width: 48%; }
            .customer-info h3, .vehicle-info h3 { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
            .customer-info p, .vehicle-info p { font-size: 14px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f5f5f5; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #ddd; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 300px; }
            .totals .row { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals .row.total { border-top: 2px solid #333; font-weight: bold; font-size: 18px; margin-top: 8px; padding-top: 16px; }
            .totals .row.discount { color: #2e7d32; }
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
              ${printType === 'invoice' && job?.invoicedAt ? `<p>Invoiced: ${new Date(job.invoicedAt).toLocaleDateString()}</p>` : ''}
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
              ${job?.lineItems?.map((item) => `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${currencySymbol}${Number(item.unitPrice).toFixed(2)}</td>
                  <td class="text-right">${currencySymbol}${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No items</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <div class="row">
              <span>Subtotal</span>
              <span>${currencySymbol}${subtotal.toFixed(2)}</span>
            </div>
            ${discountTotal > 0 ? `
              <div class="row discount">
                <span>Discount</span>
                <span>-${currencySymbol}${discountTotal.toFixed(2)}</span>
              </div>
            ` : ''}
            ${job?.taxRate && job.taxRate > 0 ? `
              <div class="row">
                <span>Tax (${job.taxRate}%)</span>
                <span>${currencySymbol}${taxTotal.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="row total">
              <span>Total</span>
              <span>${currencySymbol}${grandTotal.toFixed(2)}</span>
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
    onClose();
  };

  const formatCurrency = (amount: number) => {
    const symbol = settingsStore.currencySettings.symbol || '$';
    return `${symbol}${Number(amount).toFixed(2)}`;
  };

  if (!job) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Print {printType === 'estimate' ? 'Estimate' : 'Invoice'} - {job.code}
      </DialogTitle>
      <DialogContent>
        <Box ref={printRef} sx={{ p: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Click "Print" to open the print preview in a new window.
          </Alert>

          <Typography variant="h6" gutterBottom>
            Preview
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Customer
            </Typography>
            <Typography fontWeight={500}>{job.customer?.name}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Vehicle
            </Typography>
            <Typography fontWeight={500}>
              {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
            </Typography>
          </Box>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Line Items ({job.lineItems?.length || 0})
          </Typography>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {job.lineItems?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ width: 250 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal</Typography>
                <Typography>{formatCurrency(subtotal)}</Typography>
              </Box>
              {discountTotal > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'success.main' }}>
                  <Typography>Discount</Typography>
                  <Typography>-{formatCurrency(discountTotal)}</Typography>
                </Box>
              )}
              {job.taxRate > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Tax ({job.taxRate}%)</Typography>
                  <Typography>{formatCurrency(taxTotal)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight={600}>Total</Typography>
                <Typography fontWeight={600}>{formatCurrency(grandTotal)}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print
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
