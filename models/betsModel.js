const db = require('../config/db');  // Se já tiver sua configuração de banco

class BetsModel {
    // 🔹 Função para inserir uma nova aposta na tabela `bets`
    static async insert(betData) {
        const sql = `
            INSERT INTO bets 
            (user_id, strategy_id, double_id, chosen_color, bet_amount, bet_status, modo, gale, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        const values = [
            betData.user_id,
            betData.strategy_id,
            betData.double_id,
            betData.chosen_color,
            betData.bet_amount,
            betData.bet_status,
            betData.modo,
            betData.gale
        ];
        
        try {
            const [result] = await db.query(sql, values);
            //console.log(`✅ Aposta criada com sucesso.`);
            return result.insertId;  // Retorna o ID da nova aposta
        } catch (error) {
            console.error("❌ Erro ao inserir aposta:", error);
            throw new Error('Erro ao salvar a aposta');
        }
    }
    // 🔹 Função para buscar uma aposta por ID
    static async findById(betId) {
        const sql = `SELECT * FROM bets WHERE id = ?`;

        try {
            const [rows] = await db.query(sql, [betId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error("❌ Erro ao buscar aposta por ID:", error);
            throw new Error('Erro ao buscar a aposta');
        }
    }
    // 🔹 Função para atualizar o status da aposta (por exemplo, após verificar o resultado)
    static async updateBetStatus(betId, newStatus) {
        const sql = `UPDATE bets SET bet_status = ?, updated_at = NOW() WHERE id = ?`;

        try {
            await db.query(sql, [newStatus, betId]);
            //console.log(`✅ Status da aposta ID ${betId} atualizado para ${newStatus}`);
        } catch (error) {
            console.error("❌ Erro ao atualizar status da aposta:", error);
            throw new Error('Erro ao atualizar status da aposta');
        }
    } 
    static async getLastDoubleIdAndColorByStrategy(strategyId) {
        try {
            // Consulta para pegar o último double_id e o chosen_color da estratégia
            const sql = 'SELECT id, double_id, chosen_color,bet_amount, bet_status, modo, gale FROM bets WHERE strategy_id = ? ORDER BY created_at DESC LIMIT 1';
            const [rows] = await db.query(sql, [strategyId]);
    
            if (rows.length === 0) {
                //console.log("❌ Nenhum double_id encontrado para a estratégia ID:", strategyId);
                return null;
            }
            const betId = rows[0].id;
            const lastDoubleId = rows[0].double_id;
            const chosenColor = rows[0].chosen_color;
            const bet_amount = rows[0].bet_amount;
            const betStatus = rows[0].bet_status;
            const modo = rows[0].modo;
            const gale = rows[0].gale;
            //console.log(`✅ Último double_id para a estratégia ID ${strategyId}: ${lastDoubleId}`);
            //console.log(`✅ Última cor escolhida para a estratégia ID ${strategyId}: ${chosenColor}`);
    
            return {betId, lastDoubleId, chosenColor, bet_amount, betStatus, modo, gale };  // Retorna um objeto com ambos os valores
        } catch (error) {
            console.error("❌ Erro ao buscar o último double_id e chosen_color para a estratégia:", error);
            throw error;
        }
    }
    static async incrementarGale(betId) {
        try {
            //console.log(`📊 [MARTINGALE] Tentando incrementar gale para a aposta ID: ${betId}`);
    
            // Atualiza o gale e retorna o novo valor atualizado (se o banco suportar RETURNING)
            const [result] = await db.execute(
                `UPDATE bets SET gale = gale + 1 WHERE id = ?`,
                [betId]
            );
    
            if (result.affectedRows > 0) {
                //console.log(`✅ [MARTINGALE] Gale atualizado com sucesso para aposta ID ${betId}!`);
                return true;
            } else {
                console.warn(`⚠️ [MARTINGALE] Nenhuma linha foi alterada para aposta ID ${betId}. Verifique se o ID existe.`);
                return false;
            }
        } catch (error) {
            console.error(`❌ [ERRO MARTINGALE] Falha ao incrementar gale da aposta ID ${betId}:`, error);
            throw new Error("Erro ao atualizar gale.");
        }
    }
    
    
}

module.exports = BetsModel;
