import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Table as TableIcon, Download, ChevronDown, Check } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from './ui/utils';

interface OrganismData {
  organism: string;
  organismName: string;
  count: number;
  percentage: number;
  color: string;
}

interface AllIsolatesResponse {
  totalIsolates: number;
  organisms: OrganismData[];
}

interface AllIsolatesDistributionProps {
  activeFilters?: Array<{ column: string; value: string; label: string }>;
}

interface ApiResponse {
  success: boolean;
  data: {
    nodeId: string;
    nodeName: string;
    totalRows: number;
    columns: string[];
    rows: any[];
  };
}

export function AllIsolatesDistribution({ activeFilters: externalActiveFilters = [] }: AllIsolatesDistributionProps) {
  const [showTable, setShowTable] = useState(false);
  const [data, setData] = useState<AllIsolatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demographic selection state
  const [selectedDemographic, setSelectedDemographic] = useState('ORGANISM');
  const [selectedDemographicOpen, setSelectedDemographicOpen] = useState(false);

  // Filter state management
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterTypeOpen, setFilterTypeOpen] = useState(false);
  const [filterValueOpen, setFilterValueOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  const demographicOptions = [
    { value: 'SEX', label: 'Sex' },
    { value: 'AGE_CAT', label: 'Age Category' },
    { value: 'INSTITUTION', label: 'Institution' },
    { value: 'DEPARTMENT', label: 'Department' },
    { value: 'WARD_TYPE', label: 'Ward Type' },
    { value: 'PAT_TYPE', label: 'Patient Type' },
    { value: 'SPEC_TYPE', label: 'Specimen Type' },
    { value: 'YEAR_SPEC', label: 'Year' },
    { value: 'ORGANISM', label: 'Organism' }
  ];

  // Color palette for charts
  const colorPalette = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#ec4899',
    '#14b8a6', '#84cc16', '#f43f5e', '#8b5cf6', '#06b6d4',
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'
  ];

  // Helper function to extract unique values from raw data
  const extractUniqueValues = (rows: any[], columnName: string): Array<{value: string, label: string}> => {
    const uniqueValues = new Set();
    
    rows.forEach(row => {
      const value = row[columnName];
      if (value !== undefined && value !== null && value !== '') {
        uniqueValues.add(value.toString().trim());
      }
    });
    
    const sortedValues = Array.from(uniqueValues).sort((a: any, b: any) => 
      a.toString().localeCompare(b.toString())
    );
    
    return sortedValues.map((value: any) => ({
      value: value,
      label: value
    }));
  };

  // Calculate distribution data from raw rows
  const calculateDistributionData = (rows: any[], groupBy: string): AllIsolatesResponse => {
    const counts: { [key: string]: number } = {};
    let totalIsolates = 0;

    // Count isolates by the selected demographic
    rows.forEach(row => {
      const category = row[groupBy];
      if (category && category.toString().trim() !== '') {
        const categoryKey = category.toString().trim();
        counts[categoryKey] = (counts[categoryKey] || 0) + 1;
        totalIsolates++;
      }
    });

    // Convert to array and sort by count descending
    const sortedCategories = Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate percentages and assign colors
    const organisms = sortedCategories.map((item, index) => ({
      organism: item.category,
      organismName: item.category,
      count: item.count,
      percentage: totalIsolates > 0 ? (item.count / totalIsolates) * 100 : 0,
      color: colorPalette[index % colorPalette.length]
    }));

    return {
      totalIsolates,
      organisms
    };
  };

  // Fetch all data from local API endpoint
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching all AMR data from local API for Isolates Distribution...');
      const response = await fetch('http://localhost:5001/v1/amr-health-v2', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiData: ApiResponse = await response.json();
      console.log('Full API response received for Isolates Distribution:', apiData);

      if (!apiData.success || !apiData.data || !apiData.data.rows) {
        throw new Error('Invalid API response format');
      }

      const rows = apiData.data.rows;
      
      // Process distribution data from raw rows
      const processedData = calculateDistributionData(rows, selectedDemographic);
      setData(processedData);
      
      console.log('Distribution data calculated:', processedData);

    } catch (error) {
      console.error('Error fetching AMR data from local API for Isolates Distribution:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Filter configs using dynamic options from API data
  const filterConfigs = useMemo(() => {
    const configs: Record<string, { label: string; options: Array<{value: string, label: string}> }> = {};

    const configMapping: Record<string, string> = {
      'SEX': 'Sex',
      'AGE_CAT': 'Age Category',
      'PAT_TYPE': 'Patient Type',
      'INSTITUTION': 'Institution',
      'DEPARTMENT': 'Department',
      'WARD_TYPE': 'Ward Type',
      'YEAR_SPEC': 'Year Specimen',
      'X_REGION': 'Region'
    };

    // This will be populated when we have data
    Object.entries(configMapping).forEach(([key, label]) => {
      configs[key.toLowerCase()] = {
        label,
        options: [] // Will be populated when data is available
      };
    });

    return configs;
  }, []);

  // Filter helpers
  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeConfig = filterConfigs[filterType as keyof typeof filterConfigs];
        const valueOption = typeConfig?.options.find(opt => opt.value === filterValue);
        
        if (typeConfig && valueOption) {
          const newFilter = {
            type: filterType,
            value: filterValue,
            label: `${typeConfig.label}: ${valueOption.label}`
          };
          
          // Check if filter already exists
          const exists = activeFilters.some(f => f.type === filterType && f.value === filterValue);
          if (!exists) {
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

  // Get filter type options
  const getFilterTypeOptions = () => {
    return Object.entries(filterConfigs).map(([key, config]) => ({
      value: key,
      label: config.label
    }));
  };

  // Get filter value options for selected type
  const getFilterValueOptionsForType = (type: string) => {
    const config = filterConfigs[type as keyof typeof filterConfigs];
    return config?.options || [];
  };

  // Fetch data on component mount and when filters/demographic changes
  useEffect(() => {
    fetchAllData();
  }, [selectedDemographic, activeFilters]);

  // Helper function to get display name for categories
  const getDisplayName = (category: string) => {
    // For organisms, format common names
    if (selectedDemographic === 'ORGANISM') {
      const organismMappings: Record<string, string> = {
        'eco': 'E. coli',
        'kpn': 'K. pneumoniae',
        'pae': 'P. aeruginosa',
        'aba': 'A. baumannii',
        'sau': 'S. aureus',
        'efm': 'E. faecium',
        'efa': 'E. faecalis',
        'spn': 'S. pneumoniae',
        'sep': 'S. epidermidis'
      };
      return organismMappings[category.toLowerCase()] || category;
    }
    return category;
  };

  // Mapped data with formatted names
  const displayData = useMemo(() => {
    if (!data) return null;
    
    return {
      ...data,
      organisms: data.organisms.map(item => ({
        ...item,
        displayName: getDisplayName(item.organism)
      }))
    };
  }, [data, selectedDemographic]);

  // Custom tooltip for the donut chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{item.displayName || item.organismName}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Count:</span> {item.count.toLocaleString()}
          </p>
          <p className="text-sm" style={{ color: item.color }}>
            <span className="font-medium">Percentage:</span> {item.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-medium">All Isolates Distribution by</span>
            
            {/* Inline Demographic Dropdown */}
            <Popover open={selectedDemographicOpen} onOpenChange={setSelectedDemographicOpen}>
              <PopoverTrigger asChild>
                <button
                  role="combobox"
                  aria-expanded={selectedDemographicOpen}
                  className="inline-flex items-center gap-1 text-lg font-medium text-primary hover:text-blue-600 cursor-pointer transition-colors focus:outline-none focus:underline"
                >
                  <span className="text-[rgb(32,102,118)] not-italic">
                    {demographicOptions.find(opt => opt.value === selectedDemographic)?.label || 'Organism'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search demographic..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No demographic found.</CommandEmpty>
                    <CommandGroup>
                      {demographicOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => {
                            setSelectedDemographic(option.value);
                            setSelectedDemographicOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedDemographic === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 px-[5px] py-[0px] ${ 
                showTable 
                  ? 'text-blue-600 bg-blue-50 hover:text-blue-700 hover:bg-blue-100' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setShowTable(!showTable)}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => console.log('Download all isolates distribution data')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 m-[0px] text-[13px] font-bold font-normal">
          {loading ? (
            <span className="text-gray-500 italic">Loading isolate distribution...</span>
          ) : data ? (
            `Distribution of ${data.totalIsolates.toLocaleString()} valid isolates across ${data.organisms.length} ${demographicOptions.find(opt => opt.value === selectedDemographic)?.label.toLowerCase()} categories`
          ) : (
            'Isolate distribution by demographic category'
          )}
        </p>
        
        {/* Inline Filter Controls */}
        <div className="bg-gray-50 rounded-lg p-4 border mt-[10px] mr-[0px] mb-[0px] ml-[0px]">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Isolate Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Popover open={filterTypeOpen} onOpenChange={setFilterTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={filterTypeOpen}
                    className="w-full justify-between text-sm h-10"
                  >
                    {filterType
                      ? getFilterTypeOptions().find((option) => option.value === filterType)?.label
                      : "Select filter type..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search filter types..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No filter type found.</CommandEmpty>
                      <CommandGroup>
                        {getFilterTypeOptions().map((option, index) => (
                          <CommandItem
                            key={`type-${option.value}-${index}`}
                            value={option.value}
                            onSelect={(currentValue) => {
                              setFilterType(currentValue === filterType ? "" : currentValue);
                              setFilterValue("");
                              setFilterTypeOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filterType === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <Popover open={filterValueOpen} onOpenChange={setFilterValueOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={filterValueOpen}
                    disabled={!filterType}
                    className="w-full justify-between text-sm h-10"
                  >
                    {filterValue
                      ? getFilterValueOptionsForType(filterType).find((option) => option.value === filterValue)?.label
                      : filterType ? "Select value..." : "Select type first"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search values..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No value found.</CommandEmpty>
                      <CommandGroup>
                        {getFilterValueOptionsForType(filterType).map((option, index) => (
                          <CommandItem
                            key={`${filterType}-${option.value}-${index}`}
                            value={option.value}
                            onSelect={(currentValue) => {
                              setFilterValue(currentValue === filterValue ? "" : currentValue);
                              setFilterValueOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filterValue === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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

        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 m-[0px]">
            <div className="flex gap-1">
              {activeFilters.map((filter, index) => (
                <div
                  key={`inline-active-${filter.type}-${filter.value}-${index}`}
                  className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                >
                  <span className="text-[10px]">{filter.label}</span>
                  <button
                    onClick={() => filterHelpers.removeFilter(index)}
                    className="text-blue-600 hover:text-blue-800 ml-1 text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={filterHelpers.clearAllFilters}
                className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-800"
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 pr-6 pb-8 pl-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">
              <strong>⚠️ Data Error:</strong> {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading isolate distribution...</p>
            </div>
          </div>
        ) : displayData && displayData.organisms.length > 0 ? (
          <>
            {showTable ? (
              /* Table View */
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="min-w-[200px]">
                        {demographicOptions.find(opt => opt.value === selectedDemographic)?.label || 'Category'}
                      </TableHead>
                      <TableHead className="w-32 text-right">Isolate Count</TableHead>
                      <TableHead className="w-32 text-right">Percentage</TableHead>
                      <TableHead className="w-24">Indicator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData.organisms.map((organism, index) => (
                      <TableRow key={organism.organism}>
                        <TableCell className="font-medium text-gray-500">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: organism.color }}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{organism.displayName}</span>
                              {selectedDemographic === 'ORGANISM' && (
                                <span className="text-xs text-gray-500">({organism.organism})</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {organism.count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium" style={{ color: organism.color }}>
                            {organism.percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div 
                            className="inline-block w-3 h-3 rounded-full" 
                            style={{ backgroundColor: organism.color }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Summary Statistics in Table View */}
                <div className="border-t bg-gray-50 p-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Total Valid Isolates</p>
                    <p className="text-2xl font-semibold text-blue-600">{displayData.totalIsolates.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Across {displayData.organisms.length} {demographicOptions.find(opt => opt.value === selectedDemographic)?.label.toLowerCase()} categories</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Chart View */
              <div className="flex gap-6">
                {/* Donut Chart */}
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={displayData.organisms}
                        cx="40%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={180}
                        innerRadius={100}
                        fill="#8884d8"
                        dataKey="percentage"
                        stroke="#fff"
                        strokeWidth={1}
                      >
                        {displayData.organisms.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <text 
                        x="40%" 
                        y="50%" 
                        textAnchor="middle" 
                        dominantBaseline="middle" 
                        className="text-sm font-medium fill-gray-700"
                      >
                        {displayData.organisms.length} {demographicOptions.find(opt => opt.value === selectedDemographic)?.label}
                      </text>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend and Stats */}
                <div className="w-80 flex-shrink-0 space-y-2 my-[25px] mx-[0px] mt-[25px] mr-[0px] mb-[20px] ml-[0px] px-[0px] py-[5px]">
                  <h4 className="font-medium mb-4">
                    {demographicOptions.find(opt => opt.value === selectedDemographic)?.label} Distribution
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({displayData.totalIsolates.toLocaleString()} total)
                    </span>
                  </h4>

                  {/* Legend Items - Scrollable if many categories */}
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {displayData.organisms.map((organism, index) => (
                      <div key={index} className="flex items-start justify-between rounded mx-[0px] my-[2px] mt-[0px] mr-[0px] mb-[2px] ml-[0px] px-[8px] py-[4px]">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: organism.color }}
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-gray-700 text-sm truncate">
                              {organism.displayName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {organism.count.toLocaleString()} isolates
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-sm font-semibold">
                            {organism.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No isolate data available</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Shows distribution of all valid bacterial isolates across different categories. 
            Includes all organisms tested in the surveillance system from 11 Ghanaian teaching hospitals.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}