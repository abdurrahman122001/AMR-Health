import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, Table } from 'lucide-react';
import { makeServerRequest } from '../utils/supabase/client';
import { SearchableSelect } from './SearchableSelect';

// Interface definitions
interface ProphylaxisDataPoint {
  name: string;
  value: number;
  color: string;
  count: number;
}

interface ProphylaxisResponse {
  totalRecords: number;
  shareData: ProphylaxisDataPoint[];
  typeData: ProphylaxisDataPoint[];
  facilityName: string;
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

// Custom tooltip for prophylaxis charts
const ProphylaxisTooltip = ({ active, payload, label, isShare = true }: any) => {
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
          {data.value}% of {isShare ? 'total' : 'prophylaxis'}
        </div>
      </div>
    );
  }
  return null;
};

export function AMU_Human_Prophylaxis_MainDonut() {
  // Data states
  const [prophylaxisData, setProphylaxisData] = useState<ProphylaxisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  // Filter states
  const [prophylaxisDonutFilterType, setProphylaxisDonutFilterType] = useState('');
  const [prophylaxisDonutFilterValue, setProphylaxisDonutFilterValue] = useState('');
  const [prophylaxisDonutActiveFilters, setProphylaxisDonutActiveFilters] = useState<Filter[]>([]);

  // Dynamic filter system
  const [filterValueCache, setFilterValueCache] = useState<{ [key: string]: FilterOption[] }>({});
  const [loadingFilterValues, setLoadingFilterValues] = useState<{ [key: string]: boolean }>({});
  const [filterValueErrors, setFilterValueErrors] = useState<{ [key: string]: string }>({});

  // Filter options based on server-validated AMU_HH database columns (21 available)
  const dynamicFilterTypeOptions: FilterOption[] = [
    { value: 'activity', label: 'Hospital Activity' },
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
    if (prophylaxisDonutFilterType && !filterValueCache[prophylaxisDonutFilterType] && !loadingFilterValues[prophylaxisDonutFilterType]) {
      fetchFilterValues(prophylaxisDonutFilterType);
    }
  }, [prophylaxisDonutFilterType]);

  // Fetch prophylaxis data
  const fetchProphylaxisData = async (filters: Filter[] = []) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching prophylaxis data with filters:', filters);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add active filters as query parameters
      filters.forEach(filter => {
        params.append(filter.type, filter.value);
      });
      
      const queryString = params.toString();
      const endpoint = `amu-prophylaxis-profile${queryString ? `?${queryString}` : ''}`;
      
      console.log('Making request to endpoint:', endpoint);
      const data = await makeServerRequest(endpoint);
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Successfully fetched prophylaxis data:', data);
      setProphylaxisData(data);
    } catch (err: any) {
      console.error('Error fetching prophylaxis data:', err);
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred while fetching prophylaxis data';
      setError(errorMessage);
      setProphylaxisData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchProphylaxisData(prophylaxisDonutActiveFilters);
  }, [prophylaxisDonutActiveFilters]);

  // Filter helper functions
  const prophylaxisDonutFilterHelpers = {
    addFilter: () => {
      if (prophylaxisDonutFilterType && prophylaxisDonutFilterValue && 
          prophylaxisDonutFilterValue !== 'loading' && prophylaxisDonutFilterValue !== 'error') {
        const typeLabel = dynamicFilterTypeOptions.find(t => t.value === prophylaxisDonutFilterType)?.label || prophylaxisDonutFilterType;
        const newFilter = {
          type: prophylaxisDonutFilterType,
          value: prophylaxisDonutFilterValue,
          label: `${typeLabel}: ${prophylaxisDonutFilterValue}`
        };
        
        if (!prophylaxisDonutActiveFilters.some(f => f.type === prophylaxisDonutFilterType && f.value === prophylaxisDonutFilterValue)) {
          setProphylaxisDonutActiveFilters([...prophylaxisDonutActiveFilters, newFilter]);
        }
        
        setProphylaxisDonutFilterType('');
        setProphylaxisDonutFilterValue('');
      }
    },
    removeFilter: (index: number) => {
      setProphylaxisDonutActiveFilters(prophylaxisDonutActiveFilters.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setProphylaxisDonutActiveFilters([]);
    }
  };

  // Compute display data
  const computedProphylaxisData = useMemo(() => {
    if (!prophylaxisData || loading || error) {
      return {
        shareData: [
          { name: 'Prophylaxis', value: 0, color: '#8b5cf6', count: 0 },
          { name: 'Other Rx', value: 0, color: '#e5e7eb', count: 0 }
        ],
        typeData: [
          { name: 'Surgical Prophylaxis', value: 0, color: '#16a34a', count: 0 },
          { name: 'Medical Prophylaxis', value: 0, color: '#2563eb', count: 0 }
        ],
        totalPrescriptions: 0,
        facilityName: 'Loading...'
      };
    }

    return {
      shareData: prophylaxisData.shareData,
      typeData: prophylaxisData.typeData,
      totalPrescriptions: prophylaxisData.totalRecords,
      facilityName: prophylaxisData.facilityName
    };
  }, [prophylaxisData, loading, error]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Prophylaxis Profile of Antimicrobial Use</CardTitle>
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
                console.log(`${showTable ? 'Show chart' : 'Show table'} view for prophylaxis data`);
              }}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log('Download Prophylaxis chart data', prophylaxisData);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Distribution of Antimicrobial Prescriptions for Prophylaxis • 
          {prophylaxisDonutActiveFilters.length > 0 ? (
            <span className="font-medium text-blue-600 ml-1"> 
              Filtered ({prophylaxisDonutActiveFilters.length} filter{prophylaxisDonutActiveFilters.length === 1 ? '' : 's'}): {prophylaxisData?.totalRecords?.toLocaleString() || 0} records
            </span>
          ) : (
            <span className="text-gray-700 ml-1"> Total: {prophylaxisData?.totalRecords?.toLocaleString() || 0} records</span>
          )}

          {loading && (
            <span className="ml-2 text-gray-500 italic">
              (Updating...)
            </span>
          )}
        </p>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <TooltipComponent>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-gray-900 text-sm cursor-help">Filter Prophylaxis Data:</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dynamic filters from AMU_HH table columns (21 available)</p>
                </TooltipContent>
              </TooltipComponent>
            </div>
            
            {/* Filter Type */}
            <div className="flex-1">
              <SearchableSelect
                value={prophylaxisDonutFilterType}
                onValueChange={setProphylaxisDonutFilterType}
                options={dynamicFilterTypeOptions}
                placeholder="Search filter type..."
                className="w-full text-sm"
              />
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <SearchableSelect
                value={prophylaxisDonutFilterValue}
                onValueChange={setProphylaxisDonutFilterValue}
                options={getFilterValueOptions(prophylaxisDonutFilterType)}
                disabled={!prophylaxisDonutFilterType || loadingFilterValues[prophylaxisDonutFilterType]}
                placeholder={
                  !prophylaxisDonutFilterType ? "Select type first" :
                  loadingFilterValues[prophylaxisDonutFilterType] ? "Loading values..." :
                  filterValueErrors[prophylaxisDonutFilterType] ? "Error loading values" :
                  "Search value..."
                }
                className="w-full text-sm"
              />
            </div>

            {/* Add Filter Button */}
            <button
              onClick={prophylaxisDonutFilterHelpers.addFilter}
              disabled={!prophylaxisDonutFilterType || !prophylaxisDonutFilterValue || 
                        prophylaxisDonutFilterValue === 'loading' || prophylaxisDonutFilterValue === 'error'}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {prophylaxisDonutActiveFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({prophylaxisDonutActiveFilters.length})
              </span>
              <button
                onClick={prophylaxisDonutFilterHelpers.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {prophylaxisDonutActiveFilters.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => prophylaxisDonutFilterHelpers.removeFilter(index)}
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
              Unable to load prophylaxis distribution data from AMU_HH table. Please check your connection and try again.
            </p>
          </div>
        )}

        {showTable ? (
          /* Table View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Prophylaxis Distribution Data Tables
              </h4>
              <span className="text-sm text-gray-500">
                Showing {computedProphylaxisData.shareData.length + computedProphylaxisData.typeData.length} total entries
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading prophylaxis distribution...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Share Data Table */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Share of All Systemic Antibacterial Prescriptions
                  </h3>
                  <div className="border rounded-lg">
                    <TableComponent>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead className="flex-1">Category</TableHead>
                          <TableHead className="w-24 text-right">Count</TableHead>
                          <TableHead className="w-24 text-right">Percentage</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {computedProphylaxisData.shareData.map((item, index) => (
                          <TableRow key={item.name}>
                            <TableCell className="font-medium text-gray-500">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-md">
                                {item.name}
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
                </div>
                
                {/* Type Data Table */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Prophylaxis Type Breakdown
                  </h3>
                  <div className="border rounded-lg">
                    <TableComponent>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead className="flex-1">Prophylaxis Type</TableHead>
                          <TableHead className="w-24 text-right">Count</TableHead>
                          <TableHead className="w-24 text-right">Percentage</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {computedProphylaxisData.typeData.map((item, index) => (
                          <TableRow key={item.name}>
                            <TableCell className="font-medium text-gray-500">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-md">
                                {item.name}
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
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Chart View */
          <div className="grid grid-cols-2 gap-8">
            {/* Share of All Rx that are Prophylaxis */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900 mb-4 text-[14px]">
                Share of All Systemic Antibacterial Prescriptions
              </h3>
              {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading...</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={computedProphylaxisData.shareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={150}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        {computedProphylaxisData.shareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={(props) => <ProphylaxisTooltip {...props} isShare={true} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {computedProphylaxisData.shareData.find(item => item.name === 'Prophylaxis')?.value || 0}%
                      </div>
                      <div className="text-xs text-gray-600">Prophylaxis</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Legend */}
              <div className="flex justify-center my-[20px] mx-[0px]">
                <div className="flex flex-col gap-2">
                  {loading ? (
                    [1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gray-200 animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))
                  ) : (
                    computedProphylaxisData.shareData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-sm">{entry.name} ({entry.value}%)</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Prophylaxis Type Breakdown */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900 mb-4 text-[14px]">
                Prophylaxis Type Breakdown
              </h3>
              {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading...</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={computedProphylaxisData.typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={150}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        {computedProphylaxisData.typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={(props) => <ProphylaxisTooltip {...props} isShare={false} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {computedProphylaxisData.typeData.find(item => item.name === 'Medical Prophylaxis')?.value || 0}%
                      </div>
                      <div className="text-xs text-gray-600">Medical</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Legend */}
              <div className="flex justify-center mx-[0px] my-[20px]">
                <div className="flex flex-col gap-2">
                  {loading ? (
                    [1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gray-200 animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))
                  ) : (
                    computedProphylaxisData.typeData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-sm">{entry.name} ({entry.value}%)</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Footnote */}
        <div className="mt-[30px] pt-4 border-t border-gray-200 mr-[0px] mb-[0px] ml-[0px]">
          <p className="text-xs text-gray-500">
            PPS data; excludes topical antibacterials and anti-TB drugs. Showing prophylaxis share and type breakdown from AMU_HH table.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}