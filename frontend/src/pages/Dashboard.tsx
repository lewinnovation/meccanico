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
  Receipt as InvoiceIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';
import type { Job, JobStatus } from '../stores/JobStore';
import type { Invoice } from '../stores/InvoiceStore';

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
  CANCELLED: { label: 'Cancelled', color: 'error' },
};

export const Dashboard: React.FC = observer(() => {
  const navigate = useNavigate();
  const { authStore, jobStore, customerStore, invoiceStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [vehiclesInService, setVehiclesInService] = useState<Job[]>([]);
  const [jobsToInvoice, setJobsToInvoice] = useState<Job[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<(Invoice & { isOverdue: boolean })[]>([]);
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
        // Fetch all jobs (we need all for accurate stats)
        await jobStore.fetchJobs();
        
        // Fetch all invoices
        await invoiceStore.fetchAll();
        
        // Calculate stats from fetched data
        const jobs = jobStore.jobs || [];
        const invoices = invoiceStore.invoices || [];
        
        // 1. In progress jobs = IN_PROGRESS, PENDING, AWAITING_PICKUP
        const inProgressJobs = jobs.filter((j) => 
          ['IN_PROGRESS', 'PENDING', 'AWAITING_PICKUP'].includes(j.status)
        );
        const activeJobs = inProgressJobs.length;
        
        // 2. Awaiting payment = unpaid invoices
        const unpaidInvoicesList = invoices.filter((inv) => inv.status !== 'PAID');
        const awaitingPayment = unpaidInvoicesList.length;
        
        // 3. Total customers this month = unique customers with completed jobs this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const completedJobsThisMonth = jobs.filter((j) => {
          if (j.status !== 'COMPLETED' || !j.completedAt) return false;
          const completedDate = new Date(j.completedAt);
          return completedDate >= startOfMonth;
        });
        const uniqueCustomersThisMonth = new Set(
          completedJobsThisMonth
            .map((j) => j.customerId)
            .filter((id): id is string => !!id)
        );
        const totalCustomers = uniqueCustomersThisMonth.size;
        
        // 4. Vehicles in service = unique vehicles with jobs in IN_PROGRESS, PENDING, or AWAITING_PICKUP
        const uniqueVehiclesInService = new Set(
          inProgressJobs
            .map((j) => j.vehicleId)
            .filter((id): id is string => !!id)
        );
        const inProgressVehicles = uniqueVehiclesInService.size;
        
        // 5. Jobs to invoice = completed jobs without invoices
        const jobsToInvoiceList = jobs.filter(
          (j) => j.status === 'COMPLETED' && !j.invoiceId
        );
        
        // 6. Unpaid invoices with overdue status
        const nowDate = new Date();
        const unpaidInvoicesWithOverdue = unpaidInvoicesList.map((inv) => {
          const dueDate = new Date(inv.dueDate);
          return {
            ...inv,
            isOverdue: dueDate < nowDate && inv.status !== 'PAID',
          };
        });
        
        setStats({
          activeJobs,
          awaitingPayment,
          totalCustomers,
          inProgressVehicles,
        });
        
        // Set recent jobs (last 5)
        setRecentJobs(jobs.slice(0, 5));
        
        // Set vehicles in service (first 5 unique vehicles)
        const vehicleMap = new Map<string, Job>();
        inProgressJobs.forEach((job) => {
          if (job.vehicleId && !vehicleMap.has(job.vehicleId)) {
            vehicleMap.set(job.vehicleId, job);
          }
        });
        setVehiclesInService(Array.from(vehicleMap.values()).slice(0, 5));
        
        // Set jobs to invoice
        setJobsToInvoice(jobsToInvoiceList.slice(0, 5));
        
        // Set unpaid invoices
        setUnpaidInvoices(unpaidInvoicesWithOverdue.slice(0, 5));
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
        setJobsToInvoice([]);
        setUnpaidInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [jobStore, customerStore, invoiceStore]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Welcome back, {authStore.user?.name?.split(' ')[0] || 'User'}
        </Typography>
        <Typography color="text.secondary">
          Here's what's happening in your shop
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="In Progress Jobs"
            value={stats.activeJobs}
            icon={<Build />}
            color="#FF9800"
            onClick={() => {
              // Navigate to Jobs page and select In Progress tab (index 2)
              navigate('/jobs?tab=2');
            }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Awaiting Payment"
            value={stats.awaitingPayment}
            icon={<TrendingUp />}
            color="#9C27B0"
            onClick={() => {
              // Navigate to Invoiced tab (index 6) with unpaid filter
              navigate('/jobs?tab=6&invoicePaid=unpaid');
            }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Customers This Month"
            value={stats.totalCustomers}
            icon={<People />}
            color="#C2185B"
            onClick={() => navigate('/customers')}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Jobs */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Jobs ({recentJobs.length})
                </Typography>
                <Button
                  onClick={() => {
                    // Set date range to last 7 days
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - 7);
                    const startDateStr = startDate.toISOString().split('T')[0];
                    const endDateStr = endDate.toISOString().split('T')[0];
                    navigate(`/jobs?startDate=${startDateStr}&endDate=${endDateStr}`);
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
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Vehicles In Service ({stats.inProgressVehicles})
                </Typography>
                <Button
                  onClick={() => {
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

      {/* Jobs to Invoice & Unpaid Invoices */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Jobs to Invoice */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Jobs to Invoice
                </Typography>
                <Button
                  onClick={() => {
                    // Navigate to Completed tab (tab 5) with not-invoiced filter
                    navigate('/jobs?tab=5&invoiced=not-invoiced');
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
              ) : jobsToInvoice.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <InvoiceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No jobs ready to invoice.
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Completed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobsToInvoice.map((job) => (
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
                          {job.completedAt ? formatDate(job.completedAt) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Unpaid Invoices */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Unpaid Invoices
                </Typography>
                <Button
                  onClick={() => {
                    // Navigate to Invoiced tab (tab 6) with unpaid filter
                    navigate('/jobs?tab=6&invoicePaid=unpaid');
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
              ) : unpaidInvoices.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <InvoiceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No unpaid invoices.
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unpaidInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/jobs/${invoice.jobId}`)}
                      >
                        <TableCell>
                          <Typography fontFamily="monospace" fontWeight={500}>
                            {invoice.invoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>{invoice.job?.customer?.name || '-'}</TableCell>
                        <TableCell>
                          {formatDate(invoice.dueDate)}
                        </TableCell>
                        <TableCell>
                          {invoice.isOverdue ? (
                            <Chip
                              label="Overdue"
                              color="error"
                              size="small"
                              icon={<WarningIcon />}
                            />
                          ) : (
                            <Chip
                              label="Unpaid"
                              color="warning"
                              size="small"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
});
