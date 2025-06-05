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

  const [productosDisponibles, setProductosDisponibles] = useState<any[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<{ [id: number]: number }>({});

  const [enviando, setEnviando] = useState(false);

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
    let mounted = true;
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    fetch(`http://localhost:3001/api/gestion/productos/usuario/${user.id}/proyecto/${proyectoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (mounted) setProductosDisponibles(data);
      })
      .catch(console.error);

    fetch(`http://localhost:3001/api/auth/clientes/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (mounted) setClientes(data);
      })
      .catch(console.error);

    if (modoEdicion && tipo && id) {
      fetch(`http://localhost:3001/api/documento/${tipo}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (!mounted) return;
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

    return () => {
      mounted = false;
    };
  }, [tipo, id, proyectoId, modoEdicion]);

  useEffect(() => {
    const base = Object.entries(productosSeleccionados).reduce((acc, [id, cantidad]) => {
      const prod = productosDisponibles.find(p => p.idProducto === parseInt(id));
      return prod ? acc + prod.precio * cantidad : acc;
    }, 0);

    const iva = documentoTipo === 'factura' ? (parseFloat(formulario.iva || '0') / 100) : 0;
    const ret = documentoTipo === 'factura' ? (parseFloat(formulario.retencion || '0') / 100) : 0;
    const total = base + base * iva - base * ret;

    setFormulario(f => ({ ...f, total: total.toFixed(2) }));
  }, [productosSeleccionados, formulario.iva, formulario.retencion]);

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
    e.stopPropagation();
    if (enviando) return;
    setEnviando(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const detallesList = Object.entries(productosSeleccionados).map(([id, cantidad]) => {
      const producto = productosDisponibles.find(p => p.idProducto === parseInt(id));
      return {
        cantidad,
        descripcion: producto.descripcion,
        precio_unitario: producto.precio,
        Producto_idProducto: producto.idProducto
      };
    });

    if (detallesList.length === 0) {
      showError('Error', 'Selecciona al menos un producto para continuar.');
      setEnviando(false);
      return;
    }

    const payload: any = {
      fecha: formulario.fecha,
      forma_pago: formulario.forma_pago,
      estado: formulario.estado,
      total: parseFloat(formulario.total),
      Usuario_idUsuario: user.id,
      Cliente_idCliente: parseInt(formulario.cliente),
      Proyecto_idProyecto: parseInt(formulario.proyecto),
      detalles: detallesList
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
    } finally {
      setEnviando(false);
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
        {clientes.map((c) => (
          <option key={c.idCliente} value={c.idCliente.toString()}>
            {c.nombre}
          </option>
        ))}
      </select>

      <h4>Productos</h4>
      <table className="tabla-productos">
        <thead>
          <tr>
            <th>Seleccionar</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Nombre</th>
          </tr>
        </thead>
        <tbody>
          {productosDisponibles.map(prod => (
            <tr key={prod.idProducto}>
              <td>
                <input
                  type="checkbox"
                  checked={prod.idProducto in productosSeleccionados}
                  onChange={e => {
                    const checked = e.target.checked;
                    setProductosSeleccionados(prev => {
                      const nuevo = { ...prev };
                      if (checked) nuevo[prod.idProducto] = 1;
                      else delete nuevo[prod.idProducto];
                      return nuevo;
                    });
                  }}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="1"
                  disabled={!(prod.idProducto in productosSeleccionados)}
                  value={productosSeleccionados[prod.idProducto] || ''}
                  onChange={e => {
                    const cantidad = parseInt(e.target.value) || 1;
                    setProductosSeleccionados(prev => ({ ...prev, [prod.idProducto]: cantidad }));
                  }}
                />
              </td>
              <td>{prod.precio}€</td>
              <td>{prod.nombre}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <label>Total:</label>
      <input type="number" value={formulario.total} readOnly />

      <div className="button-group">
        <button type="submit" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={() => navigate(`/proyectos/${proyectoId || formulario.proyecto}`)}>Cancelar</button>
      </div>
    </form >
  );
}