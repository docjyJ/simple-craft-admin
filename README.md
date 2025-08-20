# SimpleCraftAdmin

Interface d'administration web moderne pour serveurs Minecraft, construite avec React Router et TypeScript.

## 📖 Description

SimpleCraftAdmin est une application web complète qui permet de gérer facilement vos serveurs Minecraft depuis un navigateur. L'application offre une interface intuitive pour créer, configurer, surveiller et administrer plusieurs serveurs Minecraft simultanément.

## ✨ Fonctionnalités

### 🎮 Gestion des serveurs
- **Création rapide** : Créez de nouveaux serveurs Minecraft en quelques clics
- **Démarrage/Arrêt** : Contrôlez l'état de vos serveurs depuis l'interface
- **Surveillance temps réel** : Visualisez le statut, le nombre de joueurs connectés et les informations du serveur

### ⚙️ Configuration
- **Paramètres du serveur** : Configurez le port, le MOTD, le nombre maximum de joueurs
- **Gestion des JARs** : Téléchargement automatique des fichiers JAR depuis une URL
- **Fichiers de propriétés** : Édition des fichiers `server.properties` et configurations personnalisées

### 📁 Explorateur de fichiers
- **Navigation intuitive** : Parcourez les dossiers de vos serveurs
- **Éditeur intégré** : Modifiez les fichiers de configuration avec coloration syntaxique
- **Gestion des fichiers** : Upload, téléchargement, suppression et renommage
- **Archives** : Extraction d'archives ZIP directement dans l'interface

### 📊 Surveillance et logs
- **Logs en temps réel** : Consultez les logs des serveurs
- **Statut des joueurs** : Nombre de joueurs connectés et capacité maximale
- **Informations du serveur** : Version, icône et détails techniques

### 🔧 Fonctionnalités techniques
- **Interface moderne** : Design responsive avec [Mantine UI](https://mantine.dev)
- **TypeScript** : Code entièrement typé pour une meilleure fiabilité
- **Server-side rendering** : Performance optimisée avec React Router
- **Déploiement Docker** : Conteneurisation prête pour la production

## 🚀 Installation

### Prérequis

- **Node.js** 18+ 
- **Java** 8+ (pour exécuter les serveurs Minecraft)
- **npm** ou **pnpm**

### Installation locale

1. **Clonez le repository** :
```bash
git clone https://github.com/docjyJ/simple-craft-admin.git
cd simple-craft-admin
```

2. **Installez les dépendances** :
```bash
npm install
# ou
pnpm install
```

3. **Lancez le serveur de développement** :
```bash
npm run dev
# ou
pnpm dev
```

4. **Accédez à l'application** :
   Ouvrez votre navigateur sur `http://localhost:5173`

## 🐳 Déploiement Docker

### Construction et exécution avec Docker

```bash
# Construire l'image
docker build -t simple-craft-admin .

# Lancer le conteneur
docker run -p 8000:8000 -v $(pwd)/minecraft:/app/minecraft simple-craft-admin
```

### Docker Compose (recommandé)

Créez un fichier `docker-compose.yml` :

```yaml
version: '3.8'
services:
  simple-craft-admin:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./minecraft:/app/minecraft
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

Puis lancez :
```bash
docker-compose up -d
```

## 📚 Utilisation

### 1. Créer un nouveau serveur

1. Accédez à la page d'accueil
2. Cliquez sur "Create New Server"
3. Entrez un nom pour votre serveur
4. Le serveur sera créé avec une configuration par défaut

### 2. Configurer un serveur

1. Cliquez sur l'icône d'édition d'un serveur
2. Allez dans l'onglet "Settings"
3. Configurez :
   - **Nom du serveur**
   - **Port** (par défaut : 25565)
   - **URL du JAR** : Lien vers le fichier JAR Minecraft

### 3. Démarrer un serveur

1. Sur la page de gestion du serveur
2. Cliquez sur le bouton "Start" (icône power)
3. Le serveur va télécharger le JAR si nécessaire et démarrer

### 4. Gérer les fichiers

1. Accédez à l'onglet "Files" d'un serveur
2. Naviguez dans l'arborescence
3. Éditez les fichiers directement dans le navigateur
4. Uploadez des fichiers ou extrayez des archives

## 🛠️ Développement

### Scripts disponibles

```bash
# Développement avec hot reload
npm run dev

# Construction pour la production
npm run build

# Démarrage en mode production
npm run start

# Tests
npm run test

# Vérification des types TypeScript
npm run typecheck

# Formatage du code
npm run format
```

### Structure du projet

```
├── app/
│   ├── components/          # Composants React réutilisables
│   ├── hooks/              # Hooks personnalisés
│   ├── routes/             # Pages et routes de l'application
│   ├── server/             # Logique serveur (gestion Minecraft)
│   └── root.tsx            # Point d'entrée de l'app
├── public/                 # Assets statiques
├── minecraft/              # Dossier des serveurs Minecraft (créé automatiquement)
├── Dockerfile             # Configuration Docker
└── package.json           # Dépendances et scripts
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` :

```env
# Port de l'application (par défaut : 5173 en dev, 8000 en prod)
PORT=8000

# Dossier racine des serveurs Minecraft
MINECRAFT_ROOT=./minecraft/servers
```

### Sécurité

⚠️ **Important** : Cette application est conçue pour un usage local ou dans un environnement sécurisé. Avant de l'exposer sur Internet, assurez-vous de :

- Configurer une authentification appropriée
- Utiliser HTTPS
- Restreindre l'accès réseau
- Sauvegarder régulièrement vos données

## 📄 License

Ce projet est sous licence **GNU Affero General Public License v3.0**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commit vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 🐛 Signaler un bug

Utilisez les [GitHub Issues](https://github.com/docjyJ/simple-craft-admin/issues) pour signaler des bugs ou demander de nouvelles fonctionnalités.

---

Développé avec ❤️ par [docjyJ](https://github.com/docjyJ)
