import React from 'react';
import { FaUserCircle } from 'react-icons/fa';
import '../assets/styles/Navbar.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
export default function Navbar() {

  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [clima, setClima] = React.useState('');
  //Api del clima
  const getWeatherEmoji = (code: number) => {
    if ([0].includes(code)) return '☀️';
    if ([1, 2].includes(code)) return '🌤️';
    if ([3].includes(code)) return '☁️';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
    if ([61, 63, 65, 66, 67].includes(code)) return '🌧️';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
    if ([80, 81, 82].includes(code)) return '🌧️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '🌡️';
  };

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

  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
          );
          const weatherData = await weatherRes.json();

          if (weatherData?.current_weather) {
            const temp = weatherData.current_weather.temperature;
            const icon = getWeatherEmoji(weatherData.current_weather.weathercode);
            setClima(`${icon} ${temp}°C`);
          } else {
            setClima('Clima no disponible');
          }
        } catch {
          setClima('Clima no disponible');
        }
      },
      () => {
        setClima('Clima no disponible');
      }
    );
  }, []);

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
        <span className="clima-info">{clima}</span>
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
