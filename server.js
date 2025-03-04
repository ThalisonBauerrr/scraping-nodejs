require('dotenv').config({ path: './config/.env' }); // Carregar variáveis de ambiente
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./config/db'); // Conexão com MySQL
const BlazeService = require("./services/blazeService"); // 🔹 Importa a função
const Strategy = require('./models/strategyModel');
const UserConfigurations = require('./models/userModel'); // Modelo de configurações de usuário
const cron = require('node-cron'); // Importa o node-cron

const routes = require('./routes'); // Importando as rotas organizadas
const app = express();
const port = process.env.PORT || 3000;
const sessionStore = new MySQLStore({}, db);

// 🔹 Função para atualizar o status dos usuários
async function updateUserStatus() {
    try {
        await db.execute(`
            UPDATE users
            SET user_status = 'active'
            WHERE user_status = 'stopped'
        `);
        console.log('Status dos usuários atualizados para "active".');
    } catch (error) {
        console.error('Erro ao atualizar status dos usuários:', error);
    }
}

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

    // 🔹 Inicia o servidor
    app.listen(port, '0.0.0.0', async () => {
        console.log(`🚀 Servidor rodando em http://localhost:${port}`);
    

        await Strategy.updateBettingStatusSEMWHERE('inactive');
        // Chama o método para garantir que o processo de verificação dos doubles inicie
        await BlazeService.startChecking();  // Inicia a verificação dos doubles a cada 5 segundos
        // Retoma a verificação de sessões ativas para os usuários com is_running = 1
        await BlazeService.resumeActiveSessions();

        // Agendar o cron job para rodar todos os dias às 00:00
        cron.schedule('0 0 * * *', async () => {
            console.log('Executando atualização de status dos usuários...');
            await updateUserStatus();
        });
    });
}

// Inicia o servidor
startServer();
