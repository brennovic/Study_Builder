// Lê o ID da rotina da URL
const params = new URLSearchParams(window.location.search);
const rotinaId = params.get("id");

const tituloRotina = document.getElementById("tituloRotina");
const descricaoRotina = document.getElementById("descricaoRotina");
const diasContainer = document.getElementById("diasContainer");
const voltarBtn = document.getElementById("voltarBtn");

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

  gerarDias(rotina);
}

voltarBtn.addEventListener("click", () => {
  window.location.href = "principal.html";
});

function gerarDias(r) {
  diasContainer.innerHTML = "";

  const rotina = r.generatedRoutine;
  if (!rotina || typeof rotina !== "object") {
    diasContainer.innerHTML = "<p>Não há rotina gerada para esta tarefa.</p>";
    return;
  }

  Object.entries(rotina).forEach(([dia, topicos], i) => {
    const card = document.createElement("div");
    card.className = "dia-card";

    const tarefasHTML = topicos
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
      <h3>${dia}</h3>
      <ul class="tarefas">${tarefasHTML}</ul>
      <p class="progresso">0/${topicos.length} concluídas</p>
    `;

    diasContainer.appendChild(card);

    const checkboxes = card.querySelectorAll('input[type="checkbox"]');
    const progresso = card.querySelector(".progresso");

    checkboxes.forEach((cb) =>
      cb.addEventListener("change", () => {
        const feitos = card.querySelectorAll('input[type="checkbox"]:checked')
          .length;
        progresso.textContent = `${feitos}/${topicos.length} concluídas`;
        card.classList.toggle("completed", feitos === topicos.length);
      })
    );
  });
}
