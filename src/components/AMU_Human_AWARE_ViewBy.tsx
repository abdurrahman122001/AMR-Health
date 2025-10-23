import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Loader2 } from 'lucide-react';
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

interface AWaReViewByDataItem {
  category: string;
  Access: number;
  Watch: number;
  Reserve: number;
  total_prescriptions?: number;
  // Exact counts for each AWaRe category
  Access_count?: number;
  Watch_count?: number;
  Reserve_count?: number;
}

interface AWaReViewByResponse {
  data: AWaReViewByDataItem[];
  totalRecords: number;
  viewBy: string;
  dataSource: string;
  error?: string;
}

export function AMU_Human_AWARE_ViewBy() {
  const [viewBy, setViewBy] = useState('name'); // Default to hospital name
  
  // Filter state management (same as MainDonut component)
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  
  // AWaRe ViewBy data state management
  const [awaReViewByData, setAwaReViewByData] = useState<AWaReViewByResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamic filter value management
  const [filterValueCache, setFilterValueCache] = useState<Record<string, FilterOption[]>>({});
  const [loadingFilterValues, setLoadingFilterValues] = useState<Record<string, boolean>>({});
  const [filterValueErrors, setFilterValueErrors] = useState<Record<string, string>>({});
  
  // AWaRe color definitions - same as main donut component
  const AWARE_COLORS = {
    "Access": "#22c55e", // green
    "Watch": "#f59e0b",  // amber
    "Reserve": "#ef4444" // red
  };

  // Dynamic filter options - same as AMU_Human_AWARE_MainDonut (AMU_HH table columns)
  const filterTypeOptions: FilterOption[] = [
    { value: 'age_cat', label: 'Age Group' },
    { value: 'antibiotic_yn', label: 'Antibiotic Yes/No' },
    { value: 'antimicrobial_name', label: 'Antimicrobial Name' },
    { value: 'atc2', label: 'ATC2 Code' },
    { value: 'atc3', label: 'ATC3 Code' },
    { value: 'atc4', label: 'ATC4 Code' },
    { value: 'atc5', label: 'ATC5 Code' },
    { value: 'aware', label: 'AWaRe Category' },
    { value: 'biomarker', label: 'Biomarker' },
    { value: 'biomarker_fluid', label: 'Biomarker Fluid' },
    { value: 'county', label: 'County/Region' },
    { value: 'dept_name', label: 'Department Name' },
    { value: 'dept_type', label: 'Department Type' },
    { value: 'diagnosis', label: 'Diagnosis' },
    { value: 'diagnosis_code', label: 'Diagnosis Code' },
    { value: 'diagnosis_site', label: 'Diagnosis Site' },
    { value: 'district', label: 'District' },
    { value: 'guideline_compliance', label: 'Guideline Compliance' },
    { value: 'indication', label: 'Indication' },
    { value: 'main_dept', label: 'Main Department' },
    { value: 'name', label: 'Hospital Name' },
    { value: 'route', label: 'Route of Administration' },
    { value: 'sex', label: 'Sex' },
    { value: 'sub_dept', label: 'Sub Department' },
    { value: 'teaching', label: 'Teaching Hospital' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'year_of_survey', label: 'Year of Survey' }
  ];

  // ViewBy options that map to AMU_HH table columns (same as filter columns)
  const viewByOptions = [
    { value: 'name', label: 'by Facility' },
    { value: 'main_dept', label: 'by Main Department' },
    { value: 'sub_dept', label: 'by Sub Department' },
    { value: 'sex', label: 'by Sex' },
    { value: 'age_cat', label: 'by Age Group' },
    { value: 'county', label: 'by County/Region' },
    { value: 'treatment', label: 'by Treatment' },
    { value: 'indication', label: 'by Indication' },
    { value: 'route', label: 'by Route' },
    { value: 'dept_type', label: 'by Department Type' }
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

  // Filter management functions (same as MainDonut component)
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
        setActiveFilters(prev => [...prev, newFilter]);
        setFilterType('');
        setFilterValue('');
      }
    }
  };

  const removeFilter = (index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  // Fetch AWaRe ViewBy data from AMU_HH table when component mounts or filters/viewBy change
  useEffect(() => {
    const fetchAwaReViewByData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 AWaRe ViewBy Query Debug:');
        console.log('  - ViewBy:', viewBy);
        console.log('  - Active filters count:', activeFilters?.length || 0);
        console.log('  - Active filters details:', activeFilters);
        
        // Step 1: Get unique values for the viewBy dimension
        const uniqueValuesData = await makeServerRequest(`amu-filter-values?column=${viewBy}`);
        
        if (uniqueValuesData.error) {
          throw new Error(`Failed to get unique values for ${viewBy}: ${uniqueValuesData.error}`);
        }
        
        const uniqueValues = uniqueValuesData.values || [];
        console.log('  - Unique values for', viewBy, ':', uniqueValues.length, 'values');
        
        // Step 2: For each unique value, get AWaRe distribution
        const viewByData: AWaReViewByDataItem[] = [];
        
        for (const categoryValue of uniqueValues) {
          try {
            // Build query parameters from active filters + this category value
            const queryParams = new URLSearchParams();
            
            // Add all active filters
            activeFilters.forEach(filter => {
              queryParams.append(filter.type, filter.value);
            });
            
            // Add the current category filter
            queryParams.append(viewBy, categoryValue || 'null');
            
            // If no filters are applied, still send a basic request
            if (activeFilters.length === 0 && !categoryValue) {
              queryParams.append('no_filters', 'true');
            }
            
            const categoryData = await makeServerRequest(`amu-aware-distribution?${queryParams.toString()}`);
            
            if (categoryData.error) {
              console.warn(`Error fetching data for ${viewBy}=${categoryValue}:`, categoryData.error);
              continue;
            }
            
            // Extract percentages from distribution
            const distribution = categoryData.distribution || [];
            const accessItem = distribution.find((d: any) => d.name === 'Access');
            const watchItem = distribution.find((d: any) => d.name === 'Watch');
            const reserveItem = distribution.find((d: any) => d.name === 'Reserve');
            
            // Calculate exact counts from percentages and total records
            const totalRecords = categoryData.totalRecords || 0;
            const accessPercentage = accessItem?.value || 0;
            const watchPercentage = watchItem?.value || 0;
            const reservePercentage = reserveItem?.value || 0;
            
            const accessCount = accessItem?.count || Math.round((accessPercentage / 100) * totalRecords);
            const watchCount = watchItem?.count || Math.round((watchPercentage / 100) * totalRecords);
            const reserveCount = reserveItem?.count || Math.round((reservePercentage / 100) * totalRecords);
            
            viewByData.push({
              category: categoryValue?.toString() || 'Unknown',
              Access: accessPercentage,
              Watch: watchPercentage,
              Reserve: reservePercentage,
              total_prescriptions: totalRecords,
              // Add exact counts for each AWaRe category
              Access_count: accessCount,
              Watch_count: watchCount,
              Reserve_count: reserveCount
            });
            
          } catch (categoryError) {
            console.warn(`Error processing category ${categoryValue}:`, categoryError);
          }
        }
        
        // Sort by total prescriptions (descending) for consistent ordering
        viewByData.sort((a, b) => (b.total_prescriptions || 0) - (a.total_prescriptions || 0));
        
        console.log('📊 AWaRe ViewBy Response:');
        console.log('  - Categories processed:', viewByData.length);
        console.log('  - Sample data:', viewByData.slice(0, 3));
        
        const response = {
          data: viewByData,
          totalRecords: viewByData.reduce((sum, item) => sum + (item.total_prescriptions || 0), 0),
          viewBy,
          dataSource: 'real_supabase_table',
          tableName: 'AMU_HH',
          timestamp: new Date().toISOString()
        };
        
        setAwaReViewByData(response);
        
      } catch (err) {
        console.error('Error fetching AWaRe ViewBy data from AMU_HH:', err);
        setError(err.message || 'Failed to access AMU_HH table');
        setAwaReViewByData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAwaReViewByData();
  }, [activeFilters, viewBy]); // Re-fetch when filters or viewBy change

  // Function to get current AWaRe ViewBy data for display
  const getCurrentAwaReViewByData = () => {
    if (loading || !awaReViewByData || error) {
      // Return placeholder data while loading or on error
      return {
        data: [],
        totalRecords: 0
      };
    }
    
    return {
      data: awaReViewByData.data || [],
      totalRecords: awaReViewByData.totalRecords || 0
    };
  };

  const computedData = useMemo(() => {
    return getCurrentAwaReViewByData();
  }, [awaReViewByData, loading, error]);

  // Get all unique AWaRe categories from data for consistent rendering
  const allAwareCategories = ['Access', 'Watch', 'Reserve'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const hoveredSegment = payload[0];
      
      if (hoveredSegment && hoveredSegment.value > 0) {
        const awareCategory = hoveredSegment.dataKey;
        const percentage = hoveredSegment.value.toFixed(1);
        const color = AWARE_COLORS[awareCategory as keyof typeof AWARE_COLORS];
        
        // Get the exact prescription count for this AWaRe category
        const categoryData = computedData.data.find(item => item.category === label);
        const exactPrescriptions = categoryData?.[`${awareCategory}_count` as keyof AWaReViewByDataItem] as number || 0;
        
        return (
          <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[240px]">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: color || "#6b7280" }}
              />
              <div className="font-medium text-sm text-gray-900">
                {awareCategory} Category
              </div>
            </div>
            <div className="text-gray-900 font-medium text-sm mb-1">
              {awareCategory === 'Access' && 'First-line antibiotics with good safety profile'}
              {awareCategory === 'Watch' && 'Broader spectrum, higher resistance risk'}
              {awareCategory === 'Reserve' && 'Last resort antibiotics for MDR infections'}
            </div>
            <div className="text-gray-600 text-sm mb-1">
              <strong>{exactPrescriptions.toLocaleString()}</strong> prescriptions
            </div>
            <div className="font-medium text-sm" style={{ color: color || "#6b7280" }}>
              <strong>{percentage}%</strong> of {label} total ({categoryData?.total_prescriptions?.toLocaleString() || 0} prescriptions)
            </div>
          </div>
        );
      }
    }
    return null;
  };

  // Check if filter values are loading
  const isFilterValuesLoading = filterType ? loadingFilterValues[filterType] : false;

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg font-medium">
              AWaRe Profile of Antimicrobial Use in Ghana
            </CardTitle>
            <Select value={viewBy} onValueChange={setViewBy}>
              <SelectTrigger className="w-[180px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {viewByOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log('Download AWaRe ViewBy chart data', { 
                data: computedData.data, 
                viewBy, 
                filters: activeFilters 
              });
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Share of Systemic Antibacterial Prescriptions (J01) by WHO Access, Watch & Reserve Category {viewByOptions.find(o => o.value === viewBy)?.label}
          {computedData.totalRecords > 0 && (
            <span className="ml-2 text-gray-500">
              • {computedData.totalRecords.toLocaleString()} total records
            </span>
          )}
        </p>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter AWaRe Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select filter type..." />
                </SelectTrigger>
                <SelectContent>
                  {filterTypeOptions?.map(option => (
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
                disabled={!filterType || isFilterValuesLoading}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue 
                    placeholder={
                      isFilterValuesLoading 
                        ? "Loading options..." 
                        : filterType 
                          ? "Select value..." 
                          : "Select type first"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {isFilterValuesLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Loading...</span>
                    </div>
                  ) : (
                    getFilterValueOptions(filterType).map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Add Filter Button */}
            <button
              onClick={addFilter}
              disabled={!filterType || !filterValue || isFilterValuesLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {activeFilters && activeFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({activeFilters.length})
              </span>
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {activeFilters?.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(index)}
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
      
      <CardContent className="pt-[0px] pr-[24px] pb-[20px] pl-[24px]">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">
              <strong>⚠️ Data Error:</strong> {error}
            </p>
            <p className="text-red-600 text-xs mt-1">
              Unable to load AWaRe ViewBy data from AMU_HH table. Please check your connection and try again.
            </p>
          </div>
        )}

        {/* Loading Display */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading AWaRe ViewBy data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chart Area */}
            <div className="w-full h-96 mb-[15px] mt-[0px] mr-[0px] ml-[0px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={computedData.data}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                  barCategoryGap="10%"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12 }}
                    angle={viewBy === 'name' ? -45 : 0}
                    textAnchor={viewBy === 'name' ? 'end' : 'middle'}
                    height={viewBy === 'name' ? 100 : 60}
                    label={{ 
                      value: (() => {
                        const option = viewByOptions.find(opt => opt.value === viewBy);
                        return option?.label.replace('by ', '') || 'Category';
                      })(),
                      position: 'insideBottom',
                      offset: viewBy === 'name' ? -10 : 0,
                      style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(value) => `${value}%`}
                    label={{ 
                      value: 'Share of Prescriptions (%)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                    }}
                  />
                  <Tooltip 
                    shared={false}
                    content={CustomTooltip}
                  />
                  
                  {/* Render bars for each AWaRe category */}
                  {allAwareCategories.map((awareCategory) => (
                    <Bar
                      key={awareCategory}
                      dataKey={awareCategory}
                      stackId="aware"
                      fill={AWARE_COLORS[awareCategory as keyof typeof AWARE_COLORS] || "#6b7280"}
                      cursor="pointer"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend - Single Row */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4 text-left">WHO AWaRe Classification</h3>
              <div className="flex items-center gap-8">
                {allAwareCategories.map((awareCategory) => {
                  const color = AWARE_COLORS[awareCategory as keyof typeof AWARE_COLORS];
                  
                  return (
                    <div key={awareCategory} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: color || "#6b7280" }}
                      ></div>
                      <span className="text-gray-700 text-sm">
                        {awareCategory} Category
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
        
        {/* Footnote */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            AMU_HH database • PPS data; excludes topical antibacterials and anti-TB drugs. Bars show 100% stacked distribution.
            {computedData.totalRecords > 0 && (
              <span className="ml-2">
                Based on {computedData.totalRecords.toLocaleString()} prescription records.
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}