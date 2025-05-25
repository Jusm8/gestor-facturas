import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../assets/styles/ProyectoDetalle.css';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError, showConfirm } from '../components/alert';

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
                                    <button aria-label="Editar presupuesto" onClick={() => navigate(`/documento/presupuesto/editar/${p.idPresupuesto}`)}>✏️</button>
                                    <button aria-label="Eliminar presupuesto" onClick={() => handleEliminar('presupuesto', p.idPresupuesto)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                        {facturas.map((f, i) => (
                            <tr key={`factura-${f.idFactura}-${f.fecha}-${i}`}>
                                <td>{f.cliente}</td>
                                <td>{new Date(f.fecha).toLocaleDateString('es-ES')}</td>
                                <td>Factura</td>
                                <td>{f.descripcion || 'N/A'}</td>
                                <td>👁</td>
                                <td>
                                    <button onClick={() => navigate(`/documento/factura/editar/${f.idFactura}`)}>✏️</button>
                                    <button onClick={() => handleEliminar('factura', f.idFactura)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
