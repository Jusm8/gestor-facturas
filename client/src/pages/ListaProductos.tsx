import React, { useEffect, useState } from 'react';

const ListaProductos = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3001/api/productos', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error('Error al cargar productos:', err));
  }, []);

  return (
    <div className="productos-container">
      <h2 className="productos-titulo">Listado de Productos</h2>
      <table className="productos-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Precio</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto: any) => (
            <tr key={producto.idProducto} className="producto-fila">
              <td>{producto.nombre}</td>
              <td>{producto.tipo}</td>
              <td>{producto.precio} €</td>
              <td>{producto.descripcion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaProductos;