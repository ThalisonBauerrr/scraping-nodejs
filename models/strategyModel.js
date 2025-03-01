const db = require('../config/db');
class Strategy {
    static async getByUserId(userId) {
        const sql = 'SELECT * FROM strategies WHERE user_id = ?';

        try {
            const [results] = await db.query(sql, [userId]);
            return results;  // Retorna todas as estratégias associadas ao usuário
        } catch (err) {
            console.error("Erro ao buscar estratégias:", err);
            throw err; // Propaga o erro para quem chamar o método
        }
    }
    static async create(data) {
        const sql = `
            INSERT INTO strategies 
            (user_id, name, sequence, bet_amount, chosen_color, stop_win, stop_loss, gale_amount, bet_white_amount, status, created_at, updated_at, last_run, run_count, performance, modo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL, 0, NULL, ?)`;
    
        const values = [
            data.user_id,                     // user_id
            data.name,                        // name
            data.sequence,    // sequence (convertido para JSON)
            data.bet_amount,                  // bet_amount
            JSON.stringify(data.chosen_color), // chosen_color (convertido para JSON)
            data.stop_win,                    // stop_win
            data.stop_loss,                   // stop_loss
            data.gale_amount,                 // gale_amount
            data.bet_white_amount,            // bet_white_amount
            data.status,                      // status
            data.modo                         // modo
        ];
    
        try {
            console.log("📌 Inserindo estratégia no banco:", JSON.stringify(values));
            console.log("🟢 Executando query...");
    
            // Aqui estamos usando await diretamente com o db.query
            const [result] = await db.query(sql, values);
    
            console.log("✅ Estratégia criada com ID:", result.insertId);
            return result.insertId;
    
        } catch (error) {
            console.error("❌ Erro ao criar estratégia:", error);
            throw error; // Propaga o erro para que possa ser tratado no controlador
        }
    }
    static async updateStatus(strategyId, status) {
        try {
            await db.query('UPDATE strategies SET status = ? WHERE id = ?', [status, strategyId]);
            return { success: true };
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            return { success: false };
        }
    }
    static async findActiveStrategies(userId) {
        const sql = 'SELECT * FROM strategies WHERE user_id = ? AND status = "active"'; // Retorna todas as estratégias ativas do usuário
    
        try {
            const [rows] = await db.query(sql, [userId]);
            return rows;  // Retorna todas as estratégias ativas
        } catch (error) {
            console.error('❌ Erro ao buscar estratégias ativas:', error);
            throw new Error('Erro ao verificar as estratégias ativas.');
        }
    }
    static async updateBettingStatus(strategyId, status) {
        const sql = 'UPDATE strategies SET betting_status = ? WHERE id = ?';
        try {
            await db.query(sql, [status, strategyId]);
            //console.log(`✅ Status de aposta atualizado para '${status}' na estratégia ID ${strategyId}`);
        } catch (error) {
            console.error(`❌ Erro ao atualizar o status de aposta para a estratégia ${strategyId}:`, error);
        }
    }
    static async updateBettingStatusSEMWHERE(status) {
        const sql = 'UPDATE strategies SET betting_status = ?';
        try {
            await db.query(sql, [status]);
            //console.log(`✅ Status de aposta atualizado para '${status}'`);
        } catch (error) {
            console.error(`❌ Erro ao atualizar o status de aposta para a estratégia`, error);
        }
    }
    static async getStrategyStatus(strategyId) {
        const sql = `
            SELECT betting_status
            FROM strategies
            WHERE id = ?
        `;
    
        try {
            const [rows] = await db.query(sql, [strategyId]);
    
            if (rows.length === 0) {
                console.log("❌ Estratégia não encontrada.");
                return null;
            }
    
            // Retorna o betting_status da estratégia
            return rows[0].betting_status;
        } catch (error) {
            console.error("❌ Erro ao buscar status da estratégia:", error);
            throw new Error("Erro ao obter status da estratégia.");
        }
    }
    static async getGreenRetryInterval(strategyId) {
        try {
            const sql = 'SELECT green_retry_interval FROM strategies WHERE id = ?';
            const [rows] = await db.query(sql, [strategyId]);

            if (rows.length === 0) {
                console.log("❌ Estratégia não encontrada.");
                return null;
            }

            return rows[0].green_retry_interval;  // Retorna o intervalo (em horas)
        } catch (error) {
            console.error("❌ Erro ao obter o intervalo após vitória:", error);
            throw error;
        }
    }
    static async getNextBetAfterGreen(strategyId) {
        try {
            const greenRetryInterval = await this.getGreenRetryInterval(strategyId);
            if (greenRetryInterval === null) {
                console.log("❌ Não foi possível obter o intervalo de retry.");
                return null;
            }

            const currentDate = new Date();
            //const intervaloEmMinutos = 40; // Pode ser 10, 20, 30, etc.
            const nextBetDate = new Date(currentDate.getTime() + (greenRetryInterval * 60 * 1000));
            //const nextBetDate = new Date(currentDate.getTime() + (greenRetryInterval * 60 * 60 * 1000));  // Adiciona o intervalo em horas

            console.log(`⏳ Próxima aposta será em: ${nextBetDate.toLocaleString()}`);
            return nextBetDate;  // Retorna a data e hora da próxima aposta
        } catch (error) {
            console.error("❌ Erro ao calcular o próximo horário de aposta:", error);
            throw error;
        }
    }
    static async updateNextBetAfterGreen(strategyId, nextBetDate) {
        try {
            const sql = 'UPDATE strategies SET next_bet_after_green = ? WHERE id = ?';
            await db.query(sql, [nextBetDate, strategyId]);

            //console.log(`✅ Próxima aposta após o "green" foi atualizada para: ${nextBetDate}`);
        } catch (error) {
            console.error("❌ Erro ao atualizar o próximo horário de aposta:", error);
            throw error;
        }
    }
    static async countUserStrategies  (user_id) {
        try {
            const [rows] = await db.execute("SELECT COUNT(*) AS count FROM strategies WHERE user_id = ?", [user_id]);
            return rows;
        } catch (error) {
            console.error("❌ Erro ao contar estratégias:", error);
            throw error;
        }
    }
    static async findById (strategyId) {
        try {
            const [rows] = await db.execute("SELECT * FROM strategies WHERE id = ?", [strategyId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error("❌ Erro ao buscar estratégia:", error);
            throw error;
        }
    }
    static async deleteById (strategyId) {
        try {
            await db.execute("DELETE FROM strategies WHERE id = ?", [strategyId]);
            console.log(`✅ Estratégia ${strategyId} removida.`);
        } catch (error) {
            console.error("❌ Erro ao remover estratégia:", error);
            throw error;
        }
    }
}
module.exports = Strategy;