const bcrypt = require('bcryptjs');
const blazeService = require("../services/blazeService");
const User = require('../models/userModel');
module.exports = {
    // 🔹 Login na Blaze
    login: async (req, res) => {
        console.log("📌 Recebida requisição de login na Blaze.");
        const { email, password } = req.body;

        try {
            // 🔹 Busca o usuário no banco
            const user = await User.findByContaBlaze(email);
            if (!user) {
                console.log("❌ Usuário não encontrado:", email);
                return res.status(401).json({ success: false, error: "Usuário não encontrado." });
            }

            // 🔹 Verifica a senha
            const isMatch = await bcrypt.compare(password, user.password_blaze);
            if (!isMatch) {
                console.log("❌ Senha incorreta para:", email);
                return res.status(401).json({ success: false, error: "Senha incorreta." });
            }

            console.log("✅ Senha correta para:", email);

            // 🔹 Faz login na Blaze e obtém o token
            const token = await blazeService.login(email, password);

            // 🔹 Salva usuário na sessão
            req.session.user = {
                id: user.id,
                email: user.email,
                username: user.username || "Usuário",
                plan_type: user.plan_type
            };

            console.log(`✅ Sessão iniciada para ${req.session.user.email}`);

            // 🔹 Atualiza o status `is_running = 1`
            if (user.is_running !== 1) {
                await User.updateRunningStatus(user.id, 1);
                //console.log(`✅ is_running atualizado para 1 para o usuário ${user.id}`);
            }

            return res.status(200).json({
                success: true,
                username: user.username,
                balance: user.balance,
                token: token // Retorna o token na resposta
            });

        } catch (error) {
            console.error("❌ Erro no login da Blaze:", error);
            return res.status(500).json({
                success: false,
                error: error.message || "Erro interno ao fazer login na Blaze."
            });
        }
    },
    // 🔹 Obter os últimos doubles
    getDoubles: async (req, res) => {
        try {
            const doubles = await blazeService.getDoubles();
            res.json({ success: true, doubles });
        } catch (error) {
            console.error("❌ Erro ao obter doubles:", error);
            res.status(500).json({ 
                success: false, 
                error: error.message || "Erro ao obter doubles." 
            });
        }
    },
    getTokenBlaze: async (userId) => {
        try {
            // 🔹 Obtém o token do banco
            const tokenBlaze = await User.getBlazeTokenByUserId(userId);
    
            if (!tokenBlaze) {
                console.log("❌ Nenhum token Blaze encontrado para o usuário.");
                return null;
            }
    
            console.log(`✅ Token Blaze recuperado do banco: ${tokenBlaze}`);
            return tokenBlaze;
        } catch (error) {
            console.error("❌ Erro ao recuperar token da Blaze:", error);
            return null;
        }
    },
    loginn: async (req, res) => {
        console.log("📌 Recebida requisição de login na Blaze.");
        const {email, password} = req.body;
        try {
            // 🔹 Busca o usuário no banco
            const user = await User.findByContaBlaze(email);
            if (!user) {
                return res.render('login', { error: 'Usuário não encontrado' });
            }
            // 🔹 Verifica a senha
            const isMatch = await bcrypt.compare(password, user.password_blaze);

            console.log(isMatch)
            if (!isMatch) {
                return res.render('login', { error: 'Senha incorreta' });
            }else{
                console.log("senha correta")
            }
            await blazeService.login(email, password);

            // Obtém informações do usuário da Blaze
            const userInfo = await blazeService.getUserInfo();

            if (!userInfo || !userInfo.username || !userInfo.balance) {
                throw new Error("Não foi possível obter os dados do usuário da Blaze.");
            }

            // 🔹 Verifica se há um usuário logado no site
            if (!req.session.user) {
                console.log("⚠ Nenhum usuário logado na sessão. Não é possível iniciar a verificação.");
                return res.status(401).json({ success: false, error: "Usuário não autenticado no site." });
            }

            // 🔹 Inicia a verificação dos doubles passando o email do usuário do SITE
            blazeService.startChecking(req.session.user.email, req.session.user.id);

            // 🔹 Responde com os dados do usuário
            res.json({
                success: true,
                username: userInfo.username,
                balance: userInfo.balance,
            });

            console.log(`✅ Verificação dos doubles iniciada após login! Usuário: ${req.session.user.email}`);

        } catch (error) {
            console.error("❌ Erro no processo de login da Blaze:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Erro interno no servidor.",
            });
        }
    },
};
