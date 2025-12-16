import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, TextField, InputAdornment, Tabs, Tab } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';

const InventoryList: React.FC = observer(() => {
  const [tab, setTab] = React.useState(0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Inventory
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Item
        </Button>
      </Box>

      {/* Tabs for Parts/Labour/Services */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Parts" />
        <Tab label="Labour" />
        <Tab label="Services" />
      </Tabs>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search inventory..."
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Empty State */}
      <Card>
        <CardContent sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No items yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Add your first inventory item to start tracking parts and materials.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            Add Item
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
});

export const Inventory: React.FC = () => (
  <Routes>
    <Route path="/*" element={<InventoryList />} />
  </Routes>
);

