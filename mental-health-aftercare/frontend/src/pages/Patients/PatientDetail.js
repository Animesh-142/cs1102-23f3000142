import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const PatientDetail = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Patient Details
      </Typography>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Patient detail view coming soon</Typography>
      </Paper>
    </Box>
  );
};

export default PatientDetail;