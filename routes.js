const express = require('express');
const router = express.Router();
const cheerio = require("cheerio");
const axios = require("axios");
// 🔹 Importando corretamente os controllers
const homeController = require("./controllers/homeController");
const authController = require("./controllers/authController");
const blazeAuthController = require("./controllers/blazeAuthController");
const strategyController = require("./controllers/strategyController");
const LogModel = require('./models/logModel');
const User = require('./models/userModel');
const blazeService = require('./services/blazeService'); 

// 🔹 Verificando se os controllers estão indefinidos
if (!homeController || !authController || !blazeAuthController || !strategyController) {
    console.error("❌ Erro: Um ou mais controllers não foram importados corretamente.");
    process.exit(1); // Sai do programa se houver erro
}

// 🔹 Rotas da Página Web
//router.get('/', (req, res) => {
//   res.render('dashboard'); 
//});
router.get('/', (req, res) => {
    // Serve o index.html que está na raiz do projeto
    res.sendFile(path.join(__dirname, '..', 'index.html'));  // Ajuste o caminho para a raiz
});

router.get('/login', authController.loginPage);
router.post('/login', authController.login);

router.get('/register', authController.registerPage);
router.post('/register', authController.register);

// 🔹 Rotas protegidas (Usuário precisa estar logado)
router.get('/dashboard', authController.requireAuth, (req, res) => {
    console.log("🔍 Sessão ao acessar /dashboard:", req.session);
    
    if (!req.session.user) {
        console.log("⚠ Sessão vazia! Redirecionando para login...");
        return res.redirect('/login');
    }

    res.render('dashboard', { user: req.session.user });
});


//🔹 Rotas para Estrategias
router.get('/strategies', authController.requireAuth, strategyController.getStrategies);
router.post('/strategies/save', authController.requireAuth, strategyController.createStrategy);
router.get("/user/strategy-count", strategyController.getUserStrategyCount);
router.delete("/strategy/delete/:id", strategyController.deleteStrategy);
router.post('/update-status', authController.requireAuth, strategyController.updateStatus);


// Rotas usuario
router.get("/user/plan", authController.getUserPlan);

router.get('/start', authController.requireAuth, async (req, res) => {
    try {
        
        // 🔹 Verifica se há um usuário autenticado na sessão
        if (!req.session?.user?.id) {
            console.warn("⚠ Tentativa de acesso sem sessão ativa.");
            return res.redirect('/login?error=Faça login para acessar esta página.');
        }
        await blazeService.atualizarMetasParaUsuarios(req.session.user.id);
        // 🔹 Busca os dados atualizados do usuário no banco
        const user = await User.findById(req.session.user.id);

        if (!user) {
            console.warn("⚠ Usuário não encontrado no banco de dados:", req.session.user.id);
            return res.redirect('/login?error=Usuário não encontrado.');
        }

        // 🔹 Garante que a resposta sempre contenha um objeto user válido
        res.render('start', { 
            user: user ?? {}, // Garante que 'user' nunca será undefined ou null
            error: null, 
            success: null 
        });

    } catch (error) {
        console.error("❌ Erro ao carregar dados do usuário para /start:", error.message);
        res.redirect('/login?error=Erro ao carregar seus dados. Tente novamente.');
    }
});
router.post("/auth/login", blazeAuthController.login);

router.post('/set-blaze-account', authController.requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const { emailBlaze, password_blaze, confirma_password_blaze } = req.body;

    if (!emailBlaze) {
        return res.render('profile', { user: req.session.user, error: "O e-mail da Blaze é obrigatório!" });
    }

    if (password_blaze || confirma_password_blaze) {
        if (!password_blaze || !confirma_password_blaze) {
            return res.render('profile', { user: req.session.user, error: "Ambos os campos de senha são obrigatórios!" });
        }

        if (password_blaze !== confirma_password_blaze) {
            return res.render('profile', { user: req.session.user, error: "As senhas não coincidem!" });
        }
    }

    try {
        // 🔍 Verifica se o e-mail da Blaze já está vinculado a outro usuário
        const emailExists = await User.checkBlazeEmailExists(emailBlaze, userId);

        if (emailExists) {
            return res.render('profile', { 
                user: req.session.user, 
                error: "Este e-mail da Blaze já está vinculado a outra conta!" 
            });
        }

        let result;
        if (password_blaze) {
            // Se uma senha for enviada, atualiza e-mail + senha
            result = await User.setBlazeAccountWithPassword(userId, emailBlaze, password_blaze);
        } else {
            // Se não houver senha, atualiza apenas o e-mail
            result = await User.setBlazeAccount(userId, emailBlaze);
        }

        if (result) {
            req.session.user.conta_blaze = emailBlaze;
            return res.render('profile', { 
                user: req.session.user, 
                success: "Conta Blaze vinculada e senha atualizada com sucesso!" 
            });
        } else {
            return res.render('profile', { 
                user: req.session.user, 
                error: "Erro ao vincular a conta Blaze." 
            });
        }
    } catch (error) {
        console.error("❌ Erro ao vincular conta Blaze:", error);
        return res.render('profile', { 
            user: req.session.user, 
            error: "Erro interno ao tentar vincular a conta Blaze." 
        });
    }
});

