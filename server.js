require('dotenv').config({ path: './config/.env' }); // Carregar variáveis de ambiente
const express = require('express');
const db = require('./config/db'); // Conexão com MySQL
const BlazeService = require("./services/blazeService"); // 🔹 Importa a função
const Strategy = require('./models/strategyModel');
const cron = require('node-cron'); // Importa o node-cron


const app = express();
const port = process.env.PORT || 3000;

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

// 🔹 Inicialização do servidor
function startServer() {
    // 🔹 Inicia o servidor
    app.listen(port, async () => {
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
