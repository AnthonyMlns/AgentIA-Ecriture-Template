# Rapport d'amendement des skills — Recueil de poésie contempo

**Date** : 19/06/2026
**Agent** : agent-style
**Projet** : Recueil-Poesie-Contempo
**Source** : `notes/propositions-skills.md` (15 propositions) + `notes/rex.md` + `notes/observations.md`

---

## Audit scribe

3 observations vérifiées aléatoirement sur les 15 actives (≥25%) :

| # | Observation | Source vérifiée | Verdict |
|---|---|---|---|
| #001 | Chute hybride : geste final + doute | section-01.md L28-29 | ✅ Juste |
| #012 | Cycle de feedback : alertes citées | brouillon-02.md L10-12 | ✅ Juste |
| #013 | Octosyllabe comme solution conflit | brouillon-03.md L28-31 + section-03.md | ✅ Juste |
| #017 | Condensation prématurée | brouillon-04.md L34-58 | ✅ Juste |
| #018 | Résolution empilage madrigal/retenu | brouillon-04.md L30-34 | ✅ Juste |

**Taux d'exactitude** : 100% (5/5). Aucune alerte `[SCRIBE-FIABILITÉ]`.

---

## État des propositions (15 traitées)

### Légende
- ✅ **Valide** — sera appliquée
- ⚠️ **Redondante** — déjà couverte par l'existant, sans amendement nécessaire
- 🔄 **Redirigée** — proposition valide mais skill cible différent
- ❌ **Invalide** — motif non vérifié, contradictoire ou hors périmètre

---

## 1. poesie-contemporaine → Chute multiple : assouplir le cumul + variante chute hybride

**Source** : Proposition #001 (section 01) — deux sous-propositions liées
**Statut** : ✅ **Valide** (consolidée)

**Analyse** : La règle actuelle interdit le cumul de variantes de chute. La section 01 prouve qu'une fusion syntaxique de deux variantes (geste final + doute) en un seul mouvement de clôture est possible et validée par l'éditeur. Les deux propositions (assouplir la règle + ajouter variante chute hybride) sont complémentaires et seront fusionnées en un seul amendement.

**Amendement à appliquer :**

Dans `poesie-contemporaine` → Boîte à outils → Rythme et souffle → **Chute multiple** :

1. **Modifier la règle d'usage** (ligne 52) :
   - Remplacer : `> *Variante — mot seul qui tranche* : après une accumulation... `
   - En fait, la ligne 52 dit : « Une seule par poème (ne pas cumuler les variantes). »
   - Remplacer par : « Une seule par poème, sauf si deux variantes sont syntaxiquement fondues en un seul mouvement de clôture (ex. geste final + doute en chute dans la même phrase). Dans ce cas, les deux variantes comptent comme une seule puisqu'elles ne forment qu'un geste de clôture unique. Documenter la fusion en brouillon. »

2. **Ajouter une variante** après la variante *doute en chute* (après ligne 59) :
   ```markdown
   > *Variante — chute hybride* : combiner deux variantes (geste final + doute en chute, ou mot seul + geste final, ou doute + mot seul) en une seule phrase syntaxiquement liée. Les deux effets ne sont pas cumulés mais fondus : l'un prépare l'autre. Usage : une fois par recueil maximum. La fusion doit être syntaxique (même phrase, même mouvement) — pas une simple juxtaposition de deux vers indépendants. Documenter en brouillon le choix de fusion et vérifier que les deux variantes ne tirent pas le poème dans des directions contradictoires. Ne pas utiliser en section de clôture (la chute hybride ouvre plus qu'elle ne ferme).
   ```

---

## 2. poesie-contemporaine → Sous-variante « syntagme nominal médian »

**Source** : Proposition #002 (section 01)
**Statut** : ✅ **Valide**

**Analyse** : L'écrivain utilise un groupe nominal (« le dernier mot ») comme mot seul médian. L'effet rythmique est identique mais le poids sémantique est augmenté par l'article défini. La sous-variante officialise ce geste stylistique déjà présent dans la pratique.

