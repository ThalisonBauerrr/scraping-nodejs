const BlazeAuth = require("../api");
const LogModel = require("../models/logModel");
const Strategy = require('../models/strategyModel');
const User = require("../models/userModel");
const DoublesModel = require('../models/doublesModel');
const BetsModel = require('../models/betsModel');
const UserConfig = require('../models/userConfigurationsModel');
const axios = require("axios"); // 🔹 Importação correta do Axios

class BlazeService {
    constructor() {
        this.auth = null; 
        this.isLoggedIn = false; // Flag para impedir múltiplos logins
        this.isCheckingDoubles = false; // Flag para impedir múltiplas verificações
        this.lastDoublesId = null;
        this.intervalId = null;
        this.blazeAuth = new BlazeAuth(); // ✅ Sempre inicializado no construtor
        
    }

    // 🔹 Faz login na Blaze apenas se necessário
    async login(username, password) {
        try {
            this.auth = new BlazeAuth(username, password);
            const token = await this.auth.login();
            
            //console.log(username,password)
            if (!token) throw new Error("Falha no login da Blaze.");

            // 🔹 Atualiza o token no banco de dados
            await User.updateBlazeToken(username, token);

            this.isLoggedIn = true;
            //console.log("✅ Login na Blaze bem-sucedido!");
        } catch (error) {
            console.error("❌ Erro no login da Blaze:", error);
            throw error;
        }
    }
    async getUserInfo() {
        if (!this.isLoggedIn) throw new Error("Usuário não autenticado na Blaze.");
    
        try {
            const userInfo = await this.auth.getUserinfo();
            if (!userInfo || !userInfo.username || !userInfo.balance) {
                throw new Error("Dados do usuário incompletos.");
            }
    
            //console.log(`✅ Dados do usuário da Blaze: ${userInfo.username}, Saldo: R$ ${userInfo.balance}`);
            return userInfo;
        } catch (error) {
            console.error("❌ Erro ao obter informações do usuário da Blaze:", error);
            throw error;
        }
    }
    // 🔹 Método para verificar o status da Blaze
    async getStatusRoletta() {
        try {
            //console.log("📌 Verificando status da Blaze...");

            if (!this.auth) {
                throw new Error("⚠️ Faça login antes de verificar o status.");
            }

            // Obtém o status da Blaze
            const status = await this.auth.getStatus();

           // console.log(`✅ Status Atual da Blaze: ${status || "Erro ao obter status"}`);

            // Se o status for "waiting", retorna true
            if (status === "waiting") {
                //console.log("🔄 Status é 'waiting'. Iniciando verificação dos doubles...");
                return true;
            }

            return false; // Retorna false se o status não for "waiting"

        } catch (error) {
            //console.error("❌ Erro ao verificar status da Blaze:", error);
            throw error;
        }
    }
    // 🔹 Função para obter os últimos doubles e salvar no banco de dados
    async getDoubles() {
        try {
            const doubles = await this.auth.getLastDoubles(); // Chama a função que já existe para pegar os doubles
    
            if (doubles && doubles[0]) {
                const currentDouble = doubles[0];
    
                // Verifique se já existe o ID para evitar duplicações
                const existingDouble = await DoublesModel.findByDoubleId(currentDouble.id);
                if (!existingDouble) {
                    // Não associar um user_id ao double, pois ele é universal
                    await DoublesModel.insert({
                        double_id: currentDouble.id,
                        color: currentDouble.color,
                        roll: currentDouble.roll  // Aqui está o campo `roll`
                    });
    
                    // Mapeia o valor da cor para um emoji
                    const colorEmoji = {
                        0: '⬜', // Branco
                        1: '🟥', // Vermelho
                        2: '⬛'  // Preto
                    };
    
                    // Formata a data e hora para um formato mais legível
                    const formattedDate = new Date(currentDouble.created_at).toLocaleString();
                    console.log(`\n🎰 Double ID: ${currentDouble.id} | Cor: ${colorEmoji[currentDouble.color]} | Roll: ${currentDouble.roll} | Hora: ${formattedDate}`);
    
                        // Atualiza as estatísticas conforme a cor sorteada
                        if (currentDouble.color === 0) { // Branco
                            await DoublesModel.updateStats(0);  // Passando apenas a cor sorteada
                        } else if (currentDouble.color === 1) { // Vermelho
                            await DoublesModel.updateStats(1);  // Passando apenas a cor sorteada
                        } else if (currentDouble.color === 2) { // Preto
                            await DoublesModel.updateStats(2);  // Passando apenas a cor sorteada
                        }
    
                    await this.processDoublesAndCheckStrategies(currentDouble);
                }
            }
    
            return doubles;  // Retorna os doubles (agora armazenados no banco)
        } catch (error) {
            console.error("❌ Erro ao obter últimos doubles:", error);
            return null;
        }
    }
    // 🔹 Parar a verificação de doubles
    async stopChecking(userId) {
        if (this.intervalId) {
            console.log("🛑 Parando a verificação dos doubles...");
            clearInterval(this.intervalId);  // Interrompe o setInterval
            this.isCheckingDoubles = false;  // Reseta o flag

            // Atualiza o status do usuário para parar a execução
            await User.updateRunningStatus(userId, 0);
            console.log("✅ Status do usuário atualizado para inativo.");
        }
    }
    // 🔹 Método para iniciar a verificação periódica dos doubles
    async startChecking() {
        if (!this.isLoggedIn || !this.auth || !this.auth.token) {
            //console.error("❌ Usuário não autenticado na Blaze. Tentando login novamente...");
            try {
                await this.login(process.env.API_USERNAME, process.env.API_PASSWORD);
                console.log("💻 Logado com a conta do servidor")
            } catch (error) {
                console.error("❌ Erro ao tentar relogar na Blaze:", error);
                return null; // Evita crash caso o login falhe
            }
        }
        if (this.isCheckingDoubles) {
            return;
        }
        this.isCheckingDoubles = true;
        this.intervalId = setInterval(async () => {
            try {

                const isWaiting = await this.getStatusRoletta();

                if (isWaiting) {
                    await this.getDoubles(); 
                } else {
                    //console.log("⏸ Status não é 'waiting'. Ignorando busca de doubles...");
                }

            } catch (error) {
                //console.error("❌ Erro durante a verificação periódica:", error);
            }
        }, 2000); // Intervalo de 5 segundos
    }
    async atualizarMetasParaUsuarios(userId){
        try {
            const infoUser = await this.getUserInfo()
            console.log(`💰 Saldo atualizado para o usuário com ID ${userId}: R$ ${parseFloat(infoUser.balance).toFixed(3)}`);
            await User.updateUserBalance(userId,infoUser.balance);
            await User.atualizarMetaDiaria(userId);  // Atualiza a meta diária do usuário
            //console.log(`Meta diária atualizada para o usuário ${userId}`);
        } catch (error) {
            console.error("Erro ao tentar atualizar a meta diária:", error);
        }
    };
    // 🔹Retomando verificações de usuários ativos...
    async resumeActiveSessions() {
        console.log("🔄 Retomando verificações de usuários ativos...");

        try {
            const activeUsers = await User.getUsersRunning(); // Obtém os usuários com is_running = 1

            for (let user of activeUsers) {
                console.log(`✅ Retomando verificação para: ${user.email}`);
                await this.startChecking(user.email, user.id); // Retoma a verificação para cada usuário ativo
                await this.atualizarMetasParaUsuarios(user.id);
            }

        } catch (error) {
            console.error("❌ Erro ao retomar sessões ativas:", error);
        }
    }
    // 🔹 Função chamada ao iniciar o servidor para garantir que os doubles sejam processados e as estratégias verificadas
    async initializeOnServerStart() {
        console.log("🚀 Iniciando o processo de verificação dos doubles e das estratégias...");

        // Inicia o processo de verificação contínua de doubles
        await this.startChecking();

        // Retoma as sessões de usuários ativos
        await this.resumeActiveSessions();
    }
    // 🔹 Função para processar os doubles e verificar as estratégias
    async processDoublesAndCheckStrategies(currentDouble) {
        try {
            // Mapeia as cores da estratégia para os valores dos doubles
            const colorMap = { 
                0: "white",  // 0 => white
                1: "red",    // 1 => red
                2: "black"   // 2 => black
            };
    
            // Pega todos os doubles salvos no banco
            const doubles = await DoublesModel.getLastDoubles();
    
            if (!doubles || doubles.length === 0) {
                console.log("❌ Nenhum double encontrado.");
                return;
            }
    
            // Pega todos os usuários com estratégia ativa
            const activeUsers = await User.getUsersRunning();
            
            // Itera sobre cada usuário ativo e verifica suas estratégias
            for (const user of activeUsers) {
                if (!user || !user.id) {
                    console.log(`❌ Usuário não encontrado ou id não definido.`);
                    continue;
                }
                await User.atualizarMetaDiaria(user.id);
                // Encontre todas as estratégias ativas do usuário
                const activeStrategies = await Strategy.findActiveStrategies(user.id); // Atualizado para buscar várias estratégias
                if (!activeStrategies || activeStrategies.length === 0) {
                    console.log(`❌ Nenhuma estratégia ativa para o usuário: ${user.email}`);
    
                    // Atualiza o is_running para 0, já que não há estratégias ativas
                    await User.updateRunningStatus(user.id, 0);  // Atualiza o campo is_running para 0
                    continue;
                }
    
                console.log(`✅ Verificando estratégias para o usuário: ${user.email}`);
                
                // Itera sobre cada estratégia ativa do usuário
                for (const activeStrategy of activeStrategies) {
                    // Verifica se a estratégia já está ativa antes de qualquer coisa
                    if (activeStrategy.betting_status === 'active') {
                        // Se a estratégia já está ativa, processa o resultado sem fazer nova aposta
                        console.log(`🔄 Estratégia já ativa para o usuário: ${user.email}`);
                        await this.processBetResult(user, activeStrategy, currentDouble, activeStrategy.chosen_color, activeStrategy.modo);
                        continue; // Pula o restante do processamento
                    }
    
                    let sequenceMatches = false;
                    const strategyMode = activeStrategy.modo;
                    const nextBetAfterGreen = activeStrategy.next_bet_after_green;
                    const currentDate = new Date();
    
                    // Verifica se a aposta deve ser feita, ou seja, se a hora atual é maior ou igual ao next_bet_after_green
                    if (nextBetAfterGreen && new Date(nextBetAfterGreen) > currentDate) {
                        continue; // Pula essa estratégia, já que não é hora de apostar
                    }
    
                    // A partir daqui, a estratégia não está ativa, então processa a aposta de acordo com o modo
                    if (strategyMode === 0) {
                        // Lógica de comparação para modo 0
                        if (activeStrategy.sequence) {
                            const strategySequence = JSON.parse(activeStrategy.sequence); // Convertendo de string para array
    
                            // Mapeando os doubles para as cores que a estratégia usa
                            const colorHistory = doubles.slice(0, strategySequence.length).map(double => {
                                return colorMap[double.color]; // Ex: 1 => "red"
                            });
    
                            // Verifica se a quantidade de doubles corresponde à quantidade da sequência
                            if (colorHistory.length === strategySequence.length) {
                                // Verifica se as cores estão na mesma ordem
                                sequenceMatches = colorHistory.every((color, index) => color === strategySequence[index]);
                            }
    
                            // Se a sequência dos doubles corresponde à estratégia, faz a aposta
                            if (sequenceMatches) {
                                console.log(`\n🎲 Doubles corresponde à estratégia do usuário: ${user.email} | Estratégia ID: ${activeStrategy.id}`);
    
                                // Marca a estratégia como 'active' para evitar múltiplas apostas ao mesmo tempo
                                await Strategy.updateBettingStatus(activeStrategy.id, 'active');
                                await this.createBet(user, activeStrategy, currentDouble, activeStrategy.bet_amount, activeStrategy.chosen_color, activeStrategy.modo);
                                await this.processBetResult(user, activeStrategy, currentDouble, activeStrategy.chosen_color, activeStrategy.modo); // Inicia a aposta
                            }
                        }
                    }else if(strategyMode === 1 || strategyMode === 2){
                        // No modo 1, o campo sequence é uma string com o número de rodadas sem branco
                        const currentStats = await DoublesModel.findByDate(new Date().toISOString().split('T')[0]); // Obtém as estatísticas do dia
                        const no_white = currentStats && currentStats[0] ? currentStats[0].no_white : 0;
    
                        // Converte a string 'sequence' para número inteiro
                        const requiredRoundsWithoutWhite = parseInt(activeStrategy.sequence, 10);
                        const lastDoubleColor = colorMap[currentDouble.color];
                        // Verifica se a quantidade de rodadas sem branco é maior ou igual ao valor de sequence na estratégia
                        if(strategyMode === 1){
                            if (no_white >= requiredRoundsWithoutWhite) {
                                console.log(`🎲 Número de rodadas sem branco (${no_white}) atingiu a sequência da estratégia: ${user.email} | Estratégia ID: ${activeStrategy.id}`);
                                
                                // Marca a estratégia como 'active' para evitar múltiplas apostas ao mesmo tempo
                                await Strategy.updateBettingStatus(activeStrategy.id, 'active');
                                await this.createBet(user, activeStrategy, currentDouble, activeStrategy.bet_amount, activeStrategy.chosen_color, activeStrategy.modo);
                                await this.processBetResult(user, activeStrategy, currentDouble, activeStrategy.chosen_color, activeStrategy.modo); // Inicia a aposta
                            }
                        }else if(strategyMode === 2){
                            if (no_white >= requiredRoundsWithoutWhite && lastDoubleColor === "white" ) {
                                console.log(`🎲 Número de rodadas sem branco (${no_white}) atingiu a sequência da estratégia: ${user.email} | Estratégia ID: ${activeStrategy.id}`);
                                
                                // Marca a estratégia como 'active' para evitar múltiplas apostas ao mesmo tempo
                                await Strategy.updateBettingStatus(activeStrategy.id, 'active');
                                await this.createBet(user, activeStrategy, currentDouble, activeStrategy.bet_amount, activeStrategy.chosen_color, activeStrategy.modo);
                                await this.processBetResult(user, activeStrategy, currentDouble, activeStrategy.chosen_color, activeStrategy.modo); // Inicia a aposta
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("❌ Erro ao processar doubles e verificar estratégias:", error);
        }
    }
    // Função para calcular a aposta no Martingale com 4% de lucro sobre o valor investido
    async calcularApostaPorIndice(lucroDesejado, indice) {
        let perdaAcumulada = 0;
        const multiplicador = 14;
        let aposta;
    
        for (let i = 1; i <= indice; i++) {
            aposta = (lucroDesejado + perdaAcumulada) / (multiplicador - 1);
            aposta = Math.max(aposta, 0.10); // Garante que a aposta seja no mínimo R$ 0,10
            perdaAcumulada += aposta;
        }
    
        return aposta;  // Retorna o valor da aposta formatado com duas casas decimais
    }
    // Função para calcular a aposta no Martingale, agora com 4% de lucro
    async calcularApostaMartingale(betAmount, gale, modo) {
        switch (modo) {
            case 0:
                return (betAmount * Math.pow(2, gale)).toFixed(3); // Arredonda para 2 casas decimais
            case 1:
                let lucroDesejado = 2;
                let valorAposta = await this.calcularApostaPorIndice(lucroDesejado, gale+1);
                return valorAposta.toFixed(3)
        }
    }

    async obterTokenBlaze(userId) {
        let token = await User.getBlazeTokenByUserId(userId);

        if (!token) {
            throw new Error(`❌ Usuário ${userId} não tem token salvo no banco.`);
        }
        try {
            await axios.get("https://blaze.bet.br/api/users/me", {
                headers: {
                    "Authorization": `Bearer ${token.trim()}`,
                    "Content-Type": "application/json"
                }
            });
            //console.log("✅ Token válido. Prosseguindo com a aposta...");
            return token;
        } catch (error) {
            console.error(`❌ Token inválido ou expirado: ${error.response?.data?.message || error.message}`);
            throw new Error("Token inválido ou expirado. O usuário precisa logar novamente.");
        }
    }
    async setBet(userId, amount, color) {
        try {
            // 🔹 Garante que o token seja válido
            const token = await this.obterTokenBlaze(userId);
            const dados = await this.getUserInfo(); // Pega username e wallet_id
            
            const colorMap = {
                "white": 0,
                "red": 1,
                "black": 2
            };
            
            const colorsArray = JSON.parse(color); // Converte JSON para array
            let betResults = []; // Armazena os resultados das apostas
    
            // 🔹 Função para realizar a aposta
            const placeBet = async (cor) => {
                return await this.blazeAuth.placeBetWhenWaiting(
                    amount,
                    cor,
                    dados.currency_type,
                    dados.rank,
                    dados.username,
                    dados.wallet_id,
                    1, // room_id fixo (1)
                    token
                );
            };
    
            // 🔹 Faz apostas para todas as cores informadas
            for (const cor of colorsArray) {
                const betResult = await placeBet(colorMap[cor]); // Converte string para número e aposta
                betResults.push(betResult); // Armazena o resultado
            }
    
            if (betResults.length > 0) {
                console.log(`🎰 Aposta realizada com sucesso para o usuário ${userId}! | Valor: ${amount} 💰`);
                return { success: true, data: betResults };
            } else {
                console.error(`❌ Falha ao realizar aposta.`);
                return { success: false, message: "Erro ao realizar aposta." };
            }
        } catch (error) {
            console.error("❌ Erro ao tentar apostar:", error);
            return { success: false, message: "Erro inesperado ao apostar." };
        }
    }
    // Cria uma aposta na tabela `bets`
    async createBet(user, strategy, currentDouble, betAmount, chosenColor,modo) {
        try {
            const bet = {
                user_id: user.id,
                strategy_id: strategy.id,
                double_id: currentDouble.id,
                chosen_color: chosenColor,
                bet_amount: betAmount,
                bet_status: 'pending',
                modo:modo,
                gale: 0
            };

            const betId = await BetsModel.insert(bet);
            console.log(`📝 Aposta realizada: User ID: ${bet.user_id} | Strategy ID: ${bet.strategy_id} | Double ID: ${bet.double_id} | Cor Escolhida: ${chosenColor}`);
            return betId;
        } catch (error) {
            console.error("❌ Erro ao criar aposta:", error);
        }
    }
    // Função auxiliar para obter a cor do double
     getColorFromDouble(colorNumber) {
        const colorMap = { 0: "white", 1: "red", 2: "black" };
        return colorMap[colorNumber] || "unknown";
    }
    async processBetResult(user, strategy, currentDouble, chosenColor, modo) {
        try {
            const { betId, betStatus, gale } = await BetsModel.getLastDoubleIdAndColorByStrategy(strategy.id);
            const bettingStatus = await Strategy.getStrategyStatus(strategy.id);
            const infoUser = await this.getUserInfo()
            
            if (bettingStatus !== "active") return;
    
            const lastDoubleColor = this.getColorFromDouble(currentDouble.color); // Cor sorteada
            const colorsArray = JSON.parse(chosenColor); // Array das cores escolhidas
            const apostaVencedora = colorsArray.includes(lastDoubleColor); // Verifica se a cor sorteada está nas cores escolhidas
            const limiteGaleAtingido = gale >= strategy.gale_amount; // Verifica se o Gale atingiu o limite máximo
            const betAmount = strategy.bet_amount;
            //console.log("---"+user.lossAccumulator)
            //console.log("---"+user.recuperation)
            // Ajusta o valor da aposta com base no Gale
            let adjustedBetAmount;
            if (user.recuperation === 1 && user.lossAccumulator > 0 && modo === 0) {
                // Quando recuperation é 1 e lossAccumulator é maior que 0, ajustamos com lossAccumulator
                adjustedBetAmount = await this.calcularApostaMartingale(user.lossAccumulator, gale, modo);
                adjustedBetAmount = parseFloat(adjustedBetAmount).toFixed(3); // Garantir que seja um número
            } else {
                // Caso contrário, usamos o betAmount padrão
                adjustedBetAmount = await this.calcularApostaMartingale(betAmount, gale, modo);
                adjustedBetAmount = parseFloat(adjustedBetAmount).toFixed(3); // Garantir que seja um número
            }
            if (betStatus === "pending") {
                // Aposta inicial ou aumento de Gale
                await BetsModel.incrementarGale(betId); // Incrementa o Gale
                await this.setBet(user.id, adjustedBetAmount, chosenColor); // Faz a aposta
                await BetsModel.updateBetStatus(betId, "going"); // Atualiza o status da aposta para 'going'
                    
            } else if (betStatus === "going") {
                // Se a aposta foi ganha
                if (apostaVencedora) {
                    console.log(`\n🏆 Aposta ganha! Cor sorteada: ${lastDoubleColor} → Escolhida: ${colorsArray.join(" ou ")}`);
                    await BetsModel.updateBetStatus(betId, 'winner'); // Marca a aposta como vencedora
                    await Strategy.updateBettingStatus(strategy.id, 'inactive'); // Marca a estratégia como inativa
                    await this.processGreenAndScheduleNextBet(strategy.id); // Processa o verde e agenda a próxima aposta
                    
                    // Zera o lossAccumulator após o green (vitória)
                    await User.updateUserLossAccumulator(user.id, 0);  // Aqui estamos setando diretamente para 0, não somando
                    
                    await User.updateUserBalance(user.id,infoUser.balance);
                    await UserConfig.setUserStatusForStopWin(user.id, infoUser.balance);

                } else {
                    // Caso a aposta tenha sido perdida
                    if (limiteGaleAtingido) {
                        console.log(`❌ [MARTINGALE] Limite máximo de ${strategy.gale_amount} atingido! 🚨 Aposta encerrada como perdedora. ❌`);
                        await BetsModel.updateBetStatus(betId, 'loss'); // Marca a aposta como perdida
                        await Strategy.updateBettingStatus(strategy.id, 'inactive'); // Marca a estratégia como inativa
                        await this.processGreenAndScheduleNextBet(strategy.id); // Processa o verde e agenda a próxima aposta
                        await User.updateUserLossAccumulator(user.id, adjustedBetAmount);
                        await User.updateUserBalance(user.id,infoUser.balance);
                        await UserConfig.setUserStatusForStopLoss(user.id, infoUser.balance);
                        
                    } else {
                        console.log(`⚠️  Aviso: Cor sorteada [${lastDoubleColor}] não corresponde às cores selecionadas: [${colorsArray.join(" ou ")}]`);
                        const sucesso = await BetsModel.incrementarGale(betId); // Incrementa o Gale na aposta
                        if (sucesso) {
                            console.log(`🎯 Valor da aposta ajustado: R$ ${adjustedBetAmount} | Gale ➝  ${gale} 💰`);
                            await this.setBet(user.id, parseFloat(adjustedBetAmount), chosenColor); // Faz a nova aposta
                        } else {
                            console.log("❌ Não foi possível incrementar o Gale. A aposta não será feita.");
                        }
                    }
                }
            } 
        } catch (error) {
            console.error("❌ Erro ao processar o resultado da aposta:", error);
        }
    }
    
    async processGreenAndScheduleNextBet(strategyId) {
        const nextBetDate = await Strategy.getNextBetAfterGreen(strategyId);
    
        if (!nextBetDate) {
            console.log("❌ Não foi possível calcular o próximo horário de aposta.");
            return;
        }
        await Strategy.updateNextBetAfterGreen(strategyId, nextBetDate);
    }
    // Atualiza a estratégia após vitória
    async updateStrategyAfterWin(user, strategy) {
        try {
            // Atualiza o status ou outros dados da estratégia conforme necessário
            strategy.bettingStatus = 'inactive';
            await Strategy.updateBettingStatus(strategy.id, strategy.bettingStatus);
            console.log(`✅ Estratégia ID: ${strategy.id} foi atualizada após a vitória.`);
        } catch (error) {
            console.error("❌ Erro ao atualizar a estratégia após vitória:", error);
        }
    }
    // Lida com a perda da aposta (pode incluir lógica de Gale ou outro comportamento)
    async handleLoss(user, strategy) {
        try {
            // Lógica para lidar com a perda da aposta, incluindo o Gale
            console.log(`⚠ Aposta PERDIDA para o usuário: ${user.email}`);
            // Exemplo: Iniciar o Gale se necessário, ou reverter alterações
        } catch (error) {
            console.error("❌ Erro ao processar a perda da aposta:", error);
        }
    }
}

module.exports = new BlazeService();
