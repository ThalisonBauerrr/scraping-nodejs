const BlazeAuth = require('../api'); // Certifique-se de que esse caminho está correto
require('dotenv').config({ path: './config/.env' });
const blazeAuth = new BlazeAuth(process.env.API_USERNAME, process.env.API_PASSWORD);

async function setBet() {
    await blazeAuth.login(); // Faz login primeiro

    // 🔹 Parâmetros para a aposta
    const amount = "0.10"; // Valor da aposta
    const color = 2;       //0 = branco 1 = vermelho, 2 = preto, 
    const username = "Creedmkt"; // Nome de usuário da Blaze
    const walletId = 6133025; // Substitua pelo ID correto
    const roomId = 1;

    await blazeAuth.placeBetWhenWaiting(amount, color, username, walletId, roomId);
}

// 🔹 Executa o teste
setBet();
