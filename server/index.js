const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log("Puerto cargado desde .env:", process.env.PORT); // Debug

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));

app.listen(process.env.PORT, () => {
  console.log(`Servidor backend en http://localhost:${process.env.PORT}`);
});
