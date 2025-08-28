import { redirect } from 'react-router';
import { requireAuth } from '~/utils.server/session';

export async function loader({ request }: { request: Request }) {
  await requireAuth(request);
  return redirect('/servers');
}
