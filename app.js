// Importa o Express
const express = require('express');
const path = require('path');

// Cria a instância do aplicativo Express
const app = express();

// Define a porta em que o servidor vai rodar
const port = 3000;

// Configuração do EJS como motor de template
app.set('view engine', 'ejs');

// Define o diretório onde os arquivos EJS estão localizados
app.set('views', path.join(__dirname, 'views'));

// Serve os arquivos estáticos (CSS, JS, Imagens) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a página principal (index.ejs)
app.get('/', (req, res) => {
  res.render('index');  // Renderiza o arquivo index.ejs da pasta views
});



// Inicia o servidor e escuta na porta especificada
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
