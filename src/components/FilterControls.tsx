import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';

export interface Filter {
  type: string;
  value: string;
  label: string;
}

interface FilterControlsProps {
  onFiltersChange: (filters: Filter[]) => void;
  activeFilters: Filter[];
}

const FILTER_OPTIONS = {
  facility: {
    label: 'Facility',
    options: [
      { value: 'cape_coast', label: 'Cape Coast Teaching Hospital' },
      { value: 'eastern_regional', label: 'Eastern Regional Hospital' },
      { value: 'ho_teaching', label: 'Ho Teaching Hospital' },
      { value: 'komfo_anokye', label: 'Komfo Anokye Teaching Hospital' },
      { value: 'korle_bu', label: 'Korle-Bu Teaching Hospital' },
      { value: 'lekma', label: 'LEKMA Hospital' },
      { value: 'nphl', label: 'National Public Health Reference Laboratory' },
      { value: 'sekondi_phl', label: 'Sekondi Public Health Reference Laboratory' },
      { value: 'st_martin', label: 'St. Martin de Porres Hospital' },
      { value: 'sunyani', label: 'Sunyani Teaching Hospital' },
      { value: 'tamale', label: 'Tamale Teaching Hospital' }
    ]
  },
  ward: {
    label: 'Ward/Unit',
    options: [
      { value: 'medical', label: 'Medical (MED)' },
      { value: 'pediatric', label: 'Pediatrics (PED)' },
      { value: 'outpatient', label: 'Outpatient (OUT)' },
      { value: 'nicu', label: 'Neonatal Intensive Care Unit (NICU)' },
      { value: 'obg', label: 'Obstetrics & Gynecology (OBG)' },
      { value: 'surgery', label: 'Surgery (SUR)' },
      { value: 'icu', label: 'Intensive Care Unit (ICU)' }
    ]
  },
  sex: {
    label: 'Sex',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'unknown', label: 'Unknown/Not Specified' }
    ]
  },
  year: {
    label: 'Year',
    options: [
      { value: '2024', label: '2024' },
      { value: '2023', label: '2023' },
      { value: '2022', label: '2022' },
      { value: '2021', label: '2021' },
      { value: '2020', label: '2020' }
    ]
  },
  specimen: {
    label: 'Specimen Source',
    options: [
      { value: 'blood', label: 'Blood Culture' },
      { value: 'respiratory', label: 'Respiratory' },
      { value: 'urine', label: 'Urine Culture' },
      { value: 'wound', label: 'Wound/Tissue' },
      { value: 'csf', label: 'Cerebrospinal Fluid' },
      { value: 'peritoneal', label: 'Peritoneal Fluid' },
      { value: 'catheter', label: 'Catheter Tip' },
      { value: 'other', label: 'Other Sources' }
    ]
  },
  age: {
    label: 'Age',
    options: [
      { value: 'neonates', label: 'Neonates' },
      { value: '<5y', label: '<5y' },
      { value: '5-14', label: '5-14 years' },
      { value: '15-24', label: '15-24 years' },
      { value: '25-34', label: '25-34 years' },
      { value: '35-44', label: '35-44 years' },
      { value: '45-54', label: '45-54 years' },
      { value: '55-64', label: '55-64 years' },
      { value: '65-74', label: '65-74 years' },
      { value: '75-84', label: '75-84 years' },
      { value: '85-94', label: '85-94 years' },
      { value: '95-99', label: '95-99 years' }
    ]
  }
};

export function FilterControls({ onFiltersChange, activeFilters }: FilterControlsProps) {
  const [selectedFilterType, setSelectedFilterType] = useState<string>('');
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>('');

  const addFilter = () => {
    if (selectedFilterType && selectedFilterValue) {
      const filterType = FILTER_OPTIONS[selectedFilterType as keyof typeof FILTER_OPTIONS];
      const filterOption = filterType.options.find(opt => opt.value === selectedFilterValue);
      
      if (filterOption) {
        const newFilter: Filter = {
          type: selectedFilterType,
          value: selectedFilterValue,
          label: `${filterType.label}: ${filterOption.label}`
        };

        // Check if this exact filter already exists
        const exists = activeFilters.some(
          filter => filter.type === newFilter.type && filter.value === newFilter.value
        );

        if (!exists) {
          onFiltersChange([...activeFilters, newFilter]);
        }
      }

      // Reset selections
      setSelectedFilterType('');
      setSelectedFilterValue('');
    }
  };

  const removeFilter = (index: number) => {
    const newFilters = activeFilters.filter((_, i) => i !== index);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const availableFilterOptions = selectedFilterType 
    ? FILTER_OPTIONS[selectedFilterType as keyof typeof FILTER_OPTIONS]?.options || []
    : [];

  return null;
}