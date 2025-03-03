const db = require('../config/db');  // Se já tiver sua configuração de banco

class DoublesModel {
    // 🔹 Insere um novo double no banco com o campo roll
    static async insert(data) {
        const sql = 'INSERT INTO doubles (double_id, color, roll, created_at) VALUES (?, ?, ?, NOW())';
        
        try {
            // Aqui, incluímos o campo `roll` no insert
            await db.execute(sql, [data.double_id, data.color, data.roll]);
        } catch (error) {
            console.error("❌ Erro ao inserir o double:", error);
            throw error;
        }
    }
    // 🔹 Busca os doubles pelo ID
    static async findByDoubleId(doubleId) {
        const sql = 'SELECT * FROM doubles WHERE double_id = ?';
        
        try {
            const [rows] = await db.execute(sql, [doubleId]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error("❌ Erro ao buscar double por ID:", error);
            throw error;
        }
    }
    // Função para buscar os últimos doubles
    static async getLastDoubles(limit = 10) {
        try {
            // Garantir que limit seja um número inteiro
            limit = parseInt(limit, 10);
    
            // Se limit não for um número válido, defina o valor padrão
            if (isNaN(limit) || limit <= 0) {
                console.log("⚠️ Valor de limit inválido. Usando o valor padrão de 10.");
                limit = 10;
            }
    
            // Executa a consulta com o limite válido
            const [rows] = await db.execute(
                'SELECT * FROM doubles ORDER BY created_at DESC LIMIT ?',
                [limit] // Limite de doubles que você quer buscar
            );
            
            return rows; // Retorna a lista de doubles
        } catch (error) {
            console.error("❌ Erro ao obter os últimos doubles:", error);
            throw error;
        }
    }
    // 🔹 Retorna os últimos doubles registrados
    static async getAll() {
        const sql = 'SELECT * FROM doubles ORDER BY created_at DESC LIMIT 15'; // Os 15 últimos doubles
        
        try {
            const [rows] = await db.execute(sql);
            return rows;
        } catch (error) {
            console.error("❌ Erro ao buscar os últimos doubles:", error);
            throw error;
        }
    }
    // Função que encontra as estatísticas do dia
    static async findByDate(date) {
        try {
            // Usando '?' como marcador de parâmetro para o MySQL
            const [rows] = await db.query('SELECT * FROM round_stats WHERE DATE(timestamp) = ?', [date]);
            return rows;
        } catch (error) {
            console.error("Erro ao consultar round_stats:", error);
            throw new Error("Erro ao consultar as estatísticas.");
        }
    }
    // Função para atualizar as estatísticas com base na cor sorteada
    static async updateStats(colorSorteada) {
        const today = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo', // Fuso horário de Brasília
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date()).split('/').reverse().join('-'); // Converte para o formato 'yyyy-mm-dd'
          
    
        try {
            // Chama a função findByDate para buscar as estatísticas do dia
            const stats = await this.findByDate(today);

            if (stats && stats.length > 0) {
                // Caso haja um registro, atualiza as estatísticas
                const currentStats = stats[0]; // Pegue o primeiro registro, já que é por data

                // Variáveis para os contadores
                let updatedStats = {
                    no_white: currentStats.no_white,
                    no_red: currentStats.no_red,
                    no_black: currentStats.no_black
                };

                // Se a cor sorteada for branco (0), zera o contador de branco e incrementa as outras cores
                if (colorSorteada === 0) {
                    updatedStats.no_white = 0;  // Zera o contador de branco
                    updatedStats.no_red = currentStats.no_red + 1;  // Incrementa o contador de vermelho
                    updatedStats.no_black = currentStats.no_black + 1;  // Incrementa o contador de preto
                } 
                // Se a cor sorteada for vermelho (1), zera o contador de vermelho e incrementa as outras cores
                else if (colorSorteada === 1) {
                    updatedStats.no_white = currentStats.no_white + 1;  // Incrementa o contador de branco
                    updatedStats.no_red = 0;  // Zera o contador de vermelho
                    updatedStats.no_black = currentStats.no_black + 1;  // Incrementa o contador de preto
                } 
                // Se a cor sorteada for preto (2), zera o contador de preto e incrementa as outras cores
                else if (colorSorteada === 2) {
                    updatedStats.no_white = currentStats.no_white + 1;  // Incrementa o contador de branco
                    updatedStats.no_red = currentStats.no_red + 1;  // Incrementa o contador de vermelho
                    updatedStats.no_black = 0;  // Zera o contador de preto
                }

                // Atualiza o banco de dados com os novos valores
                await db.query(
                    `UPDATE round_stats SET 
                        no_white = ?, 
                        no_red = ?, 
                        no_black = ? 
                    WHERE DATE(timestamp) = ?`, // Usando '?' para parâmetros no MySQL
                    [
                        updatedStats.no_white,
                        updatedStats.no_red,
                        updatedStats.no_black,
                        today // Data no formato adequado para 'timestamp'
                    ]
                );

                //console.log(`✅ Estatísticas do dia (${today}) atualizadas com sucesso`);
            } else {
                // Caso não haja registro para a data, insere um novo
                console.log(`❌ Nenhum registro encontrado para o dia (${today}), criando um novo...`);

                await db.query(
                    `INSERT INTO round_stats (id, timestamp, no_white, no_red, no_black) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        null, // id_double, pode ser nulo ou o valor apropriado
                        today, // data do registro
                        (colorSorteada === 0 ? 0 : 1), // Se sorteado branco, inicia com 0
                        (colorSorteada === 1 ? 0 : 1), // Se sorteado vermelho, inicia com 0
                        (colorSorteada === 2 ? 0 : 1)  // Se sorteado preto, inicia com 0
                    ]
                );

                console.log(`✅ Novo registro de estatísticas inserido para o dia (${today})`);
            }
        } catch (error) {
            console.error("❌ Erro ao atualizar/inserir estatísticas:", error);
            throw new Error("Erro ao atualizar ou inserir as estatísticas.");
        }
    }
}
module.exports = DoublesModel;
