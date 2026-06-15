# AgentIA-Ecriture — Template

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Pipeline d'écriture assistée par IA orchestré par des agents spécialisés via **OpenCode**. Romans, recueils de poésie, essais, théâtre, nouvelles, textes courts (flash/micro/vignette) et mémoires/thèses.

Ce dépôt est le **template** du système AgentIA-Ecriture : toute la structure, les agents et les skills, sans les textes écrits. Parfait pour démarrer votre propre projet d'écriture assistée.

## Description

**AgentIA-Ecriture** est un système multi-agents où chaque texte est rédigé itérativement via une chaîne de rôles spécialisés : un orchestrateur planifie et coordonne, un écrivain/poète rédige, un éditeur relit et valide, un scribe observe et capitalise. En fin de projet, un auditeur vérifie la cohérence globale et un agent-style alimente les *skills* — des blocs de connaissances réutilisables qui font mémoire des choix stylistiques et des apprentissages.

Le projet utilise **DeepSeek v4 Flash** comme modèle de langage, configuré dans OpenCode. Tous les agents, leurs instructions et leurs workflows sont définis dans `.opencode/`.

## Fonctionnement

### Chaîne d'agents

1. **Orchestrateur de genre** — planifie, consulte la bible et la base de connaissances, assigne les skills, coordonne les agents, décide le *quoi* (ne rédige ni ne juge jamais)
2. **Écrivain / Poète** — rédige le texte + un brouillon honnête (hésitations, choix raisonnés)
3. **Éditeur** — évalue selon sa grille : OK / ANOMALIE / REFUS, rédige un avis circonstancié
4. **Scribe** *(obligatoire)* — observe, capture les éléments remarquables dans un journal continu, propose des amendements aux skills
5. **Décision** — refus → retour à l'écrivain ; validation → unité suivante

### Finalisation d'un projet

1. **REX** — collecte des retours, remplit `rex.md`, amende les skills
2. **Triage** — classement des observations du scribe dans `knowledge/notes/`
3. **Relecture utilisateur** — l'utilisateur relit l'ensemble
4. **Audit** — vérification cohérence narrative, stylistique, thématique et matérielle
5. **Corrections** — avec vérification des impacts transverses
6. **Polish** — defocus noms, dates, objets, preuves matérielles
7. **Livrables** — PDFs
8. **Validation finale** — projet marqué terminé

### Skills

Les **skills** sont des blocs de connaissances réutilisables (fichiers SKILL.md) dédiés à un genre, une forme ou un registre. Ils sont empilables : plusieurs skills peuvent s'appliquer à un même projet. Chaque skill porte un niveau de maturité : `testé` (éprouvé en pipeline complet), `ancré` (basé sur échantillons réels) ou `spéculatif` (squelette théorique).

22 skills disponibles (14 testés, 3 ancrés, 5 spéculatifs) : écriture romanesque, roman-espionnage, roman-romance, roman-littéraire, poésie contemporaine, poésie classique, poésie symbolique, poésie lyrique, poésie engagée, poésie de prose, poésie-madrigal-contemporain, écriture théâtrale, essai littéraire, nouvelle littéraire, flash-fiction, micro-nouvelle, vignette-prose, écriture hybride, écriture de carnet/journal, écriture épique, écriture universitaire, **composition-recueil**.

## Guide d'utilisation

### Prérequis

