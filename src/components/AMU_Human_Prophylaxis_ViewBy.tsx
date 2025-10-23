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

interface AMU_Human_Prophylaxis_ViewByProps {
  regionFilterType?: string;
  setRegionFilterType?: (value: string) => void;
  regionFilterValue?: string;
  setRegionFilterValue?: (value: string) => void;
  regionActiveFilters?: ActiveFilter[];
  regionFilterHelpers?: FilterHelpers;
  filterTypeOptions?: FilterOption[];
  getFilterValueOptions?: (type: string) => FilterOption[];
}

export function AMU_Human_Prophylaxis_ViewBy({
  regionFilterType = '',
  setRegionFilterType = () => {},
  regionFilterValue = '',
  setRegionFilterValue = () => {},
  regionActiveFilters = [],
  regionFilterHelpers = { addFilter: () => {}, removeFilter: () => {}, clearAllFilters: () => {} },
  filterTypeOptions = [],
  getFilterValueOptions = () => []
}: AMU_Human_Prophylaxis_ViewByProps) {
  const [viewBy, setViewBy] = useState('region');
  
  // Prophylaxis color definitions
  const PROPHYLAXIS_COLORS = {
    "Surgical Prophylaxis": "#16a34a", // green
    "Medical Prophylaxis": "#2563eb",  // blue
    "Other Prophylaxis": "#6b7280"     // gray
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
            'Surgical Prophylaxis': 64.8, 'Medical Prophylaxis': 33.1, 'Other Prophylaxis': 2.1
          },
          {
            category: 'ASR', 
            'Surgical Prophylaxis': 66.2, 'Medical Prophylaxis': 32.4, 'Other Prophylaxis': 1.4
          },
          {
            category: 'BAR',
            'Surgical Prophylaxis': 63.9, 'Medical Prophylaxis': 34.2, 'Other Prophylaxis': 1.9
          },
          {
            category: 'BER',
            'Surgical Prophylaxis': 67.1, 'Medical Prophylaxis': 31.8, 'Other Prophylaxis': 1.1
          },
          {
            category: 'BR',
            'Surgical Prophylaxis': 62.4, 'Medical Prophylaxis': 35.7, 'Other Prophylaxis': 1.9
          },
          {
            category: 'CR',
            'Surgical Prophylaxis': 65.7, 'Medical Prophylaxis': 32.9, 'Other Prophylaxis': 1.4
          },
          {
            category: 'ER',
            'Surgical Prophylaxis': 61.8, 'Medical Prophylaxis': 36.2, 'Other Prophylaxis': 2.0
          },
          { 
            category: 'GAR',
            'Surgical Prophylaxis': 68.4, 'Medical Prophylaxis': 30.1, 'Other Prophylaxis': 1.5
          },
          {
            category: 'NER',
            'Surgical Prophylaxis': 66.8, 'Medical Prophylaxis': 31.7, 'Other Prophylaxis': 1.5
          },
          {
            category: 'NR', 
            'Surgical Prophylaxis': 64.2, 'Medical Prophylaxis': 34.1, 'Other Prophylaxis': 1.7
          },
          {
            category: 'OR',
            'Surgical Prophylaxis': 65.9, 'Medical Prophylaxis': 32.6, 'Other Prophylaxis': 1.5
          },
          {
            category: 'UER',
            'Surgical Prophylaxis': 67.3, 'Medical Prophylaxis': 31.2, 'Other Prophylaxis': 1.5
          },
          {
            category: 'UWR',
            'Surgical Prophylaxis': 64.8, 'Medical Prophylaxis': 33.7, 'Other Prophylaxis': 1.5
          },
          {
            category: 'VR',
            'Surgical Prophylaxis': 63.1, 'Medical Prophylaxis': 35.4, 'Other Prophylaxis': 1.5
          },
          {
            category: 'WNR',
            'Surgical Prophylaxis': 62.7, 'Medical Prophylaxis': 35.8, 'Other Prophylaxis': 1.5
          },
          {
            category: 'WR',
            'Surgical Prophylaxis': 61.9, 'Medical Prophylaxis': 36.6, 'Other Prophylaxis': 1.5
          }
        ];
      
      case 'ward':
        return [
          {
            category: 'Medical Ward',
            'Surgical Prophylaxis': 45.2, 'Medical Prophylaxis': 52.3, 'Other Prophylaxis': 2.5
          },
          {
            category: 'Surgical Ward', 
            'Surgical Prophylaxis': 78.4, 'Medical Prophylaxis': 20.1, 'Other Prophylaxis': 1.5
          },
          {
            category: 'ICU',
            'Surgical Prophylaxis': 58.7, 'Medical Prophylaxis': 38.8, 'Other Prophylaxis': 2.5
          },
          {
            category: 'Pediatric Ward',
            'Surgical Prophylaxis': 52.1, 'Medical Prophylaxis': 46.4, 'Other Prophylaxis': 1.5
          },
          {
            category: 'Emergency Dept',
            'Surgical Prophylaxis': 48.9, 'Medical Prophylaxis': 49.6, 'Other Prophylaxis': 1.5
          }
        ];
      
      case 'sex':
        return [
          {
            category: 'Female',
            'Surgical Prophylaxis': 67.8, 'Medical Prophylaxis': 30.7, 'Other Prophylaxis': 1.5
          },
          {
            category: 'Male',
            'Surgical Prophylaxis': 62.9, 'Medical Prophylaxis': 35.6, 'Other Prophylaxis': 1.5
          },
          {
            category: 'Unknown',
            'Surgical Prophylaxis': 60.2, 'Medical Prophylaxis': 37.8, 'Other Prophylaxis': 2.0
          }
        ];
      
      case 'ageGroup':
        return [
          {
            category: 'Neonates',
            'Surgical Prophylaxis': 58.4, 'Medical Prophylaxis': 40.1, 'Other Prophylaxis': 1.5
          },
          {
            category: 'Under 5',
            'Surgical Prophylaxis': 61.2, 'Medical Prophylaxis': 37.3, 'Other Prophylaxis': 1.5
          },
          {
            category: '15-64',
            'Surgical Prophylaxis': 67.8, 'Medical Prophylaxis': 30.7, 'Other Prophylaxis': 1.5
          },
          {
            category: '65+',
            'Surgical Prophylaxis': 63.7, 'Medical Prophylaxis': 34.8, 'Other Prophylaxis': 1.5
          }
        ];

      case 'hospital':
        return [
          {
            category: 'Komfo Anokye TH',
            'Surgical Prophylaxis': 66.8, 'Medical Prophylaxis': 31.7, 'Other Prophylaxis': 1.5
          },
          {
            category: 'Korle-Bu TH',
            'Surgical Prophylaxis': 68.4, 'Medical Prophylaxis': 30.1, 'Other Prophylaxis': 1.5
          },
          {
            category: 'Cape Coast TH',
            'Surgical Prophylaxis': 64.2, 'Medical Prophylaxis': 34.3, 'Other Prophylaxis': 1.5
          },
          {
            category: 'Ho TH',
            'Surgical Prophylaxis': 62.7, 'Medical Prophylaxis': 35.8, 'Other Prophylaxis': 1.5
          },
          {
            category: 'Tamale TH',
            'Surgical Prophylaxis': 65.9, 'Medical Prophylaxis': 32.6, 'Other Prophylaxis': 1.5
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
  
  // Get all unique prophylaxis categories from data for consistent rendering
  const allProphylaxisCategories = ['Surgical Prophylaxis', 'Medical Prophylaxis', 'Other Prophylaxis'];

  // Prophylaxis full names mapping
  const prophylaxisFullNames = {
    'Surgical Prophylaxis': 'Surgical Prophylaxis (SP)',
    'Medical Prophylaxis': 'Medical Prophylaxis (MP)',
    'Other Prophylaxis': 'Other Prophylaxis Types'
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg font-medium">
              Prophylaxis Profile of Antimicrobial Use in Ghana
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
              console.log('Download Prophylaxis ViewBy chart data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Share of Systemic Antibacterial (J01) Prophylaxis Use by Type {viewByOptions.find(o => o.value === viewBy)?.label}
        </p>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Prophylaxis Data:</h3>
            
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
        <div className="w-full h-96 m-[0px]">
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
                  offset: 10,
                  style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => `${value}%`}
                label={{ 
                  value: 'Share of Prophylaxis Prescriptions (%)', 
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
                      const prophylaxisCategory = hoveredSegment.dataKey;
                      const percentage = hoveredSegment.value.toFixed(1);
                      const color = PROPHYLAXIS_COLORS[prophylaxisCategory as keyof typeof PROPHYLAXIS_COLORS];
                      const fullName = prophylaxisFullNames[prophylaxisCategory as keyof typeof prophylaxisFullNames];
                      
                      // Calculate estimated prescription count
                      const estimatedPrescriptions = Math.round((hoveredSegment.value * 77) / 10); // Scaled for prophylaxis
                      
                      return (
                        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[280px]">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: color || "#6b7280" }}
                            />
                            <div className="font-medium text-sm text-gray-900">
                              {fullName}
                            </div>
                          </div>
                          <div className="text-gray-900 font-medium text-sm mb-1">
                            {prophylaxisCategory === 'Surgical Prophylaxis' && 'Prevention of post-operative infections'}
                            {prophylaxisCategory === 'Medical Prophylaxis' && 'Prevention in high-risk medical patients'}
                            {prophylaxisCategory === 'Other Prophylaxis' && 'Other prophylactic applications'}
                          </div>
                          <div className="text-gray-600 text-sm mb-1">
                            {estimatedPrescriptions.toLocaleString()} prescriptions
                          </div>
                          <div className="font-medium text-sm" style={{ color: color || "#6b7280" }}>
                            {percentage}% of {label} prophylaxis
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                }}
              />
              
              {/* Render bars for each prophylaxis category */}
              {allProphylaxisCategories.map((prophylaxisCategory) => (
                <Bar
                  key={prophylaxisCategory}
                  dataKey={prophylaxisCategory}
                  stackId="prophylaxis"
                  fill={PROPHYLAXIS_COLORS[prophylaxisCategory as keyof typeof PROPHYLAXIS_COLORS] || "#6b7280"}
                  cursor="pointer"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - Single Row */}
        <div className="p-[0px]">
          <div className="flex items-center justify-between flex-wrap mx-[100px] my-[0px]">
            {allProphylaxisCategories.map((prophylaxisCategory) => {
              const color = PROPHYLAXIS_COLORS[prophylaxisCategory as keyof typeof PROPHYLAXIS_COLORS];
              const fullName = prophylaxisFullNames[prophylaxisCategory as keyof typeof prophylaxisFullNames];
              
              return (
                <div key={prophylaxisCategory} className="flex items-center gap-2">
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