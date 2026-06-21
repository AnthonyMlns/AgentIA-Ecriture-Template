const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3737;

// S10 : en-têtes de sécurité. CSP désactivée pour l'instant car le front
// utilise des handlers inline (onclick) et des styles inline ; l'activer
// nécessiterait de les externaliser (à faire plus tard). On garde quand même
// X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.
app.use(helmet({ contentSecurityPolicy: false }));

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

// ─── Helper : résoudre le chemin projet ────────────────────────────────────
// Si l'utilisateur est connecté, on utilise son dossier spécifique
// (users/{id}/projets/). Sinon, on tombe sur le dossier global.
// Les agents OpenCode écrivent dans projets/ (global, car lancés depuis ROOT),
// donc on auto-synchronise du global vers l'utilisateur à la première lecture.
function userProjets(req) {
  if (req && req.user) return auth.userProjetsDir(req.user.id);
  return GLOBAL_PROJETS;
}

/**
 * Synchronise un projet depuis le dossier global projets/ vers le dossier
 * utilisateur s'il n'y est pas encore. Permet aux agents OpenCode (qui
 * écrivent dans le global depuis ROOT) de cohabiter avec l'interface user.
 */
function ensureUserProject(req, genre, nom) {
  if (!req || !req.user) return;
  const userDir = auth.userProjetsDir(req.user.id);
  const userProjPath = path.join(userDir, genre, nom);
  const globalProjPath = path.join(GLOBAL_PROJETS, genre, nom);

  if (!fs.existsSync(userProjPath) && fs.existsSync(globalProjPath)) {
    console.error(`[sync] Copie ${genre}/${nom} : global → utilisateur ${req.user.id}`);
    fs.mkdirSync(path.dirname(userProjPath), { recursive: true });
    try {
      fs.cpSync(globalProjPath, userProjPath, { recursive: true });
    } catch (err) {
      console.error(`[sync] Erreur copie ${genre}/${nom} : ${err.message}`);
    }
  }
}

/**
 * Synchronise tous les projets du dossier global projets/ vers le dossier
 * utilisateur. Appelé au chargement du tableau de bord et du statut global.
 */
function syncAllGlobalToUser(req) {
  if (!req || !req.user) return;
  const userDir = auth.userProjetsDir(req.user.id);
  for (const g of GENRES) {
    const globalGenre = path.join(GLOBAL_PROJETS, g.slug);
    if (!fs.existsSync(globalGenre)) continue;
    for (const nom of fs.readdirSync(globalGenre).filter(d => !d.startsWith('.'))) {
      const userProj = path.join(userDir, g.slug, nom);
      const globalProj = path.join(globalGenre, nom);
      if (!fs.existsSync(userProj) && fs.existsSync(path.join(globalProj, 'bible.md'))) {
        fs.mkdirSync(path.dirname(userProj), { recursive: true });
        try {
          fs.cpSync(globalProj, userProj, { recursive: true });
          console.error(`[sync] Copie globale → user : ${g.slug}/${nom}`);
        } catch (err) {
          console.error(`[sync] Erreur ${g.slug}/${nom} : ${err.message}`);
        }
      }
    }
  }
}

/**
 * Déplace un projet du dossier global projets/ vers le dossier utilisateur
 * APRÈS qu'une session OpenCode l'a créé/modifié dans le global.
 * C'est ce qui assure que les projets "atterrissent" dans le bon dossier user.
 * Le projet n'existe plus dans le global après le déplacement.
 */
