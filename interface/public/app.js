// ─── AgentIA-Ecriture — Application Frontend ───

const API_BASE = '/api';

// ─── Auth ────────────────────────────────────────────────────────────────────
const AUTH_TOKEN_KEY = 'agentia_auth_token';

function getToken() { return localStorage.getItem(AUTH_TOKEN_KEY); }
function setToken(t) { if (t) localStorage.setItem(AUTH_TOKEN_KEY, t); else localStorage.removeItem(AUTH_TOKEN_KEY); }

let currentUser = null;

async function checkAuth() {
  const token = getToken();
  if (!token) return false;
  try {
    const resp = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) { setToken(null); return false; }
    const data = await resp.json();
    currentUser = data.user;
    window.userQuota = data.quota;
    window.userStyle = data.style;
    return true;
  } catch { return false; }
}

async function login(email, password) {
  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!resp.ok) { const e = await resp.json(); throw new Error(e.error); }
  const data = await resp.json();
  setToken(data.token);
  currentUser = data.user;
  // Charger quota + style
  try {
    const me = await fetchJSON(`${API_BASE}/auth/me`, authHeaders());
    window.userQuota = me.quota;
    window.userStyle = me.style;
  } catch {}
}

async function register(email, password, inviteCode, name) {
  const resp = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, inviteCode, name })
  });
  if (!resp.ok) { const e = await resp.json(); throw new Error(e.error); }
  const data = await resp.json();
  setToken(data.token);
  currentUser = data.user;
}

function logout() {
  const token = getToken();
  if (token) {
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }).catch(() => {});
  }
  setToken(null);
  currentUser = null;
  document.body.classList.add('auth-mode');
  afficherVue('login');
}

function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Rendu Markdown sécurisé (S5) : marked produit le HTML, DOMPurify le nettoie
// avant insertion (le contenu vient de fichiers/uploads, donc non fiable).
function renderMarkdown(md) {
  const html = marked.parse(md || '');
  return (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(html) : html;
}

// ─── État global ───
const state = {
  view: 'dashboard',
  genre: null,
  projet: null,
  data: {
    projets: [],
    skills: [],
    knowledge: null,
    echantillons: []
  }
};

// ─── Initialisation ───
document.addEventListener('DOMContentLoaded', async () => {
  const isAuth = await checkAuth();
  setupNavigation();
  setupRefresh();
  if (!isAuth) {
    document.body.classList.add('auth-mode');
    afficherVue('login');
  } else {
    document.body.classList.remove('auth-mode');
    updateAuthUI();
    await chargerDonnees();
    afficherVue('dashboard');
  }
});

// ─── Chargement des données ───
async function chargerDonnees() {
  try {
    const headers = authHeaders();
    const [projets, skills, knowledge, echantillons] = await Promise.all([
      fetchJSON(`${API_BASE}/projets`, headers),
      fetchJSON(`${API_BASE}/skills`, headers),
      fetchJSON(`${API_BASE}/knowledge`, headers),
      fetchJSON(`${API_BASE}/echantillons`, headers)
    ]);
    state.data.projets = projets;
    state.data.skills = skills;
    state.data.knowledge = knowledge;
    state.data.echantillons = echantillons;
    renderGenresNav();
  } catch (err) {
    console.error('Erreur chargement:', err);
  }
}

async function fetchJSON(url, headers = {}, body = null, method) {
  const opts = { headers: { ...headers, ...authHeaders() } };
  if (body) {
    opts.method = method || 'POST';
    opts.body = body;
  }
  const r = await fetch(url, opts);
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { const e = await r.json(); if (e.error) msg = e.error; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

function updateAuthUI() {
  const el = document.getElementById('auth-status');
  if (!el) return;
  if (currentUser) {
    let html = `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:4px 0">`;
    html += `<span style="color:var(--text-secondary);font-size:12px">${currentUser.email}</span>`;
    html += ` <a href="#" onclick="afficherVue('settings');return false" style="color:var(--accent);font-size:12px">⚙</a>`;
    if (currentUser.role === 'admin') {
      html += ` <a href="#" onclick="afficherVue('admin');return false" style="color:var(--warning);font-size:12px">Admin</a>`;
    }
    html += ` <a href="#" id="btn-logout" style="color:var(--text-muted);font-size:12px">Déconnexion</a>`;
    html += `</div>`;
    // Quota badge
    if (window.userQuota) {
      const used = window.userQuota.projets ? window.userQuota.projets.length : 0;
      const total = window.userQuota.limiteProjets || 3;
      html += `<div style="font-size:11px;color:var(--text-muted);padding:0 4px 2px">💳 ${used}/${total} projets</div>`;
    }
    el.innerHTML = html;
    document.getElementById('btn-logout')?.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  } else {
    el.innerHTML = `<a href="#" onclick="afficherVue('login');return false" style="color:var(--accent);font-size:12px">Connexion</a>`;
  }
}

// ─── Navigation ───
function setupNavigation() {
  // Navigation principale
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const view = el.dataset.view;
      state.genre = null;
      state.projet = null;
      afficherVue(view);
    });
  });

  // Navigation genres (délégué)
  document.getElementById('genres-list').addEventListener('click', async (e) => {
    const link = e.target.closest('.genre-link');
    if (link) {
      e.preventDefault();
      const genre = link.dataset.genre;
      state.genre = genre;
      state.projet = null;
      await afficherVue('genre', genre);
    }
    const projLink = e.target.closest('.projet-link');
    if (projLink) {
      e.preventDefault();
      const [genre, projet] = projLink.dataset.projet.split('::');
      state.genre = genre;
      state.projet = projet;
      await afficherVue('projet', genre, projet);
    }
  });

  // Navigation depuis les mini-cartes du dashboard
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.mini-projet');
    if (card) {
      e.preventDefault();
      const genre = card.dataset.genre;
      const projet = card.dataset.projet;
      state.genre = genre;
      state.projet = projet;
      afficherVue('projet', genre, projet);
    }

    if (e.target.closest('.genre-card')) {
      const card = e.target.closest('.genre-card');
      const genre = card.dataset.genre;
      state.genre = genre;
      state.projet = null;
      afficherVue('genre', genre);
    }

    const fileItem = e.target.closest('.file-item');
    if (fileItem) {
      e.preventDefault();
      const path = fileItem.dataset.path;
      const title = fileItem.dataset.title || path;
      if (path) lireFichier(path, title);
    }

    const knowledgeItem = e.target.closest('.knowledge-item');
    if (knowledgeItem) {
      const path = knowledgeItem.dataset.path;
      const title = knowledgeItem.dataset.title || path;
      if (path) lireFichierKnowledge(path, title);
    }

    const skillCard = e.target.closest('.skill-card');
    if (skillCard) {
      const nom = skillCard.dataset.skill;
      if (nom) lireSkill(nom);
    }
  });
}

function setupRefresh() {
  document.getElementById('btn-refresh').addEventListener('click', async () => {
    await chargerDonnees();
    await afficherVue(state.view, state.genre, state.projet);
  });
}

// ─── Rendu des genres dans la sidebar ───
function renderGenresNav() {
  const container = document.getElementById('genres-list');
  const tmpl = document.getElementById('tmpl-genre-item');
  container.innerHTML = '';

  for (const g of state.data.projets) {
    const clone = tmpl.content.cloneNode(true);
    const link = clone.querySelector('.genre-link');
    link.dataset.genre = g.slug;
    link.querySelector('.genre-icon').textContent = g.icon;
    link.querySelector('.genre-label').textContent = g.label;
    const count = g.projets ? g.projets.filter(p => p.bible).length : 0;
    link.querySelector('.genre-count').textContent = count;

    // Projets enfants
    if (count > 0) {
      const projContainer = document.createElement('div');
      projContainer.className = 'genre-projets';
      for (const p of g.projets.filter(p => p.bible)) {
        const pLink = document.createElement('a');
        pLink.href = '#';
        pLink.className = 'nav-item projet-link';
        pLink.dataset.projet = `${g.slug}::${p.nom}`;
        pLink.innerHTML = `<span class="nav-icon">▸</span><span class="projet-label">${p.nom}</span>`;
        projContainer.appendChild(pLink);
      }
      clone.appendChild(projContainer);
    }

    container.appendChild(clone);
  }
}

// ─── Afficheur de vues ───
async function afficherVue(view, genre, projet) {
  state.view = view;
  state.genre = genre || null;
  state.projet = projet || null;

  updateActiveNav(view, genre, projet);
  updateBreadcrumb(view, genre, projet);

  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Chargement...</div>';

  try {
    switch (view) {
      case 'login':        renderLogin(content); break;
      case 'register':     renderRegister(content); break;
      case 'dashboard':    await renderDashboard(content); break;
      case 'genre':        await renderGenre(content, genre); break;
      case 'projet':       await renderProjet(content, genre, projet); break;
      case 'nouveau-projet': await renderNouveauProjet(content); break;
      case 'skills':       renderSkills(content); break;
      case 'knowledge':    renderKnowledge(content); break;
      case 'echantillons': renderEchantillons(content); break;
      case 'logs':         await renderLogs(content); break;
      case 'admin':        await renderAdmin(content); break;
      case 'settings':     await renderSettings(content); break;
      default:             await renderDashboard(content);
    }
  } catch (err) {
    console.error(err);
    if (err.message.includes('HTTP 404')) {
      content.innerHTML = '<div class="error-state"><div class="icon">🔍</div><h3>Introuvable</h3><p>La ressource demandée n\'existe pas.</p></div>';
    } else if (err.message.includes('HTTP 5')) {
      content.innerHTML = '<div class="error-state"><div class="icon">🔧</div><h3>Erreur serveur</h3><p>Le serveur a rencontré une erreur. Vérifiez qu\'il est bien démarré.</p></div>';
    } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      content.innerHTML = '<div class="error-state"><div class="icon">📡</div><h3>Connexion perdue</h3><p>Impossible de joindre le serveur. Vérifiez qu\'il est bien lancé avec <code>cd interface && npm start</code>.</p></div>';
    } else {
      content.innerHTML = `<div class="error-state"><div class="icon">⚠️</div><h3>Erreur inattendue</h3><p>${err.message}</p></div>`;
    }
  }
}

