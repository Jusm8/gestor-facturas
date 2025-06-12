import React, { useState } from 'react';
import { showError, showSuccess } from '../components/alert';
import '../assets/styles/ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [paso, setPaso] = useState<'email' | 'codigo' | 'cambio'>('email');

  const handleEnviarCodigo = async () => {
    const res = await fetch('http://localhost:3001/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) {
      showSuccess('Código enviado', 'Revisa tu correo.');
      setPaso('codigo');
    } else {
      showError('Error', data.error);
    }
  };

  const handleVerificarCodigo = async () => {
    const res = await fetch('http://localhost:3001/api/auth/verify-reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, codigo })
    });
    const data = await res.json();
    if (res.ok) {
      showSuccess('Código válido', 'Cambia tu contraseña.');
      setPaso('cambio');
    } else {
      showError('Error', data.error);
    }
  };

  const handleCambiarPassword = async () => {
    const res = await fetch('http://localhost:3001/api/auth/reset-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nuevoPassword })
    });
    const data = await res.json();
    if (res.ok) {
      showSuccess('Contraseña actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña.');
      window.location.href = '/login';
    } else {
      showError('Error', data.error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-info-panel">
        <img src="/SimplifacLogo.png" alt="Logo" className="login-logo" />
        <h2>¿Problemas para acceder?</h2>
        <p>Recupera tu cuenta en 3 simples pasos:</p>
        <ul>
          <li>Ingresa tu correo</li>
          <li>Verifica el código</li>
          <li>Establece una nueva contraseña segura</li>
        </ul>
      </div>

      <div className="login-card">
        <h2>Recuperar Contraseña</h2>
        {paso === 'email' && (
          <>
            <label>Correo:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button onClick={handleEnviarCodigo}>Enviar código</button>
          </>
        )}
        {paso === 'codigo' && (
          <>
            <label>Código recibido:</label>
            <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
            <button onClick={handleVerificarCodigo}>Verificar código</button>
          </>
        )}
        {paso === 'cambio' && (
          <>
            <label>Nueva contraseña:</label>
            <input
              type="password"
              value={nuevoPassword}
              onChange={(e) => setNuevoPassword(e.target.value)}
              required
            />
            <button onClick={handleCambiarPassword}>Cambiar contraseña</button>
          </>
        )}
      </div>
    </div>
  );
}
