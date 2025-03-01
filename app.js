const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve arquivos estáticos como CSS, JS, Imagens da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota para servir o arquivo 'index.html'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
