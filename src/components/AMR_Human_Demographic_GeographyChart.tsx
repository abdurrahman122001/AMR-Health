import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Download, ChevronDown, Check } from 'lucide-react';
import { cn } from './ui/utils';

// Mock data for regional resistance patterns
const regionalResistanceData = [
  {
    region: 'Greater Accra',
    resistanceRate: 45.8,
    isolates: 8742,
    hospitals: 4,
    urbanType: 'Urban',
    keyPathogens: {
      'E. coli': 48.2,
      'Klebsiella': 44.7,
      'Staph. aureus': 43.1
    }
  },
  {
    region: 'Ashanti',
    resistanceRate: 38.4,
    isolates: 6234,
    hospitals: 3,
    urbanType: 'Urban',
    keyPathogens: {
      'E. coli': 41.3,
      'Klebsiella': 37.8,
      'Staph. aureus': 36.1
    }
  },
  {
    region: 'Western',
    resistanceRate: 31.7,
    isolates: 2987,
    hospitals: 2,
    urbanType: 'Mixed',
    keyPathogens: {
      'E. coli': 34.2,
      'Klebsiella': 30.8,
      'Staph. aureus': 29.1
    }
  },
  {
    region: 'Central',
    resistanceRate: 29.3,
    isolates: 2456,
    hospitals: 2,
    urbanType: 'Mixed',
    keyPathogens: {
      'E. coli': 32.1,
      'Klebsiella': 28.7,
      'Staph. aureus': 27.0
    }
  },
  {
    region: 'Northern',
    resistanceRate: 26.8,
    isolates: 1894,
    hospitals: 1,
    urbanType: 'Rural',
    keyPathogens: {
      'E. coli': 29.4,
      'Klebsiella': 26.1,
      'Staph. aureus': 24.8
    }
  },
  {
    region: 'Volta',
    resistanceRate: 25.4,
    isolates: 1567,
    hospitals: 1,
    urbanType: 'Rural',
    keyPathogens: {
      'E. coli': 28.2,
      'Klebsiella': 24.8,
      'Staph. aureus': 23.2
    }
  },
  {
    region: 'Eastern',
    resistanceRate: 24.9,
    isolates: 1432,
    hospitals: 1,
    urbanType: 'Rural',
    keyPathogens: {
      'E. coli': 27.8,
      'Klebsiella': 24.3,
      'Staph. aureus': 22.6
    }
  },
  {
    region: 'Brong Ahafo',
    resistanceRate: 23.6,
    isolates: 1298,
    hospitals: 1,
    urbanType: 'Rural',
    keyPathogens: {
      'E. coli': 26.4,
      'Klebsiella': 23.1,
      'Staph. aureus': 21.3
    }
  },
  {
    region: 'Upper West',
    resistanceRate: 22.7,
    isolates: 987,
    hospitals: 1,
    urbanType: 'Rural',
    keyPathogens: {
      'E. coli': 25.8,
      'Klebsiella': 22.4,
      'Staph. aureus': 19.9
    }
  },
  {
    region: 'Upper East',
    resistanceRate: 22.4,
    isolates: 834,
    hospitals: 1,
    urbanType: 'Rural',
    keyPathogens: {
      'E. coli': 25.1,
      'Klebsiella': 21.8,
      'Staph. aureus': 20.3
    }
  }
];

// Filter configurations
const filterConfigs = {
  urbanType: {
    label: 'Urban Type',
    options: [
      { value: 'urban', label: 'Urban' },
      { value: 'mixed', label: 'Mixed Urban/Rural' },
      { value: 'rural', label: 'Rural' }
    ]
  },
  pathogen: {
    label: 'Pathogen',
    options: [
      { value: 'ecoli', label: 'E. coli' },
      { value: 'klebsiella', label: 'Klebsiella pneumoniae' },
      { value: 'staph_aureus', label: 'Staphylococcus aureus' },
      { value: 'pseudomonas', label: 'Pseudomonas aeruginosa' },
      { value: 'acinetobacter', label: 'Acinetobacter baumanii' }
    ]
  },
  hospitalCount: {
    label: 'Hospital Count',
    options: [
      { value: '1', label: 'Single hospital' },
      { value: '2', label: 'Two hospitals' },
      { value: '3+', label: 'Three or more hospitals' }
    ]
  }
};

// Filter interface
interface Filter {
  type: string;
  value: string;
  label: string;
}

// Get resistance alert color
const getResistanceAlertColor = (rate: number): string => {
  if (rate < 20) return '#16a34a'; // Green
  if (rate < 40) return '#eab308'; // Yellow
  return '#dc2626'; // Red
};

// Get urban type color
const getUrbanTypeColor = (urbanType: string): string => {
  switch (urbanType) {
    case 'Urban': return '#3b82f6'; // Blue
    case 'Mixed': return '#8b5cf6'; // Purple
    case 'Rural': return '#10b981'; // Green
    default: return '#6b7280'; // Gray
  }
};

