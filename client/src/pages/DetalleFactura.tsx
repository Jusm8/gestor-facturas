import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../assets/styles/DetalleFactura.css';
import html2pdf from 'html2pdf.js';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

export default function DetalleFactura() {
    const { id } = useParams();
    const [factura, setFactura] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${import.meta.env.VITE_API_URL}/api/documento/factura/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setFactura(data))
            .catch(err => console.error('Error cargando factura', err));
    }, [id]);

    if (!factura) return <p>Cargando factura...</p>;

    const baseImponible = factura.detalles?.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0) || 0;
    const iva = (factura.iva || 0) / 100;
    const retencion = (factura.retencion || 0) / 100;

    const totalIVA = baseImponible * iva;
    const totalRetencion = baseImponible * retencion;
    const totalFinal = baseImponible + totalIVA - totalRetencion;

    //Función para descargar el PDF
    const handleDownloadPDF = () => {
        const element = document.getElementById('factura-pdf');
        if (!element) return;

        const options = {
            margin: 0.1,
            filename: `factura_${id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(element).save();
    };

    return (
        <div className="factura-detalle">
            <div id="factura-pdf">
                <header>
                    <div className="cabecera-presupuesto">
                        <h1 className="titulo">SIMPLIFAC</h1>
                        <h2 className="subtitulo">FACTURA</h2>
                    </div>

                    <div className="factura-info">
                        <p><strong>Número de factura:</strong> {factura.idFactura}</p>
                        <p><strong>Fecha:</strong> {new Date(factura.fecha).toLocaleDateString()}</p>
                    </div>
                </header>

                <section className="cliente-info">
                    <h3>Cliente</h3>
                    <p><strong>Nombre:</strong> {factura.cliente_nombre}</p>
                    <p><strong>CIF/NIF:</strong> {factura.nif || '—'}</p>
                </section>

                <table>
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th>Cantidad x Base</th>
                            <th>Total</th>
                            <th>I.V.A</th>
                        </tr>
                    </thead>
                    <tbody>
                        {factura.detalles.map((item, i) => (
                            <tr key={i}>
                                <td>{item.descripcion || 'Producto sin descripción'}</td>
                                <td>{item.cantidad} x {parseFloat(item.precio_unitario).toFixed(2)}€</td>
                                <td>{(item.cantidad * item.precio_unitario).toFixed(2)}€</td>
                                <td>{factura.iva}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <section className="totales">
                    <p><strong>Base imponible:</strong> {baseImponible.toFixed(2)}€</p>
                    <p><strong>I.V.A:</strong> {totalIVA.toFixed(2)}€</p>
                    <p><strong>Retención:</strong> -{totalRetencion.toFixed(2)}€</p>
                    <p className="total-final"><strong>TOTAL:</strong> {totalFinal.toFixed(2)}€</p>
                </section>
            </div>
            <div className="no-pdf" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button onClick={handleDownloadPDF} className="btn-pdf">📄 Descargar PDF</button>
                <button onClick={() => navigate(-1)} className="btn-volver">← Volver</button>
            </div>
        </div>
    );
}
