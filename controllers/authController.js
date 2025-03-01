const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const moment = require('moment');

const TOKEN_EXPIRATION_DAYS = 3; // 🔹 Token válido por 3 dias
const SALT_ROUNDS = 10;

module.exports = {
    loginPage: (req, res) => {
        if (req.session.user) {
            console.log(`✅ Usuário já autenticado (${req.session.user.email}). Redirecionando para /dashboard`);
            return res.redirect('/dashboard'); // Redireciona se já estiver logado
        }
        res.render('login', { error: req.query.error || null }); 
    },
    // 🔹 Login de Usuário
    login: async (req, res) => {
        let { email, password, rememberMe } = req.body;
        email = email.trim();
    
        try {
            // 🔹 Busca o usuário no banco
            const user = await User.findByEmail(email);
            if (!user) {
                return res.render('login', { error: 'Usuário não encontrado' });
            }
    
            // 🔹 Verifica a senha
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.render('login', { error: 'Senha incorreta' });
            }
    
            // 🔹 Atualiza o status do usuário se o plano expirou
            const userStatus = await User.checkExpiration(user.id); // Atualiza se necessário
    
            // 🔹 Armazena o usuário na sessão
            req.session.user = {
                id: user.id,
                email: user.email,
                username: user.username || "Usuário",
                plan_type: user.plan_type,
                user_status: userStatus // Armazena o status atualizado
            };
    
            console.log("✅ Usuário salvo na sessão:", req.session.user);
    
            // 🔹 Força o salvamento da sessão para evitar erros
            req.session.save((err) => {
                if (err) {
                    console.error("❌ Erro ao salvar sessão:", err);
                    return res.render('login', { error: 'Erro ao salvar sessão. Tente novamente.' });
                }
    
                // 🔹 Se o usuário estiver expirado, redireciona para upgrade
                if (userStatus === 'expired') {
                    return res.redirect('/upgrade?error=Seu período de teste expirou. Escolha um plano para continuar.');
                }
    
                res.redirect('/dashboard');
            });
    
        } catch (err) {
            console.error('❌ Erro inesperado no login:', err);
    
            // 🔹 Evita que o site quebre em caso de erro inesperado
            res.render('login', { error: 'Erro inesperado durante o login. Tente novamente.' });
        }
    },
    // 🔹 Middleware para Verificar Token de Lembrança
    checkRememberMe: async (req, res, next) => {
        console.log("🔍 Middleware checkRememberMe foi chamado.");
    
        if (req.session.user) {
            console.log("✅ Usuário já autenticado:", req.session.user.email);
            return next();
        }
    
        const rememberToken = req.cookies.remember_token;
        if (!rememberToken) {
            console.log("⚠ Nenhum token de lembrar-me encontrado nos cookies.");
            return next();
        }
    
        try {
            console.log("🔎 Buscando usuário com token:", rememberToken);
            const user = await User.findByRememberToken(rememberToken);
    
            if (user) {
                if (moment().isBefore(moment(user.token_expiration))) {
                    console.log("✅ Token válido! Autenticando usuário:", user.email);
                    req.session.user = { id: user.id, email: user.email, username: user.username };
                } else {
                    console.log("❌ Token expirado. Limpando cookie...");
                    res.clearCookie('remember_token');
                }
            } else {
                console.log("❌ Nenhum usuário encontrado para esse token.");
            }
    
            next();
        } catch (err) {
            console.error("❌ Erro ao verificar token de lembrar-me:", err);
            next();
        }
    },
    // 🔹 Adicona uma conta da
    atualizarContaBlaze: async (req, res, next) => {
        const { email, contaBlaze } = req.body;

        try {
            const sucesso = await User.updateContaBlaze(email, contaBlaze);
    
            if (sucesso) {
                res.json({ success: true, message: 'Conta Blaze atualizada com sucesso!' });
            } else {
                res.status(400).json({ success: false, error: 'Usuário não encontrado ou nenhum dado atualizado.' });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    // 🔹 Logout
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("❌ Erro ao encerrar sessão:", err);
                return res.status(500).send("Erro ao encerrar sessão.");
            }
            res.clearCookie('connect.sid'); // Remove o cookie da sessão
            res.redirect('/login'); // Redireciona para a página de login após o logout
        });
    },
    // 🔹 Página de Registro (destrói a sessão antes de renderizar)
    registerPage: (req, res) => {
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('❌ Erro ao destruir a sessão:', err);
                }
                res.clearCookie('connect.sid'); // Remove o cookie da sessão
                res.render('register', { error: req.query.error || null });
            });
        } else {
            res.render('register', { error: req.query.error || null });
        }
    },
    // 🔹 Registro de Usuário (✅ Adicionada)
    register: async (req, res) => {
        let { email, password, plan_type, user_role, user_status } = req.body;
        email = email.trim();

        try {
            if (!email || !password) {
                return res.render('register', { error: 'Email e senha são obrigatórios!' });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.render('register', { error: 'Email inválido!' });
            }

            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.render('register', { error: 'Este email já está em uso!' });
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            const planType = plan_type || 'basic';
            const userRole = user_role || 'user';
            const userStatus = user_status || 'active';

            await User.createUser(email, hashedPassword, planType, userRole, userStatus);

            res.redirect('/login');
        } catch (err) {
            console.error('❌ Erro ao tentar cadastrar o usuário:', err);
            res.render('register', { error: 'Erro ao tentar cadastrar o usuário. Tente novamente.' });
        }
    },
    // 🔹 Middleware para proteger rotas
    requireAuth: async (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/login?error=Você precisa estar logado para acessar essa página.');
        }

        try {
            // 🔹 Buscar conta Blaze associada ao usuário
            const contaBlaze = await User.getBlazeAccount(req.session.user.id);

            // 🔹 Atualiza a sessão apenas se a conta Blaze for encontrada
            if (contaBlaze) {
                req.session.user.conta_blaze = contaBlaze;
            }

            // 🔹 Passa `user` para todas as views automaticamente
            res.locals.user = req.session.user;

            return next();
        } catch (error) {
            console.error("❌ Erro ao carregar conta Blaze:", error);
            return next(); // 🔹 Continua a navegação mesmo com erro
        }
    },
    getUserPlan: async (req, res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Usuário não autenticado." });
            }
    
            // Busca o plano do usuário no banco de dados
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: "Usuário não encontrado." });
            }
    
            res.status(200).json({ success: true, plan_type: user.plan_type || "BASIC" });
        } catch (error) {
            console.error("❌ Erro ao obter plano do usuário:", error);
            res.status(500).json({ success: false, message: "Erro ao obter plano do usuário." });
        }
    },
    // Função para atualizar a meta diária de um usuário
    atualizarMetaDiariaController: async (userId) => {
        try {
            console.log(`🔄 Atualizando a meta diária para o usuário ${userId}...`);
            await User.atualizarMetaDiaria(userId);  // Chama o model para atualizar a meta diária
        } catch (error) {
            console.error("❌ Erro ao atualizar a meta diária no Controller:", error);
        }
    }

    
};
