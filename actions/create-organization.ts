'use server';

import { db } from '@/lib/db';
import { handleError } from '@/lib/error-handling';

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
    await db.organization.create({
      data: { name, slug, created_by },
    });

    return { success: true };
  } catch (error: any) {
    handleError('unknown', {
      defaultMessage: 'failed to create organization',
      showToast: true,
    });
    return false;
  }
}
