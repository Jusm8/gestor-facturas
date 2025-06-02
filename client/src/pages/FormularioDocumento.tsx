import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { showSuccess, showError } from '../components/alert';
import '../assets/styles/FormularioDocumento.css';

function toYYYYMMDD(dateStr: string) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  const parsedDate = new Date(dateStr);
  if (isNaN(parsedDate.getTime())) return '';

  return parsedDate.toISOString().split('T')[0];
}

export default function FormularioDocumento() {
  const { tipo, id } = useParams<{ tipo?: 'presupuesto' | 'factura'; id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const proyectoId = searchParams.get('proyecto') || '';

  const [documentoTipo, setDocumentoTipo] = useState<'presupuesto' | 'factura'>(tipo || 'presupuesto');
  const modoEdicion = !!id;

  const [clientes, setClientes] = useState<any[]>([]);
  const [formulario, setFormulario] = useState<any>({
    fecha: '',
    fecha_validez: '',
    total: '',
    estado: 'pendiente',
    cliente: '',
    proyecto: proyectoId,
    forma_pago: '',
    iva: '21',
    retencion: '0',
    detalles: [{ cantidad: '', descripcion: '', precio_unitario: '', producto: '' }]
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    fetch(`http://localhost:3001/api/auth/clientes/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setClientes)
      .catch(console.error);

    if (modoEdicion && tipo && id) {
      fetch(`http://localhost:3001/api/documento/${tipo}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setDocumentoTipo(tipo);
          setFormulario({
            fecha: data.fecha || '',
            fecha_validez: data.fecha_validez || '',
            total: data.total ? Number(data.total).toFixed(2) : '',
            estado: data.estado || 'pendiente',
            cliente: data.Cliente_idCliente?.toString() || '',
            proyecto: data.Proyecto_idProyecto?.toString() || proyectoId,
            forma_pago: data.forma_pago || '',
            iva: data.iva?.toString() || '',
            retencion: data.retencion?.toString() || '',
            detalles: data.detalles?.map((d: any) => ({
              cantidad: d.cantidad,
              descripcion: d.descripcion || '',
              precio_unitario: d.precio_unitario,
              producto: d.Producto_idProducto?.toString() || ''
            })) || [{ cantidad: '', descripcion: '', precio_unitario: '', producto: '' }]
          });
        })
        .catch(console.error);
    }
  }, [tipo, id, proyectoId, modoEdicion]);

  useEffect(() => {
    const base = formulario.detalles.reduce((acc: number, d: any) =>
      acc + (parseFloat(d.cantidad || 0) * parseFloat(d.precio_unitario || 0)), 0);
    const iva = documentoTipo === 'factura' ? (parseFloat(formulario.iva || '0') / 100) : 0;
    const ret = documentoTipo === 'factura' ? (parseFloat(formulario.retencion || '0') / 100) : 0;
    const total = base + base * iva - base * ret;

    setFormulario((f: any) => ({ ...f, total: total.toFixed(2) }));
  }, [formulario.detalles, formulario.iva, formulario.retencion, documentoTipo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleDetalleChange = (index: number, field: string, value: any) => {
    const nuevos = [...formulario.detalles];
    nuevos[index][field] = value;
    setFormulario({ ...formulario, detalles: nuevos });
  };

  const handleTipoSeleccion = (tipoSel: 'presupuesto' | 'factura') => {
    setDocumentoTipo(tipoSel);
    setFormulario(prev => ({
      ...prev,
      iva: tipoSel === 'factura' ? '21' : '',
      retencion: tipoSel === 'factura' ? '0' : '',
      fecha_validez: tipoSel === 'presupuesto' ? prev.fecha_validez : ''
    }));
  };

  const agregarProducto = () => {
    setFormulario(prev => ({
      ...prev,
      detalles: [...prev.detalles, { cantidad: '', descripcion: '', precio_unitario: '', producto: '' }]
    }));
  };

  const eliminarProducto = (index: number) => {
    if (formulario.detalles.length <= 1) return;
    const nuevos = formulario.detalles.filter((_, i) => i !== index);
    setFormulario({ ...formulario, detalles: nuevos });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    //Validacionespara evitar errores
    if (!formulario.cliente) {
      showError('Error', 'Debes seleccionar un cliente.');
      return;
    }

    if (!formulario.proyecto) {
      showError('Error', 'No se ha definido el proyecto. Asegúrate de acceder desde un proyecto.');
      return;
    }

    if (!formulario.detalles || formulario.detalles.length === 0) {
      showError('Error', 'Agrega al menos un producto al detalle.');
      return;
    }

    const detallesValidos = formulario.detalles.every((d: any) =>
      d.descripcion && d.cantidad && d.precio_unitario && d.producto
    );

    if (!detallesValidos) {
      showError('Error', 'Completa todos los campos de los productos antes de guardar.');
      return;
    }

    const payload: any = {
      fecha: formulario.fecha,
      forma_pago: formulario.forma_pago,
      estado: formulario.estado,
      Usuario_idUsuario: user.id,
      Cliente_idCliente: parseInt(formulario.cliente),
      Proyecto_idProyecto: parseInt(formulario.proyecto),
      detalles: formulario.detalles.map((d: any) => ({
        cantidad: parseFloat(d.cantidad),
        descripcion: d.descripcion,
        precio_unitario: parseFloat(d.precio_unitario),
        Producto_idProducto: parseInt(d.producto)
      }))
    };

    if (documentoTipo === 'factura') {
      payload.iva = parseFloat(formulario.iva);
      payload.retencion = parseFloat(formulario.retencion);
    }

    if (documentoTipo === 'presupuesto') {
      payload.fecha_validez = formulario.fecha_validez;
    }

    const url = modoEdicion
      ? `http://localhost:3001/api/documento/${documentoTipo}/${id}`
      : `http://localhost:3001/api/documento/${documentoTipo}`;

    try {
      const res = await fetch(url, {
        method: modoEdicion ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        await showSuccess('Éxito', `Documento ${modoEdicion ? 'actualizado' : 'creado'} correctamente`);
        navigate(`/proyectos/${formulario.proyecto}`);
      } else {
        console.error('Respuesta con error del backend:', data);
        showError('Error', data.error || 'Error en la operación');
      }
    } catch (err) {
      console.error('Error de red:', err);
      showError('Error', 'No se pudo conectar con el servidor');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {!modoEdicion && (
        <div className="slider-toggle">
          <button
            type="button"
            className={documentoTipo === 'presupuesto' ? 'active' : ''}
            onClick={() => handleTipoSeleccion('presupuesto')}
          >
            Presupuesto
          </button>
          <button
            type="button"
            className={documentoTipo === 'factura' ? 'active' : ''}
            onClick={() => handleTipoSeleccion('factura')}
          >
            Factura
          </button>
        </div>
      )}

      <h3>{modoEdicion ? `Editar ${documentoTipo}` : `Nuevo ${documentoTipo}`}</h3>

      <label>Fecha:</label>
      <input
        type="date"
        name="fecha"
        value={/^\d{4}-\d{2}-\d{2}$/.test(formulario.fecha) ? formulario.fecha : ''}
        onChange={handleChange}
        required
      />

      <label>Forma de pago:</label>
      <input name="forma_pago" value={formulario.forma_pago} onChange={handleChange} required />

      {documentoTipo === 'presupuesto' && (
        <>
          <label>Validez hasta:</label>
          <input type="date" name="fecha_validez" value={toYYYYMMDD(formulario.fecha_validez)} onChange={handleChange} />
        </>
      )}

      {documentoTipo === 'factura' && (
        <>
          <label>IVA (%):</label>
          <input type="number" name="iva" value={formulario.iva} onChange={handleChange} />
          <label>Retención (%):</label>
          <input type="number" name="retencion" value={formulario.retencion} onChange={handleChange} />
        </>
      )}

      <label>Estado:</label>
      <select name="estado" value={formulario.estado} onChange={handleChange}>
        <option value="pendiente">Pendiente</option>
        <option value="pagado">Pagado</option>
      </select>

      <label>Cliente:</label>
      <select name="cliente" value={formulario.cliente} onChange={handleChange}>
        <option value="">Seleccione un cliente</option>
        {clientes.map(c => (
          <option key={c.idCliente} value={c.idCliente}>{c.nombre}</option>
        ))}
      </select>

      <h4>Detalles</h4>
      {formulario.detalles.map((d: any, i: number) => (
        <div key={i} className="detalle-item">
          <div className="detalle-inputs">
            <input placeholder="Descripción" value={d.descripcion} onChange={e => handleDetalleChange(i, 'descripcion', e.target.value)} />
            <input type="number" placeholder="Cantidad" value={d.cantidad} onChange={e => handleDetalleChange(i, 'cantidad', e.target.value)} />
            <input type="number" placeholder="Precio" value={d.precio_unitario} onChange={e => handleDetalleChange(i, 'precio_unitario', e.target.value)} />
            <input placeholder="ID Producto" value={d.producto} onChange={e => handleDetalleChange(i, 'producto', e.target.value)} />
          </div>
          {formulario.detalles.length > 1 && (
            <button type="button" className="btn-eliminar" onClick={() => eliminarProducto(i)}>🗑️</button>
          )}
        </div>
      ))}

      <label>Total:</label>
      <input type="number" value={formulario.total} readOnly />

      <div className="button-group">
        <button type="button" onClick={agregarProducto}>+ Añadir Producto</button>
        <button type="submit">Guardar</button>
        <button type="button" onClick={() => navigate(`/proyectos/${proyectoId || formulario.proyecto}`)}>Cancelar</button>
      </div>
    </form>
  );
}