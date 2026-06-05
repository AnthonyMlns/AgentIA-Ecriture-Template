---
name: ecriture-romanesque
description: Utilise ce skill lorsque tu travailles sur le projet d'écriture romanesque. Il contient les conventions de mémoire, de structure et de process du projet.
maturité: testé
---

# Skill d'écriture romanesque

> **⚠️ Skill de process** : Ce skill définit le workflow d'écriture romanesque (structure, conventions, grille). Il ne contient PAS de principes stylistiques — ceux-ci sont dans les skills thématiques (roman-espionnage, roman-romance, roman-litteraire).

Ce skill définit la structure de mémoire, les conventions et les workflows du projet d'écriture de roman.
Mis à jour le 30/05/2026 suite au projet « Pluralités ».

---

## Structure des fichiers

```
AgentIA-Ecriture/
  opencode.json
  AGENTS.md
  knowledge/
    global.md                 # Principes génériques pour toutes les écritures
    style.md                  # Guide stylistique d'écriture
    notes/                    # Buffer de notes triées par l'utilisateur
      style/ scenes/ idees/ univers/ personnages/ formes/
  projets/romans/
    Pluralites-Roman/         # Un dossier par projet
      bible.md                # Bible (personnages, univers, intrigue, chapitres)
      bd-connaissances.md     # Base de connaissances (décisions, inspirations, REX)
      chapitres/              # Chapitres rédigés (brouillons + avis supprimés après REX)
        chapitre-01.md
        ...
      versions/               # Snapshots du roman complet
      notes/                  # Observations du scribe, REX, analyse-style
      ressources/             # Images, cartes, références
  .opencode/
    skills/                   # Skills roman + poésie
      ecriture-romanesque/    # Skill principal (workflow, conventions, grille)
      roman-espionnage/       # Skill roman thématique
      roman-romance/          # Skill roman thématique
      roman-litteraire/       # Skill roman thématique
      poesie-contemporaine/   # Skill poésie
      poesie-prose/           # Skill poésie
      ...
```

---

## Conventions de la bible (`[Projet]/bible.md`)

La bible du roman est structurée ainsi :

```markdown
# Bible du roman : [Titre]

## Concept
[Idée centrale du roman en 3-5 lignes]

## Personnages
### [Nom du personnage]
- **Rôle** : [protagoniste/antagoniste/secondaire]
- **Âge** : ...
- **Description** : ...
- **Personnalité** : ...
- **Arc narratif** : ...

## Univers
### Cadre spatio-temporel
- **Époque** : ...
- **Lieu principal** : ...
- **Ambiance** : ...
- **Règles particulières** : ...

## Intrigue
### Structure
- Acte 1 : ...
- Acte 2 : ...
- Acte 3 : ...

### Chapitres
- Chapitre 01 — [Titre] — [Résumé] — Statut : [à écrire / écrit / validé]
```

---

## Conventions de la base de connaissances (`projets/romans/[Titre]/bd-connaissances.md`)

```markdown
# Base de connaissances — [Titre du roman]

## Décisions d'écriture
- [Date] — [Décision prise et pourquoi]

## Décisions narratives
- [Fermeture de pistes]

## Inspirations
- [Référence / œuvre inspirante]

## Notes diverses
- [Toute information utile qui ne rentre pas dans la bible]

## Glossaire
- **[Terme]** : Définition

## REX — Retour d'expérience (ajouté en fin de projet)
### Bilan global
### REX — Agent ecrivain-roman
### REX — Agent editeur-roman
### REX — Workflow global

## Idées à explorer
- [Idée non encore utilisée]
```

---

## Règles de mise à jour

