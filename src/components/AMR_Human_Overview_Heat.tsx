import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Download, ChevronDown, Check, Loader2, AlertCircle, Table as TableIcon } from 'lucide-react';
import { cn } from './ui/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

// Interface for heatmap data
interface HeatmapData {
  organisms: string[];
  antibiotics: string[];
  heatmapData: Record<string, Record<string, number>>;
  heatmapCounts: Record<string, Record<string, { resistant: number, total: number }>>;
  totalRecords: number;
  dataSource: string;
  tableName: string;
  timestamp: string;
  appliedFilters: Array<[string, string]>;
}

// Helper functions
const getResistanceAlertColor = (percentage: number): string => {
  if (percentage < 20) return '#16a34a'; // Green - Low risk
  if (percentage < 40) return '#eab308'; // Yellow - Moderate risk
  return '#dc2626'; // Red - High risk
};

const formatAntibioticName = (name: string): string => {
  return name
    .replace(/_/g, '-')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('-');
};

// ESBL filtering function
const shouldHideESBLPair = (organismCode: string, antibioticCode: string): boolean => {
  const esblOrganisms = ['eco', 'kpn', 'pae', 'aba'];
  const betaLactamAntibiotics = [
    'amc', 'amp', 'atm', 'caz', 'fep', 'cfm', 'cfo', 'cfp', 'cfs', 'ctx', 
    'cxm', 'czl', 'fox', 'cro', 'cxa', 'pip', 'ptz', 'sam', 'tcc', 'tim'
  ];
  
  const isESBLOrganism = esblOrganisms.includes(organismCode.toLowerCase());
  const isBetaLactam = betaLactamAntibiotics.includes(antibioticCode.toLowerCase());
  
  return isESBLOrganism && isBetaLactam;
};

