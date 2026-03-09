const state = { seeds: [], logs: [] };
const seedGrid = document.getElementById('seedGrid');
const seedCount = document.getElementById('seedCount');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const seedSelect = document.getElementById('seedSelect');
const logForm = document.getElementById('logForm');
const logTableBody = document.getElementById('logTableBody');
const modal = document.getElementById('seedModal');
const modalContent = document.getElementById('modalContent');

const storageKey = 'banco-semillas-registros-v1';

fetch('data/seeds.json')
  .then(r => r.json())
  .then(data => {
    state.seeds = data;
    seedCount.textContent = data.length;
    fillFilters();
    fillSeedSelect();
    renderSeeds();
    loadLogs();
  });

function fillFilters() {
  const cats = [...new Set(state.seeds.map(s => s.categoria))].sort();
  cats.forEach(cat => {
    const op = document.createElement('option');
    op.value = cat;
    op.textContent = cat;
    categoryFilter.appendChild(op);
  });
}

function fillSeedSelect() {
  seedSelect.innerHTML = state.seeds.map(s => `<option value="${s.nombre}">${s.nombre}</option>`).join('');
}

function renderSeeds() {
  const term = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const filtered = state.seeds.filter(seed => {
    const matchesText = seed.nombre.toLowerCase().includes(term) || seed.categoria.toLowerCase().includes(term);
    const matchesCat = cat === 'all' || seed.categoria === cat;
    return matchesText && matchesCat;
  });

  seedGrid.innerHTML = filtered.map(seed => `
    <article class="seed-card">
      <img src="${seed.imagen}" alt="${seed.nombre}" loading="lazy">
      <div class="content">
        <div class="card-top">
          <span class="chip">${seed.categoria}</span>
          <span class="chip">Dificultad ${seed.dificultad}</span>
        </div>
        <h3>${seed.nombre}</h3>
        <p>${seed.proyecto}</p>
        <button type="button" data-seed="${seed.id}">Ver ficha</button>
      </div>
    </article>
  `).join('');

  seedGrid.querySelectorAll('button[data-seed]').forEach(btn => {
    btn.addEventListener('click', () => openSeed(btn.dataset.seed));
  });
}

function openSeed(id) {
  const seed = state.seeds.find(s => s.id === id);
  if (!seed) return;
  const focusList = Object.entries(seed.focoInvestigacion)
    .filter(([, val]) => val)
    .map(([key]) => {
      const labels = {
        germinacion: 'Germinación',
        crecimiento: 'Crecimiento',
        trasplante: 'Trasplante',
        floracion: 'Floración/Desarrollo',
        cosecha: 'Cosecha'
      };
      return `<span class="chip">${labels[key]}</span>`;
    }).join('');

  modalContent.innerHTML = `
    <div class="modal-grid">
      <div>
        <img src="${seed.imagen}" alt="${seed.nombre}">
      </div>
      <div>
        <p class="eyebrow">Ficha de semilla</p>
        <h2>${seed.nombre}</h2>
        <p>${seed.proyecto}</p>
        <div class="card-top">${focusList}</div>
        <h3>Imagen informativa del sobre</h3>
        <img src="${seed.imagenInfo}" alt="Información del sobre de ${seed.nombre}">
      </div>
    </div>
  `;
  modal.showModal();
}

searchInput.addEventListener('input', renderSeeds);
categoryFilter.addEventListener('change', renderSeeds);
document.getElementById('closeModal').addEventListener('click', () => modal.close());
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

function loadLogs() {
  state.logs = JSON.parse(localStorage.getItem(storageKey) || '[]');
  renderLogs();
}

function saveLogs() {
  localStorage.setItem(storageKey, JSON.stringify(state.logs));
  renderLogs();
}

function renderLogs() {
  if (!state.logs.length) {
    logTableBody.innerHTML = '<tr><td colspan="9">Aún no hay registros guardados.</td></tr>';
    return;
  }
  logTableBody.innerHTML = [...state.logs].reverse().map(row => `
    <tr>
      <td>${row.fecha || ''}</td>
      <td>${row.curso || ''}</td>
      <td>${row.equipo || ''}</td>
      <td>${row.semilla || ''}</td>
      <td>${row.etapa || ''}</td>
      <td>${row.altura || ''}</td>
      <td>${row.hojas || ''}</td>
      <td>${row.estado || ''}</td>
      <td>${row.observacion || ''}</td>
    </tr>
  `).join('');
}

logForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(logForm);
  const row = Object.fromEntries(formData.entries());
  state.logs.push(row);
  saveLogs();
  logForm.reset();
});

document.getElementById('clearLogs').addEventListener('click', () => {
  if (!confirm('Se eliminarán los registros locales guardados en este navegador.')) return;
  state.logs = [];
  saveLogs();
});

document.getElementById('exportCsv').addEventListener('click', () => {
  if (!state.logs.length) return alert('No hay registros para exportar.');
  const headers = ['fecha','curso','equipo','semilla','etapa','altura','hojas','estado','observacion'];
  const csv = [headers.join(',')]
    .concat(state.logs.map(row => headers.map(h => `"${String(row[h] || '').replaceAll('"', '""')}"`).join(',')))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bitacora_banco_semillas.csv';
  a.click();
  URL.revokeObjectURL(a.href);
});

const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const fontPlus = document.getElementById('fontPlus');
const fontMinus = document.getElementById('fontMinus');
const readPage = document.getElementById('readPage');
const stopRead = document.getElementById('stopRead');

root.dataset.theme = localStorage.getItem('seed-theme') || 'dark';
root.style.setProperty('--font-scale', localStorage.getItem('seed-font-scale') || '1');

themeToggle.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('seed-theme', next);
});
fontPlus.addEventListener('click', () => adjustFont(0.08));
fontMinus.addEventListener('click', () => adjustFont(-0.08));
function adjustFont(delta) {
  const current = parseFloat(getComputedStyle(root).getPropertyValue('--font-scale')) || 1;
  const next = Math.max(0.9, Math.min(1.35, +(current + delta).toFixed(2)));
  root.style.setProperty('--font-scale', next);
  localStorage.setItem('seed-font-scale', String(next));
}
readPage.addEventListener('click', () => {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(document.body.innerText.slice(0, 4000));
  utter.lang = 'es-CL';
  window.speechSynthesis.speak(utter);
});
stopRead.addEventListener('click', () => window.speechSynthesis.cancel());

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}
