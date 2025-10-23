import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, ChevronDown, Check } from 'lucide-react';
import { cn } from './ui/utils';
import { motion } from 'motion/react';

// Base resistance rate data by sex
const femaleResistanceData = [
  { name: 'Resistant', value: 30.9, color: '#dc2626' },
  { name: 'Susceptible', value: 69.1, color: '#16a34a' }
];

const maleResistanceData = [
  { name: 'Resistant', value: 34.2, color: '#dc2626' },
  { name: 'Susceptible', value: 65.8, color: '#16a34a' }
];

// Filter options
const filterTypeOptions = [
  { value: 'ageGroup', label: 'Age Group' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'region', label: 'Region' },
  { value: 'hospitalActivity', label: 'Hospital Activity' },
  { value: 'hospitalWard', label: 'Hospital Ward' },
  { value: 'specimenSource', label: 'Specimen Source' },
  { value: 'pathogen', label: 'Pathogen' },
  { value: 'year', label: 'Year' }
];

const ageGroups = ['Neonates', 'Under 5', '5-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65-74', '75-84', '85-94', '95+'];
const hospitals = ['Korle-Bu Teaching Hospital', 'Komfo Anokye Teaching Hospital', 'University of Ghana Hospital', 'Tamale Teaching Hospital', 'Cape Coast Teaching Hospital', 'Ho Teaching Hospital', 'Bolgatanga Regional Hospital', 'Sunyani Regional Hospital', 'Wa Regional Hospital', 'Eastern Regional Hospital', 'LEKMA Hospital'];
const regions = ['Greater Accra Region', 'Ashanti Region', 'Western Region', 'Central Region', 'Volta Region', 'Eastern Region', 'Northern Region', 'Upper East Region', 'Upper West Region', 'Brong-Ahafo Region'];
const hospitalActivities = ['Medical', 'Surgical', 'Intensive Care'];
const hospitalWards = ['Adult Medical Ward (AMW)', 'Adult Surgical Ward (ASW)', 'High-Risk Adult Ward (AHRW)', 'Adult Intensive Care Unit (AICU)', 'Paediatric Medical Ward (PMW)', 'Paediatric Surgical Ward (PSW)', 'High-Risk Paediatric Ward (PHRW)', 'Paediatric Intensive Care Unit (PICU)', 'Neonatal Medical Ward (NMW)', 'Neonatal Intensive Care Unit (NICU)', 'Mixed Ward (MXW)'];
const specimenSources = ['Blood', 'Urine', 'Respiratory', 'Wound/Abscess', 'CSF', 'Other sterile sites', 'Stool', 'Genital', 'Other non-sterile sites'];
const pathogens = ['Acinetobacter baumanii', 'E. coli', 'Klebsiella pneumoniae', 'Pseudomonas aeruginosa', 'Staphylococcus aureus', 'Enterococcus spp.', 'Streptococcus pneumoniae'];
const years = ['2024', '2023', '2022', '2021', '2020'];

// Animated Number Component
const AnimatedNumber = ({ value, label }: { value: number; label: string }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const duration = 800;
    const startTime = Date.now();

    const updateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-bold text-gray-900">
        {displayValue.toFixed(1)}%
      </div>
      <div className="text-sm text-gray-600 font-medium">
        {label}
      </div>
    </div>
  );
};