function moveProjectToUserDir(req, genre, nom) {
  if (!req || !req.user) return;
  const userProj = path.join(auth.userProjetsDir(req.user.id), genre, nom);
  const globalProj = path.join(GLOBAL_PROJETS, genre, nom);
  if (!fs.existsSync(globalProj)) return;
  fs.mkdirSync(path.dirname(userProj), { recursive: true });
  if (fs.existsSync(userProj)) {
    // Déjà dans user → purger le global
    fs.rmSync(globalProj, { recursive: true, force: true });
    return;
  }
  try {
    fs.cpSync(globalProj, userProj, { recursive: true });
    fs.rmSync(globalProj, { recursive: true, force: true });
    console.error(`[move] Projet ${genre}/${nom} → user ${req.user.id}`);
  } catch (err) {
    console.error(`[move] Erreur ${genre}/${nom} : ${err.message}`);
  }
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

const UNIT_FILE_PREFIX = {
  romans: 'chapitre',
  poesie: 'section',
  theatre: 'scene',
  essais: 'chapitre',
  nouvelles: 'recit',
  'textes-mobiles': 'texte',
  universitaire: 'chapitre'
};

const REVIEW_FILE_PREFIX = {
  romans: 'avis-editeur-ch',
  poesie: 'avis-editeur-section-',
  theatre: 'avis-editeur-sc',
  essais: 'avis-editeur-ch',
  nouvelles: 'avis-editeur-r',
  'textes-mobiles': 'avis-editeur-t',
  universitaire: 'avis-editeur-ch'
};

function hasAnyFile(dir, candidates) {
  return candidates.some(f => fs.existsSync(path.join(dir, f)));
}

function artifactCandidates(genre, num) {
  const unitPrefix = UNIT_FILE_PREFIX[genre] || 'section';
  const reviewPrefix = REVIEW_FILE_PREFIX[genre] || 'avis-editeur-section-';
  return {
    content: [`${unitPrefix}-${num}.md`],
    draft: [`brouillon-${num}.md`],
    review: [`${reviewPrefix}${num}.md`, `${reviewPrefix.replace(/-$/, '')}-${num}.md`],
  };
}

function detectRecoveryState(genre, nom, basePath) {
  const base = path.join(basePath || GLOBAL_PROJETS, genre, nom);
  const bible = lireFichier(path.join(base, 'bible.md')) || '';
  const unitDirName = UNIT_DIRS[genre] || 'chapitres';
  const unitDir = path.join(base, unitDirName);
  const versionsDir = path.join(base, 'versions');
  const notesDir = path.join(base, 'notes');
  const finalExists = fs.existsSync(versionsDir) && fs.readdirSync(versionsDir).some(f => /(?:^|-)final\.md$/i.test(f));
  const total = extraireTotalUnites(bible, unitDirName);
  const unitPrefix = UNIT_FILE_PREFIX[genre] || 'section';

  if (finalExists) {
    return { status: 'complete', label: 'Projet terminé', nextAction: null, expectedFiles: [], missingFiles: [] };
  }
  if (!fs.existsSync(unitDir)) {
    return {
      status: 'needs_writing',
      label: `Reprendre à : écriture ${unitPrefix} 01`,
      nextAction: 'write',
      unit: '01',
      expectedFiles: [`${unitDirName}/${unitPrefix}-01.md`, `${unitDirName}/brouillon-01.md`],
      missingFiles: [`${unitDirName}/${unitPrefix}-01.md`, `${unitDirName}/brouillon-01.md`],
    };
  }

  const files = fs.readdirSync(unitDir).filter(f => !f.startsWith('.'));
  const pattern = UNIT_PATTERNS[unitDirName] || /^section[-_\s]*(\d+)/i;
  const nums = files
    .map(f => {
      const m = f.match(pattern);
      return m ? parseInt(m[1], 10) : null;
    })
    .filter(n => Number.isInteger(n))
    .sort((a, b) => a - b);
  const maxWritten = nums.length ? Math.max(...nums) : 0;

  for (let n = 1; n <= maxWritten; n++) {
    const num = String(n).padStart(2, '0');
    const candidates = artifactCandidates(genre, num);
    const expected = [
      `${unitDirName}/${candidates.content[0]}`,
      `${unitDirName}/${candidates.draft[0]}`,
      `${unitDirName}/${candidates.review[0]}`,
    ];
    if (!hasAnyFile(unitDir, candidates.content) || !hasAnyFile(unitDir, candidates.draft)) {
      return {
        status: 'partial_failure',
        label: `Reprendre à : écriture ${unitPrefix} ${num}`,
        nextAction: 'write',
        unit: num,
        expectedFiles: expected.slice(0, 2),
        missingFiles: expected.slice(0, 2).filter(f => !fs.existsSync(path.join(base, f))),
      };
    }
    if (!hasAnyFile(unitDir, candidates.review)) {
      return {
        status: 'partial_failure',
        label: `Reprendre à : relecture ${unitPrefix} ${num}`,
        nextAction: 'review',
        unit: num,
        expectedFiles: [expected[2]],
        missingFiles: [expected[2]],
      };
    }
  }

  if (total && maxWritten < total) {
    const next = String(maxWritten + 1).padStart(2, '0');
    return {
      status: 'needs_writing',
      label: `Reprendre à : écriture ${unitPrefix} ${next}`,
      nextAction: 'write',
      unit: next,
      expectedFiles: [`${unitDirName}/${unitPrefix}-${next}.md`, `${unitDirName}/brouillon-${next}.md`],
      missingFiles: [`${unitDirName}/${unitPrefix}-${next}.md`, `${unitDirName}/brouillon-${next}.md`],
    };
  }

  const observations = lireFichier(path.join(notesDir, 'observations.md')) || '';
  return {
    status: 'ready_to_finalize',
    label: observations ? 'Toutes les unités semblent écrites et relues' : 'Reprendre à : scribe / finalisation',
    nextAction: observations ? 'finalize' : 'scribe',
    unit: maxWritten ? String(maxWritten).padStart(2, '0') : null,
    expectedFiles: observations ? [] : ['notes/observations.md'],
    missingFiles: observations ? [] : ['notes/observations.md'],
  };
}

/**
 * Détermine le nombre d'unités cible d'un projet, de façon tolérante au format
 * de la bible (les agents ne produisent pas tous la ligne canonique). Essais
 * successifs, du plus fiable au plus permissif.
 */
function extraireTotalUnites(bible, unitDir) {
  // 1. Format canonique : « Nombre de sections (cible) : 5 »
  let m = bible.match(/Nombre\s+(?:total\s+)?(?:de\s+)?\w+\s*\(cible\)\s*:\s*(\d+)/i);
  if (m) return parseInt(m[1]);

  // 2. Tournure libre : « Recueil de 5 poèmes », « 12 chapitres », « 3 textes »…
  m = bible.match(/(\d+)\s+(?:poèmes?|poemes?|sections?|chapitres?|textes?|nouvelles?|actes?|scènes?|scenes?|essais?)/i);
  if (m) return parseInt(m[1]);

  // 3. Dernier recours : plus grand numéro d'unité planifié dans la bible
  //    (ex. « Section 05 » → 5). Le mot-unité dérive du dossier du genre.
  const unitWord = { sections: 'section', chapitres: 'chapitre', textes: 'texte' }[unitDir] || 'section';
  const re = new RegExp(`${unitWord}[-_\\s]*0*(\\d+)`, 'gi');
  let max = 0, mm;
  while ((mm = re.exec(bible)) !== null) max = Math.max(max, parseInt(mm[1]));
  return max;
}

/**
 * Calcule la progression complète d'un projet à partir de sa bible et de ses fichiers
 */
function calculerProgression(genre, nom, basePath) {
  const base = path.join(basePath || GLOBAL_PROJETS, genre, nom);
  const bible = lireFichier(path.join(base, 'bible.md'));
  if (!bible) return null;

  const unitDir = UNIT_DIRS[genre] || 'chapitres';
  const unitPattern = UNIT_PATTERNS[unitDir];

  // 1. Extraire le nombre total d'unités depuis la bible (tolérant au format)
  const total = extraireTotalUnites(bible, unitDir);

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

app.use(express.json({ limit: '1mb' })); // S9 : borne la taille du body (anti-DoS)
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes d'auth et fichiers (montées AVANT le gate : login/register publics)
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// ─── Sécurité (S6) : validation des paramètres de route genre/nom ───────────
// Empêche le path traversal via les segments d'URL (ex. nom = "..").
app.param('genre', (req, res, next, val) => {
  if (!GENRES.some(g => g.slug === val)) {
    return res.status(400).json({ error: 'Genre invalide.' });
  }
  next();
});
app.param('nom', (req, res, next, val) => {
  if (typeof val !== 'string' || !val || /[\/\\]|\.\./.test(val)) {
    return res.status(400).json({ error: 'Nom de projet invalide.' });
  }
  next();
});

// ─── Sécurité (S6/S3) : authentification REQUISE sur tout /api ──────────────
// (sauf /api/auth et /api/files, montés avant ce middleware). Avant, l'auth
// était optionnelle → toutes les lectures (projets, knowledge…) étaient
// publiques. Le front envoie toujours le Bearer token, donc le local n'est
// pas impacté.
app.use('/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const session = auth.findSession(token);
    if (session) {
      req.user = auth.findUserById(session.userId);
      req.userToken = token;
      return next();
    }
  }
  return res.status(401).json({ error: 'Authentification requise' });
});

