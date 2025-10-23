import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Hospital data
const hospitalData = [
  { hospital: 'Korle-Bu TH', region: 'Greater Accra', prevalence: 84.2, patients: 450 },
  { hospital: 'Komfo Anokye TH', region: 'Ashanti', prevalence: 81.7, patients: 425 },
  { hospital: 'Ridge Hospital', region: 'Greater Accra', prevalence: 79.3, patients: 380 },
  { hospital: 'Cape Coast TH', region: 'Central', prevalence: 76.8, patients: 340 },
  { hospital: 'Tamale TH', region: 'Northern', prevalence: 74.5, patients: 315 },
  { hospital: '37 Military Hospital', region: 'Greater Accra', prevalence: 78.1, patients: 295 },
  { hospital: 'Ho Teaching Hospital', region: 'Volta', prevalence: 72.6, patients: 285 },
  { hospital: 'Effia Nkwanta RH', region: 'Western', prevalence: 75.9, patients: 275 },
  { hospital: 'Sunyani RH', region: 'Brong Ahafo', prevalence: 73.4, patients: 260 },
  { hospital: 'Bolgatanga RH', region: 'Upper East', prevalence: 70.2, patients: 245 }
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

export function AMU_Human_Overview_Hospital() {
  // Filter states
  const [hospitalFilterType, setHospitalFilterType] = useState('');
  const [hospitalFilterValue, setHospitalFilterValue] = useState('');
  const [hospitalActiveFilters, setHospitalActiveFilters] = useState<Filter[]>([]);

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
  const hospitalFilterHelpers = {
    addFilter: () => {
      if (hospitalFilterType && hospitalFilterValue) {
        const typeLabel = filterTypeOptions.find(t => t.value === hospitalFilterType)?.label || hospitalFilterType;
        const newFilter: Filter = {
          type: hospitalFilterType,
          value: hospitalFilterValue,
          label: `${typeLabel}: ${hospitalFilterValue}`
        };
        
        if (!hospitalActiveFilters.some(f => f.type === hospitalFilterType && f.value === hospitalFilterValue)) {
          setHospitalActiveFilters([...hospitalActiveFilters, newFilter]);
        }
        
        setHospitalFilterType('');
        setHospitalFilterValue('');
      }
    },
    removeFilter: (index: number) => {
      setHospitalActiveFilters(hospitalActiveFilters.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setHospitalActiveFilters([]);
    }
  };

  // Get filtered data (in real implementation, this would apply actual filtering)
  const getFilteredHospitalData = () => {
    // For now, return original data. In real implementation, apply active filters
    return hospitalData;
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium">AMU Prevalence by Hospital</CardTitle>
        <p className="text-sm text-gray-600 m-[0px]">Share of patients on ≥1 antimicrobial, by teaching hospital</p>
        
        {/* Active Filters Display */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Active Filters ({hospitalActiveFilters.length})
            </span>
            {hospitalActiveFilters.length > 0 && (
              <button
                onClick={hospitalFilterHelpers.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2">
            {hospitalActiveFilters.map((filter, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => hospitalFilterHelpers.removeFilter(index)}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {hospitalActiveFilters.length === 0 && (
            <p className="text-sm text-gray-500 italic">No active filters</p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          {/* Main Chart Area */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={getFilteredHospitalData()} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="hospital" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                            Region: {data.region}, {data.patients} patients
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="prevalence" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Filter Panel */}
          <div className="w-64 bg-gray-50 rounded-lg p-4 border self-start" style={{ height: '315px' }}>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Filter Hospital Data</h3>
              
              {/* Filter Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
                <Select value={hospitalFilterType} onValueChange={setHospitalFilterType}>
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
                  value={hospitalFilterValue} 
                  onValueChange={setHospitalFilterValue}
                  disabled={!hospitalFilterType}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder={hospitalFilterType ? "Select value..." : "Select type first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilterValueOptions(hospitalFilterType).map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Filter Button */}
              <button
                onClick={hospitalFilterHelpers.addFilter}
                disabled={!hospitalFilterType || !hospitalFilterValue}
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