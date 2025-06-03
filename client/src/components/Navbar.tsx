import React from 'react';
import { FaUserCircle } from 'react-icons/fa';
import '../assets/styles/Navbar.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
export default function Navbar() {

  const { setUser } = useAuth();
  const navigate = useNavigate();

  //logout
  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que quieres cerrar sesión?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      }
    });
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src="/SimplifacLogo.png" alt="Logo" className="logo" />
        <span className='Proyectos' onClick={() => navigate('/Proyectos')}>Proyectos</span>
        <span>More</span>
      </div>
      <div className="navbar-right">
        <span className="usuario" onClick={() => navigate('/perfil')}>Usuario</span>
        <FaUserCircle size={38} />
        <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
      </div>

    </nav>
  );
}
