import '../assets/styles/sobreNosotros.css';

export default function SobreNosotros() {
  return (
    <div className="sobre-container">
      <div className="sobre-card">
        <h1>Sobre Nosotros</h1>
        <p>
          <strong>SimpliFac</strong> tiene como objetivo facilitar la gestión de facturas y presupuestos
          para autónomos y pequeñas empresas.
        </p>

        <h2>Nuestra Misión</h2>
        <p>
          Queremos que la facturación deje sea un proceso sencillo, accesible y eficiente.
        </p>

        <h2>¿Quiénes somos?</h2>
        <p>
          Soy un desarrollador independiente de un grado superior de Desarrollo de aplicaciones Web
        </p>

        <h2>Lo que ofrecemos</h2>
        <ul>
          <li>Gestión rápida de facturas y presupuestos</li>
          <li>Panel de administración para usuarios y proyectos</li>
          <li>Seguridad y simplicidad en la experiencia de uso</li>
        </ul>
      </div>
    </div>
  );
}