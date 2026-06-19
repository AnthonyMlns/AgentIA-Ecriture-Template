// ─── OpenCode Bridge ────────────────────────────────────────────────────────
// Spawns `opencode run --format json --agent X` and streams parsed events.
// ----------------------------------------------------------------------------

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const EventEmitter = require('events');

const ROOT = path.resolve(__dirname, '..');
const LOGS_DIR = path.join(__dirname, 'logs');

// S'assurer que le dossier logs existe
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Sessions actives — permet l'envoi d'input utilisateur au processus
const sessions = new Map();

// ---------------------------------------------------------------------------
// Trouver le binaire opencode.exe
// ---------------------------------------------------------------------------

function findOpencodeBinary() {
  // Chemin connu de l'installation npm
  const npmPath = path.join(process.env.APPDATA, 'npm', 'node_modules', 'opencode-ai', 'bin', 'opencode.exe');
  if (fs.existsSync(npmPath)) return npmPath;

  // Chercher dans PATH
  const pathDirs = (process.env.PATH || '').split(path.delimiter);
  for (const dir of pathDirs) {
    try {
      const testPath = path.join(dir, 'opencode.exe');
      if (fs.existsSync(testPath)) return testPath;
    } catch {}
  }

  // Fallback : laisser Node.js résoudre via shell
  return 'opencode';
}

const OPENCODE_BIN = findOpencodeBinary();
console.error(`[opencode-bridge] Binaire : ${OPENCODE_BIN}`);

// ---------------------------------------------------------------------------
// Mapping genre → orchestrateur + commande (sans slash pour --command)
// ---------------------------------------------------------------------------

const GENRE_AGENTS = {
  romans:          { agent: 'orchestrateur-roman',   command: 'nouveau-roman' },
  poesie:          { agent: 'orchestrateur-poesie',  command: 'nouveau-recueil' },
  theatre:         { agent: 'orchestrateur-theatre', command: 'nouveau-theatre' },
  essais:          { agent: 'orchestrateur-essai',   command: 'nouveau-essai' },
  nouvelles:       { agent: 'orchestrateur-nouvelle', command: 'nouveau-nouvelle' },
  'textes-mobiles': { agent: 'orchestrateur-texte-mobile', command: 'nouveau-texte-mobile' },
  universitaire:   { agent: 'orchestrateur-universitaire', command: 'nouveau-universitaire' },
};

const SKILLS_BY_GENRE = {
  romans:          ['ecriture-romanesque', 'roman-espionnage', 'roman-romance', 'roman-litteraire'],
  poesie:          ['poesie-contemporaine', 'poesie-prose', 'poesie-symbolique', 'poesie-classique', 'poesie-lyrique', 'poesie-engagee', 'poesie-madrigal-contemporain'],
  theatre:         ['ecriture-theatrale'],
  essais:          ['ecriture-essai-litteraire'],
  nouvelles:       ['nouvelle-litteraire'],
  'textes-mobiles': ['flash-fiction', 'micro-nouvelle', 'vignette-prose', 'ecriture-carnet-journal', 'ecriture-hybride'],
  universitaire:   ['ecriture-universitaire'],
};

// ---------------------------------------------------------------------------
// Construire le message selon le genre
// Le flag --command applique le template opencode.json (ex: "Je veux écrire
// un nouveau roman : {{input}}"). buildMessage produit donc le {{input}}.
// ---------------------------------------------------------------------------