**Amendement à appliquer :**

Dans `poesie-contemporaine` → Boîte à outils → Rythme et souffle → **Chute multiple** → sous *mot seul médian* (ligne 55), ajouter en fin :

```markdown
  >> *Sous-variante — syntagme nominal médian* : un groupe nominal (déterminant + nom, éventuellement avec expansions minimales) peut produire un effet de mot seul médian si l'article défini ancre l'absence ou la présence d'un objet précis. L'effet rythmique (silence, arrêt) est identique à celui du mot seul pur, mais le poids sémantique est plus grand — l'article oriente le sens, le nom est contextualisé. Usage : une fois par section maximum. Ne pas cumuler avec un mot seul pur (ou médian, ou en chute) dans le même poème — l'effet de variante serait dilué. Documenter le choix en brouillon, notamment si l'article défini remplit une fonction spécifique (désigner LE dernier, LE seul, L'unique).
```

---

## 3. poesie-contemporaine → Filtration d'influence : ajouter le cas passif

**Source** : Proposition #006 (section 01)
**Statut** : ✅ **Valide**

**Analyse** : L'outil Filtration d'influence poétique suppose une activation explicite, mais l'influence de Jaccottet était déjà intégrée dans la voix de l'auteur. L'outil doit couvrir le cas où l'influence est naturellement présente sans activation délibérée.

**Amendement à appliquer :**

Dans `poesie-contemporaine` → Boîte à outils → Image et métamorphose → **Filtration d'influence poétique** (ligne 72), ajouter en fin de paragraphe :

```markdown
  L'influence peut être présente sans activation explicite de l'outil — elle peut être déjà intégrée dans la voix de l'auteur à force de lectures. Dans ce cas, l'outil n'est pas une instruction d'écriture mais une documentation de référence : il liste les poètes dont l'influence est naturellement présente et rappelle le geste de filtrage (isoler → transposer → tester) à utiliser consciemment si l'influence devient pastiche. Le brouillon peut mentionner la présence involontaire de l'influence sans que l'outil ait été activé — c'est un indicateur que la voix est ancrée.
```

---

## 4. composition-recueil → Arc corporel inter-section

**Source** : Proposition #008 (section 02) + affinement #015 (section 03)
**Statut** : ✅ **Valide** (consolidée avec #9)

**Analyse** : L'évolution gestuelle main→paume→main posée entre les sections constitue un arc psychologique muet que le skill ne documente pas. L'arc est validé par les 5 sections. L'affinement #015 (métaphores non-humaines perturbant l'arc) est fusionné ici.

**Stratégie de consolidation** : Ajouté comme extension de l'outil existant **Arc gestuel inter-poèmes** (outil #8, ligne 47). Les deux sont thématiquement liés (motifs physiques à distance). L'outil est renommé pour couvrir les deux cas : « Arc physique inter-textes ». Le contenu existant devient variante existante ; l'arc corporel devient extension.

**Amendement à appliquer :**

Dans `composition-recueil` → Boîte à outils → **Arc gestuel inter-poèmes** (ligne 47) :

Remplacer le bloc actuel :

```markdown
- **Arc gestuel inter-poèmes** : un geste (la main tendue, la paume qui touche, le pas qui se pose) traverse deux poèmes non contigus du recueil. Le geste n'est pas nommé comme lien — le lecteur le recompose mentalement. L'arc est d'autant plus puissant qu'il n'est pas signalé. Condition : les deux poèmes doivent être séparés par au moins un poème intermédiaire. Usage : une fois par recueil maximum (un seul arc gestuel, sous peine de créer un tic structurel).
```

Par :

