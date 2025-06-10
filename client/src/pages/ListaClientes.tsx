import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showError, showConfirm, showSuccess } from '../components/alert';
import '../assets/styles/ListadoClientes.css';

interface Cliente {
  idCliente: number;
  nombre: string;
  email: string;
  nif: string;
  direccion: string;
  telefono: string;
}

export default function ListaClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const idProyecto = localStorage.getItem('proyectoActual');

  const cargarClientes = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gestion/clientes/usuario/${user.id}/proyecto/${idProyecto}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('Respuesta del backend al cargar clientes:', data);

      if (res.ok && Array.isArray(data)) {
        setClientes(data);
        setError(null);
      } else {
        console.error('Error del backend:', data?.error);
        setError(data?.error || 'Error al obtener clientes');
        //Si da error limpio
        setClientes([]);
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
      setError('No se pudo conectar con el servidor');
      setClientes([]);
    }
  };

  const handleEliminarCliente = async (idCliente: number) => {
    const token = localStorage.getItem('token');

    const confirmado = await showConfirm(
      '¿Estás seguro?',
      'Esta acción eliminará el cliente de forma permanente'
    );

    if (!confirmado) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}1/api/gestion/clientes/${idCliente}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setClientes(clientes.filter(c => c.idCliente !== idCliente));
        await showSuccess('Eliminado', 'Cliente eliminado correctamente');
      } else {
        console.error('Error al eliminar cliente');
        showError('Error', 'No se pudo eliminar el cliente');
      }
    } catch (err) {
      console.error(err);
      showError('Error de red', 'No se pudo conectar con el servidor');
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const clientesFiltrados = Array.isArray(clientes)
    ? clientes.filter(c =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
    : [];

  return (
    <div className="clientes-container">
      <div className="clientes-header">
        <button
          className="btn-volver-dashboard"
          onClick={() => navigate(`/dashboard/${idProyecto}`)}
        >
          ← Volver al Menu
        </button>
        <h1 className="clientes-titulo">Listado de Clientes</h1>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="cliente-buscador"
        />
        <button onClick={() => navigate('/clientes/nuevo')}>+ Nuevo Cliente</button>
      </div>

      {error && <p className="error-cliente">{error}</p>}

      {clientesFiltrados.length === 0 && !error ? (
        <p className="no-clientes">No hay clientes que coincidan.</p>
      ) : (
        <div className="cliente-lista">
          {clientesFiltrados.map((cliente) => (
            <div key={cliente.idCliente} className="cliente-card">
              <h3>{cliente.nombre}</h3>
              <p><strong>Email:</strong> {cliente.email}</p>
              <p><strong>NIF:</strong> {cliente.nif}</p>
              <p><strong>Teléfono:</strong> {cliente.telefono}</p>
              <p><strong>Dirección:</strong> {cliente.direccion}</p>
              <div className="cliente-acciones">
                <button
                  className="btn-icon"
                  title="Editar"
                  onClick={() => navigate(`/clientes/editar/${cliente.idCliente}`)}
                >✏️</button>
                <button
                  className="btn-icon"
                  title="Eliminar"
                  onClick={() => handleEliminarCliente(cliente.idCliente)}
                >🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}