router.get('/logout', authController.logout);

router.get('/logs', authController.requireAuth, async (req, res) => {
    try {
        const logs = await LogModel.getUserLogs(req.session.user.id);
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, error: "Erro ao buscar logs." });
    }
});
router.post('/start-checking', (req, res) => {
    // Chama a função startChecking com o email e id do usuário
    blazeService.startChecking(req.session.user.email, req.session.user.id);
});
router.get('/profile', authController.requireAuth, (req, res) => {
    res.render('profile', { user: req.session.user });
});
router.get('/get-latest-doubles', async (req, res) => {
    try {
        const doubles = await blazeService.getDoubles(); // Método que retorna os doubles armazenados
        
        if (!doubles) {
            return res.status(500).json({ success: false, message: "Erro ao obter os últimos doubles." });
        }

        res.json({ success: true, doubles });
    } catch (error) {
        console.error("❌ Erro ao buscar últimos doubles:", error);
        res.status(500).json({ success: false, message: "Erro ao buscar os últimos doubles." });
    }
});
router.get('/get-latest-logs', async (req, res) => {
    try {
        const logs = await LogModel.getLatestLogs(15); // Busca os últimos 15 logs
        res.json({ success: true, logs });
    } catch (error) {
        console.error("❌ Erro ao buscar logs:", error);
        res.json({ success: false, message: "Erro ao buscar logs." });
    }
});
// 🔹 Atualiza o status `is_running` no banco
router.post("/auth/update-status", async (req, res) => {
    const { is_running } = req.body;
    const userId = req.session.user?.id; // Obtém o ID do usuário logado

    if (!userId) {
        return res.status(401).json({ success: false, message: "Usuário não autenticado." });
    }

    try {
        // 🔹 Atualiza o status no banco pelo modelo de usuário
        await User.updateRunningStatus(userId, is_running);
        //console.log(`✅ is_running atualizado para ${is_running} para o usuário ${userId}.`);

        return res.status(200).json({
            success: true,
            message: `Status atualizado para ${is_running === 1 ? "Rodando" : "Pausado"}.`
        });

    } catch (error) {
        console.error("❌ Erro ao atualizar status:", error);
        return res.status(500).json({ success: false, message: "Erro ao atualizar status." });
    }
});
router.get("/check-running-status", async (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Usuário não autenticado." });
    }

    try {
        const user = await User.findById(userId); // Busca o usuário no banco
        return res.status(200).json({ success: true, isRunning: user.is_running === 1 });

    } catch (error) {
        console.error("❌ Erro ao buscar status:", error);
        return res.status(500).json({ success: false, message: "Erro ao buscar status." });
    }
});
router.get("/blaze-content", async (req, res) => {
    try {
        const url = "https://blaze.bet.br/pt/games/double";
        const response = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });

        let modifiedHtml = response.data;

        // 🔹 Injeta um script que fecha o popup automaticamente
        modifiedHtml = modifiedHtml.replace(
            "</body>",
            `
            <script>
                document.addEventListener("DOMContentLoaded", function() {
                    setTimeout(() => {
                        let popupButton = document.querySelector("#policy-regulation-popup div div:nth-child(2) div button");
                        if (popupButton) {
                            console.log("✅ Fechando popup...");
                            popupButton.click();
                        } else {
                            console.log("❌ Botão de fechar popup não encontrado.");
                        }
                    }, 3000); // Aguarda 3 segundos antes de tentar clicar
                });
            </script>
            </body>`
        );

        res.send(modifiedHtml);
    } catch (error) {
        console.error("❌ Erro ao buscar conteúdo da Blaze:", error.message);
        res.status(500).send("Erro ao obter conteúdo.");
    }
});
// Rota para atualizar a meta diária de um usuário específico
router.post('/update-meta/:userId', authController.requireAuth, async (req, res) => {
    const userId = req.params.userId; // Pega o userId da URL
    try {
        await atualizarMetaDiaria(userId); // Chama a função para atualizar a meta
        res.send(`✅ Meta diária do usuário ${userId} atualizada com sucesso!`);
    } catch (error) {
        res.status(500).send("❌ Erro ao atualizar a meta diária.");
    }
});

module.exports = router;
