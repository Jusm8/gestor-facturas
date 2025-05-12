import React, { useEffect, useState } from 'react';
import '../assets/styles/Proyectos.css';
import { useNavigate } from 'react-router-dom';

export default function Proyectos() {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProyectos = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      try {
        const res = await fetch(`http://localhost:3001/api/auth/proyectos/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setProyectos(data);
        else console.error(data.error);
      } catch (err) {
        console.error('Error cargando proyectos:', err);
      }
    };

    fetchProyectos();
  }, []);

  //Funcion para que salga siempre en formato dd/mm/yyyy
  const formatFecha = (isoDate: string) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };


  return (
    <div className="proyectos-container">
      <div className="proyectos-header">
        <h2>Mis Proyectos</h2>
        <button className="nuevo-btn" onClick={() => navigate('/proyectos/nuevo')}>
          + Nuevo Proyecto
        </button>
      </div>

      {proyectos.length === 0 ? (
        <div className="no-proyectos">
          <p>No tienes ningún proyecto creado.</p>
        </div>
      ) : (
        <div className="proyectos-grid">
          {proyectos.map((proy) => (
            <div className="proyecto-card" key={proy.idProyecto}>
              <h3>{proy.nombre}</h3>
              <p className="estado">{proy.estado}</p>
              <p className="descripcion">{proy.descripcion || 'Sin descripción'}</p>
              <p><strong>Inicio:</strong> {formatFecha(proy.fecha_inicio)}</p>
              <p><strong>Fin:</strong> {proy.fecha_fin ? formatFecha(proy.fecha_fin) : 'No definido'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
