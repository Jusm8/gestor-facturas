import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import FormularioDocumento from './FormularioDocumento';
import '../assets/styles/FormularioDocumento.css';

export default function CrearFormulario() {
  const [tipo, setTipo] = useState<'presupuesto' | 'factura'>('presupuesto');
  const { id } = useParams();

  return (
    <div className="crear-formulario-container">
      <div className="slider-toggle">
        <button className={tipo === 'presupuesto' ? 'active' : ''} onClick={() => setTipo('presupuesto')}>Presupuesto</button>
        <button className={tipo === 'factura' ? 'active' : ''} onClick={() => setTipo('factura')}>Factura</button>
      </div>
      <FormularioDocumento tipo={tipo} idProyecto={id} />
    </div>
  );
}