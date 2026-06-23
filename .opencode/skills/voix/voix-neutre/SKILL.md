---
name: voix-neutre
description: Voix neutre — aucun présupposé esthétique. La voix de l'utilisateur émerge du processus, guidée par ses échantillons et les observations du scribe.
maturité: testé
---

# Skill — Voix neutre

> Aucune influence esthétique pré-définie. Ce skill est le point de départ quand l'utilisateur ne sélectionne pas d'influence particulière.
> La voix se construit par l'analyse des échantillons (agent-style) et les observations du scribe au fil du projet.
> Mis à jour le 21/06/2026 — enrichissement du principe d'incarnation (variante geste quotidien universel, ancrage par le concret élargi).

---

## Principes

- **Aucune esthétique pré-imposée** : le système ne suppose pas que l'utilisateur veut écrire comme Le Carré, Rimbaud ou Proust. Aucune référence littéraire n'est injectée sans avoir été validée par l'utilisateur ou extraite de ses échantillons.
- **La voix émerge, elle n'est pas choisie** : l'écrivain ne reçoit pas d'instruction de style. Il écrit selon les contraintes formelles du genre (skills `formes/`) et la voix se révèle à travers le processus. Le scribe et l'agent-style capturent les régularités qui émergent.
- **L'utilisateur comme juge** : à chaque validation d'unité, l'utilisateur peut signaler « ceci ne me ressemble pas » — l'observation est prioritaire sur toute analyse.
- **Les échantillons sont la boussole** : si l'utilisateur a déposé des textes dans `echantillons/`, l'agent-style les analyse et produit des signatures (cf. `knowledge/analyse-style-utilisateur.md`). Ces signatures sont intégrées comme des « pistes » et non des « règles ».
- **Les tics involontaires sont des données** : les modérateurs systématiques ("un peu", "quelque chose de"), les patterns de correction (tiret → deux-points), les isotopies involontaires (eau, feu) sont documentés dans `knowledge/analyse-style-utilisateur.md` et signalés à l'éditeur comme éléments de vigilance — pas comme des interdits.
- **La neutralité n'est pas le silence** : ne pas imposer de style ne signifie pas écrire sans intention. Les contraintes formelles du genre (sonnet, alexandrin, dialogue de théâtre) et la structure du projet (arc narratif, progression thématique) sont actives.
- **Présence par le silence** : le personnage principal peut s'exprimer davantage par ses gestes, ses rituels et ses silences que par ses dialogues. Les émotions ne sont pas nommées — elles passent par des micro-gestes répétés (régler une sangle, souffler une bougie éteinte, éviter une marche qui bouge). Les objets du personnage deviennent des extensions de son état émotionnel : un accessoire allumé/éteint signale l'inquiétude, un carquois vérifié trois fois trahit l'anxiété.
  - **Antagoniste professionnel non-violent** (variante de « Présence par le silence ») : un rival compétent, dangereux sans être menaçant, respectueux sans être amical. Ce personnage n'est pas un méchant — il fait son travail. Caractéristiques : (1) il déclare sa capacité sans emphase (« Je pourrais vous tuer. Mais je ne suis pas venu pour ça. ») ; (2) il donne des informations que le protagoniste cherche, sans y être contraint — crédibilité par l'aisance ; (3) il offre une chance de reculer, prouvant qu'il préfère une solution sans effusion de sang ; (4) ses gestes sont économiques — rien de superflu ; (5) il peut être un miroir du protagoniste (même métier, même compétence, camps opposés). L'effet narratif est une tension plus sophistiquée que la menace explicite : le héros affronte non pas le Mal mais la simple opposition d'intérêts. Fréquence : 1 antagoniste professionnel par roman, à ne pas confondre avec l'antagoniste principal.
