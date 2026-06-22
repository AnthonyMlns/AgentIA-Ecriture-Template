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
| ~~S15~~ | ✅ Fait | XSS stocké `name`/`email` panneau admin → `escHtml` + `cleanName` | `interface/public/app.js` |
| ~~S16~~ | ✅ Fait | Propriété des sessions OpenCode (IDOR) → `ownsSession` | `opencode-bridge.js` + `server.js` |
| ~~S17~~ | ✅ Fait | DOMPurify vendorisé en local + `renderMarkdown` fail-closed | `index.html` + `app.js` |
| S11/S12/S14 | ⏳ Différé | cookie httpOnly, HMAC token, magic bytes (faible risque / invasif) | — |

**État :** S1-S10, S13, S15-S17 faits (dont la revue du 19/06/2026). Plus aucun bloquant. Restent 3 durcissements optionnels (S11/S12/S14) avant ouverture publique large.

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

## Étape 0.7 — Génération longue (recueils multi-sections)

> Contexte : un recueil de 5 poèmes générés en un seul run dépassait le plafond
> fixe de 10 min et était coupé en plein 2ᵉ poème (socket SSE fermé → abort).

**✅ Fait — timeout d'inactivité au lieu d'un plafond global :**
- `opencode-bridge.js` : watchdog **réarmé à chaque event** opencode (`armWatchdog`).
  Ne coupe que sur un silence réel (~10 min, ≈ « 10 min par section »).
  Surchargeable via `OPENCODE_IDLE_TIMEOUT_MS`.
- `server.js` : **heartbeat SSE** (`: keepalive` toutes les 20 s) + `req.setTimeout(0)`
  → plus de fermeture du socket à 10 min ; la durée de vie suit le watchdog.

**⏳ À faire (plus robuste, option B) — génération incrémentale :** l'orchestrateur
produit **une section par run**, le front enchaîne automatiquement. Supprime les
connexions SSE très longues (fragiles derrière un proxy / en prod) et affiche chaque
poème dès qu'il est prêt. Cousin de l'Étape 0.6 (reprise de session).

---

## Étape 0.8 — Onboarding / calibration de l'écriture au premier lancement

> À faire **avant** d'ouvrir à des testeurs. Sans ça, l'utilisateur arrive sur une app vide,
> sans savoir quoi faire ni comment l'app connaît son style.

**Problème aujourd'hui :** l'app démarre sans échantillons, sans voix, sans aucune
configuration utilisateur. L'utilisateur doit deviner qu'il faut :
1. Déposer des textes dans `echantillons/`
2. Lancer `/analyser-voix` (via OpenCode, pas via l'interface)
3. Configurer son style dans les réglages

Rien n'est guidé, rien n'est automatique.

### Flow d'onboarding souhaité

```
Arrivée → Login → Écran de bienvenue → 1. Déposer des échantillons
→ 2. Analyser sa voix → 3. Définir ses préférences → 4. Lancer un projet
```

### Écran de bienvenue (post-login si premier projet)

| Étape | Interface | Ce qui se passe |
|---|---|---|
| **1. Dépôt d'échantillons** | Zone de drop + upload multi-fichiers (`.md`, `.txt`) | L'utilisateur glisse ses textes existants (ou une page de son carnet, un vieux poème, une nouvelle). L'interface les stocke dans `echantillons/`. |
| **2. Analyse de la voix** | Bouton « Analyser mon style » → spinner + résultat | Appelle `agent-style` via `/api/opencode/run`. Produit `knowledge/analyse-style-utilisateur.md` + un skill-voix dans `.opencode/skills/voix/`. L'UI affiche un résumé des signatures découvertes. |
| **3. Calibration fine** | Sliders + sélecteurs (registre, longueur, précision, émotion) + fil rouge | Reprend les réglages existants (page Settings) mais les présente comme une étape obligatoire, pas comme une page cachée. |
| **4. Choix d'une influence** | Sélecteur de skills influence + mini-description | L'utilisateur peut partir d'une influence littéraire (poésie symbolique, roman d'espionnage…) ou continuer en voix neutre. |
| **5. Premier projet** | Formulaire simplifié « Nouveau projet » pré-rempli avec ses choix | L'empilage (voix + influence + forme) est déjà configuré. L'utilisateur n'a plus qu'à donner un titre. |

### Checkbox « Sauter l'onboarding »

Un bouton « Je connais l'outil, passer » à l'écran de bienvenue pour les utilisateurs
qui reviennent. Visible seulement si un projet existe déjà.

### Stockage du statut d'onboarding

```
data/onboarding.json
{
  "userId": "...",
  "completed": true,         // false tant que les 5 étapes ne sont pas faites
  "echantillonsImportes": true,
  "voixAnalysee": true,
  "calibrationFaite": true,
  "influenceChoisie": false,  // optionnel — peut être sauté
  "premierProjetLance": false
}
```

Quand `completed === false` au login → rediriger vers l'écran d'onboarding au lieu du dashboard.

### Ce qu'il faut coder

| # | Fichier | Ce que ça fait |
|---|---|---|
| 0.8.1 | `interface/routes/onboarding.js` | CRUD du statut d'onboarding + endpoint pour lancer l'analyse de voix |
| 0.8.2 | `interface/public/onboarding.html` (ou vue SPA dans app.js) | Écran de bienvenue en 5 étapes |
| 0.8.3 | `app.js` | Route `/onboarding` + logique de redirection si `completed === false` |
| 0.8.4 | `server.js` | Vérifier le statut d'onboarding au login, renvoyer dans la réponse `/auth/me` |
| 0.8.5 | `agent-style` | (Déjà existant) — l'UI appelle `/api/opencode/run` avec la bonne commande |

