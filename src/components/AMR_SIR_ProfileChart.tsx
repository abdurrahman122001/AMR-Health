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

interface SpecimenStats {
  totalSpecimens: number;
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

export function AMR_SIR_ProfileChart() {
  const [data, setData] = useState<SIRData[]>([]);
  const [stats, setStats] = useState<SIRStats | null>(null);
  const [specimenStats, setSpecimenStats] = useState<SpecimenStats | null>(null);
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
  
  // Isolate count state
  const [isolateCounts, setIsolateCounts] = useState<{testedCount: number, totalCount: number} | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterTypeOpen, setFilterTypeOpen] = useState(false);
  const [filterValueOpen, setFilterValueOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, Array<{value: string, label: string}>>>({});

  // Fetch available organisms on component mount
  useEffect(() => {
    const fetchOrganisms = async () => {
      try {
        setLoadingOrganisms(true);
        console.log('AMR_SIR_ProfileChart: Fetching available organisms...');
        
        // Try the test endpoint first to diagnose issues
        const testUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-available-organisms-test`;
        console.log('Trying test endpoint first:', testUrl);
        
        const response = await fetch(testUrl, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('AMR_SIR_ProfileChart: Received organisms:', result);
          
          if (result.success && result.data.organisms) {
            setAvailableOrganisms(result.data.organisms);
          } else {
            console.error('Failed to fetch organisms:', result.error);
            setError(`Failed to load organisms: ${result.error || 'Unknown error'}`);
          }
        } else {
          const errorText = await response.text();
          console.error('Organisms request failed:', response.status, errorText);
          setError(`Server error ${response.status}: ${errorText}`);
          
          // If test endpoint fails, show detailed error
          if (response.status === 503) {
            setError('Database service unavailable. The AMR_HH table may not be accessible.');
          }
        }
      } catch (error) {
        console.error('Error fetching organisms:', error);
        setError(`Network error: ${error.message}`);
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
        console.log('AMR_SIR_ProfileChart: Fetching antibiotics for organism:', selectedOrganism);
        
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
          console.log('AMR_SIR_ProfileChart: Received antibiotics:', result);
          
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

  // Filter configurations and options loading
  const staticFilterConfigs = {
    riskLevel: {
      label: 'Risk Level',
      options: [
        { value: 'low', label: 'Low Risk (<20%)' },
        { value: 'moderate', label: 'Moderate Risk (20-39%)' },
        { value: 'high', label: 'High Risk (≥40%)' }
      ]
    }
  };

  // Fetch filter options from server
  const fetchFilterOptions = async (column: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-filter-options?column=${column}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.options) {
          return data.options.map((option: string) => ({
            value: option, // Keep original case for database queries
            label: option
          }));
        }
      }
    } catch (error) {
      console.error(`Error fetching ${column} options:`, error);
    }
    return [];
  };

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      const amrColumns = ['SEX', 'AGE_CAT', 'PAT_TYPE', 'WARD', 'INSTITUTION', 'DEPARTMENT', 'WARD_TYPE', 'SPEC_TYPE', 'LOCAL_SPEC', 'YEAR_SPEC', 'YEAR_REP'];
      const newFilterOptions: Record<string, Array<{value: string, label: string}>> = {};

      const columnLabels: Record<string, string> = {
        'SEX': 'Sex',
        'AGE_CAT': 'Age Category',
        'PAT_TYPE': 'Patient Type',
        'WARD': 'Ward',
        'INSTITUTION': 'Institution',
        'DEPARTMENT': 'Department',
        'WARD_TYPE': 'Ward Type',
        'SPEC_TYPE': 'Specimen Type',
        'LOCAL_SPEC': 'Local Specimen',
        'YEAR_SPEC': 'Year Specimen Collected',
        'YEAR_REP': 'Year Reported'
      };

      for (const column of amrColumns) {
        const options = await fetchFilterOptions(column);
        if (options.length > 0) {
          newFilterOptions[column.toLowerCase()] = options;
        }
      }

      // Add static filters
      Object.entries(staticFilterConfigs).forEach(([key, config]) => {
        newFilterOptions[key] = config.options;
      });

      setFilterOptions(newFilterOptions);
    };

    loadFilterOptions();
  }, []);

  // Combined filter configurations
  const filterConfigs = React.useMemo(() => {
    const columnLabels: Record<string, string> = {
      'sex': 'Sex',
      'age_cat': 'Age Category',
      'pat_type': 'Patient Type',
      'ward': 'Ward',
      'institut': 'Institution',
      'department': 'Department',
      'ward_type': 'Ward Type',
      'spec_type': 'Specimen Type',
      'local_spec': 'Local Specimen',
      'year_spec': 'Year Specimen Collected',
      'year_rep': 'Year Reported',
      'riskLevel': 'Risk Level'
    };

    const configs: Record<string, { label: string; options: Array<{value: string, label: string}> }> = {};
    
    Object.entries(filterOptions).forEach(([key, options]) => {
      configs[key] = {
        label: columnLabels[key] || key,
        options
      };
    });

    return configs;
  }, [filterOptions]);

  // Filter helpers
  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeConfig = filterConfigs[filterType as keyof typeof filterConfigs];
        const valueOption = typeConfig?.options.find(opt => opt.value === filterValue);
        
        if (typeConfig && valueOption) {
          const newFilter = {
            type: filterType,
            value: filterValue,
            label: `${typeConfig.label}: ${valueOption.label}`
          };
          
          // Check if filter already exists
          const exists = activeFilters.some(f => f.type === filterType && f.value === filterValue);
          if (!exists) {
            setActiveFilters([...activeFilters, newFilter]);
          }
        }
        
        setFilterType('');
        setFilterValue('');
      }
    },
    removeFilter: (index: number) => {
      setActiveFilters(activeFilters.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setActiveFilters([]);
    }
  };

  // Get filter type options
  const getFilterTypeOptions = () => {
    return Object.entries(filterConfigs).map(([key, config]) => ({
      value: key,
      label: config.label
    }));
  };

  // Get filter value options for selected type
  const getFilterValueOptionsForType = (type: string) => {
    const config = filterConfigs[type as keyof typeof filterConfigs];
    return config?.options || [];
  };

  // Fetch specimen count when organism changes (even without antibiotic)
  useEffect(() => {
    const fetchSpecimenData = async () => {
      if (!selectedOrganism) {
        setSpecimenStats(null);
        return;
      }
      
      try {
        console.log('AMR_SIR_ProfileChart: Fetching specimen count for:', selectedOrganism);
        
        // Build query parameters for specimen count
        const specimenQueryParams = new URLSearchParams({
          organism: selectedOrganism
        });

        // Add filter parameters
        activeFilters.forEach(filter => {
          // Map filter types to AMR_HH column names
          const columnMapping: Record<string, string> = {
            'sex': 'SEX',
            'age_cat': 'AGE_CAT',
            'pat_type': 'PAT_TYPE',
            'ward': 'WARD',
            'institut': 'INSTITUTION',
            'department': 'DEPARTMENT',
            'ward_type': 'WARD_TYPE',
            'spec_type': 'SPEC_TYPE',
            'local_spec': 'LOCAL_SPEC',
            'year_spec': 'YEAR_SPEC',
            'year_rep': 'YEAR_REP'
          };
          
          const columnName = columnMapping[filter.type];
          if (columnName && filter.type !== 'riskLevel') {
            const filterValue = String(filter.value).trim();
            if (filterValue && filterValue !== '') {
              specimenQueryParams.append(columnName, filterValue);
            }
          }
        });

        const specimenRequestUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-specimen-count?${specimenQueryParams.toString()}`;
        
        const specimenResponse = await fetch(specimenRequestUrl, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (specimenResponse.ok) {
          const specimenResult = await specimenResponse.json();
          console.log('AMR_SIR_ProfileChart: Received specimen data:', specimenResult);
          
          if (specimenResult.success && specimenResult.data) {
            setSpecimenStats({
              totalSpecimens: specimenResult.data.totalSpecimens
            });
          }
        }
      } catch (error) {
        console.error('AMR_SIR_ProfileChart: Error fetching specimen data:', error);
      }
    };

    fetchSpecimenData();
  }, [selectedOrganism, activeFilters]);

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
        
        console.log('AMR_SIR_ProfileChart: Fetching S/I/R data for:', selectedOrganism, '+', selectedAntibiotic);
        console.log('AMR_SIR_ProfileChart: Active filters:', activeFilters);
        
        // Build query parameters including filters
        const sirQueryParams = new URLSearchParams({
          organism: selectedOrganism,
          antibiotic: selectedAntibiotic
        });

        // Add filter parameters
        activeFilters.forEach(filter => {
          // Map filter types to AMR_HH column names
          const columnMapping: Record<string, string> = {
            'sex': 'SEX',
            'age_cat': 'AGE_CAT',
            'pat_type': 'PAT_TYPE',
            'ward': 'WARD',
            'institut': 'INSTITUTION',
            'department': 'DEPARTMENT',
            'ward_type': 'WARD_TYPE',
            'spec_type': 'SPEC_TYPE',
            'local_spec': 'LOCAL_SPEC',
            'year_spec': 'YEAR_SPEC',
            'year_rep': 'YEAR_REP'
          };
          
          const columnName = columnMapping[filter.type];
          if (columnName && filter.type !== 'riskLevel') {
            const filterValue = String(filter.value).trim();
            if (filterValue && filterValue !== '') {
              console.log(`AMR_SIR_ProfileChart: Adding filter param: ${columnName} = ${filterValue}`);
              sirQueryParams.append(columnName, filterValue);
            }
          }
        });

        const sirRequestUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-sir-distribution?${sirQueryParams.toString()}`;
        
        console.log('AMR_SIR_ProfileChart: S/I/R Request URL:', sirRequestUrl);
        
        const sirResponse = await fetch(sirRequestUrl, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (sirResponse.ok) {
          const sirResult = await sirResponse.json();
          console.log('AMR_SIR_ProfileChart: Received S/I/R data:', sirResult);
          
          if (sirResult.success && sirResult.data) {
            const sirStats = sirResult.data;
            
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
              
              console.log('AMR_SIR_ProfileChart: Processed chart data:', chartData);
            } else {
              setError(`No valid S/I/R data found for ${selectedOrganism} vs ${selectedAntibiotic}`);
            }
          } else {
            setError(sirResult.error || 'Failed to fetch S/I/R data');
          }
        } else {
          const sirErrorText = await sirResponse.text();
          console.error('AMR_SIR_ProfileChart: Server error:', sirResponse.status, sirErrorText);
          setError(`Server error: ${sirResponse.status}`);
        }
      } catch (error) {
        console.error('AMR_SIR_ProfileChart: Fetch error:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchSIRData();
  }, [selectedOrganism, selectedAntibiotic, activeFilters]);

  // Calculate isolate counts from existing data
  useEffect(() => {
    const calculateIsolateCounts = () => {
      if (!selectedOrganism || !selectedAntibiotic || !stats) {
        setIsolateCounts(null);
        return;
      }
      
      // Use the total from S/I/R stats as the tested count
      const testedCount = stats.total;
      
      // Use the organism count from available organisms data as the total count
      const selectedOrganismData = availableOrganisms.find(org => org.value === selectedOrganism);
      const totalCount = selectedOrganismData?.count || 0;
      
      console.log('AMR_SIR_ProfileChart: Calculated isolate counts:', {
        testedCount,
        totalCount,
        organism: selectedOrganism,
        antibiotic: selectedAntibiotic
      });
      
      setIsolateCounts({
        testedCount,
        totalCount
      });
    };

    calculateIsolateCounts();
  }, [selectedOrganism, selectedAntibiotic, stats, availableOrganisms]);

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
        <CardTitle className="text-lg font-medium text-[16px] pt-[0px] pr-[0px] pb-[10px] pl-[0px]">
         Antimicrobial Susceptibility Testing Profile for Selected Organism–Antibiotic Pair
        </CardTitle>
        <div className="flex items-center gap-6 text-[13px]">
          {/* Organism Selection */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-900 whitespace-nowrap text-[13px]">Select Organism:</label>
            <div className="w-48">
              <Popover open={organismOpen} onOpenChange={setOrganismOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={organismOpen}
                    className="w-full justify-between text-sm h-8 font-bold font-normal text-[13px]"
                    disabled={loadingOrganisms}
                  >
                    {loadingOrganisms ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
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
                                ({organism.count})
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {/* Isolate Count Display */}
              {selectedOrganism && selectedAntibiotic && isolateCounts && (
                <div className="text-xs text-gray-600 mt-1">
                  <span>
                    {isolateCounts.testedCount.toLocaleString()} of {isolateCounts.totalCount.toLocaleString()} {availableOrganisms.find(org => org.value === selectedOrganism)?.label} isolates tested against {availableAntibiotics.find(ab => ab.value === selectedAntibiotic)?.label || selectedAntibiotic}
                  </span>
                </div>
              )}
              {selectedOrganism && selectedAntibiotic && !isolateCounts && (
                <div className="text-xs text-gray-500 mt-1">
                  <span>Loading isolate counts...</span>
                </div>
              )}
            </div>
          </div>

          {/* Antibiotic Selection */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-900 whitespace-nowrap text-[13px]">Select Antimicrobial:</label>
            <div className="w-48">
              <Popover open={antibioticOpen} onOpenChange={setAntibioticOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={antibioticOpen}
                    className="w-full justify-between text-sm h-8 font-bold font-normal text-[13px]"
                    disabled={!selectedOrganism || loadingAntibiotics}
                  >
                    {loadingAntibiotics ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        {selectedAntibiotic || 
                          (!selectedOrganism ? "Select organism first..." : 
                           availableAntibiotics.length === 0 ? "No antibiotics available" : 
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
                                ({antibiotic.count})
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {/* Antibiotic Count Display */}
              {selectedOrganism && !loadingAntibiotics && (
                <div className="text-xs text-gray-600 mt-1">
                  {availableAntibiotics.length > 0 ? (
                    <span>
                      {availableAntibiotics.length} antibiotic{availableAntibiotics.length !== 1 ? 's' : ''} available for {availableOrganisms.find(org => org.value === selectedOrganism)?.label}
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
        </div>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Selection Required State */}
        {!loading && !error && (!selectedOrganism || !selectedAntibiotic) && (
          <div className="flex items-center justify-center py-12 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-700">Please select both an organism and antibiotic to view S/I/R distribution</span>
          </div>
        )}

        {/* Filter Section */}
        <div className="mb-6 bg-gray-50 rounded-lg border py-[15px] px-[16px] py-[10px]">
          <div className="flex items-center gap-4 px-[0px] py-[5px]">
            <h3 className="font-semibold text-gray-900 text-sm text-[13px]">Filter Resistance Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Popover open={filterTypeOpen} onOpenChange={setFilterTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={filterTypeOpen}
                    className="w-full justify-between text-sm h-8 text-[13px] py-[8px] px-[12px] py-[5px]"
                  >
                    {filterType
                      ? getFilterTypeOptions().find((option) => option.value === filterType)?.label
                      : "Select filter type..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search filter types..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No filter type found.</CommandEmpty>
                      <CommandGroup>
                        {getFilterTypeOptions().map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={(currentValue) => {
                              setFilterType(currentValue === filterType ? "" : currentValue);
                              setFilterValue("");
                              setFilterTypeOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filterType === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <Popover open={filterValueOpen} onOpenChange={setFilterValueOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={filterValueOpen}
                    disabled={!filterType}
                    className="w-full justify-between text-sm h-8 text-[13px] px-[12px] py-[5px]"
                  >
                    {filterValue
                      ? getFilterValueOptionsForType(filterType).find((option) => option.value === filterValue)?.label
                      : filterType ? "Select value..." : "Select type first"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search values..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No value found.</CommandEmpty>
                      <CommandGroup>
                        {getFilterValueOptionsForType(filterType).map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={(currentValue) => {
                              setFilterValue(currentValue === filterValue ? "" : currentValue);
                              setFilterValueOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filterValue === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Add Filter Button */}
            <button
              onClick={filterHelpers.addFilter}
              disabled={!filterType || !filterValue}
              className="px-4 bg-gray-600 text-white text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap text-[13px] py-[5px] px-[16px] py-[8px]"
            >
              Add Filter
            </button>
          </div>
        </div>

        {/* Main Layout - Chart and Controls Side Panel */}
        <div className="flex gap-6">
          {/* Chart Area */}
          <div className="flex-1">
            {/* Selection Required State */}
            {!loading && !error && (!selectedOrganism || !selectedAntibiotic) && (
              <div className="flex items-center justify-center py-12 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-blue-700">Please select both an organism and antibiotic to view S/I/R distribution</span>
              </div>
            )}

            {/* Chart Display */}
            {!loading && !error && selectedOrganism && selectedAntibiotic && data.length > 0 && (
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={100}
                      outerRadius={180}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-medium fill-gray-700">
                      {availableOrganisms.find(org => org.value === selectedOrganism)?.label || selectedOrganism}
                    </text>
                    <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-gray-500" fontStyle="italic">
                      ({selectedOrganism})
                    </text>
                    <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-medium fill-gray-700">
                      vs
                    </text>
                    <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-medium fill-gray-700">
                      {selectedAntibiotic}
                    </text>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value}%`,
                        name
                      ]}
                      labelFormatter={(label: string) => `${label} Response`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Specimen-only Summary (when organism selected but no antibiotic) */}
            {!loading && !error && selectedOrganism && !selectedAntibiotic && specimenStats && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {specimenStats.totalSpecimens}
                  </div>
                  <div className="text-lg text-blue-600 mb-1">
                    Total Specimens Available
                  </div>
                  <div className="text-sm text-blue-500">
                    {availableOrganisms.find(org => org.value === selectedOrganism)?.label} isolates{activeFilters.length > 0 ? ' (filtered)' : ''}
                  </div>
                  {activeFilters.length > 0 && (
                    <div className="text-xs text-blue-400 mt-2">
                      {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} applied
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selection and Filter Controls Panel */}

        </div>

        {/* Summary Statistics */}
        {!loading && !error && selectedOrganism && selectedAntibiotic && stats && specimenStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
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
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">
                {specimenStats.totalSpecimens}
              </div>
              <div className="text-sm text-blue-600">Total Specimens</div>
              <div className="text-xs text-blue-500">All organism isolates{activeFilters.length > 0 ? ' (filtered)' : ''}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}