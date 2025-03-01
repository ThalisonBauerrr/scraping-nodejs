//Botão adicionar estrategia
document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('btnAddStrategy');
    const menu = document.getElementById('menu');

    if (!addButton || !menu) {
        console.error("Erro: Elementos necessários não encontrados no DOM.");
        return;
    }

    addButton.addEventListener('click', (event) => {
        event.stopPropagation();
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
        menu.style.display = 'none';
    });

    menu.addEventListener('click', (event) => {
        event.stopPropagation();
    });
});
// Função para adicionar cores à sequência e atualizar a exibição com imagens
document.addEventListener("DOMContentLoaded", function() {
    // Função para adicionar cores à sequência e atualizar a exibição com imagens
    function handleColorSequence() {
    // Inicializando a sequência de cores como um array vazio
    let sequence = [];

    // Elementos dos botões para adicionar cores
    const modals = {
        red: document.getElementById("redButton"),
        black: document.getElementById("blackButton"),
        white: document.getElementById("whiteButton"),
        clear: document.getElementById("clearSequenceBtn") // Botão para limpar a sequência
    };

    // Elemento onde as imagens da sequência serão exibidas
    const sequenceImages = document.getElementById("sequenceImages");

    // Elementos da div de confirmação para limpar
    const confirmationModal = document.getElementById("clearSequenceModal");
    const confirmYes = document.getElementById("confirmYes1");
    const confirmNo = document.getElementById("confirmNo1");

    // Elementos da div de confirmação de limite
    const limitReachedModal = document.getElementById("limitReachedModal");
    const okayBtn = document.getElementById("okayBtn");

    // Função para atualizar a exibição da sequência de cores
    function updateSequenceDisplay() {
        sequenceImages.innerHTML = "";  // Limpa a exibição atual

        // Exibe as imagens da sequência de cores
        sequence.forEach(color => {
            const img = document.createElement("img");
            img.src = `img/${color.toLowerCase()}.png`;  // Caminho da imagem
            img.alt = color;
            img.width = 40;  // Largura da imagem
            img.height = 40; // Altura da imagem
            sequenceImages.appendChild(img);  // Adiciona a imagem à exibição
        });
    }

    // Função para adicionar uma cor à sequência e atualizar a exibição
    function addColorToSequence(color) {
        if (sequence.length < 8) {  // Limite de 8 cores
            sequence.push(color);  // Adiciona a cor à sequência
            updateSequenceDisplay();  // Atualiza a exibição da sequência
        } else {
            // Exibe a div de confirmação quando o limite é atingido
            limitReachedModal.style.display = "flex";
        }
    }

    // Função para limpar a sequência de cores
    function clearSequence() {
        sequence = [];  // Limpa o array de sequência
        updateSequenceDisplay();  // Atualiza a exibição, que ficará vazia
        limitReachedModal.style.display = "none";  // Esconde a div de confirmação
    }

    // Função para fechar a div de confirmação
    function closeLimitReachedModal() {
        limitReachedModal.style.display = "none";  // Fecha a div de confirmação
    }
    // Função para fechar a div de confirmação
    function closeConfirmationModal() {
        confirmationModal.style.display = "none";  // Fecha a div de confirmação
    }
    // Evento de clique para adicionar a cor vermelha (Red)
    modals.red.onclick = function() {
        addColorToSequence("RED");
    };

    // Evento de clique para adicionar a cor preta (Black)
    modals.black.onclick = function() {
        addColorToSequence("BLACK");
    };

    // Evento de clique para adicionar a cor branca (White)
    modals.white.onclick = function() {
        addColorToSequence("WHITE");
    };

    // Evento de clique para limpar a sequência
    modals.clear.onclick = function() {
        clearSequence();  // Chama a função para limpar a sequência
    };

    // Fechar a div de confirmação quando o botão "OK" for clicado
    okayBtn.onclick = function() {
        closeLimitReachedModal();  // Fecha a div de confirmação
    };
    // Evento de clique para limpar a sequência (exibe a confirmação)
    modals.clear.onclick = function() {
        confirmationModal.style.display = "flex";  // Exibe a div de confirmação
    };

    // Confirmar a limpeza da sequência ao clicar em "Sim"
    confirmYes.onclick = function() {
        clearSequence();  // Chama a função para limpar a sequência
        closeConfirmationModal();  // Fecha a div de confirmação
    };

    // Cancelar a limpeza da sequência ao clicar em "Cancelar"
    confirmNo.onclick = function() {
        closeConfirmationModal();  // Chama a função para fechar a confirmação sem limpar
    };
    
}
    // Chama a função para iniciar a sequência
    handleColorSequence();

});

