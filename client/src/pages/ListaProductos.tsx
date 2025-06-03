import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showError, showSuccess, showConfirm } from '../components/alert';
import '../assets/styles/ListaProductos.css';

interface Producto {
  idProducto: number;
  nombre: string;
  tipo: string;
  precio: number;
  descripcion: string;
}

export default function ListaProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { idProyecto } = useParams();

  const cargarProductos = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const res = await fetch(`http://localhost:3001/api/gestion/productos/usuario/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('Productos cargados:', data);

      if (res.ok && Array.isArray(data)) {
        setProductos(data);
        setError(null);
      } else {
        console.error('Error del backend:', data?.error);
        setError(data?.error || 'Error al obtener productos');
        setProductos([]);
      }
    } catch (err) {
      console.error('Error de red:', err);
      setError('No se pudo conectar con el servidor');
      setProductos([]);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleEliminarProducto = async (idProducto: number) => {
    const token = localStorage.getItem('token');

    const confirmado = await showConfirm(
      '¿Estás seguro?',
      'Esta acción eliminará el producto de forma permanente'
    );

    if (!confirmado) return;

    try {
      const res = await fetch(`http://localhost:3001/api/gestion/productos/${idProducto}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setProductos(prev => prev.filter(p => p.idProducto !== idProducto));
        await showSuccess('Eliminado', 'Producto eliminado correctamente');
      } else {
        const error = await res.json();
        showError('Error', error?.message || 'No se pudo eliminar');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      showError('Error de red', 'No se pudo conectar con el servidor');
    }
  };

  return (
    <div className="productos-container">
      <div className="productos-header">
        <button
          className="btn-volver-dashboard"
          onClick={() => navigate(`/dashboard/${idProyecto}`)}
        >
          ← Volver al Menu
        </button>
        <h1 className="productos-titulo">Listado de Productos</h1>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="producto-buscador"
        />
        <button onClick={() => navigate('/productos/nuevo')}>+ Nuevo Producto</button>
      </div>

      {error && <p className="error-producto">{error}</p>}

      {productosFiltrados.length === 0 && !error ? (
        <p className="no-productos">No hay productos que coincidan.</p>
      ) : (
        <div className="producto-lista">
          {productosFiltrados.map((producto) => (
            <div key={producto.idProducto} className="producto-card">
              <h3>{producto.nombre}</h3>
              <p><strong>Tipo:</strong> {producto.tipo}</p>
              <p><strong>Precio:</strong> {producto.precio}€</p>
              <p><strong>Descripción:</strong> {producto.descripcion}</p>

              <div className="producto-acciones">
                <button className="btn-icon" title="Editar" onClick={() => navigate(`/productos/editar/${producto.idProducto}`)}>
                  ✏️
                </button>
                <button className="btn-icon" title="Eliminar" onClick={() => handleEliminarProducto(producto.idProducto)}>
                  🗑️
                </button>
              </div>
            </div>

          ))}
        </div>
      )}
    </div>
  );
}