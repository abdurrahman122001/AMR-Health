import React, { useState, useEffect } from 'react';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { SearchableSelect } from './SearchableSelect';
import { MDRIncidenceDemographics } from './MDR_Incidence_Demographics';
import { MDRBacteriaIntegrated } from './MDR_Bacteria_Integrated';
import { MDRBacteriaByOrganism } from './MDR_Bacteria_ByOrganism';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FilterOption {
  value: string;
  label: string;
}

interface ActiveFilter {
  column: string;
  value: string;
  label: string;
}

interface FilterValues {
  [key: string]: FilterOption[];
}

export function MDRProfileMain() {
  // Filter state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [loadingFilterValues, setLoadingFilterValues] = useState<{ [key: string]: boolean }>({});
  const [filterValueErrors, setFilterValueErrors] = useState<{ [key: string]: boolean }>({});

  // Filter type options
  const filterTypeOptions: FilterOption[] = [
    { value: 'SEX', label: 'Sex' },
    { value: 'AGE_CAT', label: 'Age Category' },
    { value: 'PAT_TYPE', label: 'Patient Type' },
    { value: 'WARD', label: 'Ward' },
    { value: 'INSTITUTION', label: 'Institution' },
    { value: 'DEPARTMENT', label: 'Department' },
    { value: 'WARD_TYPE', label: 'Ward Type' },
    { value: 'SPEC_TYPE', label: 'Specimen Type' },
    { value: 'LOCAL_SPEC', label: 'Local Specimen' },
    { value: 'YEAR_SPEC', label: 'Year Specimen' },
    { value: 'YEAR_REP', label: 'Year Report' }
  ];

  // Fetch filter values when filter type changes
  const fetchFilterValues = async (columnName: string) => {
    if (filterValues[columnName]) return; // Already loaded

    try {
      setLoadingFilterValues(prev => ({ ...prev, [columnName]: true }));
      setFilterValueErrors(prev => ({ ...prev, [columnName]: false }));

      console.log(`Fetching filter values for: ${columnName}`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-filter-values?column=${columnName.toUpperCase()}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`${columnName} filter values response:`, result);

      if (result.success && result.values) {
        const options = result.values
          .filter((value: any) => value != null && value !== '')
          .map((value: any) => ({
            value: String(value),
            label: String(value)
          }))
          .sort((a: FilterOption, b: FilterOption) => a.label.localeCompare(b.label));

        setFilterValues(prev => ({ ...prev, [columnName]: options }));
        console.log(`Loaded ${options.length} values for ${columnName}`);
      } else {
        throw new Error(result.error || 'No filter values received');
      }

    } catch (error) {
      console.error(`Error fetching ${columnName} filter values:`, error);
      setFilterValueErrors(prev => ({ ...prev, [columnName]: true }));
      setFilterValues(prev => ({ ...prev, [columnName]: [] }));
    } finally {
      setLoadingFilterValues(prev => ({ ...prev, [columnName]: false }));
    }
  };

  // Load filter values when filter type is selected
  useEffect(() => {
    if (filterType) {
      fetchFilterValues(filterType);
    }
  }, [filterType]);

  // Get filter value options for current filter type
  const getFilterValueOptions = (filterType: string): FilterOption[] => {
    if (!filterType) return [];
    return filterValues[filterType] || [];
  };

  // Filter management helpers
  const filterHelpers = {
    addFilter: () => {
      if (!filterType || !filterValue) return;

      const typeLabel = filterTypeOptions.find(opt => opt.value === filterType)?.label || filterType;
      const valueLabel = getFilterValueOptions(filterType).find(opt => opt.value === filterValue)?.label || filterValue;

      const newFilter: ActiveFilter = {
        column: filterType,
        value: filterValue,
        label: `${typeLabel}: ${valueLabel}`
      };

      // Avoid duplicate filters
      const exists = activeFilters.some(filter => 
        filter.column === newFilter.column && filter.value === newFilter.value
      );

      if (!exists) {
        setActiveFilters([...activeFilters, newFilter]);
        console.log('Added filter:', newFilter);
      }

      // Reset filter inputs
      setFilterType('');
      setFilterValue('');
    },

    removeFilter: (index: number) => {
      const removedFilter = activeFilters[index];
      const newFilters = activeFilters.filter((_, i) => i !== index);
      setActiveFilters(newFilters);
      console.log('Removed filter:', removedFilter);
    },

    clearAllFilters: () => {
      setActiveFilters([]);
      console.log('Cleared all filters');
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Active Filters ({activeFilters.length})
            </span>
            <button
              onClick={filterHelpers.clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear All
            </button>
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => filterHelpers.removeFilter(index)}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MDR Components Grid */}
      <div className="space-y-6">
      
      {/* MDR Bacteria Percentage */}
      <MDRBacteriaIntegrated activeFilters={activeFilters} />   

      {/* MDR Bacteria Distribution by Organism */}
      <MDRBacteriaByOrganism activeFilters={activeFilters} />

      {/* MDRO Incidence Demographics - Full Width */}
      <MDRIncidenceDemographics activeFilters={activeFilters} />
        
      </div>
    </div>
  );
}