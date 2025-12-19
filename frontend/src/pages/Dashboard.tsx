import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp,
  Build,
  People,
  DirectionsCar as VehicleIcon,
  Work as JobIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';
import type { Job, JobStatus } from '../stores/JobStore';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, loading }) => (
  <Card
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick ? {
        transform: 'translateY(-2px)',
        boxShadow: 4,
      } : {},
    }}
    onClick={onClick}
  >
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
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {loading ? (
          <Skeleton width={60} height={40} />
        ) : (
          <Typography variant="h4" fontWeight={600}>
            {value}
          </Typography>
        )}
      </Box>
      {onClick && <ArrowIcon color="action" />}
    </CardContent>
  </Card>
);

// Status colors
const statusConfig: Record<JobStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' }> = {
  BOOKED: { label: 'Booked', color: 'default' },
  IN_PROGRESS: { label: 'In Progress', color: 'primary' },
  PENDING: { label: 'Pending', color: 'warning' },
  AWAITING_PICKUP: { label: 'Awaiting Pickup', color: 'info' },
  COMPLETED: { label: 'Completed', color: 'success' },
};

export const Dashboard: React.FC = observer(() => {
  const navigate = useNavigate();
  const { authStore, jobStore, customerStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [vehiclesInService, setVehiclesInService] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    awaitingPayment: 0,
    totalCustomers: 0,
    inProgressVehicles: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch jobs
        await jobStore.fetchJobs();
        
        // Fetch customers count
        await customerStore.fetchCustomers();
        
        // Calculate stats from fetched data
        const jobs = jobStore.jobs || [];
        const activeJobs = jobs.filter((j) => 
          ['BOOKED', 'IN_PROGRESS', 'PENDING', 'AWAITING_PICKUP'].includes(j.status)
        ).length;
        
        // Awaiting payment = completed jobs with invoices (they can be unpaid)
        const awaitingPayment = jobs.filter((j) => j.status === 'COMPLETED' && j.invoiceId).length;
        
        const inProgressJobs = jobs.filter((j) => j.status === 'IN_PROGRESS');
        
        setStats({
          activeJobs,
          awaitingPayment,
          totalCustomers: customerStore.total || 0,
          inProgressVehicles: inProgressJobs.length,
        });
        
        // Set recent jobs (last 5)
        setRecentJobs(jobs.slice(0, 5));
        
        // Set vehicles in service
        setVehiclesInService(inProgressJobs.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Set defaults on error
        setStats({
          activeJobs: 0,
          awaitingPayment: 0,
          totalCustomers: 0,
          inProgressVehicles: 0,
        });
        setRecentJobs([]);
        setVehiclesInService([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [jobStore, customerStore]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Welcome back, {authStore.user?.name?.split(' ')[0] || 'User'}
        </Typography>
        <Typography color="text.secondary">
          Here's what's happening in your shop today
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/jobs/new')}
          size="large"
        >
          New Job
        </Button>
        <Button
          variant="outlined"
          startIcon={<People />}
          onClick={() => navigate('/customers')}
          size="large"
        >
          New Customer
        </Button>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value={stats.activeJobs}
            icon={<Build />}
            color="#FF9800"
            onClick={() => navigate('/jobs')}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Awaiting Payment"
            value={stats.awaitingPayment}
            icon={<TrendingUp />}
            color="#9C27B0"
            onClick={() => {
              // Navigate to jobs and filter for completed jobs (which have invoices)
              jobStore.setStatusFilter('COMPLETED');
              navigate('/jobs');
            }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<People />}
            color="#C2185B"
            onClick={() => navigate('/customers')}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vehicles In Service"
            value={stats.inProgressVehicles}
            icon={<VehicleIcon />}
            color="#1976D2"
            onClick={() => {
              jobStore.setStatusFilter('IN_PROGRESS');
              navigate('/jobs');
            }}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Jobs */}
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Jobs
                </Typography>
                <Button onClick={() => navigate('/jobs')} endIcon={<ArrowIcon />}>
                  View All
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : recentJobs.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <JobIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No jobs yet. Create your first job to get started.
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
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentJobs.map((job) => (
                      <TableRow
                        key={job.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <TableCell>
                          <Typography fontFamily="monospace" fontWeight={500}>
                            {job.code}
                          </Typography>
                        </TableCell>
                        <TableCell>{job.customer?.name || '-'}</TableCell>
                        <TableCell>
                          {job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : '-'}
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
                        <TableCell>{formatDate(job.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicles Currently In Service */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Vehicles In Service
                </Typography>
                <Button
                  onClick={() => {
                    jobStore.setStatusFilter('IN_PROGRESS');
                    navigate('/jobs');
                  }}
                  endIcon={<ArrowIcon />}
                >
                  View All
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : vehiclesInService.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <VehicleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No vehicles currently in service.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Start working on a job to see vehicles here.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {vehiclesInService.map((job) => (
                    <Box
                      key={job.id}
                      sx={{
                        p: 2,
                        bgcolor: 'action.hover',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          bgcolor: 'action.selected',
                        },
                      }}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <VehicleIcon color="primary" />
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={500}>
                            {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {job.customer?.name} • {job.code}
                          </Typography>
                        </Box>
                        {job.vehicle?.licensePlate && (
                          <Chip
                            label={job.vehicle.licensePlate}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                          />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
});
