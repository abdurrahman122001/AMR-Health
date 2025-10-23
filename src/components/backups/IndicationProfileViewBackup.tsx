// INDICATION PROFILE VIEW BACKUP - Current Working Version
// This file contains the complete Indication Profile view from AmuCharts component
// Last updated: Current restoration version

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// WHO ATC4 classes for systemic antibacterials (J01) - sample data distribution by indication
const indicationATC4Data = [
  { 
    indication: 'CAI', 
    J01CR: 28.5, // Penicillin + β-lactamase inhibitor
    J01DD: 18.2, // 3rd-gen cephalosporins
    J01MA: 15.8, // Fluoroquinolones
    J01FA: 12.4, // Macrolides
    J01CA: 8.7,  // Penicillins w/ extended spectrum
    J01DH: 5.9,  // Carbapenems
    J01EE: 4.2,  // Sulfonamides + trimethoprim
    J01XD: 3.8,  // Imidazole derivatives
    J01XX: 2.5   // Other antibacterials
  },
  { 
    indication: 'HAI', 
    J01DH: 32.1, // Carbapenems
    J01DD: 24.8, // 3rd-gen cephalosporins
    J01MA: 18.5, // Fluoroquinolones
    J01XA: 8.9,  // Glycopeptides
    J01CR: 6.7,  // Penicillin + β-lactamase inhibitor
    J01GB: 4.3,  // Other aminoglycosides
    J01XB: 2.8,  // Polymyxins
    J01DE: 1.9   // 4th-gen cephalosporins
  },
  { 
    indication: 'SP', 
    J01CR: 38.4, // Penicillin + β-lactamase inhibitor
    J01DB: 22.6, // 1st-gen cephalosporins
    J01DD: 15.3, // 3rd-gen cephalosporins
    J01XD: 12.8, // Imidazole derivatives
    J01CA: 6.2,  // Penicillins w/ extended spectrum
    J01EE: 4.7   // Sulfonamides + trimethoprim
  },
  { 
    indication: 'MP', 
    J01EE: 26.7, // Sulfonamides + trimethoprim
    J01CR: 18.9, // Penicillin + β-lactamase inhibitor
    J01MA: 16.2, // Fluoroquinolones
    J01FA: 14.5, // Macrolides
    J01XE: 8.8,  // Nitrofuran derivatives
    J01CA: 7.3,  // Penicillins w/ extended spectrum
    J01DD: 4.8,  // 3rd-gen cephalosporins
    J01XD: 2.8   // Imidazole derivatives
  },
  { 
    indication: 'Other', 
    J01MA: 24.1, // Fluoroquinolones
    J01CR: 19.3, // Penicillin + β-lactamase inhibitor
    J01DD: 16.8, // 3rd-gen cephalosporins
    J01FA: 12.6, // Macrolides
    J01CA: 9.4,  // Penicillins w/ extended spectrum
    J01EE: 8.2,  // Sulfonamides + trimethoprim
    J01XD: 5.3,  // Imidazole derivatives
    J01XX: 4.3   // Other antibacterials
  }
];

// Eastern Regional Hospital (ERH) specific ATC4 distribution by indication
const erhIndicationATC4Data = [
  { 
    indication: 'CAI', 
    sampleSize: 91,
    J01CA: 16.5, // Penicillins, extended spectrum
    J01DD: 15.4, // Cephalosporins, 3rd gen
    J01DC: 12.1, // Cephalosporins, 2nd gen
    J01GB: 12.1, // Other aminoglycosides
    J01MA: 8.8,  // Fluoroquinolones
    J01XD: 8.8,  // Imidazoles
    J01FF: 7.7,  // Lincosamides
    J01DH: 6.6,  // Carbapenems
    J01CE: 4.4,  // β-lactamase-sensitive penicillins
    J01CR: 4.4,  // Penicillin + β-lactamase inhibitor
    J01FA: 2.2,  // Macrolides
    J01XX: 1.1   // OTHER ATC4 (≤2% each)
  },
  { 
    indication: 'HAI', 
    sampleSize: 31,
    J01DD: 29.0, // Cephalosporins, 3rd gen
    J01CA: 25.8, // Penicillins, extended spectrum
    J01GB: 12.9, // Other aminoglycosides
    J01DC: 6.5,  // Cephalosporins, 2nd gen
    J01FA: 6.5,  // Macrolides
    J01XD: 6.5,  // Imidazoles
    J01AA: 3.2,  // Tetracyclines
    J01CR: 3.2,  // Penicillin + β-lactamase inhibitor
    J01DH: 3.2,  // Carbapenems
    J01MA: 3.2   // Fluoroquinolones
  },
  { 
    indication: 'SP', 
    sampleSize: 61,
    J01CA: 50.8, // Penicillins, extended spectrum
    J01XD: 24.6, // Imidazoles
    J01MA: 6.6,  // Fluoroquinolones
    J01DC: 4.9,  // Cephalosporins, 2nd gen
    J01DD: 4.9,  // Cephalosporins, 3rd gen
    J01FF: 4.9,  // Lincosamides
    J01CR: 3.3   // Penicillin + β-lactamase inhibitor
  },
  { 
    indication: 'MP', 
    sampleSize: 36,
    J01CA: 38.9, // Penicillins, extended spectrum
    J01GB: 30.6, // Other aminoglycosides
    J01DD: 16.7, // Cephalosporins, 3rd gen
    J01CR: 5.6,  // Penicillin + β-lactamase inhibitor
    J01CE: 2.8,  // β-lactamase-sensitive penicillins
    J01DH: 2.8,  // Carbapenems
    J01XD: 2.8   // Imidazoles
  },
  { 
    indication: 'Other', 
    sampleSize: 3,
    J01CA: 33.3, // Penicillins, extended spectrum
    J01DC: 33.3, // Cephalosporins, 2nd gen
    J01FF: 33.3  // Lincosamides
  }
];

