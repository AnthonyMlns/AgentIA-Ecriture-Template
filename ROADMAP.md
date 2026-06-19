# Roadmap — AgentIA-Ecriture

> De l'outil local à la beta whitelist.
> Dernière mise à jour : 19/06/2026

---

## Étape 0 — Ce qui est déjà prêt

```
┌─ Fonctionnel ───────────────────────────────────────┐
│ ✔ Pipeline complet (orchestrateur → écrivain →      │
│   éditeur → scribe → auditeur)                      │
│ ✔ Interface web (dashboard, projets, skills, logs)  │
│ ✔ Auth multi-utilisateurs (register/login/logout)   │
│ ✔ Système d'invitation (codes + whitelist)          │
│ ✔ Admin dashboard (invites, whitelist, users)       │
│ ✔ Isolation complète (users/{id}/)                  │
│ ✔ Import fichiers (upload catégorisé)               │
│ ✔ Boutons Continuer / Finaliser par projet          │
│ ✔ Génération PDF (compilation automatique)          │
│ ✔ Mode démo (sidebar cachée, auth-mode)             │
└────────────────────────────────────────────────────┘
```

**Modèle utilisé actuellement :** `opencode/deepseek-v4-flash-free` (gratuit via OpenCode CLI).

---

## Étape 0.5 — Sécurité (BLOQUANT avant toute mise en ligne)

> Audit du 19/06/2026 — détail complet et références fichiers dans [`SECURITE.md`](SECURITE.md).
> L'app est aujourd'hui prévue pour un usage **local mono-utilisateur**. Ces correctifs sont
> indispensables avant tout déploiement ou ouverture à des testeurs.

```
┌─ Avant de pousser quoi que ce soit en ligne ────────┐
│ 🔴 Bloquants absolus                                │
│  1. Compte admin par défaut admin/admin             │
│  2. Injection de commande shell (execSync /finalize)│
│  3. Endpoints opencode/run, input, logs sans auth   │
└────────────────────────────────────────────────────┘
```

### À corriger

| # | Sévérité | Faille | Fichier |
|---|---|---|---|
| ~~S1~~ | ✅ Fait | ~~Admin par défaut `admin`/`admin`~~ → mot de passe env/généré | `interface/auth.js` |
| ~~S2~~ | ✅ Fait | ~~Injection shell via `nom`~~ → `execFileSync` (sans shell) | `interface/server.js` |
| ~~S3~~ | ✅ Fait* | ~~Endpoints sans auth~~ → authMiddleware sur run/input/logs/continue/finalize | `interface/server.js` |
| ~~S4~~ | ✅ Fait | Secrets persistés (env/`data/`) + clé SHA-256 | `interface/auth.js` |
| ~~S5~~ | ✅ Fait | XSS Markdown → DOMPurify (`renderMarkdown`) | `app.js` + `index.html` |
| ~~S6~~ | ✅ Fait | Path traversal (`app.param`) + auth requise sur `/api` | `interface/server.js` |
| ~~S7~~ | ✅ Fait | `.svg` retiré + `nosniff` sur `/view` | `interface/routes/files.js` |
| ~~S8~~ | ✅ Fait | rate-limit `/login`+`/register` (express-rate-limit) | `interface/routes/auth.js` |
| ~~S9~~ | ✅ Fait | `express.json({ limit: '1mb' })` | `interface/server.js` |
| ~~S10~~ | ✅ Fait* | `helmet` (CSP différée — onclick inline) | `interface/server.js` |
| ~~S13~~ | ✅ Fait | `timingSafeEqual` (verifyPassword) | `interface/auth.js` |
| S11/S12/S14 | ⏳ Différé | cookie httpOnly, HMAC token, magic bytes (faible risque / invasif) | — |

**État :** tous les bloquants 🔴 + tout le 🟠 + l'essentiel du 🟡 sont faits. Restent 3 points de durcissement optionnels (S11/S12/S14) avant une ouverture publique large.

