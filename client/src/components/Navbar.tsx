import React from 'react';
import { FaUserCircle } from 'react-icons/fa';
import '../assets/styles/Navbar.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
export default function Navbar() {

  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  //logout
  const handleLogout = () => {
    //Mensaje de prevencion de que se cierre la sesion
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
        window.location.href = '/logout';
      }
    });
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src="/SimplifacLogo.png" alt="Logo" className="logo" />
        <span className='Proyectos' onClick={() => navigate('/Proyectos')}>Proyectos</span>
        {user?.rol === 'admin' && (
          <span onClick={() => navigate('/resumen')}>Administración</span>
        )}
        <span onClick={() => navigate('/contactanos')}>Contáctanos</span>
        <span onClick={() => navigate('/sobre-nosotros')}>Sobre Nosotros</span>
      </div>
      <div className="navbar-right">
        <span className="usuario" onClick={() => navigate('/perfil')}>
          {user?.nombre || 'Usuario'}
        </span>

        {user?.imagen_url ? (
          <img
            src={
              user.imagen_url.startsWith('/uploads/')
                ? `http://localhost:3001${user.imagen_url}`
                : user.imagen_url
            }
            alt="Perfil"
            className="user-image"
            onClick={() => navigate('/perfil')}
          />
        ) : (
          <span onClick={() => navigate('/perfil')} style={{ cursor: 'pointer' }}>
            <FaUserCircle size={38} />
          </span>
        )}
        <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </nav>
  );
}
