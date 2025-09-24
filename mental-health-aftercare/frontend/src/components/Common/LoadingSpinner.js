import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...', size = 60 }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      gap={2}
    >
      <CircularProgress size={size} thickness={4} />
      <Typography color="text.secondary" variant="body1">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;