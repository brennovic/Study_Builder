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

const API_KEY = "AIzaSyCCvPR28WmKKWovIhSo3gZvOl0bCbz2wrE"; // coloque sua API key Gemini aqui

// ---------- Renderiza as rotinas ----------
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
      <button onclick="abrirRotina('${r.id}')">Ver rotina</button>
      <button class="outline" onclick="deleteRoutine('${r.id}')">Excluir</button>
    `;
    list.appendChild(card);
  });
}

function abrirRotina(id) {
  window.location.href = `rotina.html?id=${id}`;
}

function deleteRoutine(id) {
  const index = routines.findIndex((r) => r.id === id);
  if (index >= 0) {
    routines.splice(index, 1);
    localStorage.setItem("routines", JSON.stringify(routines));
    renderRoutines();
  }
}

type.addEventListener("change", () => {
  const val = type.value;
  subjectFields.classList.toggle(
    "hidden",
    !(val === "prova" || val === "concurso")
  );
  difficultyField.classList.toggle("hidden", val !== "enem");
});

// ---------- IA: Gera rotina dia a dia ----------
async function gerarRotinaDiaADia(r) {
  const totalDias = Math.min(Math.ceil(r.daysPerWeek * 2), 10); // até 10 dias
  const rotinaGerada = {};

  for (let dia = 1; dia <= totalDias; dia++) {
    const prompt = `
Sou um professor criando uma rotina de estudos ${
      r.type === "enem"
        ? "para o ENEM"
        : r.type === "prova"
        ? "para uma prova escolar"
        : "para um concurso público"
    }.

Me diga de forma curta o que o aluno deve estudar no Dia ${dia}, em formato de lista simples, com tópicos curtos.

Exemplo de resposta esperada:
- Matemática: Equações do 2º grau
- História: Grécia Antiga
- Redação: Tema social

Não inclua explicações, apenas a lista.`;

    const resposta = await gerarRespostaIA(prompt);
    if (!resposta) continue;

    const topicos = resposta
      .split("\n")
      .map((t) => t.replace(/^[-•*\d. ]+/, "").trim())
      .filter((t) => t.length > 0);

    rotinaGerada[`Dia ${dia}`] = topicos;
  }

  return rotinaGerada;
}

// ---------- Função para chamar o Gemini ----------
async function gerarRespostaIA(prompt) {
  try {
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

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text.trim();
  } catch (error) {
    console.error("Erro na IA:", error);
    return null;
  }
}

// ---------- Botão Salvar ----------
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

  saveBtn.disabled = true;
  saveBtn.textContent = "Gerando rotina...";

  // 🔹 Gera rotina dia a dia com IA
  const rotinaGerada = await gerarRotinaDiaADia(newRoutine);

  newRoutine.generatedRoutine = rotinaGerada;
  routines.push(newRoutine);
  localStorage.setItem("routines", JSON.stringify(routines));

  saveBtn.disabled = false;
  saveBtn.textContent = "Salvar";
  modal.classList.add("hidden");
  renderRoutines();
  alert("Rotina criada com sucesso!");
});

cancelBtn.addEventListener("click", () => modal.classList.add("hidden"));
floatingBtn.addEventListener("click", () => modal.classList.remove("hidden"));
createFirstBtn.addEventListener("click", () => modal.classList.remove("hidden"));

renderRoutines();
