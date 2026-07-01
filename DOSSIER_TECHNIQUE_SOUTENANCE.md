# 📘 Dossier Technique de Soutenance : TeamFlow

Ce document est conçu pour vous accompagner lors de votre présentation devant le jury. Il détaille l'architecture, les choix technologiques et le fonctionnement interne de chaque module de votre plateforme de gestion d'équipe.

---

## 1. Présentation du Projet
**TeamFlow** est une plateforme intégrée de collaboration et de gestion de projet. Elle vise à centraliser les outils de communication (Chat, Vidéo), de gestion opérationnelle (Projets, Tâches, Fichiers) et de gestion humaine (Annuaire, Profils) au sein d'une interface unique, moderne et haute performance.

---

## 2. Architecture et Stack Technique

L'application repose sur une architecture **Full-Stack moderne** utilisant le framework **Next.js**.

### **Frontend & Framework**
- **Next.js 14 (App Router)** : Utilisation du rendu côté serveur (SSR) et des composants clients pour une vitesse de navigation optimale et un SEO performant.
- **Tailwind CSS** : Système de design atomique pour une interface "premium", responsive et dynamique.
- **Framer Motion** : Utilisé pour les micro-animations et les transitions fluides (très apprécié par les jurys pour l'aspect "professionnel").
- **Lucide React** : Bibliothèque d'icônes vectorielles cohérente.

### **Backend & Persistance**
- **Prisma ORM** : Couche d'abstraction pour la base de données, permettant des requêtes typées et sécurisées.
- **Neon (PostgreSQL)** : Base de données relationnelle serverless.
- **Next-Auth** : Gestion sécurisée de l'authentification (Sessions, JWT).

### **Communication Temps Réel**
- **Pusher / WebSockets** : Utilisé pour le chat et les notifications instantanées sans rechargement de page.

---

## 3. Détails des Modules Fonctionnels

### **A. Authentification & Sécurité**
- **Implémentation** : Basée sur **Next-Auth.js** avec une stratégie **JWT (JSON Web Token)**.
- **Fonctionnement** :
    - Les mots de passe sont cryptés avec **Bcrypt.js** (sel de force 12) avant stockage.
    - Une "Route Guard" protège les pages `/dashboard`, `/projects`, `/chat`, etc., en redirigeant les utilisateurs non connectés vers `/auth/signin`.
- **Argument pour le Jury** : "La sécurité repose sur des standards industriels, évitant le stockage en clair des identifiants et utilisant des sessions côté serveur."

### **B. Tableau de Bord (Dashboard)**
- **Implémentation** : Agrégation de données en temps réel via des composants serveurs Next.js.
- **Fonctionnement** : 
    - Calcul dynamique du nombre de projets actifs, tâches en retard et notifications non lues.
    - Graphiques de performance réalisés avec **Recharts**.
- **Argument technique** : "Le Dashboard utilise `force-dynamic` pour garantir que les statistiques sont toujours à jour au moment du chargement."

### **C. Gestion de Projets & Kanban**
- **Implémentation** : Modèle relationnel `Project` ↔ `Task`.
- **Fonctionnement** :
    - Chaque projet peut avoir plusieurs membres (`GroupMember`).
    - Les tâches disposent d'états (`TODO`, `IN_PROGRESS`, `DONE`) et de priorités.
    - Intégration du Drag & Drop pour le tableau Kanban (via `@dnd-kit`).

### **D. Annuaire & Système d'Invitations**
- **Implémentation** : Utilisation des tables `Contact` et `ContactRequest`.
- **Fonctionnement** :
    - Flux : **Recherche** (par email) → **Envoi** (création `PENDING`) → **Réception** (chez le destinataire) → **Acceptation** (crée deux entrées dans `Contact` pour la réciprocité).
    - J'ai personnellement implémenté un système de messages de succès et de gestion d'erreurs UI pour une expérience utilisateur sans friction.

### **E. Messagerie Instantanée (Chat)**
- **Implémentation** : Modèle `Room` et `ChatMessage`.
- **Fonctionnement** :
    - Les salons peuvent être **DIRECT** (privé entre 2 personnes) ou **GROUP**.
    - Les messages sont envoyés via une API POST qui déclenche un événement **Pusher**.
    - Le client écoute ces événements pour mettre à jour l'interface instantanément.

---

## 4. Choix Techniques Stratégiques (Le point fort de votre défense)

### **L'Adaptateur HTTP pour Prisma (Mode Stateless)**
Lors du développement, nous avons été confrontés à des restrictions réseau bloquant les ports PostgreSQL standards (5432). 
- **Ma Solution** : J'ai configuré Prisma pour utiliser l'adaptateur `@neondatabase/serverless` en mode **HTTP**.
- **Pourquoi c'est important ?** : Contrairement aux connexions TCP persistantes qui peuvent figer ou être bloquées par des pare-feux, le mode HTTP traite chaque requête de base de données de manière isolée et ultra-fiable. Cela garantit que la plateforme fonctionne partout, même sur des réseaux restreints.

---

## 5. Schéma de Données (Résumé)

- **User** : Noyau du système (Profil, Role, Bio).
- **Project / Task** : Structure de gestion de travail.
- **Contact / ContactRequest** : Réseau social professionnel.
- **Room / ChatMessage** : Infrastructure de communication.
- **Notification** : Système d'alertes utilisateur.

---

## 6. Conclusion pour la soutenance
*"TeamFlow n'est pas qu'un simple outil de gestion, c'est une infrastructure technique pensée pour l'évolutivité. Grâce à l'utilisation de Next.js et d'un adaptateur de base de données moderne, nous offrons une stabilité et une réactivité maximale tout en maintenant un code propre et maintenable via Prisma."*

---
> [!TIP]
> **Conseil pour l'oral** : Si le jury pose une question sur la base de données, mentionnez que vous avez utilisé **CUID** (Collison-resistant Unique Identifier) au lieu d'Auto-increment pour les IDs, ce qui est plus sécurisé et plus adapté aux systèmes distribués.