```markdown
- **Arc physique inter-textes** : un geste ou une partie du corps peut traverser plusieurs textes d'un recueil, créant un fil rouge muet. Deux formes :
  > *Variante — arc gestuel inter-poèmes* : un geste (la main tendue, la paume qui touche, le pas qui se pose) traverse deux poèmes non contigus du recueil. Le geste n'est pas nommé comme lien — le lecteur le recompose mentalement. L'arc est d'autant plus puissant qu'il n'est pas signalé. Condition : les deux poèmes doivent être séparés par au moins un poème intermédiaire. Usage : une fois par recueil maximum (un seul arc gestuel, sous peine de créer un tic structurel).
  > *Extension — arc corporel inter-section* : un même membre ou geste (main, pas, regard, souffle) peut évoluer d'une section à l'autre sans être commenté. Ex. : main active qui creuse (section 01) → paume ouverte (section 02) — le même membre change d'état, racontant un arc psychologique muet (tension → abandon). L'évolution doit être lisible sans explication, par la seule précision des objets. L'écrivain peut documenter la progression dans le brouillon (pourquoi ce geste change-t-il ? quel état intérieur traduit le nouveau geste ?). L'arc corporel peut s'étendre sur l'ensemble du recueil (ex. : main → paume → doigts qui lâchent) et servir de fil rouge silencieux parallèle à l'arc pronominal ou à l'écho lexical.
  > **Attention** : le même mot corporel (main, doigt, paume) utilisé dans une métaphore non-humaine (main du mur, doigt de gant, pied de la table) peut créer un écho involontaire avec l'arc corporel. L'écrivain doit décider si cet écho est productif (le mur prolonge le geste humain) ou perturbant (le lecteur confond les registres humains et architecturaux). Si la métaphore est maintenue, documenter explicitement la distinction en brouillon (ex. : « "main du mur" = métaphore architecturale, pas un corps humain ») et vérifier que l'arc corporel principal reste lisible malgré la diversion.
```

---

## 5. poesie-prose → Précision sur la non-utilisation du mot seul

**Source** : Proposition #011 (section 02)
**Statut** : ✅ **Valide**

**Analyse** : Le skill poesie-prose liste le mot seul comme césure mais ne précise pas que ne pas l'utiliser est aussi un geste valide. La section 02 prouve qu'un poème dense et réussi peut fonctionner sans mot seul.

**Amendement à appliquer :**

Dans `poesie-prose` → Boîte à outils → **Mot seul comme césure** (ligne 31), ajouter en fin de description :

```markdown
  Le mot seul n'est jamais obligatoire. Si le poème trouve sa respiration ailleurs (blancs typographiques, césures syntaxiques, silences entre paragraphes), ne pas forcer l'outil. Documenter le choix de ne pas utiliser le mot seul dans le brouillon, avec les alternatives envisagées et la raison du rejet. Un mot seul forcé est pire qu'une absence de mot seul — il crée une emphase artificielle que le poème ne soutient pas.
```

---

## 6. composition-recueil → Cycle de feedback entre sections

**Source** : Proposition #012 (section 02)
**Statut** : ✅ **Valide**

**Analyse** : L'écrivain consulte spontanément les alertes du scribe de la section précédente et les applique comme contraintes. Ce comportement améliore la cohérence et doit être formalisé.

**Stratégie de consolidation** : Ajouté comme sous-section dans **Principes** (pas un outil — ne compte pas dans le compteur 6-15).

**Amendement à appliquer :**

Dans `composition-recueil` → **Principes** (après la ligne 23 « Transverse »), ajouter :

```markdown
- **Cycle de feedback inter-section** : avant chaque section, consulter les observations du scribe de la section précédente. Identifier les alertes ([CRITIQUE], [MAJEUR], [MINEUR]) et les contraintes recommandées. Les intégrer comme contraintes auto-imposées dans la rédaction. Documenter dans le brouillon sous la forme : « Alertes consultées : [références des observations] ». Ce n'est pas une obligation stricte mais une pratique recommandée qui solidifie la cohérence du recueil et évite les régressions entre sections.
```

---

## 7. poesie-symbolique → Octosyllabe comme vers régulier valide

**Source** : Proposition #013 (section 03)
**Statut** : ✅ **Valide**

