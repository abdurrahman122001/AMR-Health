import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, LabelList } from 'recharts';
import { Download, ChevronDown, Check } from 'lucide-react';  
import { cn } from './ui/utils';

// Priority pathogen-antibiotic combinations resistance data
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

// Standardized filter options
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
  if (percentage < 20) return '#16a34a';
  if (percentage < 40) return '#eab308';
  return '#dc2626';
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

interface ResistanceDataItem {
  organism: string;
  antibiotic: string;
  rate: number;
  resistant: number;
  total: number;
  formula: string;
  displayName?: string;
  color?: string;
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

  const [filterValueCache, setFilterValueCache] = useState<Record<string, FilterValueOption[]>>({});

  // Helper function to extract unique values from raw data
  const extractUniqueValues = (rows: any[], columnName: string): FilterValueOption[] => {
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

  // Fetch all data from local API endpoint
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching all AMR data from local API for Priority Bars...');
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
      console.log('Full API response received for Priority Bars:', apiData);

      if (!apiData.success || !apiData.data || !apiData.data.rows) {
        throw new Error('Invalid API response format');
      }

      const rows = apiData.data.rows;
      
      // Process resistance data from raw rows
      const processedData = calculateResistanceData(rows);
      setRealResistanceData(processedData);
      
      // Pre-populate filter value cache
      const newFilterValueCache: Record<string, FilterValueOption[]> = {};
      filterTypeOptions.forEach(option => {
        newFilterValueCache[option.value] = extractUniqueValues(rows, option.value);
      });
      setFilterValueCache(newFilterValueCache);
      
      console.log('Resistance data calculated:', processedData);
      console.log('Filter values cached:', newFilterValueCache);

    } catch (error) {
      console.error('Error fetching AMR data from local API for Priority Bars:', error);
      setRealResistanceData({});
      setFilterValueCache({});
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate resistance data from raw rows
  const calculateResistanceData = (rows: any[]) => {
    const resistanceResults: any = {};

    const calculateResistance = (organismPattern: string[], antibioticColumns: string[], resistanceBreakpoint: number = 15) => {
      let resistantCount = 0;
      let totalTested = 0;
      
      rows.forEach(row => {
        const organism = row.ORGANISM;
        if (!organism) return;
        
        const organismLower = organism.toLowerCase();
        const matchesOrganism = organismPattern.some(pattern => organismLower.includes(pattern.toLowerCase()));
        
        if (matchesOrganism) {
          let hasTestResult = false;
          let isResistant = false;
          
          antibioticColumns.forEach(column => {
            const zoneSize = row[column];
            if (zoneSize !== undefined && zoneSize !== null && zoneSize !== '') {
              hasTestResult = true;
              const zoneNum = parseFloat(zoneSize);
              if (!isNaN(zoneNum) && zoneNum <= resistanceBreakpoint) {
                isResistant = true;
              }
            }
          });
          
          if (hasTestResult) {
            totalTested++;
            if (isResistant) {
              resistantCount++;
            }
          }
        }
      });
      
      const resistanceRate = totalTested > 0 ? Math.round((resistantCount / totalTested) * 100) : 0;
      
      return {
        resistanceRate,
        resistantCount,
        totalTested
      };
    };

    // A. baumannii vs Carbapenems
    resistanceResults.A_BAUMANNII_CARBAPENEMS = calculateResistance(
      ['aba', 'acinetobacter baumannii'],
      ['IPM ND10', 'MEM ND10'],
      19
    );

    // E. coli vs 3G Cephalosporins
    resistanceResults.E_COLI_3G_CEPHALOSPORINS = calculateResistance(
      ['eco', 'escherichia coli'],
      ['CTX ND30', 'CAZ ND30', 'CRO ND30'],
      22
    );

    // E. coli vs Carbapenems
    resistanceResults.E_COLI_CARBAPENEMS = calculateResistance(
      ['eco', 'escherichia coli'],
      ['IPM ND10', 'MEM ND10'],
      19
    );

    // Enterococci vs Vancomycin
    resistanceResults.ENTEROCOCCI_VANCOMYCIN = calculateResistance(
      ['efa', 'efm', 'enterococcus'],
      ['VAN ND30'],
      17
    );

    // K. pneumoniae vs 3G Cephalosporins
    resistanceResults.K_PNEUMONIAE_3G_CEPHALOSPORINS = calculateResistance(
      ['kpn', 'klebsiella pneumoniae'],
      ['CTX ND30', 'CAZ ND30', 'CRO ND30'],
      22
    );

    // K. pneumoniae vs Aminoglycosides
    resistanceResults.K_PNEUMONIAE_AMINOGLYCOSIDES = calculateResistance(
      ['kpn', 'klebsiella pneumoniae'],
      ['GEN ND10', 'AMK ND30', 'TOB ND10'],
      15
    );

    // K. pneumoniae vs Carbapenems
    resistanceResults.K_PNEUMONIAE_CARBAPENEMS = calculateResistance(
      ['kpn', 'klebsiella pneumoniae'],
      ['IPM ND10', 'MEM ND10'],
      19
    );

    // K. pneumoniae vs Fluoroquinolones
    resistanceResults.K_PNEUMONIAE_FLUOROQUINOLONES = calculateResistance(
      ['kpn', 'klebsiella pneumoniae'],
      ['CIP ND5', 'OFX ND5', 'NOR ND10'],
      15
    );

    // P. aeruginosa vs Carbapenems
    resistanceResults.P_AERUGINOSA_CARBAPENEMS = calculateResistance(
      ['pae', 'pseudomonas aeruginosa'],
      ['IPM ND10', 'MEM ND10'],
      19
    );

    // S. aureus vs Methicillin
    resistanceResults.S_AUREUS_METHICILLIN = calculateResistance(
      ['sau', 'staphylococcus aureus'],
      ['OXA ND1'],
      17
    );

    // S. pneumoniae vs 3G Cephalosporins
    resistanceResults.S_PNEUMONIAE_3G_CEPHALOSPORINS = calculateResistance(
      ['spn', 'streptococcus pneumoniae'],
      ['CTX ND30', 'CRO ND30'],
      22
    );

    // S. pneumoniae vs Penicillin
    resistanceResults.S_PNEUMONIAE_PENICILLIN = calculateResistance(
      ['spn', 'streptococcus pneumoniae'],
      ['PEN ND10'],
      15
    );

    return resistanceResults;
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

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

  // Get filter value options for current type
  const getFilterValueOptionsForType = (type: string) => {
    return filterValueCache[type] || [];
  };

  // Get resistance profile data for chart
  const getResistanceProfileData = () => {
    const currentData = resistanceData.map(item => {
      const realData = realResistanceData[item.formula as keyof typeof realResistanceData];
      if (realData) {
        return {
          ...item,
          rate: realData.resistanceRate || 0,
          resistant: realData.resistantCount || 0,
          total: realData.totalTested || 0
        };
      }
      
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
    
    return chartData.sort((a, b) => b.rate - a.rate);
  };

  // Custom label component for low sample size indicator
  const LowSampleLabel = (props: any) => {
    const { x, y, width, payload } = props;
    
    const total = payload?.total || 
                  payload?.payload?.total;
    
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

  // Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    const rate = data.rate;
    const riskLevel = rate < 20 ? 'Low risk' : rate < 40 ? 'Moderate risk' : 'High risk';
    const riskColor = getResistanceAlertColor(rate);
    const totalTested = data.total || 0;
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

  const chartData = getResistanceProfileData();
  const cellColors = chartData.map(entry => {
    const isSmallSample = entry.total && entry.total <= 30;
    return isSmallSample ? entry.color + '99' : entry.color;
  });

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

        {/* Chart Area */}
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
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading resistance data...</div>
              </div>
            ) : (
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
                    height={70}
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
                  <Tooltip content={<CustomTooltip />} />
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}