const db = require('../config/db');  // Importa a configuração do banco de dados
const bcrypt = require('bcryptjs');
const moment = require('moment');
const crypto = require('crypto');

// 🔹 Configurações padrões
const TOKEN_EXPIRATION_DAYS = 30; // Token válido por 30 dias
const SALT_ROUNDS = 10; // Número de rounds para hashing de senha

module.exports = {
    // 🔹 Criar um novo usuário
    createUser: async (email, password, plan_type, user_role, user_status) => {
        try {
            if (!email || !password || !plan_type || !user_role || !user_status) {
                throw new Error('Todos os campos são obrigatórios.');
            }
            const rememberToken = crypto.randomBytes(32).toString('hex');
            const tokenCreatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
            const tokenExpiration = moment().add(TOKEN_EXPIRATION_DAYS, 'days').format('YYYY-MM-DD HH:mm:ss');

            const [result] = await db.execute(
                'INSERT INTO users (email, password, remember_token, plan_type, user_role, user_status, token_created_at, token_expiration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [email, password, rememberToken, plan_type, user_role, user_status, tokenCreatedAt, tokenExpiration]
            );

            return { success: true, userId: result.insertId };
        } catch (error) {
            console.error('❌ Erro ao criar usuário:', error);
            throw new Error('Erro ao criar usuário. Verifique os dados e tente novamente.');
        }
    },
    // 🔹 Buscar usuário por email
    findByEmail: async (email) => {
        try {
            if (!email) throw new Error('Email é obrigatório.');

            const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('❌ Erro ao buscar usuário por email:', error);
            throw new Error('Erro ao buscar usuário. Tente novamente.');
        }
    },
    findByContaBlaze: async (email) => {
        try {
            const [rows] = await db.execute("SELECT * FROM users WHERE conta_blaze = ?", [email]);
            return rows.length > 0 ? rows[0] : null;
            
        } catch (error) {
            console.error("❌ Erro ao buscar usuário por conta Blaze:", error);
            throw new Error("Erro ao buscar usuário.");
        }
    },
    // 🔹 Buscar usuário por IDfindById
    findById: async (userId) => {
        try {
            if (!userId || isNaN(userId)) {
                console.warn(`⚠ ID de usuário inválido: ${userId}`);
                return null;
            }
        
            const [rows] = await db.execute(
                'SELECT id, email, conta_blaze, is_running, user_status, password_blaze, plan_type, blaze_token FROM users WHERE id = ?',
                [userId]
            );
        
            if (rows.length) {
                //console.log(`✅ Usuário encontrado para o ID ${userId}:`, rows[0]);
                return rows[0];
            } else {
                console.warn(`⚠ Usuário não encontrado para o ID ${userId}`);
                return null;
            }
        } catch (error) {
            console.error(`❌ Erro ao buscar usuário com ID ${userId}:`, error.message);
            return null;
        }
    },
    // 🔹 Atualizar token de "lembrar-me"
    updateRememberToken: async (email, rememberToken, tokenExpiration) => {
        try {
            if (!email || !rememberToken || !tokenExpiration) {
                throw new Error('Email, token e expiração são obrigatórios.');
            }

            const [result] = await db.execute(
                'UPDATE users SET remember_token = ?, token_expiration = ? WHERE email = ?',
                [rememberToken, tokenExpiration, email]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Erro ao atualizar token de lembrar-me:', error);
            throw new Error('Erro ao atualizar token. Tente novamente.');
        }
    },
    // 🔹 Buscar usuário pelo token de "lembrar-me"
    findByRememberToken: async (rememberToken) => {
        try {
            if (!rememberToken) throw new Error('Token é obrigatório.');

            const [rows] = await db.execute('SELECT * FROM users WHERE remember_token = ?', [rememberToken]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('❌ Erro ao buscar usuário por token:', error);
            throw new Error('Erro ao buscar usuário. Tente novamente.');
        }
    },
    // 🔹 Atualizar senha do usuário
    updatePassword: async (email, newPassword) => {
        try {
            if (!email || !newPassword) {
                throw new Error('Email e nova senha são obrigatórios.');
            }

            const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

            const [result] = await db.execute(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, email]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Erro ao atualizar senha:', error);
            throw new Error('Erro ao atualizar senha. Tente novamente.');
        }
    },
    // 🔹 Deletar usuário por email
    deleteUserByEmail: async (email) => {
        try {
            if (!email) throw new Error('Email é obrigatório.');

            const [result] = await db.execute('DELETE FROM users WHERE email = ?', [email]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Erro ao deletar usuário:', error);
            throw new Error('Erro ao deletar usuário. Tente novamente.');
        }
    },
    // 🔹 Verifica se o e-mail da Blaze já está vinculado a outro usuário (excluindo o usuário atual)
    checkBlazeEmailExists: async (emailBlaze, userId) => {
        try {
            const [rows] = await db.execute(
                'SELECT id FROM users WHERE conta_blaze = ? AND id != ?',
                [emailBlaze, userId]
            );
            return rows.length > 0; // Retorna `true` se o e-mail já existir
        } catch (error) {
            console.error("❌ Erro ao verificar e-mail da Blaze:", error);
            throw new Error("Erro ao verificar e-mail da Blaze.");
        }
    },
    // 🔹 Atualiza apenas o e-mail da Blaze
    setBlazeAccount: async (userId, emailBlaze) => {
        try {
            const [result] = await db.execute(
                'UPDATE users SET conta_blaze = ? WHERE id = ?',
                [emailBlaze, userId]
            );
            return result.affectedRows > 0; // Retorna `true` se atualizar com sucesso
        } catch (error) {
            console.error("❌ Erro ao salvar conta Blaze:", error);
            throw new Error("Erro ao salvar conta Blaze.");
        }
    },
    // 🔹 Atualiza o e-mail e a senha da Blaze
    setBlazeAccountWithPassword: async (userId, emailBlaze, passwordBlaze) => {
        try {
            const hashedPassword = await bcrypt.hash(passwordBlaze, SALT_ROUNDS);

            const [result] = await db.execute(
                'UPDATE users SET conta_blaze = ?, password_blaze = ? WHERE id = ?',
                [emailBlaze, hashedPassword, userId]
            );
            return result.affectedRows > 0; // Retorna `true` se atualizar com sucesso
        } catch (error) {
            console.error("❌ Erro ao salvar conta e senha Blaze:", error);
            throw new Error("Erro ao salvar conta e senha Blaze.");
        }
    },
    // 🔹 Buscar conta Blaze do usuário
    getBlazeAccount: async (userId) => {
        try {
            const [rows] = await db.execute("SELECT conta_blaze FROM users WHERE id = ?", [userId]);
            return rows.length > 0 ? rows[0].conta_blaze : null;
        } catch (error) {
            console.error("❌ Erro ao buscar conta Blaze:", error);
            return null;
        }
    },
    // 🔹 Atualiza o status de execução do programa para um usuário
    updateRunningStatus: async (userId, status) => {
        try {
            if (!userId || status === undefined) {
                throw new Error('Parâmetros inválidos: userId e status são obrigatórios.');
            }
    
            const [result] = await db.execute(
                'UPDATE users SET is_running = ? WHERE id = ?',
                [status, userId]
            );
    
            if (result.affectedRows > 0) {
                //console.log(`✅ is_running atualizado para ${status} para o usuário ${userId}.`);
                return { success: true };
            } else {
                console.error(`❌ Nenhuma linha afetada. O usuário ${userId} pode não existir.`);
                return { success: false, message: "Nenhum usuário encontrado para atualizar." };
            }
        } catch (error) {
            console.error("❌ Erro ao atualizar is_running:", error);
            throw new Error('Erro ao atualizar estado de execução.');
        }
    },
    // 🔹 Buscar todos os usuários com `is_running = 1`
    getUsersRunning: async () => {
        try {
            const [rows] = await db.execute('SELECT id, email,lossAccumulator,recuperation,balance FROM users WHERE is_running = 1 AND user_status = "active"');
            return rows;
        } catch (error) {
            console.error("❌ Erro ao buscar usuários ativos:", error);
            throw error;
        }
    },
    getBlazeCredentials: async (userId) => {
        try {
            const [rows] = await db.execute(
                "SELECT conta_blaze, password_blaze FROM users WHERE id = ?",
                [userId]
            );

            if (rows.length === 0) return null;
            return rows[0]; // Retorna o email e a senha hash
        } catch (error) {
            console.error("❌ Erro ao buscar credenciais da Blaze:", error);
            throw new Error("Erro ao buscar credenciais da Blaze.");
        }
    },
    // 🔹 Verificar se o plano free expirou (5 horas após o cadastro)
    checkExpiration: async (userId) => {
        try {
            const [rows] = await db.execute('SELECT created_at, user_status FROM users WHERE id = ?', [userId]);

            if (rows.length === 0) {
                throw new Error('Usuário não encontrado.');
            }

            const user = rows[0];
            const createdAt = moment(user.created_at);
            const now = moment();
            const hoursPassed = now.diff(createdAt, 'hours');

            if (user.user_status === 'active' && hoursPassed >= 5) {
                await db.execute('UPDATE users SET user_status = ? WHERE id = ?', ['expired', userId]);
                console.log(`⏳ Usuário ${userId} expirou após 5 horas de teste.`);
                return 'expired';
            }

            return user.user_status;
        } catch (error) {
            console.error('❌ Erro ao verificar expiração do usuário:', error);
            throw error;
        }
    },
    updateBlazeToken: async (email, token) => {
        try {
            await db.execute("UPDATE users SET blaze_token = ? WHERE conta_blaze = ?", [token, email]);
            console.log(`✅ Token atualizado no banco para o usuário: ${email}`);
        } catch (error) {
            console.error("❌ Erro ao atualizar token no banco:", error);
            throw new Error("Erro ao atualizar token no banco.");
        }
    },
    getBlazeTokenByUserId: async (userId) => {
        try {
            const [rows] = await db.execute("SELECT blaze_token FROM users WHERE id = ?", [userId]);
            if (rows.length > 0 && rows[0].blaze_token) {
                return rows[0].blaze_token;
            }
            return null;
        } catch (error) {
            console.error("❌ Erro ao buscar blaze_token do banco:", error);
            throw error;
        }
    },
    atualizarMetaDiaria: async (userId) => {
        try {
            // Primeiro, busca as informações do usuário na tabela users
            const [user] = await db.execute('SELECT id, meta_diaria, stop_loss, balance FROM users WHERE id = ?', [userId]);
    
            // Verifica se o usuário existe
            if (user.length === 0) {
                console.log(` ⚠️ Usuário com id ${userId} não encontrado.`);
                return;
            }
    
            const { meta_diaria, balance, stop_loss } = user[0];
    
            // Verifica se a meta diária e o balance existem
            if (meta_diaria === undefined || meta_diaria === null) {
                console.log(` ⚠️ Meta diária indefinida para o usuário ${userId}, pulando...`);
                return;  // Ignora o usuário
            }
    
            if (balance === undefined || balance === null) {
                console.log(` ⚠️ Balance bancário indefinido para o usuário ${userId}, pulando...`);
                return;  // Ignora o usuário
            }
    
            // Cálculo de stop_loss: percentual do balance
            let calculatedStopLoss;
            if (stop_loss !== undefined && stop_loss !== null) {
                // O stop_loss é calculado como um percentual do saldo
                calculatedStopLoss = balance - (balance * (stop_loss / 100)); // Stop loss é balance - (percentual de stop_loss)
            } else {
                // Se o stop_loss não estiver definido, define 10% do saldo
                calculatedStopLoss = balance * 0.10;  // 10% do saldo
            }
    
            // Cálculo de stop_win: percentual do balance
            let lucro = balance * (meta_diaria / 100)
            let stopWin = balance + lucro  
    
            // Verificar se stopWin é um número válido antes de arredondar
            if (isNaN(stopWin)) {
                console.log(` ⚠️ Valor inválido de stopWin para o usuário ${userId}, pulando...`);
                return;
            }
            // Arredondar o valor de stopWin para 3 casas decimais e garantir que seja número
            stopWin = parseFloat(stopWin.toFixed(3)); // Agora é um número, não uma string
    
            // Obtém a data de hoje no formato 'YYYY-MM-DD'
            const today = new Date().toISOString().split('T')[0];
    
            // Verifica se já existe um registro na tabela user_configurations para esse usuário
            const [existingConfig] = await db.execute('SELECT * FROM user_configurations WHERE user_id = ?', [userId]);
    
            if (existingConfig.length > 0) {
                // Se o registro existir, verifica a data 'created_at'
                const createdAt = existingConfig[0].created_at;
                const createdDate = new Date(createdAt).toISOString().split('T')[0]; // Converte para 'YYYY-MM-DD'
    
                // Se a data de criação for hoje, não pode atualizar
                if (createdDate === today) {
                    return;  // Impede a atualização
                }
    
                // Caso contrário, atualize o registro
                await db.execute(
                    `UPDATE user_configurations 
                     SET meta_diaria = ?, stop_loss = ?, stop_win = ?, balance = ?, created_at = NOW() 
                     WHERE user_id = ?`,
                    [meta_diaria, calculatedStopLoss, stopWin, balance, userId]
                );
                console.log(`🎯  Meta diária atualizada para o usuário ${userId}`);
            } else {
                // Se não houver registro, insira um novo
                await db.execute(
                    `INSERT INTO user_configurations (user_id, meta_diaria, stop_loss, stop_win, balance, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                    [userId, meta_diaria, calculatedStopLoss, stopWin, balance]
                );
    
                // Atualizar o status do usuário na tabela 'users' de 'stopped' para 'active'
                await db.execute(
                    `UPDATE users
                    SET user_status = 'active'
                    WHERE id = ? AND user_status = 'stopped'`,
                    [userId]
                );
    
                console.log(`🎯 Meta diária inserida para o usuário ${userId} e status alterado para 'active'`);
            }
        } catch (error) {
            console.error("❌ Erro ao atualizar a meta diária do usuário:", error);
            throw new Error("Erro ao atualizar a meta diária.");
        }
    },
    
    
    updateUserBalance : async (userId,balance) => {
        try {

            // Passo 2: Atualizar o saldo na tabela 'user' com o saldo obtido
            const query = `
                UPDATE users
                SET balance = ?
                WHERE id = ?;
            `;
            
            // Passo 3: Executar a query, passando o novo saldo e o userId
            await db.query(query, [balance, userId]);
    
            //console.log(`💰 Saldo atualizado para o usuário com ID ${userId}: R$ ${balance}`);
        } catch (error) {
            console.error("Erro ao atualizar o saldo do usuário:", error);
        }
    },
    updateUserLossAccumulator: async (userId, loss) => {
        try {
            // Se o loss for 0, atualiza lossAccumulator para 0
            if (loss === 0) {
                const queryUpdate = `
                    UPDATE users
                    SET lossAccumulator = ?
                    WHERE id = ?;
                `;
                // Atualiza diretamente o lossAccumulator para 0
                await db.query(queryUpdate, [0, userId]);
    
                console.log(`💱  LossAccumulator zerado para o usuário com ID ${userId}.`);
                return;
            }
    
            // Passo 1: Buscar o valor atual de lossAccumulator para o usuário
            const querySelect = `
                SELECT lossAccumulator
                FROM users
                WHERE id = ?;
            `;
            
            // Executando a query para obter o valor de lossAccumulator
            const [result] = await db.query(querySelect, [userId]);
    
            // Se o usuário for encontrado e tiver um valor de lossAccumulator
            if (result.length > 0) {
                const currentLoss = parseFloat(result[0].lossAccumulator) || 0;  // Garantir que seja um número
                const lossNumber = parseFloat(loss);  // Garantir que o valor de loss seja um número
                const updatedLossAccumulator = currentLoss + lossNumber;  // Somando o valor da nova perda
    
                // Passo 2: Atualizar o campo lossAccumulator na tabela 'users' com o valor somado
                const queryUpdate = `
                    UPDATE users
                    SET lossAccumulator = ?
                    WHERE id = ?;
                `;
                
                // Passo 3: Executar a query, passando o novo valor de lossAccumulator
                await db.query(queryUpdate, [updatedLossAccumulator.toFixed(3), userId]);
    
                console.log(`💱  LossAccumulator atualizado para o usuário com ID ${userId}: R$ ${updatedLossAccumulator.toFixed(3)}`);
            } else {
                console.log(`Usuário com ID ${userId} não encontrado.`);
            }
        } catch (error) {
            console.error("Erro ao atualizar o LossAccumulator:", error);
        }
    }
    
};    