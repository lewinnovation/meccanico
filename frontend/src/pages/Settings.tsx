import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar,
  InputAdornment,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Store as ShopIcon,
  Receipt as TaxIcon,
  Description as InvoiceIcon,
  AttachMoney as CurrencyIcon,
  ArrowBack as BackIcon,
  Save as SaveIcon,
  DirectionsCar as VehicleIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';
import {
  CommunicationTemplate,
  CommunicationTemplateType,
  CommunicationTemplateAction,
  CreateCommunicationTemplateDto,
} from '../stores/CommunicationTemplateStore';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// VehicleMake type is used from vehicleStore.makes

// Shop Information Settings
const ShopSettings: React.FC = observer(() => {
  const { settingsStore, authStore } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    settingsStore.fetchSettings();
  }, [settingsStore]);

  useEffect(() => {
    const shop = settingsStore.shopSettings;
    setFormData({
      name: shop.name,
      address: shop.address,
      phone: shop.phone,
      email: shop.email,
    });
  }, [settingsStore.shopSettings]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsStore.updateShopSettings({ ...formData, logo: settingsStore.shopSettings.logo });
  };

  const isReadOnly = !authStore.isAdmin;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/settings')} sx={{ mr: 1 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          Shop Information
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Shop Name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  disabled={isReadOnly}
                  data-testid="shop-name-input"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.address}
                  onChange={handleChange('address')}
                  multiline
                  rows={3}
                  disabled={isReadOnly}
                  data-testid="shop-address-input"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  disabled={isReadOnly}
                  data-testid="shop-phone-input"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  disabled={isReadOnly}
                  data-testid="shop-email-input"
                />
              </Grid>
              {authStore.isAdmin && (
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={settingsStore.isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={settingsStore.isSaving}
                    data-testid="save-shop-button"
                  >
                    Save Changes
                  </Button>
                </Grid>
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
});

// Tax Settings
const TaxSettings: React.FC = observer(() => {
  const { settingsStore, authStore } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    defaultRate: 0,
    name: '',
  });

  useEffect(() => {
    settingsStore.fetchSettings();
  }, [settingsStore]);

  useEffect(() => {
    const tax = settingsStore.taxSettings;
    setFormData({
      defaultRate: tax.defaultRate,
      name: tax.name,
    });
  }, [settingsStore.taxSettings]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'defaultRate' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsStore.updateTaxSettings(formData);
  };

  const isReadOnly = !authStore.isAdmin;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/settings')} sx={{ mr: 1 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          Tax Settings
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tax Name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  placeholder="e.g., GST, VAT, Sales Tax"
                  disabled={isReadOnly}
                  data-testid="tax-name-input"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Default Tax Rate"
                  type="number"
                  value={formData.defaultRate}
                  onChange={handleChange('defaultRate')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  disabled={isReadOnly}
                  data-testid="tax-rate-input"
                />
              </Grid>
              {authStore.isAdmin && (
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={settingsStore.isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={settingsStore.isSaving}
                    data-testid="save-tax-button"
                  >
                    Save Changes
                  </Button>
                </Grid>
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
});

// Currency Settings
const CurrencySettings: React.FC = observer(() => {
  const { settingsStore, authStore } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    symbol: '',
  });

  useEffect(() => {
    settingsStore.fetchSettings();
  }, [settingsStore]);

  useEffect(() => {
    const currency = settingsStore.currencySettings;
    setFormData({
      code: currency.code,
      symbol: currency.symbol,
    });
  }, [settingsStore.currencySettings]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsStore.updateCurrencySettings(formData);
  };

  const isReadOnly = !authStore.isAdmin;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/settings')} sx={{ mr: 1 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          Currency Settings
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Currency Code"
                  value={formData.code}
                  onChange={handleChange('code')}
                  placeholder="e.g., USD, EUR, GBP"
                  disabled={isReadOnly}
                  data-testid="currency-code-input"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Currency Symbol"
                  value={formData.symbol}
                  onChange={handleChange('symbol')}
                  placeholder="e.g., $, €, £"
                  disabled={isReadOnly}
                  data-testid="currency-symbol-input"
                />
              </Grid>
              {authStore.isAdmin && (
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={settingsStore.isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={settingsStore.isSaving}
                    data-testid="save-currency-button"
                  >
                    Save Changes
                  </Button>
                </Grid>
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
});

// Invoice Settings
const InvoiceSettings: React.FC = observer(() => {
  const { settingsStore, authStore } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    prefix: '',
    terms: '',
    footer: '',
    paymentTermsDays: 14,
  });

  useEffect(() => {
    settingsStore.fetchSettings();
  }, [settingsStore]);

  useEffect(() => {
    const invoice = settingsStore.invoiceSettings;
    setFormData({
      prefix: invoice.prefix,
      terms: invoice.terms,
      footer: invoice.footer,
      paymentTermsDays: invoice.paymentTermsDays,
    });
  }, [settingsStore.invoiceSettings]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'paymentTermsDays' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsStore.updateInvoiceSettings(formData);
  };

  const isReadOnly = !authStore.isAdmin;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/settings')} sx={{ mr: 1 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          Invoice Settings
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Number Prefix"
                  value={formData.prefix}
                  onChange={handleChange('prefix')}
                  placeholder="e.g., INV-"
                  disabled={isReadOnly}
                  data-testid="invoice-prefix-input"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Payment Terms (days)"
                  type="number"
                  value={formData.paymentTermsDays}
                  onChange={handleChange('paymentTermsDays')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">days</InputAdornment>,
                  }}
                  inputProps={{ min: 1, step: 1 }}
                  disabled={isReadOnly}
                  data-testid="invoice-payment-terms-days-input"
                  helperText="Number of days until payment is due"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Default Payment Terms"
                  value={formData.terms}
                  onChange={handleChange('terms')}
                  multiline
                  rows={3}
                  disabled={isReadOnly}
                  data-testid="invoice-terms-input"
                  helperText="Text description of payment terms (e.g., 'Payment due within 30 days')"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Invoice Footer"
                  value={formData.footer}
                  onChange={handleChange('footer')}
                  multiline
                  rows={2}
                  disabled={isReadOnly}
                  data-testid="invoice-footer-input"
                />
              </Grid>
              {authStore.isAdmin && (
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={settingsStore.isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={settingsStore.isSaving}
                    data-testid="save-invoice-button"
                  >
                    Save Changes
                  </Button>
                </Grid>
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
});

// Vehicle Makes & Models Settings
const VehicleMakesSettings: React.FC = observer(() => {
  const { vehicleStore, authStore } = useStore();
  const navigate = useNavigate();
  const [expandedMake, setExpandedMake] = useState<string | null>(null);
  const [addMakeOpen, setAddMakeOpen] = useState(false);
  const [addModelOpen, setAddModelOpen] = useState<string | null>(null);
  const [newMakeName, setNewMakeName] = useState('');
  const [newMakeCountry, setNewMakeCountry] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [newModelCategory, setNewModelCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    vehicleStore.fetchMakes();
  }, [vehicleStore]);

  const isReadOnly = !authStore.isAdmin;

  const handleToggleMake = (makeId: string) => {
    setExpandedMake(expandedMake === makeId ? null : makeId);
  };

  const handleAddMake = async () => {
    if (!newMakeName.trim()) return;
    try {
      await vehicleStore.createMake(newMakeName.trim(), newMakeCountry.trim() || undefined);
      setNewMakeName('');
      setNewMakeCountry('');
      setAddMakeOpen(false);
    } catch (err) {
      console.error('Failed to add make', err);
    }
  };

  const handleAddModel = async (makeId: string) => {
    if (!newModelName.trim()) return;
    try {
      await vehicleStore.createModel(makeId, newModelName.trim(), newModelCategory.trim() || undefined);
      setNewModelName('');
      setNewModelCategory('');
      setAddModelOpen(null);
    } catch (err) {
      console.error('Failed to add model', err);
    }
  };

  const filteredMakes = vehicleStore.makes.filter(make => 
    make.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    make.models.some(model => model.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/settings')} sx={{ mr: 1 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          Vehicle Makes & Models
        </Typography>
      </Box>

      {/* Search and Add */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search makes and models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
          }}
        />
        {!isReadOnly && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddMakeOpen(true)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add Make
          </Button>
        )}
      </Box>

      {/* Makes List */}
      {vehicleStore.isMakesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <List disablePadding>
            {filteredMakes.map((make, index) => (
              <React.Fragment key={make.id}>
                {index > 0 && <Divider />}
                <ListItem
                  disablePadding
                  secondaryAction={
                    !isReadOnly && (
                      <Box>
                        <IconButton size="small" onClick={() => setAddModelOpen(make.id)}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )
                  }
                >
                  <ListItemButton onClick={() => handleToggleMake(make.id)}>
                    <ListItemIcon>
                      {expandedMake === make.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontWeight={500}>{make.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({make.models.length} models)
                          </Typography>
                        </Box>
                      }
                      secondary={make.country || 'Unknown country'}
                    />
                  </ListItemButton>
                </ListItem>

                {/* Expanded Models */}
                {expandedMake === make.id && (
                  <Box sx={{ pl: 6, pr: 2, pb: 2, bgcolor: 'action.hover' }}>
                    {make.models.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                        No models yet. Click + to add one.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {make.models
                          .filter(model => model.name.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery)
                          .map((model) => (
                            <Box
                              key={model.id}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                px: 1.5,
                                py: 0.5,
                              }}
                            >
                              <Typography variant="body2">{model.name}</Typography>
                              {model.category && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                  ({model.category})
                                </Typography>
                              )}
                            </Box>
                          ))}
                      </Box>
                    )}
                  </Box>
                )}
              </React.Fragment>
            ))}
          </List>

          {filteredMakes.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <VehicleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">
                {searchQuery ? 'No makes or models match your search' : 'No vehicle makes configured'}
              </Typography>
            </Box>
          )}
        </Card>
      )}

      {/* Add Make Dialog */}
      <Dialog open={addMakeOpen} onClose={() => setAddMakeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Vehicle Make</DialogTitle>
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
          <Button variant="contained" onClick={handleAddMake} disabled={!newMakeName.trim()}>
            Add Make
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Model Dialog */}
      <Dialog open={!!addModelOpen} onClose={() => setAddModelOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Model to {vehicleStore.makes.find(m => m.id === addModelOpen)?.name}
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
          <Button onClick={() => setAddModelOpen(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => addModelOpen && handleAddModel(addModelOpen)}
            disabled={!newModelName.trim()}
          >
            Add Model
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

// Communication Templates Settings
const CommunicationTemplatesSettings: React.FC = observer(() => {
  const { communicationTemplateStore, authStore } = useStore();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<CommunicationTemplateType>(CommunicationTemplateType.EMAIL);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCommunicationTemplateDto>({
    name: '',
    type: CommunicationTemplateType.EMAIL,
      action: CommunicationTemplateAction.EMAIL_ESTIMATE,
    subject: '',
    body: '',
    isActive: true,
  });

  useEffect(() => {
    communicationTemplateStore.fetchTemplates(selectedTab);
    communicationTemplateStore.fetchVariables();
  }, [communicationTemplateStore, selectedTab]);

  const handleEdit = (template: CommunicationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      action: template.action,
      subject: template.subject || '',
      body: template.body,
      isActive: template.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: selectedTab,
      action: CommunicationTemplateAction.EMAIL_ESTIMATE,
      subject: '',
      body: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingTemplate) {
      await communicationTemplateStore.updateTemplate(editingTemplate.id, formData);
    } else {
      await communicationTemplateStore.createTemplate(formData);
    }
    setIsDialogOpen(false);
    setEditingTemplate(null);
    await communicationTemplateStore.fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      await communicationTemplateStore.deleteTemplate(id);
      await communicationTemplateStore.fetchTemplates();
    }
  };

  const quillRef = useRef<ReactQuill>(null);

  const insertVariable = (variable: string) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      quill.insertText(range.index, `{${variable}}`, 'user');
      quill.setSelection(range.index + variable.length + 2);
    } else {
      setFormData({ ...formData, body: formData.body + `{${variable}}` });
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  const actionLabels: Record<CommunicationTemplateAction, string> = {
    EMAIL_ESTIMATE: 'Email Estimate',
    EMAIL_INVOICE: 'Email Invoice',
    VEHICLE_READY: 'Vehicle Ready for Pickup',
    VEHICLE_IN_PROGRESS: 'Vehicle In Progress',
    VEHICLE_PENDING: 'Vehicle Pending',
    INVOICE_CREATED: 'Invoice Created',
  };

  const filteredTemplates = communicationTemplateStore.templates.filter(
    (t) => t.type === selectedTab
  );

  const isReadOnly = !authStore.isAdmin;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/settings')} aria-label="Back">
          <BackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight={600}>
          Communication Templates
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex' }}>
            <Button
              variant={selectedTab === CommunicationTemplateType.EMAIL ? 'contained' : 'text'}
              onClick={() => setSelectedTab(CommunicationTemplateType.EMAIL)}
              startIcon={<EmailIcon />}
              sx={{ borderRadius: 0 }}
            >
              Email Templates
            </Button>
            <Button
              variant={selectedTab === CommunicationTemplateType.SMS ? 'contained' : 'text'}
              onClick={() => setSelectedTab(CommunicationTemplateType.SMS)}
              startIcon={<SmsIcon />}
              sx={{ borderRadius: 0 }}
              disabled
            >
              SMS Templates (Coming Soon)
            </Button>
          </Box>
        </Box>

        <CardContent>
          {!isReadOnly && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
              >
                Create Template
              </Button>
            </Box>
          )}

          {communicationTemplateStore.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredTemplates.length === 0 ? (
            <Alert severity="info">No templates found. Create one to get started.</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.values(CommunicationTemplateAction).map((action) => {
                const template = filteredTemplates.find((t) => t.action === action);
                if (!template) {
                  // Show placeholder for missing templates
                  return (
                    <Card key={action} variant="outlined" sx={{ opacity: 0.6 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Box>
                            <Typography variant="h6" color="text.secondary">
                              {actionLabels[action]}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Template not created yet
                            </Typography>
                          </Box>
                          {!isReadOnly && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                setFormData({
                                  name: actionLabels[action],
                                  type: selectedTab,
                                  action: action,
                                  subject: '',
                                  body: '',
                                  isActive: true,
                                });
                                setEditingTemplate(null);
                                setIsDialogOpen(true);
                              }}
                            >
                              Create
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <Card key={action} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Box>
                          <Typography variant="h6">{template.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {actionLabels[action]}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {template.isActive ? (
                            <Chip icon={<CheckIcon />} label="Active" color="success" size="small" />
                          ) : (
                            <Chip icon={<CancelIcon />} label="Inactive" color="default" size="small" />
                          )}
                          {!isReadOnly && (
                            <>
                              <IconButton size="small" onClick={() => handleEdit(template)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDelete(template.id)} color="error">
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </Box>
                      {template.subject && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Subject:</strong> {template.subject}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          '& p': { margin: '0.5em 0' },
                          '& table': { width: '100%', borderCollapse: 'collapse', margin: '16px 0' },
                          '& th, & td': { padding: '8px', border: '1px solid #ddd' },
                        }}
                        dangerouslySetInnerHTML={{ __html: template.body }}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Template Editor Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Template Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={formData.action}
                label="Action"
                onChange={(e) => setFormData({ ...formData, action: e.target.value as CommunicationTemplateAction })}
              >
                {Object.values(CommunicationTemplateAction).map((action) => (
                  <MenuItem key={action} value={action}>
                    {actionLabels[action]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.type === CommunicationTemplateType.EMAIL && (
              <TextField
                label="Subject"
                fullWidth
                value={formData.subject || ''}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject line"
              />
            )}

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Available Variables
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  maxHeight: 150,
                  overflow: 'auto',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5,
                  mb: 2,
                }}
              >
                {communicationTemplateStore.isLoadingVariables ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Loading variables...
                    </Typography>
                  </Box>
                ) : communicationTemplateStore.variables.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                    No variables available
                  </Typography>
                ) : (
                  communicationTemplateStore.variables.map((variable) => (
                    <Chip
                      key={variable.key}
                      label={`{${variable.key}}`}
                      size="small"
                      onClick={() => insertVariable(variable.key)}
                      sx={{ cursor: 'pointer' }}
                      title={variable.description}
                    />
                  ))
                )}
              </Paper>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Body
              </Typography>
              <Box sx={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: '4px' }}>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={formData.body}
                  onChange={(value) => setFormData({ ...formData, body: value })}
                  modules={quillModules}
                  placeholder="Enter template body. Use variables like {customer_name}, {car_information}, etc."
                  style={{ minHeight: '250px' }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="isActive">Active</label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.name || !formData.body || communicationTemplateStore.isSaving}
            startIcon={communicationTemplateStore.isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {communicationTemplateStore.isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!communicationTemplateStore.successMessage}
        autoHideDuration={3000}
        onClose={() => communicationTemplateStore.clearMessages()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => communicationTemplateStore.clearMessages()} severity="success" sx={{ width: '100%' }}>
          {communicationTemplateStore.successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!communicationTemplateStore.error}
        autoHideDuration={5000}
        onClose={() => communicationTemplateStore.clearMessages()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => communicationTemplateStore.clearMessages()} severity="error" sx={{ width: '100%' }}>
          {communicationTemplateStore.error}
        </Alert>
      </Snackbar>
    </Box>
  );
});

// Payment Methods Settings
const PaymentMethodsSettings: React.FC = observer(() => {
  const { paymentMethodStore, authStore } = useStore();
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [newMethodName, setNewMethodName] = useState('');
  const [editMethodName, setEditMethodName] = useState('');
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    paymentMethodStore.fetchAllIncludingInactive();
  }, [paymentMethodStore]);

  // Fetch usage counts for each payment method
  useEffect(() => {
    const fetchUsageCounts = async () => {
      try {
        const counts = await paymentMethodStore.fetchUsageCounts();
        setUsageCounts(counts);
      } catch (error) {
        console.error('Failed to fetch usage counts', error);
        // Set all to 0 on error
        const counts: Record<string, number> = {};
        paymentMethodStore.allPaymentMethods.forEach(method => {
          counts[method.id] = 0;
        });
        setUsageCounts(counts);
      }
    };
    if (paymentMethodStore.allPaymentMethods.length > 0) {
      fetchUsageCounts();
    }
  }, [paymentMethodStore.allPaymentMethods, paymentMethodStore]);

  const isReadOnly = !authStore.isAdmin;

  const handleAdd = async () => {
    if (!newMethodName.trim()) return;
    try {
      await paymentMethodStore.create({ name: newMethodName.trim() });
      setNewMethodName('');
      setAddDialogOpen(false);
    } catch (err) {
      console.error('Failed to add payment method', err);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editMethodName.trim()) return;
    try {
      await paymentMethodStore.update(id, { name: editMethodName.trim() });
      setEditMethodName('');
      setEditDialogOpen(null);
    } catch (err) {
      console.error('Failed to update payment method', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    try {
      await paymentMethodStore.delete(id);
      setDeleteDialogOpen(null);
    } catch (err) {
      console.error('Failed to delete payment method', err);
    }
  };

  const handleOpenEdit = (method: { id: string; name: string }) => {
    setEditMethodName(method.name);
    setEditDialogOpen(method.id);
  };

  const handleOpenDelete = (id: string) => {
    setDeleteDialogOpen(id);
  };

  const selectedMethod = paymentMethodStore.allPaymentMethods.find(m => m.id === editDialogOpen || m.id === deleteDialogOpen);
  const canDelete = selectedMethod && usageCounts[selectedMethod.id] === 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/settings')} sx={{ mr: 1 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          Payment Methods
        </Typography>
      </Box>

      {!isReadOnly && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Payment Method
          </Button>
        </Box>
      )}

      {paymentMethodStore.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <List disablePadding>
            {paymentMethodStore.allPaymentMethods.map((method, index) => (
              <React.Fragment key={method.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    !isReadOnly && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(method)}
                          disabled={paymentMethodStore.isLoading}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDelete(method.id)}
                          disabled={paymentMethodStore.isLoading || usageCounts[method.id] > 0}
                          color={usageCounts[method.id] > 0 ? 'default' : 'error'}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight={method.isActive ? 500 : 400}>
                          {method.name}
                        </Typography>
                        {!method.isActive && (
                          <Chip label="Inactive" size="small" color="default" />
                        )}
                        {usageCounts[method.id] > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            ({usageCounts[method.id]} invoice{usageCounts[method.id] !== 1 ? 's' : ''})
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      usageCounts[method.id] > 0
                        ? 'Cannot delete - has been used in invoices'
                        : method.isActive
                        ? 'Active'
                        : 'Inactive'
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>

          {paymentMethodStore.allPaymentMethods.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <PaymentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">No payment methods configured</Typography>
            </Box>
          )}
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Payment Method Name"
              fullWidth
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              placeholder="e.g., VISA, CASH, EFTPOS"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!newMethodName.trim() || paymentMethodStore.isLoading}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDialogOpen} onClose={() => setEditDialogOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Payment Method</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Payment Method Name"
              fullWidth
              value={editMethodName}
              onChange={(e) => setEditMethodName(e.target.value)}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => editDialogOpen && handleEdit(editDialogOpen)}
            disabled={!editMethodName.trim() || paymentMethodStore.isLoading}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialogOpen} onClose={() => setDeleteDialogOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Payment Method</DialogTitle>
        <DialogContent>
          {selectedMethod && (
            <Box>
              {usageCounts[selectedMethod.id] > 0 ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Cannot delete "{selectedMethod.name}" because it has been used in {usageCounts[selectedMethod.id]} invoice(s).
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Are you sure you want to delete "{selectedMethod.name}"? This action cannot be undone.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteDialogOpen && handleDelete(deleteDialogOpen)}
            disabled={!canDelete || paymentMethodStore.isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      {paymentMethodStore.error && (
        <Snackbar
          open={!!paymentMethodStore.error}
          autoHideDuration={5000}
          onClose={() => paymentMethodStore.clearError()}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => paymentMethodStore.clearError()} severity="error" sx={{ width: '100%' }}>
            {paymentMethodStore.error}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
});

// Settings Menu (main settings page)
const SettingsMenu: React.FC = observer(() => {
  const { settingsStore } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const settingsItems = [
    { 
      icon: ShopIcon, 
      label: 'Shop Information', 
      description: 'Name, address, contact details',
      path: '/settings/shop',
    },
    { 
      icon: TaxIcon, 
      label: 'Tax Settings', 
      description: 'Tax rates and configuration',
      path: '/settings/tax',
    },
    { 
      icon: InvoiceIcon, 
      label: 'Invoice Templates', 
      description: 'Customize invoice appearance',
      path: '/settings/invoice',
    },
    { 
      icon: CurrencyIcon, 
      label: 'Currency', 
      description: 'Currency and formatting',
      path: '/settings/currency',
    },
    { 
      icon: VehicleIcon, 
      label: 'Vehicle Makes & Models', 
      description: 'Manage vehicle taxonomy lexicon',
      path: '/settings/vehicles',
    },
    { 
      icon: EmailIcon, 
      label: 'Communication Templates', 
      description: 'Email and SMS message templates',
      path: '/settings/communication-templates',
    },
    { 
      icon: PaymentIcon, 
      label: 'Payment Methods', 
      description: 'Manage payment methods for invoices',
      path: '/settings/payment-methods',
    },
  ];

  const handleSnackbarClose = () => {
    settingsStore.clearMessages();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            {settingsItems.map((item, index) => (
              <React.Fragment key={item.label}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton 
                    sx={{ py: 2 }}
                    onClick={() => navigate(item.path)}
                    selected={location.pathname === item.path}
                    data-testid={`settings-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <ListItemIcon>
                      <item.icon />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.description}
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      <Snackbar
        open={!!settingsStore.successMessage}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {settingsStore.successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!settingsStore.error}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {settingsStore.error}
        </Alert>
      </Snackbar>
    </Box>
  );
});

// Settings Container with nested routes
const SettingsContainer: React.FC = observer(() => {
  const { settingsStore } = useStore();

  const handleSnackbarClose = () => {
    settingsStore.clearMessages();
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<SettingsMenu />} />
        <Route path="/shop" element={<ShopSettings />} />
        <Route path="/tax" element={<TaxSettings />} />
        <Route path="/currency" element={<CurrencySettings />} />
        <Route path="/invoice" element={<InvoiceSettings />} />
        <Route path="/vehicles" element={<VehicleMakesSettings />} />
        <Route path="/communication-templates" element={<CommunicationTemplatesSettings />} />
        <Route path="/payment-methods" element={<PaymentMethodsSettings />} />
      </Routes>

      <Snackbar
        open={!!settingsStore.successMessage}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {settingsStore.successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!settingsStore.error}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {settingsStore.error}
        </Alert>
      </Snackbar>
    </>
  );
});

export const Settings: React.FC = () => (
  <Routes>
    <Route path="/*" element={<SettingsContainer />} />
  </Routes>
);
