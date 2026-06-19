# Sécurité — failles à corriger avant mise en ligne

> Audit du 19/06/2026 (interface web Node/Express dans `interface/`).
> **L'app est conçue pour un usage local mono-utilisateur. Elle n'est PAS prête pour une exposition publique.**
> Les points 🔴 sont des bloquants absolus avant tout déploiement ou ouverture à des tiers.

**Point positif :** `data/`, `users/`, `.env`, `interface/logs/` sont bien dans `.gitignore` — aucun secret ni mot de passe utilisateur n'est suivi par git. Le risque n'est pas le contenu poussé, mais l'application une fois exposée.

---

## 🔴 Critique — bloquant avant toute mise en ligne

- [x] **1. Compte admin par défaut `admin` / `admin`** — `interface/auth.js` ✅ **Corrigé**
  ~~Au premier démarrage, `admin@agentia.local` / `admin` (rôle `admin`) est créé automatiquement.~~
  Désormais : mot de passe lu depuis `ADMIN_PASSWORD` (env/.env) ; à défaut, généré aléatoirement et affiché **une seule fois** dans la console. Plus aucun mot de passe en dur.
  ⚠️ **Installations existantes** : l'admin `admin/admin` déjà créé n'est PAS modifié rétroactivement — changer son mot de passe via le profil, ou supprimer `data/users.json` pour régénérer.

- [x] **2. Injection de commande shell** — `interface/server.js` (`/finalize`) ✅ **Corrigé**
  ~~`execSync` interpolait `nom` (segment d'URL) dans une commande shell → exécution arbitraire.~~
  Remplacé par `execFileSync(pandocBin, [mdPath, '-o', pdfPath, '--pdf-engine=pdfhtml'])` — pas de shell, donc plus d'injection possible via le nom de projet.

- [x] **3. Endpoints sensibles SANS authentification** — `interface/server.js` ✅ **Partiellement corrigé**
  `auth.authMiddleware` ajouté sur : `POST /opencode/run`, `POST /opencode/input`, `GET /logs` + `/logs/:slug`, `POST .../continue`, `POST .../finalize`. Le front envoie le Bearer token sur ces appels (y compris le fetch SSE).
  ⏳ **Restent en lecture publique** (hors scope immédiat, voir S6) : `GET /api/projets/...`, `/api/knowledge/...`, `/api/echantillons`, `/api/skills`. À gater si l'app n'est pas censée exposer le contenu sans login.

---

## 🟠 Élevé — à corriger avant d'ouvrir à des utilisateurs tiers

- [ ] **4. Secrets régénérés à chaque redémarrage** — `auth.js:18` et `auth.js:211`
  `TOKEN_SECRET` et `ENCRYPTION_KEY` sont des `crypto.randomBytes(...)` recréés à chaque boot, non issus de l'environnement. Effets : sessions invalidées à chaque restart, et surtout **les clés API utilisateurs chiffrées deviennent indéchiffrables** après redémarrage (`getApiKey` → `null`). De plus `ENCRYPTION_KEY = randomBytes(32).toString('hex').slice(0,32)` n'a que ~128 bits d'entropie, et AES‑CBC est utilisé sans authentification (préférer AES‑GCM).
  → Charger ces secrets depuis `process.env` / `.env`.

- [ ] **5. XSS stocké via Markdown** — `interface/public/app.js:1256, 1303, 1369`
  ```js
  const html = marked.parse(data.contenu); el.innerHTML = html;
  ```
  `marked` v12 ne sanitize plus par défaut ; le HTML brut passe tel quel. Le contenu vient de fichiers projet, knowledge et **uploads utilisateurs**. En multi-utilisateurs, le contenu d'un utilisateur (ou la sortie d'un agent) s'exécute dans le navigateur d'un autre → vol du token (stocké côté client).
  → Passer la sortie dans DOMPurify avant `innerHTML`.

- [ ] **6. Path traversal sur `genre`/`nom`** — `server.js:323-326` (et endpoints similaires)
  La protection anti-traversal recalcule `base` à partir des paramètres `genre`/`nom` eux-mêmes non filtrés ; une remontée via ces segments n'est pas détectée. Couplé à l'absence d'auth (point 3), élargit la surface de lecture de fichiers.
  → Valider `genre` contre la liste blanche `GENRES` et rejeter tout `nom` contenant `.` / séparateurs.

- [ ] **7. Upload `.svg` servi inline** — `routes/files.js:38` + `:121` (`res.sendFile`)
  Le SVG est autorisé et renvoyé tel quel par `/view` → un SVG contenant `<script>` s'exécute dans le contexte du site (XSS stocké).
  → Retirer `.svg`, ou forcer `Content-Disposition: attachment` + `Content-Type` non-HTML.

---

## 🟡 Moyen — durcissement avant prod

- [ ] **8. Pas de rate-limiting / anti-brute-force** sur `/api/auth/login`, pas de verrouillage de compte → `express-rate-limit`.
- [ ] **9. `express.json()` sans limite de taille** (`server.js:266`) → DoS par gros payload ; ajouter `{ limit: '1mb' }`.
- [ ] **10. Aucun en-tête de sécurité** (pas de `helmet`), pas de politique CORS explicite.
- [ ] **11. Token Bearer** vraisemblablement en `localStorage` (exfiltrable par XSS) ; envisager cookie `httpOnly`+`Secure`. Sessions stockées en clair sur disque.
- [ ] **12. `verifyToken` (HMAC) jamais utilisé** pour valider : `findSession` ne fait qu'une comparaison de chaîne. Défense en profondeur manquante (les tokens restent aléatoires, donc acceptable mais à durcir).
- [ ] **13. Comparaisons non constant-time** (`verifyPassword` `===`, `auth.js:47`) → timing attack mineur ; `crypto.timingSafeEqual`.
- [ ] **14. `fileFilter` par extension uniquement** (`routes/files.js`) — pas de vérification du contenu réel (magic bytes).

---

## Ordre de correction recommandé

1. **Avant le moindre déploiement :** points 1, 2, 3.
2. **Avant d'inviter des beta-testeurs :** points 4, 5, 6, 7.
3. **Avant ouverture plus large / prod :** points 8 à 14.
