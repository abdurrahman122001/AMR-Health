import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Trash2, Plus, Edit2, Save, X, Settings, Check } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';

interface FilterType {
  id: string;
  label: string;
  enabled: boolean;
  description?: string;
}

interface FilterValue {
  id: string;
  typeId: string;
  value: string;
  label: string;
  enabled: boolean;
  order: number;
}

interface FilterConfig {
  filterTypes: FilterType[];
  filterValues: FilterValue[];
}

export function FilterConfigAdmin() {
  const [config, setConfig] = useState<FilterConfig>({
    filterTypes: [],
    filterValues: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [newType, setNewType] = useState({ label: '', description: '' });
  const [newValue, setNewValue] = useState({ typeId: '', value: '', label: '' });
  const [showAddType, setShowAddType] = useState(false);
  const [showAddValue, setShowAddValue] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Initialize with default filter configurations
  useEffect(() => {
    const defaultConfig: FilterConfig = {
      filterTypes: [
        { id: 'hospital', label: 'Hospital', enabled: true, description: 'Filter by healthcare facility' },
        { id: 'region', label: 'Region', enabled: true, description: 'Filter by geographical region' },
        { id: 'year', label: 'Year', enabled: true, description: 'Filter by collection year' },
        { id: 'sex', label: 'Sex', enabled: true, description: 'Filter by patient gender' },
        { id: 'age_group', label: 'Age Group', enabled: true, description: 'Filter by patient age ranges' },
        { id: 'specimen_type', label: 'Specimen Type', enabled: true, description: 'Filter by sample type' },
        { id: 'ward_type', label: 'Ward Type', enabled: true, description: 'Filter by hospital ward category' },
        { id: 'organism_group', label: 'Organism Group', enabled: false, description: 'Filter by pathogen classification' }
      ],
      filterValues: [
        // Hospital values
        { id: 'hosp_1', typeId: 'hospital', value: 'KATH', label: 'Komfo Anokye Teaching Hospital', enabled: true, order: 1 },
        { id: 'hosp_2', typeId: 'hospital', value: 'KORLE_BU', label: 'Korle Bu Teaching Hospital', enabled: true, order: 2 },
        { id: 'hosp_3', typeId: 'hospital', value: 'CAPE_COAST', label: 'Cape Coast Teaching Hospital', enabled: true, order: 3 },
        { id: 'hosp_4', typeId: 'hospital', value: 'TAMALE', label: 'Tamale Teaching Hospital', enabled: true, order: 4 },
        
        // Region values
        { id: 'reg_1', typeId: 'region', value: 'ASHANTI', label: 'Ashanti Region', enabled: true, order: 1 },
        { id: 'reg_2', typeId: 'region', value: 'GREATER_ACCRA', label: 'Greater Accra Region', enabled: true, order: 2 },
        { id: 'reg_3', typeId: 'region', value: 'CENTRAL', label: 'Central Region', enabled: true, order: 3 },
        { id: 'reg_4', typeId: 'region', value: 'NORTHERN', label: 'Northern Region', enabled: true, order: 4 },
        
        // Year values
        { id: 'year_1', typeId: 'year', value: '2023', label: '2023', enabled: true, order: 1 },
        { id: 'year_2', typeId: 'year', value: '2022', label: '2022', enabled: true, order: 2 },
        { id: 'year_3', typeId: 'year', value: '2021', label: '2021', enabled: true, order: 3 },
        
        // Sex values
        { id: 'sex_1', typeId: 'sex', value: 'M', label: 'Male', enabled: true, order: 1 },
        { id: 'sex_2', typeId: 'sex', value: 'F', label: 'Female', enabled: true, order: 2 },
        
        // Age Group values
        { id: 'age_1', typeId: 'age_group', value: '0-17', label: 'Pediatric (0-17 years)', enabled: true, order: 1 },
        { id: 'age_2', typeId: 'age_group', value: '18-64', label: 'Adult (18-64 years)', enabled: true, order: 2 },
        { id: 'age_3', typeId: 'age_group', value: '65+', label: 'Elderly (65+ years)', enabled: true, order: 3 },
        
        // Specimen Type values
        { id: 'spec_1', typeId: 'specimen_type', value: 'BLOOD', label: 'Blood', enabled: true, order: 1 },
        { id: 'spec_2', typeId: 'specimen_type', value: 'URINE', label: 'Urine', enabled: true, order: 2 },
        { id: 'spec_3', typeId: 'specimen_type', value: 'SPUTUM', label: 'Sputum', enabled: true, order: 3 },
        { id: 'spec_4', typeId: 'specimen_type', value: 'WOUND', label: 'Wound', enabled: true, order: 4 },
        
        // Ward Type values
        { id: 'ward_1', typeId: 'ward_type', value: 'ICU', label: 'Intensive Care Unit', enabled: true, order: 1 },
        { id: 'ward_2', typeId: 'ward_type', value: 'MEDICAL', label: 'Medical Ward', enabled: true, order: 2 },
        { id: 'ward_3', typeId: 'ward_type', value: 'SURGICAL', label: 'Surgical Ward', enabled: true, order: 3 },
        { id: 'ward_4', typeId: 'ward_type', value: 'EMERGENCY', label: 'Emergency Department', enabled: true, order: 4 }
      ]
    };
    
    setConfig(defaultConfig);
    setLoading(false);
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      // In a real implementation, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      showMessage('success', 'Filter configuration saved successfully');
    } catch (error) {
      showMessage('error', 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const toggleFilterType = (typeId: string) => {
    setConfig(prev => ({
      ...prev,
      filterTypes: prev.filterTypes.map(type =>
        type.id === typeId ? { ...type, enabled: !type.enabled } : type
      )
    }));
  };

  const toggleFilterValue = (valueId: string) => {
    setConfig(prev => ({
      ...prev,
      filterValues: prev.filterValues.map(value =>
        value.id === valueId ? { ...value, enabled: !value.enabled } : value
      )
    }));
  };

  const addFilterType = () => {
    if (!newType.label.trim()) return;
    
    const newTypeObj: FilterType = {
      id: `custom_${Date.now()}`,
      label: newType.label,
      enabled: true,
      description: newType.description
    };
    
    setConfig(prev => ({
      ...prev,
      filterTypes: [...prev.filterTypes, newTypeObj]
    }));
    
    setNewType({ label: '', description: '' });
    setShowAddType(false);
    showMessage('success', 'Filter type added successfully');
  };

  const addFilterValue = () => {
    if (!newValue.typeId || !newValue.value.trim() || !newValue.label.trim()) return;
    
    const maxOrder = Math.max(
      ...config.filterValues
        .filter(v => v.typeId === newValue.typeId)
        .map(v => v.order),
      0
    );
    
    const newValueObj: FilterValue = {
      id: `custom_${Date.now()}`,
      typeId: newValue.typeId,
      value: newValue.value,
      label: newValue.label,
      enabled: true,
      order: maxOrder + 1
    };
    
    setConfig(prev => ({
      ...prev,
      filterValues: [...prev.filterValues, newValueObj]
    }));
    
    setNewValue({ typeId: '', value: '', label: '' });
    setShowAddValue(false);
    showMessage('success', 'Filter value added successfully');
  };

  const deleteFilterType = (typeId: string) => {
    setConfig(prev => ({
      filterTypes: prev.filterTypes.filter(type => type.id !== typeId),
      filterValues: prev.filterValues.filter(value => value.typeId !== typeId)
    }));
    showMessage('success', 'Filter type and associated values deleted');
  };

  const deleteFilterValue = (valueId: string) => {
    setConfig(prev => ({
      ...prev,
      filterValues: prev.filterValues.filter(value => value.id !== valueId)
    }));
    showMessage('success', 'Filter value deleted');
  };

  const getValuesForType = (typeId: string) => {
    return config.filterValues
      .filter(value => value.typeId === typeId)
      .sort((a, b) => a.order - b.order);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">Loading filter configuration...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Filter Configuration Admin</h2>
          <p className="text-gray-600 text-sm">
            Manage filter types and values available across the dashboard system
          </p>
        </div>
        <Button onClick={handleSaveConfig} disabled={saving}>
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <Check className={`w-4 h-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="types" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="types">Filter Types</TabsTrigger>
          <TabsTrigger value="values">Filter Values</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filter Types</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddType(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Type
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddType && (
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="new-type-label">Type Label</Label>
                      <Input
                        id="new-type-label"
                        value={newType.label}
                        onChange={(e) => setNewType(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g., Diagnosis"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-type-description">Description (Optional)</Label>
                      <Input
                        id="new-type-description"
                        value={newType.description}
                        onChange={(e) => setNewType(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of this filter type"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addFilterType}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddType(false)}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {config.filterTypes.map((type) => (
                <Card key={type.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={type.enabled}
                            onCheckedChange={() => toggleFilterType(type.id)}
                          />
                          <div>
                            <h4 className="font-medium">{type.label}</h4>
                            {type.description && (
                              <p className="text-sm text-gray-600">{type.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={type.enabled ? "default" : "secondary"}>
                          {getValuesForType(type.id).length} values
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteFilterType(type.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="values" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filter Values</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddValue(true)}
                  disabled={config.filterTypes.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Value
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {showAddValue && (
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="new-value-type">Filter Type</Label>
                        <select
                          id="new-value-type"
                          className="w-full p-2 border rounded-md"
                          value={newValue.typeId}
                          onChange={(e) => setNewValue(prev => ({ ...prev, typeId: e.target.value }))}
                        >
                          <option value="">Select type...</option>
                          {config.filterTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-value-value">Value</Label>
                        <Input
                          id="new-value-value"
                          value={newValue.value}
                          onChange={(e) => setNewValue(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="e.g., PNEUMONIA"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-value-label">Display Label</Label>
                        <Input
                          id="new-value-label"
                          value={newValue.label}
                          onChange={(e) => setNewValue(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="e.g., Pneumonia"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addFilterValue}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddValue(false)}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {config.filterTypes.map((type) => {
                const values = getValuesForType(type.id);
                if (values.length === 0) return null;

                return (
                  <div key={type.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <h4 className="font-medium text-lg">{type.label}</h4>
                      <Badge variant={type.enabled ? "default" : "secondary"}>
                        {type.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {values.map((value) => (
                        <Card key={value.id} className="border">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <Switch
                                  checked={value.enabled}
                                  onCheckedChange={() => toggleFilterValue(value.id)}
                                  size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm truncate">{value.label}</p>
                                  <p className="text-xs text-gray-500 truncate">{value.value}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteFilterValue(value.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 flex-shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Separator />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}