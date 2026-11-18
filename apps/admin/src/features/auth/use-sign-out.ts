import { toast } from '@ziarnista/ui/toast';
import { useAppDispatch } from '@/store/hooks';
import { sessionEnded } from '@/store/session-slice';
import { useLogoutMutation } from './auth-api';

/** SessionGate reacts to sessionEnded: it clears the cache and goes to the login page. */
export function useSignOut() {
  const dispatch = useAppDispatch();
  const [logout, { isLoading }] = useLogoutMutation();

  async function signOut() {
    try {
      await logout().unwrap();
      dispatch(sessionEnded());
    } catch {
      // The cookie is httpOnly, so only the API can end the session: the admin is still logged in
      toast.error('Nie udało się wylogować. Spróbuj ponownie.');
    }
  }

  return { signOut, isSigningOut: isLoading };
}
