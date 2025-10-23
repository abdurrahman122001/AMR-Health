import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Download, Table } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
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

interface SexPrevalenceData {
  sex: 'M' | 'F';
  totalPatients: number;
  patientsWithAntibiotics: number;
  prevalenceRate: number;
}

interface SexPrevalenceResponse {
  totalRecords: number;
  sexData: SexPrevalenceData[];
  dataSource: string;
  tableName: string;
  timestamp: string;
}

export function AMU_Human_Overview_Sex() {
  // Toggle states for view mode
  const [viewMode, setViewMode] = useState<'Sex' | 'AMU'>('Sex');
  const [displayMode, setDisplayMode] = useState<'chart' | 'table'>('chart');
  
  // Filter states
  const [sexFilterType, setSexFilterType] = useState('');
  const [sexFilterValue, setSexFilterValue] = useState('');
  const [sexActiveFilters, setSexActiveFilters] = useState<Filter[]>([]);
  
  // Data state management
  const [sexData, setSexData] = useState<SexPrevalenceResponse | null>(null);
  const [amuSexDistribution, setAmuSexDistribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
    if (sexFilterType && !filterValueCache[sexFilterType] && !loadingFilterValues[sexFilterType]) {
      fetchFilterValues(sexFilterType);
    }
  }, [sexFilterType]);

  // Fetch sex prevalence data when component mounts or filters change
  useEffect(() => {
    const fetchSexPrevalence = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        // Add all dynamic filters
        sexActiveFilters.forEach(filter => {
          queryParams.append(filter.type, filter.value);
        });
        
        // If no filters are applied, still send a basic request
        if (sexActiveFilters.length === 0) {
          queryParams.append('no_filters', 'true');
        }
        
        console.log('🔍 Sex Prevalence Query Debug:');
        console.log('  - Active filters count:', sexActiveFilters.length);
        console.log('  - Query params string:', queryParams.toString());
        console.log('  - Active filters details:', sexActiveFilters);
        
        const data = await makeServerRequest(`amu-sex-prevalence?${queryParams.toString()}`);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 Sex Prevalence Response:');
        console.log('  - Total records returned:', data.totalRecords);
        console.log('  - Sex data count:', data.sexData.length);
        console.log('  - Data source:', data.dataSource);
        console.log('  - Sex data details:', data.sexData);
        
        setSexData(data);
        
      } catch (err) {
        console.error('Error fetching sex prevalence data from AMU_HH:', err);
        setError(err.message || 'Failed to access AMU_HH table');
        setSexData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSexPrevalence();
  }, [sexActiveFilters]);

  // Fetch AMU sex distribution data when component mounts or filters change (for AMU view)
  useEffect(() => {
    if (viewMode !== 'AMU') return;

    const fetchAmuSexDistribution = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        // Add all dynamic filters
        sexActiveFilters.forEach(filter => {
          queryParams.append(filter.type, filter.value);
        });
        
        // If no filters are applied, still send a basic request
        if (sexActiveFilters.length === 0) {
          queryParams.append('no_filters', 'true');
        }
        
        console.log('🔍 AMU Sex Distribution Query Debug:');
        console.log('  - Active filters count:', sexActiveFilters.length);
        console.log('  - Query params string:', queryParams.toString());
        console.log('  - Active filters details:', sexActiveFilters);
        
        const data = await makeServerRequest(`amu-sex-distribution?${queryParams.toString()}`);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 AMU Sex Distribution Response:');
        console.log('  - Total records returned:', data.totalRecords);
        console.log('  - Sex distribution data:', data.sexDistribution);
        console.log('  - Data source:', data.dataSource);
        
        setAmuSexDistribution(data);
        
      } catch (err) {
        console.error('Error fetching AMU sex distribution data from AMU_HH:', err);
        setError(err.message || 'Failed to access AMU_HH table');
        setAmuSexDistribution(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAmuSexDistribution();
  }, [sexActiveFilters, viewMode]);

  // Filter helpers
  const sexFilterHelpers = {
    addFilter: () => {
      if (sexFilterType && sexFilterValue) {
        const typeOption = filterTypeOptions.find(opt => opt.value === sexFilterType);
        const valueOption = getFilterValueOptions(sexFilterType).find(opt => opt.value === sexFilterValue);
        
        if (typeOption && valueOption) {
          const newFilter: Filter = {
            type: sexFilterType,
            value: sexFilterValue,
            label: `${typeOption.label}: ${valueOption.label}`
          };
          
          // Avoid duplicate filters
          const isDuplicate = sexActiveFilters.some(
            filter => filter.type === newFilter.type && filter.value === newFilter.value
          );
          
          if (!isDuplicate) {
            setSexActiveFilters([...sexActiveFilters, newFilter]);
          }
        }
        
        // Reset form
        setSexFilterType('');
        setSexFilterValue('');
      }
    },

    removeFilter: (index: number) => {
      setSexActiveFilters(sexActiveFilters.filter((_, i) => i !== index));
    },

    clearAllFilters: () => {
      setSexActiveFilters([]);
    }
  };

  // Process the data for chart display
  const computedData = useMemo(() => {
    if (viewMode === 'Sex') {
      if (!sexData || error) {
        return {
          femaleData: [
            { name: 'No data available', value: 100, count: 0, color: '#e5e7eb' }
          ],
          maleData: [
            { name: 'No data available', value: 100, count: 0, color: '#e5e7eb' }
          ],
          totalRecords: 0,
          hospitalName: 'All Hospitals'
        };
      }

      // Find female and male data
      const femaleInfo = sexData.sexData.find(item => item.sex === 'F');
      const maleInfo = sexData.sexData.find(item => item.sex === 'M');

      // Create female data
      const femaleData = femaleInfo ? [
        { 
          name: 'On Antimicrobials', 
          value: parseFloat(femaleInfo.prevalenceRate.toFixed(1)), 
          count: femaleInfo.patientsWithAntibiotics, 
          color: '#dc2626',
          totalPatients: femaleInfo.totalPatients
        },
        { 
          name: 'Not on Antimicrobials', 
          value: parseFloat((100 - femaleInfo.prevalenceRate).toFixed(1)), 
          count: femaleInfo.totalPatients - femaleInfo.patientsWithAntibiotics, 
          color: '#e5e7eb',
          totalPatients: femaleInfo.totalPatients
        }
      ] : [
        { name: 'No female data', value: 100, count: 0, color: '#e5e7eb', totalPatients: 0 }
      ];

      // Create male data
      const maleData = maleInfo ? [
        { 
          name: 'On Antimicrobials', 
          value: parseFloat(maleInfo.prevalenceRate.toFixed(1)), 
          count: maleInfo.patientsWithAntibiotics, 
          color: '#dc2626',
          totalPatients: maleInfo.totalPatients
        },
        { 
          name: 'Not on Antimicrobials', 
          value: parseFloat((100 - maleInfo.prevalenceRate).toFixed(1)), 
          count: maleInfo.totalPatients - maleInfo.patientsWithAntibiotics, 
          color: '#e5e7eb',
          totalPatients: maleInfo.totalPatients
        }
      ] : [
        { name: 'No male data', value: 100, count: 0, color: '#e5e7eb', totalPatients: 0 }
      ];

      return {
        femaleData,
        maleData,
        totalRecords: sexData.totalRecords,
        hospitalName: sexActiveFilters.length > 0 ? 'Filtered Data' : 'All Hospitals'
      };
    } else {
      // AMU view mode - showing sex distribution for patients with antibiotic_yn === TRUE
      if (!amuSexDistribution || error) {
        return {
          amuSexData: [
            { name: 'No data available', value: 100, count: 0, color: '#e5e7eb' }
          ],
          totalRecords: 0,
          hospitalName: 'All Hospitals'
        };
      }

      // Process AMU sex distribution data
      const sexDistribution = amuSexDistribution.sexDistribution || [];
      const totalAmuPatients = sexDistribution.reduce((sum: number, item: any) => sum + item.count, 0);

      const amuSexData = sexDistribution.map((item: any) => ({
        name: item.sex === 'M' ? 'Male' : item.sex === 'F' ? 'Female' : 'Unknown',
        value: totalAmuPatients > 0 ? parseFloat(((item.count / totalAmuPatients) * 100).toFixed(1)) : 0,
        count: item.count,
        color: item.sex === 'M' ? '#3b82f6' : item.sex === 'F' ? '#f59e0b' : '#9ca3af'
      }));

      return {
        amuSexData,
        totalRecords: amuSexDistribution.totalRecords || 0,
        hospitalName: sexActiveFilters.length > 0 ? 'Filtered Data' : 'All Hospitals'
      };
    }
  }, [sexData, amuSexDistribution, sexActiveFilters, error, viewMode]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[160px]">
          <div className="text-gray-900 font-medium mb-1">
            {data.name}
          </div>
          <div className="text-gray-600 text-sm mb-2">
            {data.value}% ({data.count.toLocaleString()} patients)
          </div>
          {data.totalPatients > 0 && (
            <div className="text-gray-600 text-sm">
              of {data.totalPatients.toLocaleString()} total patients
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Gender Profile of Antimicrobial Use</CardTitle>
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
                console.log('Download AMU Sex prevalence data');
                // TODO: Implement download functionality
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 m-[0px]">
            Patient Records with ≥1 Antimicrobial Prescribed • 
            {sexActiveFilters.length > 0 ? (
              <span className="font-medium text-blue-600 ml-1"> 
                Filtered ({sexActiveFilters.length} filter{sexActiveFilters.length === 1 ? '' : 's'}): {computedData.totalRecords.toLocaleString()} records
              </span>
            ) : (
              <span className="text-gray-700 ml-1"> Total: {computedData.totalRecords.toLocaleString()} records</span>
            )}

            {loading && (
              <span className="ml-2 text-gray-500 italic">
                (Updating...)
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value) => value && setViewMode(value as 'Sex' | 'AMU')}
              className="bg-gray-100 rounded-md p-0.5 h-5"
            >
              <ToggleGroupItem 
                value="Sex" 
                className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
              >
                Sex
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="AMU" 
                className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
              >
                AMU
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
                  <h3 className="font-semibold text-gray-900 text-sm cursor-help">Filter ATC Data:</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dynamic filters from AMU_HH table columns (42 available)</p>
                </TooltipContent>
              </TooltipComponent>
            </div>
            
            {/* Filter Type */}
            <div className="flex-1">
              <SearchableSelect
                value={sexFilterType}
                onValueChange={setSexFilterType}
                options={filterTypeOptions}
                placeholder="Search filter type..."
                className="w-full text-sm"
              />
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <SearchableSelect
                value={sexFilterValue}
                onValueChange={setSexFilterValue}
                options={getFilterValueOptions(sexFilterType)}
                disabled={!sexFilterType || loadingFilterValues[sexFilterType]}
                placeholder={
                  !sexFilterType ? "Select type first" :
                  loadingFilterValues[sexFilterType] ? "Loading values..." :
                  filterValueErrors[sexFilterType] ? "Error loading values" :
                  "Search value..."
                }
                className="w-full text-sm"
              />
            </div>

            {/* Add Filter Button */}
            <button
              onClick={sexFilterHelpers.addFilter}
              disabled={!sexFilterType || !sexFilterValue || loadingFilterValues[sexFilterType] || filterValueErrors[sexFilterType]}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {sexActiveFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({sexActiveFilters.length})
              </span>
              <button
                onClick={sexFilterHelpers.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {sexActiveFilters.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => sexFilterHelpers.removeFilter(index)}
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
              Unable to load sex prevalence data from AMU_HH table. Please check your connection and try again.
            </p>
          </div>
        )}
        
        {/* Main Content Area */}
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading {viewMode === 'Sex' ? 'sex prevalence' : 'AMU sex distribution'} data...</p>
            </div>
          </div>
        ) : displayMode === 'table' ? (
          /* Table View */
          <div className="space-y-6">
            {viewMode === 'Sex' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Female Data Table */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">Female Patients</h3>
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
                      {computedData.femaleData?.map((item, index) => (
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
                  {computedData.femaleData?.[0]?.totalPatients > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Total female patients: {computedData.femaleData[0].totalPatients.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Male Data Table */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">Male Patients</h3>
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
                      {computedData.maleData?.map((item, index) => (
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
                  {computedData.maleData?.[0]?.totalPatients > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Total male patients: {computedData.maleData[0].totalPatients.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* AMU View Table */
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">Sex Distribution (AMU Patients)</h3>
                <TableComponent>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Sex</TableHead>
                      <TableHead className="text-right w-24">Count</TableHead>
                      <TableHead className="text-right w-20">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computedData.amuSexData?.map((item, index) => (
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
                <p className="text-sm text-gray-500 mt-2">
                  Total patients with antimicrobials: {computedData.totalRecords?.toLocaleString() || 0}
                </p>
              </div>
            )}
          </div>
        ) : viewMode === 'Sex' ? (
          /* Chart View - Sex */
          <div className="grid grid-cols-2 gap-6">
            {/* Female Prevalence Pie Chart */}
            <div className="text-center">
              <h3 className="text-base font-medium text-gray-900 m-[0px]">Female Patients</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={computedData.femaleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={180}
                    paddingAngle={0}
                    dataKey="value"
                    labelLine={false}
                    label={false}
                  >
                    {computedData.femaleData?.map((entry, index) => (
                      <Cell key={`female-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="fill-red-600 text-2xl font-bold"
                  >
                    {computedData.femaleData?.[0]?.value || 0}%
                  </text>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  With antimicrobials: {computedData.femaleData?.[0]?.count?.toLocaleString() || 0} patients
                </p>
                {computedData.femaleData?.[0]?.totalPatients > 0 && (
                  <p className="text-sm text-gray-500">
                    Total female: {computedData.femaleData[0].totalPatients.toLocaleString()} patients
                  </p>
                )}
              </div>
            </div>

            {/* Male Prevalence Pie Chart */}
            <div className="text-center">
              <h3 className="text-base font-medium text-gray-900 m-[0px]">Male Patients</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={computedData.maleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={180}
                    paddingAngle={0}
                    dataKey="value"
                    labelLine={false}
                    label={false}
                  >
                    {computedData.maleData?.map((entry, index) => (
                      <Cell key={`male-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="fill-red-600 text-2xl font-bold"
                  >
                    {computedData.maleData?.[0]?.value || 0}%
                  </text>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  With antimicrobials: {computedData.maleData?.[0]?.count?.toLocaleString() || 0} patients
                </p>
                {computedData.maleData?.[0]?.totalPatients > 0 && (
                  <p className="text-sm text-gray-500">
                    Total male: {computedData.maleData[0].totalPatients.toLocaleString()} patients
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* AMU View - Single donut positioned on the left */
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <h3 className="text-base font-medium text-gray-900 m-[0px]">Sex Distribution (AMU Patients)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={computedData.amuSexData}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={180}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={false}
                  >
                    {computedData.amuSexData?.map((entry, index) => (
                      <Cell key={`amu-sex-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Patients with antimicrobials: {computedData.totalRecords?.toLocaleString() || 0}
                </p>
                <div className="mt-2 space-y-1">
                  {computedData.amuSexData?.map((item, index) => (
                    <div key={index} className="flex items-center justify-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span>{item.name}: {item.count.toLocaleString()} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Empty right column to maintain grid layout */}
            <div></div>
          </div>
        )}
        
        {/* Footnote */}
        <div className="mt-[30px] pt-4 border-t border-gray-200 mr-[0px] mb-[0px] ml-[0px]">
          <p className="text-xs text-gray-500">
            PPS data; excludes topical antibacterials and anti-TB drugs. Showing sex prevalence from AMU_HH table.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}