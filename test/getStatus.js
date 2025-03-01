const BlazeAuth = require('../api'); // Certifique-se de que esse caminho está correto
require('dotenv').config({ path: './config/.env' });
const blazeAuth = new BlazeAuth(process.env.API_USERNAME, process.env.API_PASSWORD);

async function testStatus() {
    try {
        console.log("📌 Tentando logar na Blaze para testar getStatus...");

        // 🔹 Faz login antes de testar o status
        await blazeAuth.login(); 

        for (let i = 1; i <= 50; i++) {  // Teste com 50 repetições
            console.log(`🔄 [${i}/50] Buscando status da Blaze...`);
            
            const status = await blazeAuth.getStatus();  // 🔹 Chama a função corrigida

            console.log(`✅ [${i}/50] Status Atual da Blaze: ${status || "Erro ao obter status"}`);

            // Aguarda 2 segundos antes de repetir
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    } catch (error) {
        console.error("❌ Erro ao testar getStatus:", error);
    }
}

// 🔹 Executa o teste
testStatus();
