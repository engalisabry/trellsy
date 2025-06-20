import { PrismaClient } from '@/lib/generated/prisma';
import { createClient } from '@/lib/supabase/server';
import { db } from '../utils/db';

export async function withPrismaAuth<T>(
  operation: (prisma: PrismaClient, userId: string) => Promise<T>,
): Promise<T> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Authentication required');
  }

  try {
    return await operation(db, user.id);
  } catch (error) {
    throw error;
  }
}
