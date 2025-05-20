import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../assets/styles/ProyectoDetalle.css';

export default function ProyectoDetalle() {
    const { id } = useParams();
    
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

    return (
        <div className="detalle-container">
            <h2>Listado de Facturas y Presupuestos</h2>

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
                            <th>Detalles</th>
                        </tr>
                    </thead>
                    <tbody>
                        {presupuestos.map(p => (
                            <tr key={`p-${p.idPresupuesto}`}>
                                <td>{p.cliente}</td>
                                <td>{new Date(p.fecha).toLocaleDateString('es-ES')}</td>
                                <td>Presupuesto</td>
                                <td>{p.descripcion || 'N/A'}</td>
                                <td>👁</td>
                            </tr>
                        ))}
                        {facturas.map(f => (
                            <tr key={`f-${f.idFactura}`}>
                                <td>{f.cliente}</td>
                                <td>{new Date(f.fecha).toLocaleDateString('es-ES')}</td>
                                <td>Factura</td>
                                <td>{f.descripcion || 'N/A'}</td>
                                <td>👁</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
