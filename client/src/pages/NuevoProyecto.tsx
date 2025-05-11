import React, { useState } from 'react';
import '../assets/styles/Proyectos.css';
import { useNavigate } from 'react-router-dom';

export default function NuevoProyecto() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const response = await fetch('http://localhost:3001/api/auth/proyecto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, Usuario_idUsuario: user.id })
      });

      if (response.ok) {
        alert('Proyecto creado con éxito');
        navigate('/proyectos');
      } else {
        const data = await response.json();
        alert(data.error || 'Error al crear el proyecto');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  return (
    <div className="proyectos-container">
      <h2>Crear Proyecto</h2>
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

        <button type="submit">Guardar Proyecto</button>
      </form>
    </div>
  );
}