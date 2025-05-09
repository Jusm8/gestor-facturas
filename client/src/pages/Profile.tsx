import React, { useState } from 'react';
import '../assets/styles/Profile.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
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
    // Petición al backend
  };

  //Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // limpio el contexto
    setUser(null); 
    navigate('/login');
  };

  return (
    <div className="profile-container">
      <h2>Mi Perfil</h2>
      <div className="profile-card">
        <div className="profile-image">
          <img src={form.imagen || '/default-profile.png'} alt="Perfil" />
          {editMode && <input type="file" onChange={handleImageUpload} />}
        </div>

        <form onSubmit={handleSubmit}>
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            disabled={!editMode}
          />

          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={!editMode}
          />

          <label>Rol:</label>
          <input type="text" value={user?.rol} disabled />

          {editMode ? (
            <button type="submit">Guardar</button>
          ) : (
            <button type="button" onClick={() => setEditMode(true)}>
              Editar
            </button>
          )}
        </form>
      </div>
      <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
}