- [OpenCode](https://opencode.ai/) — installé et configuré
- Modèle `deepseek-v4-flash-free` (défini dans `opencode.json`)

### Commandes

| Commande | Agent | Description |
|---|---|---|
| `/nouveau-roman <idée>` | orchestrateur-roman | Démarre un nouveau roman |
| `/nouveau-recueil <idée>` | orchestrateur-poesie | Démarre un nouveau recueil de poésie |
| `/nouveau-theatre <idée>` | orchestrateur-theatre | Démarre une nouvelle pièce |
| `/nouveau-essai <idée>` | orchestrateur-essai | Démarre un nouvel essai |
| `/nouveau-nouvelle <idée>` | orchestrateur-nouvelle | Démarre un recueil de nouvelles |
| `/nouveau-texte-mobile <idée>` | orchestrateur-texte-mobile | Démarre un recueil de textes courts |
| `/nouveau-universitaire <sujet>` | orchestrateur-universitaire | Démarre un mémoire / thèse |
| `/statut` | orchestrateur | Affiche l'avancement du projet |
| `/relire <chapitre\|section>` | orchestrateur | Force une relecture |
| `/trier-notes` | orchestrateur | Classe les notes du scribe dans knowledge/notes/ |
| `/rex` | orchestrateur | Déclenche le REX de fin de projet |
| `/amender-skills` | orchestrateur | Lance agent-style → consolide les skills |
| `/verifier-skills` | orchestrateur | Audit de conformité des skills |
| `/rex-skill-manager` | orchestrateur | REX sur les skills + mise à jour |

Workflow complet documenté dans `AGENTS.md`.

## Architecture

### Structure du dépôt

```
AgentIA-Ecriture/
├── .opencode/
│   ├── agent/            # 28 agents (7 orchestrateurs + 21 sous-agents)
│   └── skills/           # 22 skills empilables
├── projets/
│   ├── romans/           # [Vos projets de romans]
│   ├── essais/           # [Vos projets d'essais]
│   ├── nouvelles/        # [Vos projets de nouvelles]
│   ├── poesie/           # [Vos recueils de poésie]
│   ├── theatre/          # [Vos pièces de théâtre]
│   ├── textes-mobiles/   # [Vos recueils de textes courts]
│   └── universitaire/    # [Vos mémoires/thèses]
├── knowledge/            # Base partagée & notes triées
│   ├── notes/            # style/, scenes/, idees/, univers/, personnages/, formes/
│   ├── global.md         # Principes transverses
│   ├── style.md          # Signature stylistique de l'auteur (à personnaliser)
│   └── ...
├── echantillons/         # [Vos textes bruts — point d'entrée de l'agent-style]
├── _scripts/             # convert-to-pdf.ps1
├── opencode.json         # Configuration agents & commandes
├── AGENTS.md             # Documentation exhaustive des agents et workflows
└── README.md             # Ce fichier
```

### Structure d'un projet

Chaque projet suit un template homogène (le sous-dossier d'unité varie selon le genre : `chapitres/`, `sections/`, `textes/`, `recits/`) :

```
projets/[genre]/[Titre]/
├── bible.md              # Carte d'identité du projet
├── bd-connaissances.md   # Base de connaissances (recherches, contraintes utilisateur)
├── [unités]/             # Textes finaux + brouillons + avis éditeur + _citations-utilisees.md
├── notes/                # Observations scribe, propositions-skills, analyse-style, rex, pipeline-log
├── versions/             # Archives de versions
└── ressources/           # Références, documents annexes
```

## Pour commencer

1. **Clonez** ce dépôt (ou copiez les fichiers)
2. **Installez** [OpenCode](https://opencode.ai/)
3. **Configurez** votre modèle dans `opencode.json`
4. **Déposez** vos textes d'exemple dans `echantillons/` (optionnel — alimente l'agent-style)
5. **Personnalisez** `knowledge/style.md` et `knowledge/analyse-style-utilisateur.md` avec votre signature stylistique (ou laissez les agents les découvrir)
6. **Lancez** votre premier projet :
   - `/nouveau-roman <idée>` pour un roman
   - `/nouveau-recueil <idée>` pour un recueil de poésie
   - `/nouveau-essai <idée>` pour un essai
   - etc.

## Roadmap du template

| Version | Contenu |
|---|---|
| **v8.0** | Template initial — 22 skills, 7 genres, pipeline complet avec journal de bord, validation structurelle, parallélisation, PDF automatique |

---

Projet sous licence MIT — Libre d'utilisation, de modification et de distribution.
