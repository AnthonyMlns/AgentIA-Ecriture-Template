# REX Transversal — v7.0

> **Date :** 07/06/2026
> **Projets source :** 6 projets terminés (ou en révision) — 3 genres, ~53 unités, ~350 pages
> **Rédigé par :** Orchestrateur
> **Contexte :** Premier REX transversal du pipeline. Synthèse de tous les apprentissages accumulés depuis le lancement.

---

## 1. Projets source

| Projet | Genre | Unités | Skills | Statut | Pages (est.) |
|---|---|---|---|---|---|
| **Pluralités** | Roman espionnage | 16 chap. + épilogue | roman-litteraire, ecriture-romanesque, roman-espionnage | ✅ Terminé | ~180 |
| **Un été** | Romance littéraire | 17 chap. (A1–C2) | roman-litteraire, ecriture-romanesque, ecriture-carnet-journal | ✅ Terminé | ~100 |
| **Stoïcisme-Minimalisme** | Essai littéraire | 9 chap. + intro + conclusion | ecriture-essai-litteraire | ✅ Terminé | ~50 |
| **Route de Tarente** | Nouvelles | 5 récits | nouvelle-litteraire, ecriture-carnet-journal | ✅ Terminé | ~40 |
| **Station-Service Désert** | Nouvelles | 3 récits | nouvelle-litteraire, roman-romance | ✅ Terminé | ~20 |
| **Koltès Spiritualité** | Thèse universitaire | 6 chap. + intro + conclusion | ecriture-universitaire, ecriture-essai-litteraire | 🔄 Révision | ~120 |

**Total cumulé :** 6 projets, 3 genres (roman, essai, nouvelle, universitaire), ~53 unités, ~510 pages estimées.

> **Note :** La poésie et le théâtre n'ont pas encore de projet pipeline complet. Les skills existent mais sont `spéculatif` ou `ancré` — non testés.

---

## 2. Patterns récurrents (tous projets)

### 2.1 Patterns à corriger (leçons non encore intégrées au workflow)

#### PATTERN #1 — Incohérence des preuves matérielles

| Projet | Manifestation | Type d'objet |
|---|---|---|
| Pluralités | Transaction test (ch12) casse ch13-15 | Événement narratif |
| Station-Service | Clé à molette « par terre » (R02) vs « sur l'établi » (R01) | Objet physique |
| Un été | Compteur Kodak incohérent B9→B10→C2 | Objet-compteur |
| Koltès | Citations non vérifiées entre chapitres | Référence externe |

**Racine commune :** aucune vérification systématique des preuves matérielles entre les unités. L'écrivain ne relit pas les unités précédentes avant d'écrire.

**Solution déjà partielle :** le fichier `_citations-utilisees.md` existe dans les templates mais n'est pas toujours créé/maintenu.

**Leçon transverse :** ajouter une **étape obligatoire de vérification inter-unités** dans le workflow, avec une checklist standardisée.

---

#### PATTERN #2 — Scribe irrégulier

| Projet | Statut scribe | Conséquence |
|---|---|---|
| Pluralités | ❌ Jamais invoqué | 0 propositions-skills, REX rétroactif |
| Un été | ❌ Jamais invoqué | 0 observations, 0 propositions-skills |
| Stoïcisme | ⚠️ Par vagues (mode batch) | Observations moins granulaires |
| Station-Service | ✅ Exemplaire (7 par cycle) | 21 observations, 15 propositions |
| Route-Tarente | ✅ Exemplaire | 16 observations, 9 propositions |
| Koltès | ✅ Exemplaire | 15-13 par chapitre, 16 propositions |

**Leçon transverse :** le scribe est systématiquement invoqué quand le workflow est respecté (écriture unité par unité). Il est sauté quand on écrit en mode batch. La **corrélation est forte** : qualité du scribe = qualité du REX = qualité des amendements skills.

**Solution :** limiter les batches à 3 unités maximum, avec appel obligatoire du scribe après chaque batch.

---

#### PATTERN #3 — Dettes inter-unités non tracées

| Projet | Dette | Cause |
|---|---|---|
| Pluralités | Consigne tardive « pas de lien avant Tbilissi » | Contrainte utilisateur arrivée après écriture |
| Koltès | Deixis annoncée ch1, non traitée ch2 | Absence de lecture préalable |
| Station-Service | Clé à molette contradictoire entre R01 et R02 | Pas de relecture croisée |

