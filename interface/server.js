const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const app = express();
const PORT = process.env.PORT || 3737;

// ─── Auth ──────────────────────────────────────────────────────────────────
const auth = require('./auth');
auth.initAuth();

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

// ─── Chemins racines ──────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const GLOBAL_PROJETS = path.join(ROOT, 'projets');   // legacy, avant migration
const KNOWLEDGE = path.join(ROOT, 'knowledge');
const SKILLS = path.join(ROOT, '.opencode', 'skills');
const ECHANTILLONS = path.join(ROOT, 'echantillons');
const AGENTS_DIR = path.join(ROOT, '.opencode', 'agent');

// ─── Helper : résoudre le chemin projet selon l'utilisateur ────────────────
function userProjets(req) {
  if (req.user) return path.join(auth.userDir(req.user.id), 'projets');
  return GLOBAL_PROJETS; // fallback pour les routes non-auth (legacy)
}

function userEchantillons(req) {
  if (req.user) return path.join(auth.userDir(req.user.id), 'echantillons');
  return ECHANTILLONS;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GENRES = [
  { slug: 'romans',      label: 'Romans',      icon: '📖' },
  { slug: 'poesie',      label: 'Poésie',      icon: '✨' },
  { slug: 'theatre',     label: 'Théâtre',     icon: '🎭' },
  { slug: 'essais',      label: 'Essais',      icon: '📝' },
  { slug: 'nouvelles',   label: 'Nouvelles',   icon: '📄' },
  { slug: 'textes-mobiles', label: 'Textes mobiles', icon: '💫' },
  { slug: 'universitaire',   label: 'Universitaire', icon: '🎓' },
];

/** Liste les sous-dossiers (projets) d'un dossier genre */
function listProjets(genreDir, basePath) {
  const base = basePath || GLOBAL_PROJETS;
  const dir = path.join(base, genreDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name);
}

/** Vérifie si un projet a une bible (donc est un projet actif) */
function projetExists(genre, nom, basePath) {
  const base = basePath || GLOBAL_PROJETS;
  const bible = path.join(base, genre, nom, 'bible.md');
  return fs.existsSync(bible);
}

/** Lit un fichier en UTF-8, retourne null si absent */
function lireFichier(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  } catch { return null; }
}

/** Liste le contenu d'un dossier projet */
function structureProjet(genre, nom, basePath) {
  const base = path.join(basePath || GLOBAL_PROJETS, genre, nom);
  if (!fs.existsSync(base)) return null;

  const result = { dossiers: {}, fichiers: [] };
  const items = fs.readdirSync(base, { withFileTypes: true });
  for (const item of items) {
    if (item.name.startsWith('.')) continue;
    if (item.isDirectory()) {
      const sous = fs.readdirSync(path.join(base, item.name), { withFileTypes: true })
        .filter(f => !f.name.startsWith('.'))
        .map(f => f.name);
      result.dossiers[item.name] = sous;
    } else {
      result.fichiers.push(item.name);
    }
  }
  return result;
}

/** Lit le frontmatter YAML simplifié d'un skill */
function lireFrontmatterSkill(contenu) {
  const match = contenu.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const sep = line.indexOf(':');
    if (sep > 0) {
      const key = line.slice(0, sep).trim();
      let val = line.slice(sep + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      fm[key] = val;
    }
  }
  return fm;
}

// ---------------------------------------------------------------------------
// Progression — helper
// ---------------------------------------------------------------------------

/** Dossier d'unités par genre */
const UNIT_DIRS = {
  romans: 'chapitres',
  poesie: 'sections',
  theatre: 'scenes',
  essais: 'chapitres',
  nouvelles: 'recits',
  'textes-mobiles': 'textes',
  universitaire: 'chapitres'
};

