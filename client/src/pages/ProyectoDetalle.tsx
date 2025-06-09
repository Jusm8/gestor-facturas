import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../assets/styles/ProyectoDetalle.css';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError, showConfirm } from '../components/alert';

export default function ProyectoDetalle() {
    const { id, idProyecto } = useParams();
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

    const [filtros, setFiltros] = useState({ cliente: '', fecha: '', tipo: '' });

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

    const aplicarFiltros = () => {
        const lowerCliente = filtros.cliente.toLowerCase();
        const tipo = filtros.tipo;
        const fechaFiltro = filtros.fecha.trim();

        const filtrarLista = (lista: any[], tipoDoc: string) =>
            lista.filter(item => {
                const clienteCoincide = !lowerCliente || item.cliente.toLowerCase().includes(lowerCliente);

                const fechaObj = new Date(item.fecha);
                const fechaDocStr = `${fechaObj.getFullYear()}-${(fechaObj.getMonth() + 1).toString().padStart(2, '0')}-${fechaObj.getDate().toString().padStart(2, '0')}`;

                const fechaCoincide = !fechaFiltro || fechaDocStr.includes(fechaFiltro);
                const tipoCoincide = !tipo || tipo === tipoDoc;

                return clienteCoincide && fechaCoincide && tipoCoincide;
            });

        return {
            presupuestos: filtrarLista(presupuestos, 'presupuesto'),
            facturas: filtrarLista(facturas, 'factura'),
        };
    };

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
                //Recarga la página o vuelve a cargar los datos
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

    const { presupuestos: presupuestosFiltrados, facturas: facturasFiltradas } = aplicarFiltros();

    function agruparPorId<T extends { idFactura: number }>(facturas: T[]): T[] {
        const mapa = new Map<number, T>();
        facturas.forEach(f => {
            if (!mapa.has(f.idFactura)) {
                mapa.set(f.idFactura, f);
            }
        });
        return Array.from(mapa.values());
    }

    const facturasSinDuplicados = agruparPorId(facturasFiltradas);

    const documentosFiltrados = [
        ...presupuestosFiltrados.map(p => ({ ...p, tipo: 'presupuesto' })),
        ...facturasSinDuplicados.map(f => ({ ...f, tipo: 'factura' }))
    ];

    return (
        <div className="detalle-container">
            <button className="btn-volver" onClick={() => navigate(`/dashboard/${id}`)} style={{ marginBottom: '1rem' }}>
                ← Volver al Menú
            </button>
            <h2 style={{ color: '#204080', fontWeight: '700', fontSize: '1.8rem', textAlign: 'center' }}>
                Listado de Facturas y Presupuestos
            </h2>

            <div className="filtros-container" style={{ justifyContent: 'flex-start' }}>
                <input
                    type="text"
                    placeholder="Filtrar por cliente"
                    value={filtros.cliente}
                    onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
                />
                <input
                    type="date"
                    title="Filtrar por fecha"
                    value={filtros.fecha}
                    onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })}
                    className="filtro-fecha"
                />
                <select
                    value={filtros.tipo}
                    onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                >
                    <option value="">Todos</option>
                    <option value="presupuesto">Presupuesto</option>
                    <option value="factura">Factura</option>
                </select>
                <button
                    className="btn-limpiar"
                    onClick={() => setFiltros({ cliente: '', fecha: '', tipo: '' })}
                >
                    Limpiar filtros
                </button>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                <button
                    className="crear-btn"
                    onClick={() => navigate(`/proyectos/${id}/crear?tipo=presupuesto&proyecto=${id}`)}
                >
                    + Nuevo Documento
                </button>
            </div>
            {loading ? (
                <p>Cargando...</p>
            ) : documentosFiltrados.length == 0 ? (
                <p className="empty">Sin coincidencias.</p>
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
                        {documentosFiltrados.map((doc, idx) => (
                            <tr key={`${doc.tipo}-${doc.idPresupuesto || doc.idFactura}-${idx}`}>
                                <td>{doc.cliente}</td>
                                <td>{new Date(doc.fecha).toLocaleDateString('es-ES')}</td>
                                <td>{doc.tipo === 'factura' ? 'Factura' : 'Presupuesto'}</td>
                                <td className="descripcion-celda" title={doc.descripcion}>
                                    {doc.descripcion && doc.descripcion.length > 60
                                        ? `${doc.descripcion.slice(0, 60)}...`
                                        : (doc.descripcion || 'N/A')}
                                </td>
                                <td>
                                    <button onClick={() => navigate(`/${doc.tipo}/${doc.tipo === 'factura' ? doc.idFactura : doc.idPresupuesto}/detalle`)}>👁</button>
                                </td>
                                <td className='acciones-celda'>
                                    <button title="Editar" onClick={() => navigate(`/documento/${doc.tipo}/editar/${doc.idFactura || doc.idPresupuesto}`)}>✏️</button>
                                    <button title="Eliminar" onClick={() => handleEliminar(doc.tipo, doc.idFactura || doc.idPresupuesto)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
