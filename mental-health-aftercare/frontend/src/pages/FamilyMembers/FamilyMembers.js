import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Group as GroupIcon } from '@mui/icons-material';

const FamilyMembers = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Family Members
      </Typography>
      <Typography color="text.secondary" paragraph>
        Manage family members and their access to patient information.
      </Typography>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <GroupIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Family Member Management Coming Soon
        </Typography>
        <Typography color="text.secondary">
          This feature will allow you to add and manage family members who can provide feedback.
        </Typography>
      </Paper>
    </Box>
  );
};

export default FamilyMembers;