/** Patterns d'unités par genre pour le parsing des fichiers */
const UNIT_PATTERNS = {
  chapitres:    /^chapitre[-_\s]*(\d+)/i,
  sections:     /^section[-_\s]*(\d+)/i,
  scenes:       /^scene[-_\s]*(\d+)/i,
  recits:       /^recit[-_\s]*(\d+)/i,
  textes:       /^texte[-_\s]*(\d+)/i
};

/**
 * Calcule la progression complète d'un projet à partir de sa bible et de ses fichiers
 */
function calculerProgression(genre, nom, basePath) {
  const base = path.join(basePath || GLOBAL_PROJETS, genre, nom);
  const bible = lireFichier(path.join(base, 'bible.md'));
  if (!bible) return null;

  const unitDir = UNIT_DIRS[genre] || 'chapitres';
  const unitPattern = UNIT_PATTERNS[unitDir];

  // 1. Extraire le nombre total d'unités depuis la bible
  const totalMatch = bible.match(/Nombre\s+(?:total\s+)?(?:de\s+)?(\w+)\s*\(cible\)\s*:\s*(\d+)/i);
  const total = totalMatch ? parseInt(totalMatch[2]) : 0;

  // 2. Extraire les skills actifs
  const skills = [];
  const skillsSection = bible.match(/##\s*Skills\s*actifs?\s*\n([\s\S]*?)(?=\n##|$)/i);
  if (skillsSection) {
    for (const line of skillsSection[1].split('\n')) {
      const s = line.match(/^\s*[-*]\s*(.+)/);
      if (s) skills.push(s[1].trim());
    }
  }

  // 3. Compter les fichiers dans le dossier d'unités
  const unitPath = path.join(base, unitDir);
  const contenuFiles = [];
  const brouillonFiles = [];
  const avisFiles = [];

  if (fs.existsSync(unitPath)) {
    const files = fs.readdirSync(unitPath);
    for (const f of files) {
      if (f.startsWith('.')) continue;
      const lower = f.toLowerCase();
      if (lower.startsWith('brouillon-')) brouillonFiles.push(f);
      else if (lower.startsWith('avis-')) avisFiles.push(f);
      else if (f.endsWith('.md') && !f.startsWith('_')) contenuFiles.push(f);
    }
  }

  // 4. Déterminer le statut de chaque unité planifiée depuis la bible
  const unites = [];
  const unitRegex = /-\s*(\w+)\s*(\d+)\s*[—–-]\s*(.*?)(?:\s*[—–-]\s*statut\s*:\s*(.*?))?$/gim;
  let m;
  while ((m = unitRegex.exec(bible)) !== null) {
    const num = m[2].padStart(2, '0');
    const desc = m[3].trim();
    const statutBible = m[4] ? m[4].trim().toLowerCase() : 'à écrire';

    let statut = statutBible;
    const aContenu = contenuFiles.some(f => unitPattern.test(f) && f.match(unitPattern)[1].padStart(2, '0') === num);
    const aAvis = avisFiles.some(f => f.includes(num));

    if (aAvis) statut = 'validé';
    else if (aContenu) statut = 'écrit';

    unites.push({ numero: num, description: desc, statut });
  }

  // 5. Compter
  const ecrits = contenuFiles.length;
  const valides = avisFiles.length;
  const restants = Math.max(0, total - ecrits);

  // 6. Phase active
  let phase = 'planification';
  if (valides > 0 && valides >= total && total > 0) phase = 'finalisation';
  else if (valides > 0) phase = 'relecture';
  else if (ecrits > 0) phase = 'écriture';

  // 7. État
  let etat = 'sur-les-rails';
  if (total > 0 && ecrits === 0 && bible) {
    // Vérifier si la bible semble ancienne (pas de fichier écrit depuis sa création)
    try {
      const bibleStat = fs.statSync(path.join(base, 'bible.md'));
      const daysSinceBible = (Date.now() - bibleStat.mtimeMs) / 86400000;
      if (daysSinceBible > 14) etat = 'en-pause';
    } catch {}
  }

  // 8. Dernière action
  let derniereAction = '—';
  const logPath = path.join(base, 'notes', 'pipeline-log.md');
  const logContent = lireFichier(logPath);
  if (logContent) {
    const lignes = logContent.trim().split('\n').filter(l => l.trim() && l.includes('|'));
    const derniere = lignes[lignes.length - 1];
    if (derniere) {
      const cols = derniere.split('|').map(c => c.trim());
      const date = cols[1] || '';
      const action = cols[3] || cols[5] || '';
      if (date || action) derniereAction = `${date} — ${action}`.trim();
    }
  } else {
    // Fallback : dernier fichier modifié dans le projet
    try {
      const all = fs.readdirSync(base, { recursive: true, withFileTypes: true })
        .filter(f => f.isFile() && !f.name.startsWith('.'))
        .map(f => ({ name: f.name, path: path.join(f.parentPath, f.name), mtime: fs.statSync(path.join(f.parentPath, f.name)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      if (all.length > 0) {
        const d = new Date(all[0].mtime);
        derniereAction = `${d.toISOString().slice(0, 10)} — ${all[0].name}`;
      }
    } catch {}
  }

  return {
    total,
    ecrits,
    valides,
    restants,
    phase,
    etat,
    skills,
    derniereAction,
    unites,
    unitDir
  };
}

// ---------------------------------------------------------------------------
// API REST
// ---------------------------------------------------------------------------

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes d'auth et fichiers ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// ─── Middleware d'auth optionnelle ─────────────────────────────────────────
// Si un token valide est fourni, on attache req.user. Sinon, on laisse passer.
app.use('/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const session = auth.findSession(token);
    if (session) {
      req.user = auth.findUserById(session.userId);
      req.userToken = token;
    }
  }
  next();
});

// --- Liste des genres + projets (avec progression) ---
app.get('/api/projets', (req, res) => {
  const projetsBase = userProjets(req);
  const data = GENRES.map(g => ({
    ...g,
    projets: listProjets(g.slug, projetsBase).map(nom => {
      const bd = lireFichier(path.join(projetsBase, g.slug, nom, 'bible.md'));
      const bdConnaissances = lireFichier(path.join(projetsBase, g.slug, nom, 'bd-connaissances.md'));
      const structure = structureProjet(g.slug, nom, projetsBase);
      const progression = calculerProgression(g.slug, nom, projetsBase);
      return { nom, bible: bd, bdConnaissances, structure, progression };
    })
  }));
  res.json(data);
});

// --- Structure détaillée d'un projet (avec progression) ---
app.get('/api/projets/:genre/:nom/structure', (req, res) => {
  const { genre, nom } = req.params;
  const projetsBase = userProjets(req);
  if (!projetExists(genre, nom, projetsBase)) return res.status(404).json({ error: 'Projet introuvable' });
  const struct = structureProjet(genre, nom, projetsBase);
  const bible = lireFichier(path.join(projetsBase, genre, nom, 'bible.md'));
  const bd = lireFichier(path.join(projetsBase, genre, nom, 'bd-connaissances.md'));
  const progression = calculerProgression(genre, nom, projetsBase);
  res.json({ nom, genre, bible, bdConnaissances: bd, structure: struct, progression });
});

// --- Lecture d'un fichier quelconque ---
app.get('/api/projets/:genre/:nom/fichier', (req, res) => {
  const { genre, nom } = req.params;
  const relPath = req.query.path;
  const projetsBase = userProjets(req);
  if (!relPath) return res.status(400).json({ error: 'Paramètre path requis' });
  // Sécurité : empêcher le path traversal
  const safe = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = path.resolve(path.join(projetsBase, genre, nom, safe));
  const base = path.resolve(path.join(projetsBase, genre, nom));
  if (!full.startsWith(base + path.sep) && full !== base) {
    return res.status(403).json({ error: 'Chemin non autorisé' });
  }
  const contenu = lireFichier(full);
  if (contenu === null) return res.status(404).json({ error: 'Fichier introuvable' });
  res.json({ contenu, chemin: safe });
});

// --- Skills ---
app.get('/api/skills', (req, res) => {
  if (!fs.existsSync(SKILLS)) return res.json([]);
  const dirs = fs.readdirSync(SKILLS, { withFileTypes: true }).filter(d => d.isDirectory());
  const data = dirs.map(d => {
    const skillFile = path.join(SKILLS, d.name, 'SKILL.md');
    const contenu = lireFichier(skillFile);
    if (!contenu) return { nom: d.name, contenu: null };
    const fm = lireFrontmatterSkill(contenu);
    return { nom: d.name, maturite: fm.maturité || 'spéculatif', description: fm.description || '', contenu };
  });
  res.json(data);
});

// --- Lecture d'un skill spécifique ---
app.get('/api/skills/:nom', (req, res) => {
  const { nom } = req.params;
  const skillFile = path.join(SKILLS, nom, 'SKILL.md');
  const contenu = lireFichier(skillFile);
  if (!contenu) return res.status(404).json({ error: 'Skill introuvable' });
  const fm = lireFrontmatterSkill(contenu);
  res.json({ nom, maturite: fm.maturité || 'spéculatif', description: fm.description || '', contenu });
});

// --- Knowledge ---
app.get('/api/knowledge', (req, res) => {
  if (!fs.existsSync(KNOWLEDGE)) return res.json([]);
  const items = fs.readdirSync(KNOWLEDGE, { withFileTypes: true });
  const fichiers = [];
  const dossiers = [];
  for (const item of items) {
    if (item.name.startsWith('.')) continue;
    if (item.isDirectory()) {
      const sous = fs.readdirSync(path.join(KNOWLEDGE, item.name), { withFileTypes: true })
        .filter(f => !f.name.startsWith('.'))
        .map(f => ({ nom: f.name, dossier: item.name, isDir: f.isDirectory() }));
      dossiers.push({ nom: item.name, contenu: sous });
    } else if (item.name.endsWith('.md')) {
      const contenu = lireFichier(path.join(KNOWLEDGE, item.name));
      fichiers.push({ nom: item.name, contenu, dossier: null });
    }
  }
  res.json({ fichiers, dossiers });
});

// --- Lecture d'un fichier knowledge ---
app.get('/api/knowledge/fichier', (req, res) => {
  const relPath = req.query.path;
  if (!relPath) return res.status(400).json({ error: 'Paramètre path requis' });
  const safe = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = path.resolve(path.join(KNOWLEDGE, safe));
  if (!full.startsWith(KNOWLEDGE + path.sep) && full !== KNOWLEDGE) return res.status(403).json({ error: 'Chemin non autorisé' });
  const contenu = lireFichier(full);
  if (!contenu) return res.status(404).json({ error: 'Fichier introuvable' });
  res.json({ contenu, chemin: safe });
});

// --- Échantillons ---
app.get('/api/echantillons', (req, res) => {
  const echantillonsBase = userEchantillons(req);
  if (!fs.existsSync(echantillonsBase)) return res.json([]);
  const items = fs.readdirSync(echantillonsBase, { withFileTypes: true });
  const fichiers = items.filter(f => !f.name.startsWith('.')).map(f => ({
    nom: f.name,
    isDir: f.isDirectory(),
    contenu: f.isFile() && f.name.endsWith('.md') ? lireFichier(path.join(echantillonsBase, f.name)) : null
  }));
  res.json(fichiers);
});

// --- Statut global (avec progression) ---
app.get('/api/statut', (req, res) => {
  const projetsBase = userProjets(req);
  const data = GENRES.map(g => ({
    ...g,
    projets: listProjets(g.slug, projetsBase).map(nom => {
      const prog = calculerProgression(g.slug, nom, projetsBase);
      const bible = lireFichier(path.join(projetsBase, g.slug, nom, 'bible.md'));
      return {
        nom,
        type: g.slug,
        bible: bible ? bible.slice(0, 500) : null,
        progression: prog
      };
    })
  }));
  res.json(data);
});

// --- Progression d'un projet spécifique ---
app.get('/api/projets/:genre/:nom/progression', (req, res) => {
  const { genre, nom } = req.params;
  const projetsBase = userProjets(req);
  if (!projetExists(genre, nom, projetsBase)) return res.status(404).json({ error: 'Projet introuvable' });
  const prog = calculerProgression(genre, nom, projetsBase);
  if (!prog) return res.status(404).json({ error: 'Impossible de calculer la progression' });
  res.json(prog);
});

// --- Configuration / metadata du projet ---
app.get('/api/config', (req, res) => {
  const agents = [];
  const agentDir = AGENTS_DIR;
  if (fs.existsSync(agentDir)) {
    const fichiers = fs.readdirSync(agentDir, { withFileTypes: true });
    for (const f of fichiers) {
      if (f.isFile() && f.name.endsWith('.md')) {
        const contenu = lireFichier(path.join(agentDir, f.name));
        agents.push({ nom: f.name.replace('.md', ''), contenu: contenu ? contenu.slice(0, 300) : null });
      }
    }
  }
  const nbSkills = fs.existsSync(SKILLS) ? fs.readdirSync(SKILLS).filter(d => !d.startsWith('.')).length : 0;
  res.json({ agents, nbSkills });
});

// ---------------------------------------------------------------------------
// OpenCode Bridge — endpoint SSE
// ---------------------------------------------------------------------------

const { runCommand, buildMessage, sendInput, sessions, GENRE_AGENTS, SKILLS_BY_GENRE, listLogs, getLog } = require('./opencode-bridge');

// Metadata pour le frontend
app.get('/api/opencode/meta', (req, res) => {
  res.json({
    agents: Object.entries(GENRE_AGENTS).map(([slug, v]) => ({ slug, ...v })),
    skillsParGenre: SKILLS_BY_GENRE,
  });
});

// Envoyer une réponse utilisateur à une session OpenCode active
app.post('/api/opencode/input', (req, res) => {
  const { sessionId, text } = req.body;
  if (!sessionId || !text) {
    return res.status(400).json({ error: 'Les champs sessionId et text sont requis.' });
  }
  const ok = sendInput(sessionId, text);
  if (!ok) {
    return res.status(404).json({ error: 'Session introuvable ou terminée.' });
  }
  res.json({ success: true, message: 'Réponse envoyée.' });
});

// Lancer une commande OpenCode — réponse en SSE
app.post('/api/opencode/run', (req, res) => {
  const { genre, titre, synopsis, contraintes, personnages, skills, nbUnites, registre, filRouge } = req.body;

  if (!genre || !titre) {
    return res.status(400).json({ error: 'Les champs genre et titre sont requis.' });
  }

  const mapping = GENRE_AGENTS[genre];
  if (!mapping) {
    return res.status(400).json({ error: `Genre "${genre}" inconnu.` });
  }

  const message = buildMessage(genre, { titre, synopsis, contraintes, personnages, skills, nbUnites, registre, filRouge });

  // Headers SSE + forcer flush immédiat
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  // Désactiver l'algorithme de Nagle et flusher les headers immédiatement
  if (res.socket) res.socket.setNoDelay(true);
  res.flushHeaders();

  // Helper : envoyer un event data: et forcer le flush
  function writeData(json) {
    res.write(`data: ${json}\n\n`);
    // Forcer le flush du buffer HTTP (évite le buffering d'Express/Node)
    if (typeof res.flush === 'function') res.flush();
    else if (res.socket && res.socket.writable) res.socket.write('');
  }

  // ── Variables de fermeture (déclarées avant tout, pour éviter le TDZ) ──
  let closed = false;
  const safeEnd = () => { if (!closed) { closed = true; try { res.end(); } catch {} console.error('[server] res.end()'); } };

  // ── Lancer OpenCode ──
  let emitter, abort;
  let sessionId = null;
  try {
    // Toujours lancer depuis ROOT (racine du projet) pour que les agents
    // définis dans .opencode/agent/ soient trouvés par opencode run.
    // Le projet est créé dans projets/{genre}/{Titre}/ grâce au chemin
    // relatif transmis dans le message via buildMessage().
    const opts = {};
    const result = runCommand(mapping.agent, message, opts);
    emitter = result.emitter;
    abort = result.abort;
    sessionId = result.sessionId;
    console.error(`[server] runCommand OK, sessionId=${result.sessionId}, proc=${result.proc.pid}`);
  } catch (err) {
    console.error(`[server] runCommand ERROR: ${err.message}`);
    try {
      writeData(JSON.stringify({ type: 'error', message: `Erreur au lancement : ${err.message}` }));
      writeData(JSON.stringify({ type: 'done', success: false }));
    } catch {}
    safeEnd();
    return;
  }

  // ── Attacher les listeners AVANT d'envoyer le meta (évite la race condition) ──
  emitter.on('event', (event) => {
    if (closed) return;
    const raw = JSON.stringify(event);
    if (raw.length < 30000) writeData(raw);
  });

  emitter.on('stderr', (text) => {
    if (closed) return;
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      writeData(JSON.stringify({ type: 'stderr', text: line.slice(0, 500) }));
    }
  });

  emitter.on('error', (err) => {
    console.error(`[server] onError: ${err.message}`);
    if (closed) return;
    writeData(JSON.stringify({ type: 'error', message: err.message }));
    writeData(JSON.stringify({ type: 'done', success: false, exitCode: -1 }));
    safeEnd();
  });

  emitter.on('close', (code) => {
    console.error(`[server] onClose: code=${code}`);
    if (closed) return;
    writeData(JSON.stringify({ type: 'done', success: code === 0, exitCode: code }));
    if (code !== 0) {
      writeData(JSON.stringify({ type: 'error', message: `Processus terminé avec le code ${code}` }));
    }
    safeEnd();
  });

  // ── Meta event APRÈS les listeners ──
  writeData(JSON.stringify({ type: 'meta', agent: mapping.agent, command: mapping.command, titre, genre, sessionId }));

  // Nettoyage si le client se déconnecte
  req.on('close', () => {
    try {
      emitter.removeAllListeners();
    } catch {}
    safeEnd();
    abort();
  });

  // Timeout : fermer proprement si le processus ne répond pas
  req.setTimeout(600000); // 10 min
});

// ---------------------------------------------------------------------------
// Logs des sessions OpenCode
// ---------------------------------------------------------------------------

app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(listLogs(limit));
});

