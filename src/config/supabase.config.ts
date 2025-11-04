// Supabase Configuration
// Single source of truth for Supabase settings

export const SUPABASE_CONFIG = {
    url: "https://kvedawllemtyfkxeenll.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZWRhd2xsZW10eWZreGVlbmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MzY4NzUsImV4cCI6MjA3NDIxMjg3NX0._JXEftIIgYnv4_wD2cZ4PLP1kYfOy9XHx762eQni_Ts",
    projectId: "kvedawllemtyfkxeenll"
  } as const;
  
  // Edge Function URLs
  export const SUPABASE_FUNCTIONS = {
    aiTutorChat: `${SUPABASE_CONFIG.url}/functions/v1/ai-tutor-chat`,
    flCoordinator: `${SUPABASE_CONFIG.url}/functions/v1/fl-coordinator`,
    flTraining: `${SUPABASE_CONFIG.url}/functions/v1/fl-training`
  } as const;
  