**Analyse** : Le skill spécifie « vers réguliers (alexandrin, décasyllabe) ». L'octosyllabe est un vers régulier traditionnel (La Fontaine, Verlaine). 7 versions ratées en alexandrin prouvent que le conflit lexique/mètre est systémique. L'éditeur valide l'octosyllabe comme acceptable.

**Amendement à appliquer :**

Dans `poesie-symbolique` → **Principes → Forme** (ligne 20), remplacer la phrase actuelle :

```markdown
- **Forme** : vers réguliers (alexandrin, décasyllabe) — le vers régulier est la norme. Une tolérance de 2 à 3 écarts expressifs par poème est acceptée, à condition que chaque écart serve le sens (enjambement violent, rejet, vers volontairement heurté). Un écart non justifié est une faute.
```

Par :

```markdown
- **Forme** : vers réguliers (alexandrin, décasyllabe, octosyllabe) — le vers régulier est la norme. L'octosyllabe est un vers régulier traditionnel (La Fontaine, Verlaine). Privilégier l'alexandrin ou le décasyllabe pour le souffle, l'ampleur, l'incantation. Utiliser l'octosyllabe quand le lexique de l'utilisateur (mots longs de 3-4 syllabes) entre en conflit avec le mètre long, ou quand le sujet (rue, pas, flux) demande un rythme nerveux. Documenter le choix en brouillon avec la mention « octosyllabe pour conflit métrique ». Une tolérance de 2 à 3 écarts expressifs par poème est acceptée, à condition que chaque écart serve le sens (enjambement violent, rejet, vers volontairement heurté). Un écart non justifié est une faute.
```

---

## 8. composition-recueil → Procédure « Gestion des écarts planifiés »

**Source** : Proposition #014 (section 03)
**Statut** : ✅ **Valide**

**Analyse** : Le mot « oblique » est sacrifié pour la métrique — premier écart planifié sur un élément explicite de la bible. Aucun skill ne documente comment gérer ce type d'écart. 3 alternatives testées avec comptage syllabique, substitut trouvé.

**Stratégie de consolidation** : Ajouté comme principe (pas un outil — ne compte pas dans le compteur 6-15).

**Amendement à appliquer :**

Dans `composition-recueil` → **Principes** (après « Cycle de feedback inter-section » ajouté ci-dessus), ajouter :

```markdown
- **Gestion des écarts planifiés** : quand un élément du plan (mot-clé, motif, écho) entre en conflit avec la métrique, le lexique ou le registre, un écart peut être envisagé s'il est : (1) documenté en brouillon avec les alternatives testées (minimum 3 alternatives, avec comptage syllabique pour la métrique) ; (2) justifié par une contrainte démontrable (impossibilité métrique, redondance lexicale, rupture de registre) ; (3) compensé par un substitut qui remplit la fonction symbolique (ex. lumière descendante pour lumière oblique). L'écart doit être signalé à l'éditeur comme anomalie ANTICIPÉE, pas découverte en relecture — l'écrivain doit dire dans son brouillon : « écart planifié par rapport à [référence de la consigne] ». L'orchestrateur et l'auditeur vérifient l'impact sur les arcs transversaux en fin de projet.
```

---

## 9. composition-recueil → Métaphores non-humaines dans arc corporel

