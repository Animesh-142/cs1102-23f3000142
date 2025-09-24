import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const ChecklistDetail = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Checklist Details
      </Typography>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Checklist detail view coming soon</Typography>
      </Paper>
    </Box>
  );
};

export default ChecklistDetail;