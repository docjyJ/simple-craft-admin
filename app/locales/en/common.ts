export default {
  app: {
    title: 'SimpleCraftAdmin',
    brand: 'Simple Craft Admin',
  },
  nav: {
    dashboard: 'Dashboard',
    servers: 'Servers',
    users: 'Users',
    settings: 'Settings',
  },
  auth: {
    logout: 'Logout',
  },
  error: {
    oops: 'Oops!',
    unexpected: 'An unexpected error occurred.',
    404: '404',
    generic: 'Error',
    notfound: 'The requested page could not be found.',
  },
  login: {
    title: 'Login',
    username: 'Username',
    password: 'Password',
    submit: 'Log In',
    error: {
      required: {
        username: 'Username is required',
        password: 'Password is required',
      },
      invalid: 'Invalid username or password',
    },
  },
  settings: {
    theme: 'Theme',
    themeOptions: {
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
    },
    language: 'Language',
    save: 'Save',
    title: 'Settings',
  },
  servers: {
    empty: 'No servers yet',
  },
  public: {
    login: 'Login',
    dashboard: 'Dashboard access',
    table: {
      server: 'Server',
      players: 'Players',
      version: 'Version',
      status: 'Status',
      empty: 'No server found.',
    },
  },
  status: {
    online: 'Online',
    offline: 'Offline',
  },
  server: {
    version: {
      unknown: 'Unknown',
    },
  },
} as const;
