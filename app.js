const seedGrid = document.getElementById("seedGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const seedSelect = document.getElementById("seedSelect");
const seedCount = document.getElementById("seedCount");
const settingsWrap = document.getElementById("settingsWrap");
const settingsToggle = document.getElementById("settingsToggle");
const accessMenu = document.getElementById("accessMenu");
const accessClose = document.getElementById("accessClose");
const themeToggle = document.getElementById("themeToggle");
const fontInc = document.getElementById("fontInc");
const fontDec = document.getElementById("fontDec");
const speakBtn = document.getElementById("speakBtn");
const stopSpeakBtn = document.getElementById("stopSpeakBtn");
const dialog = document.getElementById("seedDialog");
const closeDialog = document.getElementById("closeDialog");
const dialogContent = document.getElementById("dialogContent");
const logForm = document.getElementById("logForm");
const logTableBody = document.getElementById("logTableBody");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");

const LS_THEME = "seedbank_theme";
const LS_SCALE = "seedbank_scale";
const LS_LOGS = "seedbank_logs";
const SHEETS_WEBAPP_URL = "PEGA_AQUI_TU_URL_DE_APPS_SCRIPT";

let SEEDS = [];

function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(LS_THEME, t);
}

function applyScale(s) {
  const n = Math.min(1.35, Math.max(0.9, Number(s)));
  document.documentElement.style.setProperty("--font-scale", n);
  localStorage.setItem(LS_SCALE, n);
}

function isMenuOpen() {
  return settingsWrap?.classList.contains("menu-open");
}

function openAccessMenu() {
  if (!settingsWrap || !accessMenu || !settingsToggle) return;
  settingsWrap.classList.add("menu-open");
  accessMenu.hidden = false;
  settingsToggle.setAttribute("aria-expanded", "true");
}

function closeAccessMenu() {
  if (!settingsWrap || !accessMenu || !settingsToggle) return;
  settingsWrap.classList.remove("menu-open");
  settingsToggle.setAttribute("aria-expanded", "false");
  window.setTimeout(() => {
    if (!isMenuOpen()) accessMenu.hidden = true;
  }, 180);
}

function toggleAccessMenu() {
  isMenuOpen() ? closeAccessMenu() : openAccessMenu();
}

function runAndClose(fn) {
  return () => {
    fn();
    closeAccessMenu();
  };
}

applyTheme(localStorage.getItem(LS_THEME) || "dark");
applyScale(localStorage.getItem(LS_SCALE) || 1);

settingsToggle?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  toggleAccessMenu();
});

accessClose?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeAccessMenu();
});

accessMenu?.addEventListener("click", (e) => e.stopPropagation());

document.addEventListener("click", (e) => {
  if (settingsWrap && !settingsWrap.contains(e.target)) closeAccessMenu();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAccessMenu();
    if (dialog?.open) dialog.close();
  }
});

themeToggle?.addEventListener(
  "click",
  runAndClose(() =>
    applyTheme(
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark"
    )
  )
);

fontInc?.addEventListener(
  "click",
  runAndClose(() =>
    applyScale(
      (parseFloat(localStorage.getItem(LS_SCALE) || 1) + 0.05).toFixed(2)
    )
  )
);

fontDec?.addEventListener(
  "click",
  runAndClose(() =>
    applyScale(
      (parseFloat(localStorage.getItem(LS_SCALE) || 1) - 0.05).toFixed(2)
    )
  )
);

speakBtn?.addEventListener(
  "click",
  runAndClose(() => {
    window.speechSynthesis.cancel();
    const txt = document.body.innerText.slice(0, 4000);
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = "es-CL";
    window.speechSynthesis.speak(u);
  })
);

stopSpeakBtn?.addEventListener(
  "click",
  runAndClose(() => window.speechSynthesis.cancel())
);

