const db = require('../config/db');  // Se já tiver sua configuração de banco

class DoublesModel {
    // 🔹 Insere um novo double no banco com o campo roll
    static async insert(data) {
        const sql = 'INSERT INTO doubles (double_id, color, roll, created_at) VALUES (?, ?, ?, NOW())';
    
        try {
            // Tenta inserir os dados. Se o double_id já existir, o banco irá gerar um erro.
            await db.execute(sql, [data.double_id, data.color, data.roll]);
            //console.log("✅ Novo double inserido com sucesso!");
        } catch (error) {
            // Caso o erro seja de duplicação (MySQL: ER_DUP_ENTRY), trata como erro de duplicação
            if (error.code === 'ER_DUP_ENTRY') {
                //console.log("❌ Double ID já existe!");
            } else {
                console.error("❌ Erro ao inserir o double:", error);
                throw error;
            }
        }
    }
    // 🔹 Busca os doubles pelo ID
    static async findByDoubleId(doubleId) {
        const sql = 'SELECT * FROM doubles ORDER BY id DESC LIMIT 1'; // Pegando o último registro com base no ID
        
        try {
            const [rows] = await db.execute(sql);
            
            // Verifica se o último registro tem o double_id igual ao passado
            if (rows.length > 0 && rows[0].double_id === doubleId) {
                return rows[0]; // Retorna o registro se os double_ids coincidirem
            }
            
            // Se não encontrar o registro ou o double_id não coincidir, retorna null
            return null;
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
        
            // Verificar se limit é um número válido e se é positivo
            if (isNaN(limit) || limit <= 0) {
                console.log("⚠️ Valor de limit inválido. Usando o valor padrão de 10.");
                limit = 10;
            }
    
            // Executa a consulta com o limite fixo
            const [rows] = await db.execute(
                `SELECT * FROM doubles ORDER BY created_at DESC LIMIT ${limit}`
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
        try {
            // Busca o último registro
            const stats = await db.query(
                `SELECT * FROM round_stats ORDER BY id DESC LIMIT 1`
            );

           // Se houver registros, fazemos a atualização
                const currentStats = stats[0]; // O objeto que contém as estatísticas

                // Variáveis para os contadores
                let updatedStats = {
                    no_white: currentStats[0].no_white,
                    no_red: currentStats[0].no_red,
                    no_black: currentStats[0].no_black
                };
    
                // Lógica de atualização de acordo com a cor sorteada
                switch (colorSorteada) {
                    case 0: // Branco
                        updatedStats.no_white = 0;  // Zera o contador de branco
                        updatedStats.no_red = currentStats[0].no_red + 1;  // Incrementa o contador de vermelho
                        updatedStats.no_black = currentStats[0].no_black + 1;  // Incrementa o contador de preto
                        break;
    
                    case 1: // Vermelho
                        updatedStats.no_white = currentStats[0].no_white + 1;  // Incrementa o contador de branco
                        updatedStats.no_red = 0;  // Zera o contador de vermelho
                        updatedStats.no_black = currentStats[0].no_black + 1;  // Incrementa o contador de preto
                        break;
    
                    case 2: // Preto
                        updatedStats.no_white = currentStats[0].no_white + 1;  // Incrementa o contador de branco
                        updatedStats.no_red = currentStats[0].no_red + 1;  // Incrementa o contador de vermelho
                        updatedStats.no_black = 0;  // Zera o contador de preto
                        break;
                }
    
                // Log para verificação dos valores calculados
                //console.log("Valores calculados:", updatedStats);
    
                // Verificar se algum valor é NaN e, se for, corrigir antes de atualizar o banco
                if (isNaN(updatedStats.no_white) || isNaN(updatedStats.no_red) || isNaN(updatedStats.no_black)) {
                    console.error("❌ Erro: Um ou mais valores de contadores são inválidos.");
                    return;
                }
    
                // Atualiza o banco de dados com os novos valores
                await db.query(
                    `UPDATE round_stats SET 
                        no_white = ?, 
                        no_red = ?, 
                        no_black = ? 
                    WHERE id = ?`, // Usando 'id' para identificar o último registro
                    [
                        updatedStats.no_white,
                        updatedStats.no_red,
                        updatedStats.no_black,
                        currentStats[0].id // ID do último registro
                    ]
                );
    
            console.log(`✅ Último registro atualizado com sucesso`);
           
        } catch (error) {
            console.error("❌ Erro ao atualizar estatísticas:", error);
            throw new Error("Erro ao atualizar as estatísticas.");
        }
    }
    
    
    
}
module.exports = DoublesModel;
