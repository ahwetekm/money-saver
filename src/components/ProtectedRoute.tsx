import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from '../lib/api';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
