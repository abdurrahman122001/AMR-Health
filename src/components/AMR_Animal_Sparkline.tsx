import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Download, ChevronDown, Check, Loader2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from './ui/utils';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Animal health priority pathogen-antibiotic combinations for trends
const animalPriorityPairs = [
  { organism: 'Escherichia coli', antibiotic: '3rd Generation Cephalosporins', code: 'ANIMAL_E_COLI_3G_CEPHALOSPORINS' },
  { organism: 'Escherichia coli', antibiotic: 'Carbapenems', code: 'ANIMAL_E_COLI_CARBAPENEMS' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Carbapenems', code: 'ANIMAL_K_PNEUMONIAE_CARBAPENEMS' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Aminoglycosides', code: 'ANIMAL_K_PNEUMONIAE_AMINOGLYCOSIDES' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Fluoroquinolones', code: 'ANIMAL_K_PNEUMONIAE_FLUOROQUINOLONES' },
  { organism: 'Klebsiella pneumoniae', antibiotic: '3rd-Generation Cephalosporins', code: 'ANIMAL_K_PNEUMONIAE_3G_CEPHALOSPORINS' },
  { organism: 'Enterococci', antibiotic: 'Vancomycin', code: 'ANIMAL_ENTEROCOCCI_VANCOMYCIN' },
  { organism: 'Staphylococcus aureus', antibiotic: 'Methicillin', code: 'ANIMAL_S_AUREUS_METHICILLIN' },
  { organism: 'Streptococcus agalactiae', antibiotic: 'Ampicillin', code: 'ANIMAL_S_AGALACTIAE_AMPICILLIN' },
  { organism: 'Pseudomonas aeruginosa', antibiotic: 'Carbapenems', code: 'ANIMAL_P_AERUGINOSA_CARBAPENEMS' },
  { organism: 'Acinetobacter baumannii', antibiotic: 'Carbapenems', code: 'ANIMAL_A_BAUMANNII_CARBAPENEMS' },
  { organism: 'Campylobacter species', antibiotic: 'Fluoroquinolones', code: 'ANIMAL_CAMPYLOBACTER_FLUOROQUINOLONES' },
  { organism: 'Salmonella species', antibiotic: 'Fluoroquinolones', code: 'ANIMAL_SALMONELLA_FLUOROQUINOLONES' },
  { organism: 'Aeromonas species', antibiotic: 'Carbapenems', code: 'ANIMAL_AEROMONAS_CARBAPENEMS' },
  { organism: 'Aeromonas species', antibiotic: '3rd-Generation Cephalosporins', code: 'ANIMAL_AEROMONAS_3G_CEPHALOSPORINS' }
];

// Filter options now loaded dynamically from backend endpoint

// Get resistance alert color based on percentage for animal health
const getResistanceAlertColor = (percentage: number): string => {
  if (percentage < 20) return '#16a34a'; // Green
  if (percentage < 40) return '#eab308'; // Yellow
  return '#dc2626'; // Red
};

// Format organism name according to scientific convention for animal health
const formatOrganismName = (organism: string): string => {
  const abbreviations: { [key: string]: string } = {
    'Acinetobacter baumannii': 'A. baumannii',
    'Escherichia coli': 'E. coli',
    'Enterococci': 'Enterococci',
    'Klebsiella pneumoniae': 'K. pneumoniae',
    'Pseudomonas aeruginosa': 'P. aeruginosa',
    'Staphylococcus aureus': 'S. aureus',
    'Streptococcus agalactiae': 'S. agalactiae',
    'Campylobacter species': 'Campylobacter spp.',
    'Salmonella species': 'Salmonella spp.',
    'Aeromonas species': 'Aeromonas spp.'
  };
  return abbreviations[organism] || organism;
};

// Filter interface for animal health
interface AnimalFilter {
  type: string;
  value: string;
  label: string;
}

interface AnimalFilterValueOption {
  value: string;
  label: string;
}

interface AnimalSparklineData {
  organism: string;
  antibiotic: string;
  code: string;
  currentResistance: number;
  trends: Array<{
    year: number;
    resistance: number;
    total_tested: number;
    resistant_count: number;
  }>;
  trendInfo: {
    direction: 'increasing' | 'decreasing' | 'stable';
    color: string;
  };
}

// Fetch real time series data for a specific priority pair
const fetchTimeSeriesForPair = async (pairCode: string, filters: AnimalFilter[] = []): Promise<AnimalSparklineData | null> => {
  try {
    if (!projectId || !publicAnonKey) {
      console.warn('Missing project configuration for time series fetch');
      return null;
    }

    // Build query parameters
    const params = new URLSearchParams({ formula: pairCode });
    
    // Add active filters as query parameters
    filters.forEach(filter => {
      if (filter.type && filter.value) {
        // Map filter types to actual database columns
        const columnMapping: { [key: string]: string } = {
          'ANIMAL_TYPE': 'ANIM_TYPE',
          'FARM_TYPE': 'FARM_TYPE',
          'YEAR_COLLECTED': 'SPEC_YEAR',
          'SPECIES': 'SPECIES_NT'
        };
        
        const dbColumn = columnMapping[filter.type] || filter.type;
        params.append(dbColumn, filter.value);
      }
    });

    const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-timeseries?${params.toString()}`;
    console.log(`Fetching time series data for ${pairCode}:`, url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Time series fetch failed for ${pairCode}:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data.success || !data.yearData) {
      console.warn(`No time series data returned for ${pairCode}:`, data);
      return null;
    }

    // Calculate trend direction
    const yearData = data.yearData;
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let color = '#6b7280'; // Gray for stable

    if (yearData.length >= 2) {
      const firstYear = yearData[0].resistance;
      const lastYear = yearData[yearData.length - 1].resistance;
      const difference = lastYear - firstYear;
      
      if (difference > 5) {
        direction = 'increasing';
        color = '#dc2626'; // Red
      } else if (difference < -5) {
        direction = 'decreasing';
        color = '#16a34a'; // Green
      }
    }

    return {
      organism: data.organism,
      antibiotic: data.antibiotic,
      code: pairCode,
      currentResistance: data.currentResistance || 0,
      trends: yearData,
      trendInfo: {
        direction,
        color
      }
    };

  } catch (error) {
    console.error(`Error fetching time series for ${pairCode}:`, error);
    return null;
  }
};

export function AMR_Animal_Sparkline() {
  const [sparklineData, setSparklineData] = useState<AnimalSparklineData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading animal health resistance trends...');
  
  // Filter state management
  const [activeFilters, setActiveFilters] = useState<AnimalFilter[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [typeOpen, setTypeOpen] = useState<boolean>(false);
  const [valueOpen, setValueOpen] = useState<boolean>(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, AnimalFilterValueOption[]>>({});
  
  // Dynamic filter columns state
  const [availableColumns, setAvailableColumns] = useState<{value: string, label: string}[]>([]);
  const [columnsLoading, setColumnsLoading] = useState<boolean>(true);

  // Filter helpers
  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeOption = availableColumns.find(opt => opt.value === filterType);
        const valueOption = getFilterValueOptionsForType(filterType).find(opt => opt.value === filterValue);
        
        if (typeOption && valueOption) {
          const newFilter: AnimalFilter = {
            type: filterType,
            value: filterValue,
            label: `${typeOption.label}: ${valueOption.label}`
          };
          
          setActiveFilters(prev => [...prev, newFilter]);
          setFilterType('');
          setFilterValue('');
        }
      }
    },
    
    removeFilter: (index: number) => {
      setActiveFilters(prev => prev.filter((_, i) => i !== index));
    },
    
    clearAllFilters: () => {
      setActiveFilters([]);
    }
  };

  // Get filter type options - now uses dynamic backend data
  const getFilterTypeOptions = () => {
    if (columnsLoading) {
      return [{ value: '', label: 'Loading filter options...' }];
    }
    return availableColumns;
  };

  // Get filter value options for a specific type
  const getFilterValueOptionsForType = (type: string): AnimalFilterValueOption[] => {
    if (!type) return [];
    
    // Static animal health filter values for demo
    const staticOptions: Record<string, AnimalFilterValueOption[]> = {
      'ANIMAL_TYPE': [
        { value: 'cattle', label: 'Cattle' },
        { value: 'swine', label: 'Swine' },
        { value: 'poultry', label: 'Poultry' },
        { value: 'sheep', label: 'Sheep' },
        { value: 'goat', label: 'Goat' },
        { value: 'aquaculture', label: 'Aquaculture' }
      ],
      'SPECIES': [
        { value: 'bovine', label: 'Bovine' },
        { value: 'porcine', label: 'Porcine' },
        { value: 'chicken', label: 'Chicken' },
        { value: 'ovine', label: 'Ovine' },
        { value: 'caprine', label: 'Caprine' },
        { value: 'fish', label: 'Fish' }
      ],
      'FARM_TYPE': [
        { value: 'commercial', label: 'Commercial' },
        { value: 'smallholder', label: 'Smallholder' },
        { value: 'intensive', label: 'Intensive' },
        { value: 'extensive', label: 'Extensive' }
      ],
      'REGION': [
        { value: 'greater_accra', label: 'Greater Accra' },
        { value: 'ashanti', label: 'Ashanti' },
        { value: 'western', label: 'Western' },
        { value: 'central', label: 'Central' },
        { value: 'eastern', label: 'Eastern' },
        { value: 'volta', label: 'Volta' },
        { value: 'northern', label: 'Northern' },
        { value: 'upper_east', label: 'Upper East' },
        { value: 'upper_west', label: 'Upper West' },
        { value: 'brong_ahafo', label: 'Brong Ahafo' }
      ],
      'VET_FACILITY': [
        { value: 'university_veterinary_hospital', label: 'University Veterinary Hospital' },
        { value: 'regional_veterinary_clinic', label: 'Regional Veterinary Clinic' },
        { value: 'district_veterinary_office', label: 'District Veterinary Office' },
        { value: 'private_veterinary_clinic', label: 'Private Veterinary Clinic' }
      ],
      'SAMPLE_TYPE': [
        { value: 'blood', label: 'Blood' },
        { value: 'milk', label: 'Milk' },
        { value: 'feces', label: 'Feces' },
        { value: 'urine', label: 'Urine' },
        { value: 'tissue', label: 'Tissue' },
        { value: 'nasal_swab', label: 'Nasal Swab' },
        { value: 'wound', label: 'Wound' }
      ],
      'YEAR_COLLECTED': [
        { value: '2024', label: '2024' },
        { value: '2023', label: '2023' },
        { value: '2022', label: '2022' },
        { value: '2021', label: '2021' },
        { value: '2020', label: '2020' }
      ],
      'QUARTER': [
        { value: 'Q1', label: 'Q1 (Jan-Mar)' },
        { value: 'Q2', label: 'Q2 (Apr-Jun)' },
        { value: 'Q3', label: 'Q3 (Jul-Sep)' },
        { value: 'Q4', label: 'Q4 (Oct-Dec)' }
      ],
      'PRODUCTION_SYSTEM': [
        { value: 'intensive', label: 'Intensive' },
        { value: 'semi_intensive', label: 'Semi-Intensive' },
        { value: 'extensive', label: 'Extensive' },
        { value: 'organic', label: 'Organic' }
      ]
    };
    
    return staticOptions[type] || [];
  };

  // Fetch available filter columns from backend
  const fetchAvailableColumns = async () => {
    try {
      setColumnsLoading(true);
      
      if (!projectId || !publicAnonKey) {
        console.warn('Missing project configuration for column fetch');
        // Fallback to hardcoded columns
        setAvailableColumns([
          { value: 'LABORATORY', label: 'Laboratory' },
          { value: 'ORIGIN', label: 'Origin' },
          { value: 'SURV_PROG', label: 'Surveillance Program' },
          { value: 'SPECIES', label: 'Species' },
          { value: 'SPECIES_NT', label: 'Species Notes' },
          { value: 'SCALENOTES', label: 'Scale Notes' },
          { value: 'ANIM_TYPE', label: 'Animal Type' },
          { value: 'BREED', label: 'Breed' },
          { value: 'SEX_CATEG', label: 'Sex Category' },
          { value: 'PROD_NOTES', label: 'Production Notes' },
          { value: 'MARKET_CAT', label: 'Market Category' },
          { value: 'REGION', label: 'Region' },
          { value: 'DISTRICT', label: 'District' },
          { value: 'CITY', label: 'City' },
          { value: 'TOWN', label: 'Town' },
          { value: 'FARM_TYPE', label: 'Farm Type' },
          { value: 'MKTCATNOTE', label: 'Market Category Notes' },
          { value: 'SPEC_TYPE', label: 'Specimen Type' },
          { value: 'SPEC_NOTES', label: 'Specimen Notes' },
          { value: 'FOOD', label: 'Food' },
          { value: 'BRAND', label: 'Brand' },
          { value: 'FOOD_TYPE', label: 'Food Type' },
          { value: 'ORGANISM', label: 'Organism' },
          { value: 'ORG_NOTE', label: 'Organism Notes' },
          { value: 'STRAINNOTE', label: 'Strain Notes' },
          { value: 'SEROTYPE', label: 'Serotype' },
          { value: 'PHENO_CODE', label: 'Phenotype Code' },
          { value: 'SPEC_YEAR', label: 'Specimen Year' }
        ]);
        setColumnsLoading(false);
        return;
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/filter-values/amr-animal/columns`;
      console.log('Fetching available columns from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch columns: ${response.status}`);
      }

      const data = await response.json();
      console.log('Available columns response:', data);

      if (data.columns && Array.isArray(data.columns)) {
        // Transform column names to options with proper labels
        const columnOptions = data.columns.map((col: string) => ({
          value: col,
          label: col.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        }));
        setAvailableColumns(columnOptions);
      } else {
        throw new Error('Invalid columns response format');
      }

    } catch (error) {
      console.error('Error fetching available columns:', error);
      // Fallback to hardcoded columns on error
      setAvailableColumns([
        { value: 'LABORATORY', label: 'Laboratory' },
        { value: 'ORIGIN', label: 'Origin' },
        { value: 'SURV_PROG', label: 'Surveillance Program' },
        { value: 'SPECIES', label: 'Species' },
        { value: 'SPECIES_NT', label: 'Species Notes' },
        { value: 'SCALENOTES', label: 'Scale Notes' },
        { value: 'ANIM_TYPE', label: 'Animal Type' },
        { value: 'BREED', label: 'Breed' },
        { value: 'SEX_CATEG', label: 'Sex Category' },
        { value: 'PROD_NOTES', label: 'Production Notes' },
        { value: 'MARKET_CAT', label: 'Market Category' },
        { value: 'REGION', label: 'Region' },
        { value: 'DISTRICT', label: 'District' },
        { value: 'CITY', label: 'City' },
        { value: 'TOWN', label: 'Town' },
        { value: 'FARM_TYPE', label: 'Farm Type' },
        { value: 'MKTCATNOTE', label: 'Market Category Notes' },
        { value: 'SPEC_TYPE', label: 'Specimen Type' },
        { value: 'SPEC_NOTES', label: 'Specimen Notes' },
        { value: 'FOOD', label: 'Food' },
        { value: 'BRAND', label: 'Brand' },
        { value: 'FOOD_TYPE', label: 'Food Type' },
        { value: 'ORGANISM', label: 'Organism' },
        { value: 'ORG_NOTE', label: 'Organism Notes' },
        { value: 'STRAINNOTE', label: 'Strain Notes' },
        { value: 'SEROTYPE', label: 'Serotype' },
        { value: 'PHENO_CODE', label: 'Phenotype Code' },
        { value: 'SPEC_YEAR', label: 'Specimen Year' }
      ]);
    } finally {
      setColumnsLoading(false);
    }
  };

  // Load available columns on mount
  useEffect(() => {
    fetchAvailableColumns();
  }, []);

  // Load real data from backend
  useEffect(() => {
    const loadRealData = async () => {
      try {
        setIsLoading(true);
        setLoadingMessage('Fetching veterinary resistance trends from database...');
        
        console.log('Loading time series data for all priority pairs...');
        const fetchPromises = animalPriorityPairs.map(pair => 
          fetchTimeSeriesForPair(pair.code, activeFilters)
        );
        
        setLoadingMessage('Processing time series calculations...');
        const results = await Promise.all(fetchPromises);
        
        // Filter out null results and create fallback data for missing results
        const processedData: AnimalSparklineData[] = [];
        
        animalPriorityPairs.forEach((pair, index) => {
          const result = results[index];
          if (result) {
            processedData.push(result);
          } else {
            // Create fallback entry for pairs that don't have data yet
            console.warn(`No data available for ${pair.code}, creating fallback entry`);
            processedData.push({
              organism: pair.organism,
              antibiotic: pair.antibiotic,
              code: pair.code,
              currentResistance: 0,
              trends: [],
              trendInfo: {
                direction: 'stable',
                color: '#6b7280'
              }
            });
          }
        });
        
        setSparklineData(processedData);
        setLoadingMessage(`Loaded ${processedData.filter(d => d.trends.length > 0).length} priority resistance trends`);
        
        console.log(`Successfully loaded ${processedData.length} priority pairs with time series data`);
        
      } catch (error) {
        console.error('Error loading animal sparkline data:', error);
        setLoadingMessage('Error loading trend data from database');
        
        // Set empty data to prevent UI issues
        setSparklineData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRealData();
  }, [activeFilters]); // Reload when filters change

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-[16px]">
            Veterinary Resistance Trends for Priority Pathogen-Antibiotic Combinations
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log('Download animal sparkline data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px] text-[13px]">
          Resistance percentage trends over time for veterinary priority pathogen-antibiotic combinations • Animal health surveillance monitoring
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
                disabled={isLoading}
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
                    disabled={isLoading}
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
            <h3 className="font-semibold text-gray-900 text-sm text-[13px]">Filter Veterinary Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={typeOpen}
                    disabled={isLoading || columnsLoading}
                    className="w-full justify-between text-sm h-10 text-[13px] px-[12px] py-[5px]"
                  >
                    {filterType
                      ? getFilterTypeOptions().find((option) => option.value === filterType)?.label
                      : columnsLoading ? "Loading filters..." : isLoading ? "Loading..." : "Select filter type..."}
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
                    disabled={!filterType || isLoading}
                    className="w-full justify-between text-sm h-10 text-[13px] px-[12px] py-[5px]"
                  >
                    {filterValue
                      ? getFilterValueOptionsForType(filterType).find((option) => option.value === filterValue)?.label
                      : isLoading ? "Loading..." : filterType ? "Select value..." : "Select type first"}
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
              disabled={!filterType || !filterValue || isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap text-[13px]"
            >
              Add Filter
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500">{loadingMessage}</div>
          </div>
        )}

        {/* Sparkline Grid - 4x4 for 15 pairs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 col-span-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">{loadingMessage}</p>
              </div>
            </div>
          )}
          
          {sparklineData.map((combo, index) => (
            <div key={index} className="border rounded-lg p-3 bg-white hover:shadow-md transition-shadow relative">
              {/* Resistance Percentage - Upper Right Corner */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <span 
                  className="text-lg font-bold"
                  style={{ color: getResistanceAlertColor(combo.currentResistance) }}
                >
                  {isLoading ? (
                    <div className="w-8 h-5 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    `${combo.currentResistance}%`
                  )}
                </span>
                {!isLoading && (
                  <div 
                    className="text-xs font-medium"
                    style={{ color: combo.trendInfo.color }}
                  >
                    {combo.trendInfo.direction === 'increasing' && '↗'}
                    {combo.trendInfo.direction === 'decreasing' && '↘'}
                    {combo.trendInfo.direction === 'stable' && '→'}
                  </div>
                )}
              </div>

              {/* Header - Optimized for More Space */}
              <div className="mb-2 pr-16">
                <div className="text-sm font-medium text-gray-900 mb-1 text-[13px]">
                  {isLoading ? (
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <em>{formatOrganismName(combo.organism)}</em>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {isLoading ? (
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    `vs ${combo.antibiotic}`
                  )}
                </div>
              </div>

              {/* R% Time Series - Resistance Rate over SPEC_YEAR - Expanded Height */}
              <div className="h-20 w-full relative">
                <div className="absolute -left-1 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400">
                  <span>100</span>
                  <span>50</span>
                  <span>0</span>
                </div>
                <div className="ml-6 h-full">
                  {isLoading ? (
                    <div className="w-full h-full bg-gray-200 rounded animate-pulse"></div>
                  ) : combo.trends.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      No data available
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>

              {/* Time Axis - SPEC_YEAR Range */}
              <div className="flex justify-between text-xs text-gray-500 mt-1 ml-6">
                {isLoading ? (
                  <>
                    <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </>
                ) : combo.trends.length === 0 ? (
                  <>
                    <span>-</span>
                    <span className="text-center flex-1 text-gray-400">R% by SPEC_YEAR</span>
                    <span>-</span>
                  </>
                ) : (
                  <>
                    <span>{combo.trends[0]?.year}</span>
                    <span className="text-center flex-1 text-gray-400">R% by SPEC_YEAR</span>
                    <span>{combo.trends[combo.trends.length - 1]?.year}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-[0px]">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-700">
              {isLoading ? (
                <div className="w-8 h-8 bg-red-200 rounded animate-pulse"></div>
              ) : (
                sparklineData.filter(combo => combo.trendInfo.direction === 'increasing').length
              )}
            </div>
            <div className="text-sm text-red-600">Increasing resistance trends</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">
              {isLoading ? (
                <div className="w-8 h-8 bg-green-200 rounded animate-pulse"></div>
              ) : (
                sparklineData.filter(combo => combo.trendInfo.direction === 'decreasing').length
              )}
            </div>
            <div className="text-sm text-green-600">Decreasing resistance trends</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">
              {isLoading ? (
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                sparklineData.filter(combo => combo.trendInfo.direction === 'stable').length
              )}
            </div>
            <div className="text-sm text-gray-600">Stable resistance trends</div>
          </div>
        </div>

        {/* Color-Coded Risk Level Legend */}
        <div className="flex justify-center m-[0px] gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#16a34a' }}></div>
            <span className="text-sm text-[12px]">Low Resistance (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }}></div>
            <span className="text-sm text-[12px]">Moderate Resistance (20-39%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }}></div>
            <span className="text-sm text-[12px]">High Resistance (≥40%)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-[0px] border-t border-gray-200 m-[0px]">
          <p className="text-xs text-gray-500 px-[0px] py-[5px]">
            Veterinary priority pathogen-antibiotic resistance trend monitoring • Five-year surveillance data showing resistance percentage changes over time for animal health
            {!isLoading && activeFilters.length > 0 && ` • Filtered view with ${activeFilters.length} active filter${activeFilters.length > 1 ? 's' : ''}`}
            {!isLoading && activeFilters.length === 0 && ` • Showing all veterinary pathogen-antibiotic combinations with available resistance data`}
            {isLoading && ` • ${loadingMessage}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}