---

## Étape 0.9 — Garde-fous éditoriaux (modération des contenus)

> **Obligatoire avant ouverture à quiconque.** Sans ça, un utilisateur peut générer
> n'importe quel contenu via le pipeline — pornographique, raciste, antisémite,
> négationniste, appel à la haine — et tu en es civilement responsable en tant
> qu'hébergeur / éditeur de la plateforme (loi LCEN en France, section 230 aux US).

**Problème :** le pipeline d'écriture n'a aucune conscience éthique. Les skills
d'influence contiennent des références à des auteurs (Césaire, Artaud) mais
rien n'empêche un utilisateur de demander un « roman de propagande nazie »
ou un « recueil de poésie pédopornographique ». L'IA générera probablement
un refus (les modèles OpenAI/Anthropic/DeepSeek ont leur propre guardrails),
mais on ne peut pas s'y fier — et juridiquement, la plateforme est en première ligne.

### Principes

1. **Pas de censure esthétique** — un roman peut être noir, violent, explicite.
   La distinction n'est pas sur le ton ou le genre, mais sur la **finalité** :
   apologie, incitation, diffusion de contenus illicites.
2. **Transparence** — l'utilisateur sait pourquoi son projet est refusé.
3. **Droit à l'erreur** — un faux positif est réversible (humain dans la boucle).

### Ce qu'il faut coder

#### Filtrage au lancement du projet

Quand l'utilisateur envoie le formulaire "Nouveau projet" (titre + synopsis),
une vérification automatique avant de transmettre à OpenCode :

| # | Fichier | Ce que ça fait |
|---|---|---|
| 0.9.1 | `interface/server.js` | Nouveau middleware `POST /api/projets/check-content` — analyse le titre + synopsis + contraintes, renvoie `{ allowed: true/false, reason: "..." }` |
| 0.9.2 | `interface/public/app.js` | Bloque l'envoi du formulaire si le check échoue, affiche un message clair |
| 0.9.3 | `interface/moderation.js` (nouveau) | Moteur de modération — liste noire de mots-clés, patterns, catégories |

#### Moteur de modération (`moderation.js`)

Deux couches :

**Couche 1 — Liste noire (rapide, automatique)**
Mots et expressions interdits dans le titre, le synopsis, les contraintes :
- Pédopornographie / mineurs
- Apologie du nazisme, fascisme, génocide
- Négationnisme (révisionnisme historique)
- Incitation à la haine raciale, religieuse, homophobe
- Terrorisme
- Violences sexuelles explicites sans contexte littéraire

```js
const BLOCKED_PATTERNS = [
  /pédophile|pédocriminalité|mineur[es]?\s*sexuel/i,
  /nazi|hitler|ss\s*[a-z]|négationnisme|révisionnisme/i,
  /génocide\s*(juif|arménien|tutsie)/i,
  /race\s*(supérieure|inférieure)|pur\s*ethnique/i,
  /apologie\s*du\s*(terrorisme|fascisme|nazisme)/i,
  // etc.
];
```

**Couche 2 — Appel à un modèle de modération (précision)**
Pour les cas limites : envoyer le synopsis à un petit modèle peu coûteux
(DeepSeek Flash) avec un prompt de classification :
```
Classifie ce synopsis de projet d'écriture. Réponds UNIQUEMENT par un JSON :
{"allowed": true/false, "reason": "...", "category": "..."}
Catégories interdites : pornographie, pédopornographie, apologie du nazisme,
racisme, antisémitisme, négationnisme, terrorisme, incitation à la haine.
Si le projet est un roman noir, érotique, ou violent MAIS dans un cadre
littéraire (pas de l'apologie), réponds allowed: true.
```

#### Pas de censure préventive sur les fichiers échantillons

Les échantillons déposés par l'utilisateur (`echantillons/`) ne sont **pas**
modérés — ce sont ses textes personnels. La modération s'applique uniquement
**au lancement d'un projet** (titre + synopsis + contraintes), parce que c'est
là que la plateforme devient active dans la génération.

#### Journalisation

Tout refus est loggé dans `data/moderation-logs.json` avec :
- `userId`, `timestamp`, `titre`, `synopsis` (tronqué)
- `raison`, `couche` (liste noire / modèle)
- `action` : `bloqué` / `signalé`

L'admin peut consulter les logs de modération dans le dashboard admin.

#### Droit de recours

Si l'utilisateur pense que son projet a été injustement bloqué :
- Bouton « Signaler un faux positif » → notification à l'admin
- L'admin peut ajouter une exception (whitelist de projet) ou ajuster les règles

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

---

## Projets en cours

| Projet | Genre | Progression | Priorité |
|---|---|---|---|
| **Chroniques de Thalmoor — T1 : Vasthaven** | Roman (fantasy mature) | 5/20 chapitres | 🔴 À finir |
| *Projets antérieurs (achevés)* | — | — | ✅ |
| Sanguinius — La Mort Retardée | Roman | 14/14 | ✅ |
| S'accorder | Essai | 7/7 | ✅ |
| Dépouillé | Essai | 9/9 | ✅ |
| Le Romantisme est Mort | Poésie | 10/10 | ✅ |
| Recueil Test | Poésie | 10/10 | ✅ |
