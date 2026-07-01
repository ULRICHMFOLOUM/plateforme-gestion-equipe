# Amélioration de la Gestion de Projet

## Tâches à Réaliser

### 1. Créer le Composant UserSelector
- [ ] Créer `components/UserSelector.tsx` pour la recherche et sélection d'utilisateurs
- [ ] Implémenter la recherche en temps réel
- [ ] Gérer la sélection/désélection des utilisateurs

### 2. Améliorer la Création de Projet
- [ ] Modifier `app/projects/new/page.tsx` pour inclure la sélection de membres
- [ ] Ajouter l'état pour les membres sélectionnés
- [ ] Intégrer le composant UserSelector

### 3. Modifier l'API de Création de Projet
- [ ] Modifier `/api/projects/route.ts` pour accepter `memberIds`
- [ ] Créer les relations ProjectMember lors de la création

### 4. Changer le Lien de la Carte Projet
- [ ] Modifier `components/ProjectsList.tsx` pour lier vers le projet au lieu du Kanban
- [ ] Garder le bouton "Accéder au Kanban" séparé

### 5. Améliorer la Création de Tâche
- [ ] Modifier `app/projects/[id]/tasks/new/page.tsx` pour inclure l'assignation
- [ ] Récupérer les membres du projet
- [ ] Ajouter une liste déroulante pour l'assigné

### 6. Améliorer l'Interface du Projet
- [ ] Modifier `app/projects/[id]/page.tsx` pour un meilleur accès au Kanban
- [ ] Améliorer la présentation des tâches avec assignés

## État d'Avancement
- [x] Plan créé et approuvé
- [ ] Composant UserSelector en cours
