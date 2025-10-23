import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlertCircle, Table, Download, Plus, X, Filter } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { Badge } from './ui/badge';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface PathogenData {
  organism: string;
  organismName: string;
  resistanceRate: number;
  resistantCount: number;
  totalTested: number;
  color: string;
}

interface Filter {
  type: string;
  value: string;
  label: string;
}

interface FilterValueOption {
  value: string;
  label: string;
}

// Dynamic filter options based on AMR_HH table column headers
const filterTypeOptions = [
  { value: 'sex', label: 'Sex' },
  { value: 'age_cat', label: 'Age Category' },
  { value: 'pat_type', label: 'Patient Type' },
  { value: 'institution', label: 'Institution' },
  { value: 'department', label: 'Department' },
  { value: 'ward_type', label: 'Ward Type' },
  { value: 'year_spec', label: 'Year of Specimen' },
  { value: 'x_region', label: 'Region' },
  { value: 'organism', label: 'Organism' }
];

export function AMR_Human_Pathogen_RProfile() {
  const [data, setData] = useState<PathogenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  
  // Filter state
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterValueCache, setFilterValueCache] = useState<Record<string, FilterValueOption[]>>({});
  const [loadingFilterValues, setLoadingFilterValues] = useState<Record<string, boolean>>({});
  const [filterValueErrors, setFilterValueErrors] = useState<Record<string, string>>({});

  // Organism name mapping using vw_amr_hh_organisms view
  const [organismNameMap, setOrganismNameMap] = useState<Map<string, string>>(new Map());

  // Get resistance alert color based on percentage
  const getResistanceAlertColor = (percentage: number): string => {
    if (percentage < 20) return '#16a34a'; // Green
    if (percentage < 40) return '#eab308'; // Yellow
    return '#dc2626'; // Red
  };

  // Fetch unique values for a specific column from AMR_HH table
  const fetchFilterValues = async (columnName: string) => {
    if (filterValueCache[columnName]) {
      return filterValueCache[columnName];
    }

    try {
      setLoadingFilterValues(prev => ({ ...prev, [columnName]: true }));
      setFilterValueErrors(prev => ({ ...prev, [columnName]: '' }));

      console.log(`Fetching unique values for AMR_HH column: ${columnName}`);
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
        // Handle null/empty values
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
    } catch (err: any) {
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

  // Add filter function
  const addFilter = () => {
    if (!filterType || !filterValue) return;
    
    // Check if filter already exists
    const exists = activeFilters.some(f => f.type === filterType && f.value === filterValue);
    if (exists) return;
    
    const typeOption = filterTypeOptions.find(t => t.value === filterType);
    const valueOption = getFilterValueOptions(filterType).find(v => v.value === filterValue);
    
    if (typeOption && valueOption) {
      const newFilter: Filter = {
        type: filterType,
        value: filterValue,
        label: `${typeOption.label}: ${valueOption.label}`
      };
      
      setActiveFilters(prev => [...prev, newFilter]);
      setFilterType('');
      setFilterValue('');
    }
  };

  // Remove filter function
  const removeFilter = (index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  // Fetch organism name mappings from the working organism-mapping endpoint
  useEffect(() => {
    const fetchOrganismMappings = async () => {
      try {
        console.log('🔬 Pathogen Resistance: Fetching organism name mappings...');
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/organism-mapping`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.mappings && Array.isArray(data.mappings)) {
            const mapping = new Map<string, string>();
            
            // Create mapping from organism view data
            data.mappings.forEach((item: any) => {
              if (item.code && item.organism_name) {
                mapping.set(item.code, item.organism_name);
              }
            });
            
            setOrganismNameMap(mapping);
            console.log(`✅ Pathogen Resistance: Loaded ${mapping.size} organism name mappings`);
            console.log('📋 Sample mappings:', Array.from(mapping.entries()).slice(0, 10));
            
            // Test specific mappings
            console.log('🧪 Testing key mappings:');
            console.log('  pae →', mapping.get('pae'));
            console.log('  aba →', mapping.get('aba'));
            console.log('  eco →', mapping.get('eco'));
            console.log('  sau →', mapping.get('sau'));
            console.log('  kpn →', mapping.get('kpn'));
            
          } else {
            console.warn('❌ Pathogen Resistance: No organism mappings found in response');
          }
        } else {
          console.error('❌ Pathogen Resistance: Failed to fetch organism mappings:', response.status);
        }
      } catch (error) {
        console.error('❌ Pathogen Resistance: Error fetching organism mappings:', error);
      }
    };

    fetchOrganismMappings();
  }, []);

  const fetchPathogenResistance = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for filters
      const queryParams = new URLSearchParams();
      
      // Add all active filters - convert to uppercase to match AMR_HH column names
      activeFilters.forEach(filter => {
        queryParams.append(filter.type.toUpperCase(), filter.value);
      });
      
      console.log('🔍 Pathogen Resistance Query Debug:');
      console.log('  - Active filters count:', activeFilters.length);
      console.log('  - Query params string:', queryParams.toString());
      console.log('  - Active filters details:', activeFilters);
      console.log('  - Organism map size:', organismNameMap.size);

      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-pathogen-resistance`;
      const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Process the data to calculate resistance rates for organisms with >30 isolates
        const processedData = result.data
          .map((orgData: any) => {
            const resistanceRate = orgData.total_tested > 0 
              ? (orgData.resistant_count / orgData.total_tested) * 100 
              : 0;
            
            // Use organism name mapping, fallback to code if no mapping found
            const organismName = organismNameMap.get(orgData.organism) || orgData.organism;
            
            // Debug logging for organism mapping
            if (organismNameMap.size > 0) {
              console.log(`🔬 Mapping organism "${orgData.organism}" → "${organismName}" (Map size: ${organismNameMap.size})`);
            } else {
              console.warn(`⚠️ No organism mapping available for "${orgData.organism}"`);
            }
            
            return {
              organism: orgData.organism,
              organismName: organismName,
              resistanceRate: resistanceRate,
              resistantCount: orgData.resistant_count,
              totalTested: orgData.total_tested,
              color: getResistanceAlertColor(resistanceRate)
            };
          })
          .filter(item => item.totalTested > 30) // Only include organisms with >30 total tested isolates
          .sort((a, b) => {
            // First sort alphabetically by organism name
            return a.organismName.localeCompare(b.organismName);
          })
          .sort((a, b) => {
            // Then sort by resistance rate descending (higher %R first)
            return b.resistanceRate - a.resistanceRate;
          });

        setData(processedData);
      } else {
        throw new Error(result.message || 'Failed to fetch pathogen resistance data');
      }
    } catch (err) {
      console.error('Error fetching pathogen resistance data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for organism mappings to load, then fetch pathogen data
    if (organismNameMap.size > 0) {
      console.log(`✅ Pathogen Resistance: Organism mappings loaded (${organismNameMap.size} mappings), fetching data...`);
      fetchPathogenResistance();
    } else {
      // Set a timeout to fetch data even if mappings fail to load
      const timeoutId = setTimeout(() => {
        console.log('⏰ Pathogen Resistance: Timeout reached, fetching data without mappings');
        fetchPathogenResistance();
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeFilters, organismNameMap]); // Re-fetch when filters or organism mappings change

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const rate = data.resistanceRate;
      const riskLevel = rate < 20 ? 'Low risk' : rate < 40 ? 'Moderate risk' : 'High risk';
      const riskColor = getResistanceAlertColor(rate);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium italic">{data.organismName}</p>
          <p className="text-sm text-gray-600">
            Resistance Rate: <span className="font-semibold" style={{ color: riskColor }}>{rate.toFixed(1)}%</span>
          </p>
          <p className="text-sm" style={{ color: riskColor }}>
            <span className="font-semibold">{riskLevel}</span>
          </p>
          <p className="text-sm text-gray-600">
            Resistant: <span className="font-semibold">{data.resistantCount}</span>
          </p>
          <p className="text-sm text-gray-600">
            Total Tested: <span className="font-semibold">{data.totalTested}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pathogen Resistance Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading pathogen resistance data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pathogen Resistance Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">Error: {error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            Pathogen Resistance Profiles (&gt;30 isolates)
          </CardTitle>
          <div className="flex items-center gap-1">
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
                console.log(`${showTable ? 'Show chart' : 'Show table'} view for pathogen resistance data`);
              }}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log('Download pathogen resistance chart data');
                // TODO: Implement download functionality
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 m-[0px]">
            Percentage of isolates showing resistance (ANY_R = TRUE) for all pathogens, ranked by resistance rate • 
            <span className="text-gray-700 ml-1"> Total: {data.reduce((sum, item) => sum + item.totalTested, 0).toLocaleString()} isolates</span>
            {loading && (
              <span className="ml-2 text-gray-500 italic">
                (Updating...)
              </span>
            )}
          </p>
        </div>
      </CardHeader>
      
      {/* Filter Controls */}
      <div className="px-6 py-[0px] border-b border-gray-200 px-[24px]">
        <div className="space-y-4">
          {/* Add Filter Section */}
          <div className="my-[10px] bg-gray-50 rounded-lg border px-[16px] py-[0px] py-[10px] mx-[0px] m-[0px]">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <TooltipComponent>
                  <TooltipTrigger asChild>
                    <h3 className="font-semibold text-gray-900 text-sm cursor-help text-[13px]">Filter Pathogen Data:</h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dynamic filters from AMR_HH table columns</p>
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
                  loading={loadingFilterValues[filterType]}
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
                onClick={addFilter}
                disabled={!filterType || !filterValue || loadingFilterValues[filterType] || filterValueErrors[filterType]}
                className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
              >
                Add Filter
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 mt-[5px] mr-[0px] mb-[0px] ml-[0px] text-[12px]">
                  Active Filters ({activeFilters.length})
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    <span className="text-xs text-[11px]">{filter.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(index)}
                      className="h-4 w-4 p-0 hover:bg-gray-200 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <CardContent>
        {showTable ? (
          /* Table View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Pathogen Resistance Data Table
              </h4>
              <span className="text-sm text-gray-500">
                Showing all {data.length} pathogen entries • Scroll to view more
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading pathogen resistance data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">
                  <strong>⚠️ Data Error:</strong> {error}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <TableComponent>
                    <TableHeader className="sticky top-0 bg-white z-10 border-b">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="flex-1">Pathogen</TableHead>
                        <TableHead className="w-24 text-right">Resistant</TableHead>
                        <TableHead className="w-24 text-right">Total Tested</TableHead>
                        <TableHead className="w-24 text-right">Resistance Rate</TableHead>
                        <TableHead className="w-24 text-center">Risk Level</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-gray-500">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-md font-medium">
                              {item.organismName}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.resistantCount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.totalTested.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {item.resistanceRate.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              item.resistanceRate < 20 
                                ? 'bg-green-100 text-green-800' 
                                : item.resistanceRate < 40
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.resistanceRate < 20 ? 'Low' : item.resistanceRate < 40 ? 'Moderate' : 'High'}
                            </span>
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
            )}

            {/* Summary Statistics for Table View */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Pathogens Analyzed</p>
                <p className="text-lg font-semibold">{data.length}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Total Tested</p>
                <p className="text-lg font-semibold">
                  {data.reduce((sum, item) => sum + item.totalTested, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Avg Resistance</p>
                <p className="text-lg font-semibold">
                  {data.length > 0 
                    ? (data.reduce((sum, item) => sum + item.resistanceRate, 0) / data.length).toFixed(1)
                    : '0.0'
                  }%
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Highest Resistance</p>
                <p className="text-lg font-semibold">
                  {data.length > 0 ? Math.max(...data.map(item => item.resistanceRate)).toFixed(1) : '0.0'}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Chart View */
          <div className="w-full">
            {/* Resistance Level Legend */}
            <div className="flex justify-center mb-4 gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: '#16a34a' }}
                />
                <span className="text-sm text-[12px]">Low risk (&lt;20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: '#eab308' }}
                />
                <span className="text-sm text-[12px]">Moderate risk (20-39%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: '#dc2626' }}
                />
                <span className="text-sm text-[12px]">High risk (&ge;40%)</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading pathogen resistance data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm">
                  <strong>⚠️ Data Error:</strong> {error}
                </p>
              </div>
            ) : (
              <div className="h-[350px] px-[0px] py-[16px] p-[0px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="organismName"
                      angle={-30}
                      textAnchor="end"
                      height={20}
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
                      fontSize={11}
                      tick={{ fill: '#374151' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="resistanceRate" 
                      radius={[2, 2, 0, 0]}
                      stroke="none"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Summary Statistics */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Pathogens Analyzed</p>
                <p className="text-lg font-semibold">{data.length}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Total Isolates Tested</p>
                <p className="text-lg font-semibold">
                  {data.reduce((sum, item) => sum + item.totalTested, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Average Resistance</p>
                <p className="text-lg font-semibold">
                  {data.length > 0 
                    ? (data.reduce((sum, item) => sum + item.resistanceRate, 0) / data.length).toFixed(1)
                    : '0.0'
                  }%
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Highest Resistance</p>
                <p className="text-lg font-semibold">
                  {data.length > 0 ? Math.max(...data.map(item => item.resistanceRate)).toFixed(1) : '0.0'}%
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}