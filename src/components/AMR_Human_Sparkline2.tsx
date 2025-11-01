import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Download, ChevronDown, Check } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from './ui/utils';

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

  if (Math.abs(change) < 5) {
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

export function AMR_Human_Sparkline2() {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sparklineData, setSparklineData] = useState<SparklineCombo[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);

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

  // Helper function to determine resistance from zone size
  const isResistant = (zoneSize: any, antibioticType: string): boolean => {
    if (!zoneSize || zoneSize === '') return false;
    
    const zoneNum = parseFloat(zoneSize);
    if (isNaN(zoneNum)) return false;

    // Different breakpoints for different antibiotic classes
    switch (antibioticType) {
      case 'carbapenem':
        return zoneNum <= 19; // Carbapenems breakpoint
      case 'cephalosporin':
        return zoneNum <= 22; // 3rd gen cephalosporins breakpoint
      case 'vancomycin':
        return zoneNum <= 17; // Vancomycin breakpoint
      case 'methicillin':
        return zoneNum <= 17; // Methicillin/Oxacillin breakpoint
      case 'penicillin':
        return zoneNum <= 15; // Penicillin breakpoint
      default:
        return zoneNum <= 15; // Default breakpoint for other antibiotics
    }
  };

  // Calculate resistance trends from raw data
  const calculateResistanceTrends = (rows: any[]): SparklineCombo[] => {
    console.log('Calculating resistance trends from', rows.length, 'rows');
    
    const results: SparklineCombo[] = [];

    // Helper function to calculate resistance for specific organism patterns and antibiotics
    const calculateResistanceForCombo = (
      organismCodes: string[], 
      antibioticTests: { column: string; type: string }[],
      combinationName: string
    ) => {
      const yearData: { [year: string]: { resistant: number; total: number } } = {};

      console.log(`Processing ${combinationName}:`, { organismCodes, antibioticTests });

      rows.forEach(row => {
        const organism = row.ORGANISM;
        if (!organism) return;

        // Check if organism matches any of the codes
        const organismLower = organism.toLowerCase().trim();
        const matchesOrganism = organismCodes.some(code => 
          organismLower === code.toLowerCase()
        );

        if (matchesOrganism) {
          const year = row.YEAR_SPEC;
          if (!year) return;

          // Initialize year data if not exists
          if (!yearData[year]) {
            yearData[year] = { resistant: 0, total: 0 };
          }

          // Check if any of the antibiotic tests show resistance
          let hasTestResult = false;
          let isResistant = false;

          antibioticTests.forEach(test => {
            const zoneSize = row[test.column];
            if (zoneSize !== undefined && zoneSize !== null && zoneSize !== '') {
              hasTestResult = true;
              if (isResistant(zoneSize, test.type)) {
                isResistant = true;
              }
            }
          });

          if (hasTestResult) {
            yearData[year].total += 1;
            if (isResistant) {
              yearData[year].resistant += 1;
            }
          }
        }
      });

      // Convert to trend data points
      const trends: TrendDataPoint[] = Object.entries(yearData)
        .map(([year, data]) => ({
          year: parseInt(year),
          resistance: data.total > 0 ? (data.resistant / data.total) * 100 : 0,
          specimens: data.total,
          total_tested: data.total
        }))
        .sort((a, b) => a.year - b.year);

      // Calculate current resistance (latest year)
      const currentResistance = trends.length > 0 ? trends[trends.length - 1].resistance : 0;

      console.log(`${combinationName} results:`, {
        years: Object.keys(yearData),
        currentResistance,
        trendsCount: trends.length
      });

      return {
        trends,
        currentResistance
      };
    };

    // Calculate for each pathogen-antibiotic combination
    pathogenAntibioticPairs.forEach(pair => {
      let organismCodes: string[] = [];
      let antibioticTests: { column: string; type: string }[] = [];

      // Define mappings for each combination
      switch (pair.formula) {
        case 'A_BAUMANNII_CARBAPENEMS':
          organismCodes = ['aba', 'acinetobacter baumannii'];
          antibioticTests = [
            { column: 'IPM ND10', type: 'carbapenem' },
            { column: 'MEM ND10', type: 'carbapenem' }
          ];
          break;
        case 'E_COLI_3G_CEPHALOSPORINS':
          organismCodes = ['eco', 'escherichia coli'];
          antibioticTests = [
            { column: 'CTX ND30', type: 'cephalosporin' },
            { column: 'CAZ ND30', type: 'cephalosporin' },
            { column: 'CRO ND30', type: 'cephalosporin' }
          ];
          break;
        case 'E_COLI_CARBAPENEMS':
          organismCodes = ['eco', 'escherichia coli'];
          antibioticTests = [
            { column: 'IPM ND10', type: 'carbapenem' },
            { column: 'MEM ND10', type: 'carbapenem' }
          ];
          break;
        case 'ENTEROCOCCI_VANCOMYCIN':
          organismCodes = ['efa', 'efm', 'enterococcus faecalis', 'enterococcus faecium'];
          antibioticTests = [
            { column: 'VAN ND30', type: 'vancomycin' }
          ];
          break;
        case 'K_PNEUMONIAE_3G_CEPHALOSPORINS':
          organismCodes = ['kpn', 'klebsiella pneumoniae'];
          antibioticTests = [
            { column: 'CTX ND30', type: 'cephalosporin' },
            { column: 'CAZ ND30', type: 'cephalosporin' },
            { column: 'CRO ND30', type: 'cephalosporin' }
          ];
          break;
        case 'K_PNEUMONIAE_AMINOGLYCOSIDES':
          organismCodes = ['kpn', 'klebsiella pneumoniae'];
          antibioticTests = [
            { column: 'GEN ND10', type: 'default' },
            { column: 'AMK ND30', type: 'default' },
            { column: 'TOB ND10', type: 'default' }
          ];
          break;
        case 'K_PNEUMONIAE_CARBAPENEMS':
          organismCodes = ['kpn', 'klebsiella pneumoniae'];
          antibioticTests = [
            { column: 'IPM ND10', type: 'carbapenem' },
            { column: 'MEM ND10', type: 'carbapenem' }
          ];
          break;
        case 'K_PNEUMONIAE_FLUOROQUINOLONES':
          organismCodes = ['kpn', 'klebsiella pneumoniae'];
          antibioticTests = [
            { column: 'CIP ND5', type: 'default' },
            { column: 'OFX ND5', type: 'default' },
            { column: 'NOR ND10', type: 'default' }
          ];
          break;
        case 'P_AERUGINOSA_CARBAPENEMS':
          organismCodes = ['pae', 'pseudomonas aeruginosa'];
          antibioticTests = [
            { column: 'IPM ND10', type: 'carbapenem' },
            { column: 'MEM ND10', type: 'carbapenem' }
          ];
          break;
        case 'S_AUREUS_METHICILLIN':
          organismCodes = ['sau', 'staphylococcus aureus'];
          antibioticTests = [
            { column: 'OXA ND1', type: 'methicillin' }
          ];
          break;
        case 'S_PNEUMONIAE_3G_CEPHALOSPORINS':
          organismCodes = ['spn', 'streptococcus pneumoniae'];
          antibioticTests = [
            { column: 'CTX ND30', type: 'cephalosporin' },
            { column: 'CRO ND30', type: 'cephalosporin' }
          ];
          break;
        case 'S_PNEUMONIAE_PENICILLIN':
          organismCodes = ['spn', 'streptococcus pneumoniae'];
          antibioticTests = [
            { column: 'PEN ND10', type: 'penicillin' }
          ];
          break;
        default:
          organismCodes = [];
          antibioticTests = [];
      }

      const { trends, currentResistance } = calculateResistanceForCombo(
        organismCodes,
        antibioticTests,
        `${pair.organism} vs ${pair.antibiotic}`
      );

      results.push({
        organism: pair.organism,
        antibiotic: pair.antibiotic,
        formula: pair.formula,
        currentResistance,
        trends,
        trendInfo: analyzeTrend(trends)
      });
    });

    console.log('Final sparkline results:', results);
    return results;
  };

  // Fetch all data from local API endpoint
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching all AMR data from local API for Sparkline Trends...');
      const response = await fetch('http://localhost:5001/v1/amr-health-v2', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiData: ApiResponse = await response.json();
      console.log('Full API response received for Sparkline Trends:', apiData);

      if (!apiData.success || !apiData.data || !apiData.data.rows) {
        throw new Error('Invalid API response format');
      }

      const rows = apiData.data.rows;
      setRawData(rows);
      
      // Log sample data for debugging
      console.log('Sample rows for debugging:', rows.slice(0, 5));
      console.log('Available columns:', apiData.data.columns);
      console.log('Organism values found:', [...new Set(rows.map(r => r.ORGANISM).filter(Boolean))].slice(0, 10));
      console.log('Year values found:', [...new Set(rows.map(r => r.YEAR_SPEC).filter(Boolean))].sort());

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
      
      // Process trend data from filtered rows
      const processedData = calculateResistanceTrends(filteredRows);
      setSparklineData(processedData);
      
    } catch (error) {
      console.error('Error fetching AMR data from local API for Sparkline Trends:', error);
      setSparklineData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter configs using dynamic options from API data
  const filterConfigs = useMemo(() => {
    const configs: Record<string, { label: string; options: FilterValueOption[] }> = {};

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

    // Populate with data when available
    if (rawData.length > 0) {
      Object.entries(configMapping).forEach(([key, label]) => {
        configs[key.toLowerCase()] = {
          label,
          options: extractUniqueValues(rawData, key)
        };
      });
    }

    return configs;
  }, [rawData]);

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

  // Get filter value options for selected type
  const getFilterValueOptionsForType = (type: string) => {
    const config = filterConfigs[type as keyof typeof filterConfigs];
    return config?.options || [];
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
                  {combo.currentResistance > 0 ? combo.currentResistance.toFixed(1) : '0.0'}%
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
                  {combo.trends.length > 0 ? (
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
                            const { payload, cx, cy } = props;
                            const specimenCount = payload?.total_tested || payload?.specimens || 0;
                            const isLowSample = specimenCount < 30;
                            const resistanceValue = payload?.resistance || 0;
                            
                            return (
                              <circle
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
                            const { payload, cx, cy } = props;
                            const specimenCount = payload?.total_tested || payload?.specimens || 0;
                            const isLowSample = specimenCount < 30;
                            const resistanceValue = payload?.resistance || 0;
                            
                            return (
                              <circle
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
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const specimenCount = data?.total_tested || data?.specimens || 0;
                              const resistantCount = Math.round((data?.resistance / 100) * specimenCount);
                              const resistance = data?.resistance || 0;
                              const year = data?.year;
                              
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
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No data
                    </div>
                  )}
                </div>
              </div>

              {/* Time Axis - YEAR_SPEC Range */}
              <div className="flex justify-between text-xs text-gray-500 mt-1 ml-6">
                <span>{combo.trends[0]?.year || 'N/A'}</span>
                <span className="text-center flex-1 text-gray-400 text-[11px]">R% by YEAR_SPEC</span>
                <span>{combo.trends[combo.trends.length - 1]?.year || 'N/A'}</span>
              </div>
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