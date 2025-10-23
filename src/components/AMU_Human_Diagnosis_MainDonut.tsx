import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, Table } from 'lucide-react';
import { makeServerRequest } from '../utils/supabase/client';
import { SearchableSelect } from './SearchableSelect';

// Interface definitions
interface DiagnosisDataPoint {
  name: string;
  value: number;
  color: string;
  count: number;
}

interface DiagnosisResponse {
  totalRecords: number;
  data: DiagnosisDataPoint[];
  facilityName: string;
  viewType: string;
  columnQueried: string;
  error?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface Filter {
  type: string;
  value: string;
  label: string;
}

// Custom tooltip for diagnosis chart
const DiagnosisTooltip = ({ active, payload, label }: any) => {
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

export function AMU_Human_Diagnosis_MainDonut() {
  // Data states
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View toggle state
  const [viewType, setViewType] = useState<'diagnosis' | 'site'>('diagnosis');
  const [showTable, setShowTable] = useState(false);

  // Filter states
  const [diagnosisFilterType, setDiagnosisFilterType] = useState('');
  const [diagnosisFilterValue, setDiagnosisFilterValue] = useState('');
  const [diagnosisActiveFilters, setDiagnosisActiveFilters] = useState<Filter[]>([]);

  // Dynamic filter system
  const [filterValueCache, setFilterValueCache] = useState<{ [key: string]: FilterOption[] }>({});
  const [loadingFilterValues, setLoadingFilterValues] = useState<{ [key: string]: boolean }>({});
  const [filterValueErrors, setFilterValueErrors] = useState<{ [key: string]: string }>({});

  // Filter options based on the 21 specific AMU_HH database columns
  const dynamicFilterTypeOptions: FilterOption[] = [
    { value: 'age_cat', label: 'Age Group' },
    { value: 'antimicrobial_name', label: 'Antimicrobial Name' },
    { value: 'atc2', label: 'ATC2 Code' },
    { value: 'atc3', label: 'ATC3 Code' },
    { value: 'atc4', label: 'ATC4 Code' },
    { value: 'atc5', label: 'ATC5 Code' },
    { value: 'aware', label: 'AWaRe Category' },
    { value: 'diagnosis', label: 'Diagnosis' },
    { value: 'diagnosis_site', label: 'Diagnosis Site' },
    { value: 'district', label: 'District' },
    { value: 'activity', label: 'Hospital Activity' },
    { value: 'main_dept', label: 'Hospital Department' },
    { value: 'name', label: 'Hospital Name' },
    { value: 'sub_dept', label: 'Hospital Subdepartment' },
    { value: 'dept_type', label: 'Hospital Subdepartment Type' },
    { value: 'indication', label: 'Indication' },
    { value: 'county', label: 'Region' },
    { value: 'route', label: 'Route of Administration' },
    { value: 'sex', label: 'Sex' },
    { value: 'treatment', label: 'Treatment Approach' },
    { value: 'year_of_survey', label: 'Year of Survey' }
  ];

  // Fetch filter values for a specific column
  const fetchFilterValues = async (columnName: string) => {
    if (filterValueCache[columnName] || loadingFilterValues[columnName]) {
      return filterValueCache[columnName] || [];
    }

    setLoadingFilterValues(prev => ({ ...prev, [columnName]: true }));
    setFilterValueErrors(prev => ({ ...prev, [columnName]: '' }));

    try {
      const data = await makeServerRequest(`amu-filter-values?column=${encodeURIComponent(columnName)}`);
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Sort values alphabetically for consistent ordering
      const sortedValues = [...(data.values || [])].sort((a, b) => {
        if (a === null || a === undefined) return 1;
        if (b === null || b === undefined) return -1;
        return a.toString().localeCompare(b.toString());
      });

      const options: FilterOption[] = sortedValues.map((value: any) => ({
        value: value?.toString() || 'null',
        label: value?.toString() || '(Empty/Null)'
      }));

      // Cache the results
      setFilterValueCache(prev => ({ ...prev, [columnName]: options }));
      
      return options;
    } catch (err: any) {
      console.error(`Error fetching filter values for ${columnName}:`, err);
      const errorMessage = err.message || 'Failed to fetch filter values';
      setFilterValueErrors(prev => ({ ...prev, [columnName]: errorMessage }));
      return [];
    } finally {
      setLoadingFilterValues(prev => ({ ...prev, [columnName]: false }));
    }
  };

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

  // Load filter values when filter type changes
  useEffect(() => {
    if (diagnosisFilterType && !filterValueCache[diagnosisFilterType] && !loadingFilterValues[diagnosisFilterType]) {
      fetchFilterValues(diagnosisFilterType);
    }
  }, [diagnosisFilterType]);

  // Fetch diagnosis data
  const fetchDiagnosisData = async (filters: Filter[] = [], currentViewType: 'diagnosis' | 'site' = viewType) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching diagnosis data with filters:', filters, 'viewType:', currentViewType);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add view type
      params.append('view_type', currentViewType);
      
      // Add active filters as query parameters
      filters.forEach(filter => {
        params.append(filter.type, filter.value);
      });
      
      const queryString = params.toString();
      const endpoint = `amu-diagnosis-profile${queryString ? `?${queryString}` : ''}`;
      
      console.log('Making request to endpoint:', endpoint);
      const data = await makeServerRequest(endpoint);
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Successfully fetched diagnosis data:', data);
      setDiagnosisData(data);
    } catch (err: any) {
      console.error('Error fetching diagnosis data:', err);
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred while fetching diagnosis data';
      setError(errorMessage);
      setDiagnosisData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when filters or view type change
  useEffect(() => {
    fetchDiagnosisData(diagnosisActiveFilters, viewType);
  }, [diagnosisActiveFilters, viewType]);

  // Compute display data
  const computedDiagnosisData = useMemo(() => {
    if (!diagnosisData || loading || error) {
      return {
        chartData: [],
        legendData: [],
        totalPrescriptions: 0,
        hospitalName: 'Loading...'
      };
    }

    return {
      chartData: diagnosisData.data, // All data for chart
      legendData: diagnosisData.data.slice(0, 10), // Top 10 for legend
      totalPrescriptions: diagnosisData.totalRecords,
      hospitalName: diagnosisData.facilityName
    };
  }, [diagnosisData, loading, error]);

  // Filter helper functions
  const diagnosisFilterHelpers = {
    addFilter: () => {
      if (diagnosisFilterType && diagnosisFilterValue && 
          diagnosisFilterValue !== 'loading' && diagnosisFilterValue !== 'error') {
        const typeLabel = dynamicFilterTypeOptions.find(t => t.value === diagnosisFilterType)?.label || diagnosisFilterType;
        const newFilter = {
          type: diagnosisFilterType,
          value: diagnosisFilterValue,
          label: `${typeLabel}: ${diagnosisFilterValue}`
        };
        
        if (!diagnosisActiveFilters.some(f => f.type === diagnosisFilterType && f.value === diagnosisFilterValue)) {
          setDiagnosisActiveFilters([...diagnosisActiveFilters, newFilter]);
        }
        
        setDiagnosisFilterType('');
        setDiagnosisFilterValue('');
      }
    },
    removeFilter: (index: number) => {
      setDiagnosisActiveFilters(diagnosisActiveFilters.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setDiagnosisActiveFilters([]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Diagnosis Profile of Antimicrobial Use</CardTitle>
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
                console.log(`${showTable ? 'Show chart' : 'Show table'} view for diagnosis data`);
              }}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log('Download Diagnosis chart data', diagnosisData);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 m-[0px]">
            Share of Systemic Antibacterial Prescriptions by {viewType === 'site' ? 'Diagnosis Site' : 'Diagnosis'} • 
            {diagnosisActiveFilters.length > 0 ? (
              <span className="font-medium text-blue-600 ml-1"> 
                Filtered ({diagnosisActiveFilters.length} filter{diagnosisActiveFilters.length === 1 ? '' : 's'}): {diagnosisData?.totalRecords?.toLocaleString() || 0} records
              </span>
            ) : (
              <span className="text-gray-700 ml-1"> Total: {diagnosisData?.totalRecords?.toLocaleString() || 0} records</span>
            )}

            {loading && (
              <span className="ml-2 text-gray-500 italic">
                (Updating...)
              </span>
            )}
          </p>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <ToggleGroup 
              type="single" 
              value={viewType} 
              onValueChange={(value) => value && setViewType(value as 'diagnosis' | 'site')}
              className="bg-gray-100 rounded-md p-0.5 h-5"
            >
              <ToggleGroupItem 
                value="diagnosis" 
                className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
              >
                Dx
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="site" 
                className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
              >
                Site
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
                  <h3 className="font-semibold text-gray-900 text-sm cursor-help">Filter Diagnosis Data:</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dynamic filters from AMU_HH table columns (21 available)</p>
                </TooltipContent>
              </TooltipComponent>
            </div>
            
            {/* Filter Type */}
            <div className="flex-1">
              <SearchableSelect
                value={diagnosisFilterType}
                onValueChange={setDiagnosisFilterType}
                options={dynamicFilterTypeOptions}
                placeholder="Search filter type..."
                className="w-full text-sm"
              />
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <SearchableSelect
                value={diagnosisFilterValue}
                onValueChange={setDiagnosisFilterValue}
                options={getFilterValueOptions(diagnosisFilterType)}
                disabled={!diagnosisFilterType || loadingFilterValues[diagnosisFilterType]}
                placeholder={
                  !diagnosisFilterType ? "Select type first" :
                  loadingFilterValues[diagnosisFilterType] ? "Loading values..." :
                  filterValueErrors[diagnosisFilterType] ? "Error loading values" :
                  "Search value..."
                }
                className="w-full text-sm"
              />
            </div>

            {/* Add Filter Button */}
            <button
              onClick={diagnosisFilterHelpers.addFilter}
              disabled={!diagnosisFilterType || !diagnosisFilterValue || 
                        diagnosisFilterValue === 'loading' || diagnosisFilterValue === 'error'}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {diagnosisActiveFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({diagnosisActiveFilters.length})
              </span>
              <button
                onClick={diagnosisFilterHelpers.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {diagnosisActiveFilters.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => diagnosisFilterHelpers.removeFilter(index)}
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
              Unable to load diagnosis distribution data from AMU_HH table. Please check your connection and try again.
            </p>
          </div>
        )}

        {showTable ? (
          /* Table View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {viewType === 'site' ? 'Diagnosis Site' : 'Diagnosis Type'} Distribution Data Table
              </h4>
              <span className="text-sm text-gray-500">
                Showing all {computedDiagnosisData.chartData.length} diagnosis entries
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading diagnosis distribution...</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg">
                <TableComponent>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead className="w-20">Code</TableHead>
                      <TableHead className="flex-1">{viewType === 'site' ? 'Diagnosis Site' : 'Diagnosis Type'}</TableHead>
                      <TableHead className="w-24 text-right">Count</TableHead>
                      <TableHead className="w-24 text-right">Percentage</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computedDiagnosisData.chartData.map((item, index) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium text-gray-500">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.diagnosis_code || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md" title={item.name}>
                            {item.name.length > 200 ? item.name.substring(0, 200) + '...' : item.name}
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
                    ))}
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
                    <p className="text-gray-600">Loading diagnosis distribution...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={computedDiagnosisData.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={100}
                      outerRadius={180}
                      paddingAngle={1}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={1}
                    >
                      {computedDiagnosisData.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DiagnosisTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            <div className="lg:col-span-2 space-y-2 my-[25px] mx-[0px] mt-[25px] mr-[0px] mb-[20px] ml-[0px] px-[0px] py-[5px]">
              <h4 className="font-medium text-[14px] mx-[0px] mt-[10px] mr-[0px] mb-[5px] ml-[0px]">
                {viewType === 'site' ? 'Diagnosis Site' : 'Diagnosis Type'}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Top 10 shown)
                </span>
              </h4>
              {loading ? (
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
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
                computedDiagnosisData.legendData.map((entry, index) => {
                  // Helper function to abbreviate diagnosis names
                  const abbreviateName = (name: string) => {
                    if (name.length <= 40) return name;
                    
                    // Common medical abbreviations
                    const abbreviations: Record<string, string> = {
                      'infection': 'inf.',
                      'respiratory': 'resp.',
                      'urinary tract': 'UTI',
                      'gastrointestinal': 'GI',
                      'skin and soft tissue': 'SSTI',
                      'post-operative': 'post-op',
                      'intra-abdominal': 'intra-abd',
                      'meningitis': 'mening.',
                      'bone and joint': 'bone/joint',
                      'central nervous system': 'CNS',
                      'bloodstream': 'BSI',
                      'sepsis': 'sepsis',
                      'bacteremia': 'bact.',
                      'pneumonia': 'pneum.'
                    };
                    
                    let abbreviated = name;
                    Object.entries(abbreviations).forEach(([full, abbr]) => {
                      abbreviated = abbreviated.replace(new RegExp(full, 'gi'), abbr);
                    });
                    
                    // If still too long, truncate with ellipsis
                    if (abbreviated.length > 40) {
                      abbreviated = abbreviated.substring(0, 34) + '...';
                    }
                    
                    return abbreviated;
                  };

                  return (
                    <div key={entry.name} className="flex items-start justify-between rounded mx-[0px] my-[2px] mt-[0px] mr-[0px] mb-[2px] ml-[0px] px-[8px] py-[4px]">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span 
                          className="text-gray-700 text-sm truncate text-[13px]"
                          title={entry.name}
                        >
                          {abbreviateName(entry.name)}
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
        
        {/* Footnote */}
        <div className="mt-[30px] pt-4 border-t border-gray-200 mr-[0px] mb-[0px] ml-[0px]">
          <p className="text-xs text-gray-500">
            PPS data; excludes topical antibacterials and anti-TB drugs. Showing {viewType === 'site' ? 'diagnosis site' : 'diagnosis type'} distribution from AMU_HH table.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}