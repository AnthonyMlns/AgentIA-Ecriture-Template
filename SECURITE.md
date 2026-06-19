# Sécurité — failles à corriger avant mise en ligne

> Audit du 19/06/2026 (interface web Node/Express dans `interface/`).
> **L'app est conçue pour un usage local mono-utilisateur. Elle n'est PAS prête pour une exposition publique.**
> Les points 🔴 sont des bloquants absolus avant tout déploiement ou ouverture à des tiers.

**Point positif :** `data/`, `users/`, `.env`, `interface/logs/` sont bien dans `.gitignore` — aucun secret ni mot de passe utilisateur n'est suivi par git. Le risque n'est pas le contenu poussé, mais l'application une fois exposée.

---

## 🔴 Critique — bloquant avant toute mise en ligne

- [ ] **1. Compte admin par défaut `admin` / `admin`** — `interface/auth.js:428-434`
  Au premier démarrage, `admin@agentia.local` / `admin` (rôle `admin`) est créé automatiquement. Template public → prise de contrôle totale immédiate.
  → Forcer un mot de passe via variable d'env, ou bloquer le login tant que le mot de passe par défaut n'a pas été changé.

- [ ] **2. Injection de commande shell** — `interface/server.js:685`
  ```js
  execSync(`"${pandocPath}" "${mdPath}" -o "${pdfPath}" --pdf-engine=pdfhtml 2>&1`)
  ```
  `nom` (segment d'URL) est interpolé dans une commande shell. Un nom de projet contenant `"` `;` `$()` `` ` `` permet l'exécution de commandes arbitraires sur l'hôte.
  → Utiliser `execFileSync(pandocPath, [mdPath, '-o', pdfPath, ...])` (pas de shell).

- [ ] **3. Endpoints sensibles SANS authentification** — `interface/server.js:275-286`
  Le middleware `/api` est en *auth optionnelle* : sans token, la requête passe quand même. Sont donc publics :
  - `POST /api/opencode/run` → lance des processus `opencode` (consomme les crédits API, écrit des fichiers), sans contrôle ni quota
  - `POST /api/opencode/input` → injecte du texte dans le stdin de sessions actives
  - `GET /api/projets/...`, `/api/knowledge/...`, `/api/logs/...` → lecture de tout le contenu et des logs de sessions
  → Appliquer `auth.authMiddleware` sur ces routes (a minima `opencode/run|input` et `logs`).

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
