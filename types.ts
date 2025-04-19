import { CSSProperties } from 'react';

export interface OrganizationCreateInput {
  name: string;
  slug: string;
  logo_url?: string | File | null;
}

export interface Organization extends OrganizationCreateInput {
  id: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  created_at?: string;
}

// --- User Profile ---
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

// --- Store State Types ---
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
  createOrganization: (props: OrganizationCreateInput) => Promise<void>;
  updateOrganization: (
    id: string,
    data: Partial<OrganizationCreateInput>,
  ) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  setOrganizations: (organizations: Organization[]) => void;
  clearErrors: () => void;
  clearState: () => void;
}

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
  createOrganization: (props: OrganizationCreateInput) => Promise<void>;
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
