import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Assignment as AssignmentIcon } from '@mui/icons-material';

const Checklists = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Checklists
      </Typography>
      <Typography color="text.secondary" paragraph>
        View and manage daily checklists for your patients.
      </Typography>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <AssignmentIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Checklist Management Coming Soon
        </Typography>
        <Typography color="text.secondary">
          This feature will allow you to create, send, and track daily checklists.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Checklists;