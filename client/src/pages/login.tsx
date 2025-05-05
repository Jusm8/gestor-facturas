import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './auth.css';

export default function Login() {
    const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '' });

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();
        // Aquí irá la petición al backend
        console.log(form);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
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
