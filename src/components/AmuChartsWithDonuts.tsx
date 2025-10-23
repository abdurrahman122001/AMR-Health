import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';

// Time series data for AMU prevalence (2023-2025)
const timeSeriesData = [
  { year: '2023', quarter: 'Q1', prevalence: 68.2, studies: 8 },
  { year: '2023', quarter: 'Q2', prevalence: 71.4, studies: 10 },
  { year: '2023', quarter: 'Q3', prevalence: 74.1, studies: 12 },
  { year: '2023', quarter: 'Q4', prevalence: 75.8, studies: 11 },
  { year: '2024', quarter: 'Q1', prevalence: 73.6, studies: 9 },
  { year: '2024', quarter: 'Q2', prevalence: 76.2, studies: 13 },
  { year: '2024', quarter: 'Q3', prevalence: 78.9, studies: 14 },
  { year: '2024', quarter: 'Q4', prevalence: 79.4, studies: 12 },
  { year: '2025', quarter: 'Q1', prevalence: 77.1, studies: 10 }
];

// Donut chart data for prophylaxis overview
const prophylaxisShareData = [
  { name: 'Prophylaxis', value: 30.6, color: '#8b5cf6' },
  { name: 'Other Rx', value: 69.4, color: '#e5e7eb' }
];

const prophylaxisTypeData = [
  { name: 'Surgical Prophylaxis', value: 65.3, color: '#16a34a' },
  { name: 'Medical Prophylaxis', value: 34.7, color: '#2563eb' }
];

// Sex options (in order of appearance)
const sexOptions = [
  'Female',
  'Male',
  'Unknown'
];

// Age groups (in order of appearance)
const ageGroups = [
  'Neonates',
  'Under 5',
  '5-14',
  '15-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65-74',
  '75-84',
  '85-94',
  '95+'
];

// Hospital options (in order of appearance)
const hospitals = [
  'Eastern Regional Hospital',
  'Korle-Bu Teaching Hospital',
  'LEKMA Hospital',
  'Ho Teaching Hospital'
];

// Hospital Activity options (in order of appearance)
const hospitalActivities = [
  'Medical',
  'Surgical',
  'Intensive Care'
];

// Hospital Ward options (in order of appearance)
const hospitalWards = [
  'Adult Medical Ward (AMW)',
  'Adult Surgical Ward (ASW)',
  'High-Risk Adult Ward (AHRW)',
  'Adult Intensive Care Unit (AICU)',
  'Paediatric Medical Ward (PMW)',
  'Paediatric Surgical Ward (PSW)',
  'High-Risk Paediatric Ward (PHRW)',
  'Paediatric Intensive Care Unit (PICU)',
  'Neonatal Medical Ward (NMW)',
  'Neonatal Intensive Care Unit (NICU)',
  'Mixed Ward (MXW)'
];

// Indication options (in order of appearance)
const indications = [
  'Community-Acquired Infections (CAI)',
  'Hospital-Acquired Infections (HAI)',
  'Surgical Prophylaxis (SP)',
  'Medical Prophylaxis (MP)'
];

