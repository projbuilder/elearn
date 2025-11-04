// Unified Supabase Client
// Single source of truth for Supabase database access

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '@/config/supabase.config';
import type { Database } from '@/integrations/supabase/types';

// Create unified Supabase client
export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Type exports for convenience
export type { Database } from '@/integrations/supabase/types';
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];
