export interface Organization {
  id: string;
  name: string;
  logo?: string | null;
}

export interface UserProfile {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  created_at: string;
  updated_at: string;
}
