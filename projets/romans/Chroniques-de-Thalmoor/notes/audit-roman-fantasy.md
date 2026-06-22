# Audit de conformité — Skill `roman-fantasy`

> **Skill** : `.opencode/skills/influences/roman-fantasy/SKILL.md`
> **Catégorie** : influences
> **Maturité déclarée** : spéculatif
> **Audité le** : 22/06/2026
> **Auditeur** : skill-manager

---

## 1. Conformité au template (TEMPLATE-SKILL.md)

| Critère | Template | SKILL.md | Statut |
|---|---|---|---|
| **Frontmatter — `name`** | Obligatoire | `roman-fantasy` | ✅ |
| **Frontmatter — `description`** | Obligatoire | Présente | ✅ |
| **Frontmatter — `maturité`** | Obligatoire | `spéculatif` | ✅ |
| **Header — `# Skill — [Nom]`** | `# Skill — [Nom du skill]` | `# Skill — Roman de fantasy mature` | ✅ |
| **Header — Quote ligne 1** | Description concise 1 ligne | Présente | ✅ |
| **Header — Quote ligne 2** | `Mis à jour le [date]` | `Créé le 22/06/2026` — ⚠️ déviation mineure. Pour un nouveau skill, acceptable ; à passer en « Mis à jour le » dès le premier amendement. | ⚠️ |
| **Section Principes** | 4-8 principes actionnables | 6 principes, tous détaillés et actionnables | ✅ |
| **Section Boîte à outils** | 6-15 techniques, fréquences, clause rareté | 9 techniques, toutes avec fréquences + clause rareté | ✅ |
| **Section Références** | Présente | 5 références avec œuvre + justification | ✅ |
| **Section À éviter** | 4-8 items | 7 items, spécifiques et vérifiables | ✅ |
| **REX block (commentaire HTML)** | `<!-- REX [Projet] [date] ... -->` | **ABSENT** — aucun REX block en fin de fichier | ❌ |

### Conclusion conformité : **ANOMALIE** — REX block manquant.

Même pour un skill spéculatif jamais éprouvé, le REX block doit exister dans sa forme minimale :
```html
<!-- REX — Skill créé le 22/06/2026. Spéculatif — jamais éprouvé en projet pipeline complet. -->
```

---

## 2. Qualité du contenu

### Principes — actionnabilité

| Principe | Actionnable ? | Détail |
|---|---|---|
| Low-magic | ✅ | « jamais une solution », « phénomène à expliquer », « menace ou mystère » — cadre précis |
| Bestiaire naturaliste | ✅ | Écologie, habitat, régime, taxonomie — critères concrets |
| Système de chasse concret | ✅ | Process en 4 étapes : observation → préparation → confrontation → récolte |
| Guildes et factions | ✅ | Rivalité, territoires, loyautés, corruption interne |
| Politique par le monde | ✅ | Régimes distincts par cité/faction, héros comme révélateur |
| Héros ordinaire | ✅ | « pas de pouvoirs, pas de destinée », « compétent par l'expérience » |

Tous les principes sont actionnables. Chacun dit *comment faire* plutôt que *quoi faire*. ✅

### Boîte à outils — fréquences

| Outil | Fréquence | Qualité |
|---|---|---|
| Description de créature par l'observation | 1 description complète par créature majeure ; jamais au ch1 | ✅ |
| Craft comme progression | 1-2 mentions par chapitre de préparation | ✅ |
| Géographie politique | 1 fois par changement de cité ou quartier de pouvoir | ✅ |
| Témoignages en mosaïque | 2-4 témoins par mystère central ; ≤3 témoins par chapitre | ✅ |
| Rumeur comme anticipation | 1-2 scènes avant chaque confrontation majeure | ✅ |
| Corruption visible-invisible | 1-2 indices par chapitre d'enquête | ✅ |
| La Faille comme exception | 1-2 évocations par tome | ✅ |
| Compagnon de tome | 1 par tome, arc fermé en fin de tome | ✅ |
| Équipement comme personnage | 1 description par chapitre de préparation | ✅ |

Toutes les techniques ont une fréquence explicite. ✅

Quelques remarques d'amélioration :
- **« Compagnon de tome »** et **« Équipement comme personnage »** pourraient bénéficier d'un indicateur de rareté (quand NE PAS les utiliser) — mais ce sont des détails mineurs.
- **« La Faille comme exception »** est bien dosée mais pourrait préciser un seuil maximal plus explicite (« 1 fois par tome, 2 max »).

### Anti-patterns
Les 7 anti-patterns sont spécifiques, vérifiables, et ancrés dans le genre. ✅

---

## 3. Cohérence avec les autres skills

### 3.1. `ecriture-romanesque` (formes) — ✅ Aucun conflit
- `ecriture-romanesque` est un skill de **process** (workflow, structure de fichiers, conventions de bible). `roman-fantasy` est un skill **d'influence** (contenu esthétique). Ils opèrent à des niveaux différents et sont compatibles.

### 3.2. `voix-neutre` (voix) — ✅ Aucun conflit
- `voix-neutre` déclare n'imposer aucune esthétique. `roman-fantasy` est une influence choisie, facultative. Les principes de « Présence par le silence » et « Rituel comme signature » (voix-neutre) sont compatibles avec « Héros ordinaire » et « Équipement comme personnage » (roman-fantasy).

