# Sécurité — failles à corriger avant mise en ligne

> Audit du 19/06/2026 (interface web Node/Express dans `interface/`).
> **L'app est conçue d'abord pour un usage local mono-utilisateur. Depuis la repasse du 19/06/2026, elle n'est PAS prête pour une beta multi-utilisateur ni pour une exposition publique tant que S18-S23 ne sont pas traités.**
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

- [x] **3. Endpoints sensibles SANS authentification** — `interface/server.js` ✅ **Corrigé**
  ~~Plusieurs routes sensibles étaient accessibles sans session valide : OpenCode, logs, lecture de projets/contenus, knowledge, échantillons et skills.~~
  Corrigé : les routes `/api/auth` et `/api/files` sont montées avant le garde, puis un garde global sur `/api` impose un Bearer token valide pour le reste de l'API. Les appels OpenCode, logs, projets, knowledge, échantillons et skills exigent donc une authentification. Le front envoie le Bearer token, y compris sur les flux SSE.

- [x] **15. XSS stocké via `name`/`email` dans le panneau admin** — `interface/public/app.js` ✅ **Corrigé** (revue du 19/06/2026)
  ~~`renderAdmin` injectait `u.name`/`u.email` bruts dans `innerHTML` sans échappement ; un utilisateur pouvait fixer son `name` à une charge XSS qui s'exécutait dans la session de l'admin → prise de contrôle.~~
  Corrigé : échappement au point d'injection (`escHtml(u.name || u.email)`, `escHtml(u.email)`, `escHtml(u.role)`) + bornage côté serveur (`cleanName` : retrait des `<>`, max 80 car.) dans `register` et `PUT /me`. (CSP stricte = défense en profondeur encore différée, cf. S10.)

- [ ] **18. Path traversal sur les logs OpenCode** — `interface/opencode-bridge.js:getLog()` 🔴 **À corriger**
  `GET /api/logs/:slug` transmet `req.params.slug` à `getLog(slug)`, qui construit directement `path.join(LOGS_DIR, `${slug}.json`)` sans validation stricte ni vérification `path.resolve`. Un utilisateur authentifié pourrait tenter un slug encodé (`..%2F..%2Fdata%2Fsessions`, etc.) pour lire d'autres fichiers `.json` du projet (`data/sessions.json`, `data/users.json`, `data/apikeys.json` si présent). Correctif : regex stricte sur le format des slugs générés (`YYYY-MM-DD-...-....`), puis `path.resolve` et refus si le chemin final ne reste pas sous `LOGS_DIR`.

