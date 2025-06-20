'use server';

import { z } from 'zod';
import { createBoard } from '@/lib/services/board.service';
import { revalidatePath } from 'next/cache';

const CreateBoard = z.object({
  title: z.string(),
  organizationId: z.string()
});

export async function create(formData: FormData) {
  try {
    const { title, organizationId } = CreateBoard.parse({
      title: formData.get('title'),
      organizationId: formData.get('organizationId')
    });

    const result = await createBoard(title, organizationId);
    
    if (result) {
      // Revalidate relevant paths to refresh the UI
      revalidatePath(`/organization`);
      revalidatePath(`/organization/${organizationId}`);
      return { success: true, board: result };
    }
    
    return { success: false, error: 'Failed to create board' };
  } catch (error: any) {
    console.error('Create board action error:', error);
    return { success: false, error: error.message || 'Failed to create board' };
  }
}
