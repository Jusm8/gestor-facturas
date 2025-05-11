import React from 'react';
import { FaUserCircle } from 'react-icons/fa';
import '../assets/styles/Navbar.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function Navbar() {

  const { setUser } = useAuth();
  const navigate = useNavigate();

  //logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    //limpio el contexto
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src="../public/SimplifacLogo_2.png" alt="Logo" className="logo" />
        <span className='Dashboard' onClick={() => navigate('/dashboard')}>Home</span>
        <span className='Proyectos' onClick={() => navigate('/Proyectos')}>Proyectos</span>
        <span>More</span>
      </div>
      <div className="navbar-right">
        <span className="usuario" onClick={() => navigate('/perfil')}>Usuario</span>
        <FaUserCircle size={38}/>
        <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
      </div>

    </nav>
  );
}