- La bible est la source de vérité. Ne la contredit jamais.
- Ajoute dans `bd-connaissances.md` toute idée émergente, décision stylistique, ou inspiration.
- Les fichiers de chapitres contiennent UNIQUEMENT le texte narratif, sans métadonnées.
- Les avis éditeur sont conservés dans des fichiers séparés (`avis-editeur-chNN.md`).
- **Principe de précaution narrative** : quand on ajoute ou modifie une scène qui change les faits établis (transaction, révélation, preuve matérielle), vérifier manuellement TOUS les dialogues et références des chapitres suivants. Lister les chapitres impactés avant d'appliquer la correction.
- **Contrainte utilisateur tardive** : quand une consigne arrive après l'écriture de certains chapitres : (1) lister tous les chapitres impactés, (2) corriger un par un en vérifiant la cohérence, (3) mettre à jour la BD connaissances avec la date, l'ancienne valeur, la nouvelle valeur et la raison.
- **Cohérence saisonnière** : vérifier systématiquement que la saison et les mois du texte correspondent à ceux de la bible. Si le texte modifie la période, mettre à jour la bible.
- **Changement de lieu documenté** : tout changement de lieu, nom de personnage ou date déjà documenté dans la bible doit être enregistré dans la BD connaissances avec la date, l'ancienne valeur, la nouvelle valeur, et la raison du changement.

---

## Workflow d'écriture (par chapitre)

### Étape 1 — Planification (Orchestrateur)
1. Consulter la bible et la base de connaissances.
2. Définir le contenu du chapitre : scènes, personnages, enjeux.
3. Mettre à jour la bible avec le résumé du chapitre et le statut « à écrire ».
4. Rédiger les instructions pour l'écrivain (format structuré recommandé ci-dessous).

### Format des instructions à l'écrivain
```markdown
## Chapitre N — [Titre]
### Contexte
[Rappel de l'état du récit et de ce qui précède]

### Scènes attendues
1. [Titre scène 1] — [Description]
2. [Titre scène 2] — [Description]
3. ...

### Contraintes
- Point de vue : [interne / externe]
- Ton : [description]
- Rythme : [lent / soutenu / alterné]
- Longueur cible : ~XXX lignes

### Éléments de continuité
- [Rappels spécifiques : noms, lieux, décisions]
```

### Étape 2 — Écriture (Écrivain)
1. Recevoir les instructions de l'orchestrateur.
2. Consulter la bible et la base de connaissances pour la cohérence.
3. Rédiger le chapitre dans `chapitre-NN.md`.
4. Respecter scrupuleusement le point de vue, le ton, les contraintes.
5. Rédiger le brouillon (`brouillon-NN.md`) en utilisant le **template structuré** suivant :

   ```markdown
   # Brouillon — [Chapitre NN — Titre]

   **Skill** : [nom]

   ## Hésitations et choix

   1. **[Hésitation 1]** — alternative A (écartée), alternative B (retenue), raison du choix.
   2. **[Hésitation 2]** — idem.
   3. **[Hésitation 3]** — idem.
   (3 à 5 hésitations documentées)

   ## Décisions stylistiques principales
   - [Pourquoi ce mot, ce geste, ce silence]

   ## Fils ouverts pour la suite
   - [Questions en suspens, pistes laissées]

   ## Vérification style
   - [Checklist du guide/style du projet — X/Y points validés]
   ```
   Un brouillon vide ou insuffisant est refusé. Le brouillon est un document méta-textuel qui permet à l'éditeur et au scribe de comprendre le processus créatif.
6. Vérifier les homophones courants avant remise : leur/leurs, murs/mets, tapis/tapas, bordereaux/borderaux, etc.
7. Retourner un résumé du chapitre à l'orchestrateur.

### Étape 3 — Relecture (Éditeur)
1. Recevoir le chapitre + les instructions de l'orchestrateur (obligatoire).
2. Consulter la bible, la base de connaissances, et les chapitres précédents.
3. Appliquer la grille d'évaluation (voir ci-dessous).
4. Rédiger l'avis dans `avis-editeur-chNN.md`.
5. Prendre une décision : VALIDÉ ou REFUSÉ.

### Grille d'évaluation de l'éditeur (standardisée)