---

## Étape 0.6 — Répondre aux questions du pré-flight (dialogue interactif) ✅ FAIT

> ✅ Implémenté et vérifié end-to-end : `/run` capture le sessionID opencode,
> `/input` reprend la session via `--session` et streame la suite (même
> sessionId conservé côté front à travers les tours).
>
> Contexte : régression depuis le fix de lancement (`stdin: 'ignore'`). Les
> orchestrateurs posent des questions en phase pré-flight, mais `sendInput()`
> écrivait dans `proc.stdin`, désormais fermé.

**Pourquoi `sendInput` ne marche plus :** garder un stdin en pipe ouvert empêche
opencode de flusher sa sortie JSON (cf. fix). Il faut donc abandonner stdin et
passer par la **reprise de session** d'opencode.

**Approche — `opencode run --session <id>` :** chaque réponse utilisateur =
une nouvelle invocation qui reprend la session existante (pas de process en
attente).

```
1. /run lance opencode → on capture le vrai sessionID opencode (champ
   event.sessionID, ex. ses_122b9f9a...) — distinct du sessionId du bridge.
2. L'agent pose une question puis s'arrête (step_finish reason=stop) → le run
   se termine proprement. Le front affiche déjà la barre de saisie (app.js:748).
3. L'utilisateur répond → POST /input { sessionId, text }.
4. Le backend relance : opencode run --session <sessionID> --format json "<text>"
   et re-streame les events.
```

### Ce qu'il faut coder

| # | Fichier | Ce que ça fait |
|---|---|---|
| 0.6.1 | `opencode-bridge.js` | Extraire/mémoriser `event.sessionID` (le vrai ID opencode) |
| 0.6.2 | `opencode-bridge.js` | Remplacer `sendInput()` (stdin) par `continueSession(id, text)` → `runCommand` avec `--session` |
| 0.6.3 | `server.js` | `/api/opencode/input` renvoie un flux SSE (comme `/run`) au lieu de `{success}` |
| 0.6.4 | `app.js` | Rebrancher la barre de saisie sur ce nouveau flux (plomberie déjà en place) |

**Bonus :** la session vivant côté opencode, le dialogue survit à un redémarrage
du serveur. À traiter en même temps que S3 (auth sur `/input`).

---

## Étape 1 — Quotas & BYOK (immédiat, ~2 jours)

Permettre à 10-15 beta-testeurs d'utiliser la plateforme sans risque financier.

### Quota gratuit (sans clé API)

| Limite | Valeur |
|---|---|
| Projets max | 3 |
| Unités par projet | 5 (chapitres / sections / textes) |
| Modèle | DeepSeek v4 Flash (free tier) |
| Coût toi | 0 EUR |
| Coût utilisateur | 0 EUR |

### Avec clé API personnelle (BYOK)

L'utilisateur colle sa clé → plus aucune limite. Ses projets passent sur son compte.

| Provider | Variable d'env | Modèle OpenCode |
|---|---|---|
| OpenAI | OPENAI_API_KEY | openai/gpt-4o |
| Anthropic | ANTHROPIC_API_KEY | anthropic/claude-3-opus |
| DeepSeek | DEEPSEEK_API_KEY | deepseek-chat |

### Ce qu'il faut coder

| # | Fichier | Ce que ça fait |
|---|---|---|
| 1.1 | auth.js + data/quotas.json | Compteur projets/unités par user |
| 1.2 | routes/quota.js | Middleware : bloque si quota dépassé |
| 1.3 | routes/auth.js | Endpoint pour enregistrer sa clé API |
| 1.4 | opencode-bridge.js | Injecter la clé dans les vars d'env du spawn |
| 1.5 | Frontend : page réglages | Champ clé API + compteur quota |
| 1.6 | Frontend : badge quota | Dans la sidebar : compteur projets |

### Résultat après Étape 1

