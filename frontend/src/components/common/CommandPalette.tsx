import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  Box,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  InputAdornment,
  ListSubheader,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Build as JobIcon,
  People as CustomerIcon,
  DirectionsCar as VehicleIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../stores/RootStore';
import type { Customer } from '../../stores/CustomerStore';
import type { Vehicle } from '../../stores/VehicleStore';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  type: 'command';
}

interface SearchResult {
  type: 'customer' | 'vehicle';
  customer?: Customer;
  vehicle?: Vehicle & { customer?: Customer };
}

type ResultItem = Command | SearchResult;

export const CommandPalette: React.FC = observer(() => {
  const navigate = useNavigate();
  const { uiStore, customerStore, vehicleStore, authStore } = useStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const commands: Command[] = [
    ...(authStore.canEdit ? [{
      id: 'new-job',
      label: 'New Job',
      description: 'Create a new job/estimate',
      icon: AddIcon,
      action: () => {
        navigate('/jobs/new');
        uiStore.closeCommandPalette();
      },
      keywords: ['create', 'estimate', 'work order'],
      type: 'command',
    }] : []),
    {
      id: 'jobs',
      label: 'Go to Jobs',
      icon: JobIcon,
      action: () => {
        navigate('/jobs');
        uiStore.closeCommandPalette();
      },
      type: 'command',
    },
    {
      id: 'customers',
      label: 'Go to Customers',
      icon: CustomerIcon,
      action: () => {
        navigate('/customers');
        uiStore.closeCommandPalette();
      },
      type: 'command',
    },
    ...(authStore.canEdit ? [{
      id: 'new-customer',
      label: 'New Customer',
      description: 'Add a new customer',
      icon: AddIcon,
      action: () => {
        navigate('/customers/new');
        uiStore.closeCommandPalette();
      },
      keywords: ['create', 'client'],
      type: 'command',
    }] : []),
    {
      id: 'inventory',
      label: 'Go to Inventory',
      icon: InventoryIcon,
      action: () => {
        navigate('/inventory');
        uiStore.closeCommandPalette();
      },
      keywords: ['parts', 'stock'],
      type: 'command',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      action: () => {
        navigate('/settings');
        uiStore.closeCommandPalette();
      },
      type: 'command',
    },
  ];

  // Perform search when query is 3+ characters
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!search.trim() || search.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      await performSearch(search.trim());
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const performSearch = async (query: string) => {
    try {
      const results: SearchResult[] = [];

      // Search customers (limit to 10 results)
      try {
        await customerStore.fetchCustomers(query, 1);
        const customers = customerStore.customers.slice(0, 10);
        customers.forEach(customer => {
          results.push({
            type: 'customer',
            customer,
          });
        });
      } catch {
        // Error searching customers
      }

      // Search vehicles (limit to 10 results)
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
            vehicle: vehicle as Vehicle & { customer?: Customer },
          });
        });
        // Restore original state
        vehicleStore.limit = originalLimit;
        vehicleStore.setPage(originalPage);
        vehicleStore.setSearch(originalSearch);
      } catch {
        // Error searching vehicles - restore defaults
        vehicleStore.limit = 50;
        vehicleStore.setPage(1);
        vehicleStore.setSearch('');
      }

      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Combine commands and search results
  const filteredCommands = search.trim().length >= 3 ? [] : commands.filter((cmd) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower))
    );
  });

  const customerResults = searchResults.filter(r => r.type === 'customer');
  const vehicleResults = searchResults.filter(r => r.type === 'vehicle');
  
  // Build combined results list
  const allResults: ResultItem[] = [];
  if (search.trim().length >= 3) {
    // Show search results grouped
    allResults.push(...customerResults, ...vehicleResults);
  } else {
    // Show commands
    allResults.push(...filteredCommands);
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = allResults[selectedIndex];
        if (selected) {
          if (selected.type === 'command') {
            selected.action();
          } else if (selected.type === 'customer' && selected.customer) {
            navigate(`/customers/${selected.customer.id}`);
            uiStore.closeCommandPalette();
          } else if (selected.type === 'vehicle' && selected.vehicle) {
            navigate(`/vehicles/${selected.vehicle.id}`);
            uiStore.closeCommandPalette();
          }
        }
      }
    },
    [allResults, selectedIndex, navigate, uiStore]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search, searchResults]);

  useEffect(() => {
    if (!uiStore.commandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      setSearchResults([]);
    } else {
      // Auto-focus search input when dialog opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [uiStore.commandPaletteOpen]);

  return (
    <Dialog
      open={uiStore.commandPaletteOpen}
      onClose={() => uiStore.closeCommandPalette()}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '20%',
          m: 0,
          borderRadius: 2,
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          inputRef={searchInputRef}
          placeholder={search.trim().length >= 3 ? "Searching customers and vehicles..." : "Type a command or search (min 3 chars)..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: isSearching ? (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'grey.50',
            },
          }}
        />
      </Box>

      <List sx={{ maxHeight: 400, overflow: 'auto', py: 0 }}>
        {search.trim().length >= 3 ? (
          // Show search results
          <>
            {customerResults.length > 0 && (
              <>
                <ListSubheader component="div" sx={{ bgcolor: 'background.paper', fontWeight: 600 }}>
                  Customers
                </ListSubheader>
                {customerResults.map((result, idx) => {
                  const globalIndex = idx;
                  const customer = result.customer!;
                  return (
                    <ListItem key={customer.id} disablePadding>
                      <ListItemButton
                        selected={globalIndex === selectedIndex}
                        onClick={() => {
                          navigate(`/customers/${customer.id}`);
                          uiStore.closeCommandPalette();
                        }}
                        sx={{
                          py: 1.5,
                          '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                            '& .MuiListItemIcon-root': { color: 'white' },
                            '& .MuiTypography-root': { color: 'white' },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <CustomerIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={customer.name}
                          secondary={
                            <>
                              {customer.phone && `Phone: ${customer.phone}`}
                              {customer.email && ` • Email: ${customer.email}`}
                            </>
                          }
                          secondaryTypographyProps={{
                            sx: { opacity: 0.7 },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </>
            )}
            {vehicleResults.length > 0 && (
              <>
                <ListSubheader component="div" sx={{ bgcolor: 'background.paper', fontWeight: 600 }}>
                  Vehicles
                </ListSubheader>
                {vehicleResults.map((result, idx) => {
                  const globalIndex = customerResults.length + idx;
                  const vehicle = result.vehicle!;
                  return (
                    <ListItem key={vehicle.id} disablePadding>
                      <ListItemButton
                        selected={globalIndex === selectedIndex}
                        onClick={() => {
                          navigate(`/vehicles/${vehicle.id}`);
                          uiStore.closeCommandPalette();
                        }}
                        sx={{
                          py: 1.5,
                          '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                            '& .MuiListItemIcon-root': { color: 'white' },
                            '& .MuiTypography-root': { color: 'white' },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <VehicleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}`}
                          secondary={
                            <>
                              {vehicle.licensePlate && `Plate: ${vehicle.licensePlate}`}
                              {vehicle.vin && ` • VIN: ${vehicle.vin}`}
                              {vehicle.owners && vehicle.owners.length > 0 && (
                                <>
                                  {' • Owners: '}
                                  {vehicle.owners.length <= 2
                                    ? vehicle.owners.map(o => o.name).join(', ')
                                    : `${vehicle.owners[0].name} and ${vehicle.owners.length - 1} more`}
                                </>
                              )}
                              {!vehicle.owners && vehicle.customer && ` • Customer: ${vehicle.customer.name}`}
                            </>
                          }
                          secondaryTypographyProps={{
                            sx: { opacity: 0.7 },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </>
            )}
            {customerResults.length === 0 && vehicleResults.length === 0 && !isSearching && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No results found</Typography>
              </Box>
            )}
          </>
        ) : (
          // Show commands
          <>
            {filteredCommands.map((cmd, index) => (
              <ListItem key={cmd.id} disablePadding>
                <ListItemButton
                  selected={index === selectedIndex}
                  onClick={cmd.action}
                  sx={{
                    py: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '& .MuiListItemIcon-root': { color: 'white' },
                      '& .MuiTypography-root': { color: 'white' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <cmd.icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={cmd.label}
                    secondary={cmd.description}
                    secondaryTypographyProps={{
                      sx: { opacity: 0.7 },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}

            {filteredCommands.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No commands found</Typography>
              </Box>
            )}
          </>
        )}
      </List>

      <Box
        sx={{
          p: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          ↑↓ Navigate
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ↵ Select
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Esc Close
        </Typography>
      </Box>
    </Dialog>
  );
});

