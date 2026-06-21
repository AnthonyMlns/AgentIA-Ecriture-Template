// ─── Auth System — AgentIA-Ecriture ──────────────────────────────────────────
// Data layer, password hashing, token management, middleware.
// Uses JSON files for storage (lightweight, no external DB).
// ──────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const INVITES_FILE = path.join(DATA_DIR, 'invites.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const WHITELIST_FILE = path.join(DATA_DIR, 'whitelist.json');
const STYLES_FILE = path.join(DATA_DIR, 'styles.json');
const APIKEYS_FILE = path.join(DATA_DIR, 'apikeys.json');

// Sécurité (S4) : secrets chargés depuis l'env, sinon générés UNE fois et
// persistés dans data/ (gitignored). Évite la régénération à chaque
// redémarrage — sinon toutes les sessions sont invalidées et les clés API
// chiffrées deviennent indéchiffrables.
function loadOrCreateSecret(envName, fileName, bytes) {
  if (process.env[envName]) return process.env[envName];
  ensureDataDir();
  const fp = path.join(DATA_DIR, fileName);
  try { if (fs.existsSync(fp)) return fs.readFileSync(fp, 'utf-8').trim(); } catch {}
  const secret = crypto.randomBytes(bytes).toString('hex');
  try { fs.writeFileSync(fp, secret, 'utf-8'); } catch {}
  return secret;
}

const TOKEN_SECRET = loadOrCreateSecret('TOKEN_SECRET', 'token.secret', 32);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const f of [USERS_FILE, INVITES_FILE, SESSIONS_FILE]) {
    if (!fs.existsSync(f)) fs.writeFileSync(f, '[]', 'utf-8');
  }
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8') || '[]'); } catch { return []; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Password hashing (Node.js crypto scryptSync) ───────────────────────────

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  // S13 : comparaison à temps constant (anti-timing attack).
  if (typeof hash !== 'string' || derived.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
}

// ─── Token management (HMAC-based, no external lib) ─────────────────────────

function generateToken(userId) {
  const raw = `${userId}:${Date.now()}:${crypto.randomBytes(12).toString('hex')}`;
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(raw).digest('hex');
  return `${raw}.${sig}`;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const raw = parts.slice(0, -1).join('.');
    const sig = parts[parts.length - 1];
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(raw).digest('hex');
    if (sig !== expected) return null;
    const userId = raw.split(':')[0];
    return userId;
  } catch { return null; }
}

function loadSessions() {
  ensureDataDir();
  const sessions = readJSON(SESSIONS_FILE);
  // Clean expired (older than 7 days)
  const now = Date.now();
  const valid = sessions.filter(s => (now - s.createdAt) < 7 * 24 * 60 * 60 * 1000);
  if (valid.length !== sessions.length) writeJSON(SESSIONS_FILE, valid);
  return valid;
}

function saveSession(token, userId) {
  const sessions = loadSessions();
  sessions.push({ token, userId, createdAt: Date.now() });
  writeJSON(SESSIONS_FILE, sessions);
}

function removeSession(token) {
  const sessions = loadSessions().filter(s => s.token !== token);
  writeJSON(SESSIONS_FILE, sessions);
}

function findSession(token) {
  const sessions = loadSessions();
  return sessions.find(s => s.token === token) || null;
}

// ─── User management ───────────────────────────────────────────────────────

function loadUsers() {
  ensureDataDir();
  return readJSON(USERS_FILE);
}

function saveUsers(users) {
  writeJSON(USERS_FILE, users);
}

