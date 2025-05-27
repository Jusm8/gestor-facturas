import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showSuccess, showError } from '../components/alert';
import '../assets/styles/FormularioDocumento.css';

function toYYYYMMDD(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

export default function FormularioDocumento() {

  const { id, tipo } = useParams<{ id?: string; tipo?: 'presupuesto' | 'factura' }>();
  const { id: rawProyectoId } = useParams();
  const idProyecto = !tipo ? rawProyectoId : undefined;

  const navigate = useNavigate();
  const modoEdicion = !!id;

  const [formulario, setFormulario] = useState({
    fecha: '',
    fecha_validez: '',
    total: '',
    estado: 'pendiente',
    cliente: '',
    proyecto: '',
    forma_pago: '',
    iva: tipo === 'factura' ? '21' : '',
    retencion: tipo === 'factura' ? '0' : '',
    detalles: [{ cantidad: '', descripcion: '', precio_unitario: '', producto: '' }]
  });

  const [clientes, setClientes] = useState<{ idCliente: number, nombre: string, nif: string, email: string }[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchClientes = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/auth/clientes/${userData.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setClientes(data);
      } catch (err) {
        console.error("Error al conectar con el servidor", err);
      }
    };

    const fetchDocumento = async () => {
      if (!modoEdicion || !id) return;

      try {
        const res = await fetch(`http://localhost:3001/api/documento/${tipo}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
          setFormulario({
            fecha: data.fecha || '',
            fecha_validez: data.fecha_validez || '',
            total: (data.total ?? data.detalles?.reduce(
              (acc: number, d: any) => acc + (d.cantidad * d.precio_unitario), 0
            )).toFixed(2),
            estado: data.estado || 'pendiente',
            cliente: data.Cliente_idCliente?.toString() || '',
            proyecto: data.Proyecto_idProyecto?.toString() || idProyecto || '',
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
        }
      } catch (error) {
        console.error("Error al cargar documento:", error);
      }
    };

    fetchClientes();
    fetchDocumento();

    if (!modoEdicion && idProyecto) {
      setFormulario(prev => ({ ...prev, proyecto: idProyecto }));
    }

  }, [id, tipo, idProyecto, modoEdicion]);

  useEffect(() => {
    const baseImponible = formulario.detalles.reduce((acc, item) => {
      const cantidad = parseFloat(item.cantidad) || 0;
      const precio = parseFloat(item.precio_unitario) || 0;
      return acc + cantidad * precio;
    }, 0);

    const iva = tipo === 'factura' ? (parseFloat(formulario.iva || '0') / 100) : 0;
    const retencion = tipo === 'factura' ? (parseFloat(formulario.retencion || '0') / 100) : 0;

    const totalCalculado = baseImponible + (baseImponible * iva) - (baseImponible * retencion);

    setFormulario(prev => ({
      ...prev,
      total: totalCalculado.toFixed(2)
    }));
  }, [formulario.detalles, formulario.iva, formulario.retencion, tipo]);

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
      detalles: [...formulario.detalles, { cantidad: '', descripcion: '', precio_unitario: '', producto: '' }]
    });
  };

  const eliminarProducto = (index: number) => {
    //No borrar si hay menos de 1 producto
    if (formulario.detalles.length <= 1) return;
    const nuevosDetalles = formulario.detalles.filter((_, i) => i !== index);
    setFormulario({ ...formulario, detalles: nuevosDetalles });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    const Proyecto_idProyecto = formulario.proyecto || idProyecto;

    if (!Proyecto_idProyecto) {
      showError('Error', 'Falta el proyecto. No se puede enviar el formulario.');
      return;
    }

    const payload: any = {
      fecha: formulario.fecha,
      forma_pago: formulario.forma_pago,
      estado: formulario.estado,
      Usuario_idUsuario: userData.id,
      Cliente_idCliente: parseInt(formulario.cliente),
      Proyecto_idProyecto: parseInt(Proyecto_idProyecto),
      detalles: formulario.detalles.map(d => ({
        cantidad: d.cantidad,
        descripcion: d.descripcion,
        precio_unitario: d.precio_unitario,
        Producto_idProducto: parseInt(d.producto)
      }))
    };

    if (tipo === 'presupuesto') {
      payload.fecha_validez = formulario.fecha_validez;
    }

    if (tipo === 'factura') {
      payload.iva = parseFloat(formulario.iva);
      payload.retencion = parseFloat(formulario.retencion);
    }

    try {
      const method = modoEdicion ? 'PUT' : 'POST';
      const url = modoEdicion
        ? `http://localhost:3001/api/documento/${tipo}/${id}`
        : `http://localhost:3001/api/documento/${tipo}`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        await showSuccess('Éxito', `${tipo === 'factura' ? 'Factura' : 'Presupuesto'} creado correctamente`);
        navigate(`/proyectos/${formulario.proyecto}`);
      } else {
        showError('Error', result.error || `Error al crear ${tipo}`);
      }

    } catch (err) {
      console.error(err);
      showError('Error', 'Error de conexión con el servidor');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>
        {modoEdicion
          ? tipo === 'presupuesto' ? 'Editar Presupuesto' : 'Editar Factura'
          : tipo === 'presupuesto' ? 'Nuevo Presupuesto' : 'Nueva Factura'}
      </h3>

      <label>Fecha:</label>
      <input type="date" name="fecha" value={toYYYYMMDD(formulario.fecha)} onChange={handleChange} required />

      <label>Forma de pago:</label>
      <input name="forma_pago" value={formulario.forma_pago} onChange={handleChange} required />

      {tipo === 'presupuesto' && (
        <>
          <label>Validez del presupuesto hasta:</label>
          <input type="date" name="fecha_validez" value={toYYYYMMDD(formulario.fecha_validez)} onChange={handleChange} />
        </>
      )}

      {tipo === 'factura' && (
        <>
          <label>IVA (%):</label>
          <input type="number" name="iva" value={formulario.iva} onChange={handleChange} placeholder="21" />

          <label>Retención IRPF (%):</label>
          <input type="number" name="retencion" value={formulario.retencion} onChange={handleChange} placeholder="0" />
        </>
      )}

      <label>Estado:</label>
      <select name="estado" value={formulario.estado} onChange={handleChange}>
        <option value="pendiente">Pendiente</option>
        <option value="pagado">Pagado</option>
      </select>

      <label>Cliente:</label>
      <select name="cliente" value={formulario.cliente} onChange={handleChange} required>
        <option value="">Seleccione un cliente</option>
        {clientes.map(cliente => (
          <option key={cliente.idCliente} value={cliente.idCliente}>
            {cliente.nombre} - {cliente.nif} ({cliente.email})
          </option>
        ))}
      </select>

      <h4>Detalles:</h4>
      {formulario.detalles.map((detalle, i) => (
        <div key={i} className="detalle-item">
          <div className="detalle-inputs">

            <input
              placeholder="Descripción"
              value={detalle.descripcion}
              onChange={(e) => handleDetalleChange(i, 'descripcion', e.target.value)}
            />
            <input
              type="number"
              placeholder="Cantidad"
              value={detalle.cantidad}
              onChange={(e) => handleDetalleChange(i, 'cantidad', parseFloat(e.target.value))}
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

          {formulario.detalles.length > 1 && (
            <button type="button" className='btn-eliminar' onClick={() => eliminarProducto(i)}> 🗑️ </button>
          )}
        </div>
      ))}

      <label>Total:</label>
      <input type="number" name="total" value={formulario.total} readOnly />

      <div className="button-group">
        <button type="button" onClick={agregarProducto}>+ Añadir Producto</button>
        <button type="submit">Guardar</button>
        <button type="button" onClick={() => navigate(`/proyectos/${formulario.proyecto}`)}> Cancelar </button>

      </div>
    </form>
  );
}