export function AMR_Human_Demographic_GeographyChart() {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);

  // Filter helper functions
  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeConfig = filterConfigs[filterType as keyof typeof filterConfigs];
        const valueOption = typeConfig?.options.find(opt => opt.value === filterValue);
        
        if (typeConfig && valueOption) {
          const newFilter: Filter = {
            type: filterType,
            value: filterValue,
            label: `${typeConfig.label}: ${valueOption.label}`
          };
          
          const exists = activeFilters.some(f => f.type === filterType && f.value === filterValue);
          if (!exists) {
            setActiveFilters([...activeFilters, newFilter]);
          }
        }
        
        setFilterType("");
        setFilterValue("");
      }
    },
    
    removeFilter: (index: number) => {
      setActiveFilters(activeFilters.filter((_, i) => i !== index));
    },
    
    clearAllFilters: () => {
      setActiveFilters([]);
    }
  };

  const getFilterTypeOptions = () => {
    return Object.entries(filterConfigs).map(([key, config]) => ({
      value: key,
      label: config.label
    }));
  };

  const getFilterValueOptionsForType = (type: string) => {
    const config = filterConfigs[type as keyof typeof filterConfigs];
    return config?.options || [];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Regional Resistance Distribution</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log('Download regional resistance data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Geographic distribution of antimicrobial resistance across Ghana's regions • Urban-rural resistance patterns
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="mb-[20px] w-full">
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

        {/* Filter Controls */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Geographic Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={typeOpen}
                    className="w-full justify-between text-sm h-10"
                  >
                    {filterType
                      ? getFilterTypeOptions().find((option) => option.value === filterType)?.label
                      : "Select filter type..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search filter types..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No filter type found.</CommandEmpty>
                      <CommandGroup>
                        {getFilterTypeOptions().map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={(currentValue) => {
                              setFilterType(currentValue === filterType ? "" : currentValue);
                              setFilterValue("");
                              setTypeOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filterType === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <Popover open={valueOpen} onOpenChange={setValueOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={valueOpen}
                    disabled={!filterType}
                    className="w-full justify-between text-sm h-10"
                  >
                    {filterValue
                      ? getFilterValueOptionsForType(filterType).find((option) => option.value === filterValue)?.label
                      : filterType ? "Select value..." : "Select type first"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search values..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No value found.</CommandEmpty>
                      <CommandGroup>
                        {getFilterValueOptionsForType(filterType).map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={(currentValue) => {
                              setFilterValue(currentValue === filterValue ? "" : currentValue);
                              setValueOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filterValue === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Add Filter Button */}
            <button
              onClick={filterHelpers.addFilter}
              disabled={!filterType || !filterValue}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>

        {/* Urban Type Legend */}
        <div className="flex items-center gap-8 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-sm">Urban</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span className="text-sm">Mixed Urban/Rural</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-sm">Rural</span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-[500px] px-[0px] py-[16px] p-[0px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={regionalResistanceData}
              margin={{ top: 10, right: 20, left: 50, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="region" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                fontSize={10}
                tick={{ fontSize: 10, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                label={{ 
                  value: 'Resistance Rate (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#374151', fontSize: '12px' }
                }}
                domain={[0, 50]}
                fontSize={11}
                tick={{ fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const riskLevel = data.resistanceRate < 20 ? 'Low risk' : 
                                    data.resistanceRate < 40 ? 'Moderate risk' : 'High risk';
                    const riskColor = getResistanceAlertColor(data.resistanceRate);
                    return (
                      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
                        <p className="font-semibold text-gray-900 mb-1">{data.region} Region</p>
                        <p className="text-sm text-gray-900 mb-2">
                          <span className="font-semibold" style={{ color: riskColor }}>
                            {data.resistanceRate}%
                          </span> resistance rate 
                          <span style={{ color: riskColor }}> ({riskLevel})</span>
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          {data.isolates.toLocaleString()} isolates from {data.hospitals} hospital{data.hospitals > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                          Type: <span 
                            className="font-medium"
                            style={{ color: getUrbanTypeColor(data.urbanType) }}
                          >
                            {data.urbanType}
                          </span>
                        </p>
                        <div className="text-xs text-gray-600">
                          <p className="font-medium mb-1">Key pathogen rates:</p>
                          {Object.entries(data.keyPathogens).map(([pathogen, rate]) => (
                            <p key={pathogen}>{pathogen}: {rate}%</p>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="resistanceRate" 
                radius={[2, 2, 0, 0]}
                stroke="none"
              >
                {regionalResistanceData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getUrbanTypeColor(entry.urbanType)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xl font-bold text-blue-700">
              {(Math.max(...regionalResistanceData.map(r => r.resistanceRate)) - 
                Math.min(...regionalResistanceData.map(r => r.resistanceRate))).toFixed(1)}%
            </div>
            <div className="text-sm text-blue-600">Regional variation</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-xl font-bold text-red-700">
              {regionalResistanceData.filter(r => r.urbanType === 'Urban').length}
            </div>
            <div className="text-sm text-red-600">Urban regions</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xl font-bold text-green-700">
              {regionalResistanceData.filter(r => r.urbanType === 'Rural').length}
            </div>
            <div className="text-sm text-green-600">Rural regions</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-xl font-bold text-purple-700">
              {regionalResistanceData.reduce((sum, r) => sum + r.isolates, 0).toLocaleString()}
            </div>
            <div className="text-sm text-purple-600">Total isolates</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 m-[0px]">
          <p className="text-xs text-gray-500">
            Regional antimicrobial resistance surveillance • Geographic distribution and urban-rural resistance patterns across Ghana
            {activeFilters.length > 0 && ` • Filtered view applied`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}