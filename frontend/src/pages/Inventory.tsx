import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
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
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Inventory as PartsIcon,
  Build as LabourIcon,
  Handyman as ServiceIcon,
  ListAlt as TemplateIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';
import type { Inventory as InventoryType, CreateInventoryDto, UpdateInventoryDto } from '../stores/InventoryStore';
import type { Labour, CreateLabourDto, UpdateLabourDto } from '../stores/LabourStore';
import type { Service, CreateServiceDto, UpdateServiceDto } from '../stores/ServiceStore';
import type { Template, CreateTemplateDto, UpdateTemplateDto, CreateTemplateItemDto, LineItemType } from '../stores/TemplateStore';

// ==================== PARTS TAB ====================
interface PartFormData {
  name: string;
  description: string;
  sku: string;
  unitPrice: string;
  costPrice: string;
  quantityInStock: string;
  minimumStock: string;
  category: string;
  unit: string;
}

const defaultPartForm: PartFormData = {
  name: '',
  description: '',
  sku: '',
  unitPrice: '',
  costPrice: '',
  quantityInStock: '0',
  minimumStock: '0',
  category: '',
  unit: 'each',
};

const PartsTab: React.FC = observer(() => {
  const { inventoryStore, settingsStore } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryType | null>(null);
  const [formData, setFormData] = useState<PartFormData>(defaultPartForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    inventoryStore.fetchItems();
    inventoryStore.fetchCategories();
  }, [inventoryStore]);

  // Listen for openAddDialog event from parent
  useEffect(() => {
    const handleOpenAdd = () => {
      setEditingItem(null);
      setFormData(defaultPartForm);
      setDialogOpen(true);
    };
    window.addEventListener('openAddDialog', handleOpenAdd);
    return () => window.removeEventListener('openAddDialog', handleOpenAdd);
  }, []);

  const handleOpenDialog = (item?: InventoryType) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        sku: item.sku || '',
        unitPrice: item.unitPrice.toString(),
        costPrice: item.costPrice?.toString() || '',
        quantityInStock: item.quantityInStock.toString(),
        minimumStock: item.minimumStock.toString(),
        category: item.category || '',
        unit: item.unit,
      });
    } else {
      setEditingItem(null);
      setFormData(defaultPartForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData(defaultPartForm);
  };

  const handleSave = async () => {
    try {
      const data: CreateInventoryDto | UpdateInventoryDto = {
        name: formData.name,
        description: formData.description || undefined,
        sku: formData.sku || undefined,
        unitPrice: parseFloat(formData.unitPrice),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        quantityInStock: parseInt(formData.quantityInStock),
        minimumStock: parseInt(formData.minimumStock),
        category: formData.category || undefined,
        unit: formData.unit,
      };

      if (editingItem) {
        await inventoryStore.update(editingItem.id, data);
      } else {
        await inventoryStore.create(data as CreateInventoryDto);
      }
      handleCloseDialog();
    } catch {
      // Error handled in store
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await inventoryStore.delete(id);
      setDeleteConfirm(null);
    } catch {
      // Error handled in store
    }
  };

  const isLowStock = (item: InventoryType) => item.quantityInStock <= item.minimumStock;

  return (
    <Box>
      {inventoryStore.error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {inventoryStore.error}
        </Alert>
      )}

      {/* Table */}
      {inventoryStore.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : inventoryStore.items.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <PartsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No parts yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Add your first part to start tracking inventory.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Part
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryStore.items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {item.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{item.name}</Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{item.sku || '-'}</TableCell>
                  <TableCell>
                    {item.category && <Chip label={item.category} size="small" />}
                  </TableCell>
                  <TableCell align="right">{settingsStore.currencySettings.symbol || '$'}{Number(item.unitPrice).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      {isLowStock(item) && (
                        <Tooltip title="Low stock">
                          <WarningIcon color="warning" fontSize="small" />
                        </Tooltip>
                      )}
                      <Typography color={isLowStock(item) ? 'warning.main' : 'inherit'}>
                        {item.quantityInStock} {item.unit}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Part' : 'Add Part'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="SKU"
                fullWidth
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
              <TextField
                label="Category"
                fullWidth
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Unit Price"
                required
                type="number"
                fullWidth
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">{settingsStore.currencySettings.symbol || '$'}</InputAdornment> }}
              />
              <TextField
                label="Cost Price"
                type="number"
                fullWidth
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">{settingsStore.currencySettings.symbol || '$'}</InputAdornment> }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Stock Qty"
                type="number"
                fullWidth
                value={formData.quantityInStock}
                onChange={(e) => setFormData({ ...formData, quantityInStock: e.target.value })}
              />
              <TextField
                label="Min Stock"
                type="number"
                fullWidth
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.unit}
                  label="Unit"
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <MenuItem value="each">each</MenuItem>
                  <MenuItem value="liter">liter</MenuItem>
                  <MenuItem value="gallon">gallon</MenuItem>
                  <MenuItem value="kg">kg</MenuItem>
                  <MenuItem value="lb">lb</MenuItem>
                  <MenuItem value="set">set</MenuItem>
                  <MenuItem value="meter">meter</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name || !formData.unitPrice}>
            {editingItem ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Part?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this part? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

// ==================== LABOUR TAB ====================
interface LabourFormData {
  name: string;
  description: string;
  hourlyRate: string;
  defaultHours: string;
  isFlatRate: boolean;
  category: string;
}

const defaultLabourForm: LabourFormData = {
  name: '',
  description: '',
  hourlyRate: '',
  defaultHours: '1',
  isFlatRate: false,
  category: '',
};

const LabourTab: React.FC = observer(() => {
  const { labourStore, settingsStore } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Labour | null>(null);
  const [formData, setFormData] = useState<LabourFormData>(defaultLabourForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    labourStore.fetchItems();
    labourStore.fetchCategories();
  }, [labourStore]);

  // Listen for openAddDialog event from parent
  useEffect(() => {
    const handleOpenAdd = () => {
      setEditingItem(null);
      setFormData(defaultLabourForm);
      setDialogOpen(true);
    };
    window.addEventListener('openAddDialog', handleOpenAdd);
    return () => window.removeEventListener('openAddDialog', handleOpenAdd);
  }, []);

  const handleOpenDialog = (item?: Labour) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        hourlyRate: item.hourlyRate.toString(),
        defaultHours: item.defaultHours.toString(),
        isFlatRate: item.isFlatRate,
        category: item.category || '',
      });
    } else {
      setEditingItem(null);
      setFormData(defaultLabourForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData(defaultLabourForm);
  };

  const handleSave = async () => {
    try {
      const data: CreateLabourDto | UpdateLabourDto = {
        name: formData.name,
        description: formData.description || undefined,
        hourlyRate: parseFloat(formData.hourlyRate),
        defaultHours: parseFloat(formData.defaultHours),
        isFlatRate: formData.isFlatRate,
        category: formData.category || undefined,
      };

      if (editingItem) {
        await labourStore.update(editingItem.id, data);
      } else {
        await labourStore.create(data as CreateLabourDto);
      }
      handleCloseDialog();
    } catch {
      // Error handled in store
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await labourStore.delete(id);
      setDeleteConfirm(null);
    } catch {
      // Error handled in store
    }
  };

  return (
    <Box>
      {labourStore.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {labourStore.error}
        </Alert>
      )}

      {labourStore.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : labourStore.items.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <LabourIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No labour rates yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Add your first labour rate to start billing for work.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Labour Rate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Default Hours</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {labourStore.items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {item.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{item.name}</Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.category && <Chip label={item.category} size="small" />}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.isFlatRate ? 'Flat Rate' : 'Hourly'}
                      size="small"
                      color={item.isFlatRate ? 'secondary' : 'primary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{settingsStore.currencySettings.symbol || '$'}{Number(item.hourlyRate).toFixed(2)}</TableCell>
                  <TableCell align="right">{item.isFlatRate ? '-' : `${item.defaultHours}h`}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Labour Rate' : 'Add Labour Rate'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              label="Category"
              fullWidth
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isFlatRate}
                  onChange={(e) => setFormData({ ...formData, isFlatRate: e.target.checked })}
                />
              }
              label="Flat Rate (fixed price, not per hour)"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={formData.isFlatRate ? 'Flat Rate' : 'Hourly Rate'}
                required
                type="number"
                fullWidth
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">{settingsStore.currencySettings.symbol || '$'}</InputAdornment> }}
              />
              {!formData.isFlatRate && (
                <TextField
                  label="Default Hours"
                  type="number"
                  fullWidth
                  value={formData.defaultHours}
                  onChange={(e) => setFormData({ ...formData, defaultHours: e.target.value })}
                  InputProps={{ endAdornment: <InputAdornment position="end">hours</InputAdornment> }}
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name || !formData.hourlyRate}>
            {editingItem ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Labour Rate?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this labour rate? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

// ==================== SERVICES TAB ====================
interface ServiceFormData {
  name: string;
  description: string;
  basePrice: string;
  category: string;
}

const defaultServiceForm: ServiceFormData = {
  name: '',
  description: '',
  basePrice: '',
  category: '',
};

const ServicesTab: React.FC = observer(() => {
  const { serviceStore, settingsStore } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(defaultServiceForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    serviceStore.fetchItems();
    serviceStore.fetchCategories();
  }, [serviceStore]);

  // Listen for openAddDialog event from parent
  useEffect(() => {
    const handleOpenAdd = () => {
      setEditingItem(null);
      setFormData(defaultServiceForm);
      setDialogOpen(true);
    };
    window.addEventListener('openAddDialog', handleOpenAdd);
    return () => window.removeEventListener('openAddDialog', handleOpenAdd);
  }, []);

  const handleOpenDialog = (item?: Service) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        basePrice: item.basePrice.toString(),
        category: item.category || '',
      });
    } else {
      setEditingItem(null);
      setFormData(defaultServiceForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData(defaultServiceForm);
  };

  const handleSave = async () => {
    try {
      const data: CreateServiceDto | UpdateServiceDto = {
        name: formData.name,
        description: formData.description || undefined,
        basePrice: parseFloat(formData.basePrice),
        category: formData.category || undefined,
      };

      if (editingItem) {
        await serviceStore.update(editingItem.id, data);
      } else {
        await serviceStore.create(data as CreateServiceDto);
      }
      handleCloseDialog();
    } catch {
      // Error handled in store
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await serviceStore.delete(id);
      setDeleteConfirm(null);
    } catch {
      // Error handled in store
    }
  };

  return (
    <Box>
      {serviceStore.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serviceStore.error}
        </Alert>
      )}

      {serviceStore.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : serviceStore.items.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <ServiceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No services yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create service packages to bundle parts and labour together.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Base Price</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {serviceStore.items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {item.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{item.name}</Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.category && <Chip label={item.category} size="small" />}
                  </TableCell>
                  <TableCell align="right">{settingsStore.currencySettings.symbol || '$'}{Number(item.basePrice).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Service' : 'Add Service'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Base Price"
                required
                type="number"
                fullWidth
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">{settingsStore.currencySettings.symbol || '$'}</InputAdornment> }}
              />
              <TextField
                label="Category"
                fullWidth
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name || !formData.basePrice}>
            {editingItem ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Service?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this service? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

// ==================== TEMPLATES TAB ====================
interface TemplateFormData {
  name: string;
  description: string;
  isGlobal: boolean;
}

interface SelectedItem {
  id: string;
  name: string;
  code: string;
  unitPrice: number;
  type: 'INVENTORY' | 'LABOUR' | 'SERVICE';
}

const defaultTemplateForm: TemplateFormData = {
  name: '',
  description: '',
  isGlobal: false,
};

// ==================== SORTABLE TEMPLATE ITEM ROW ====================
interface SortableTemplateItemRowProps {
  id: string;
  item: CreateTemplateItemDto;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<CreateTemplateItemDto>) => void;
  getItemTypeBackground: (type: LineItemType) => string;
  formatQuantity: (qty: number | string) => string;
  currencySymbol: string;
}

const SortableTemplateItemRow: React.FC<SortableTemplateItemRowProps> = ({
  id,
  item,
  index,
  onRemove,
  onUpdate,
  getItemTypeBackground,
  formatQuantity,
  currencySymbol,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const [editingField, setEditingField] = useState<'description' | 'quantity' | 'unitPrice' | null>(null);
  const [editValue, setEditValue] = useState('');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: getItemTypeBackground(item.itemType),
  };

  const isTextType = item.itemType === 'TEXT';

  const handleStartEdit = (field: 'description' | 'quantity' | 'unitPrice') => {
    setEditingField(field);
    if (field === 'description') {
      setEditValue(item.description);
    } else if (field === 'quantity') {
      setEditValue(item.quantity.toString());
    } else {
      setEditValue(item.unitPrice.toString());
    }
  };

  const handleSaveEdit = () => {
    if (editingField === 'description') {
      if (editValue !== item.description) {
        onUpdate(index, { description: editValue });
      }
    } else if (editingField === 'quantity') {
      const newQty = parseFloat(editValue);
      if (!isNaN(newQty) && newQty !== item.quantity) {
        onUpdate(index, { quantity: newQty });
      }
    } else if (editingField === 'unitPrice') {
      const newPrice = parseFloat(editValue);
      if (!isNaN(newPrice) && newPrice !== item.unitPrice) {
        onUpdate(index, { unitPrice: newPrice });
      }
    }
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  return (
    <TableRow ref={setNodeRef} style={style} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
      <TableCell sx={{ cursor: 'grab', width: 40 }} {...attributes} {...listeners}>
        <DragIcon fontSize="small" color="action" />
      </TableCell>
      <TableCell
        onClick={() => handleStartEdit('description')}
        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', borderRadius: 1 } }}
      >
        {editingField === 'description' ? (
          <TextField
            size="small"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            autoFocus
            variant="standard"
            fullWidth
          />
        ) : isTextType ? (
          <Typography fontStyle="italic" color="text.secondary">
            {item.description}
          </Typography>
        ) : (
          <Typography>{item.description}</Typography>
        )}
      </TableCell>
      <TableCell
        align="right"
        onClick={() => !isTextType && handleStartEdit('quantity')}
        sx={!isTextType ? { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', borderRadius: 1 } } : {}}
      >
        {!isTextType && (
          editingField === 'quantity' ? (
            <TextField
              size="small"
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              autoFocus
              variant="standard"
              inputProps={{ min: 0, step: 1, style: { textAlign: 'right' } }}
              sx={{ width: 60 }}
            />
          ) : (
            <Typography>{formatQuantity(item.quantity)}</Typography>
          )
        )}
      </TableCell>
      <TableCell
        align="right"
        onClick={() => !isTextType && handleStartEdit('unitPrice')}
        sx={!isTextType ? { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', borderRadius: 1 } } : {}}
      >
        {!isTextType && (
          editingField === 'unitPrice' ? (
            <TextField
              size="small"
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              autoFocus
              variant="standard"
              inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
              sx={{ width: 80 }}
            />
          ) : (
            <Typography>{currencySymbol}{Number(item.unitPrice).toFixed(2)}</Typography>
          )
        )}
      </TableCell>
      <TableCell align="right">
        {!isTextType && <Typography>{currencySymbol}{(item.quantity * item.unitPrice).toFixed(2)}</Typography>}
      </TableCell>
      <TableCell align="right" sx={{ width: 40 }}>
        <IconButton size="small" color="error" onClick={() => onRemove(index)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

const TemplatesTab: React.FC = observer(() => {
  const { templateStore, inventoryStore, labourStore, serviceStore, settingsStore } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(defaultTemplateForm);
  const [templateItems, setTemplateItems] = useState<CreateTemplateItemDto[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  
  // Item selection state
  const [itemType, setItemType] = useState<LineItemType>('TEXT');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    templateStore.fetchItems();
    inventoryStore.fetchItems();
    labourStore.fetchItems();
    serviceStore.fetchItems();
  }, [templateStore, inventoryStore, labourStore, serviceStore]);

  // Listen for openAddDialog event from parent
  useEffect(() => {
    const handleOpenAdd = () => {
      setEditingItem(null);
      setFormData(defaultTemplateForm);
      setTemplateItems([]);
      setDialogOpen(true);
    };
    window.addEventListener('openAddDialog', handleOpenAdd);
    return () => window.removeEventListener('openAddDialog', handleOpenAdd);
  }, []);

  // Build options for autocomplete based on type
  const getAutocompleteOptions = (): SelectedItem[] => {
    switch (itemType) {
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

  const handleOpenDialog = (item?: Template) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        isGlobal: item.isGlobal,
      });
      setTemplateItems(
        item.items.map((i) => ({
          itemType: i.itemType,
          itemId: i.itemId || undefined,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          sortOrder: i.sortOrder,
        }))
      );
    } else {
      setEditingItem(null);
      setFormData(defaultTemplateForm);
      setTemplateItems([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData(defaultTemplateForm);
    setTemplateItems([]);
  };

  const handleSave = async () => {
    try {
      const data: CreateTemplateDto | UpdateTemplateDto = {
        name: formData.name,
        description: formData.description || undefined,
        isGlobal: formData.isGlobal,
        items: templateItems,
      };

      if (editingItem) {
        await templateStore.update(editingItem.id, data);
      } else {
        await templateStore.create(data as CreateTemplateDto);
      }
      handleCloseDialog();
    } catch {
      // Error handled in store
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await templateStore.delete(id);
      setDeleteConfirm(null);
    } catch {
      // Error handled in store
    }
  };

  const handleAddItem = () => {
    setItemType('TEXT');
    setSelectedItem(null);
    setTextDescription('');
    setQuantity('1');
    setItemDialogOpen(true);
  };

  const handleSaveItem = () => {
    let newItem: CreateTemplateItemDto;

    if (itemType === 'TEXT') {
      newItem = {
        itemType: 'TEXT',
        description: textDescription,
        quantity: 0, // TEXT items don't have quantity
        unitPrice: 0, // TEXT items don't have price
        sortOrder: templateItems.length,
      };
    } else if (selectedItem) {
      newItem = {
        itemType: itemType,
        itemId: selectedItem.id,
        description: `${selectedItem.name} (${selectedItem.code})`,
        quantity: parseFloat(quantity) || 1,
        unitPrice: selectedItem.unitPrice,
        sortOrder: templateItems.length,
      };
    } else {
      return; // Nothing selected
    }

    setTemplateItems([...templateItems, newItem]);
    setItemDialogOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    setTemplateItems(templateItems.filter((_, i) => i !== index));
  };

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

  const getItemTypeBackground = (type: LineItemType) => {
    switch (type) {
      case 'INVENTORY':
        return 'rgba(33, 150, 243, 0.04)'; // Light blue
      case 'LABOUR':
        return 'rgba(76, 175, 80, 0.04)'; // Light green
      case 'SERVICE':
        return 'rgba(156, 39, 176, 0.04)'; // Light purple
      case 'TEXT':
        return 'rgba(158, 158, 158, 0.04)'; // Light grey
      default:
        return 'transparent';
    }
  };

  const formatQuantity = (qty: number | string) => {
    const num = typeof qty === 'string' ? parseFloat(qty) : qty;
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  const calculateTemplateTotal = (items: CreateTemplateItemDto[]) =>
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  
  const canAddItem = itemType === 'TEXT' ? textDescription.trim() !== '' : selectedItem !== null;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = templateItems.findIndex((_, i) => `item-${i}` === active.id);
      const newIndex = templateItems.findIndex((_, i) => `item-${i}` === over.id);
      const newItems = arrayMove(templateItems, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        sortOrder: idx,
      }));
      setTemplateItems(newItems);
    }
  };

  const handleUpdateItem = (index: number, updates: Partial<CreateTemplateItemDto>) => {
    setTemplateItems(templateItems.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  return (
    <Box>
      {templateStore.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {templateStore.error}
        </Alert>
      )}

      {templateStore.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : templateStore.items.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <TemplateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No templates yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create templates to quickly add common items to jobs.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templateStore.items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {item.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{item.name}</Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{item.items?.length || 0} items</TableCell>
                  <TableCell>
                    <Chip
                      label={item.isGlobal ? 'Global' : 'Personal'}
                      size="small"
                      color={item.isGlobal ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {settingsStore.currencySettings.symbol || '$'}{calculateTemplateTotal(
                      item.items?.map((i) => ({
                        itemType: i.itemType,
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                      })) || []
                    ).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Template Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Template' : 'Add Template'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isGlobal}
                  onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                />
              }
              label="Global template (visible to all users)"
            />

            {/* Template Items */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Template Items
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={handleAddItem}>
                  Add Item
                </Button>
              </Box>

              {templateItems.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No items added yet. Click "Add Item" to add parts, labour, services, or text.
                </Typography>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width={40}></TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell width={40}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <SortableContext items={templateItems.map((_, i) => `item-${i}`)} strategy={verticalListSortingStrategy}>
                        {templateItems.map((item, index) => (
                          <SortableTemplateItemRow
                            key={`item-${index}`}
                            id={`item-${index}`}
                            item={item}
                            index={index}
                            onRemove={handleRemoveItem}
                            onUpdate={handleUpdateItem}
                            getItemTypeBackground={getItemTypeBackground}
                            formatQuantity={formatQuantity}
                            currencySymbol={settingsStore.currencySettings.symbol || '$'}
                          />
                        ))}
                      </SortableContext>
                      <TableRow>
                        <TableCell colSpan={4} align="right">
                          <Typography fontWeight={600}>Total:</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600}>{settingsStore.currencySettings.symbol || '$'}{calculateTemplateTotal(templateItems).toFixed(2)}</Typography>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </DndContext>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name}>
            {editingItem ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Item to Template</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={itemType}
                label="Type"
                onChange={(e) => {
                  setItemType(e.target.value as LineItemType);
                  setSelectedItem(null);
                }}
              >
                <MenuItem value="TEXT">Text (note/description)</MenuItem>
                <MenuItem value="INVENTORY">Part (from inventory)</MenuItem>
                <MenuItem value="LABOUR">Labour</MenuItem>
                <MenuItem value="SERVICE">Service</MenuItem>
              </Select>
            </FormControl>

            {itemType === 'TEXT' ? (
              // Custom text entry - no quantity or price needed
              <>
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
              </>
            ) : (
              // Autocomplete for existing items
              <>
                <Autocomplete
                  options={getAutocompleteOptions()}
                  getOptionLabel={(option) => `${option.name} (${option.code})`}
                  value={selectedItem}
                  onChange={(_, value) => setSelectedItem(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`Select ${getItemTypeLabel(itemType)}`}
                      required
                      placeholder={`Search ${getItemTypeLabel(itemType).toLowerCase()}s...`}
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
                    itemType === 'INVENTORY'
                      ? inventoryStore.isLoading
                      : itemType === 'LABOUR'
                      ? labourStore.isLoading
                      : serviceStore.isLoading
                  }
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    inputProps={{ min: 0, step: 1 }}
                  />
                  <TextField
                    label="Unit Price"
                    type="number"
                    fullWidth
                    value={selectedItem ? selectedItem.unitPrice.toString() : '0'}
                    InputProps={{ startAdornment: <InputAdornment position="start">{settingsStore.currencySettings.symbol || '$'}</InputAdornment> }}
                    disabled
                    helperText="Price from selected item"
                  />
                </Box>
                {selectedItem && (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    Total: {settingsStore.currencySettings.symbol || '$'}{(parseFloat(quantity) * selectedItem.unitPrice).toFixed(2)}
                  </Alert>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveItem} disabled={!canAddItem}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Template?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this template? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

// ==================== MAIN INVENTORY LIST ====================
const InventoryList: React.FC = observer(() => {
  const { inventoryStore, labourStore, serviceStore, templateStore } = useStore();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (tab === 0) {
      inventoryStore.setSearch(value);
      inventoryStore.fetchItems();
    } else if (tab === 1) {
      labourStore.setSearch(value);
      labourStore.fetchItems();
    } else if (tab === 2) {
      serviceStore.setSearch(value);
      serviceStore.fetchItems();
    } else {
      templateStore.setSearch(value);
      templateStore.fetchItems();
    }
  };

  const handleAddClick = () => {
    // Trigger dialog in the respective tab
    const event = new CustomEvent('openAddDialog');
    window.dispatchEvent(event);
  };

  const getAddButtonLabel = () => {
    switch (tab) {
      case 0:
        return 'Add Part';
      case 1:
        return 'Add Labour';
      case 2:
        return 'Add Service';
      case 3:
        return 'Add Template';
      default:
        return 'Add Item';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Inventory
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick}>
          {getAddButtonLabel()}
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setSearch('');
        }}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<PartsIcon />} iconPosition="start" label="Parts" />
        <Tab icon={<LabourIcon />} iconPosition="start" label="Labour" />
        <Tab icon={<ServiceIcon />} iconPosition="start" label="Services" />
        <Tab icon={<TemplateIcon />} iconPosition="start" label="Templates" />
      </Tabs>

      {/* Search */}
      <TextField
        fullWidth
        placeholder={`Search ${tab === 0 ? 'parts' : tab === 1 ? 'labour' : tab === 2 ? 'services' : 'templates'}...`}
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
      />

      {/* Tab Content */}
      {tab === 0 && <PartsTab />}
      {tab === 1 && <LabourTab />}
      {tab === 2 && <ServicesTab />}
      {tab === 3 && <TemplatesTab />}
    </Box>
  );
});

export const Inventory: React.FC = () => (
  <Routes>
    <Route path="/*" element={<InventoryList />} />
  </Routes>
);
