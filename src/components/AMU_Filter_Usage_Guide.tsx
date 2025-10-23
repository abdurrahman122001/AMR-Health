/**
 * AMU Filter Component Usage Guide
 * 
 * The AMU_filter_topwide component has been recoded to be array-driven with Hospital filter support.
 * 
 * FEATURES:
 * - Hospital filter with 9 Ghanaian teaching hospitals
 * - Array-driven configuration for easy maintenance
 * - Backward compatibility with legacy implementations
 * - Built-in filter management with useAMUFilters hook
 * 
 * QUICK START:
 * 
 * 1. Import the required components and hook:
 */

import React from 'react';
import { AMU_filter_topwide } from './AMU_filter_topwide';
import { useAMUFilters, AMU_FILTER_CONFIGS } from './AMU_FilterConfigs';

export function MyAMUComponent() {
  // Use the hook for automatic filter state management
  const {
    activeFilters,
    filterType,
    setFilterType,
    filterValue,
    setFilterValue,
    filterHelpers
  } = useAMUFilters();

  return (
    <div>
      <AMU_filter_topwide
        activeFilters={activeFilters}
        filterType={filterType}
        setFilterType={setFilterType}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        filterHelpers={filterHelpers}
        title="Filter AMU Data:"
      />
      
      {/* Your content here */}
    </div>
  );
}

/**
 * CUSTOM FILTER CONFIGURATIONS:
 * 
 * You can create custom filter configurations by creating your own array:
 */

const CUSTOM_FILTERS = [
  {
    type: 'hospital',
    label: 'Hospital',
    options: [
      { value: 'ho_teaching', label: 'Ho Teaching Hospital' },
      { value: 'komfo_anokye', label: 'Komfo Anokye Teaching Hospital' },
      // ... more hospitals
    ]
  },
  {
    type: 'department',
    label: 'Department',
    options: [
      { value: 'cardiology', label: 'Cardiology' },
      { value: 'neurology', label: 'Neurology' }
    ]
  }
];

export function MyCustomComponent() {
  const filterState = useAMUFilters(CUSTOM_FILTERS);

  return (
    <AMU_filter_topwide
      {...filterState}
      filterConfigs={CUSTOM_FILTERS}
      title="Custom Filters:"
    />
  );
}

/**
 * LEGACY COMPATIBILITY:
 * 
 * The component still supports the old props for backward compatibility:
 */

export function LegacyComponent({
  qualityActiveFilters,
  qualityFilterHelpers,
  qualityFilterType,
  setQualityFilterType,
  qualityFilterValue,
  setQualityFilterValue,
  filterTypeOptions,
  getFilterValueOptions
}) {
  return (
    <AMU_filter_topwide
      activeFilters={qualityActiveFilters}
      filterType={qualityFilterType}
      setFilterType={setQualityFilterType}
      filterValue={qualityFilterValue}
      setFilterValue={setQualityFilterValue}
      filterTypeOptions={filterTypeOptions}
      getFilterValueOptions={getFilterValueOptions}
      filterHelpers={qualityFilterHelpers}
    />
  );
}

/**
 * AVAILABLE HOSPITAL OPTIONS:
 * 
 * The Hospital filter includes these 9 Ghanaian teaching hospitals:
 * - Ho Teaching Hospital
 * - Komfo Anokye Teaching Hospital
 * - Tamale Teaching Hospital
 * - LEKMA Hospital
 * - Sunyani Teaching Hospital
 * - St. Martin de Porres Hospital
 * - Korle-Bu Teaching Hospital
 * - Cape Coast Teaching Hospital
 * - Eastern Regional Hospital
 * 
 * FILTER TYPES AVAILABLE:
 * - hospital: Ghanaian teaching hospitals
 * - ward: Medical units/departments
 * - sex: Male/Female
 * - year: 2020-2024
 * - age_group: Pediatric/Adult/Elderly
 * - specimen: Blood/Urine/Respiratory/etc.
 * - indication: Treatment/Prophylaxis/etc.
 * - atc_class: ATC antimicrobial classes
 * - aware_category: Access/Watch/Reserve
 */