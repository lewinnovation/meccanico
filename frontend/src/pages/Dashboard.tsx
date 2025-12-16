import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Button } from '@mui/material';
import { Add as AddIcon, TrendingUp, Build, People, Inventory } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: `${color}15`,
          color: color,
          display: 'flex',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={600}>
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = observer(() => {
  const navigate = useNavigate();
  const { authStore } = useStore();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Welcome back, {authStore.user?.name?.split(' ')[0]}
        </Typography>
        <Typography color="text.secondary">
          Here's what's happening in your shop today
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/jobs/new')}
          size="large"
        >
          New Job
        </Button>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value="12"
            icon={<Build />}
            color="#FF9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Awaiting Payment"
            value="5"
            icon={<TrendingUp />}
            color="#9C27B0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Customers"
            value="248"
            icon={<People />}
            color="#C2185B"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value="8"
            icon={<Inventory />}
            color="#1976D2"
          />
        </Grid>
      </Grid>

      {/* Recent Jobs */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Recent Jobs
            </Typography>
            <Button onClick={() => navigate('/jobs')}>View All</Button>
          </Box>
          
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No recent jobs. Create your first job to get started.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate('/jobs/new')}
              sx={{ mt: 2 }}
            >
              Create Job
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
});