// --- Liste des genres + projets (avec progression) ---
app.get('/api/projets', (req, res) => {
  // Synchroniser tous les projets du global vers l'utilisateur
  syncAllGlobalToUser(req);
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
  ensureUserProject(req, genre, nom);
  const projetsBase = userProjets(req);
  if (!projetExists(genre, nom, projetsBase)) return res.status(404).json({ error: 'Projet introuvable' });
  const struct = structureProjet(genre, nom, projetsBase);
  const bible = lireFichier(path.join(projetsBase, genre, nom, 'bible.md'));
  const bd = lireFichier(path.join(projetsBase, genre, nom, 'bd-connaissances.md'));
  const progression = calculerProgression(genre, nom, projetsBase);
  const recovery = detectRecoveryState(genre, nom, projetsBase);
  res.json({ nom, genre, bible, bdConnaissances: bd, structure: struct, progression, recovery });
});

// --- Lecture d'un fichier quelconque ---
app.get('/api/projets/:genre/:nom/fichier', (req, res) => {
  const { genre, nom } = req.params;
  ensureUserProject(req, genre, nom);
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

// --- Upload d'un fichier dans knowledge/notes/ ---
// Multipart: file + sous-dossier (style|scenes|idees|univers|personnages|formes)
const multer = require('multer');
const knowledgeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = req.body.subdir || '';
    const allowed = ['style', 'scenes', 'idees', 'univers', 'personnages', 'formes', ''];
    const safe = allowed.includes(subdir) ? subdir : '';
    const dest = path.join(KNOWLEDGE, 'notes', safe);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80);
    cb(null, `${base}${ext}`);
  }
});
const knowledgeUpload = multer({
  storage: knowledgeStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.md', '.txt', '.json', '.yaml', '.yml'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`Format non supporté : ${ext}. Formats acceptés : ${allowed.join(', ')}`));
  }
});
app.post('/api/knowledge/upload', auth.authMiddleware, (req, res) => {
  knowledgeUpload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni.' });

    // Traitement : envelopper le fichier texte avec un en-tête
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (['.md', '.txt'].includes(ext)) {
      try {
        const subdir = req.body.subdir || '';
        const label = subdir ? `notes/${subdir}/` : 'knowledge/';
        const header = `---
type: note-utilisateur
categorie: ${subdir || 'racine'}
importe_le: ${new Date().toISOString()}
---

*Note importée le ${new Date().toLocaleDateString('fr-FR')} dans ${label}*\n\n`;
        const content = fs.readFileSync(req.file.path, 'utf-8');
        // Éviter le double-enrobage si le fichier a déjà un frontmatter
        if (!content.startsWith('---')) {
          fs.writeFileSync(req.file.path, header + content, 'utf-8');
        }
      } catch (e) {
        console.error(`[knowledge] Erreur traitement ${req.file.filename}: ${e.message}`);
      }
    }

    res.json({ success: true, file: { name: req.file.filename, path: req.file.path, size: req.file.size } });
  });
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
  syncAllGlobalToUser(req);
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
  ensureUserProject(req, genre, nom);
  const projetsBase = userProjets(req);
  if (!projetExists(genre, nom, projetsBase)) return res.status(404).json({ error: 'Projet introuvable' });
  const prog = calculerProgression(genre, nom, projetsBase);
  if (!prog) return res.status(404).json({ error: 'Impossible de calculer la progression' });
  res.json(prog);
});