function findUserByEmail(email) {
  const users = loadUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function findUserById(id) {
  const users = loadUsers();
  return users.find(u => u.id === id) || null;
}

function createUser({ email, name, password, role = 'user' }) {
  const users = loadUsers();
  const { salt, hash } = hashPassword(password);
  const id = crypto.randomUUID();
  const user = { id, email: email.toLowerCase(), name, passwordHash: hash, salt, role, createdAt: Date.now() };
  users.push(user);
  saveUsers(users);
  // Create user directories
  const userDir = path.join(__dirname, '..', 'users', id);
  for (const d of ['projets/romans', 'projets/poesie', 'projets/theatre', 'projets/essais', 'projets/nouvelles', 'projets/textes-mobiles', 'projets/universitaire', 'echantillons', 'idees', 'uploads']) {
    fs.mkdirSync(path.join(userDir, d), { recursive: true });
  }
  return user;
}

// ─── Invite management ─────────────────────────────────────────────────────

// ─── Whitelist management ─────────────────────────────────────────────────

function loadWhitelist() {
  ensureDataDir();
  if (!fs.existsSync(WHITELIST_FILE)) fs.writeFileSync(WHITELIST_FILE, '[]', 'utf-8');
  return readJSON(WHITELIST_FILE);
}

function saveWhitelist(list) {
  writeJSON(WHITELIST_FILE, list);
}

function isWhitelisted(email) {
  const list = loadWhitelist();
  return list.some(e => e.toLowerCase() === email.toLowerCase());
}

function addToWhitelist(email, addedBy) {
  const list = loadWhitelist();
  const normalized = email.toLowerCase();
  if (list.some(e => e.toLowerCase() === normalized)) return false;
  list.push(normalized);
  saveWhitelist(list);
  return true;
}

function removeFromWhitelist(email) {
  const list = loadWhitelist();
  const normalized = email.toLowerCase();
  const filtered = list.filter(e => e.toLowerCase() !== normalized);
  if (filtered.length === list.length) return false;
  saveWhitelist(filtered);
  return true;
}

function deleteInvite(code) {
  const invites = loadInvites();
  const idx = invites.findIndex(i => i.code === code.toUpperCase());
  if (idx === -1) return false;
  invites.splice(idx, 1);
  saveInvites(invites);
  return true;
}

// ─── Style d'écriture utilisateur ─────────────────────────────────────────

function loadStyles() {
  ensureDataDir();
  if (!fs.existsSync(STYLES_FILE)) fs.writeFileSync(STYLES_FILE, '{}', 'utf-8');
  return readJSON(STYLES_FILE);
}

function saveStyles(styles) {
  writeJSON(STYLES_FILE, styles);
}

function getUserStyle(userId) {
  const styles = loadStyles();
  return styles[userId] || {
    registre: 'introspectif-retenu',
    longueur: 50,
    precision_objets: 70,
    emotion: 30,
    filRouge: ''
  };
}

function setUserStyle(userId, style) {
  const styles = loadStyles();
  styles[userId] = { ...getUserStyle(userId), ...style };
  saveStyles(styles);
  return styles[userId];
}

// ─── API Keys utilisateur ─────────────────────────────────────────────────

// Clé dérivée en 32 octets (aes-256-cbc) via SHA-256, depuis un secret
// persistant (S4). Les anciennes clés API (apikeys.json) étaient de toute façon
// indéchiffrables, la clé changeant à chaque redémarrage.
const ENCRYPTION_KEY = crypto.createHash('sha256')
  .update(loadOrCreateSecret('ENCRYPTION_KEY', 'encryption.key', 32))
  .digest();

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  } catch { return null; }
}

function loadApiKeys() {
  ensureDataDir();
  if (!fs.existsSync(APIKEYS_FILE)) fs.writeFileSync(APIKEYS_FILE, '{}', 'utf-8');
  return readJSON(APIKEYS_FILE);
}

function saveApiKeys(keys) {
  writeJSON(APIKEYS_FILE, keys);
}

function getApiKeyMeta(userId) {
  const keys = loadApiKeys();
  return keys[userId] ? { provider: keys[userId].provider, hasKey: true } : { hasKey: false };
}

function setApiKey(userId, provider, key) {
  const keys = loadApiKeys();
  const encrypted = encrypt(key);
  keys[userId] = { provider, key: encrypted, updatedAt: Date.now() };
  saveApiKeys(keys);
  return true;
}

function deleteApiKey(userId) {
  const keys = loadApiKeys();
  delete keys[userId];
  saveApiKeys(keys);
  return true;
}

// ─── Quotas utilisateur ───────────────────────────────────────────────────

function loadQuotas() {
  ensureDataDir();
  const qf = path.join(DATA_DIR, 'quotas.json');
  if (!fs.existsSync(qf)) fs.writeFileSync(qf, '{}', 'utf-8');
  return readJSON(qf);
}

function saveQuotas(quotas) {
  writeJSON(path.join(DATA_DIR, 'quotas.json'), quotas);
}

function getUserQuota(userId) {
  const quotas = loadQuotas();
  return quotas[userId] || { projets: [], limiteProjets: 3, unitesParProjet: 5 };
}

function loadInvites() {
  ensureDataDir();
  return readJSON(INVITES_FILE);
}

function saveInvites(invites) {
  writeJSON(INVITES_FILE, invites);
}

function createInvite({ createdBy, maxUses = 1, expiresInDays = 30 }) {
  const invites = loadInvites();
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  const invite = {
    code,
    createdBy,
    createdAt: Date.now(),
    expiresAt: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    maxUses,
    usedBy: []
  };
  invites.push(invite);
  saveInvites(invites);
  return invite;
}

function validateInvite(code) {
  const invites = loadInvites();
  const invite = invites.find(i => i.code === code.toUpperCase());
  if (!invite) return { valid: false, reason: 'Code invalide' };
  if (Date.now() > invite.expiresAt) return { valid: false, reason: 'Code expiré' };
  if (invite.usedBy.length >= invite.maxUses) return { valid: false, reason: 'Code déjà utilisé' };
  return { valid: true, invite };
}