app.get('/api/logs/:slug', (req, res) => {
  const log = getLog(req.params.slug);
  if (!log) return res.status(404).json({ error: 'Log introuvable' });
  res.json(log);
});

// ─── Continuer un projet bloqué ──────────────────────────────────────────────
// POST /api/projets/:genre/:nom/continue
// Body: { registre, filRouge } — réponses pré-flight optionnelles
app.post('/api/projets/:genre/:nom/continue', (req, res) => {
  const { genre, nom } = req.params;
  const projetsBase = userProjets(req);
  if (!projetExists(genre, nom, projetsBase)) {
    return res.status(404).json({ error: 'Projet introuvable.' });
  }
  const { registre, filRouge } = req.body;

  // Construire le message de continuation
  const bible = lireFichier(path.join(projetsBase, genre, nom, 'bible.md')) || '';
  const concept = bible.split('\n').slice(0, 10).join('\n').substring(0, 500);

  let message = `Continue le projet "${nom}" (${genre}).\n\nProjet actuel :\n${concept}\n\n`;
  if (registre) message += `Registre : ${registre}\n`;
  if (filRouge) message += `Fil rouge : ${filRouge}\n`;
  message += `\nReprends le travail là où le projet s'est arrêté. Vérifie la bible et les fichiers existants, puis continue la boucle d'écriture.`;

  // Lancer OpenCode
  const mapping = GENRE_AGENTS[genre];
  if (!mapping) return res.status(400).json({ error: `Genre "${genre}" inconnu.` });

  let result;
  try {
    result = runCommand(mapping.agent, message, {});
  } catch (err) {
    return res.status(500).json({ error: `Erreur au lancement : ${err.message}` });
  }

  res.json({ success: true, sessionId: result.sessionId, message: 'Projet relancé.' });
});

