import { redirect } from 'react-router';
import type { Route } from './+types/index';
import { requireAuth } from '~/utils.server/session';

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return redirect('/dashboard');
}