// --- Diagnostic de reprise : artefacts attendus/manquants ---
app.get('/api/projets/:genre/:nom/recovery', (req, res) => {
  const { genre, nom } = req.params;
  ensureUserProject(req, genre, nom);
  const projetsBase = userProjets(req);
  if (!projetExists(genre, nom, projetsBase)) return res.status(404).json({ error: 'Projet introuvable' });
  res.json(detectRecoveryState(genre, nom, projetsBase));
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

const { runCommand, continueSession, hasSession, ownsSession, buildMessage, GENRE_AGENTS, SKILLS_BY_GENRE, listLogs, getLog } = require('./opencode-bridge');

// ─── Helper commun : streamer un emitter (runCommand/continueSession) en SSE ──
function streamSSE(req, res, result, meta = {}) {
  const { emitter, abort, sessionId } = result;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  if (res.socket) res.socket.setNoDelay(true);
  res.flushHeaders();

  let closed = false;
  let completed = false;
  let heartbeat = null;
  function writeData(json) {
    if (closed) return;
    res.write(`data: ${json}\n\n`);
    if (typeof res.flush === 'function') res.flush();
    else if (res.socket && res.socket.writable) res.socket.write('');
  }
  function writeEvent(eventName, payload) {
    if (closed) return;
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    if (typeof res.flush === 'function') res.flush();
    else if (res.socket && res.socket.writable) res.socket.write('');
  }
  const safeEnd = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
    try { res.end(); } catch {}
  };

  emitter.on('event', (event) => {
    if (closed) return;
    const raw = JSON.stringify(event);
    if (raw.length < 30000) writeData(raw);
  });
  emitter.on('stderr', (text) => {
    if (closed) return;
    for (const line of text.split('\n').filter(l => l.trim())) {
      writeData(JSON.stringify({ type: 'stderr', text: line.slice(0, 500) }));
    }
  });
  emitter.on('error', (err) => {
    if (closed) return;
    completed = true;
    const isIdleTimeout = /Aucune activit[ée]/i.test(err.message || '');
    const status = isIdleTimeout ? 'timeout_idle' : 'done_error';
    writeEvent(status, { type: status, message: err.message, success: false, exitCode: -1, status });
    writeEvent('error', { type: 'error', message: err.message, status });
    writeEvent('done_error', { type: 'done_error', success: false, exitCode: -1, status });
    safeEnd();
  });
  emitter.on('close', (code) => {
    if (closed) return;
    completed = true;
    const status = code === 0 ? 'done_success' : 'done_error';
    writeEvent(status, { type: status, success: code === 0, exitCode: code, status });
    if (code !== 0) {
      writeEvent('error', { type: 'error', message: `Processus terminé avec le code ${code}` });
    }
    safeEnd();
  });

  // Meta APRÈS avoir attaché les listeners (évite la race condition).
  writeEvent('meta', { type: 'meta', ...meta, sessionId });

  // Déconnexion client : écouter 'close' sur res (la réponse), PAS sur req.
  // req (body POST consommé par express.json) émet 'close' immédiatement sous
  // Node 18+, ce qui couperait le SSE et tuerait opencode juste après le meta.
  res.on('close', () => {
    try { emitter.removeAllListeners(); } catch {}
    safeEnd();
    if (!completed) abort();
  });

  // Heartbeat : commentaire SSE (`:`) ignoré par le parseur client, mais qui
  // garde le socket actif (anti-fermeture proxy / inactivité) pendant qu'opencode
  // « réfléchit » entre deux sections.
  heartbeat = setInterval(() => {
    if (closed) return;
    try { res.write(': keepalive\n\n'); if (typeof res.flush === 'function') res.flush(); } catch {}
  }, 20000);

  // Plus de plafond global de 10 min sur la requête : la durée de vie est gérée
  // par le watchdog d'INACTIVITÉ du bridge (réarmé à chaque event). 0 = désactivé.
  req.setTimeout(0);
}

// Metadata pour le frontend
app.get('/api/opencode/meta', (req, res) => {
  res.json({
    agents: Object.entries(GENRE_AGENTS).map(([slug, v]) => ({ slug, ...v })),
    skillsParGenre: SKILLS_BY_GENRE,
  });
});

// Répondre à une question du pré-flight — reprend la session opencode (SSE)
app.post('/api/opencode/input', auth.authMiddleware, (req, res) => {
  const { sessionId, text } = req.body;
  if (!sessionId || !text) {
    return res.status(400).json({ error: 'Les champs sessionId et text sont requis.' });
  }
  // S16 : 404 si la session est inconnue OU n'appartient pas à l'appelant
  // (même réponse dans les deux cas : ne pas révéler l'existence d'une session tierce).
  if (!hasSession(sessionId) || !ownsSession(sessionId, req.user.id)) {
    return res.status(404).json({ error: 'Session introuvable ou expirée.' });
  }

  let result;
  try {
    result = continueSession(sessionId, text);
  } catch (err) {
    return res.status(500).json({ error: `Erreur à la reprise : ${err.message}` });
  }
  if (!result) {
    return res.status(404).json({ error: 'Session introuvable ou expirée.' });
  }

  streamSSE(req, res, result, { kind: 'continue' });
});

// Lancer une commande OpenCode — réponse en SSE
app.post('/api/opencode/run', auth.authMiddleware, (req, res) => {
  const { genre, titre, synopsis, contraintes, personnages, skills, nbUnites, registre, filRouge } = req.body;

  if (!genre || !titre) {
    return res.status(400).json({ error: 'Les champs genre et titre sont requis.' });
  }

  const mapping = GENRE_AGENTS[genre];
  if (!mapping) {
    return res.status(400).json({ error: `Genre "${genre}" inconnu.` });
  }

  const message = buildMessage(genre, { titre, synopsis, contraintes, personnages, skills, nbUnites, registre, filRouge });

  // Lancer depuis ROOT pour que les agents .opencode/agent/ soient trouvés.
  let result;
  try {
    result = runCommand(mapping.agent, message, {
      command: mapping.command,
      userId: req.user.id,
      projectId: `${genre}/${titre}`,
    });
  } catch (err) {
    return res.status(500).json({ error: `Erreur au lancement : ${err.message}` });
  }

  // Rattacher le déplacement user AVANT streamSSE pour garantir l'ordre des listeners
  result.emitter.on('close', (code) => {
    if (code === 0 && genre && titre) {
      moveProjectToUserDir(req, genre, titre);
    }
  });

  streamSSE(req, res, result, { agent: mapping.agent, command: mapping.command, titre, genre });
});

// ---------------------------------------------------------------------------
// Logs des sessions OpenCode
// ---------------------------------------------------------------------------

app.get('/api/logs', auth.authMiddleware, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(listLogs(limit));
});

