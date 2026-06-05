# Knowledge Global — Principes d'écriture poétique

> Base de connaissances générique pour tous les projets de poésie.
> Mise à jour : 31/05/2026 — Issue du projet « Nuit et Ville (Avignon) ».

---

## Principes fondamentaux

### 1. Architecture du recueil
- Un recueil = 1 dossier dédié (ex: `projets/poesie/`).
- 3 fichiers racines : `bible.md` (structure), `bd-connaissances.md` (décisions), sections `section-NN.md`.
- Les agents : Orchestrateur → Poète → Éditeur, en boucle par section.
- Ne jamais valider une section sans la faire relire. Ne jamais juger soi-même.

### 2. Rédaction d'une section
- **Voix cohérente** : maintenir le ton et la persona poétique sur l'ensemble du recueil.
- **Formes variées** : varier les longueurs, structures et formes entre les poèmes d'une même section.
- **Contraste rythmique** : alterner vers courts et vers longs, concentration et déploiement.
- **L'absence comme méthode** : dire ce qui manque, ce qui n'arrive pas, ce qui se tait — plus puissant que la déclaration.
- **Rareté de l'envolée** : un seul grand souffle par poème maximum. Si tout est envolée, il n'y a plus d'envolée.

### 3. Relecture
- Deux grilles disponibles : `editeur-poesie-contemporaine` et `editeur-poesie-traditionnelle`.
- Choisir l'éditeur selon le skill utilisé (classique/symbolique → traditionnel, contemporain/prose/lyrique → contemporain).
- Recommandé : alterner les deux éditeurs sur un même recueil pour des perspectives croisées.
- Vérifier systématiquement les **marqueurs de voix utilisateur** après la grille technique.

### 4. Travail d'équipe entre agents
- L'orchestrateur donne des instructions **précises** sur la forme, le thème, le nombre de poèmes, le skill.
- Le poète rédige et documente ses hésitations dans un brouillon honnête.
- L'éditeur critique la forme ET la voix — une grille technique sans vérification de voix est incomplète.

### 5. Gestion des itérations
- Si une section est refusée, retour au poète avec les retours précis de l'éditeur.
- Maximum 3 cycles poète → éditeur par section (au-delà, intervention orchestrateur).
- Enregistrer chaque avis éditeur dans un fichier dédié (`avis-editeur-section-NN.md`).

### 6. Isotopies involontaires
- Après chaque section, relever les images, mots ou structures qui reviennent sans avoir été planifiés.
- Ces isotopies involontaires sont souvent les fils conducteurs les plus puissants du recueil.
- Les documenter dans `bd-connaissances.md` pour les valoriser dans les sections suivantes.

### 7. Bases de connaissances
- **global-poesie.md** : principes génériques (ce fichier).
- **style-poesie.md** : techniques stylistiques pour la poésie.
- **style.md** : guide stylistique de l'auteur, tous genres (applicable à la prose poétique).

---

## Workflow recommandé

1. L'utilisateur donne une idée → l'orchestrateur planifie le recueil (sections, thèmes, formes, skills)
2. Établir les contraintes pré-flight (voix souhaitée, motifs à éviter, formes imposées)
3. **Passer par l'agent-style en premier** : charger `knowledge/analyse-style-utilisateur.md` avant l'écriture pour ancrer la voix dès le départ
4. Boucle par section : plan → écriture → relecture → scribe → validation
5. Après chaque section : relever les isotopies involontaires, les noter dans `bd-connaissances.md`
6. Finalisation : REX, audit, tri des notes, vérification des versions

---

## Anti-patterns à éviter
- ✗ Écrire sans plan de section préalable (thème, forme, nombre de poèmes)
- ✗ Laisser un agent valider son propre travail
- ✗ Utiliser un seul éditeur sur tout le recueil (alterner pour croiser les regards)
- ✗ Oublier la vérification de la voix utilisateur après la grille technique
- ✗ Prosopopée de plus de 3 vers (rythme de prose)
- ✗ Uniformité rythmique (vers courts partout = lassitude)
- ✗ Certitude systématique (absence de doute = voix moins humaine)
- ✗ Ne pas synchroniser `versions/` avant clôture (vérifier que le fichier version est à jour après corrections)

---

## Configuration agents (opencode.json)

Pour chaque projet de poésie, les agents actifs sont :
```json
{
  "ecrivain-poesie": { ... },
  "editeur-poesie-contemporaine": { ... },
  "editeur-poesie-traditionnelle": { ... },
  "scribe": { ... },
  "auditeur": { ... }
}
```

Le choix de l'éditeur (contemporain ou traditionnel) est fait par l'orchestrateur selon le skill de la section.
