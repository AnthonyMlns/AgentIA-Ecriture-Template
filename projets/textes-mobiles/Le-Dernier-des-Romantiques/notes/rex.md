# REX — Retour d'Expérience

## Projet
- **Titre** : Le Dernier des Romantiques
- **Genre** : texte mobile (recueil de textes courts)
- **Dates** : du 18/06/2026 au 18/06/2026
- **Skills utilisés** : ecriture-carnet-journal, ecriture-hybride, flash-fiction, micro-nouvelle, vignette-prose, composition-recueil

---

## 1. Ce qui a fonctionné

### Pour l'écrivain (ecrivain-texte-mobile)
- La consigne de registre (introspectif-retenu) a été parfaitement suivie sur les 5 textes — aucune dérive lyrique non sollicitée
- Le fil rouge « message jamais envoyé » a produit des variations spontanées entre les textes
- L'alternance des formes (flash → vignette → micro → flash → vignette) a évité la monotonie sans forcer la variété
- Le brouillon a documenté les hésitations de manière exemplaire, servant de matière au scribe

### Pour l'éditeur (editeur-texte-mobile)
- Grille d'évaluation flash-fiction, micro-nouvelle et vignette-prose cohérente et efficace
- Les 5 textes validés au premier passage — zéro refus
- Détection fine des anomalies (ex. image du noyé dans T01 signalée sans bloquer)

### Pour le scribe
- 30 observations produites, 5 motifs saturés (≥3 occurrences)
- Propositions-skills riches (7 amendements dont 4 promus en règles de skill)
- Détection précoce des motifs transversaux (dès le 2e texte)
- Boucle de rétroaction : l'écrivain a cité les motifs du scribe dans ses brouillons (T03-T05)

### Pour l'auditeur
- Audit validé sans réserve — cohérence narrative, stylistique, thématique et matérielle exemplaire

---

## 2. Ce qui n'a pas fonctionné

### Problèmes détectés
1. **Impossibilité de répondre aux questions pré-flight via l'interface web** — l'orchestrateur posait des questions mais stdin était en mode `ignore`. Le processus se terminait sans avoir écrit.
2. **Aucun feedback visuel « en attente de réponse »** dans le terminal de l'interface
3. **Pas de mécanisme de reprise de session** — une fois le processus terminé, impossible de continuer la conversation

### Causes identifiées
- Le bridge `opencode-bridge.js` utilisait `stdio: ['ignore', 'pipe', 'pipe']` (ligne 172), conçu pour un mode batch
- Le frontend n'avait pas de champ de saisie ni de détection d'état d'attente
- L'architecte du pipeline a conçu les orchestrateurs pour un usage CLI interactif, sans adapter le format `--json` pour l'interface web

---

## 3. Leçons pour les skills

### Skills impactés
| Skill | Ce qui change | Pourquoi |
|---|---|---|
| `flash-fiction` | Ajout : geste retenu (ni A, ni B), ellipse auditive | 5 occurrences dans le projet — technique éprouvée |
| `vignette-prose` | Ajout : séquence gestuelle comme structure, ellipse du contenu, ellipse auditive | 5 occurrences — technique éprouvée |
| `micro-nouvelle` | Ajout : geste retenu, ellipse auditive | 5 occurrences — technique éprouvée |
| `composition-recueil` | Ajout : arc conservation→destruction, coda en rupture, diglossie medium | Motifs confirmés sur recueil complet |
| `ecriture-hybride` | Promu de spéculatif à testé | Utilisé en empilage, comportement validé |

### Nouveaux principes à ajouter
- **Le geste retenu** : dans un texte court, la chute par remisage (ni destruction ni envoi) est plus puissante qu'un geste conclusif
- **L'ellipse du contenu** : ne jamais révéler le message produit plus de tension que le dévoiler
- **La diglossie medium** : alterner anglais/digital et français/analogique comme code stylistique

### Éléments à éviter
- La comparaison en « comme » dans les textes courts (signalée par l'éditeur dans T01, 1 occurrence seulement)
- Sur-explication des motifs (le scribe a alerté sur l'image du noyé dans T01)

---

## 4. Leçons pour les agents

| Agent | Ce qui change |
|---|---|
| Orchestrateur | En mode web, inclure toutes les consignes (registre, fil rouge, formes) dans le message initial pour éviter le pré-flight interactif |
| Écrivain-texte-mobile | Maintenir la pratique du brouillon détaillé — c'est une matière précieuse pour le scribe |
| Éditeur-texte-mobile | La grille actuelle est opérationnelle ; ajouter un critère « échos au recueil » pour les projets multi-textes |
| Scribe | Le seuil de saturation à 3 occurrences est pertinent ; le score d'alerte (≥6) est trop sensible pour un recueil de 5 textes — remonter à ≥10 |

---

## 5. Leçons pour les grilles d'édition

| Grille | Nouveau critère | Description |
|---|---|---|
| `editeur-texte-mobile` | Échos au recueil | Le texte s'intègre-t-il sans se répéter ? Apporte-t-il une variation ? |
| `editeur-texte-mobile` | Progression | En milieu/fin de recueil, le texte fait-il avancer l'arc général ? |

---

## 6. Observations du scribe

(30 observations détaillées dans `notes/observations.md`)

**Synthèse :** 5 motifs saturés (geste retenu, structure gestuelle, ellipse du contenu, diglossie medium, ellipse auditive), 1 motif confirmé (écho textuel large), 3 semi-confirmés, 7 à trier.

---

## 7. Pistes pour le prochain projet

1. **Systématiser les nouveaux champs** registre + fil rouge dans le formulaire de création de projet
2. **Capitaliser les 4 skills promus** (flash-fiction, vignette-prose, micro-nouvelle, ecriture-hybride) en les utilisant sur un prochain recueil
3. **Explorer le registre lyrique-cosmique** (non utilisé dans ce projet) sur un prochain texte
4. **Tester la reprise de session** via le nouvel endpoint `/api/opencode/input`

---

## 8. Validation

- [x] REX intégré dans les skills concernés (via agent-style)
- [x] REX intégré dans la bd-connaissances du projet
- [ ] Notes du scribe triées dans knowledge/notes/
- [ ] Projet marqué comme terminé

---
*Date du REX :* 18/06/2026
*Rédigé par :* Orchestrateur
