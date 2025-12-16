import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, TextField, InputAdornment } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';

const CustomerList: React.FC = observer(() => {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Customers
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Customer
        </Button>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search customers..."
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
            No customers yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Add your first customer to start building your client base.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            Add Customer
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
});

const CustomerDetail: React.FC = () => (
  <Box>
    <Typography variant="h4">Customer Detail</Typography>
  </Box>
);

const NewCustomer: React.FC = () => (
  <Box>
    <Typography variant="h4">New Customer</Typography>
  </Box>
);

export const Customers: React.FC = () => (
  <Routes>
    <Route path="/" element={<CustomerList />} />
    <Route path="/new" element={<NewCustomer />} />
    <Route path="/:id" element={<CustomerDetail />} />
  </Routes>
);

