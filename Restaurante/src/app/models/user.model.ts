import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User
  extends Omit<SupabaseUser, 'app_metadata' | 'user_metadata'> {
  full_name?: string;
  created_at: string;
}
