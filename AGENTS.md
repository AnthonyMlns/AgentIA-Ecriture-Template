# Projet AgentIA-Ecriture

Pipeline d'écriture assistée par IA : romans, recueils de poésie, et plus. Orchestré par des agents spécialisés.

## Moteur d'exécution

Ce projet fonctionne sur **OpenCode** — configuration dans `opencode.json` + `.opencode/`, modèle DeepSeek v4 flash.

---

## Architecture

### Orchestrateurs (agents principaux)

| Agent | Commande | Rôle |
|---|---|---|
| **orchestrateur** | *(défaut)* | Point d'entrée, commandes transverses, orientation genre |
| **orchestrateur-roman** | `/nouveau-roman` | Gère un roman de A à Z |
| **orchestrateur-poesie** | `/nouveau-recueil` | Gère un recueil de A à Z |
| **orchestrateur-theatre** | `/nouveau-theatre` | Gère une pièce de théâtre de A à Z |
| **orchestrateur-essai** | `/nouveau-essai` | Gère un essai de A à Z |
| **orchestrateur-nouvelle** | `/nouveau-nouvelle` | Gère une nouvelle de A à Z |
| **orchestrateur-texte-mobile** | `/nouveau-texte-mobile` | Gère un recueil de textes courts (flash, micro, vignette) de A à Z |
| **orchestrateur-universitaire** | `/nouveau-universitaire` | Gère un mémoire / thèse / article académique de A à Z |

> Pour ajouter un nouveau genre, copier `TEMPLATE-ORCHESTRATEUR.md`, remplir les placeholders, ajouter dans `opencode.json`.

### Agents roman

| Agent | Type | Rôle |
|---|---|---|
| **ecrivain-roman** | Sous-agent | Rédige les chapitres + brouillon de ses choix |
| **editeur-roman** | Sous-agent | Relit, valide ou refuse chaque chapitre |

### Agents poésie

| Agent | Type | Rôle |
|---|---|---|
| **ecrivain-poesie** | Sous-agent | Rédige les poèmes + brouillon de ses choix |
| **editeur-poesie-traditionnelle** | Sous-agent | Évalue rythme, rime, forme, images — grille classique |
| **editeur-poesie-contemporaine** | Sous-agent | Évalue musicalité, images, émotion, économie — grille moderne |

### Agents théâtre

| Agent | Type | Rôle |
|---|---|---|
| **ecrivain-theatre** | Sous-agent | Rédige les scènes + brouillon de ses choix |
| **editeur-theatre** | Sous-agent | Relit, valide ou refuse chaque scène |

### Agents essai

| Agent | Type | Rôle |
|---|---|---|
| **ecrivain-essai** | Sous-agent | Rédige les chapitres + brouillon de ses choix |
| **editeur-essai** | Sous-agent | Relit, valide ou refuse chaque chapitre |

### Agents nouvelle

| Agent | Type | Rôle |
|---|---|---|
| **ecrivain-nouvelle** | Sous-agent | Rédige les récits + brouillon de ses choix |
| **editeur-nouvelle** | Sous-agent | Relit, valide ou refuse chaque récit |

### Agents texte mobile

| Agent | Type | Rôle |
|---|---|---|
| **ecrivain-texte-mobile** | Sous-agent | Rédige les textes courts + brouillon de ses choix |
| **editeur-texte-mobile** | Sous-agent | Relit, valide ou refuse chaque texte |

### Agents universitaire

| Agent | Type | Rôle |
|---|---|---|
| **ecrivain-universitaire** | Sous-agent | Rédige les chapitres + brouillon de ses choix |
| **editeur-universitaire** | Sous-agent | Relit, valide ou refuse chaque chapitre |

### Agents transverses (tous genres)

| Agent | Type | Rôle |
|---|---|---|
| **scribe** | Sous-agent | Observe, capture les éléments remarquables dans un journal continu |
| **auditeur** | Sous-agent | Vérifie la cohérence globale du projet complet en fin de parcours |
| **agent-style** | Sous-agent | Analyse échantillons + notes scribe → signatures stylistiques → skills |
| **skill-manager** | Sous-agent | Maintient la qualité des skills — conformité template, REX, cohérence, alertes menaces |

