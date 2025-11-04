// Database Abstraction Layer
// Provides a cloud-agnostic interface for database operations

export { supabase } from './supabase.client';
export type { Database, Tables, Enums } from './supabase.client';

// Database operation types
export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  status: 'success' | 'error' | 'loading';
}

export interface MutationResult {
  success: boolean;
  error: Error | null;
}

// Future: Could add additional database clients here
// export { mongoClient } from './mongo.client';
// export { cosmosClient } from './cosmos.client';
