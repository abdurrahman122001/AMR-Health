import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { Download, ChevronDown, Check } from 'lucide-react';
import { cn } from './ui/utils';

// Mock data for sex-based resistance patterns
const sexResistanceData = [
  {
    pathogen: 'E. coli',
    maleResistance: 36.8,
    femaleResistance: 34.2,
    maleIsolates: 2847,
    femaleIsolates: 3156,
    genderGap: 2.6
  },
  {
    pathogen: 'Klebsiella pneumoniae',
    maleResistance: 41.2,
    femaleResistance: 38.7,
    maleIsolates: 1923,
    femaleIsolates: 2034,
    genderGap: 2.5
  },
  {
    pathogen: 'Staphylococcus aureus',
    maleResistance: 29.4,
    femaleResistance: 26.8,
    maleIsolates: 1675,
    femaleIsolates: 1542,
    genderGap: 2.6
  },
  {
    pathogen: 'Pseudomonas aeruginosa',
    maleResistance: 38.9,
    femaleResistance: 35.1,
    maleIsolates: 987,
    femaleIsolates: 834,
    genderGap: 3.8
  },
  {
    pathogen: 'Acinetobacter baumanii',
    maleResistance: 48.7,
    femaleResistance: 45.3,
    maleIsolates: 654,
    femaleIsolates: 578,
    genderGap: 3.4
  }
];

// Overall sex distribution data for pie chart
const sexDistributionData = [
  { name: 'Male', value: 12847, color: '#3b82f6' },
  { name: 'Female', value: 12365, color: '#ec4899' }
];

// Filter configurations
const filterConfigs = {
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
  facility: {
    label: 'Facility',
    options: [
      { value: 'korle-bu', label: 'Korle Bu Teaching Hospital' },
      { value: 'komfo-anokye', label: 'Komfo Anokye Teaching Hospital' },
      { value: 'cape-coast', label: 'Cape Coast Teaching Hospital' },
      { value: 'tamale', label: 'Tamale Teaching Hospital' }
    ]
  },
  ward: {
    label: 'Ward/Unit',
    options: [
      { value: 'icu', label: 'Intensive Care Unit' },
      { value: 'medical', label: 'Medical Ward' },
      { value: 'surgical', label: 'Surgical Ward' },
      { value: 'pediatric', label: 'Pediatric Ward' }
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

export function AMR_Human_Demographic_SexChart() {
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

  // Prepare data for grouped bar chart
  const chartData = sexResistanceData.map(item => ({
    pathogen: item.pathogen.replace(/^([A-Z])\w+\s/, '$1. '), // Abbreviate genus
    Male: item.maleResistance,
    Female: item.femaleResistance,
    genderGap: item.genderGap
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Sex-Based Resistance Comparison</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log('Download sex resistance data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Gender-based antimicrobial resistance patterns • Comparative analysis across key pathogens
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
            <h3 className="font-semibold text-gray-900 text-sm">Filter Sex Data:</h3>
            
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

        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grouped Bar Chart */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900">Resistance Rates by Pathogen and Sex</h3>
              <p className="text-xs text-gray-600">Comparative resistance percentages</p>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 50, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="pathogen" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
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
                      style: { textAnchor: 'middle', fill: '#374151', fontSize: '11px' }
                    }}
                    domain={[0, 60]}
                    fontSize={10}
                    tick={{ fill: '#374151' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = sexResistanceData.find(item => 
                          item.pathogen.replace(/^([A-Z])\w+\s/, '$1. ') === label
                        );
                        if (data) {
                          return (
                            <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
                              <p className="font-semibold text-gray-900 mb-2 italic">{data.pathogen}</p>
                              <div className="space-y-1 text-sm">
                                <p>Male: <span className="font-semibold text-blue-600">{data.maleResistance}%</span> 
                                   ({data.maleIsolates.toLocaleString()} isolates)</p>
                                <p>Female: <span className="font-semibold text-pink-600">{data.femaleResistance}%</span> 
                                   ({data.femaleIsolates.toLocaleString()} isolates)</p>
                                <p className="pt-1 border-t text-xs text-gray-600">
                                   Gender gap: {data.genderGap}%
                                </p>
                              </div>
                            </div>
                          );
                        }
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Male" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Female" fill="#ec4899" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sex Distribution Pie Chart */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900">Isolate Distribution by Sex</h3>
              <p className="text-xs text-gray-600">Overall sample composition</p>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sexDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={100}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {sexDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const total = sexDistributionData.reduce((sum, item) => sum + item.value, 0);
                        const percentage = ((data.value / total) * 100).toFixed(1);
                        return (
                          <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                            <p className="font-semibold text-gray-900">{data.name}</p>
                            <p className="text-sm text-gray-600">
                              {data.value.toLocaleString()} isolates ({percentage}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-2">
                {sexDistributionData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-xs text-gray-700">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xl font-bold text-blue-700">
              {(sexResistanceData.reduce((sum, item) => sum + item.genderGap, 0) / sexResistanceData.length).toFixed(1)}%
            </div>
            <div className="text-sm text-blue-600">Average gender gap</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-xl font-bold text-purple-700">
              {Math.max(...sexResistanceData.map(item => item.genderGap)).toFixed(1)}%
            </div>
            <div className="text-sm text-purple-600">Largest gender gap</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xl font-bold text-green-700">
              {sexResistanceData.filter(item => item.maleResistance > item.femaleResistance).length}
            </div>
            <div className="text-sm text-green-600">Male-predominant</div>
          </div>
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
            <div className="text-xl font-bold text-pink-700">
              {sexResistanceData.filter(item => item.femaleResistance > item.maleResistance).length}
            </div>
            <div className="text-sm text-pink-600">Female-predominant</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 m-[0px]">
          <p className="text-xs text-gray-500">
            Sex-based antimicrobial resistance surveillance • Gender-specific resistance patterns and demographic analysis
            {activeFilters.length > 0 && ` • Filtered view applied`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}