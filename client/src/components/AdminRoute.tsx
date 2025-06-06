import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user || user.rol !== 'admin') {
    return <Navigate to="/proyectos" />;
  }

  return <>{children}</>;
}
