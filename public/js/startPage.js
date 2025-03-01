document.addEventListener("DOMContentLoaded", async function () {
    // 🔹 Obtém o status atual ao carregar a página
    await updateStatusDisplay();
    
    document.getElementById("runButton").addEventListener("click", async function () {
        const email = document.getElementById("email").value;
        const passwordField = document.getElementById("password");

        console.log("📌 Tentando login na Blaze com:", email);

        try {
            // 🔹 Faz a requisição para login
            const loginResponse = await fetch("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password: passwordField.value }) 
            });

            const loginData = await loginResponse.json();

            if (!loginResponse.ok || !loginData.success) {
                alert("❌ " + (loginData.error || "Erro ao fazer login."));
                return;
            }

            console.log("✅ Login bem-sucedido na Blaze!", loginData);

            // 🔹 Atualiza o status `is_running = 1`
            await updateRunningStatus(1);

            // 🔹 Oculta o campo de senha sem desalinhamento
            passwordField.style.visibility = "hidden"; // Mantém o espaço reservado

            // 🔹 Exibe o resultado na página
            const resultDiv = document.getElementById("result");
            resultDiv.innerText = `✅ Login na Blaze! Usuário: ${loginData.username}, Saldo: R$ ${loginData.balance}`;

            // 🔹 Salva o resultado no localStorage para persistência após o reload
            localStorage.setItem("loginResult", resultDiv.innerHTML);

        } catch (error) {
            console.error("❌ Erro ao conectar ao servidor:", error);
            document.getElementById("result").innerText = "❌ Erro ao conectar ao servidor.";
        }
    });

    // 🔹 Evento de clique para parar o processo
    document.getElementById("stopButton").addEventListener("click", async function () {
        const statusResponse = await fetch("/check-running-status");
        const statusData = await statusResponse.json();

        if (!statusData.isRunning) {
            alert("⚠ O processo já está pausado.");
            return;
        }

        await updateRunningStatus(0);
    });

    // 🔹 Restaurar mensagem ao recarregar a página
    const savedResult = localStorage.getItem("loginResult");
    if (savedResult) {
        document.getElementById("result").innerHTML = savedResult;
    }
});

// 🔹 Atualiza o estado do botão e do <p id="isRun"></p>
async function updateStatusDisplay() {
    try {
        const response = await fetch("/check-running-status");
        const data = await response.json();

        const statusText = data.isRunning ? "Rodando 🟢" : "Pausado 🔴";
        document.getElementById("isRun").innerText = `Status: ${statusText}`;

        // 🔹 Atualiza os botões
        document.getElementById("runButton").disabled = data.isRunning;
        document.getElementById("stopButton").disabled = !data.isRunning;
        document.getElementById("runButton").innerText = data.isRunning ? "Rodando..." : "Run";

        // 🔹 Mostra ou oculta o campo de senha SEM alterar layout
        document.getElementById("password").style.visibility = data.isRunning ? "hidden" : "visible";

    } catch (error) {
        console.error("❌ Erro ao buscar status:", error);
        document.getElementById("isRun").innerText = "Status: Erro ao carregar ❌";
    }
}

// 🔹 Atualiza o status de execução
async function updateRunningStatus(status) {
    try {
        const response = await fetch("/auth/update-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_running: status }) // Envia apenas o novo status
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log(`✅ Estado atualizado para: ${status === 1 ? 'Rodando' : 'Pausado'}`);
            alert(data.message);
            await updateStatusDisplay(); // 🔹 Atualiza a exibição do status
        } else {
            console.error("❌ Erro ao atualizar status:", data.message);
            alert("Erro ao atualizar status.");
        }
    } catch (error) {
        console.error("❌ Erro ao enviar requisição:", error);
    }
}