function updateActiveNav(view, genre, projet) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  if (view === 'dashboard') {
    document.querySelector('[data-view="dashboard"]')?.classList.add('active');
  } else if (view === 'genre' && genre) {
    document.querySelector(`.genre-link[data-genre="${genre}"]`)?.classList.add('active');
  } else if (view === 'projet' && genre && projet) {
    document.querySelector(`.projet-link[data-projet="${genre}::${projet}"]`)?.classList.add('active');
    document.querySelector(`.genre-link[data-genre="${genre}"]`)?.classList.add('active');
  } else if (view === 'nouveau-projet') {
    document.querySelector('[data-view="nouveau-projet"]')?.classList.add('active');
  } else if (view === 'skills') {
    document.querySelector('[data-view="skills"]')?.classList.add('active');
  } else if (view === 'knowledge') {
    document.querySelector('[data-view="knowledge"]')?.classList.add('active');
  } else if (view === 'echantillons') {
    document.querySelector('[data-view="echantillons"]')?.classList.add('active');
  } else if (view === 'logs') {
    document.querySelector('[data-view="logs"]')?.classList.add('active');
  }
}

function updateBreadcrumb(view, genre, projet) {
  const bc = document.getElementById('breadcrumb');
  if (view === 'dashboard') {
    bc.innerHTML = '<span class="current">Tableau de bord</span>';
  } else if (view === 'genre' && genre) {
    const label = getGenreLabel(genre);
    bc.innerHTML = `<a href="#" onclick="event.preventDefault();afficherVue('dashboard')">Dashboard</a><span class="sep">/</span><span class="current">${label}</span>`;
  } else if (view === 'projet' && genre && projet) {
    const label = getGenreLabel(genre);
    bc.innerHTML = `<a href="#" onclick="event.preventDefault();afficherVue('dashboard')">Dashboard</a><span class="sep">/</span><a href="#" onclick="event.preventDefault();afficherVue('genre','${genre}')">${label}</a><span class="sep">/</span><span class="current">${projet}</span>`;
  } else if (view === 'nouveau-projet') {
    bc.innerHTML = `<a href="#" onclick="event.preventDefault();afficherVue('dashboard')">Dashboard</a><span class="sep">/</span><span class="current">Nouveau projet</span>`;
  } else if (view === 'logs') {
    bc.innerHTML = `<a href="#" onclick="event.preventDefault();afficherVue('dashboard')">Dashboard</a><span class="sep">/</span><span class="current">Logs</span>`;
  } else if (view === 'admin') {
    bc.innerHTML = `<a href="#" onclick="event.preventDefault();afficherVue('dashboard')">Dashboard</a><span class="sep">/</span><span class="current">Administration</span>`;
  } else {
    bc.innerHTML = `<span class="current">${view}</span>`;
  }
}

function getGenreLabel(slug) {
  const g = state.data.projets.find(g => g.slug === slug);
  return g ? g.label : slug;
}

/** Parseur SSE standard : lit un ReadableStream et appelle des callbacks */
function listenSSE(response, { onEvent, onMeta, onError, onDone }) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  function dispatchEvent(payload, eventType) {
    try {
      if (eventType === 'meta') { if (onMeta) onMeta(payload); return; }
      if (eventType === 'error') { if (onError) onError(payload.message || 'Erreur inconnue'); return; }
      if (eventType === 'done') { if (onDone) onDone(payload); return; }
      if (eventType === 'stderr') return;
      if (payload && typeof payload === 'object') {
        if (payload.type === 'done' || payload.type === 'close') { if (onDone) onDone(payload); return; }
        if (payload.type === 'error') { if (onError) onError(payload.message || 'Erreur'); return; }
        if (payload.type === 'stderr') return;
        if (payload.type === 'meta') { if (onMeta) onMeta(payload); return; }
        if (onEvent) onEvent(payload); return;
      }
      if (onEvent) onEvent(payload);
    } catch {}
  }

  function dispatch(lines) {
    let currentEvent = null;
    let currentData = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') {
        // Fin d'un event SSE (ligne vide entre events)
        if (currentData.length > 0) {
          dispatchEvent(currentData.join('\n'), currentEvent);
          currentData = [];
        }
        currentEvent = null;
      } else if (trimmed.startsWith('event: ')) {
        currentEvent = trimmed.slice(7).trim();
      } else if (trimmed.startsWith('data: ')) {
        currentData.push(trimmed.slice(6));
      }
    }

    // Flush immédiat : si des data sont accumulées en fin de part,
    // c'est qu'il n'y avait PAS de ligne vide de séparation
    // (car le \n\n a déjà été consommé par le split)
    if (currentData.length > 0) {
      const json = currentData.join('\n');
      currentData = [];
      try {
        dispatchEvent(JSON.parse(json), currentEvent);
      } catch {}
    }
  }

  function read() {
    reader.read().then(({ done, value }) => {
      if (done) {
        // Traiter ce qui reste dans le buffer
        const rest = buffer.split('\n');
        dispatch(rest);
        return;
      }
      buffer += decoder.decode(value, { stream: true });

      // Découper par double saut de ligne (séparateur SSE)
      const parts = buffer.split('\n\n');
      buffer = parts.pop(); // garde la partie incomplète

      for (const part of parts) {
        const lines = part.split('\n');
        dispatch(lines);
      }

      read();
    }).catch(err => onError(err.message));
  }
  read();
}

// ─── Helpers d'affichage ───

const PHASE_LABELS = {
  planification: '📋 Planification',
  ecriture: '✍️ Écriture',
  relecture: '🔍 Relecture',
  finalisation: '🎯 Finalisation'
};

function phaseHtml(phase) {
  const label = PHASE_LABELS[phase] || phase;
  return `<span class="phase-badge ${phase}">${label}</span>`;
}

function statusHtml(etat) {
  if (etat === 'sur-les-rails') return '<span class="status-badge sur-les-rails">✅ Sur les rails</span>';
  if (etat === 'bloque') return '<span class="status-badge bloque">⛔ Bloqué</span>';
  if (etat === 'en-pause') return '<span class="status-badge en-pause">⏸️ En pause</span>';
  return `<span class="status-badge">${etat}</span>`;
}

function statutLabel(s) {
  if (s === 'validé') return '✅';
  if (s === 'écrit') return '📝';
  return '○';
}

function progressBarHtml(ecrits, valides, total) {
  if (total === 0) return '<div class="progress-bar-track"><div class="progress-bar-segment restants" style="width:100%"></div></div>';
  const pEcrits = Math.round((ecrits / total) * 100);
  const pValides = Math.round((valides / total) * 100);
  const pRestants = 100 - pEcrits;
  return `
    <div class="progress-bar-track">
      ${valides > 0 ? `<div class="progress-bar-segment valides" style="width:${pValides}%"></div>` : ''}
      ${ecrits > 0 ? `<div class="progress-bar-segment ecrits" style="width:${Math.max(0, pEcrits - pValides)}%"></div>` : ''}
      <div class="progress-bar-segment restants" style="width:${pRestants}%"></div>
    </div>
    <div class="progress-stats">
      <div class="progress-stat"><span class="dot valides"></span> <span class="num">${valides}</span> validé${valides !== 1 ? 's' : ''}</div>
      <div class="progress-stat"><span class="dot ecrits"></span> <span class="num">${ecrits}</span> écrit${ecrits !== 1 ? 's' : ''}</div>
      <div class="progress-stat"><span class="dot restants"></span> <span class="num">${Math.max(0, total - ecrits)}</span> restant${Math.max(0, total - ecrits) !== 1 ? 's' : ''}</div>
      <div class="progress-stat"><span class="num">${total}</span> total</div>
    </div>`;
}

function miniProgressHtml(ecrits, total) {
  if (total === 0) return '';
  const pct = Math.round((ecrits / total) * 100);
  return `<div class="mini-progress"><div class="fill" style="width:${pct}%"></div></div>`;
}

// ─── NOUVEAU PROJET ───

let opencodeMeta = null; // cache du /api/opencode/meta

async function loadOpencodeMeta() {
  if (opencodeMeta) return opencodeMeta;
  opencodeMeta = await fetchJSON('/api/opencode/meta');
  return opencodeMeta;
}

