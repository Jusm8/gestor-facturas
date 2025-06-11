import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LogoutHandler() {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
            
            //Redirigir al login tras limpiar todo
            navigate('/login');
        }
    }, []);

    return null;
}
