import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  Autocomplete,
  Tooltip,
  Grid,
  TablePagination,
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
  Work as JobIcon,
  Download as DownloadIcon,
  DragIndicator as DragIcon,
  DirectionsCar as VehicleIcon,
  OpenInNew as OpenIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Mail as MailIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';
import { api } from '../utils/api';
import type { Payment } from '../stores/PaymentStore';
import { EmailDialog } from '../components/jobs/EmailDialog';
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
  BOOKED: { label: 'Booked', color: 'default' },
  IN_PROGRESS: { label: 'In Progress', color: 'primary' },
  PENDING: { label: 'Pending', color: 'warning' },
  AWAITING_PICKUP: { label: 'Awaiting Pick Up', color: 'info' },
  COMPLETED: { label: 'Completed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
};

// Line item type colors (faint backgrounds)
const lineItemTypeColors: Record<LineItemType, string> = {
  INVENTORY: 'rgba(25, 118, 210, 0.04)', // Blue
  LABOUR: 'rgba(245, 124, 0, 0.04)',     // Orange
  SERVICE: 'rgba(56, 142, 60, 0.04)',    // Green
  TEXT: 'transparent',                    // No background for text
};

// All possible statuses for flexible transitions
const allStatuses: JobStatus[] = ['BOOKED', 'IN_PROGRESS', 'PENDING', 'AWAITING_PICKUP', 'COMPLETED', 'CANCELLED'];

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
  const { jobStore, settingsStore, authStore } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize tab from URL params
  const initialTab = parseInt(searchParams.get('tab') || '0', 10);
  const [tab, setTab] = useState(initialTab);
  
  // Initialize search from URL params
  const urlSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(urlSearch);
  
  // Initialize date range from URL params
  const urlStartDate = searchParams.get('startDate') || '';
  const urlEndDate = searchParams.get('endDate') || '';
  const [startDate, setStartDate] = useState<string>(urlStartDate);
  const [endDate, setEndDate] = useState<string>(urlEndDate);
  
  // Initialize invoice filters from URL params
  const urlInvoicePaid = searchParams.get('invoicePaid') as 'all' | 'paid' | 'unpaid' | null;
  const urlInvoiced = searchParams.get('invoiced') as 'all' | 'invoiced' | 'not-invoiced' | null;
  const [invoicePaidFilter, setInvoicePaidFilter] = useState<'all' | 'paid' | 'unpaid'>(urlInvoicePaid || 'all');
  const [invoicedFilter, setInvoicedFilter] = useState<'all' | 'invoiced' | 'not-invoiced'>(urlInvoiced || 'all');
  
  // Function to update URL params
  const updateURLParams = useCallback((updates: {
    tab?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    invoicePaid?: 'all' | 'paid' | 'unpaid';
    invoiced?: 'all' | 'invoiced' | 'not-invoiced';
  }) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (updates.tab !== undefined) {
      if (updates.tab === 0) {
        newParams.delete('tab');
      } else {
        newParams.set('tab', updates.tab.toString());
      }
    }
    
    if (updates.search !== undefined) {
      if (updates.search === '') {
        newParams.delete('search');
      } else {
        newParams.set('search', updates.search);
      }
    }
    
    if (updates.startDate !== undefined) {
      if (updates.startDate === '') {
        newParams.delete('startDate');
      } else {
        newParams.set('startDate', updates.startDate);
      }
    }
    
    if (updates.endDate !== undefined) {
      if (updates.endDate === '') {
        newParams.delete('endDate');
      } else {
        newParams.set('endDate', updates.endDate);
      }
    }
    
    if (updates.invoicePaid !== undefined) {
      if (updates.invoicePaid === 'all') {
        newParams.delete('invoicePaid');
      } else {
        newParams.set('invoicePaid', updates.invoicePaid);
      }
    }
    
    if (updates.invoiced !== undefined) {
      if (updates.invoiced === 'all') {
        newParams.delete('invoiced');
      } else {
        newParams.set('invoiced', updates.invoiced);
      }
    }
    
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);
  
  // Sync URL params with state on mount and when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const currentTab = parseInt(searchParams.get('tab') || '0', 10);
    const currentSearch = searchParams.get('search') || '';
    const currentStartDate = searchParams.get('startDate') || '';
    const currentEndDate = searchParams.get('endDate') || '';
    const currentInvoicePaid = searchParams.get('invoicePaid') as 'all' | 'paid' | 'unpaid' | null;
    const currentInvoiced = searchParams.get('invoiced') as 'all' | 'invoiced' | 'not-invoiced' | null;
    
    // Only update state if URL params differ from current state (avoids circular updates)
    if (currentTab !== tab) setTab(currentTab);
    if (currentSearch !== search) {
      setSearch(currentSearch);
      jobStore.setSearch(currentSearch);
    }
    if (currentStartDate !== startDate) setStartDate(currentStartDate);
    if (currentEndDate !== endDate) setEndDate(currentEndDate);
    if ((currentInvoicePaid || 'all') !== invoicePaidFilter) {
      setInvoicePaidFilter(currentInvoicePaid || 'all');
    }
    if ((currentInvoiced || 'all') !== invoicedFilter) {
      setInvoicedFilter(currentInvoiced || 'all');
    }
    
    // Apply filters to jobStore from URL
    if (currentStartDate) {
      jobStore.setDateRange(currentStartDate, currentEndDate);
    } else if (!currentStartDate && startDate) {
      // Clear date range if removed from URL
      jobStore.setDateRange(null, null);
    }
    if (currentInvoicePaid && currentInvoicePaid !== 'all') {
      const isPaid = currentInvoicePaid === 'paid';
      jobStore.setInvoiceFilter(true, isPaid);
    }
    if (currentInvoiced && currentInvoiced !== 'all') {
      const hasInvoice = currentInvoiced === 'invoiced';
      jobStore.setInvoiceFilter(hasInvoice, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]); // Only run when URL params actually change

  // Initial fetch and when filters change
  useEffect(() => {
    const statusMap: (JobStatus | null | 'INVOICED')[] = [
      null,
      'BOOKED',
      'IN_PROGRESS',
      'PENDING',
      'AWAITING_PICKUP',
      'COMPLETED',
      'INVOICED',
    ];
    const selectedTab = statusMap[tab];

    if (selectedTab === 'INVOICED') {
      jobStore.setStatusFilter(null);
      const paid = invoicePaidFilter === 'all' ? null : invoicePaidFilter === 'paid';
      jobStore.setInvoiceFilter(true, paid);
    } else if (selectedTab === 'COMPLETED') {
      jobStore.setStatusFilter('COMPLETED');
      const hasInvoice = invoicedFilter === 'all' ? null : invoicedFilter === 'invoiced';
      jobStore.setInvoiceFilter(hasInvoice, null);
    } else {
      jobStore.setStatusFilter(selectedTab as JobStatus | null);
      jobStore.setInvoiceFilter(null, null);
    }
    
    jobStore.setDateRange(startDate || null, endDate || null);
    jobStore.fetchJobs();
  }, [tab, invoicePaidFilter, invoicedFilter, startDate, endDate, jobStore]);

  const handleTabChange = (_: unknown, newValue: number) => {
    setTab(newValue);
    setInvoicePaidFilter('all'); // Reset invoice filter when changing tabs
    setInvoicedFilter('all'); // Reset invoiced filter when changing tabs
    updateURLParams({ tab: newValue, invoicePaid: 'all', invoiced: 'all' });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    jobStore.setSearch(value);
    updateURLParams({ search: value });
    jobStore.fetchJobs();
  };
  
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    updateURLParams({ startDate: value });
  };
  
  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    updateURLParams({ endDate: value });
  };
  
  const handleInvoicePaidFilterChange = (value: 'all' | 'paid' | 'unpaid') => {
    setInvoicePaidFilter(value);
    updateURLParams({ invoicePaid: value });
  };
  
  const handleInvoicedFilterChange = (value: 'all' | 'invoiced' | 'not-invoiced') => {
    setInvoicedFilter(value);
    updateURLParams({ invoiced: value });
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    jobStore.setPage(newPage + 1); // MUI uses 0-based, API uses 1-based
    jobStore.fetchJobs();
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    jobStore.setLimit(parseInt(event.target.value, 10));
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
        {authStore.canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/jobs/new')}>
            New Job
          </Button>
        )}
      </Box>

      {/* Status Tabs */}
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="All" />
        <Tab label="Booked" />
        <Tab label="In Progress" />
        <Tab label="Pending" />
        <Tab label="Awaiting Pickup" />
        <Tab label="Completed" />
        <Tab label="Invoiced" />
      </Tabs>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search jobs by code, customer, or vehicle..."
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
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        {tab === 5 && (
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Invoiced Status</InputLabel>
              <Select
                value={invoicedFilter}
                label="Invoiced Status"
                onChange={(e) => handleInvoicedFilterChange(e.target.value as 'all' | 'invoiced' | 'not-invoiced')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="invoiced">Invoiced</MenuItem>
                <MenuItem value="not-invoiced">Not Invoiced</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        {tab === 6 && (
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={invoicePaidFilter}
                label="Payment Status"
                onChange={(e) => handleInvoicePaidFilterChange(e.target.value as 'all' | 'paid' | 'unpaid')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>

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
            {authStore.canEdit && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/jobs/new')}>
                Create Job
              </Button>
            )}
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
                {tab === 5 && <TableCell align="center">Invoiced</TableCell>}
                {tab === 6 && <TableCell align="center">Paid</TableCell>}
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
                    {statusConfig[job.status] ? (
                      <Chip
                        label={statusConfig[job.status].label}
                        color={statusConfig[job.status].color}
                        size="small"
                      />
                    ) : (
                      <Chip
                        label={job.status}
                        color="default"
                        size="small"
                      />
                    )}
                  </TableCell>
                  {tab === 5 && (
                    <TableCell align="center">
                      {job.invoiceId ? (
                        <CheckIcon color="success" />
                      ) : (
                        <CancelIcon color="disabled" />
                      )}
                    </TableCell>
                  )}
                  {tab === 6 && (
                    <TableCell align="center">
                      {job.invoiceId && job.invoice ? (
                        job.invoice.status === 'PAID' ? (
                          <CheckIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  )}
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
          <TablePagination
            component="div"
            count={jobStore.total}
            page={jobStore.page - 1} // MUI uses 0-based, API uses 1-based
            onPageChange={handlePageChange}
            rowsPerPage={jobStore.limit}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Rows per page:"
          />
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
  const { jobStore, customerStore, vehicleStore, settingsStore, authStore } = useStore();
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithVehicles | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createVehicleOpen, setCreateVehicleOpen] = useState(false);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  // Track if vehicle was selected before customer (to preserve it when creating new customer)
  const vehicleSelectedFirstRef = useRef(false);
  
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
      const wasVehicleSelectedFirst = vehicleSelectedFirstRef.current;
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
          // Only clear it if it doesn't belong to this customer AND it wasn't selected first
          // (If vehicle was selected first, preserve it even if customer has no vehicles yet)
          if (currentVehicle && currentVehicle.id) {
            const vehicleBelongsToCustomer = vehicleOptions.some(v => v.id === currentVehicle.id);
            if (!vehicleBelongsToCustomer && !wasVehicleSelectedFirst) {
              // Only clear if vehicle doesn't belong AND vehicle wasn't selected first
              setSelectedVehicle(null);
              // If customer only has one vehicle, auto-select it
              if (vehicleOptions.length === 1) {
                setSelectedVehicle(vehicleOptions[0]);
              }
            }
            // If it does belong, keep it (don't clear)
            // If vehicle was selected first, also keep it (don't clear)
          } else {
            // No vehicle currently selected - auto-select if customer has exactly one vehicle
            if (vehicleOptions.length === 1) {
              setSelectedVehicle(vehicleOptions[0]);
            }
          }
          // Reset the flag after processing
          vehicleSelectedFirstRef.current = false;
        })
        .catch(() => {
          setError('Failed to fetch vehicles for customer');
          // Reset the flag on error too
          vehicleSelectedFirstRef.current = false;
        });
    } else {
      // When customer is cleared, only clear the customer vehicles list
      // Don't clear the selected vehicle - it may have been selected independently
      setCustomerVehicles([]);
      // Reset the flag when customer is cleared
      vehicleSelectedFirstRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer, vehicleStore]);

  const performSearch = useCallback(async (query: string) => {
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
  }, [selectedCustomer, selectedVehicle, customerStore, vehicleStore]);

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
  }, [searchInputValue, performSearch]);

  const handleSelectResult = async (result: SearchResult) => {
    if (result.type === 'vehicle' && result.vehicle) {
      // Auto-populate vehicle first, then customer if available
      const vehicle = result.vehicle;
      
      // Mark that vehicle was selected first
      vehicleSelectedFirstRef.current = true;
      
      setSelectedVehicle({
        id: vehicle.id,
        code: vehicle.code,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year || 0,
        licensePlate: vehicle.licensePlate,
      });
      
      // Fetch full vehicle details to get owners
      try {
        const fullVehicle = await vehicleStore.fetchVehicleById(vehicle.id);
        
        if (fullVehicle.owners && fullVehicle.owners.length > 0) {
          // If vehicle has multiple owners, determine default customer
          // First, try to get the customer from the most recent job
          try {
            // Fetch jobs for this vehicle using API directly
            const { api } = await import('../utils/api');
            const response = await api.get('/api/jobs', {
              params: {
                page: 1,
                limit: 100,
                vehicleId: vehicle.id,
              },
            });
            const jobs = response.data.data || [];
            if (jobs && jobs.length > 0) {
              // Sort by createdAt descending and get the most recent job
              const sortedJobs = [...jobs].sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              const lastJob = sortedJobs[0];
              if (lastJob && lastJob.customerId) {
                // Verify this customer is still an owner
                const isOwner = fullVehicle.owners.some(o => o.id === lastJob.customerId);
                if (isOwner) {
                  const customer = await customerStore.fetchCustomerById(lastJob.customerId);
                  if (customer) {
                    setSelectedCustomer(customer as CustomerWithVehicles);
                    setSearchInputValue('');
                    setSearchResults([]);
                    return;
                  }
                }
              }
            }
          } catch (err) {
            console.error('Failed to fetch jobs:', err);
          }
          
          // No jobs or last job customer not found - use primary owner or first owner
          const primaryOwner = fullVehicle.vehicleOwners?.find(vo => vo.isPrimary);
          const defaultOwner = primaryOwner 
            ? fullVehicle.owners.find(o => o.id === primaryOwner.customerId)
            : fullVehicle.owners[0];
          
          if (defaultOwner) {
            const customer = await customerStore.fetchCustomerById(defaultOwner.id);
            if (customer) {
              setSelectedCustomer(customer as CustomerWithVehicles);
            }
          }
        } else if (vehicle.customer && vehicle.customer.id) {
          // Fallback to old customer field for backward compatibility
          try {
            const customer = await customerStore.fetchCustomerById(vehicle.customer.id);
            if (customer) {
              setSelectedCustomer(customer as CustomerWithVehicles);
            }
          } catch (err) {
            console.error('Failed to fetch customer:', err);
          }
        }
      } catch (err) {
        console.error('Failed to fetch vehicle details:', err);
        // Fallback to old behavior
        if (vehicle.customer && vehicle.customer.id) {
          try {
            const customer = await customerStore.fetchCustomerById(vehicle.customer.id);
            if (customer) {
              setSelectedCustomer(customer as CustomerWithVehicles);
            }
          } catch (fetchErr) {
            console.error('Failed to fetch customer:', fetchErr);
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
    // Preserve the vehicle selection flag when creating a new customer
    // This ensures the vehicle isn't cleared when the new customer has no vehicles yet
    const hadVehicleSelected = !!selectedVehicle;
    if (hadVehicleSelected) {
      vehicleSelectedFirstRef.current = true;
    }
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Step 1: Find or create a vehicle or customer
                  </Typography>
                  {authStore.canEdit && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateCustomerOpen(true)}
                      >
                        New Customer
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateVehicleOpen(true)}
                      >
                        New Vehicle
                      </Button>
                    </Box>
                  )}
                </Box>
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
                  onKeyDown={(e) => {
                    // If Enter is pressed and there are no results, open create customer dialog
                    if (e.key === 'Enter' && searchInputValue.trim() && searchResults.length === 0 && !isSearching && authStore.canEdit) {
                      e.preventDefault();
                      // Check if it looks like a vehicle identifier (VIN or license plate)
                      const searchType = detectSearchType(searchInputValue);
                      if (searchType === 'vin' || searchType === 'licensePlate') {
                        setCreateVehicleOpen(true);
                      } else {
                        // Default to creating customer
                        setCreateCustomerOpen(true);
                      }
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
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          No results found
                        </Typography>
                        {authStore.canEdit && (
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                              Press Enter to create new {detectSearchType(searchInputValue) === 'vin' || detectSearchType(searchInputValue) === 'licensePlate' ? 'vehicle' : 'customer'}
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
                          </>
                        )}
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
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
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
                      } else if (value && typeof value === 'string' && value.trim()) {
                        // User typed something and pressed Enter - open create dialog
                        setCreateCustomerOpen(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      // If Enter is pressed and there are no customer results, open create customer dialog
                      if (e.key === 'Enter' && searchInputValue.trim() && searchResults.filter(r => r.type === 'customer').length === 0 && !isSearching && authStore.canEdit) {
                        e.preventDefault();
                        setCreateCustomerOpen(true);
                      }
                    }}
                    loading={isSearching}
                    sx={{ flex: 1 }}
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
                          {authStore.canEdit && (
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                                Press Enter to create new customer
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => setCreateCustomerOpen(true)}
                                fullWidth
                              >
                                Create "{searchInputValue.trim()}"
                              </Button>
                            </>
                          )}
                        </Box>
                      ) : (
                        'Start typing to search for customer...'
                      )
                    }
                  />
                  {authStore.canEdit && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setCreateCustomerOpen(true)}
                      sx={{ minWidth: 'auto', px: 2 }}
                    >
                      Create New
                    </Button>
                  )}
                </Box>
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
                  onKeyDown={(e) => {
                    // If Enter is pressed and there are no vehicle results, open create vehicle dialog
                    if (e.key === 'Enter' && searchInputValue.trim() && searchResults.filter(r => r.type === 'vehicle').length === 0 && !isSearching && authStore.canEdit) {
                      e.preventDefault();
                      setCreateVehicleOpen(true);
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
                        {authStore.canEdit && (
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                              Press Enter to create new vehicle
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => setCreateVehicleOpen(true)}
                              fullWidth
                            >
                              Create New Vehicle
                            </Button>
                          </>
                        )}
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
        onClose={() => {
          setCreateCustomerOpen(false);
          // Don't clear searchInputValue - user might want to search again
        }}
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
  }, [selectedMake, vehicleStore]);

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
        customerIds: customerId ? [customerId] : [],
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
  sku?: string | null;
  unitPrice: number;
  type: 'INVENTORY' | 'LABOUR' | 'SERVICE';
}