async function renderNouveauProjet(container) {
  let meta;
  try {
    meta = await loadOpencodeMeta();
  } catch {
    container.innerHTML = '<div class="error-state"><div class="icon">📡</div><h3>Impossible de contacter le serveur</h3><p>Vérifiez que le serveur est bien lancé.</p></div>';
    return;
  }

  const allSkills = state.data.skills || [];

  container.innerHTML = `
    <div class="nouveau-projet">
      <div class="form-section">
        <h2>＋ Nouveau projet</h2>
        <p class="subtitle" style="margin-bottom:20px;color:var(--text-secondary);font-size:14px;">
          Lancez un projet d'écriture — OpenCode va créer la bible, les dossiers et commencer le travail.
        </p>

        <form id="form-nouveau-projet" class="project-form">
          <div class="form-group">
            <label for="fp-genre">Genre</label>
            <select id="fp-genre" required>
              <option value="">— Choisir un genre —</option>
              ${meta.agents.map(a => `<option value="${a.slug}">${getGenreLabel(a.slug) || a.slug}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="fp-titre">Titre du projet</label>
            <input type="text" id="fp-titre" placeholder="Titre du roman, recueil, essai…" required>
          </div>

          <div class="form-group">
            <label for="fp-synopsis">Synopsis / Concept <span class="label-hint">(3-5 lignes)</span></label>
            <textarea id="fp-synopsis" rows="4" placeholder="Décrivez l'idée en quelques phrases…"></textarea>
          </div>

          <div class="form-group">
            <label for="fp-contraintes">Contraintes <span class="label-hint">(optionnel — une par ligne)</span></label>
            <textarea id="fp-contraintes" rows="3" placeholder="Ex: pas de mentions de la Géorgie avant le chapitre 5&#10;Ex: le protagoniste ne doit pas mourir"></textarea>
          </div>

          <div class="form-group">
            <label for="fp-personnages">Personnages principaux <span class="label-hint">(optionnel — un par ligne)</span></label>
            <textarea id="fp-personnages" rows="3" placeholder="Ex: Jean Dupont — archiviste, 45 ans, méthodique&#10;Ex: Sarah Blake — agent de liaison, mystérieuse"></textarea>
          </div>

          <div class="form-group" id="fp-skills-group">
            <label>Skills <span class="label-hint">(sélectionnez un ou plusieurs)</span></label>
            <div class="skills-checklist" id="fp-skills">
              ${allSkills.map(s => `
                <label class="skill-check-item" data-genres="${getSkillGenres(s.nom).join(',')}">
                  <input type="checkbox" name="skills" value="${s.nom}">
                  <span class="skill-check-name">${s.nom}</span>
                  <span class="skill-maturity ${s.maturite}">${s.maturite}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label for="fp-unites">Nombre d'unités cible <span class="label-hint">(optionnel)</span></label>
              <input type="number" id="fp-unites" min="1" max="99" placeholder="Ex: 12 chapitres">
            </div>
          </div>

          <div class="form-group">
            <label for="fp-registre">Registre d'écriture <span class="label-hint">(optionnel — évite les questions pré-flight)</span></label>
            <select id="fp-registre">
              <option value="">— Laisser l'orchestrateur décider —</option>
              <option value="introspectif-retenu" ${(window.userStyle?.registre || '') === 'introspectif-retenu' ? 'selected' : ''}>Introspectif-retenu (précision, geste, ellipse)</option>
              <option value="lyrique-cosmique" ${(window.userStyle?.registre || '') === 'lyrique-cosmique' ? 'selected' : ''}>Lyrique-cosmique (exaltation, images, souffle)</option>
              <option value="les deux en alternance" ${(window.userStyle?.registre || '') === 'les deux' ? 'selected' : ''}>Les deux en alternance</option>
            </select>
          </div>

          <div class="form-group">
            <label for="fp-filrouge">Fil rouge / Motif conducteur <span class="label-hint">(optionnel)</span></label>
            <input type="text" id="fp-filrouge" placeholder="Ex: un message qui ne sera jamais envoyé" value="${escHtml(window.userStyle?.filRouge || '')}">
          </div>

          <div class="form-actions">
            <button type="submit" id="btn-lancer" class="btn-primary">
              ▶ Lancer le projet
            </button>
            <button type="button" id="btn-annuler" class="btn-secondary" style="display:none">
              ⏹ Annuler
            </button>
          </div>
        </form>
      </div>

      <div id="terminal-section" class="terminal-section" style="display:none">
        <div class="terminal-header">
          <h3>🧠 OpenCode — Session en cours</h3>
          <span id="terminal-status" class="terminal-status">en cours…</span>
        </div>
        <div id="terminal-output" class="terminal-output"></div>
        <div id="terminal-input-bar" class="terminal-input-bar" style="display:none">
          <input type="text" id="terminal-input" placeholder="Réponse à l'orchestrateur…">
          <button id="btn-terminal-send" class="btn-primary btn-small">Envoyer</button>
        </div>
        <div id="terminal-footer" class="terminal-footer" style="display:none">
          <button id="btn-apres-succes" class="btn-primary" style="display:none">✓ Voir le projet</button>
          <button id="btn-apres-refresh" class="btn-secondary">⟳ Rafraîchir le tableau de bord</button>
        </div>
      </div>
    </div>
  `;

  // --- Filtre des skills par genre ---
  const genreSelect = document.getElementById('fp-genre');
  const skillsItems = document.querySelectorAll('.skill-check-item');
  const skillsGroup = document.getElementById('fp-skills-group');

  function filterSkills(genre) {
    const allowed = new Set(meta.skillsParGenre[genre] || []);
    let visibleCount = 0;
    skillsItems.forEach(item => {
      const itemGenres = item.dataset.genres.split(',').filter(Boolean);
      const match = genre ? itemGenres.some(g => g === genre) : true;
      item.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });
    skillsGroup.style.display = visibleCount > 0 ? '' : 'none';
  }

  genreSelect.addEventListener('change', () => filterSkills(genreSelect.value));
  filterSkills(genreSelect.value);

  // --- Soumission du formulaire ---
  const form = document.getElementById('form-nouveau-projet');
  const terminalSection = document.getElementById('terminal-section');
  const terminalOutput = document.getElementById('terminal-output');
  const terminalStatus = document.getElementById('terminal-status');
  const terminalFooter = document.getElementById('terminal-footer');
  const btnAnnuler = document.getElementById('btn-annuler');
  const btnLancer = document.getElementById('btn-lancer');
  const btnSucces = document.getElementById('btn-apres-succes');
  const btnRefresh = document.getElementById('btn-apres-refresh');

  let abortController = null;
  let currentSessionId = null;
  let currentGenre = null;
  let currentTitre = null;
  const terminalInput = document.getElementById('terminal-input');
  const btnTerminalSend = document.getElementById('btn-terminal-send');
  const terminalInputBar = document.getElementById('terminal-input-bar');

  // Callbacks SSE partagés entre le lancement initial (/run) et les réponses
  // au pré-flight (/input) : les deux flux ont exactement le même format.
  const streamCallbacks = {
    onEvent: (evt) => {
      appendTerminalEvent(terminalOutput, evt);
      // L'agent s'arrête (fin de tour) → on propose de répondre.
      if (evt.type === 'step_finish' && (evt.reason === 'stop' || evt.part?.reason === 'stop')) {
        terminalInputBar.style.display = 'flex';
        terminalInput.focus();
        terminalStatus.textContent = '⏳ en attente de votre réponse…';
      }
    },
    onMeta: (meta) => {
      if (meta.agent) {
        terminalOutput.innerHTML += `<div class="term-line term-meta">🧠 Agent : ${meta.agent} · Commande : ${meta.command}</div>`;
      }
      currentSessionId = meta.sessionId || currentSessionId;
      terminalStatus.textContent = '⏳ en cours…';
      scrollTerminal();
    },
    onError: (msg) => {
      terminalOutput.innerHTML += `<div class="term-line term-error">❌ ${msg}</div>`;
      terminalStatus.textContent = '❌ erreur';
      terminalStatus.className = 'terminal-status error';
      terminalInputBar.style.display = 'none';
      terminalFooter.style.display = '';
      btnLancer.style.display = 'inline-flex';
      btnAnnuler.style.display = 'none';
      scrollTerminal();
    },
    onDone: (result) => {
      if (result.success) {
        terminalOutput.innerHTML += `<div class="term-line term-success">✅ Étape terminée.</div>`;
        terminalStatus.textContent = '✅ terminé';
        terminalStatus.className = 'terminal-status success';
        btnSucces.style.display = 'inline-flex';
        btnSucces.dataset.genre = currentGenre;
        btnSucces.dataset.projet = currentTitre;
      } else {
        terminalOutput.innerHTML += `<div class="term-line term-error">❌ Échec (code ${result.exitCode})</div>`;
        terminalStatus.textContent = '❌ échec';
        terminalStatus.className = 'terminal-status error';
      }
      terminalFooter.style.display = '';
      btnLancer.style.display = 'inline-flex';
      btnAnnuler.style.display = 'none';
      // On garde la barre de saisie disponible : le run se termine à chaque
      // tour, mais l'agent a pu poser une question de pré-flight. L'utilisateur
      // peut répondre pour poursuivre le dialogue via /input.
      if (currentSessionId && result.success) {
        terminalInputBar.style.display = 'flex';
      }
      scrollTerminal();
      chargerDonnees();
    }
  };

  // Envoi de réponse utilisateur — reprend la session opencode via /input (SSE).
  async function sendUserInput(text) {
    if (!currentSessionId) return;
    terminalInputBar.style.display = 'none';
    terminalStatus.textContent = '⏳ en cours…';
    terminalStatus.className = 'terminal-status running';
    try {
      const response = await fetch('/api/opencode/input', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId, text })
      });
      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try { const e = await response.json(); if (e.error) msg = e.error; } catch {}
        streamCallbacks.onError(msg);
        return;
      }
      listenSSE(response, streamCallbacks);
    } catch (err) {
      streamCallbacks.onError(err.message);
    }
  }

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && terminalInput.value.trim()) {
      const text = terminalInput.value.trim();
      terminalOutput.innerHTML += `<div class="term-line term-user-input">🧑 ${escHtml(text)}</div>`;
      sendUserInput(text);
      terminalInput.value = '';
      scrollTerminal();
    }
  });

  btnTerminalSend.addEventListener('click', () => {
    if (terminalInput.value.trim()) {
      const text = terminalInput.value.trim();
      terminalOutput.innerHTML += `<div class="term-line term-user-input">🧑 ${escHtml(text)}</div>`;
      sendUserInput(text);
      terminalInput.value = '';
      scrollTerminal();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const genre = genreSelect.value;
    const titre = document.getElementById('fp-titre').value.trim();
    const synopsis = document.getElementById('fp-synopsis').value.trim();
    const contraintes = document.getElementById('fp-contraintes').value.trim();
    const personnages = document.getElementById('fp-personnages').value.trim();
    const skills = Array.from(document.querySelectorAll('input[name="skills"]:checked')).map(cb => cb.value);
    const nbUnites = document.getElementById('fp-unites').value;
    const registre = document.getElementById('fp-registre').value;
    const filRouge = document.getElementById('fp-filrouge').value.trim();

    if (!genre || !titre) return;

    // Mémoriser pour la navigation + les tours de dialogue (/input)
    currentGenre = genre;
    currentTitre = titre;
    currentSessionId = null;

    // Afficher le terminal
    terminalSection.style.display = '';
    terminalOutput.innerHTML = '';
    terminalInputBar.style.display = 'none';
    terminalFooter.style.display = 'none';
    btnSucces.style.display = 'none';
    btnLancer.style.display = 'none';
    btnAnnuler.style.display = 'inline-flex';
    terminalStatus.textContent = '⏳ lancement…';
    terminalStatus.className = 'terminal-status running';

    abortController = new AbortController();

    try {
      const response = await fetch('/api/opencode/run', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, titre, synopsis, contraintes, personnages, skills, nbUnites, registre, filRouge }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let msg = `Erreur HTTP ${response.status}`;
        try { const e = await response.json(); if (e.error) msg = e.error; } catch {}
        terminalOutput.innerHTML += `<div class="term-line term-error">❌ ${escHtml(msg)}</div>`;
        terminalStatus.textContent = '❌ échec';
        terminalStatus.className = 'terminal-status error';
        terminalFooter.style.display = '';
        btnLancer.style.display = 'inline-flex';
        btnAnnuler.style.display = 'none';
        scrollTerminal();
        return;
      }

      listenSSE(response, streamCallbacks);
    } catch (err) {
      if (err.name === 'AbortError') {
        terminalOutput.innerHTML += `<div class="term-line term-warning">⏹ Commande annulée</div>`;
        terminalStatus.textContent = '⏹ annulé';
        terminalStatus.className = 'terminal-status cancelled';
      } else {
        terminalOutput.innerHTML += `<div class="term-line term-error">❌ ${err.message}</div>`;
        terminalStatus.textContent = '❌ erreur';
        terminalStatus.className = 'terminal-status error';
      }
      terminalFooter.style.display = '';
      btnLancer.style.display = 'inline-flex';
      btnAnnuler.style.display = 'none';
      scrollTerminal();
    }
  });

  // Annulation
  btnAnnuler.addEventListener('click', () => {
    if (abortController) abortController.abort();
  });

  // Voir le projet
  btnSucces.addEventListener('click', () => {
    const genre = btnSucces.dataset.genre;
    const projet = btnSucces.dataset.projet;
    if (genre && projet) {
      state.genre = genre;
      state.projet = projet;
      afficherVue('projet', genre, projet);
    }
  });

  // Rafraîchir dashboard
  btnRefresh.addEventListener('click', async () => {
    await chargerDonnees();
    await afficherVue('dashboard');
  });
}

