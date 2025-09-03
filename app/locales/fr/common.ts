export default {
  app: {
    title: 'SimpleCraftAdmin',
    brand: 'Simple Craft Admin',
  },
  nav: {
    dashboard: 'Tableau de bord',
    servers: 'Serveurs',
    users: 'Utilisateurs',
    settings: 'Paramètres',
  },
  auth: {
    logout: 'Déconnexion',
  },
  error: {
    oops: 'Oups !',
    unexpected: 'Une erreur inattendue est survenue.',
    404: '404',
    generic: 'Erreur',
    notfound: 'La page demandée est introuvable.',
  },
  login: {
    title: 'Connexion',
    username: "Nom d'utilisateur",
    password: 'Mot de passe',
    submit: 'Se connecter',
    error: {
      required: {
        username: "Le nom d'utilisateur est requis",
        password: 'Le mot de passe est requis',
      },
      invalid: "Nom d'utilisateur ou mot de passe invalide",
    },
  },
  settings: {
    theme: 'Thème',
    themeOptions: {
      light: 'Clair',
      dark: 'Sombre',
      auto: 'Automatique',
    },
    language: 'Langue',
    save: 'Enregistrer',
    title: 'Paramètres',
  },
  servers: {
    empty: 'Aucun serveur pour le moment',
  },
  public: {
    login: 'Connexion',
    dashboard: 'Accès au tableau de bord',
    table: {
      server: 'Serveur',
      players: 'Joueurs',
      version: 'Version',
      status: 'Statut',
      empty: 'Aucun serveur trouvé.',
    },
  },
  status: {
    online: 'En ligne',
    offline: 'Hors ligne',
  },
  server: {
    version: {
      unknown: 'Inconnue',
    },
  },
} as const;
