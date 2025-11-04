// usePlugin Hook
// React hook for using plugins in components

import { useState, useEffect } from 'react';
import { pluginRegistry } from '@/core/plugins';
import type { PluginMetadata } from '@/core/plugins';

export function usePlugin(pluginId: string) {
  const [plugin, setPlugin] = useState<PluginMetadata | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [module, setModule] = useState<any>(null);

  useEffect(() => {
    loadPlugin();
  }, [pluginId]);

  const loadPlugin = async () => {
    try {
      setLoading(true);
      setError(null);

      const pluginMeta = pluginRegistry.getPlugin(pluginId);
      setPlugin(pluginMeta);

      if (pluginMeta?.status === 'active') {
        const loadedModule = await pluginRegistry.loadModule(pluginId);
        setModule(loadedModule);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const reload = () => {
    loadPlugin();
  };

  return {
    plugin,
    module,
    loading,
    error,
    reload,
    isActive: plugin?.status === 'active',
    isHealthy: plugin?.healthStatus?.isHealthy ?? false
  };
}

export function usePluginsByCategory(category: PluginMetadata['category']) {
  const [plugins, setPlugins] = useState<PluginMetadata[]>([]);

  useEffect(() => {
    const categoryPlugins = pluginRegistry.getPluginsByCategory(category);
    setPlugins(categoryPlugins);
  }, [category]);

  return plugins;
}

export function useActivePlugins() {
  const [plugins, setPlugins] = useState<PluginMetadata[]>([]);

  useEffect(() => {
    const activePlugins = pluginRegistry.getActivePlugins();
    setPlugins(activePlugins);
  }, []);

  return plugins;
}
