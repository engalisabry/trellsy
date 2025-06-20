export { createClient as createAuthClient } from '@/lib/supabase/client';
export { createClient as createServerAuthClient } from '@/lib/supabase/server';

export { useAuth, useUser, useSession } from '@/hooks/use-auth';

export * from './actions';

export { requireAuth, withAuth } from './middleware';

export { syncUserToPrisma } from './sync';

export type {
  AuthUser,
  AuthSession,
  AuthState,
  AuthContextType,
} from '@/types';
