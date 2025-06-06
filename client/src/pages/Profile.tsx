import React, { useState } from 'react';
import '../assets/styles/Profile.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { showSuccess, showError } from '../components/alert';

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [imagenFile, setImagenFile] = useState<File | null>(null);

  const [deletePassword, setDeletePassword] = useState('');

  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

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
        fecha_nacimiento: user.fecha_nacimiento
          ? new Date(user.fecha_nacimiento).toISOString().split('T')[0]
          : '',
        sexo: user.sexo || '',
        localidad: user.localidad || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        nombre: user.nombre || '',
        email: user.email || '',
        rol: user.rol || '',
        imagen_url: user.imagen_url || '',
        fecha_nacimiento: user.fecha_nacimiento
          ? new Date(user.fecha_nacimiento).toISOString().split('T')[0]
          : '',
        sexo: user.sexo || '',
        localidad: user.localidad || ''
      });
      setImagenFile(null);
      setEditMode(false);
    }
  };

  //Subir una foto de perfil
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagenFile(file);
      setForm({ ...form, imagen_url: url });
    }
  };

  //Guardar cambios de los datos del perfil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    const formFields = ['nombre', 'email', 'fecha_nacimiento', 'sexo', 'localidad'];
    const hasChanged = formFields.some(field => form[field as keyof typeof form] !== userData[field])
      || imagenFile !== null;

    if (!hasChanged) {
      showError('No hay cambios para guardar');
      setEditMode(false);
      return;
    }

    const formData = new FormData();
    formData.append('idUsuario', userData.id);
    formData.append('nombre', form.nombre);
    formData.append('email', form.email);
    formData.append('fecha_nacimiento', form.fecha_nacimiento);
    formData.append('sexo', form.sexo);
    formData.append('localidad', form.localidad);

    if (imagenFile) {
      formData.append('imagen', imagenFile);
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/update', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('Perfil actualizado', 'Tu información se ha guardado con éxito');
        const updatedUser = data.user;

        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        setForm(prev => ({
          ...prev,
          imagen_url: updatedUser.imagen_url
        }));

      } else {
        showError(data.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error(error);
      showError('Error de conexión');
    }

    setEditMode(false);
  };

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      showError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Las nuevas contraseñas no coinciden');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess('Contraseña actualizada', 'Tu contraseña se ha cambiado con éxito');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showError(data.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('No se pudo conectar con el servidor');
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('token');

    if (!deletePassword) {
      showError('Introduce tu contraseña para confirmar');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: deletePassword })
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess('Cuenta eliminada', 'Tu cuenta y datos han sido eliminados');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      } else {
        showError(data.error || 'Error al eliminar la cuenta');
      }
    } catch (err) {
      console.error(err);
      showError('Error al conectar con el servidor');
    }
  };

  return (
    <div className="profile-wrapper">
      {/*Panel izquierdo para cambiar contraseña y borrar cuenta*/}
      <div className="left-panel">
        <h3>Cambiar contraseña</h3>
        <form onSubmit={handleChangePassword} className="password-form">
          <label>Contraseña actual:</label>
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />

          <label>Nueva contraseña:</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />

          <label>Confirmar nueva contraseña:</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

          <button type="submit">Actualizar contraseña</button>
        </form>

        <div className="delete-account-section">
          <h4>Eliminar cuenta</h4>

          {!confirmDeleteVisible ? (
            <button className="delete-btn" onClick={() => setConfirmDeleteVisible(true)}>
              Eliminar cuenta
            </button>
          ) : (
            <>
              <p>
                Introduce tu contraseña para confirmar la eliminación de tu cuenta.
                <br />
                <strong>Esta acción es irreversible.</strong>
              </p>
              <input
                type="password"
                placeholder="Contraseña actual"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              <button className="delete-btn" onClick={handleDeleteAccount}>
                Confirmar eliminación
              </button>
            </>
          )}
        </div>
      </div>

      {/*Panel derecho para editar perfil */}
      <form id="profile-form" className="profile-card" onSubmit={handleSubmit}>
        <div className="profile-img">
          {form.imagen_url ? (
            <img src={
              form.imagen_url.startsWith('/uploads/')
                ? `http://localhost:3001${form.imagen_url}`
                : form.imagen_url
            } alt="Perfil" />
          ) : (
            <div className="placeholder-img">Sin imagen</div>
          )}
          {editMode && (
            <div className="custom-file-upload">
              <label htmlFor="imagen">Seleccionar imagen</label>
              <input
                id="imagen"
                type="file"
                name="imagen"
                onChange={handleImageUpload}
              />
            </div>
          )}
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
            max={new Date().toISOString().split("T")[0]}
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
        {editMode && (
          <button
            className="cancel-btn"
            type="button"
            onClick={handleCancel}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );

}
