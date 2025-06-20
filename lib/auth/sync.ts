import { User } from '@supabase/supabase-js';
import { db } from '../utils/db';

export async function syncUserToPrisma(supabaseUser: User): Promise<void> {
  try {
    await db.profile.upsert({
      where: { id: supabaseUser.id },
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || null,
        avatar_url: supabaseUser.user_metadata?.avatar_url || null,
      },
      update: {
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || null,
        avatar_url: supabaseUser.user_metadata?.avatar_url || null,
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to sync user to Prisma:', error);
    throw error;
  }
}

export async function userExistsInPrisma(userId: string): Promise<boolean> {
  try {
    const count = await db.profile.count({
      where: { id: userId },
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    throw error;
  }
}
