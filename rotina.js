// Lê o ID da rotina da URL (ex: rotina.html?id=12345)
const params = new URLSearchParams(window.location.search);
const rotinaId = params.get("id");

const tituloRotina = document.getElementById("tituloRotina");
const descricaoRotina = document.getElementById("descricaoRotina");
const diasContainer = document.getElementById("diasContainer");
const voltarBtn = document.getElementById("voltarBtn");

// Recupera rotinas do localStorage
const rotinas = JSON.parse(localStorage.getItem("routines") || "[]");
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

  descricaoRotina.textContent = `Estudar até ${new Date(
    rotina.endDate
  ).toLocaleDateString("pt-BR")}, ${rotina.hoursPerDay}h por dia, ${
    rotina.daysPerWeek
  }x por semana.`;

  // Gera os dias da rotina com base na resposta da IA
  gerarDias(rotina);
}

voltarBtn.addEventListener("click", () => {
  window.location.href = "principal.html";
});

function gerarDias(r) {
  diasContainer.innerHTML = "";

  // Se a IA já gerou texto, vamos dividir por linhas (cada linha = tarefa)
  const linhas = (r.generatedRoutine || "")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  // Divide o texto por dias (Dia 1, Dia 2...)
  let dias = [];
  let diaAtual = { titulo: "", tarefas: [] };

  linhas.forEach((linha) => {
    const match = linha.match(/dia\s*(\d+)/i);
    if (match) {
      if (diaAtual.tarefas.length > 0) dias.push(diaAtual);
      diaAtual = { titulo: `Dia ${match[1]}`, tarefas: [] };
    } else {
      diaAtual.tarefas.push(linha.trim());
    }
  });
  if (diaAtual.tarefas.length > 0) dias.push(diaAtual);

  // Renderiza cada dia
  dias.forEach((dia, i) => {
    const card = document.createElement("div");
    card.className = "dia-card";

    const tarefasHTML = dia.tarefas
      .map(
        (t, index) => `
      <li>
        <input type="checkbox" id="dia${i}-tarefa${index}" />
        <label for="dia${i}-tarefa${index}">${t}</label>
      </li>
    `
      )
      .join("");

    card.innerHTML = `
      <h3>${dia.titulo}</h3>
      <ul class="tarefas">${tarefasHTML}</ul>
      <p class="progresso">0/${dia.tarefas.length} concluídas</p>
    `;

    diasContainer.appendChild(card);

    // Adiciona evento de progresso
    const checkboxes = card.querySelectorAll('input[type="checkbox"]');
    const progresso = card.querySelector(".progresso");
    checkboxes.forEach((cb) =>
      cb.addEventListener("change", () => {
        const feitos = card.querySelectorAll('input[type="checkbox"]:checked')
          .length;
        progresso.textContent = `${feitos}/${dia.tarefas.length} concluídas`;
        card.classList.toggle("completed", feitos === dia.tarefas.length);
      })
    );
  });
}
