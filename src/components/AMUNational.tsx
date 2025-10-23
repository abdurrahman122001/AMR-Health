import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Download, Table } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { makeServerRequest } from '../utils/supabase/client';
import { SearchableSelect } from './SearchableSelect';



// Dynamic filter options based on AMU_HH table column headers
const filterTypeOptions = [
  { value: 'age_cat', label: 'Age Category' },
  { value: 'antibiotic_yn', label: 'Antibiotic Prescribed (Y/N)' },
  { value: 'antimicrobial_name', label: 'Antimicrobial Name' },
  { value: 'atc2', label: 'ATC Level 2' },
  { value: 'atc3', label: 'ATC Level 3' },
  { value: 'atc4', label: 'ATC Level 4' },
  { value: 'atc5', label: 'ATC Level 5' },
  { value: 'aware', label: 'AWaRe Classification' },
  { value: 'biomarker', label: 'Biomarker' },
  { value: 'biomarker_fluid', label: 'Biomarker Fluid' },
  { value: 'county', label: 'County' },
  { value: 'culture_to_lab_bal', label: 'Culture to Lab - BAL' },
  { value: 'culture_to_lab_blood', label: 'Culture to Lab - Blood' },
  { value: 'culture_to_lab_cerebrospin_flu', label: 'Culture to Lab - Cerebrospinal Fluid' },
  { value: 'culture_to_lab_other', label: 'Culture to Lab - Other' },
  { value: 'culture_to_lab_sputum', label: 'Culture to Lab - Sputum' },
  { value: 'culture_to_lab_stool', label: 'Culture to Lab - Stool' },
  { value: 'culture_to_lab_urine', label: 'Culture to Lab - Urine' },
  { value: 'culture_to_lab_wound', label: 'Culture to Lab - Wound' },
  { value: 'culture_to_lab_yesno', label: 'Culture to Lab (Y/N)' },
  { value: 'dept_name', label: 'Department Name' },
  { value: 'dept_type', label: 'Department Type' },
  { value: 'diagnosis', label: 'Diagnosis' },
  { value: 'diagnosis_code', label: 'Diagnosis Code' },
  { value: 'diagnosis_site', label: 'Diagnosis Site' },
  { value: 'district', label: 'District' },
  { value: 'guideline_compliance', label: 'Guideline Compliance' },
  { value: 'indication', label: 'Indication' },
  { value: 'is_a_stopreview_date_documente', label: 'Stop/Review Date Documented' },
  { value: 'main_dept', label: 'Main Department' },
  { value: 'mccabe_score', label: 'McCabe Score' },
  { value: 'mixed_dept', label: 'Mixed Department' },
  { value: 'name', label: 'Name' },
  { value: 'reason_in_notes', label: 'Reason in Notes' },
  { value: 'route', label: 'Route' },
  { value: 'sex', label: 'Sex' },
  { value: 'sub_dept', label: 'Sub Department' },
  { value: 'subtype', label: 'Subtype' },
  { value: 'teaching', label: 'Teaching' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'treatment_based_on_biomarker_d', label: 'Treatment Based on Biomarker' },
  { value: 'validated', label: 'Validated' },
  { value: 'year_of_survey', label: 'Year of Survey' }
];

interface Filter {
  type: string;
  value: string;
  label: string;
}

interface FilterValueOption {
  value: string;
  label: string;
}

// Custom tooltip component for AMU data
const AMUNationalTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{data.payload.name}</p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">{data.value}%</span> of patient records
        </p>
      </div>
    );
  }
  return null;
};

