import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('./routes/index.tsx'),
  route('login', './routes/login.tsx'),
  route('logout', './routes/logout.ts'),
  layout('./auth-layout.tsx', [
    route('servers', './routes/servers/index.tsx'),
    route('servers/:uid', './routes/servers/$uid.tsx', [
      index('./routes/servers/$uid/index.tsx'),
      route('log', './routes/servers/$uid/log.ts'),
      route('settings', './routes/servers/$uid/settings.tsx'),
      route('files', './routes/servers/$uid/files/index.tsx'),
      route('files/download', './routes/servers/$uid/files/download.ts'),
      route('files/delete', './routes/servers/$uid/files/delete.tsx'),
      route('files/rename', './routes/servers/$uid/files/rename.tsx'),
      route('files/extract', './routes/servers/$uid/files/extract.tsx'),
    ]),
    route('users/new', './routes/users/new.tsx'),
  ]),
] satisfies RouteConfig;