**Racine commune :** les corrections et contraintes ne sont pas vérifiées sur l'ensemble des unités déjà écrites.

**Leçon transverse :** après chaque correction ou contrainte nouvelle, ajouter une étape **« Vérifier l'impact sur toutes les unités précédentes »** avec une checklist automatisée.

---

#### PATTERN #4 — Pipeline réflexif (émergent)

| Projet | Manifestation |
|---|---|
| Route-Tarente | Éditeur s'adresse au scribe dans ses avis, brouillon anticipe l'éditeur |
| Koltès | Co-construction éditeur-écrivain, transparence méthodologique |
| Un été | Brouillons deviennent des documents méta-textuels de haute qualité |

**Ce n'est pas un bug — c'est une signature du pipeline qui mûrit.** Les agents apprennent les rôles des autres et améliorent leur propre production en conséquence.

**À formaliser :** ajouter une section « Auto-évaluation » dans le template de brouillon — l'écrivain vérifie lui-même sa production contre la grille de l'éditeur avant de soumettre.

---

### 2.2 Patterns de réussite (à capitaliser)

#### RÉUSSITE #1 — L'empilage fonctionne

Tous les empilages testés ont été validés par l'éditeur et le scribe :

| Empilage | Projet | Verdict |
|---|---|---|
| `roman-litteraire` + `ecriture-romanesque` | Pluralités | ✅ |
| `roman-litteraire` + `ecriture-carnet-journal` | Un été | ✅ |
| `nouvelle-litteraire` + `ecriture-carnet-journal` | Route-Tarente | ✅ |
| `nouvelle-litteraire` + `roman-romance` | Station-Service | ✅ |
| `ecriture-universitaire` + `ecriture-essai-litteraire` | Koltès | ✅ (tensions résolues) |

**Leçon :** la doctrine d'empilage est validée. Tous les skills récents incluent une section « Règles d'empilage » — c'est désormais un standard.

---

#### RÉUSSITE #2 — La signature stylistique tient sur la longueur

Dans les 3 projets longs (Pluralités, Un été, Stoïcisme), les 8 marqueurs de la signature utilisateur sont tenus sur la totalité des unités. L'analyse-style de chaque projet confirme une stabilité remarquable.

**Leçon :** le pipeline reproduit fidèlement la voix. Les skills `roman-litteraire`, `ecriture-essai-litteraire` et `ecriture-romanesque` ont intégré les marqueurs et les transmettent correctement.

---

#### RÉUSSITE #3 — La boucle scribe → agent-style → skills fonctionne

Quand le scribe est invoqué (Station-Service, Route-Tarente, Koltès), le taux d'adoption des propositions est de 90-100%. Les amendements sont appliqués dans le cycle du projet ou immédiatement après.

**Leçon :** le pipeline d'apprentissage est validé. Le maillon faible, c'est l'invocation du scribe, pas la qualité de ses observations.

---

## 3. Consolidation stylistique transverse

### 3.1 Techniques transversales validées (à intégrer dans `knowledge/style.md`)

Ces 8 techniques ont été découvertes ou validées dans au moins 2 projets. Elles sont **transversales** (applicables à plusieurs genres).

#### TECHNIQUE T1 — L'objet-personnage (Un été, Pluralités)
Un objet doté d'un arc narratif complet : introduction, développement, résolution. Il n'est pas un symbole — il vit avec les personnages.
- **Validé sur :** roman (Un été : 964, Kodak, Julio Iglesias), espionnage (Pluralités : toiles de Nino, deux téléphones)
- **Règle :** 1-2 par projet maximum. L'objet doit avoir une présence physique (poids, odeur, texture, son) et une mémoire (usure, trace, évolution).

#### TECHNIQUE T2 — La chute par objet-écrit (Station-Service, Route-Tarente)
Un document (carnet, photo, lettre) révèle la vérité dans les dernières lignes. Variantes : texte (R01), photo (R02), image numérique (R03).
- **Validé sur :** nouvelle (Station-Service ×3, Route-Tarente ×1)
- **Règle :** l'objet-écrit doit avoir été introduit AVANT la chute. Sa révélation doit être préparée sans être annoncée.

