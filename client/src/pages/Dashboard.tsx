import React from 'react';

export default function Dashboard() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div>
            <>
                <div>Contenido del Dashboard</div>
            </>
            <h1>Bienvenido, {user.nombre}</h1>
            <p>Tu rol: {user.rol}</p>
        </div>
    );
}
