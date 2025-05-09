import React, { useState } from 'react';
import '../assets/styles/Profile.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    rol: user?.rol || '',
    puesto: user?.puesto || '',
    departamento: user?.departamento || '',
    organizacion: user?.organizacion || '',
    ubicacion: user?.ubicacion || '',
    hora: user?.hora || '',
    imagen: user?.imagen_url || '',
    fecha_nacimiento: user?.fecha_nacimiento || '',
    sexo: user?.sexo || '',
    localidad: user?.localidad || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //Subir una foto de perfil
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm({ ...form, imagen: url });
    }
  };

  //Guardar cambios de los datos del perfil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditMode(false);

    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch('http://localhost:3001/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          idUsuario: userData.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Perfil actualizado correctamente');
        localStorage.setItem('user', JSON.stringify({ ...userData, ...form }));
        setUser({ ...userData, ...form });
      } else {
        alert(data.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="profile-wrapper">
      <div className="left-panel">
        <h3>Espacio para futuras funcionalidades</h3>
      </div>

      <form className="profile-card" onSubmit={handleSubmit}>
        <div className="profile-img">
          <img src={form.imagen || '/default-profile.png'} alt="Perfil" />
          {editMode && <input type="file" onChange={handleImageUpload} />}
        </div>

        <div className="profile-info">
          <label>Nombre:</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            disabled={!editMode}
          />

          <label>Email:</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={!editMode}
          />

          <label>Rol:</label>
          <input value={form.rol} disabled />

          <label>Fecha de nacimiento:</label>
          <input
            type="date"
            name="fecha_nacimiento"
            value={form.fecha_nacimiento}
            onChange={handleChange}
            disabled={!editMode}
          />

          <label>Sexo:</label>
          <input
            name="sexo"
            value={form.sexo}
            onChange={handleChange}
            disabled={!editMode}
          />

          <label>Localidad:</label>
          <input
            name="Localidad"
            value={form.localidad}
            onChange={handleChange}
            disabled={!editMode}
          />
        </div>
      </form>

      <div className="right-panel">
        <button
          className="edit-btn"
          type={editMode ? 'submit' : 'button'}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Guardar' : 'Editar'}
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );

}
