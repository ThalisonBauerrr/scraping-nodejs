const axios = require('axios');

class BlazeAuth {
    constructor(username, password) {
        this.baseURL = 'https://blaze.bet.br/api';
        this.username = username;
        this.password = password;
        this.token = null;
        this.walletID = null;
        this.is_logged = false;

        this.session = axios.create({
            baseURL: this.baseURL,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                'Content-Type': 'application/json',
            },
            withCredentials: true
        });
    }
    // Função para tratar os erros de maneira centralizada
    async handleError(error, attempt, retries, mensagem) {
        console.error(`❌ Erro na tentativa ${attempt} na ${mensagem}`);

        // **Erro 400 (Bad Request)**: Solicitação malformada
        if (error.response && error.response.status === 400) {
            console.error("⚠ Erro 400: Solicitação malformada. Verifique os parâmetros enviados.");
        }
        // **Erro 401 (Unauthorized)**: Credenciais inválidas
        else if (error.response && error.response.status === 401) {
            console.error("⚠ Erro 401: Credenciais inválidas. Verifique o nome de usuário e a senha.");
        }
        // **Erro 500 (Internal Server Error)**: Problemas no servidor da API
        else if (error.response && error.response.status === 500) {
            console.error("⚠ Erro 500: O servidor da API encontrou um erro interno. Tente novamente mais tarde.");
        }
        // **Erro de Timeout ou Rede**: Problemas de conexão
        else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error("⚠ Erro de Timeout: A requisição demorou demais para responder.");
        }
        // **Outros Erros HTTP**: Outros erros não especificados
        else if (error.response) {
            console.error(`❌ Erro inesperado: Status ${error.response.status} - ${error.response.data}`);
        }
        // **Erro Desconhecido**: Outros tipos de erro desconhecidos
        else {
            console.error(`❌ Erro desconhecido: ${error.message}`);
        }

        // Se houver tentativas restantes, tenta novamente após um intervalo
        if (attempt < retries) {
            console.log(`🔄 Tentando novamente em 5 segundos...`);
            return new Promise(resolve => setTimeout(resolve, 5000)); // Intervalo de 5 segundos
        } else {
            throw new Error("❌ Falha no login após várias tentativas.");
        }
    }
    // 🔹 Método para fazer login usando PUT com retry
    async login(retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // Tentativa de login
                const response = await this.session.put('/auth/password', {
                    username: this.username,
                    password: this.password
                });
    
                // Verifica se a resposta foi bem-sucedida e contém o access_token
                if (response.status === 200 && response.data.access_token) {
                    this.token = response.data.access_token;
                    console.log('✅ Login realizado com sucesso!');
                    return this.token;
                } else {
                    console.warn('⚠ Resposta inesperada. Estrutura dos dados pode ter mudado ou o login falhou.');
                }
            } catch (error) {
                // Chama a função handleError para centralizar o tratamento de erros
                await this.handleError(error, attempt, retries, 'login');
            }
        }
    }
    // 🔹 Método para buscar os dados do usuário autenticado
    async getUserData() {
        this._ensureAuthenticated();
        return this._makeRequest('/users/me', 'GET', "Erro ao buscar dados do usuário");
    }
    // 🔹 Método para buscar o saldo da conta
    async getWalletBalance() {
        this._ensureAuthenticated();
        return this._makeRequest('/wallets', 'GET', "Erro ao buscar saldo da conta");
    }
    async getRank() {
        this._ensureAuthenticated();
        return this._makeRequest('/users/me/xp', 'GET', "Erro ao buscar saldo da conta");
    }
    // 🔹 Método para obter informações completas do usuário
    async getUserinfo() {
        try {
            const walletData = await this.getWalletBalance();
            const userData = await this.getUserData();
            const rankData  = await this.getRank();
            return {
                balance: walletData[0]?.balance,
                username: userData?.username,
                wallet_id: walletData[0]?.id,
                tax_id: userData?.tax_id,
                currency_type: walletData[0]?.currency?.type,
                rank: rankData?.rank
            };
        } catch (error) {
            console.error('❌ Erro ao obter informações do usuário:', error);
            throw error;
        }
    }
    // 🔹 Método para obter os últimos doubles com retry automático
    async getLastDoubles(retries = 10) {
        this._ensureAuthenticated();

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await this.session.get('/singleplayer-originals/originals/roulette_games/recent/1', {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });

                // Verifica se a resposta foi bem-sucedida
                if (response.status === 200) {
                    return response.data;
                } else {
                    console.warn(`⚠ Tentativa ${attempt} falhou com status ${response.status}.`);
                }
            } catch (error) {
                // Chama a função handleError para centralizar o tratamento de erros
                await this.handleError(error, attempt, retries, 'getLastDoubles');
            }
        }
    }
        
    // 🔹 Método genérico para fazer requisições autenticadas com melhor tratamento de erros
    async _makeRequest(endpoint, method = 'GET', errorMessage = "Erro na requisição") {
        try {
            const response = await this.session.request({
                url: endpoint,
                method: method,
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(`${errorMessage}. Status: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ ${errorMessage}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    }
    // 🔹 Método para obter o status da requisição diretamente
    async getStatus(retries = 10) {
        this._ensureAuthenticated();
    
        let attempt = 1;
    
        while (attempt <= retries) {
            try {
                const response = await this.session.get('/singleplayer-originals/originals/roulette_games/current/1', {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
    
                // Verifica se a resposta foi bem-sucedida
                if (response.status === 200) {
                    const statusDouble = response.data.status;
                    return statusDouble; // Retorna o status do double (ex: "waiting", "started")
                }
            } catch (error) {
                // Chama a função handleError para centralizar o tratamento de erros
                await this.handleError(error, attempt, retries, 'getStatus');
            }
    
            attempt++;
        }
    }
    
    // 🔹 Método para fazer uma aposta (POST)
    async placeBets(amount, color, username, walletId, roomId) {
        this._ensureAuthenticated();

        const betData = {
            amount: amount.toString(), // 🔹 Converter para string, pois a API pode exigir
            currency_type: "BRL",
            color: color, // 0 para vermelho, 1 para preto, 2 para branco
            free_bet: false,
            rank: "bronze",
            room_id: roomId,
            username: username, // Nome de usuário da Blaze
            wallet_id: walletId
        };

        try {
            const response = await this.session.post('/singleplayer-originals/originals/roulette_bets', betData, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.status === 200) {
                //console.log(`✅ Aposta realizada com sucesso:`, response.data);
                return response.data;
            } else {
                console.warn(`⚠ Aposta falhou. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Erro ao realizar aposta:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
    // 🔹 Método para fazer uma aposta (apenas se o status for "waiting")
    async placeBetWhenWaiting(amount, color,currency_type, rank, username, walletId, roomId,token, retries = 10, interval = 2000) {
        this._ensureAuthenticated();
       

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const status = await this.getStatus();

                if (status === "waiting") {
                    //console.log(`✅ Status confirmado como 'waiting'. Realizando aposta...`);
                    
                    const betData = {
                        amount: amount,
                        color: color,
                        currency_type: currency_type,
                        free_bet: false,
                        rank: rank,
                        room_id: roomId,
                        username: username,
                        wallet_id: walletId
                    };

                    const response = await this.session.post('/singleplayer-originals/originals/roulette_bets', betData, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.status === 200) {
                        //console.log(`✅ Aposta realizada com sucesso:`, response.data);
                        return response.data;
                    } else {
                        console.warn(`⚠ Aposta falhou. Status: ${response.status}`);
                    }
                    break; // Sai do loop após realizar a aposta com sucesso
                } else {
                    console.log(`⏳ [${attempt}/${retries}] Status ainda não é 'waiting' (Atual: ${status}). Tentando novamente em ${interval / 1000} segundos...`);
                    await new Promise(resolve => setTimeout(resolve, interval));
                }
            } catch (error) {
                console.error(`❌ Erro ao tentar apostar:`, error.response ? error.response.data : error.message);
            }
        }

        console.log("❌ Tempo máximo de espera atingido. A aposta não foi realizada.");
    }
    // 🔹 Método para verificar se o usuário está autenticado antes de fazer chamadas protegidas
    _ensureAuthenticated() {
        if (!this.token) {
            //throw new Error('Token não encontrado. Faça o login primeiro.');
        }
    }
}
// Exporte a classe para uso em outros arquivos
module.exports = BlazeAuth;
