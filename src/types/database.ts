// TypeScript types for Supabase database tables
// Matches PRD-01 Section 2.3 schema exactly
// Note: RLS policies use (select auth.uid()) and (select auth.org_id()) patterns

export type CompanyType = 'dot_carrier' | 'non_dot_carrier' | 'both'

export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'viewer'

export type Organization = {
  id: string
  name: string
  dot_number: string | null
  mc_number: string | null
  address_line1: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  phone: string | null
  email: string | null
  company_type: CompanyType
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  org_id: string | null
  full_name: string | null
  role: UserRole
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type OrgMember = {
  id: string
  org_id: string
  user_id: string
  role: UserRole
  joined_at: string
}

// Supabase Database type for client typing
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Organization, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      org_members: {
        Row: OrgMember
        Insert: Omit<OrgMember, 'id' | 'joined_at'> & {
          id?: string
          joined_at?: string
        }
        Update: Partial<Omit<OrgMember, 'id'>> & {
          joined_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      company_type: CompanyType
      user_role: UserRole
    }
  }
}
