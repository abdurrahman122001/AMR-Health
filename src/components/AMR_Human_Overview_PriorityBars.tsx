import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, LabelList } from 'recharts';
import { Download, ChevronDown, Check } from 'lucide-react';  
import { cn } from './ui/utils';
import { LowSampleLabel } from './LowSampleLabel';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Priority pathogen-antibiotic combinations resistance data
// These will be calculated from AMR_HH table with specific formulas to be provided
const resistanceData = [
  { organism: 'Acinetobacter baumannii', antibiotic: 'Carbapenems', rate: 0, resistant: 0, total: 0, formula: 'A_BAUMANNII_CARBAPENEMS' },
  { organism: 'Escherichia coli', antibiotic: '3G Cephalosporins', rate: 0, resistant: 0, total: 0, formula: 'E_COLI_3G_CEPHALOSPORINS' },
  { organism: 'Escherichia coli', antibiotic: 'Carbapenems', rate: 0, resistant: 0, total: 0, formula: 'E_COLI_CARBAPENEMS' },
  { organism: 'Enterococci', antibiotic: 'Vancomycin', rate: 0, resistant: 0, total: 0, formula: 'ENTEROCOCCI_VANCOMYCIN' },
  { organism: 'Klebsiella pneumoniae', antibiotic: '3G Cephalosporins', rate: 0, resistant: 0, total: 0, formula: 'K_PNEUMONIAE_3G_CEPHALOSPORINS' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Aminoglycosides', rate: 0, resistant: 0, total: 0, formula: 'K_PNEUMONIAE_AMINOGLYCOSIDES' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Carbapenems', rate: 0, resistant: 0, total: 0, formula: 'K_PNEUMONIAE_CARBAPENEMS' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Fluoroquinolones', rate: 0, resistant: 0, total: 0, formula: 'K_PNEUMONIAE_FLUOROQUINOLONES' },
  { organism: 'Pseudomonas aeruginosa', antibiotic: 'Carbapenems', rate: 0, resistant: 0, total: 0, formula: 'P_AERUGINOSA_CARBAPENEMS' },
  { organism: 'Staphylococcus aureus', antibiotic: 'Methicillin', rate: 0, resistant: 0, total: 0, formula: 'S_AUREUS_METHICILLIN' },
  { organism: 'Streptococcus pneumoniae', antibiotic: '3G Cephalosporins', rate: 0, resistant: 0, total: 0, formula: 'S_PNEUMONIAE_3G_CEPHALOSPORINS' },
  { organism: 'Streptococcus pneumoniae', antibiotic: 'Penicillin', rate: 0, resistant: 0, total: 0, formula: 'S_PNEUMONIAE_PENICILLIN' }
];

// Standardized filter options - matching AMR_Human_Sparkline2 (8 demographic/institutional filters)
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
    'Acinetobacter baumannii': 'A. Baumannii',
    'Escherichia coli': 'E. Coli',
    'Enterococci': 'Enterococci',
    'Klebsiella pneumoniae': 'K. Pneumoniae',
    'Pseudomonas aeruginosa': 'P. Aeruginosa',
    'Staphylococcus aureus': 'S. Aureus',
    'Streptococcus pneumoniae': 'S. Pneumoniae'
  };
  return abbreviations[organism] || organism;
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

