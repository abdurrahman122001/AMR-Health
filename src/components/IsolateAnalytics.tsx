import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Download, Table } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { SearchableSelect } from './SearchableSelect';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { AMR_Human_Pathogen_RProfile } from './AMR_Human_Pathogen_RProfile';

interface Filter {
  type: string;
  value: string;
  label: string;
}

interface FilterValueOption {
  value: string;
  label: string;
}

interface DistributionData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface CategoryOption {
  key: string;
  column: string;
  title: string;
  description: string;
  palette: string[];
}

// Color palettes for different chart categories - all vibrant and distinguishable
const COLOR_PALETTES = {
  demographics: ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'],
  clinical: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'],
  institutions: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'],
  specimens: ['#059669', '#10b981', '#34d399', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'],
  years: ['#dc2626', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'],
  wards: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
  default: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
};

// Function to get organism scientific abbreviation following standard convention
const getOrganismAbbreviation = (fullName: string): string => {
  const normalizedName = fullName.trim();
  
  // Common organism abbreviations following scientific convention
  const organismMap: { [key: string]: string } = {
    'Escherichia coli': 'E. coli',
    'Staphylococcus aureus': 'S. aureus',
    'Klebsiella pneumoniae': 'K. pneumoniae', 
    'Pseudomonas aeruginosa': 'P. aeruginosa',
    'Enterococcus faecalis': 'E. faecalis',
    'Enterococcus faecium': 'E. faecium',
    'Acinetobacter baumannii': 'A. baumannii',
    'Streptococcus pneumoniae': 'S. pneumoniae',
    'Streptococcus pyogenes': 'S. pyogenes',
    'Streptococcus agalactiae': 'S. agalactiae',
    'Haemophilus influenzae': 'H. influenzae',
    'Neisseria gonorrhoeae': 'N. gonorrhoeae',
    'Neisseria meningitidis': 'N. meningitidis',
    'Salmonella enterica': 'S. enterica',
    'Salmonella typhimurium': 'S. typhimurium',
    'Shigella species': 'Shigella spp.',
    'Proteus mirabilis': 'P. mirabilis',
    'Proteus vulgaris': 'P. vulgaris',
    'Enterobacter cloacae': 'E. cloacae',
    'Serratia marcescens': 'S. marcescens',
    'Citrobacter freundii': 'C. freundii',
    'Morganella morganii': 'M. morganii',
    'Providencia stuartii': 'P. stuartii',
    'Stenotrophomonas maltophilia': 'S. maltophilia',
    'Burkholderia cepacia': 'B. cepacia',
    'Clostridium difficile': 'C. difficile',
    'Bacteroides fragilis': 'B. fragilis',
    'Candida albicans': 'C. albicans',
    'Candida glabrata': 'C. glabrata',
    'Candida parapsilosis': 'C. parapsilosis',
    'Candida tropicalis': 'C. tropicalis',
    'Aspergillus fumigatus': 'A. fumigatus'
  };

  // Return mapped abbreviation if available, otherwise try to create one
  if (organismMap[normalizedName]) {
    return organismMap[normalizedName];
  }

  // Auto-generate abbreviation for unmapped organisms
  const words = normalizedName.split(' ');
  if (words.length >= 2) {
    return `${words[0][0]}. ${words[1]}`;
  }

  // Return original name if can't abbreviate
  return normalizedName;
};

// Dynamic filter options based on AMR_HH table column headers
const filterTypeOptions = [
  { value: 'sex', label: 'Sex' },
  { value: 'age_cat', label: 'Age Category' },
  { value: 'pat_type', label: 'Patient Type' },
  { value: 'ward', label: 'Ward' },
  { value: 'institution', label: 'Institution' },
  { value: 'department', label: 'Department' },
  { value: 'ward_type', label: 'Ward Type' },
  { value: 'spec_type', label: 'Specimen Type' },
  { value: 'local_spec', label: 'Local Specimen' },
  { value: 'year_spec', label: 'Year of Specimen' },
  { value: 'year_rep', label: 'Year of Report' },
  { value: 'organism', label: 'Organism' },
  { value: 'specimen', label: 'Specimen' },
  { value: 'org_type', label: 'Organism Type' }
];

// Category options for the dropdown
const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    key: 'organism',
    column: 'ORGANISM',
    title: 'Organism Distribution',
    description: 'Breakdown of bacterial isolates by organism species',
    palette: COLOR_PALETTES.clinical
  },
  {
    key: 'org_type',
    column: 'ORG_TYPE',
    title: 'Organism Type Distribution',
    description: 'Gram-positive vs Gram-negative organism classification',
    palette: COLOR_PALETTES.demographics
  },
  {
    key: 'sex',
    column: 'SEX',
    title: 'Sex Distribution',
    description: 'Gender breakdown of bacterial isolates',
    palette: COLOR_PALETTES.demographics
  },
  {
    key: 'age_cat',
    column: 'AGE_CAT',
    title: 'Age Category Distribution',
    description: 'Age group breakdown of isolates',
    palette: COLOR_PALETTES.demographics
  },
  {
    key: 'institution',
    column: 'INSTITUTION',
    title: 'Institution Distribution',
    description: 'Isolates by healthcare institution',
    palette: COLOR_PALETTES.institutions
  },
  {
    key: 'ward',
    column: 'WARD',
    title: 'Ward Distribution',
    description: 'Isolates by hospital ward',
    palette: COLOR_PALETTES.wards
  },
  {
    key: 'ward_type',
    column: 'WARD_TYPE',
    title: 'Ward Type Distribution',
    description: 'Isolates by type of ward',
    palette: COLOR_PALETTES.clinical
  },
  {
    key: 'pat_type',
    column: 'PAT_TYPE',
    title: 'Patient Type Distribution',
    description: 'Inpatient vs outpatient breakdown',
    palette: COLOR_PALETTES.default
  },
  {
    key: 'spec_type',
    column: 'SPEC_TYPE',
    title: 'Specimen Type Distribution',
    description: 'Types of specimens collected',
    palette: COLOR_PALETTES.specimens
  },
  {
    key: 'year_spec',
    column: 'YEAR_SPEC',
    title: 'Collection Year Distribution',
    description: 'Isolates by year of specimen collection',
    palette: COLOR_PALETTES.years
  }
];

