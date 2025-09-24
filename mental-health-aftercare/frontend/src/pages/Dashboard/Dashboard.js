import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Chip,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { analyticsService } from '../../services/apiService';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

const StatCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="text.secondary" variant="h6" component="div">
            {title}
          </Typography>
          <Typography variant="h3" component="div" color={`${color}.main`} gutterBottom>
            {value}
          </Typography>
          {subtitle && (
            <Typography color="text.secondary" variant="body2">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}.main`,
            width: 56,
            height: 56,
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, isProvider, isAdmin, isFamilyMember } = useAuth();

  // Fetch dashboard metrics
  const { data: dashboardData, isLoading, error } = useQuery(
    ['dashboard-metrics'],
    () => analyticsService.getDashboardMetrics(),
    {
      enabled: isProvider || isAdmin,
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="error" variant="h6">
          Error loading dashboard data
        </Typography>
        <Typography color="text.secondary">
          Please refresh the page or try again later.
        </Typography>
      </Box>
    );
  }

  const renderProviderDashboard = () => (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={dashboardData?.overview?.totalPatients || 0}
            subtitle="Active patients"
            icon={<PeopleIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Patients"
            value={dashboardData?.overview?.activePatients || 0}
            subtitle="Recently responded"
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Response Rate"
            value={`${dashboardData?.overview?.responseRate || 0}%`}
            subtitle="Last 30 days"
            icon={<AssignmentIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Response Time"
            value={`${dashboardData?.overview?.avgResponseTime || 0}h`}
            subtitle="Hours to respond"
            icon={<NotificationsIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography color="text.secondary" paragraph>
              Recent checklist submissions and patient interactions will appear here.
            </Typography>
            <Box display="flex" justifyContent="center" py={4}>
              <Typography color="text.secondary">
                No recent activity to display
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
              <Typography variant="h6">
                Recent Alerts
              </Typography>
              <Chip 
                label={dashboardData?.recentConcerns?.length || 0}
                color="error"
                size="small"
              />
            </Box>
            
            {dashboardData?.recentConcerns?.length > 0 ? (
              <List dense>
                {dashboardData.recentConcerns.map((concern, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'error.main' }}>
                          <WarningIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={concern.message}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {concern.patientName}
                            </Typography>
                            {' — ' + new Date(concern.createdAt).toLocaleDateString()}
                          </>
                        }
                      />
                    </ListItem>
                    {index < dashboardData.recentConcerns.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={2}>
                <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                <Typography color="text.secondary">
                  No recent alerts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All patients are doing well
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );

  const renderFamilyMemberDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AssignmentIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Welcome to the Family Portal
          </Typography>
          <Typography color="text.secondary" paragraph>
            Thank you for participating in your family member's care. Your feedback helps healthcare providers provide better support.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{ mt: 2 }}
            onClick={() => window.location.href = '/my-checklists'}
          >
            View My Checklists
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* Welcome Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography color="text.secondary" variant="h6">
          {isProvider || isAdmin
            ? 'Here\'s an overview of your patients and their progress.'
            : 'Thank you for supporting your family member\'s recovery.'}
        </Typography>
      </Box>

      {/* Dashboard Content */}
      {(isProvider || isAdmin) && renderProviderDashboard()}
      {isFamilyMember && renderFamilyMemberDashboard()}
    </Box>
  );
};

export default Dashboard;