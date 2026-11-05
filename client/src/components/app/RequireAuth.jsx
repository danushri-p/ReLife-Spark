import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Sends signed-out visitors to /login, remembering where they were headed. */
export const RequireAuth = ({ children }) => {
  const { user, signedOut } = useAuth();
  const location = useLocation();
  // Signing out from inside the app goes back to the home page, not the login screen.
  if (!user && signedOut) return <Navigate to="/" replace />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }
  return children;
};

export default RequireAuth;
