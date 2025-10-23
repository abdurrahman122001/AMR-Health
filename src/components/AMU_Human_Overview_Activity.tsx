import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Activity breakdown data
const activityData = [
  { activity: 'Medical', prevalence: 68.5, hospitals: 45, patients: 3245 },
  { activity: 'Surgical', prevalence: 79.2, hospitals: 42, patients: 2834 },
  { activity: 'Intensive Care', prevalence: 89.7, hospitals: 38, patients: 1567 }
];

// Filter options
const sexOptions = ['Female', 'Male', 'Unknown'];
const ageGroups = ['Neonates', 'Under 5', '5-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65-74', '75-84', '85-94', '95+'];
const hospitals = ['Eastern Regional Hospital', 'Korle-Bu Teaching Hospital', 'LEKMA Hospital', 'Ho Teaching Hospital'];
const hospitalActivities = ['Medical', 'Surgical', 'Intensive Care'];
const hospitalWards = [
  'Adult Medical Ward (AMW)', 'Adult Surgical Ward (ASW)', 'High-Risk Adult Ward (AHRW)',
  'Adult Intensive Care Unit (AICU)', 'Paediatric Medical Ward (PMW)', 'Paediatric Surgical Ward (PSW)',
  'High-Risk Paediatric Ward (PHRW)', 'Paediatric Intensive Care Unit (PICU)',
  'Neonatal Medical Ward (NMW)', 'Neonatal Intensive Care Unit (NICU)', 'Mixed Ward (MXW)'
];
const indications = ['Community-Acquired Infections (CAI)', 'Hospital-Acquired Infections (HAI)', 'Surgical Prophylaxis (SP)', 'Medical Prophylaxis (MP)'];

const filterTypeOptions = [
  { value: 'sex', label: 'Sex' },
  { value: 'ageGroup', label: 'Age Group' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'hospitalActivity', label: 'Hospital Activity' },
  { value: 'hospitalWard', label: 'Hospital Ward' },
  { value: 'indication', label: 'Indication' }
];

interface Filter {
  type: string;
  value: string;
  label: string;
}

export function AMU_Human_Overview_Activity() {
  // Filter states
  const [activityFilterType, setActivityFilterType] = useState('');
  const [activityFilterValue, setActivityFilterValue] = useState('');
  const [activityActiveFilters, setActivityActiveFilters] = useState<Filter[]>([]);

  // Get filter value options based on type
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

  // Filter helpers
  const activityFilterHelpers = {
    addFilter: () => {
      if (activityFilterType && activityFilterValue) {
        const typeLabel = filterTypeOptions.find(t => t.value === activityFilterType)?.label || activityFilterType;
        const newFilter: Filter = {
          type: activityFilterType,
          value: activityFilterValue,
          label: `${typeLabel}: ${activityFilterValue}`
        };
        
        if (!activityActiveFilters.some(f => f.type === activityFilterType && f.value === activityFilterValue)) {
          setActivityActiveFilters([...activityActiveFilters, newFilter]);
        }
        
        setActivityFilterType('');
        setActivityFilterValue('');
      }
    },
    removeFilter: (index: number) => {
      setActivityActiveFilters(activityActiveFilters.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setActivityActiveFilters([]);
    }
  };

  // Get filtered data (in real implementation, this would apply actual filtering)
  const getFilteredActivityData = () => {
    // For now, return original data. In real implementation, apply active filters
    return activityData;
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium">AMU Prevalence by Hospital Activity</CardTitle>
        <p className="text-sm text-gray-600 m-[0px]">Share of patients on ≥1 antimicrobial, by hospital activity</p>
        
        {/* Active Filters Display */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Active Filters ({activityActiveFilters.length})
            </span>
            {activityActiveFilters.length > 0 && (
              <button
                onClick={activityFilterHelpers.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2">
            {activityActiveFilters.map((filter, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => activityFilterHelpers.removeFilter(index)}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {activityActiveFilters.length === 0 && (
            <p className="text-sm text-gray-500 italic">No active filters</p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          {/* Main Chart Area */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={getFilteredActivityData()} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="activity" 
                  height={40}
                  fontSize={10}
                />
                <YAxis 
                  label={{ 
                    value: '% Prevalence', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: '13px', fontWeight: 'bold' }
                  }}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      const value = payload[0].value;
                      
                      // Risk level and color coding based on prevalence value
                      const getRiskInfo = (prevalence: number) => {
                        if (prevalence < 50) return { color: '#16a34a', level: 'Low usage' };
                        if (prevalence < 75) return { color: '#f59e0b', level: 'Moderate usage' };
                        return { color: '#dc2626', level: 'High usage' };
                      };
                      
                      const riskInfo = getRiskInfo(value as number);
                      
                      return (
                        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
                          <div className="text-gray-900 font-medium mb-1" style={{ fontStyle: 'italic' }}>
                            <strong>{label}</strong>
                          </div>
                          <div className="text-gray-600 text-sm mb-2">
                            AMU Prevalence
                          </div>
                          <div className="mb-2">
                            <span 
                              className="font-medium"
                              style={{ color: riskInfo.color }}
                            >
                              {value}% prevalence rate ({riskInfo.level})
                            </span>
                          </div>
                          <div className="text-gray-500 text-sm">
                            {data.hospitals} hospitals, {data.patients} patients
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="prevalence" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Filter Panel */}
          <div className="w-64 bg-gray-50 rounded-lg p-4 border self-start" style={{ height: '315px' }}>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Filter Activity Data</h3>
              
              {/* Filter Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
                <Select value={activityFilterType} onValueChange={setActivityFilterType}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Select filter type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filterTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter Value</label>
                <Select 
                  value={activityFilterValue} 
                  onValueChange={setActivityFilterValue}
                  disabled={!activityFilterType}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder={activityFilterType ? "Select value..." : "Select type first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilterValueOptions(activityFilterType).map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Filter Button */}
              <button
                onClick={activityFilterHelpers.addFilter}
                disabled={!activityFilterType || !activityFilterValue}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                Add Filter
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}