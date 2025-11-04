// Plugin Management Component
// Admin UI for managing plugins and features

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { pluginRegistry, featureManager } from '@/core/plugins';
import type { PluginMetadata } from '@/core/plugins';
import {
  Package,
  Power,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  RotateCcw,
  Activity,
  Layers,
  Zap,
  Cloud,
  BarChart,
  Settings,
  Info
} from 'lucide-react';

const PluginManagement = () => {
  const { toast } = useToast();
  const [plugins, setPlugins] = useState<PluginMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlugins();

    // Listen for feature changes
    const handleFeatureChange = () => {
      loadPlugins();
    };
    featureManager.addListener(handleFeatureChange);

    return () => {
      featureManager.removeListener(handleFeatureChange);
    };
  }, []);

  const loadPlugins = () => {
    const allPlugins = pluginRegistry.getAllPlugins();
    setPlugins(allPlugins);
  };

  const handleTogglePlugin = async (plugin: PluginMetadata) => {
    setLoading(true);
    try {
      const newStatus = plugin.status === 'active' ? 'inactive' : 'active';
      
      // Check dependencies
      if (newStatus === 'active') {
        const { satisfied, missing } = pluginRegistry.checkDependencies(plugin.id);
        if (!satisfied) {
          toast({
            title: "Cannot Enable Plugin",
            description: `Missing dependencies: ${missing.join(', ')}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Toggle feature flag
      if (newStatus === 'active') {
        featureManager.enable(plugin.featureFlag);
      } else {
        featureManager.disable(plugin.featureFlag);
      }

      // Update plugin status
      pluginRegistry.updatePluginStatus(plugin.id, newStatus);

      toast({
        title: `Plugin ${newStatus === 'active' ? 'Enabled' : 'Disabled'}`,
        description: `${plugin.name} is now ${newStatus}`,
      });

      loadPlugins();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset all features to default configuration? This will reload the page.')) {
      featureManager.resetToDefaults();
      toast({
        title: "Reset Complete",
        description: "All features reset to defaults",
      });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleExportConfig = () => {
    const config = featureManager.exportConfig();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fedlearn-features-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configuration Exported",
      description: "Feature configuration saved to file",
    });
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          featureManager.importConfig(text);
          toast({
            title: "Configuration Imported",
            description: "Feature configuration loaded successfully",
          });
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          toast({
            title: "Import Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    };
    input.click();
  };

  const getCategoryIcon = (category: PluginMetadata['category']) => {
    switch (category) {
      case 'core': return Layers;
      case 'feature': return Zap;
      case 'integration': return Cloud;
      case 'analytics': return BarChart;
      default: return Package;
    }
  };

  const getStatusColor = (status: PluginMetadata['status']) => {
    switch (status) {
      case 'active': return 'fl-success';
      case 'inactive': return 'muted';
      case 'error': return 'destructive';
      case 'loading': return 'fl-primary';
      default: return 'muted';
    }
  };

  const categoryGroups = [
    { id: 'core', name: 'Core Modules', icon: Layers },
    { id: 'feature', name: 'Features', icon: Zap },
    { id: 'analytics', name: 'Analytics', icon: BarChart },
    { id: 'integration', name: 'Integrations', icon: Cloud },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-fl-primary" />
            Plugin Management
          </h2>
          <p className="text-muted-foreground">
            Enable or disable modules and manage feature flags
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportConfig}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportConfig}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Plugins',
            value: plugins.length,
            icon: Package,
            color: 'fl-primary'
          },
          {
            label: 'Active',
            value: plugins.filter(p => p.status === 'active').length,
            icon: CheckCircle,
            color: 'fl-success'
          },
          {
            label: 'Inactive',
            value: plugins.filter(p => p.status === 'inactive').length,
            icon: Power,
            color: 'muted'
          },
          {
            label: 'Issues',
            value: plugins.filter(p => !p.healthStatus?.isHealthy).length,
            icon: AlertTriangle,
            color: 'fl-warning'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${stat.color}/10 rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Plugin Categories */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Plugins</TabsTrigger>
          {categoryGroups.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id}>
              <cat.icon className="w-4 h-4 mr-2" />
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {plugins.map((plugin, index) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              index={index}
              onToggle={handleTogglePlugin}
              disabled={loading}
            />
          ))}
        </TabsContent>

        {categoryGroups.map(cat => (
          <TabsContent key={cat.id} value={cat.id} className="space-y-4">
            {pluginRegistry.getPluginsByCategory(cat.id as PluginMetadata['category']).map((plugin, index) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                index={index}
                onToggle={handleTogglePlugin}
                disabled={loading}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

interface PluginCardProps {
  plugin: PluginMetadata;
  index: number;
  onToggle: (plugin: PluginMetadata) => void;
  disabled: boolean;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin, index, onToggle, disabled }) => {
  const CategoryIcon = getCategoryIcon(plugin.category);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 bg-${getCategoryColor(plugin.category)}/10 rounded-lg flex items-center justify-center`}>
                <CategoryIcon className={`w-6 h-6 text-${getCategoryColor(plugin.category)}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg">{plugin.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    v{plugin.version}
                  </Badge>
                  <Badge className={`bg-${getStatusColor(plugin.status)}/10 text-${getStatusColor(plugin.status)}`}>
                    {plugin.status}
                  </Badge>
                </div>
                <CardDescription>{plugin.description}</CardDescription>
              </div>
            </div>
            
            <Switch
              checked={plugin.status === 'active'}
              onCheckedChange={() => onToggle(plugin)}
              disabled={disabled}
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Dependencies */}
          {plugin.dependencies.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Dependencies:</div>
              <div className="flex flex-wrap gap-2">
                {plugin.dependencies.map(dep => (
                  <Badge key={dep} variant="outline" className="text-xs">
                    {dep}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Azure Services */}
          {plugin.azureServices && plugin.azureServices.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Azure Services:
              </div>
              <div className="flex flex-wrap gap-2">
                {plugin.azureServices.map(service => (
                  <Badge key={service} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Health Status */}
          {plugin.healthStatus && !plugin.healthStatus.isHealthy && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                {plugin.healthStatus.errors?.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Plugin Info */}
          <div className="text-xs text-muted-foreground flex items-center gap-4">
            <span>Category: {plugin.category}</span>
            <span>•</span>
            <span>Permissions: {plugin.requiredPermissions.join(', ')}</span>
            {plugin.healthStatus && (
              <>
                <span>•</span>
                <span>Last checked: {new Date(plugin.healthStatus.lastCheck).toLocaleTimeString()}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const getCategoryColor = (category: PluginMetadata['category']) => {
  switch (category) {
    case 'core': return 'fl-primary';
    case 'feature': return 'fl-secondary';
    case 'integration': return 'fl-accent';
    case 'analytics': return 'fl-success';
    default: return 'muted';
  }
};

const getCategoryIcon = (category: PluginMetadata['category']) => {
  switch (category) {
    case 'core': return Layers;
    case 'feature': return Zap;
    case 'integration': return Cloud;
    case 'analytics': return BarChart;
    default: return Package;
  }
};

const getStatusColor = (status: PluginMetadata['status']) => {
  switch (status) {
    case 'active': return 'fl-success';
    case 'inactive': return 'muted';
    case 'error': return 'destructive';
    case 'loading': return 'fl-primary';
    default: return 'muted';
  }
};

export default PluginManagement;
