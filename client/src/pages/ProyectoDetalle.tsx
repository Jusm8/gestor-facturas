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
    //Función para descargar el PDF
    const handleDescargarDocumento = async (tipo: 'factura' | 'presupuesto', idDoc: number) => {
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`http://localhost:3001/api/documento/${tipo}/${idDoc}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            const container = document.createElement('div');
            container.style.padding = '2rem';
            container.style.fontFamily = 'Arial, sans-serif';

            const isFactura = tipo === 'factura';

            const baseImponible = data.detalles.reduce((acc: number, d: any) => acc + d.cantidad * d.precio_unitario, 0);
            const iva = isFactura ? baseImponible * (parseFloat(data.iva) / 100) : 0;
            const retencion = isFactura ? baseImponible * (parseFloat(data.retencion) / 100) : 0;
            const totalFinal = baseImponible + iva - retencion;

            container.innerHTML = `
                <h2 style="color: #00a6e0; text-align: center;">SIMPLIFAC</h2>
                <h3 style="text-align: center;">${tipo.toUpperCase()}</h3>

                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                    <div>
                        <p><strong>Cliente:</strong> ${data.cliente_nombre}</p>
                            ${isFactura ? `<p><strong>CIF/NIF:</strong> ${data.cliente_nif || ''}</p>` : ''}
                    </div>
                    <div>
                        ${isFactura ? `<p><strong>Número de factura:</strong> ${data.idFactura || '-'}</p>` : ''}
                        <p><strong>Fecha:</strong> ${new Date(data.fecha).toLocaleDateString()}</p>
                    </div>
                </div>

                <table border="1" cellspacing="0" cellpadding="8" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead style="background: #00a6e0; color: white;">
                        <tr>
                            <th>${isFactura ? 'Concepto' : 'Descripción'}</th>
                            <th>${isFactura ? 'Cantidad x Base' : 'Cantidad'}</th>
                            <th>Total</th>
                            ${isFactura ? '<th>I.V.A</th>' : ''}
                        </tr>
                    </thead>
                <tbody>
                    ${data.detalles.map((d: any) => `
                        <tr>
                            <td>${d.descripcion}</td>
                            <td>${isFactura ? `${d.cantidad} x ${parseFloat(d.precio_unitario).toFixed(2)}€` : d.cantidad}</td>
                            <td>${(d.cantidad * d.precio_unitario).toFixed(2)}€</td>
                            ${isFactura ? `<td>${data.iva || 0}%</td>` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="text-align: right; margin-top: 1rem; font-size: 13px;">
                ${isFactura ? `
                    <p><strong>Base imponible:</strong> ${baseImponible.toFixed(2)}€</p>
                    <p><strong>I.V.A:</strong> ${iva.toFixed(2)}€</p>
                    <p><strong>Retención:</strong> -${retencion.toFixed(2)}€</p>
                ` : ''}
                    <p style="font-size: 16px; font-weight: bold; margin-top: 0.5rem;">
                        TOTAL: <span style="color: #0077cc">${totalFinal.toFixed(2)}€</span>
                    </p>
            </div>
            `;

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

    const { presupuestos: presupuestosFiltrados, facturas: facturasFiltradas } = aplicarFiltros();
    const documentosFiltrados = [
        ...presupuestosFiltrados.map(p => ({ ...p, tipo: 'presupuesto' })),
        ...facturasFiltradas.map(f => ({ ...f, tipo: 'factura' }))
    ];

    return (
        <div className="detalle-container">
            <button className="btn-volver" onClick={() => navigate('/proyectos')} style={{ marginBottom: '1rem' }}>
                ← Volver a Proyectos
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
                                <td>{doc.descripcion || 'N/A'}</td>
                                <td>
                                    <button onClick={() => navigate(`/${doc.tipo}/${doc.tipo === 'factura' ? doc.idFactura : doc.idPresupuesto}/detalle`)}>👁</button>
                                </td>
                                <td>
                                    <button onClick={() => navigate(`/documento/${doc.tipo}/editar/${doc.idFactura || doc.idPresupuesto}`)}>✏️</button>
                                    <button onClick={() => handleEliminar(doc.tipo, doc.idFactura || doc.idPresupuesto)}>🗑️</button>
                                    <button onClick={() => handleDescargarDocumento(doc.tipo, doc.idFactura || doc.idPresupuesto)}>⬇️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