### 3.3. `ecriture-epique` (formes) — ⚠️ **Chevauchement notable : principe du héros**
- `ecriture-epique` — **Héros imparfait** : « le héros épique n'est pas un surhomme. Il est traversé par le doute, la fatigue, l'échec. Sa grandeur est dans sa persistance. »
- `roman-fantasy` — **Héros ordinaire** : « le protagoniste n'a pas de pouvoirs... Sa grandeur vient de sa persistance, pas de sa nature. »

Les deux formulations sont **quasiment identiques** sur le cœur : « Sa grandeur vient de sa persistance » vs « Sa grandeur est dans sa persistance ». Le principe de `roman-fantasy` ajoute la négation des tropes fantasy (pas de pouvoirs, pas de prophétie), ce qui le distingue partiellement — mais le concept central est le même.

**Risque en empilage** : si `ecriture-epique` + `roman-fantasy` sont stackés, ce principe sera redondant. L'écrivain recevra deux fois la même instruction.

**Recommandation** : envisager de reformuler le principe de `ecriture-epique` ou `roman-fantasy` pour éviter le doublon, ou bien ajouter une note d'empilage dans `roman-fantasy` signalant la redondance avec `ecriture-epique` et indiquant lequel prend la priorité.

### 3.4. `roman-espionnage` (influences) — ⚠️ **Emprunt thématique, pas contradictoire**
- `roman-fantasy` cite John le Carré en référence et utilise la corruption des institutions comme ressort narratif (guilde corrompue, « Corruption visible-invisible »).
- `roman-espionnage` a la méfiance et la corruption comme cœur du genre.
- Ce n'est pas une contradiction — c'est une **transposition légitime** d'un motif d'espionnage vers la fantasy. Mais à noter pour la vigilance : si les deux skills sont stackés, le thème de la corruption sera doublement présent. Pas un problème, juste une redondance thématique.

### 3.5. `roman-litteraire` (influences) — ✅ Aucun conflit
- Domaines différents (psychologie, prose soignée vs. worldbuilding, chasse, politique par le monde). Complémentaires.

---

## 4. Menaces

| Menace | Évaluation |
|---|---|
| **Obsolescence** | ✅ Skill créé aujourd'hui (22/06/2026). Aucun risque. |
| **Saturation** | ✅ 9 techniques (max 15). Pas de saturation. |
| **Doublon** | ⚠️ **Chevauchement partiel avec `ecriture-epique`** sur le principe du héros (voir §3.3). Pas un doublon complet, mais un recouvrement à résoudre. |
| **Abandon** | ✅ Skill créé pour un projet actif (Chroniques de Thalmoor). En cours d'utilisation. |
| **Maturité incohérente** | ✅ `spéculatif` est correct — skill jamais éprouvé en pipeline complet. |
| **Déviance template** | ❌ **REX block manquant** — voir §1. |
| **Lien cassé** | ✅ Aucune référence à `knowledge/` ou à un autre skill. Pas de liens internes. |
| **Index** | ⚠️ `roman-fantasy` n'est **pas référencé** dans `.opencode/skills/_INDEX.md`. Il manque dans le tableau des influences. |

---

## 5. Bilan

| Catégorie | Note |
|---|---|
| Conformité template | ⚠️ Anomalie : REX block absent |
| Qualité du contenu | ✅ Excellent — principes actionnables, outils fréquencés, anti-patterns précis |
| Cohérence inter-skills | ⚠️ Chevauchement à résoudre avec `ecriture-epique` (héros) |
| Menaces | ⚠️ 2 alertes : REX block manquant + entrée _INDEX.md absente |

### Priorité des alertes

| Priorité | Alerte | Action |
|---|---|---|
| 🟡 **Moyenne** | REX block manquant | Ajouter le commentaire HTML REX minimal en fin de fichier (agent-style ou skill-manager) |
| 🟡 **Moyenne** | Entrée _INDEX.md absente | Ajouter `roman-fantasy` dans le tableau des influences |
| 🟢 **Basse** | Chevauchement héros avec `ecriture-epique` | Reformulation ou note d'empilage à prévoir |
| 🟢 **Basse** | Header « Créé le » → « Mis à jour le » | À corriger au premier amendement |

### Recommandations

1. **Ajouter le REX block immédiatement** (minimum vital avant le prochain amendement) :
   ```html
   <!-- REX — Skill créé le 22/06/2026 pour « Chroniques de Thalmoor — Tome 1 : Vasthaven ». Spéculatif — jamais éprouvé en cycle pipeline complet. -->
   ```

2. **Mettre à jour `_INDEX.md`** : ajouter la ligne `roman-fantasy` dans le tableau des influences.

3. **Planifier une résolution du doublon héros** avec `ecriture-epique` — soit reformuler `ecriture-epique` pour le distinguer, soit ajouter dans `roman-fantasy` une note : « En empilage avec `ecriture-epique`, le principe Héros ordinaire prend la priorité sur Héros imparfait (plus spécifique à la fantasy). »

4. **Le skill est de très bonne qualité** pour un premier jet spéculatif. Les principes sont mûrs, les outils bien calibrés. La structure devrait passer en « ancré » dès le REX de Chroniques de Thalmoor si le pipeline confirme leur pertinence.

---

*Rapport généré par skill-manager le 22/06/2026.*
