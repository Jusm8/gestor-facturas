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
  const [mostrarImportador, setMostrarImportador] = useState(false);
  const [proyectosDisponibles, setProyectosDisponibles] = useState<any[]>([]);
  const [proyectoOrigen, setProyectoOrigen] = useState<string>('');
  const [clientesOrigen, setClientesOrigen] = useState<Cliente[]>([]);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);

  const idProyecto = localStorage.getItem('proyectoActual');

  const cargarClientes = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const res = await fetch(`http://localhost:3001/api/gestion/clientes/usuario/${user.id}/proyecto/${idProyecto}`, {
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

  //Función para cargar los proyectos
  const cargarProyectos = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`http://localhost:3001/api/auth/proyectos/usuario/${user.id}`);
    const data = await res.json();
    setProyectosDisponibles(data);
  };

  //Cargar clientes del proyecto seleccionado
  const cargarClientesOrigen = async (idProyecto: string) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`http://localhost:3001/api/gestion/clientes/usuario/${user.id}/proyecto/${idProyecto}`);
    const data = await res.json();
    setClientesOrigen(data);
  };


  const handleEliminarCliente = async (idCliente: number) => {
    const token = localStorage.getItem('token');

    const confirmado = await showConfirm(
      '¿Estás seguro?',
      'Esta acción eliminará el cliente de forma permanente'
    );

    if (!confirmado) return;

    try {
      const res = await fetch(`http://localhost:3001/api/gestion/clientes/${idCliente}`, {
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
        <button onClick={() => {
          cargarProyectos();
          setMostrarImportador(true);
        }}>📥 Importar desde otro proyecto</button>
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
      {mostrarImportador && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Importar clientes</h2>

            <label>Selecciona un proyecto:</label>
            <select
              value={proyectoOrigen}
              onChange={(e) => {
                setProyectoOrigen(e.target.value);
                cargarClientesOrigen(e.target.value);
              }}
            >
              <option value="">-- Elegir proyecto --</option>
              {proyectosDisponibles.map(p => (
                <option key={p.idProyecto} value={p.idProyecto}>{p.nombre}</option>
              ))}
            </select>

            <div className="cliente-lista-importar">
              {clientesOrigen.map(cliente => (
                <div key={cliente.idCliente}>
                  <label>
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(cliente.idCliente)}
                      onChange={() => {
                        setSeleccionados(prev =>
                          prev.includes(cliente.idCliente)
                            ? prev.filter(id => id !== cliente.idCliente)
                            : [...prev, cliente.idCliente]
                        );
                      }}
                    />
                    {cliente.nombre} - {cliente.email}
                  </label>
                </div>
              ))}
            </div>

            <div className="modal-acciones">
              <button
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  const user = JSON.parse(localStorage.getItem('user') || '{}');
                  const destino = parseInt(idProyecto || '');

                  for (const idClienteOrigen of seleccionados) {
                    await fetch('http://localhost:3001/api/gestion/clientes/duplicar', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({ idClienteOrigen, idProyectoDestino: destino })
                    });
                  }

                  await showSuccess('Importado', 'Clientes importados correctamente');
                  setMostrarImportador(false);
                  cargarClientes();
                }}
              >
                Importar seleccionados
              </button>
              <button onClick={() => setMostrarImportador(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}