export function AmuChartsWithDonuts() {
  const [currentView, setCurrentView] = useState('prophylaxis');
  
  // Filter system for prophylaxis chart
  const [prophylaxisFilterType, setProphylaxisFilterType] = useState('');
  const [prophylaxisFilterValue, setProphylaxisFilterValue] = useState('');
  const [prophylaxisActiveFilters, setProphylaxisActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for prophylaxis donut charts
  const [prophylaxisDonutFilterType, setProphylaxisDonutFilterType] = useState('');
  const [prophylaxisDonutFilterValue, setProphylaxisDonutFilterValue] = useState('');
  const [prophylaxisDonutActiveFilters, setProphylaxisDonutActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  const filterTypeOptions = [
    { value: 'sex', label: 'Sex' },
    { value: 'ageGroup', label: 'Age Group' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'hospitalActivity', label: 'Hospital Activity' },
    { value: 'hospitalWard', label: 'Hospital Ward' },
    { value: 'indication', label: 'Indication' }
  ];

  const getFilterValueOptions = (filterType: string) => {
    switch (filterType) {
      case 'sex':
        return sexOptions.map(s => ({ value: s, label: s }));
      case 'ageGroup':
        return ageGroups.map(age => ({ value: age, label: age }));
      case 'hospital':
        return hospitals.map(h => ({ value: h, label: h }));
      case 'hospitalActivity':
        return hospitalActivities.map(ha => ({ value: ha, label: ha }));
      case 'hospitalWard':
        return hospitalWards.map(hw => ({ value: hw, label: hw }));
      case 'indication':
        return indications.map(ind => ({ value: ind, label: ind }));
      default:
        return [];
    }
  };

  // Helper functions for each chart
  const createFilterHelpers = (
    filterType: string,
    setFilterType: (value: string) => void,
    filterValue: string,
    setFilterValue: (value: string) => void,
    activeFilters: Array<{type: string, value: string, label: string}>,
    setActiveFilters: (filters: Array<{type: string, value: string, label: string}>) => void
  ) => ({
    addFilter: () => {
      if (filterType && filterValue) {
        const typeLabel = filterTypeOptions.find(t => t.value === filterType)?.label || filterType;
        const newFilter = {
          type: filterType,
          value: filterValue,
          label: `${typeLabel}: ${filterValue}`
        };
        
        if (!activeFilters.some(f => f.type === filterType && f.value === filterValue)) {
          setActiveFilters([...activeFilters, newFilter]);
        }
        
        setFilterType('');
        setFilterValue('');
      }
    },
    removeFilter: (index: number) => {
      setActiveFilters(activeFilters.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setActiveFilters([]);
    }
  });

  const prophylaxisFilterHelpers = createFilterHelpers(
    prophylaxisFilterType, setProphylaxisFilterType, prophylaxisFilterValue, setProphylaxisFilterValue,
    prophylaxisActiveFilters, setProphylaxisActiveFilters
  );

  const prophylaxisDonutFilterHelpers = createFilterHelpers(
    prophylaxisDonutFilterType, setProphylaxisDonutFilterType, prophylaxisDonutFilterValue, setProphylaxisDonutFilterValue,
    prophylaxisDonutActiveFilters, setProphylaxisDonutActiveFilters
  );

  return (
    <div className="space-y-6">
      {currentView === 'prophylaxis' && (
        <div className="space-y-6">
          {/* Prophylaxis Overview Donut Charts */}
          <Card>
            <CardHeader className="space-y-4">
              <div>
                <CardTitle className="text-lg mb-1">
                  Prophylaxis Overview
                </CardTitle>
                <p className="text-sm text-gray-600 m-0">
                  Share of prescriptions for prophylaxis and breakdown by type
                </p>
              </div>
              
              {/* Filter Controls - Container with Background */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                    Filter Prophylaxis Overview:
                  </span>
                  
                  <div className="flex-1">
                    <Select value={prophylaxisDonutFilterType} onValueChange={setProphylaxisDonutFilterType}>
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="Select filter type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filterTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Select 
                      value={prophylaxisDonutFilterValue} 
                      onValueChange={setProphylaxisDonutFilterValue} 
                      disabled={!prophylaxisDonutFilterType}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder={prophylaxisDonutFilterType ? "Select value..." : "Select type first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilterValueOptions(prophylaxisDonutFilterType).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <button
                    onClick={prophylaxisDonutFilterHelpers.addFilter}
                    disabled={!prophylaxisDonutFilterType || !prophylaxisDonutFilterValue}
                    className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
                  >
                    Add Filter
                  </button>
                </div>
              </div>
              
              {/* Active Filters */}
              {prophylaxisDonutActiveFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {prophylaxisDonutActiveFilters.map((filter, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {filter.label}
                      <button
                        onClick={() => prophylaxisDonutFilterHelpers.removeFilter(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                {/* Share of All Rx that are Prophylaxis */}
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Share of All Prescriptions
                  </h3>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={prophylaxisShareData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="value"
                          startAngle={90}
                          endAngle={450}
                        >
                          {prophylaxisShareData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3">
                                  <div className="text-black font-medium text-sm mb-1">
                                    {data.name}
                                  </div>
                                  <div className="text-gray-600 text-sm">
                                    {data.value}% of total prescriptions
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">30.6%</div>
                        <div className="text-xs text-gray-600">Prophylaxis</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 flex justify-center">
                    <div className="flex flex-col gap-2">
                      {prophylaxisShareData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }}></div>
                          <span className="text-sm">{entry.name} ({entry.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Prophylaxis Type Breakdown */}
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Prophylaxis Type Breakdown
                  </h3>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={prophylaxisTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="value"
                          startAngle={90}
                          endAngle={450}
                        >
                          {prophylaxisTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3">
                                  <div className="text-black font-medium text-sm mb-1">
                                    {data.name}
                                  </div>
                                  <div className="text-gray-600 text-sm">
                                    {data.value}% of prophylaxis prescriptions
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">Medical vs</div>
                        <div className="text-lg font-bold text-gray-900">Surgical</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 flex justify-center">
                    <div className="flex flex-col gap-2">
                      {prophylaxisTypeData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }}></div>
                          <span className="text-sm">{entry.name} ({entry.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribution of Antimicrobial prophylaxis by hospital activity */}
          <Card>
            <CardHeader className="space-y-4">
              <div>
                <CardTitle className="text-lg mb-1">
                  Distribution of Antimicrobial prophylaxis by hospital activity
                </CardTitle>
                <p className="text-sm text-gray-600 m-0">
                  Total number of medical or surgical prophylaxis/total number of patients on prophylaxis
                </p>
              </div>
              
              {/* Filter Controls - Container with Background */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                    Filter Prophylaxis Data:
                  </span>
                  
                  <div className="flex-1">
                    <Select value={prophylaxisFilterType} onValueChange={setProphylaxisFilterType}>
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="Select filter type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filterTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Select 
                      value={prophylaxisFilterValue} 
                      onValueChange={setProphylaxisFilterValue} 
                      disabled={!prophylaxisFilterType}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder={prophylaxisFilterType ? "Select value..." : "Select type first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilterValueOptions(prophylaxisFilterType).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <button
                    onClick={prophylaxisFilterHelpers.addFilter}
                    disabled={!prophylaxisFilterType || !prophylaxisFilterValue}
                    className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
                  >
                    Add Filter
                  </button>
                </div>
              </div>
              
              {/* Active Filters */}
              {prophylaxisActiveFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {prophylaxisActiveFilters.map((filter, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {filter.label}
                      <button
                        onClick={() => prophylaxisFilterHelpers.removeFilter(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={[
                    { 
                      activity: 'Medical',
                      medicalProphylaxis: 54.8,
                      surgicalProphylaxis: 45.2
                    },
                    { 
                      activity: 'Surgical',
                      medicalProphylaxis: 21.4,
                      surgicalProphylaxis: 78.6
                    },
                    { 
                      activity: 'Intensive Care',
                      medicalProphylaxis: 37.9,
                      surgicalProphylaxis: 62.1
                    }
                  ]} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="activity" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis 
                    label={{ 
                      value: '% of Prophylaxis Type', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fontSize: '13px', fontWeight: 'bold' }
                    }}
                    domain={[0, 100]}
                    ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                    tick={{ fontSize: 10 }}
                  />
                  
                  <Bar 
                    dataKey="medicalProphylaxis" 
                    stackId="prophylaxis"
                    fill="#8b5cf6" 
                    name="Medical Prophylaxis"
                  />
                  <Bar 
                    dataKey="surgicalProphylaxis" 
                    stackId="prophylaxis"
                    fill="#16a34a" 
                    name="Surgical Prophylaxis"
                  />
                  
                  <Tooltip 
                    shared={false}
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const hoveredSegment = payload[payload.length - 1];
                        
                        if (hoveredSegment && hoveredSegment.value > 0) {
                          const prophylaxisType = hoveredSegment.dataKey === 'medicalProphylaxis' ? 'Medical Prophylaxis' : 'Surgical Prophylaxis';
                          const percentage = hoveredSegment.value.toFixed(1);
                          const activityType = label;
                          const estimatedPatients = Math.round((hoveredSegment.value * 150) / 100);
                          const totalPatientsInActivity = 150;
                          
                          return (
                            <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[280px] max-w-[360px]">
                              <div className="text-black font-medium text-sm mb-1">
                                {activityType} Activity
                              </div>
                              <div className="text-black font-medium text-sm mb-1">
                                {prophylaxisType}
                              </div>
                              <div className="text-gray-600 text-sm mb-1">
                                {percentage}% of prophylaxis in {activityType}
                              </div>
                              <div className="text-gray-600 text-sm">
                                {estimatedPatients} of {totalPatientsInActivity} patients on prophylaxis
                              </div>
                            </div>
                          );
                        }
                      }
                      return null;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="mt-4 flex justify-center">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
                    <span className="text-sm">Medical Prophylaxis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#16a34a' }}></div>
                    <span className="text-sm">Surgical Prophylaxis</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}