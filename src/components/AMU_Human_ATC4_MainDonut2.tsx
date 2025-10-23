import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, Table } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { makeServerRequest } from '../utils/supabase/client';
import { getATC4ClassName } from '../utils/atc4ClassNames';
import { SearchableSelect } from './SearchableSelect';

interface Filter {
  type: string;
  value: string;
  label: string;
}

interface FilterValueOption {
  value: string;
  label: string;
}

interface AtcDistributionItem {
  atcCode: string;
  label: string;
  count: number;
  percentage: number;
  names: string[];
}

interface AtcDistributionData {
  atcLevel: string;
  totalRecords: number;
  distribution: AtcDistributionItem[];
  dataSource: string;
  tableName: string;
  timestamp: string;
}

// Dynamic filter options - restricted to 21 validated AMU_HH table columns
const filterTypeOptions = [
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

// ATC3 definitions and colors
const ATC3_COLORS = {
  "J01A": "#f59e0b", // Tetracyclines - amber
  "J01B": "#8b5cf6", // Amphenicols - purple
  "J01C": "#3b82f6", // Beta-lactam antibacterials, penicillins - blue
  "J01D": "#0891b2", // Other beta-lactam antibacterials - teal
  "J01E": "#6b7280", // Sulfonamides and trimethoprim - gray
  "J01F": "#8b5cf6", // Macrolides, lincosamides and streptogramins - purple
  "J01G": "#6b7280", // Aminoglycoside antibacterials - gray
  "J01M": "#f59e0b", // Quinolone antibacterials - amber
  "J01R": "#ef4444", // Combinations of antibacterials - red
  "J01X": "#9ca3af", // Other antibacterials - light gray
  "P01A": "#f97316", // Agents against amoebiasis and protozoal diseases - orange
  "P01B": "#ea580c", // Antimalarials - darker orange
  "J05A": "#10b981", // Direct acting antivirals - green
  "J02A": "#7c3aed", // Antimycotics for systemic use - violet
  "J04A": "#dc2626", // Drugs for treatment of tuberculosis - red
  "A07A": "#92400e", // Intestinal anti-infectives - brown
  "OTHER": "#374151"  // Other (≤2%) - darkest grey
};

// ATC4 color mappings
const ATC4_COLORS = {
  "J01CR": "#3b82f6", // Penicillin + β-lactamase inhibitor - blue
  "J01CA": "#1e40af", // Penicillins, extended spectrum - darker blue
  "J01CF": "#2563eb", // Penicillins, broad spectrum - blue variant
  "J01DD": "#0891b2", // Cephalosporins, 3rd gen - teal
  "J01DC": "#0e7490", // Cephalosporins, 2nd gen - darker teal
  "J01DE": "#0e7490", // Cephalosporins, 1st gen - darker teal variant
  "J01DH": "#164e63", // Carbapenems - darkest teal
  "J01MA": "#f59e0b", // Fluoroquinolones - orange
  "J01FA": "#8b5cf6", // Macrolides - purple
  "J01EE": "#6b7280", // Sulfonamides + trimethoprim - neutral grey
  "J01XA": "#9ca3af", // Glycopeptides - light grey
  "J01XB": "#94a3b8", // Polymyxins - slate
  "J01GB": "#6b7280", // Other aminoglycosides - neutral grey
  "J01FF": "#9ca3af", // Lincosamides - light grey
  "J01XE": "#6b7280", // Nitrofurans - neutral grey
  "J01XX": "#9ca3af", // Other antibacterials - light grey
  "J01XD": "#d97706", // Imidazoles - amber
  "J01CE": "#1d4ed8", // β-lactamase-sensitive penicillins - blue variant
  "P01AB": "#f97316", // Nitroimidazole derivatives - orange variant
  "OTHER": "#374151"  // Other (≤2%) - darkest grey
};

// ATC5-specific color mapping (inherits parent ATC4 colors)
const ATC5_COLORS = {
  "J01DD04": "#0891b2", // Ceftriaxone
  "J01CR02": "#3b82f6", // Amoxicillin/clavulanic acid
  "J01XA01": "#9ca3af", // Vancomycin
  "J01CA01": "#1e40af", // Ampicillin
  "J01MA02": "#f59e0b", // Ciprofloxacin
  "J01FF01": "#9ca3af", // Clindamycin
  "J01DC02": "#0e7490", // Cefuroxime
  "J01GB03": "#6b7280", // Gentamicin
  "J01CA04": "#1e40af", // Amoxicillin
  "J01GB06": "#6b7280", // Amikacin
  "J01FA10": "#8b5cf6", // Azithromycin
  "J01DD01": "#0891b2", // Cefotaxime
  "J01MA12": "#f59e0b", // Levofloxacin
  "J01CF05": "#2563eb", // Flucloxacillin
  "J01CE01": "#1d4ed8", // Benzylpenicillin
  "J01EE01": "#6b7280", // Sulfamethoxazole/trimethoprim
  "J01FA01": "#8b5cf6", // Erythromycin
  "J01CF02": "#2563eb", // Cloxacillin
  "J01CR05": "#3b82f6", // Ampicillin/sulbactam
  "J01CE02": "#1d4ed8", // Phenoxymethylpenicillin
  "J01XD01": "#d97706", // Metronidazole (J01XD)
  "P01AB01": "#f97316", // Metronidazole (P01AB)
  "J01DH02": "#164e63", // Meropenem
  "J01DE01": "#0e7490", // Cefazolin
  "OTHER": "#374151"
};

// Custom tooltip component for ATC data
const ATCTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{data.label}</p>
        <p className="text-sm text-gray-600 font-mono">{data.atcCode}</p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">{data.count}</span> prescriptions
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">{data.percentage.toFixed(1)}%</span> of total
        </p>
      </div>
    );
  }
  return null;
};

