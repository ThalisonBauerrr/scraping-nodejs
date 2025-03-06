require('dotenv').config({ path: './config/.env' }); // Carregar variáveis de ambiente
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./config/db'); // Conexão com MySQL
const routes = require('./routes'); // Importando as rotas organizadas
const app = express();
const sessionStore = new MySQLStore({}, db);

// 🔹 Configurar Middleware
function setupMiddleware(app) {
    app.set('view engine', 'ejs');

    app.use(session({
        secret: process.env.SESSION_SECRET || 'segredo_super_secreto',
        resave: false,
        saveUninitialized: false, // 🔹 Impede salvar sessões vazias
        store: sessionStore, // 🔹 Certifique-se de que está apontando para o MySQL
        cookie: {
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 dias de duração
            httpOnly: true,
            secure: false // Se estiver rodando localmente, deixe `false`
        }
    }));

    app.use((req, res, next) => {
        res.locals.user = req.session.user || null; // 🔹 Define `user` globalmente
        next();
    });
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/img', express.static(path.join(__dirname, 'img'))); // Serve a pasta img como estática

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(express.json());
    app.use(cookieParser());
    app.use(cors());
}

// 🔹 Configuração das rotas
function setupRoutes(app) {
    app.use('/', routes); // Usa o arquivo central de rotas
}

// 🔹 Inicialização do servidor
function startServer() {
    setupMiddleware(app);
    setupRoutes(app);
}

startServer();