## Structure du projet — Chemins des agents

```
AgentIATest/
  opencode.json              # Configuration agents et commandes
  AGENTS.md                  # Ce fichier
  README.md                  # Documentation utilisateur (statuts, roadmap, PDFs)

  # === SCRIPTS UTILITAIRES ===
  _scripts/
    convert-to-pdf.ps1       # Conversion Markdown → PDF (pandoc + Edge headless)

  # === RÉFÉRENCES PARTAGÉES (tous projets) ===
  knowledge/
    global.md                # Principes transverses — tous genres
    style.md                 # Signature stylistique de l'auteur — tous genres
    global-poesie.md         # Principes spécifiques à la poésie
    style-poesie.md          # Techniques stylistiques pour la poésie
    rex-template.md          # Template REX → copié dans [Projet]/notes/rex.md
    analyse-style-utilisateur.md  # Signature de l'auteur — agent-style
    notes/                   # Buffer de notes triées par catégorie
      style/
      scenes/
      idees/
      univers/
      personnages/
      formes/

  # === ÉCHANTILLONS UTILISATEUR (input seulement) ===
  echantillons/              # Textes bruts fournis par l'utilisateur

  # === PROJETS ===
  projets/
    romans/
      Pluralites-Roman/        # Structure de référence pour tout roman
        bible.md
        bd-connaissances.md
        chapitres/
          chapitre-01.md       # Texte du chapitre
          brouillon-01.md      # Brouillon de l'écrivain (hésitations, choix)
          avis-editeur-ch01.md # Avis de l'éditeur
          _citations-utilisees.md  # Référentiel des citations actives
        notes/
          observations.md      # Scribe — journal de bord continu
          propositions-skills.md  # Scribe → propositions d'amendement des skills
          analyse-style.md     # Agent-style — analyse stylistique du projet
          rex.md               # REX du projet
        versions/
        ressources/

    theatre/
      Ma-Piece/                # Structure de référence pour toute pièce
        bible.md
        bd-connaissances.md
        scenes/
          scene-01.md
          brouillon-01.md
          avis-editeur-sc01.md
          _citations-utilisees.md
        notes/
          observations.md
          propositions-skills.md
          analyse-style.md
          rex.md
        versions/
        ressources/

    essais/
      Mon-Essai/               # Structure de référence pour tout essai
        bible.md
        bd-connaissances.md
        chapitres/
          chapitre-01.md
          brouillon-01.md
          avis-editeur-ch01.md
          _citations-utilisees.md
        notes/
          observations.md
          propositions-skills.md
          analyse-style.md
          rex.md
        versions/
        ressources/

    nouvelles/
      Mon-Recueil/             # Structure de référence pour tout recueil de nouvelles
        bible.md
        bd-connaissances.md
        recits/
          recit-01.md
          brouillon-01.md
          avis-editeur-r01.md
          _citations-utilisees.md
        notes/
          observations.md
          propositions-skills.md
          analyse-style.md
          rex.md
        versions/
        ressources/

    textes-mobiles/
      Mon-Recueil/             # Structure de référence pour tout recueil de textes courts
        bible.md
        bd-connaissances.md
        textes/
          texte-01.md
          brouillon-01.md
          avis-editeur-t01.md
          _citations-utilisees.md
        notes/
          observations.md
          propositions-skills.md
          analyse-style.md
          rex.md
        versions/
        ressources/

    universitaire/
      Mon-Projet/              # Structure de référence pour tout mémoire / thèse
        bible.md
        bd-connaissances.md
        chapitres/
          chapitre-01.md
          brouillon-01.md
          avis-editeur-ch01.md
          _citations-utilisees.md
        notes/
          observations.md
          propositions-skills.md
          analyse-style.md
          rex.md
        versions/
        ressources/

    poesie/
      Mon-Recueil/             # Structure de référence pour tout recueil
        bible.md
        bd-connaissances.md
        sections/
          section-01.md
          brouillon-01.md
          avis-editeur-section-01.md
          _citations-utilisees.md
        notes/
          observations.md
          propositions-skills.md
          analyse-style.md
          rex.md
        versions/
        ressources/

  # === AGENTS (définitions des rôles) ===
  .opencode/
    agent/
      orchestrateur.md              # Racine — point d'entrée, commandes transverses
      orchestrateur-roman.md        # Orchestrateur roman
      orchestrateur-poesie.md       # Orchestrateur poésie
      orchestrateur-theatre.md      # Orchestrateur théâtre
      orchestrateur-essai.md        # Orchestrateur essai
      orchestrateur-nouvelle.md     # Orchestrateur nouvelle
      orchestrateur-texte-mobile.md # Orchestrateur texte mobile
      orchestrateur-universitaire.md # Orchestrateur universitaire
      TEMPLATE-ORCHESTRATEUR.md     # Template pour tout nouveau genre
      ecrivain-roman.md
      editeur-roman.md
      scribe.md
      auditeur.md
      agent-style.md
      ecrivain-poesie.md
      editeur-poesie-traditionnelle.md
      editeur-poesie-contemporaine.md
      ecrivain-texte-mobile.md
      editeur-texte-mobile.md
      ecrivain-universitaire.md
      editeur-universitaire.md
    skills/
      ecriture-romanesque/
      roman-espionnage/
      roman-romance/
      roman-litteraire/
      poesie-contemporaine/
      poesie-prose/
      poesie-symbolique/
      poesie-classique/
      poesie-lyrique/
      poesie-engagee/
      poesie-madrigal-contemporain/
      ecriture-theatrale/
      ecriture-essai-litteraire/
      nouvelle-litteraire/
      ecriture-hybride/
      ecriture-carnet-journal/
      ecriture-epique/
      flash-fiction/
      micro-nouvelle/
      vignette-prose/
      ecriture-universitaire/
      TEMPLATE-SKILL.md               # Template pour tout nouveau skill
  knowledge/
    comptage-syllabique.md            # Guide factorisé (e muet, diérèse, vérification)
```

