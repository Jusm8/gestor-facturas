import React, { useState } from 'react';

export default function BannedPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/ban-appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          mensaje: message
        })
      });

      if (res.ok) {
        setStatus('sent');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(to right, #4a148c, #880e4f)',
      color: 'white',
      padding: '4rem',
      minHeight: '100vh',
      textAlign: 'center'
    }}>
      <h1>Tu cuenta ha sido bloqueada</h1>
      <p>Has sido restringido por posible uso indebido de la plataforma.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        <textarea
          required
          placeholder="Escribe una explicación o motivo por el cual deberías ser reconsiderado..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: '80%', height: '250px', padding: '1rem', fontSize: '1rem', resize: 'none' }}
        />

        <br />
        <button type="submit" style={{ marginTop: '1rem', padding: '0.7rem 2rem', fontWeight: 'bold', backgroundColor: '#e91e63', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Enviar Apelación
        </button>

        {status === 'sent' && <p style={{ color: '#66bb6a', marginTop: '1rem' }}>¡Tu mensaje ha sido enviado!</p>}
        {status === 'error' && <p style={{ color: '#ff5252', marginTop: '1rem' }}>Hubo un problema. Inténtalo más tarde.</p>}
      </form>
    </div>
  );
}
