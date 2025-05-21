import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/styles/login.css';
import { showError, showSuccess } from '../components/alert';

export default function Register() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '' });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      showError('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          rol: 'usuario',
        }),
      });

      if (response.status === 409) {
        showError('Este email ya está registrado. Prueba con otro.');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        showSuccess('Registro exitoso', 'Ya puedes iniciar sesión');
        //Redirigir al login
        navigate('/login');
      } else {
        showError(data?.error || 'Error al registrar');
      }
    } catch (error) {
      showError('Error de conexión con el servidor');
      console.error('Error en el registro:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>CREA TU CUENTA</h2>
        <form onSubmit={handleSubmit}>
          <label>Usuario:</label>
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />

          <label>Email:</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />

          <label>Password:</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required />

          <label>Confirmar Password:</label>
          <input type="password" name="confirm" value={form.confirm} onChange={handleChange} required />

          <button type="submit">REGISTRARSE</button>
        </form>
        <p>¿Tiene ya una cuenta? <Link to="/login">LOGIN</Link></p>
      </div>
    </div>
  );
}
