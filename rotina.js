const params = new URLSearchParams(window.location.search);
const rotinaId = params.get("id");

const tituloRotina = document.getElementById("tituloRotina");
const descricaoRotina = document.getElementById("descricaoRotina");
const diasContainer = document.getElementById("diasContainer");
const voltarBtn = document.getElementById("voltarBtn");

let rotinas = JSON.parse(localStorage.getItem("routines") || "[]");
const rotina = rotinas.find((r) => r.id === rotinaId);

if (!rotina) {
  tituloRotina.textContent = "Rotina não encontrada 😕";
} else {
  tituloRotina.textContent =
    rotina.type === "enem"
      ? "Rotina ENEM"
      : rotina.type === "prova"
      ? "Prova Escolar"
      : "Concurso Público";

  const hoje = new Date();
  const fim = new Date(rotina.endDate);
  const diffMs = fim - hoje > 0 ? fim - hoje : 0;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffSemanas = Math.ceil(diffDias / 7);

  descricaoRotina.textContent = `Estudar até ${fim.toLocaleDateString(
    "pt-BR"
  )} — ${rotina.hoursPerDay}h/dia · ${rotina.daysPerWeek} dias/semana (${diffDias} dias restantes ≈ ${diffSemanas} semanas).`;

  gerarDias(rotina);
}

voltarBtn.addEventListener("click", () => {
  window.location.href = "principal.html";
});


// ===============================================
// GERAR DIAS
// ===============================================
function gerarDias(r) {
  diasContainer.innerHTML = "";

  const rotina = r.generatedRoutine;
  if (!rotina || typeof rotina !== "object") {
    diasContainer.innerHTML = "<p>Não há rotina gerada para esta tarefa.</p>";
    return;
  }

  const diasOrdenados = Object.keys(rotina).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.replace(/\D/g, "")) || 0;
    return numA - numB;
  });

  let semanaAtual = 1;
  let diasNaSemana = 0;

  let semanaDiv = document.createElement("div");
  semanaDiv.className = "semana";

  const tituloSemana = document.createElement("h2");
  tituloSemana.textContent = `📘 Semana ${semanaAtual}`;
  semanaDiv.appendChild(tituloSemana);

  diasContainer.appendChild(semanaDiv);

  diasOrdenados.forEach((diaChave, i) => {
    const topicos = rotina[diaChave];

    const card = document.createElement("div");
    card.className = "dia-card";

    const tarefasHTML = topicos
      .map(
        (t, index) => `
        <li class="tarefa-item">
          <span class="texto-tarefa" id="texto-${i}-${index}">${t}</span>

          <div class="acoes-tarefa">
            <button class="editar-btn" data-i="${i}" data-index="${index}">✏️</button>
            <input type="checkbox" id="dia${i}-tarefa${index}" class="check-tarefa" />
          </div>
        </li>
      `
      )
      .join("");

    card.innerHTML = `
      <h3>${diaChave}</h3>
      <ul class="tarefas">${tarefasHTML}</ul>
      <p class="progresso">0/${topicos.length} concluídas</p>
    `;

    semanaDiv.appendChild(card);

    const checkboxes = card.querySelectorAll(".check-tarefa");
    const progresso = card.querySelector(".progresso");

    // CHECKBOX → abrir popup de pausa
    checkboxes.forEach((cb) =>
      cb.addEventListener("change", () => {
        const feitos = card.querySelectorAll(".check-tarefa:checked").length;

        progresso.textContent = `${feitos}/${topicos.length} concluídas`;
        card.classList.toggle("completed", feitos === topicos.length);

        if (cb.checked) {
          openPausePopup();
        }
      })
    );

    // EDITAR TEXTO
    const botoesEditar = card.querySelectorAll(".editar-btn");

    botoesEditar.forEach((btn) => {
      btn.addEventListener("click", () => {
        const diaIndex = btn.dataset.i;
        const tarefaIndex = btn.dataset.index;

        const span = document.getElementById(`texto-${diaIndex}-${tarefaIndex}`);

        openEditPopup(span);
      });
    });

    diasNaSemana++;
    if (diasNaSemana === 5 && i !== diasOrdenados.length - 1) {
      diasNaSemana = 0;
      semanaAtual++;

      semanaDiv = document.createElement("div");
      semanaDiv.className = "semana";

      const novoTitulo = document.createElement("h2");
      novoTitulo.textContent = `📘 Semana ${semanaAtual}`;
      semanaDiv.appendChild(novoTitulo);

      diasContainer.appendChild(semanaDiv);
    }
  });
}



// ===============================================
// POPUP DE PAUSA – PRETO/ROXO, AUTOMÁTICO, FECHA AO TERMINAR
// ===============================================

const pausePopup = document.getElementById("pausePopup");
const pauseText = document.getElementById("pauseText");
const btnIncrease = document.getElementById("increase");
const btnDecrease = document.getElementById("decrease");

let pauseSeconds = 20;
let countdownInterval = null;

function openPausePopup() {

  pauseSeconds = 20;

  // Reinicia o contador
  clearInterval(countdownInterval);

  // Mostrar popup
  pausePopup.style.display = "flex";
  pauseText.textContent = `Pausa: ${pauseSeconds}s`;

  // Inicia a contagem automática
  countdownInterval = setInterval(() => {
    pauseSeconds--;
    pauseText.textContent = `Pausa: ${pauseSeconds}s`;

    // FECHA AO CHEGAR EM ZERO
    if (pauseSeconds <= 0) {
      clearInterval(countdownInterval);

      pauseText.textContent = "Pausa concluída!";

      setTimeout(() => {
        pausePopup.style.display = "none";
      }, 600); // pequena espera para mostrar "concluída"
    }
  }, 1000);
}

// Aumentar 15 segundos
btnIncrease.onclick = () => {
  pauseSeconds += 15;
  pauseText.textContent = `Pausa: ${pauseSeconds}s`;
};

// Diminuir 15 segundos
btnDecrease.onclick = () => {
  pauseSeconds = Math.max(0, pauseSeconds - 15);
  pauseText.textContent = `Pausa: ${pauseSeconds}s`;
};




// ===============================================
// POPUP EDITAR TEXTO – PRETO/ROXO
// ===============================================
const editPopup = document.getElementById("editPopup");
const editInput = document.getElementById("editInput");
const saveEdit = document.getElementById("saveEdit");

let labelBeingEdited = null;

function openEditPopup(labelElement) {
  labelBeingEdited = labelElement;
  editInput.value = labelElement.textContent;
  editPopup.style.display = "flex";
}

saveEdit.onclick = () => {
  const newText = editInput.value.trim();

  if (newText && labelBeingEdited) {
    labelBeingEdited.textContent = newText;

    const idParts = labelBeingEdited.id.split("-");
    const diaIndex = idParts[1];
    const tarefaIndex = idParts[2];

    rotina.generatedRoutine[`Dia ${parseInt(diaIndex) + 1}`][tarefaIndex] = newText;
    localStorage.setItem("routines", JSON.stringify(rotinas));
  }

  editPopup.style.display = "none";
};
