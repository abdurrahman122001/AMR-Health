import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { QualitySummaryCardsVertical } from './QualitySummaryCardsVertical';
import { AMU_filter_topwide } from './AMU_filter_topwide';
import { Download, Table } from 'lucide-react';
import { makeServerRequest } from '../utils/supabase/client';
import { SearchableSelect } from './SearchableSelect';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface QualityIndicator {
  subject: string;
  field: string;
  value: number;
  count: number;
  target: number;
}

interface QualityResponse {
  totalRecords: number;
  indicators: QualityIndicator[];
  dataSource: string;
  tableName?: string;
  timestamp?: string;
  error?: string;
}

interface FacilityComplianceResponse {
  totalFacilities: number;
  facilitiesMeetingTarget: number;
  facilitiesNotMeetingTarget: number;
  targetPercentage: string;
  facilityDetails: Array<{
    name: string;
    totalRecords: number;
    aggregateScore: string;
    meetingTarget: boolean;
    indicators: Record<string, string>;
  }>;
  dataSource: string;
  tableName?: string;
  timestamp?: string;
  error?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface AMU_Human_Quality_MainV3Props {
  qualityActiveFilters: Array<{
    type: string;
    value: string;
    label: string;
  }>;
  qualityFilterType: string;
  setQualityFilterType: (type: string) => void;
  qualityFilterValue: string;
  setQualityFilterValue: (value: string) => void;
  filterTypeOptions: Array<{ value: string; label: string }>;
  getFilterValueOptions: (type: string) => Array<{ value: string; label: string }>;
  qualityFilterHelpers: {
    clearAllFilters: () => void;
    removeFilter: (index: number) => void;
    addFilter: () => void;
  };
}

export function AMU_Human_Quality_MainV3({
  qualityActiveFilters,
  qualityFilterType,
  setQualityFilterType,
  qualityFilterValue,
  setQualityFilterValue,
  filterTypeOptions,
  getFilterValueOptions,
  qualityFilterHelpers
}: AMU_Human_Quality_MainV3Props) {
  // Quality data state management
  const [qualityData, setQualityData] = useState<QualityResponse | null>(null);
  const [facilityComplianceData, setFacilityComplianceData] = useState<FacilityComplianceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [facilityLoading, setFacilityLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facilityError, setFacilityError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  
  // Dynamic filter value management (replicated from ViewBy component)
  const [filterValueOptions, setFilterValueOptions] = useState<FilterOption[]>([]);
  const [filterValuesLoading, setFilterValuesLoading] = useState(false);

  // Dynamic filter value fetching function (replicated from ViewBy component)
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

  // Fetch filter values when filter type changes (replicated from ViewBy component)
  useEffect(() => {
    if (qualityFilterType) {
      console.log(`Dynamic filter system: Fetching values for filter type "${qualityFilterType}"`);
      fetchFilterValues(qualityFilterType);
    } else {
      setFilterValueOptions([]);
    }
    // Clear filter value when type changes
    setQualityFilterValue('');
  }, [qualityFilterType]);

  // Fetch quality data from AMU_HH table when component mounts or filters change
  useEffect(() => {
    const fetchQualityData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters from active filters
        const queryParams = new URLSearchParams();
        
        // Add all dynamic filters
        qualityActiveFilters.forEach(filter => {
          queryParams.append(filter.type, filter.value);
        });
        
        // If no filters are applied, still send a basic request
        if (qualityActiveFilters.length === 0) {
          queryParams.append('no_filters', 'true');
        }
        
        console.log('🔍 Quality Indicators Query Debug:');
        console.log('  - Active filters count:', qualityActiveFilters.length);
        console.log('  - Query params string:', queryParams.toString());
        console.log('  - Active filters details:', qualityActiveFilters);
        
        const data = await makeServerRequest(`amu-quality-indicators?${queryParams.toString()}`);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 Quality Indicators Response:');
        console.log('  - Total records returned:', data.totalRecords);
        console.log('  - Data source:', data.dataSource);
        console.log('  - Indicators:', data.indicators);
        console.log('  - Full response:', data);
        
        setQualityData(data);
        
      } catch (err) {
        console.error('Error fetching quality indicators data from AMU_HH:', err);
        setError(err.message || 'Failed to access AMU_HH table');
        setQualityData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQualityData();
  }, [qualityActiveFilters]); // Re-fetch when filters change

  // Fetch facility compliance data from AMU_HH table when component mounts or filters change
  useEffect(() => {
    const fetchFacilityComplianceData = async () => {
      try {
        setFacilityLoading(true);
        setFacilityError(null);
        
        // Build query parameters from active filters (same as quality data)
        const queryParams = new URLSearchParams();
        
        // Add all dynamic filters
        qualityActiveFilters.forEach(filter => {
          queryParams.append(filter.type, filter.value);
        });
        
        // If no filters are applied, still send a basic request
        if (qualityActiveFilters.length === 0) {
          queryParams.append('no_filters', 'true');
        }
        
        console.log('🏥 Facility Compliance Query Debug:');
        console.log('  - Active filters count:', qualityActiveFilters.length);
        console.log('  - Query params string:', queryParams.toString());
        console.log('  - Active filters details:', qualityActiveFilters);
        
        const data = await makeServerRequest(`amu-facility-compliance?${queryParams.toString()}`);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('🏥 Facility Compliance Response:');
        console.log('  - Total facilities:', data.totalFacilities);
        console.log('  - Facilities meeting target:', data.facilitiesMeetingTarget);
        console.log('  - Target percentage:', data.targetPercentage);
        console.log('  - Data source:', data.dataSource);
        console.log('  - Full response:', data);
        
        setFacilityComplianceData(data);
        
      } catch (err) {
        console.error('Error fetching facility compliance data from AMU_HH:', err);
        setFacilityError(err.message || 'Failed to access AMU_HH table for facility compliance');
        setFacilityComplianceData(null);
      } finally {
        setFacilityLoading(false);
      }
    };

    fetchFacilityComplianceData();
  }, [qualityActiveFilters]); // Re-fetch when filters change

  // Function to get current quality data for display
  const getCurrentQualityData = () => {
    if (loading || !qualityData || error) {
      // Return placeholder data while loading or on error
      return [
        { subject: 'Reason in Notes', value: 0, target: 80 },
        { subject: 'Guideline Compliant', value: 0, target: 80 },
        { subject: 'Culture Taken', value: 0, target: 80 },
        { subject: 'Targeted Therapy', value: 0, target: 80 },
        { subject: 'Biomarker Used', value: 0, target: 80 },
        { subject: 'Review Date', value: 0, target: 80 }
      ];
    }
    
    return qualityData.indicators;
  };

  const currentRadarData = getCurrentQualityData();

  return (
    <Card className="lg:col-span-2 overflow-visible">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            Quality Prescribing Indicators
            {loading && <span className="text-sm text-gray-500 ml-2">(Loading...)</span>}
            {error && <span className="text-sm text-red-500 ml-2">(Error)</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
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
                console.log(`${showTable ? 'Show chart' : 'Show table'} view for quality data`);
              }}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log('Download Quality Prescribing Indicators data', qualityData);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Quality Assessment Indicators for Antimicrobial Prescribing • 
          {qualityActiveFilters.length > 0 ? (
            <span className="font-medium text-blue-600 ml-1"> 
              Filtered ({qualityActiveFilters.length} filter{qualityActiveFilters.length === 1 ? '' : 's'}): {qualityData?.totalRecords?.toLocaleString() || 0} records
            </span>
          ) : (
            <span className="text-gray-700 ml-1"> Total: {qualityData?.totalRecords?.toLocaleString() || 0} records</span>
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
              <h3 className="font-semibold text-gray-900 text-sm">Filter Quality Data:</h3>
            </div>
            
            {/* Filter Type */}
            <div className="flex-1">
              <SearchableSelect
                value={qualityFilterType}
                onValueChange={setQualityFilterType}
                options={filterTypeOptions}
                placeholder="Search filter type..."
                className="w-full text-sm"
              />
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <SearchableSelect
                value={qualityFilterValue}
                onValueChange={setQualityFilterValue}
                options={filterValueOptions}
                disabled={!qualityFilterType || filterValuesLoading}
                placeholder={
                  filterValuesLoading 
                    ? "Loading values..." 
                    : qualityFilterType 
                      ? `Select ${filterTypeOptions?.find(opt => opt.value === qualityFilterType)?.label?.toLowerCase()}...` 
                      : "Select type first"
                }
                className="w-full text-sm"
              />
            </div>

            {/* Add Filter Button */}
            <button
              onClick={qualityFilterHelpers.addFilter}
              disabled={!qualityFilterType || !qualityFilterValue}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {qualityActiveFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({qualityActiveFilters.length})
              </span>
              <button
                onClick={qualityFilterHelpers.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {qualityActiveFilters.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => qualityFilterHelpers.removeFilter(index)}
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
      <CardContent className="overflow-visible">
        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Error loading quality indicators data</div>
            <div className="text-sm text-gray-500">{error}</div>
          </div>
        )}
        
        {loading && !error && (
          <div className="text-center py-8">
            <div className="text-gray-600 mb-2">Loading quality indicators...</div>
            <div className="text-sm text-gray-500">Fetching data from AMU_HH table</div>
          </div>
        )}
        
        {!loading && !error && qualityData && (
          <>
            {showTable ? (
              /* Table View */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    Quality Prescribing Indicators Data Table
                  </h4>
                  <span className="text-sm text-gray-500">
                    Showing all {currentRadarData.length} quality indicators
                  </span>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading quality indicators...</p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <TableComponent>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead className="flex-1">Quality Indicator</TableHead>
                          <TableHead className="w-20 text-right">Count</TableHead>
                          <TableHead className="w-24 text-right">Compliance</TableHead>
                          <TableHead className="w-20 text-right">Target</TableHead>
                          <TableHead className="w-24 text-center">Status</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRadarData.map((item, index) => {
                          const getComplianceInfo = (value: number) => {
                            if (value >= 80) return { color: '#16a34a', level: 'Excellent', bgColor: 'bg-green-50', textColor: 'text-green-700' };
                            if (value >= 60) return { color: '#f59e0b', level: 'Good', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' };
                            if (value >= 40) return { color: '#ea580c', level: 'Fair', bgColor: 'bg-orange-50', textColor: 'text-orange-700' };
                            return { color: '#dc2626', level: 'Poor', bgColor: 'bg-red-50', textColor: 'text-red-700' };
                          };
                          
                          const complianceInfo = getComplianceInfo(item.value);
                          const indicator = qualityData?.indicators.find(ind => ind.subject === item.subject);
                          
                          return (
                            <TableRow key={item.subject}>
                              <TableCell className="font-medium text-gray-500">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">{item.subject}</div>
                                  <div className="text-sm text-gray-500">
                                    {item.subject === 'Reason in Notes' && 'Documented clinical indication and rationale'}
                                    {item.subject === 'Guideline Compliant' && 'Following local or international guidelines'}
                                    {item.subject === 'Culture Taken' && 'Microbiological samples collected'}
                                    {item.subject === 'Targeted Therapy' && 'Treatment based on culture results'}
                                    {item.subject === 'Biomarker Used' && 'Decisions guided by biomarkers'}
                                    {item.subject === 'Review Date' && 'Documented review/stop dates'}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {indicator ? indicator.count.toLocaleString() : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {item.value.toFixed(1)}%
                              </TableCell>
                              <TableCell className="text-right font-medium text-gray-600">
                                ≥{item.target}%
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${complianceInfo.bgColor} ${complianceInfo.textColor}`}>
                                  {complianceInfo.level}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: complianceInfo.color }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </TableComponent>
                  </div>
                )}
                
                {/* Table Summary Cards */}
                <div className="mt-6">
                  <QualitySummaryCardsVertical 
                    qualityData={qualityData}
                    currentRadarData={currentRadarData}
                    loading={loading}
                    error={error}
                    facilityComplianceData={facilityComplianceData}
                    facilityLoading={facilityLoading}
                    facilityError={facilityError}
                  />
                </div>
              </div>
            ) : (
              /* Chart View */
              <div className="flex gap-6 my-[10px] mx-[0px] my-[15px]">
                {/* Left Column - Chart Area (2/3 width) */}
                <div className="flex-1 w-2/3">
                  <div className="h-[350px] w-full">
                    {/* Custom horizontal bar chart */}
                    <div className="flex flex-col h-full">
                      {/* Chart area with border frame */}
                      <div className="flex-1 flex flex-col justify-evenly relative px-[0px] py-[5px]">
                        {/* Chart container with border */}
                        <div className="absolute inset-0 ml-[140px] mr-[30px] border-l border-b border-gray-400 z-0">
                          {/* Vertical gridlines at 20%, 40%, 60%, 80%, 100% */}
                          <div className="absolute inset-0">
                            {[20, 40, 60, 80, 100].map((percent) => (
                              <div 
                                key={percent}
                                className={`absolute h-full w-px ${percent === 100 ? 'border-l border-gray-400' : 'border-l border-gray-300 border-dashed'}`}
                                style={{ left: `${percent}%` }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {currentRadarData.map((item, index) => {
                          const getComplianceInfo = (value: number) => {
                            if (value >= 80) return { color: '#16a34a', level: 'Excellent compliance' };
                            if (value >= 60) return { color: '#f59e0b', level: 'Good compliance' };
                            if (value >= 40) return { color: '#ea580c', level: 'Fair compliance' };
                            return { color: '#dc2626', level: 'Poor compliance' };
                          };
                          
                          const complianceInfo = getComplianceInfo(item.value);
                          
                          return (
                            <TooltipComponent key={item.subject}>
                              <TooltipTrigger asChild>
                                <div className="flex items-center cursor-pointer mx-[0px] hover:bg-gray-50 transition-colors px-[0px] py-[0px]">
                                  {/* Y-axis label */}
                                  <div className="w-[140px] text-left pr-3 text-[20px] font-bold font-normal">
                                    <span className="text-xs text-gray-700 text-[13px]">{item.subject}</span>
                                  </div>
                                  
                                  {/* Bar container */}
                                  <div className="flex-1 relative h-10 bg-transparent mr-[30px]">
                                    {/* Stacked bars */}
                                    <div className="absolute inset-0 flex">
                                      {/* Compliance bar */}
                                      <div 
                                        className="h-full flex items-center"
                                        style={{ 
                                          width: `${item.value}%`,
                                          backgroundColor: complianceInfo.color,
                                          justifyContent: item.value < 10 ? 'flex-start' : 'flex-end',
                                          paddingRight: item.value < 10 ? '0' : '8px'
                                        }}
                                      >
                                        {item.value >= 10 && (
                                          <span className="text-sm text-white font-medium">
                                            {item.value.toFixed(1)}%
                                          </span>
                                        )}
                                      </div>
                                      {/* External label for values < 10% */}
                                      {item.value < 10 && (
                                        <div className="h-full flex items-center pl-2">
                                          <span 
                                            className="text-sm font-medium"
                                            style={{ color: complianceInfo.color }}
                                          >
                                            {item.value.toFixed(1)}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[350px] p-4 z-[10000] bg-white border border-gray-200 shadow-lg">
                                <div className="space-y-2">
                                  <div className="text-gray-900 font-medium">
                                    <strong>{item.subject}</strong>
                                  </div>
                                  <div className="text-gray-600 text-sm">
                                    <span 
                                      className="font-medium text-sm"
                                      style={{ color: complianceInfo.color }}
                                    >
                                      {item.value.toFixed(1)}% compliance rate ({complianceInfo.level})
                                    </span>
                                  </div>
                                  {qualityData && (
                                    <div className="text-gray-600 text-sm">
                                      {(() => {
                                        const indicator = qualityData.indicators.find(ind => ind.subject === item.subject);
                                        return indicator ? `${indicator.count.toLocaleString()} of ${qualityData.totalRecords.toLocaleString()} records` : '';
                                      })()}
                                    </div>
                                  )}
                                  <div className="text-gray-500 text-xs">
                                    {item.subject === 'Reason in Notes' && 'Percentage of prescriptions with documented clinical indication and rationale for antimicrobial therapy'}
                                    {item.subject === 'Guideline Compliant' && 'Prescriptions following local hospital guidelines or international standards (WHO, IDSA)'}
                                    {item.subject === 'Culture Taken' && 'Infections where microbiological samples were collected before starting treatment'}
                                    {item.subject === 'Targeted Therapy' && 'Treatment modified or confirmed based on culture and sensitivity results'}
                                    {item.subject === 'Biomarker Used' && 'Prescribing decisions guided by biomarkers such as procalcitonin or C-reactive protein'}
                                    {item.subject === 'Review Date' && 'Prescriptions with documented review dates or planned stop/reassessment dates'}
                                  </div>
                                  <div className="text-gray-500 text-xs border-t pt-2">
                                    Target: ≥80% for optimal quality
                                  </div>
                                </div>
                              </TooltipContent>
                            </TooltipComponent>
                          );
                        })}
                      </div>
                      
                      {/* X-axis labels at bottom */}
                      <div className="flex justify-between items-center mt-4 ml-[150px] mr-[30px]">
                        <span className="text-xs text-gray-600">0%</span>
                        <span className="text-xs text-gray-600">20%</span>
                        <span className="text-xs text-gray-600">40%</span>
                        <span className="text-xs text-gray-600">60%</span>
                        <span className="text-xs text-gray-600">80%</span>
                        <span className="text-xs text-gray-600">100%</span>
                      </div>
                      
                      {/* Axis labels */}
                      <div className="flex justify-center mt-2">
                        <span className="text-xs font-semibold text-gray-700">Compliance Rate</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Quality Summary Cards (1/3 width) */}
                <div className="w-1/3 flex flex-col h-[290px] mx-[0px] my-[10px] m-[0px]">
                  <QualitySummaryCardsVertical 
                    qualityData={qualityData}
                    currentRadarData={currentRadarData}
                    loading={loading}
                    error={error}
                    facilityComplianceData={facilityComplianceData}
                    facilityLoading={facilityLoading}
                    facilityError={facilityError}
                  />
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200 m-[0px]">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  PPS data; excludes topical antibacterials and anti-TB drugs.
                  {qualityData && ` • ${qualityData.totalRecords.toLocaleString()} total records analyzed`}
                </p>
                {qualityData && !loading && !error && (
                  <p className="text-xs text-gray-500">
                    Data source: {qualityData.dataSource === 'real_supabase_table' ? 'Real AMU_HH table' : qualityData.dataSource}
                    {qualityData.timestamp && (
                      <span className="ml-2">
                        • Updated: {new Date(qualityData.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}