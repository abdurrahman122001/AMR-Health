import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Download, Users, ChevronDown, Check, Table as TableIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { SearchableSelect } from './SearchableSelect';
import { cn } from './ui/utils';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface IncidenceData {
  category: string;
  total: number;
  mdrCases: number;
  incidenceRate: number; // Rate per 1000 admissions
}

interface MDRIncidenceDemographicsProps {
  activeFilters: Array<{ column: string; value: string; label: string }>;
}

export function MDRIncidenceDemographics({ activeFilters: externalActiveFilters = [] }: MDRIncidenceDemographicsProps) {
  const [incidenceData, setIncidenceData] = useState<IncidenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemographic, setSelectedDemographic] = useState('INSTITUTION');
  const [selectedDemographicOpen, setSelectedDemographicOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // Filter state management
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterTypeOpen, setFilterTypeOpen] = useState(false);
  const [filterValueOpen, setFilterValueOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Array<{ type: string, value: string, label: string }>>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, Array<{ value: string, label: string }>>>({});

  // Organism mapping state
  const [organismMappings, setOrganismMappings] = useState<Record<string, string>>({});

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

  // Fetch filter options from server
  const fetchFilterOptions = async (column: string) => {
    try {
      const response = await fetch('https://backend.ajhiveprojects.com/v1/amr-health-v2', {
        method: 'GET',
        headers: {
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

  // Load filter options and organism mappings on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      const amrColumns = ['SEX', 'AGE_CAT', 'PAT_TYPE', 'INSTITUTION', 'DEPARTMENT', 'WARD_TYPE', 'YEAR_SPEC', 'X_REGION'];
      const newFilterOptions: Record<string, Array<{ value: string, label: string }>> = {};

      const columnLabels: Record<string, string> = {
        'SEX': 'Sex',
        'AGE_CAT': 'Age Category',
        'PAT_TYPE': 'Patient Type',
        'INSTITUTION': 'Institution',
        'DEPARTMENT': 'Department',
        'WARD_TYPE': 'Ward Type',
        'YEAR_SPEC': 'Year Specimen',
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

    const loadOrganismMappings = async () => {
      try {
        const response = await fetch('https://backend.ajhiveprojects.com/v1/amr-health-v2', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.mappings) {
            setOrganismMappings(data.mappings);
            console.log(`Loaded ${data.totalMappings} organism name mappings`);
          }
        }
      } catch (error) {
        console.error('Error fetching organism mappings:', error);
      }
    };

    loadFilterOptions();
    loadOrganismMappings();
  }, []);

  // Combined filter configs using dynamic options
  const filterConfigs = useMemo(() => {
    const configs: Record<string, { label: string; options: Array<{ value: string, label: string }> }> = {};

    const configMapping: Record<string, string> = {
      'sex': 'Sex',
      'age_cat': 'Age Category',
      'pat_type': 'Patient Type',
      'institution': 'Institution',
      'department': 'Department',
      'ward_type': 'Ward Type',
      'year_spec': 'Year Specimen',
      'x_region': 'Region'
    };

    Object.entries(configMapping).forEach(([key, label]) => {
      configs[key] = {
        label,
        options: filterOptions[key] || []
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

  const fetchIncidenceData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching MDR incidence data with demographic:', selectedDemographic);
      console.log('Active filters:', activeFilters);

      // Build query parameters
      const params = new URLSearchParams({
        groupBy: selectedDemographic
      });

      // Add minimum isolate count filter (30+ isolates)
      params.append('MIN_ISOLATES', '30');
      console.log('Adding minimum isolates filter: MIN_ISOLATES = 30');

      // Add active filters with column mapping
      activeFilters.forEach(filter => {
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

      const response = await fetch('https://backend.ajhiveprojects.com/v1/amr-health-v2', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('MDR incidence response:', result);

      if (result.success && result.data?.incidenceRates) {
        setIncidenceData(result.data.incidenceRates);
      } else {
        throw new Error(result.error || 'No incidence data received');
      }

    } catch (err) {
      console.error('Error fetching MDR incidence data:', err);
      setError(`Failed to load MDR incidence data: ${err.message}`);
      setIncidenceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidenceData();
  }, [selectedDemographic, activeFilters]);

  // Helper function to get display name for organism codes
  const getDisplayName = (category: string) => {
    if (selectedDemographic === 'ORGANISM' && organismMappings[category]) {
      return organismMappings[category];
    }
    return category;
  };

  // Mapped data with organism names when viewing by organism
  const displayData = useMemo(() => {
    return incidenceData.map(item => ({
      ...item,
      displayCategory: getDisplayName(item.category)
    }));
  }, [incidenceData, selectedDemographic, organismMappings]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${data.displayCategory || label}`}</p>
          <p className="text-red-600">
            <span className="font-medium">MDR Cases:</span> {data.mdrCases.toLocaleString()}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Total Isolates:</span> {data.total.toLocaleString()}
          </p>
          <p className="text-blue-600">
            <span className="font-medium">Incidence Rate:</span> {data.incidenceRate.toFixed(1)} per 1000 admissions
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
            <span className="text-lg font-medium">MDRO Incidence by</span>

            {/* Inline Demographic Dropdown */}
            <Popover open={selectedDemographicOpen} onOpenChange={setSelectedDemographicOpen}>
              <PopoverTrigger asChild>
                <button
                  role="combobox"
                  aria-expanded={selectedDemographicOpen}
                  className="inline-flex items-center gap-1 text-lg font-medium text-primary hover:text-blue-600 cursor-pointer transition-colors focus:outline-none focus:underline"
                >
                  <span className="text-[rgb(32,102,118)] not-italic">
                    {demographicOptions.find(opt => opt.value === selectedDemographic)?.label || 'Institution'}
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
                            console.log(`Selected demographic: ${option.value}`);
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
              className={`h-8 w-8 px-[5px] py-[0px] ${showTable
                ? 'text-blue-600 bg-blue-50 hover:text-blue-700 hover:bg-blue-100'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => {
                setShowTable(!showTable);
                console.log(`${showTable ? 'Show chart' : 'Show table'} view for MDR incidence by ${selectedDemographic}`);
              }}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log('Download MDR incidence data');
                // TODO: Implement download functionality
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-600 m-[0px] text-[13px] font-bold font-normal">
          Multi-drug resistant organism incidence rates per 1000 admissions across demographic groups • Showing only categories with 30+ tested isolates
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading MDRO incidence data...</p>
            </div>
          </div>
        ) : incidenceData.length > 0 ? (
          <>
            {(() => {
              // Filter to only show categories with 30+ isolates and add display names
              const filteredData = displayData.filter(item => item.total >= 30);

              return (
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
                            <TableHead className="w-32 text-right">Total Isolates</TableHead>
                            <TableHead className="w-32 text-right">MDR Cases</TableHead>
                            <TableHead className="w-32 text-right">Incidence Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.length > 0 ? filteredData.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium text-gray-500">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{item.displayCategory}</span>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {item.total.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-medium text-red-600">
                                  {item.mdrCases.toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-medium text-blue-600">
                                  {item.incidenceRate.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">per 1000</span>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                No categories with 30+ isolates found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>

                      {/* Summary Statistics in Table View */}
                      {filteredData.length > 0 && (
                        <div className="border-t bg-gray-50 p-4">
                          <h4 className="font-medium mb-3 text-sm">Summary Statistics (30+ isolates only)</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1">Total Isolates</p>
                              <p className="text-lg font-semibold">
                                {filteredData.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1">MDR Cases</p>
                              <p className="text-lg font-semibold text-red-600">
                                {filteredData.reduce((sum, item) => sum + item.mdrCases, 0).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1">Overall Rate</p>
                              <p className="text-lg font-semibold text-blue-600">
                                {filteredData.length > 0
                                  ? ((filteredData.reduce((sum, item) => sum + item.mdrCases, 0) /
                                    filteredData.reduce((sum, item) => sum + item.total, 0)) * 1000).toFixed(1)
                                  : '0.0'
                                }
                                <span className="text-xs text-gray-500 ml-1">per 1000</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Chart View */
                    <div className="space-y-6">
                      {filteredData.length > 0 ? (
                        <>
                          {/* Bar Chart */}
                          {(() => {
                            // Calculate the maximum value from the data and round up to the next multiple of 50 for better scale
                            const maxDataValue = Math.max(...filteredData.map(item => item.incidenceRate));
                            const maxYAxis = Math.ceil(maxDataValue / 50) * 50;

                            return (
                              <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                  data={filteredData}
                                  margin={{ top: 5, right: 30, left: 5, bottom: 40 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis
                                    dataKey="displayCategory"
                                    type="category"
                                    angle={-45}
                                    textAnchor="end"
                                    height={20}
                                    interval={0}
                                    tickFormatter={(value) => value?.substring(0, 12)}
                                    style={{ fontSize: '12px' }}
                                  />
                                  <YAxis
                                    type="number"
                                    domain={[0, maxYAxis]}
                                    tickFormatter={(value) => `${value.toFixed(0)}`}
                                    tickCount={8}
                                    label={{
                                      value: 'Rate per 1000 admissions',
                                      angle: -90,
                                      position: 'insideLeft',
                                      style: { fontSize: '12px', textAnchor: 'middle' }
                                    }}
                                    style={{ fontSize: '12px' }}
                                  />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Bar
                                    dataKey="incidenceRate"
                                    fill="#dc2626"
                                    radius={[4, 4, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            );
                          })()}


                        </>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-500">No categories with 30+ isolates found</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No MDRO incidence data available</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            MDRO incidence rates per 1000 admissions from AMR surveillance database. Higher rates indicate increased multi-drug resistance burden in specific demographic groups.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}