const JobDetail: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const { jobStore, templateStore, inventoryStore, labourStore, serviceStore, settingsStore, invoiceStore, auditLogStore, paymentMethodStore, paymentStore, authStore } = useStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [vehicleJobs, setVehicleJobs] = useState<Job[]>([]);
  const [loadingVehicleJobs, setLoadingVehicleJobs] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [creditNoteDialogOpen, setCreditNoteDialogOpen] = useState(false);
  const [creditNoteAmount, setCreditNoteAmount] = useState('');
  const [creditNoteTaxType, setCreditNoteTaxType] = useState<'pre-tax' | 'post-tax'>('post-tax');
  const [creditNoteReason, setCreditNoteReason] = useState('');
  const [creditNoteDate, setCreditNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [creditNotes, setCreditNotes] = useState<Array<{ id: string; creditNoteNumber: string; amount: number; reason: string | null; creditDate: string; createdAt: string }>>([]);
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  
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
      auditLogStore.fetchByJob(id);
      // Fetch invoice for this job
      invoiceStore.fetchByJobId(id);
      // Fetch payment methods
      paymentMethodStore.fetchAll();
    }

    return () => {
      jobStore.clearSelectedJob();
      invoiceStore.clearSelectedInvoice();
      auditLogStore.clearAuditLogs();
      paymentStore.clearPayments();
    };
  }, [id, jobStore, templateStore, inventoryStore, labourStore, serviceStore, settingsStore, invoiceStore, auditLogStore, paymentMethodStore, paymentStore]);

  // Fetch payment methods when payment dialog opens
  useEffect(() => {
    if (paymentDialogOpen) {
      paymentMethodStore.fetchAll();
    }
  }, [paymentDialogOpen, paymentMethodStore]);

  // Fetch credit notes, payments, and remaining balance when invoice is loaded
  useEffect(() => {
    const fetchInvoiceInfo = async () => {
      if (invoiceStore.selectedInvoice?.id) {
        try {
          const [creditNotesData, paymentsData, balance] = await Promise.all([
            invoiceStore.fetchCreditNotes(invoiceStore.selectedInvoice.id),
            paymentStore.fetchByInvoiceId(invoiceStore.selectedInvoice.id),
            invoiceStore.getRemainingBalance(invoiceStore.selectedInvoice.id),
          ]);
          setCreditNotes(creditNotesData);
          setPayments(paymentsData);
          setRemainingBalance(balance);
        } catch (error) {
          console.error('Failed to fetch invoice info:', error);
          setCreditNotes([]);
          setPayments([]);
          setRemainingBalance(null);
        }
      } else {
        setCreditNotes([]);
        setPayments([]);
        setRemainingBalance(null);
      }
    };

    fetchInvoiceInfo();
  }, [invoiceStore.selectedInvoice?.id, invoiceStore, paymentStore]);

  const job = jobStore.selectedJob;

  // Calculate job totals helper
  const calculateJobTotals = (job: Job) => {
    const subtotal = job.lineItems?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0;
    let discount = 0;
    if (job.discountPercent && job.discountPercent > 0) {
      discount = subtotal * (job.discountPercent / 100);
    } else {
      discount = job.discountAmount || 0;
    }
    const afterDiscount = Math.max(0, subtotal - discount);
    const gst = afterDiscount * ((job.taxRate || 0) / 100);
    const total = afterDiscount + gst;
    return { subtotal: afterDiscount, gst, total };
  };

  // Fetch vehicle jobs when vehicle dialog opens
  useEffect(() => {
    const fetchVehicleJobs = async () => {
      if (vehicleDialogOpen && job?.vehicleId) {
        setLoadingVehicleJobs(true);
        try {
          // Fetch jobs for this vehicle
          const params = new URLSearchParams({
            page: '1',
            limit: '10',
            vehicleId: job.vehicleId,
          });
          const response = await api.get(`/api/jobs?${params}`);
          // Filter out current job and sort by created date descending
          const jobs = (response.data.data || []).filter((j: Job) => j.id !== job.id);
          jobs.sort((a: Job, b: Job) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setVehicleJobs(jobs.slice(0, 5)); // Show last 5 jobs
        } catch (error) {
          console.error('Failed to fetch vehicle jobs:', error);
          setVehicleJobs([]);
        } finally {
          setLoadingVehicleJobs(false);
        }
      }
    };
    fetchVehicleJobs();
  }, [vehicleDialogOpen, job?.vehicleId, job?.id]);

  // Build options for line item autocomplete
  const getLineItemOptions = (): SelectedLineItem[] => {
    switch (lineItemType) {
      case 'INVENTORY':
        return inventoryStore.items.map((item) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          sku: item.sku,
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

  // Fetch invoice when job changes
  useEffect(() => {
    if (job?.invoiceId) {
      invoiceStore.fetchById(job.invoiceId);
    } else if (job?.id && job.status === 'COMPLETED') {
      invoiceStore.fetchByJobId(job.id);
    }
  }, [job?.id, job?.invoiceId, job?.status, invoiceStore]);

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
      // Refetch audit logs after status change
      if (id) {
        await auditLogStore.fetchByJob(id);
      }
    }
    setAnchorEl(null);
  };

  const handleConvertToInvoice = async () => {
    if (job) {
      try {
        await invoiceStore.createFromJob(job.id);
        await jobStore.fetchJobById(job.id); // Refresh job to get invoiceId
      } catch (error) {
        // Error handling is done in the store
      }
    }
  };

  const handleAddPayment = async () => {
    if (!invoiceStore.selectedInvoice || !paymentMethodId || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    try {
      await paymentStore.create(invoiceStore.selectedInvoice.id, {
        paymentMethodId,
        amount,
        paymentNote: paymentNote || undefined,
      });
      
      // Refresh invoice info
      const [creditNotesData, paymentsData, balance] = await Promise.all([
        invoiceStore.fetchCreditNotes(invoiceStore.selectedInvoice.id),
        paymentStore.fetchByInvoiceId(invoiceStore.selectedInvoice.id),
        invoiceStore.getRemainingBalance(invoiceStore.selectedInvoice.id),
      ]);
      setCreditNotes(creditNotesData);
      setPayments(paymentsData);
      setRemainingBalance(balance);
      
      // Refresh invoice to get updated status
      await invoiceStore.fetchById(invoiceStore.selectedInvoice.id);
      
      setPaymentDialogOpen(false);
      setPaymentMethodId('');
      setPaymentAmount('');
      setPaymentNote('');
    } catch (error) {
      // Error handling is done in the store
    }
  };

  const handleCreateCreditNote = async () => {
    if (!invoiceStore.selectedInvoice || !creditNoteAmount) return;

    const enteredAmount = parseFloat(creditNoteAmount);
    if (isNaN(enteredAmount) || enteredAmount <= 0) {
      return;
    }

    // Convert to pre-tax amount if user entered post-tax
    const taxRate = job?.taxRate || 0;
    let preTaxAmount: number;
    
    if (creditNoteTaxType === 'post-tax') {
      // Convert post-tax to pre-tax: preTax = postTax / (1 + taxRate/100)
      preTaxAmount = enteredAmount / (1 + taxRate / 100);
    } else {
      // Already pre-tax
      preTaxAmount = enteredAmount;
    }

    try {
      await invoiceStore.createCreditNote(invoiceStore.selectedInvoice.id, {
        amount: preTaxAmount, // Always send pre-tax amount to backend
        reason: creditNoteReason || undefined,
        creditDate: creditNoteDate || undefined,
      });
      setCreditNoteDialogOpen(false);
      setCreditNoteAmount('');
      setCreditNoteTaxType('post-tax');
      setCreditNoteReason('');
      setCreditNoteDate(new Date().toISOString().split('T')[0]);
      
      // Refresh invoice to get updated status (may have been auto-marked as paid)
      if (job) {
        await invoiceStore.fetchByJobId(job.id);
      }
      
      // Refresh credit notes and balance
      const [creditNotesData, balance] = await Promise.all([
        invoiceStore.fetchCreditNotes(invoiceStore.selectedInvoice.id),
        invoiceStore.getRemainingBalance(invoiceStore.selectedInvoice.id),
      ]);
      setCreditNotes(creditNotesData);
      setRemainingBalance(balance);
    } catch (error) {
      // Error handling is done in the store
    }
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
      // For inventory items, use SKU if available, otherwise fallback to code
      // For labour and service items, use code (they don't have SKU)
      const identifier = selectedLineItem.type === 'INVENTORY' && selectedLineItem.sku
        ? selectedLineItem.sku
        : selectedLineItem.code;
      
      itemData = {
        type: lineItemType,
        referenceId: selectedLineItem.id,
        description: `${selectedLineItem.name} (${identifier})`,
        quantity: parseFloat(lineItemQuantity) || 1,
        unitPrice: parseFloat(lineItemPrice) || selectedLineItem.unitPrice,
      };
    } else {
      return;
    }

    await jobStore.addLineItem(job.id, itemData);
    // Refetch audit logs after adding line item
    if (id) {
      await auditLogStore.fetchByJob(id);
    }
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
      // Refetch audit logs after applying template (which adds line items)
      if (id) {
        await auditLogStore.fetchByJob(id);
      }
      setTemplateDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (job) {
      await jobStore.deleteLineItem(job.id, itemId);
      // Refetch audit logs after deleting line item
      if (id) {
        await auditLogStore.fetchByJob(id);
      }
      setDeleteItemConfirm(null);
    }
  };

  const handleUpdateLineItem = async (itemId: string, data: { description?: string; quantity?: number; unitPrice?: number }) => {
    if (job) {
      try {
        await jobStore.updateLineItem(job.id, itemId, data);
        // Refetch audit logs after updating line item
        if (id) {
          await auditLogStore.fetchByJob(id);
        }
      } catch (err) {
        // Version conflict error is already handled by the store
        // The store refreshes the job data automatically
        // Just show a notification or let the store error message be displayed
        console.error('Failed to update line item:', err);
      }
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

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDialogType, setEmailDialogType] = useState<'estimate' | 'invoice'>('estimate');

  const handleDownloadPdf = async (type: 'estimate' | 'invoice') => {
    if (!job || isDownloadingPdf) return;

    setIsDownloadingPdf(true);
    try {
      // Make API call to download PDF
      const response = await api.get(`/api/jobs/${job.id}/pdf?type=${type}`, {
        responseType: 'blob',
      });

      // Create blob and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-${job.code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (jobStore.isLoading || !job) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const canEdit = !authStore.isViewer && job.status !== 'COMPLETED' && job.status !== 'CANCELLED';
  // Flexible transitions - allow any status to transition to any other status
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
            {statusConfig[job.status] ? (
              <Chip label={statusConfig[job.status].label} color={statusConfig[job.status].color} />
            ) : (
              <Chip label={job.status} color="default" />
            )}
          </Box>
          <Typography color="text.secondary">
            {job.customer?.name} • {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
          </Typography>
        </Box>
        
        {/* Print and Next Step Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Download PDF and Email Buttons */}
          {authStore.canEdit && (job.status !== 'COMPLETED' || (job.status === 'COMPLETED' && job.invoiceId)) && (
            <>
              <Button
                variant="outlined"
                startIcon={isDownloadingPdf ? <CircularProgress size={16} /> : <DownloadIcon />}
                onClick={() => handleDownloadPdf(job.status === 'COMPLETED' && job.invoiceId ? 'invoice' : 'estimate')}
                disabled={isDownloadingPdf}
              >
                {isDownloadingPdf ? 'Generating PDF...' : 'Download'}
              </Button>
              {job.customer?.email && (
                <Button
                  variant="outlined"
                  startIcon={<MailIcon />}
                  onClick={() => {
                    const emailType = job.status === 'COMPLETED' && job.invoiceId ? 'invoice' : 'estimate';
                    setEmailDialogType(emailType);
                    setEmailDialogOpen(true);
                  }}
                >
                  Email
                </Button>
              )}
            </>
          )}
          
          {/* Next Natural Step Button */}
          {authStore.canEdit && job.status === 'BOOKED' && (
            <Button
              variant="contained"
              startIcon={<StartIcon />}
              onClick={() => handleStatusChange('IN_PROGRESS')}
            >
              Start Work
            </Button>
          )}
          {authStore.canEdit && job.status === 'IN_PROGRESS' && (
            <Button
              variant="contained"
              startIcon={<ApproveIcon />}
              onClick={() => handleStatusChange('COMPLETED')}
            >
              Mark Complete
            </Button>
          )}
          {authStore.canEdit && job.status === 'COMPLETED' && !job.invoiceId && (
            <Button
              variant="contained"
              startIcon={<InvoiceIcon />}
              onClick={handleConvertToInvoice}
              disabled={invoiceStore.isLoading}
            >
              Convert to Invoice
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
        {authStore.canEdit && allStatuses.filter(s => s !== job.status).map((status) => (
          <MenuItem key={status} onClick={() => handleStatusChange(status)}>
            <ListItemIcon>
              {status === 'BOOKED' && <JobIcon fontSize="small" />}
              {status === 'IN_PROGRESS' && <StartIcon fontSize="small" />}
              {status === 'PENDING' && <PauseIcon fontSize="small" />}
              {status === 'AWAITING_PICKUP' && <VehicleIcon fontSize="small" />}
              {status === 'COMPLETED' && <ApproveIcon fontSize="small" />}
              {status === 'CANCELLED' && <CancelIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{statusConfig[status]?.label || status}</ListItemText>
          </MenuItem>
        ))}
        {authStore.canEdit && allStatuses.filter(s => s !== job.status).length > 0 && <Divider />}
        {canEdit && (
          <MenuItem onClick={() => { setEditDialogOpen(true); setAnchorEl(null); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Details</ListItemText>
          </MenuItem>
        )}
        {authStore.canEdit && (
          <MenuItem onClick={handleDuplicate}>
            <ListItemIcon>
              <DuplicateIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
        )}
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
          
          {/* Audit Trail - Outside the card with grey background */}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Audit Trail
            </Typography>
            {auditLogStore.isLoading ? (
              <Typography variant="caption" color="text.secondary">
                Loading...
              </Typography>
            ) : auditLogStore.auditLogs.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                No audit history available
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {auditLogStore.auditLogs.map((log) => {
                  let changeDescription = '';
                  
                  if (log.entityType === 'Job') {
                    if (log.action === 'CREATE') {
                      changeDescription = 'Job created';
                    } else if (log.action === 'UPDATE' && log.oldValue && log.newValue) {
                      const oldVal = log.oldValue as Record<string, unknown>;
                      const newVal = log.newValue as Record<string, unknown>;
                      if (oldVal.status !== newVal.status) {
                        changeDescription = `Status changed from ${oldVal.status} to ${newVal.status}`;
                      } else {
                        changeDescription = 'Job updated';
                      }
                    } else if (log.action === 'DELETE') {
                      changeDescription = 'Job deleted';
                    }
                  } else if (log.entityType === 'LineItem') {
                    if (log.action === 'CREATE') {
                      const newVal = log.newValue as Record<string, unknown>;
                      changeDescription = `Line item added: ${(newVal.description as string) || 'Item'}`;
                    } else if (log.action === 'UPDATE') {
                      const newVal = log.newValue as Record<string, unknown>;
                      changeDescription = `Line item updated: ${(newVal.description as string) || 'Item'}`;
                    } else if (log.action === 'DELETE') {
                      const oldVal = log.oldValue as Record<string, unknown>;
                      changeDescription = `Line item removed: ${(oldVal.description as string) || 'Item'}`;
                    }
                  } else {
                    changeDescription = `${log.action} ${log.entityType}`;
                  }
                  
                  return (
                    <Typography key={log.id} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {changeDescription} {log.user ? `by ${log.user.name}` : ''} on {formatDate(log.createdAt)}
                    </Typography>
                  );
                })}
              </Box>
            )}
          </Box>
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

          {/* Invoice Section */}
          {job.status === 'COMPLETED' && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Invoice
                </Typography>
                {invoiceStore.selectedInvoice ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Invoice Number
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {invoiceStore.selectedInvoice.invoiceNumber}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={invoiceStore.selectedInvoice.status}
                        color={invoiceStore.selectedInvoice.status === 'PAID' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Invoice Date
                      </Typography>
                      <Typography variant="body2">{formatDate(invoiceStore.selectedInvoice.invoiceDate)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Due Date
                      </Typography>
                      <Typography variant="body2">{formatDate(invoiceStore.selectedInvoice.dueDate)}</Typography>
                    </Box>
                    
                    {/* Invoice Total */}
                    {job && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Invoice Total
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {formatCurrency(calculateJobTotals(job).total)}
                          </Typography>
                        </Box>
                        
                        {/* Credit Notes */}
                        {creditNotes.length > 0 && (
                          <>
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Credit Notes
                              </Typography>
                              {creditNotes.map((cn) => {
                                // Credit notes are stored as pre-tax, convert to post-tax for display
                                const taxRate = job?.taxRate || 0;
                                const postTaxAmount = cn.amount * (1 + taxRate / 100);
                                return (
                                  <Box 
                                    key={cn.id} 
                                    sx={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center',
                                      mb: 0.5 
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                      {cn.creditNoteNumber} {cn.reason && `- ${cn.reason}`}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" color="error" sx={{ fontSize: '0.875rem' }}>
                                        -{formatCurrency(postTaxAmount)}
                                      </Typography>
                                      {authStore.canEdit && (
                                        <IconButton
                                          size="small"
                                          onClick={async () => {
                                            if (!invoiceStore.selectedInvoice) return;
                                            if (window.confirm(`Are you sure you want to delete credit note ${cn.creditNoteNumber}?`)) {
                                              try {
                                                await invoiceStore.deleteCreditNote(
                                                  invoiceStore.selectedInvoice.id,
                                                  cn.id
                                                );
                                                // Refresh credit notes and balance
                                                const [creditNotesData, balance] = await Promise.all([
                                                  invoiceStore.fetchCreditNotes(invoiceStore.selectedInvoice.id),
                                                  invoiceStore.getRemainingBalance(invoiceStore.selectedInvoice.id),
                                                ]);
                                                setCreditNotes(creditNotesData);
                                                setRemainingBalance(balance);
                                                // Refresh invoice to get updated status
                                                if (job) {
                                                  await invoiceStore.fetchByJobId(job.id);
                                                }
                                              } catch (error) {
                                                // Error handling is done in the store
                                              }
                                            }
                                          }}
                                          sx={{ padding: 0.5 }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      )}
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                            <Divider sx={{ my: 1 }} />
                          </>
                        )}
                        
                        {/* Remaining Balance */}
                        {remainingBalance !== null && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight={600}>
                              Remaining Balance
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color={remainingBalance === 0 ? 'success.main' : 'text.primary'}>
                              {formatCurrency(remainingBalance)}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                    
                    {authStore.canEdit && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          fullWidth
                          onClick={() => setCreditNoteDialogOpen(true)}
                          disabled={invoiceStore.isLoading || (remainingBalance !== null && remainingBalance <= 0)}
                        >
                          Issue Credit Note
                        </Button>
                        {remainingBalance !== null && remainingBalance > 0 && (
                          <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            onClick={() => {
                              setPaymentAmount(remainingBalance.toFixed(2));
                              setPaymentDialogOpen(true);
                            }}
                          >
                            Add Payment
                          </Button>
                        )}
                      </Box>
                    )}
                    
                    {/* Payments */}
                    {payments.length > 0 && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Payments
                          </Typography>
                          {payments.map((payment) => (
                            <Box 
                              key={payment.id} 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                mb: 0.5 
                              }}
                            >
                              <Box>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                  {formatDate(payment.paymentDate)} - {payment.paymentMethod?.name || 'Unknown'}
                                </Typography>
                                {payment.paymentNote && (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                                    {payment.paymentNote}
                                  </Typography>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="success.main" sx={{ fontSize: '0.875rem' }}>
                                  {formatCurrency(parseFloat(String(payment.amount || 0)))}
                                </Typography>
                                {authStore.canEdit && (
                                  <IconButton
                                    size="small"
                                    onClick={async () => {
                                      if (!invoiceStore.selectedInvoice) return;
                                      if (window.confirm(`Are you sure you want to delete this payment?`)) {
                                        try {
                                          await paymentStore.delete(invoiceStore.selectedInvoice.id, payment.id);
                                          
                                          // Refresh invoice info
                                          const [creditNotesData, paymentsData, balance] = await Promise.all([
                                            invoiceStore.fetchCreditNotes(invoiceStore.selectedInvoice.id),
                                            paymentStore.fetchByInvoiceId(invoiceStore.selectedInvoice.id),
                                            invoiceStore.getRemainingBalance(invoiceStore.selectedInvoice.id),
                                          ]);
                                          setCreditNotes(creditNotesData);
                                          setPayments(paymentsData);
                                          setRemainingBalance(balance);
                                          
                                          // Refresh invoice to get updated status
                                          await invoiceStore.fetchById(invoiceStore.selectedInvoice.id);
                                        } catch (error) {
                                          // Error handling is done in the store
                                        }
                                      }
                                    }}
                                    sx={{ padding: 0.5 }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </Box>
                          ))}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="body2" fontWeight={500}>
                              Total Paid
                            </Typography>
                            <Typography variant="body2" fontWeight={500} color="success.main">
                              {formatCurrency(payments.reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0))}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No invoice created yet
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<InvoiceIcon />}
                      onClick={handleConvertToInvoice}
                      disabled={invoiceStore.isLoading}
                    >
                      Convert to Invoice
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

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
                  getOptionLabel={(option) => {
                    // For inventory items, show SKU if available, otherwise code
                    // For labour and service items, show code
                    const identifier = option.type === 'INVENTORY' && option.sku
                      ? option.sku
                      : option.code;
                    return `${option.name} (${identifier})`;
                  }}
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
                  renderOption={(props, option) => {
                    // For inventory items, show SKU if available, otherwise code
                    // For labour and service items, show code
                    const identifier = option.type === 'INVENTORY' && option.sku
                      ? option.sku
                      : option.code;
                    return (
                      <li {...props} key={option.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{option.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{identifier}</Typography>
                          </Box>
                          <Typography variant="body2" color="primary">
                            {settingsStore.currencySettings.symbol || '$'}{Number(option.unitPrice).toFixed(2)}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
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
              
              <Divider sx={{ my: 2 }} />
              
              {/* Recent Jobs for this Vehicle */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Recent Jobs
                </Typography>
                {loadingVehicleJobs ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : vehicleJobs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No other jobs for this vehicle
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Code</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vehicleJobs.map((vehicleJob) => (
                        <TableRow key={vehicleJob.id} hover>
                          <TableCell>
                            <Typography fontFamily="monospace" fontWeight={500}>
                              {vehicleJob.code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {statusConfig[vehicleJob.status] ? (
                              <Chip
                                label={statusConfig[vehicleJob.status].label}
                                color={statusConfig[vehicleJob.status].color}
                                size="small"
                              />
                            ) : (
                              <Chip label={vehicleJob.status} color="default" size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(vehicleJob.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => {
                                window.open(`/jobs/${vehicleJob.id}`, '_blank');
                              }}
                            >
                              <OpenIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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

      {/* Credit Note Dialog */}
      <Dialog 
        open={creditNoteDialogOpen} 
        onClose={() => { 
          setCreditNoteDialogOpen(false); 
          setCreditNoteAmount(''); 
          setCreditNoteTaxType('post-tax');
          setCreditNoteReason(''); 
          setCreditNoteDate(new Date().toISOString().split('T')[0]); 
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Issue Credit Note</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl component="fieldset">
              <Typography variant="body2" sx={{ mb: 1 }}>Is this credit note amount pre-tax or post-tax?</Typography>
              <RadioGroup
                row
                value={creditNoteTaxType}
                onChange={(e) => setCreditNoteTaxType(e.target.value as 'pre-tax' | 'post-tax')}
              >
                <FormControlLabel value="pre-tax" control={<Radio />} label="Pre-tax" />
                <FormControlLabel value="post-tax" control={<Radio />} label="Post-tax" />
              </RadioGroup>
            </FormControl>
            
            <TextField
              label={`Amount (${creditNoteTaxType === 'pre-tax' ? 'Pre-tax' : 'Post-tax'})`}
              type="number"
              fullWidth
              value={creditNoteAmount}
              onChange={(e) => {
                const inputValue = e.target.value;
                // Allow empty string for clearing the field
                if (inputValue === '') {
                  setCreditNoteAmount('');
                  return;
                }
                
                const numValue = parseFloat(inputValue);
                // If not a valid number, keep the input as-is (user might be typing)
                if (isNaN(numValue)) {
                  setCreditNoteAmount(inputValue);
                  return;
                }
                
                // Calculate the maximum allowed amount based on tax type
                let maxAllowed = remainingBalance;
                if (remainingBalance !== null && creditNoteTaxType === 'pre-tax' && job?.taxRate) {
                  // If entering pre-tax, convert remaining balance (post-tax) to pre-tax
                  maxAllowed = remainingBalance / (1 + (job.taxRate || 0) / 100);
                }
                
                // Round to 2 decimal places for comparison
                const maxAllowedRounded = maxAllowed !== null ? Math.round(maxAllowed * 100) / 100 : null;
                const numValueRounded = Math.round(numValue * 100) / 100;
                
                // Cap the value at the maximum allowed (with 0.01 tolerance for floating point precision)
                if (maxAllowedRounded !== null && numValueRounded > maxAllowedRounded + 0.01) {
                  setCreditNoteAmount(maxAllowedRounded.toFixed(2));
                } else if (numValue < 0) {
                  // Prevent negative values
                  setCreditNoteAmount('0');
                } else {
                  setCreditNoteAmount(inputValue);
                }
              }}
              onBlur={(e) => {
                // On blur, ensure the value is properly formatted and capped
                const numValue = parseFloat(e.target.value);
                if (!isNaN(numValue)) {
                  let maxAllowed = remainingBalance;
                  if (remainingBalance !== null && creditNoteTaxType === 'pre-tax' && job?.taxRate) {
                    maxAllowed = remainingBalance / (1 + (job.taxRate || 0) / 100);
                  }
                  
                  // Round to 2 decimal places for comparison
                  const maxAllowedRounded = maxAllowed !== null ? Math.round(maxAllowed * 100) / 100 : null;
                  const numValueRounded = Math.round(numValue * 100) / 100;
                  
                  // Cap the value at the maximum allowed (with 0.01 tolerance for floating point precision)
                  if (maxAllowedRounded !== null && numValueRounded > maxAllowedRounded + 0.01) {
                    setCreditNoteAmount(maxAllowedRounded.toFixed(2));
                  } else if (numValue < 0) {
                    setCreditNoteAmount('0');
                  } else if (numValue > 0) {
                    // Format to 2 decimal places
                    setCreditNoteAmount(numValue.toFixed(2));
                  }
                }
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">{settingsStore.currencySettings.symbol || '$'}</InputAdornment>,
                inputProps: {
                  min: 0,
                  step: 0.01,
                },
              }}
              helperText={
                (() => {
                  if (!remainingBalance || !creditNoteAmount) {
                  if (remainingBalance !== null) {
                    const maxPreTax = job?.taxRate ? remainingBalance / (1 + (job.taxRate || 0) / 100) : remainingBalance;
                    return `Maximum: ${formatCurrency(creditNoteTaxType === 'pre-tax' ? maxPreTax : remainingBalance)}`;
                  }
                  return '';
                }
                
                const enteredAmount = parseFloat(creditNoteAmount || '0');
                const taxRate = job?.taxRate || 0;
                  
                  // Calculate pre-tax and post-tax equivalents
                  let preTaxAmount: number;
                  let postTaxAmount: number;
                  
                  if (creditNoteTaxType === 'pre-tax') {
                    preTaxAmount = enteredAmount;
                    postTaxAmount = enteredAmount * (1 + taxRate / 100);
                  } else {
                    postTaxAmount = enteredAmount;
                    preTaxAmount = enteredAmount / (1 + taxRate / 100);
                  }
                  
                  // Calculate maximum allowed
                  const maxPreTax = remainingBalance / (1 + taxRate / 100);
                  const maxPostTax = remainingBalance;
                  
                  const exceedsMax = creditNoteTaxType === 'pre-tax' 
                    ? enteredAmount > maxPreTax
                    : enteredAmount > maxPostTax;
                  
                  if (exceedsMax) {
                    return `Maximum allowed: ${formatCurrency(creditNoteTaxType === 'pre-tax' ? maxPreTax : maxPostTax)}. Value has been capped.`;
                  }
                  
                  // Show conversion and remaining balance
                  const remainingAfter = Math.max(0, remainingBalance - postTaxAmount);
                  return (
                    `Pre-tax: ${formatCurrency(preTaxAmount)}, Post-tax: ${formatCurrency(postTaxAmount)}. ` +
                    `Remaining after credit: ${formatCurrency(remainingAfter)}`
                  );
                })()
              }
            />
            <TextField
              label="Credit Date"
              type="date"
              fullWidth
              value={creditNoteDate}
              onChange={(e) => setCreditNoteDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="Reason (optional)"
              multiline
              rows={3}
              fullWidth
              value={creditNoteReason}
              onChange={(e) => setCreditNoteReason(e.target.value)}
              placeholder="e.g., Returned parts, Warranty claim, etc."
            />
            {remainingBalance !== null && job && (
              <Alert severity="info">
                Invoice total: {formatCurrency(calculateJobTotals(job).total)}<br />
                Existing credits: {formatCurrency(
                  creditNotes.reduce((sum, cn) => {
                    // Credit notes are stored as pre-tax, convert to post-tax for display
                    const taxRate = job?.taxRate || 0;
                    return sum + (cn.amount * (1 + taxRate / 100));
                  }, 0)
                )}<br />
                Remaining balance: {formatCurrency(remainingBalance)}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { 
            setCreditNoteDialogOpen(false); 
            setCreditNoteAmount(''); 
            setCreditNoteTaxType('post-tax');
            setCreditNoteReason(''); 
            setCreditNoteDate(new Date().toISOString().split('T')[0]); 
          }}>Cancel</Button>
          <Button 
            onClick={handleCreateCreditNote} 
            variant="contained" 
            disabled={
              !creditNoteAmount || 
              parseFloat(creditNoteAmount || '0') <= 0 || 
              invoiceStore.isLoading ||
              (() => {
                if (!remainingBalance || !creditNoteAmount) return false;
                const enteredAmount = parseFloat(creditNoteAmount || '0');
                const taxRate = job?.taxRate || 0;
                
                // Calculate maximum allowed based on tax type
                // Round to 2 decimal places to avoid floating point precision issues
                const maxPreTax = Math.round((remainingBalance / (1 + taxRate / 100)) * 100) / 100;
                const maxPostTax = Math.round(remainingBalance * 100) / 100;
                const enteredAmountRounded = Math.round(enteredAmount * 100) / 100;
                
                // Allow values within 0.01 tolerance to account for floating point precision
                const exceedsMax = creditNoteTaxType === 'pre-tax' 
                  ? enteredAmountRounded > maxPreTax + 0.01
                  : enteredAmountRounded > maxPostTax + 0.01;
                
                return exceedsMax;
              })()
            }
          >
            Issue Credit Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => { 
          setPaymentDialogOpen(false); 
          setPaymentMethodId('');
          setPaymentAmount('');
          setPaymentNote(''); 
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Payment Amount"
              type="number"
              fullWidth
              required
              value={paymentAmount}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty, numbers, and one decimal point
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setPaymentAmount(value);
                }
              }}
              onBlur={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value > 0) {
                  // Cap at remaining balance
                  if (remainingBalance !== null && value > remainingBalance) {
                    setPaymentAmount(remainingBalance.toFixed(2));
                  } else {
                    setPaymentAmount(value.toFixed(2));
                  }
                }
              }}
              helperText={
                remainingBalance !== null
                  ? `Remaining balance: ${formatCurrency(remainingBalance)}`
                  : ''
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />
            <FormControl fullWidth required>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                label="Payment Method"
              >
                {paymentMethodStore.paymentMethods.map((method) => (
                  <MenuItem key={method.id} value={method.id}>
                    {method.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Payment Note (Optional)"
              multiline
              rows={3}
              fullWidth
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="e.g., Check #1234, Bank transfer reference"
              helperText="Add any additional notes about the payment"
            />
            {remainingBalance !== null && paymentAmount && !isNaN(parseFloat(paymentAmount)) && (
              <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  After this payment:
                </Typography>
                <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                  Remaining: {formatCurrency(Math.max(0, remainingBalance - parseFloat(paymentAmount)))}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { 
            setPaymentDialogOpen(false); 
            setPaymentMethodId('');
            setPaymentAmount('');
            setPaymentNote(''); 
          }}>Cancel</Button>
          <Button 
            onClick={handleAddPayment} 
            color="success" 
            variant="contained" 
            disabled={paymentStore.isLoading || !paymentMethodId || !paymentAmount || parseFloat(paymentAmount) <= 0 || (remainingBalance !== null && parseFloat(paymentAmount) > remainingBalance + 0.01)}
          >
            Add Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Job Dialog */}
      <EditJobDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        job={job}
      />
      {job && (
        <EmailDialog
          open={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          jobId={job.id}
          jobCode={job.code}
          customerEmail={job.customer?.email || null}
          type={emailDialogType}
          job={{
            id: job.id,
            code: job.code,
            status: job.status,
            customer: job.customer ? {
              name: job.customer.name,
              email: job.customer.email || null,
              phone: job.customer.phone || null,
            } : undefined,
            vehicle: job.vehicle ? {
              year: job.vehicle.year,
              make: job.vehicle.make,
              model: job.vehicle.model,
              vin: job.vehicle.vin || null,
              licensePlate: job.vehicle.licensePlate || null,
            } : undefined,
            lineItems: job.lineItems?.map(item => ({
              type: item.type,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              sortOrder: item.sortOrder,
            })),
            discountAmount: job.discountAmount,
            discountPercent: job.discountPercent,
            taxRate: job.taxRate,
          }}
          onSuccess={() => {
            // Email sent successfully
          }}
        />
      )}
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
  const { jobStore, settingsStore, customerStore, vehicleStore, auditLogStore } = useStore();
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

  const isBooked = job?.status === 'BOOKED';

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

      // Add customer/vehicle changes only if in booked status
      // Use refs to get current values (state updates are async, refs are sync)
      if (isBooked) {
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
      // Refetch audit logs after updating job
      await auditLogStore.fetchByJob(job.id);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job';
      setError(errorMessage);
      
      // If it's a version conflict, the store already refreshed the data
      // Keep the dialog open so user can review changes and retry
      if (errorMessage.includes('modified by another user')) {
        // Dialog stays open, error message is already set
      }
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
          {/* Customer & Vehicle Selection - Only in BOOKED status */}
          {isBooked && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Customer & Vehicle (only editable in Booked status)
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
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box>
                        <Typography fontWeight={500}>
                          {option.year} {option.make} {option.model}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.code}{option.licensePlate && ` • ${option.licensePlate}`}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
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
