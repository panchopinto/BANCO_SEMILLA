const el = (id) => document.getElementById(id);

const seedGrid = el('seedGrid');
const searchInput = el('searchInput');
const categoryFilter = el('categoryFilter');
const seedSelect = el('seedSelect');
const seedCount = el('seedCount');
const settingsWrap = el('settingsWrap');
const settingsToggle = el('settingsToggle');
const accessMenu = el('accessMenu');
const themeToggle = el('themeToggle');
const fontInc = el('fontInc');
const fontDec = el('fontDec');
const speakBtn = el('speakBtn');
const stopSpeakBtn = el('stopSpeakBtn');
const dialog = el('seedDialog');
const closeDialog = el('closeDialog');
const dialogContent = el('dialogContent');
const logForm = el('logForm');
const logTableBody = el('logTableBody');
const exportBtn = el('exportBtn');
const clearBtn = el('clearBtn');
const dateInput = el('dateInput');

const LS_THEME = 'seedbank_theme';
const LS_SCALE = 'seedbank_scale';
const LS_LOGS = 'seedbank_logs';
let SEEDS = [];

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(LS_THEME, theme);
}

function applyScale(scale) {
  const value = Math.min(1.35, Math.max(0.9, Number(scale) || 1));
  document.documentElement.style.setProperty('--font-scale', value);
  localStorage.setItem(LS_SCALE, String(value));
}

function isMenuOpen() {
  return settingsWrap && settingsWrap.classList.contains('menu-open');
}

function openAccessMenu() {
  if (!settingsWrap || !accessMenu || !settingsToggle) return;
  settingsWrap.classList.add('menu-open');
  accessMenu.hidden = false;
  settingsToggle.setAttribute('aria-expanded', 'true');
}

function closeAccessMenu() {
  if (!settingsWrap || !accessMenu || !settingsToggle) return;
  settingsWrap.classList.remove('menu-open');
  settingsToggle.setAttribute('aria-expanded', 'false');
  window.setTimeout(() => {
    if (!isMenuOpen()) accessMenu.hidden = true;
  }, 120);
}

function toggleAccessMenu() {
  isMenuOpen() ? closeAccessMenu() : openAccessMenu();
}

function normalizeSeed(seed) {
  if (seed && seed.nombre) {
    const focus = Object.entries(seed.focoInvestigacion || {})
      .filter(([, active]) => Boolean(active))
      .map(([key]) => ({
        germinacion: 'germinación',
        crecimiento: 'crecimiento',
        trasplante: 'trasplante',
        floracion: 'floración',
        cosecha: 'cosecha'
      }[key] || key));
    return {
      id: seed.id,
      name: seed.nombre,
      scientificName: seed.nombreCientifico || '',
      category: seed.categoria || 'Por clasificar',
      season: seed.temporada || 'Por definir',
      daysGermination: seed.diasGerminacion || '',
      daysHarvest: seed.diasCosecha || '',
      difficulty: seed.dificultad || 'Media',
      frontImage: seed.imagen,
      backImage: seed.imagenInfo || seed.imagen,
      researchFocus: focus,
      notes: seed.notas || 'Usar el reverso del sobre para registrar instrucciones, profundidad de siembra y distancias.',
      description: seed.descripcion || seed.proyecto || `${seed.nombre} es una semilla útil para proyectos escolares de seguimiento, comparación de crecimiento y registro de datos en invernadero.`
    };
  }
  return {
    ...seed,
    name: seed.name || seed.nombre || 'Semilla sin nombre',
    category: seed.category || seed.categoria || 'Por clasificar',
    frontImage: seed.frontImage || seed.imagen || '',
    backImage: seed.backImage || seed.imagenInfo || seed.frontImage || seed.imagen || '',
    researchFocus: seed.researchFocus || [],
    description: seed.description || seed.proyecto || ''
  };
}

async function loadSeeds() {
  try {
    const response = await fetch('data/seeds.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo leer data/seeds.json');
    const json = await response.json();
    SEEDS = json.map(normalizeSeed);
  } catch (error) {
    const fallback = Array.isArray(window.SEED_DATA) ? window.SEED_DATA : [];
    SEEDS = fallback.map(normalizeSeed);
  }
}

