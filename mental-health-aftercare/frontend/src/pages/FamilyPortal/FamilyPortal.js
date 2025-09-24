import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const FamilyPortal = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Family Portal
      </Typography>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Family portal coming soon</Typography>
      </Paper>
    </Box>
  );
};

export default FamilyPortal;