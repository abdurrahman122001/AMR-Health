import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlertCircle, Database } from 'lucide-react';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { SearchableSelect } from './SearchableSelect';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface PathogenData {
  pathogen: string;
  total_isolates: number;
  resistant_isolates: number;
  resistance_percentage: number;
}

interface ApiResponse {
  success: boolean;
  pathogens: PathogenData[];
  summary: {
    total_pathogens_in_database: number;
    pathogens_with_min_samples: number;
    top_pathogens_returned: number;
    average_resistance_percentage: number;
    min_isolate_threshold: number;
  };
  totalRecords: number;
  calculationMethod: string;
  error?: string;
}

// Filter interface
interface AnimalFilter {
  type: string;
  value: string;
  label: string;
}

// Animal health filter options (based on verified AMR_Animal table columns)
const animalFilterTypeOptions = [
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
];

// Healthcare alert colors based on resistance levels
const getResistanceColor = (percentage: number): string => {
  if (percentage < 20) return '#10b981'; // Green - Low risk
  if (percentage < 40) return '#f59e0b'; // Yellow/Amber - Medium risk
  return '#ef4444'; // Red - High risk
};

// Custom tooltip for the bar chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Resistance Rate:</span> {data.resistance_percentage}%
        </p>
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Resistant:</span> {data.resistant_isolates.toLocaleString()} isolates
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Total:</span> {data.total_isolates.toLocaleString()} isolates
        </p>
      </div>
    );
  }
  return null;
};

