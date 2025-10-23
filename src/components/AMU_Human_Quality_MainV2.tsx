import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { QualitySummaryCardsVertical } from './QualitySummaryCardsVertical';
import { AMU_filter_topwide } from './AMU_filter_topwide';
import { Download } from 'lucide-react';

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

interface RadarDataItem {
  subject: string;
  value: number;
  target: number;
}

interface AMU_Human_Quality_MainV2Props {
  qualityActiveFilters: ActiveFilter[];
  qualityFilterHelpers: FilterHelpers;
  qualityFilterType: string;
  setQualityFilterType: (value: string) => void;
  qualityFilterValue: string;
  setQualityFilterValue: (value: string) => void;
  filterTypeOptions: FilterOption[];
  getFilterValueOptions: (type: string) => FilterOption[];
  radarData: RadarDataItem[];
}

export function AMU_Human_Quality_MainV2({
  qualityActiveFilters,
  qualityFilterHelpers,
  qualityFilterType,
  setQualityFilterType,
  qualityFilterValue,
  setQualityFilterValue,
  filterTypeOptions,
  getFilterValueOptions,
  radarData
}: AMU_Human_Quality_MainV2Props) {
  return (
    <Card className="lg:col-span-2 overflow-visible">
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
      <CardContent className="overflow-visible">
        {(() => {
          // Hospital Quality Data - Comprehensive Hospital Quality Indicators Data
          const hospitalQualityData = [
            { 
              hospital: 'Ho Teaching Hospital',
              shortName: 'Ho TH',
              sampleSize: 300,
              reason: 82.0,
              guideline: 60.0,
              culture: 35.0,
              directed: 5.0,
              biomarker: 55.0,
              review: 32.0
            },
            { 
              hospital: 'Komfo Anokye Teaching Hospital',
              shortName: 'Komfo Anokye TH',
              sampleSize: 800,
              reason: 88.0,
              guideline: 70.0,
              culture: 50.0,
              directed: 6.0,
              biomarker: 65.0,
              review: 38.0
            },
            { 
              hospital: 'Tamale Teaching Hospital',
              shortName: 'Tamale TH',
              sampleSize: 350,
              reason: 80.0,
              guideline: 58.0,
              culture: 30.0,
              directed: 4.0,
              biomarker: 50.0,
              review: 28.0
            },
            { 
              hospital: 'LEKMA Hospital',
              shortName: 'LEKMA',
              sampleSize: 180,
              reason: 72.0,
              guideline: 42.0,
              culture: 18.0,
              directed: 3.0,
              biomarker: 45.0,
              review: 22.0
            },
            { 
              hospital: 'Sunyani Teaching Hospital',
              shortName: 'Sunyani TH',
              sampleSize: 250,
              reason: 78.0,
              guideline: 55.0,
              culture: 28.0,
              directed: 4.0,
              biomarker: 48.0,
              review: 26.0
            },
            { 
              hospital: 'St. Martin de Porres Hospital',
              shortName: 'St. Martin',
              sampleSize: 120,
              reason: 76.0,
              guideline: 50.0,
              culture: 22.0,
              directed: 3.0,
              biomarker: 46.0,
              review: 24.0
            },
            { 
              hospital: 'Korle-Bu Teaching Hospital',
              shortName: 'Korle-Bu TH',
              sampleSize: 624,
              reason: 67.1,
              guideline: 30.9,
              culture: 11.4,
              directed: 4.0,
              biomarker: 38.3,
              review: 21.8
            },
            { 
              hospital: 'Cape Coast Teaching Hospital',
              shortName: 'Cape Coast TH',
              sampleSize: 280,
              reason: 83.0,
              guideline: 62.0,
              culture: 33.0,
              directed: 5.0,
              biomarker: 53.0,
              review: 30.0
            },
            { 
              hospital: 'Eastern Regional Hospital',
              shortName: 'Eastern Regional',
              sampleSize: 440,
              reason: 90.0,
              guideline: 75.0,
              culture: 55.0,
              directed: 8.0,
              biomarker: 70.0,
              review: 45.0
            },
            { 
              hospital: 'University of Ghana Medical Center',
              shortName: 'UG Medical Center',
              sampleSize: 222,
              reason: 95.0,
              guideline: 87.4,
              culture: 72.5,
              directed: 2.7,
              biomarker: 89.2,
              review: 41.9
            }
          ];

          // Find hospital filter - look for hospital filter type in active filters
          const hospitalFilter = qualityActiveFilters.find(filter => filter.type === 'hospital');
          
          // Debug logging
          console.log('Quality Active Filters:', qualityActiveFilters);
          console.log('Hospital Filter Found:', hospitalFilter);
          
          // Generate dynamic radar data based on selected hospital or show national averages
          const getDynamicRadarData = () => {
            if (hospitalFilter) {
              // Map filter values to hospital names
              const hospitalMap = {
                'ho_teaching': 'Ho Teaching Hospital',
                'komfo_anokye': 'Komfo Anokye Teaching Hospital',
                'tamale_teaching': 'Tamale Teaching Hospital',
                'lekma': 'LEKMA Hospital',
                'sunyani_teaching': 'Sunyani Teaching Hospital',
                'st_martin': 'St. Martin de Porres Hospital',
                'korle_bu': 'Korle-Bu Teaching Hospital',
                'cape_coast': 'Cape Coast Teaching Hospital',
                'eastern_regional': 'Eastern Regional Hospital',
                'ug_medical_center': 'University of Ghana Medical Center'
              };
              
              // Find the selected hospital data by matching filter value to hospital identifier
              console.log('Looking for hospital:', hospitalMap[hospitalFilter.value], 'with filter value:', hospitalFilter.value);
              const selectedHospital = hospitalQualityData.find(hospital => 
                hospital.hospital === hospitalMap[hospitalFilter.value]
              );
              console.log('Selected Hospital Data:', selectedHospital);

              if (selectedHospital) {
                return [
                  { subject: 'Reason in Notes', value: selectedHospital.reason, target: 80 },
                  { subject: 'Guideline Compliant', value: selectedHospital.guideline, target: 80 },
                  { subject: 'Culture Taken', value: selectedHospital.culture, target: 80 },
                  { subject: 'Directed Therapy', value: selectedHospital.directed, target: 80 },
                  { subject: 'Biomarker Used', value: selectedHospital.biomarker, target: 80 },
                  { subject: 'Review Date', value: selectedHospital.review, target: 80 }
                ];
              }
            }

            // Default: show national averages
            return [
              { 
                subject: 'Reason in Notes', 
                value: hospitalQualityData.reduce((sum, h) => sum + h.reason, 0) / hospitalQualityData.length, 
                target: 80 
              },
              { 
                subject: 'Guideline Compliant', 
                value: hospitalQualityData.reduce((sum, h) => sum + h.guideline, 0) / hospitalQualityData.length, 
                target: 80 
              },
              { 
                subject: 'Culture Taken', 
                value: hospitalQualityData.reduce((sum, h) => sum + h.culture, 0) / hospitalQualityData.length, 
                target: 80 
              },
              { 
                subject: 'Directed Therapy', 
                value: hospitalQualityData.reduce((sum, h) => sum + h.directed, 0) / hospitalQualityData.length, 
                target: 80 
              },
              { 
                subject: 'Biomarker Used', 
                value: hospitalQualityData.reduce((sum, h) => sum + h.biomarker, 0) / hospitalQualityData.length, 
                target: 80 
              },
              { 
                subject: 'Review Date', 
                value: hospitalQualityData.reduce((sum, h) => sum + h.review, 0) / hospitalQualityData.length, 
                target: 80 
              }
            ];
          };

          const currentRadarData = getDynamicRadarData();

          return (<>
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
            <AMU_filter_topwide
              activeFilters={qualityActiveFilters}
              filterType={qualityFilterType}
              setFilterType={setQualityFilterType}
              filterValue={qualityFilterValue}
              setFilterValue={setQualityFilterValue}
              filterTypeOptions={filterTypeOptions}
              getFilterValueOptions={getFilterValueOptions}
              filterHelpers={qualityFilterHelpers}
              title="Filter Quality Data:"
              showActiveFilters={false}
            />

            {/* 2-Column Layout */}
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
                          <div key={item.subject} className="flex items-center group cursor-pointer mx-[0px] relative z-20 px-[0px] py-[0px]">
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
                              
                              {/* Tooltip on hover */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="fixed transform -translate-x-1/2 mt-2" style={{ 
                                  zIndex: 9999,
                                  top: 'calc(50vh + 20px)',
                                  left: '50%'
                                }}>
                                  <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[300px]">
                                    <div className="text-gray-900 font-medium mb-1">
                                      <strong>{item.subject}</strong>
                                    </div>
                                    <div className="text-gray-600 text-sm mb-2">
                                      <span 
                                        className="font-medium text-sm"
                                        style={{ color: complianceInfo.color }}
                                      >
                                        {item.value.toFixed(1)}% compliance rate ({complianceInfo.level})
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
                      <span className="text-xs font-semibold text-gray-700">Compliance Rate</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Quality Summary Cards (1/3 width) */}
              <div className="w-1/3 flex flex-col h-[290px] mx-[0px] my-[10px] m-[0px]">
                <QualitySummaryCardsVertical />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200 m-[0px]">
              <p className="text-xs text-gray-500">
                PPS data; excludes topical antibacterials and anti-TB drugs.
                {hospitalFilter && ` • Showing data for ${hospitalFilter.label.split(': ')[1]}`}
                {!hospitalFilter && ' • Showing national averages across all hospitals'}
              </p>
            </div>
          </>);
        })()}
      </CardContent>
    </Card>
  );
}