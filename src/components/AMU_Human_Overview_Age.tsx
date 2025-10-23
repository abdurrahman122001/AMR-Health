import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

// Age group prevalence data - 100% antimicrobial usage
const ageGroupData = [
  { ageGroup: 'Neonates', prevalence: 100.0, hospitals: 11, surveys: 23, patients: 95 },
  { ageGroup: 'Under 5', prevalence: 100.0, hospitals: 15, surveys: 31, patients: 142 },
  { ageGroup: '5-14', prevalence: 100.0, hospitals: 12, surveys: 26, patients: 78 },
  { ageGroup: '15-24', prevalence: 100.0, hospitals: 14, surveys: 29, patients: 89 },
  { ageGroup: '25-34', prevalence: 100.0, hospitals: 15, surveys: 32, patients: 123 },
  { ageGroup: '35-44', prevalence: 100.0, hospitals: 15, surveys: 33, patients: 156 },
  { ageGroup: '45-54', prevalence: 100.0, hospitals: 14, surveys: 30, patients: 134 },
  { ageGroup: '55-64', prevalence: 100.0, hospitals: 13, surveys: 28, patients: 98 },
  { ageGroup: '65-74', prevalence: 100.0, hospitals: 12, surveys: 25, patients: 67 },
  { ageGroup: '75-84', prevalence: 100.0, hospitals: 10, surveys: 21, patients: 45 },
  { ageGroup: '85-94', prevalence: 100.0, hospitals: 8, surveys: 17, patients: 23 },
  { ageGroup: '95+', prevalence: 100.0, hospitals: 5, surveys: 12, patients: 20 }
];

// Filter options
const sexOptions = ['Female', 'Male', 'Unknown'];
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

export function AMU_Human_Overview_Age() {
  // Filter states
  const [ageFilterType, setAgeFilterType] = useState('');
  const [ageFilterValue, setAgeFilterValue] = useState('');
  const [ageActiveFilters, setAgeActiveFilters] = useState<Filter[]>([]);

  // Get filter value options based on type
  const getFilterValueOptions = (filterType: string) => {
    switch (filterType) {
      case 'sex':
        return sexOptions.map(s => ({ value: s, label: s }));
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
  const ageFilterHelpers = {
    addFilter: () => {
      if (ageFilterType && ageFilterValue) {
        const typeLabel = filterTypeOptions.find(t => t.value === ageFilterType)?.label || ageFilterType;
        const newFilter: Filter = {
          type: ageFilterType,
          value: ageFilterValue,
          label: `${typeLabel}: ${ageFilterValue}`
        };
        
        if (!ageActiveFilters.some(f => f.type === ageFilterType && f.value === ageFilterValue)) {
          setAgeActiveFilters([...ageActiveFilters, newFilter]);
        }
        
        setAgeFilterType('');
        setAgeFilterValue('');
      }
    },
    removeFilter: (index: number) => {
      setAgeActiveFilters(ageActiveFilters.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setAgeActiveFilters([]);
    }
  };

  // Get filtered data (in real implementation, this would apply actual filtering)
  const getFilteredAgeGroupData = () => {
    // For now, return original data. In real implementation, apply active filters
    return ageGroupData;
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pt-[24px] pr-[24px] pb-[10px] pl-[24px]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Age Profile of AMU Prevalence</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              // Add download functionality here
              console.log('Download AMU Age prevalence data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Share of Patient records with ≥1 Systemic Antibacterial (J01) Prescribed • Total: {ageGroupData.reduce((total, group) => total + group.patients, 0).toLocaleString()} records
        </p>
        
        {/* Active Filters Display */}
        {ageActiveFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({ageActiveFilters.length})
              </span>
              <button
                onClick={ageFilterHelpers.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {ageActiveFilters.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => ageFilterHelpers.removeFilter(index)}
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
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={getFilteredAgeGroupData().map(item => ({
                ...item,
                withAntimicrobial: item.prevalence,
                withoutAntimicrobial: 100 - item.prevalence
              }))} margin={{ top: 0, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="ageGroup" 
                  angle={-45}
                  textAnchor="end"
                  height={40}
                  fontSize={10}
                  label={{ 
                    value: 'Age Group (Years)', 
                    position: 'insideBottom',
                    offset: -10,
                    style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                  }}
                />
                <YAxis 
                  label={{ 
                    value: '% Patients', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                  }}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload;
                      const withAntimicrobial = data.withAntimicrobial;
                      const withoutAntimicrobial = data.withoutAntimicrobial;
                      
                      return (
                        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[220px]">
                          <div className="text-gray-900 font-medium mb-1" style={{ fontStyle: 'italic' }}>
                            <strong>{label} Years</strong>
                          </div>
                          <div className="text-gray-600 text-sm mb-2">
                            <span 
                              className="font-medium text-sm"
                              style={{ color: '#dc2626' }}
                            >
                              {withAntimicrobial}% antimicrobial usage
                            </span>
                          </div>
                          <div className="text-gray-500 text-sm">
                            All patients received antimicrobials
                          </div>
                          <div className="text-gray-500 text-sm">
                             Surveys: {data.surveys}
                          </div>
                          <div className="text-gray-500 text-sm">
                             Hospitals: {data.hospitals}
                          </div>
                          <div className="text-gray-500 text-sm">
                            Patients: {data.patients}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="withAntimicrobial" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Filter Panel */}
          <div className="w-64 bg-gray-50 rounded-lg p-4 border self-start" style={{ height: '290px' }}>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Filter Age Group Data</h3>
              
              {/* Filter Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
                <Select value={ageFilterType} onValueChange={setAgeFilterType}>
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
                  value={ageFilterValue} 
                  onValueChange={setAgeFilterValue}
                  disabled={!ageFilterType}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder={ageFilterType ? "Select value..." : "Select type first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilterValueOptions(ageFilterType).map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Filter Button */}
              <button
                onClick={ageFilterHelpers.addFilter}
                disabled={!ageFilterType || !ageFilterValue}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                Add Filter
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-[30px] pt-4 border-t border-gray-200 mr-[0px] mb-[0px] ml-[0px]">
          <p className="text-xs text-gray-500">
            PPS data; excludes topical antibacterials and anti-TB drugs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}