app.get('/api/logs/:slug', auth.authMiddleware, (req, res) => {
  const log = getLog(req.params.slug);
  if (!log) return res.status(404).json({ error: 'Log introuvable' });
  res.json(log);
});

// ─── Continuer un projet bloqué ──────────────────────────────────────────────
// POST /api/projets/:genre/:nom/continue
// Body: { registre, filRouge } — réponses pré-flight optionnelles
app.post('/api/projets/:genre/:nom/continue', auth.authMiddleware, (req, res) => {
  const { genre, nom } = req.params;

  // Avant de lancer l'agent (qui écrit dans global), on s'assure que le projet
  // est dans le global. Si l'utilisateur l'a dans son user dir mais pas dans le
  // global (déplacé après création), on le re-synchronise vers le global.
  if (req.user) {
    const globalProj = path.join(GLOBAL_PROJETS, genre, nom);
    const userProj = path.join(auth.userProjetsDir(req.user.id), genre, nom);
    if (!fs.existsSync(globalProj) && fs.existsSync(userProj)) {
      console.error(`[sync] Re-copie user → global pour reprise : ${genre}/${nom}`);
      fs.mkdirSync(path.dirname(globalProj), { recursive: true });
      try { fs.cpSync(userProj, globalProj, { recursive: true }); } catch (err) {
        console.error(`[sync] Erreur re-copie ${genre}/${nom} : ${err.message}`);
      }
    }
  }

  const projetsBase = userProjets(req);
  if (!projetExists(genre, nom, projetsBase)) {
    return res.status(404).json({ error: 'Projet introuvable.' });
  }
  const { registre, filRouge, action, unit } = req.body;
  const recovery = detectRecoveryState(genre, nom, projetsBase);

  // Construire le message de continuation
  const bible = lireFichier(path.join(projetsBase, genre, nom, 'bible.md')) || '';
  const concept = bible.split('\n').slice(0, 10).join('\n').substring(0, 500);

  let message = `Continue le projet "${nom}" (${genre}).\n\nProjet actuel :\n${concept}\n\n`;
  if (registre) message += `Registre : ${registre}\n`;
  if (filRouge) message += `Fil rouge : ${filRouge}\n`;
  if (action || recovery.nextAction) {
    const targetAction = action || recovery.nextAction;
    const targetUnit = unit || recovery.unit || '';
    message += `Reprise ciblée : ${targetAction}${targetUnit ? ` unité ${targetUnit}` : ''}.\n`;
    if (recovery.missingFiles && recovery.missingFiles.length) {
      message += `Fichiers manquants détectés : ${recovery.missingFiles.join(', ')}.\n`;
    }
    if (recovery.expectedFiles && recovery.expectedFiles.length) {
      message += `Artefacts attendus à produire/vérifier : ${recovery.expectedFiles.join(', ')}.\n`;
    }
  }
  message += `\nReprends le travail là où le projet s'est arrêté. Vérifie la bible et les fichiers existants, puis continue uniquement l'étape nécessaire avant de passer à la suivante.`;

  // Lancer OpenCode
  const mapping = GENRE_AGENTS[genre];
  if (!mapping) return res.status(400).json({ error: `Genre "${genre}" inconnu.` });

  let result;
  try {
    result = runCommand(mapping.agent, message, {
      userId: req.user.id,
      expectedFiles: recovery.expectedFiles || [],
      projectId: `${genre}/${nom}`,
    });
  } catch (err) {
    return res.status(500).json({ error: `Erreur au lancement : ${err.message}` });
  }

  // Rattacher le déplacement user après session réussie
  result.emitter.on('close', (code) => {
    if (code === 0 && genre && nom) {
      moveProjectToUserDir(req, genre, nom);
    }
  });

  // Streamé en SSE (comme /run) pour afficher la reprise en direct dans l'UI.
  streamSSE(req, res, result, { kind: 'continue', agent: mapping.agent, genre, titre: nom });
});

