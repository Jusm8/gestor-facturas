import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../assets/styles/DetallePresupuesto.css';

export default function DetallePresupuesto() {
  const { id } = useParams();
  const [presupuesto, setPresupuesto] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3001/api/documento/presupuesto/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPresupuesto(data))
      .catch(err => console.error('Error cargando presupuesto', err));
  }, [id]);

  if (!presupuesto) return <p>Cargando presupuesto...</p>;

  return (
    <div className="detalle-proforma">
      <h2>Presupuesto PROFORMA</h2>
      <p><strong>Cliente:</strong> {presupuesto.cliente_nombre}</p>
      <p><strong>Fecha:</strong> {new Date(presupuesto.fecha).toLocaleDateString()}</p>
      <p><strong>Forma de pago:</strong> {presupuesto.forma_pago}</p>

      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Precio unitario</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {presupuesto.detalles.map((item, idx) => (
            <tr key={idx}>
              <td>{item.descripcion}</td>
              <td>{item.cantidad}</td>
              <td>{item.precio_unitario}€</td>
              <td>{(item.cantidad * item.precio_unitario).toFixed(2)}€</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totales">
        <p><strong>Total:</strong> {presupuesto.total}€</p>
      </div>
    </div>
  );
}