function getSkillGenres(skillName) {
  const map = {
    'ecriture-romanesque': 'romans',
    'roman-espionnage': 'romans',
    'roman-romance': 'romans',
    'roman-litteraire': 'romans',
    'poesie-contemporaine': 'poesie',
    'poesie-prose': 'poesie',
    'poesie-symbolique': 'poesie',
    'poesie-classique': 'poesie',
    'poesie-lyrique': 'poesie',
    'poesie-engagee': 'poesie',
    'poesie-madrigal-contemporain': 'poesie',
    'ecriture-theatrale': 'theatre',
    'ecriture-essai-litteraire': 'essais',
    'nouvelle-litteraire': 'nouvelles',
    'flash-fiction': 'textes-mobiles',
    'micro-nouvelle': 'textes-mobiles',
    'vignette-prose': 'textes-mobiles',
    'ecriture-carnet-journal': 'textes-mobiles',
    'ecriture-hybride': 'textes-mobiles',
    'ecriture-universitaire': 'universitaire',
    'ecriture-epique': 'romans',
    'composition-recueil': 'poesie',
  };
  const genre = map[skillName];
  return genre ? [genre] : [];
}

function appendTerminalEvent(container, evt) {
  const ts = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : '';
  const time = ts ? `<span class="term-time">${ts}</span>` : '';

  switch (evt.type) {
    case 'step_start': {
      // Afficher le snapshot si présent
      const extra = evt.part?.snapshot ? ' 🔄' : '';
      container.innerHTML += `<div class="term-line term-step">${time}${extra} Étape démarrée</div>`;
      break;
    }
    case 'text': {
      // Le texte peut être dans evt.text (envoyé directement) ou evt.part.text (format OpenCode brut)
      const textContent = evt.text || (evt.part && evt.part.text) || '';
      if (textContent.trim()) {
        const text = escHtml(textContent.trim());
        container.innerHTML += `<div class="term-line term-text">${time} ${text}</div>`;
      }
      break;
    }
    case 'tool_use': {
      const toolName = evt.part?.tool || evt.tool || evt.name || '?';
      // Afficher un résumé de ce que fait l'outil
      let detail = '';
      if (evt.part?.state?.input) {
        const input = evt.part.state.input;
        if (input.filePath) detail = escHtml(input.filePath.split('\\').pop());
        else if (input.pattern) detail = escHtml(input.pattern);
        else if (input.subagent_type) detail = `agent: ${escHtml(input.subagent_type)}`;
      }
      container.innerHTML += `<div class="term-line term-tool">${time} 🔧 <strong>${escHtml(toolName)}</strong>${detail ? ` — ${detail}` : ''}</div>`;
      // Si l'outil a un output, on peut l'afficher (optionnel)
      if (evt.part?.state?.status === 'completed' && evt.part?.state?.output) {
        const output = evt.part.state.output;
        if (typeof output === 'string' && output.length < 200 && output.trim()) {
          container.innerHTML += `<div class="term-line term-tool-result">${time}   ${escHtml(output.trim().slice(0, 150))}</div>`;
        }
      }
      break;
    }
    case 'tool_result': {
      // Déjà géré dans tool_use completed, mais on affiche un résumé
      container.innerHTML += `<div class="term-line term-tool-result">${time} ✔ Résultat reçu</div>`;
      break;
    }
    case 'step_finish': {
      const reason = evt.part?.reason || evt.reason || '';
      const tokens = evt.part?.tokens || evt.tokens || {};
      const total = tokens.total || 0;
      const cost = evt.cost || 0;
      const raison = reason === 'stop' ? '' : reason === 'tool-calls' ? ' (appels outil)' : ` (${reason})`;
      container.innerHTML += `<div class="term-line term-finish">${time} ✅ Terminé${raison} — ${total} tokens${cost ? ` ($${cost.toFixed(4)})` : ''}</div>`;
      break;
    }
    case 'error': {
      const msg = evt.error?.message || evt.error || evt.message || 'Erreur inconnue';
      container.innerHTML += `<div class="term-line term-error">${time} ❌ ${escHtml(msg)}</div>`;
      break;
    }
    case 'confirmation': {
      container.innerHTML += `<div class="term-line term-confirm">${time} ⚠️ ${escHtml(evt.prompt || evt.text || 'Demande de confirmation')}</div>`;
      break;
    }
    default: {
      // Fallback : afficher le texte si présent
      const text = evt.text || evt.message || '';
      if (text && text.trim()) {
        container.innerHTML += `<div class="term-line term-text">${time} ${escHtml(text.trim())}</div>`;
      }
    }
  }
  scrollTerminal();
}

