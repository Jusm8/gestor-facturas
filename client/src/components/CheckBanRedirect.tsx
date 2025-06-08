import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CheckBanRedirect() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const validateUser = async () => {
      if (!user) return;

      try {
        const res = await fetch(`http://localhost:3001/api/auth/usuarios/${user.id}`);
        const updated = await res.json();

        if (updated.rol === 'baneado') {
          localStorage.setItem('user', JSON.stringify(updated));
          setUser(updated);
          if (location.pathname !== '/baneado') {
            navigate('/baneado');
          }
        }
      } catch (err) {
        console.error('Error validando usuario:', err);
      }
    };

    validateUser();
  }, [user, location.pathname]);

  return null;
}