document.addEventListener("DOMContentLoaded", function() {
    function spanSelection() {
        // Constantes para as cores
        const COLOR_RED = "VERMELHO";
        const COLOR_BLACK = "PRETO";
        const COLOR_WHITE = "BRANCO";

        // Elementos dos checkboxes para escolher a cor
        const redCheckbox = document.getElementById("redCheckbox");
        const blackCheckbox = document.getElementById("blackCheckbox");
        const whiteCheckbox = document.getElementById("whiteCheckbox");

        // Elemento para exibir a sequência de cores escolhidas
        const selectedColorDisplay = document.getElementById("selectedColor");

        // Array para armazenar as cores selecionadas
        let selectedColors = [];

        // Função para atualizar a exibição da sequência de cores
        function updateSelectedColors() {
            selectedColorDisplay.textContent = selectedColors.join('/');  // Exibe as cores no formato "RED/WHITE"
        }

        // Função para adicionar ou remover a cor selecionada
        function toggleColorSelection(color) {
            if (selectedColors.includes(color)) {
                selectedColors = selectedColors.filter(c => c !== color);  // Remove a cor se já estiver selecionada
            } else {
                selectedColors.push(color);  // Adiciona a cor se não estiver selecionada
            }
            updateSelectedColors();  // Atualiza a exibição das cores
        }

        // Função para garantir que apenas uma das opções (Red ou Black) pode ser escolhida
        function checkMutualExclusiveSelection(selectedColor, otherCheckbox, otherColor) {
            if (selectedColor === COLOR_RED || selectedColor === COLOR_BLACK) {
                otherCheckbox.checked = false;  // Desmarca o outro checkbox
                selectedColors = selectedColors.filter(color => color !== otherColor);  // Remove a outra cor
            }
        }

        // Evento de clique para Red
        redCheckbox.addEventListener("change", function() {
            if (this.checked) {
                checkMutualExclusiveSelection(COLOR_RED, blackCheckbox, COLOR_BLACK);
                toggleColorSelection(COLOR_RED);
            } else {
                toggleColorSelection(COLOR_RED);
            }
        });

        // Evento de clique para Black
        blackCheckbox.addEventListener("change", function() {
            if (this.checked) {
                checkMutualExclusiveSelection(COLOR_BLACK, redCheckbox, COLOR_RED);
                toggleColorSelection(COLOR_BLACK);
            } else {
                toggleColorSelection(COLOR_BLACK);
            }
        });

        // Evento de clique para White
        whiteCheckbox.addEventListener("change", function() {
            toggleColorSelection(COLOR_WHITE);
        });
    }

    // Chama a função para iniciar a sequência
    spanSelection();
});

document.addEventListener("DOMContentLoaded", function () {
    const whiteCheckbox = document.getElementById('whiteCheckbox');
    const betWhiteField = document.getElementById('betWhiteField');
    const betWhiteInput = document.getElementById('betWhite'); // Campo de input para o valor do Branco

    // Função para mostrar ou ocultar o campo de aposta no Branco
    function toggleBetWhiteField() {
        if (whiteCheckbox.checked) {
            betWhiteField.style.display = 'block'; // Mostra o campo
        } else {
            betWhiteField.style.display = 'none'; // Oculta o campo
            betWhiteInput.value = ""; // Limpa o valor do campo
        }
    }

    // Adiciona o evento de mudança ao checkbox "Branco"
    whiteCheckbox.addEventListener('change', toggleBetWhiteField);

    // Verifica o estado inicial do checkbox ao carregar a página
    toggleBetWhiteField();
});


