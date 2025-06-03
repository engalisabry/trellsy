'use server';

import { db } from '@/lib/db';

export async function createOrganizationOnServer({
  name,
  slug,
  created_by,
}: {
  name: string;
  slug: string;
  created_by: string;
}) {
  try {
    const result = await db.organization.create({
      data: { name, slug, created_by },
    });
    console.log('Inserted organization:', result);
    return { success: true };
  } catch (error: any) {
    console.error('Insert error:', error);
    return { error: error.message || 'Unknown error' };
  }
}
