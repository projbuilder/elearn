// API Abstraction Layer
// Centralized API access for both Supabase and Azure

export * from './supabase.api';
export * from './azure.api';

// Re-export for convenience
export { callEdgeFunction, uploadFile, getFileUrl, subscribeToTable } from './supabase.api';
export { azureServices, callAzureFunction, callAzureOpenAI, sendToAzureMonitor } from './azure.api';