#### TECHNIQUE T3 — L'auto-corrosion (Stoïcisme, échantillons)
Le narrateur mine sa propre autorité en écrivant. 4 variantes documentées : directe, différée, disséminée, meta.
- **Validé sur :** essai (Stoïcisme — signature du projet), roman (potentiel non testé)
- **Règle :** max 2-3 occurrences par chapitre. L'auto-corrosion ne doit pas devenir une tic.

#### TECHNIQUE T4 — Le chapitre miroir / la boucle temporelle (Un été, Route-Tarente)
Ouverture et clôture construites sur les mêmes gestes, les mêmes objets — inversés dans le sens et le poids.
- **Validé sur :** roman (Un été : A1↔C2), nouvelle (Route-Tarente : poing fermé → main ouverte)
- **Règle :** le miroir doit être invisible au premier degré. Le lecteur reconnaît les gestes sans qu'ils soient annoncés.

#### TECHNIQUE T5 — L'insert hybride (Un été, Route-Tarente, Pluralités)
Insertion d'une forme différente (lettre, carnet, photo, fragments, poème) dans le flux narratif.
- **Validé sur :** roman (Un été : 4 formes), nouvelle (Route-Tarente : carnet comme récit complet), espionnage (Pluralités : documents)
- **Règle :** chaque insert doit avoir une fonction narrative claire. Pas d'insert décoratif. 4 formes documentées dans Un été.

#### TECHNIQUE T6 — La scène de seuil (tous les projets)
Un lieu de transit (aéroport, gare, frontière, parking) comme charnière narrative entre deux mondes.
- **Validé sur :** tous les projets. Signature de l'utilisateur (aéroports dans tous les romans, frontière dans Route-Tarente, parking dans Station-Service)
- **Règle :** le personnage n'en ressort pas indemne. La transformation peut être infime mais perceptible.

#### TECHNIQUE T7 — Le mot seul en cascade (Un été, Pluralités)
Trois mots seuls en succession rapide, chacun reprenant le précédent avec un ajout.
- **Validé sur :** roman (Un été B3 : « mensonge → premier mensonge → le plus beau »)
- **Règle :** max 1 cascade par section. Préparée par un silence ou une accumulation.

#### TECHNIQUE T8 — La structure en trois blocs A/B/C (Un été, esquisse dans Pluralités)
Avant / Pendant / Après. Le bloc B est le corps, le bloc C le retour.
- **Validé sur :** roman (Un été : structure explicite A1-A5 / B1-B10 / C1-C2)
- **Extension possible :** à d'autres genres (essai : thèse / développement / retour ; nouvelle : avant l'événement / l'événement / après)

---

### 3.2 Marqueurs à renforcer

| Marqueur | Problème | Source | Action |
|---|---|---|---|
| Question sans réponse (marqueur 6) | Sous-exploité dans Un été | Analyse-style Un été §1 | Renforcer dans consignes écrivain |
| Registre lyrique-cosmique | Absent des projets longs | Analyse-style Un été §2 | Tester sur un prochain projet |
| « Un peu / quelque chose de » | Tics qui reviennent | Tous les projets | Surveiller densité |

---

## 4. Contradictions inter-skills détectées

### 4.1 Conflits documentés

| Conflit | Skills | Projet révélateur | Analyse |
|---|---|---|---|
| **Densité référentielle** | `ecriture-essai-litteraire` (3 max) vs `ecriture-universitaire` (27-33 par chapitre) | Koltès | Résolu : l'empilage prévoit des seuils différents selon le contexte. À documenter explicitement dans les règles d'empilage. |
| **Twists narratifs** | `ecriture-romanesque` (pas de double twist non motivé) vs `roman-espionnage` (repose structurellement sur les twists) | Pluralités | Clarification nécessaire : un twist motivé ≠ un double twist gratuit. Le skill roman-espionnage devrait documenter la différence. |
| **Économie radicale** | `nouvelle-litteraire` (zéro mot superflu) vs `ecriture-carnet-journal` (fragmentation = profondeur par le vide) | Route-Tarente | Résolu : l'empilage précise que la fragmentation du carnet crée un type de profondeur différent — pas du vide mais des espaces de sens. |

