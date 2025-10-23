import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, ToggleLeft, ToggleRight, Table } from 'lucide-react';
import { makeServerRequest } from '../utils/supabase/client';
import { getIndicationName } from '../utils/indicationNames';
import { SearchableSelect } from './SearchableSelect';

// Interface definitions
interface IndicationDataPoint {
  name: string;
  value: number;
  color: string;
  count: number;
}

interface IndicationResponse {
  totalRecords: number;
  data: IndicationDataPoint[];
  viewMode: string;
  dataSource: string;
  tableName?: string;
  timestamp?: string;
  error?: string;
}

interface FilterOption {
  value: string;
  label: string;
}



// Custom tooltip for indication chart
const IndicationTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
        <div className="text-black font-medium text-sm mb-1">
          {data.name}
        </div>
        <div className="text-gray-600 text-sm mb-1">
          {data.count.toLocaleString()} prescriptions
        </div>
        <div className="text-cyan-600 font-medium text-sm">
          {data.value}% of total
        </div>
      </div>
    );
  }
  return null;
};

export function AMU_Human_Indication_MainDonut() {
  // Database state management
  const [indicationData, setIndicationData] = useState<IndicationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'main' | 'sub'>('sub'); // Default to sub-categories
  const [showTable, setShowTable] = useState(false);
  
  // Filter system for indication chart
  const [indicationFilterType, setIndicationFilterType] = useState('');
  const [indicationFilterValue, setIndicationFilterValue] = useState('');
  const [indicationActiveFilters, setIndicationActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);
  
  // Dynamic filter value management
  const [filterValueCache, setFilterValueCache] = useState<Record<string, FilterOption[]>>({});
  const [loadingFilterValues, setLoadingFilterValues] = useState<Record<string, boolean>>({});
  const [filterValueErrors, setFilterValueErrors] = useState<Record<string, string>>({});

  // Dynamic filter options - restricted to 21 validated AMU_HH table columns
  const dynamicFilterTypeOptions: FilterOption[] = [
    { value: 'activity', label: 'Hospital Activity' },
    { value: 'age_cat', label: 'Age Group' },
    { value: 'antimicrobial_name', label: 'Antimicrobial Name' },
    { value: 'atc2', label: 'ATC2 Code' },
    { value: 'atc3', label: 'ATC3 Code' },
    { value: 'atc4', label: 'ATC4 Code' },
    { value: 'atc5', label: 'ATC5 Code' },
    { value: 'aware', label: 'AWaRe Category' },
    { value: 'county', label: 'Region' },
    { value: 'dept_type', label: 'Hospital Subdepartment Type' },
    { value: 'diagnosis', label: 'Diagnosis' },
    { value: 'diagnosis_site', label: 'Diagnosis Site' },
    { value: 'district', label: 'District' },
    { value: 'indication', label: 'Indication' },
    { value: 'main_dept', label: 'Hospital Department' },
    { value: 'name', label: 'Hospital Name' },
    { value: 'route', label: 'Route of Administration' },
    { value: 'sex', label: 'Sex' },
    { value: 'sub_dept', label: 'Hospital Subdepartment' },
    { value: 'treatment', label: 'Treatment Approach' },
    { value: 'year_of_survey', label: 'Year of Survey' }
  ];

  // Fetch unique values for a specific column from AMU_HH table
  const fetchFilterValues = async (columnName: string) => {
    if (filterValueCache[columnName]) {
      return filterValueCache[columnName];
    }

    try {
      setLoadingFilterValues(prev => ({ ...prev, [columnName]: true }));
      setFilterValueErrors(prev => ({ ...prev, [columnName]: '' }));

      console.log(`Fetching unique values for column: ${columnName}`);
      const data = await makeServerRequest(`amu-filter-values?column=${columnName}`);

      if (data.error) {
        throw new Error(data.error);
      }

      const options = data.values?.map((value: string) => ({
        value: value,
        label: value || '(Empty)'
      })) || [];

      console.log(`Got ${options.length} unique values for ${columnName}`);
      setFilterValueCache(prev => ({ ...prev, [columnName]: options }));
      return options;

    } catch (error) {
      console.error(`Error fetching filter values for ${columnName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setFilterValueErrors(prev => ({ ...prev, [columnName]: errorMessage }));
      return [];
    } finally {
      setLoadingFilterValues(prev => ({ ...prev, [columnName]: false }));
    }
  };

  // Fetch indication data from server
  const fetchIndicationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching indication data with filters:', indicationActiveFilters);
      console.log('View mode:', viewMode);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('viewMode', viewMode);
      
      // Add active filters as query parameters
      indicationActiveFilters.forEach(filter => {
        params.append(filter.type, filter.value);
      });
      
      const queryString = params.toString();
      const endpoint = `amu-indication-data${queryString ? `?${queryString}` : ''}`;
      
      console.log('Making request to:', endpoint);
      const data = await makeServerRequest(endpoint);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('Received indication data:', data);
      setIndicationData(data);
      
    } catch (error) {
      console.error('Error fetching indication data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setIndicationData(null);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data and reload when filters or view mode change
  useEffect(() => {
    fetchIndicationData();
  }, [indicationActiveFilters, viewMode]);

  // Load filter values when filter type changes
  useEffect(() => {
    if (indicationFilterType && !filterValueCache[indicationFilterType] && !loadingFilterValues[indicationFilterType]) {
      fetchFilterValues(indicationFilterType);
    }
  }, [indicationFilterType]);

  // Compute data and totals based on real database data
  const computedIndicationData = useMemo(() => {
    if (!indicationData || loading || error) {
      return {
        data: [],
        totalPrescriptions: 0,
        facilityName: 'Loading...',
        viewMode: viewMode
      };
    }

    // Check if specific facility is selected
    const facilityFilter = indicationActiveFilters.find(filter => filter.type === 'name');
    const facilityName = facilityFilter ? facilityFilter.value : 'All Facilities';

    return {
      data: indicationData.data || [],
      totalPrescriptions: indicationData.totalRecords || 0,
      facilityName: facilityName,
      viewMode: indicationData.viewMode || viewMode
    };
  }, [indicationData, indicationActiveFilters, loading, error, viewMode]);

  const getFilterValueOptions = (filterType: string) => {
    if (!filterType) return [];
    
    if (loadingFilterValues[filterType]) {
      return [{ value: 'loading', label: 'Loading...' }];
    }
    
    if (filterValueErrors[filterType]) {
      return [{ value: 'error', label: 'Error loading values' }];
    }
    
    return filterValueCache[filterType] || [];
  };

  const indicationFilterHelpers = {
    addFilter: () => {
      if (indicationFilterType && indicationFilterValue && 
          indicationFilterValue !== 'loading' && indicationFilterValue !== 'error') {
        const typeLabel = dynamicFilterTypeOptions.find(t => t.value === indicationFilterType)?.label || indicationFilterType;
        const newFilter = {
          type: indicationFilterType,
          value: indicationFilterValue,
          label: `${typeLabel}: ${indicationFilterValue}`
        };
        
        if (!indicationActiveFilters.some(f => f.type === indicationFilterType && f.value === indicationFilterValue)) {
          setIndicationActiveFilters([...indicationActiveFilters, newFilter]);
        }
        
        setIndicationFilterType('');
        setIndicationFilterValue('');
      }
    },
    removeFilter: (index: number) => {
      setIndicationActiveFilters(indicationActiveFilters.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setIndicationActiveFilters([]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Indication Profile of Antimicrobial Use</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 px-[5px] py-[0px] ${
                showTable 
                  ? 'text-blue-600 bg-blue-50 hover:text-blue-700 hover:bg-blue-100' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => {
                setShowTable(!showTable);
                console.log(`${showTable ? 'Show chart' : 'Show table'} view for indication data`);
              }}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                // Add download functionality here
                console.log('Download Indication chart data', indicationData);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 m-[0px]">
            Distribution of Antimicrobial Prescriptions by Indication Type • 
            {indicationActiveFilters.length > 0 ? (
              <span className="font-medium text-blue-600 ml-1"> 
                Filtered ({indicationActiveFilters.length} filter{indicationActiveFilters.length === 1 ? '' : 's'}): {indicationData?.totalRecords?.toLocaleString() || 0} records
              </span>
            ) : (
              <span className="text-gray-700 ml-1"> Total: {indicationData?.totalRecords?.toLocaleString() || 0} records</span>
            )}

            {loading && (
              <span className="ml-2 text-gray-500 italic">
                (Updating...)
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value) => value && setViewMode(value)}
              className="bg-gray-100 rounded-md p-0.5 h-5"
            >
              <ToggleGroupItem 
                value="main" 
                className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
              >
                Main
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="sub" 
                className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
              >
                Sub
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <TooltipComponent>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-gray-900 text-sm cursor-help">Filter Indication Data:</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dynamic filters from AMU_HH table columns (21 available)</p>
                </TooltipContent>
              </TooltipComponent>
            </div>
            
            {/* Filter Type */}
            <div className="flex-1">
              <SearchableSelect
                value={indicationFilterType}
                onValueChange={setIndicationFilterType}
                options={dynamicFilterTypeOptions}
                placeholder="Search filter type..."
                className="w-full text-sm"
              />
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <SearchableSelect
                value={indicationFilterValue}
                onValueChange={setIndicationFilterValue}
                options={getFilterValueOptions(indicationFilterType)}
                disabled={!indicationFilterType || loadingFilterValues[indicationFilterType]}
                placeholder={
                  !indicationFilterType ? "Select type first" :
                  loadingFilterValues[indicationFilterType] ? "Loading values..." :
                  filterValueErrors[indicationFilterType] ? "Error loading values" :
                  "Search value..."
                }
                className="w-full text-sm"
              />
            </div>

            {/* Add Filter Button */}
            <button
              onClick={indicationFilterHelpers.addFilter}
              disabled={!indicationFilterType || !indicationFilterValue || 
                        indicationFilterValue === 'loading' || indicationFilterValue === 'error'}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {indicationActiveFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({indicationActiveFilters.length})
              </span>
              <button
                onClick={indicationFilterHelpers.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {indicationActiveFilters.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => indicationFilterHelpers.removeFilter(index)}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
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
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">
              <strong>⚠️ Data Error:</strong> {error}
            </p>
            <p className="text-red-600 text-xs mt-1">
              Unable to load indication distribution data from AMU_HH table. Please check your connection and try again.
            </p>
          </div>
        )}
        
        {showTable ? (
          /* Table View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Indication Distribution Data Table
              </h4>
              <span className="text-sm text-gray-500">
                Showing all {computedIndicationData.data.length} indication entries
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading indication distribution...</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg">
                <TableComponent>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead className="w-20">Code</TableHead>
                      <TableHead className="flex-1">Indication Name</TableHead>
                      <TableHead className="w-24 text-right">Count</TableHead>
                      <TableHead className="w-24 text-right">Percentage</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computedIndicationData.data
                      .sort((a, b) => {
                        const codeA = a.name.split(' ')[0];
                        const codeB = b.name.split(' ')[0];
                        return codeA.localeCompare(codeB);
                      })
                      .map((item, index) => {
                        const parts = item.name.split(' ');
                        const code = parts[0];
                        return (
                          <TableRow key={item.name}>
                            <TableCell className="font-medium text-gray-500">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {code}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-md">
                                {getIndicationName(code)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {item.count.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {item.value.toFixed(1)}%
                            </TableCell>
                            <TableCell>
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </TableComponent>
              </div>
            )}
          </div>
        ) : (
          /* Chart View */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Main Chart Area */}
            <div className="lg:col-span-3 flex justify-center">
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading indication distribution...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={computedIndicationData.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={100}
                      outerRadius={180}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {computedIndicationData.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<IndicationTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            <div className="lg:col-span-2 space-y-2 my-[25px] mx-[0px] mt-[25px] mr-[0px] mb-[20px] ml-[0px] px-[0px] py-[5px]">
              <h4 className="font-medium mb-[10px] text-[14px] mt-[0px] mr-[0px] ml-[0px]">
                {viewMode === 'main' ? 'Main Categories' : 'Detailed Indications'}
                {viewMode === 'sub' && computedIndicationData.data.length > 10 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Top 10 shown)
                  </span>
                )}
              </h4>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start justify-between rounded mx-[0px] my-[2px] mt-[0px] mr-[0px] mb-[2px] ml-[0px] px-[8px] py-[4px]">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 bg-gray-200 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              ) : (
                (viewMode === 'main' ? computedIndicationData.data : computedIndicationData.data.slice(0, 10))
                  .sort((a, b) => {
                    const codeA = a.name.split(' ')[0];
                    const codeB = b.name.split(' ')[0];
                    return codeA.localeCompare(codeB);
                  })
                  .map((entry, index) => {
                    const parts = entry.name.split(' ');
                    const code = parts[0];
                    
                    return (
                      <div key={entry.name} className="flex items-start justify-between rounded mx-[0px] my-[2px] mt-[0px] mr-[0px] mb-[2px] ml-[0px] px-[8px] py-[4px]">
                        <div className="flex items-start gap-3 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-gray-700 text-sm truncate min-w-0 text-[13px]">
                            <span className="font-mono">{code}</span> {getIndicationName(code).substring(0, 40)}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-sm font-semibold">
                            {entry.value.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
        
        {!loading && !error && computedIndicationData.data.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-600 mb-2">No indication data found</div>
            <div className="text-sm text-gray-500">
              Try adjusting your filters or check if data exists for the selected criteria.
            </div>
          </div>
        )}
        
        {/* Footnote */}
        <div className="mt-[30px] pt-4 border-t border-gray-200 mr-[0px] mb-[0px] ml-[0px]">
          <p className="text-xs text-gray-500">
            PPS data; excludes topical antibacterials and anti-TB drugs. 
            {viewMode === 'main' 
              ? ' Data aggregated into 6 main indication categories (CAI, HAI, SP, MP, OTH, UNK).'
              : ' Showing detailed sub-category breakdown from AMU_HH table.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}