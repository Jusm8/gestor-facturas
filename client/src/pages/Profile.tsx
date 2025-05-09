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
    imagen: user?.imagen_url || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm({ ...form, imagen: url });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditMode(false);
    console.log('Datos guardados:', form);
    // Aquí irá la petición al backend
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
          {/* Campos de usuario */}
          <label>Nombre:</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} disabled={!editMode} />

          <label>Email:</label>
          <input name="email" value={form.email} onChange={handleChange} disabled={!editMode} />

          <label>Rol:</label>
          <input value={form.rol} disabled />

          <label>Puesto de trabajo:</label>
          <input name="puesto" value={form.puesto} onChange={handleChange} disabled={!editMode} />

          <label>Departamento:</label>
          <input name="departamento" value={form.departamento} onChange={handleChange} disabled={!editMode} />

          <label>Organización:</label>
          <input name="organizacion" value={form.organizacion} onChange={handleChange} disabled={!editMode} />

          <label>Ubicación:</label>
          <input name="ubicacion" value={form.ubicacion} onChange={handleChange} disabled={!editMode} />

          <label>Hora local:</label>
          <input name="hora" value={form.hora} onChange={handleChange} disabled={!editMode} />
        </div>
      </form>

      <div className="right-panel">
        <button className='edit-btn' type={editMode ? 'submit' : 'button'} onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Guardar' : 'Editar'}
        </button>
        <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
}