### 4.2 Conflits latents (non encore rencontrés)

| Conflit potentiel | Skills | Scénario | Risque |
|---|---|---|---|
| Hybride vs pureté générique | `ecriture-hybride` vs tout skill de genre pur | Un projet qui mêle roman et théâtre | Faible — l'hybride est une signature de l'utilisateur |
| Poésie classique vs contemporaine | `poesie-classique` vs `poesie-contemporaine` | Un recueil qui alterne sonnets et vers libres | Moyen — les deux skills doivent documenter leur compatibilité |

---

## 5. Améliorations du workflow pipeline

### 5.1 Modifications de `AGENTS.md`

| Modification | Justification | Priorité |
|---|---|---|
| **Ajouter une sous-étape de vérification inter-unités** après chaque correction : « Lister les chapitres impactés et les relire un par un » | Pattern #1 (preuves matérielles) + Pattern #3 (dettes inter-unités) | 🔴 Haute |
| **Limiter les batches d'écriture à 3 unités** avant appel obligatoire du scribe | Pattern #2 (scribe irrégulier) | 🔴 Haute |
| **Ajouter `_citations-utilisees.md` comme fichier obligatoire** dans le template de projet | Pattern #1 + Koltès (citations non vérifiées) | 🟡 Moyenne |
| **Rendre le scribe obligatoire après chaque unité** — supprimer la mention « peut être sauté » | Pattern #2 | 🟡 Moyenne |
| **Ajouter une section « Auto-évaluation » dans le template de brouillon** | Pattern #4 (pipeline réflexif) | 🟢 Basse |

### 5.2 Modifications du template REX (`knowledge/rex-template.md`)