## Workflow d'écriture (par chapitre / section)

> **Source canonique.** Ce workflow est la référence unique pour la boucle générique. Les orchestrateurs de genre n'en documentent que leurs agents, livrables et règles spécifiques.

| Étape | Qui | Ce qui se passe |
|---|---|---|
| **1. Plan** | Orchestrateur | Consulte bible + base, définit le contenu, assigne un skill |
| **2. Écriture** | Écrivain / Poète | Rédige le texte + un brouillon honnête (hésitations, choix raisonnés) |
| **3. Relecture** | Éditeur | Évalue selon sa grille (OK/ANOMALIE/REFUS), rédige l'avis |
| **4. Scribe** | Scribe | Observe, extrait les éléments remarquables → `process/observations.md` + `process/propositions-skills.md` |
| **5. Décision** | Orchestrateur | Refus → retour à l'écrivain. Validation → unité suivante |

Les agents, livrables et règles spécifiques (quel éditeur, quel skill, quelle limite de cycles) sont dans les fichiers orchestrateurs de genre.

## Workflow de finalisation (fin de projet)

1. **REX** — collecte des retours, remplissage de `rex.md`, amendement des skills. Obligatoire.
2. **Triage** — classement des observations scribe dans `knowledge/notes/`
3. **Relecture utilisateur** — l'utilisateur relit l'ensemble
4. **Audit** — appel à `auditeur` (cohérence narrative, stylistique, thématique, matérielle)
5. **Corrections** — avec vérification des impacts transverses
6. **Polish** — defocus sur noms, dates, objets, preuves matérielles
7. **Livrables** — PDFs dans `process/` et `versions/`
8. **Validation finale** — le projet est marqué terminé

## Règles d'or

- L'orchestrateur ne rédige jamais. L'orchestrateur ne juge jamais.
- Chaque texte doit être relu par l'éditeur avant validation.
- Le brouillon doit être honnête — un brouillon vide est refusé.
- Le scribe est **obligatoire** — pas d'exception, pas de cycle sans scribe.
- Le REX est **obligatoire** en fin de projet — étape de clôture, pas une option.
- **`/amender-skills` est déclenché par `/rex`** — ne jamais clore un projet sans que `agent-style` ait appliqué les propositions du scribe aux skills.
- La cohérence des preuves matérielles entre unités est sacrée.
- Les skills sont empilables (voir section ci-dessous).

