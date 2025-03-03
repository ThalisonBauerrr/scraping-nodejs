const express = require('express');
const path = require('path');
const mysql = require('mysql2'); // Importando mysql2

const app = express();
const port = process.env.PORT || 3000;

// Configuração do banco de dados
const db = mysql.createConnection({
  host: '127.0.0.1', // Substitua com o endereço do servidor de banco de dados
  user: 'lethalcode', // Substitua com seu nome de usuário do MySQL
  password: 'p5pexvm', // Substitua com sua senha do MySQL
  database: 'lethalcode' // Substitua com o nome do seu banco de dados
});

// Conectar ao banco de dados
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados: ', err.stack);
    return;
  }
  console.log('Conectado ao banco de dados com id ' + db.threadId);
});

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
