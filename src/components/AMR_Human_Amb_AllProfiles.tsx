import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDown, Check, Loader2, AlertCircle, Table, Download } from 'lucide-react';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from './ui/utils';

interface AntibioticProfile {
  antibiotic: string;
  antibioticCode: string;
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

interface AMRAntibioticProfilesResponse {
  profiles: AntibioticProfile[];
  totalAntibiotics: number;
  dataSource: string;
  tableName: string;
  timestamp: string;
  filtersApplied: Record<string, string>;
}

interface ApiResponse {
  success: boolean;
  data: {
    nodeId: string;
    nodeName: string;
    totalRows: number;
    columns: string[];
    rows: any[];
  };
}

export function AMR_Human_Amb_AllProfiles() {
  const [data, setData] = useState<AntibioticProfile[]>([]);
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
  
  // Filter state management
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterTypeOpen, setFilterTypeOpen] = useState(false);
  const [filterValueOpen, setFilterValueOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Antibiotic mappings for display names
  const antibioticMappings: { [key: string]: string } = {
    'AMP ND10': 'Ampicillin',
    'AMC ND20': 'Amoxicillin-clavulanate',
    'CTX ND30': 'Cefotaxime',
    'CAZ ND30': 'Ceftazidime',
    'CRO ND30': 'Ceftriaxone',
    'IPM ND10': 'Imipenem',
    'MEM ND10': 'Meropenem',
    'CIP ND5': 'Ciprofloxacin',
    'GEN ND10': 'Gentamicin',
    'AMK ND30': 'Amikacin',
    'TCY ND30': 'Tetracycline',
    'SXT ND1 2': 'Trimethoprim-sulfamethoxazole',
    'OXA ND1': 'Oxacillin',
    'VAN ND30': 'Vancomycin',
    'ERY ND15': 'Erythromycin',
    'CHL ND30': 'Chloramphenicol',
    'NIT ND300': 'Nitrofurantoin',
    'TOB ND10': 'Tobramycin',
    'CLI ND2': 'Clindamycin',
    'FOX ND30': 'Cefoxitin',
    'OFX ND5': 'Ofloxacin',
    'TCC ND75': 'Ticarcillin-clavulanate',
    'CXM ND30': 'Cefuroxime',
    'NOR ND10': 'Norfloxacin',
    'ATM ND30': 'Aztreonam',
    'RIF ND5': 'Rifampin',
    'DOX ND30': 'Doxycycline',
    'MNO ND30': 'Minocycline',
    'TEC ND30': 'Teicoplanin',
    'FEP ND30': 'Cefepime',
    'CTC ND30': 'Chlortetracycline',
    'CCV ND30': 'Cefaclor',
    'TIO ND30': 'Ceftiofur',
    'NAL ND30': 'Nalidixic acid',
    'TZP ND100': 'Piperacillin-tazobactam',
    'GEH ND120': 'Geopen'
  };

  // Organism mappings for display names
  const organismMappings: { [key: string]: string } = {
    'eco': 'E. coli',
    'kpn': 'K. pneumoniae',
    'pae': 'P. aeruginosa',
    'aba': 'A. baumannii',
    'sau': 'S. aureus',
    'efm': 'E. faecium',
    'efa': 'E. faecalis',
    'spn': 'S. pneumoniae',
    'sep': 'S. epidermidis',
    'sag': 'S. agalactiae',
    'sma': 'S. marcescens',
    'ecl': 'E. cloacae'
  };

  // Helper function to get antibiotic display name
  const getAntibioticName = (columnName: string): string => {
    return antibioticMappings[columnName] || columnName;
  };

  // Helper function to get organism display name
  const getOrganismName = (code: string): string => {
    if (!code) return code;
    const mapping = organismMappings[code.toLowerCase()];
    return mapping || code;
  };

  // Filter options
  const filterTypeOptions = [
    { value: 'SEX', label: 'Sex' },
    { value: 'AGE_CAT', label: 'Age Category' },
    { value: 'PAT_TYPE', label: 'Patient Type' },
    { value: 'INSTITUTION', label: 'Institution' },
    { value: 'DEPARTMENT', label: 'Department' },
    { value: 'WARD_TYPE', label: 'Ward Type' },
    { value: 'YEAR_SPEC', label: 'Year Specimen' },
    { value: 'X_REGION', label: 'Region' }
  ];

  // Helper function to extract unique values from raw data
  const extractUniqueValues = (rows: any[], columnName: string): Array<{value: string, label: string}> => {
    const uniqueValues = new Set();
    
    rows.forEach(row => {
      const value = row[columnName];
      if (value !== undefined && value !== null && value !== '') {
        uniqueValues.add(value.toString().trim());
      }
    });
    
    const sortedValues = Array.from(uniqueValues).sort((a: any, b: any) => 
      a.toString().localeCompare(b.toString())
    );
    
    return sortedValues.map((value: any) => ({
      value: value,
      label: value
    }));
  };

  // Calculate antibiotic profiles from raw data
  const calculateAntibioticProfiles = (rows: any[], organismCode: string): AntibioticProfile[] => {
    console.log('Calculating antibiotic profiles for organism:', organismCode);
    console.log('Processing', rows.length, 'rows');
    
    const profiles: AntibioticProfile[] = [];
    
    // Define antibiotic columns to analyze
    const antibioticColumns = [
      'AMP ND10', 'AMC ND20', 'CTX ND30', 'CAZ ND30', 'CRO ND30', 
      'IPM ND10', 'MEM ND10', 'CIP ND5', 'GEN ND10', 'AMK ND30',
      'TCY ND30', 'SXT ND1 2', 'OXA ND1', 'VAN ND30', 'ERY ND15',
      'CHL ND30', 'NIT ND300', 'TOB ND10', 'CLI ND2', 'FOX ND30',
      'OFX ND5', 'TCC ND75', 'CXM ND30', 'NOR ND10', 'ATM ND30',
      'RIF ND5', 'DOX ND30', 'MNO ND30', 'TEC ND30', 'FEP ND30'
    ];

    // Helper function to determine susceptibility from zone size
    const getSusceptibility = (zoneSize: any, antibiotic: string): 'susceptible' | 'intermediate' | 'resistant' => {
      if (!zoneSize || zoneSize === '') return 'susceptible'; // Default to susceptible if no data
      
      const zoneNum = parseFloat(zoneSize);
      if (isNaN(zoneNum)) return 'susceptible';

      // Different breakpoints for different antibiotic classes
      let resistantBreakpoint = 15;
      let intermediateBreakpoint = 16;

      if (['IPM ND10', 'MEM ND10'].includes(antibiotic)) {
        resistantBreakpoint = 19; // Carbapenems
        intermediateBreakpoint = 20;
      } else if (['CTX ND30', 'CAZ ND30', 'CRO ND30', 'FEP ND30'].includes(antibiotic)) {
        resistantBreakpoint = 22; // Cephalosporins
        intermediateBreakpoint = 23;
      } else if (['VAN ND30'].includes(antibiotic)) {
        resistantBreakpoint = 17; // Vancomycin
        intermediateBreakpoint = 18;
      } else if (['OXA ND1'].includes(antibiotic)) {
        resistantBreakpoint = 17; // Oxacillin/Methicillin
        intermediateBreakpoint = 18;
      }

      if (zoneNum <= resistantBreakpoint) {
        return 'resistant';
      } else if (zoneNum <= intermediateBreakpoint) {
        return 'intermediate';
      } else {
        return 'susceptible';
      }
    };

    // Filter rows for the selected organism
    const organismRows = rows.filter(row => {
      const organism = row.ORGANISM;
      return organism && organism.toString().toLowerCase() === organismCode.toLowerCase();
    });

    console.log(`Found ${organismRows.length} rows for organism ${organismCode}`);

    // Calculate profiles for each antibiotic
    antibioticColumns.forEach(antibiotic => {
      const counts = {
        susceptible: 0,
        intermediate: 0,
        resistant: 0,
        total: 0
      };

      organismRows.forEach(row => {
        const zoneSize = row[antibiotic];
        if (zoneSize !== undefined && zoneSize !== null && zoneSize !== '') {
          counts.total += 1;
          const susceptibility = getSusceptibility(zoneSize, antibiotic);
          counts[susceptibility] += 1;
        }
      });

      // Only include antibiotics with at least 30 tested isolates
      if (counts.total >= 30) {
        const totalTested = counts.total;
        const susceptiblePercentage = (counts.susceptible / totalTested) * 100;
        const intermediatePercentage = (counts.intermediate / totalTested) * 100;
        const resistantPercentage = (counts.resistant / totalTested) * 100;

        profiles.push({
          antibiotic: getAntibioticName(antibiotic),
          antibioticCode: antibiotic,
          totalTested,
          susceptible: {
            count: counts.susceptible,
            percentage: susceptiblePercentage
          },
          intermediate: {
            count: counts.intermediate,
            percentage: intermediatePercentage
          },
          resistant: {
            count: counts.resistant,
            percentage: resistantPercentage
          }
        });
      }
    });

    // Sort antibiotics alphabetically by name
    const sortedProfiles = profiles.sort((a, b) => a.antibiotic.localeCompare(b.antibiotic));
    
    console.log(`Calculated ${sortedProfiles.length} antibiotic profiles for ${organismCode}`);
    
    return sortedProfiles;
  };

  // Fetch all data from local API endpoint
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingMessage('Connecting to server...');
      
      console.log('Fetching all AMR data from local API for Antibiotic Profiles...');
      const response = await fetch('https://backend.ajhiveprojects.com/v1/amr-health-v2', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiData: ApiResponse = await response.json();
      console.log('Full API response received for Antibiotic Profiles:', apiData);

      if (!apiData.success || !apiData.data || !apiData.data.rows) {
        throw new Error('Invalid API response format');
      }

      const rows = apiData.data.rows;
      
      // Log sample data for debugging
      console.log('Sample rows for debugging:', rows.slice(0, 3));
      console.log('Available columns:', apiData.data.columns);
      console.log('Organism values found:', [...new Set(rows.map(r => r.ORGANISM).filter(Boolean))].slice(0, 10));

      // Apply active filters
      let filteredRows = rows;
      if (activeFilters.length > 0) {
        filteredRows = rows.filter(row => {
          return activeFilters.every(filter => {
            const rowValue = row[filter.type];
            return rowValue !== undefined && rowValue !== null && 
                   rowValue.toString().toLowerCase() === filter.value.toLowerCase();
          });
        });
        console.log('After filtering:', filteredRows.length, 'rows');
      }
      
      // Process antibiotic profiles from filtered rows
      setLoadingMessage('Calculating antibiotic profiles...');
      const processedData = calculateAntibioticProfiles(filteredRows, selectedPathogenCode);
      setData(processedData);
      
    } catch (error) {
      console.error('Error fetching AMR data from local API for Antibiotic Profiles:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load pathogen options from available data
  useEffect(() => {
    const loadPathogenOptions = async () => {
      try {
        setPathogenLoading(true);
        
        const response = await fetch('https://backend.ajhiveprojects.com/v1/amr-health-v2', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const apiData: ApiResponse = await response.json();
          if (apiData.success && apiData.data && apiData.data.rows) {
            const rows = apiData.data.rows;
            
            // Extract unique organisms
            const uniqueOrganisms = new Set();
            rows.forEach(row => {
              const organism = row.ORGANISM;
              if (organism && organism.trim() && organism.toLowerCase() !== 'xxx') {
                uniqueOrganisms.add(organism);
              }
            });
            
            // Create pathogen options with display names
            const pathogenOpts = Array.from(uniqueOrganisms)
              .map(org => ({
                code: org as string,
                name: getOrganismName(org as string)
              }))
              .sort((a, b) => a.name.localeCompare(b.name));
            
            setPathogenOptions(pathogenOpts);
            
            // Update selected pathogen name
            const currentName = getOrganismName(selectedPathogenCode);
            setSelectedPathogenName(currentName);
            
            console.log(`Loaded ${pathogenOpts.length} pathogen options`);
          }
        }
      } catch (error) {
        console.error('Error loading pathogen options:', error);
      } finally {
        setPathogenLoading(false);
      }
    };

    loadPathogenOptions();
  }, []);

  // Filter configs
  const filterConfigs = useMemo(() => {
    const configs: Record<string, { label: string; options: Array<{value: string, label: string}> }> = {};

    const configMapping: Record<string, string> = {
      'SEX': 'Sex',
      'AGE_CAT': 'Age Category',
      'PAT_TYPE': 'Patient Type',
      'INSTITUTION': 'Institution',
      'DEPARTMENT': 'Department',
      'WARD_TYPE': 'Ward Type',
      'YEAR_SPEC': 'Year Specimen Collected',
      'X_REGION': 'Region'
    };

    // Load filter options when data is available
    Object.entries(configMapping).forEach(([key, label]) => {
      configs[key.toLowerCase()] = {
        label,
        options: [] // Would need raw data to populate this
      };
    });

    return configs;
  }, []);

  // Fetch data on component mount and when filters or pathogen selection changes
  useEffect(() => {
    if (!pathogenLoading) {
      fetchAllData();
    }
  }, [activeFilters, selectedPathogenCode, pathogenLoading]);

  // Filter helper functions
  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeOption = filterTypeOptions.find(opt => opt.value === filterType);
        const valueOption = getFilterValueOptionsForType(filterType).find(opt => opt.value === filterValue);
        
        if (typeOption && valueOption) {
          const newFilter = {
            type: filterType,
            value: filterValue,
            label: `${typeOption.label}: ${valueOption.label}`
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
    return filterTypeOptions;
  };

  // Get filter value options for selected type
  const getFilterValueOptionsForType = (type: string) => {
    const config = filterConfigs[type as keyof typeof filterConfigs];
    return config?.options || [];
  };

  // Prepare data for stacked vertical bar chart
  const chartData = data.map(profile => ({
    antibiotic: profile.antibiotic,
    totalTested: profile.totalTested,
    'Susceptible': profile.susceptible.percentage,
    'Intermediate': profile.intermediate.percentage,
    'Resistant': profile.resistant.percentage,
    // Additional data for tooltips
    susceptibleCount: profile.susceptible.count,
    intermediateCount: profile.intermediate.count,
    resistantCount: profile.resistant.count
  }));

  // Colors following healthcare standards
  const colors = {
    'Susceptible': '#22c55e',    // Green for susceptible
    'Intermediate': '#eab308',   // Yellow for intermediate  
    'Resistant': '#ef4444'       // Red for resistant
  };

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-sm mb-1">Total Tested: {data.totalTested}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="text-sm">
              <span style={{ color: entry.color }}>● </span>
              {entry.dataKey}: {entry.value.toFixed(1)}% 
              {entry.dataKey === 'Susceptible' && ` (${data.susceptibleCount})`}
              {entry.dataKey === 'Intermediate' && ` (${data.intermediateCount})`}
              {entry.dataKey === 'Resistant' && ` (${data.resistantCount})`}
            </div>
          ))}
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
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-medium">AST Profiles of Antimicrobials for</span>
            
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
              onClick={() => setShowTable(!showTable)}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => console.log('Download AST profile data')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 m-[0px] text-[13px] font-bold font-normal">
          {showOverlay 
            ? `Profiles for antibiotics against ${selectedPathogenName} • Showing only antibiotics with 30+ tested isolates`
            : `Profiles for ${data.length} antibiotics against ${selectedPathogenName} • Showing only antibiotics with 30+ tested isolates`
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
                  AST Profile Data Table for {selectedPathogenName}
                </h4>
                <span className="text-sm text-gray-500">
                  Showing {data.length} antibiotic{data.length !== 1 ? 's' : ''} with 30+ tested isolates
                </span>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-1">{loadingMessage}</p>
                    <p className="text-xs text-gray-600">Loading AST profiles for {selectedPathogenName}...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-sm text-red-600 mb-1">Error loading data</p>
                    <p className="text-xs text-gray-600 mb-3">{error}</p>
                    <p className="text-xs text-blue-600">Try selecting a different pathogen above</p>
                  </div>
                </div>
              ) : data.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-1">No AST data available for {selectedPathogenName}</p>
                    <p className="text-xs text-gray-500 mb-3">with 30+ tested isolates for the selected filters</p>
                    <p className="text-xs text-blue-600">Try selecting a different pathogen or adjusting filters</p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <TableComponent>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="min-w-[150px]">Antibiotic</TableHead>
                        <TableHead className="w-24 text-right">Total Tested</TableHead>
                        <TableHead className="w-32 text-right">Susceptible (S)</TableHead>
                        <TableHead className="w-32 text-right">Intermediate (I)</TableHead>
                        <TableHead className="w-32 text-right">Resistant (R)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((profile, index) => (
                        <TableRow key={profile.antibioticCode}>
                          <TableCell className="font-medium text-gray-500">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{profile.antibiotic}</span>
                              <span className="text-xs text-gray-500">({profile.antibioticCode})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {profile.totalTested.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium" style={{ color: colors.Susceptible }}>
                                {profile.susceptible.percentage.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500">
                                ({profile.susceptible.count.toLocaleString()})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium" style={{ color: colors.Intermediate }}>
                                {profile.intermediate.percentage.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500">
                                ({profile.intermediate.count.toLocaleString()})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium" style={{ color: colors.Resistant }}>
                                {profile.resistant.percentage.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500">
                                ({profile.resistant.count.toLocaleString()})
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
              {/* Color Legend */}
              <div className="flex justify-center m-[0px] gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.Susceptible }}></div>
                  <span className="text-sm text-[12px]">Susceptible (S)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.Intermediate }}></div>
                  <span className="text-sm text-[12px]">Intermediate (I)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.Resistant }}></div>
                  <span className="text-sm text-[12px]">Resistant (R)</span>
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
                      dataKey="antibiotic"
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
                      dataKey="Susceptible" 
                      stackId="stack" 
                      fill={colors.Susceptible}
                    />
                    <Bar 
                      dataKey="Intermediate" 
                      stackId="stack" 
                      fill={colors.Intermediate}
                    />
                    <Bar 
                      dataKey="Resistant" 
                      stackId="stack" 
                      fill={colors.Resistant}
                    />
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
                          <p className="text-xs text-muted-foreground">Fetching AST profiles for {selectedPathogenName}...</p>
                        </>
                      )}
                      {error && !loading && (
                        <>
                          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                          <p className="text-sm text-red-600 mb-1">Error loading data</p>
                          <p className="text-xs text-muted-foreground mb-3">{error}</p>
                          <p className="text-xs text-blue-600">Try selecting a different pathogen above</p>
                        </>
                      )}
                      {!loading && !error && (!data || data.length === 0) && (
                        <>
                          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground mb-1">No AST data available for {selectedPathogenName}</p>
                          <p className="text-xs text-muted-foreground mb-3">with 30+ tested isolates for the selected filters</p>
                          <p className="text-xs text-blue-600">Try selecting a different pathogen or adjusting filters</p>
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
              ? `AST profiles for ${selectedPathogenName} • S/I/R distribution analysis for antibiotics with 30+ isolates`
              : `AST profiles for ${selectedPathogenName} • S/I/R distribution analysis across ${data.length} antibiotics with 30+ isolates`
            }
            {!showOverlay && activeFilters.length > 0 && ` • Filtered view with ${activeFilters.length} active filter${activeFilters.length > 1 ? 's' : ''}`}
            {!showOverlay && activeFilters.length === 0 && ` • Showing all tested antibiotics meeting minimum sample threshold`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}