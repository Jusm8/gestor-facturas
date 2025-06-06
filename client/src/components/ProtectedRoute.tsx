import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" />;

  //Si el usuario está baneado, lo sacamos de la app y limpiamos sesión
  if (user.rol === 'baneado') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;