- [ ] **19. Logs OpenCode globaux non isolés par utilisateur** — `interface/opencode-bridge.js` + `interface/server.js` 🔴 **À corriger**
  `listLogs()` et `getLog()` retournent les logs de toutes les sessions OpenCode à tout utilisateur authentifié. Or les logs peuvent contenir prompts, titres, extraits de projets, erreurs, résultats d'outils et chemins. Correctif : enregistrer `userId` dans chaque `sessionLog`, filtrer `GET /api/logs` par propriétaire, et refuser `GET /api/logs/:slug` si le log n'appartient pas à `req.user.id` (404 conseillé pour ne pas révéler l'existence).

---

## 🟠 Élevé — à corriger avant d'ouvrir à des utilisateurs tiers

- [x] **4. Secrets régénérés à chaque redémarrage** — `auth.js` ✅ **Corrigé**
  Secrets chargés depuis l'env (`TOKEN_SECRET`, `ENCRYPTION_KEY`), sinon générés **une fois** et persistés dans `data/` (gitignored). Clé de chiffrement dérivée en 32 octets via SHA-256. Vérifié : round-trip de déchiffrement OK, secret identique entre deux process (persiste across restarts). *(AES-GCM au lieu de CBC : amélioration future, non bloquante.)*

- [x] **5. XSS stocké via Markdown** — `interface/public/app.js` + `index.html` ✅ **Corrigé**
  DOMPurify chargé localement dans `index.html` ; helper `renderMarkdown()` passe la sortie de `marked.parse` dans `DOMPurify.sanitize` avant `innerHTML` (3 emplacements). Si `marked` ou DOMPurify manquent, le rendu bascule en texte échappé via `escHtml` au lieu de renvoyer du HTML brut.

- [x] **6. Path traversal sur `genre`/`nom`** — `server.js` ✅ **Corrigé**
  `app.param('genre')` valide contre la whitelist `GENRES` (→ 400), `app.param('nom')` rejette les séparateurs/`..` (→ 400). De plus, **toutes les lectures `/api` exigent désormais un token** (auth optionnelle → requise ; `/api/auth` reste public). Vérifié : 401 sans token, 200 avec, genre invalide → 400.

- [x] **7. Upload `.svg` servi inline** — `routes/files.js` ✅ **Corrigé**
  `.svg` retiré des extensions autorisées ; `X-Content-Type-Options: nosniff` ajouté sur `/view`.

- [ ] **20. Projets globaux non isolés entre utilisateurs** — `interface/server.js:userProjets()` 🟠 **À corriger avant beta multi-utilisateur**
  `userProjets(req)` retourne `GLOBAL_PROJETS` pour tout le monde : un utilisateur connecté peut donc lister, lire, continuer et finaliser les projets globaux, quel que soit leur auteur. Les dossiers `users/{id}/projets` existent mais ne sont pas utilisés par l'interface pour les projets. Correctif : choisir explicitement un modèle mono-tenant (un seul compte) ou migrer les routes projets vers `auth.userProjetsDir(req.user.id)` avec une stratégie claire pour les projets legacy.

- [ ] **21. OpenCode exposé aux utilisateurs avec permissions larges** — `opencode.json` + `/api/opencode/run` 🟠 **À cadrer avant utilisateurs tiers**
  Tout utilisateur authentifié peut déclencher OpenCode via `/api/opencode/run` ou `/continue`. Les orchestrateurs principaux ont `read/edit/bash/task: allow`, donc une consigne malveillante ou un prompt injection peut tenter de faire lire/modifier des fichiers ou exécuter des commandes dans le workspace. Acceptable en local de confiance, risqué en SaaS/beta ouverte. Correctifs possibles : réserver OpenCode aux admins, isoler chaque exécution dans un workspace utilisateur, réduire les permissions des orchestrateurs, imposer une allowlist stricte d'actions, ou exécuter dans un conteneur/sandbox.

- [ ] **22. XSS stocké via noms de projets/fichiers** — `interface/public/app.js` 🟠 **À corriger**
  Plusieurs noms issus du système de fichiers sont injectés dans `innerHTML` sans échappement (`p.nom`, `data.nom`, noms de fichiers, attributs `onclick`/`data-*`). Si un dossier projet ou fichier reçoit un nom contenant HTML/guillemets, l'interface peut exécuter du JavaScript. Exemples observés : navigation projets, vue genre, titre projet, fichiers racine. Correctif : utiliser `textContent`/DOM API ou `escHtml()` partout, et éviter les `onclick` interpolés avec des valeurs dynamiques (préférer `dataset` + listeners).

---

## 🟡 Moyen — durcissement avant prod

- [x] **8. Rate-limiting / anti-brute-force** sur `/api/auth/login` + `/register` ✅ **Corrigé** — `express-rate-limit` (20 essais / 15 min / IP). Vérifié : en-têtes `RateLimit-*` présents.
- [x] **9. `express.json()` sans limite de taille** ✅ **Corrigé** — `{ limit: '1mb' }`.
- [x] **10. En-têtes de sécurité** ✅ **Corrigé** — `helmet` activé (X-Frame-Options, nosniff, Referrer-Policy…). ⏳ **CSP désactivée** pour l'instant (le front utilise des `onclick`/styles inline ; activer une CSP stricte nécessite de les externaliser).
- [ ] **11. Token Bearer en `localStorage`** (exfiltrable par XSS) — ⏳ **différé** : migration vers cookie `httpOnly`+`Secure` invasive (modifie tout le flux auth + SSE). Risque réduit par S5 (XSS sanitizé).
- [ ] **12. HMAC du token non vérifié au lookup de session** (`findSession` = comparaison de chaîne) — ⏳ **différé** : `generateToken()` signe bien les tokens, mais `findSession()` retrouve encore la session par égalité exacte avec le token stocké. Activer `verifyToken()` dans ce flux invaliderait les sessions existantes → déconnexion. Faible valeur immédiate (tokens déjà aléatoires + stockés côté serveur).
- [x] **13. Comparaisons non constant-time** ✅ **Corrigé** — `crypto.timingSafeEqual` dans `verifyPassword`.
- [ ] **14. `fileFilter` par extension uniquement** — ⏳ **différé** : vérification par magic bytes (nécessite une lib type `file-type`). Risque faible.
- [x] **16. Propriété des sessions OpenCode (IDOR)** — `opencode-bridge.js` + `server.js` ✅ **Corrigé** (revue du 19/06/2026)
  `POST /api/opencode/input` ne vérifiait que l'**existence** de la session (`hasSession`), pas son **propriétaire** : tout utilisateur authentifié pouvait reprendre/injecter dans la session d'un autre et lire son flux SSE. Ajout d'une map `sessionOwners` (bridgeSessionId → userId) renseignée au lancement (`/run` passe `userId`), et d'un garde `ownsSession(sessionId, req.user.id)` sur `/input` (404 si non-propriétaire, pour ne pas révéler l'existence). Sans effet en local mono-utilisateur.
- [x] **17. DOMPurify : dépendance CDN + fail-open** — `index.html` + `app.js` ✅ **Corrigé** (revue du 19/06/2026)
  marked + DOMPurify étaient chargés depuis un **CDN tiers** et `renderMarkdown` retombait sur le **HTML brut** si DOMPurify était absent (sanitizer KO en cas de blocage réseau/offline → S5 contournée silencieusement). Corrigé : libs **vendorisées en local** (`public/vendor/`, dépendance npm `dompurify`) et `renderMarkdown` désormais **fail-closed** (si marked/DOMPurify manquent → texte échappé via `escHtml`, jamais de HTML brut).
- [ ] **23. Traversal de catégorie sur `/api/files/list`** — `interface/routes/files.js` 🟡 **À corriger**
  `GET /api/files/list?category=...` utilise `category` sans whitelist, contrairement à `/upload`, `/view` et `/delete`. Cela peut permettre de lister des fichiers hors catégories prévues sous `users/{id}` via des segments comme `..` ou des sous-chemins. Correctif : appliquer la même whitelist `['echantillons', 'idees', 'ressources']` et refuser toute autre valeur.

---

## État

- ✅ **Faits :** 1, 2, 3, 15 (anciens bloquants) · 4, 5, 6, 7, 16, 17 · 8, 9, 10, 13
- 🔴 **Bloquants ouverts :** 18 (path traversal logs), 19 (logs non isolés)
- 🟠 **À corriger avant beta multi-utilisateur :** 20 (projets globaux), 21 (OpenCode permissions larges), 22 (XSS noms projets/fichiers)
- ⏳ **Différés / durcissements :** 11 (cookie httpOnly), 12 (HMAC token au lookup), 14 (magic bytes), 23 (whitelist catégorie files/list)

**État actuel : usage local de confiance uniquement.** Les correctifs précédents restent utiles, mais la repasse du
19/06/2026 a identifié deux nouveaux bloquants critiques (S18/S19) et trois risques élevés
liés au multi-utilisateur (S20-S22). Ne pas ouvrir à des beta-testeurs tiers avant traitement.
