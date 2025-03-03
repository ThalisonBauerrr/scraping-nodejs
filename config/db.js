const mysql = require('mysql2');
require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env

// Configuração do pool de conexões
const pool = mysql.createPool({
    host: process.env.DB_HOST || '147.93.10.180', // Endereço do banco de dados
    user: process.env.DB_USER || 'lethalcode',      // Usuário do banco
    password: process.env.DB_PASSWORD || 'p5pexvm', // Senha do banco
    database: process.env.DB_NAME || 'lethalcode',  // Nome do banco de dados
    waitForConnections: true,
    connectionLimit: 10, // Número máximo de conexões no pool
    queueLimit: 0, // Número máximo de solicitações na fila (0 = ilimitado)
    idleTimeout: 60000, // Tempo máximo de inatividade de uma conexão (em milissegundos)
    enableKeepAlive: true, // Mantém a conexão ativa
    keepAliveInitialDelay: 10000, // Intervalo para manter a conexão ativa
});

// Exportar o pool para uso em outros módulos, já com suporte a promessas
module.exports = pool.promise();