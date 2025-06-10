import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/login.css';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../components/alert';

export default function Login() {
    const { setUser } = useAuth();

    const [form, setForm] = useState({ email: '', password: '', confirm: '' });

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.user.rol === 'baneado') {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setUser(data.user);
                    return window.location.href = '/baneado';
                }
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                showSuccess('Logeo okey', "Login exitoso").then(() => {
                    window.location.href = '/proyectos';
                });
            } else {
                showError(data.error || 'Error en el login');
            }
        } catch (error) {
            console.error(error);
            showError('Error al iniciar sesión');
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
                <h2>LOGIN TO YOUR ACCOUNT</h2>
                <form onSubmit={handleSubmit}>
                    <label>Email:</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required />

                    <label>Password:</label>
                    <input type="password" name="password" value={form.password} onChange={handleChange} required />

                    <button type="submit">LOGIN</button>
                </form>
                <p>¿No tiene una cuenta? <Link to="/register">Cree una</Link></p>
            </div>
        </div>


    );
}
