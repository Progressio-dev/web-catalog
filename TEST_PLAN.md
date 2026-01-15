# Plan de Test - Corrections Template Builder

## Vue d'ensemble
Ce document décrit les tests manuels à effectuer pour valider les corrections apportées aux 4 problèmes du Template Builder.

## Prérequis
- Application web-catalog démarrée en mode développement
- Accès à l'interface d'administration
- Un fichier CSV de test avec des données

## Tests à Effectuer

### Test 1: Groupement de blocs sans décalage

**Objectif**: Vérifier que les éléments groupés conservent leur position exacte

**Étapes**:
1. Se connecter à l'interface admin (`/admin`)
2. Créer ou modifier un template
3. Activer la grille magnétique:
   - Cocher "Afficher la grille"
   - Cocher "Magnétisme (snap-to-grid)"
   - Définir la taille de la grille à 10mm
4. Ajouter 3 éléments (textes ou rectangles) sur le canvas
5. Positionner ces éléments pour qu'ils soient alignés sur la grille (utiliser les guides magenta)
6. Sélectionner les 3 éléments (Ctrl/Cmd + clic sur chaque élément)
7. Cliquer sur le bouton "📦 Grouper"

**Résultat attendu**:
- ✅ Le groupe est créé
- ✅ Les éléments restent exactement aux mêmes positions visuelles
- ✅ Aucun décalage n'est visible
- ✅ Le groupe lui-même est aligné sur la grille

**Résultat si échec**:
- ❌ Les éléments se déplacent légèrement lors du groupement
- ❌ L'alignement par rapport à la grille est perdu

---

### Test 2: Rendu du code JavaScript dans les groupes

**Objectif**: Vérifier que les éléments JavaScript s'exécutent correctement dans les groupes

**Étapes**:
1. Dans l'éditeur de template, uploader un CSV avec des données de test
2. Ajouter un élément "Code JS" depuis la palette
3. Configurer le code JavaScript (exemple: `return data.nom || 'N/A'`)
4. Créer un autre élément (texte ou rectangle)
5. Sélectionner les deux éléments et cliquer sur "📦 Grouper"
6. Activer l'aperçu des données en cliquant sur "👁️ Aperçu données"

**Résultat attendu**:
- ✅ L'élément JavaScript dans le groupe affiche le résultat du code exécuté
- ✅ Le résultat correspond aux données CSV (ex: le nom du produit)
- ✅ Pas de message d'erreur "💻 Code JS"

**Résultat si échec**:
- ❌ L'élément JavaScript affiche "💻 Code JS" au lieu du résultat
- ❌ Le code ne s'exécute pas pour les éléments dans les groupes

---

### Test 3: Boutons Fit et Reset

**Objectif**: Vérifier que les boutons de zoom fonctionnent correctement

**Étapes pour Reset**:
1. Dans l'éditeur de template, zoomer le canvas (molette de la souris ou boutons +/-)
2. Déplacer le canvas (espace + glisser)
3. Cliquer sur le bouton "🔄 Reset"

**Résultat attendu pour Reset**:
- ✅ Le zoom revient à 100% (affiché dans l'indicateur)
- ✅ Le canvas est parfaitement centré dans la zone d'affichage
- ✅ Les marges sont équilibrées de tous les côtés

**Étapes pour Fit**:
1. Réinitialiser avec le bouton Reset
2. Redimensionner la fenêtre du navigateur (la rendre plus petite ou plus grande)
3. Cliquer sur le bouton "🔍 Fit"

**Résultat attendu pour Fit**:
- ✅ Le canvas s'ajuste pour être entièrement visible dans la zone d'affichage
- ✅ Le canvas est centré avec un padding de 40px de chaque côté
- ✅ Le zoom est calculé pour que tout le canvas soit visible
- ✅ Si le canvas est petit, le zoom peut dépasser 100% pour le rendre plus visible

**Résultat si échec**:
- ❌ Le canvas n'est pas centré correctement
- ❌ Une partie du canvas est hors de la vue
- ❌ Le zoom est incorrect

---

### Test 4: Redimensionnement avec snap-to-grid

**Objectif**: Vérifier que le redimensionnement suit la grille en mode magnétique

**Étapes**:
1. Activer la grille magnétique (comme dans le Test 1)
2. Ajouter un élément (rectangle ou texte)
3. Sélectionner l'élément (cliquer dessus)
4. Utiliser les poignées de redimensionnement (coins ou côtés) pour agrandir/réduire l'élément

**Résultat attendu**:
- ✅ Les dimensions changent par incréments de 10mm (taille de la grille)
- ✅ Les positions (pour les poignées qui déplacent aussi) suivent la grille
- ✅ Le comportement est identique au déplacement en mode magnétique
- ✅ Les guides intelligents (lignes magenta) s'affichent lors du redimensionnement

**Résultat si échec**:
- ❌ Les dimensions changent de manière continue sans suivre la grille
- ❌ L'élément peut avoir des dimensions non alignées sur la grille (ex: 37.5mm au lieu de 40mm)

---

## Tests Complémentaires

### Test de Non-Régression: Déplacement avec snap-to-grid
**Objectif**: S'assurer que le déplacement fonctionne toujours correctement

**Étapes**:
1. Avec la grille magnétique activée
2. Déplacer un élément sur le canvas

**Résultat attendu**:
- ✅ L'élément se déplace par incréments de 10mm
- ✅ Les guides intelligents s'affichent lors du déplacement

---

### Test de Non-Régression: Groupes sans grille
**Objectif**: Vérifier que le groupement fonctionne sans grille magnétique

**Étapes**:
1. Désactiver la grille magnétique
2. Créer un groupe comme dans le Test 1

**Résultat attendu**:
- ✅ Le groupe se crée sans erreur
- ✅ Les positions sont préservées (même sans snap-to-grid)

---

## Critères de Réussite Globaux

Pour que les corrections soient validées, tous les tests doivent passer avec succès:

- [ ] Test 1: Groupement sans décalage ✅
- [ ] Test 2: Code JS dans les groupes ✅
- [ ] Test 3a: Bouton Reset ✅
- [ ] Test 3b: Bouton Fit ✅
- [ ] Test 4: Redimensionnement avec snap-to-grid ✅
- [ ] Test de non-régression: Déplacement ✅
- [ ] Test de non-régression: Groupes sans grille ✅

## Notes pour les Testeurs

- Les guides intelligents (lignes magenta) apparaissent lors des déplacements et redimensionnements pour aider à l'alignement
- Le mode magnétique ne s'applique que si la grille est activée ET "Magnétisme (snap-to-grid)" est coché
- Le zoom peut être contrôlé par:
  - Molette de la souris (8% par cran)
  - Boutons +/- (20% par clic)
  - Raccourcis clavier: Ctrl/Cmd + Plus/Moins/0
- Le déplacement du canvas peut être effectué par:
  - Clic molette + glisser
  - Espace + clic gauche + glisser

## Environnement de Test

- Navigateurs recommandés: Chrome, Firefox, Safari, Edge (dernières versions)
- Résolution d'écran: Minimum 1280x720
- Système d'exploitation: Windows, macOS, ou Linux

---

**Date du plan de test**: 2026-01-15
**Version des corrections**: commit d620836
