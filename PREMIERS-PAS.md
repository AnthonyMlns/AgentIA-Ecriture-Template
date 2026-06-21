# Bienvenue — Premiers pas avec AgentIA-Ecriture

> Ce guide t'accompagne dans ta première utilisation. Tu n'as besoin que de deux choses : une idée et un peu de texte.

---

## Principe général

Le système fonctionne avec trois couches empilables :

```
🧱 FORME(S)  +  🗣️ VOIX  +  🎨 INFLUENCE(S)
```

| Couche | Rôle | Exemple |
|---|---|---|
| **Forme** | Le genre et ses règles | `ecriture-essai-litteraire`, `poesie-contemporaine` |
| **Voix** | Ta signature personnelle | `voix-neutre` (par défaut), ou une voix générée à partir de tes écrits |
| **Influence** | Une couleur littéraire que tu choisis | `rimbaud`, `koltès`, `liberati`… ou rien |

---

## Étape 1 — Déposer tes échantillons (optionnel mais recommandé)

Si tu as déjà écrit (poèmes, romans, articles, journal), dépose 2-3 textes dans le dossier `echantillons/`. Ça permet au système de capter ta voix.

**Comment faire :**
1. Copie 2-3 fichiers texte (ou PDF) dans `echantillons/`
2. Lance la commande : **`/analyser-voix`**
3. L'agent analyse ton style et génère un skill-voix personnalisé
4. Tu valides ou tu ajustes

> Sans échantillons, pas de problème : la voix `voix-neutre` est activée par défaut. Ta voix émergera naturellement à l'écriture.

---

## Étape 2 — Choisir une idée

Tu as une idée ? Dis-la simplement. Le système te proposera le genre adapté.

Exemples :
- *« Je veux écrire un recueil de poèmes sur la ville la nuit »* → `/nouveau-recueil`
- *« J'ai envie d'un roman d'espionnage qui se passe à Berlin »* → `/nouveau-roman`
- *« Un essai sur le silence et l'attention »* → `/nouveau-essai`

Pas d'idée précise ? On peut piocher une influence littéraire pour partir d'un univers existant.

---

## Étape 3 — Choisir une influence (optionnel)

Tu peux démarrer avec une **couleur littéraire**. Les influences disponibles sont des boîtes à outils stylistiques inspirées d'auteurs.

| Influence | Univers |
|---|---|
| `rimbaud` | Poésie visionnaire, image fulgurante, synesthésie |
| `koltès` | Théâtre du sous-texte, nuit, solitude, parole des marges |
| `liberati` | Mélancolie contemporaine, cinéma, villes, disparition |
| `poesie-contemporaine` | Vers libres, image forte, émotion retenue |
| `poesie-classique` | Sonnets, alexandrins, formes fixes |
| `roman-litteraire` | Prose soignée, psychologie des personnages, ambiances |
| `roman-espionnage` | Atmosphère Le Carré, méfiance, zones grises |
| *(et d'autres…)* | Voir la liste complète avec `skills` |

**Exemple de combinaison :**
```
/nouveau-recueil Poèmes de la ville la nuit
   → Forme : poesie-contemporaine
   → Voix : voix-neutre
   → Influence : rimbaud (pour le regard visionnaire)
```

---

## Étape 4 — Écrire

Une fois la commande lancée, l'orchestrateur prend le relais :
1. Il crée la **bible** du projet (titre, structure, intentions)
2. Il rédige chapitre par chapitre (ou poème par poème)
3. Chaque unité est **relue** par un éditeur
4. Chaque cycle est **observé** par un scribe
5. Tu peux intervenir à tout moment : valider, refuser, corriger, réorienter

---

## Commandes essentielles

| Commande | Ce que ça fait |
|---|---|
| `/statut` | Voir où en est le projet en cours |
| `/relire <chapitre>` | Forcer une relecture |
| `/trier-notes` | Classer les observations du scribe |
| `/rex` | Clôturer le projet, capitaliser les apprentissages |
| `/analyser-voix` | Créer ta voix personnalisée à partir de tes textes |
| `/verifier-skills` | Auditer l'état des skills disponibles |

---

## Glossaire rapide

**Skill :** une recette stylistique (principes + outils) encapsulée dans un fichier SKILL.md.

**Forme :** skill de genre (contraintes structurelles neutres).

**Influence :** skill esthétique (voix de départ inspirée d'un auteur ou d'un courant).

**Voix :** skill personnalisé (ta signature, générée par agent-style).

**Scribe :** agent qui observe, documente, et propose des améliorations.

**REX :** Retour d'Expérience — bilan de fin de projet qui enrichit les skills.

---

*Prêt ? Lance une commande ou décris ton idée.*