export const AMR_Human_Overview_Heat = () => {
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [typeOpen, setTypeOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrganismType, setSelectedOrganismType] = useState<string>('whonet-priority');
  const [organismTypeOpen, setOrganismTypeOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // Organism category options
  const organismCategoryOptions = [
    { value: 'whonet-priority', label: 'WHONET Priority Pathogens' },
    { value: 'gram-positive', label: 'Gram-positive' },
    { value: 'gram-negative', label: 'Gram-negative' },
    { value: 'indicator', label: 'Indicator Bacteria' }
  ];

  // Organism type configuration
  const organismTypeConfig = {
    'whonet-priority': {
      label: 'WHONET Priority Pathogens',
      description: 'WHONET priority surveillance pathogens',
      filterCriteria: 'WHONET priority organisms'
    },
    'gram-positive': {
      label: 'Gram-positive bacteria',
      description: 'Gram-positive pathogens in surveillance',
      filterCriteria: 'ORG_TYPE = \'+\''
    },
    'gram-negative': {
      label: 'Gram-negative bacteria', 
      description: 'Gram-negative pathogens in surveillance',
      filterCriteria: 'ORG_TYPE = \'-\''
    },
    'indicator': {
      label: 'Indicator Bacteria',
      description: 'WHO priority surveillance indicators',
      filterCriteria: 'Key surveillance organisms'
    }
  };

  // Helper function to filter organisms based on selected type
  const filterOrganismsByType = (organisms: string[], type: string): string[] => {
    if (!organisms || organisms.length === 0) return [];

    switch (type) {
      case 'whonet-priority':
        return organisms.filter(org => ['sau', 'eco', 'spn', 'kpn', 'ent', 'efa', 'efm'].includes(org.toLowerCase()));
      
      case 'gram-positive':
        return organisms.filter(org => ['sau', 'spn', 'efm', 'efa', 'ste', 'sho', 'sha', 'sco', 'str', 'spg', 'sag', 'svi', 'enc'].includes(org.toLowerCase()));
      
      case 'gram-negative':
        return organisms.filter(org => ['eco', 'kpn', 'pae', 'ab-', 'abu', 'sal', 'stv', 'shi', 'ent', 'cfr', 'ser', 'pro', 'mor', 'cit', 'har', 'yer'].includes(org.toLowerCase()));
      
      case 'indicator':
      default:
        return organisms.filter(org => ['sau', 'eco', 'spn', 'kpn', 'ent', 'efa', 'efm'].includes(org.toLowerCase()));
    }
  };

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
    'ecl': 'E. cloacae',
    'efa': 'E. faecalis',
    'efm': 'E. faecium'
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

  // Calculate heatmap data from raw rows
  const calculateHeatmapData = (rows: any[]): HeatmapData => {
    console.log('Calculating heatmap data from', rows.length, 'rows');
    
    const organisms = new Set<string>();
    const antibiotics = new Set<string>();
    const heatmapData: Record<string, Record<string, number>> = {};
    const heatmapCounts: Record<string, Record<string, { resistant: number, total: number }>> = {};

    // Define antibiotic columns to analyze
    const antibioticColumns = [
      'AMP ND10', 'AMC ND20', 'CTX ND30', 'CAZ ND30', 'CRO ND30', 
      'IPM ND10', 'MEM ND10', 'CIP ND5', 'GEN ND10', 'AMK ND30',
      'TCY ND30', 'SXT ND1 2', 'OXA ND1', 'VAN ND30', 'ERY ND15',
      'CHL ND30', 'NIT ND300', 'TOB ND10', 'CLI ND2', 'FOX ND30',
      'OFX ND5', 'TCC ND75', 'CXM ND30', 'NOR ND10', 'ATM ND30',
      'RIF ND5', 'DOX ND30', 'MNO ND30', 'TEC ND30', 'FEP ND30'
    ];

    // Helper function to determine resistance from zone size
    const isResistant = (zoneSize: any, antibiotic: string): boolean => {
      if (!zoneSize || zoneSize === '') return false;
      
      const zoneNum = parseFloat(zoneSize);
      if (isNaN(zoneNum)) return false;

      // Different breakpoints for different antibiotic classes
      if (['IPM ND10', 'MEM ND10'].includes(antibiotic)) {
        return zoneNum <= 19; // Carbapenems
      } else if (['CTX ND30', 'CAZ ND30', 'CRO ND30', 'FEP ND30'].includes(antibiotic)) {
        return zoneNum <= 22; // Cephalosporins
      } else if (['VAN ND30'].includes(antibiotic)) {
        return zoneNum <= 17; // Vancomycin
      } else if (['OXA ND1'].includes(antibiotic)) {
        return zoneNum <= 17; // Oxacillin/Methicillin
      } else {
        return zoneNum <= 15; // Default breakpoint
      }
    };

    // Initialize data structures
    rows.forEach(row => {
      const organism = row.ORGANISM;
      if (organism && organism.trim() && organism.toLowerCase() !== 'xxx') {
        organisms.add(organism);
        
        // Initialize organism entry if not exists
        if (!heatmapData[organism]) {
          heatmapData[organism] = {};
          heatmapCounts[organism] = {};
        }

        // Process each antibiotic
        antibioticColumns.forEach(antibiotic => {
          antibiotics.add(antibiotic);
          
          // Initialize antibiotic entry if not exists
          if (!heatmapCounts[organism][antibiotic]) {
            heatmapCounts[organism][antibiotic] = { resistant: 0, total: 0 };
          }

          const zoneSize = row[antibiotic];
          if (zoneSize !== undefined && zoneSize !== null && zoneSize !== '') {
            heatmapCounts[organism][antibiotic].total += 1;
            if (isResistant(zoneSize, antibiotic)) {
              heatmapCounts[organism][antibiotic].resistant += 1;
            }
          }
        });
      }
    });

    // Calculate resistance percentages
    organisms.forEach(organism => {
      antibiotics.forEach(antibiotic => {
        const counts = heatmapCounts[organism]?.[antibiotic];
        if (counts && counts.total >= 30) { // Only include pairs with n≥30
          const percentage = counts.total > 0 ? (counts.resistant / counts.total) * 100 : 0;
          heatmapData[organism][antibiotic] = Math.round(percentage);
        } else {
          heatmapData[organism][antibiotic] = -1; // Mark as insufficient data
        }
      });
    });

    const result: HeatmapData = {
      organisms: Array.from(organisms),
      antibiotics: Array.from(antibiotics),
      heatmapData,
      heatmapCounts,
      totalRecords: rows.length,
      dataSource: 'AMR_HH',
      tableName: 'AMR Human Health',
      timestamp: new Date().toISOString(),
      appliedFilters: activeFilters.map(f => [f.type, f.value])
    };

    console.log('Heatmap data calculated:', {
      organisms: result.organisms.length,
      antibiotics: result.antibiotics.length,
      totalRecords: result.totalRecords
    });

    return result;
  };

  // Fetch all data from local API endpoint
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching all AMR data from local API for Heatmap...');
      const response = await fetch('http://localhost:5001/v1/amr-health-v2', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiData = await response.json();
      console.log('Full API response received for Heatmap:', apiData);

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
      
      // Process heatmap data from filtered rows
      const processedData = calculateHeatmapData(filteredRows);
      setHeatmapData(processedData);
      
    } catch (error) {
      console.error('Error fetching AMR data from local API for Heatmap:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setHeatmapData(null);
    } finally {
      setLoading(false);
    }
  };

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
      'YEAR_SPEC': 'Year Specimen',
      'X_REGION': 'Region'
    };

    // Load filter options when data is available
    if (heatmapData) {
      Object.entries(configMapping).forEach(([key, label]) => {
        configs[key.toLowerCase()] = {
          label,
          options: [] // Would need raw data to populate this
        };
      });
    }

    return configs;
  }, [heatmapData]);

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchAllData();
  }, [activeFilters]);

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
          
          // Avoid duplicate filters
          const isDuplicate = activeFilters.some(
            filter => filter.type === newFilter.type && filter.value === newFilter.value
          );
          
          if (!isDuplicate) {
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

  // Get organisms and antibiotics from real data
  const organisms = useMemo(() => {
    if (!heatmapData) return [];
    const allOrganisms = heatmapData.organisms.sort();
    const filtered = filterOrganismsByType(allOrganisms, selectedOrganismType);
    return filtered;
  }, [heatmapData, selectedOrganismType]);

  const antibiotics = useMemo(() => {
    if (!heatmapData) return [];
    return heatmapData.antibiotics.sort();
  }, [heatmapData]);

  // Get current organism type category info
  const currentCategory = useMemo(() => {
    return organismTypeConfig[selectedOrganismType] || organismTypeConfig.indicator;
  }, [selectedOrganismType]);

  // Get total records count for current view
  const totalRecords = useMemo(() => {
    return heatmapData?.totalRecords || 0;
  }, [heatmapData]);

  // Process data for summary statistics
  const filteredData = useMemo(() => {
    if (!heatmapData) return [];
    
    const dataList: Array<{organism: string, antibiotic: string, percentage: number}> = [];
    
    organisms.forEach(organism => {
      antibiotics.forEach(antibiotic => {
        const percentage = heatmapData.heatmapData[organism]?.[antibiotic];
        if (percentage !== undefined && percentage !== -1) {
          dataList.push({ organism, antibiotic, percentage });
        }
      });
    });
    
    return dataList;
  }, [heatmapData, organisms, antibiotics]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-medium">Pathogen-Antibiotic Resistance Heatmap for</span>
            
            {/* Inline Organism Category Dropdown */}
            <Popover open={organismTypeOpen} onOpenChange={setOrganismTypeOpen}>
              <PopoverTrigger asChild>
                <button
                  role="combobox"
                  aria-expanded={organismTypeOpen}
                  className="inline-flex items-center gap-1 text-lg font-medium text-primary hover:text-blue-600 cursor-pointer transition-colors focus:outline-none focus:underline"
                >
                  <span className="text-[rgb(32,102,118)] not-italic">
                    {organismCategoryOptions.find(opt => opt.value === selectedOrganismType)?.label || 'WHONET Priority Pathogens'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search organism category..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      {organismCategoryOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => {
                            setSelectedOrganismType(option.value);
                            setOrganismTypeOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedOrganismType === option.value ? "opacity-100" : "opacity-0"
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
              onClick={() => setShowTable(!showTable)}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => console.log('Download heatmap data')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 m-[0px]">
            {currentCategory.description} • 
            {activeFilters.length > 0 ? (
              <span className="font-medium text-blue-600 ml-1"> 
                Filtered ({activeFilters.length} filter{activeFilters.length === 1 ? '' : 's'}): {totalRecords.toLocaleString()} records
              </span>
            ) : (
              <span className="text-gray-700 ml-1"> Total: {totalRecords.toLocaleString()} records</span>
            )}

            {loading && (
              <span className="ml-2 text-gray-500 italic">
                (Updating...)
              </span>
            )}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filter Controls */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Resistance Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={typeOpen}
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
                              setTypeOpen(false);
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
              <Popover open={valueOpen} onOpenChange={setValueOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={valueOpen}
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
                              setValueOpen(false);
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

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="mb-[20px] w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({activeFilters.length})
              </span>
              <button
                onClick={filterHelpers.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => filterHelpers.removeFilter(index)}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color-Coded Risk Level Legend */}
        <div className="flex items-center gap-8 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16a34a' }}></div>
            <span className="text-sm text-[13px]">Low Resistance Risk (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
            <span className="text-sm text-[13px]">Moderate Resistance Risk (20-39%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
            <span className="text-sm text-[13px]">High Resistance Risk (≥40%)</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading resistance data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-12 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <span className="ml-2 text-red-700">Error loading data: {error}</span>
          </div>
        )}

        {/* Heatmap or Table View */}
        {!loading && !error && heatmapData && organisms.length > 0 && antibiotics.length > 0 && (
          <>
            {showTable ? (
              /* Table View */
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="min-w-[150px]">Antibiotic</TableHead>
                      <TableHead className="min-w-[150px]">Organism</TableHead>
                      <TableHead className="w-32 text-right">Resistance %</TableHead>
                      <TableHead className="w-32 text-right">Resistant</TableHead>
                      <TableHead className="w-32 text-right">Total Tested</TableHead>
                      <TableHead className="w-24">Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const tableData: Array<{
                        antibiotic: string;
                        organism: string;
                        percentage: number;
                        resistant: number;
                        total: number;
                      }> = [];
                      
                      antibiotics.forEach(antibiotic => {
                        organisms.forEach(organism => {
                          // Skip ESBL-excluded pairs
                          if (shouldHideESBLPair(organism, antibiotic)) {
                            return;
                          }
                          
                          const percentage = heatmapData?.heatmapData?.[organism]?.[antibiotic];
                          const counts = heatmapData?.heatmapCounts?.[organism]?.[antibiotic];
                          if (percentage !== undefined && percentage !== -1 && counts) {
                            tableData.push({
                              antibiotic,
                              organism,
                              percentage,
                              resistant: counts.resistant,
                              total: counts.total
                            });
                          }
                        });
                      });
                      
                      // Sort by resistance percentage descending
                      tableData.sort((a, b) => b.percentage - a.percentage);
                      
                      return tableData.length > 0 ? tableData.map((row, index) => {
                        const riskLevel = row.percentage >= 40 ? 'High' : row.percentage >= 20 ? 'Moderate' : 'Low';
                        const riskColor = row.percentage >= 40 ? 'text-red-600 bg-red-50' : row.percentage >= 20 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50';
                        
                        return (
                          <TableRow key={`${row.organism}-${row.antibiotic}`}>
                            <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                            <TableCell className="font-medium">{getAntibioticName(row.antibiotic)}</TableCell>
                            <TableCell className="italic">{getOrganismName(row.organism)}</TableCell>
                            <TableCell className="text-right font-semibold">{row.percentage}%</TableCell>
                            <TableCell className="text-right">{row.resistant.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{row.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${riskColor}`}>
                                {riskLevel}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No resistance data available
                          </TableCell>
                        </TableRow>
                      );
                    })()}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Heatmap View */
              <div className="border rounded-lg overflow-hidden">
                {/* Header row with organisms */}
                <div className="flex bg-gray-50 border-b">
                  <div className="w-48 font-semibold text-sm border-r py-[0px] px-[12px] flex items-center text-[13px]">Antibiotic / Organism</div>
                  <div className="flex flex-1">
                    {organisms.map((organism, index) => {
                      const displayName = getOrganismName(organism);

                      return (
                        <div
                          key={organism}
                          className={`flex-1 h-16 flex items-center justify-center relative px-1 ${
                            index < organisms.length - 1 ? 'border-r' : ''
                          }`}
                        >
                          <span 
                            className="font-medium text-center leading-tight text-[13px] italic"
                            title={`${displayName} (${organism})`}
                          >
                            {displayName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Data rows */}
                {antibiotics.map((antibiotic, rowIndex) => (
                  <div key={antibiotic} className={`flex ${rowIndex < antibiotics.length - 1 ? 'border-b' : ''}`}>
                    <div className="w-48 p-3 text-sm font-medium border-r bg-gray-50 text-[13px]">
                      {getAntibioticName(antibiotic)}
                    </div>
                    <div className="flex flex-1">
                      {organisms.map((organism, colIndex) => {
                        // ESBL filtering: hide inappropriate β-lactam pairs
                        const isESBLExcluded = shouldHideESBLPair(organism, antibiotic);
                        
                        const percentage = heatmapData?.heatmapData?.[organism]?.[antibiotic];
                        const counts = heatmapData?.heatmapCounts?.[organism]?.[antibiotic];
                        const hasData = percentage !== undefined && percentage !== -1;
                        
                        // Apply greyed-out styling for ESBL-excluded pairs
                        const backgroundColor = isESBLExcluded ? '#f9fafb' : (hasData ? getResistanceAlertColor(percentage) : '#f3f4f6');
                        const textColor = isESBLExcluded ? '#9ca3af' : (hasData && percentage >= 40 ? 'white' : 'black');
                        
                        // Create tooltip content
                        const getTooltipContent = () => {
                          const displayName = getOrganismName(organism);
                          const antibioticDisplayName = getAntibioticName(antibiotic);

                          if (isESBLExcluded) {
                            return (
                              <div className="text-sm">
                                <div className="font-medium mb-1"><span className="italic">{displayName}</span> vs {antibioticDisplayName}</div>
                                <div className="text-xs text-gray-500">
                                  Hidden: ESBL phenotype excludes β-lactams
                                </div>
                              </div>
                            );
                          } else if (hasData && counts) {
                            return (
                              <div className="text-sm">
                                <div className="font-medium mb-1"><span className="italic">{displayName}</span> vs {antibioticDisplayName}</div>
                                <div className="text-xs space-y-1">
                                  <div>Resistance Rate: <span className="font-semibold">{percentage}%</span></div>
                                  <div>Resistant Isolates: <span className="font-semibold">{counts.resistant}</span> out of <span className="font-semibold">{counts.total}</span></div>
                                </div>
                              </div>
                            );
                          } else if (counts) {
                            return (
                              <div className="text-sm">
                                <div className="font-medium mb-1"><span className="italic">{displayName}</span> vs {antibioticDisplayName}</div>
                                <div className="text-xs space-y-1">
                                  <div>Insufficient data (N &lt; 30)</div>
                                  <div>Available Isolates: <span className="font-semibold">{counts.total}</span></div>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-sm">
                                <div className="font-medium mb-1"><span className="italic">{displayName}</span> vs {antibioticDisplayName}</div>
                                <div className="text-xs">No data available</div>
                              </div>
                            );
                          }
                        };
                        
                        return (
                          <Tooltip key={`${antibiotic}-${organism}`}>
                            <TooltipTrigger asChild>
                              <div
                                className={`flex-1 h-10 flex items-center justify-center text-xs cursor-help ${
                                  colIndex < organisms.length - 1 ? 'border-r' : ''
                                }`}
                                style={{ 
                                  backgroundColor, 
                                  color: textColor
                                }}
                              >
                                {isESBLExcluded ? (
                                  <span className="text-gray-400">—</span>
                                ) : hasData ? (
                                  <span className="font-semibold">{percentage}%</span>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {getTooltipContent()}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        {!loading && !error && heatmapData && (
          <div className="pt-4 border-t border-gray-200 m-[0px]">
            <p className="text-xs text-gray-500">
              Pathogen-antibiotic resistance surveillance heatmap • Clinical isolate resistance patterns across drug-bug combinations
              {activeFilters.length > 0 && ` • Filtered view showing ${filteredData.length} combinations`}
              {activeFilters.length === 0 && ` • Showing all combinations from ${heatmapData.totalRecords} records`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};