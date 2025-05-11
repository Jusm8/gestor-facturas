import React, { useState } from 'react';
import '../assets/styles/Profile.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    rol: user?.rol || '',
    imagen_url: user?.imagen_url || '',
    fecha_nacimiento: user?.fecha_nacimiento || '',
    sexo: user?.sexo || '',
    localidad: user?.localidad || ''
  });

  useEffect(() => {
    if (user) {
      setForm({
        nombre: user.nombre || '',
        email: user.email || '',
        rol: user.rol || '',
        imagen_url: user.imagen_url || '',
        fecha_nacimiento: user.fecha_nacimiento || '',
        sexo: user.sexo || '',
        localidad: user.localidad || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //Subir una foto de perfil
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm({ ...form, imagen_url: url });
    }
  };

  //Guardar cambios de los datos del perfil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    // Verifica si los datos han cambiado
    const hasChanged = Object.keys(form).some(
      key => form[key as keyof typeof form] !== userData[key]
    );

    if (!hasChanged) {
      alert('No hay cambios para guardar');
      setEditMode(false);
      return;
    }

    try {
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

    setEditMode(false);
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
      <form id="profile-form" className="profile-card" onSubmit={handleSubmit}>
        <div className="profile-img">
          {form.imagen_url ? (
            <img src={form.imagen_url} alt="Perfil" />
          ) : (
            <div className="placeholder-img">Sin imagen</div>
          )}
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
            name="localidad"
            value={form.localidad}
            onChange={handleChange}
            disabled={!editMode}
          />
        </div>
      </form>
      <div className="right-panel">
        <button
          className="edit-btn"
          type="button"
          onClick={() => {
            if (editMode) {
              document.getElementById('profile-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            } else {
              setEditMode(true);
            }
          }}
        >
          {editMode ? 'Guardar' : 'Editar'}
        </button>
      </div>
    </div>
  );

}
