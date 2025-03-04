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
    // 🔹 Método para fazer login usando PUT com retry
    async login(retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                //console.log(`📌 Tentativa ${attempt} de login...`);
                const response = await this.session.put('/auth/password', {
                    username: this.username,
                    password: this.password
                });
                if (response.status === 200 && response.data.access_token) {
                    this.token = response.data.access_token;
                    //console.log('✅ Login realizado com sucesso!');
                    return this.token;
                } else {
                    console.warn('⚠ Resposta inesperada. Estrutura dos dados pode ter mudado.');
                }
            } catch (error) {
                console.error(`❌ Erro na tentativa ${attempt}:`, error.response ? error.response.data : error.message);
                if (attempt < retries) {
                    console.log(`🔄 Tentando novamente em 5 segundos...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    throw new Error("❌ Falha no login após várias tentativas.");
                }
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
    async getLastDoubles(retries = 3) {
        this._ensureAuthenticated();
    
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await this.session.get('/singleplayer-originals/originals/roulette_games/recent/1', {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
    
                if (response.status === 200) {
                    return response.data;
                } else {
                    console.warn(`⚠ Tentativa ${attempt} falhou com status ${response.status}.`);
                }
            } catch (error) {
                //console.error(`❌ Erro na tentativa ${attempt}:`, error.response ? error.response.data : error.message);
    
                // Se o erro for 502 (Bad Gateway), tente novamente com intervalo maior
                if (error.response && error.response.status === 502) {
                    //console.warn("⚠ Erro 502: O servidor da Blaze não está disponível no momento.");
                }
    
                if (attempt < retries) {
                    //console.log(`🔄 Tentando novamente em 10 segundos...`);
                    await new Promise(resolve => setTimeout(resolve, 10000)); // Aumentei o intervalo para 10 segundos
                } else {
                    throw new Error("❌ Falha ao obter últimos doubles após várias tentativas.");
                }
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
    async getStatus() {
        this._ensureAuthenticated();
    
        try {
            const response = await this.session.get('/singleplayer-originals/originals/roulette_games/current/1', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
    
            // Verifica o status da resposta
            if (response.status === 200) {
                const statusDouble = response.data.status;
                //console.log(`✅ Status da requisição: ${statusDouble}`);
                return statusDouble; // Retorna o status do double (ex: "waiting", "started")
            } else {
                // Trata outros códigos de status HTTP
                //console.error(`❌ Erro ao pegar status. Status: ${response.status}`);
                throw new Error(`Erro ao pegar status. Código: ${response.status}`);
            }
    
        } catch (error) {
            // Trata erros específicos
            if (error.response) {
                // Erro de resposta da API (ex: 502 Bad Gateway)
                //console.error(`❌ Erro na resposta da API: ${error.response.status} - ${error.response.statusText}`);
                throw new Error(`Erro na resposta da API: ${error.response.status}`);
            } else if (error.request) {
                // Erro de rede (ex: sem resposta do servidor)
                //console.error('❌ Erro de rede: Não foi possível conectar ao servidor.');
                throw new Error('Erro de rede: Não foi possível conectar ao servidor.');
            } else {
                // Outros erros (ex: erro no código)
                //console.error('❌ Erro ao processar a requisição:', error.message);
                throw error;
            }
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
