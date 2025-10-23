import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Download, ChevronDown, Check } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from './ui/utils';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// 12 Priority pathogen-antibiotic combinations
const pathogenAntibioticPairs = [
  { organism: 'Acinetobacter baumannii', antibiotic: 'Carbapenems', formula: 'A_BAUMANNII_CARBAPENEMS' },
  { organism: 'Escherichia coli', antibiotic: '3G Cephalosporins', formula: 'E_COLI_3G_CEPHALOSPORINS' },
  { organism: 'Escherichia coli', antibiotic: 'Carbapenems', formula: 'E_COLI_CARBAPENEMS' },
  { organism: 'Enterococci', antibiotic: 'Vancomycin', formula: 'ENTEROCOCCI_VANCOMYCIN' },
  { organism: 'Klebsiella pneumoniae', antibiotic: '3G Cephalosporins', formula: 'K_PNEUMONIAE_3G_CEPHALOSPORINS' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Aminoglycosides', formula: 'K_PNEUMONIAE_AMINOGLYCOSIDES' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Carbapenems', formula: 'K_PNEUMONIAE_CARBAPENEMS' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Fluoroquinolones', formula: 'K_PNEUMONIAE_FLUOROQUINOLONES' },
  { organism: 'Pseudomonas aeruginosa', antibiotic: 'Carbapenems', formula: 'P_AERUGINOSA_CARBAPENEMS' },
  { organism: 'Staphylococcus aureus', antibiotic: 'Methicillin', formula: 'S_AUREUS_METHICILLIN' },
  { organism: 'Streptococcus pneumoniae', antibiotic: '3G Cephalosporins', formula: 'S_PNEUMONIAE_3G_CEPHALOSPORINS' },
  { organism: 'Streptococcus pneumoniae', antibiotic: 'Penicillin', formula: 'S_PNEUMONIAE_PENICILLIN' }
];

// Standardized filter options - matching MDR_Incidence_Demographics (8 demographic/institutional filters)
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

// Get resistance alert color based on percentage
const getResistanceAlertColor = (percentage: number): string => {
  if (percentage < 20) return '#16a34a'; // Green
  if (percentage < 40) return '#eab308'; // Yellow
  return '#dc2626'; // Red
};

// Format organism name according to scientific convention
const formatOrganismName = (organism: string): string => {
  const abbreviations: { [key: string]: string } = {
    'Acinetobacter baumannii': 'A. baumannii',
    'Escherichia coli': 'E. coli',
    'Enterococci': 'Enterococci',
    'Klebsiella pneumoniae': 'K. pneumoniae',
    'Pseudomonas aeruginosa': 'P. aeruginosa',
    'Staphylococcus aureus': 'S. aureus',
    'Streptococcus pneumoniae': 'S. pneumoniae'
  };
  return abbreviations[organism] || organism;
};

// Trend analysis helper
const analyzeTrend = (trendData: any[]) => {
  if (trendData.length < 2) {
    return { direction: 'stable', color: '#6b7280' };
  }

  const validData = trendData.filter(d => d.resistance !== null && d.resistance !== undefined);
  if (validData.length < 2) {
    return { direction: 'stable', color: '#6b7280' };
  }

  const firstValue = validData[0].resistance;
  const lastValue = validData[validData.length - 1].resistance;
  const change = lastValue - firstValue;

  if (Math.abs(change) < 5) { // Less than 5% change is considered stable
    return { direction: 'stable', color: '#6b7280' };
  } else if (change > 0) {
    return { direction: 'increasing', color: '#dc2626' };
  } else {
    return { direction: 'decreasing', color: '#16a34a' };
  }
};

// Filter interface
interface Filter {
  type: string;
  value: string;
  label: string;
}

interface FilterValueOption {
  value: string;
  label: string;
}

interface TrendDataPoint {
  year: number;
  resistance: number;
  specimens: number;
  total_tested: number;
}

interface SparklineCombo {
  organism: string;
  antibiotic: string;
  formula: string;
  currentResistance: number;
  trends: TrendDataPoint[];
  trendInfo: {
    direction: 'increasing' | 'decreasing' | 'stable';
    color: string;
  };
}

export function AMR_Human_Sparkline2() {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sparklineData, setSparklineData] = useState<SparklineCombo[]>([]);

  // Dynamic filter value management
  const [filterValueCache, setFilterValueCache] = useState<Record<string, FilterValueOption[]>>({});
  const [loadingFilterValues, setLoadingFilterValues] = useState<Record<string, boolean>>({});
  const [filterValueErrors, setFilterValueErrors] = useState<Record<string, string>>({});

  // Fetch unique values for a specific column from AMR_HH table
  const fetchFilterValues = async (columnName: string) => {
    if (filterValueCache[columnName]) {
      return filterValueCache[columnName];
    }

    try {
      setLoadingFilterValues(prev => ({ ...prev, [columnName]: true }));
      setFilterValueErrors(prev => ({ ...prev, [columnName]: '' }));

      console.log(`Fetching unique values for AMR_HH column: ${columnName}`);
      
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d`;
      const response = await fetch(`${baseUrl}/amr-filter-values?column=${columnName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        // Sort values alphabetically and create options
        const sortedValues = (data.values || []).sort((a: string, b: string) => {
          // Handle null/empty values
          if (!a && !b) return 0;
          if (!a) return 1;
          if (!b) return -1;
          return a.toString().localeCompare(b.toString());
        });

        const options: FilterValueOption[] = sortedValues.map((value: any) => ({
          value: value?.toString() || 'null',
          label: value?.toString() || '(Empty/Null)'
        }));

        // Cache the results
        setFilterValueCache(prev => ({ ...prev, [columnName]: options }));
        
        return options;
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error(`Error fetching filter values for ${columnName}:`, err);
      const errorMessage = err.message || 'Failed to fetch filter values';
      setFilterValueErrors(prev => ({ ...prev, [columnName]: errorMessage }));
      return [];
    } finally {
      setLoadingFilterValues(prev => ({ ...prev, [columnName]: false }));
    }
  };

  const getFilterValueOptionsForType = (type: string) => {
    return filterValueCache[type] || [];
  };

  // Load filter values when filter type changes
  useEffect(() => {
    if (filterType && !filterValueCache[filterType] && !loadingFilterValues[filterType]) {
      fetchFilterValues(filterType);
    }
  }, [filterType]);

  // Load all filter options on mount (matching MDR_Incidence_Demographics pattern)
  useEffect(() => {
    const loadAllFilterOptions = async () => {
      console.log('Loading all filter options on mount...');
      const filterColumns = ['SEX', 'AGE_CAT', 'PAT_TYPE', 'INSTITUTION', 'DEPARTMENT', 'WARD_TYPE', 'YEAR_SPEC', 'X_REGION'];
      
      // Load all filter options in parallel
      const loadPromises = filterColumns.map(column => fetchFilterValues(column));
      await Promise.all(loadPromises);
      
      console.log('All filter options loaded');
    };

    loadAllFilterOptions();
  }, []);

  // Calculate resistance percentage using the formula: (ORGANISM = code AND resistance_column = 'R') / (ORGANISM = code)
  const calculateResistancePercentage = (data: any[], organismCodes: string | string[], resistanceColumn: string): number => {
    // Handle both single organism code and multiple organism codes (for Enterococci)
    const codes = Array.isArray(organismCodes) ? organismCodes : [organismCodes];
    
    const totalCases = data.filter(record => codes.includes(record.ORGANISM)).length;
    const resistantCases = data.filter(record => 
      codes.includes(record.ORGANISM) && record[resistanceColumn] === 'R'
    ).length;
    
    if (totalCases === 0) return 0;
    return (resistantCases / totalCases) * 100;
  };

  // Map pathogen-antibiotic pairs to their organism codes and resistance columns
  // This function now tries both new and old column names for backward compatibility
  const getOrganismCodeAndColumn = (formula: string, availableColumns: string[] = []): { organismCode: string | string[]; resistanceColumn: string } => {
    const mappingOptions = {
      'A_BAUMANNII_CARBAPENEMS': { 
        organismCode: 'ac-', 
        resistanceColumn: availableColumns.includes('G_CARB_AC') ? 'G_CARB_AC' : 'G_CARB_AC' 
      },
      'E_COLI_3G_CEPHALOSPORINS': { 
        organismCode: 'eco', 
        resistanceColumn: availableColumns.includes('G_3GC_ECO') ? 'G_3GC_ECO' : 'G_3GC_EC' 
      },
      'E_COLI_CARBAPENEMS': { 
        organismCode: 'eco', 
        resistanceColumn: availableColumns.includes('G_CARB_ECO') ? 'G_CARB_ECO' : 'G_CARB_EC' 
      },
      'ENTEROCOCCI_VANCOMYCIN': { 
        organismCode: ['ent', 'efa', 'efm'], 
        resistanceColumn: availableColumns.includes('G_VAN_ENT') ? 'G_VAN_ENT' : 'G_VAN_EF' 
      },
      'K_PNEUMONIAE_3G_CEPHALOSPORINS': { 
        organismCode: 'kpn', 
        resistanceColumn: availableColumns.includes('G_3GC_KPN') ? 'G_3GC_KPN' : 'G_3GC_KP' 
      },
      'K_PNEUMONIAE_AMINOGLYCOSIDES': { 
        organismCode: 'kpn', 
        resistanceColumn: availableColumns.includes('G_AG_KPN') ? 'G_AG_KPN' : 'G_AMG_KP' 
      },
      'K_PNEUMONIAE_CARBAPENEMS': { 
        organismCode: 'kpn', 
        resistanceColumn: availableColumns.includes('G_CARB_KPN') ? 'G_CARB_KPN' : 'G_CARB_KP' 
      },
      'K_PNEUMONIAE_FLUOROQUINOLONES': { 
        organismCode: 'kpn', 
        resistanceColumn: availableColumns.includes('G_FQ_KPN') ? 'G_FQ_KPN' : 'G_FQ_KP' 
      },
      'P_AERUGINOSA_CARBAPENEMS': { 
        organismCode: 'pae', 
        resistanceColumn: availableColumns.includes('G_CARB_PAE') ? 'G_CARB_PAE' : 'G_CARB_PA' 
      },
      'S_AUREUS_METHICILLIN': { 
        organismCode: 'sau', 
        resistanceColumn: availableColumns.includes('G_METH_SAU') ? 'G_METH_SAU' : 'G_METH_SA' 
      },
      'S_PNEUMONIAE_3G_CEPHALOSPORINS': { 
        organismCode: 'spn', 
        resistanceColumn: availableColumns.includes('G_3GC_SPN') ? 'G_3GC_SPN' : 'G_3GC_SP' 
      },
      'S_PNEUMONIAE_PENICILLIN': { 
        organismCode: 'spn', 
        resistanceColumn: availableColumns.includes('G_PEN_SPN') ? 'G_PEN_SPN' : 'G_PEN_SP' 
      }
    };
    
    return mappingOptions[formula] || { organismCode: '', resistanceColumn: '' };
  };

  // Fetch trend data for all pathogen-antibiotic combinations with year-based endpoints
  const fetchTrendData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching sparkline data for all pathogen-antibiotic combinations...');

      // Build filter query parameters
      const filterParams = new URLSearchParams();
      activeFilters.forEach(filter => {
        filterParams.append(filter.type, filter.value);
      });

      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d`;
      
      // Define endpoint mappings for each pathogen-antibiotic combination
      const endpointMappings = {
        'A_BAUMANNII_CARBAPENEMS': 'amr-abaumannii-carbapenems-by-year',
        'E_COLI_3G_CEPHALOSPORINS': 'amr-ecoli-3gcephalosporins-by-year',
        'E_COLI_CARBAPENEMS': 'amr-ecoli-carbapenems-by-year',
        'ENTEROCOCCI_VANCOMYCIN': 'amr-enterococci-vancomycin-by-year',
        'K_PNEUMONIAE_3G_CEPHALOSPORINS': 'amr-kpneumoniae-3gcephalosporins-by-year',
        'K_PNEUMONIAE_AMINOGLYCOSIDES': 'amr-kpneumoniae-aminoglycosides-by-year',
        'K_PNEUMONIAE_CARBAPENEMS': 'amr-kpneumoniae-carbapenems-by-year',
        'K_PNEUMONIAE_FLUOROQUINOLONES': 'amr-kpneumoniae-fluoroquinolones-by-year',
        'P_AERUGINOSA_CARBAPENEMS': 'amr-paeruginosa-carbapenems-by-year',
        'S_AUREUS_METHICILLIN': 'amr-saureus-methicillin-by-year',
        'S_PNEUMONIAE_3G_CEPHALOSPORINS': 'amr-spneumoniae-3gcephalosporins-by-year',
        'S_PNEUMONIAE_PENICILLIN': 'amr-spneumoniae-penicillin-by-year'
      };

      // Fetch data for all implemented combinations in parallel
      const sparklinePromises = pathogenAntibioticPairs.map(async (pair) => {
        const endpoint = endpointMappings[pair.formula];
        
        if (!endpoint) {
          // This should not happen since all 11 combinations now have endpoints
          console.warn(`No endpoint mapping found for ${pair.formula}! This combination may need implementation.`);
          return {
            organism: pair.organism,
            antibiotic: pair.antibiotic,
            formula: pair.formula,
            currentResistance: 0,
            trends: [],
            trendInfo: { direction: 'stable', color: '#6b7280' }
          };
        }

        try {
          const url = `${baseUrl}/${endpoint}?${filterParams.toString()}`;
          console.log(`Fetching ${pair.organism} vs ${pair.antibiotic} from: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch ${pair.formula}:`, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log(`${pair.organism} vs ${pair.antibiotic} data received:`, {
            currentResistance: data.currentResistance,
            yearDataPoints: data.yearData?.length || 0
          });
          
          // Process data into sparkline format
          const sparklineCombo: SparklineCombo = {
            organism: pair.organism,
            antibiotic: pair.antibiotic,
            formula: pair.formula,
            currentResistance: data.currentResistance || 0,
            trends: data.yearData || [],
            trendInfo: analyzeTrend(data.yearData || [])
          };

          return sparklineCombo;
          
        } catch (error) {
          console.error(`Error fetching ${pair.formula}:`, error);
          // Return placeholder on error
          return {
            organism: pair.organism,
            antibiotic: pair.antibiotic,
            formula: pair.formula,
            currentResistance: 0,
            trends: [],
            trendInfo: { direction: 'stable', color: '#6b7280' }
          };
        }
      });

      // Wait for all requests to complete
      const sparklineResults = await Promise.all(sparklinePromises);
      
      // Log summary of results
      const implementedCount = sparklineResults.filter(combo => combo.trends.length > 0).length;
      const placeholderCount = sparklineResults.filter(combo => combo.trends.length === 0).length;
      
      console.log('Sparkline data processing complete:', {
        totalCombinations: sparklineResults.length,
        implementedWithData: implementedCount,
        placeholders: placeholderCount,
        implementedFormulas: sparklineResults
          .filter(combo => combo.trends.length > 0)
          .map(combo => combo.formula)
      });
      
      setSparklineData(sparklineResults);
      
    } catch (error) {
      console.error('Error fetching sparkline trend data:', error);
      // Set empty data on error
      setSparklineData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchTrendData();
  }, [activeFilters]);

  // Filter helper functions
  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeOption = filterTypeOptions.find(opt => opt.value === filterType);
        const valueOption = getFilterValueOptionsForType(filterType).find(opt => opt.value === filterValue);
        
        if (typeOption && valueOption) {
          const newFilter: Filter = {
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
        
        // Reset form
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-[16px]">Resistance Trends for Priority Pathogen-Antibiotic Combinations</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log('Download sparkline data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px] text-[13px]">
          Resistance percentage trends over time for priority pathogen-antibiotic combinations • Surveillance monitoring
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
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

        {/* Filter Controls */}
        <div className="mb-6 bg-gray-50 rounded-lg border px-[16px] py-[10px]">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm text-[13px]">Filter Resistance Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={typeOpen}
                    className="w-full justify-between text-sm h-10 text-[13px] px-[12px] py-[5px]"
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
                    className="w-full justify-between text-sm h-10 text-[13px] px-[12px] py-[5px]"
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
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap text-[13px]"
            >
              Add Filter
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500">Loading resistance trend data...</div>
          </div>
        )}

        {/* Sparkline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sparklineData.map((combo, index) => (
            <div key={index} className="border rounded-lg p-3 bg-white hover:shadow-md transition-shadow relative">
              {/* Resistance Percentage - Upper Right Corner */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <span 
                  className="text-lg font-bold"
                  style={{ color: getResistanceAlertColor(combo.currentResistance) }}
                >
                  {combo.currentResistance}%
                </span>
                <div 
                  className="text-xs font-medium"
                  style={{ color: combo.trendInfo.color }}
                >
                  {combo.trendInfo.direction === 'increasing' && '↗'}
                  {combo.trendInfo.direction === 'decreasing' && '↘'}
                  {combo.trendInfo.direction === 'stable' && '→'}
                </div>
              </div>

              {/* Header - Optimized for More Space */}
              <div className="mb-2 pr-16">
                <div className="text-sm font-medium text-gray-900 mb-1 text-[13px]">
                  <em>{formatOrganismName(combo.organism)}</em>
                </div>
                <div className="text-xs text-gray-600">
                  vs {combo.antibiotic}
                </div>
              </div>

              {/* R% Time Series - Resistance Rate over YEAR_SPEC - Expanded Height */}
              <div className="h-20 w-full relative">
                <div className="absolute -left-1 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400">
                  <span>100</span>
                  <span>50</span>
                  <span>0</span>
                </div>
                <div className="ml-6 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={[...combo.trends].sort((a, b) => a.year - b.year)}
                      margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                    >
                      <XAxis 
                        dataKey="year"
                        type="number"
                        scale="linear"
                        domain={['dataMin', 'dataMax']}
                        hide
                      />
                      <YAxis 
                        domain={[0, 100]}
                        hide
                      />
                      <Line 
                        type="monotone" 
                        dataKey="resistance" 
                        stroke={combo.trendInfo.color}
                        strokeWidth={2.5}
                        dot={(props) => {
                          const { payload, cx, cy, index } = props;
                          const specimenCount = payload?.total_tested || payload?.specimens || 0;
                          const isLowSample = specimenCount < 30;
                          const resistanceValue = payload?.resistance || 0;
                          
                          return (
                            <circle
                              key={`dot-${combo.organism}-${combo.antibiotic}-${index}`}
                              cx={cx}
                              cy={cy}
                              r={2}
                              fill={isLowSample ? '#9ca3af' : getResistanceAlertColor(resistanceValue)}
                              stroke={isLowSample ? '#6b7280' : getResistanceAlertColor(resistanceValue)}
                              strokeWidth={0.8}
                              style={{ opacity: isLowSample ? 0.6 : 1 }}
                            />
                          );
                        }}
                        activeDot={(props) => {
                          const { payload, cx, cy, index } = props;
                          const specimenCount = payload?.total_tested || payload?.specimens || 0;
                          const isLowSample = specimenCount < 30;
                          const resistanceValue = payload?.resistance || 0;
                          
                          return (
                            <circle
                              key={`active-dot-${combo.organism}-${combo.antibiotic}-${index}`}
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill={isLowSample ? '#9ca3af' : getResistanceAlertColor(resistanceValue)}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          );
                        }}
                        connectNulls={false}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const specimenCount = data?.total_tested || data?.specimens || 0;
                            const resistantCount = data?.resistant_count || data?.resistant || 0;
                            const resistance = data?.resistance || 0;
                            const year = data?.year || label;
                            
                            return (
                              <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm">
                                <div className="font-medium text-gray-900 mb-1">
                                  {year}
                                </div>
                                <div className="space-y-1">
                                  <div style={{ color: getResistanceAlertColor(resistance) }}>
                                    <span className="font-medium">{resistance.toFixed(1)}%</span> resistance
                                  </div>
                                  <div className="text-gray-600 text-xs">
                                    {resistantCount}/{specimenCount} isolates
                                  </div>
                                  {specimenCount < 30 && (
                                    <div className="text-amber-600 text-xs">
                                      ⚠ Low sample size
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '3 3' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time Axis - YEAR_SPEC Range */}
              <div className="flex justify-between text-xs text-gray-500 mt-1 ml-6">
                <span>{combo.trends[0]?.year}</span>
                <span className="text-center flex-1 text-gray-400 text-[11px]">R% by YEAR_SPEC</span>
                <span>{combo.trends[combo.trends.length - 1]?.year}</span>
              </div>
              
              {/* Data Points Summary */}

            </div>
          ))}
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-[0px]">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-700">
              {sparklineData.filter(combo => combo.trendInfo.direction === 'increasing').length}
            </div>
            <div className="text-sm text-red-600">Increasing resistance trends</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">
              {sparklineData.filter(combo => combo.trendInfo.direction === 'decreasing').length}
            </div>
            <div className="text-sm text-green-600">Decreasing resistance trends</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">
              {sparklineData.filter(combo => combo.trendInfo.direction === 'stable').length}
            </div>
            <div className="text-sm text-gray-600">Stable resistance trends</div>
          </div>
        </div>

        {/* Color-Coded Risk Level Legend */}
        <div className="flex items-center gap-8 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16a34a' }}></div>
            <span className="text-sm">Low Resistance (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
            <span className="text-sm">Moderate Resistance (20-39%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
            <span className="text-sm">High Resistance (≥40%)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-[0px] border-t border-gray-200 m-[0px]">
          <p className="text-xs text-gray-500 px-[0px] py-[5px]">
            Priority pathogen-antibiotic resistance trend monitoring • Five-year surveillance data showing resistance percentage changes over time
          </p>
        </div>
      </CardContent>
    </Card>
  );
}