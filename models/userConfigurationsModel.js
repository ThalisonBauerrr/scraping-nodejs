const db = require('../config/db'); 

module.exports = {
    setUserStatusForStopWin: async (userId, balance) => {
        try {
            // Passo 1: Garantir que balance é um número
            const parsedBalance = parseFloat(balance);
            if (isNaN(parsedBalance)) {
                console.log("O valor de balance não é válido:", balance);
                return;
            }
    
            // Passo 2: Obter o valor de stop_win da tabela user_configurations para o usuário
            const query = `
                SELECT stop_win
                FROM user_configurations
                WHERE user_id = ?
            `;
            const [userConfig] = await db.query(query, [userId]);
    
            // Se não encontrar a configuração para o usuário, retorna
            if (!userConfig || userConfig.length === 0) {
                console.log("Configuração não encontrada para o usuário.");
                return;
            }
    
            const { stop_win } = userConfig[0];
    
            // Passo 3: Garantir que stop_win também seja um número
            const parsedStopWin = parseFloat(stop_win);
            if (isNaN(parsedStopWin)) {
                console.log("O valor de stop_win não é válido:", stop_win);
                return;
            }
    
            // Passo 4: Arredondar os valores para 2 casas decimais, mas mantê-los como números
            const roundedBalance = Math.round(parsedBalance * 100) / 100; // Arredondando para 2 casas
            const roundedStopWin = Math.round(parsedStopWin * 100) / 100; // Arredondando para 2 casas
    
            // Passo 5: Comparar o balance com stop_win
            if (roundedBalance > roundedStopWin) {
                console.log(`🥇   O saldo do usuário é maior que o stop_win: R$${roundedBalance} > R$${roundedStopWin}`);
    
                // Passo 6: Atualizar user_status para 'stopped' na tabela users
                const updateQuery = `
                    UPDATE users
                    SET user_status = 'stopped'
                    WHERE id = ?
                `;
                await db.query(updateQuery, [userId]);
    
                console.log(`Usuário com ID ${userId} agora está 'stopped' devido ao saldo.`);
            } else {
                console.log(`♻️   O saldo do usuário não excede o stop_win: R$${roundedBalance} <= R$${roundedStopWin}`);
            }
    
        } catch (error) {
            console.error("Erro ao verificar e atualizar o status do usuário:", error);
        }
    },
    setUserStatusForStopLoss: async (userId, balance) => {
        try {
            // Passo 1: Garantir que balance é um número
            const parsedBalance = parseFloat(balance);
            if (isNaN(parsedBalance)) {
                console.log("O valor de balance não é válido:", balance);
                return;
            }
    
            // Passo 2: Obter o valor de stop_loss da tabela user_configurations para o usuário
            const query = `
                SELECT stop_loss
                FROM user_configurations
                WHERE user_id = ?
            `;
            const [userConfig] = await db.query(query, [userId]);
    
            // Se não encontrar a configuração para o usuário, retorna
            if (!userConfig || userConfig.length === 0) {
                console.log("Configuração não encontrada para o usuário.");
                return;
            }
    
            const { stop_loss } = userConfig[0];
    
            // Passo 3: Garantir que stop_loss também seja um número
            const parsedStopLoss = parseFloat(stop_loss);
            if (isNaN(parsedStopLoss)) {
                console.log("O valor de stop_loss não é válido:", stop_loss);
                return;
            }
    
            // Passo 4: Arredondar os valores para 2 casas decimais, mas mantê-los como números
            const roundedBalance = Math.round(parsedBalance * 100) / 100; // Arredondando para 2 casas
            const roundedStopLoss = Math.round(parsedStopLoss * 100) / 100; // Arredondando para 2 casas
    
            // Passo 5: Comparar o balance com stop_loss
            if (roundedBalance < roundedStopLoss) {
                console.log(`🛑 O saldo do usuário é menor que o stop_loss: R$${roundedBalance} < R$${roundedStopLoss}`);
    
                // Passo 6: Atualizar user_status para 'stopped' na tabela users
                const updateQuery = `
                    UPDATE users
                    SET user_status = 'stopped'
                    WHERE id = ?
                `;
                await db.query(updateQuery, [userId]);
    
                console.log(`🛑 Usuário com ID ${userId} agora está 'stopped' devido ao saldo.`);
            } else {
                console.log(`🛑 O saldo do usuário não é menor que o stop_loss: R$${roundedBalance} >= R$${roundedStopLoss}`);
            }
    
        } catch (error) {
            console.error("Erro ao verificar e atualizar o status do usuário:", error);
        }
    }
    
    
    
}