const Strategy = require('../models/strategyModel');

module.exports = {
    // Cria uma nova estratégia
    createStrategy: async (req, res) => {
        let { strategyName, sequence, betBlackRed, color, stopWin, stopLoss, galeAmount, betWhite, userId } = req.body;
    
        // Se o userId não veio no body, tenta pegar da sessão
        if (!userId && req.session.user) {
            userId = req.session.user.id;
        }
    
        console.log('📌 Criando estratégia para o usuário ID:', userId);
    
        try {
            // Validação básica dos dados de entrada
            if (!strategyName || !sequence || !userId) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Nome da estratégia, sequência e userId são obrigatórios." 
                });
            }
    
            // Converte a sequência para um array, se necessário
            const sequenceArray = Array.isArray(sequence) ? sequence : sequence.split(' -> ');
            const sequenceJSON = JSON.stringify(sequenceArray);
            function formatValue(value) {
                // Se o valor for uma string, transforme em um array
                if (typeof value === 'string') {
                    return [value];
                }
                // Se já for um array, retorne-o diretamente
                return value;
            }
            const formattedValue1 = formatValue(color); // ["red"]
            // Define o valor padrão para betWhite, se não fornecido
            const betWhiteAmount = betWhite ? betWhite : "0";
    
            // Cria a estratégia no banco de dados
            const strategyId = await Strategy.create({
                user_id: userId,
                name: strategyName,
                sequence: sequenceJSON,
                bet_amount: betBlackRed,
                chosen_color: formattedValue1,
                stop_win: stopWin,
                stop_loss: stopLoss,
                gale_amount: galeAmount,
                bet_white_amount: betWhiteAmount,
                status: 'inactive',
            });
    
            console.log('✅ Estratégia criada com sucesso! ID:', strategyId);
    
            // 🔹 Verifica se a requisição foi feita via API (JSON) ou por um formulário (HTML)
            if (req.headers.accept && req.headers.accept.includes("application/json")) {
                return res.json({ 
                    success: true, 
                    data: { strategyId }, 
                    message: "Estratégia criada com sucesso." 
                });
            }
    
            // 🔹 Se for uma requisição do navegador (formulário), redireciona para a página de estratégias
            return res.redirect('/strategies');
    
        } catch (error) {
            console.error('❌ Erro ao criar estratégia:', error);
    
            if (req.headers.accept && req.headers.accept.includes("application/json")) {
                return res.status(500).json({ 
                    success: false, 
                    error: error.message || "Erro ao criar estratégia." 
                });
            }
    
            return res.redirect('/strategies?error=Erro ao criar estratégia.');
        }
    },
    // Obtém as estratégias do usuário
    getStrategies: async (req, res) => {
        //console.log('🚀 Acessando página de estratégias...');

        // Verifica se o usuário está autenticado
        if (!req.session.user) {
            console.log('🔴 Usuário não autenticado, redirecionando para login...');
            return res.status(401).json({ 
                success: false, 
                error: "Usuário não autenticado." 
            });
        }

        const userId = req.session.user.id;
        console.log(`🔎 Buscando estratégias para o usuário ID: ${userId}`);

        try {
            // Busca as estratégias no banco de dados
            const strategies = await Strategy.getByUserId(userId);
        
            //console.log('✅ Estratégias encontradas:', strategies[0]);
        
            // 🔹 Se a requisição for via navegador (HTML), renderiza a página
            if (req.headers.accept && req.headers.accept.includes("text/html")) {
                return res.render('strategies', { strategies, userId });
            }
        
            // 🔹 Se for uma requisição AJAX ou API, retorna JSON
            return res.json({ 
                success: true, 
                data: { strategies: strategies || [] } 
            });
        
        } catch (error) {
            console.error('❌ Erro ao buscar estratégias:', error);
        
            if (!res.headersSent) {
                return res.status(500).json({ 
                    success: false, 
                    error: error.message || "Erro ao buscar estratégias." 
                });
            }
        }
        
    },
    // Atualiza o status de uma estratégia
    updateStatus: async (req, res) => {
        const { strategyId, status } = req.body;

        try {
            // Validação básica dos dados de entrada
            if (!strategyId || !status) {
                return res.status(400).json({ 
                    success: false, 
                    error: "strategyId e status são obrigatórios." 
                });
            }

            // Atualiza o status da estratégia no banco de dados
            const result = await Strategy.updateStatus(strategyId, status);

            res.json({ 
                success: true, 
                data: result, 
                message: "Status da estratégia atualizado com sucesso." 
            });

        } catch (error) {
            console.error('❌ Erro ao atualizar status da estratégia:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message || "Erro ao atualizar status da estratégia." 
            });
        }
    },
    getUserStrategyCount: async (req, res) => {
        try {
            const user_id = req.session.user?.id; // Obtém o ID do usuário logado
            if (!user_id) {
                return res.status(401).json({ success: false, message: "Usuário não autenticado." });
            }
    
            // Conta o número de estratégias do usuário
            const [result] = await Strategy.countUserStrategies(user_id);
    
            res.status(200).json({
                success: true,
                strategyCount: result.count || 0
            });
    
        } catch (error) {
            console.error("❌ Erro ao contar estratégias:", error);
            res.status(500).json({ success: false, message: "Erro ao contar estratégias." });
        }
    },
    deleteStrategy: async (req, res) => {
        try {
            const strategyId = req.params.id;
            const userId = req.session.user?.id; // Obtém o ID do usuário logado
    
            if (!userId) {
                return res.status(401).json({ success: false, message: "Usuário não autenticado." });
            }
    
            // Verifica se a estratégia pertence ao usuário
            const strategy = await Strategy.findById(strategyId);
            if (!strategy || strategy.user_id !== userId) {
                return res.status(403).json({ success: false, message: "Acesso negado." });
            }
    
            // Remove a estratégia do banco
            await Strategy.deleteById(strategyId);
            res.status(200).json({ success: true, message: "Estratégia removida com sucesso." });
    
        } catch (error) {
            console.error("❌ Erro ao excluir estratégia:", error);
            res.status(500).json({ success: false, message: "Erro ao excluir estratégia." });
        }
    }
};