export function AMR_Animal_PathogenResistanceBar() {
  const [data, setData] = useState<PathogenData[]>([]);
  const [summary, setSummary] = useState<ApiResponse['summary'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<string>('');

  // Filter state
  const [activeFilters, setActiveFilters] = useState<AnimalFilter[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [loadingFilterValues, setLoadingFilterValues] = useState<Record<string, boolean>>({});
  const [filterValueErrors, setFilterValueErrors] = useState<Record<string, boolean>>({});

  // State for dynamic filter values
  const [filterValueOptions, setFilterValueOptions] = useState<Record<string, Array<{value: string, label: string}>>>({});

  // Filter helpers
  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeOption = animalFilterTypeOptions.find(opt => opt.value === filterType);
        const valueOption = getFilterValueOptions(filterType).find(opt => opt.value === filterValue);
        
        if (typeOption && valueOption) {
          // Check for duplicate filters
          const existingFilter = activeFilters.find(f => f.type === filterType && f.value === filterValue);
          if (existingFilter) {
            console.log('Filter already exists, skipping:', `${filterType}=${filterValue}`);
            return;
          }
          
          const newFilter: AnimalFilter = {
            type: filterType,
            value: filterValue,
            label: `${typeOption.label}: ${valueOption.label}`
          };
          
          setActiveFilters(prev => [...prev, newFilter]);
          setFilterType('');
          setFilterValue('');
          console.log('Added AMR_Animal filter:', newFilter);
        }
      }
    },
    
    removeFilter: (index: number) => {
      const removedFilter = activeFilters[index];
      setActiveFilters(prev => prev.filter((_, i) => i !== index));
      console.log('Removed AMR_Animal filter:', removedFilter);
    },
    
    clearAllFilters: () => {
      const clearedCount = activeFilters.length;
      setActiveFilters([]);
      console.log(`Cleared all AMR_Animal filters (${clearedCount} filters removed)`);
    }
  };

  // Get filter value options
  const getFilterValueOptions = (columnName: string) => {
    return filterValueOptions[columnName] || [];
  };

  // Load filter values from AMR_Animal table
  useEffect(() => {
    const loadFilterValues = async (columnName: string) => {
      if (loadingFilterValues[columnName] || filterValueOptions[columnName]) return;
      
      try {
        setLoadingFilterValues(prev => ({ ...prev, [columnName]: true }));
        setFilterValueErrors(prev => ({ ...prev, [columnName]: false }));
        
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-filter-values?column=${columnName}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 8000);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch filter values: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load filter values');
        }
        
        setFilterValueOptions(prev => ({
          ...prev,
          [columnName]: data.options
        }));
        
        console.log(`Loaded ${data.options.length} filter values for ${columnName}`);
        
      } catch (error) {
        console.error(`Error loading filter values for ${columnName}:`, error);
        setFilterValueErrors(prev => ({ ...prev, [columnName]: true }));
      } finally {
        setLoadingFilterValues(prev => ({ ...prev, [columnName]: false }));
      }
    };

    if (filterType && !filterValueOptions[filterType] && !loadingFilterValues[filterType]) {
      loadFilterValues(filterType);
    }
  }, [filterType]);

  // Fetch pathogen resistance data
  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching animal pathogen resistance rates...');
        if (activeFilters.length > 0) {
          console.log('Applied filters:', activeFilters);
        }
        
        // Create URL with filters
        let url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-pathogen-resistance-rates`;
        
        // Add filters as query parameters
        if (activeFilters.length > 0) {
          const filterParams = activeFilters.map(filter => 
            `filters=${encodeURIComponent(JSON.stringify({ column: filter.type, value: filter.value }))}`
          ).join('&');
          url += `?${filterParams}`;
        }
        
        // Create a timeout for the fetch request
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse = await response.json();
        console.log('Pathogen resistance data received:', result);

        if (result.success && result.pathogens) {
          setData(result.pathogens);
          setSummary(result.summary);
          setCalculationMethod(result.calculationMethod || 'Unknown');
          console.log(`Loaded ${result.pathogens.length} pathogens`);
        } else {
          throw new Error(result.error || 'Failed to fetch pathogen resistance data');
        }
      } catch (err) {
        console.error('Error fetching pathogen resistance data:', err);
        let errorMessage = 'Unknown error occurred';
        
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            errorMessage = 'Request timeout - server may be slow';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        
        // Fallback data for demo purposes
        const fallbackData: PathogenData[] = [
          { pathogen: 'E. coli', total_isolates: 1250, resistant_isolates: 750, resistance_percentage: 60.0 },
          { pathogen: 'Salmonella spp.', total_isolates: 890, resistant_isolates: 445, resistance_percentage: 50.0 },
          { pathogen: 'S. aureus', total_isolates: 720, resistant_isolates: 324, resistance_percentage: 45.0 },
          { pathogen: 'Campylobacter', total_isolates: 650, resistant_isolates: 260, resistance_percentage: 40.0 },
          { pathogen: 'Enterococcus spp.', total_isolates: 580, resistant_isolates: 203, resistance_percentage: 35.0 }
        ];
        
        setData(fallbackData);
        setSummary({
          total_pathogens_in_database: 15,
          pathogens_with_min_samples: 8,
          top_pathogens_returned: 5,
          average_resistance_percentage: 46.0,
          min_isolate_threshold: 10
        });
        setCalculationMethod('fallback data');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    // Only fetch if we have the required environment variables
    if (projectId && publicAnonKey) {
      // Small delay to debounce rapid filter changes
      const timeoutId = setTimeout(fetchData, 100);
      
      return () => {
        isCancelled = true;
        controller.abort();
        clearTimeout(timeoutId);
      };
    } else {
      console.warn('Missing project configuration for pathogen resistance data fetch');
      setIsLoading(false);
      setError('Configuration incomplete');
    }
  }, [activeFilters]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Animal Health Pathogen Resistance Analysis
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />}
          </CardTitle>
          <p className="text-sm text-gray-600 m-[0px]">
            Resistance rates for animal pathogens with &gt;30 isolates minimum
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading pathogen resistance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Animal Health Pathogen Resistance Analysis
          {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />}
          {error && (
            <AlertCircle className="ml-2 h-4 w-4 text-amber-500 inline" title={`Error: ${error}`} />
          )}
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 m-[0px]">
            Top {data.length} pathogens by % of isolates resistant to ≥1 antibiotic
            {summary && ` (>${summary.min_isolate_threshold} isolates minimum)`} • 
            {activeFilters.length > 0 ? (
              <span className="font-medium text-blue-600 ml-1"> 
                Filtered ({activeFilters.length} filter{activeFilters.length === 1 ? '' : 's'}): {data.reduce((sum, pathogen) => sum + pathogen.total_isolates, 0).toLocaleString()} isolates analyzed
              </span>
            ) : (
              <span className="text-gray-700 ml-1"> {data.reduce((sum, pathogen) => sum + pathogen.total_isolates, 0).toLocaleString()} isolates analyzed</span>
            )}
          </p>
        </div>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <TooltipComponent>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-gray-900 text-sm cursor-help">Filter Veterinary Data:</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dynamic filters from animal health surveillance database</p>
                </TooltipContent>
              </TooltipComponent>
            </div>
            
            {/* Filter Type */}
            <div className="flex-1">
              <SearchableSelect
                value={filterType}
                onValueChange={setFilterType}
                options={animalFilterTypeOptions}
                placeholder="Search filter type..."
                className="w-full text-sm"
                disabled={isLoading}
              />
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <SearchableSelect
                value={filterValue}
                onValueChange={setFilterValue}
                options={getFilterValueOptions(filterType)}
                disabled={!filterType || loadingFilterValues[filterType] || isLoading}
                placeholder={
                  isLoading ? "Loading..." :
                  !filterType ? "Select type first" :
                  loadingFilterValues[filterType] ? "Loading values..." :
                  filterValueErrors[filterType] ? "Error loading values" :
                  "Search value..."
                }
                className="w-full text-sm"
              />
            </div>

            {/* Add Filter Button */}
            <button
              onClick={filterHelpers.addFilter}
              disabled={!filterType || !filterValue || loadingFilterValues[filterType] || filterValueErrors[filterType] || isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="mt-[5px] mr-[0px] mb-[0px] ml-[0px]">
            <div className="flex items-center justify-between mb-[5px] mt-[0px] mr-[0px] ml-[0px]">
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

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span className="text-[12px]">{filter.label}</span>
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
      </CardHeader>
      
      <CardContent className="pt-[0px] pr-[24px] pb-[35px] pl-[24px]">
        {/* Bar Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 30, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="category" 
                dataKey="pathogen"
                tick={{ fontSize: 11, angle: -45, textAnchor: 'end' }}
                height={60}
                interval={0}
              />
              <YAxis 
                type="number" 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="resistance_percentage" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getResistanceColor(entry.resistance_percentage)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Color Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Low Risk (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium Risk (20-39%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>High Risk (≥40%)</span>
          </div>
        </div>

        {/* Summary Statistics - Moved to bottom */}
        {summary && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3 text-center">Analysis Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.top_pathogens_returned}</div>
                <div className="text-xs text-gray-600">Top Pathogens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{summary.average_resistance_percentage}%</div>
                <div className="text-xs text-gray-600">Avg Resistance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.pathogens_with_min_samples}</div>
                <div className="text-xs text-gray-600">With Sufficient Data</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{summary.total_pathogens_in_database}</div>
                <div className="text-xs text-gray-600">Total Pathogens</div>
              </div>
            </div>
          </div>
        )}


      </CardContent>
    </Card>
  );
}