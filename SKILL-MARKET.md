# Skill Market — Registre de skills partageables

> Idée : permettre de récupérer des skills d'un projet à l'autre, et d'importer des skills créés par d'autres utilisateurs.
> Note informelle — à concrétiser quand le besoin s'en fait sentir.

---

## Carte de skill idéale

| Champ | Rôle |
|---|---|
| **Nom + catégorie** | forme / influence / voix |
| **Description** | 1 phrase — ce qu'il fait |
| **Maturité** | testé / ancré / spéculatif |
| **Exemple d'usage** | extrait réel de projet où il a servi |
| **Empilages testés** | « marche bien avec X, déconseillé avec Y » |
| **REX court** | 1 projet = 1 ligne : nb d'unités, verdict éditeur |
| **Rating implicite** | ratio factuel : validations sans anomalie / total validations |

Pas de note subjective — que du factuel.

---

## Ce qu'il faudrait créer

1. **Structure de registre** : `_registry/index.json` — annuaire des skills disponibles
2. **Commande `/publier-skill`** : exporte un skill avec son REX pour le partager
3. **Commande `/importer-skill <url\|fichier>`** : télécharge, valide la conformité au template, installe dans la bonne catégorie
4. **Fichier `combinaisons.md`** : documente les empilages éprouvés (formes + influences + voix)
5. **Annuaire externe** (optionnel) : un fichier indexé où d'autres utilisateurs déposent leurs skills avec REX, sans store ni paiement — marché de confiance basé sur la qualité des retours d'expérience
