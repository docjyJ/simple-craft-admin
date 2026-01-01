import { redirect } from 'react-router';
import { logoutUser } from '~/utils.server/session';
import type { Route } from './+types/logout';

export async function loader({ request }: Route.LoaderArgs) {
  return logoutUser(request).then((logoutUser) => redirect('/login', { headers: { 'Set-Cookie': logoutUser.cookie } }));
}
