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

interface AMU_Human_Indication_ViewByProps {
  regionFilterType?: string;
  setRegionFilterType?: (value: string) => void;
  regionFilterValue?: string;
  setRegionFilterValue?: (value: string) => void;
  regionActiveFilters?: ActiveFilter[];
  regionFilterHelpers?: FilterHelpers;
  filterTypeOptions?: FilterOption[];
  getFilterValueOptions?: (type: string) => FilterOption[];
}

export function AMU_Human_Indication_ViewBy({
  regionFilterType = '',
  setRegionFilterType = () => {},
  regionFilterValue = '',
  setRegionFilterValue = () => {},
  regionActiveFilters = [],
  regionFilterHelpers = { addFilter: () => {}, removeFilter: () => {}, clearAllFilters: () => {} },
  filterTypeOptions = [],
  getFilterValueOptions = () => []
}: AMU_Human_Indication_ViewByProps) {
  const [viewBy, setViewBy] = useState('region');
  
  // Indication color definitions
  const INDICATION_COLORS = {
    "CAI": "#3b82f6", // blue - Community-Acquired Infections
    "HAI": "#dc2626", // red - Hospital-Acquired Infections
    "SP": "#059669",  // green - Surgical Prophylaxis
    "MP": "#7c3aed",  // purple - Medical Prophylaxis
    "Other": "#6b7280" // gray - Other
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
            CAI: 42.5, HAI: 28.3, SP: 21.8, MP: 5.1, Other: 2.3
          },
          {
            category: 'ASR', 
            CAI: 44.1, HAI: 26.8, SP: 22.4, MP: 4.9, Other: 1.8
          },
          {
            category: 'BAR',
            CAI: 41.9, HAI: 29.1, SP: 21.3, MP: 5.4, Other: 2.3
          },
          {
            category: 'BER',
            CAI: 45.2, HAI: 25.7, SP: 23.1, MP: 4.6, Other: 1.4
          },
          {
            category: 'BR',
            CAI: 40.8, HAI: 30.4, SP: 20.9, MP: 5.7, Other: 2.2
          },
          {
            category: 'CR',
            CAI: 43.6, HAI: 27.2, SP: 22.7, MP: 4.8, Other: 1.7
          },
          {
            category: 'ER',
            CAI: 39.7, HAI: 31.8, SP: 20.1, MP: 5.9, Other: 2.5
          },
          { 
            category: 'GAR',
            CAI: 46.3, HAI: 24.1, SP: 24.2, MP: 4.2, Other: 1.2
          },
          {
            category: 'NER',
            CAI: 44.8, HAI: 26.2, SP: 23.5, MP: 4.5, Other: 1.0
          },
          {
            category: 'NR', 
            CAI: 42.1, HAI: 28.9, SP: 21.9, MP: 5.2, Other: 1.9
          },
          {
            category: 'OR',
            CAI: 43.9, HAI: 27.5, SP: 22.3, MP: 4.7, Other: 1.6
          },
          {
            category: 'UER',
            CAI: 45.1, HAI: 25.8, SP: 23.6, MP: 4.3, Other: 1.2
          },
          {
            category: 'UWR',
            CAI: 42.7, HAI: 28.1, SP: 22.1, MP: 5.0, Other: 2.1
          },
          {
            category: 'VR',
            CAI: 41.3, HAI: 29.7, SP: 21.4, MP: 5.3, Other: 2.3
          },
          {
            category: 'WNR',
            CAI: 40.2, HAI: 31.1, SP: 20.6, MP: 5.8, Other: 2.3
          },
          {
            category: 'WR',
            CAI: 39.8, HAI: 31.5, SP: 20.3, MP: 5.9, Other: 2.5
          }
        ];
      
      case 'ward':
        return [
          {
            category: 'Medical Ward',
            CAI: 48.7, HAI: 31.2, SP: 12.8, MP: 5.1, Other: 2.2
          },
          {
            category: 'Surgical Ward', 
            CAI: 31.4, HAI: 18.9, SP: 42.1, MP: 5.8, Other: 1.8
          },
          {
            category: 'ICU',
            CAI: 28.5, HAI: 52.3, SP: 8.7, MP: 7.2, Other: 3.3
          },
          {
            category: 'Pediatric Ward',
            CAI: 58.2, HAI: 22.1, SP: 15.4, MP: 3.1, Other: 1.2
          },
          {
            category: 'Emergency Dept',
            CAI: 52.8, HAI: 28.7, SP: 11.2, MP: 4.9, Other: 2.4
          }
        ];
      
      case 'sex':
        return [
          {
            category: 'Female',
            CAI: 43.8, HAI: 26.7, SP: 23.1, MP: 4.8, Other: 1.6
          },
          {
            category: 'Male',
            CAI: 42.1, HAI: 28.9, SP: 21.9, MP: 5.2, Other: 1.9
          },
          {
            category: 'Unknown',
            CAI: 40.5, HAI: 30.8, SP: 20.4, MP: 5.7, Other: 2.6
          }
        ];
      
      case 'ageGroup':
        return [
          {
            category: 'Neonates',
            CAI: 51.4, HAI: 31.1, SP: 12.8, MP: 3.2, Other: 1.5
          },
          {
            category: 'Under 5',
            CAI: 54.2, HAI: 26.3, SP: 15.1, MP: 3.1, Other: 1.3
          },
          {
            category: '15-64',
            CAI: 40.8, HAI: 28.2, SP: 23.2, MP: 5.4, Other: 2.4
          },
          {
            category: '65+',
            CAI: 38.7, HAI: 32.3, SP: 19.8, MP: 6.2, Other: 3.0
          }
        ];

      case 'hospital':
        return [
          {
            category: 'Komfo Anokye TH',
            CAI: 41.8, HAI: 29.2, SP: 22.1, MP: 5.1, Other: 1.8
          },
          {
            category: 'Korle-Bu TH',
            CAI: 44.3, HAI: 26.7, SP: 23.4, MP: 4.2, Other: 1.4
          },
          {
            category: 'Cape Coast TH',
            CAI: 42.9, HAI: 28.1, SP: 21.8, MP: 5.3, Other: 1.9
          },
          {
            category: 'Ho TH',
            CAI: 40.2, HAI: 31.5, SP: 20.3, MP: 5.9, Other: 2.1
          },
          {
            category: 'Tamale TH',
            CAI: 43.7, HAI: 27.8, SP: 22.3, MP: 4.7, Other: 1.5
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
  
  // Get all unique indication categories from data for consistent rendering
  const allIndicationCategories = ['CAI', 'HAI', 'SP', 'MP', 'Other'];

  // Indication full names mapping
  const indicationFullNames = {
    'CAI': 'Community-Acquired Infections',
    'HAI': 'Hospital-Acquired Infections',
    'SP': 'Surgical Prophylaxis',
    'MP': 'Medical Prophylaxis',
    'Other': 'Other Indications'
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg font-medium">
              Indication Profile of Antimicrobial Use in Ghana
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
              console.log('Download Indication ViewBy chart data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Share of Systemic Antibacterial (J01) Use by Indication Type {viewByOptions.find(o => o.value === viewBy)?.label}
        </p>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Indication Data:</h3>
            
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
                      const indicationCategory = hoveredSegment.dataKey;
                      const percentage = hoveredSegment.value.toFixed(1);
                      const color = INDICATION_COLORS[indicationCategory as keyof typeof INDICATION_COLORS];
                      const fullName = indicationFullNames[indicationCategory as keyof typeof indicationFullNames];
                      
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
                              {indicationCategory} - {fullName}
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
              
              {/* Render bars for each indication category */}
              {allIndicationCategories.map((indicationCategory) => (
                <Bar
                  key={indicationCategory}
                  dataKey={indicationCategory}
                  stackId="indication"
                  fill={INDICATION_COLORS[indicationCategory as keyof typeof INDICATION_COLORS] || "#6b7280"}
                  cursor="pointer"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - Single Row */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4 text-left">Indication Types</h3>
          <div className="flex items-center gap-8 flex-wrap">
            {allIndicationCategories.map((indicationCategory) => {
              const color = INDICATION_COLORS[indicationCategory as keyof typeof INDICATION_COLORS];
              const fullName = indicationFullNames[indicationCategory as keyof typeof indicationFullNames];
              
              return (
                <div key={indicationCategory} className="flex items-center gap-2">
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