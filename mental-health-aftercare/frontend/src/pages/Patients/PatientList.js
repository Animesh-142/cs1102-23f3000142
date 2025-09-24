import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';

const PatientList = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Patients
      </Typography>
      <Typography color="text.secondary" paragraph>
        Manage your patients and their care plans.
      </Typography>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <PeopleIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Patient Management Coming Soon
        </Typography>
        <Typography color="text.secondary" paragraph>
          This feature will allow you to manage patients, view their profiles, and track their progress.
        </Typography>
        <Button variant="contained" disabled>
          Add New Patient
        </Button>
      </Paper>
    </Box>
  );
};

export default PatientList;