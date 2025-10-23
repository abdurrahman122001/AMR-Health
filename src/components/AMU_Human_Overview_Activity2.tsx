import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

// Hospital activity data
const activityData = [
  { activity: 'Medical', prevalence: 68.5, hospitals: 45, surveys: 89, patients: 3245 },
  { activity: 'Surgical', prevalence: 79.2, hospitals: 42, surveys: 76, patients: 2834 },
  { activity: 'Intensive Care', prevalence: 89.7, hospitals: 38, surveys: 68, patients: 1567 }
];

// Filter options
const sexOptions = ['Female', 'Male', 'Unknown'];
const ageGroups = ['Neonates', 'Under 5', '5-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65-74', '75-84', '85-94', '95+'];
const hospitals = ['Eastern Regional Hospital', 'Korle-Bu Teaching Hospital', 'LEKMA Hospital', 'Ho Teaching Hospital'];
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
  { value: 'hospitalWard', label: 'Hospital Ward' },
  { value: 'indication', label: 'Indication' }
];

interface Filter {
  type: string;
  value: string;
  label: string;
}

export function AMU_Human_Overview_Activity2() {
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
      <CardHeader className="pt-[24px] pr-[24px] pb-[10px] pl-[24px]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Hospital Activity Profile of AMU Prevalence</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              // Add download functionality here
              console.log('Download AMU Hospital Activity prevalence data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Share of Patient encounters with ≥1 Systemic Antibacterial (J01) Prescribed • Total: {activityData.reduce((total, activity) => total + activity.patients, 0).toLocaleString()} encounters
        </p>
        
        {/* Active Filters Display */}
        {activityActiveFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({activityActiveFilters.length})
              </span>
              <button
                onClick={activityFilterHelpers.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
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
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          {/* Main Chart Area */}
          <div className="flex-1">
            <div className="h-[350px] w-full">
              {/* Custom horizontal bar chart */}
              <div className="flex flex-col h-full">
                {/* Chart area with border frame */}
                <div className="flex-1 flex flex-col justify-evenly py-4 p-[0px] relative">
                  {/* Chart container with border */}
                  <div className="absolute inset-0 ml-[90px] mr-[30px] border-l border-b border-gray-400">
                    {/* Vertical gridlines at 20%, 40%, 60%, 80%, 100% */}
                    <div className="absolute inset-0">
                      {[20, 40, 60, 80, 100].map((percent) => (
                        <div 
                          key={percent}
                          className={`absolute h-full w-px ${percent === 100 ? 'border-l border-gray-400' : 'border-l border-gray-300 border-dashed'}`}
                          style={{ left: `${percent}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {getFilteredActivityData().map((item, index) => {
                    const getRiskInfo = (prevalence: number) => {
                      if (prevalence < 50) return { color: '#16a34a', level: 'Low usage' };
                      if (prevalence < 75) return { color: '#f59e0b', level: 'Moderate usage' };
                      return { color: '#dc2626', level: 'High usage' };
                    };
                    
                    const riskInfo = getRiskInfo(item.prevalence);
                    
                    return (
                      <div key={item.activity} className="flex items-center group cursor-pointer mx-[0px] m-[0px] py-[20px] relative z-10 px-[0px] py-[10px]">
                        {/* Y-axis label */}
                        <div className="w-[90px] text-right pr-3">
                          <span className="text-xs text-gray-700">{item.activity}</span>
                        </div>
                        
                        {/* Bar container */}
                        <div className="flex-1 relative h-16 bg-transparent mr-[30px]">
                          {/* Stacked bars */}
                          <div className="absolute inset-0 flex">
                            {/* With antimicrobial bar */}
                            <div 
                              className="bg-red-600 h-full flex items-center justify-end pr-2"
                              style={{ width: `${item.prevalence}%` }}
                            >
                              <span className="text-sm text-white font-medium">
                                {item.prevalence}%
                              </span>
                            </div>
                            
                            {/* Without antimicrobial bar */}
                            <div 
                              className="bg-gray-300 h-full"
                              style={{ width: `${100 - item.prevalence}%` }}
                            />
                          </div>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20">
                              <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[220px]">
                                <div className="text-gray-900 font-medium mb-1" style={{ fontStyle: 'italic' }}>
                                  <strong>{item.activity} Activity</strong>
                                </div>
                                <div className="text-gray-600 text-sm mb-2">
                                  <span 
                                    className="font-medium text-sm"
                                    style={{ color: riskInfo.color }}
                                  >
                                    {item.prevalence}% prevalence rate ({riskInfo.level})
                                  </span>
                                </div>
                                <div className="text-gray-500 text-sm">
                                   Surveys: {item.surveys}
                                </div>
                                <div className="text-gray-500 text-sm">
                                   Hospitals: {item.hospitals}
                                </div>
                                <div className="text-gray-500 text-sm">
                                  Patients: {item.patients}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* X-axis labels at bottom */}
                <div className="flex justify-between items-center mt-4 ml-[100px] mr-[30px]">
                  <span className="text-xs text-gray-600">0%</span>
                  <span className="text-xs text-gray-600">20%</span>
                  <span className="text-xs text-gray-600">40%</span>
                  <span className="text-xs text-gray-600">60%</span>
                  <span className="text-xs text-gray-600">80%</span>
                  <span className="text-xs text-gray-600">100%</span>
                </div>
                
                {/* Axis labels */}
                <div className="flex justify-center mt-2">
                  <span className="text-xs font-semibold text-gray-700">% Patients</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          <div className="w-64 bg-gray-50 rounded-lg p-4 border self-start" style={{ height: '290px'}}>
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
        
        {/* Footer */}
        <div className="mt-[20px] pt-4 border-t border-gray-200 mr-[0px] mb-[0px] ml-[0px]">
          <p className="text-xs text-gray-500">
            PPS data; excludes topical antibacterials and anti-TB drugs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}