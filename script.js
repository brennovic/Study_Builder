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
      <h3>${r.type === "enem" ? "Rotina ENEM" : r.type === "prova" ? "Prova Escolar" : "Concurso"}</h3>
      <p>${r.hoursPerDay}h/dia · ${r.daysPerWeek} dias/semana</p>
      <p>Até: ${new Date(r.endDate).toLocaleDateString("pt-BR")}</p>
      ${r.subject ? `<p>📘 ${r.subject}</p>` : ""}
      ${r.difficulty ? `<p>🎯 ${r.difficulty}</p>` : ""}
      <div style="margin-top:1rem;display:flex;gap:0.5rem;justify-content:center;">
        <button class="outline" onclick="viewDetails('${r.id}')">Ver detalhes</button>
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
  subjectFields.classList.toggle("hidden", !(val === "prova" || val === "concurso"));
  difficultyField.classList.toggle("hidden", val !== "enem");
});

saveBtn.addEventListener("click", () => {
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

  routines.push(newRoutine);
  localStorage.setItem("routines", JSON.stringify(routines));
  closeModal();
  renderRoutines();
});

cancelBtn.addEventListener("click", closeModal);
floatingBtn.addEventListener("click", openModal);
createFirstBtn.addEventListener("click", openModal);

renderRoutines();