export function AMR_Human_Overview_PriorityBars() {
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [typeOpen, setTypeOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [realResistanceData, setRealResistanceData] = useState<{
    A_BAUMANNII_CARBAPENEMS?: any;
    E_COLI_3G_CEPHALOSPORINS?: any;
    E_COLI_CARBAPENEMS?: any;
    ENTEROCOCCI_VANCOMYCIN?: any;
    K_PNEUMONIAE_3G_CEPHALOSPORINS?: any;
    K_PNEUMONIAE_AMINOGLYCOSIDES?: any;
    K_PNEUMONIAE_CARBAPENEMS?: any;
    K_PNEUMONIAE_FLUOROQUINOLONES?: any;
    P_AERUGINOSA_CARBAPENEMS?: any;
    S_AUREUS_METHICILLIN?: any;
    S_PNEUMONIAE_3G_CEPHALOSPORINS?: any;
    S_PNEUMONIAE_PENICILLIN?: any;
  }>({});

  // Dynamic filter value management - matching AMR_Human_Sparkline2
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
    } catch (err: any) {
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

  // Load all filter options on mount (matching AMR_Human_Sparkline2 pattern)
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

  // Fetch multiple resistance data from server
  const fetchResistanceData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching AMR resistance data...');
      
      // Build filter query parameters - filters already use correct column names (SEX, AGE_CAT, etc.)
      const filterParams = new URLSearchParams();
      activeFilters.forEach(filter => {
        // Filter type is already the column name (SEX, AGE_CAT, etc.)
        const filterValue = String(filter.value).trim();
        if (filterValue && filterValue !== '') {
          filterParams.append(filter.type, filterValue);
        }
      });
      
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d`;
      const endpoints = [
        { 
          formula: 'A_BAUMANNII_CARBAPENEMS', 
          url: `${baseUrl}/amr-abaumannii-carbapenems-resistance?${filterParams.toString()}` 
        },
        { 
          formula: 'E_COLI_3G_CEPHALOSPORINS', 
          url: `${baseUrl}/amr-ecoli-3gc-resistance?${filterParams.toString()}` 
        },
        { 
          formula: 'E_COLI_CARBAPENEMS', 
          url: `${baseUrl}/amr-ecoli-carbapenems-resistance?${filterParams.toString()}` 
        },
        { 
          formula: 'ENTEROCOCCI_VANCOMYCIN', 
          url: `${baseUrl}/amr-enterococci-vancomycin-resistance?${filterParams.toString()}` 
        },
        { 
          formula: 'K_PNEUMONIAE_3G_CEPHALOSPORINS', 
          url: `${baseUrl}/amr-kpneumoniae-3gc-resistance?${filterParams.toString()}` 
        },
        { 
          formula: 'K_PNEUMONIAE_AMINOGLYCOSIDES', 
          url: `${baseUrl}/amr-kpneumoniae-aminoglycosides-resistance?${filterParams.toString()}` 
        },
        { 
          formula: 'K_PNEUMONIAE_CARBAPENEMS', 
          url: `${baseUrl}/amr-kpneumoniae-carbapenems-resistance?${filterParams.toString()}` 
        },
        { 
          formula: 'K_PNEUMONIAE_FLUOROQUINOLONES', 
          url: `${baseUrl}/amr-kpneumoniae-fluoroquinolones-resistance?${filterParams.toString()}` 
        },
        { 
          formula: 'P_AERUGINOSA_CARBAPENEMS', 
          url: `${baseUrl}/amr-paeruginosa-carbapenems-resistance?${filterParams.toString()}` 
        },
        { 
          formula: 'S_AUREUS_METHICILLIN', 
          url: `${baseUrl}/amr-saureus-methicillin-resistance?${filterParams.toString()}` 
        },
        { 
          formula: 'S_PNEUMONIAE_3G_CEPHALOSPORINS', 
          url: `${baseUrl}/amr-spneumoniae-3gc-resistance?${filterParams.toString()}` 
        },
        { 
          formula: 'S_PNEUMONIAE_PENICILLIN', 
          url: `${baseUrl}/amr-spneumoniae-penicillin-resistance?${filterParams.toString()}` 
        }
      ];
      
      // Fetch all endpoints simultaneously
      const fetchPromises = endpoints.map(async ({ formula, url }) => {
        try {
          console.log(`Fetching ${formula} from: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`${formula} resistance data received:`, data);
            return { formula, data };
          } else {
            const errorText = await response.text();
            console.error(`Failed to fetch ${formula} resistance data:`, errorText);
            return { formula, data: null };
          }
        } catch (error) {
          console.error(`Error fetching ${formula} resistance data:`, error);
          return { formula, data: null };
        }
      });
      
      // Wait for all requests to complete
      const results = await Promise.all(fetchPromises);
      
      // Organize results by formula
      const resistanceDataMap: typeof realResistanceData = {};
      results.forEach(({ formula, data }) => {
        if (data) {
          resistanceDataMap[formula as keyof typeof resistanceDataMap] = data;
        }
      });
      
      console.log('All resistance data fetched:', resistanceDataMap);
      setRealResistanceData(resistanceDataMap);
      
    } catch (error) {
      console.error('Error fetching resistance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchResistanceData();
  }, [activeFilters]);

  // Filter helper functions - matching AMR_Human_Sparkline2
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



  // Get resistance profile data for chart
  const getResistanceProfileData = () => {
    // Helper function to check if specific filter values are active
    const hasActiveFilter = (type: string, value: string) => {
      return activeFilters.some(f => f.type === type && f.value === value);
    };

    const currentData = resistanceData.map(item => {
      // Use real data if available for implemented formulas
      const realData = realResistanceData[item.formula as keyof typeof realResistanceData];
      if (realData) {
        return {
          ...item,
          rate: realData.resistanceRate,
          resistant: realData.resistantCount,
          total: realData.totalTested
        };
      }
      
      // Return original data if no real data available
      return item;
    });
    
    const chartData = currentData.map(item => ({
      organism: item.organism,
      antibiotic: item.antibiotic,
      rate: item.rate,
      resistant: item.resistant,
      total: item.total,
      displayName: `${formatOrganismName(item.organism)} vs ${item.antibiotic.replace('3G Cephalosporins', '3GCS')}`,
      color: getResistanceAlertColor(item.rate)
    }));
    
    // Sort by resistance rate in descending order (highest resistance first)
    return chartData.sort((a, b) => b.rate - a.rate);
  };

  // Custom label component for low sample size indicator
  const LowSampleLabel = (props: any) => {
    const { x, y, width, payload, value } = props;
    
    // Debug logging to see what data is available
    if (payload) {
      console.log('LowSampleLabel payload:', payload);
      console.log('LowSampleLabel value:', value);
    }
    
    // Show asterisk if total count is <= 30
    // Check multiple possible locations for the total count
    const total = payload?.total || 
                  payload?.payload?.total || 
                  payload?.data?.total ||
                  payload?.originalData?.total;
    
    // Also check if we can calculate total from resistant/rate
    let calculatedTotal = null;
    if (!total && payload?.resistant && payload?.rate && payload.rate > 0) {
      calculatedTotal = Math.round(payload.resistant / (payload.rate / 100));
    }
    
    const finalTotal = total || calculatedTotal;
    
    if (finalTotal && finalTotal <= 30) {
      return (
        <text
          x={x + width / 2}
          y={y - 8}
          fill="#dc2626"
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
        >
          *
        </text>
      );
    }
    return null;
  };

  // Get currently displayed hospital filter
  const hospitalFilter = activeFilters.find(f => f.type === 'hospital');

  return (
    <Card className="mx-[0px] my-[24px]">
      <CardHeader className="pt-[16px] pr-[24px] pb-[0px] pl-[24px]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-[16px]">Resistance Rates for Priority Pathogen-Antibiotic Combinations</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log('Download Resistance Priority chart data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px] text-[13px]">
          High-risk pathogen-antibiotic combinations (% resistance)
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-[0px] pr-[24px] pb-[24px] pl-[24px]">
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

        {/* Filter Controls - Horizontal Layout matching Sparkline2 */}
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
                    <CommandInput placeholder="Search types..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No type found.</CommandEmpty>
                      <CommandGroup>
                        {getFilterTypeOptions().map((option, index) => (
                          <CommandItem
                            key={`${option.value}-${index}`}
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

        {/* Chart Area - Full Width */}
        <div className="w-full">
          {/* Color-Coded Risk Level Legend */}
          <div className="flex items-center gap-8 mb-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16a34a' }}></div>
                <span className="text-sm text-[11px]">Low Resistance Risk (&lt;20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
                <span className="text-sm text-[11px]">Moderate Resistance Risk (20-39%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
                <span className="text-sm text-[11px]">High Resistance Risk (&ge;40%)</span>
              </div>

            </div>

            {/* Chart Container */}
            <div id="resistance-chart-container" className="h-[350px]">
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading resistance data...</div>
                </div>
              )}
              {!isLoading && (() => {
                // Memoize chart data to prevent recalculation on every render
                const chartData = getResistanceProfileData();
                
                // Pre-calculate cell colors to avoid recalculation in render loop
                const cellColors = chartData.map(entry => {
                  const isSmallSample = entry.total && entry.total <= 30;
                  return isSmallSample ? entry.color + '99' : entry.color;
                });

                // Optimized tooltip content function
                const renderTooltip = ({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  
                  const data = payload[0].payload;
                  const rate = data.rate;
                  const riskLevel = rate < 20 ? 'Low risk' : rate < 40 ? 'Moderate risk' : 'High risk';
                  const riskColor = getResistanceAlertColor(rate);
                  const totalTested = data.total || 600;
                  const resistant = data.resistant || Math.round((rate/100) * totalTested);
                  const isSmallSample = totalTested <= 30;
                  
                  return (
                    <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
                      <p className="font-semibold text-gray-900 mb-1 italic">{formatOrganismName(data.organism)}</p>
                      <p className="text-sm text-gray-600 mb-2">{data.antibiotic}</p>
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold" style={{ color: riskColor }}>{rate}%</span> resistance rate <span style={{ color: riskColor }}>({riskLevel})</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {resistant} resistant / {totalTested} total tested
                      </p>
                      {isSmallSample && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                            <span className="text-orange-500 text-sm">⚠️</span>
                            N &lt; 30 - interpret with caution
                          </p>
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 70 }}
                    >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="displayName" 
                      angle={-30}
                      textAnchor="end"
                      height={10}
                      interval={0}
                      fontSize={10}
                      tick={{ fontSize: 10, fill: '#374151' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Resistance Rate (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#374151', fontSize: '12px' }
                      }}
                      domain={[0, 100]}
                      ticks={[0, 20, 40, 60, 80, 100]}
                      fontSize={10}
                      tick={{ fill: '#374151' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <Tooltip content={renderTooltip} />
                    <Bar 
                      dataKey="rate" 
                      radius={[2, 2, 0, 0]}
                      stroke="none"
                    >
                      {cellColors.map((fillColor, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={fillColor}
                        />
                      ))}
                      <LabelList content={LowSampleLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                );
              })()}
            </div>

        </div>

      </CardContent>
    </Card>
  );
}