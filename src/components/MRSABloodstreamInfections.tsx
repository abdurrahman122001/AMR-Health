import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, Download } from 'lucide-react';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { SearchableSelect } from './SearchableSelect';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Filter {
  type: string;
  value: string;
  label: string;
}

interface FilterValueOption {
  value: string;
  label: string;
}

interface BloodstreamInfectionData {
  resistant: number;
  total: number;
}

// Filter options for bloodstream infections (focused on relevant demographics and clinical data)
const filterTypeOptions = [
  { value: 'sex', label: 'Sex' },
  { value: 'age_cat', label: 'Age Category' },
  { value: 'pat_type', label: 'Patient Type' },
  { value: 'ward', label: 'Ward' },
  { value: 'institut', label: 'Institution' },
  { value: 'department', label: 'Department' },
  { value: 'ward_type', label: 'Ward Type' },
  { value: 'year_spec', label: 'Year of Specimen' },
  { value: 'year_rep', label: 'Year of Report' },
  { value: 'county', label: 'County' },
  { value: 'district', label: 'District' },
  { value: 'name', label: 'Hospital Name' }
];

export function MRSABloodstreamInfections() {
  // MRSA filter state management
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);

  // Chart data state
  const [data, setData] = useState<BloodstreamInfectionData>({ resistant: 0, total: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic filter value management
  const [filterValueCache, setFilterValueCache] = useState<Record<string, FilterValueOption[]>>({});
  const [loadingFilterValues, setLoadingFilterValues] = useState<Record<string, boolean>>({});
  const [filterValueErrors, setFilterValueErrors] = useState<Record<string, string>>({});

  // Build MRSA filters
  const buildFilters = () => {
    const filters: Record<string, string> = {};
    
    // Add MRSA-specific filters
    activeFilters.forEach(filter => {
      filters[filter.type.toUpperCase()] = filter.value;
    });
    
    return filters;
  };

  // Fetch bloodstream infection data
  const fetchBloodstreamData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching MRSA bloodstream infection data');
      
      // Build URL with filters if provided
      const url = new URL(`https://${projectId}.supabase.co/functions/v1/make-server-2267887d/mrsa-bloodstream-infections`);
      const filters = buildFilters();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'no_filters') {
            url.searchParams.append(key, value);
          }
        });
      }
      
      console.log(`Request URL: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('MRSA BSI response:', responseData);
        
        setData({
          resistant: responseData.resistantCount || 0,
          total: responseData.totalTested || 0
        });
      } else {
        const errorText = await response.text();
        console.error('Error fetching MRSA BSI data:', errorText);
        setError(`Failed to fetch data: ${response.status}`);
      }
    } catch (err) {
      console.error('Network error fetching MRSA BSI data:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unique values for filter dropdowns
  const fetchFilterValues = async (columnName: string) => {
    if (filterValueCache[columnName]) {
      return filterValueCache[columnName];
    }

    try {
      setLoadingFilterValues(prev => ({ ...prev, [columnName]: true }));
      setFilterValueErrors(prev => ({ ...prev, [columnName]: '' }));

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-filter-values?column=${columnName.toUpperCase()}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Sort values alphabetically and create options
      const sortedValues = (data.values || []).sort((a: string, b: string) => {
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
    } catch (err) {
      console.error(`Error fetching filter values for ${columnName}:`, err);
      const errorMessage = err.message || 'Failed to fetch filter values';
      setFilterValueErrors(prev => ({ ...prev, [columnName]: errorMessage }));
      return [];
    } finally {
      setLoadingFilterValues(prev => ({ ...prev, [columnName]: false }));
    }
  };

  const getFilterValueOptions = (type: string) => {
    return filterValueCache[type] || [];
  };

  // Filter helpers
  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeOption = filterTypeOptions.find(opt => opt.value === filterType);
        const valueOption = getFilterValueOptions(filterType).find(opt => opt.value === filterValue);
        
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

  // Load filter values when filter types change
  useEffect(() => {
    if (filterType && !filterValueCache[filterType] && !loadingFilterValues[filterType]) {
      fetchFilterValues(filterType);
    }
  }, [filterType]);

  // Fetch data when filters change
  useEffect(() => {
    fetchBloodstreamData();
  }, [activeFilters]);

  // Calculate metrics
  const calculateResistanceRate = () => {
    if (data.total === 0) return 0;
    return Math.round((data.resistant / data.total) * 100);
  };

  const getAlertLevel = (rate: number) => {
    if (rate < 20) return 'low';
    if (rate < 40) return 'medium';
    return 'high';
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'low': return '#22c55e'; // green-500
      case 'medium': return '#eab308'; // yellow-500
      case 'high': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  };

  const resistanceRate = calculateResistanceRate();
  const alertLevel = getAlertLevel(resistanceRate);
  const alertColor = getAlertColor(alertLevel);

  const chartData = [
    { name: 'Resistant', value: data.resistant, color: alertColor },
    { name: 'Susceptible', value: data.total - data.resistant, color: '#e5e7eb' }
  ];

  return (
    <Card className="mx-[0px] my-[24px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">MRSA Bloodstream Infections</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log('Download MRSA BSI chart data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Proportion of patients with bloodstream infections due to methicillin-resistant S. aureus • Hospital-acquired infection surveillance
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filter Controls */}
        <div className="mt-[0px] bg-gray-50 rounded-lg p-4 border mr-[0px] mb-[24px] ml-[0px]">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <TooltipComponent>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-gray-900 text-sm cursor-help">Filter MRSA BSI Data:</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dynamic filters from AMR_HH table columns for MRSA bloodstream infections</p>
                </TooltipContent>
              </TooltipComponent>
            </div>
            
            {/* Filter Type */}
            <div className="flex-1">
              <SearchableSelect
                value={filterType}
                onValueChange={setFilterType}
                options={filterTypeOptions}
                placeholder="Search filter type..."
                className="w-full text-sm"
              />
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <SearchableSelect
                value={filterValue}
                onValueChange={setFilterValue}
                options={getFilterValueOptions(filterType)}
                disabled={!filterType || loadingFilterValues[filterType]}
                placeholder={
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
              disabled={!filterType || !filterValue || loadingFilterValues[filterType] || filterValueErrors[filterType]}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors whitespace-nowrap"
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
                  className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => filterHelpers.removeFilter(index)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading MRSA bloodstream infection data...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {/* Key Statistics */}


            {/* Chart and Legend Layout */}
            <div className="flex gap-6">
              {/* Main Chart Area */}
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="35%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={180}
                      innerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={1}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <text x="35%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-medium fill-gray-700">
                      MRSA BSI
                    </text>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Count']}
                      labelFormatter={(label) => `${label} Cases`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="lg:col-span-2 space-y-2 my-[25px] mx-[0px] mt-[100px] mr-[0px] mb-[20px] ml-[0px] px-[0px] py-[5px]">
                <h4 className="font-medium mb-4">
                  MRSA Distribution
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Bloodstream Infections)
                  </span>
                </h4>
                <div className="flex items-start justify-between rounded mx-[0px] my-[2px] mt-[0px] mr-[0px] mb-[2px] ml-[0px] px-[8px] py-[4px] bg-gray-50">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 bg-gray-600" />
                    <span className="text-gray-700 text-sm truncate min-w-0">
                      Total BSI S. aureus Isolated Tested
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-sm font-semibold">
                      100%
                    </div>
                    <div className="text-xs text-gray-500">
                      {data.total} isolates
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between rounded mx-[0px] my-[2px] mt-[0px] mr-[0px] mb-[2px] ml-[0px] px-[8px] py-[4px]">
                  <div className="flex items-start gap-3 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: alertColor }}
                    />
                    <span className="text-gray-700 text-sm truncate min-w-0">
                      MRSA Positive Cases
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-sm font-semibold">
                      {resistanceRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {data.resistant} cases
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between rounded mx-[0px] my-[2px] mt-[0px] mr-[0px] mb-[2px] ml-[0px] px-[8px] py-[4px]">
                  <div className="flex items-start gap-3 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 bg-gray-200"
                    />
                    <span className="text-gray-700 text-sm truncate min-w-0">
                      MSSA (Susceptible) Cases
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-sm font-semibold">
                      {(100 - resistanceRate).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {data.total - data.resistant} cases
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Level Indicator */}

          </div>
        )}
      </CardContent>
    </Card>
  );
}