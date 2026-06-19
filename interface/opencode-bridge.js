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

// Sessions actives (processus en cours) — usage interne.
const sessions = new Map();

// Mapping bridgeSessionId → vrai sessionID opencode. Persiste APRÈS la fin du
// process : c'est ce qui permet de reprendre la session (répondre à une
// question du pré-flight) via `opencode run --session <id>`.
const opencodeSessions = new Map();

// S16 : propriété des sessions. bridgeSessionId → userId. Permet de refuser la
// reprise (/api/opencode/input) d'une session qui n'appartient pas à l'appelant
// (sinon n'importe quel utilisateur authentifié pourrait injecter un message
// et lire le flux d'un autre). Renseigné au lancement (/run) via opts.userId.
const sessionOwners = new Map();

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
// Construire le message (une seule ligne !)
// Le flag --command applique le template opencode.json (ex: "Je veux écrire
// un nouveau roman : {{input}}"). Le message est le {{input}}.
//
// IMPORTANT : le message tient sur UNE SEULE LIGNE car spawn avec shell:false
// sur Windows ne supporte pas les retours à la ligne dans les arguments
// (exitCode null, crash ~42ms). Les sections sont séparées par " | ".
// ---------------------------------------------------------------------------

function buildMessage(genre, { titre, synopsis, contraintes, personnages, skills, nbUnites, registre, filRouge }) {
  const parts = [];

  // Titre (sans guillemets — cmd.exe ne gère pas les "" dans les arguments)
  let header = `Titre : ${titre}`;
  if (synopsis && synopsis.trim()) {
    header += ` — Synopsis : ${synopsis.trim().replace(/\n/g, ' ')}`;
  }
  parts.push(header);

  if (skills && skills.length > 0) {
    parts.push(`Skills actifs : ${skills.join(', ')}`);
  }

  if (registre && registre.trim()) {
    parts.push(`Registre : ${registre.trim()}`);
  }

  if (filRouge && filRouge.trim()) {
    parts.push(`Fil rouge : ${filRouge.trim()}`);
  }

  if (nbUnites && parseInt(nbUnites) > 0) {
    parts.push(`Unités : ${nbUnites}`);
  }

  if (contraintes && contraintes.trim()) {
    const cList = contraintes.split('\n').filter(l => l.trim()).map(l => l.trim()).join(' ; ');
    parts.push(`Contraintes : ${cList}`);
  }

  if (personnages && personnages.trim()) {
    const pList = personnages.split('\n').filter(l => l.trim()).map(l => l.trim()).join(' ; ');
    parts.push(`Personnages : ${pList}`);
  }

  // Attention : ne pas utiliser | comme séparateur — cmd.exe interprète
  // le pipe même entre guillemets, ce qui casse la ligne de commande.
  return parts.join(' — ');
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
  // Fenêtre d'INACTIVITÉ avant interruption (réarmée à chaque event opencode),
  // et NON un plafond global : un recueil multi-sections peut durer longtemps
  // tant qu'il progresse — on ne coupe que sur un vrai silence (~10 min par
  // défaut, ≈ « 10 min par section »). Surchargeable via OPENCODE_IDLE_TIMEOUT_MS.
  const idleTimeout = opts.timeout || parseInt(process.env.OPENCODE_IDLE_TIMEOUT_MS, 10) || 600000;
  const commandName = opts.command || null;
  const resumeId = opts.resumeSessionId || null;   // reprise d'une session opencode
  const cwd = opts.cwd || ROOT;
  const emitter = new EventEmitter();

  // --- Session log ---
  // On peut réutiliser un bridgeSessionId (reprise de session) pour garder une
  // identité stable côté front à travers les tours de dialogue.
  const sessionId = opts.bridgeSessionId || `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  // S16 : mémoriser le propriétaire dès le lancement (ne pas écraser à la reprise,
  // où opts.userId n'est pas repassé — continueSession conserve le bridgeSessionId).
  if (opts.userId && !sessionOwners.has(sessionId)) sessionOwners.set(sessionId, opts.userId);
  const logNonce = Math.random().toString(36).slice(2, 6); // évite l'écrasement du log à la reprise
  const sessionLog = {
    id: sessionId,
    timestamp: new Date().toISOString(),
    userId: opts.userId || sessionOwners.get(sessionId) || null,
    bridgeSessionId: sessionId,
    opencodeSessionId: null,
    agent,
    command: commandName,
    message: message.slice(0, 500),
    status: 'running',
    lastEventAt: null,
    currentStep: null,
    currentSubagent: null,
    expectedFiles: opts.expectedFiles || [],
    warnings: [],
    duration: 0,
    events: [],
    exitCode: null,
    error: null,
  };
  const startTime = Date.now();
  const slug = `${new Date().toISOString().slice(0, 10)}-${sessionId.slice(-8)}-${logNonce}`;
  const filePath = path.join(LOGS_DIR, `${slug}.json`);
  let lastCheckpointAt = 0;

  function saveLog() {
    sessionLog.duration = Date.now() - startTime;
    try {
      fs.writeFileSync(filePath, JSON.stringify(sessionLog, null, 2), 'utf-8');
    } catch {}
  }

  function checkpoint(force = false) {
    const now = Date.now();
    if (!force && now - lastCheckpointAt < 5000) return;
    lastCheckpointAt = now;
    saveLog();
  }

  // --- Construire les arguments ---
  const args = ['run', '--format', 'json'];
  if (resumeId) {
    // Reprise : on ne repasse PAS --agent/--command, le contexte (agent,
    // historique) est déjà porté par la session opencode existante.
    args.push('--session', resumeId);
  } else {
    // Nouveau projet : --command applique le template opencode.json, le message
    // (buildMessage) en est l'input.
    args.push('--agent', agent);
    if (commandName) args.push('--command', commandName);
  }
  args.push(message);

  // IMPORTANT (Windows) : stdin DOIT être 'ignore', pas 'pipe'.
  // Avec un stdin en pipe ouvert et jamais fermé, le runtime Bun d'opencode
  // reste en attente et ne flushe JAMAIS sa sortie JSON sur stdout → le bridge
  // ne reçoit aucun event et l'UI semble figée ("rien ne se passe"). Un stdin
  // fermé (EOF immédiat) débloque le streaming des events.
  // Conséquence : sendInput() (réponses interactives via /api/opencode/input)
  // est inopérant tant qu'on est sur ce transport — à retravailler via le mode
  // serveur d'opencode (--attach) si le dialogue mid-session devient nécessaire.
  const proc = spawn(OPENCODE_BIN, args, {
    cwd: cwd,
    shell: false,
    env: { ...process.env, OPENCODE_CLI_QUIET: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Enregistrer la session pour permettre l'envoi d'input utilisateur
  sessions.set(sessionId, { proc, emitter, startTime: Date.now() });

  // Watchdog d'inactivité : réarmé à chaque sortie d'opencode (cf. armWatchdog()
  // dans les handlers stdout/stderr). Ne déclenche que si le process reste muet
  // `idleTimeout` ms d'affilée.
  let timedOut = false;
  let timer = null;
  const armWatchdog = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timedOut = true;
      try { proc.kill('SIGTERM'); } catch {}
      const err = new Error(`Aucune activité depuis ${idleTimeout / 1000}s — session interrompue.`);
      sessionLog.status = 'timeout_idle';
      sessionLog.error = err.message;
      saveLog();
      emitter.emit('error', err);
    }, idleTimeout);
  };
  armWatchdog();

  // Parse stdout — chaque ligne est un event JSON
  let buffer = '';
  proc.stdout.on('data', (chunk) => {
    armWatchdog(); // activité → on repousse l'échéance d'inactivité
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const event = JSON.parse(trimmed);
        // Mémoriser le vrai sessionID opencode → permet la reprise de session.
        if (event && event.sessionID) {
          opencodeSessions.set(sessionId, event.sessionID);
          sessionLog.opencodeSessionId = event.sessionID;
        }
        sessionLog.lastEventAt = new Date().toISOString();
        if (event.type === 'step_start') sessionLog.currentStep = 'step_start';
        else if (event.type === 'step_finish') sessionLog.currentStep = 'step_finish';
        else if (event.type === 'tool_use' && event.part && event.part.tool) {
          sessionLog.currentStep = `tool:${event.part.tool}`;
          const input = event.part.state && event.part.state.input ? event.part.state.input : {};
          const stateStatus = event.part.state ? event.part.state.status : null;
          if (event.part.tool === 'task' && input.subagent_type) {
            sessionLog.currentSubagent = {
              type: input.subagent_type,
              description: input.description || '',
              status: stateStatus || 'running',
              updatedAt: sessionLog.lastEventAt,
            };
          }
          const filePath = input.filePath || input.path || '';
          const isOrchestrator = typeof agent === 'string' && agent.startsWith('orchestrateur');
          const isProductionWrite = /[\\\/](sections|chapitres|scenes|recits|textes)[\\\/](section|chapitre|scene|recit|texte|brouillon)-\d+\.md$/i.test(filePath);
          const isWriteTool = ['write', 'edit', 'multiedit'].includes(String(event.part.tool).toLowerCase());
          if (isOrchestrator && isWriteTool && isProductionWrite) {
            const warning = {
              type: 'pipeline_warning',
              warningType: 'role_bypass',
              text: `Règle pipeline contournée : ${agent} écrit directement ${path.basename(filePath)}.`,
              filePath,
              timestamp: Date.now(),
            };
            sessionLog.warnings.push(warning);
            sessionLog.events.push(warning);
            emitter.emit('event', warning);
          }
        } else if (event.type) {
          sessionLog.currentStep = event.type;
        }
        sessionLog.events.push(event);
        checkpoint(false);
        emitter.emit('event', event);
      } catch {
        if (trimmed.length > 2) emitter.emit('stderr', trimmed);
      }
    }
  });

  // stderr → on le forwarde (contient parfois des infos utiles)
  let stderrBuffer = '';
  proc.stderr.on('data', (chunk) => {
    armWatchdog(); // l'activité stderr compte aussi comme « vivant »
    stderrBuffer += chunk.toString();
    sessionLog.lastEventAt = new Date().toISOString();
    sessionLog.currentStep = 'stderr';
    checkpoint(false);
    emitter.emit('stderr', chunk.toString());
  });

  proc.on('error', (err) => {
    clearTimeout(timer);
    sessionLog.status = 'error';
    sessionLog.error = `${err.message}. Stderr: ${stderrBuffer.slice(0, 300)}`;
    checkpoint(true);
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
      checkpoint(true);
      emitter.emit('close', code);
    }
  });

  const abort = () => {
    if (sessionLog.status === 'success' || sessionLog.status === 'error' || sessionLog.status === 'timeout_idle') {
      return;
    }
    clearTimeout(timer);
    sessionLog.status = 'cancelled_by_user';
    sessionLog.error = 'Annulé par l\'utilisateur';
    checkpoint(true);
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
        lastEventAt: data.lastEventAt,
        currentStep: data.currentStep,
        currentSubagent: data.currentSubagent,
        expectedFiles: data.expectedFiles || [],
        warningCount: (data.warnings || []).length,
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

// ─── Reprise de session : répondre à une question du pré-flight ────────────

/**
 * Reprend une session opencode existante avec un nouveau message utilisateur.
 * Remplace l'ancien sendInput() (stdin), devenu inopérant avec stdio:'ignore'.
 * Relance `opencode run --session <id>` et streame les events comme runCommand.
 * @param {string} bridgeSessionId — l'ID renvoyé par runCommand (meta.sessionId)
 * @param {string} text — la réponse de l'utilisateur
 * @returns {{emitter,abort,proc,sessionId}|null} null si la session est inconnue
 */
function continueSession(bridgeSessionId, text, opts = {}) {
  const opencodeId = opencodeSessions.get(bridgeSessionId);
  if (!opencodeId) return null;
  // On réutilise le bridgeSessionId pour garder une identité stable côté front.
  return runCommand(null, text, { ...opts, resumeSessionId: opencodeId, bridgeSessionId });
}

/** Indique si une session opencode reprenable est connue pour cet ID bridge. */
function hasSession(bridgeSessionId) {
  return opencodeSessions.has(bridgeSessionId);
}

/**
 * S16 : la session appartient-elle à cet utilisateur ?
 * Renvoie false si la session est inconnue OU si elle a un autre propriétaire.
 * (Si aucun propriétaire n'a été enregistré — session sans userId — on refuse
 * aussi : pas d'accès par défaut.)
 */
function ownsSession(bridgeSessionId, userId) {
  return !!userId && sessionOwners.get(bridgeSessionId) === userId;
}

module.exports = { runCommand, continueSession, hasSession, ownsSession, buildMessage, sessions, GENRE_AGENTS, SKILLS_BY_GENRE, listLogs, getLog, _binPath: OPENCODE_BIN };