// WHO ATC4 class definitions and colors organized by category families
const ATC4_DEFINITIONS = {
  // Tetracyclines (Brown family)
  J01AA: { label: 'Tetracyclines', color: '#8B4513' },
  
  // Amphenicols (Saddle brown family)
  J01BA: { label: 'Amphenicols', color: '#A0522D' },
  
  // Penicillins (Blue family - various shades)
  J01CA: { label: 'Penicillins w/ extended spectrum', color: '#3B82F6' },
  J01CE: { label: 'β-lactamase-sensitive penicillins', color: '#1E40AF' },
  J01CF: { label: 'β-lactamase-resistant penicillins', color: '#1D4ED8' },
  J01CG: { label: 'β-lactamase inhibitors', color: '#2563EB' },
  J01CR: { label: 'Penicillin + β-lactamase inhibitor', color: '#60A5FA' },
  
  // Other Beta-lactams - Cephalosporins/Carbapenems/Monobactams (Red family)
  J01DB: { label: '1st-gen cephalosporins', color: '#EF4444' },
  J01DC: { label: '2nd-gen cephalosporins', color: '#DC2626' },
  J01DD: { label: '3rd-gen cephalosporins', color: '#B91C1C' },
  J01DE: { label: '4th-gen cephalosporins', color: '#991B1B' },
  J01DF: { label: 'Monobactams', color: '#7F1D1D' },
  J01DH: { label: 'Carbapenems', color: '#450A0A' },
  J01DI: { label: 'Other cephalosporins/penems', color: '#FCA5A5' },
  
  // Sulfonamides & Trimethoprim (Cyan family)
  J01EA: { label: 'Trimethoprim and derivatives', color: '#06B6D4' },
  J01EB: { label: 'Short-acting sulfonamides', color: '#0891B2' },
  J01EC: { label: 'Intermediate-acting sulfonamides', color: '#0E7490' },
  J01ED: { label: 'Long-acting sulfonamides', color: '#155E75' },
  J01EE: { label: 'Sulfonamides + trimethoprim', color: '#0C4A6E' },
  
  // Macrolides, Lincosamides, Streptogramins (Green family)
  J01FA: { label: 'Macrolides', color: '#22C55E' },
  J01FF: { label: 'Lincosamides', color: '#16A34A' },
  J01FG: { label: 'Streptogramins', color: '#15803D' },
  
  // Aminoglycosides (Dark green family)
  J01GA: { label: 'Streptomycin', color: '#166534' },
  J01GB: { label: 'Other aminoglycosides', color: '#14532D' },
  
  // Quinolones (Orange family)
  J01MA: { label: 'Fluoroquinolones', color: '#F97316' },
  J01MB: { label: 'Other quinolones', color: '#EA580C' },
  
  // Other antibacterials (Purple/Violet family)
  J01XA: { label: 'Glycopeptides', color: '#8B5CF6' },
  J01XB: { label: 'Polymyxins', color: '#7C3AED' },
  J01XC: { label: 'Steroid antibacterials (fusidic acid)', color: '#6D28D9' },
  J01XD: { label: 'Imidazole derivatives', color: '#5B21B6' },
  J01XE: { label: 'Nitrofuran derivatives', color: '#4C1D95' },
  J01XX: { label: 'Other antibacterials', color: '#581C87' },
  
  // Combinations (Gray family)
  J01RA: { label: 'Combinations of antibacterials', color: '#6B7280' }
};

// Extract colors for chart rendering
const ATC4_COLORS = Object.fromEntries(
  Object.entries(ATC4_DEFINITIONS).map(([code, info]) => [code, info.color])
);