function scrollTerminal() {
  const output = document.getElementById('terminal-output');
  if (output) output.scrollTop = output.scrollHeight;
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── DASHBOARD ───
async function renderDashboard(container) {
  // Stats
  const totalProjets = state.data.projets.reduce((acc, g) => acc + g.projets.filter(p => p.bible).length, 0);
  const totalSkills = state.data.skills.length;
  const totalGenres = state.data.projets.length;
  const testeCount = state.data.skills.filter(s => s.maturite === 'testé').length;

  // Progression globale
  let totalUnites = 0, totalEcrites = 0, totalValidees = 0;
  for (const g of state.data.projets) {
    for (const p of g.projets.filter(p => p.bible && p.progression)) {
      totalUnites += p.progression.total || 0;
      totalEcrites += p.progression.ecrits || 0;
      totalValidees += p.progression.valides || 0;
    }
  }

  container.innerHTML = `
    <div class="dashboard">
      <h2>Tableau de bord</h2>
      <p class="subtitle">Vue d'ensemble de vos projets d'écriture assistée</p>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-value">${totalProjets}</div>
          <div class="stat-label">Projets actifs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚙</div>
          <div class="stat-value">${totalSkills}</div>
          <div class="stat-label">Skills disponibles</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✓</div>
          <div class="stat-value">${testeCount}</div>
          <div class="stat-label">Skills testés</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎭</div>
          <div class="stat-value">${totalGenres}</div>
          <div class="stat-label">Genres disponibles</div>
        </div>
      </div>

      <div class="genre-grid">
        ${state.data.projets.map(g => {
          const actifs = g.projets.filter(p => p.bible);
          return `<div class="genre-card" data-genre="${g.slug}">
            <div class="genre-card-header">
              <span class="genre-card-icon">${g.icon}</span>
              <span class="genre-card-title">${g.label}</span>
              <span class="genre-card-count">${actifs.length}</span>
            </div>
            <div class="genre-card-projets">
              ${actifs.length > 0
                ? actifs.map(p => {
                    const prog = p.progression || {};
                    return `<div class="mini-projet" data-genre="${g.slug}" data-projet="${p.nom}">
                      <div style="display:flex;align-items:center;gap:8px;width:100%;">
                        <span>📄</span>
                        <span class="b" style="flex:1">${p.nom}</span>
                        <span class="phase-dot ${prog.phase || 'planification'}" title="${prog.phase || 'planification'}"></span>
                      </div>
                      ${miniProgressHtml(prog.ecrits || 0, prog.total || 0)}
                    </div>`;
                  }).join('')
                : '<div style="color:var(--text-muted);font-size:13px;padding:4px 0;">Aucun projet pour le moment</div>'
              }
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
  // Ajouter l'activité récente (ne bloque pas l'affichage)
  renderRecentActivity(container);
}

// ─── GENRE ───
async function renderGenre(container, genreSlug) {
  const g = state.data.projets.find(x => x.slug === genreSlug);
  if (!g) {
    container.innerHTML = '<div class="error-state"><div class="icon">🔍</div><h3>Genre introuvable</h3><p>Le genre demandé n\'existe pas dans la configuration.</p></div>';
    return;
  }

  const actifs = g.projets.filter(p => p.bible);

  container.innerHTML = `
    <div class="projet-view">
      <h2>${g.icon} ${g.label}</h2>
      <p class="subtitle" style="margin-bottom:20px;color:var(--text-secondary);font-size:14px;">
        ${actifs.length} projet${actifs.length > 1 ? 's' : ''}
      </p>

      ${actifs.length > 0
        ? `<div class="projet-sections">
            ${actifs.map(p => {
              const prog = p.progression || {};
              return `<div class="projet-section" style="cursor:pointer" onclick="event.stopPropagation();afficherVue('projet','${g.slug}','${p.nom}')">
                <div class="projet-section-title">
                  ${p.nom}
                  ${prog.phase ? phaseHtml(prog.phase) : ''}
                </div>
                <div class="projet-section-content">
                  ${(prog.total || 0) > 0 ? progressBarHtml(prog.ecrits || 0, prog.valides || 0, prog.total || 0) : ''}
                  ${p.bible
                    ? `<div style="font-size:13px;color:var(--text-secondary);max-height:80px;overflow:hidden;line-height:1.5;margin-top:8px;">
                        ${p.bible.slice(0, 200).split('\n').slice(0, 4).join('\n')}${p.bible.length > 200 ? '…' : ''}
                      </div>`
                    : ''
                  }
                  ${prog.derniereAction && prog.derniereAction !== '—' ? `<div class="last-action">🕐 ${prog.derniereAction}</div>` : ''}
                </div>
              </div>`;
            }).join('')}
          </div>`
        : '<div class="empty-state"><div class="icon">📂</div><h3>Aucun projet</h3><p>Créez un projet via OpenCode avec une commande <code>/nouveau-…</code></p></div>'
      }
    </div>
  `;
}

// ─── PROJET (avec progression) ───
async function renderProjet(container, genre, projet) {
  try {
    const data = await fetchJSON(`${API_BASE}/projets/${genre}/${projet}/structure`);
    if (!data) {
      container.innerHTML = '<div class="error-state"><div class="icon">🔍</div><h3>Projet introuvable</h3><p>Le projet demandé n\'existe pas ou a été supprimé.</p></div>';
      return;
    }

    const prog = data.progression || {};
    const total = prog.total || 0;
    const ecrits = prog.ecrits || 0;
    const valides = prog.valides || 0;

    // Barre de progression + badges
    const progressHtml = total > 0 ? `
      <div class="progress-container">
        <div class="progress-header">
          <span class="progress-title">Progression</span>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            ${prog.phase ? phaseHtml(prog.phase) : ''}
            ${prog.etat ? statusHtml(prog.etat) : ''}
          </div>
        </div>
        ${progressBarHtml(ecrits, valides, total)}
        ${prog.derniereAction && prog.derniereAction !== '—' ? `<div class="last-action">🕐 ${prog.derniereAction}</div>` : ''}
        <div class="projet-actions" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          ${ecrits < total ? `<button class="btn-action continue-btn" data-genre="${genre}" data-projet="${projet}">▶ Continuer l'écriture</button>` : ''}
          ${ecrits > 0 ? `<button class="btn-action finalize-btn" data-genre="${genre}" data-projet="${projet}">📦 Finaliser le projet</button>` : ''}
        </div>
        <div id="action-result" style="margin-top:8px;font-size:13px;color:var(--text-secondary)"></div>
      </div>
    ` : '';

    // Skills inline
    const skillsHtml = prog.skills && prog.skills.length > 0 ? `
      <div class="skills-inline">
        ${prog.skills.map(s => `<span class="skill-tag">⚙ ${s}</span>`).join('')}
      </div>
    ` : '';

    // Liste des unités
    const unitesHtml = prog.unites && prog.unites.length > 0 ? `
      <div class="projet-section">
        <div class="projet-section-title">${prog.unitDir || 'unités'}/ — ${prog.unites.length} prévue${prog.unites.length > 1 ? 's' : ''}</div>
        <div class="projet-section-content">
          <div class="units-list">
            ${prog.unites.map(u => `
              <div class="unit-item">
                <span class="unit-status-dot ${u.statut === 'validé' ? 'valide' : u.statut === 'écrit' ? 'ecrit' : 'a-ecrire'}"></span>
                <span class="unit-numero">${u.numero}</span>
                <span class="unit-desc">${u.description || '—'}</span>
                <span class="unit-statut-label">${statutLabel(u.statut)} ${u.statut}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    ` : '';

    // Explorateur de fichiers
    const sectionsHtml = Object.entries(data.structure?.dossiers || {}).map(([nom, fichiers]) => `
      <div class="projet-section">
        <div class="projet-section-title">${nom}/</div>
        <div class="projet-section-content ${fichiers.length === 0 ? 'empty' : ''}">
          ${fichiers.length > 0
            ? fichiers.map(f => {
                const filePath = `${nom}/${f}`;
                const ext = f.endsWith('.md') ? 'md' : f.split('.').pop() || '';
                return `<div class="file-item" data-path="${filePath}" data-title="${f}">
                  <span class="icon">${f.endsWith('.md') ? '📄' : '📁'}</span>
                  <span>${f}</span>
                  <span class="ext">.${ext}</span>
                </div>`;
              }).join('')
            : 'Dossier vide'
          }
        </div>
      </div>
    `).join('');

    // Fichiers racine
    const fichiersRacine = (data.structure?.fichiers || [])
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const ext = f.split('.').pop() || '';
        return `<div class="file-item" data-path="${f}" data-title="${f}">
          <span class="icon">📄</span>
          <span>${f}</span>
          <span class="ext">.${ext}</span>
        </div>`;
      }).join('');

    container.innerHTML = `
      <div class="projet-view">
        <h2>${data.nom}</h2>
        <span class="genre-tag">${getGenreLabel(genre)}</span>
        ${skillsHtml}
        ${progressHtml}
        ${unitesHtml}
        <div class="projet-sections">
          ${fichiersRacine ? `<div class="projet-section">
            <div class="projet-section-title">Racine</div>
            <div class="projet-section-content">${fichiersRacine}</div>
          </div>` : ''}
          ${sectionsHtml}
        </div>
      </div>
    `;

    // ─── Boutons d'action ──────────────────────────────────────────────────
    const resultEl = document.getElementById('action-result');

    // Continue l'écriture
    document.querySelector('.continue-btn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '⏳ Relance…';
      if (resultEl) resultEl.textContent = 'Relance du projet…';
      try {
        const resp = await fetch(`/api/projets/${genre}/${projet}/continue`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await resp.json();
        if (data.success) {
          if (resultEl) resultEl.innerHTML = `✅ Projet relancé (session ${data.sessionId?.slice(-8) || ''}). Vérifie les logs.`;
        } else {
          if (resultEl) resultEl.textContent = `❌ ${data.error || 'Erreur'}`;
        }
      } catch (err) {
        if (resultEl) resultEl.textContent = `❌ ${err.message}`;
      }
      btn.disabled = false;
      btn.textContent = '▶ Continuer l\'écriture';
    });

    // Finaliser le projet
    document.querySelector('.finalize-btn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '⏳ Finalisation…';
      if (resultEl) resultEl.textContent = 'Finalisation en cours…';
      try {
        const resp = await fetch(`/api/projets/${genre}/${projet}/finalize`, {
          method: 'POST',
          headers: authHeaders()
        });
        const data = await resp.json();
        if (data.success) {
          let html = '✅ Finalisation terminée :<br>';
          data.results.forEach(r => {
            if (r.step === 'compilation') html += `  📄 Compilation : ${r.file}<br>`;
            else if (r.step === 'pdf') html += `  📕 PDF : ${r.status === 'ok' ? r.file : 'non disponible'}<br>`;
            else if (r.step === 'bilan') html += `  📊 Bilan : ${r.ecrits} textes, ${r.valides} validés<br>`;
          });
          if (resultEl) resultEl.innerHTML = html;
        } else {
          if (resultEl) resultEl.textContent = `❌ ${data.error || 'Erreur'}`;
        }
      } catch (err) {
        if (resultEl) resultEl.textContent = `❌ ${err.message}`;
      }
      btn.disabled = false;
      btn.textContent = '📦 Finaliser le projet';
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="error-state"><div class="icon">⚠️</div><h3>Erreur de chargement</h3><p>Impossible de charger ce projet. ${err.message}</p></div>`;
  }
}

// ─── LECTEUR DE FICHIER ───
async function lireFichier(relPath, title) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Chargement...</div>';

  try {
    const genre = state.genre;
    const projet = state.projet;
    const data = await fetchJSON(`${API_BASE}/projets/${genre}/${projet}/fichier?path=${encodeURIComponent(relPath)}`);
    const html = renderMarkdown(data.contenu || '*[fichier vide]*');

    content.innerHTML = `
      <div class="markdown-reader">
        <div class="reader-header">
          <span class="reader-title">${title || relPath}</span>
          <button class="btn-back" onclick="afficherVue('projet','${genre}','${projet}')">← Retour</button>
        </div>
        <div class="markdown-body">${html}</div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="error-state"><div class="icon">⚠️</div><h3>Erreur de lecture</h3><p>${err.message.includes('HTTP 404') ? 'Ce fichier est introuvable.' : err.message}</p></div>`;
  }
}

// ─── SKILLS ───
function renderSkills(container) {
  const skills = state.data.skills;
  container.innerHTML = `
    <div class="skills-view">
      <h2>⚙ Skills</h2>
      <p class="subtitle" style="margin-bottom:20px;color:var(--text-secondary);font-size:14px;">
        ${skills.length} skills — blocs de connaissances réutilisables
      </p>
      <div class="skills-grid">
        ${skills.map(s => `
          <div class="skill-card" data-skill="${s.nom}">
            <div class="skill-card-header">
              <span class="skill-name">${s.nom}</span>
              <span class="skill-maturity ${s.maturite}">${s.maturite}</span>
            </div>
            <div class="skill-desc">${s.description || 'Aucune description'}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function lireSkill(nom) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Chargement...</div>';

  try {
    const data = await fetchJSON(`${API_BASE}/skills/${encodeURIComponent(nom)}`);
    const html = renderMarkdown(data.contenu || '*[vide]*');

    content.innerHTML = `
      <div class="markdown-reader">
        <div class="reader-header">
          <span class="reader-title">⚙ ${data.nom}
            <span class="skill-maturity ${data.maturite}" style="font-size:11px;margin-left:12px;">${data.maturite}</span>
          </span>
          <button class="btn-back" onclick="afficherVue('skills')">← Skills</button>
        </div>
        <div class="markdown-body">${html}</div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="error-state"><div class="icon">⚠️</div><h3>Erreur de lecture</h3><p>${err.message.includes('HTTP 404') ? 'Ce fichier skill est introuvable.' : err.message}</p></div>`;
  }
}

// ─── KNOWLEDGE ───
function renderKnowledge(container) {
  const k = state.data.knowledge;
  if (!k) { container.innerHTML = '<div class="error">Knowledge non chargé</div>'; return; }

  const allItems = [];

  for (const f of k.fichiers || []) {
    allItems.push({ nom: f.nom, path: f.nom, type: 'fichier' });
  }
  for (const d of k.dossiers || []) {
    for (const item of d.contenu || []) {
      allItems.push({
        nom: `${d.nom}/${item.nom}`,
        path: `${d.nom}/${item.nom}`,
        type: item.isDir ? 'dossier' : 'fichier'
      });
    }
  }

  container.innerHTML = `
    <div class="knowledge-view">
      <h2>◈ Knowledge</h2>
      <p class="subtitle" style="margin-bottom:20px;color:var(--text-secondary);font-size:14px;">
        Base de connaissances partagée — ${allItems.length} fichiers
      </p>
      <div class="knowledge-grid">
        ${allItems.map(item => `
          <div class="knowledge-item" data-path="${item.path}" data-title="${item.nom}">
            <div class="knowledge-item-title">
              <span>${item.type === 'dossier' ? '📁' : '📄'}</span>
              <span>${item.nom}</span>
            </div>
            <div class="knowledge-item-path">${item.path}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function lireFichierKnowledge(path, title) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Chargement...</div>';

  try {
    const data = await fetchJSON(`${API_BASE}/knowledge/fichier?path=${encodeURIComponent(path)}`);
    const html = renderMarkdown(data.contenu || '*[vide]*');

    content.innerHTML = `
      <div class="markdown-reader">
        <div class="reader-header">
          <span class="reader-title">◈ ${title}</span>
          <button class="btn-back" onclick="afficherVue('knowledge')">← Knowledge</button>
        </div>
        <div class="markdown-body">${html}</div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="error-state"><div class="icon">⚠️</div><h3>Erreur de lecture</h3><p>${err.message.includes('HTTP 404') ? 'Ce fichier est introuvable.' : err.message}</p></div>`;
  }
}

// ─── ÉCHANTILLONS ───
function renderEchantillons(container) {
  const items = state.data.echantillons || [];
  container.innerHTML = `
    <div class="knowledge-view">
      <h2>◇ Échantillons</h2>
      <p class="subtitle" style="margin-bottom:20px;color:var(--text-secondary);font-size:14px;">
        ${items.length} fichier${items.length > 1 ? 's' : ''} — textes bruts fournis par l'utilisateur
      </p>
      <div class="knowledge-grid">
        ${items.map(item => `
          <div class="knowledge-item" data-echantillon="${item.nom}">
            <div class="knowledge-item-title">
              <span>${item.isDir ? '📁' : '📄'}</span>
              <span>${item.nom}</span>
            </div>
            <div class="knowledge-item-path">${item.isDir ? 'dossier' : item.contenu ? (item.contenu.length + ' caractères') : '—'}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ─── AUTH VIEWS ──────────────────────────────────────────────────────────────

function renderLogin(container) {
  document.body.classList.add('auth-mode');
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error') || '';
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-icon">✍️</div>
        <h2>AgentIA — Écriture</h2>
        <p class="auth-subtitle">Connexion à votre espace d'écriture</p>
        <form id="form-login" class="auth-form">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" placeholder="admin@agentia.local" required>
            <span style="display:block;font-size:11px;color:var(--text-muted);margin-top:4px">Première connexion : admin@agentia.local / admin</span>
          </div>
          <div class="form-group">
            <label for="login-password">Mot de passe</label>
            <input type="password" id="login-password" placeholder="••••••••" required>
          </div>
          <div id="login-error" class="auth-error">${error}</div>
          <button type="submit" class="btn-primary" style="width:100%">Se connecter</button>
          <p class="auth-link">Pas encore de compte ? <a href="#" onclick="afficherVue('register');return false">S'inscrire</a></p>
        </form>
      </div>
    </div>
  `;

  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Connexion…';
    try {
      await login(email, password);
      document.body.classList.remove('auth-mode');
      updateAuthUI();
      await chargerDonnees();
      afficherVue('dashboard');
    } catch (err) {
      errorEl.textContent = err.message;
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  });
}

function renderRegister(container) {
  document.body.classList.add('auth-mode');
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-icon">✍️</div>
        <h2>Créer un compte</h2>
        <p class="auth-subtitle">Un code d'invitation vous est nécessaire</p>
        <form id="form-register" class="auth-form">
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input type="email" id="reg-email" placeholder="vous@exemple.fr" required>
          </div>
          <div class="form-group">
            <label for="reg-name">Nom d'affichage</label>
            <input type="text" id="reg-name" placeholder="Votre nom">
          </div>
          <div class="form-group">
            <label for="reg-password">Mot de passe</label>
            <input type="password" id="reg-password" placeholder="••••••••" required>
          </div>
          <div class="form-group">
            <label for="reg-invite">Code d'invitation</label>
            <input type="text" id="reg-invite" placeholder="ABCD1234" required>
          </div>
          <div id="register-error" class="auth-error"></div>
          <button type="submit" class="btn-primary" style="width:100%">Créer mon compte</button>
          <p class="auth-link">Déjà un compte ? <a href="#" onclick="afficherVue('login');return false">Se connecter</a></p>
        </form>
      </div>
    </div>
  `;

  document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const name = document.getElementById('reg-name').value;
    const password = document.getElementById('reg-password').value;
    const inviteCode = document.getElementById('reg-invite').value;
    const errorEl = document.getElementById('register-error');
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Création…';
    try {
      await register(email, password, inviteCode, name);
      updateAuthUI();
      await chargerDonnees();
      afficherVue('dashboard');
    } catch (err) {
      errorEl.textContent = err.message;
      btn.disabled = false;
      btn.textContent = 'Créer mon compte';
    }
  });
}

// ─── SETTINGS / RÉGLAGES ─────────────────────────────────────────────────────

async function renderSettings(container) {
  const headers = authHeaders();
  let style = window.userStyle || { registre: 'introspectif-retenu', longueur: 50, precision_objets: 70, emotion: 30, filRouge: '' };
  let apiKeyMeta = { hasKey: false };
  try {
    const me = await fetchJSON(`${API_BASE}/auth/me`, headers);
    style = me.style || style;
    apiKeyMeta = me.apiKey || { hasKey: false };
  } catch {}

  container.innerHTML = `
    <div class="settings-page">
      <h2>⚙ Mes réglages</h2>
      <p class="subtitle" style="margin-bottom:24px;color:var(--text-secondary);font-size:14px;">
        Profil, style d'écriture et clé API
      </p>

      <div class="settings-tabs">
        <button class="settings-tab active" data-tab="profil">Profil</button>
        <button class="settings-tab" data-tab="style">Style d'écriture</button>
        <button class="settings-tab" data-tab="apikey">Clé API</button>
      </div>

      <!-- Profil -->
      <div class="settings-panel active" id="panel-profil">
        <div class="admin-card">
          <div class="admin-card-header"><h3>👤 Mon profil</h3></div>
          <div class="admin-card-body">
            <form id="form-profile" class="auth-form">
              <div class="form-group">
                <label>Email</label>
                <input type="email" value="${escHtml(currentUser?.email || '')}" disabled style="opacity:0.6">
              </div>
              <div class="form-group">
                <label for="settings-name">Nom d'affichage</label>
                <input type="text" id="settings-name" value="${escHtml(currentUser?.name || '')}">
              </div>
              <div class="form-group">
                <label for="settings-pwd-current">Mot de passe actuel</label>
                <input type="password" id="settings-pwd-current" placeholder="Laisser vide pour ne pas changer">
              </div>
              <div class="form-group">
                <label for="settings-pwd-new">Nouveau mot de passe</label>
                <input type="password" id="settings-pwd-new" placeholder="Min 6 caractères">
              </div>
              <div id="profile-error" class="auth-error"></div>
              <button type="submit" class="btn-primary">Enregistrer</button>
            </form>
          </div>
        </div>
      </div>

      <!-- Style d'écriture -->
      <div class="settings-panel" id="panel-style">
        <div class="admin-card">
          <div class="admin-card-header"><h3>🎨 Mon style d'écriture</h3></div>
          <div class="admin-card-body">
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
              Ces réglages seront utilisés par défaut pour tous vos nouveaux projets.
            </p>
            <form id="form-style" class="auth-form">
              <div class="form-group">
                <label for="style-registre">Registre</label>
                <select id="style-registre">
                  <option value="introspectif-retenu" ${style.registre === 'introspectif-retenu' ? 'selected' : ''}>Introspectif-retenu (précis, geste, ellipse)</option>
                  <option value="lyrique-cosmique" ${style.registre === 'lyrique-cosmique' ? 'selected' : ''}>Lyrique-cosmique (exaltation, images, souffle)</option>
                  <option value="les deux" ${style.registre === 'les deux' ? 'selected' : ''}>Les deux en alternance</option>
                </select>
              </div>
              <div class="form-group">
                <label>Longueur des phrases <span id="val-longueur" style="color:var(--accent)">${style.longueur || 50}%</span></label>
                <input type="range" id="style-longueur" min="0" max="100" value="${style.longueur || 50}" style="width:100%">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted)">
                  <span>Courtes, hachées</span><span>Longues, amples</span>
                </div>
              </div>
              <div class="form-group">
                <label>Précision des objets <span id="val-objets" style="color:var(--accent)">${style.precision_objets || 70}%</span></label>
                <input type="range" id="style-objets" min="0" max="100" value="${style.precision_objets || 70}" style="width:100%">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted)">
                  <span>Poétiques, vagues</span><span>Cliniques, précis</span>
                </div>
              </div>
              <div class="form-group">
                <label>Émotion <span id="val-emotion" style="color:var(--accent)">${style.emotion || 30}%</span></label>
                <input type="range" id="style-emotion" min="0" max="100" value="${style.emotion || 30}" style="width:100%">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted)">
                  <span>Par le geste, retenue</span><span>Nommée, explicite</span>
                </div>
              </div>
              <div class="form-group">
                <label for="style-filrouge">Fil rouge par défaut <span class="label-hint">(optionnel)</span></label>
                <input type="text" id="style-filrouge" value="${escHtml(style.filRouge || '')}" placeholder="Ex: un message qui ne sera jamais envoyé">
              </div>
              <div id="style-error" class="auth-error"></div>
              <button type="submit" class="btn-primary">Sauvegarder mon style</button>
            </form>
          </div>
        </div>
      </div>

      <!-- Clé API -->
      <div class="settings-panel" id="panel-apikey">
        <div class="admin-card">
          <div class="admin-card-header"><h3>🔑 Clé API personnelle</h3></div>
          <div class="admin-card-body">
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
              Ajoutez votre propre clé OpenAI, Anthropic ou DeepSeek pour ne plus avoir de limite de projets.
              ${apiKeyMeta.hasKey ? '✅ <strong>Vous avez déjà une clé enregistrée.</strong>' : '❌ <strong>Aucune clé pour le moment.</strong>'}
            </p>
            <form id="form-apikey" class="auth-form">
              <div class="form-group">
                <label for="apikey-provider">Fournisseur</label>
                <select id="apikey-provider">
                  <option value="openai">OpenAI (GPT-4o, GPT-4, GPT-3.5)</option>
                  <option value="anthropic">Anthropic (Claude 3 Opus, Sonnet, Haiku)</option>
                  <option value="deepseek">DeepSeek (DeepSeek Chat, DeepSeek Reasoner)</option>
                </select>
              </div>
              <div class="form-group">
                <label for="apikey-key">Clé API</label>
                <input type="password" id="apikey-key" placeholder="sk-... ou sk-ant-..." ${apiKeyMeta.hasKey ? 'disabled style="opacity:0.5"' : ''}>
                ${apiKeyMeta.hasKey ? '<span style="font-size:12px;color:var(--text-muted)">🔒 Clé déjà enregistrée. Laissez vide pour la conserver.</span>' : ''}
              </div>
              <div id="apikey-error" class="auth-error"></div>
              <div style="display:flex;gap:8px">
                <button type="submit" class="btn-primary">${apiKeyMeta.hasKey ? 'Remplacer la clé' : 'Enregistrer la clé'}</button>
                ${apiKeyMeta.hasKey ? `<button type="button" id="btn-delete-apikey" class="btn-secondary" style="color:var(--danger)">Supprimer la clé</button>` : ''}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  // ─── Tabs ────────────────────────────────────────────────────────────────
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
    });
  });

  // ─── Ranges (affichage valeur) ───────────────────────────────────────────
  ['longueur', 'objets', 'emotion'].forEach(id => {
    const input = document.getElementById(`style-${id}`);
    const val = document.getElementById(`val-${id}`);
    if (input && val) input.addEventListener('input', () => { val.textContent = `${input.value}%`; });
  });

  // ─── Sauvegarder profil ─────────────────────────────────────────────────
  const profileForm = document.getElementById('form-profile');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('settings-name').value.trim();
      const currentPassword = document.getElementById('settings-pwd-current').value;
      const newPassword = document.getElementById('settings-pwd-new').value;
      const errorEl = document.getElementById('profile-error');
      const btn = e.target.querySelector('button');
      btn.disabled = true; btn.textContent = '…';
      try {
        const body = {};
        if (name) body.name = name;
        if (currentPassword && newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }
        await fetchJSON(`${API_BASE}/auth/me`, { ...headers, 'Content-Type': 'application/json' }, JSON.stringify(body), 'PUT');
        if (currentUser) currentUser.name = name;
        errorEl.innerHTML = '<span style="color:var(--success)">✅ Enregistré.</span>';
        document.getElementById('settings-pwd-current').value = '';
        document.getElementById('settings-pwd-new').value = '';
      } catch (err) { errorEl.innerHTML = `<span style="color:var(--danger)">❌ ${err.message}</span>`; }
      btn.disabled = false; btn.textContent = 'Enregistrer';
    });
  }

  // ─── Sauvegarder style ──────────────────────────────────────────────────
  const styleForm = document.getElementById('form-style');
  if (styleForm) {
    styleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const styleData = {
        registre: document.getElementById('style-registre').value,
        longueur: parseInt(document.getElementById('style-longueur').value),
        precision_objets: parseInt(document.getElementById('style-objets').value),
        emotion: parseInt(document.getElementById('style-emotion').value),
        filRouge: document.getElementById('style-filrouge').value.trim()
      };
      const errorEl = document.getElementById('style-error');
      const btn = e.target.querySelector('button');
      btn.disabled = true; btn.textContent = '…';
      try {
        const resp = await fetchJSON(`${API_BASE}/auth/style`, { ...headers, 'Content-Type': 'application/json' }, JSON.stringify(styleData), 'PUT');
        window.userStyle = resp.style;
        errorEl.innerHTML = '<span style="color:var(--success)">✅ Style sauvegardé.</span>';
      } catch (err) { errorEl.innerHTML = `<span style="color:var(--danger)">❌ ${err.message}</span>`; }
      btn.disabled = false; btn.textContent = 'Sauvegarder mon style';
    });
  }

  // ─── Enregistrer clé API ───────────────────────────────────────────────
  const apiKeyForm = document.getElementById('form-apikey');
  if (apiKeyForm) {
    apiKeyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const provider = document.getElementById('apikey-provider').value;
      const key = document.getElementById('apikey-key').value;
      if (!key && !apiKeyMeta.hasKey) { document.getElementById('apikey-error').innerHTML = '<span style="color:var(--danger)">Veuillez entrer une clé.</span>'; return; }
      if (!key && apiKeyMeta.hasKey) { document.getElementById('apikey-error').textContent = ''; return; }
      const errorEl = document.getElementById('apikey-error');
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = '…';
      try {
        await fetchJSON(`${API_BASE}/auth/apikey`, { ...headers, 'Content-Type': 'application/json' }, JSON.stringify({ provider, key }), 'PUT');
        errorEl.innerHTML = '<span style="color:var(--success)">✅ Clé enregistrée.</span>';
        setTimeout(() => renderSettings(container), 1000);
      } catch (err) { errorEl.innerHTML = `<span style="color:var(--danger)">❌ ${err.message}</span>`; }
      btn.disabled = false; btn.textContent = 'Enregistrer la clé';
    });
  }

  // ─── Supprimer clé API ─────────────────────────────────────────────────
  document.getElementById('btn-delete-apikey')?.addEventListener('click', async () => {
    if (!confirm('Supprimer votre clé API ?')) return;
    await fetch(`${API_BASE}/auth/apikey`, { method: 'DELETE', headers });
    renderSettings(container);
  });
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

