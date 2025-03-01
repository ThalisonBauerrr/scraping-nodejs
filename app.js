// Importa o Express
const express = require('express');

// Cria uma instância do aplicativo Express
const app = express();

// Define a porta em que o servidor vai rodar
const port = 3000;

// Define a rota para a raiz e responde com "Hello, World!"
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Inicia o servidor e escuta na porta especificada
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
