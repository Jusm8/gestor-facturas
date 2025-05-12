import React, { useEffect, useState } from 'react';
import '../assets/styles/Proyectos.css';
import { useNavigate } from 'react-router-dom';

export default function Proyectos() {
  const [proyectosOriginales, setProyectosOriginales] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
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

        if (res.ok) {
          setProyectosOriginales(data);
          setProyectos(data);
        } else {
          console.error(data.error);
        }
      } catch (err) {
        console.error('Error cargando proyectos:', err);
      }
    };

    fetchProyectos();

  }, []);

  useEffect(() => {
    if (busqueda.trim() === '') {
      setProyectos(proyectosOriginales);
    } else {
      const filtrados = proyectosOriginales.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
      setProyectos(filtrados);
    }
  }, [busqueda, proyectosOriginales]);

  return (
    <div className="proyectos-container">
      <div className="proyectos-header">
        <input
          type="text"
          placeholder="Buscar proyecto por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="proyecto-buscador"
        />
        <button onClick={() => navigate('/proyectos/nuevo')}>+ Nuevo Proyecto</button>
      </div>

      {proyectos.length === 0 ? (
        <p className="no-proyectos">No hay proyectos que coincidan con la búsqueda.</p>
      ) : (
        <div className="proyecto-lista">
          {proyectos.map((proy) => (
            <div
              className="proyecto-card"
              key={proy.idProyecto}
              onClick={() => navigate(`/proyectos/${proy.idProyecto}`)}
            >
              <h3>{proy.nombre}</h3>
              <p><strong>Estado:</strong> {proy.estado}</p>
              <p>{proy.descripcion}</p>
              <p><strong>Inicio:</strong> {new Date(proy.fecha_inicio).toLocaleDateString('es-ES')}</p>
              <p><strong>Fin:</strong> {new Date(proy.fecha_fin).toLocaleDateString('es-ES')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
