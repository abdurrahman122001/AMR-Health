import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FilterOption {
  value: string;
  label: string;
}

interface ActiveFilter {
  type: string;
  value: string;
  label: string;
}

interface FilterHelpers {
  addFilter: () => void;
  removeFilter: (index: number) => void;
  clearAllFilters: () => void;
}

interface AMU_Human_Quality_ViewByProps {
  regionFilterType?: string;
  setRegionFilterType?: (value: string) => void;
  regionFilterValue?: string;
  setRegionFilterValue?: (value: string) => void;
  regionActiveFilters?: ActiveFilter[];
  regionFilterHelpers?: FilterHelpers;
  filterTypeOptions?: FilterOption[];
  getFilterValueOptions?: (type: string) => FilterOption[];
  dynamicFilterOptions?: Record<string, FilterOption[]>;
  filterOptionsLoading?: Record<string, boolean>;
}

export function AMU_Human_Quality_ViewBy({
  regionFilterType = '',
  setRegionFilterType = () => {},
  regionFilterValue = '',
  setRegionFilterValue = () => {},
  regionActiveFilters = [],
  regionFilterHelpers = { addFilter: () => {}, removeFilter: () => {}, clearAllFilters: () => {} },
  filterTypeOptions = [],
  getFilterValueOptions = () => [],
  dynamicFilterOptions = {},
  filterOptionsLoading = {}
}: AMU_Human_Quality_ViewByProps) {
  const [viewBy, setViewBy] = useState('sex');
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterValueOptions, setFilterValueOptions] = useState<FilterOption[]>([]);
  const [filterValuesLoading, setFilterValuesLoading] = useState(false);
  
  // Quality indicator color definitions
  const QUALITY_COLORS = {
    "Reason in Notes": "#3b82f6", // blue
    "Guideline Compliant": "#059669", // green
    "Culture Taken": "#dc2626", // red
    "Directed Therapy": "#7c3aed", // purple
    "Biomarker Used": "#ea580c", // orange
    "Review Date": "#0891b2" // cyan
  };

  // Dynamic filter value fetching function
  const fetchFilterValues = async (filterType: string) => {
    if (!filterType) {
      setFilterValueOptions([]);
      return;
    }

    try {
      setFilterValuesLoading(true);
      
      if (!projectId || !publicAnonKey) {
        throw new Error('Missing project configuration');
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amu-quality-filter-values?column=${filterType}`;
      console.log('Fetching filter values from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch filter values');
      }
      
      console.log(`✅ Received ${result.options.length} dynamic filter options for ${filterType}:`, result.options.slice(0, 5));
      setFilterValueOptions(result.options || []);
      
    } catch (error) {
      console.error('❌ Error fetching dynamic filter values:', error);
      // Fallback to static values from props if dynamic fetch fails
      const staticOptions = getFilterValueOptions?.(filterType) || [];
      console.log(`⚠️ Falling back to ${staticOptions.length} static options for ${filterType}`);
      setFilterValueOptions(staticOptions);
    } finally {
      setFilterValuesLoading(false);
    }
  };

  // Fetch filter values when filter type changes
  useEffect(() => {
    if (regionFilterType) {
      console.log(`Dynamic filter system: Fetching values for filter type "${regionFilterType}"`);
      fetchFilterValues(regionFilterType);
    } else {
      setFilterValueOptions([]);
    }
    // Clear filter value when type changes
    setRegionFilterValue('');
  }, [regionFilterType]);

  // Fetch real data from the server
  const fetchQualityViewByData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!projectId || !publicAnonKey) {
        throw new Error('Missing project configuration');
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        viewBy: viewBy
      });
      
      // Add active filters to query
      regionActiveFilters.forEach(filter => {
        queryParams.append(filter.type, filter.value);
      });
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amu-quality-viewby?${queryParams}`;
      console.log('Fetching quality ViewBy data from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log('Quality ViewBy data received:', result);
      setData(result.data || []);
      setTotalRecords(result.totalRecords || 0);
      
    } catch (err) {
      console.error('Error fetching quality ViewBy data:', err);
      setError(err.message || 'Failed to fetch data');
      setData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts, viewBy changes, or filters change
  useEffect(() => {
    fetchQualityViewByData();
  }, [viewBy, regionActiveFilters]);
  
  // Map viewBy values to their corresponding database columns
  const getViewByLabel = (viewByValue: string) => {
    const labels: Record<string, string> = {
      'sex': 'Sex',
      'age_cat': 'Age Group', 
      'county': 'Region',
      'name': 'Hospital',
      'subtype': 'Hospital Type',
      'main_dept': 'Hospital Department',
      'dept_type': 'Hospital Department Type',
      'sub_dept': 'Hospital Sub-department',
      'activity': 'Hospital Activity',
      'diagnosis': 'Diagnosis',
      'indication': 'Indication',
      'treatment': 'Treatment Approach',
      'district': 'District',
      'year_of_survey': 'Year of Survey',
      'antimicrobial_name': 'Antimicrobial Name',
      'atc5': 'ATC5 Code',
      'atc4': 'ATC4 Code',
      'atc3': 'ATC3 Code',
      'atc2': 'ATC2 Code',
      'aware': 'AWaRe Category',
      'diagnosis_site': 'Diagnosis Site'
    };
    return labels[viewByValue] || viewByValue;
  };

  // Updated viewBy options to match the database columns
  const viewByOptions = [
    { value: 'sex', label: 'by Sex' },
    { value: 'age_cat', label: 'by Age Group' },
    { value: 'county', label: 'by Region' },
    { value: 'name', label: 'by Hospital' },
    { value: 'subtype', label: 'by Hospital Type' },
    { value: 'main_dept', label: 'by Hospital Department' },
    { value: 'dept_type', label: 'by Hospital Department Type' },
    { value: 'sub_dept', label: 'by Hospital Sub-department' },
    { value: 'activity', label: 'by Hospital Activity' },
    { value: 'diagnosis', label: 'by Diagnosis' },
    { value: 'indication', label: 'by Indication' },
    { value: 'treatment', label: 'by Treatment Approach' },
    { value: 'district', label: 'by District' },
    { value: 'year_of_survey', label: 'by Year of Survey' },
    { value: 'antimicrobial_name', label: 'by Antimicrobial Name' },
    { value: 'atc5', label: 'by ATC5 Code' },
    { value: 'atc4', label: 'by ATC4 Code' },
    { value: 'atc3', label: 'by ATC3 Code' },
    { value: 'atc2', label: 'by ATC2 Code' },
    { value: 'aware', label: 'by AWaRe Category' },
    { value: 'diagnosis_site', label: 'by Diagnosis Site' }
  ];


  
  // Get all unique quality indicators for consistent rendering
  const allQualityIndicators = ['Reason in Notes', 'Guideline Compliant', 'Culture Taken', 'Directed Therapy', 'Biomarker Used', 'Review Date'];

  // Quality indicator descriptions
  const qualityDescriptions = {
    'Reason in Notes': 'Percentage of prescriptions with documented clinical indication and rationale for antimicrobial therapy',
    'Guideline Compliant': 'Prescriptions following local hospital guidelines or international standards (WHO, IDSA)',
    'Culture Taken': 'Infections where microbiological samples were collected before starting treatment',
    'Directed Therapy': 'Treatment modified or confirmed based on culture and sensitivity results',
    'Biomarker Used': 'Prescribing decisions guided by biomarkers such as procalcitonin or C-reactive protein',
    'Review Date': 'Prescriptions with documented review dates or planned stop/reassessment dates'
  };

  const getComplianceLevel = (value: number) => {
    if (value >= 80) return 'Excellent compliance';
    if (value >= 60) return 'Good compliance';
    if (value >= 40) return 'Fair compliance';
    return 'Poor compliance';
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg font-medium">
              Quality Prescribing Indicators Profile
            </CardTitle>
            <Select value={viewBy} onValueChange={setViewBy}>
              <SelectTrigger className="w-[140px] text-sm">
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
              console.log('Download Quality ViewBy chart data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Quality Assessment Indicators for Antimicrobial Prescribing {viewByOptions.find(o => o.value === viewBy)?.label} • {totalRecords.toLocaleString()} records
        </p>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Quality Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Select value={regionFilterType} onValueChange={setRegionFilterType}>
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
                value={regionFilterValue} 
                onValueChange={setRegionFilterValue}
                disabled={!regionFilterType || filterValuesLoading}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder={
                    filterValuesLoading 
                      ? "Loading values..." 
                      : regionFilterType 
                        ? `Select ${filterTypeOptions?.find(opt => opt.value === regionFilterType)?.label?.toLowerCase()}...` 
                        : "Select type first"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filterValuesLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading values...
                      </div>
                    </SelectItem>
                  ) : filterValueOptions.length > 0 ? (
                    filterValueOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))
                  ) : regionFilterType ? (
                    <SelectItem value="no-values" disabled>
                      No values available
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            {/* Add Filter Button */}
            <button
              onClick={regionFilterHelpers?.addFilter}
              disabled={!regionFilterType || !regionFilterValue}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {regionActiveFilters && regionActiveFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({regionActiveFilters.length})
              </span>
              <button
                onClick={regionFilterHelpers?.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {regionActiveFilters?.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => regionFilterHelpers.removeFilter(index)}
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
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading quality data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-red-600 font-medium mb-2">Error loading data</div>
              <div className="text-gray-600 text-sm mb-4">{error}</div>
              <Button 
                onClick={fetchQualityViewByData}
                variant="outline"
                size="sm"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Chart Area */}
        {!loading && !error && (
          <div className="w-full h-96 mb-[15px] mt-[0px] mr-[0px] ml-[0px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                barCategoryGap="15%"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12 }}
                  angle={['name', 'main_dept', 'sub_dept', 'antimicrobial_name', 'diagnosis', 'diagnosis_site'].includes(viewBy) ? -45 : 0}
                  textAnchor={['name', 'main_dept', 'sub_dept', 'antimicrobial_name', 'diagnosis', 'diagnosis_site'].includes(viewBy) ? 'end' : 'middle'}
                  height={['name', 'main_dept', 'sub_dept', 'antimicrobial_name', 'diagnosis', 'diagnosis_site'].includes(viewBy) ? 80 : 60}
                  label={{ 
                    value: getViewByLabel(viewBy),
                    position: 'insideBottom',
                    offset: 0,
                    style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tickFormatter={(value) => `${value}%`}
                  label={{ 
                    value: 'Compliance Rate (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                  }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0 || !hoveredBar) return null;
                    
                    // Find the specific bar that's being hovered based on our state
                    const hoveredSegment = payload.find(p => p.dataKey === hoveredBar);
                    
                    if (hoveredSegment && hoveredSegment.value > 0) {
                      const qualityIndicator = hoveredSegment.dataKey;
                      const percentage = hoveredSegment.value.toFixed(1);
                      const color = QUALITY_COLORS[qualityIndicator as keyof typeof QUALITY_COLORS];
                      const description = qualityDescriptions[qualityIndicator as keyof typeof qualityDescriptions];
                      const level = getComplianceLevel(hoveredSegment.value);
                      
                      // Find the record count for this category
                      const categoryData = data.find(d => d.category === label);
                      const recordCount = categoryData?.totalRecords || 0;
                      
                      // Calculate the actual count for this specific indicator
                      const actualCount = Math.round((hoveredSegment.value * recordCount) / 100);
                      
                      return (
                        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[300px]">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: color || "#6b7280" }}
                            />
                            <div className="font-medium text-sm text-gray-900">
                              {qualityIndicator}
                            </div>
                          </div>
                          <div className="text-gray-600 text-sm mb-2">
                            <span 
                              className="font-medium text-sm"
                              style={{ color: color || "#6b7280" }}
                            >
                              {percentage}% compliance rate ({level})
                            </span>
                          </div>
                          <div className="text-gray-500 text-xs mb-2">
                            {description}
                          </div>
                          <div className="border-t border-gray-100 pt-2 mt-2">
                            <div className="text-gray-500 text-xs">
                              <div>{getViewByLabel(viewBy)}: <span className="font-medium">{label}</span></div>
                              <div>Compliant records: <span className="font-medium">{actualCount.toLocaleString()}</span> of {recordCount.toLocaleString()}</div>
                              <div>Target: <span className="font-medium">≥80%</span></div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Render clustered bars for each quality indicator */}
                {allQualityIndicators.map((qualityIndicator) => (
                  <Bar
                    key={qualityIndicator}
                    dataKey={qualityIndicator}
                    fill={QUALITY_COLORS[qualityIndicator as keyof typeof QUALITY_COLORS] || "#6b7280"}
                    cursor="pointer"
                    onMouseEnter={() => setHoveredBar(qualityIndicator)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}


        
        {/* No Data State */}
        {!loading && !error && data.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-gray-500 font-medium mb-2">No Data Available</div>
              <div className="text-gray-400 text-sm">No quality indicator data found for the selected filters.</div>
            </div>
          </div>
        )}

        {/* Legend - Only show when data is available */}
        {!loading && !error && data.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4 text-left">Quality Prescribing Indicators</h3>
            <div className="grid grid-cols-3 gap-x-8 gap-y-2">
              {allQualityIndicators.map((qualityIndicator) => {
                const color = QUALITY_COLORS[qualityIndicator as keyof typeof QUALITY_COLORS];
                
                return (
                  <div key={qualityIndicator} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: color || "#6b7280" }}
                    ></div>
                    <span className="text-gray-700 text-sm">
                      {qualityIndicator}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Footnote - Only show when data is available */}
        {!loading && !error && data.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              PPS data from AMU_HH table; excludes records with incomplete quality indicator data. Bars show clustered compliance rates for each quality indicator {viewByOptions.find(o => o.value === viewBy)?.label}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}