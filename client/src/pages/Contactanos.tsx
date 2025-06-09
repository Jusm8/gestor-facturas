import React, { useState } from 'react';
import '../assets/styles/contacto.css';

export default function Contactanos() {
    const [form, setForm] = useState({
        nombre: '',
        email: '',
        mensaje: ''
    });

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/api/auth/contacto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                alert('Mensaje enviado. Te responderemos pronto.');
                setForm({ nombre: '', email: '', mensaje: '' });
            } else {
                alert('Error al enviar el mensaje. Inténtalo más tarde.');
            }
        } catch {
            alert('Error de conexión con el servidor.');
        }
    };

    return (
        <div className="contacto-container">
            <h2>Contáctanos</h2>
            <p>¿Tienes dudas o sugerencias? ¡Escríbenos!</p>
            <form onSubmit={handleSubmit} className="contacto-form">
                <label>Nombre:</label>
                <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                />

                <label>Email:</label>
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <label>Mensaje:</label>
                <textarea
                    name="mensaje"
                    value={form.mensaje}
                    onChange={handleChange}
                    required
                />

                <button type="submit">Enviar</button>
            </form>
        </div>
    );
}
