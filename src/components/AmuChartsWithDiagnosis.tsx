import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, ReferenceLine } from 'recharts';
import { Download } from 'lucide-react';
import { AMU_Human_Indication_MainDonut } from './AMU_Human_Indication_MainDonut';
import { AMU_Human_Diagnosis_MainDonut } from './AMU_Human_Diagnosis_MainDonut';

// Default diagnosis distribution data (top 10 + others) - Short Forms
const defaultDiagnosisDistributionData = [
  { name: 'Pneumonia or lower respiratory tract infection', code: 'Pneu', value: 18.5, color: '#3B82F6', prescriptions: 2467 },
  { name: 'Sepsis of unspecified origin', code: 'SEPSIS', value: 15.2, color: '#EF4444', prescriptions: 2028 },
  { name: 'Lower urinary tract infection (cystitis)', code: 'Cys', value: 12.8, color: '#10B981', prescriptions: 1708 },
  { name: 'Skin and soft tissue infection (non-surgical)', code: 'SST', value: 9.3, color: '#F59E0B', prescriptions: 1241 },
  { name: 'Upper urinary tract infection including catheter-associated infection', code: 'Pye', value: 8.7, color: '#8B5CF6', prescriptions: 1161 },
  { name: 'Gastrointestinal infection', code: 'GI', value: 6.4, color: '#06B6D4', prescriptions: 854 },
  { name: 'Central nervous system infection', code: 'CNS', value: 5.1, color: '#EC4899', prescriptions: 681 },
  { name: 'Bacteraemia or fungaemia without a primary focus', code: 'BAC', value: 4.2, color: '#84CC16', prescriptions: 560 },
  { name: 'Bone and joint infection (non-surgical)', code: 'BJ', value: 3.8, color: '#F97316', prescriptions: 507 },
  { name: 'Intra-abdominal sepsis', code: 'IA', value: 3.6, color: '#14B8A6', prescriptions: 481 },
  { name: 'Others', code: 'Other', value: 12.4, color: '#6B7280', prescriptions: 1655 }
];

// Eastern Regional Hospital specific diagnosis distribution data
const easternRegionalHospitalDiagnosisData = [
  { name: 'Prophylaxis for OBstetric or GYnaecological surgery', code: 'Proph OBGY', value: 22.5, color: '#3B82F6', prescriptions: 50 },
  { name: 'Pneumonia or lower respiratory tract infection', code: 'Pneu', value: 22.1, color: '#EF4444', prescriptions: 49 },
  { name: 'Skin and soft tissue infection (non-surgical)', code: 'SST', value: 9.0, color: '#10B981', prescriptions: 20 },
  { name: 'Drug is used as Medical Prophylaxis for Newborn risk factors e.g. VLBW and IUGR', code: 'NEO-MP', value: 8.6, color: '#F59E0B', prescriptions: 19 },
  { name: 'Upper urinary tract infection including catheter-associated infection', code: 'Pye', value: 5.9, color: '#8B5CF6', prescriptions: 13 },
  { name: 'Gastrointestinal infection', code: 'GI', value: 5.4, color: '#06B6D4', prescriptions: 12 },
  { name: 'Gastro-Intestinal tract surgery, liver/biliary tree, GI prophylaxis in neutropaenic patients or hepatic failure', code: 'Proph GI', value: 4.5, color: '#EC4899', prescriptions: 10 },
  { name: 'Sepsis of unspecified origin', code: 'SEPSIS', value: 4.1, color: '#84CC16', prescriptions: 9 },
  { name: 'Lower urinary tract infection (cystitis)', code: 'Cys', value: 2.7, color: '#F97316', prescriptions: 6 },
  { name: 'Obstetric and gynaecological infection', code: 'OBGY', value: 2.3, color: '#14B8A6', prescriptions: 5 },
  { name: 'Others (≤2.3% each)', code: 'Other', value: 13.1, color: '#6B7280', prescriptions: 29 }
];

// Filter options
const sexOptions = ['Female', 'Male', 'Unknown'];
const ageGroups = ['Neonates', 'Under 5', '5-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65-74', '75-84', '85-94', '95+'];
const hospitals = ['Eastern Regional Hospital', 'Korle-Bu Teaching Hospital', 'LEKMA Hospital', 'Ho Teaching Hospital'];
const hospitalActivities = ['Medical', 'Surgical', 'Intensive Care'];
const hospitalWards = ['Adult Medical Ward (AMW)', 'Adult Surgical Ward (ASW)', 'High-Risk Adult Ward (AHRW)', 'Adult Intensive Care Unit (AICU)', 'Paediatric Medical Ward (PMW)', 'Paediatric Surgical Ward (PSW)', 'High-Risk Paediatric Ward (PHRW)', 'Paediatric Intensive Care Unit (PICU)', 'Neonatal Medical Ward (NMW)', 'Neonatal Intensive Care Unit (NICU)', 'Mixed Ward (MXW)'];
const indications = ['Community-Acquired Infections (CAI)', 'Hospital-Acquired Infections (HAI)', 'Surgical Prophylaxis (SP)', 'Medical Prophylaxis (MP)'];

// Custom tooltip for diagnosis chart
const DiagnosisTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
        <div className="text-black font-medium text-sm mb-1">
          {data.name}
        </div>
        <div className="text-gray-600 text-sm mb-1">
          {data.prescriptions.toLocaleString()} prescriptions
        </div>
        <div className="text-cyan-600 font-medium text-sm">
          {data.value}% of total
        </div>
      </div>
    );
  }
  return null;
};

