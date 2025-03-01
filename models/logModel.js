const db = require('../config/db');  // Conexão com o banco de dados

module.exports = {
    // 🔹 Insere um novo log no banco de dados
    insertLog: async (userId, texto) => {
        try {
            await db.execute(
                'INSERT INTO logs (user_id, texto) VALUES (?, ?)',
                [userId, texto]
            );
            console.log(`📝 Log registrado: ${texto}`);
        } catch (error) {
            console.error('❌ Erro ao inserir log:', error);
        }
    },

    // 🔹 Obtém logs de um usuário
    getUserLogs: async (userId) => {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM logs WHERE user_id = ? ORDER BY hora DESC',
                [userId]
            );
            return rows;
        } catch (error) {
            console.error('❌ Erro ao buscar logs:', error);
            return [];
        }
    },
    // 🔹 Buscar os últimos N logs
    getLatestLogs: async (limit = 15) => {
        try {
            const [rows] = await db.execute(
                'SELECT texto, hora FROM logs ORDER BY hora DESC LIMIT ?', 
                [limit]
            );
            return rows;
        } catch (error) {
            console.error("❌ Erro ao buscar logs:", error);
            throw error;
        }
    }
};
