import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showSuccess, showError } from '../components/alert';

interface Props {
  tipo: 'presupuesto' | 'factura';
  idProyecto?: string;
}

export default function FormularioDocumento({ tipo, idProyecto }: Props) {
  const navigate = useNavigate();
  const { id } = useParams();
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

    //Cargar clientes
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

    fetchClientes();

    //Cargar datos si se está editando
    if (modoEdicion && id) {
      fetch(`http://localhost:3001/api/documento/${tipo}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setFormulario({
            fecha: data.fecha || '',
            fecha_validez: data.fecha_validez || '',
            total: data.total?.toString() || '',
            estado: data.estado || 'pendiente',
            cliente: data.Cliente_idCliente?.toString() || '',
            proyecto: data.Proyecto_idProyecto?.toString() || idProyecto || '',
            forma_pago: data.forma_pago || '',
            iva: data.iva?.toString() || '',
            retencion: data.retencion?.toString() || '',
            detalles: data.detalles || [{ cantidad: '', descripcion: '', precio_unitario: '', producto: '' }]
          });
        })
        .catch(err => console.error("Error al cargar datos:", err));
    } else if (idProyecto) {
      setFormulario(prev => ({ ...prev, proyecto: idProyecto }));
    }
  }, [id, tipo, idProyecto, modoEdicion]);

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
      const res = await fetch(`http://localhost:3001/api/documento/${tipo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        await showSuccess('Éxito', `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} creado correctamente`);
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
      <h3>{tipo === 'presupuesto' ? 'Nuevo Presupuesto' : 'Nueva Factura'}</h3>

      <label>Fecha:</label>
      <input type="date" name="fecha" value={formulario.fecha} onChange={handleChange} required />

      <label>Forma de pago:</label>
      <input name="forma_pago" value={formulario.forma_pago} onChange={handleChange} required />

      {tipo === 'presupuesto' && (
        <>
          <label>Validez del presupuesto hasta:</label>
          <input type="date" name="fecha_validez" value={formulario.fecha_validez} onChange={handleChange} />
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

      <label>Total:</label>
      <input type="number" name="total" value={formulario.total} onChange={handleChange} required />

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
        <div key={i}>
          <input
            placeholder="Descripción"
            value={detalle.descripcion}
            onChange={(e) => handleDetalleChange(i, 'descripcion', e.target.value)}
          />
          <input
            type="number"
            placeholder="Cantidad"
            value={detalle.cantidad}
            onChange={(e) => handleDetalleChange(i, 'cantidad', parseInt(e.target.value))}
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
      ))}
      <div className="button-group">
        <button type="button" onClick={agregarProducto}>+ Añadir Producto</button>
        <button type="submit">Guardar</button>
      </div>
    </form>
  );
}
