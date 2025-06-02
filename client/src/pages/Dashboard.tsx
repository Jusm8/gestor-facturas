import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../assets/styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { idProyecto } = useParams();
  const [nombreProyecto, setNombreProyecto] = useState('');

  useEffect(() => {
    const fetchNombreProyecto = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`http://localhost:3001/api/auth/proyectos/${idProyecto}/editar`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setNombreProyecto(data.nombre);
        }
      } catch (error) {
        console.error('Error al cargar el nombre del proyecto:', error);
      }
    };

    if (idProyecto) fetchNombreProyecto();
  }, [idProyecto]);

  return (
    <div className="dashboard">
      <h1 className="dashboard-titulo-principal">Estás gestionando el proyecto "{nombreProyecto}"</h1>
      <p>¿Qué deseas hacer?</p>

      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={() => navigate(`/proyectos/${idProyecto}`)}>
          <span className="emoji">📄</span>
          <h3>Documentos</h3>
          <p>Presupuestos y facturas del proyecto.</p>
        </div>
        <div className="dashboard-card" onClick={() => navigate('/clientes')}>
          <span className="emoji">👥</span>
          <h3>Clientes</h3>
          <p>Gestionar tus clientes.</p>
        </div>
        <div className="dashboard-card" onClick={() => navigate('/productos')}>
          <span className="emoji">📦</span>
          <h3>Productos</h3>
          <p>Gestionar tus productos.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;