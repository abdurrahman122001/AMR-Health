import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

interface AMU_Human_Diagnosis_ViewByProps {
  regionFilterType?: string;
  setRegionFilterType?: (value: string) => void;
  regionFilterValue?: string;
  setRegionFilterValue?: (value: string) => void;
  regionActiveFilters?: ActiveFilter[];
  regionFilterHelpers?: FilterHelpers;
  filterTypeOptions?: FilterOption[];
  getFilterValueOptions?: (type: string) => FilterOption[];
}

export function AMU_Human_Diagnosis_ViewBy({
  regionFilterType = '',
  setRegionFilterType = () => {},
  regionFilterValue = '',
  setRegionFilterValue = () => {},
  regionActiveFilters = [],
  regionFilterHelpers = { addFilter: () => {}, removeFilter: () => {}, clearAllFilters: () => {} },
  filterTypeOptions = [],
  getFilterValueOptions = () => []
}: AMU_Human_Diagnosis_ViewByProps) {
  const [viewBy, setViewBy] = useState('region');
  
  // Diagnosis color definitions
  const DIAGNOSIS_COLORS = {
    "Pneu": "#3B82F6", // blue - Pneumonia
    "SEPSIS": "#EF4444", // red - Sepsis
    "Cys": "#10B981", // green - Cystitis/UTI
    "SST": "#F59E0B", // yellow - Skin/Soft Tissue
    "Pye": "#8B5CF6", // purple - Pyelonephritis
    "GI": "#06B6D4", // cyan - Gastrointestinal
    "CNS": "#EC4899", // pink - CNS infections
    "BAC": "#84CC16", // lime - Bacteremia
    "BJ": "#F97316", // orange - Bone/Joint
    "IA": "#14B8A6", // teal - Intra-abdominal
    "Other": "#6B7280" // gray - Others
  };

  // Generate mock data based on view selection
  const getViewByData = () => {
    // Check if filtering by Eastern Regional Hospital for specific data
    const isEasternRegionalHospital = regionActiveFilters?.some(filter => 
      filter.type === 'hospital' && filter.value === 'Eastern Regional Hospital'
    ) || false;

    switch (viewBy) {
      case 'region':
        return [
          { 
            category: 'AFR',
            Pneu: 19.2, SEPSIS: 15.8, Cys: 12.5, SST: 9.8, Pye: 8.3, GI: 6.7, CNS: 5.2, BAC: 4.8, BJ: 4.1, IA: 3.8, Other: 9.8
          },
          {
            category: 'ASR', 
            Pneu: 18.7, SEPSIS: 16.1, Cys: 13.2, SST: 9.1, Pye: 8.9, GI: 6.2, CNS: 4.8, BAC: 4.5, BJ: 3.7, IA: 3.6, Other: 11.2
          },
          {
            category: 'BAR',
            Pneu: 17.9, SEPSIS: 14.8, Cys: 12.9, SST: 10.3, Pye: 8.1, GI: 6.9, CNS: 5.5, BAC: 4.2, BJ: 3.9, IA: 3.7, Other: 11.8
          },
          {
            category: 'BER',
            Pneu: 19.8, SEPSIS: 15.3, Cys: 13.1, SST: 9.5, Pye: 8.7, GI: 6.4, CNS: 4.9, BAC: 4.6, BJ: 4.2, IA: 3.5, Other: 10.0
          },
          {
            category: 'BR',
            Pneu: 18.1, SEPSIS: 16.4, Cys: 12.3, SST: 9.9, Pye: 8.2, GI: 6.8, CNS: 5.3, BAC: 4.1, BJ: 3.8, IA: 3.9, Other: 11.2
          },
          {
            category: 'CR',
            Pneu: 20.1, SEPSIS: 14.9, Cys: 12.8, SST: 9.2, Pye: 8.6, GI: 6.3, CNS: 4.7, BAC: 4.9, BJ: 4.0, IA: 3.4, Other: 11.1
          },
          {
            category: 'ER',
            Pneu: 17.5, SEPSIS: 16.8, Cys: 11.9, SST: 10.5, Pye: 7.8, GI: 7.1, CNS: 5.8, BAC: 3.9, BJ: 3.6, IA: 4.1, Other: 11.0
          },
          { 
            category: 'GAR',
            Pneu: 21.3, SEPSIS: 14.2, Cys: 13.5, SST: 8.9, Pye: 9.1, GI: 5.8, CNS: 4.3, BAC: 5.2, BJ: 4.4, IA: 3.2, Other: 10.1
          },
          {
            category: 'NER',
            Pneu: 19.6, SEPSIS: 15.7, Cys: 12.7, SST: 9.4, Pye: 8.5, GI: 6.5, CNS: 4.8, BAC: 4.7, BJ: 3.9, IA: 3.7, Other: 10.5
          },
          {
            category: 'NR', 
            Pneu: 18.3, SEPSIS: 16.2, Cys: 12.1, SST: 10.1, Pye: 8.0, GI: 6.9, CNS: 5.4, BAC: 4.0, BJ: 3.7, IA: 3.8, Other: 11.5
          },
          {
            category: 'OR',
            Pneu: 19.0, SEPSIS: 15.5, Cys: 12.6, SST: 9.7, Pye: 8.4, GI: 6.6, CNS: 5.0, BAC: 4.4, BJ: 4.0, IA: 3.6, Other: 11.2
          },
          {
            category: 'UER',
            Pneu: 20.4, SEPSIS: 14.6, Cys: 13.3, SST: 8.8, Pye: 8.8, GI: 5.9, CNS: 4.5, BAC: 4.8, BJ: 4.1, IA: 3.3, Other: 11.5
          },
          {
            category: 'UWR',
            Pneu: 18.9, SEPSIS: 15.9, Cys: 12.4, SST: 9.6, Pye: 8.1, GI: 6.7, CNS: 5.1, BAC: 4.3, BJ: 3.8, IA: 3.7, Other: 11.5
          },
          {
            category: 'VR',
            Pneu: 17.7, SEPSIS: 16.5, Cys: 11.8, SST: 10.2, Pye: 7.9, GI: 7.0, CNS: 5.6, BAC: 3.8, BJ: 3.5, IA: 4.0, Other: 12.0
          },
          {
            category: 'WNR',
            Pneu: 17.2, SEPSIS: 17.1, Cys: 11.5, SST: 10.6, Pye: 7.6, GI: 7.2, CNS: 5.9, BAC: 3.6, BJ: 3.4, IA: 4.2, Other: 11.7
          },
          {
            category: 'WR',
            Pneu: 16.8, SEPSIS: 17.3, Cys: 11.2, SST: 10.8, Pye: 7.4, GI: 7.4, CNS: 6.1, BAC: 3.4, BJ: 3.2, IA: 4.3, Other: 12.1
          }
        ];
      
      case 'ward':
        return [
          {
            category: 'Medical Ward',
            Pneu: 28.7, SEPSIS: 18.2, Cys: 15.1, SST: 7.3, Pye: 9.8, GI: 5.9, CNS: 3.2, BAC: 2.8, BJ: 2.1, IA: 1.9, Other: 5.0
          },
          {
            category: 'Surgical Ward', 
            Pneu: 12.4, SEPSIS: 9.8, Cys: 8.2, SST: 18.6, Pye: 6.1, GI: 4.3, CNS: 2.1, BAC: 3.2, BJ: 8.7, IA: 15.2, Other: 11.4
          },
          {
            category: 'ICU',
            Pneu: 22.1, SEPSIS: 28.5, Cys: 7.3, SST: 6.8, Pye: 5.2, GI: 8.9, CNS: 12.4, BAC: 6.7, BJ: 1.8, IA: 2.1, Other: 8.2
          },
          {
            category: 'Pediatric Ward',
            Pneu: 31.2, SEPSIS: 12.8, Cys: 11.9, SST: 8.4, Pye: 7.6, GI: 9.1, CNS: 6.8, BAC: 3.4, BJ: 2.9, IA: 2.2, Other: 3.7
          },
          {
            category: 'Emergency Dept',
            Pneu: 24.6, SEPSIS: 19.3, Cys: 13.2, SST: 10.1, Pye: 8.7, GI: 6.8, CNS: 4.5, BAC: 4.2, BJ: 3.1, IA: 2.8, Other: 2.7
          }
        ];
      
      case 'sex':
        return [
          {
            category: 'Female',
            Pneu: 17.8, SEPSIS: 14.9, Cys: 16.2, SST: 8.9, Pye: 11.3, GI: 6.4, CNS: 4.8, BAC: 4.1, BJ: 3.2, IA: 3.5, Other: 8.9
          },
          {
            category: 'Male',
            Pneu: 19.1, SEPSIS: 15.6, Cys: 9.8, SST: 10.3, Pye: 6.2, GI: 6.9, CNS: 5.4, BAC: 4.5, BJ: 4.2, IA: 3.9, Other: 14.1
          },
          {
            category: 'Unknown',
            Pneu: 18.2, SEPSIS: 16.8, Cys: 11.1, SST: 9.7, Pye: 7.9, GI: 7.2, CNS: 5.8, BAC: 3.9, BJ: 3.6, IA: 4.2, Other: 11.6
          }
        ];
      
      case 'ageGroup':
        return [
          {
            category: 'Neonates',
            Pneu: 24.1, SEPSIS: 19.2, Cys: 8.3, SST: 7.1, Pye: 5.4, GI: 9.8, CNS: 8.7, BAC: 6.2, BJ: 1.9, IA: 2.1, Other: 7.2
          },
          {
            category: 'Under 5',
            Pneu: 29.3, SEPSIS: 15.8, Cys: 9.7, SST: 8.2, Pye: 6.1, GI: 11.2, CNS: 7.3, BAC: 4.8, BJ: 2.4, IA: 2.3, Other: 2.9
          },
          {
            category: '15-64',
            Pneu: 16.8, SEPSIS: 14.2, Cys: 13.9, SST: 10.1, Pye: 8.7, GI: 5.8, CNS: 4.2, BAC: 3.9, BJ: 4.1, IA: 3.8, Other: 14.5
          },
          {
            category: '65+',
            Pneu: 21.4, SEPSIS: 18.9, Cys: 11.2, SST: 8.9, Pye: 7.8, GI: 6.1, CNS: 3.8, BAC: 4.7, BJ: 3.9, IA: 3.5, Other: 9.8
          }
        ];

      case 'hospital':
        return [
          {
            category: 'Komfo Anokye TH',
            Pneu: 19.2, SEPSIS: 15.1, Cys: 12.8, SST: 9.4, Pye: 8.6, GI: 6.5, CNS: 5.1, BAC: 4.3, BJ: 3.8, IA: 3.7, Other: 11.5
          },
          {
            category: 'Korle-Bu TH',
            Pneu: 20.3, SEPSIS: 14.8, Cys: 13.1, SST: 9.1, Pye: 8.9, GI: 6.2, CNS: 4.7, BAC: 4.6, BJ: 4.0, IA: 3.4, Other: 10.9
          },
          {
            category: 'Cape Coast TH',
            Pneu: 18.7, SEPSIS: 15.4, Cys: 12.6, SST: 9.7, Pye: 8.2, GI: 6.7, CNS: 5.3, BAC: 4.1, BJ: 3.6, IA: 3.9, Other: 11.8
          },
          {
            category: 'Ho TH',
            Pneu: 17.9, SEPSIS: 16.2, Cys: 11.9, SST: 10.2, Pye: 7.8, GI: 7.1, CNS: 5.6, BAC: 3.8, BJ: 3.4, IA: 4.1, Other: 12.0
          },
          {
            category: 'Tamale TH',
            Pneu: 18.5, SEPSIS: 15.8, Cys: 12.4, SST: 9.6, Pye: 8.4, GI: 6.8, CNS: 5.2, BAC: 4.2, BJ: 3.7, IA: 3.8, Other: 11.6
          }
        ];
      
      default:
        return [];
    }
  };

  const viewByOptions = [
    { value: 'region', label: 'by Region' },
    { value: 'ward', label: 'by Ward' },
    { value: 'sex', label: 'by Sex' },
    { value: 'ageGroup', label: 'by Age Group' },
    { value: 'hospital', label: 'by Hospital' }
  ];

  const data = getViewByData();
  
  // Get all unique diagnosis categories from data for consistent rendering
  const allDiagnosisCategories = ['Pneu', 'SEPSIS', 'Cys', 'SST', 'Pye', 'GI', 'CNS', 'BAC', 'BJ', 'IA', 'Other'];

  // Diagnosis full names mapping
  const diagnosisFullNames = {
    'Pneu': 'Pneumonia',
    'SEPSIS': 'Sepsis',
    'Cys': 'Lower UTI (Cystitis)',
    'SST': 'Skin & Soft Tissue Infection',
    'Pye': 'Upper UTI (Pyelonephritis)',
    'GI': 'Gastrointestinal Infection',
    'CNS': 'CNS Infection',
    'BAC': 'Bacteremia/Fungemia',
    'BJ': 'Bone & Joint Infection',
    'IA': 'Intra-abdominal Sepsis',
    'Other': 'Other Diagnoses'
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg font-medium">
              Diagnosis Profile of Antimicrobial Use in Ghana
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
              console.log('Download Diagnosis ViewBy chart data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Share of Systemic Antibacterial (J01) Use by Diagnosis Type {viewByOptions.find(o => o.value === viewBy)?.label}
        </p>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Diagnosis Data:</h3>
            
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
                disabled={!regionFilterType}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder={regionFilterType ? "Select value..." : "Select type first"} />
                </SelectTrigger>
                <SelectContent>
                  {getFilterValueOptions?.(regionFilterType)?.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
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
        {/* Chart Area */}
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
              barCategoryGap="10%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                angle={viewBy === 'hospital' ? -45 : 0}
                textAnchor={viewBy === 'hospital' ? 'end' : 'middle'}
                height={viewBy === 'hospital' ? 80 : 60}
                label={{ 
                  value: (() => {
                    switch (viewBy) {
                      case 'region': return 'Region';
                      case 'ward': return 'Ward/Unit';
                      case 'sex': return 'Sex';
                      case 'ageGroup': return 'Age Group';
                      case 'hospital': return 'Hospital';
                      default: return 'Category';
                    }
                  })(),
                  position: 'insideBottom',
                  offset: 0,
                  style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => `${value}%`}
                label={{ 
                  value: 'Share of Prescriptions (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                }}
              />
              <Tooltip 
                shared={false}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length > 0) {
                    const hoveredSegment = payload[0];
                    
                    if (hoveredSegment && hoveredSegment.value > 0) {
                      const diagnosisCategory = hoveredSegment.dataKey;
                      const percentage = hoveredSegment.value.toFixed(1);
                      const color = DIAGNOSIS_COLORS[diagnosisCategory as keyof typeof DIAGNOSIS_COLORS];
                      const fullName = diagnosisFullNames[diagnosisCategory as keyof typeof diagnosisFullNames];
                      
                      // Calculate estimated prescription count
                      const estimatedPrescriptions = Math.round((hoveredSegment.value * 252) / 10);
                      
                      return (
                        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[280px]">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: color || "#6b7280" }}
                            />
                            <div className="font-medium text-sm text-gray-900">
                              {diagnosisCategory} - {fullName}
                            </div>
                          </div>
                          <div className="text-gray-600 text-sm mb-1">
                            {estimatedPrescriptions.toLocaleString()} prescriptions
                          </div>
                          <div className="font-medium text-sm" style={{ color: color || "#6b7280" }}>
                            {percentage}% of {label} total
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                }}
              />
              
              {/* Render bars for each diagnosis category */}
              {allDiagnosisCategories.map((diagnosisCategory) => (
                <Bar
                  key={diagnosisCategory}
                  dataKey={diagnosisCategory}
                  stackId="diagnosis"
                  fill={DIAGNOSIS_COLORS[diagnosisCategory as keyof typeof DIAGNOSIS_COLORS] || "#6b7280"}
                  cursor="pointer"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - Single Row */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4 text-left">Diagnosis Types</h3>
          <div className="grid grid-cols-5 gap-4">
            {allDiagnosisCategories.map((diagnosisCategory) => {
              const color = DIAGNOSIS_COLORS[diagnosisCategory as keyof typeof DIAGNOSIS_COLORS];
              const fullName = diagnosisFullNames[diagnosisCategory as keyof typeof diagnosisFullNames];
              
              return (
                <div key={diagnosisCategory} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: color || "#6b7280" }}
                  ></div>
                  <span className="text-gray-700 text-sm">
                    {fullName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footnote */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            PPS data; excludes topical antibacterials and anti-TB drugs. Bars show 100% stacked distribution.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}