function normalizeSeed(seed) {
  const focus = seed.focoInvestigacion || {};
  const focusList = Object.entries(focus)
    .filter(([, v]) => !!v)
    .map(([k]) => k.replace(/_/g, " "));

  return {
    id: seed.id,
    name: seed.nombre || seed.name || "Semilla",
    category: seed.categoria || seed.category || "Sin categoría",
    difficulty: seed.dificultad || seed.difficulty || "Media",
    frontImage: seed.imagen || seed.frontImage || "",
    backImage: seed.imagenInfo || seed.backImage || "",
    project: seed.proyecto || seed.description || "Sin descripción disponible.",
    description:
      seed.description || seed.proyecto || "Sin descripción disponible.",
    researchFocus: seed.researchFocus || focusList,
  };
}

async function loadSeeds() {
  try {
    const res = await fetch("data/seeds.json");
    const data = await res.json();
    SEEDS = data.map(normalizeSeed);
  } catch (e) {
    if (Array.isArray(window.SEED_DATA)) {
      SEEDS = window.SEED_DATA.map(normalizeSeed);
    } else {
      console.error(e);
      SEEDS = [];
    }
  }

  fillFilters();
  fillSeedSelect();
  renderSeeds();
  seedCount.textContent = String(SEEDS.length);
}

function uniqueCategories() {
  return [...new Set(SEEDS.map((s) => s.category).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "es")
  );
}

function fillFilters() {
  categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
  uniqueCategories().forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

function fillSeedSelect() {
  seedSelect.innerHTML = '<option value="">Seleccionar...</option>';
  SEEDS.forEach((seed) => {
    const opt = document.createElement("option");
    opt.value = seed.id;
    opt.textContent = seed.name;
    seedSelect.appendChild(opt);
  });
}

function filteredSeeds() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const c = categoryFilter.value;

  return SEEDS.filter((seed) => {
    const okCategory = !c || seed.category === c;
    const haystack = [seed.name, seed.category, seed.description, seed.project]
      .join(" ")
      .toLowerCase();
    const okSearch = !q || haystack.includes(q);
    return okCategory && okSearch;
  });
}

function renderSeeds() {
  const items = filteredSeeds();
  seedGrid.innerHTML = "";

  items.forEach((seed) => {
    const card = document.createElement("article");
    card.className = "seed-card";
    card.innerHTML = `
      <div class="seed-card-media"><img src="${seed.frontImage}" alt="${seed.name}" loading="lazy"></div>
      <div class="seed-body">
        <span class="chip">${seed.category}</span>
        <h3>${seed.name}</h3>
        <p class="seed-desc">${seed.description}</p>
        <div class="seed-meta"><span>Dificultad: ${seed.difficulty}</span></div>
        <button class="secondary-btn seed-open" type="button">Ver ficha</button>
      </div>
    `;
    card
      .querySelector(".seed-open")
      .addEventListener("click", () => openSeedDialog(seed));
    seedGrid.appendChild(card);
  });
}

function openSeedDialog(seed) {
  dialogContent.innerHTML = `
    <div class="dialog-layout">
      <div class="dialog-images">
        <img src="${seed.frontImage}" alt="Frente de ${seed.name}">
        <img src="${seed.backImage}" alt="Reverso de ${seed.name}">
      </div>
      <div class="dialog-info">
        <span class="chip">${seed.category}</span>
        <h3>${seed.name}</h3>
        <p>${seed.description}</p>
        <p><strong>Proyecto / uso pedagógico:</strong> ${seed.project}</p>
        <p><strong>Dificultad:</strong> ${seed.difficulty}</p>
        <p><strong>Foco de investigación:</strong> ${
          seed.researchFocus.length ? seed.researchFocus.join(", ") : "Sin datos"
        }</p>
      </div>
    </div>
  `;
  dialog.showModal();
}

closeDialog?.addEventListener("click", () => dialog.close());

dialog?.addEventListener("click", (e) => {
  const rect = dialog.getBoundingClientRect();
  const inside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;
  if (!inside) dialog.close();
});

function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(LS_LOGS) || "[]");
  } catch {
    return [];
  }
}

function setLogs(logs) {
  localStorage.setItem(LS_LOGS, JSON.stringify(logs));
}

