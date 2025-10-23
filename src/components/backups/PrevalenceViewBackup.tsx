// PREVALENCE VIEW BACKUP - Current Working Version
// This file contains the complete Prevalence view from AmuCharts component
// Last updated: Current restoration version

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

// Filter options
const sexOptions = ['Female', 'Male', 'Unknown'];
const ageGroups = ['Neonates', 'Under 5', '5-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65-74', '75-84', '85-94', '95+'];
const hospitals = ['Eastern Regional Hospital', 'Korle-Bu Teaching Hospital', 'LEKMA Hospital', 'Ho Teaching Hospital'];
const hospitalActivities = ['Medical', 'Surgical', 'Intensive Care'];
const hospitalWards = ['Adult Medical Ward (AMW)', 'Adult Surgical Ward (ASW)', 'High-Risk Adult Ward (AHRW)', 'Adult Intensive Care Unit (AICU)', 'Paediatric Medical Ward (PMW)', 'Paediatric Surgical Ward (PSW)', 'High-Risk Paediatric Ward (PHRW)', 'Paediatric Intensive Care Unit (PICU)', 'Neonatal Medical Ward (NMW)', 'Neonatal Intensive Care Unit (NICU)', 'Mixed Ward (MXW)'];
const indications = ['Community-Acquired Infections (CAI)', 'Hospital-Acquired Infections (HAI)', 'Surgical Prophylaxis (SP)', 'Medical Prophylaxis (MP)'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-blue-600">
          Prevalence: {data.prevalence}%
        </p>
        <p className="text-xs text-gray-600">
          {data.numerator}/{data.denominator} patients
        </p>
        <p className="text-xs text-gray-600">
          95% CI: {data.ci_lower}% - {data.ci_upper}%
        </p>
      </div>
    );
  }
  return null;
};

export function PrevalenceView() {
  // Filter system for prevalence trends
  const [trendsFilterType, setTrendsFilterType] = useState('');
  const [trendsFilterValue, setTrendsFilterValue] = useState('');
  const [trendsActiveFilters, setTrendsActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

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

  const addFilter = () => {
    if (trendsFilterType && trendsFilterValue) {
      const typeLabel = filterTypeOptions.find(t => t.value === trendsFilterType)?.label || trendsFilterType;
      const newFilter = {
        type: trendsFilterType,
        value: trendsFilterValue,
        label: `${typeLabel}: ${trendsFilterValue}`
      };
      
      if (!trendsActiveFilters.some(f => f.type === trendsFilterType && f.value === trendsFilterValue)) {
        setTrendsActiveFilters([...trendsActiveFilters, newFilter]);
      }
      
      setTrendsFilterType('');
      setTrendsFilterValue('');
    }
  };

  const removeFilter = (index: number) => {
    setTrendsActiveFilters(trendsActiveFilters.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setTrendsActiveFilters([]);
  };

  return (
    <div className="space-y-6">
      {/* Time Series Prevalence Trends Chart */}
      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">AMU Prevalence Trends (2023-2025)</CardTitle>
            <div className="text-sm text-gray-600">
              Percentage of patients prescribed antimicrobials
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={trendsFilterType} onValueChange={setTrendsFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  {filterTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {trendsFilterType && (
                <>
                  <Select value={trendsFilterValue} onValueChange={setTrendsFilterValue}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilterValueOptions(trendsFilterType).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addFilter} variant="outline">
                    Add Filter
                  </Button>
                </>
              )}
              
              {trendsActiveFilters.length > 0 && (
                <Button onClick={clearAllFilters} variant="outline">
                  Clear All
                </Button>
              )}
            </div>
            
            {/* Active Filters */}
            {trendsActiveFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {trendsActiveFilters.map((filter, index) => (
                  <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {filter.label}
                    <button
                      onClick={() => removeFilter(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="quarter"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Prevalence (%)', angle: -90, position: 'insideLeft' }}
                domain={[60, 85]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={CustomTooltip} />
              <Line 
                type="monotone" 
                dataKey="prevalence" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}