import type {
  // Organization,
  OrganizationCreateInput,
  OrganizationInvitation,
  // OrganizationInviteInput,
  // OrganizationMember,
  OrganizationRole,
  OrganizationUpdateInput,
  PrismaOrganization,
  PrismaOrganizationMember,
} from '@/types';
import {
  organizationCreateSchema,
  organizationInviteSchema,
  // organizationRoleSchema,
  // organizationUpdateSchema,
} from '@/types';
import { withAuth } from '@/lib/auth/middleware';
import { handleError } from '@/lib/utils/error-handling';
import { PrismaClient } from '@/lib/generated/prisma';
import { db } from '@/lib/utils/db';
import { uploadFile } from './file-upload.service';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required',
  ORG_NOT_FOUND: 'Organization not found',
  NO_PERMISSION: 'You do not have permission to perform this action',
  INVALID_INPUT: 'Invalid input provided',
  SLUG_EXISTS: 'An organization with this slug already exists',
} as const;

const validateOrganizationInput = (input: OrganizationCreateInput) => {
  try {
    return organizationCreateSchema.parse(input);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(ERROR_MESSAGES.INVALID_INPUT);
  }
};

const checkUserPermission = async (
  prisma: TransactionClient,
  organizationId: string,
  userId: string,
  requiredRole: OrganizationRole = 'member',
): Promise<boolean> => {
  const membership = await prisma.organizationMembers.findFirst({
    where: {
      organization_id: organizationId,
      profile_id: userId,
      role:
        requiredRole === 'member'
          ? { in: ['member', 'admin', 'owner'] }
          : requiredRole === 'admin'
            ? { in: ['admin', 'owner'] }
            : 'owner',
    },
  });
  return !!membership;
};

const handleLogoUpload = async (
  logo: File | undefined,
  currentLogoUrl?: string,
): Promise<string | undefined> => {
  if (!logo || !(logo instanceof File)) return currentLogoUrl;

  try {
    const fileUploadResult = await uploadFile(logo, 'organization-logos');
    return fileUploadResult || currentLogoUrl;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error during logo upload';
    console.error('Logo upload failed:', errorMessage);
    return currentLogoUrl;
  }
};

export const createOrganization = async (
  props: OrganizationCreateInput & { logo?: File },
): Promise<PrismaOrganization | null> => {
  return withAuth(async (userId) => {
    try {
      validateOrganizationInput(props);

      const slugExists = await db.organization.findUnique({
        where: { slug: props.slug },
        select: { id: true },
      });

      if (slugExists) {
        throw new Error(ERROR_MESSAGES.SLUG_EXISTS);
      }

      const logoUrl = await handleLogoUpload(props.logo, props.logo_url);

      return await db.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: props.name,
            slug: props.slug,
            logo_url: logoUrl,
            created_by: userId,
          },
        });

        await tx.organizationMembers.create({
          data: {
            organization_id: organization.id,
            profile_id: userId,
            role: 'admin',
          },
        });

        return organization;
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create organization';
      handleError(error, {
        defaultMessage: errorMessage,
        context: {
          action: 'createOrganization',
          props,
          error: errorMessage,
        },
        showToast: true,
      });
      return null;
    }
  });
};

export const checkSlugAvailability = async (slug: string): Promise<boolean> => {
  if (!slug?.trim()) {
    throw new Error(ERROR_MESSAGES.INVALID_INPUT);
  }

  return withAuth(async () => {
    try {
      const existingOrg = await db.organization.findUnique({
        where: { slug },
        select: { id: true },
      });

      return !existingOrg;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to check slug availability';
      handleError(error, {
        defaultMessage: errorMessage,
        context: {
          action: 'checkSlugAvailability',
          slug,
          error: errorMessage,
        },
        showToast: true,
      });
      return false;
    }
  });
};

