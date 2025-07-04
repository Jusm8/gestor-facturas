const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./routes/auth.routes'));

app.use('/api/documento', require('./routes/documento.routes'));

app.use('/api/gestion', require('./routes/gestion.routes'));

app.use('/api/auth', require('./routes/auth.routes'));

app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log(`Servidor backend en http://0.0.0.0:${process.env.PORT}`);
});