function buildMessage(genre, { titre, synopsis, contraintes, personnages, skills, nbUnites, registre, filRouge }) {
  const lines = [
    `Titre : "${titre}"`,
    '',
  ];

  if (synopsis && synopsis.trim()) {
    lines.push('Synopsis :');
    lines.push(synopsis.trim());
    lines.push('');
  }

  if (contraintes && contraintes.trim()) {
    lines.push('Contraintes :');
    for (const c of contraintes.split('\n').filter(l => l.trim())) {
      lines.push(`- ${c.trim()}`);
    }
    lines.push('');
  }

  if (personnages && personnages.trim()) {
    lines.push('Personnages principaux :');
    for (const p of personnages.split('\n').filter(l => l.trim())) {
      lines.push(`- ${p.trim()}`);
    }
    lines.push('');
  }

  if (skills && skills.length > 0) {
    lines.push(`Skills actifs : ${skills.join(', ')}`);
    lines.push('');
  }

  if (registre && registre.trim()) {
    lines.push(`Registre d'écriture : ${registre.trim()}`);
    lines.push('');
  }

  if (filRouge && filRouge.trim()) {
    lines.push(`Fil rouge : ${filRouge.trim()}`);
    lines.push('');
  }

  if (nbUnites && parseInt(nbUnites) > 0) {
    lines.push(`Nombre d'unités cible : ${nbUnites}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Lancer opencode run en mode non-interactif
// ---------------------------------------------------------------------------

/**
 * @param {string} agent  — nom de l'agent (ex: "orchestrateur-roman")
 * @param {string} message — message complet à envoyer
 * @param {object} [opts]
 * @param {number} [opts.timeout=600000]  — timeout ms (défaut 10 min)
 * @returns {{ emitter: EventEmitter, abort: Function }}
 *
 * L'emitter émet :
 *   'event'  → (parsed JSON event from OpenCode)
 *   'stderr' → (string) stderr line
 *   'error'  → (Error)
 *   'close'  → (exitCode)
 */
function runCommand(agent, message, opts = {}) {
  const timeout = opts.timeout || 600000;
  const commandName = opts.command || null;
  const cwd = opts.cwd || ROOT;
  const emitter = new EventEmitter();

  // --- Session log ---
  const sessionId = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sessionLog = {
    id: sessionId,
    timestamp: new Date().toISOString(),
    agent,
    command: commandName,
    message: message.slice(0, 500),
    status: 'running',
    duration: 0,
    events: [],
    exitCode: null,
    error: null,
  };
  const startTime = Date.now();

  function saveLog() {
    sessionLog.duration = Date.now() - startTime;
    const slug = `${new Date().toISOString().slice(0, 10)}-${sessionId.slice(-8)}`;
    const filePath = path.join(LOGS_DIR, `${slug}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(sessionLog, null, 2), 'utf-8');
    } catch {}
  }

  // --- Construire les arguments ---
  // On utilise --command pour que le template opencode.json soit appliqué.
  // Le template ajoute le préfixe naturel (ex: "Je veux écrire un nouveau
  // roman : {{input}}") — buildMessage produit donc le {{input}}.
  // Le --command est nécessaire pour que le parsing Windows fonctionne
  // avec les messages multi-lignes (guillemets + \n).
  const args = ['run', '--format', 'json', '--agent', agent];
  if (commandName) {
    args.push('--command', commandName);
  }
  args.push(message);

  const proc = spawn(OPENCODE_BIN, args, {
    cwd: cwd,
    shell: false,
    env: { ...process.env, OPENCODE_CLI_QUIET: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Enregistrer la session pour permettre l'envoi d'input utilisateur
  sessions.set(sessionId, { proc, emitter, startTime: Date.now() });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    try { proc.kill('SIGTERM'); } catch {}
    const err = new Error(`Timeout dépassé (${timeout / 1000}s)`);
    sessionLog.status = 'timeout';
    sessionLog.error = err.message;
    saveLog();
    emitter.emit('error', err);
  }, timeout);

  // Parse stdout — chaque ligne est un event JSON
  let buffer = '';
  proc.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const event = JSON.parse(trimmed);
        sessionLog.events.push(event);
        emitter.emit('event', event);
      } catch {
        if (trimmed.length > 2) emitter.emit('stderr', trimmed);
      }
    }
  });

  // stderr → on le forwarde (contient parfois des infos utiles)
  let stderrBuffer = '';
  proc.stderr.on('data', (chunk) => {
    stderrBuffer += chunk.toString();
    emitter.emit('stderr', chunk.toString());
  });

  proc.on('error', (err) => {
    clearTimeout(timer);
    sessionLog.status = 'error';
    sessionLog.error = `${err.message}. Stderr: ${stderrBuffer.slice(0, 300)}`;
    saveLog();
    emitter.emit('error', err);
  });

  proc.on('close', (code) => {
    clearTimeout(timer);
    sessions.delete(sessionId);
    sessionLog.exitCode = code;
    if (!timedOut) {
      if (code === 0) {
        sessionLog.status = 'success';
      } else {
        sessionLog.status = 'error';
        sessionLog.error = `Code ${code}. Stderr: ${stderrBuffer.slice(0, 300)}`;
      }
      saveLog();
      emitter.emit('close', code);
    }
  });

  const abort = () => {
    clearTimeout(timer);
    sessionLog.status = 'cancelled';
    sessionLog.error = 'Annulé par l\'utilisateur';
    saveLog();
    try { proc.kill('SIGTERM'); } catch {}
    setTimeout(() => {
      try { proc.kill('SIGKILL'); } catch {}
    }, 5000);
  };

  return { emitter, abort, proc, sessionId };
}

// ---------------------------------------------------------------------------
// Consultation des logs
// ---------------------------------------------------------------------------

function listLogs(limit = 50) {
  if (!fs.existsSync(LOGS_DIR)) return [];
  const files = fs.readdirSync(LOGS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, limit);

  return files.map(f => {
    const fp = path.join(LOGS_DIR, f);
    try {
      const raw = fs.readFileSync(fp, 'utf-8');
      const data = JSON.parse(raw);
      return {
        id: data.id,
        slug: f.replace('.json', ''),
        timestamp: data.timestamp,
        agent: data.agent,
        status: data.status,
        duration: data.duration,
        exitCode: data.exitCode,
        message: data.message ? data.message.slice(0, 120) : '',
        eventCount: (data.events || []).length,
        error: data.error,
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function getLog(slug) {
  const fp = path.join(LOGS_DIR, `${slug}.json`);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch {
    return null;
  }
}

// ─── Envoi d'input utilisateur à une session active ────────────────────────

/**
 * Envoie du texte sur stdin d'un processus OpenCode actif
 * @param {string} sessionId — l'ID de session retourné par runCommand
 * @param {string} text — le texte à envoyer (terminé par un retour à la ligne)
 * @returns {boolean} true si envoyé, false si session introuvable
 */
function sendInput(sessionId, text) {
  const session = sessions.get(sessionId);
  if (!session) return false;
  try {
    session.proc.stdin.write(text + '\n');
    return true;
  } catch {
    return false;
  }
}

module.exports = { runCommand, buildMessage, sendInput, sessions, GENRE_AGENTS, SKILLS_BY_GENRE, listLogs, getLog, _binPath: OPENCODE_BIN };
