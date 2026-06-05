# AgentIA-Ecriture — Template

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Pipeline d'écriture assistée par IA orchestré par des agents spécialisés via **OpenCode**. Romans, recueils de poésie, essais, théâtre, nouvelles, textes courts (flash/micro/vignette) et mémoires/thèses.

## Description

**AgentIA-Ecriture** est un système multi-agents où chaque texte est rédigé itérativement via une chaîne de rôles spécialisés : un orchestrateur planifie et coordonne, un écrivain/poète rédige, un éditeur relit et valide, un scribe observe et capitalise. En fin de projet, un auditeur vérifie la cohérence globale et un agent-style alimente les *skills* — des blocs de connaissances réutilisables.

Le projet utilise **DeepSeek v4 Flash** comme modèle de langage, configuré dans OpenCode.

## Guide de démarrage

1. **Forker / cloner** ce template
2. Configurer `opencode.json` (modèle, clé API)
3. Lancer `/nouveau-roman`, `/nouveau-recueil`, etc.
4. Suivre le workflow : plan → écriture → relecture → scribe → validation

Tous les agents, leurs instructions et leurs workflows sont définis dans `.opencode/`.

## Structure

```
AgentIA-Ecriture/
├── .opencode/
│   ├── agent/            # 28 agents (7 orchestrateurs + 21 sous-agents)
│   └── skills/           # 21 skills empilables
├── projets/              # [Vos projets ici]
├── knowledge/            # Base partagée
│   ├── global.md         # Principes transverses
│   ├── style.md          # Signature stylistique
│   └── ...
├── _scripts/             # Utilitaires (convert-to-pdf.ps1)
├── opencode.json         # Configuration agents & commandes
├── AGENTS.md             # Documentation exhaustive des agents et workflows
└── README.md
```
