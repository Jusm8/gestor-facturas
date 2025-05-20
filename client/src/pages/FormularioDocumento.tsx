import React, { useState } from 'react';

interface Props {
  tipo: 'presupuesto' | 'factura';
}

export default function FormularioDocumento({ tipo }: Props) {
  const [formulario, setFormulario] = useState({
    fecha: '',
    total: '',
    estado: 'pendiente',
    cliente: '',
    proyecto: '',
    detalles: [{ cantidad: 1, precio_unitario: 0, producto: '' }]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleDetalleChange = (index: number, field: string, value: any) => {
    const nuevosDetalles = [...formulario.detalles];
    nuevosDetalles[index][field] = value;
    setFormulario({ ...formulario, detalles: nuevosDetalles });
  };

  const agregarProducto = () => {
    setFormulario({
      ...formulario,
      detalles: [...formulario.detalles, { cantidad: 1, precio_unitario: 0, producto: '' }]
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    const payload = {
      fecha: formulario.fecha,
      total: parseFloat(formulario.total),
      estado: formulario.estado,
      Usuario_idUsuario: userData.id,
      Cliente_idCliente: parseInt(formulario.cliente),
      Proyecto_idProyecto: parseInt(formulario.proyecto),
      detalles: formulario.detalles.map(d => ({
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        Producto_idProducto: parseInt(d.producto)
      }))
    };

    try {
      const res = await fetch(`http://localhost:3001/api/documento/${tipo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        alert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} creado correctamente`);
      } else {
        alert(result.error || `Error al crear ${tipo}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <h3>{tipo === 'presupuesto' ? 'Nuevo Presupuesto' : 'Nueva Factura'}</h3>

      <label>Fecha:</label>
      <input type="date" name="fecha" value={formulario.fecha} onChange={handleChange} required />

      <label>Total:</label>
      <input type="number" name="total" value={formulario.total} onChange={handleChange} required />

      <label>Estado:</label>
      <select name="estado" value={formulario.estado} onChange={handleChange}>
        <option value="pendiente">Pendiente</option>
        <option value="pagado">Pagado</option>
      </select>

      <label>Cliente ID:</label>
      <input name="cliente" value={formulario.cliente} onChange={handleChange} required />

      <label>Proyecto ID:</label>
      <input name="proyecto" value={formulario.proyecto} onChange={handleChange} required />

      <h4>Detalles:</h4>
      {formulario.detalles.map((detalle, i) => (
        <div key={i}>
          <input
            type="number"
            placeholder="Cantidad"
            value={detalle.cantidad}
            onChange={(e) => handleDetalleChange(i, 'cantidad', parseInt(e.target.value))}
          />
          <input
            type="number"
            placeholder="Precio unitario"
            value={detalle.precio_unitario}
            onChange={(e) => handleDetalleChange(i, 'precio_unitario', parseFloat(e.target.value))}
          />
          <input
            placeholder="ID Producto"
            value={detalle.producto}
            onChange={(e) => handleDetalleChange(i, 'producto', e.target.value)}
          />
        </div>
      ))}
      <button type="button" onClick={agregarProducto}>+ Añadir Producto</button>

      <button type="submit">Guardar {tipo}</button>
    </form>
  );
}