async function renderAdmin(container) {
  if (!currentUser || currentUser.role !== 'admin') {
    container.innerHTML = '<div class="error-state"><div class="icon">🔒</div><h3>Accès réservé</h3><p>Vous devez être administrateur pour accéder à cette page.</p></div>';
    return;
  }

  // Charger les données
  const headers = authHeaders();
  let invites = [], whitelist = [], users = [];
  try {
    const [i, w, u] = await Promise.all([
      fetchJSON('/api/auth/invites', headers),
      fetchJSON('/api/auth/whitelist', headers),
      fetchJSON('/api/auth/users', headers)
    ]);
    invites = i; whitelist = w; users = u;
  } catch (err) { /* silencieux */ }

  container.innerHTML = `
    <div class="admin-dashboard">
      <h2>⚙ Administration</h2>
      <p class="subtitle" style="margin-bottom:24px;color:var(--text-secondary);font-size:14px;">
        Gestion des invitations, whitelist et utilisateurs
      </p>

      <div class="admin-grid">

        <!-- ─── Codes d'invitation ─── -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>🔑 Codes d'invitation</h3>
          </div>
          <div class="admin-card-body">
            <form id="form-create-invite" class="admin-inline-form">
              <input type="number" id="invite-max-uses" value="1" min="1" max="99" style="width:80px" title="Utilisations max">
              <input type="number" id="invite-days" value="30" min="1" max="365" style="width:80px" title="Validité (jours)">
              <button type="submit" class="btn-primary btn-small">Générer</button>
            </form>
            <div id="new-invite-result" style="margin-top:8px;font-size:13px"></div>
            <div class="admin-list" id="invites-list">
              ${invites.length === 0
                ? '<div class="admin-empty">Aucun code</div>'
                : invites.map(inv => `
                  <div class="admin-list-item">
                    <div style="display:flex;align-items:center;gap:12px;flex:1">
                      <code style="font-size:14px;font-weight:600">${inv.code}</code>
                      <span style="font-size:11px;color:var(--text-muted)">
                        ${inv.usedBy.length}/${inv.maxUses} utilisés
                        · expire ${new Date(inv.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button class="btn-remove-invite" data-code="${inv.code}" title="Supprimer ce code">✕</button>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>

        <!-- ─── Whitelist ─── -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>📋 Whitelist</h3>
            <span style="font-size:11px;color:var(--text-muted)">Emails autorisés sans code</span>
          </div>
          <div class="admin-card-body">
            <form id="form-add-whitelist" class="admin-inline-form">
              <input type="email" id="whitelist-email" placeholder="email@exemple.fr" required style="flex:1">
              <button type="submit" class="btn-small" style="background:var(--accent);color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer">Ajouter</button>
            </form>
            <div id="whitelist-error" style="font-size:12px;color:var(--danger);margin-top:4px"></div>
            <div class="admin-list" id="whitelist-list">
              ${whitelist.length === 0
                ? '<div class="admin-empty">Aucun email whitelisté</div>'
                : whitelist.map(email => `
                  <div class="admin-list-item">
                    <span>${email}</span>
                    <button class="btn-remove" data-email="${email}" title="Retirer">✕</button>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>

        <!-- ─── Utilisateurs ─── -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3>👥 Utilisateurs</h3>
            <span style="font-size:11px;color:var(--text-muted)">${users.length} compte(s)</span>
          </div>
          <div class="admin-card-body">
            <div class="admin-list">
              ${users.map(u => `
                <div class="admin-list-item">
                  <div>
                    <strong>${u.name || u.email}</strong>
                    <span style="font-size:11px;color:var(--text-muted);display:block">${u.email}</span>
                  </div>
                  <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${u.role === 'admin' ? 'var(--warning)' : 'var(--bg-hover)'};color:${u.role === 'admin' ? '#000' : 'var(--text-secondary)'}">${u.role}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // ─── Créer un code d'invitation ───
  const inviteForm = document.getElementById('form-create-invite');
  if (inviteForm) {
    inviteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const maxUses = parseInt(document.getElementById('invite-max-uses').value) || 1;
      const expiresInDays = parseInt(document.getElementById('invite-days').value) || 30;
      const resultEl = document.getElementById('new-invite-result');
      const btn = e.target.querySelector('button');
      btn.disabled = true;
      btn.textContent = '…';
      try {
        const data = await fetchJSON('/api/auth/invites', {
          ...headers,
          'Content-Type': 'application/json'
        }, JSON.stringify({ maxUses, expiresInDays }));
        resultEl.innerHTML = `✅ <code style="font-size:16px;font-weight:700;color:var(--success)">${data.invite.code}</code> copiez ce code`;
        // Recharger la liste
        setTimeout(() => renderAdmin(container), 1500);
      } catch (err) {
        resultEl.textContent = `❌ ${err.message}`;
        btn.disabled = false;
        btn.textContent = 'Générer';
      }
    });
  }

  // ─── Whitelist : ajouter ───
  const wlForm = document.getElementById('form-add-whitelist');
  if (wlForm) {
    wlForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('whitelist-email').value;
      const errorEl = document.getElementById('whitelist-error');
      try {
        await fetchJSON('/api/auth/whitelist', {
          ...headers,
          'Content-Type': 'application/json'
        }, JSON.stringify({ email }));
        errorEl.textContent = '';
        document.getElementById('whitelist-email').value = '';
        setTimeout(() => renderAdmin(container), 500);
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });
  }

  // ─── Whitelist : supprimer ───
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.dataset.email;
      try {
        await fetch(`/api/auth/whitelist/${encodeURIComponent(email)}`, {
          method: 'DELETE',
          headers
        });
        setTimeout(() => renderAdmin(container), 300);
      } catch {}
    });
  });
}