export const fetchUserOrganizations = async (): Promise<{
  organizations: PrismaOrganization[];
  memberships: Array<
    PrismaOrganizationMember & { organization: PrismaOrganization }
  >;
}> => {
  return withAuth(async (userId) => {
    try {
      const [organizations, memberships] = await Promise.all([
        db.organization.findMany({
          where: { created_by: userId },
          orderBy: { created_at: 'desc' },
        }),
        db.organizationMembers.findMany({
          where: {
            profile_id: userId,
            organization: { created_by: { not: userId } },
          },
          include: {
            organization: true,
          },
          orderBy: { created_at: 'desc' },
        }),
      ]);

      return { organizations, memberships };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch organizations';
      handleError(error, {
        defaultMessage: errorMessage,
        context: {
          action: 'fetchUserOrganizations',
          error: errorMessage,
        },
        showToast: true,
      });
      return { organizations: [], memberships: [] };
    }
  });
};

export const updateOrganization = async (
  id: string,
  updates: OrganizationUpdateInput & {
    logo?: File;
  },
): Promise<PrismaOrganization | null> => {
  return withAuth(async (userId) => {
    try {
      if (!id) {
        throw new Error('Organization ID is required');
      }

      const organization = await db.organization.findUnique({
        where: { id },
      });

      if (!organization) {
        throw new Error(ERROR_MESSAGES.ORG_NOT_FOUND);
      }

      const hasPermission = await checkUserPermission(db, id, userId, 'admin');
      if (!hasPermission) {
        throw new Error(ERROR_MESSAGES.NO_PERMISSION);
      }

      let logoUrl = updates.logo_url;
      if (updates.logo) {
        logoUrl = await handleLogoUpload(
          updates.logo,
          organization.logo_url || undefined,
        );
        const { logo, ...updatesWithoutLogo } = updates;
        updates = { ...updatesWithoutLogo, logo_url: logoUrl };
      }

      if (updates.slug && updates.slug !== organization.slug) {
        const slugAvailable = await checkSlugAvailability(updates.slug);
        if (!slugAvailable) {
          throw new Error(ERROR_MESSAGES.SLUG_EXISTS);
        }
      }

      return await db.$transaction(async (tx) => {
        const updated = await tx.organization.update({
          where: { id },
          data: {
            ...updates,
            updated_at: new Date(),
          },
        });

        return updated;
      });
    } catch (error: any) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update organization';
      handleError(error, {
        defaultMessage: errorMessage,
        context: {
          action: 'updateOrganization',
          id,
          updates,
          error: errorMessage,
        },
        showToast: true,
      });
      return null;
    }
  });
};

export const deleteOrganization = async (id: string): Promise<boolean> => {
  return withAuth(async (userId) => {
    try {
      if (!id) {
        throw new Error('Organization ID is required');
      }

      const organization = await db.organization.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              members: true,
              Board: true,
              OrganizationInvitation: true,
            },
          },
        },
      });

      if (!organization) {
        throw new Error(ERROR_MESSAGES.ORG_NOT_FOUND);
      }

      if (organization.created_by !== userId) {
        throw new Error(ERROR_MESSAGES.NO_PERMISSION);
      }

      await db.$transaction([
        db.organizationMembers.deleteMany({
          where: { organization_id: id },
        }),
        // Delete all organization invitations
        db.organizationInvitation.deleteMany({
          where: { organization_id: id },
        }),
        // Delete all organization boards and their related data
        db.board.deleteMany({
          where: { organization_id: id },
        }),
        // Finally, delete the organization itself
        db.organization.delete({
          where: { id },
        }),
      ]);

      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      handleError(error, {
        defaultMessage: 'Failed to delete organization',
        context: {
          action: 'deleteOrganization',
          id,
          error: errorMessage,
        },
        showToast: true,
      });
      return false;
    }
  });
};

/**
 * Organization Invitations
 */