// Custom tooltip component for isolate data
const IsolateTooltip = ({ active, payload }: any) => {
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

export function IsolateAnalytics() {
  // Category selection state management
  const [selectedCategory, setSelectedCategory] = useState('organism'); // Default to organism
  
  // View mode state management
  const [showTable, setShowTable] = useState(false);
  
  // Filter state management
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  
  // Data state management
  const [distributionData, setDistributionData] = useState<DistributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Dynamic filter value management
  const [filterValueCache, setFilterValueCache] = useState<Record<string, FilterValueOption[]>>({});
  const [loadingFilterValues, setLoadingFilterValues] = useState<Record<string, boolean>>({});
  const [filterValueErrors, setFilterValueErrors] = useState<Record<string, string>>({});

  // Get current category option
  const currentCategory = CATEGORY_OPTIONS.find(cat => cat.key === selectedCategory) || CATEGORY_OPTIONS[0];

  // Fetch unique values for a specific column from AMR_HH table
  const fetchFilterValues = async (columnName: string) => {
    if (filterValueCache[columnName]) {
      return filterValueCache[columnName];
    }

    try {
      setLoadingFilterValues(prev => ({ ...prev, [columnName]: true }));
      setFilterValueErrors(prev => ({ ...prev, [columnName]: '' }));

      console.log(`Fetching unique values for column: ${columnName}`);
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

  // Fetch distribution data for a specific column with filters
  const fetchDistributionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('column', currentCategory.column);
      
      // Add all dynamic filters - convert to uppercase to match AMR_HH column names
      activeFilters.forEach(filter => {
        queryParams.append(filter.type.toUpperCase(), filter.value);
      });
      
      console.log('🔍 Isolate Distribution Query Debug:');
      console.log('  - Column:', currentCategory.column);
      console.log('  - Active filters count:', activeFilters.length);
      console.log('  - Query params string:', queryParams.toString());
      console.log('  - Active filters details:', activeFilters);
      
      // Debug filter parameter format
      if (activeFilters.length > 0) {
        console.log('  - Filter parameters sent to server:');
        activeFilters.forEach(filter => {
          console.log(`    ${filter.type.toUpperCase()}: ${filter.value}`);
        });
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-distribution-analysis?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      console.log(`Distribution data for ${currentCategory.column}:`, result);

      if (!response.ok) {
        // Extract detailed error message from backend response
        const errorMessage = result.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // Process the distribution data
      const processedData: DistributionData[] = result.distribution.map((item: any, index: number) => ({
        name: item.category || item.name || 'Unknown',
        value: item.count,
        percentage: item.percentage,
        color: currentCategory.palette[index % currentCategory.palette.length]
      }));
      
      // Log organism name mapping status
      if (currentCategory.column === 'ORGANISM' && result.organismNameMapping) {
        console.log(`✅ Organism name mapping applied successfully: ${result.organismMappingsCount} mappings used`);
        console.log('🔬 Organism distribution with mapped names:', processedData.map(item => item.name));
      } else if (currentCategory.column === 'ORGANISM') {
        console.log('⚠️ Organism name mapping not available - displaying organism codes');
      }

      setDistributionData(processedData);
      setTotalRecords(result.totalRecords || 0);

    } catch (error) {
      console.error(`Error fetching distribution data for ${currentCategory.column}:`, error);
      setError(error.message);
      setDistributionData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // Load data when category or filters change
  useEffect(() => {
    if (currentCategory) {
      fetchDistributionData();
    }
  }, [selectedCategory, currentCategory, activeFilters]);

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
    <div className="space-y-6">
      {/* Pathogen Resistance Profiles */}
      <AMR_Human_Pathogen_RProfile />
      
      {/* Isolate Distribution Analysis */}
      <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            {currentCategory.title} - Specimen Distribution Analysis
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
                console.log(`${showTable ? 'Show chart' : 'Show table'} view for ${currentCategory.title} data`);
              }}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log(`Download ${currentCategory.title} chart data`);
                // TODO: Implement download functionality
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 m-[0px]">
            {currentCategory.description} • 
            {activeFilters.length > 0 ? (
              <span className="font-medium text-blue-600 ml-1"> 
                Filtered ({activeFilters.length} filter{activeFilters.length === 1 ? '' : 's'}): {totalRecords.toLocaleString()} records
              </span>
            ) : (
              <span className="text-gray-700 ml-1"> Total: {totalRecords.toLocaleString()} records</span>
            )}

            {loading && (
              <span className="ml-2 text-gray-500 italic">
                (Updating...)
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Category:</span>
            <div className="w-40">
              <SearchableSelect
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                options={[
                  { value: 'organism', label: 'Organism' },
                  { value: 'org_type', label: 'Organism Type' },
                  { value: 'sex', label: 'Sex' },
                  { value: 'age_cat', label: 'Age' },
                  { value: 'institution', label: 'Institution' },
                  { value: 'spec_type', label: 'Specimen' },
                  { value: 'ward', label: 'Ward' },
                  { value: 'ward_type', label: 'Ward Type' },
                  { value: 'pat_type', label: 'Patient Type' },
                  { value: 'year_spec', label: 'Year' }
                ]}
                placeholder="Select category..."
                className="w-full text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <TooltipComponent>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-gray-900 text-sm cursor-help">Filter Isolate Data:</h3>
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
              Unable to load isolate distribution data from AMR_HH table. Please check your connection and try again.
            </p>
          </div>
        )}
        
        {showTable ? (
          /* Table View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {currentCategory.title} Distribution Data Table
              </h4>
              <span className="text-sm text-gray-500">
                Showing all {distributionData.length} {currentCategory.title.toLowerCase()} entries
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading {currentCategory.title.toLowerCase()} distribution...</p>
                </div>
              </div>
            ) : (
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
          <div className="flex gap-6">
            {/* Main Chart Area */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading {currentCategory.title.toLowerCase()} distribution...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={distributionData}
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
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <text x="40%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-medium fill-gray-700">
                      {currentCategory.title}
                    </text>
                    <Tooltip content={<IsolateTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            <div className="lg:col-span-2 space-y-2 my-[25px] mx-[0px] mt-[25px] mr-[0px] mb-[20px] ml-[0px] px-[0px] py-[5px]">
              <h4 className="font-medium mb-4 text-[14px]">
                {currentCategory.title} Categories
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Top 10 shown)
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
                distributionData.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex items-start justify-between rounded mx-[0px] my-[2px] mt-[0px] mr-[0px] mb-[2px] ml-[0px] px-[8px] py-[4px]">
                    <div className="flex items-start gap-3 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-700 text-sm truncate min-w-0 text-[13px]">
                        {selectedCategory === 'organism' ? (
                          // Display organism name (will be mapped from database view)
                          item.name
                        ) : (
                          item.name
                        )}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-sm font-semibold text-[13px]">
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
            Isolate distribution analysis from AMR surveillance database. Showing {currentCategory.title.toLowerCase()} composition across {totalRecords.toLocaleString()} total isolates.
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}