**Source** : Proposition #015 (section 03)
**Statut** : ✅ **Valide** (fusionné avec #4 ci-dessus)

**Analyse** : L'ambiguïté de « la main du mur » (section 03) montre que l'arc corporel peut être perturbé par une métaphore qui utilise le même lexique. L'affinement est déjà intégré dans l'amendement #4 ci-dessus (section « **Attention** » ajoutée à l'arc corporel inter-section).

**Action** : Pas d'amendement séparé — déjà consolidé dans #4.

---

## 10. composition-recueil → Adresse au tu comme point d'arc pronominal

**Source** : Observation #016 (section 04)
**Statut** : ⚠️ **Redondante** — déjà couvert

**Analyse** : L'outil **Arc pronominal de recueil** (ligne 49-50) mentionne déjà explicitement l'adresse au « tu » dans la gradation : « absence → apparition du je → adresse au tu → nous final ». La section 04 valide l'exécution de cet outil, mais l'outil existe déjà et couvre le cas. Aucun amendement nécessaire.

**Action** : Aucune. L'observation est une validation de l'existant, pas un amendement.

---

## 11. composition-recueil → Alerte condensation prématurée [#017]

**Source** : Observation #017 (section 04)
**Statut** : 🔄 **Redirigée** — le skill cible est `poesie-madrigal-contemporain`, pas `composition-recueil`

**Analyse** : La condensation est utilisée en section 04 avant la clôture prévue (section 05). L'observation #017 propose un amendement à `poesie-madrigal-contemporain`, pas à `composition-recueil`. 

- Dans `composition-recueil` (ligne 40) : l'outil **Condensation de recueil** spécifie déjà « dans un texte de clôture ». La règle existe. L'ajout d'une alerte renforcée serait redondant.
- Dans `poesie-madrigal-contemporain` (ligne 50) : l'outil **Condensation de recueil** dit « dans un madrigal de clôture » mais la formulation est moins visible. Un renforcement est pertinent.

**Action recommandée** : Rediriger l'amendement vers `poesie-madrigal-contemporain`.

**Amendement à appliquer :**

Dans `poesie-madrigal-contemporain` → Boîte à outils → **Condensation de recueil** (ligne 50), remplacer le bloc actuel :

```markdown
- **Condensation de recueil** : dans un madrigal de clôture, reprendre les motifs majeurs des sections précédentes (images, objets, verbes) en les transformant syntaxiquement — ce qui était observation objective devient action attribuée au destinataire. Règle : pas plus de 40% d'échos, chaque reprise doit être une réécriture. Les motifs repris doivent être reconnaissables mais pas identiques.
```

Par :

```markdown
- **Condensation de recueil** : dans un madrigal de clôture UNIQUEMENT (dernière section du recueil), reprendre les motifs majeurs des sections précédentes (images, objets, verbes) en les transformant syntaxiquement — ce qui était observation objective devient action attribuée au destinataire. ⚠️ **Restriction temporelle** : ne pas l'utiliser avant la clôture — la condensation des motifs du recueil est un geste de fermeture. Si utilisé avant, la section suivante devra condenser des motifs déjà condensés, créant un effet de redite ou forçant une rupture. Si l'outil est malgré tout utilisé avant la clôture (contrainte métrique, plan révisé), l'écart doit être documenté en brouillon comme « condensation prématurée » avec la mention : « je condense maintenant, la section suivante devra condenser autrement ou condenser les motifs résiduels. » Règle : pas plus de 40% d'échos, chaque reprise doit être une réécriture. Les motifs repris doivent être reconnaissables mais pas identiques.
```

---

## 12. composition-recueil → Résolution empilage madrigal/retenu [#018]

**Source** : Observation #018 (section 04)
**Statut** : ✅ **Valide**

**Analyse** : La priorisation systématique du registre (retenue) contre les outils du skill secondaire (madrigal) se répète sur 3 sections (03-04-05) et devient un pattern. Le skill composition-recueil devrait documenter ce principe de priorisation de registre en conflit d'empilage.

**Stratégie de consolidation** : Ajouté comme principe (pas un outil — ne compte pas dans le compteur 6-15).

**Amendement à appliquer :**

Dans `composition-recueil` → **Principes** (après « Gestion des écarts planifiés »), ajouter :

```markdown
- **Priorisation de registre en conflit d'empilage** : quand un skill (forme, musicalité, chute) entre en conflit avec le registre fondamental du recueil (retenue, doute, économie), la priorité est au registre — c'est un choix de voix. Les outils du skill secondaire qui violent le registre sont différés ou remplacés. Le conflit et sa résolution doivent être documentés en brouillon. Si le même conflit se produit sur 3 sections consécutives, c'est un pattern systémique — considérer la modification du skill ou la révision du plan de recueil.
```

---

## 13. composition-recueil → Répétition transformée (clôture) [#019]

**Source** : Observation #019 (section 05)
**Statut** : ✅ **Valide**

**Analyse** : La clôture reprend les trois objets de l'ouverture (table, carreau, tasse) mais le dernier mot est un verbe au présent non achevé (« descend »). Technique puissante non documentée.

**Stratégie de consolidation** : Ajouté comme variante sous l'outil existant **Clôture par réponse sans résolution** (outil #10, ligne 51). Cet outil traite déjà de la transformation des motifs en fin de section/recueil — la répétition transformée en est une extension naturelle. Pas de nouveau tool de tête (préserve le compteur 6-15).

**Amendement à appliquer :**

Dans `composition-recueil` → Boîte à outils → **Clôture par réponse sans résolution** (ligne 51), ajouter en fin de bloc :

```markdown
  > *Variante — répétition transformée (clôture)* : les derniers vers reprennent des éléments textuels des premiers vers ou de la section d'ouverture du recueil — mêmes mots, mêmes objets — mais le contexte a changé (ce qui a été traversé entre-temps). L'effet est un choc de reconnaissance aussitôt déstabilisé : le lecteur reconnaît l'identique et perçoit la transformation. Le dernier mot doit être une action qui continue (verbe au présent, mouvement non achevé) — jamais un point final. La répétition peut être exacte (mêmes mots) ou partielle (structure parallèle, objets modifiés). Documenter en brouillon la fonction de chaque objet repris (le même, transformé, ou le même devenu autre). Usage : réservé à la clôture du recueil.
```

---

## 14. composition-recueil → Différation de signature [#020]

**Source** : Observation #020 (section 05)
**Statut** : ✅ **Valide**

**Analyse** : La signature #5 (questions sans réponse) est intentionnellement inversée en « moi sans question » pour la clôture. Ce geste fort doit être cadré pour éviter les ruptures artificielles.

**Stratégie de consolidation** : Ajouté comme variante sous **Clôture par réponse sans résolution** (outil #10, même bloc que #13). La différation d'une signature est un geste de clôture qui transforme un motif de la voix utilisateur — compatible avec l'esprit de l'outil.

**Amendement à appliquer :**

Dans `composition-recueil` → Boîte à outils → **Clôture par réponse sans résolution** (après la variante répétition transformée), ajouter :

```markdown
  > *Variante — différation de signature* : une signature utilisateur (question sans réponse, alternance je/on, émotion par le geste) peut être intentionnellement différée ou inversée dans la section de clôture si l'arc du recueil la prépare — ex. le doute qui se tait après 4 sections d'interrogation, le « je » qui devient « nous » après 4 sections d'isolement. L'écart doit être : (1) documenté en brouillon avec la mention « différation de signature — justification : [arc qui prépare ce silence] » ; (2) préparé par les sections précédentes (le lecteur doit sentir que ce silence est gagné, pas arbitraire) ; (3) validé par l'éditeur comme geste de clôture cohérent. Usage : réservé à la clôture du recueil. Maximum une signature différée par recueil.
```

---

## 15. composition-recueil → Écho transformé inter-section [#021]

**Source** : Observation #021 (section 05)
**Statut** : ✅ **Valide**

**Analyse** : Un vers de la section 02 (« Dehors est déjà dedans par ce que j'y dépose ») est repris et transformé en section 05 (« Dehors est rentré par ce que j'ai traversé »). L'écho transformé est un geste de clôture puissant — changement de verbe, de temps, de perspective.

**Stratégie de consolidation** : Ajouté comme variante sous **Clôture par réponse sans résolution** (outil #10, même bloc que #13 et #14). Les trois techniques de clôture sont réunies dans un même outil existant, évitant l'inflation du nombre d'outils.

**Amendement à appliquer :**

Dans `composition-recueil` → Boîte à outils → **Clôture par réponse sans résolution** (après la variante différation de signature), ajouter :

```markdown
  > *Variante — écho transformé inter-section* : un vers, une image ou un motif d'une section antérieure peut être repris et transformé dans la section de clôture. La transformation doit être significative (changement de verbe, de temps, de perspective) — pas une simple copie. L'effet : le lecteur reconnaît l'écho et mesure la distance parcourue. L'écho peut être planifié (documenté en brouillon) ou émergent (remarqué par l'éditeur en relecture). Dans les deux cas, l'éditeur vérifie que la transformation est cohérente avec l'arc du recueil et que l'écho n'est pas une redite. Usage : réservé à la clôture, maximum un écho transformé par recueil.
```

---

## Proposition non traitée (hors scope)

### #022 — Mot seul césuré (virgule)

**Source** : Proposition #022 (section 05, propositions-skills.md)
**Statut** : ❌ **Non incluse dans les 15 propositions de l'utilisateur**

Cette proposition concerne `poesie-contemporaine` → ajout d'une sous-variante « mot seul césuré (virgule) ». L'utilisateur a listé 15 propositions à traiter ; #022 n'en fait pas partie. La proposition est documentée dans `propositions-skills.md` et pourra être reprise dans un cycle d'amendement ultérieur.

---

## Bilan récapitulatif

| # | Proposition | Skill | Statut | Action |
|---|---|---|---|---|
| 1 | Chute multiple : assouplir + variante hybride | poesie-contemporaine | ✅ Valide | Modifier règle + ajouter variante |
| 2 | Syntagme nominal médian | poesie-contemporaine | ✅ Valide | Ajouter sous-variante |
| 3 | Filtration d'influence (cas passif) | poesie-contemporaine | ✅ Valide | Ajouter précision |
| 4 | Arc corporel inter-section | composition-recueil | ✅ Valide | Fusionner dans Arc gestuel → Arc physique |
| 5 | Précision non-utilisation mot seul | poesie-prose | ✅ Valide | Ajouter précision |
| 6 | Cycle de feedback entre sections | composition-recueil | ✅ Valide | Ajouter principe |
| 7 | Octosyllabe comme vers régulier | poesie-symbolique | ✅ Valide | Modifier Forme |
| 8 | Gestion des écarts planifiés | composition-recueil | ✅ Valide | Ajouter principe |
| 9 | Métaphores non-humaines arc corporel | composition-recueil | ✅ Valide | Fusionné dans #4 |
| 10 | Adresse au tu (arc pronominal) | composition-recueil | ⚠️ Redondante | Déjà couvert |
| 11 | Alerte condensation prématurée | composition-recueil | 🔄 Redirigée | → poesie-madrigal-contemporain |
| 12 | Résolution empilage madrigal/retenu | composition-recueil | ✅ Valide | Ajouter principe |
| 13 | Répétition transformée (clôture) | composition-recueil | ✅ Valide | Variante sous Clôture |
| 14 | Différation de signature | composition-recueil | ✅ Valide | Variante sous Clôture |
| 15 | Écho transformé inter-section | composition-recueil | ✅ Valide | Variante sous Clôture |

### Impact sur le compteur d'outils

| Skill | Outils avant | Outils après | Variation |
|---|---|---|---|
| poesie-contemporaine | 14 | 14 (1 variante fusionnée, 2 sous-variantes) | → Stable |
| composition-recueil | 15 | 15 (renommage + variantes) | → Stable |
| poesie-prose | 8 | 8 (précision textuelle) | → Stable |
| poesie-symbolique | 7 | 7 (modification wording) | → Stable |
| poesie-madrigal-contemporain | 7 | 7 (renforcement wording) | → Stable |

Aucun skill ne dépasse le repère 6-15. Toutes les consolidations ont été réalisées par fusion dans des outils existants ou ajout comme principes (hors compteur).

### Maturité des skills

Tous les skills étaient déjà `testé` avant le projet. Conformément à la règle de promotion (un micro-amendement en cours de projet ne promeut pas à `testé` — le projet est terminé mais le REX étant final, et le projet étant clos, on peut considérer la promotion comme acquise). Le REX indique `testé` pour tous les skills concernés — **maturité inchangée**.
