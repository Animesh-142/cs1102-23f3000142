import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import PatientList from './pages/Patients/PatientList';
import PatientDetail from './pages/Patients/PatientDetail';
import FamilyMembers from './pages/FamilyMembers/FamilyMembers';
import Checklists from './pages/Checklists/Checklists';
import ChecklistDetail from './pages/Checklists/ChecklistDetail';
import Analytics from './pages/Analytics/Analytics';
import FamilyPortal from './pages/FamilyPortal/FamilyPortal';
import ChecklistForm from './pages/ChecklistForm/ChecklistForm';
import LoadingSpinner from './components/Common/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, show login page
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/family-portal" element={<FamilyPortal />} />
        <Route path="/checklist/:checklistId" element={<ChecklistForm />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If authenticated, show main application
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Provider/Admin Routes */}
        {(user.role === 'provider' || user.role === 'admin') && (
          <>
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/:patientId" element={<PatientDetail />} />
            <Route path="/family-members" element={<FamilyMembers />} />
            <Route path="/checklists" element={<Checklists />} />
            <Route path="/checklists/:checklistId" element={<ChecklistDetail />} />
            <Route path="/analytics" element={<Analytics />} />
          </>
        )}

        {/* Family Member Routes */}
        {user.role === 'family_member' && (
          <>
            <Route path="/my-checklists" element={<Checklists />} />
            <Route path="/checklist/:checklistId" element={<ChecklistForm />} />
          </>
        )}

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;