import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Table as TableIcon, Download, Shield, AlertTriangle, ChevronDown, Check, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { SearchableSelect } from './SearchableSelect';
import { cn } from './ui/utils';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DonutData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface MDRAllIsolatesDataResponse {
  totalIsolates: number;
  mdrIsolates: number;
  nonMdrIsolates: number;
  mdrPercentage: number;
  nonMdrPercentage: number;
  donutData: DonutData[];
}

interface MDRResistantDataResponse {
  totalResistantIsolates: number;
  mdrAmongResistant: number;
  nonMdrResistant: number;
  mdrPercentage: number;
  nonMdrPercentage: number;
  donutData: DonutData[];
}

interface MDRBacteriaIntegratedProps {
  activeFilters?: Array<{ column: string; value: string; label: string }>;
}

export function MDRBacteriaIntegrated({ activeFilters: externalActiveFilters = [] }: MDRBacteriaIntegratedProps) {
  const [viewType, setViewType] = useState<'all' | 'resistant'>('all');
  const [viewTypeDropdownOpen, setViewTypeDropdownOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const viewTypeOptions = [
    { value: 'all', label: 'All Isolates' },
    { value: 'resistant', label: 'Resistant Isolates' }
  ];
  const [allIsolatesData, setAllIsolatesData] = useState<MDRAllIsolatesDataResponse | null>(null);
  const [resistantData, setResistantData] = useState<MDRResistantDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state management
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterTypeOpen, setFilterTypeOpen] = useState(false);
  const [filterValueOpen, setFilterValueOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, Array<{value: string, label: string}>>>({});

  // Fetch filter options from server
  const fetchFilterOptions = async (column: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-filter-values?column=${column}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.values) {
          return data.values.map((option: any) => ({
            value: String(option),
            label: String(option)
          }));
        }
      }
    } catch (error) {
      console.error(`Error fetching ${column} options:`, error);
    }
    return [];
  };

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      const amrColumns = ['SEX', 'AGE_CAT', 'PAT_TYPE', 'INSTITUTION', 'DEPARTMENT', 'WARD_TYPE', 'YEAR_SPEC', 'X_REGION'];
      const newFilterOptions: Record<string, Array<{value: string, label: string}>> = {};

      const columnLabels: Record<string, string> = {
        'SEX': 'Sex',
        'AGE_CAT': 'Age Category',
        'PAT_TYPE': 'Patient Type',
        'INSTITUTION': 'Institution',
        'DEPARTMENT': 'Department',
        'WARD_TYPE': 'Ward Type',
        'YEAR_SPEC': 'Year Specimen Collected',
        'X_REGION': 'Region'
      };

      for (const column of amrColumns) {
        const options = await fetchFilterOptions(column);
        if (options.length > 0) {
          newFilterOptions[column.toLowerCase()] = options;
        }
      }

      setFilterOptions(newFilterOptions);
    };

    loadFilterOptions();
  }, []);

  // Combined filter configurations
  const filterConfigs = useMemo(() => {
    const columnLabels: Record<string, string> = {
      'sex': 'Sex',
      'age_cat': 'Age Category',
      'pat_type': 'Patient Type',
      'institution': 'Institution',
      'department': 'Department',
      'ward_type': 'Ward Type',
      'year_spec': 'Year Specimen Collected',
      'x_region': 'Region'
    };

    const configs: Record<string, { label: string; options: Array<{value: string, label: string}> }> = {};
    
    Object.entries(filterOptions).forEach(([key, options]) => {
      configs[key] = {
        label: columnLabels[key] || key,
        options
      };
    });

    return configs;
  }, [filterOptions]);

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

  const fetchAllIsolatesData = async () => {
    try {
      console.log('Fetching MDR bacteria all isolates data');
      
      // Build query parameters from active filters
      const params = new URLSearchParams();
      activeFilters.forEach(filter => {
        // Map filter types to AMR_HH column names
        const columnMapping: Record<string, string> = {
          'sex': 'SEX',
          'age_cat': 'AGE_CAT',
          'pat_type': 'PAT_TYPE',
          'institution': 'INSTITUTION',
          'department': 'DEPARTMENT',
          'ward_type': 'WARD_TYPE',
          'year_spec': 'YEAR_SPEC',
          'x_region': 'X_REGION'
        };
        
        const columnName = columnMapping[filter.type];
        if (columnName) {
          const filterValue = String(filter.value).trim();
          if (filterValue && filterValue !== '') {
            params.append(columnName, filterValue);
          }
        }
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/mdr-bacteria-all-isolates?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('MDR bacteria all isolates response:', result);

      if (result.success && result.data) {
        setAllIsolatesData(result.data);
      } else {
        throw new Error(result.error || 'No MDR all isolates data received');
      }
    } catch (err) {
      console.error('Error fetching MDR all isolates data:', err);
      throw err;
    }
  };

  const fetchResistantData = async () => {
    try {
      console.log('Fetching MDR bacteria resistant isolates data');
      
      // Build query parameters from active filters
      const params = new URLSearchParams();
      activeFilters.forEach(filter => {
        // Map filter types to AMR_HH column names
        const columnMapping: Record<string, string> = {
          'sex': 'SEX',
          'age_cat': 'AGE_CAT',
          'pat_type': 'PAT_TYPE',
          'institution': 'INSTITUTION',
          'department': 'DEPARTMENT',
          'ward_type': 'WARD_TYPE',
          'year_spec': 'YEAR_SPEC',
          'x_region': 'X_REGION'
        };
        
        const columnName = columnMapping[filter.type];
        if (columnName) {
          const filterValue = String(filter.value).trim();
          if (filterValue && filterValue !== '') {
            params.append(columnName, filterValue);
          }
        }
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/mdr-bacteria-resistant-isolates?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('MDR bacteria resistant isolates response:', result);

      if (result.success && result.data) {
        setResistantData(result.data);
      } else {
        throw new Error(result.error || 'No MDR resistant data received');
      }
    } catch (err) {
      console.error('Error fetching MDR resistant data:', err);
      throw err;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both datasets
      await Promise.all([
        fetchAllIsolatesData(),
        fetchResistantData()
      ]);

    } catch (err) {
      console.error('Error fetching MDR bacteria data:', err);
      setError(`Failed to load MDR bacteria data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeFilters]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{data.value.toLocaleString()}</span> isolates
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{data.percentage.toFixed(1)}%</span> of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Get current data based on view type
  const currentData = viewType === 'all' ? allIsolatesData : resistantData;
  const currentIcon = viewType === 'all' ? Shield : AlertTriangle;
  const currentIconColor = viewType === 'all' ? 'text-red-600' : 'text-orange-600';
  const currentTitle = viewType === 'all' 
    ? 'MDR Bacteria % of All Indicator Bacteria Isolates'
    : 'MDR Bacteria % of Resistant Indicator Bacteria Isolates';
  const currentDescription = viewType === 'all'
    ? 'Multi-drug resistant indicator bacteria as percentage of all isolates with valid AST data'
    : 'Multi-drug resistant indicator bacteria as percentage of all resistant isolates';
  const currentLegendLabel = viewType === 'all' ? '(Valid AST Data)' : '(Among Resistant)';

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-medium">MDR Bacteria % of</span>
            
            {/* Inline View Type Dropdown */}
            <Popover open={viewTypeDropdownOpen} onOpenChange={setViewTypeDropdownOpen}>
              <PopoverTrigger asChild>
                <button
                  role="combobox"
                  aria-expanded={viewTypeDropdownOpen}
                  className="inline-flex items-center gap-1 text-lg font-medium text-primary hover:text-blue-600 cursor-pointer transition-colors focus:outline-none focus:underline"
                >
                  <span className="text-[rgb(32,102,118)] not-italic">
                    {viewTypeOptions.find(opt => opt.value === viewType)?.label || 'All Isolates'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search view type..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No view type found.</CommandEmpty>
                    <CommandGroup>
                      {viewTypeOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => {
                            setViewType(option.value as 'all' | 'resistant');
                            setViewTypeDropdownOpen(false);
                            console.log(`Selected view type: ${option.value}`);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              viewType === option.value ? "opacity-100" : "opacity-0"
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
              onClick={() => {
                setShowTable(!showTable);
                console.log(`${showTable ? 'Show chart' : 'Show table'} view for MDR bacteria ${viewType} data`);
              }}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log(`Download MDR bacteria ${viewType} data`);
                // TODO: Implement download functionality
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 m-[0px] text-[13px] font-bold font-normal">
          {currentDescription}
          {loading && (
            <span className="ml-2 text-gray-500 italic">
              (Updating...)
            </span>
          )}
        </p>
        
        {/* Inline Filter Controls */}
        <div className="bg-gray-50 rounded-lg p-4 border mt-[10px] mr-[0px] mb-[0px] ml-[0px]">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter MDR Data:</h3>
            
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
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${
                viewType === 'all' ? 'border-red-600' : 'border-orange-600'
              }`}></div>
              <p className="text-gray-600">Loading MDR bacteria data...</p>
            </div>
          </div>
        ) : currentData ? (
          <>
            {showTable ? (
              /* Table View */
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="min-w-[200px]">Category</TableHead>
                      <TableHead className="w-32 text-right">Count</TableHead>
                      <TableHead className="w-32 text-right">Percentage</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.donutData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-gray-500">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.value.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium" style={{ color: item.color }}>
                            {item.percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div 
                            className="inline-block w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Summary Statistics in Table View */}
                <div className="border-t bg-gray-50 p-4">
                  <h4 className="font-medium mb-3 text-sm">Summary Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {viewType === 'all' ? (
                      <>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Total Isolates</p>
                          <p className="text-lg font-semibold">{(allIsolatesData as MDRAllIsolatesDataResponse).totalIsolates.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">MDR Isolates</p>
                          <p className="text-lg font-semibold text-red-600">{(allIsolatesData as MDRAllIsolatesDataResponse).mdrIsolates.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Non-MDR</p>
                          <p className="text-lg font-semibold text-green-600">{(allIsolatesData as MDRAllIsolatesDataResponse).nonMdrIsolates.toLocaleString()}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Total Resistant</p>
                          <p className="text-lg font-semibold">{(resistantData as MDRResistantDataResponse).totalResistantIsolates.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">MDR Resistant</p>
                          <p className="text-lg font-semibold text-red-600">{(resistantData as MDRResistantDataResponse).mdrAmongResistant.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Non-MDR Resistant</p>
                          <p className="text-lg font-semibold text-orange-600">{(resistantData as MDRResistantDataResponse).nonMdrResistant.toLocaleString()}</p>
                        </div>
                      </>
                    )}
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
                        data={currentData.donutData}
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
                        {currentData.donutData.map((entry, index) => (
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
                        {currentData.mdrPercentage}% MDR
                      </text>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend and Stats */}
                <div className="w-80 flex-shrink-0 space-y-2 my-[25px] mx-[0px] mt-[25px] mr-[0px] mb-[20px] ml-[0px] px-[0px] py-[5px]">
                  <h4 className="font-medium mb-4">
                    MDR Distribution
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      {currentLegendLabel}
                    </span>
                  </h4>

                  {/* Legend Items */}
                  <div className="space-y-2">
                    {currentData.donutData.map((item, index) => (
                      <div key={index} className="flex items-start justify-between rounded mx-[0px] my-[2px] mt-[0px] mr-[0px] mb-[2px] ml-[0px] px-[8px] py-[4px]">
                        <div className="flex items-start gap-3 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-gray-700 text-sm truncate min-w-0">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-sm font-semibold">
                            {item.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Key Statistics */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      {viewType === 'all' ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Isolates:</span>
                            <span className="text-sm font-medium">{(allIsolatesData as MDRAllIsolatesDataResponse).totalIsolates.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">MDR Isolates:</span>
                            <span className="text-sm font-medium text-red-600">{(allIsolatesData as MDRAllIsolatesDataResponse).mdrIsolates.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Non-MDR:</span>
                            <span className="text-sm font-medium text-green-600">{(allIsolatesData as MDRAllIsolatesDataResponse).nonMdrIsolates.toLocaleString()}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 truncate">Total Resistant:</span>
                            <span className="text-sm font-medium flex-shrink-0 ml-2">{(resistantData as MDRResistantDataResponse).totalResistantIsolates.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 truncate">MDR Resistant:</span>
                            <span className="text-sm font-medium text-red-600 flex-shrink-0 ml-2">{(resistantData as MDRResistantDataResponse).mdrAmongResistant.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 truncate">Non-MDR Resistant:</span>
                            <span className="text-sm font-medium text-orange-600 flex-shrink-0 ml-2">{(resistantData as MDRResistantDataResponse).nonMdrResistant.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Alert Level Indicator removed */}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No MDR data available</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {viewType === 'all' ? (
              <>
                Calculation: ((MDR_TF === TRUE) / (VALID_AST === TRUE)) × 100. 
                Includes organisms: S. aureus, E. coli, S. pneumoniae, K. pneumoniae, Enterobacter spp., E. faecium, E. faecalis.
              </>
            ) : (
              <>
                Calculation: ((MDR_TF === TRUE) / (ANY_R === TRUE)) × 100. 
                Shows MDR prevalence specifically among isolates with confirmed resistance to at least one antibiotic.
                Includes organisms: S. aureus, E. coli, S. pneumoniae, K. pneumoniae, Enterobacter spp., E. faecium, E. faecalis.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}