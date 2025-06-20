import type { Board } from '@/types';
import { withPrismaAuth } from '@/lib/auth/prisma';
import { db } from '@/lib/utils/db';
import { handleError } from '@/lib/utils/error-handling';

export const createBoard = async (
  title: string,
  organization_id: string,
): Promise<Board | false> => {
  return withPrismaAuth(async () => {
    try {
      const board = await db.board.create({
        data: {
          title,
          organization_id,
        },
      });

      if (!board) {
        throw new Error('Board creation returned no data');
      }

      return board as Board;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to create board',
        context: { action: 'createBoard', title, organization_id },
        showToast: true,
      });
      return false;
    }
  });
};

export const fetchBoardsByOrganization = async (
  organization_id: string,
): Promise<Board[]> => {
  return withPrismaAuth(async () => {
    try {
      const boards = await db.board.findMany({
        where: { organization_id },
        orderBy: { title: 'asc' },
      });

      return boards as Board[];
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to fetch boards',
        context: { action: 'fetchBoardsByOrganization', organization_id },
        showToast: true,
      });
      return [];
    }
  });
};

export const updateBoard = async (
  id: string,
  updates: Partial<Board>,
): Promise<Board | false> => {
  return withPrismaAuth(async () => {
    try {
      const updatedBoard = await db.board.update({
        where: { id },
        data: updates,
      });

      if (!updatedBoard) {
        throw new Error('Failed to update board');
      }

      return updatedBoard as Board;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to update board',
        context: { action: 'updateBoard', id },
        showToast: true,
      });
      return false;
    }
  });
};

export const deleteBoard = async (id: string): Promise<boolean> => {
  return withPrismaAuth(async () => {
    try {
      await db.board.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to delete board',
        context: { action: 'deleteBoard', id },
        showToast: true,
      });
      return false;
    }
  });
};
