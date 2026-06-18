// ─── Routes d'authentification ─────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const auth = require('../auth');

// ─── POST /api/auth/register ──────────────────────────────────────────────
// Body: { email, name, password, inviteCode }
router.post('/register', (req, res) => {
  const { email, name, password, inviteCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }
  // Vérifier whitelist ou code d'invitation
  const whitelisted = auth.isWhitelisted(email);

  if (!whitelisted && !inviteCode) {
    return res.status(400).json({ error: 'Code d\'invitation requis (ou email whitelisté).' });
  }

  if (!whitelisted) {
    const check = auth.validateInvite(inviteCode);
    if (!check.valid) {
      return res.status(403).json({ error: check.reason });
    }
  }

  // Si whitelisté mais invite fourni, on ne l'utilise pas
  const effectiveCode = whitelisted ? null : inviteCode;

  // Vérifier si l'email existe déjà
  const existing = auth.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
  }

  // Créer l'utilisateur
  const user = auth.createUser({ email, name: name || email.split('@')[0], password });

  // Consommer le code d'invitation si utilisé
  if (effectiveCode) {
    auth.useInvite(effectiveCode, user.id);
  }

  // Générer un token
  const token = auth.generateToken(user.id);
  auth.saveSession(token, user.id);

  res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────
// Body: { email, password }
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  const user = auth.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  if (!auth.verifyPassword(password, user.salt, user.passwordHash)) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  const token = auth.generateToken(user.id);
  auth.saveSession(token, user.id);

  res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────
router.post('/logout', auth.authMiddleware, (req, res) => {
  auth.removeSession(req.userToken);
  res.json({ success: true });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
router.get('/me', auth.authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      createdAt: req.user.createdAt
    },
    quota: auth.getUserQuota(req.user.id),
    style: auth.getUserStyle(req.user.id),
    apiKey: auth.getApiKeyMeta(req.user.id)
  });
});

// ─── PUT /api/auth/me (modifier profil) ──────────────────────────────────
router.put('/me', auth.authMiddleware, (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const users = auth.loadUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Utilisateur introuvable.' });

  if (name) users[idx].name = name;
  if (newPassword) {
    if (!currentPassword || !auth.verifyPassword(currentPassword, users[idx].salt, users[idx].passwordHash)) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    }
    const { salt, hash } = auth.hashPassword(newPassword);
    users[idx].salt = salt;
    users[idx].passwordHash = hash;
  }
  auth.saveUsers(users);
  res.json({ success: true, user: { id: users[idx].id, email: users[idx].email, name: users[idx].name, role: users[idx].role } });
});

// ─── GET /api/auth/style ─────────────────────────────────────────────────
router.get('/style', auth.authMiddleware, (req, res) => {
  res.json(auth.getUserStyle(req.user.id));
});

// ─── PUT /api/auth/style ─────────────────────────────────────────────────
router.put('/style', auth.authMiddleware, (req, res) => {
  const style = auth.setUserStyle(req.user.id, req.body);
  res.json({ success: true, style });
});

// ─── GET /api/auth/apikey (meta uniquement, pas la clé) ──────────────────
router.get('/apikey', auth.authMiddleware, (req, res) => {
  res.json(auth.getApiKeyMeta(req.user.id));
});

// ─── PUT /api/auth/apikey ────────────────────────────────────────────────
router.put('/apikey', auth.authMiddleware, (req, res) => {
  const { provider, key } = req.body;
  if (!provider || !key) return res.status(400).json({ error: 'Provider et clé requis.' });
  auth.setApiKey(req.user.id, provider, key);
  res.json({ success: true, provider });
});

// ─── DELETE /api/auth/apikey ─────────────────────────────────────────────
router.delete('/apikey', auth.authMiddleware, (req, res) => {
  auth.deleteApiKey(req.user.id);
  res.json({ success: true });
});

// ─── GET /api/auth/invites (admin only) ───────────────────────────────────
router.get('/invites', auth.authMiddleware, auth.adminMiddleware, (req, res) => {
  res.json(auth.loadInvites());
});

// ─── POST /api/auth/invites (admin only) ──────────────────────────────────
// Body: { maxUses, expiresInDays } (optionnel)
router.post('/invites', auth.authMiddleware, auth.adminMiddleware, (req, res) => {
  const { maxUses = 1, expiresInDays = 30 } = req.body;
  const invite = auth.createInvite({ createdBy: req.user.id, maxUses, expiresInDays });
  res.json({ success: true, invite });
});

// ─── DELETE /api/auth/invites/:code (admin only) ──────────────────────────
router.delete('/invites/:code', auth.authMiddleware, auth.adminMiddleware, (req, res) => {
  const ok = auth.deleteInvite(req.params.code);
  if (!ok) return res.status(404).json({ error: 'Code d\'invitation introuvable.' });
  res.json({ success: true });
});

// ─── GET /api/auth/users (admin only) ─────────────────────────────────────
router.get('/users', auth.authMiddleware, auth.adminMiddleware, (req, res) => {
  const users = auth.loadUsers().map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt
  }));
  res.json(users);
});

// ─── GET /api/auth/whitelist (admin only) ─────────────────────────────────
router.get('/whitelist', auth.authMiddleware, auth.adminMiddleware, (req, res) => {
  const list = auth.loadWhitelist();
  res.json(list);
});

// ─── POST /api/auth/whitelist (admin only) ────────────────────────────────
// Body: { email }
router.post('/whitelist', auth.authMiddleware, auth.adminMiddleware, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis.' });
  const ok = auth.addToWhitelist(email, req.user.id);
  if (!ok) return res.status(409).json({ error: 'Email déjà whitelisté.' });
  res.json({ success: true, email: email.toLowerCase() });
});

// ─── DELETE /api/auth/whitelist/:email (admin only) ───────────────────────
router.delete('/whitelist/:email', auth.authMiddleware, auth.adminMiddleware, (req, res) => {
  const ok = auth.removeFromWhitelist(req.params.email);
  if (!ok) return res.status(404).json({ error: 'Email non trouvé dans la whitelist.' });
  res.json({ success: true });
});

module.exports = router;