// ─── Finaliser un projet ─────────────────────────────────────────────────────
// POST /api/projets/:genre/:nom/finalize
// Exécute la boucle complète : REX → compilation → PDF → archivage
app.post('/api/projets/:genre/:nom/finalize', auth.authMiddleware, async (req, res) => {
  const { genre, nom } = req.params;
  ensureUserProject(req, genre, nom);
  const projetsBase = userProjets(req);
  if (!projetExists(genre, nom, projetsBase)) {
    return res.status(404).json({ error: 'Projet introuvable.' });
  }

  const base = path.join(projetsBase, genre, nom);
  const textesDir = path.join(base, UNIT_DIRS[genre] || 'textes');
  const versionsDir = path.join(base, 'versions');
  const notesDir = path.join(base, 'notes');
  const results = [];

  // ── 1. REX : compiler les observations en rex.md ───────────────────────────
  const observations = lireFichier(path.join(notesDir, 'observations.md'));
  const propositions = lireFichier(path.join(notesDir, 'propositions-skills.md'));
  const rexTemplate = lireFichier(path.join(KNOWLEDGE, 'rex-template.md')) ||
    '# REX — {{projet}}\n\nDate : {{date}}\n\n## Observations\n{{observations}}\n\n## Propositions skills\n{{propositions}}';

  if (observations || propositions) {
    fs.mkdirSync(notesDir, { recursive: true });
    const rexPath = path.join(notesDir, 'rex.md');
    const rexContent = rexTemplate
      .replace(/\{\{projet\}\}/g, nom)
      .replace(/\{\{genre\}\}/g, genre)
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('fr-FR'))
      .replace(/\{\{observations\}\}/g, observations || '*Aucune observation*')
      .replace(/\{\{propositions\}\}/g, propositions || '*Aucune proposition*');
    fs.writeFileSync(rexPath, rexContent, 'utf-8');
    results.push({ step: 'rex', file: 'notes/rex.md', status: 'ok' });
  } else {
    results.push({ step: 'rex', status: 'ignore', reason: 'Aucune observation à compiler' });
  }

  // ── 2. Compiler tous les textes en un seul fichier ─────────────────────────
  let fichiersTextes = [];
  if (fs.existsSync(textesDir)) {
    fichiersTextes = fs.readdirSync(textesDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('brouillon-') && !f.startsWith('avis-') && !f.startsWith('_'));

    if (fichiersTextes.length > 0) {
      fs.mkdirSync(versionsDir, { recursive: true });
      const compilationPath = path.join(versionsDir, `${nom}-complet.md`);
      const genreLabel = (GENRES.find(g => g.slug === genre) || {}).label || genre;
      let compilation = `# ${nom}\n\n*${genreLabel} — Compilation finale — ${new Date().toLocaleDateString('fr-FR')}*\n\n---\n\n`;

      fichiersTextes.sort().forEach(f => {
        const content = lireFichier(path.join(textesDir, f));
        if (content) {
          compilation += `## ${f.replace('.md', '')}\n\n`;
          compilation += content;
          compilation += '\n\n---\n\n';
        }
      });

      fs.writeFileSync(compilationPath, compilation, 'utf-8');
      results.push({ step: 'compilation', file: `${nom}-complet.md`, status: 'ok' });
    }
  }

  // ── 3. Générer une archive des fichiers source ────────────────────────────
  const archivePath = path.join(versionsDir, `${nom}-sources.md`);
  let archive = `# ${nom} — Archive des sources\n\n*Généré le ${new Date().toLocaleDateString('fr-FR')}*\n\n`;
  archive += `- Genre : ${genre}\n`;
  archive += `- Textes : ${fichiersTextes.length}\n`;
  archive += `- Dossier : ${base}\n\n---\n\n`;

  // Lire et inclure la bible
  const bible = lireFichier(path.join(base, 'bible.md'));
  if (bible) archive += `## Bible\n\n${bible}\n\n---\n\n`;

  // Lire et inclure les notes
  if (observations) archive += `## Observations du scribe\n\n${observations}\n\n---\n\n`;
  if (propositions) archive += `## Propositions d'amendement des skills\n\n${propositions}\n\n`;

  fs.writeFileSync(archivePath, archive, 'utf-8');
  results.push({ step: 'archive', file: `${nom}-sources.md`, status: 'ok' });

  // ── 4. Essayer de générer un PDF ──────────────────────────────────────────
  // Sécurité (S2) : execFileSync avec un tableau d'arguments — PAS de shell,
  // donc le nom de projet (`nom`, segment d'URL) ne peut pas injecter de
  // commande même s'il contient " ; $() ` & etc.
  const { execFileSync, spawnSync } = require('child_process');
  const localPandoc = path.join(process.env.LOCALAPPDATA || '', 'Pandoc', 'pandoc.exe');
  let pandocBin = null;
  if (fs.existsSync(localPandoc)) pandocBin = localPandoc;
  else if (spawnSync('where', ['pandoc']).status === 0) pandocBin = 'pandoc';

  if (pandocBin) {
    const pdfPath = path.join(versionsDir, `${nom}.pdf`);
    const mdPath = path.join(versionsDir, `${nom}-complet.md`);
    if (fs.existsSync(mdPath)) {
      try {
        execFileSync(pandocBin, [mdPath, '-o', pdfPath, '--pdf-engine=pdfhtml'], { timeout: 30000 });
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

  // ── 5. Bilan ──────────────────────────────────────────────────────────────
  let ecrits = 0, valides = 0;
  if (fs.existsSync(textesDir)) {
    const allFiles = fs.readdirSync(textesDir);
    ecrits = allFiles.filter(f => f.endsWith('.md') && !f.startsWith('brouillon-') && !f.startsWith('avis-') && !f.startsWith('_')).length;
    valides = allFiles.filter(f => f.startsWith('avis-editeur-')).length;
  }

  const notesCount = observations ? observations.split('\n').filter(l => l.trim()).length : 0;
  results.push({
    step: 'bilan',
    ecrits,
    valides,
    notesCount,
    status: 'ok',
    message: `${ecrits} textes, ${valides} validés, ${notesCount} observations scribe`
  });

  res.json({ success: true, results });
});

// ─── Consignes post-écriture ─────────────────────────────────────────────────
// POST /api/projets/:genre/:nom/post-ecriture
// Body: { feedback, type } — type = "relecture" | "amelioration-skills" | "note"
// Sauvegarde le feedback dans notes/propositions-skills.md et/ou notes/observations.md
app.post('/api/projets/:genre/:nom/post-ecriture', auth.authMiddleware, (req, res) => {
  const { genre, nom } = req.params;
  ensureUserProject(req, genre, nom);
  const projetsBase = userProjets(req);
  if (!projetExists(genre, nom, projetsBase)) {
    return res.status(404).json({ error: 'Projet introuvable.' });
  }
  const { feedback, type = 'note' } = req.body;
  if (!feedback || !feedback.trim()) {
    return res.status(400).json({ error: 'Le feedback est requis.' });
  }

  const notesDir = path.join(projetsBase, genre, nom, 'notes');
  fs.mkdirSync(notesDir, { recursive: true });

  const now = new Date().toISOString();
  const header = `\n---\n## Consigne post-écriture (${type})\n*Date : ${now}*\n\n`;

  if (type === 'amelioration-skills') {
    // Écrire dans propositions-skills.md (pour agent-style)
    const propsPath = path.join(notesDir, 'propositions-skills.md');
    let existing = lireFichier(propsPath) || '';
    existing += `${header}${feedback.trim()}\n`;
    fs.writeFileSync(propsPath, existing, 'utf-8');
    res.json({ success: true, savedTo: 'propositions-skills.md', type });
  } else {
    // Écrire dans observations.md (scribe)
    const obsPath = path.join(notesDir, 'observations.md');
    let existing = lireFichier(obsPath) || '';
    existing += `${header}${feedback.trim()}\n`;
    fs.writeFileSync(obsPath, existing, 'utf-8');
    res.json({ success: true, savedTo: 'observations.md', type });
  }
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
