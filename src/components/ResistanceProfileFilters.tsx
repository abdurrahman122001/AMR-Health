import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';

export interface ResistanceFilter {
  type: string;
  value: string;
  label: string;
}

interface ResistanceProfileFiltersProps {
  onFiltersChange: (filters: ResistanceFilter[]) => void;
  activeFilters: ResistanceFilter[];
}

const RESISTANCE_FILTER_OPTIONS = {
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

export function ResistanceProfileFilters({ onFiltersChange, activeFilters }: ResistanceProfileFiltersProps) {
  const [selectedFilterType, setSelectedFilterType] = useState<string>('');
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>('');

  const addFilter = () => {
    if (selectedFilterType && selectedFilterValue) {
      const filterType = RESISTANCE_FILTER_OPTIONS[selectedFilterType as keyof typeof RESISTANCE_FILTER_OPTIONS];
      const filterOption = filterType.options.find(opt => opt.value === selectedFilterValue);
      
      if (filterOption) {
        const newFilter: ResistanceFilter = {
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
    ? RESISTANCE_FILTER_OPTIONS[selectedFilterType as keyof typeof RESISTANCE_FILTER_OPTIONS]?.options || []
    : [];

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <div>
        <h3 className="mb-3 font-bold">Filter Resistance Data</h3>
        
        {/* Filter Selection Controls */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm mb-1">Filter Type</label>
            <Select 
              value={selectedFilterType} 
              onValueChange={(value) => {
                setSelectedFilterType(value);
                setSelectedFilterValue(''); // Reset value when type changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select filter type..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RESISTANCE_FILTER_OPTIONS).map(([key, option]) => (
                  <SelectItem key={key} value={key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm mb-1">Filter Value</label>
            <Select 
              value={selectedFilterValue} 
              onValueChange={setSelectedFilterValue}
              disabled={!selectedFilterType}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedFilterType ? "Select value..." : "Select type first"} />
              </SelectTrigger>
              <SelectContent>
                {availableFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={addFilter}
            disabled={!selectedFilterType || !selectedFilterValue}
          >
            Add Filter
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm">Active Filters ({activeFilters.length})</h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="flex items-center gap-2 px-3 py-1"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => removeFilter(index)}
                  className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}