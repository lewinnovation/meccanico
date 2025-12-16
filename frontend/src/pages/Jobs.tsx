import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Typography, Button, Tabs, Tab, Card, CardContent } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';

const JobList: React.FC = observer(() => {
  const [statusTab, setStatusTab] = React.useState(0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Jobs
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Job
        </Button>
      </Box>

      {/* Status Tabs */}
      <Tabs
        value={statusTab}
        onChange={(_, v) => setStatusTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="All" />
        <Tab label="Estimates" />
        <Tab label="In Progress" />
        <Tab label="Invoiced" />
        <Tab label="Paid" />
      </Tabs>

      {/* Empty State */}
      <Card>
        <CardContent sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No jobs yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create your first job to start managing your work orders.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            Create Job
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
});

const JobDetail: React.FC = () => (
  <Box>
    <Typography variant="h4">Job Detail</Typography>
    {/* Job detail component will be implemented */}
  </Box>
);

const NewJob: React.FC = () => (
  <Box>
    <Typography variant="h4">New Job</Typography>
    {/* New job form will be implemented */}
  </Box>
);

export const Jobs: React.FC = () => (
  <Routes>
    <Route path="/" element={<JobList />} />
    <Route path="/new" element={<NewJob />} />
    <Route path="/:id" element={<JobDetail />} />
  </Routes>
);

