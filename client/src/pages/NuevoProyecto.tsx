import React, { useState, useEffect } from 'react';
import '../assets/styles/Proyectos.css';
import { useNavigate, useParams } from 'react-router-dom';
import { showError, showSuccess } from '../components/alert';

export default function NuevoProyecto() {
  const navigate = useNavigate();
  const { id } = useParams();
  const modoEdicion = Boolean(id);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: '',
  });

  useEffect(() => {
    if (!modoEdicion) return;

    const token = localStorage.getItem('token');
    fetch(`http://localhost:3001/api/auth/proyectos/${id}/editar`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setForm({
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          fecha_inicio: data.fecha_inicio?.split('T')[0] || '',
          fecha_fin: data.fecha_fin?.split('T')[0] || '',
          estado: data.estado || '',
        });
      })
      .catch(err => {
        console.error(err);
        showError('Error al cargar el proyecto');
      });
  }, [id, modoEdicion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const payload = { ...form, Usuario_idUsuario: user.id };
    const url = modoEdicion
      ? `http://localhost:3001/api/auth/proyectos/${id}`
      : `http://localhost:3001/api/auth/proyecto`;

    const method = modoEdicion ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess(
          modoEdicion ? 'Proyecto actualizado' : 'Proyecto creado con éxito',
          modoEdicion
            ? 'El proyecto se ha actualizado correctamente'
            : 'El proyecto se ha creado correctamente'
        );
        navigate('/proyectos');
      } else {
        showError(data.error || 'Error al guardar el proyecto');
      }
    } catch (error) {
      console.error(error);
      showError('Error de conexión');
    }
  };

  return (
    <div className="proyectos-container">
      <h2>{modoEdicion ? 'Editar Proyecto' : 'Crear Proyecto'}</h2>
      <form className="proyecto-form" onSubmit={handleSubmit}>
        <label>Nombre:</label>
        <input name="nombre" value={form.nombre} onChange={handleChange} required />

        <label>Descripción:</label>
        <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={4} />

        <label>Fecha de inicio:</label>
        <input type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} />

        <label>Fecha de fin:</label>
        <input type="date" name="fecha_fin" value={form.fecha_fin} onChange={handleChange} />

        <label>Estado:</label>
        <input name="estado" value={form.estado} onChange={handleChange} />

        <button type="submit">{modoEdicion ? 'Actualizar Proyecto' : 'Guardar Proyecto'}</button>
      </form>
    </div>
  );
}