```
1. COHÉRENCE INTERNE (bible, personnages, lieux, chronologie)  [OK / ANOMALIE / REFUS]
2. QUALITÉ STYLISTIQUE (phrase juste, pas de lourdeur,          [OK / ANOMALIE / REFUS]
   pas de cliché, pas de facilité)
3. RESPECT DES CONSIGNES (ton, longueur, contenu, skill)        [OK / ANOMALIE / REFUS]
4. STRUCTURE NARRATIVE (début, milieu, fin satisfaisants)       [OK / ANOMALIE / REFUS]
5. ORTHOGRAPHE ET GRAMMAIRE                                     [OK / ANOMALIE / REFUS]
6. RYTHME (lecture dynamique, bien équilibrée)                  [OK / ANOMALIE / REFUS]
7. VARIATION (diversité des registres, tons, respirations)      [OK / ANOMALIE / REFUS]
8. CONTRASTE (alternance entre moments tendus et relâchés,      [OK / ANOMALIE / REFUS]
   longues phrases contemplatives / phrases courtes d'action,
   dialogues / récit, temps forts / temps faibles)
9. COHÉRENCE DES PREUVES MATÉRIELLES (si ce chapitre établit    [OK / ANOMALIE / REFUS]
   un fait concret — transaction, dossier, objet, lettre,
   photographie — est-il cohérent avec ce que les chapitres
   précédents et suivants en disent ?)
```

- **0 REFUS, 0 ANOMALIE** → validé sans réserve.
- **0 REFUS, 1-2 ANOMALIES** → validé sous réserve de corrections ciblées.
- **0 REFUS, 3+ ANOMALIES** → refusé, révision nécessaire.
- **1+ REFUS** → refusé immédiatement.

### Étape 3.5 — Scribe (Obligatoire)
1. Recevoir le texte validé, le brouillon de l'écrivain et l'avis de l'éditeur.
2. Croiser les quatre sources (texte + brouillon + avis + skill) et extraire les éléments remarquables.
3. Ajouter les observations dans `notes/observations.md` et les propositions d'amendement dans `notes/propositions-skills.md`.
4. Retourner un résumé à l'orchestrateur.

### Étape 4 — Décision (Orchestrateur)
- **Si REFUS** : renvoyer à l'écrivain avec les retours précis de l'éditeur (pointer les lignes exactes).
- **Si VALIDÉ** : mettre à jour la bible (statut « validé »), passer au chapitre suivant.

### Règles d'or
- L'orchestrateur ne rédige jamais un chapitre lui-même.
- L'orchestrateur ne juge jamais la qualité lui-même.
- Les instructions de l'orchestrateur doivent être transmises à l'éditeur en même temps que le chapitre.
- Un chapitre refusé est une opportunité d'amélioration, pas un échec.

---

## Workflow de finalisation (fin de projet)

1. **REX des agents** — écrivain et éditeur rédigent un retour d'expérience structuré, remplir `notes/rex.md`.
2. **Amender les skills** (obligatoire) — appeler `agent-style` : lire `notes/propositions-skills.md` + `notes/rex.md` → consolider et appliquer aux skills concernés.
3. **Triage** — classer les observations scribe dans `knowledge/notes/`.
4. **Relecture utilisateur** — phase ouverte aux retours et suggestions.
5. **Audit** — appeler `auditeur` sur l'ensemble du roman.
6. **Corrections** — appliquer avec vérification des impacts cross-chapters.
7. **Defocus / Polish** — vérifier noms, dates, montants, objets, preuves matérielles.
8. **Livrables** — générer les PDFs :
   - **Orchestrateur** → `[Projet]/notes/rex.pdf`
   - **Éditeur** → `[Projet]/notes/avis-editeur.pdf`
   - **Auteur/Écrivain/Poète** → `[Projet]/versions/[projet]-final.pdf`
   - **Scribe** → `[Projet]/notes/observations.pdf`
9. **Cleanup** — supprimer les artéfacts de pipeline devenus inutiles :
   - `chapitres/brouillon-NN.md` — brouillons de travail (valeur capitalisée dans observations.md)
   - `chapitres/avis-editeur-chNN.md` — avis individuels (capitalisés dans `notes/avis-editeur.pdf`)
   - `notes/propositions-skills.md` — propositions déjà appliquées aux skills
   Conserver : `chapitres/chapitre-NN.md`, `bible.md`, `bd-connaissances.md`, `notes/observations.md`, `notes/rex.md`, `notes/analyse-style.md`, tous les PDFs, `versions/[projet]-final.md`.
10. **Validation finale** — annoncer le roman terminé à l'utilisateur.

### Règle PDF — Génération des livrables

