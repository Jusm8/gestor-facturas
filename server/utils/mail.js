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
    subject: 'Tu código de verificación',
    html: `<h2>Código de verificación</h2><p>Tu código es: <b>${code}</b></p>`
  });

  console.log('Mensaje enviado: %s', info.messageId);
};
