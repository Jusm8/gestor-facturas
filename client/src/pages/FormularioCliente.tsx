import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showError, showSuccess } from '../components/alert';
import '../assets/styles/FormularioCliente.css';
export default function FormularioCliente() {
    const navigate = useNavigate();
    const { id } = useParams();

    const esEdicion = Boolean(id);
    const [formulario, setFormulario] = useState({
        nombre: '',
        email: '',
        nif: '',
        direccion: '',
        telefono: ''
    });

    useEffect(() => {
        if (esEdicion) {
            const cargarCliente = async () => {
                const token = localStorage.getItem('token');
                try {
                    const res = await fetch(`http://localhost:3001/api/gestion/clientes/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (res.ok) {
                        const limpio = {
                            nombre: data.nombre || '',
                            email: data.email || '',
                            nif: data.nif || '',
                            direccion: data.direccion || '',
                            telefono: data.telefono || ''
                        };
                        setFormulario(limpio);
                    }
                } catch (error) {
                    console.error('Error al cargar cliente', error);
                }
            };
            cargarCliente();
        }
    }, [esEdicion, id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormulario({ ...formulario, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        try {
            const res = await fetch(`http://localhost:3001/api/gestion/clientes${esEdicion ? '/' + id : ''}`, {
                method: esEdicion ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...formulario, Usuario_idUsuario: user.id })
            });

            const data = await res.json();

            if (res.ok) {
                await showSuccess(
                    esEdicion ? 'Cliente actualizado' : 'Cliente creado',
                    esEdicion ? 'Los datos del cliente fueron actualizados' : 'Cliente creado correctamente'
                );
                navigate('/ListaClientes');
            } else {
                console.error('Error del backend:', data);
                showError('Error', data?.error || 'No se pudo guardar el cliente');
            }
        } catch (err) {
            console.error(err);
            showError('Error de red', 'No se pudo conectar con el servidor');
        }
    };

    const handleCancelar = () => {
        navigate('/ListaClientes');
    };

    return (
        <form onSubmit={handleSubmit} className="cliente-form">
            <h2>{esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <input type="text" name="nombre" placeholder="Nombre" value={formulario.nombre} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" value={formulario.email} onChange={handleChange} />
            <input type="text" name="nif" placeholder="NIF" value={formulario.nif} onChange={handleChange} />
            <input type="text" name="telefono" placeholder="Teléfono" value={formulario.telefono} onChange={handleChange} />
            <input type="text" name="direccion" placeholder="Dirección" value={formulario.direccion} onChange={handleChange} />
            <div className="form-buttons">
                <button type="submit">{esEdicion ? 'Actualizar' : 'Crear'}</button>
                <button type="button" onClick={handleCancelar} className="cancelar-btn">Cancelar</button>
            </div>
        </form>
    );
}
