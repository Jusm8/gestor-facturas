import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <h1>Bienvenido a SimpliFac</h1>
      <p>¿Qué deseas gestionar hoy?</p>

      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={() => navigate('/clientes')}>
          <span className="emoji">👤</span>
          <h3>Clientes</h3>
          <p>Ver y administrar tu lista de clientes.</p>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/productos')}>
          <span className="emoji">📦</span>
          <h3>Productos</h3>
          <p>Consulta tus productos y servicios disponibles.</p>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/proyectos')}>
          <span className="emoji">📁</span>
          <h3>Proyectos</h3>
          <p>Accede a todos tus proyectos activos.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
