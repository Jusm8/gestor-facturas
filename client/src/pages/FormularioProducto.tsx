import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showSuccess, showError } from '../components/alert';
import '../assets/styles/FormularioProducto.css';

export default function FormularioProducto() {
    const navigate = useNavigate();
    const { id } = useParams();
    const esEdicion = Boolean(id);

    const [formulario, setFormulario] = useState({
        nombre: '',
        tipo: '',
        precio: '',
        descripcion: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (esEdicion && id) {
            const cargarProducto = async () => {
                try {
                    const res = await fetch(`http://localhost:3001/api/gestion/productos/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const data = await res.json();
                    if (res.ok) {
                        setFormulario({
                            nombre: data.nombre || '',
                            tipo: data.tipo || '',
                            precio: data.precio || '',
                            descripcion: data.descripcion || ''
                        });
                    } else {
                        console.error('Error al cargar producto:', data.error);
                    }
                } catch (error) {
                    console.error('Error de red al cargar producto:', error);
                }
            };

            cargarProducto();
        }
    }, [esEdicion, id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormulario({ ...formulario, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const proyectoActual = localStorage.getItem('proyectoActual');

        try {
            const res = await fetch(`http://localhost:3001/api/gestion/productos${esEdicion ? '/' + id : ''}`, {
                method: esEdicion ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formulario,
                    precio: parseFloat(formulario.precio),
                    Usuario_idUsuario: user.id,
                    Proyecto_idProyecto: proyectoActual
                })
            });

            if (res.ok) {
                await showSuccess('Éxito', esEdicion ? 'Producto actualizado' : 'Producto creado');
                navigate('/productos');
            } else {
                const data = await res.json();
                showError('Error', data?.error || 'No se pudo guardar el producto');
            }
        } catch (err) {
            showError('Error de red', 'No se pudo conectar con el servidor');
        }
    };

    const handleCancelar = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        navigate('/productos');
    };

    return (
        <form onSubmit={handleSubmit} className="cliente-form">
            <h2>{esEdicion ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                value={formulario.nombre}
                onChange={handleChange}
                required
            />
            <input
                type="text"
                name="tipo"
                placeholder="Tipo"
                value={formulario.tipo}
                onChange={handleChange}
            />
            <input
                type="number"
                step="0.01"
                name="precio"
                placeholder="Precio"
                value={formulario.precio}
                onChange={handleChange}
            />
            <textarea
                name="descripcion"
                placeholder="Descripción"
                value={formulario.descripcion}
                onChange={handleChange}
            />
            <div className="form-buttons">
                <button type="submit">{esEdicion ? 'Actualizar' : 'Crear'}</button>
                <button type="button" className="cancelar-btn" onClick={handleCancelar}>Cancelar</button>
            </div>
        </form>
    );
}