function useInvite(code, userId) {
  const invites = loadInvites();
  const idx = invites.findIndex(i => i.code === code.toUpperCase());
  if (idx === -1) return false;
  invites[idx].usedBy.push({ userId, usedAt: Date.now() });
  saveInvites(invites);
  return true;
}

// ─── Middleware ─────────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  const token = authHeader.slice(7);
  const session = findSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }
  const user = findUserById(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Utilisateur introuvable' });
  }
  req.user = user;
  req.userToken = token;
  next();
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
}

function userDir(userId) {
  return path.join(__dirname, '..', 'users', userId);
}

function userProjetsDir(userId) {
  return path.join(userDir(userId), 'projets');
}

// ─── Migration des données existantes vers le premier admin ──────────────

function migrateExistingData(userId) {
  const ROOT = path.join(__dirname, '..');
  const userDirPath = userDir(userId);

  // Migrer les projets existants (projets/ → users/{id}/projets/)
  const srcProjets = path.join(ROOT, 'projets');
  const dstProjets = path.join(userDirPath, 'projets');
  if (fs.existsSync(srcProjets)) {
    const genres = fs.readdirSync(srcProjets).filter(d => !d.startsWith('.'));
    for (const genre of genres) {
      const srcGenre = path.join(srcProjets, genre);
      const dstGenre = path.join(dstProjets, genre);
      if (fs.statSync(srcGenre).isDirectory()) {
        const projects = fs.readdirSync(srcGenre).filter(d => !d.startsWith('.'));
        for (const proj of projects) {
          const srcProj = path.join(srcGenre, proj);
          const dstProj = path.join(dstGenre, proj);
          if (!fs.existsSync(dstProj) && fs.statSync(srcProj).isDirectory()) {
            fs.mkdirSync(path.dirname(dstProj), { recursive: true });
            fs.cpSync(srcProj, dstProj, { recursive: true });
            console.error(`[auth] Migration : ${genre}/${proj} → utilisateur ${userId}`);
          }
        }
      }
    }
  }

  // Migrer les échantillons existants
  const srcEchant = path.join(ROOT, 'echantillons');
  const dstEchant = path.join(userDirPath, 'echantillons');
  if (fs.existsSync(srcEchant)) {
    const files = fs.readdirSync(srcEchant).filter(f => !f.startsWith('.'));
    for (const f of files) {
      const src = path.join(srcEchant, f);
      const dst = path.join(dstEchant, f);
      if (!fs.existsSync(dst)) {
        fs.cpSync(src, dst, { recursive: true });
        console.error(`[auth] Migration : echantillons/${f} → utilisateur ${userId}`);
      }
    }
  }

  console.error(`[auth] Migration terminée pour l'utilisateur ${userId}`);
}

// ─── Init — create default admin if no users ───────────────────────────────

function initAuth() {
  ensureDataDir();
  const users = loadUsers();
  if (users.length === 0) {
    // Sécurité (S1) : ne JAMAIS créer un admin avec un mot de passe en dur.
    // Le mot de passe vient de ADMIN_PASSWORD (env/.env). À défaut, on en
    // génère un aléatoire affiché UNE seule fois dans la console.
    const email = (process.env.ADMIN_EMAIL || 'admin@agentia.local').toLowerCase();
    let password = process.env.ADMIN_PASSWORD;
    const generated = !password;
    if (generated) password = crypto.randomBytes(12).toString('base64url');

    const admin = createUser({ email, name: 'Admin', password, role: 'admin' });

    if (generated) {
      const bar = '═'.repeat(64);
      console.error(bar);
      console.error(`[auth] Compte admin créé : ${email}`);
      console.error(`[auth] MOT DE PASSE GÉNÉRÉ (affiché une seule fois) : ${password}`);
      console.error('[auth] Notez-le, ou définissez ADMIN_PASSWORD dans .env avant le 1er démarrage.');
      console.error(bar);
    } else {
      console.error(`[auth] Compte admin créé : ${email} (mot de passe depuis ADMIN_PASSWORD)`);
    }

    // Migrer les données existantes
    migrateExistingData(admin.id);

    // Create a default invite
    createInvite({ createdBy: admin.id, maxUses: 10, expiresInDays: 365 });
    console.error('[auth] Code d\'invitation par défaut créé (10 utilisations, 365 jours)');
    console.error('[auth] Code : (voir dans la console ou page admin)');
  }
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  initAuth,
  authMiddleware,
  adminMiddleware,
  findUserByEmail,
  findUserById,
  createUser,
  verifyPassword,
  hashPassword,
  generateToken,
  verifyToken,
  saveSession,
  removeSession,
  findSession,
  createInvite,
  loadInvites,
  validateInvite,
  useInvite,
  userDir,
  userProjetsDir,
  loadUsers,
  saveUsers,
  isWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  loadWhitelist,
  deleteInvite,
  getUserStyle,
  setUserStyle,
  getApiKeyMeta,
  setApiKey,
  deleteApiKey,
  getUserQuota,
};
