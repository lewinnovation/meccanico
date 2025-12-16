import React, { useState, useCallback, useEffect } from 'react';
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

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
}

export const CommandPalette: React.FC = observer(() => {
  const navigate = useNavigate();
  const { uiStore } = useStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: 'new-job',
      label: 'New Job',
      description: 'Create a new job/estimate',
      icon: AddIcon,
      action: () => {
        navigate('/jobs/new');
        uiStore.closeCommandPalette();
      },
      keywords: ['create', 'estimate', 'work order'],
    },
    {
      id: 'jobs',
      label: 'Go to Jobs',
      icon: JobIcon,
      action: () => {
        navigate('/jobs');
        uiStore.closeCommandPalette();
      },
    },
    {
      id: 'customers',
      label: 'Go to Customers',
      icon: CustomerIcon,
      action: () => {
        navigate('/customers');
        uiStore.closeCommandPalette();
      },
    },
    {
      id: 'new-customer',
      label: 'New Customer',
      description: 'Add a new customer',
      icon: AddIcon,
      action: () => {
        navigate('/customers/new');
        uiStore.closeCommandPalette();
      },
      keywords: ['create', 'client'],
    },
    {
      id: 'inventory',
      label: 'Go to Inventory',
      icon: InventoryIcon,
      action: () => {
        navigate('/inventory');
        uiStore.closeCommandPalette();
      },
      keywords: ['parts', 'stock'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      action: () => {
        navigate('/settings');
        uiStore.closeCommandPalette();
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower))
    );
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    },
    [filteredCommands, selectedIndex]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!uiStore.commandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
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
          placeholder="Type a command or search..."
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
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'grey.50',
            },
          }}
        />
      </Box>

      <List sx={{ maxHeight: 400, overflow: 'auto', py: 0 }}>
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
            <Typography color="text.secondary">No results found</Typography>
          </Box>
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

