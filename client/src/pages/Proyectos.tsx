import React, { useEffect, useState } from 'react';
import '../assets/styles/Proyectos.css';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Proyectos() {
  const [proyectosOriginales, setProyectosOriginales] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  const cargarProyectos = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/proyectos/usuario/${user.id}`, {
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

  useEffect(() => {
    cargarProyectos();
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

  const handleEditar = (idProyecto: number) => {
    navigate(`/proyectos/${idProyecto}/editar`);
  };

  const handleEliminar = (idProyecto: number) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el proyecto de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/proyectos/usuario/${user.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            Swal.fire('Eliminado', 'El proyecto ha sido eliminado.', 'success');
            cargarProyectos();
          } else {
            Swal.fire('Error', 'No se pudo eliminar el proyecto.', 'error');
          }
        } catch (error) {
          console.error(error);
          Swal.fire('Error', 'Hubo un error de conexión.', 'error');
        }
      }
    });
  };

  return (
    <div className="proyectos-container" style={{ background: 'linear-gradient(to bottom, #4760c0, #17224d)', minHeight: '100vh' }}>
      <h1 className="proyectos-titulo-principal">¿Qué proyecto deseas gestionar hoy?</h1>

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
        <div className="dashboard-grid">
          {proyectos.map((proy) => (
            <div className="dashboard-card" key={proy.idProyecto} onClick={() => navigate(`/dashboard/${proy.idProyecto}`)}>
              <h3>{proy.nombre}</h3>
              <p><strong>Estado:</strong> {proy.estado}</p>
              <p>{proy.descripcion}</p>
              <p><strong>Inicio:</strong> {new Date(proy.fecha_inicio).toLocaleDateString()}</p>
              <p><strong>Fin:</strong> {new Date(proy.fecha_fin).toLocaleDateString()}</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleEditar(proy.idProyecto); }} title="Editar">✏️</button>
                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleEliminar(proy.idProyecto); }} title="Eliminar">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}