Chaque agent qui produit un output final doit le convertir en PDF dans le dossier approprié du projet :
- **Orchestrateur** : après rédaction du REX, générer `rex.pdf` dans `[Projet]/notes/`
- **Éditeur** : après validation du dernier chapitre, compiler tous ses avis en `avis-editeur.pdf` dans `[Projet]/notes/`
- **Auteur** : après validation finale du texte, générer `[projet]-final.pdf` dans `[Projet]/versions/`
- **Scribe** : après tri des observations, générer `observations.pdf` dans `[Projet]/notes/`

---

## Principes stylistiques (extraits de knowledge/style.md)

- **Point de vue** : focalisation interne par défaut. Defocus en 3e personne réservé aux passages documentaires.
- **Prose sobre** : pas d'emphase, poésie par petites touches, les silences comptent.
- **Rythme** : alterner moments contemplatifs et scènes tendues.
- **Dialogues** : naturels, sous-texte, chaque personnage a sa voix.
- **Description** : sensorielle, contextuelle (filtrée par l'humeur du personnage), économique (2-3 détails précis).
- **Motifs récurrents** : tenir un registre pour éviter les tics d'écriture (ex: téléphone face contre la table).
- **Échos structurels** : une image ou une phrase peut faire écho entre le début et la fin du roman.
- **Chapitre miroir** : l'ouverture et la clôture d'un roman construites sur les mêmes gestes, objets, lieux — inversés dans le sens et l'émotion. Le lecteur reconnaît les gestes mais sent qu'ils ne sont plus les mêmes, parce que le personnage a changé entre les deux. Exemple : A1 et C2 dans *Un été* (portiques → bac → avion → hublot, inversé).
- **Structure en trois blocs (A/B/C)** : Avant / Pendant / Après. Le bloc A installe la situation, B est le corps du récit (le voyage, l'aventure, la relation), C est le retour — ce qui a changé, ce qui reste. Le bloc B est le plus long, le bloc C le plus court, créant un effet de parenthèse suspendue. Variante : bloc C peut changer de point de vue.
- **Structure amont** : pour les romans mêlant intrigue intime et danger, placer le développement de la relation personnelle avant l'intrusion de la menace. Le lecteur doit s'attacher aux personnages avant qu'ils ne soient en danger, pour que la tension fonctionne avec l'émotion.
- **Promesse silencieuse** : un premier chapitre peut ne contenir aucun événement dramatique si sa chute promet implicitement au lecteur que le drame viendra. La promesse tient par la qualité de l'écriture et l'attention au quotidien, pas par l'événement. Exemple : « Il n'y a pas de quoi en faire un drame. »
- **MacGuffin déclencheur** : tout objet volé, crime ou secret qui déclenche le récit doit avoir une résolution minimale — même en arrière-plan, mentionné dans un dialogue ou une pensée du personnage. Le lecteur n'a pas besoin de la voir, mais le personnage doit y faire référence au moins une fois pour fermer la boucle.

---

## Anti-patterns (tirés du REX)

- ✗ Valider systématiquement sans jamais refuser — un éditeur doit challenger.
- ✗ Donner des corrections vagues (« à améliorer ») — toujours pointer les lignes exactes.
- ✗ Renvoyer le fichier entier à l'écrivain pour une correction mineure — donner des instructions ciblées.
- ✗ Créer des fils narratifs sans les refermer (ex: l'homme au manteau gris).
- ✗ Les doubles twists non motivés (ex : un personnage qui se révèle agent double sans préparation). Un twist doit être préparé par des indices discrets dans au moins 2 chapitres précédents.
- ✗ Planifier des passages (defocus) sans les inclure dans les instructions de chapitre.
- ✗ Laisser l'éditeur travailler sans les instructions originales de l'orchestrateur.
- ✗ Surcharger les consignes (trop de contraintes tuent la créativité) — prévoir des zones d'autonomie.

<!-- REX Pluralités 30/05/2026 — Modifications
- Workflow chapitre + finalisation complétés
- Grille d'évaluation standardisée (9 critères OK/ANOMALIE/REFUS)
- Anti-patterns tirés du REX du projet
- Principe de précaution narrative, contrainte utilisateur tardive, cohérence saisonnière
- Principes stylistiques extraits de knowledge/style.md
-->
