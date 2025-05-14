import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/login.css';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../components/alert';

export default function Login() {
    const { setUser } = useAuth();

    const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '' });

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                showSuccess('Login exitoso');
                window.location.href = '/dashboard';
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
            <div className="login-card">
                <h2>LOGIN TO YOUR ACCOUNT</h2>
                <form onSubmit={handleSubmit}>
                    <label>Usuario:</label>
                    <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />

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
