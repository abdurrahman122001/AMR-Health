// ATC4 PROFILE VIEW BACKUP - Current Working Version  
// This file contains the complete ATC4 Profile view from AmuCharts component
// Last updated: Current restoration version

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ATC4 class distribution data
const atc4Data = [
  { hospital: 'Korle-Bu TH', penicillins: 25.3, cephalosporins: 18.7, quinolones: 15.2, macrolides: 12.1, others: 28.7 },
  { hospital: 'Komfo Anokye TH', penicillins: 28.9, cephalosporins: 16.4, quinolones: 14.8, macrolides: 10.5, others: 29.4 },
  { hospital: 'Ridge Hospital', penicillins: 22.1, cephalosporins: 21.3, quinolones: 16.9, macrolides: 13.2, others: 26.5 }
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
  penicillins: '#3b82f6',
  cephalosporins: '#ef4444', 
  quinolones: '#f97316',
  macrolides: '#22c55e',
  others: '#6b7280'
};

export function ATC4ProfileView() {
  // Filter system for ATC4 chart
  const [atc4FilterType, setAtc4FilterType] = useState('');
  const [atc4FilterValue, setAtc4FilterValue] = useState('');
  const [atc4ActiveFilters, setAtc4ActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

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
    if (atc4FilterType && atc4FilterValue) {
      const typeLabel = filterTypeOptions.find(t => t.value === atc4FilterType)?.label || atc4FilterType;
      const newFilter = {
        type: atc4FilterType,
        value: atc4FilterValue,
        label: `${typeLabel}: ${atc4FilterValue}`
      };
      
      if (!atc4ActiveFilters.some(f => f.type === atc4FilterType && f.value === atc4FilterValue)) {
        setAtc4ActiveFilters([...atc4ActiveFilters, newFilter]);
      }
      
      setAtc4FilterType('');
      setAtc4FilterValue('');
    }
  };

  const removeFilter = (index: number) => {
    setAtc4ActiveFilters(atc4ActiveFilters.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setAtc4ActiveFilters([]);
  };

  return (
    <div className="space-y-6">
      {/* ATC4 Distribution Chart */}
      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">ATC4 Class Distribution</CardTitle>
            <div className="text-sm text-gray-600">
              Antimicrobial classes by hospital
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={atc4FilterType} onValueChange={setAtc4FilterType}>
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
              
              {atc4FilterType && (
                <>
                  <Select value={atc4FilterValue} onValueChange={setAtc4FilterValue}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilterValueOptions(atc4FilterType).map((option) => (
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
              
              {atc4ActiveFilters.length > 0 && (
                <Button onClick={clearAllFilters} variant="outline">
                  Clear All
                </Button>
              )}
            </div>
            
            {/* Active Filters */}
            {atc4ActiveFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {atc4ActiveFilters.map((filter, index) => (
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
            <BarChart data={atc4Data}>
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
              <Bar dataKey="penicillins" stackId="a" fill={COLORS.penicillins} name="Penicillins" />
              <Bar dataKey="cephalosporins" stackId="a" fill={COLORS.cephalosporins} name="Cephalosporins" />
              <Bar dataKey="quinolones" stackId="a" fill={COLORS.quinolones} name="Quinolones" />
              <Bar dataKey="macrolides" stackId="a" fill={COLORS.macrolides} name="Macrolides" />
              <Bar dataKey="others" stackId="a" fill={COLORS.others} name="Others" />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="mt-4 flex justify-center">
            <div className="flex flex-wrap gap-6">
              {Object.entries(COLORS).map(([key, color]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                  <span className="text-sm capitalize">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}