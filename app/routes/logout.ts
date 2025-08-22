import type { Route } from './+types/logout';
import { logoutUser } from '~/server/session';
import { redirect } from 'react-router';

export async function loader({ request }: Route.LoaderArgs) {
  return logoutUser(request).then((logoutUser) =>
    redirect('/login', { headers: { 'Set-Cookie': logoutUser.cookie } }),
  );
}