export function AMUNational() {
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [prevalenceData, setPrevalenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayMode, setDisplayMode] = useState<'chart' | 'table'>('chart');
  
  // Dynamic filter value management
  const [filterValueCache, setFilterValueCache] = useState<Record<string, FilterValueOption[]>>({});
  const [loadingFilterValues, setLoadingFilterValues] = useState<Record<string, boolean>>({});
  const [filterValueErrors, setFilterValueErrors] = useState<Record<string, string>>({});

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

      const options: FilterValueOption[] = sortedValues.map((value: any) => ({
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

  // Fetch data from AMU_HH table when component mounts or filters change
  useEffect(() => {
    const fetchPrevalenceData = async () => {
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
        
        console.log('🔍 AMU Prevalence Query Debug:');
        console.log('  - Active filters count:', activeFilters.length);
        console.log('  - Query params string:', queryParams.toString());
        console.log('  - Active filters details:', activeFilters);
        
        const data = await makeServerRequest(`amu-prevalence?${queryParams.toString()}`);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 AMU Prevalence Response:');
        console.log('  - Total records returned:', data.totalRecords);
        console.log('  - Data source:', data.dataSource);
        console.log('  - Full response:', data);
        
        setPrevalenceData(data);
        
      } catch (err) {
        console.error('Error fetching AMU prevalence data from AMU_HH:', err);
        setError(err.message || 'Failed to access AMU_HH table');
        setPrevalenceData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrevalenceData();
  }, [activeFilters]);

  const computedData = useMemo(() => {
    if (!prevalenceData || error) {
      return {
        data: [
          { name: 'No data available', value: 100, color: '#e5e7eb' }
        ],
        totalRecords: 0,
        hospitalName: 'All Hospitals'
      };
    }

    return {
      data: prevalenceData.data || [],
      totalRecords: prevalenceData.totalRecords || 0,
      hospitalName: prevalenceData.hospitalName || 'All Hospitals'
    };
  }, [prevalenceData, error]);

  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeOption = filterTypeOptions.find(opt => opt.value === filterType);
        const valueOption = getFilterValueOptions(filterType).find(opt => opt.value === filterValue);
        
        if (typeOption && valueOption) {
          const newFilter: Filter = {
            type: filterType,
            value: filterValue,
            label: `${typeOption.label}: ${valueOption.label}`
          };
          
          // Avoid duplicate filters
          const isDuplicate = activeFilters.some(
            filter => filter.type === newFilter.type && filter.value === newFilter.value
          );
          
          if (!isDuplicate) {
            setActiveFilters([...activeFilters, newFilter]);
          }
        }
        
        // Reset form
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">AMU Prevalence Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => setDisplayMode(displayMode === 'chart' ? 'table' : 'chart')}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                // Add download functionality here
                console.log('Download AMU National prevalence data');
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Patient Records with ≥1 Antimicrobial Prescribed • 
          {activeFilters.length > 0 ? (
            <span className="font-medium text-blue-600"> 
              Filtered ({activeFilters.length} filter{activeFilters.length === 1 ? '' : 's'}): {computedData.totalRecords} records
            </span>
          ) : (
            <span className="text-gray-700"> Total: {computedData.totalRecords} records</span>
          )}
          {computedData.hospitalName !== 'All Hospitals' && (
            <span className="ml-2 text-blue-600 font-medium">
              ({computedData.hospitalName})
            </span>
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
                  <h3 className="font-semibold text-gray-900 text-sm cursor-help">Filter Data:</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dynamic filters from AMU_HH table columns (42 available)</p>
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
              onClick={filterHelpers.addFilter}
              disabled={!filterType || !filterValue || loadingFilterValues[filterType] || filterValueErrors[filterType]}
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

      <CardContent className="pt-[0px] pr-[24px] pb-[35px] pl-[24px]">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">
              <strong>⚠️ Data Error:</strong> {error}
            </p>
            <p className="text-red-600 text-xs mt-1">
              Unable to load data from AMU_HH table. Please check your connection and try again.
            </p>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading AMU data...</p>
            </div>
          </div>
        ) : displayMode === 'table' ? (
          /* Table View */
          <div>
            <TableComponent>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right w-24">Count</TableHead>
                  <TableHead className="text-right w-20">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computedData.data?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.count?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.value}%
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </TableComponent>
            <p className="text-sm text-gray-500 mt-4">
              Total records: {computedData.totalRecords?.toLocaleString() || 0}
              {computedData.hospitalName !== 'All Hospitals' && (
                <span className="ml-2 text-blue-600 font-medium">
                  ({computedData.hospitalName})
                </span>
              )}
            </p>
          </div>
        ) : (
          /* Chart View */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Donut Chart */}
            <div className="lg:col-span-3 flex justify-center">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={computedData.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={180}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {computedData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<AMUNationalTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="lg:col-span-2 space-y-2 py-[5px] px-[0px] p-[0px] my-[35px] mx-[0px] my-[100px]">
              {computedData.data.map((entry, index) => (
                <div key={entry.name} className="flex items-start justify-between rounded py-[5px] py-[6px] px-[8px] mx-[0px] my-[2px]">
                  <div className="flex items-start gap-3 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-gray-700 text-sm">
                      {entry.name}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-sm font-semibold">
                      {entry.value}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
         {/* Footnote */}
              <div className="mt-[30px] pt-4 border-t border-gray-200 mr-[0px] mb-[0px] ml-[0px]">
                <p className="text-xs text-gray-500">
                  PPS data; excludes topical antibacterials and anti-TB drugs.
                </p>
              </div>
      </CardContent>
    </Card>
  );
}