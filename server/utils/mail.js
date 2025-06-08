const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendVerificationEmail = async (to, code) => {
  const info = await transporter.sendMail({
    from: `"SimpliFac" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Tu codigo de verificación en SimpliFac',
    html: `<p>Gracias por elegirnos como su aplicacion gestora de sus proyectos</p>
            <br>
            <h2>Código de verificación</h2><p>Tu codigo es: <b>${code}</b></p>
            <br>
            <p>Si no has solicitado este codigo, puedes ignorar este correo.</p>`
  });

  console.log('Test debug')
  console.log('Mensaje enviado: %s', info.messageId);
};

exports.transporter = transporter;
