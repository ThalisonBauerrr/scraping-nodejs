async function fetchLatestDoubles() {
    try {
        const response = await fetch("/get-latest-doubles");
        const data = await response.json();

        if (data.success) {
            const doublesContainer = document.getElementById("doublesContainer");
            doublesContainer.innerHTML = ""; // Limpa os doubles antes de inserir novos

            data.doubles.forEach(d => {
                const div = document.createElement("div");

                // Define a classe de cor
                const colorClass = getColorClass(d.color);

                // Cria a div principal para o double
                const boxDiv = document.createElement("div");
                boxDiv.classList.add("sm-box", colorClass);  // Adiciona a classe com base na cor

                // Se a cor for branca (0), exibe apenas a imagem do zero
                if (d.color === 0) {
                    const zeroImage = document.createElement("img");
                    zeroImage.classList.add("zero-img");
                    zeroImage.src = "/img/zero.png";
                    zeroImage.alt = "Zero";
                    boxDiv.appendChild(zeroImage);
                } else {
                    // Se a cor não for branca, exibe o número (roll)
                    const numberDiv = document.createElement("div");
                    numberDiv.classList.add("number");
                    numberDiv.textContent = d.roll || "—";  // Exibe o número ou "—" se não houver roll
                    boxDiv.appendChild(numberDiv);
                }

                // Adiciona a div do double ao container
                doublesContainer.appendChild(boxDiv);
            });
        } else {
            console.error("❌ Erro ao buscar últimos doubles:", data.message);
        }
    } catch (error) {
        console.error("❌ Erro ao buscar últimos doubles:", error);
    }
}

// Função para mapear a cor para a classe CSS correspondente
function getColorClass(color) {
    switch (color) {
        case 0:
            return "white";  // Cor branca
        case 1:
            return "red";    // Cor vermelha
        case 2:
            return "black";  // Cor preta
        default:
            return "";       // Se a cor não for encontrada, retorna uma string vazia
    }
}

// Chama a função para carregar os doubles ao carregar a página
fetchLatestDoubles();

// Se você quiser, também pode chamar essa função a cada X segundos para atualizações automáticas:
setInterval(fetchLatestDoubles, 5000); // Atualiza a cada 5 segundos
