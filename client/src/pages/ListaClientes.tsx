import React, { useEffect, useState } from 'react';

const ListaClientes = () => {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3001/api/clientes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setClientes(data))
      .catch(err => console.error('Error al cargar clientes:', err));
  }, []);

  return (
    <div className="clientes-container">
      <h2 className="clientes-titulo">Listado de Clientes</h2>
      <table className="clientes-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>NIF</th>
            <th>Dirección</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente: any) => (
            <tr key={cliente.idCliente} className="cliente-fila">
              <td>{cliente.nombre}</td>
              <td>{cliente.email}</td>
              <td>{cliente.telefono}</td>
              <td>{cliente.nif}</td>
              <td>{cliente.direccion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaClientes;
