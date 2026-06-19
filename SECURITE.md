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

- [x] **4. Secrets régénérés à chaque redémarrage** — `auth.js` ✅ **Corrigé**
  Secrets chargés depuis l'env (`TOKEN_SECRET`, `ENCRYPTION_KEY`), sinon générés **une fois** et persistés dans `data/` (gitignored). Clé de chiffrement dérivée en 32 octets via SHA-256. Vérifié : round-trip de déchiffrement OK, secret identique entre deux process (persiste across restarts). *(AES-GCM au lieu de CBC : amélioration future, non bloquante.)*

- [x] **5. XSS stocké via Markdown** — `interface/public/app.js` + `index.html` ✅ **Corrigé**
  DOMPurify chargé dans `index.html` ; helper `renderMarkdown()` passe la sortie de `marked.parse` dans `DOMPurify.sanitize` avant `innerHTML` (3 emplacements).

- [x] **6. Path traversal sur `genre`/`nom`** — `server.js` ✅ **Corrigé**
  `app.param('genre')` valide contre la whitelist `GENRES` (→ 400), `app.param('nom')` rejette les séparateurs/`..` (→ 400). De plus, **toutes les lectures `/api` exigent désormais un token** (auth optionnelle → requise ; `/api/auth` reste public). Vérifié : 401 sans token, 200 avec, genre invalide → 400.

- [x] **7. Upload `.svg` servi inline** — `routes/files.js` ✅ **Corrigé**
  `.svg` retiré des extensions autorisées ; `X-Content-Type-Options: nosniff` ajouté sur `/view`.

---

## 🟡 Moyen — durcissement avant prod

- [x] **8. Rate-limiting / anti-brute-force** sur `/api/auth/login` + `/register` ✅ **Corrigé** — `express-rate-limit` (20 essais / 15 min / IP). Vérifié : en-têtes `RateLimit-*` présents.
- [x] **9. `express.json()` sans limite de taille** ✅ **Corrigé** — `{ limit: '1mb' }`.
- [x] **10. En-têtes de sécurité** ✅ **Corrigé** — `helmet` activé (X-Frame-Options, nosniff, Referrer-Policy…). ⏳ **CSP désactivée** pour l'instant (le front utilise des `onclick`/styles inline ; activer une CSP stricte nécessite de les externaliser).
- [ ] **11. Token Bearer en `localStorage`** (exfiltrable par XSS) — ⏳ **différé** : migration vers cookie `httpOnly`+`Secure` invasive (modifie tout le flux auth + SSE). Risque réduit par S5 (XSS sanitizé).
- [ ] **12. HMAC du token non vérifié** (`findSession` = comparaison de chaîne) — ⏳ **différé** : l'activer invaliderait les sessions existantes (tokens signés avec l'ancien secret) → déconnexion. Faible valeur (tokens déjà aléatoires + stockés côté serveur).
- [x] **13. Comparaisons non constant-time** ✅ **Corrigé** — `crypto.timingSafeEqual` dans `verifyPassword`.
- [ ] **14. `fileFilter` par extension uniquement** — ⏳ **différé** : vérification par magic bytes (nécessite une lib type `file-type`). Risque faible.

---

## État

- ✅ **Faits :** 1, 2, 3 (🔴) · 4, 5, 6, 7 (🟠) · 8, 9, 10, 13 (🟡)
- ⏳ **Différés (faible risque / invasif) :** 11 (cookie httpOnly), 12 (HMAC token), 14 (magic bytes)

Il ne reste aucun bloquant. Les 3 points différés sont du durcissement optionnel,
à faire avant une ouverture publique large mais non requis pour une beta restreinte.
