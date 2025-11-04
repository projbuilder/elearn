// Supabase API Layer
// Centralized Supabase-specific API operations

import { supabase } from '@/core/database';
import { SUPABASE_FUNCTIONS } from '@/config/supabase.config';

/**
 * Call a Supabase Edge Function
 */
export const callEdgeFunction = async <T = any>(
  functionName: keyof typeof SUPABASE_FUNCTIONS,
  payload: any
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });
    
    if (error) throw error;
    return { data: data as T, error: null };
  } catch (error) {
    console.error(`Edge function ${functionName} error:`, error);
    return { data: null, error: error as Error };
  }
};

/**
 * Upload file to Supabase Storage
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('File upload error:', error);
    return { url: null, error: error as Error };
  }
};

/**
 * Get file URL from Supabase Storage
 */
export const getFileUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Subscribe to real-time changes
 */
export const subscribeToTable = <T = any>(
  table: string,
  callback: (payload: T) => void,
  filter?: { column: string; value: string }
) => {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
      },
      (payload) => callback(payload.new as T)
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
};
