# Knowledge Global — Principes d'écriture (tous genres)

> Base de connaissances générique pour tous les projets d'écriture.
> Mise à jour : 31/05/2026

---

## Index des fichiers de référence

| Fichier | Périmètre |
|---|---|
| `global.md` (ce fichier) | Principes transverses — tous genres |
| `style.md` | Signature stylistique de l'auteur — tous genres |
| `global-poesie.md` | Principes spécifiques à la poésie |
| `style-poesie.md` | Techniques stylistiques pour la poésie |
| `analyse-style-utilisateur.md` | Analyse complète des échantillons utilisateur |
| `rex-template.md` | Template REX — à copier dans `[Projet]/notes/rex.md` |

Pour les principes spécifiques à un genre, consulter le fichier global dédié ET le skill correspondant.

---

## Principes fondamentaux

### 1. Architecture d'un projet
- Un projet = 1 dossier dédié sous `projets/romans/` ou `projets/poesie/`.
- 2 fichiers racines : `bible.md` (structure, plan) et `bd-connaissances.md` (décisions, univers, évolutions).
- Les textes produits : dans `chapitres/` (roman) ou `sections/` (poésie), avec brouillons et avis éditeur à côté.
- Les notes d'agents : dans `notes/` (observations scribe, REX, analyse-style, audit).
- Les versions finales : dans `versions/`.

### 2. La boucle d'écriture
Chaque unité de texte (chapitre ou section) suit le cycle : **Plan → Écriture → Relecture → Scribe → Décision**.

Le workflow complet et ses règles sont définis dans `AGENTS.md` (chargé automatiquement). Les orchestrateurs de genre n'en documentent que leurs spécificités.

### 3. Séparation des rôles
- L'orchestrateur décide du **quoi** : plan, structure, contenu à couvrir. Il ne rédige jamais lui-même.
- L'écrivain/poète décide du **comment** : ton, phrasé, choix créatifs. Il ne valide jamais lui-même.
- L'éditeur juge la qualité. Il ne réécrit jamais lui-même.
- Le scribe observe sans intervenir. Il ne corrige jamais, ne donne pas d'avis.

### 4. Gestion des itérations
- Si un texte est refusé, retour à l'écrivain avec les retours précis de l'éditeur.
- Maximum 3 cycles par unité (au-delà, intervention directe de l'orchestrateur).
- Chaque avis éditeur est sauvegardé dans un fichier dédié (pas en ligne dans le texte).

### 5. Le brouillon est obligatoire
- Le brouillon documente les hésitations, les alternatives envisagées, le choix retenu et pourquoi.
- Un brouillon vide ou trop lisse est refusé — l'hésitation fait partie du processus créatif.
- Le brouillon est lu par le scribe et par l'agent-style : c'est une matière précieuse.

### 6. Pipeline d'apprentissage
Le projet améliore les skills en continu via trois étapes :

```
Scribe (observations.md + propositions-skills.md)
  → Agent-style (consolide, détecte les motifs, applique)
    → Skills (amendés avec les leçons du projet)
```

Ce pipeline est l'investissement à long terme du système : chaque projet rend le suivant meilleur.

---

## Workflow générique (fin de projet)

1. **REX** — collecte des retours de tous les agents, remplissage de `rex.md`, amendement des skills
2. **Triage des notes** — classement des observations scribe dans `knowledge/notes/`
3. **Relecture utilisateur** — l'utilisateur relit l'ensemble avant l'audit
4. **Audit de cohérence** — appel à `auditeur` pour vérifier l'ensemble du projet
5. **Corrections** — chaque correction est vérifiée sur toutes les unités suivantes (impacts transverses)
6. **Defocus / Polish** — relecture de détail : noms, dates, objets, cohérence matérielle
7. **Livrables** — génération des PDFs dans `[Projet]/notes/` et `[Projet]/versions/`
8. **Validation finale** — le projet est marqué terminé

---

## Anti-patterns à éviter (tous genres)
- ✗ Écrire sans plan préalable
- ✗ Laisser un agent valider son propre travail
- ✗ Brouillon vide ou générique — l'hésitation créative est une donnée, pas une faiblesse
- ✗ Modifier un texte validé sans le repasser par l'éditeur
- ✗ Sauter le scribe — sans lui, les apprentissages du projet sont perdus
- ✗ Sauter le REX — sans lui, les leçons ne rejoignent pas les skills
- ✗ Appliquer une correction sans vérifier son impact sur les unités suivantes
