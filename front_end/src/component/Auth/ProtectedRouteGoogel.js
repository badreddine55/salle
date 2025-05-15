import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRouteGoogel = () => {
  // Check if the user is authenticated (e.g., user data exists in localStorage)
  const isAuthenticated = localStorage.getItem('user');

  // If authenticated, render the child component (e.g., AuthUser)
  // Otherwise, redirect to the home page
  return isAuthenticated ? <Outlet /> : <Navigate to="/DashboardUser" replace />;
};

export default ProtectedRouteGoogel;