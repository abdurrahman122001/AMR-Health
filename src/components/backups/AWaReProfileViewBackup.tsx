// AWARE PROFILE VIEW BACKUP - Current Working Version
// This file contains the complete AWaRe Profile view from AmuCharts component
// Last updated: Current restoration version

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// AWaRe distribution data
const awareData = [
  { hospital: 'Korle-Bu TH', access: 62.5, watch: 31.2, reserve: 6.3 },
  { hospital: 'Komfo Anokye TH', access: 65.8, watch: 28.9, reserve: 5.3 },
  { hospital: 'Ridge Hospital', access: 59.4, watch: 34.1, reserve: 6.5 }
];

// Filter options
const sexOptions = ['Female', 'Male', 'Unknown'];
const ageGroups = ['Neonates', 'Under 5', '5-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65-74', '75-84', '85-94', '95+'];
const hospitals = ['Eastern Regional Hospital', 'Korle-Bu Teaching Hospital', 'LEKMA Hospital', 'Ho Teaching Hospital'];
const hospitalActivities = ['Medical', 'Surgical', 'Intensive Care'];
const hospitalWards = ['Adult Medical Ward (AMW)', 'Adult Surgical Ward (ASW)', 'High-Risk Adult Ward (AHRW)', 'Adult Intensive Care Unit (AICU)', 'Paediatric Medical Ward (PMW)', 'Paediatric Surgical Ward (PSW)', 'High-Risk Paediatric Ward (PHRW)', 'Paediatric Intensive Care Unit (PICU)', 'Neonatal Medical Ward (NMW)', 'Neonatal Intensive Care Unit (NICU)', 'Mixed Ward (MXW)'];
const indications = ['Community-Acquired Infections (CAI)', 'Hospital-Acquired Infections (HAI)', 'Surgical Prophylaxis (SP)', 'Medical Prophylaxis (MP)'];

// Colors for charts
const COLORS = {
  access: '#16a34a',
  watch: '#eab308', 
  reserve: '#dc2626'
};

export function AWaReProfileView() {
  // Filter system for AWaRe chart
  const [awareFilterType, setAwareFilterType] = useState('');
  const [awareFilterValue, setAwareFilterValue] = useState('');
  const [awareActiveFilters, setAwareActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

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
    if (awareFilterType && awareFilterValue) {
      const typeLabel = filterTypeOptions.find(t => t.value === awareFilterType)?.label || awareFilterType;
      const newFilter = {
        type: awareFilterType,
        value: awareFilterValue,
        label: `${typeLabel}: ${awareFilterValue}`
      };
      
      if (!awareActiveFilters.some(f => f.type === awareFilterType && f.value === awareFilterValue)) {
        setAwareActiveFilters([...awareActiveFilters, newFilter]);
      }
      
      setAwareFilterType('');
      setAwareFilterValue('');
    }
  };

  const removeFilter = (index: number) => {
    setAwareActiveFilters(awareActiveFilters.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setAwareActiveFilters([]);
  };

  return (
    <div className="space-y-6">
      {/* AWaRe Classification Chart */}
      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">AWaRe Classification Distribution</CardTitle>
            <div className="text-sm text-gray-600">
              WHO Access, Watch, Reserve categories by hospital
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={awareFilterType} onValueChange={setAwareFilterType}>
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
              
              {awareFilterType && (
                <>
                  <Select value={awareFilterValue} onValueChange={setAwareFilterValue}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilterValueOptions(awareFilterType).map((option) => (
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
              
              {awareActiveFilters.length > 0 && (
                <Button onClick={clearAllFilters} variant="outline">
                  Clear All
                </Button>
              )}
            </div>
            
            {/* Active Filters */}
            {awareActiveFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {awareActiveFilters.map((filter, index) => (
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
            <BarChart data={awareData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hospital" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis 
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="access" stackId="a" fill={COLORS.access} name="Access" />
              <Bar dataKey="watch" stackId="a" fill={COLORS.watch} name="Watch" />
              <Bar dataKey="reserve" stackId="a" fill={COLORS.reserve} name="Reserve" />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="mt-4 flex justify-center">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.access }}></div>
                <span className="text-sm">Access</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.watch }}></div>
                <span className="text-sm">Watch</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.reserve }}></div>
                <span className="text-sm">Reserve</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}