import { createClient } from '../supabase/server';
import { syncUserToPrisma } from './sync';

export async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Authentication required');
  }

  return user.id;
}

export async function withAuth<T>(
  callback: (userId: string) => Promise<T>,
): Promise<T> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Authentication required');
  }

  await syncUserToPrisma(user);

  return await callback(user.id);
}

export async function optionalAuth(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user.id;
  } catch {
    return null;
  }
}
