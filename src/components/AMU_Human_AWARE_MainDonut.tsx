import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, Table } from 'lucide-react';
import { makeServerRequest } from '../utils/supabase/client';

interface FilterOption {
  value: string;
  label: string;
}

interface ActiveFilter {
  type: string;
  value: string;
  label: string;
}

interface AWaReDataItem {
  name: string;
  value: number;
  count: number;
  color: string;
}

interface AWaReResponse {
  totalRecords: number;
  distribution: AWaReDataItem[];
  dataSource: string;
  error?: string;
}

export function AMU_Human_AWARE_MainDonut() {
  // Filter state management
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  
  // AWaRe data state management
  const [awaReData, setAwaReData] = useState<AWaReResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  
  // Dynamic filter value management
  const [filterValueCache, setFilterValueCache] = useState<Record<string, FilterOption[]>>({});
  const [loadingFilterValues, setLoadingFilterValues] = useState<Record<string, boolean>>({});
  const [filterValueErrors, setFilterValueErrors] = useState<Record<string, string>>({});

  // Dynamic filter options - restricted to 21 validated AMU_HH table columns
  const filterTypeOptions: FilterOption[] = [
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

      // Sort values alphabetically and create options
      const sortedValues = (data.values || []).sort((a: string, b: string) => {
        // Handle null/empty values
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;
        return a.toString().localeCompare(b.toString());
      });

      const options: FilterOption[] = sortedValues.map((value: any) => ({
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

  // Load filter values when filter type changes
  useEffect(() => {
    if (filterType && !filterValueCache[filterType] && !loadingFilterValues[filterType]) {
      fetchFilterValues(filterType);
    }
  }, [filterType]);

  // Fetch AWaRe data from AMU_HH table when component mounts or filters change
  useEffect(() => {
    const fetchAwaReData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters from active filters
        const queryParams = new URLSearchParams();
        
        // Add all dynamic filters
        activeFilters.forEach(filter => {
          queryParams.append(filter.type, filter.value);
        });
        
        // If no filters are applied, still send a basic request
        if (activeFilters.length === 0) {
          queryParams.append('no_filters', 'true');
        }
        
        console.log('🔍 AWaRe Distribution Query Debug:');
        console.log('  - Active filters count:', activeFilters.length);
        console.log('  - Query params string:', queryParams.toString());
        console.log('  - Active filters details:', activeFilters);
        
        const data = await makeServerRequest(`amu-aware-distribution?${queryParams.toString()}`);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 AWaRe Distribution Response:');
        console.log('  - Total records returned:', data.totalRecords);
        console.log('  - Data source:', data.dataSource);
        console.log('  - Distribution:', data.distribution);
        console.log('  - Full response:', data);
        
        setAwaReData(data);
        
      } catch (err) {
        console.error('Error fetching AWaRe distribution data from AMU_HH:', err);
        setError(err.message || 'Failed to access AMU_HH table');
        setAwaReData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAwaReData();
  }, [activeFilters]); // Re-fetch when filters change

  // Function to get current AWaRe data for display
  const getCurrentAwaReData = () => {
    if (loading || !awaReData || error) {
      // Return placeholder data while loading or on error
      return {
        data: [
          { name: 'Access', value: 0, color: COLORS.access },
          { name: 'Watch', value: 0, color: COLORS.watch },
          { name: 'Reserve', value: 0, color: COLORS.reserve }
        ],
        totalPrescriptions: 0
      };
    }
    
    return {
      data: awaReData.distribution,
      totalPrescriptions: awaReData.totalRecords
    };
  };

  // Filter helper functions
  const addFilter = () => {
    if (!filterType || !filterValue) return;
    
    const typeOption = filterTypeOptions.find(opt => opt.value === filterType);
    const valueOption = getFilterValueOptions(filterType).find(opt => opt.value === filterValue);
    
    if (typeOption && valueOption) {
      const newFilter: ActiveFilter = {
        type: filterType,
        value: filterValue,
        label: `${typeOption.label}: ${valueOption.label}`
      };
      
      // Check if filter already exists
      const exists = activeFilters.some(f => f.type === filterType && f.value === filterValue);
      if (!exists) {
        setActiveFilters([...activeFilters, newFilter]);
      }
    }
    
    // Reset form
    setFilterType('');
    setFilterValue('');
  };

  const removeFilter = (index: number) => {
    setActiveFilters(activeFilters.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  const filterHelpers = {
    addFilter,
    removeFilter,
    clearAllFilters
  };

  // Colors for charts
  const COLORS = {
    access: '#16a34a',
    watch: '#eab308', 
    reserve: '#dc2626'
  };

  const currentData = getCurrentAwaReData();

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            AWaRe Profile of Antimicrobial Use in Ghana
            {loading && <span className="text-sm text-gray-500 ml-2">(Loading...)</span>}
            {error && <span className="text-sm text-red-500 ml-2">(Error)</span>}
          </CardTitle>
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
                console.log(`${showTable ? 'Show chart' : 'Show table'} view for AWaRe data`);
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
                console.log('Download AWaRe chart data', awaReData);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Distribution of Antimicrobial Prescriptions by WHO Access, Watch & Reserve Category • 
          {activeFilters.length > 0 ? (
            <span className="font-medium text-blue-600 ml-1"> 
              Filtered ({activeFilters.length} filter{activeFilters.length === 1 ? '' : 's'}): {awaReData?.totalRecords?.toLocaleString() || 0} records
            </span>
          ) : (
            <span className="text-gray-700 ml-1"> Total: {awaReData?.totalRecords?.toLocaleString() || 0} records</span>
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
                  <h3 className="font-semibold text-gray-900 text-sm cursor-help">Filter AWaRe Data:</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dynamic filters from AMU_HH table columns (21 available)</p>
                </TooltipContent>
              </TooltipComponent>
            </div>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select filter type..." />
                </SelectTrigger>
                <SelectContent>
                  {filterTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <Select 
                value={filterValue} 
                onValueChange={setFilterValue}
                disabled={!filterType || loadingFilterValues[filterType]}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue 
                    placeholder={
                      !filterType ? "Select type first" :
                      loadingFilterValues[filterType] ? "Loading values..." :
                      filterValueErrors[filterType] ? "Error loading values" :
                      "Select value..."
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {getFilterValueOptions(filterType).map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        
        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="mt-4">
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

            {/* Filter Tags */}
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
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Error loading AWaRe data</div>
            <div className="text-sm text-gray-500">{error}</div>
          </div>
        )}
        
        {loading && !error && (
          <div className="text-center py-8">
            <div className="text-gray-600 mb-2">Loading AWaRe distribution...</div>
            <div className="text-sm text-gray-500">Fetching data from AMU_HH table</div>
          </div>
        )}
        
        {!loading && !error && awaReData && (
          <>
            {!showTable ? (
              <div className="flex gap-8">
                {/* Main Chart Area */}
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={currentData.data}
                        cx="40%"
                        cy="50%"
                        innerRadius={100}
                        outerRadius={180}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {currentData.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <text x="40%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-medium fill-gray-700">
                        AWaRe Mix
                      </text>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload[0]) {
                            const data = payload[0].payload;
                            const prescriptionCount = data.count || Math.round((data.value * currentData.totalPrescriptions) / 100);
                            
                            return (
                              <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
                                <div className="text-gray-900 font-medium mb-1">
                                  {data.name} Antibiotics
                                </div>
                                <div className="text-gray-600 text-sm mb-2">
                                  AWaRe Classification
                                </div>
                                <div className="text-gray-600 text-sm mb-1">
                                  {prescriptionCount.toLocaleString()} of {currentData.totalPrescriptions.toLocaleString()} prescriptions
                                </div>
                                <div className="mb-2">
                                  <span 
                                    className="font-medium"
                                    style={{ color: data.color }}
                                  >
                                    {data.value}% of total usage
                                  </span>
                                </div>
                                <div className="text-gray-500 text-sm">
                                  {data.name === 'Access' && 'First-line antibiotics with good safety profile'}
                                  {data.name === 'Watch' && 'Broader spectrum, higher resistance risk'}
                                  {data.name === 'Reserve' && 'Last resort antibiotics for MDR infections'}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex flex-col justify-center space-y-3 min-w-[300px] mx-[30px] my-[0px] p-[0px]">
                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">WHO AWaRe Classification</h4>
                  </div>
                  {currentData.data.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-700 text-sm">{item.name} Category</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                        {item.count !== undefined && (
                          <div className="text-xs text-gray-500">
                            ({item.count.toLocaleString()})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full">
                <TableComponent>
                  <TableHeader>
                    <TableRow>
                      <TableHead>AWaRe Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20 text-right">Count</TableHead>
                      <TableHead className="w-20 text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.data.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          {item.name === 'Access' && 'First-line antibiotics with good safety profile'}
                          {item.name === 'Watch' && 'Broader spectrum, higher resistance risk'}
                          {item.name === 'Reserve' && 'Last resort antibiotics for MDR infections'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.count ? item.count.toLocaleString() : Math.round((item.value * currentData.totalPrescriptions) / 100).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">{item.value.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableComponent>
              </div>
            )}
          </>
        )}
        
        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              PPS data; excludes topical antibacterials and anti-TB drugs.
            </p>
            {awaReData && !loading && !error && (
              <p className="text-xs text-gray-500">
                Data source: {awaReData.dataSource === 'real_supabase_table' ? 'Real AMU_HH table' : awaReData.dataSource}
                {awaReData.timestamp && (
                  <span className="ml-2">
                    • Updated: {new Date(awaReData.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}