| Modification | Justification |
|---|---|
| Ajouter une section **« Anomalies transverses non corrigées »** | Pour suivre le polish inachevé (ex : Un été avait 6 anomalies encore présentes après l'audit) |
| Ajouter une section **« Patterns récurrents détectés »** | Pour nourrir le REX transversal |

### 5.3 Nouveaux outils de pipeline à développer

| Outil | Description | Priorité |
|---|---|---|
| **Checklist de cohérence inter-unités** | Une liste de vérification standardisée : compteurs, objets, lieux, dates, prénoms, citations | 🔴 Haute |
| **Template de brouillon structuré** | Sections : Hésitations / Alternatives A/B / Choix retenu / Justification / Points de vigilance / Auto-évaluation | 🟡 Moyenne |
| **Script de comptage lexical** | Détection des saturations lexicales (ex : « absence » >30× dans Koltès ch5) | 🟢 Basse |

---

## 6. Recommandations de maturité des skills

### 6.1 Promotions proposées

| Skill | Maturité actuelle | Maturité proposée | Justification |
|---|---|---|---|
| `nouvelle-litteraire` | spéculatif | **testé** | Testé sur 2 projets (Route-Tarente + Station-Service), 8 récits, validations éditeur sans réserve |
| `ecriture-carnet-journal` | spéculatif | **ancré → testé** | Testé sur 2 projets en empilage (Un été, Route-Tarente) + enrichi par échantillons. Validé comme skill autonome. |
| `roman-romance` | spéculatif | **ancré** | Testé sur 1 projet (Station-Service, en empilage). Pas encore en skill principal seul. |
| `ecriture-epique` | spéculatif | **ancré** | Pas de projet pipeline, mais enrichi par l'analyse des échantillons (Je Pacadis, Bouclier-Achille) + amendement agent-style |

### 6.2 Skills nécessitant une réorganisation

| Skill | Problème | Action recommandée |
|---|---|---|
| `roman-litteraire` | 18 techniques en boîte à outils — saturation | Réorganiser en sous-catégories (Rythme / Image / Voix / Formes hybrides) |
| `poesie-contemporaine` | ~27 techniques — saturation forte | Essaimer « Structure de recueil » dans un skill transverse ou élaguer |
| `poesie-classique` | Bloc REX HTML absent | Ajouter bloc REX minimal |
| `poesie-symbolique` | Bloc REX HTML absent | Ajouter bloc REX minimal |

### 6.3 Skills à créer ou fusionner

| Action | Justification |
|---|---|
| Envisager un skill transverse **« recueil »** | Cohésion inter-textes, chiasme, variation d'objets-ancres — technique validée sur 2 projets de recueil (Route-Tarente, Station-Service) |
| Clarifier statut de `poesie-madrigal` vs `poesie-madrigal-contemporain` | Doublon potentiel détecté par skill-manager — trancher (archivage ou maintien) |

---

## 7. Dettes techniques identifiées

| Dette | Projet concerné | Action requise | Priorité |
|---|---|---|---|
| REX de Un été non intégré dans les skills via agent-style | Un été | Lancer agent-style avec les 8 propositions de l'analyse-style | 🔴 Haute |
| Pas de propositions-skills.md généré pour Un été et Pluralités | Un été, Pluralités | Scribe non invoqué — impossible à rattraper. Marquer comme dette. | 🟡 Informative |
| Poesie-classique et poesie-symbolique : bloc REX absent | Skills | Ajouter bloc REX minimal | 🟡 Moyenne |
| 6 skills spéculatifs de la famille Nouvelle/Hybride non testés | Skills | Planifier un cycle de validation court (flash-fiction ou vignette-prose) | 🟢 Basse |
| `_citations-utilisees.md` absent de plusieurs projets | Pluralités, Un été | Créer le fichier pour les projets actifs | 🟢 Basse |

---

## 8. Plan d'actions priorisé

### Phase 1 — Appliquer immédiatement (ce REX)

| # | Action | Responsable |
|---|---|---|
| 1 | Consolider `knowledge/style.md` avec les 8 techniques transversales (T1–T8) | Orchestrateur |
| 2 | Appeler agent-style pour intégrer les propositions de Un été dans les skills | agent-style |
| 3 | Appeler skill-manager pour audit post-consolidation | skill-manager |
| 4 | Promouvoir `nouvelle-litteraire` et `ecriture-carnet-journal` en `testé` | skill-manager |

### Phase 2 — Actions rapides (v7.1)

| # | Action | Priorité |
|---|---|---|
| 5 | Ajouter bloc REX dans poesie-classique et poesie-symbolique | 🟡 |
| 6 | Créer la checklist de cohérence inter-unités | 🟡 |
| 7 | Mettre à jour le template de brouillon avec section auto-évaluation | 🟢 |

### Phase 3 — Chantiers (v7.2+)

| # | Action | Priorité |
|---|---|---|
| 8 | Réorganiser roman-litteraire (18 tech. → sous-catégories) | 🟡 |
| 9 | Planifier un projet flash-fiction ou vignette-prose pour tester les skills spéculatifs | 🟢 |
| 10 | Trancher le statut de poesie-madrigal | 🟢 |

---

## 9. Bilan

### Ce que le pipeline sait bien faire

1. **Reproduire la voix de l'utilisateur** sur la longueur (6 projets, 510 pages, stabilité des 8 marqueurs)
2. **Empiler les skills** sans contradiction majeure (5 empilages testés, 5 validés)
3. **Apprendre de ses projets** via la boucle scribe → agent-style → skills (quand le scribe est invoqué)
4. **Produire des textes de qualité constante** (0 REFUS sur les 3 derniers projets)

### Ce que le pipeline ne fait pas encore bien

1. **Garantir la cohérence matérielle** entre les unités — c'est le talon d'Achille transverse
2. **Invoquer le scribe systématiquement** — la moitié des projets l'ont sauté
3. **Suivre les corrections** jusqu'à leur application réelle
4. **Tester les skills spéculatifs** — 14/22 skills n'ont jamais été utilisés en projet pipeline

### Mot de la fin

Ce REX transversal est le premier du genre. Il formalise ce que le pipeline a appris depuis le début. Les 6 premiers projets ont permis de valider l'architecture, les skills et la boucle d'apprentissage. Les prochains projets devraient se concentrer sur :
- La **consolidation** (pas d'ajout de nouveaux skills sans en tester les spéculatifs)
- La **rigueur matérielle** (cohérence inter-unités, vérification systématique)
- L'**extension aux genres non testés** (poésie, théâtre, textes mobiles)

---

*Rédigé par : Orchestrateur*
*Date : 07/06/2026*
*Prochaine révision : après le prochain projet terminé*