// Filter options
const sexOptions = ['Female', 'Male', 'Unknown'];
const ageGroups = ['Neonates', 'Under 5', '5-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65-74', '75-84', '85-94', '95+'];
const hospitals = ['Eastern Regional Hospital', 'Korle-Bu Teaching Hospital', 'LEKMA Hospital', 'Ho Teaching Hospital'];
const hospitalActivities = ['Medical', 'Surgical', 'Intensive Care'];
const hospitalWards = ['Adult Medical Ward (AMW)', 'Adult Surgical Ward (ASW)', 'High-Risk Adult Ward (AHRW)', 'Adult Intensive Care Unit (AICU)', 'Paediatric Medical Ward (PMW)', 'Paediatric Surgical Ward (PSW)', 'High-Risk Paediatric Ward (PHRW)', 'Paediatric Intensive Care Unit (PICU)', 'Neonatal Medical Ward (NMW)', 'Neonatal Intensive Care Unit (NICU)', 'Mixed Ward (MXW)'];
const indications = ['Community-Acquired Infections (CAI)', 'Hospital-Acquired Infections (HAI)', 'Surgical Prophylaxis (SP)', 'Medical Prophylaxis (MP)'];

// Custom tooltip for ATC4 indications chart - simplified format
const ATC4Tooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Get the segment that's actually being hovered (the last one in payload for stacked bars)
    const hoveredSegment = payload[payload.length - 1];
    
    if (hoveredSegment && hoveredSegment.value > 0) {
      const atc4Code = hoveredSegment.dataKey;
      const percentage = hoveredSegment.value.toFixed(1);
      const atc4Definition = ATC4_DEFINITIONS[atc4Code];
      
      // Calculate estimated prescription count (using a base multiplier for demonstration)
      const estimatedPrescriptions = Math.round((hoveredSegment.value * 252) / 10); // Scaled for demo
      
      return (
        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
          <div className="text-black font-medium text-sm mb-1">
            {atc4Definition?.label || 'Unknown'} — {atc4Code}
          </div>
          <div className="text-gray-600 text-sm mb-1">
            {estimatedPrescriptions.toLocaleString()} prescriptions
          </div>
          <div className="text-cyan-600 font-medium text-sm">
            {percentage}% of total
          </div>
        </div>
      );
    }
  }
  return null;
};

export function IndicationProfileView() {
  // Filter system for indications chart
  const [indicationsFilterType, setIndicationsFilterType] = useState('');
  const [indicationsFilterValue, setIndicationsFilterValue] = useState('');
  const [indicationsActiveFilters, setIndicationsActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

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

  // Memoized function to get indication ATC4 data based on hospital filter
  const getIndicationATC4Data = useMemo(() => {
    // Check if Eastern Regional Hospital is selected in the active filters
    const hasERHFilter = indicationsActiveFilters.some(
      filter => filter.type === 'hospital' && filter.value === 'Eastern Regional Hospital'
    );
    
    return hasERHFilter ? erhIndicationATC4Data : indicationATC4Data;
  }, [indicationsActiveFilters]);

  const addFilter = () => {
    if (indicationsFilterType && indicationsFilterValue) {
      const typeLabel = filterTypeOptions.find(t => t.value === indicationsFilterType)?.label || indicationsFilterType;
      const newFilter = {
        type: indicationsFilterType,
        value: indicationsFilterValue,
        label: `${typeLabel}: ${indicationsFilterValue}`
      };
      
      if (!indicationsActiveFilters.some(f => f.type === indicationsFilterType && f.value === indicationsFilterValue)) {
        setIndicationsActiveFilters([...indicationsActiveFilters, newFilter]);
      }
      
      setIndicationsFilterType('');
      setIndicationsFilterValue('');
    }
  };

  const removeFilter = (index: number) => {
    setIndicationsActiveFilters(indicationsActiveFilters.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setIndicationsActiveFilters([]);
  };

  return (
    <div className="space-y-6">
      {/* Distribution of Antimicrobial Classes by Indication Type Chart */}
      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">
              Distribution of Antimicrobial Classes by Indication Type
            </CardTitle>
            <div className="text-sm text-gray-600">
              ATC4 class breakdown by indication category
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={indicationsFilterType} onValueChange={setIndicationsFilterType}>
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
              
              {indicationsFilterType && (
                <>
                  <Select value={indicationsFilterValue} onValueChange={setIndicationsFilterValue}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilterValueOptions(indicationsFilterType).map((option) => (
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
              
              {indicationsActiveFilters.length > 0 && (
                <Button onClick={clearAllFilters} variant="outline">
                  Clear All
                </Button>
              )}
            </div>
            
            {/* Active Filters */}
            {indicationsActiveFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {indicationsActiveFilters.map((filter, index) => (
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
            <BarChart 
              data={getIndicationATC4Data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="indication" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis 
                label={{ 
                  value: '% of Indication Total', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '13px', fontWeight: 'bold' }
                }}
                domain={[0, 100]}
                ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                tick={{ fontSize: 10 }}
              />
              
              {/* ATC4 Bars - dynamically render based on available codes */}
              {Object.keys(ATC4_COLORS).map((atc4Code) => (
                <Bar 
                  key={atc4Code}
                  dataKey={atc4Code} 
                  stackId="atc4"
                  fill={ATC4_COLORS[atc4Code]} 
                  name={ATC4_DEFINITIONS[atc4Code]?.label || atc4Code}
                />
              ))}
              
              <Tooltip 
                shared={false}
                cursor={{ fill: 'transparent' }}
                content={ATC4Tooltip}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}