export const inviteToOrganization = async (
  organization_id: string,
  email: string,
  role: OrganizationRole = 'member',
) => {
  try {
    organizationInviteSchema.parse({ organization_id, email, role });
  } catch (error) {
    if (error instanceof Error) {
      handleError(error, {
        defaultMessage: ERROR_MESSAGES.INVALID_INPUT,
        context: {
          action: 'inviteToOrganization',
          input: { organization_id, email, role },
        },
        showToast: true,
      });
      return false;
    }
  }
  return withAuth(async (userId) => {
    try {
      if (!userId) {
        handleError('auth', {
          showToast: true,
        });
        return false;
      }

      const token = crypto.randomUUID();

      // Using Prisma instead of Supabase
      const invitation = await db.organizationInvitation.create({
        data: {
          organization_id,
          email,
          role,
          invited_by: userId.toString(),
          status: 'pending',
          token,
        },
      });

      return invitation as OrganizationInvitation;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create organization invitation';
      handleError(error, {
        defaultMessage: errorMessage,
        context: {
          action: 'inviteToOrganization',
          organization_id,
          email,
          error: errorMessage,
        },
        showToast: true,
      });
      return false;
    }
  });
};

export const listOrganizationInvitations = async (organization_id: string) => {
  return withAuth(async (userId) => {
    try {
      // Using Prisma instead of Supabase
      const invitations = await db.organizationInvitation.findMany({
        where: { organization_id },
        orderBy: { created_at: 'desc' },
      });

      return invitations as OrganizationInvitation[];
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to get invitations list',
        context: { action: 'listOrganizationInvitations', organization_id },
        showToast: true,
      });
      return [] as OrganizationInvitation[];
    }
  });
};

export const resendOrganizationInvitation = async (invitation_id: string) => {
  return withAuth(async (userId) => {
    try {
      const token = crypto.randomUUID();

      // Using Prisma instead of Supabase
      const invitation = await db.organizationInvitation.update({
        where: { id: invitation_id },
        data: {
          token,
          status: 'pending',
          accepted_at: null,
          revoked_at: null,
        },
      });

      return invitation as OrganizationInvitation;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to resend invitation';
      handleError(error, {
        defaultMessage: errorMessage,
        context: {
          action: 'resendOrganizationInvitation',
          invitation_id,
          error: errorMessage,
        },
        showToast: true,
      });
      return false;
    }
  });
};

export const revokeOrganizationInvitation = async (invitation_id: string) => {
  return withAuth(async (userId) => {
    try {
      // Using Prisma instead of Supabase
      const invitation = await db.organizationInvitation.update({
        where: { id: invitation_id },
        data: {
          status: 'revoked',
          revoked_at: new Date(),
        },
      });

      return invitation as OrganizationInvitation;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to revoke invitation',
        context: { action: 'revokeOrganizationInvitation', invitation_id },
        showToast: true,
      });
      return false;
    }
  });
};

export const acceptOrganizationInvitation = async (
  token: string,
  profile_id: string,
) => {
  return withAuth(async (userId) => {
    try {
      // Using Prisma instead of Supabase
      const invite = await db.organizationInvitation.findFirst({
        where: {
          token,
          status: 'pending',
        },
      });

      if (!invite) {
        handleError(new Error('Invitation not found'), {
          defaultMessage: "Can't find invitation",
          context: { action: 'acceptOrganizationInvitation', token },
          showToast: true,
        });
        return false;
      }

      return await db.$transaction(async (tx) => {
        await tx.organizationMembers.create({
          data: {
            organization_id: invite.organization_id,
            profile_id,
            role: invite.role,
          },
        });

        await tx.organizationInvitation.update({
          where: { id: invite.id },
          data: {
            status: 'accepted',
            accepted_at: new Date(),
          },
        });

        return true;
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        handleError(error, {
          defaultMessage: 'You are already a member of this organization',
          context: {
            action: 'acceptOrganizationInvitation',
            token,
            profile_id,
          },
          showToast: true,
        });
      } else {
        handleError(error, {
          defaultMessage: 'Failed to accept invitation',
          context: {
            action: 'acceptOrganizationInvitation',
            token,
            profile_id,
          },
          showToast: true,
        });
      }
      return false;
    }
  });
};
