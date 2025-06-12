import { User as SupabaseUser } from "@supabase/supabase-js";

export interface UserModel
  extends Omit<SupabaseUser, "app_metadata" | "user_metadata"> {
  full_name?: string;
  created_at: string;
  // Campos adicionales del esquema de cliente
  id: string;
  name: string;
  surname?: string;
  DNI: string;
  photo_id: number;
  role_Id: number;
  CUIL?: string;
  approved?: boolean;
}