export function AMU_Human_Demograph_RSex() {
  // Filter states
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);
  
  // View by state
  const [viewBy, setViewBy] = useState('sex');

  // Get filter value options based on type
  const getFilterValueOptionsForType = (type: string) => {
    switch (type) {
      case 'ageGroup':
        return ageGroups.map(group => ({ value: group, label: group }));
      case 'hospital':
        return hospitals.map(hospital => ({ value: hospital, label: hospital }));
      case 'region':
        return regions.map(region => ({ value: region, label: region }));
      case 'hospitalActivity':
        return hospitalActivities.map(activity => ({ value: activity, label: activity }));
      case 'hospitalWard':
        return hospitalWards.map(ward => ({ value: ward, label: ward }));
      case 'specimenSource':
        return specimenSources.map(source => ({ value: source, label: source }));
      case 'pathogen':
        return pathogens.map(pathogen => ({ value: pathogen, label: pathogen }));
      case 'year':
        return years.map(year => ({ value: year, label: year }));
      default:
        return [];
    }
  };

  const getFilterTypeOptions = () => filterTypeOptions;

  // Filter helpers
  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeOption = getFilterTypeOptions().find(option => option.value === filterType);
        const valueOption = getFilterValueOptionsForType(filterType).find(option => option.value === filterValue);
        
        if (typeOption && valueOption) {
          const newFilter = {
            type: filterType,
            value: filterValue,
            label: `${typeOption.label}: ${valueOption.label}`
          };
          
          setActiveFilters(prev => [...prev, newFilter]);
          setFilterType('');
          setFilterValue('');
        }
      }
    },

    removeFilter: (index: number) => {
      setActiveFilters(prev => prev.filter((_, i) => i !== index));
    },

    clearAllFilters: () => {
      setActiveFilters([]);
    }
  };

  // Get filtered data based on active filters
  const getFilteredFemaleData = () => {
    let baseResistantRate = 30.9;
    
    // Conditional filtering logic based on specific combinations
    const ashantiFilter = activeFilters.find(f => f.type === 'region' && f.value === 'Ashanti Region');
    const lekmaFilter = activeFilters.find(f => f.type === 'hospital' && f.value === 'LEKMA Hospital');
    const neonatesFilter = activeFilters.find(f => f.type === 'ageGroup' && f.value === 'Neonates');
    const age35_44Filter = activeFilters.find(f => f.type === 'ageGroup' && f.value === '35-44');

    if (neonatesFilter) {
      baseResistantRate = 38.7; // Neonates have higher resistance for females
    } else if (lekmaFilter) {
      baseResistantRate = 27.4; // LEKMA Hospital for females
    } else if (ashantiFilter) {
      baseResistantRate = 33.2; // Ashanti Region for females
    } else if (age35_44Filter) {
      baseResistantRate = 28.7; // 35-44 years for females
    }

    return [
      { name: 'Resistant', value: baseResistantRate, color: '#dc2626' },
      { name: 'Susceptible', value: 100 - baseResistantRate, color: '#16a34a' }
    ];
  };

  const getFilteredMaleData = () => {
    let baseResistantRate = 34.2;
    
    // Conditional filtering logic based on specific combinations
    const ashantiFilter = activeFilters.find(f => f.type === 'region' && f.value === 'Ashanti Region');
    const lekmaFilter = activeFilters.find(f => f.type === 'hospital' && f.value === 'LEKMA Hospital');
    const neonatesFilter = activeFilters.find(f => f.type === 'ageGroup' && f.value === 'Neonates');
    const age35_44Filter = activeFilters.find(f => f.type === 'ageGroup' && f.value === '35-44');

    if (neonatesFilter) {
      baseResistantRate = 43.8; // Neonates have higher resistance for males
    } else if (lekmaFilter) {
      baseResistantRate = 31.9; // LEKMA Hospital for males
    } else if (ashantiFilter) {
      baseResistantRate = 37.1; // Ashanti Region for males
    } else if (age35_44Filter) {
      baseResistantRate = 32.3; // 35-44 years for males
    }

    return [
      { name: 'Resistant', value: baseResistantRate, color: '#dc2626' },
      { name: 'Susceptible', value: 100 - baseResistantRate, color: '#16a34a' }
    ];
  };

  // View by options
  const viewByOptions = [
    { value: 'sex', label: 'by Sex' },
    { value: 'ageGroup', label: 'by Age Group' },
    { value: 'region', label: 'by Region' },
    { value: 'hospital', label: 'by Hospital' },
    { value: 'hospitalWard', label: 'by Ward' },
    { value: 'pathogen', label: 'by Pathogen' },
    { value: 'specimenSource', label: 'by Specimen Source' }
  ];

  // Generate data based on selected category
  const getViewByData = () => {
    let baseData = [];
    
    switch (viewBy) {
      case 'sex':
        baseData = [
          { category: 'Female', resistance: 30.9 },
          { category: 'Male', resistance: 34.2 },
          { category: 'Unknown', resistance: 29.1 }
        ];
        break;
      case 'ageGroup':
        baseData = [
          { category: 'Neonates', resistance: 41.2 },
          { category: 'Under 5', resistance: 38.7 },
          { category: '5-14', resistance: 35.3 },
          { category: '15-24', resistance: 31.8 },
          { category: '25-34', resistance: 30.4 },
          { category: '35-44', resistance: 28.7 },
          { category: '45-54', resistance: 32.1 },
          { category: '55-64', resistance: 35.9 },
          { category: '65-74', resistance: 39.4 },
          { category: '75-84', resistance: 42.6 },
          { category: '85-94', resistance: 44.8 },
          { category: '95+', resistance: 47.2 }
        ];
        break;
      case 'region':
        baseData = [
          { category: 'Greater Accra', resistance: 29.8 },
          { category: 'Ashanti', resistance: 35.1 },
          { category: 'Western', resistance: 33.4 },
          { category: 'Central', resistance: 31.7 },
          { category: 'Volta', resistance: 28.9 },
          { category: 'Eastern', resistance: 32.6 },
          { category: 'Northern', resistance: 36.8 },
          { category: 'Upper East', resistance: 39.2 },
          { category: 'Upper West', resistance: 37.5 },
          { category: 'Brong-Ahafo', resistance: 34.3 }
        ];
        break;
      case 'hospital':
        baseData = [
          { category: 'Korle-Bu TH', resistance: 31.4 },
          { category: 'Komfo Anokye TH', resistance: 35.8 },
          { category: 'University of Ghana H', resistance: 28.6 },
          { category: 'Tamale TH', resistance: 36.9 },
          { category: 'Cape Coast TH', resistance: 32.1 },
          { category: 'Ho TH', resistance: 29.3 },
          { category: 'Bolgatanga RH', resistance: 38.7 },
          { category: 'Sunyani RH', resistance: 33.9 },
          { category: 'Wa RH', resistance: 37.2 },
          { category: 'Eastern RH', resistance: 30.8 },
          { category: 'LEKMA H', resistance: 27.4 }
        ];
        break;
      case 'hospitalWard':
        baseData = [
          { category: 'AMW', resistance: 31.8 },
          { category: 'ASW', resistance: 29.4 },
          { category: 'AHRW', resistance: 38.6 },
          { category: 'AICU', resistance: 42.3 },
          { category: 'PMW', resistance: 35.7 },
          { category: 'PSW', resistance: 33.1 },
          { category: 'PHRW', resistance: 40.9 },
          { category: 'PICU', resistance: 45.2 },
          { category: 'NMW', resistance: 39.8 },
          { category: 'NICU', resistance: 43.7 },
          { category: 'MXW', resistance: 34.6 }
        ];
        break;
      case 'pathogen':
        baseData = [
          { category: 'A. baumanii', resistance: 68.4 },
          { category: 'E. coli', resistance: 42.7 },
          { category: 'K. pneumoniae', resistance: 51.3 },
          { category: 'P. aeruginosa', resistance: 45.9 },
          { category: 'S. aureus', resistance: 38.2 },
          { category: 'Enterococcus spp.', resistance: 29.6 },
          { category: 'S. pneumoniae', resistance: 24.8 }
        ];
        break;
      case 'specimenSource':
        baseData = [
          { category: 'Blood', resistance: 34.8 },
          { category: 'Urine', resistance: 28.9 },
          { category: 'Respiratory', resistance: 41.6 },
          { category: 'Wound/Abscess', resistance: 36.2 },
          { category: 'CSF', resistance: 32.4 },
          { category: 'Other sterile', resistance: 30.7 },
          { category: 'Stool', resistance: 26.3 },
          { category: 'Genital', resistance: 33.1 },
          { category: 'Other non-sterile', resistance: 31.8 }
        ];
        break;
      default:
        baseData = [];
    }

    // Apply filter adjustments
    return baseData.map(item => ({
      ...item,
      resistance: activeFilters.length > 0 ? item.resistance * (0.9 + Math.random() * 0.2) : item.resistance
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg font-medium">Antimicrobial Resistance by Category</CardTitle>
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
              console.log('Download Resistance by Category chart data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Antimicrobial resistance surveillance {viewByOptions.find(o => o.value === viewBy)?.label} • Total: {(25212 - (activeFilters.length * 1250)).toLocaleString()} bacterial isolates tested
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
            <h3 className="font-semibold text-gray-900 text-sm">Filter Resistance Data:</h3>
            
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
                              setFilterValue(""); // Reset filter value when type changes
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

        {/* Bar Chart */}
        <div className="w-full">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={getViewByData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                angle={viewBy === 'hospital' ? -45 : 0}
                textAnchor={viewBy === 'hospital' ? 'end' : 'middle'}
                height={viewBy === 'hospital' ? 80 : 60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                label={{ value: 'Resistance Rate (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 z-[999]">
                        <div className="text-black font-medium text-sm mb-2">
                          {label}
                        </div>
                        <div className="text-gray-600 text-sm">
                          Resistance: {payload[0]?.value?.toFixed(1)}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="resistance" 
                fill="#dc2626"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Color Legend */}

        
        <div className="pt-4 border-t border-gray-200 m-[0px]">
          <p className="text-xs text-gray-500">
            AMR surveillance data; Category-specific resistance patterns for priority pathogens across all facilities.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}