import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Analytics as AnalyticsIcon } from '@mui/icons-material';

const Analytics = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics
      </Typography>
      <Typography color="text.secondary" paragraph>
        View detailed analytics and reports on patient progress.
      </Typography>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <AnalyticsIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Analytics Dashboard Coming Soon
        </Typography>
        <Typography color="text.secondary">
          This feature will provide detailed insights into patient trends and progress.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Analytics;