```
Tu invites 15 personnes.
Chacun reçoit un email avec un lien d'invitation.
┌─ Sans clé : 3 projets x 5 chapitres gratuits.
├─ Avec clé : illimité, sur son compte à lui.
└─ Toi : 0 EUR déboursé, 15 retours d'expérience.
```

---

## Étape 2 — Docker & Queue (après retours beta, ~1 semaine)

Rendre l'app déployable et résiliente avant d'ouvrir plus largement.

| # | Chantier | Pourquoi | Livrable |
|---|---|---|---|
| 2.1 | **Docker** | Environnement reproductible | Dockerfile + docker-compose.yml |
| 2.2 | **Queue Redis** | Sessions asynchrones, plus de blocage | Bull + worker |
| 2.3 | **Object Store** | Fichiers sur du S3, pas sur le disque | MinIO / Scaleway |
| 2.4 | **CI/CD** | Déploiement automatique | GitHub Actions |

**Risque :** le binaire `opencode.exe` est compilé pour Windows. Sous Linux, il faudra le wrapper ou une alternative.

---

## Étape 3 — Beta whitelist (après Docker)

Ouvrir l'accès sur invitation uniquement, avec un sous-domaine ou un tunnel.

| # | Chantier | Pourquoi | Livrable |
|---|---|---|---|
| 3.1 | **Hébergement** | Serveur public | VPS ~10 EUR/mois |
| 3.2 | **Domaine** | app.tonprojet.fr | Nom de domaine + TLS |
| 3.3 | **Landing page** | Page de présentation + attente | Page statique |
| 3.4 | **Onboarding email** | Lien d'invitation automatique | Template email |
| 3.5 | **Dashboard admin** | Quotas, clés, utilisateurs | Admin enrichi |

### Profil du beta-testeur idéal

```
┌─ Cible ──────────────────────────────────────────┐
│                                                    │
│  Ecrivain amateur / semi-pro                      │
│  A l'aise avec un outil en ligne                  │
│  Accepte de donner son avis en echange            │
│  A deja un projet en tete (roman, recueil)        │
│                                                    │
│  Ne pas recruter :                                 │
│  ├─ Des gens qui veulent juste tester l'IA         │
│  └─ Des gens qui ne lisent pas les consignes       │
└────────────────────────────────────────────────────┘
```

---

## Étape 4 — Itération & passage en prod (après retours beta)

| # | Chantier | Pourquoi |
|---|---|---|
| 4.1 | **Corrections** | Bugs remontés par les beta-testeurs |
| 4.2 | **Ajustement des quotas** | 3 x 5 → à modifier selon l'usage réel |
| 4.3 | **Améliorations UX** | Ce qui a bloqué les testeurs |
| 4.4 | **Décision pricing** | Free / Pro / Studio ou BYOK-only |

---

## Schéma global

```
Juin 2026            Juillet 2026          Août 2026
─────────────────   ──────────────────   ──────────────────
                   │                    │
  [Etape 1]        │  [Etape 2]         │  [Etape 3]
  Quotas + BYOK    │  Docker + Queue    │  Beta whitelist
                   │                    │
  15 testeurs ←────┼──── retours ──────→┼──── ouverture
                   │                    │
```

---

## Synthèse — Ce que tu fais maintenant

0. **D'abord** — tu corriges les failles bloquantes S1-S3 (Etape 0.5, voir `SECURITE.md`) avant d'exposer l'app
1. **Aujourd'hui** — tu codes les quotas et le BYOK (Etape 1)
2. **Cette semaine** — tu invites 10-15 personnes sur ton serveur local ou un petit VPS
3. **Pendant la beta** — tu regardes ce qui casse, ce qui plaît, ce qui coûte
4. **Après la beta** — tu décides : Docker, pricing, ouverture publique

Le produit est déjà utilisable. Les fonctionnalités manquantes (quotas, BYOK, Docker) sont ce qui le rend **partageable sans risque**.
