import { redirect } from 'react-router';
import { getUser } from '~/server/session';

export async function loader({ request }: { request: Request }) {
  const user = await getUser(request);
  return redirect(user ? '/servers' : '/login');
}
