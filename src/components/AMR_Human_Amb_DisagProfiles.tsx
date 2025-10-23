import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDown, Check, Loader2, AlertCircle, Table, Download } from 'lucide-react';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from './ui/utils';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// New interface for disaggregated data (one pathogen-antibiotic pair, multiple categories)
interface DisaggregatedResistanceData {
  category: string;
  categoryLabel: string;
  totalTested: number;
  susceptible: {
    count: number;
    percentage: number;
  };
  intermediate: {
    count: number;
    percentage: number;
  };
  resistant: {
    count: number;
    percentage: number;
  };
}

interface DisaggregatedResponse {
  data: DisaggregatedResistanceData[];
  pathogen: { code: string; name: string };
  antibiotic: { code: string; name: string };
  viewByCategory: string;
  totalCategories: number;
  dataSource: string;
  timestamp: string;
  filtersApplied: Record<string, string>;
}

export function AMR_Human_Amb_DisagProfiles() {
  const [data, setData] = useState<DisaggregatedResistanceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Connecting to server...');
  
  // View mode state
  const [showTable, setShowTable] = useState(false);
  
  // Pathogen selection state
  const [selectedPathogenCode, setSelectedPathogenCode] = useState<string>('eco'); // Default to E. coli
  const [selectedPathogenName, setSelectedPathogenName] = useState<string>('Escherichia coli');
  const [pathogenOptions, setPathogenOptions] = useState<Array<{code: string, name: string}>>([]);
  const [pathogenDropdownOpen, setPathogenDropdownOpen] = useState(false);
  const [pathogenLoading, setPathogenLoading] = useState(true);
  const [organismNameMap, setOrganismNameMap] = useState<Map<string, string>>(new Map());
  
  // NEW: Antibiotic selection state
  const [selectedAntibioticCode, setSelectedAntibioticCode] = useState<string>('CRO'); // Default to Ceftriaxone
  const [selectedAntibioticName, setSelectedAntibioticName] = useState<string>('Ceftriaxone');
  const [antibioticOptions, setAntibioticOptions] = useState<Array<{code: string, name: string}>>([]);
  const [antibioticDropdownOpen, setAntibioticDropdownOpen] = useState(false);
  const [antibioticLoading, setAntibioticLoading] = useState(true);
  
  // NEW: View By category state (for disaggregation)
  const [viewByCategory, setViewByCategory] = useState<string>('INSTITUTION'); // Default to Institution
  const [viewByCategoryOpen, setViewByCategoryOpen] = useState(false);
  
  // Filter state management
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterTypeOpen, setFilterTypeOpen] = useState(false);
  const [filterValueOpen, setFilterValueOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, Array<{value: string, label: string}>>>({});

  // Fetch filter options from server
  const fetchFilterOptions = async (column: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-filter-values?column=${column}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.values) {
          return data.values.map((option: any) => ({
            value: String(option),
            label: String(option)
          }));
        }
      }
    } catch (error) {
      console.error(`Error fetching ${column} options:`, error);
    }
    return [];
  };

  // Fetch organism mappings from vw_amr_hh_organisms view
  useEffect(() => {
    const fetchOrganismMappings = async () => {
      try {
        console.log('🔬 Disagg Profiles: Fetching organism name mappings...');
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/organism-mapping`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.mappings && Array.isArray(data.mappings)) {
            const mapping = new Map<string, string>();
            const pathogenOpts: Array<{code: string, name: string}> = [];
            
            data.mappings.forEach((item: any) => {
              if (item.code && item.organism_name) {
                mapping.set(item.code, item.organism_name);
                pathogenOpts.push({
                  code: item.code,
                  name: item.organism_name
                });
              }
            });
            
            pathogenOpts.sort((a, b) => a.name.localeCompare(b.name));
            
            setOrganismNameMap(mapping);
            setPathogenOptions(pathogenOpts);
            
            const defaultName = mapping.get('eco') || 'Escherichia coli';
            setSelectedPathogenName(defaultName);
            
            console.log(`✅ Disagg Profiles: Loaded ${mapping.size} organism mappings`);
          }
        }
      } catch (error) {
        console.error('❌ Disagg Profiles: Error fetching organism mappings:', error);
      } finally {
        setPathogenLoading(false);
      }
    };

    fetchOrganismMappings();
  }, []);

  // NEW: Fetch available antibiotics for selected pathogen
  useEffect(() => {
    const fetchAntibioticsForPathogen = async () => {
      if (!selectedPathogenCode || pathogenLoading) return;
      
      try {
        setAntibioticLoading(true);
        console.log(`💊 Fetching antibiotics for pathogen: ${selectedPathogenCode}`);
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-antibiotics-for-organism?organism=${selectedPathogenCode}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.antibiotics && Array.isArray(data.antibiotics)) {
            const antibioticOpts = data.antibiotics
              .map((ab: any) => ({
                code: ab.antibiotic_code || ab.code,
                name: ab.antibiotic_name || ab.name
              }))
              .sort((a, b) => a.name.localeCompare(b.name));
            
            setAntibioticOptions(antibioticOpts);
            
            // Set default antibiotic if available
            if (antibioticOpts.length > 0) {
              const defaultAntibiotic = antibioticOpts.find(ab => ab.code === 'CRO') || antibioticOpts[0];
              setSelectedAntibioticCode(defaultAntibiotic.code);
              setSelectedAntibioticName(defaultAntibiotic.name);
            }
            
            console.log(`✅ Loaded ${antibioticOpts.length} antibiotics for ${selectedPathogenCode}`);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching antibiotics:', error);
      } finally {
        setAntibioticLoading(false);
      }
    };

    fetchAntibioticsForPathogen();
  }, [selectedPathogenCode, pathogenLoading]);

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      const amrColumns = ['SEX', 'AGE_CAT', 'PAT_TYPE', 'INSTITUTION', 'DEPARTMENT', 'WARD_TYPE', 'YEAR_SPEC', 'X_REGION'];
      const newFilterOptions: Record<string, Array<{value: string, label: string}>> = {};

      for (const column of amrColumns) {
        const options = await fetchFilterOptions(column);
        if (options.length > 0) {
          newFilterOptions[column.toLowerCase()] = options;
        }
      }

      setFilterOptions(newFilterOptions);
    };

    loadFilterOptions();
  }, []);

  // Combined filter configurations
  const filterConfigs = useMemo(() => {
    const columnLabels: Record<string, string> = {
      'sex': 'Sex',
      'age_cat': 'Age Category',
      'pat_type': 'Patient Type',
      'institution': 'Institution',
      'department': 'Department',
      'ward_type': 'Ward Type',
      'year_spec': 'Year Specimen Collected',
      'x_region': 'Region'
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

  // NEW: Fetch disaggregated resistance data for pathogen-antibiotic pair by category
  const fetchDisaggregatedData = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingMessage('Connecting to server...');
      
      console.log('Fetching disaggregated resistance data...');
      console.log(`Pathogen: ${selectedPathogenCode}, Antibiotic: ${selectedAntibioticCode}, View By: ${viewByCategory}`);
      
      const queryParams = new URLSearchParams();
      
      // Add pathogen and antibiotic
      queryParams.append('ORGANISM', selectedPathogenCode);
      queryParams.append('ANTIBIOTIC', selectedAntibioticCode);
      queryParams.append('GROUP_BY', viewByCategory);
      queryParams.append('MIN_ISOLATES', '30');
      
      // Add active filters
      activeFilters.forEach(filter => {
        const columnMapping: Record<string, string> = {
          'sex': 'SEX',
          'age_cat': 'AGE_CAT',
          'pat_type': 'PAT_TYPE',
          'institution': 'INSTITUTION',
          'department': 'DEPARTMENT',
          'ward_type': 'WARD_TYPE',
          'year_spec': 'YEAR_SPEC',
          'x_region': 'X_REGION'
        };
        
        const columnName = columnMapping[filter.type];
        if (columnName) {
          const filterValue = String(filter.value).trim();
          if (filterValue && filterValue !== '') {
            queryParams.append(columnName, filterValue);
          }
        }
      });
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-disaggregated-resistance${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('Request URL:', url);
      
      setLoadingMessage('Processing disaggregated data...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('Disaggregated data request timeout after 25 seconds');
        controller.abort();
      }, 25000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setLoadingMessage('Processing response data...');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: DisaggregatedResponse = await response.json();
      console.log('Disaggregated resistance response:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Sort by category label (handle both strings and numbers)
      const sortedData = result.data.sort((a, b) => {
        const aLabel = a.categoryLabel;
        const bLabel = b.categoryLabel;
        
        // If both are numbers, sort numerically
        if (typeof aLabel === 'number' && typeof bLabel === 'number') {
          return aLabel - bLabel;
        }
        
        // If both are strings, sort alphabetically
        if (typeof aLabel === 'string' && typeof bLabel === 'string') {
          return aLabel.localeCompare(bLabel);
        }
        
        // Mixed types: convert to string and compare
        return String(aLabel).localeCompare(String(bLabel));
      });
      setData(sortedData);
      
    } catch (error) {
      console.error('Error fetching disaggregated data:', error);
      if (error.name === 'AbortError') {
        setError('Request timeout (25s) - Try applying filters to reduce data size');
      } else {
        setError(`Failed to load data: ${error.message}`);
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data when pathogen, antibiotic, category, or filters change
  useEffect(() => {
    if (!pathogenLoading && !antibioticLoading && selectedPathogenCode && selectedAntibioticCode) {
      fetchDisaggregatedData();
    }
  }, [activeFilters, selectedPathogenCode, selectedAntibioticCode, viewByCategory, pathogenLoading, antibioticLoading]);

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

  // NEW: View By category options
  const viewByCategoryOptions = [
    { value: 'INSTITUTION', label: 'Institution' },
    { value: 'SEX', label: 'Sex' },
    { value: 'AGE_CAT', label: 'Age Category' },
    { value: 'PAT_TYPE', label: 'Patient Type' },
    { value: 'WARD_TYPE', label: 'Ward Type' },
    { value: 'X_REGION', label: 'Region' },
    { value: 'YEAR_SPEC', label: 'Year Specimen' }
  ];

  const getViewByCategoryLabel = (value: string) => {
    return viewByCategoryOptions.find(opt => opt.value === value)?.label || value;
  };

  // Prepare data for grouped bar chart
  const chartData = data.map(item => ({
    category: item.categoryLabel,
    totalTested: item.totalTested,
    'Resistant': item.resistant.percentage,
    resistantCount: item.resistant.count,
    susceptibleCount: item.susceptible.count,
    intermediateCount: item.intermediate.count
  }));

  // Function to get color based on resistance percentage
  const getResistanceColor = (resistancePercent: number): string => {
    if (resistancePercent < 20) return '#22c55e';     // Green - Low resistance
    if (resistancePercent < 40) return '#eab308';     // Yellow - Moderate resistance
    return '#ef4444';                                 // Red - High resistance
  };

  // Resistance threshold colors for legend
  const resistanceThresholds = {
    'Low': { color: '#22c55e', label: '<20% (Low)', range: '<20%' },
    'Moderate': { color: '#eab308', label: '20-39% (Moderate)', range: '20-39%' },
    'High': { color: '#ef4444', label: '≥40% (High)', range: '≥40%' }
  };

  // Colors for table view (S/I/R display)
  const colors = {
    'Susceptible': '#22c55e',
    'Intermediate': '#eab308',
    'Resistant': '#ef4444'
  };

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const resistancePercent = data.Resistant;
      const thresholdLevel = resistancePercent < 20 ? 'Low' : resistancePercent < 40 ? 'Moderate' : 'High';
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-sm mb-1">Total Tested: {data.totalTested.toLocaleString()}</p>
          <div className="text-sm">
            <span style={{ color: getResistanceColor(resistancePercent) }}>● </span>
            Resistant: {resistancePercent.toFixed(1)}% ({data.resistantCount.toLocaleString()})
          </div>
          <p className="text-xs text-gray-500 mt-1">Alert Level: {thresholdLevel}</p>
        </div>
      );
    }
    return null;
  };

  // Determine if we should show overlay
  const showOverlay = loading || error || !data || data.length === 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-lg font-medium">Resistance for</span>
            
            {/* Inline Pathogen Dropdown */}
            <Popover open={pathogenDropdownOpen} onOpenChange={setPathogenDropdownOpen}>
              <PopoverTrigger asChild>
                <button
                  role="combobox"
                  aria-expanded={pathogenDropdownOpen}
                  disabled={pathogenLoading}
                  className="inline-flex items-center gap-1 text-lg font-medium text-primary hover:text-blue-600 cursor-pointer transition-colors focus:outline-none focus:underline"
                >
                  {pathogenLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[rgb(32,102,118)] not-italic">{selectedPathogenName}</span>
                      <ChevronDown className="h-4 w-4 opacity-60" />
                    </>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search pathogens..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No pathogen found.</CommandEmpty>
                    <CommandGroup>
                      {pathogenOptions.map((pathogen) => (
                        <CommandItem
                          key={pathogen.code}
                          value={pathogen.name}
                          onSelect={() => {
                            setSelectedPathogenCode(pathogen.code);
                            setSelectedPathogenName(pathogen.name);
                            setPathogenDropdownOpen(false);
                            console.log(`🦠 Selected pathogen: ${pathogen.code} → ${pathogen.name}`);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPathogenCode === pathogen.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm">{pathogen.name}</span>
                            <span className="text-xs text-muted-foreground">({pathogen.code})</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <span className="text-lg font-medium">vs</span>

            {/* NEW: Inline Antibiotic Dropdown */}
            <Popover open={antibioticDropdownOpen} onOpenChange={setAntibioticDropdownOpen}>
              <PopoverTrigger asChild>
                <button
                  role="combobox"
                  aria-expanded={antibioticDropdownOpen}
                  disabled={antibioticLoading}
                  className="inline-flex items-center gap-1 text-lg font-medium text-primary hover:text-blue-600 cursor-pointer transition-colors focus:outline-none focus:underline"
                >
                  {antibioticLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[rgb(32,102,118)] not-italic">{selectedAntibioticName}</span>
                      <ChevronDown className="h-4 w-4 opacity-60" />
                    </>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search antibiotics..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No antibiotic found.</CommandEmpty>
                    <CommandGroup>
                      {antibioticOptions.map((antibiotic) => (
                        <CommandItem
                          key={antibiotic.code}
                          value={antibiotic.name}
                          onSelect={() => {
                            setSelectedAntibioticCode(antibiotic.code);
                            setSelectedAntibioticName(antibiotic.name);
                            setAntibioticDropdownOpen(false);
                            console.log(`💊 Selected antibiotic: ${antibiotic.code} → ${antibiotic.name}`);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAntibioticCode === antibiotic.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm">{antibiotic.name}</span>
                            <span className="text-xs text-muted-foreground">({antibiotic.code})</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <span className="text-lg font-medium"> | View by</span>

            {/* NEW: View By Category Dropdown */}
            <Popover open={viewByCategoryOpen} onOpenChange={setViewByCategoryOpen}>
              <PopoverTrigger asChild>
                <button
                  role="combobox"
                  aria-expanded={viewByCategoryOpen}
                  className="inline-flex items-center gap-1 text-lg font-medium text-primary hover:text-blue-600 cursor-pointer transition-colors focus:outline-none focus:underline"
                >
                  <span className="text-[rgb(32,102,118)] not-italic">{getViewByCategoryLabel(viewByCategory)}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search categories..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      {viewByCategoryOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => {
                            setViewByCategory(option.value);
                            setViewByCategoryOpen(false);
                            console.log(`📊 View by category: ${option.value}`);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              viewByCategory === option.value ? "opacity-100" : "opacity-0"
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
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 px-[5px] py-[0px] ${ 
                showTable 
                  ? 'text-blue-600 bg-blue-50 hover:text-blue-700 hover:bg-blue-100' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => {
                setShowTable(!showTable);
                console.log(`${showTable ? 'Show chart' : 'Show table'} view`);
              }}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log(`Download data for ${selectedPathogenName} vs ${selectedAntibioticName}`);
                // TODO: Implement download functionality
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 m-[0px] text-[13px] font-bold font-normal">
          {showOverlay 
            ? `Resistance breakdown for ${selectedPathogenName} against ${selectedAntibioticName} • By ${getViewByCategoryLabel(viewByCategory)} • Color-coded by alert thresholds • 30+ isolates`
            : `Showing ${data.length} ${getViewByCategoryLabel(viewByCategory).toLowerCase()} categories • ${selectedPathogenName} vs ${selectedAntibioticName} • Color-coded by alert thresholds • 30+ isolates`
          }
        </p>
        
        {/* Inline Filter Controls */}
        <div className="bg-gray-50 rounded-lg p-4 border mt-[10px] mr-[0px] mb-[0px] ml-[0px]">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Resistance Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Popover open={filterTypeOpen} onOpenChange={setFilterTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={filterTypeOpen}
                    className="w-full justify-between text-sm h-10"
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
                        {getFilterTypeOptions().map((option, index) => (
                          <CommandItem
                            key={`type-${option.value}-${index}`}
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
                    className="w-full justify-between text-sm h-10"
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
                        {getFilterValueOptionsForType(filterType).map((option, index) => (
                          <CommandItem
                            key={`${filterType}-${option.value}-${index}`}
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
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 m-[0px]">
            <div className="flex gap-1">
              {activeFilters.map((filter, index) => (
                <div
                  key={`inline-active-${filter.type}-${filter.value}-${index}`}
                  className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                >
                  <span className="text-[10px]">{filter.label}</span>
                  <button
                    onClick={() => filterHelpers.removeFilter(index)}
                    className="text-blue-600 hover:text-blue-800 ml-1 text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={filterHelpers.clearAllFilters}
                className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-800"
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="w-full">
          {showTable ? (
            /* Table View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  Resistance Data by {getViewByCategoryLabel(viewByCategory)}
                </h4>
                <span className="text-sm text-gray-500">
                  Showing {data.length} {getViewByCategoryLabel(viewByCategory).toLowerCase()} categor{data.length !== 1 ? 'ies' : 'y'}
                </span>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-1">{loadingMessage}</p>
                    <p className="text-xs text-gray-600">Loading resistance data...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-sm text-red-600 mb-1">Error loading data</p>
                    <p className="text-xs text-gray-600 mb-3">{error}</p>
                    <p className="text-xs text-blue-600">Try selecting different options or adjusting filters</p>
                  </div>
                </div>
              ) : data.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-1">No data available</p>
                    <p className="text-xs text-gray-500 mb-3">with 30+ tested isolates for the selected combination</p>
                    <p className="text-xs text-blue-600">Try different pathogen, antibiotic, or category selections</p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <TableComponent>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="min-w-[150px]">{getViewByCategoryLabel(viewByCategory)}</TableHead>
                        <TableHead className="w-24 text-right">Total Tested</TableHead>
                        <TableHead className="w-32 text-right">Susceptible (S)</TableHead>
                        <TableHead className="w-32 text-right">Intermediate (I)</TableHead>
                        <TableHead className="w-32 text-right">Resistant (R)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((item, index) => (
                        <TableRow key={item.category}>
                          <TableCell className="font-medium text-gray-500">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{item.categoryLabel}</span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.totalTested.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium" style={{ color: colors.Susceptible }}>
                                {item.susceptible.percentage.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500">
                                ({item.susceptible.count.toLocaleString()})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium" style={{ color: colors.Intermediate }}>
                                {item.intermediate.percentage.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500">
                                ({item.intermediate.count.toLocaleString()})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium" style={{ color: colors.Resistant }}>
                                {item.resistant.percentage.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500">
                                ({item.resistant.count.toLocaleString()})
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableComponent>
                </div>
              )}
            </div>
          ) : (
            /* Chart View */
            <>
              {/* Resistance Threshold Legend */}
              <div className="flex justify-center m-[0px] gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: resistanceThresholds.Low.color }}></div>
                  <span className="text-sm text-[12px]">{resistanceThresholds.Low.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: resistanceThresholds.Moderate.color }}></div>
                  <span className="text-sm text-[12px]">{resistanceThresholds.Moderate.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: resistanceThresholds.High.color }}></div>
                  <span className="text-sm text-[12px]">{resistanceThresholds.High.label}</span>
                </div>
              </div>
              
              <div className="h-[350px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={showOverlay ? [] : chartData}
                    margin={{
                      top: 20,
                      right: 10,
                      left: 10,
                      bottom: 55,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category"
                      angle={-25}
                      textAnchor="end"
                      height={10}
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis 
                      width={40}
                      domain={[0, 100]}
                      ticks={[0, 20, 40, 60, 80, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={renderCustomTooltip} />
                    <Bar 
                      dataKey="Resistant"
                      radius={[4, 4, 0, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getResistanceColor(entry.Resistant)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Overlay for loading, error, and no data states */}
                {showOverlay && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      {loading && (
                        <>
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground mb-1">{loadingMessage}</p>
                          <p className="text-xs text-muted-foreground">Fetching disaggregated data...</p>
                        </>
                      )}
                      {error && !loading && (
                        <>
                          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                          <p className="text-sm text-red-600 mb-1">Error loading data</p>
                          <p className="text-xs text-muted-foreground mb-3">{error}</p>
                          <p className="text-xs text-blue-600">Try different selections above</p>
                        </>
                      )}
                      {!loading && !error && (!data || data.length === 0) && (
                        <>
                          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground mb-1">No data available</p>
                          <p className="text-xs text-muted-foreground mb-3">with 30+ tested isolates for selected combination</p>
                          <p className="text-xs text-blue-600">Try different pathogen, antibiotic, or category selections</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 m-[0px]">
          <p className="text-xs text-gray-500">
            {showOverlay 
              ? `Resistance breakdown for ${selectedPathogenName} vs ${selectedAntibioticName} by ${getViewByCategoryLabel(viewByCategory)} • %R analysis with healthcare alert thresholds (Green <20%, Yellow 20-39%, Red ≥40%)`
              : `${selectedPathogenName} vs ${selectedAntibioticName} resistance across ${data.length} ${getViewByCategoryLabel(viewByCategory).toLowerCase()} categor${data.length !== 1 ? 'ies' : 'y'} • Healthcare alert thresholds (Green <20%, Yellow 20-39%, Red ≥40%)`
            }
            {!showOverlay && activeFilters.length > 0 && ` • Filtered view with ${activeFilters.length} active filter${activeFilters.length > 1 ? 's' : ''}`}
            {!showOverlay && activeFilters.length === 0 && ` • Showing all categories meeting minimum sample threshold (30+ isolates)`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