// Default indication distribution data
const defaultIndicationDistributionData = [
  { name: 'Community-Acquired Infections', code: 'CAI', value: 35.2, color: '#3b82f6', prescriptions: 4698 },
  { name: 'Hospital-Acquired Infections', code: 'HAI', value: 28.7, color: '#ef4444', prescriptions: 3831 },
  { name: 'Surgical Prophylaxis', code: 'SP', value: 18.5, color: '#16a34a', prescriptions: 2468 },
  { name: 'Medical Prophylaxis', code: 'MP', value: 12.3, color: '#8b5cf6', prescriptions: 1641 },
  { name: 'Other Indications', code: 'Other', value: 5.3, color: '#6b7280', prescriptions: 707 }
];

// Eastern Regional Hospital specific indication distribution data
const easternRegionalHospitalIndicationData = [
  { name: 'Surgical Prophylaxis', code: 'SP', value: 42.8, color: '#16a34a', prescriptions: 95 },
  { name: 'Community-Acquired Infections', code: 'CAI', value: 32.4, color: '#3b82f6', prescriptions: 72 },
  { name: 'Medical Prophylaxis', code: 'MP', value: 16.2, color: '#8b5cf6', prescriptions: 36 },
  { name: 'Hospital-Acquired Infections', code: 'HAI', value: 6.3, color: '#ef4444', prescriptions: 14 },
  { name: 'Other Indications', code: 'Other', value: 2.3, color: '#6b7280', prescriptions: 5 }
];

// Custom tooltip for indication chart
const IndicationTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
        <div className="text-black font-medium text-sm mb-1">
          {data.name}
        </div>
        <div className="text-gray-600 text-sm mb-1">
          {data.prescriptions.toLocaleString()} prescriptions
        </div>
        <div className="text-cyan-600 font-medium text-sm">
          {data.value}% of total
        </div>
      </div>
    );
  }
  return null;
};

// Indication Profile Aggregate Component
export function IndicationProfileAggregate() {
  // Filter system for indication chart
  const [indicationFilterType, setIndicationFilterType] = useState('');
  const [indicationFilterValue, setIndicationFilterValue] = useState('');
  const [indicationActiveFilters, setIndicationActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Compute data and totals based on active filters
  const computedIndicationData = useMemo(() => {
    // Check if Eastern Regional Hospital is selected
    const hasEasternRegionalHospital = indicationActiveFilters.some(
      filter => filter.type === 'hospital' && filter.value === 'Eastern Regional Hospital'
    );

    if (hasEasternRegionalHospital) {
      return {
        data: easternRegionalHospitalIndicationData,
        totalPrescriptions: 222,
        hospitalName: 'Eastern Regional Hospital'
      };
    }

    return {
      data: defaultIndicationDistributionData,
      totalPrescriptions: 13345,
      hospitalName: 'All Hospitals'
    };
  }, [indicationActiveFilters]);

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

  const indicationFilterHelpers = {
    addFilter: () => {
      if (indicationFilterType && indicationFilterValue) {
        const typeLabel = filterTypeOptions.find(t => t.value === indicationFilterType)?.label || indicationFilterType;
        const newFilter = {
          type: indicationFilterType,
          value: indicationFilterValue,
          label: `${typeLabel}: ${indicationFilterValue}`
        };
        
        if (!indicationActiveFilters.some(f => f.type === indicationFilterType && f.value === indicationFilterValue)) {
          setIndicationActiveFilters([...indicationActiveFilters, newFilter]);
        }
        
        setIndicationFilterType('');
        setIndicationFilterValue('');
      }
    },
    removeFilter: (index: number) => {
      setIndicationActiveFilters(indicationActiveFilters.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setIndicationActiveFilters([]);
    }
  };

  return (
    <div className="space-y-6">
      <AMU_Human_Indication_MainDonut />
      

    </div>
  );
}

// Diagnosis Profile View Component
export function DiagnosisProfileView() {
  // Filter system for diagnosis chart
  const [diagnosisFilterType, setDiagnosisFilterType] = useState('');
  const [diagnosisFilterValue, setDiagnosisFilterValue] = useState('');
  const [diagnosisActiveFilters, setDiagnosisActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Compute data and totals based on active filters
  const computedDiagnosisData = useMemo(() => {
    // Check if Eastern Regional Hospital is selected
    const hasEasternRegionalHospital = diagnosisActiveFilters.some(
      filter => filter.type === 'hospital' && filter.value === 'Eastern Regional Hospital'
    );

    if (hasEasternRegionalHospital) {
      return {
        data: easternRegionalHospitalDiagnosisData,
        totalPrescriptions: 222,
        hospitalName: 'Eastern Regional Hospital'
      };
    }

    return {
      data: defaultDiagnosisDistributionData,
      totalPrescriptions: 13343,
      hospitalName: 'All Hospitals'
    };
  }, [diagnosisActiveFilters]);

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

  const diagnosisFilterHelpers = {
    addFilter: () => {
      if (diagnosisFilterType && diagnosisFilterValue) {
        const typeLabel = filterTypeOptions.find(t => t.value === diagnosisFilterType)?.label || diagnosisFilterType;
        const newFilter = {
          type: diagnosisFilterType,
          value: diagnosisFilterValue,
          label: `${typeLabel}: ${diagnosisFilterValue}`
        };
        
        if (!diagnosisActiveFilters.some(f => f.type === diagnosisFilterType && f.value === diagnosisFilterValue)) {
          setDiagnosisActiveFilters([...diagnosisActiveFilters, newFilter]);
        }
        
        setDiagnosisFilterType('');
        setDiagnosisFilterValue('');
      }
    },
    removeFilter: (index: number) => {
      setDiagnosisActiveFilters(diagnosisActiveFilters.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setDiagnosisActiveFilters([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Diagnosis Distribution Chart */}
      <AMU_Human_Diagnosis_MainDonut />
    </div>
  );
}