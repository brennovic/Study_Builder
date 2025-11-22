// ============================
// VARIÁVEIS PRINCIPAIS
// ============================

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

const pdfInput = document.getElementById("pdfInput");
const pdfList = document.getElementById("pdfList");
let pdfFilesBase64 = [];

// ============================
// ANIMAÇOES
// ============================

function iniciarGeracaoRotina() {
  document.getElementById("formContent").style.display = "none";
  document.getElementById("loadingLottie").style.display = "block";
  document.getElementById("loadingButtons").style.display = "block";
}

function finalizarGeracaoRotina() {
  document.getElementById("loadingLottie").style.display = "none";
  document.getElementById("loadingButtons").style.display = "none";
  document.getElementById("formContent").style.display = "block";
}


// ============================
// API
// ============================
const API_KEY = "AIzaSyC6ZZbuWkfOiUtdzmAeGNfuGBa1zvH-siI";


// ============================
// RENDERIZA AS ROTINAS
// ============================

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

    const hoje = new Date();
    const fim = new Date(r.endDate);
    const diffMs = fim - hoje > 0 ? fim - hoje : 0;
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffSemanas = Math.ceil(diffDias / 7);

    card.innerHTML = `
            <h3>${
        r.type === "enem"
          ? "Rotina ENEM"
          : "Prova Escolar"
      }</h3>

      <p>${r.hoursPerDay}h/dia · ${r.daysPerWeek} dias/semana</p>
      <p>Até: ${new Date(r.endDate).toLocaleDateString("pt-BR")}</p>
      <p>⏳ ${diffDias} dias restantes (${diffSemanas} semanas)</p>
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


// ============================
// CAMPOS CONDICIONAIS DO FORM
// ============================

const typeButtons = document.querySelectorAll(".type-btn");

typeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    typeButtons.forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    const selected = btn.getAttribute("data-type");
    type.value = selected;

    subjectFields.classList.toggle("hidden", selected !== "prova");
    difficultyField.classList.toggle("hidden", selected !== "enem");
  });
});

// ============================
// UPLOAD DE PDFs
// ============================

pdfInput.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);
  pdfFilesBase64 = [];

  pdfList.innerHTML = "<p>Carregando PDFs...</p>";

  for (let file of files) {
    const base64 = await fileToBase64(file);
    pdfFilesBase64.push({
      name: file.name,
      data: base64,
    });
  }

  pdfList.innerHTML = pdfFilesBase64
    .map((f) => `<p>📄 ${f.name}</p>`)
    .join("");
});

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}


// ============================
// EXTRAIR TEXTO DO PDF (PDF.js)
// ============================

async function extractTextFromPDF(base64) {
  const pdfData = atob(base64.split(",")[1]);

  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    text += strings.join(" ") + "\n";
  }

  return text;
}


// ============================
// JUNTA MATERIAIS + PDFs
// ============================

async function coletarTextoDosMateriais(r) {
  let texto = "";

  if (r.materials) {
    texto += `Materiais escritos:\n${r.materials}\n\n`;
  }

  if (r.pdfs && r.pdfs.length > 0) {
    texto += "Conteúdo extraído dos PDFs:\n";

    for (const pdf of r.pdfs) {
      const textoPDF = await extractTextFromPDF(pdf.data);

      texto += `
============ PDF: ${pdf.name} ============
${textoPDF}
==========================================
`
console.log("Texto extraído:", textoPDF);

;
    }
  }

  return texto;
}


// ============================
// IA: GERAR ROTINA DIA A DIA
// ============================

async function gerarRotinaDiaADia(r) {
  iniciarGeracaoRotina(); // ⬅ Liga o modo "gerando"

  const hoje = new Date();
  const fim = new Date(r.endDate);
  const diffMs = fim - hoje > 0 ? fim - hoje : 0;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const totalDias = Math.min(diffDias, r.daysPerWeek * 2, 15);
  const rotinaGerada = {};

  for (let dia = 1; dia <= totalDias; dia++) {
    const prompt =
      r.type === "enem"
        ? gerarPromptENEM(r, dia, totalDias)
        : gerarPromptGeral(r, dia, totalDias);

    const materiaisTexto = await coletarTextoDosMateriais(r);
    const resposta = await gerarRespostaIA(prompt, materiaisTexto);
    if (!resposta) continue;

    const topicos = resposta
      .split("\n")
      .map((t) => t.replace(/^[-•*\d. ]+/, "").trim())
      .filter((t) => t.length > 0);

    rotinaGerada[`Dia ${dia}`] = topicos;
  }

  finalizarGeracaoRotina(); // ⬅ Desliga o modo "gerando"
  return rotinaGerada;
}




// ============================
// PROMPT ENEM
// ============================

function gerarPromptENEM(r, dia, totalDias) {
  const dificuldade = r.difficulty ? r.difficulty : "nenhuma área específica";
  return `
