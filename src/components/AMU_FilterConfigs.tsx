import React from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  type: string;
  label: string;
  options: FilterOption[];
}

export interface ActiveFilter {
  label: string;
  type: string;
  value: string;
}

// Default filter configurations for AMU dashboard
export const AMU_FILTER_CONFIGS: FilterConfig[] = [
  {
    type: 'hospital',
    label: 'Hospital',
    options: [
      { value: 'ho_teaching', label: 'Ho Teaching Hospital' },
      { value: 'komfo_anokye', label: 'Komfo Anokye Teaching Hospital' },
      { value: 'tamale_teaching', label: 'Tamale Teaching Hospital' },
      { value: 'lekma', label: 'LEKMA Hospital' },
      { value: 'sunyani_teaching', label: 'Sunyani Teaching Hospital' },
      { value: 'st_martin', label: 'St. Martin de Porres Hospital' },
      { value: 'korle_bu', label: 'Korle-Bu Teaching Hospital' },
      { value: 'cape_coast', label: 'Cape Coast Teaching Hospital' },
      { value: 'eastern_regional', label: 'Eastern Regional Hospital' },
      { value: 'ug_medical_center', label: 'University of Ghana Medical Center' }
    ]
  },
  {
    type: 'ward',
    label: 'Ward/Unit',
    options: [
      { value: 'medical', label: 'Medical Ward' },
      { value: 'surgical', label: 'Surgical Ward' },
      { value: 'icu', label: 'Intensive Care Unit' },
      { value: 'emergency', label: 'Emergency Department' },
      { value: 'paediatric', label: 'Paediatric Ward' },
      { value: 'maternity', label: 'Maternity Ward' },
      { value: 'orthopedic', label: 'Orthopedic Ward' },
      { value: 'oncology', label: 'Oncology Ward' },
      { value: 'cardiology', label: 'Cardiology Ward' },
      { value: 'nephrology', label: 'Nephrology Ward' }
    ]
  },
  {
    type: 'sex',
    label: 'Sex',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' }
    ]
  },
  {
    type: 'year',
    label: 'Year',
    options: [
      { value: '2024', label: '2024' },
      { value: '2023', label: '2023' },
      { value: '2022', label: '2022' },
      { value: '2021', label: '2021' },
      { value: '2020', label: '2020' }
    ]
  },
  {
    type: 'age_group',
    label: 'Age Group',
    options: [
      { value: '0-17', label: '0-17 years (Pediatric)' },
      { value: '18-64', label: '18-64 years (Adult)' },
      { value: '65+', label: '65+ years (Elderly)' }
    ]
  },
  {
    type: 'specimen',
    label: 'Specimen Source',
    options: [
      { value: 'blood', label: 'Blood' },
      { value: 'urine', label: 'Urine' },
      { value: 'respiratory', label: 'Respiratory' },
      { value: 'wound', label: 'Wound/Tissue' },
      { value: 'csf', label: 'CSF' },
      { value: 'stool', label: 'Stool' },
      { value: 'other', label: 'Other' }
    ]
  },
  {
    type: 'indication',
    label: 'Indication',
    options: [
      { value: 'treatment', label: 'Treatment' },
      { value: 'prophylaxis_surgical', label: 'Surgical Prophylaxis' },
      { value: 'prophylaxis_medical', label: 'Medical Prophylaxis' },
      { value: 'empirical', label: 'Empirical Therapy' },
      { value: 'directed', label: 'Directed/Targeted Therapy' }
    ]
  },
  {
    type: 'atc_class',
    label: 'ATC Class',
    options: [
      { value: 'J01A', label: 'Tetracyclines (J01A)' },
      { value: 'J01B', label: 'Amphenicols (J01B)' },
      { value: 'J01C', label: 'Beta-lactam antibacterials, penicillins (J01C)' },
      { value: 'J01D', label: 'Other beta-lactam antibacterials (J01D)' },
      { value: 'J01E', label: 'Sulfonamides and trimethoprim (J01E)' },
      { value: 'J01F', label: 'Macrolides, lincosamides and streptogramins (J01F)' },
      { value: 'J01G', label: 'Aminoglycoside antibacterials (J01G)' },
      { value: 'J01M', label: 'Quinolone antibacterials (J01M)' },
      { value: 'J01X', label: 'Other antibacterials (J01X)' }
    ]
  },
  {
    type: 'aware_category',
    label: 'AWaRe Category',
    options: [
      { value: 'access', label: 'Access (Green)' },
      { value: 'watch', label: 'Watch (Amber)' },
      { value: 'reserve', label: 'Reserve (Red)' },
      { value: 'not_recommended', label: 'Not Recommended' }
    ]
  }
];

// Helper functions for working with filter configurations
export const getFilterTypeOptions = (configs: FilterConfig[] = AMU_FILTER_CONFIGS): FilterOption[] => {
  return configs.map(config => ({
    value: config.type,
    label: config.label
  }));
};

export const getFilterValueOptions = (filterType: string, configs: FilterConfig[] = AMU_FILTER_CONFIGS): FilterOption[] => {
  const config = configs.find(c => c.type === filterType);
  return config ? config.options : [];
};

export const getFilterLabel = (filterType: string, filterValue: string, configs: FilterConfig[] = AMU_FILTER_CONFIGS): string => {
  const config = configs.find(c => c.type === filterType);
  if (!config) return `${filterType}: ${filterValue}`;
  
  const option = config.options.find(opt => opt.value === filterValue);
  return `${config.label}: ${option?.label || filterValue}`;
};

// Custom hook for managing filter state with array-driven approach
export const useAMUFilters = (configs: FilterConfig[] = AMU_FILTER_CONFIGS) => {
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([]);
  const [filterType, setFilterType] = React.useState<string>('');
  const [filterValue, setFilterValue] = React.useState<string>('');

  const addFilter = React.useCallback(() => {
    if (!filterType || !filterValue) return;

    const label = getFilterLabel(filterType, filterValue, configs);
    const newFilter: ActiveFilter = {
      type: filterType,
      value: filterValue,
      label
    };

    // Check if filter already exists
    const exists = activeFilters.some(f => f.type === filterType && f.value === filterValue);
    if (!exists) {
      setActiveFilters(prev => [...prev, newFilter]);
      setFilterType('');
      setFilterValue('');
    }
  }, [filterType, filterValue, activeFilters, configs]);

  const removeFilter = React.useCallback((index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllFilters = React.useCallback(() => {
    setActiveFilters([]);
    setFilterType('');
    setFilterValue('');
  }, []);

  const filterHelpers = React.useMemo(() => ({
    addFilter,
    removeFilter,
    clearAllFilters
  }), [addFilter, removeFilter, clearAllFilters]);

  return {
    activeFilters,
    filterType,
    setFilterType,
    filterValue,
    setFilterValue,
    filterHelpers,
    configs
  };
};