// ─── LOGS ───

async function renderLogs(container) {
  try {
    const logs = await fetchJSON(`${API_BASE}/logs?limit=100`);
    if (!logs || logs.length === 0) {
      container.innerHTML = `
        <div class="knowledge-view">
          <h2>📋 Logs des sessions</h2>
          <p class="subtitle" style="margin-bottom:20px;color:var(--text-secondary);font-size:14px;">
            Aucune session pour le moment. Lancez un projet pour voir apparaître les logs ici.
          </p>
          <div class="empty-state"><div class="icon">📋</div><h3>Aucun log</h3><p>Les sessions OpenCode seront enregistrées automatiquement.</p></div>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="knowledge-view">
        <h2>📋 Logs des sessions</h2>
        <p class="subtitle" style="margin-bottom:20px;color:var(--text-secondary);font-size:14px;">
          ${logs.length} session${logs.length > 1 ? 's' : ''} — historique des commandes OpenCode
        </p>
        <div class="logs-list">
          ${logs.map(log => {
            const date = new Date(log.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const durationStr = log.duration ? `${(log.duration / 1000).toFixed(0)}s` : '—';
            const statusIcon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : log.status === 'cancelled' ? '⏹' : '⏳';
            const agentLabel = log.agent || '—';
            return `<div class="log-item" data-slug="${log.slug}">
              <div class="log-item-header">
                <span class="log-status-icon">${statusIcon}</span>
                <span class="log-agent">${agentLabel}</span>
                <span class="log-date">${dateStr} ${timeStr}</span>
                <span class="log-duration">${durationStr}</span>
                <span class="log-events-count">${log.eventCount} events</span>
              </div>
              <div class="log-message">${escHtml(log.message || '')}</div>
              ${log.error ? `<div class="log-error">${escHtml(log.error)}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    // Click sur un log → afficher le détail
    container.querySelectorAll('.log-item').forEach(el => {
      el.addEventListener('click', async () => {
        const slug = el.dataset.slug;
        await renderLogDetail(container, slug);
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="error-state"><div class="icon">⚠️</div><h3>Erreur</h3><p>${err.message}</p></div>`;
  }
}

async function renderLogDetail(container, slug) {
  try {
    const log = await fetchJSON(`${API_BASE}/logs/${slug}`);
    if (!log) { container.innerHTML = '<div class="error-state">Log introuvable</div>'; return; }

    const date = new Date(log.timestamp);
    const statusIcon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : log.status === 'cancelled' ? '⏹' : '⏳';
    const durationStr = log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '—';

    // Reconstruire le terminal (même rendu que le live)
    let terminalHtml = '';
    for (const evt of log.events || []) {
      const ts = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : '';
      const time = ts ? `<span class="term-time">${ts}</span>` : '';
      switch (evt.type) {
        case 'step_start':
          terminalHtml += `<div class="term-line term-step">${time} 🔄 Étape démarrée</div>`;
          break;
        case 'text':
          if (evt.text && evt.text.trim()) {
            terminalHtml += `<div class="term-line term-text">${time} ${escHtml(evt.text.trim())}</div>`;
          }
          break;
        case 'tool_use': {
          const toolName = evt.part?.tool || evt.tool || evt.name || 'outil';
          let detail = '';
          if (evt.part?.state?.input) {
            const input = evt.part.state.input;
            if (input.filePath) detail = escHtml(input.filePath.split('\\').pop());
            else if (input.pattern) detail = escHtml(input.pattern);
            else if (input.subagent_type) detail = `agent: ${escHtml(input.subagent_type)}`;
          }
          terminalHtml += `<div class="term-line term-tool">${time} 🔧 <strong>${escHtml(toolName)}</strong>${detail ? ` — ${detail}` : ''}</div>`;
          if (evt.part?.state?.status === 'completed' && evt.part?.state?.output) {
            const output = evt.part.state.output;
            if (typeof output === 'string' && output.length < 200 && output.trim()) {
              terminalHtml += `<div class="term-line term-tool-result">${time}   ${escHtml(output.trim().slice(0, 150))}</div>`;
            }
          }
          break;
        }
        case 'tool_result':
          terminalHtml += `<div class="term-line term-tool-result">${time} ✔ Résultat reçu</div>`;
          break;
        case 'step_finish': {
          const tokens = evt.part?.tokens || evt.tokens || {};
          const total = tokens.total || 0;
          const reason = evt.part?.reason || '';
          const raison = reason === 'stop' ? '' : reason === 'tool-calls' ? ' (appels outil)' : reason ? ` (${reason})` : '';
          terminalHtml += `<div class="term-line term-finish">${time} ✅ Terminé${raison} — ${total} tokens</div>`;
          break;
        }
        case 'error': {
          const msg = evt.error?.message || evt.error || evt.message || 'Erreur';
          terminalHtml += `<div class="term-line term-error">${time} ❌ ${escHtml(msg)}</div>`;
          break;
        }
        default:
          if (evt.text) terminalHtml += `<div class="term-line term-text">${time} ${escHtml(evt.text)}</div>`;
      }
    }

    container.innerHTML = `
      <div class="projet-view">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div>
            <h2 style="margin-bottom:4px;">${statusIcon} ${log.agent}</h2>
            <span style="font-size:13px;color:var(--text-muted);">${date.toLocaleString()} · ${durationStr} · ${log.events.length} events</span>
          </div>
          <button class="btn-back" onclick="afficherVue('logs')">← Logs</button>
        </div>

        <div class="projet-section">
          <div class="projet-section-title">Message envoyé</div>
          <div class="projet-section-content">
            <pre style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);white-space:pre-wrap;word-break:break-word;">${escHtml(log.message || '')}</pre>
          </div>
        </div>

        ${log.error ? `<div class="projet-section">
          <div class="projet-section-title" style="color:var(--danger)">Erreur</div>
          <div class="projet-section-content" style="color:var(--danger)">${escHtml(log.error)}</div>
        </div>` : ''}

        <div class="terminal-section" style="margin-top:0;">
          <div class="terminal-header">
            <h3>🧠 Session OpenCode</h3>
            <span class="terminal-status ${log.status}">${statusIcon} ${log.status}</span>
          </div>
          <div class="terminal-output" style="max-height:600px;">
            ${terminalHtml || '<div class="term-line" style="color:var(--text-muted);">Aucun événement enregistré</div>'}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="error-state">Erreur: ${err.message}</div>`;
  }
}

// ─── DASHBOARD — section activité récente ───

async function renderRecentActivity(container) {
  try {
    const logs = await fetchJSON(`${API_BASE}/logs?limit=5`);
    if (!logs || logs.length === 0) return;

    container.innerHTML += `
      <div style="margin-top:32px;">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;">🕐 Activité récente</h3>
        <div class="logs-list" style="max-width:100%;">
          ${logs.map(log => {
            const date = new Date(log.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const statusIcon = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : log.status === 'cancelled' ? '⏹' : '⏳';
            const agentLabel = (log.agent || '').replace('orchestrateur-', '');
            return `<div class="log-item" data-slug="${log.slug}" onclick="afficherVue('logs')" style="cursor:pointer;">
              <div class="log-item-header">
                <span class="log-status-icon">${statusIcon}</span>
                <span class="log-agent">${escHtml(agentLabel)}</span>
                <span class="log-date">${dateStr} ${timeStr}</span>
                <span class="log-duration">${log.duration ? `${(log.duration/1000).toFixed(0)}s` : '—'}</span>
              </div>
              <div class="log-message">${escHtml((log.message || '').slice(0, 80))}</div>
            </div>`;
          }).join('')}
          <div style="margin-top:8px;"><a href="#" onclick="event.preventDefault();afficherVue('logs')" style="font-size:13px;">Voir tous les logs →</a></div>
        </div>
      </div>`;
  } catch {}
}

// ─── Brancher l'activité récente dans le Dashboard ───
// (appelé à la fin de renderDashboard)
// Le renderDashboard original sera patché via son dernier append

// ─── Exposer globalement pour les onclick inline ───
window.afficherVue = afficherVue;
