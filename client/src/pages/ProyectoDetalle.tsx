import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../assets/styles/ProyectoDetalle.css';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError, showConfirm } from '../components/alert';
import html2pdf from 'html2pdf.js';

export default function ProyectoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    interface Presupuesto {
        idPresupuesto: number;
        cliente: string;
        fecha: string;
        descripcion?: string;
    }

    interface Factura {
        idFactura: number;
        cliente: string;
        fecha: string;
        descripcion?: string;
    }

    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [facturas, setFacturas] = useState<Factura[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');

        const fetchData = async () => {
            try {
                const [presupuestoRes, facturaRes] = await Promise.all([
                    fetch(`http://localhost:3001/api/documento/presupuestos/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`http://localhost:3001/api/documento/facturas/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                const presupuestosData = await presupuestoRes.json();
                const facturasData = await facturaRes.json();

                if (presupuestoRes.ok) setPresupuestos(presupuestosData);
                if (facturaRes.ok) setFacturas(facturasData);
            } catch (err) {
                console.error('Error al cargar datos del proyecto:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleEliminar = async (tipo: 'factura' | 'presupuesto', id: number) => {
        const token = localStorage.getItem('token');
        const confirm = await showConfirm(`¿Eliminar ${tipo}?`, 'Esta acción no se puede deshacer');
        if (!confirm) return;

        try {
            const res = await fetch(`http://localhost:3001/api/documento/${tipo}/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                await showSuccess('Eliminado', `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} eliminado correctamente`);
                // Recarga la página o vuelve a cargar datos
                window.location.reload();
            } else {
                const data = await res.json();
                showError('Error', data.error || 'Error al eliminar');
            }
        } catch (error) {
            console.error(error);
            showError('Error', 'Error al conectar con el servidor');
        }

    };
    const handleDescargarDocumento = async (tipo: 'factura' | 'presupuesto', idDoc: number) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/api/documento/${tipo}/${idDoc}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();

            const container = document.createElement('div');
            container.style.padding = '2rem';
            container.style.fontFamily = 'Arial, sans-serif';
            container.innerHTML = `
            <h2 style="color: #0073e6; text-align: center;">SIMPLIFAC</h2>
            <h3 style="text-align: center;">${tipo.toUpperCase()}</h3>
            <p><strong>Cliente:</strong> ${data.cliente_nombre || ''}</p>
            <p><strong>Fecha:</strong> ${new Date(data.fecha).toLocaleDateString()}</p>
            <hr />
            <table border="1" cellspacing="0" cellpadding="8" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead style="background: #0077cc; color: white;">
                    <tr>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Precio unitario</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.detalles.map((d: any) => `
                        <tr>
                            <td>${d.descripcion || '-'}</td>
                            <td>${d.cantidad}</td>
                            <td>${parseFloat(d.precio_unitario).toFixed(2)}€</td>
                            <td>${(d.cantidad * d.precio_unitario).toFixed(2)}€</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p style="text-align: right; margin-top: 1rem;"><strong>Total:</strong> ${parseFloat(data.total || 0).toFixed(2)}€</p> `;
            html2pdf().set({
                margin: 0.5,
                filename: `${tipo}_${idDoc}.pdf`,
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            }).from(container).save();

        } catch (error) {
            console.error('Error generando PDF:', error);
            showError('Error', 'No se pudo generar el PDF');
        }
    };

    return (
        <div className="detalle-container">
            <button className="btn-volver" onClick={() => navigate('/proyectos')} style={{ marginBottom: '1rem' }}>
                ← Volver a Proyectos
            </button>

            <h2>Listado de Facturas y Presupuestos</h2>
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                <button
                    className="crear-btn"
                    onClick={() => navigate(`/proyectos/${id}/crear`)}
                >
                    + Nuevo Documento
                </button>
            </div>
            {loading ? (
                <p>Cargando...</p>
            ) : presupuestos.length === 0 && facturas.length === 0 ? (
                <p className="empty">Sin presupuestos o facturas.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Descripción</th>
                            <th>Ver</th>
                            <th>Aciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {presupuestos.map((p, i) => (
                            <tr key={`presupuesto-${p.idPresupuesto}-${p.fecha}-${i}`}>
                                <td>{p.cliente}</td>
                                <td>{new Date(p.fecha).toLocaleDateString('es-ES')}</td>
                                <td>Presupuesto</td>
                                <td>{p.descripcion || 'N/A'}</td>
                                <td>
                                    <button onClick={() => navigate(`/presupuesto/${p.idPresupuesto}/detalle`)}>👁</button>
                                </td>
                                <td>
                                    <button onClick={() => navigate(`/documento/presupuesto/editar/${p.idPresupuesto}`)}>✏️</button>
                                    <button onClick={() => handleEliminar('presupuesto', p.idPresupuesto)}>🗑️</button>
                                    <button onClick={() => handleDescargarDocumento('presupuesto', p.idPresupuesto)}>⬇️</button>
                                </td>

                            </tr>
                        ))}
                        {facturas.map((f, i) => (
                            <tr key={`factura-${f.idFactura}-${f.fecha}-${i}`}>
                                <td>{f.cliente}</td>
                                <td>{new Date(f.fecha).toLocaleDateString('es-ES')}</td>
                                <td>Factura</td>
                                <td>{f.descripcion || 'N/A'}</td>
                                <td>
                                    <button onClick={() => navigate(`/factura/${f.idFactura}`)}>👁</button>
                                </td>
                                <td>
                                    <button onClick={() => navigate(`/documento/factura/editar/${f.idFactura}`)}>✏️</button>
                                    <button onClick={() => handleEliminar('factura', f.idFactura)}>🗑️</button>
                                    <button onClick={() => handleDescargarDocumento('factura', f.idFactura)}>⬇️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