// ─── Finaliser un projet ─────────────────────────────────────────────────────
// POST /api/projets/:genre/:nom/finalize
app.post('/api/projets/:genre/:nom/finalize', async (req, res) => {
  const { genre, nom } = req.params;
  const projetsBase = userProjets(req);
  if (!projetExists(genre, nom, projetsBase)) {
    return res.status(404).json({ error: 'Projet introuvable.' });
  }

  const base = path.join(projetsBase, genre, nom);
  const textesDir = path.join(base, UNIT_DIRS[genre] || 'textes');
  const versionsDir = path.join(base, 'versions');

  const results = [];

  // 1. Compiler tous les textes en un seul fichier
  if (fs.existsSync(textesDir)) {
    const files = fs.readdirSync(textesDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('brouillon-') && !f.startsWith('avis-') && !f.startsWith('_'));

    if (files.length > 0) {
      fs.mkdirSync(versionsDir, { recursive: true });
      const compilationPath = path.join(versionsDir, `${nom}-complet.md`);
      let compilation = `# ${nom}\n\n*Recueil complet — généré le ${new Date().toLocaleDateString('fr-FR')}*\n\n---\n\n`;

      files.sort().forEach(f => {
        const content = lireFichier(path.join(textesDir, f));
        if (content) {
          compilation += content;
          compilation += '\n\n---\n\n';
        }
      });

      fs.writeFileSync(compilationPath, compilation, 'utf-8');
      results.push({ step: 'compilation', file: `${nom}-complet.md`, status: 'ok' });
    }
  }

  // 2. Essayer de générer un PDF
  const pandocPath = path.join(process.env.LOCALAPPDATA || '', 'Pandoc', 'pandoc.exe');
  if (fs.existsSync(pandocPath) || require('child_process').spawnSync('where', ['pandoc']).status === 0) {
    const pdfPath = path.join(versionsDir, `${nom}.pdf`);
    const mdPath = path.join(versionsDir, `${nom}-complet.md`);
    if (fs.existsSync(mdPath)) {
      try {
        const { execSync } = require('child_process');
        execSync(`"${pandocPath}" "${mdPath}" -o "${pdfPath}" --pdf-engine=pdfhtml 2>&1`, { timeout: 30000 });
        if (fs.existsSync(pdfPath)) {
          results.push({ step: 'pdf', file: `${nom}.pdf`, status: 'ok' });
        } else {
          results.push({ step: 'pdf', status: 'echec', reason: 'PDF non généré' });
        }
      } catch (e) {
        results.push({ step: 'pdf', status: 'echec', reason: e.message.substring(0, 100) });
      }
    }
  } else {
    results.push({ step: 'pdf', status: 'ignore', reason: 'Pandoc non disponible' });
  }

  // 3. Vérifier les fichiers produits
  let ecrits = 0, valides = 0;
  if (fs.existsSync(textesDir)) {
    const allFiles = fs.readdirSync(textesDir);
    ecrits = allFiles.filter(f => f.endsWith('.md') && !f.startsWith('brouillon-') && !f.startsWith('avis-') && !f.startsWith('_')).length;
    valides = allFiles.filter(f => f.startsWith('avis-editeur-')).length;
  }

  results.push({ step: 'bilan', ecrits, valides, status: 'ok' });

  res.json({ success: true, results });
});

// --- Fallback SPA : servir index.html pour les routes non-API ---
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API introuvable' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------------------------------------------------------------------
// Démarrage
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`\n  ✦ AgentIA-Ecriture — Interface Web`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → Ctrl+C pour arrêter\n`);
});