function renderLogs() {
  const logs = getLogs();
  logTableBody.innerHTML = "";
  logs.forEach((log) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${log.fecha}</td><td>${log.semilla}</td><td>${log.equipo}</td><td>${log.etapa}</td><td>${log.altura || "-"}</td><td>${log.hojas || "-"}</td><td>${log.observacion || "-"}</td>`;
    logTableBody.appendChild(tr);
  });
}

function getActiveUser() {
  try {
    if (window.currentUser && typeof window.currentUser === "object") {
      return {
        id: window.currentUser.id || "",
        email: window.currentUser.email || "",
        name: window.currentUser.name || window.currentUser.full_name || ""
      };
    }

    const lsCandidates = [
      "user",
      "currentUser",
      "profile",
      "peve_user",
      "session_user"
    ];

    for (const key of lsCandidates) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return {
            id: parsed.id || parsed.user_id || "",
            email: parsed.email || "",
            name: parsed.name || parsed.full_name || parsed.display_name || ""
          };
        }
      } catch {}
    }

    return { id: "", email: "", name: "" };
  } catch {
    return { id: "", email: "", name: "" };
  }
}

async function saveLogToGoogleSheets(payload) {
  if (!SHEETS_WEBAPP_URL || SHEETS_WEBAPP_URL.includes("PEGA_AQUI")) {
    console.warn("Falta configurar SHEETS_WEBAPP_URL");
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch(SHEETS_WEBAPP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: res.ok, raw: text };
    }
  } catch (error) {
    console.error("Error enviando a Google Sheets:", error);
    return { ok: false, error: String(error) };
  }
}

logForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const seed = SEEDS.find((s) => s.id === seedSelect.value);
  const user = getActiveUser();

  const entry = {
    fecha: document.getElementById("dateInput").value,
    semilla: seed?.name || seedSelect.value,
    equipo: document.getElementById("teamInput").value,
    etapa: document.getElementById("stageInput").value,
    altura: document.getElementById("heightInput").value,
    hojas: document.getElementById("leavesInput").value,
    observacion: document.getElementById("obsInput").value,
  };

  const logs = getLogs();
  logs.unshift(entry);
  setLogs(logs);
  renderLogs();

  const payload = {
    user_id: user.id || "",
    user_email: user.email || "",
    user_name: user.name || "",
    fecha: entry.fecha,
    semilla: entry.semilla,
    equipo: entry.equipo,
    etapa: entry.etapa,
    altura: entry.altura,
    hojas: entry.hojas,
    observacion: entry.observacion,
    origen: "BANCO_SEMILLA"
  };

  const submitBtn = logForm.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : "";

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";
    }

    const remoteResult = await saveLogToGoogleSheets(payload);

    if (remoteResult?.ok) {
      alert("Registro guardado en la bitácora y enviado a Google Sheets.");
    } else if (remoteResult?.skipped) {
      alert("Registro guardado localmente. Falta configurar la URL de Google Sheets.");
    } else {
      alert("Registro guardado localmente, pero falló el envío a Google Sheets.");
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText || "Guardar registro";
    }
    logForm.reset();
  }
});

exportBtn?.addEventListener("click", () => {
  const rows = [
    ["Fecha", "Semilla", "Equipo", "Etapa", "Altura", "Hojas", "Observación"],
  ];

  getLogs().forEach((r) =>
    rows.push([
      r.fecha,
      r.semilla,
      r.equipo,
      r.etapa,
      r.altura,
      r.hojas,
      r.observacion,
    ])
  );

  const csv = rows
    .map((r) =>
      r.map((v) => `"${String(v || "").replaceAll('"', '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "bitacora_semillas.csv";
  a.click();
  URL.revokeObjectURL(a.href);
});

clearBtn?.addEventListener("click", () => {
  localStorage.removeItem(LS_LOGS);
  renderLogs();
});

searchInput?.addEventListener("input", renderSeeds);
categoryFilter?.addEventListener("change", renderSeeds);

renderLogs();
loadSeeds();
