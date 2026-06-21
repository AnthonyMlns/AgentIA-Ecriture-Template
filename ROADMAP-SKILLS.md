# Roadmap — Système de skills

> Générer, tester, noter, croiser.

---

## Principe général

Un skill est une **recette stylistique** : il capture ce qui fait la signature d'une forme, d'une influence ou d'une voix. La roadmap ci-dessous décrit le cycle complet : de la création d'un skill à sa validation croisée.

---

## Phase 1 — Génération de nouveaux skills

### Source A — À partir d'un auteur existant
1. Déposer 3-5 textes de l'auteur dans `echantillons/auteurs/[nom]/`
2. Lancer `agent-style` avec instruction « génère un skill d'influence »
3. Agent-style produit :
   - `.opencode/skills/influences/[auteur]/SKILL.md` (maturité `spéculatif`)
   - `knowledge/analyse-auteur-[nom].md` (analyse détaillée)
4. Vérifier la conformité au template
5. Définir les empilages potentiels (avec quelles formes/testé)

### Source B — À partir d'un projet existant (capitalisation REX)
1. Un projet terminé → son REX + les observations du scribe
2. `agent-style` extrait les signatures stylistiques récurrentes
3. Si le pattern est suffisamment fort et original → création d'un nouveau skill

### Source C — Création manuelle assistée
1. Copier `TEMPLATE-SKILL.md` ou `TEMPLATE-SKILL-VOIX.md`
2. Remplir les sections (principes, boîte à outils, références)
3. Ajouter des exemples issus de projets réels ou de textes de référence
4. Soumettre à validation via un mini-projet (Phase 2)

---

## Phase 2 — Test sur projet restreint

Tout nouveau skill naît avec `maturité: spéculatif`. Pour le valider, on le soumet à un **cycle court**.

### Protocole de test « mini-projet »
- **Format** : 1 seule unité (poème, chapitre court, texte mobile)
- **Process** : écrivain → éditeur → scribe (cycle complet)
- **Critères de qualification** :
  | Résultat | Action |
  |---|---|
  | ✅ Validé sans anomalie | Promu `ancré` |
  | ⚠️ Anomalies mineures | Corriger le skill, retester |
  | ❌ Refusé | Analyser pourquoi : skill mal conçu, concept creux, pas assez spécifique |

Si le skill passe ce premier test, il est promu `ancré`. Après **un second projet complet** (3+ unités), il peut être promu `testé`.

---

## Phase 3 — Notation (factuelle, pas subjective)

Pas de note « 4 étoiles » — que du factuel.

### Métriques de qualité
| Métrique | Calcul | Seuil de qualité |
|---|---|---|
| **Taux de validation** | unités validées sans anomalie / total unités | > 80 % |
| **Taux d'anomalies** | anomalies / total éditions | < 20 % |
| **Maturité** | spéculatif → ancré → testé | testé = fiable |
| **Nb de projets** | nombre de projets pipeline complets utilisant ce skill | ≥ 2 = robuste |
| **Nb REX** | nombre de retours d'expérience consolidés | ≥ 1 = éprouvé |
| **Empilages testés** | nombre de combinaisons différentes essayées | ≥ 2 = polyvalent |

Ces métriques sont stockées dans le frontmatter du SKILL.md et dans le REX block.

### Fiche de notation
```
maturité: testé
projets: ["S'accorder", "Dépouillé"]
taux-validation: 100%  (7/7 unités)
taux-anomalies: 0%
empilages-testés: ["voix-neutre"]
dernier-rex: 21/06/2026
```

---

## Phase 4 — Croisements et empilages

La vraie puissance est dans les **combinaisons** : formes + influences + voix.

### Banque d'empilages

| Combinaison | Testé sur | Verdict |
|---|---|---|
| `ecriture-essai-litteraire` + `voix-neutre` | *S'accorder* (7 unités) | ✅ 100% |
| `ecriture-romanesque` + `roman-espionnage` | ? | ❓ à tester |
| `ecriture-poesie` + `poesie-contemporaine` | *Carnets Classiques* | ✅ testé |
| `micro-nouvelle` + `flash-fiction` + `vignette-prose` | *Le Dernier des Romantiques* (5 textes) | ✅ testé |

### Tests de compatibilité
Pour chaque nouveau skill, un mini-test d'empilage avec :
- **voix-neutre** (compatibilité de base — toujours)
- **1 forme** du genre correspondant
- **1 influence** proche (pour vérifier les synergies)
- **1 influence** éloignée (pour vérifier l'absence de conflit)

### Règles d'empilage connues
À documenter dans chaque SKILL.md :
- Avec quels autres skills ce skill a été testé
- Avec quels autres skills il est **déconseillé** (conflit, dilution, contradiction)
- Ordre de priorité en cas de conflit (voix > formes > influences)

---

## Phase 5 — Boucle d'amélioration continue

```
Création (spéculatif) → Mini-projet (ancré) → Projet complet (testé) → REX → enrichissement → Nouvel empilage
```

Chaque REX peut :
- Ajouter des outils au skill
- Retirer des outils inefficaces
- Documenter de nouveaux empilages
- Monter en maturité

---

## Résumé — commandes souhaitées à terme

| Commande | Action |
|---|---|
| `/generer-skill-auteur <nom>` | Analyse les échantillons de l'auteur → crée un skill influence |
| `/tester-skill <skill>` | Lance un mini-projet d'une unité pour valider un skill spéculatif |
| `/noter-skills` | Affiche le tableau de métriques de tous les skills |
| `/croiser-skills <s1> <s2>` | Lance un mini-test d'empilage entre deux skills |
| `/empilages <skill>` | Affiche les combinaisons testées et les recommandations |
| `/verifier-skills` | Audit complet de conformité + cohérence + alertes |

---

*Dernière mise à jour : 21/06/2026*