- **Rituel comme signature** : un geste répété à chaque occurrence (éviter une marche, fermer un verrou, souffler une bougie) crée un ancrage du personnage dans l'espace et le temps. Le rituel peut évoluer de sens au fil du récit (de l'habitude machinale au geste conscient). Applicable aussi aux personnages secondaires par des accessoires-signatures (une pipe, une clé, un chapeau).
  - **Variation d'objet-signature entre personnages** : un même type d'objet (pipe, arme, vêtement) peut être utilisé par plusieurs personnages avec des registres opposés pour révéler leur caractère par contraste. L'objet devient un marqueur de personnalité : transparent chez l'un, théâtral chez l'autre ; utilitaire chez l'un, performatif chez l'autre. Le lecteur perçoit la différence sans qu'elle soit nommée. Règle : (1) ne pas dépasser 2-3 personnages partageant le même objet-signature dans un même roman, (2) le contraste doit être lisible sans explication, (3) l'objet doit avoir une fonction dans l'histoire (pas seulement décorative).
  - **Rituel transformé** (variante) : un rituel établi peut être modifié par une force extérieure (un personnage le répare, le déplace, le supprime). Cette modification crée trois effets : (1) le rituel cesse d'être un geste purement mécanique pour devenir un événement — le lecteur sait que quelque chose a changé ; (2) le personnage qui modifie le rituel renforce sa caractérisation (il prend soin, il intervient, il perturbe les habitudes) ; (3) le rituel peut devenir un marqueur de relation entre le protagoniste et celui qui l'a modifié. Fréquence : 1 à 2 occurrences par roman, réservé aux moments où le monde change dans ses plus petits détails.
  - **Rituel comme promesse** (variante) : un rituel dont l'accomplissement est différé — le personnage possède l'objet rituel (chandelle, offrande, outil) mais ne l'utilise pas encore. L'effet narratif est une tension suspendue : le lecteur sait que le rituel aura lieu, mais pas quand. La promesse peut changer de sens au fil du récit : d'abord vide (le personnage fait le geste sans le comprendre), puis préparatoire (il possède l'objet sans l'utiliser), puis accompli (le rituel a enfin lieu). Le moment de l'accomplissement gagne en poids par l'attente. Fréquence : 1 à 2 arcs de promesse par roman, réservé aux moments-clés de décision.
- **Présence fantôme** : variante de « Présence par le silence » où un personnage absent est rendu présent — soit par les pensées du protagoniste, soit par le récit d'un tiers.
  - *Sous-variante — Absence ruminée* : le protagoniste pense à un antagoniste absent (2 à 4 occurrences par unité). Le personnage absent mais constamment pensé crée une tension plus forte qu'une apparition directe.
  - *Sous-variante — Anticipation par récit d'un tiers* : un personnage est décrit comme une légende par un tiers avant son apparition physique. Le récit (exploits, rumeurs, réputation) précède l'homme. L'apparition réelle peut confirmer ou infirmer la légende — le contraste entre la réputation (mythique) et la réalité (professionnelle, banale) crée un effet de vérité. Fréquence des deux sous-variantes combinées : ne pas dépasser 1 occurrence sur 2 sans apparition physique.
