# Anotações do Projeto

## 📌 [13/02/2025]
- ✅ IMPLEMENTAR CADASTRO EMAIL BLAZE - EMAIL VAI SER ÚNICO POR CONTA SEM PODER ALTERAR
- ✅ CONTA FREE GANHA 5 HORAS DE TESTE
- ✅ GETDOUBLE QUANDO STATUS FOR 'COMPLETE'
- ✅ ARRUMAR O FORMATO DA DATA [2025-02-11T04:42:27.859Z]
- ✅ IMPLEMENTAR PARA FAZER APOSTA

## 📌 [15/02/2025]
- ✅ IMPLEMENTAR APOSTA VALOR DO BANCO
- ✅ IMPLEMENTAR MARGINALE

## 📌 [16/02/2025]
- ✅ APOSTAR APENAS UMA ESTRATÉGIA POR VEZ

## 📌 [18/02/2025]
- ✅ IMPLEMENTAÇÃO DE AO STARTAR CRIAR META DO DIA, META ALTERA 1X NO DIA

## 📌 [22/02/2025]
- ✅ MODIFICAR PROCESSA RESULTADO DEPENDENDO MODO DA ESTRATÉGIA
- ✅ IMPLEMENTAR PADRÃO BRANCO
- 🎯 ALTERAR INTERVALO DA ESTRATÉGIA, USAR DEFINIDO PELO USUÁRIO
- ✅ TABELA QUE ARMAZENA SEQUÊNCIAS SEM SAIR AS CORES
- ✅ ATUALIZAR BANCA NO BD
- ✅ CORREÇÃO DE CHAVES ESTRANGEIRAS NO BD
- ✅ AO CHEGAR NO STOP LOSS/WIN PARAR (USER>USER_STATUS = STOPPED)
- ✅ IMPLEMENTAR PADRÃO BRANCO COM QUEBRA DE SEQUÊNCIA

## 📌 [27/02/2025]
- ✅ IMPLEMENTAR RECUPERAÇÃO (SOMENTE MODO PADRÃO)
- 🎯 INTERVALO ALTERADO EM MINUTOS

---

# FUTURES

- **TOKEN INVALIDO**: IS_RUNNING = 0 E MANDAR MENSAGEM PARA O USUÁRIO
- **ME PARECE SE REPETE O NÚMERO**: ELE NÃO CONSTA NO LOG
- **CASO BATA O STOP LOSS OU WIN**: IS_RUNNING = 0
- **AO VIRAR O DIA**: IS_RUNNING RECEBE 1
- **META 5000% POR EXEMPLO NÃO ESTÁ FUNCIONANDO**

---

# EXEMPLOS DE LOG

🎰 **Double ID**: 9YrJ3M9L1K | **Cor**: 🟥 | **Roll**: 2 | **Hora**: 27/02/2025, 01:16:57  
✅ Verificando estratégias para o usuário: thalisonbauer@hotmail.com

🎰 **Double ID**: 9YrJ3M9L1K | **Cor**: 🟥 | **Roll**: 2 | **Hora**: 27/02/2025, 01:16:57  
✅ Verificando estratégias para o usuário: thalisonbauer@hotmail.com  

**Servidor**: srv739583.hstgr.cloud  
**Credenciais**:
- Email: ThalisonP5pe@123
- Senha: GpTLCQT2qLopVP&6g8@p
- Admin: admin@sparkblaze.com.br
-/usr/local/lsws/Example/html/node

### STATUS DA ROLETA

- **rolling**: ROLETA EM ANDAMENTO
- **waiting**: HORA DE APOSTAR
- **complete**: NÚMERO SORTEADO

---

# STATUS DO USUÁRIO

- **active**: USUÁRIO ATIVO
- **expired**: USUÁRIO EXPIRADO

---
CREATE USER 'lethalcode'@'%' IDENTIFIED BY 'p5pexvm';
GRANT ALL PRIVILEGES ON *.* TO 'novo_usuario'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

# ERRO DE LÓGICA

🎰 **Double ID**: EV1eKb3elo | **Cor**: ⬛ | **Roll**: 14 | **Hora**: 23/02/2025, 17:45:29  
✅ Verificando estratégias para o usuário: thalisonbauer@hotmail.com  
🔄 Estratégia já ativa para o usuário: thalisonbauer@hotmail.com  
⚠️ Cor sorteada black não corresponde à(s) cor(es) escolhida(s): red  
🎯 Ajustando aposta: Gale 3 ➝ Novo valor: R$ 8  
🎰 Aposta realizada com sucesso para o usuário 13!  
🎲 Doubles corresponde à estratégia do usuário: thalisonbauer@hotmail.com | Estratégia ID: 13  
📝 Aposta realizada: User ID: 13 | Strategy ID: 13 | Double ID: EV1eKb3elo | Cor Escolhida: ["black"] | Valor: 1.00 | Status: pending  
🎰 Aposta realizada com sucesso para o usuário 13!

🎰 **Double ID**: Nz1xQG34kp | **Cor**: ⬛ | **Roll**: 13 | **Hora**: 23/02/2025, 17:45:59  
✅ Verificando estratégias para o usuário: thalisonbauer@hotmail.com  
🔄 Estratégia já ativa para o usuário: thalisonbauer@hotmail.com  
❌ **[MARTINGALE]** Limite máximo de 4 atingido! 🚨 Aposta encerrada como perdedora. ❌  
O saldo do usuário é menor que o stop_loss: R$107.37 < R$109.24  
Usuário com ID 13 agora está 'stopped' devido ao saldo.  
🔄 Estratégia já ativa para o usuário: thalisonbauer@hotmail.com  
🏆 Aposta ganha! Cor sorteada: black → Escolhida: black  
⏳ Próxima aposta será em: 23/02/2025, 18:46:31  
O saldo do usuário não excede o stop_win: R$107.37 <= R$127.44
