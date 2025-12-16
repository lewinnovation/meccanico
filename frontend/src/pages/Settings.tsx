import React, { useEffect, useState } from 'react';
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
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';
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
    });
  }, [settingsStore.invoiceSettings]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
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