- **One-liner comme signature de personnage** : une réplique unique de 15 à 25 mots qui condense la personnalité, le rapport au monde et la menace/aisance d'un personnage. Structure recommandée : (1) affirmation de capacité (« Je pourrais vous tuer »), (2) précision contextuelle (« Ici, maintenant »), (3) détail technique qui prouve l'observation (« Vous n'auriez pas le temps de dégainer votre dague »), (4) retournement qui définit le vrai motif (« Mais je ne suis pas venu pour ça »). Le one-liner est au dialogue ce que le portrait-charge est à la description : une économie maximale pour un effet immédiat. Fréquence : 1 à 2 par roman, réservé aux personnages secondaires importants qui doivent être saisis en une seule apparition.

---

## Boîte à outils de la voix neutre

> La voix neutre n'a pas d'outils esthétiques pré-définis. Sa boîte est structurelle : des invariants transversaux qui s'appliquent quel que soit le genre.

- **Cohérence de registre** : une fois qu'un registre (introspectif-retenu, lyrique-cosmique, etc.) s'est manifesté dans le projet, l'écrivain le maintient — ou le fait évoluer consciemment, pas par inadvertance.
- **Respiration** : alterner les longueurs de phrases et la densité des alinéas pour éviter la monotonie. Pas de règle fixe, mais l'éditeur signale si le rythme est uniforme.
- **Incarnation** : les émotions sont portées par des gestes, des objets, des sensations physiques — pas par des abstractions. Ce principe est actif même sans influence sélectionnée.
  **Variante — Geste quotidien universel** : un geste que tout le monde reconnaît (téléphone, clé, tasse, interrupteur) peut porter à lui seul le sujet d'un chapitre. Le geste quotidien ancre la réflexion dans une expérience partagée. Il peut revenir en leitmotiv et créer des bouclages d'objet entre chapitres. L'objet choisi gagne à être générique pour permettre la projection du lecteur, précis pour créer l'effet de réel. Cette variante est transversale à tous les genres. *(Version spécifique à l'essai : voir `ecriture-essai-litteraire`, section Ouverture, variante « Ancrage par le geste quotidien universel ».)*
- **Adaptation au POV** : la voix neutre n'est pas une voix unique. Elle s'adapte au personnage dont on suit le point de vue. Dante (incarné, sensoriel) et Mephiston (froid, abstrait) peuvent avoir des voix distinctes sous le même skill. La voix émerge du personnage, pas d'une prescription stylistique.
- **Non-dit** : tout n'a pas besoin d'être explicité. Laisser des blancs, des ellipses, des questions sans réponse. Le lecteur participe à la construction du sens.
- **Précision** : nommer les choses avec exactitude (marque, matière, lumière, état). Éviter les génériques quand le spécifique est disponible.

---

## Références

Aucune référence n'est pré-inscrite dans ce skill. Les références émergent des échantillons utilisateur ou des influences sélectionnées par l'utilisateur.

---

## À éviter

- ✗ **Imiter une voix préfabriquée** : la voix neutre ne prescrit pas de modèle. Si l'écrivain produit un texte qui ressemble à un auteur canonique sans que l'utilisateur l'ait demandé, c'est une anomalie.
- ✗ **Sur-interpréter les silences** : la neutralité n'est pas un mandat pour ne rien proposer. Les contraintes formelles sont actives. L'absence de prescription esthétique ne signifie pas l'absence de conseil technique.

---

## REX — Projets utilisant voix-neutre

| Projet | Genre | Unités | Validation | Date |
|---|---|---|---|---|
| *S'accorder* | Essai | 7 | 100 % (7/7) | 21/06/2026 |
| *Dépouillé* | Essai | 9 | 100 % (9/9) | 02/06/2026 |
| *Bouclier d'Achille* | Essai (empilage épique) | 1 | 100 % (1/1) | 04/06/2026 |
| *Boucliers-Épiques* | Essai | 1 | 100 % (1/1) | 04/06/2026 |
| *Petit traité sur la déconnexion* | Essai | 6 | 100 % (6/6) | 07/06/2026 |
| *Recueil Test* | Poésie | 10 | 100 % (10/10) | 21/06/2026 |
| *Le Romantisme est Mort* | Poésie | 10 | 100 % (10/10) | 21/06/2026 |
| *Sanguinius — La Mort Retardée* | Roman | 14 | 100 % (14/14) | 21/06/2026 |
| *Chroniques de Thalmoor — Tome 1 : Vasthaven* | Roman | 11 | 100 % (11/11) | 23/06/2026 |

<!-- REX — Voix neutre utilisée comme défaut sur tous les projets antérieurs à la création d'une voix personnalisée. Maturité testé par règle système (AGENTS.md). Mis à jour le 21/06/2026 — ajout REX block. Mis à jour le 21/06/2026 — ajout Recueil Test (poésie, 10 poèmes, 100 %). Mis à jour le 22/06/2026 — ajout principes « Présence par le silence » et « Rituel comme signature » (issus des observations scribe ch01-04, Chroniques de Thalmoor). Mis à jour le 23/06/2026 — ajout « Variation d'objet-signature entre personnages » et « Présence fantôme » (issus des observations scribe ch05-06). Mis à jour le 23/06/2026 (checkpoint ch07-10) — consolidation rituels (sous-variantes transformé, promesse), ajout Antagoniste professionnel non-violent, enrichissement Présence fantôme (sous-variantes Absence ruminée, Anticipation par récit tiers), ajout One-liner comme signature de personnage. -->
