const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD
  }
});

//Enviar correo de verificacion de registro
exports.sendRegistrationEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"SimpliFac" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Tu código de verificación en SimpliFac',
    html: `
      <p>Gracias por registrarte en SimpliFac.</p>
      <p>Introduce este código para completar tu registro:</p>
      <h2>Código de verificación</h2>
      <p style="font-size: 1.5rem; font-weight: bold;">${code}</p>
      <p>Este código expirará en 10 minutos.</p>
    `
  });
};

//Verificacion por email para cambiar la contraseña
exports.sendPasswordResetEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"SimpliFac" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Recuperación de contraseña en SimpliFac',
    html: `
      <p>Has solicitado restablecer tu contraseña en <strong>SimpliFac</strong>.</p>
      <p>Introduce el siguiente código en la aplicación para continuar:</p>
      <h2>Código de verificación</h2>
      <p style="font-size: 1.5rem; font-weight: bold;">${code}</p>
      <br />
      <p><strong>¿No fuiste tú?</strong></p>
      <p>Contacta nos a nuestro correo <a href="mailto:admin@simplifac.com">admin@simplifac.com </a> o en nuestra pesataña de contactanos
       para bloquear tu cuenta Antes de que te roben los datos.</p>
      <p style="color: gray; font-size: 0.9rem;">Este código expirará en 10 minutos.</p>
    `
  });
};

exports.transporter = transporter;
