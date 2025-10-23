import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Download, ChevronDown, Check } from 'lucide-react';
import { cn } from './ui/utils';

// Mock data for age-stratified resistance
const ageResistanceData = [
  {
    ageGroup: 'Neonate (0-28d)',
    overallResistance: 28.4,
    resistantIsolates: 1156,
    totalIsolates: 4067,
    keyPathogens: {
      'E. coli': 32.1,
      'Klebsiella': 26.8,
      'Staph. aureus': 24.2
    }
  },
  {
    ageGroup: 'Infant (29d-1y)',
    overallResistance: 22.7,
    resistantIsolates: 987,
    totalIsolates: 4348,
    keyPathogens: {
      'E. coli': 25.4,
      'Klebsiella': 21.3,
      'Staph. aureus': 20.8
    }
  },
  {
    ageGroup: 'Child (1-14y)',
    overallResistance: 18.7,
    resistantIsolates: 743,
    totalIsolates: 3974,
    keyPathogens: {
      'E. coli': 20.1,
      'Klebsiella': 18.2,
      'Staph. aureus': 17.8
    }
  },
  {
    ageGroup: 'Adult (15-64y)',
    overallResistance: 35.2,
    resistantIsolates: 3847,
    totalIsolates: 10932,
    keyPathogens: {
      'E. coli': 38.7,
      'Klebsiella': 34.1,
      'Staph. aureus': 32.8
    }
  },
  {
    ageGroup: 'Elderly (65+y)',
    overallResistance: 42.3,
    resistantIsolates: 892,
    totalIsolates: 2109,
    keyPathogens: {
      'E. coli': 46.2,
      'Klebsiella': 41.7,
      'Staph. aureus': 38.9
    }
  }
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

export function AMR_Human_Demographic_AgeChart() {
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
          <CardTitle className="text-lg font-medium">Age-Stratified Resistance Patterns</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log('Download age resistance data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Antimicrobial resistance prevalence across age demographics • Population-based surveillance patterns
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
            <h3 className="font-semibold text-gray-900 text-sm">Filter Age Data:</h3>
            
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

        {/* Color-Coded Risk Level Legend */}
        <div className="flex items-center gap-8 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16a34a' }}></div>
            <span className="text-sm">Low Resistance (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
            <span className="text-sm">Moderate Resistance (20-39%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
            <span className="text-sm">High Resistance (&ge;40%)</span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-[400px] px-[0px] py-[16px] p-[0px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ageResistanceData}
              margin={{ top: 10, right: 20, left: 50, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="ageGroup" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                fontSize={11}
                tick={{ fontSize: 11, fill: '#374151' }}
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
                    const riskLevel = data.overallResistance < 20 ? 'Low risk' : 
                                    data.overallResistance < 40 ? 'Moderate risk' : 'High risk';
                    const riskColor = getResistanceAlertColor(data.overallResistance);
                    return (
                      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
                        <p className="font-semibold text-gray-900 mb-1">{data.ageGroup}</p>
                        <p className="text-sm text-gray-900 mb-2">
                          <span className="font-semibold" style={{ color: riskColor }}>
                            {data.overallResistance}%
                          </span> resistance rate 
                          <span style={{ color: riskColor }}> ({riskLevel})</span>
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                          {data.resistantIsolates.toLocaleString()} resistant / {data.totalIsolates.toLocaleString()} total isolates
                        </p>
                        <div className="text-xs text-gray-600">
                          <p className="font-medium mb-1">Key pathogens:</p>
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
                dataKey="overallResistance" 
                radius={[2, 2, 0, 0]}
                stroke="none"
              >
                {ageResistanceData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getResistanceAlertColor(entry.overallResistance)}
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
              {ageResistanceData.reduce((sum, group) => sum + group.totalIsolates, 0).toLocaleString()}
            </div>
            <div className="text-sm text-blue-600">Total isolates</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-xl font-bold text-red-700">
              {ageResistanceData.filter(group => group.overallResistance >= 40).length}
            </div>
            <div className="text-sm text-red-600">High-risk age groups</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-xl font-bold text-yellow-700">
              {((ageResistanceData.find(g => g.ageGroup.includes('Elderly'))?.overallResistance || 0) - 
                (ageResistanceData.find(g => g.ageGroup.includes('Child'))?.overallResistance || 0)).toFixed(1)}%
            </div>
            <div className="text-sm text-yellow-600">Age resistance gap</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xl font-bold text-green-700">
              {(ageResistanceData.reduce((sum, group) => sum + group.overallResistance, 0) / ageResistanceData.length).toFixed(1)}%
            </div>
            <div className="text-sm text-green-600">Average resistance</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 m-[0px]">
          <p className="text-xs text-gray-500">
            Age-stratified antimicrobial resistance surveillance • Demographic analysis of resistance patterns across life stages
            {activeFilters.length > 0 && ` • Filtered view applied`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}