export function AMU_Human_ATC4_MainDonut2() {
  // ATC level state management
  const [atcLevel, setAtcLevel] = useState<string>('atc4');
  
  // View mode state management
  const [showTable, setShowTable] = useState(false);
  
  // Filter state management
  const [filterType, setFilterType] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  
  // Data state management
  const [atcData, setAtcData] = useState<AtcDistributionData | null>(null);
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
    if (filterType && !filterValueCache[filterType] && !loadingFilterValues[filterType]) {
      fetchFilterValues(filterType);
    }
  }, [filterType]);

  // Fetch ATC distribution data when component mounts, ATC level changes, or filters change
  useEffect(() => {
    const fetchAtcDistribution = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('atc_level', atcLevel);
        
        // Add all dynamic filters
        activeFilters.forEach(filter => {
          queryParams.append(filter.type, filter.value);
        });
        
        // If no filters are applied, still send a basic request
        if (activeFilters.length === 0) {
          queryParams.append('no_filters', 'true');
        }
        
        console.log('🔍 ATC Distribution Query Debug:');
        console.log('  - ATC level:', atcLevel);
        console.log('  - Active filters count:', activeFilters.length);
        console.log('  - Query params string:', queryParams.toString());
        console.log('  - Active filters details:', activeFilters);
        
        const data = await makeServerRequest(`amu-atc-distribution?${queryParams.toString()}`);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 ATC Distribution Response:');
        console.log('  - Total records returned:', data.totalRecords);
        console.log('  - ATC level:', data.atcLevel);
        console.log('  - Distribution items count:', data.distribution.length);
        console.log('  - Data source:', data.dataSource);
        console.log('  - Top 3 items:', data.distribution.slice(0, 3));
        
        setAtcData(data);
        
      } catch (err) {
        console.error('Error fetching ATC distribution data from AMU_HH:', err);
        setError(err.message || 'Failed to access AMU_HH table');
        setAtcData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAtcDistribution();
  }, [atcLevel, activeFilters]);

  // Process the data for chart display
  const computedData = useMemo(() => {
    if (!atcData || error) {
      return {
        allData: [
          { atcCode: 'NO_DATA', label: 'No data available', percentage: 100, count: 0, color: '#e5e7eb' }
        ],
        legendData: [
          { atcCode: 'NO_DATA', label: 'No data available', percentage: 100, count: 0, color: '#e5e7eb' }
        ],
        totalRecords: 0,
        totalItems: 0
      };
    }

    // Determine color mapping based on ATC level
    const colorMap = atcLevel === 'atc3' ? ATC3_COLORS : 
                    atcLevel === 'atc4' ? ATC4_COLORS : 
                    ATC5_COLORS;

    // Process the distribution data for chart display
    const processedData = atcData.distribution.map(item => ({
      ...item,
      color: colorMap[item.atcCode as keyof typeof colorMap] || "#6b7280" // fallback gray
    }));

    // Pie chart shows ALL data points (no "Other" grouping)
    const allData = processedData;
    
    // Legend shows only top 10 items
    const legendData = processedData.slice(0, 10);

    return {
      allData,        // For pie chart - shows all categories
      legendData,     // For legend - shows only top 10
      totalRecords: atcData.totalRecords,
      totalItems: atcData.distribution.length
    };
  }, [atcData, atcLevel, error]);

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
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            {atcLevel.toUpperCase()} Profile of Antimicrobial Use in Ghana
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
                console.log(`${showTable ? 'Show chart' : 'Show table'} view for ${atcLevel.toUpperCase()} data`);
              }}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log(`Download ${atcLevel.toUpperCase()} chart data`);
                // TODO: Implement download functionality
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 m-[0px]">
            Distribution of Antimicrobial Prescriptions by {atcLevel.toUpperCase()} {
              atcLevel === 'atc3' ? 'Class' : 
              atcLevel === 'atc4' ? 'Class' : 
              'Antimicrobial'
            } • 
            {activeFilters.length > 0 ? (
              <span className="font-medium text-blue-600 ml-1"> 
                Filtered ({activeFilters.length} filter{activeFilters.length === 1 ? '' : 's'}): {computedData.totalRecords} records
              </span>
            ) : (
              <span className="text-gray-700 ml-1"> Total: {computedData.totalRecords} records</span>
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
              value={atcLevel} 
              onValueChange={(value) => value && setAtcLevel(value)}
              className="bg-gray-100 rounded-md p-0.5 h-5"
            >
              <ToggleGroupItem 
                value="atc3" 
                className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
              >
                ATC3
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="atc4" 
                className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
              >
                ATC4
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="atc5" 
                className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
              >
                ATC5
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
                  <p>Dynamic filters from AMU_HH table columns (21 available)</p>
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
              Unable to load ATC distribution data from AMU_HH table. Please check your connection and try again.
            </p>
          </div>
        )}
        
        {showTable ? (
          /* Table View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {atcLevel.toUpperCase()} Distribution Data Table
              </h4>
              <span className="text-sm text-gray-500">
                Showing all {computedData.allData.length} {atcLevel.toUpperCase()} entries
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading {atcLevel.toUpperCase()} distribution...</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg">
                <TableComponent>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead className="w-20">Code</TableHead>
                      <TableHead className="flex-1">
                        {atcLevel === 'atc3' ? 'Class Name' : 
                         atcLevel === 'atc4' ? 'Class Name' : 
                         'Antimicrobial Name'}
                      </TableHead>
                      <TableHead className="w-24 text-right">Count</TableHead>
                      <TableHead className="w-24 text-right">Percentage</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computedData.allData.map((item, index) => (
                      <TableRow key={item.atcCode}>
                        <TableCell className="font-medium text-gray-500">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.atcCode}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            {getATC4ClassName(item.atcCode)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.count.toLocaleString()}
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
                    <p className="text-gray-600">Loading {atcLevel.toUpperCase()} distribution...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={computedData.allData}
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
                      {computedData.allData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <text x="40%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-medium fill-gray-700">
                      {atcLevel.toUpperCase()} Mix
                    </text>
                    <Tooltip content={<ATCTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            <div className="lg:col-span-2 space-y-2 my-[25px] mx-[0px] mt-[25px] mr-[0px] mb-[20px] ml-[0px] px-[0px] py-[5px]">
            <h4 className="font-medium mb-4 text-[14px]">
              {atcLevel.toUpperCase()} {
                atcLevel === 'atc3' ? 'Categories' : 
                atcLevel === 'atc5' ? 'Antimicrobials' : 
                'Classes'
              }
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
              computedData.legendData.map((item, index) => (
                <div key={item.atcCode} className="flex items-start justify-between rounded mx-[0px] my-[2px] mt-[0px] mr-[0px] mb-[2px] ml-[0px] px-[8px] py-[4px]">
                  <div className="flex items-start gap-3 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-700 text-sm truncate min-w-0 text-[13px]">
                      <span className="font-mono">{item.atcCode}</span> {getATC4ClassName(item.atcCode).substring(0, 40)}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-sm font-semibold">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}
        
        {/* Footnote */}
        <div className="mt-[30px] pt-4 border-t border-gray-200 mr-[0px] mb-[0px] ml-[0px]">
          <p className="text-xs text-gray-500">
            PPS data; excludes topical antibacterials and anti-TB drugs. Showing {atcLevel.toUpperCase()} distribution from AMU_HH table.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}