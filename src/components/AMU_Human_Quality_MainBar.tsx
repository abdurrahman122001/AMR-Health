import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { QualitySummaryCardsVertical } from './QualitySummaryCardsVertical';
import { Download } from 'lucide-react';

// Radar chart data with target values
const radarData = [
  { subject: 'Reason in Notes', value: 78, target: 80 },
  { subject: 'Guideline Compliant', value: 67, target: 80 },
  { subject: 'Culture Taken', value: 43, target: 80 },
  { subject: 'Directed Therapy', value: 52, target: 80 },
  { subject: 'Biomarker Used', value: 34, target: 80 },
  { subject: 'Review Date', value: 61, target: 80 }
];

interface AMU_Human_Quality_MainBarProps {
  qualityActiveFilters: Array<{type: string, value: string, label: string}>;
  qualityFilterType: string;
  qualityFilterValue: string;
  setQualityFilterType: (value: string) => void;
  setQualityFilterValue: (value: string) => void;
  qualityFilterHelpers: {
    addFilter: () => void;
    removeFilter: (index: number) => void;
    clearAllFilters: () => void;
  };
  filterTypeOptions: Array<{value: string, label: string}>;
  getFilterValueOptions: (filterType: string) => Array<{value: string, label: string}>;
}

export function AMU_Human_Quality_MainBar({
  qualityActiveFilters,
  qualityFilterType,
  qualityFilterValue,
  setQualityFilterType,
  setQualityFilterValue,
  qualityFilterHelpers,
  filterTypeOptions,
  getFilterValueOptions
}: AMU_Human_Quality_MainBarProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Quality Prescribing Indicators</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              // Add download functionality here
              console.log('Download Quality Prescribing Indicators chart data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Quality Assessment Indicators for Antimicrobial Prescribing • Six key compliance metrics (% compliance)
        </p>
      </CardHeader>
      <CardContent>
        {/* Active Filters Display - Own Row */}
        {qualityActiveFilters.length > 0 && (
          <div className="mb-[20px] w-full mt-[0px] mr-[0px] ml-[0px]">
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

        {/* Filter Tool */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Quality Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Select value={qualityFilterType} onValueChange={setQualityFilterType}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select filter type..." />
                </SelectTrigger>
                <SelectContent>
                  {filterTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <Select 
                value={qualityFilterValue} 
                onValueChange={setQualityFilterValue}
                disabled={!qualityFilterType}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder={qualityFilterType ? "Select value..." : "Select type first"} />
                </SelectTrigger>
                <SelectContent>
                  {getFilterValueOptions(qualityFilterType).map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        {/* 2-Column Layout */}
        <div className="flex gap-6">
          {/* Left Column - Chart Area (2/3 width) */}
          <div className="flex-1 w-2/3">
            <div className="h-[350px] w-full">
              {/* Custom horizontal bar chart */}
              <div className="flex flex-col h-full">
                {/* Chart area with border frame */}
                <div className="flex-1 flex flex-col justify-evenly relative px-[0px] py-[5px]">
                  {/* Chart container with border */}
                  <div className="absolute inset-0 ml-[140px] mr-[30px] border-l border-b border-gray-400">
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
                  
                  {radarData.map((item, index) => {
                    const getComplianceInfo = (value: number) => {
                      if (value >= 80) return { color: '#16a34a', level: 'Excellent compliance' };
                      if (value >= 60) return { color: '#f59e0b', level: 'Good compliance' };
                      if (value >= 40) return { color: '#ea580c', level: 'Fair compliance' };
                      return { color: '#dc2626', level: 'Poor compliance' };
                    };
                    
                    const complianceInfo = getComplianceInfo(item.value);
                    
                    return (
                      <div key={item.subject} className="flex items-center group cursor-pointer mx-[0px] relative z-10 px-[0px] py-[0px]">
                        {/* Y-axis label */}
                        <div className="w-[140px] text-left pr-3 text-[20px] font-bold font-normal">
                          <span className="text-xs text-gray-700 text-[13px]">{item.subject}</span>
                        </div>
                        
                        {/* Bar container */}
                        <div className="flex-1 relative h-10 bg-transparent mr-[30px]">
                          {/* Regular bar chart */}
                          <div className="absolute inset-0">
                            {/* Compliance bar */}
                            <div 
                              className="h-full flex items-center justify-end pr-2"
                              style={{ 
                                width: `${item.value}%`,
                                backgroundColor: complianceInfo.color
                              }}
                            >
                              <span className="text-sm text-white font-medium">
                                {item.value}%
                              </span>
                            </div>
                          </div>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20">
                              <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[300px]">
                                <div className="text-gray-900 font-medium mb-1">
                                  <strong>{item.subject}</strong>
                                </div>
                                <div className="text-gray-600 text-sm mb-2">
                                  <span 
                                    className="font-medium text-sm"
                                    style={{ color: complianceInfo.color }}
                                  >
                                    {item.value}% compliance rate ({complianceInfo.level})
                                  </span>
                                </div>
                                <div className="text-gray-500 text-xs mb-2">
                                  {item.subject === 'Reason in Notes' && 'Percentage of prescriptions with documented clinical indication and rationale for antimicrobial therapy'}
                                  {item.subject === 'Guideline Compliant' && 'Prescriptions following local hospital guidelines or international standards (WHO, IDSA)'}
                                  {item.subject === 'Culture Taken' && 'Infections where microbiological samples were collected before starting treatment'}
                                  {item.subject === 'Directed Therapy' && 'Treatment modified or confirmed based on culture and sensitivity results'}
                                  {item.subject === 'Biomarker Used' && 'Prescribing decisions guided by biomarkers such as procalcitonin or C-reactive protein'}
                                  {item.subject === 'Review Date' && 'Prescriptions with documented review dates or planned stop/reassessment dates'}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  Target: ≥80% for optimal quality
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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
                  <span className="text-xs font-semibold text-gray-700">% Compliance Rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quality Summary Cards (1/3 width) */}
          <div className="w-1/3 flex flex-col h-[350px] mx-[0px] my-[10px] m-[0px]">
            <QualitySummaryCardsVertical />
          </div>
        </div>
        
        {/* Legend and Key Metrics */}

        
        {/* Quality Indicators Description */}

      </CardContent>
    </Card>
  );
}