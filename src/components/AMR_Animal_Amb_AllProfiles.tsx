import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from './ui/utils';
import { SearchableSelect } from './SearchableSelect';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { projectId, publicAnonKey } from '../utils/supabase/info';

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

// Filter interface
interface AnimalFilter {
  type: string;
  value: string;
  label: string;
}

interface AnimalAntibioticProfile {
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

interface AMRAnimalAntibioticProfilesResponse {
  profiles: AnimalAntibioticProfile[];
  totalAntibiotics: number;
  dataSource: string;
  tableName: string;
  timestamp: string;
  filtersApplied: Record<string, string>;
}




export function AMR_Animal_Amb_AllProfiles() {
  const [data, setData] = useState<AnimalAntibioticProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading animal health data...');
  
  // Filter state
  const [activeFilters, setActiveFilters] = useState<AnimalFilter[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [loadingFilterValues, setLoadingFilterValues] = useState<Record<string, boolean>>({});
  const [filterValueErrors, setFilterValueErrors] = useState<Record<string, boolean>>({});
  const [isDataFiltered, setIsDataFiltered] = useState<boolean>(false);

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

  // State for dynamic filter values
  const [filterValueOptions, setFilterValueOptions] = useState<Record<string, Array<{value: string, label: string}>>>({});

  // Load filter values from AMR_Animal table
  useEffect(() => {
    const loadFilterValues = async (columnName: string) => {
      if (loadingFilterValues[columnName] || filterValueOptions[columnName]) return;
      
      try {
        setLoadingFilterValues(prev => ({ ...prev, [columnName]: true }));
        setFilterValueErrors(prev => ({ ...prev, [columnName]: false }));
        
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-filter-values?column=${columnName}`;
        
        // Add timeout to filter value requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 10000); // 8 second timeout
        
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
        
        console.log(`Loaded ${data.options.length} values for ${columnName}`);
        
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`Filter values request cancelled for ${columnName}`);
          return;
        }
        console.error(`Error loading filter values for ${columnName}:`, error);
        setFilterValueErrors(prev => ({ ...prev, [columnName]: true }));
        // Set empty array as fallback
        setFilterValueOptions(prev => ({ ...prev, [columnName]: [] }));
      } finally {
        setLoadingFilterValues(prev => ({ ...prev, [columnName]: false }));
      }
    };
    
    // Load values when filterType changes
    if (filterType && !filterValueOptions[filterType]) {
      loadFilterValues(filterType);
    }
  }, [filterType]);

  // Get filter value options for animal health
  const getFilterValueOptions = (type: string) => {
    return filterValueOptions[type] || [];
  };

  // Load real S/I/R data from AMR_Animal database
  const loadAntibioticProfiles = async () => {
    setLoading(true);
    setError(null);
    
    // Set appropriate loading message based on filters
    if (activeFilters.length > 0) {
      setLoadingMessage(`Applying ${activeFilters.length} filter(s) to AMR_Animal S/I/R data...`);
    } else {
      setLoadingMessage('Loading real AMR_Animal S/I/R distribution data...');
    }
    
    try {
      console.log('Fetching real AMR_Animal antibiotic S/I/R data...');
      console.log('Active filters:', activeFilters);
      
      // Build URL with filters
      let url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-sir-distribution`;
      
      // Add filter parameters if active filters exist
      if (activeFilters.length > 0) {
        const filterParams = new URLSearchParams();
        activeFilters.forEach(filter => {
          filterParams.append(`filter_${filter.type}`, filter.value);
        });
        url += `?${filterParams.toString()}`;
        console.log('Request URL with filters:', url);
      } else {
        console.log('Request URL (no filters):', url);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000); // 15 second timeout

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
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Received AMR_Animal S/I/R data:', responseData);
      
      // Log the structure of the first profile to verify data format
      if (responseData.profiles && responseData.profiles.length > 0) {
        console.log('First profile structure:', responseData.profiles[0]);
        console.log('Profile keys:', Object.keys(responseData.profiles[0]));
      }

      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to fetch S/I/R distribution data');
      }

      const realData = responseData.profiles || [];
      
      // Log filtering information from backend
      if (responseData.filtersApplied) {
        console.log('Filters applied by backend:', responseData.filtersApplied);
      }
      if (responseData.totalRecordsBeforeFilter !== undefined && responseData.totalRecordsAfterFilter !== undefined) {
        console.log(`Backend filtering: ${responseData.totalRecordsBeforeFilter} → ${responseData.totalRecordsAfterFilter} records`);
      }
      
      if (!realData || realData.length === 0) {
        if (activeFilters.length > 0) {
          setError(`No antibiotic data found matching the applied filters. Try removing some filters or selecting different values.`);
        } else {
          setError('No antibiotic data found in AMR_Animal database');
        }
        setLoading(false);
        return;
      }
      
      // Apply additional frontend risk level filters if needed (these should ideally be handled by backend)
      let filteredData = realData;
      const riskFilter = activeFilters.find(f => f.type === 'riskLevel');
      if (riskFilter) {
        console.log('Applying frontend risk level filter:', riskFilter.value);
        const beforeCount = filteredData.length;
        filteredData = realData.filter(profile => {
          const resistance = profile.resistant.percentage;
          switch (riskFilter.value) {
            case 'low': return resistance < 20;
            case 'moderate': return resistance >= 20 && resistance < 40;
            case 'high': return resistance >= 40;
            default: return true;
          }
        });
        console.log(`Risk level filter: ${beforeCount} → ${filteredData.length} antibiotics`);
      }
      
      // Sort antibiotics alphabetically by name
      const sortedProfiles = filteredData.sort((a, b) => a.antibiotic.localeCompare(b.antibiotic));
      
      console.log(`Successfully loaded ${sortedProfiles.length} antibiotics with S/I/R data from AMR_Animal database`);
      
      // Log sample of processed data for verification
      if (sortedProfiles.length > 0) {
        console.log('Sample of processed data (first 2 profiles):', sortedProfiles.slice(0, 2));
      }
      
      setData(sortedProfiles);
      setIsDataFiltered(activeFilters.length > 0);
      
      // Set descriptive loading message based on filter state
      if (activeFilters.length > 0) {
        setLoadingMessage(`Loaded ${sortedProfiles.length} antibiotics (filtered by ${activeFilters.length} criteria) from AMR_Animal database`);
      } else {
        setLoadingMessage(`Loaded ${sortedProfiles.length} antibiotics from real AMR_Animal database`);
      }
      
    } catch (error) {
      console.error('Error loading AMR_Animal antibiotic profiles:', error);
      if (error.name === 'AbortError') {
        if (activeFilters.length > 0) {
          setError('Request timeout while applying filters - please try again or remove some filters');
        } else {
          setError('Request timeout - please try again');
        }
      } else {
        if (activeFilters.length > 0) {
          setError(`Failed to load filtered S/I/R data: ${error.message}. Try removing some filters.`);
        } else {
          setError(`Failed to load real S/I/R data: ${error.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadAntibioticProfiles().catch(err => {
      console.error('Failed to load antibiotic profiles:', err);
      setError(`Failed to load antibiotic data: ${err.message}`);
      setLoading(false);
    });
  }, [activeFilters]);

  // Prepare data for stacked vertical bar chart with validation
  const chartData = data.map((profile, index) => {
    // Log profile structure for debugging
    if (index === 0) {
      console.log('Processing chart data - first profile:', profile);
    }
    
    // Validate data structure and provide fallbacks
    const safeParsing = {
      antibiotic: profile.antibiotic || profile.antimicrobial_name || profile.name || 'Unknown',
      antibioticCode: profile.antibioticCode || profile.antimicrobial_code || profile.code || profile.antibiotic?.substring(0, 3) || 'UNK',
      totalTested: profile.totalTested || profile.total_tested || profile.total || 0,
      
      // Handle different possible response structures for S/I/R data
      'Susceptible': profile.susceptible?.percentage ?? profile.susceptible_percentage ?? profile.s_percentage ?? 0,
      'Intermediate': profile.intermediate?.percentage ?? profile.intermediate_percentage ?? profile.i_percentage ?? 0,
      'Resistant': profile.resistant?.percentage ?? profile.resistant_percentage ?? profile.r_percentage ?? 0,
      
      // Additional data for tooltips with fallbacks
      susceptibleCount: profile.susceptible?.count ?? profile.susceptible_count ?? profile.s_count ?? 0,
      intermediateCount: profile.intermediate?.count ?? profile.intermediate_count ?? profile.i_count ?? 0,
      resistantCount: profile.resistant?.count ?? profile.resistant_count ?? profile.r_count ?? 0
    };
    
    // Log any data inconsistencies
    if (safeParsing.totalTested === 0) {
      console.warn('Profile with zero total tested:', profile);
    }
    
    return safeParsing;
  });
  
  // Log processed chart data for verification
  if (chartData.length > 0) {
    console.log('Chart data sample (first profile):', chartData[0]);
    console.log(`Generated chart data for ${chartData.length} antibiotics`);
    
    // Validate that we have meaningful data
    const firstProfile = chartData[0];
    const totalPercentages = firstProfile['Susceptible'] + firstProfile['Intermediate'] + firstProfile['Resistant'];
    
    if (Math.abs(totalPercentages - 100) > 1) {
      console.warn(`Percentages do not sum to 100%: ${totalPercentages}% for profile: ${firstProfile.antibiotic}`);
    }
    
    // Check for zero counts
    if (firstProfile.totalTested === 0) {
      console.warn('First profile has zero total tested:', firstProfile);
    }
    
    // Log total tested counts for validation
    const totalCounts = chartData.map(p => p.totalTested);
    console.log('Total tested counts:', totalCounts.slice(0, 5), '...');
    
    // Check if any profiles have placeholder/mock data
    const suspiciousProfiles = chartData.filter(p => 
      p.antibiotic === 'Unknown' || 
      p.antibioticCode === 'UNK' || 
      (p.totalTested === 0 && (p['Susceptible'] > 0 || p['Intermediate'] > 0 || p['Resistant'] > 0))
    );
    
    if (suspiciousProfiles.length > 0) {
      console.warn('Found suspicious/placeholder profiles:', suspiciousProfiles);
    }
  } else {
    console.warn('No chart data generated - this will result in empty chart');
  }

  // Colors following healthcare standards
  const colors = {
    'Susceptible': '#22c55e',    // Green for susceptible
    'Intermediate': '#eab308',   // Yellow for intermediate  
    'Resistant': '#ef4444'       // Red for resistant
  };

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Ensure we have valid data
      const validatedData = {
        antibiotic: data.antibiotic || 'Unknown Antibiotic',
        totalTested: data.totalTested || 0,
        susceptibleCount: data.susceptibleCount || 0,
        intermediateCount: data.intermediateCount || 0,
        resistantCount: data.resistantCount || 0
      };
      
      // Calculate total from individual counts for validation
      const calculatedTotal = validatedData.susceptibleCount + validatedData.intermediateCount + validatedData.resistantCount;
      const displayTotal = validatedData.totalTested || calculatedTotal;
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{validatedData.antibiotic}</p>
          <p className="text-sm mb-1">
            Total Tested: {displayTotal.toLocaleString()}
            {isDataFiltered && (
              <span className="text-blue-600 text-xs"> • Filtered data</span>
            )}
            {calculatedTotal !== validatedData.totalTested && validatedData.totalTested > 0 && (
              <span className="text-orange-500 text-xs"> • Calculated: {calculatedTotal}</span>
            )}
          </p>
          {payload.map((entry: any, index: number) => {
            const percentage = typeof entry.value === 'number' ? entry.value : 0;
            let count = 0;
            
            // Get the actual count for this category
            if (entry.dataKey === 'Susceptible') count = validatedData.susceptibleCount;
            else if (entry.dataKey === 'Intermediate') count = validatedData.intermediateCount;
            else if (entry.dataKey === 'Resistant') count = validatedData.resistantCount;
            
            return (
              <div key={index} className="text-sm">
                <span style={{ color: entry.color }}>● </span>
                {entry.dataKey}: {percentage.toFixed(1)}% ({count.toLocaleString()})
              </div>
            );
          })}
          {isDataFiltered && activeFilters.length > 0 && (
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
              Active filters: {activeFilters.map(f => f.label).join(', ')}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Animal Health Antibiotic Profiles</CardTitle>
        </CardHeader>
        <CardContent className="pt-[0px] pr-[24px] pb-[24px] pl-[24px]">
          <div className="w-full h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">{loadingMessage}</p>
              <p className="text-xs text-muted-foreground mt-1">Processing 11 priority veterinary antibiotics across multiple species...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Animal Health Antibiotic Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600 mb-2">Error loading data</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show no data state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Animal Health Antibiotic Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No veterinary antibiotic resistance data available</p>
              <p className="text-xs text-muted-foreground">for the selected filters</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pt-[20px] pr-[24px] pb-[0px] pl-[24px]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            Susceptibility Testing Profiles of Veterinary Antimicrobials
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log('Download animal antibiotic profile data');
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px] text-[13px] font-bold font-normal">
          Susceptible/Intermediate/Resistant distribution for {loading ? '—' : data.length} veterinary antibiotics
          {activeFilters.length > 0 && !loading && (
            <span className="text-blue-600"> • Filtered by {activeFilters.length} criteria</span>
          )}
          {!loading && <span> • Real data from AMR_Animal database</span>}
        </p>
        
        {/* Filter Controls */}
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
                disabled={loading}
              />
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <SearchableSelect
                value={filterValue}
                onValueChange={setFilterValue}
                options={getFilterValueOptions(filterType)}
                disabled={!filterType || loadingFilterValues[filterType] || loading}
                placeholder={
                  loading ? "Loading..." :
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
              disabled={!filterType || !filterValue || loadingFilterValues[filterType] || filterValueErrors[filterType] || loading}
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
                disabled={loading}
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
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="w-full">
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
          
          <div className="h-[350px] mt-[0px] mr-[0px] mb-[10px] ml-[0px] relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">{loadingMessage}</p>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 10,
                  left: 10,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="antibioticCode"
                  angle={0}
                  textAnchor="middle"
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
          </div>
          
        </div>

        {/* Summary Cards */}
        <div className="mt-[0px] grid grid-cols-4 gap-2 mr-[0px] mb-[16px] ml-[0px]">
          {/* Total Antibiotics Card */}
          <Card className="p-2 relative">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  data.length
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-600">Veterinary Drugs</div>
                <div className="text-[10px] text-gray-500">with resistance data</div>
              </div>
            </div>
          </Card>

          {/* Low Resistance Card */}
          <Card className="p-2 border-green-200 bg-green-50 relative">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-green-700">
                {loading ? (
                  <div className="w-8 h-6 bg-green-200 rounded animate-pulse"></div>
                ) : (
                  data.filter(profile => profile.resistant.percentage < 20).length
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs text-green-700">Low Resistance Profiles</div>
                <div className="text-[10px] text-green-600">&lt;20% resistant</div>
              </div>
            </div>
          </Card>

          {/* Moderate Resistance Card */}
          <Card className="p-2 border-yellow-200 bg-yellow-50 relative">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-yellow-700">
                {loading ? (
                  <div className="w-8 h-6 bg-yellow-200 rounded animate-pulse"></div>
                ) : (
                  data.filter(profile => profile.resistant.percentage >= 20 && profile.resistant.percentage < 40).length
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs text-yellow-700">Moderate Resistance Profiles</div>
                <div className="text-[10px] text-yellow-600">20-39% resistant</div>
              </div>
            </div>
          </Card>

          {/* High Resistance Card */}
          <Card className="p-2 border-red-200 bg-red-50 relative">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-red-700">
                {loading ? (
                  <div className="w-8 h-6 bg-red-200 rounded animate-pulse"></div>
                ) : (
                  data.filter(profile => profile.resistant.percentage >= 40).length
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs text-red-700">High Resistance Profiles</div>
                <div className="text-[10px] text-red-600">≥40% resistant</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 m-[0px]">
          <p className="text-xs text-gray-500">
            Real AMR_Animal database analysis • S/I/R distribution across {loading ? '—' : data.length} veterinary antibiotics with valid AST results
            {!loading && activeFilters.length > 0 && ` • Filtered view with ${activeFilters.length} active filter${activeFilters.length > 1 ? 's' : ''}`}
            {!loading && activeFilters.length === 0 && ` • All antibiotics with ≥1 valid susceptibility test`}
            {loading && ` • ${loadingMessage}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}