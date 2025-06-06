import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { showSuccess, showConfirm } from '../components/alert';
import '../assets/styles/adminView.css';

interface DocumentoResumen {
  tipo: string;
  id: number;
  fecha: string;
  estado: string;
  cliente: string;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export default function AdminView() {
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState<DocumentoResumen[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [filtroEmail, setFiltroEmail] = useState('');
  const [filtroRol, setFiltroRol] = useState<'todos' | 'usuario' | 'baneado'>('todos');

  //Cargar usuarios
  const cargarUsuarios = () => {
    fetch('http://localhost:3001/api/auth/usuarios')
      .then(res => res.json())
      .then(data => setUsuarios(data))
      .catch(err => console.error('Error cargando usuarios:', err));
  };

  useEffect(() => {
    if (user?.rol === 'admin') {
      cargarUsuarios();
    }
  }, [user]);

  //Cargar documentos
  useEffect(() => {
    if (!selectedUserId) {
      setDocumentos([]);
      setSelectedUser(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`http://localhost:3001/api/documento/resumen/${selectedUserId}`)
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener documentos');
        return res.json();
      })
      .then(data => setDocumentos(data))
      .catch(err => {
        console.error(err);
        setError('No se pudo cargar el resumen de actividad.');
        setDocumentos([]);
      })
      .finally(() => {
        const usuario = usuarios.find(u => u.id === selectedUserId) || null;
        setSelectedUser(usuario);
        setLoading(false);
      });
  }, [selectedUserId, usuarios]);

  //Acciones admin
  const handleBan = async () => {
    await fetch(`http://localhost:3001/api/auth/admin/ban/${selectedUser?.id}`, {
      method: 'PUT',
    });
    showSuccess('Usuario baneado', 'El usuario ha sido baneado');
    cargarUsuarios();
    setSelectedUserId(null);
  };

  const handleUnban = async () => {
    await fetch('http://localhost:3001/api/auth/admin/unban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: selectedUser?.email })
    });
    showSuccess('Usuario desbaneado', 'El usuario ha sido desbaneado');
    cargarUsuarios();
    setSelectedUserId(null);
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar esta cuenta permanentemente?')) return;

    await fetch(`http://localhost:3001/api/admin/delete/${selectedUser?.id}`, {
      method: 'DELETE'
    });
    showConfirm('Usuario eliminado');
    cargarUsuarios();
    setSelectedUserId(null);
  };

  const usuariosFiltrados = usuarios
    .filter(u => ['usuario', 'baneado'].includes(u.rol))
    .filter(u =>
      u.email.toLowerCase().includes(filtroEmail.toLowerCase()) &&
      (filtroRol === 'todos' || u.rol === filtroRol)
    );

  return (
    <div className="resumen-container">
      <h2>Panel de Administración</h2>

      <div className="admin-filtros">
        <input
          type="text"
          placeholder="Buscar por email..."
          value={filtroEmail}
          onChange={(e) => setFiltroEmail(e.target.value)}
        />

        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value as any)}>
          <option value="todos">Todos</option>
          <option value="usuario">Usuarios</option>
          <option value="baneado">Baneados</option>
        </select>
      </div>

      <div className="admin-selector">
        <label style={{ color: 'white' }}>Selecciona un usuario:</label>
        <select
          value={selectedUserId ?? ''}
          onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">-- Elegir usuario --</option>
          {usuariosFiltrados.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre} ({u.email})
            </option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <div className="admin-controls">
          <button className="btn-ban" onClick={handleBan}>Banear</button>

          {selectedUser.rol === 'baneado' && (
            <button className="btn-unban" onClick={handleUnban}>Desbanear</button>
          )}

          <button className="btn-delete" onClick={handleDelete}>Eliminar cuenta</button>
        </div>
      )}

      {selectedUserId === null && (
        <p className="status-message status-warning">Usuario sin asignar.</p>
      )}
      {loading && <p className="status-message status-info">Cargando resumen...</p>}
      {error && <p className="status-message status-error">{error}</p>}
      {!loading && !error && selectedUserId !== null && documentos.length === 0 && (
        <p className="status-message status-info">Usuario sin datos todavía.</p>
      )}
      {!loading && documentos.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>ID</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Cliente</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((doc, i) => (
              <tr key={i}>
                <td>{doc.tipo}</td>
                <td>{doc.id}</td>
                <td>{doc.fecha?.split('T')[0]}</td>
                <td>{doc.estado}</td>
                <td>{doc.cliente}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}