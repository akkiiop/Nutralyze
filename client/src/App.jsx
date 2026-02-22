import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, Box, CircularProgress } from '@mui/material';
import theme from './theme';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Welcome from './pages/Welcome';
import SignIn from './pages/SignIn';
import SignUp from "./pages/SignUp";

import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import DietPlan from './pages/DietPlan';
import MealLog from './pages/MealLog';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ChatBot from './components/chat/ChatBot';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import FoodScan from "./pages/FoodScan";
import PackageFood from "./pages/PackageFood/PackageFood";
const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          gap: 2,
          justifyContent: 'center',
          flexWrap: 'wrap'   // ✅ ADD THIS
        }}
      >

        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {currentUser && <Navbar />}

      <main className="main-content">
        <Box className="layout-container">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={!currentUser ? <Welcome /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/signin"
              element={!currentUser ? <SignIn /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/signup"
              element={!currentUser ? <SignUp /> : <Navigate to="/dashboard" />}
            />

            {/* Onboarding allowed even if profile incomplete */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute requireProfile={false}>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireProfile={true}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/diet-plan"
              element={
                <ProtectedRoute requireProfile={true}>
                  <DietPlan />
                </ProtectedRoute>
              }
            />

            <Route
              path="/meal-log"
              element={
                <ProtectedRoute requireProfile={true}>
                  <MealLog userId={currentUser?._id} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/package-food"
              element={
                <ProtectedRoute requireProfile={true}>
                  <PackageFood />
                </ProtectedRoute>
              }
            />

            <Route
              path="/progress"
              element={
                <ProtectedRoute requireProfile={true}>
                  <Progress />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute requireProfile={true}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* NEW: Food Scanner Page */}
            <Route
              path="/scan"
              element={
                <ProtectedRoute requireProfile={true}>
                  <FoodScan />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Box>
      </main>

      {currentUser && location.pathname !== "/onboarding" && <ChatBot />}
      <Footer />
    </Box >
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
