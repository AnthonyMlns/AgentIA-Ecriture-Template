# REX — Recueil de poésie contempo

**Date** : 19/06/2026
**Skills actifs** : composition-recueil, poesie-classique, poesie-contemporaine, poesie-lyrique, poesie-madrigal-contemporain, poesie-prose, poesie-symbolique

---

## Ce qui a fonctionné

### Architecture du recueil
- **Arc dedans → seuil → dehors → l'autre → retour** : progression spatiale claire, respectée dans chaque section
- **Arc pronominal** : absence de « je » (01) → apparition (01-02) → « on » (03) → « tu » (04) → « nous » (05) — aboutissement parfait
- **Arc corporel silencieux** : main qui creuse → paume sur la vitre → main du mur (métaphore) → paume sur le vide → main posée. Jamais commenté, toujours perceptible.
- **Fil rouge lumière oblique** : installée (01), hésitante (02), fragmentée (03), absence (04), transformée (05). Disparition programmée du mot.
- **Écho inter-sections** : chaise refroidie (01→02), chaleur traversant le verre (02→05), rue vue de l'intérieur (02) → rue habitée (03) → rue condensée (04→05)

### Qualité des textes
- **Moyenne des 5 sections** : 9.5/10
- **Zéro REFUS** sur l'ensemble du recueil
- **3 anomalies mineures** sur 5 sections (deux occurrences d'« oblique » en 01, mot absent en 03, condensation prématurée en 04) — toutes justifiées et validées
- **Signature utilisateur** : 8/8 respectées sur 4 sections, 7/8 sur section 01 (alternance je/on différée intentionnellement)
- **Tics utilisateur** : 0 occurrence de « un peu », « quelque chose de », « c'est » sur l'ensemble du recueil

### Pipeline
- **Brouillons** : ratio brouillon/poème de 7:1 à 15:1 — hyper-conscience métier devenue signature du pipeline
- **Cycle de feedback** : les alertes scribe sont consultées et appliquées spontanément dès la section 02
- **Boucle d'amélioration** : déclenchée à N/2 = 2 sections, micro-amendement appliqué avant section 03

---

## Ce qui a été appris

### Conflits d'empilage
1. **Symbolique/retenu** (section 03) : l'ornement symbolique entre en conflit avec l'économie de la voix utilisateur. Résolution : 3/7 outils symboliques seulement, octosyllabes au lieu d'alexandrins, sacrifice du mot « oblique » pour la métrique. Leçon : les alexandrins stricts sont difficiles à concilier avec le lexique précis de l'utilisateur (mots longs : bitume, réverbère, lumière, oblique). Les octosyllabes sont une alternative viable.
2. **Madrigal/retenu** (section 04) : la chute obligatoire du madrigal risque de transformer la retenue en déclaration. Résolution : chute-question au lieu de chute-aphorisme, adresse à un absent.
3. **Lyrique/prose** (section 05) : la fusion des deux skills s'est faite naturellement — la prose a apporté la respiration, le lyrique la convergence.

### Mot « oblique »
- 3 occurrences sur les 5 sections (01×2, 02×1). L'absence en 03-04-05 était programmée mais la section 03 a dû sacrifier sa seule occurrence pour des raisons métriques.
- Leçon : ne pas prévoir de mot-clé dans une section à métrique stricte sans vérifier la faisabilité syllabique.

### Condensation de recueil
- L'outil *Condensation de recueil* (composition-recueil) a été utilisé en section 04 (madrigal), mais il est réservé à la section de clôture. La section 05 a dû trouver une autre forme de convergence (présence atmosphérique au lieu de condensation syntaxique).
- Leçon : clarifier dans le skill composition-recueil que *Condensation de recueil* est réservé à la section de clôture — ne pas l'utiliser avant.

---

## Maturité des skills

| Skill | Maturité avant | Maturité après | Commentaire |
|---|---|---|---|
| poesie-contemporaine | testé | testé | Confirmé. Amendement proposé (chute hybride, syntagme médian, filtration passive) |
| poesie-lyrique | testé | testé | Confirmé. Violence lyrique désactivée pour ce registre |
| poesie-prose | testé | testé | Confirmé. Précision sur la non-utilisation du mot seul |
| poesie-symbolique | testé | testé | Conflit ornement/retenu documenté. Octosyllabes comme alternative |
| poesie-madrigal-contemporain | testé | testé | Confirmé. Chute-question comme variante validée |
| composition-recueil | testé | testé | 3 outils amendés (arc corporel, feedback, condensation) |

---

## Chiffres clés

| Métrique | Valeur |
|---|---|
| Sections | 5 |
| Poèmes | 5 |
| Vers total | ~82 vers |
| Pages estimées | ~5 pages |
| Score moyen | 9.5/10 |
| REFUS | 0 |
| Anomalies | 3 (mineures, justifiées) |
| Observations scribe | 22 (dont 12 actives) |
| Propositions skills | 15 |
| Taux d'exactitude scribe | 100% |

## REX technique — Interface ↔ OpenCode

### Ce qui s'est bien passé

- **Reprise possible après incident** : l'orchestrateur a détecté l'absence de `section-03.md` et `brouillon-03.md`, puis a relancé la section. Le projet n'a pas été perdu.
- **Streaming utile** : l'interface a rendu visibles les étapes, les appels outils, les lectures de fichiers et les relances. Cela a permis de diagnostiquer l'arrêt sans ouvrir directement le process OpenCode.
- **Écriture incrémentale sur disque** : les fichiers produits au fil du run ont permis de savoir exactement où reprendre : section 03, avant brouillon/relecture.
- **Log final exploitable** : le gros log OpenCode final permet de reconstruire l'histoire du run : 316 events, 109 appels outils, 66 min de session.

### Points faibles observés

- **Échec silencieux d'un sous-agent** : le sous-agent `ecrivain-poesie` n'a pas produit les fichiers attendus pour la section 03. L'orchestrateur l'a constaté après coup, mais l'échec n'a pas été remonté comme un statut clair.
- **Contournement de rôle** : après l'échec du sous-agent, l'orchestrateur a fini par produire directement certaines sections. Cela a permis de terminer le projet, mais cela viole la règle pipeline : l'orchestrateur ne rédige jamais.
- **Statut final ambigu** : le log final indique `status: cancelled` avec `exitCode: 0`, alors que le projet est terminé. La fermeture utilisateur ou SSE après réussite est confondue avec une annulation.
- **Logs écrits seulement à la fermeture** : pendant une longue session, si OpenCode semble bloqué, il manque un état persistant intermédiaire (`lastEventAt`, étape courante, sous-agent courant, fichiers attendus).
- **Longue session monolithique** : un run de 66 minutes concentre trop d'étapes. Quand un sous-agent échoue, l'interface doit reconstruire l'état à partir des fichiers.
- **PDF non généré** : échec non lié au pipeline littéraire, mais dépendance système absente (`pdflatex`, Edge headless). Le Markdown final reste le livrable fiable.

### Améliorations recommandées

1. **Étapes atomiques et relançables**
   Découper le pipeline en unités courtes :
   - écrire section N ;
   - vérifier `section-N.md` + `brouillon-N.md` ;
   - relire section N ;
   - vérifier `avis-editeur-section-N.md` ;
   - lancer le scribe ;
   - vérifier mise à jour de `observations.md`.

2. **Contrat d'artefacts par étape**
   Chaque étape doit déclarer ses fichiers attendus. Si un fichier manque, l'interface affiche `échec partiel` et propose une reprise ciblée.

3. **Statuts explicites côté Interface**
   Ajouter des statuts distincts :
   - `subagent_started`
   - `subagent_completed`
   - `subagent_failed`
   - `expected_files_missing`
   - `done_success`
   - `client_disconnected_after_success`
   - `cancelled_by_user`
   - `idle_timeout`

4. **Garde-fou de rôle**
   Si l'orchestrateur écrit un fichier de production (`section-*.md`, `brouillon-*.md`, `avis-editeur-*.md`), signaler une alerte : `règle pipeline contournée`. En local, cela peut rester autorisé, mais visible.

5. **Checkpoint progressif**
   Écrire un petit état JSON pendant le run :
   - session id ;
   - projet ;
   - étape courante ;
   - sous-agent courant ;
   - dernier event reçu ;
   - fichiers attendus ;
   - fichiers déjà présents.

6. **Bouton de reprise intelligente**
   L'interface peut proposer automatiquement :
   - reprendre à `écriture section 03` si `section-03.md` manque ;
   - reprendre à `relecture section 03` si le poème existe mais pas l'avis ;
   - reprendre à `scribe section 03` si poème + avis existent mais pas observation récente.

7. **Livrables découplés du PDF**
   Considérer le Markdown final comme livrable principal. Le PDF devient une étape optionnelle, avec diagnostic clair des dépendances manquantes.

### Conclusion technique

Le pipeline fonctionne, mais sa robustesse vient encore trop de la capacité d'OpenCode à improviser après incident. Pour passer d'une expérimentation locale à une production fiable, il faut transformer chaque étape en contrat vérifiable : entrée claire, agent responsable, artefacts attendus, statut final, reprise ciblée.

---

## RAG — qualité de l'écrit

### Synthèse

**Statut global : GREEN**

Le recueil est littérairement cohérent, tenu, et supérieur à un simple exercice de génération. Il possède une architecture lisible, des motifs suivis, une progression émotionnelle réelle, et une voix globalement homogène. Les faiblesses repérées sont locales et réparables ; elles ne compromettent pas l'ensemble.

| Axe | Statut | Commentaire |
|---|---|---|
| Cohérence du recueil | GREEN | Arc dedans → seuil → rue → autre → retour très lisible. La section 05 referme clairement la boucle. |
| Voix / style | GREEN | Registre introspectif-retenu bien maintenu. Émotion portée par les gestes et objets, rarement déclarée frontalement. |
| Images | GREEN | Images sobres et efficaces : table, carreau, tasse, lumière, paume, rue, pluie. Le système d'objets fonctionne. |
| Composition inter-sections | GREEN | Les retours d'objets et de gestes sont perceptibles sans être surlignés. Très bon arc corporel. |
| Musicalité | AMBER | Bonne tenue générale, mais la section 03 est plus mécanique à cause des octosyllabes. |
| Originalité | AMBER | La force vient de la justesse et de la composition plus que d'images radicalement neuves. Quelques motifs restent familiers : lumière, vitre, rue, pluie. |
| Risque de surcontrôle | AMBER | Le pipeline produit une grande maîtrise, parfois au prix d'une légère sensation de texte très cadré. |
| Publication brute | AMBER | Bon matériau final, mais une passe humaine de resserrement améliorerait encore le recueil. |

### Points forts littéraires

- **Très bonne clôture** : la section 05 reprend la table, le carreau, la tasse, la main, la lumière, mais dans un état transformé. C'est exactement ce qu'on attend d'un retour réussi.
- **Arc pronominal réussi** : le passage vers le `nous` donne au recueil un vrai mouvement intérieur.
- **Objets bien choisis** : table de pin, carreau ébréché, tasse bleue, toile cirée. Ce sont des objets simples, mais ils deviennent des points d'ancrage.
- **Émotion retenue** : le texte évite majoritairement le commentaire psychologique. Il fait confiance au geste.
- **Bonne sobriété formelle** : le recueil ne cherche pas l'effet spectaculaire. Il reste dans une chambre de voix assez stable.

### Points à surveiller

- **Section 03 plus faible que les autres** : elle remplit sa fonction de dehors/rue, mais les contraintes métriques la rendent plus fabriquée. Les formulations `sans fin`, `temps`, `rue`, `nuit` reviennent de façon un peu attendue.
- **Motifs très classiques** : lumière, vitre, pluie, rue, absence. Ils sont bien utilisés, mais demanderaient parfois un détail plus inattendu pour éviter le déjà-vu.
- **Section 04 légèrement explicative** : certains vers nomment davantage l'absence et le manque que les autres sections. Elle reste réussie, mais un peu plus déclarative.
- **Risque de bouclage trop parfait** : la section 05 clôt très bien, presque trop proprement. Une aspérité supplémentaire pourrait donner plus de vie.

### RAG par section

| Section | Statut | Retour |
|---|---|---|
| 01 — L'intérieur | GREEN | Très bonne ouverture. Objets nets, tension silencieuse, chute douce. Deux occurrences d'« oblique » mais pas rédhibitoire. |
| 02 — Le seuil | GREEN | Probablement une des plus solides. Le poème en prose tient bien le passage intérieur/extérieur. |
| 03 — La rue | AMBER | Fonctionnelle et cohérente, mais plus contrainte. La métrique donne une raideur et quelques formulations attendues. |
| 04 — L'autre | AMBER/GREEN | Bonne adresse au `tu`, belle place dans l'arc. Un peu plus explicite sur l'absence. |
| 05 — Le retour | GREEN | Clôture très efficace, retour transformé réussi, `nous` final convaincant. |

### Recommandation éditoriale

Avant publication ou partage externe, faire une passe humaine légère :

- alléger la section 03 ou accepter sa raideur comme contraste ;
- rendre la section 04 un peu moins explicative ;
- chercher 2 ou 3 détails sensoriels moins attendus ;
- préserver la section 05, qui fonctionne comme fermeture.

**Verdict final : GREEN avec réserves AMBER locales.** Le recueil est réussi comme preuve de pipeline et comme objet poétique court. Il mérite surtout une micro-révision d'auteur, pas une refonte.
