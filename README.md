# 🌹 LoveRose — Application de Rencontre PWA Premium Complète

**LoveRose** est une application web de rencontre haut de gamme, moderne, ultra-rapide et sécurisée, conçue comme une **Progressive Web App (PWA)** installable sur Android, iPhone, tablettes et ordinateurs. L'application intègre des fonctionnalités premium et un algorithme de matching intelligent de pointe adapté aux utilisateurs africains et internationaux.

Déploiement prévu : **[https://loverose.pages.dev](https://loverose.pages.dev)**

---

## 🚀 Fonctionnalités Majeures

### 1. Progressive Web App (PWA) de Bout en Bout
* **Installation Intégrée** : Un bouton "Installer LoveRose" interactif s'affiche dynamiquement sur Android, iOS et ordinateur.
* **Stratégie de Cache Avancée** :
  * *Cache First* : Chargement instantané des styles, polices de caractères, icônes et scripts.
  * *Network First* : Synchronisation dynamique hors-ligne pour la messagerie en temps réel, les profils et les matches.
* **Offline Mode** : Capacité à consulter les profils déjà chargés et à rédiger des messages en mode déconnecté (les messages se synchronisent automatiquement lors du retour au réseau via Firestore).

### 2. Authentification & Parcours d'Inscription Premium
* **Firebase Auth** : Connexion via Email/Mot de passe sécurisée et persistante.
* **Parcours d'Inscription en 8 Étapes** avec sauvegarde automatique de l'état :
  * Prénom & Date de naissance (Contrôle strict : Interdiction des moins de 18 ans).
  * Sélection du Genre & de l'Orientation.
  * Ville, Pays & Intérêts de passion.
  * Sélection de photo principale obligatoire.
  * Barre de progression fluide en temps réel.

### 3. Système Swipe & Algorithme de Matching
* **Swipe Interactif** : Expérience fluide de type Tinder (Like, Pass, Super Like) propulsée par Framer Motion.
* **Compatibilité IA (%)** : Score calculé dynamiquement en fonction des passions communes, de la proximité géographique et des langues partagées.
* **"It's a Match!" Popup** : Animation immersive s'affichant immédiatement lors d'une affinité réciproque, permettant d'ouvrir la messagerie.

### 4. Messagerie Temps Réel & Appels Premium
* **Messagerie Firestore** : Échanges instantanés en temps réel avec indicateurs de présence, gestion des suppressions de messages (Soft-delete) et réponses référencées (Reply).
* **Flux Multimédia** : Envoi de messages texte, partage d'images, de GIFs animés et de notes vocales pré-enregistrées de démonstration.
* **Appels Audio & Vidéo WebRTC** : Système d'appel fluide intégré avec contrôle du microphone et de la caméra, disponible pour les membres Premium et VIP.

### 5. Vérification de Profil par IA (Gemini API)
* **Niveau 1** : Email vérifié.
* **Niveau 2** : Téléphone vérifié.
* **Niveau 3 — Selfie IA** : L'utilisateur fournit un selfie de contrôle. Notre serveur interroge la puissance de **Gemini AI** (`gemini-2.5-flash`) pour comparer le selfie avec la photo principale de l'utilisateur en calculant un score de confiance de correspondance faciale. S'il correspond, le badge de confiance **✔ Profil Vérifié** s'active automatiquement !

### 6. Boutique Premium & Webhooks Money Fusion
* **Trois Offres Spéciales** : Premium Mensuel, Premium Annuel et VIP Membre.
* **Passerelle de Paiement Money Fusion** : Simulation hautement fidèle du formulaire d'achat pour Mobile Money (Orange, MTN, Moov) et déclenchement d'un appel réseau en temps réel vers notre webhook Express `/api/moneyfusion/webhook` pour valider l'abonnement et l'écrire dans la collection des paiements et des abonnements Firestore.

### 7. Console d'Administration complète
* **Rôles Utilisateurs** : `user`, `moderator`, `admin`.
* **Tableau de Bord Statistiques** : Visualisations de courbes de croissance d'inscriptions et revenus générés.
* **Modération & Gestion** : Possibilité d'accorder manuellement le statut Premium, de nommer des modérateurs ou de valider manuellement les selfies de niveau 3 en attente.
* **Exportation de Données** : Export en un clic de l'annuaire des utilisateurs au format CSV.

---

## 🛠️ Stack Technique

* **Frontend** : React 19, Vite, Tailwind CSS (V4), Framer Motion, Zustand, React Router Dom.
* **Backend** : Node.js, Express, Firebase Authentication, Firestore Database, Firebase Storage.
* **AI Integration** : Google GenAI SDK (`@google/genai` avec Gemini 2.5).

---

## 📁 Architecture Modulaire du Projet

```text
/
├── server.ts               # Serveur Express principal (Middleware Vite + API Routes)
├── firestore.rules         # Règles de sécurité Firestore hautement restrictives
├── storage.rules           # Règles de sécurité Firebase Storage
├── firebase.json           # Configuration du déploiement Firebase
├── public/
│   ├── manifest.json       # Manifeste de l'application installable PWA
│   ├── sw.js               # Service Worker (Stratégies de cache)
│   └── _redirects          # Règles de redirection d'URL pour Cloudflare Pages
├── src/
│   ├── App.tsx             # Routeur applicatif et protections de pages
│   ├── types.ts            # Déclarations des interfaces de données partagées
│   ├── components/         
│   │   └── Layout.tsx      # Barre de navigation, PWA Banner, Alertes d'appels WebRTC
│   ├── contexts/           
│   │   └── AuthContext.tsx # Gestion de session Firebase Auth & Profil Firestore
│   ├── firebase/           
│   │   └── config.ts       # Initialisation du SDK client Firebase
│   ├── store/              
│   │   └── appStore.ts     # Store applicatif Zustand
│   └── pages/              
│       ├── Landing.tsx     # Page d'accueil SEO et Authentification
│       ├── Onboarding.tsx  # Parcours d'inscription guidé en 8 étapes
│       ├── Discovery.tsx   # Découverte Swiper Tinder & Match popup
│       ├── Messenger.tsx   # Messagerie instantanée & Appels WebRTC
│       ├── PremiumShop.tsx # Offres, historique et achat Money Fusion
│       ├── UserProfilePage.tsx # Edition de profil, confidentialité & Selfie IA
│       ├── AdminDashboard.tsx  # Console d'administration et rapports graphiques
│       ├── Terms.tsx       # Conditions Générales d'Utilisation
│       ├── Privacy.tsx     # Politique de Confidentialité
│       └── Contact.tsx     # Formulaire de support
```

---

## ⚙️ Configuration & Installation

### 1. Variables d'Environnement (`.env`)
Créez un fichier `.env` à la racine de votre projet en vous basant sur `.env.example` :

```env
# Clé API Google AI Studio pour la vérification de selfie par l'IA
GEMINI_API_KEY="VOTRE_CLE_GEMINI"

# Configuration Firebase Client (Remplie automatiquement avec le projet provisionné d'AI Studio)
VITE_FIREBASE_API_KEY="AIzaSyDY1Z9BzbnB6l6kWm6A3iWeilaVjrtpRYY"
VITE_FIREBASE_AUTH_DOMAIN="gen-lang-client-0952168484.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="gen-lang-client-0952168484"
VITE_FIREBASE_STORAGE_BUCKET="gen-lang-client-0952168484.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="604977910467"
VITE_FIREBASE_APP_ID="1:604977910467:web:f4f02c50bfe6b37d074876"

# Configuration Money Fusion
VITE_MONEYFUSION_API_KEY="VOTRE_CLE_MONEYFUSION"
```

### 2. Démarrage en Mode Développement
Pour lancer le serveur de développement Express avec le middleware Vite :
```bash
npm run dev
```
Le serveur démarrera sur **[http://localhost:3000](http://localhost:3000)**.

### 3. Compilation & Construction pour la Production
Pour compiler le frontend et le backend Express :
```bash
npm run build
```
Le serveur d'Express sera compilé en un seul fichier optimisé `dist/server.cjs` via esbuild.

### 4. Démarrage de Production
```bash
npm start
```

---

## 🛡️ Règles de Sécurité Firestore

Les règles définies dans `firestore.rules` protègent l'application contre les accès non autorisés :
* **users** : Lecture par tout utilisateur connecté, modification uniquement par le propriétaire ou un modérateur.
* **likes** : Lecture par l'émetteur ou le récepteur, écriture par l'émetteur.
* **matches / messages** : Seuls les membres faisant partie du match peuvent lire et écrire les messages associés.
* **payments / subscriptions** : Lecture sécurisée par l'utilisateur propriétaire, écriture exclusive par l'administrateur ou les services backend.