## Maturité des skills

Chaque SKILL.md porte dans son frontmatter un champ `maturité` qui indique le degré de validation du skill :

| Valeur | Sens | Implication |
|---|---|---|
| `testé` | Passé par un projet pipeline complet (écrivain + éditeur + scribe + REX) | Fiable, éprouvé en conditions réelles |
| `ancré` | Enrichi à partir d'échantillons réels de l'auteur, mais jamais exécuté en projet pipeline | Crédible mais non éprouvé par le cycle complet |
| `spéculatif` | Squelette théorique, jamais éprouvé ni ancré | À utiliser avec prudence — peut produire un texte formulaire |

Règles :
- Tout nouveau skill (copié depuis `TEMPLATE-SKILL.md`) naît `spéculatif`.
- La promotion `spéculatif → ancré → testé` se fait au REX (`agent-style` / `skill-manager` met à jour le champ en même temps que le bloc REX).
- **L'orchestrateur avertit l'utilisateur** quand il s'apprête à lancer un projet sur un skill `spéculatif` : « Le skill X n'a jamais été éprouvé sur un projet complet. Continuer, ou choisir un skill `testé` proche ? »

## Empilage des skills

Plusieurs skills peuvent s'appliquer à un même projet. L'orchestrateur les transmet à l'écrivain/poète dans ses instructions :

```
Skills actifs : roman-espionnage + roman-litteraire
- roman-espionnage : ambiance Le Carré, tension, dialogues elliptiques
- roman-litteraire : profondeur psychologique, prose soignée
```

Règles d'empilage :
- L'écrivain/poète lit les SKILL.md de **tous** les skills actifs avant de rédiger.
- En cas de conflit entre deux principes, le **premier skill listé est prioritaire**.
- L'éditeur applique les critères pertinents des deux skills (union des grilles).
- Le scribe note quel skill a dominé et pourquoi.

Exemples de combinaisons valides :
- `roman-espionnage` + `roman-litteraire` — espionnage avec profondeur psychologique
- `poesie-contemporaine` + `poesie-prose` — vers libres avec passages en prose
- `roman-romance` + `roman-litteraire` — romance à ambitions littéraires
- `flash-fiction` + `vignette-prose` — mix de formes pour un recueil texte-mobile
- `ecriture-universitaire` + `ecriture-essai-litteraire` — mémoire au croisement de la recherche et de la littérature

---

## Commandes

| Commande | Agent | Description |
|---|---|---|
| `/nouveau-roman <idée>` | `orchestrateur-roman` | Démarre un nouveau roman |
| `/nouveau-recueil <idée>` | `orchestrateur-poesie` | Démarre un nouveau recueil de poésie |
| `/nouveau-theatre <idée>` | `orchestrateur-theatre` | Démarre une nouvelle pièce de théâtre |
| `/nouveau-essai <idée>` | `orchestrateur-essai` | Démarre un nouvel essai |
| `/nouveau-nouvelle <idée>` | `orchestrateur-nouvelle` | Démarre un nouveau recueil de nouvelles |
| `/nouveau-texte-mobile <idée>` | `orchestrateur-texte-mobile` | Démarre un recueil de textes courts (flash/micro/vignette) |
| `/nouveau-universitaire <sujet>` | `orchestrateur-universitaire` | Démarre un mémoire / thèse / article académique |
| `/statut` | `orchestrateur` | Affiche l'avancement du projet en cours |
| `/relire <chapitre\|section>` | `orchestrateur` | Force une relecture |
| `/trier-notes` | `orchestrateur` | Trie les notes du scribe dans knowledge/notes/ |
| `/rex` | `orchestrateur` | Déclenche la boucle REX de fin de projet (inclut `/amender-skills`) |
| `/amender-skills` | `orchestrateur` | Lance `agent-style` sur le projet courant — consolide `propositions-skills.md`, amende les skills |
| `/verifier-skills` | `orchestrateur` | Lance `skill-manager` — audit de conformité de tous les skills (template, REX, cohérence, alertes menaces) |
| `/rex-skill-manager` | `orchestrateur` | Lance `skill-manager` en fin de cycle — REX sur les skills utilisés, mise à jour des REX blocks, détection des menaces |
