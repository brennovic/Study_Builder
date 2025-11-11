const routines = JSON.parse(localStorage.getItem("routines") || "[]");
const list = document.getElementById("routineList");
const emptyState = document.getElementById("emptyState");
const modal = document.getElementById("modal");
const floatingBtn = document.getElementById("floatingBtn");
const createFirstBtn = document.getElementById("createFirstBtn");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

const type = document.getElementById("type");
const subjectFields = document.getElementById("subjectFields");
const difficultyField = document.getElementById("difficultyField");

// --- Função para renderizar as rotinas na tela ---
function renderRoutines() {
  list.innerHTML = "";
  if (routines.length === 0) {
    emptyState.classList.remove("hidden");
    floatingBtn.classList.add("hidden");
    return;
  }
  emptyState.classList.add("hidden");
  floatingBtn.classList.remove("hidden");

  routines.forEach((r) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${
        r.type === "enem"
          ? "Rotina ENEM"
          : r.type === "prova"
          ? "Prova Escolar"
          : "Concurso"
      }</h3>
      <p>${r.hoursPerDay}h/dia · ${r.daysPerWeek} dias/semana</p>
      <p>Até: ${new Date(r.endDate).toLocaleDateString("pt-BR")}</p>
      ${r.subject ? `<p>📘 ${r.subject}</p>` : ""}
      ${r.difficulty ? `<p>🎯 ${r.difficulty}</p>` : ""}
      <div style="margin-top:1rem;display:flex;gap:0.5rem;justify-content:center;">
       <button class="outline" onclick="abrirRotina('${
         r.id
       }')">Ver rotina</button>

        <button onclick="deleteRoutine('${r.id}')">Excluir</button>
      </div>
    `;
    list.appendChild(card);
  });
}

function viewDetails(id) {
  const r = routines.find((r) => r.id === id);
  if (!r) return;

  alert(`
Rotina: ${r.type.toUpperCase()}
${r.hoursPerDay}h/dia · ${r.daysPerWeek} dias/semana
Até: ${new Date(r.endDate).toLocaleDateString("pt-BR")}
${r.subject ? "Assunto: " + r.subject : ""}
${r.materials ? "Materiais: " + r.materials : ""}
${r.difficulty ? "Dificuldades: " + r.difficulty : ""}

📅 Rotina detalhada:
${r.generatedRoutine || "Ainda não gerada"}
  `);
}

function deleteRoutine(id) {
  const index = routines.findIndex((r) => r.id === id);
  if (index >= 0) {
    routines.splice(index, 1);
    localStorage.setItem("routines", JSON.stringify(routines));
    renderRoutines();
  }
}

// --- Modal Controls ---
function openModal() {
  modal.classList.remove("hidden");
}
function closeModal() {
  modal.classList.add("hidden");
}

type.addEventListener("change", () => {
  const val = type.value;
  subjectFields.classList.toggle(
    "hidden",
    !(val === "prova" || val === "concurso")
  );
  difficultyField.classList.toggle("hidden", val !== "enem");
});

// --- Função para montar o prompt a ser enviado ao Gemini ---
function montarPrompt(r) {
  const tipoTexto =
    r.type === "enem"
      ? "para o ENEM"
      : r.type === "prova"
      ? "para uma prova escolar"
      : "para um concurso público";

  return `
Crie uma rotina de estudos personalizada ${tipoTexto} com base nas informações abaixo:

🗓️ Fim dos estudos: ${r.endDate}
📅 Dias por semana: ${r.daysPerWeek}
⏰ Horas por dia: ${r.hoursPerDay}

${r.subject ? `📚 Assunto principal: ${r.subject}` : ""}
${r.materials ? `📖 Materiais de estudo: ${r.materials}` : ""}
${r.difficulty ? `⚡ Dificuldades do estudante: ${r.difficulty}` : ""}

Monte uma rotina estruturada com os dias da semana, o que estudar em cada dia, pausas e dicas práticas.
A resposta deve ser formatada de forma clara e fácil de ler.
`;
}

// --- Função para chamar a API Gemini ---
const API_KEY = "AIzaSyCCvPR28WmKKWovIhSo3gZvOl0bCbz2wrE";

async function gerarRotinaGemini(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    console.error("Erro HTTP:", response.status);
    return "Erro ao gerar rotina (HTTP " + response.status + ")";
  }

  const data = await response.json();
  console.log(data);

  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Não foi possível gerar a rotina."
  );
}

// --- Ação do botão "Salvar" ---
saveBtn.addEventListener("click", async () => {
  const newRoutine = {
    id: Date.now().toString(),
    type: type.value,
    endDate: document.getElementById("endDate").value,
    daysPerWeek: parseInt(document.getElementById("days").value),
    hoursPerDay: parseInt(document.getElementById("hours").value),
    subject: document.getElementById("subject").value || undefined,
    materials: document.getElementById("materials").value || undefined,
    difficulty: document.getElementById("difficulty").value || undefined,
  };

  if (!newRoutine.type || !newRoutine.endDate) {
    alert("Preencha os campos obrigatórios!");
    return;
  }

  // Exibe um status de carregamento
  saveBtn.disabled = true;
  saveBtn.textContent = "Gerando rotina...";

  // Monta o prompt e chama o Gemini
  const prompt = montarPrompt(newRoutine);
  const resposta = await gerarRotinaGemini(prompt);

  // Armazena a rotina gerada
  newRoutine.generatedRoutine = resposta;
  routines.push(newRoutine);
  localStorage.setItem("routines", JSON.stringify(routines));

  // Restaura o botão
  saveBtn.disabled = false;
  saveBtn.textContent = "Salvar";

  closeModal();
  renderRoutines();

  alert("Rotina criada com sucesso e gerada pela IA!");
});

cancelBtn.addEventListener("click", closeModal);
floatingBtn.addEventListener("click", openModal);
createFirstBtn.addEventListener("click", openModal);

renderRoutines();
function abrirRotina(id) {
  window.location.href = `rotina.html?id=${id}`;
}
