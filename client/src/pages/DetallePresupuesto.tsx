import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../assets/styles/DetallePresupuesto.css';
import html2pdf from 'html2pdf.js';
import { useNavigate } from 'react-router-dom';

export default function DetallePresupuesto() {
  const { id } = useParams();
  const [presupuesto, setPresupuesto] = useState<any>(null);
  const navigate = useNavigate();

  const handleDownloadPDF = () => {
    const original = document.getElementById('presupuesto-pdf');
    if (!original) return;

    const clone = original.cloneNode(true) as HTMLElement;

    // Inyectar estilos directamente
    const style = document.createElement('style');
    style.textContent = `
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    h2 {
      color: #00a6e0;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .info-top {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      font-size: 1rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
      border-radius: 8px;
      overflow: hidden;
    }
    th {
      background-color: #00a6e0;
      color: white;
      padding: 12px;
      text-align: center;
      font-weight: 600;
    }
    td {
      padding: 10px;
      text-align: center;
      border: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .totales {
      margin-top: 1.5rem;
      text-align: right;
      font-size: 1.1rem;
      font-weight: bold;
    }
  `;
    clone.insertBefore(style, clone.firstChild);

    html2pdf().set({
      margin: 0.3,
      filename: `presupuesto_${id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).from(clone).save();
  };

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

  const totalCalculado = presupuesto.detalles?.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0) || 0;

  return (
    <div className="detalle-presupuesto">
      <div id="presupuesto-pdf">
        <h2>PRESUPUESTO</h2>

        <div className="info-top">
          <div>
            <p><strong>Cliente:</strong> {presupuesto.cliente_nombre}</p>
            <p><strong>Fecha:</strong> {new Date(presupuesto.fecha).toLocaleDateString()}</p>
          </div>
          <div>
            <p><strong>Forma de pago:</strong> {presupuesto.forma_pago}</p>
            <p><strong>Estado:</strong> {presupuesto.estado}</p>
          </div>
        </div>

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
                <td>{parseFloat(item.precio_unitario).toFixed(2)}€</td>
                <td>{(item.cantidad * item.precio_unitario).toFixed(2)}€</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totales">
          <p><strong>Total:</strong> {totalCalculado.toFixed(2)}€</p>
        </div>
      </div>
      <div className="no-pdf" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button onClick={handleDownloadPDF} className="btn-pdf">Descargar PDF</button>
        <button className="btn-volver" onClick={() => navigate(-1)}>← Volver</button>
      </div>
    </div>
  );
}