function uniqueCategories() {
  return [...new Set(SEEDS.map((s) => s.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}

function fillFilters() {
  if (!categoryFilter) return;
  categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
  uniqueCategories().forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

function fillSeedSelect() {
  if (!seedSelect) return;
  seedSelect.innerHTML = '<option value="">Seleccionar...</option>';
  SEEDS.forEach((seed) => {
    const opt = document.createElement('option');
    opt.value = seed.id;
    opt.textContent = seed.name;
    seedSelect.appendChild(opt);
  });
}

function getSeedDescription(seed) {
  if (seed.description && String(seed.description).trim()) return String(seed.description).trim();
  const focus = (seed.researchFocus || []).slice(0, 3).join(', ');
  return `${seed.name} permite desarrollar seguimiento escolar del cultivo, con observación de variables como riego, luz, temperatura y crecimiento. Puede investigarse mediante ${focus || 'germinación, crecimiento y análisis de datos'}.`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function cardTemplate(seed) {
  return `
    <article class="seed-card">
      <button type="button" data-seed-id="${escapeHtml(seed.id)}">
        <img src="${escapeHtml(seed.frontImage)}" alt="${escapeHtml(seed.name)}" loading="lazy" onerror="this.style.display='none'">
        <div class="seed-body">
          <h3>${escapeHtml(seed.name)}</h3>
          <p class="seed-desc">${escapeHtml(getSeedDescription(seed))}</p>
          <div class="badge-row">
            <span class="badge">${escapeHtml(seed.category || 'Por clasificar')}</span>
            <span class="badge">${escapeHtml(seed.season || 'Sin temporada')}</span>
          </div>
          <div class="meta">
            <span><strong>Dificultad:</strong> ${escapeHtml(seed.difficulty || 'Media')}</span>
            <span><strong>Enfoque:</strong> ${escapeHtml((seed.researchFocus || []).slice(0, 2).join(', ') || 'Seguimiento del cultivo')}</span>
          </div>
        </div>
      </button>
    </article>`;
}

function renderSeeds() {
  if (!seedGrid) return;
  const term = (searchInput?.value || '').trim().toLowerCase();
  const filter = categoryFilter?.value || '';
  const filtered = SEEDS.filter((seed) => {
    const haystack = [seed.name, seed.category, seed.scientificName, seed.description, ...(seed.researchFocus || [])]
      .join(' ')
      .toLowerCase();
    return (!term || haystack.includes(term)) && (!filter || seed.category === filter);
  });
  seedGrid.innerHTML = filtered.map(cardTemplate).join('');
  seedGrid.querySelectorAll('.seed-card button').forEach((btn) => {
    btn.addEventListener('click', () => openSeedDialog(btn.dataset.seedId));
  });
  if (seedCount) seedCount.textContent = String(filtered.length);
}

function openSeedDialog(id) {
  const seed = SEEDS.find((s) => s.id === id);
  if (!seed || !dialog || !dialogContent) return;
  dialogContent.innerHTML = `
    <div class="dialog-layout">
      <div class="dialog-images">
        <figure>
          <img src="${escapeHtml(seed.frontImage)}" alt="Vista frontal del sobre ${escapeHtml(seed.name)}" loading="lazy" onerror="this.style.display='none'">
          <figcaption>Frontal del sobre</figcaption>
        </figure>
        <figure>
          <img src="${escapeHtml(seed.backImage || seed.frontImage)}" alt="Vista posterior del sobre ${escapeHtml(seed.name)}" loading="lazy" onerror="this.style.display='none'">
          <figcaption>Reverso del sobre</figcaption>
        </figure>
      </div>
      <div class="dialog-info">
        <span class="eyebrow">Ficha pedagógica</span>
        <h3>${escapeHtml(seed.name)}</h3>
        <p class="dialog-desc">${escapeHtml(getSeedDescription(seed))}</p>
        <p><strong>Categoría:</strong> ${escapeHtml(seed.category || 'Por clasificar')}</p>
        <p><strong>Dificultad:</strong> ${escapeHtml(seed.difficulty || 'Media')}</p>
        <p><strong>Temporada sugerida:</strong> ${escapeHtml(seed.season || 'No registrada')}</p>
        <p><strong>Días de germinación:</strong> ${escapeHtml(seed.daysGermination || 'Completar según el sobre')}</p>
        <p><strong>Días a cosecha:</strong> ${escapeHtml(seed.daysHarvest || 'Completar según el sobre')}</p>
        <p><strong>Notas de uso:</strong> ${escapeHtml(seed.notes || 'Completar observaciones del sobre, fecha de siembra y condiciones del ensayo.')}</p>
        <h4>Ideas de investigación</h4>
        <ul>${(seed.researchFocus || ['germinación', 'crecimiento', 'registro de datos']).map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
      </div>
    </div>`;
  dialog.showModal();
}

function getLogs() {
  return JSON.parse(localStorage.getItem(LS_LOGS) || '[]');
}

function saveLogs(logs) {
  localStorage.setItem(LS_LOGS, JSON.stringify(logs));
}

function renderLogs() {
  if (!logTableBody) return;
  const logs = getLogs().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  logTableBody.innerHTML = logs.map((log) => `
    <tr>
      <td>${escapeHtml(log.date)}</td>
      <td>${escapeHtml(log.seedName)}</td>
      <td>${escapeHtml(log.team)}</td>
      <td>${escapeHtml(log.stage)}</td>
      <td>${escapeHtml(log.height || '—')} cm</td>
      <td>${escapeHtml(log.leaves || '—')}</td>
      <td>${escapeHtml(log.obs || '—')}</td>
    </tr>`).join('');
}

function exportLogs() {
  const logs = getLogs();
  if (!logs.length) {
    alert('No hay registros para exportar.');
    return;
  }
  const headers = ['fecha', 'semilla', 'equipo', 'etapa', 'altura_cm', 'hojas', 'observacion'];
  const rows = logs.map((l) => [l.date, l.seedName, l.team, l.stage, l.height, l.leaves, l.obs]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','))].join('
');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bitacora_semillas.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function bindUI() {
  applyTheme(localStorage.getItem(LS_THEME) || 'dark');
  applyScale(localStorage.getItem(LS_SCALE) || 1);

  settingsToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleAccessMenu();
  });
  accessMenu?.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', (e) => {
    if (settingsWrap && !settingsWrap.contains(e.target)) closeAccessMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAccessMenu();
      if (dialog?.open) dialog.close();
    }
  });

  const runAndClose = (fn) => () => {
    fn();
    closeAccessMenu();
  };

  themeToggle?.addEventListener('click', runAndClose(() => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')));
  fontInc?.addEventListener('click', runAndClose(() => applyScale((parseFloat(localStorage.getItem(LS_SCALE) || 1) + 0.05).toFixed(2))));
  fontDec?.addEventListener('click', runAndClose(() => applyScale((parseFloat(localStorage.getItem(LS_SCALE) || 1) - 0.05).toFixed(2))));
  speakBtn?.addEventListener('click', runAndClose(() => {
    window.speechSynthesis.cancel();
    const text = document.body.innerText.slice(0, 4000);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CL';
    window.speechSynthesis.speak(utterance);
  }));
  stopSpeakBtn?.addEventListener('click', runAndClose(() => window.speechSynthesis.cancel()));

  closeDialog?.addEventListener('click', () => dialog?.close());
  searchInput?.addEventListener('input', renderSeeds);
  categoryFilter?.addEventListener('change', renderSeeds);

  logForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedId = seedSelect?.value;
    const seed = SEEDS.find((s) => s.id === selectedId);
    if (!seed) return;
    const entry = {
      date: dateInput?.value || '',
      seedId: seed.id,
      seedName: seed.name,
      team: el('teamInput')?.value.trim() || '',
      stage: el('stageInput')?.value || '',
      height: el('heightInput')?.value || '',
      leaves: el('leavesInput')?.value || '',
      obs: el('obsInput')?.value.trim() || ''
    };
    const logs = getLogs();
    logs.push(entry);
    saveLogs(logs);
    renderLogs();
    logForm.reset();
    if (dateInput) dateInput.valueAsDate = new Date();
  });

  exportBtn?.addEventListener('click', exportLogs);
  clearBtn?.addEventListener('click', () => {
    if (!confirm('¿Seguro que deseas eliminar todos los registros guardados en este navegador?')) return;
    localStorage.removeItem(LS_LOGS);
    renderLogs();
  });
}

(async function init() {
  bindUI();
  await loadSeeds();
  fillFilters();
  fillSeedSelect();
  renderSeeds();
  renderLogs();
  if (dateInput) dateInput.valueAsDate = new Date();
})();
