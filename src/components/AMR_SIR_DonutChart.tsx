import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Loader2, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { cn } from './ui/utils';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SIRData {
  name: string;
  value: number;
  count: number;
  color: string;
}

interface SIRStats {
  susceptible: number;
  intermediate: number;
  resistant: number;
  total: number;
}

interface OrganismOption {
  value: string;
  label: string;
  count: number;
}

interface AntibioticOption {
  value: string;
  label: string;
  count: number;
}

export function AMR_SIR_DonutChart() {
  const [data, setData] = useState<SIRData[]>([]);
  const [stats, setStats] = useState<SIRStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedOrganism, setSelectedOrganism] = useState<string>('sau');
  const [selectedAntibiotic, setSelectedAntibiotic] = useState<string>('CIP_ND5');
  
  // Dropdown state
  const [organismOpen, setOrganismOpen] = useState(false);
  const [antibioticOpen, setAntibioticOpen] = useState(false);
  
  // Options state
  const [availableOrganisms, setAvailableOrganisms] = useState<OrganismOption[]>([]);
  const [availableAntibiotics, setAvailableAntibiotics] = useState<AntibioticOption[]>([]);
  const [loadingOrganisms, setLoadingOrganisms] = useState(true);
  const [loadingAntibiotics, setLoadingAntibiotics] = useState(false);

  // Fetch available organisms on component mount
  useEffect(() => {
    const fetchOrganisms = async () => {
      try {
        setLoadingOrganisms(true);
        console.log('AMR_SIR_DonutChart: Fetching available organisms...');
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-available-organisms`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log('AMR_SIR_DonutChart: Received organisms:', result);
          
          if (result.success && result.data.organisms) {
            setAvailableOrganisms(result.data.organisms);
          } else {
            console.error('Failed to fetch organisms:', result.error);
          }
        } else {
          console.error('Organisms request failed:', response.status);
        }
      } catch (error) {
        console.error('Error fetching organisms:', error);
      } finally {
        setLoadingOrganisms(false);
      }
    };

    fetchOrganisms();
  }, []);

  // Fetch available antibiotics when organism changes
  useEffect(() => {
    const fetchAntibiotics = async () => {
      if (!selectedOrganism) return;
      
      try {
        setLoadingAntibiotics(true);
        console.log('AMR_SIR_DonutChart: Fetching antibiotics for organism:', selectedOrganism);
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-available-antibiotics?organism=${selectedOrganism}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log('AMR_SIR_DonutChart: Received antibiotics:', result);
          
          if (result.success && result.data.antibiotics) {
            setAvailableAntibiotics(result.data.antibiotics);
            
            // If current antibiotic is not available for this organism, clear selection
            if (selectedAntibiotic && !result.data.antibiotics.some(ab => ab.value === selectedAntibiotic)) {
              console.log('Current antibiotic not available for this organism, clearing selection');
              setSelectedAntibiotic('');
            }
          } else {
            console.error('Failed to fetch antibiotics:', result.error);
            setAvailableAntibiotics([]);
          }
        } else {
          console.error('Antibiotics request failed:', response.status);
          setAvailableAntibiotics([]);
        }
      } catch (error) {
        console.error('Error fetching antibiotics:', error);
        setAvailableAntibiotics([]);
      } finally {
        setLoadingAntibiotics(false);
      }
    };

    fetchAntibiotics();
  }, [selectedOrganism]);

  // Fetch S/I/R data when selections change
  useEffect(() => {
    const fetchSIRData = async () => {
      if (!selectedOrganism || !selectedAntibiotic) {
        setData([]);
        setStats(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('AMR_SIR_DonutChart: Fetching S/I/R data for:', selectedOrganism, '+', selectedAntibiotic);
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-sir-distribution?organism=${selectedOrganism}&antibiotic=${selectedAntibiotic}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log('AMR_SIR_DonutChart: Received data:', result);
          
          if (result.success && result.data) {
            const sirStats = result.data;
            
            // Calculate percentages (excluding null values)
            const total = sirStats.susceptible + sirStats.intermediate + sirStats.resistant;
            
            if (total > 0) {
              const susceptiblePct = (sirStats.susceptible / total) * 100;
              const intermediatePct = (sirStats.intermediate / total) * 100;
              const resistantPct = (sirStats.resistant / total) * 100;
              
              const chartData: SIRData[] = [
                {
                  name: 'Susceptible',
                  value: parseFloat(susceptiblePct.toFixed(1)),
                  count: sirStats.susceptible,
                  color: '#16a34a' // Green
                },
                {
                  name: 'Intermediate', 
                  value: parseFloat(intermediatePct.toFixed(1)),
                  count: sirStats.intermediate,
                  color: '#eab308' // Yellow
                },
                {
                  name: 'Resistant',
                  value: parseFloat(resistantPct.toFixed(1)),
                  count: sirStats.resistant,
                  color: '#dc2626' // Red
                }
              ].filter(item => item.count > 0); // Only include categories with data
              
              setData(chartData);
              setStats({
                susceptible: sirStats.susceptible,
                intermediate: sirStats.intermediate,
                resistant: sirStats.resistant,
                total: total
              });
              
              console.log('AMR_SIR_DonutChart: Processed chart data:', chartData);
            } else {
              setError(`No valid S/I/R data found for ${selectedOrganism} vs ${selectedAntibiotic}`);
            }
          } else {
            setError(result.error || 'Failed to fetch S/I/R data');
          }
        } else {
          const errorText = await response.text();
          console.error('AMR_SIR_DonutChart: Server error:', response.status, errorText);
          setError(`Server error: ${response.status}`);
        }
      } catch (error) {
        console.error('AMR_SIR_DonutChart: Fetch error:', error);
        setError('Failed to load S/I/R data');
      } finally {
        setLoading(false);
      }
    };

    fetchSIRData();
  }, [selectedOrganism, selectedAntibiotic]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>S. aureus vs CIP_ND5 - S/I/R Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading S/I/R data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>S. aureus vs CIP_ND5 - S/I/R Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <span className="ml-2 text-red-700">Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          S/I/R Distribution Analysis
        </CardTitle>
        <p className="text-sm text-gray-600 m-0">
          Antimicrobial susceptibility distribution by organism-antibiotic pair
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
          {/* Organism Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Organism</label>
            <Popover open={organismOpen} onOpenChange={setOrganismOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={organismOpen}
                  className="w-full justify-between"
                  disabled={loadingOrganisms}
                >
                  {loadingOrganisms ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading organisms...
                    </>
                  ) : (
                    <>
                      {selectedOrganism
                        ? availableOrganisms.find(org => org.value === selectedOrganism)?.label
                        : "Select organism..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search organisms..." />
                  <CommandList>
                    <CommandEmpty>No organism found.</CommandEmpty>
                    <CommandGroup>
                      {availableOrganisms.map((organism) => (
                        <CommandItem
                          key={organism.value}
                          value={organism.value}
                          onSelect={(currentValue) => {
                            setSelectedOrganism(currentValue === selectedOrganism ? "" : currentValue);
                            setOrganismOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedOrganism === organism.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex justify-between items-center w-full">
                            <span>{organism.label}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({organism.count} isolates)
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Antibiotic Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Antibiotic</label>
            <Popover open={antibioticOpen} onOpenChange={setAntibioticOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={antibioticOpen}
                  className="w-full justify-between"
                  disabled={!selectedOrganism || loadingAntibiotics}
                >
                  {loadingAntibiotics ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading antibiotics...
                    </>
                  ) : (
                    <>
                      {selectedAntibiotic || 
                        (!selectedOrganism ? "Select organism first..." : 
                         availableAntibiotics.length === 0 ? "No valid antibiotics" : 
                         "Select antibiotic...")}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search antibiotics..." />
                  <CommandList>
                    <CommandEmpty>No antibiotic found.</CommandEmpty>
                    <CommandGroup>
                      {availableAntibiotics.map((antibiotic) => (
                        <CommandItem
                          key={antibiotic.value}
                          value={antibiotic.value}
                          onSelect={(currentValue) => {
                            setSelectedAntibiotic(currentValue === selectedAntibiotic ? "" : currentValue);
                            setAntibioticOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAntibiotic === antibiotic.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex justify-between items-center w-full">
                            <span>{antibiotic.label}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({antibiotic.count} valid results)
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {/* Show info about available antibiotics */}
            {selectedOrganism && !loadingAntibiotics && (
              <div className="text-xs text-gray-600 mt-1">
                {availableAntibiotics.length > 0 ? (
                  <span>
                    {availableAntibiotics.length} antibiotic{availableAntibiotics.length !== 1 ? 's' : ''} 
                    {' '}available for {availableOrganisms.find(org => org.value === selectedOrganism)?.label}
                  </span>
                ) : (
                  <span className="text-yellow-600">
                    No antibiotics with valid S/I/R data for {availableOrganisms.find(org => org.value === selectedOrganism)?.label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Selection Required State */}
        {!loading && !error && (!selectedOrganism || !selectedAntibiotic) && (
          <div className="flex items-center justify-center py-12 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-700">Please select both an organism and antibiotic to view S/I/R distribution</span>
          </div>
        )}

        {/* Donut Chart */}
        {!loading && !error && selectedOrganism && selectedAntibiotic && data.length > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">
                {availableOrganisms.find(org => org.value === selectedOrganism)?.label} vs {selectedAntibiotic}
              </h3>
              <p className="text-sm text-gray-600">S/I/R Distribution</p>
            </div>
            <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  `${value}%`,
                  name
                ]}
                labelFormatter={(label: string) => `${label} Response`}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value: string, entry: any) => {
                  const payload = entry.payload;
                  return (
                    <span style={{ color: payload.color }}>
                      {value}: {payload.value}% ({payload.count} isolates)
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {!loading && !error && selectedOrganism && selectedAntibiotic && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">
                {((stats.susceptible / stats.total) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-green-600">Susceptible</div>
              <div className="text-xs text-green-500">{stats.susceptible} isolates</div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700">
                {((stats.intermediate / stats.total) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-yellow-600">Intermediate</div>
              <div className="text-xs text-yellow-500">{stats.intermediate} isolates</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700">
                {((stats.resistant / stats.total) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-red-600">Resistant</div>
              <div className="text-xs text-red-500">{stats.resistant} isolates</div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-700">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Total Tested</div>
              <div className="text-xs text-gray-500">Valid results only</div>
            </div>
          </div>
        )}

        {/* Color Legend */}
        <div className="flex items-center justify-center gap-8 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16a34a' }}></div>
            <span className="text-sm">Susceptible (S)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
            <span className="text-sm">Intermediate (I)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
            <span className="text-sm">Resistant (R)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}