// REMOVER ESTRATEGIA
document.addEventListener("DOMContentLoaded", async function () {
    const confirmationModal = document.getElementById("confirmationModal");
    const confirmYes = document.getElementById("confirmYes");
    const confirmNo = document.getElementById("confirmNo");
    let strategyIdToDelete = null;

    const addStrategyButton = document.getElementById("btnAddStrategy");

    // 🔹 Planos e seus limites de estratégias
    const PLAN_LIMITS = {
        "BASIC": 2,
        "PRO": 4,
        "PREMIUM": 6
    };

    let userPlan = "BASIC"; // Valor padrão caso não consiga obter do backend
    let strategyCount = 0;

    // 🔹 Obtém o plano do usuário
    async function fetchUserPlan() {
        try {
            const response = await fetch("/user/plan");
            const data = await response.json();

            if (data.success) {
                userPlan = data.plan_type.toUpperCase();
                console.log(`✅ Plano do usuário: ${userPlan}`);
                await fetchStrategyCount(); // Só busca as estratégias após definir o plano
            } else {
                console.error("❌ Erro ao obter plano do usuário.");
            }
        } catch (error) {
            console.error("❌ Erro ao buscar plano do usuário:", error);
        }
    }

    // 🔹 Obtém a quantidade de estratégias do usuário
    async function fetchStrategyCount() {
        try {
            const response = await fetch("/user/strategy-count");
            const data = await response.json();

            if (data.success) {
                strategyCount = data.strategyCount;
                console.log(`✅ O usuário tem ${strategyCount} estratégias.`);
                checkStrategyLimit(); // Atualiza o botão após obter os dados
            } else {
                console.error("❌ Erro ao obter a contagem de estratégias.");
            }
        } catch (error) {
            console.error("❌ Erro ao buscar estratégias:", error);
        }
    }

    // 🔹 Verifica se o usuário atingiu o limite do plano e atualiza o botão
    function checkStrategyLimit() {
        const maxStrategies = PLAN_LIMITS[userPlan] || 2;

        if (strategyCount >= maxStrategies) {
            addStrategyButton.disabled = true;
            addStrategyButton.innerText = `Limite atingido (${maxStrategies} estratégias)`;
            addStrategyButton.classList.add("disabled");
        } else {
            addStrategyButton.disabled = false;
            addStrategyButton.innerText = "Adicionar Estratégia";
            addStrategyButton.classList.remove("disabled");
        }
    }

    // 🔹 Atualiza a exibição do botão ao remover uma estratégia
    function updateButtonAfterDeletion() {
        strategyCount--; // Reduz o contador de estratégias
        checkStrategyLimit(); // Atualiza o botão dinamicamente
    }

    // 🔹 Adiciona evento de clique para todos os botões "Remover"
    document.querySelectorAll(".delete-strategy").forEach(button => {
        button.addEventListener("click", function () {
            const strategyDiv = this.closest(".strategies");
            strategyIdToDelete = strategyDiv.getAttribute("data-strategy-id");

            if (!strategyIdToDelete) {
                console.error("❌ ID da estratégia não encontrado.");
                return;
            }

            confirmationModal.style.display = "flex"; // Exibe o modal
        });
    });

    // 🔹 Se o usuário confirmar a exclusão
    confirmYes.addEventListener("click", async function () {
        if (!strategyIdToDelete) return;

        try {
            const response = await fetch(`/strategy/delete/${strategyIdToDelete}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();
            if (data.success) {
                document.querySelector(`.strategies[data-strategy-id='${strategyIdToDelete}']`).remove();
                alert("✅ Estratégia removida com sucesso!");
                updateButtonAfterDeletion(); // Atualiza o botão após a remoção
            } else {
                alert("❌ Erro ao remover a estratégia.");
            }
        } catch (error) {
            console.error("❌ Erro ao deletar estratégia:", error);
            alert("Erro ao remover a estratégia.");
        }

        confirmationModal.style.display = "none"; // Esconde o modal
        strategyIdToDelete = null;
    });

    // 🔹 Se o usuário cancelar a exclusão
    confirmNo.addEventListener("click", function () {
        confirmationModal.style.display = "none"; // Fecha o modal
        strategyIdToDelete = null;
    });

    // 🔹 Chama a função para buscar o plano do usuário e depois a contagem de estratégias
    await fetchUserPlan();
});


function changeImage(imgElement, strategyId) {
    imgElement.style.opacity = 0;  // Efeito fade-out

    setTimeout(function() {
        let newStatus;
        
        // Alterna entre as imagens e define o novo status
        if (imgElement.src.includes('icons8-off-48.png')) {
            imgElement.src = '/img/icons8-on-48.png';  
            newStatus = 'active';
        } else {
            imgElement.src = '/img/icons8-off-48.png';  
            newStatus = 'inactive';
        }

        imgElement.style.opacity = 1;  // Efeito fade-in

        // Enviar requisição AJAX para atualizar no banco
        fetch('/update-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ strategyId: strategyId, status: newStatus })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert('Erro ao atualizar no banco!');
            }
        })
        .catch(error => console.error('Erro:', error));

    }, 150);
}

function initializeModalConfirmation() {
    // Elementos dos botões de fechar
    const closeButtons = {
        add: document.getElementById("closeAddModal"),
        edit: document.getElementById("closeEditModal")
    };

    // Elementos dos botões para abrir os modais
    const openButtons = {
        add: document.getElementById("openAddModal"),
        edit: document.getElementById("openEditModal")
    };

    // Elementos dos modais
    const modals = {
        add: document.getElementById("addModal"),
        edit: document.getElementById("editModal")
    };

    // Elementos da div de confirmação
    const confirmationModal = document.getElementById("confirmationModal");
    const confirmYes = document.getElementById("confirmYes");
    const confirmNo = document.getElementById("confirmNo");

    // Função para exibir o modal de confirmação
    function showConfirmationModal(modalToClose) {
        confirmationModal.style.display = "flex";  // Exibe a div de confirmação
        confirmationModal.setAttribute("data-modal", modalToClose);  // Salva qual modal fechar
    }

    // Função de fechar o modal com base no ID do modal
    function closeModal(modal) {
        modal.style.display = "none";  // Esconde o modal
        document.body.classList.remove("modal-open");  // Remove o desfoque
    }

    // Certificar-se de que os modais começam invisíveis
    modals.add.style.display = "none";  // Adiciona Modal está invisível
    modals.edit.style.display = "none";  // Edit Modal está invisível
    confirmationModal.style.display = "none";  // A div de confirmação começa invisível

    // Função para abrir o modal de adicionar estratégia
    openButtons.add.onclick = () => {
        modals.add.style.display = "flex";  // Exibe o modal de adicionar
    };

    // Função para abrir o modal de editar estratégia
    openButtons.edit.onclick = () => {
        modals.edit.style.display = "flex";  // Exibe o modal de editar
    };

    // Função de abrir o modal de adicionar estratégia com confirmação
    closeButtons.add.onclick = () => {
        showConfirmationModal("add");  // Mostra a confirmação antes de fechar
    };

    // Função de abrir o modal de editar estratégia com confirmação
    closeButtons.edit.onclick = () => {
        showConfirmationModal("edit");  // Mostra a confirmação antes de fechar
    };

    // Ao clicar em "Sim" no modal de confirmação, fecha o modal correspondente
    confirmYes.onclick = function() {
        const modalToClose = confirmationModal.getAttribute("data-modal");
        if (modalToClose === "add") {
            closeModal(modals.add);  // Fecha o modal de adicionar
        } else if (modalToClose === "edit") {
            closeModal(modals.edit);  // Fecha o modal de editar
        }
        confirmationModal.style.display = "none";  // Fecha a div de confirmação
    };

    // Ao clicar em "Cancelar", fecha a div de confirmação sem fechar o modal
    confirmNo.onclick = function() {
        confirmationModal.style.display = "none";  // Fecha a div de confirmação
    };
}
initializeModalConfirmation();
