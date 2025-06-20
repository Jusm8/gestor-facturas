import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/styles/login.css';
import { showError, showSuccess } from '../components/alert';

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '' });
  const [verificationCode, setVerificationCode] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      showError('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          rol: 'usuario'
        })
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('Código enviado', 'Revisa tu correo y escribe el código de verificación');
        setStep('verify');
      } else {
        showError(data?.error || 'Error al iniciar el registro');
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      showError('Error de conexión con el servidor');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          code: verificationCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('Registro completado', 'Ya puedes iniciar sesión');

        //Redirigir al login
        navigate('/login');
      } else {
        showError(data?.error || 'Código incorrecto');
      }
    } catch (error) {
      console.error('Error al verificar código:', error);
      showError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="login-container">
      <div className="login-info-panel">
        <img src="/SimplifacLogo.png" alt="Logo" className="login-logo" />
        <h2>Bienvenido a SimpliFac</h2>
        <p>Gestiona tus facturas y presupuestos de forma sencilla y eficiente.</p>
        <ul>
          <li>Controle su negocio, creando facturas y presupuestos en un abrir y cerrar de ojos.</li>
          <li>Añade a sus clientes y sus productos para crear de forma rapida y clara su propia factura.</li>
          <li>Previsualize su factura y presupuestos para ver como quedara antes de descargarlo.</li>
        </ul>
      </div>
      <div className="login-card">
        {step === 'form' ? (
          <>
            <h2>CREA TU CUENTA</h2>
            <form onSubmit={handleStartRegister}>
              <label>Usuario:</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />

              <label>Email:</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />

              <label>Password:</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required />

              <label>Confirmar Password:</label>
              <input type="password" name="confirm" value={form.confirm} onChange={handleChange} required />

              <button type="submit">ENVIAR CÓDIGO</button>
            </form>
            <p>¿Tiene ya una cuenta? <Link to="/login">LOGIN</Link></p>
          </>
        ) : (
          <>
            <h2>VERIFICAR CÓDIGO</h2>
            <form onSubmit={handleVerifyCode}>
              <label>Código de verificación (enviado a {form.email}):</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
              <button type="submit">VERIFICAR</button>
            </form>
            <p>¿No es tu email? <button onClick={() => setStep('form')} style={{ background: 'none', color: 'blue', border: 'none', cursor: 'pointer' }}>Volver</button></p>
          </>
        )}
      </div>
    </div>
  );
}
