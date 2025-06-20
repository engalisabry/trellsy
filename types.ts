import { CSSProperties } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { z } from 'zod';

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  syncUserProfile: (user: User) => Promise<void>;
  initialize: () => Promise<void>;
}

export const organizationCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens',
    ),
  logo_url: z.string().optional(),
  logo: z.instanceof(File).optional(),
});

export const organizationUpdateSchema = organizationCreateSchema.partial();

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  created_by: z.string(),
  created_at: z.date().or(z.string()).nullable().optional(),
  updated_at: z.date().or(z.string()).nullable().optional(),
  logo_url: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
});

export type OrganizationRole = 'owner' | 'admin' | 'member';

export const organizationRoleSchema = z.enum(['owner', 'admin', 'member']);

export const organizationMemberSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  profile_id: z.string().nullable().optional(),
  role: organizationRoleSchema,
  created_at: z.date().or(z.string()).nullable().optional(),
  updated_at: z.date().or(z.string()).nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

export const organizationInvitationSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  email: z.string().email('Invalid email address'),
  role: organizationRoleSchema.default('member'),
  token: z.string(),
  status: z.enum(['pending', 'accepted', 'revoked']),
  invited_by: z.string().optional(),
  created_at: z.date().or(z.string()).optional(),
  updated_at: z.date().or(z.string()).nullable().optional(),
  accepted_at: z.date().or(z.string()).nullable().optional(),
  revoked_at: z.date().or(z.string()).nullable().optional(),
});

export const organizationInviteSchema = z.object({
  organization_id: z.string(),
  email: z.string().email('Invalid email address'),
  role: organizationRoleSchema.default('member'),
});

export type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>;
export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;
export type OrganizationInvitation = z.infer<
  typeof organizationInvitationSchema
>;
export type OrganizationInviteInput = z.infer<typeof organizationInviteSchema>;

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

export interface OrganizationState {
  organizations: Organization[];
  memberships: OrganizationMember[];
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  fetchOrganizations: () => Promise<{
    organizations: Organization[];
    memberships: OrganizationMember[];
  }>;
  createOrganization: (
    props: OrganizationCreateInput,
  ) => Promise<Organization | false>;
  updateOrganization: (
    id: string,
    data: Partial<OrganizationCreateInput>,
  ) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  setOrganizations: (organizations: Organization[]) => void;
  clearErrors: () => void;
  clearState: () => void;
}

export interface OrganizationWithMembers extends Organization {
  members: OrganizationMember[];
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

// --- User Profile ---
export interface UserProfile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

// Prisma-compatible types
export interface PrismaOrganization {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: Date | null;
  updated_at: Date | null;
  logo_url: string | null;
  metadata?: any;
}

export interface PrismaOrganizationMember {
  id: string;
  organization_id: string;
  profile_id: string | null;
  role: string;
  created_at: Date | null;
  avatar_url: string | null;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  syncUserProfile: (user: User) => Promise<void>;
}

// --- Store State Types ---
export interface ProfileState {
  userProfile: UserProfile | null;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  clearErrors: () => void;
  clearState: () => void;
}

export interface AppStoreState {
  organizations: Organization[];
  memberships: OrganizationMember[];
  userProfile: UserProfile | null;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchOrganizations: () => Promise<{
    organizations: Organization[];
    memberships: OrganizationMember[];
  }>;
  createOrganization: (
    props: OrganizationCreateInput,
  ) => Promise<Organization | false>;
  updateOrganization: (
    id: string,
    data: Partial<OrganizationCreateInput>,
  ) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  setOrganizations: (organizations: Organization[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  clearStore: () => void;
  refreshData: () => Promise<void>;
}

// --- UI Types ---
export interface OrganizationSwitcherProps {
  appearance?: {
    elements?: {
      rootBox?: CSSProperties;
      trigger?: CSSProperties;
      item?: CSSProperties;
    };
  };
}

export interface SidebarProps {
  StorageKey?: string;
}

export interface NavItemProps {
  isActive: boolean;
  isExpanded: boolean;
  organization: Organization;
  onExpand: (id: string) => void;
}

export interface MobileSidebarProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export interface Board {
  id: string;
  title: string;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}


export type ErrorCategory =
  | 'auth'
  | 'permission'
  | 'validation'
  | 'notFound'
  | 'server'
  | 'network'
  | 'database'
  | 'unknown';