Você é um professor especialista em ENEM.
Crie uma rotina de estudos equilibrada em ${totalDias} dias, ${r.hoursPerDay} horas por dia.
O aluno tem dificuldade em ${dificuldade}.

Monte a lista do que estudar no Dia ${dia}, incluindo:
- Linguagens
- Matemática
- Ciências Humanas
- Ciências da Natureza
- Tema de Redação

Responda apenas com tópicos.
`;
}


// ============================
// PROMPT GERAL
// ============================

function gerarPromptGeral(r, dia, totalDias) {
  const assunto = r.subject ? `O foco principal é: ${r.subject}.` : "";
  const dificuldade = r.difficulty
    ? `O aluno tem dificuldade em: ${r.difficulty}.`
    : "";

  return `
Sou um professor criando uma rotina de estudos 
${r.type === "prova" ? "para prova escolar" : "para concurso público"}.

O aluno estudará ${r.hoursPerDay}h por dia, ${r.daysPerWeek} dias por semana.
Dia ${dia} de ${totalDias}.

${assunto}
${dificuldade}

Liste tópicos curtos do que deve ser estudado hoje.
`;
}


// ============================
// IA (Gemini)
// ============================

async function gerarRespostaIA(prompt, materiaisTexto) {
  try {
    let promptFinal;
    if (!materiaisTexto || materiaisTexto.trim().length === 0) {
      // Aqui gera um prompt sem restrição a materiais para o ENEM
      promptFinal = `
${prompt}

-----------------------------------------
Não há materiais fornecidos. Gere uma rotina de estudos baseada no conhecimento padrão do ENEM.
-----------------------------------------

REGRAS:
- Produza apenas tópicos de estudo.
      `;
    } else {
      promptFinal = `
${prompt}

-----------------------------------------
MATERIAIS DO ALUNO (TEXTOS + PDFs)
Use exclusivamente o conteúdo abaixo para gerar os tópicos:
${materiaisTexto}
-----------------------------------------

REGRAS:
- Não invente conteúdo que não esteja nos materiais.
- Escolha somente temas realmente presentes nos textos.
- Produza apenas tópicos de estudo.
      `;
    }

    // Chamada à API permanece a mesma
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: promptFinal }] }],
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



// ============================
// SALVAR ROTINA
// ============================

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
    pdfs: pdfFilesBase64.length > 0 ? pdfFilesBase64 : [],
  };

  if (!newRoutine.type || !newRoutine.endDate) {
    alert("Preencha os campos obrigatórios!");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Gerando rotina...";

  const rotinaGerada = await gerarRotinaDiaADia(newRoutine);

  newRoutine.generatedRoutine = rotinaGerada;
  routines.push(newRoutine);
  localStorage.setItem("routines", JSON.stringify(routines));

  saveBtn.disabled = false;
  saveBtn.textContent = "Salvar";
  modal.classList.add("hidden");
  renderRoutines();
  alert("Rotina criada com sucesso!");

  // limpar PDFs
  pdfInput.value = "";
  pdfFilesBase64 = [];
  pdfList.innerHTML = "";
});


// ============================
// BOTÕES
// ============================

cancelBtn.addEventListener("click", () => modal.classList.add("hidden"));
floatingBtn.addEventListener("click", () => modal.classList.remove("hidden"));
createFirstBtn.addEventListener("click", () => modal.classList.remove("hidden"));

renderRoutines();
