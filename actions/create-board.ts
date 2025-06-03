'use server';

import { z } from 'zod';
import { db } from '@/lib/db';

const CreateBoard = z.object({
  title: z.string(),
  organizationId: z.string()
});

export async function create(formData: FormData) {
  const { title, organizationId } = CreateBoard.parse({
    title: formData.get('title'),
    organizationId: formData.get('organizationId')
  });

  await db.board.create({
    data: {
      title,
      organization: {
        connect: {
          id: organizationId
        }
      }
    }
  });

  return { success: true };
}
