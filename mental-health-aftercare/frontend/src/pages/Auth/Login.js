import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Container,
  Paper,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalHospital,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'provider',
    },
    validationSchema: isRegistering
      ? validationSchema.shape({
          firstName: Yup.string().required('First name is required'),
          lastName: Yup.string().required('Last name is required'),
        })
      : validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        if (isRegistering) {
          await register(values);
        } else {
          await login(values.email, values.password);
        }
        navigate('/dashboard');
      } catch (error) {
        setError(error.response?.data?.message || 'An error occurred');
      }
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const switchMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    formik.resetForm();
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4,
        }}
      >
        <Paper
          elevation={24}
          sx={{
            width: '100%',
            maxWidth: 500,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              color: 'white',
              p: 4,
              textAlign: 'center',
            }}
          >
            <LocalHospital sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Mental Health Aftercare
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Supporting recovery through family engagement
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" textAlign="center" gutterBottom>
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 3 }}
            >
              {isRegistering
                ? 'Join our platform to provide better patient care'
                : 'Sign in to your account to continue'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={formik.handleSubmit}>
              {isRegistering && (
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    name="firstName"
                    label="First Name"
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                    helperText={formik.touched.firstName && formik.errors.firstName}
                  />
                  <TextField
                    fullWidth
                    name="lastName"
                    label="Last Name"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                    helperText={formik.touched.lastName && formik.errors.lastName}
                  />
                </Box>
              )}

              <TextField
                fullWidth
                margin="normal"
                name="email"
                label="Email Address"
                type="email"
                autoComplete="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                margin="normal"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={formik.isSubmitting}
                sx={{
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a67d8, #6b46c1)',
                  },
                }}
              >
                {formik.isSubmitting
                  ? 'Please wait...'
                  : isRegistering
                  ? 'Create Account'
                  : 'Sign In'}
              </Button>

              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={switchMode}
                    sx={{ textDecoration: 'none' }}
                  >
                    {isRegistering ? 'Sign In' : 'Create Account'}
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;