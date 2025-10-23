import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Download, Table, Loader2 } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Generate colors for pie chart segments
function generateColor(index: number): string {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
    '#14b8a6', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316',
    '#84cc16', '#ec4899', '#6366f1', '#14b8a6', '#f59e0b'
  ];
  return colors[index % colors.length];
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

// Custom tooltip for specimen type data
function SpecimenTypeTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <div className="font-medium text-gray-900 mb-1">
          {data.name}
        </div>
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">{data.value.toLocaleString()}</span> specimens
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{data.percentage.toFixed(1)}%</span> of total
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// Filter interface
interface AnimalFilter {
  type: string;
  value: string;
  label: string;
}

export function AMR_Animal_SpecimenTypeDistribution() {
  const [distributionData, setDistributionData] = useState<Array<{name: string, value: number, percentage: number, color: string}>>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  // Filter state
  const [activeFilters, setActiveFilters] = useState<AnimalFilter[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [loadingFilterValues, setLoadingFilterValues] = useState<Record<string, boolean>>({});
  const [filterValueErrors, setFilterValueErrors] = useState<Record<string, boolean>>({});

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
          console.log('Added AMR_Animal specimen type filter:', newFilter);
        }
      }
    },
    
    removeFilter: (index: number) => {
      const removedFilter = activeFilters[index];
      setActiveFilters(prev => prev.filter((_, i) => i !== index));
      console.log('Removed AMR_Animal specimen type filter:', removedFilter);
    },
    
    clearAllFilters: () => {
      const clearedCount = activeFilters.length;
      setActiveFilters([]);
      console.log(`Cleared all AMR_Animal specimen type filters (${clearedCount} filters removed)`);
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
        }, 8000); // 8 second timeout
        
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

  // Load data when filters change
  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading AMR_Animal specimen type distribution data...');
        console.log('Active filters:', activeFilters);
        
        // Build query parameters for filters
        const queryParams = new URLSearchParams();
        activeFilters.forEach(filter => {
          queryParams.append(filter.type, filter.value);
        });
        
        const filterQuery = queryParams.toString();
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-specimen-type-distribution${filterQuery ? `?${filterQuery}` : ''}`;
        
        console.log('Fetching from URL:', url);
        console.log('Applied filter query:', filterQuery);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check if component was unmounted
        if (isCancelled) return;
        
        console.log('Received AMR_Animal specimen type data:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch animal specimen type data');
        }
        
        // Process the real data
        const processedData = data.distributionData.map((item: any, index: number) => ({
          name: item.name,
          value: item.value,
          percentage: item.percentage,
          color: generateColor(index)
        }));
        
        setDistributionData(processedData);
        setTotalRecords(data.totalRecords);
        
        console.log(`Loaded ${data.totalRecords} animal health records with ${processedData.length} unique specimen types`);
        if (data.appliedFilters && data.appliedFilters.length > 0) {
          console.log('Backend applied filters:', data.appliedFilters);
        }
        
      } catch (err) {
        if (err.name === 'AbortError' || isCancelled) {
          console.log('AMR_Animal specimen type data fetch was cancelled');
          return;
        }
        
        console.error('Error loading AMR_Animal specimen type data:', err);
        setError(`Failed to load animal health specimen type distribution data: ${err.message}`);
        
        // Fallback to empty data on error
        setDistributionData([]);
        setTotalRecords(0);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    
    // Small delay to debounce rapid filter changes
    const timeoutId = setTimeout(loadData, 100);

    return () => {
      isCancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [activeFilters]);

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            Animal Health - Specimen Type Distribution Analysis
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />}
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
                console.log(`${showTable ? 'Show chart' : 'Show table'} view for specimen type animal data`);
              }}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log('Download specimen type animal chart data');
                // TODO: Implement download functionality
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 m-[0px]">
            Distribution of veterinary specimens by type (SPEC_TYPE) • 
            {activeFilters.length > 0 ? (
              <span className="font-medium text-blue-600 ml-1"> 
                Filtered ({activeFilters.length} filter{activeFilters.length === 1 ? '' : 's'}): {totalRecords.toLocaleString()} veterinary records
              </span>
            ) : (
              <span className="text-gray-700 ml-1"> Total: {totalRecords.toLocaleString()} veterinary records</span>
            )}

            {loading && (
              <span className="ml-2 text-gray-500 italic">
                (Updating...)
              </span>
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

      <CardContent className="pt-[0px] pr-[24px] pb-[35px] pl-[24px]">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">
              <strong>⚠️ Data Error:</strong> {error}
            </p>
            <p className="text-red-600 text-xs mt-1">
              Unable to load veterinary specimen type distribution data. Please check your connection and try again.
            </p>
          </div>
        )}
        
        {showTable ? (
          /* Table View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Specimen Type Distribution Data Table
              </h4>
              <span className="text-sm text-gray-500">
                Showing all {distributionData.length} specimen type entries
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading specimen type distribution...</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg">
                <TableComponent>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead className="flex-1">Specimen Type</TableHead>
                      <TableHead className="w-24 text-right">Count</TableHead>
                      <TableHead className="w-24 text-right">Percentage</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributionData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-gray-500">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.value.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.percentage.toFixed(1)}%
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
          <div className="flex gap-2">
            {/* Main Chart Area */}
            <div className="w-[400px] p-[0px] mt-[0px] mr-[0px] mb-[0px] ml-[40px]">
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading specimen type distribution...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width={400} height={400}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={180}
                      innerRadius={100}
                      fill="#8884d8"
                      dataKey="percentage"
                      stroke="#fff"
                      strokeWidth={1}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<SpecimenTypeTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2 my-[25px] mx-[0px] mt-[25px] mr-[0px] mb-[20px] ml-[160px] px-[0px] py-[5px]">
              <h4 className="font-medium mb-4 text-[15px] px-[20px] py-[0px]">
                Specimen Types
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (All types shown)
                </span>
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
                distributionData.map((item, index) => (
                  <div key={index} className="flex items-start justify-between rounded mx-[0px] my-[2px] mt-[0px] mr-[0px] mb-[2px] ml-[0px] px-[8px] px-[20px] py-[4px]">
                    <div className="flex items-start gap-3 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-700 text-sm truncate min-w-0 text-[14px]">
                        {item.name.substring(0, 35)}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-sm font-semibold text-[14px]">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-[30px] pt-4 border-t border-gray-200 mr-[0px] mb-[0px] ml-[0px]">
          <p className="text-xs text-gray-500">
            Veterinary specimen type distribution analysis from animal health surveillance database. Showing specimen type composition across {totalRecords.toLocaleString()} total veterinary isolates.
            {!loading && activeFilters.length > 0 && ` • Filtered view with ${activeFilters.length} active filter${activeFilters.length > 1 ? 's' : ''}`}
            {!loading && activeFilters.length === 0 && ` • Showing all veterinary isolates with available data`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}