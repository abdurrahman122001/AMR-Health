import React, { useState } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from './ui/utils';
import { 
  FilterOption, 
  FilterConfig, 
  ActiveFilter, 
  AMU_FILTER_CONFIGS,
  getFilterTypeOptions as getTypeOptions,
  getFilterValueOptions as getValueOptions
} from './AMU_FilterConfigs';

interface FilterHelpers {
  addFilter: () => void;
  removeFilter: (index: number) => void;
  clearAllFilters: () => void;
}

interface AMUFilterTopwideProps {
  // Active filters
  activeFilters: ActiveFilter[];
  
  // Filter state
  filterType: string;
  setFilterType: (value: string) => void;
  filterValue: string;
  setFilterValue: (value: string) => void;
  
  // Filter configurations (array-driven)
  filterConfigs?: FilterConfig[];
  
  // Legacy props for backward compatibility
  filterTypeOptions?: FilterOption[];
  getFilterValueOptions?: (filterType: string) => FilterOption[];
  
  // Filter helpers
  filterHelpers: FilterHelpers;
  
  // Optional customization
  title?: string;
  showActiveFilters?: boolean;
}

export function AMU_filter_topwide({
  activeFilters,
  filterType,
  setFilterType,
  filterValue,
  setFilterValue,
  filterConfigs = AMU_FILTER_CONFIGS,
  filterTypeOptions,
  getFilterValueOptions,
  filterHelpers,
  title = "Filter Data:",
  showActiveFilters = true
}: AMUFilterTopwideProps) {
  const [typeOpen, setTypeOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);

  // Helper functions for array-driven approach
  const getFilterTypeOptions = (): FilterOption[] => {
    if (filterTypeOptions) {
      // Use legacy props if provided for backward compatibility
      return filterTypeOptions;
    }
    return getTypeOptions(filterConfigs);
  };

  const getFilterValueOptionsForType = (selectedType: string): FilterOption[] => {
    if (getFilterValueOptions && filterTypeOptions) {
      // Use legacy function if provided for backward compatibility
      return getFilterValueOptions(selectedType);
    }
    return getValueOptions(selectedType, filterConfigs);
  };
  return (
    <div className="space-y-4">
      {/* Active Filters Display */}
      {showActiveFilters && activeFilters.length > 0 && (
        <div className="mb-[20px] w-full mt-[0px] mr-[0px] ml-[0px]">
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

      {/* Filter Tool */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          
          {/* Filter Type */}
          <div className="flex-1">
            <Popover open={typeOpen} onOpenChange={setTypeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={typeOpen}
                  className="w-full justify-between text-sm h-10"
                >
                  {filterType
                    ? getFilterTypeOptions().find((option) => option.value === filterType)?.label
                    : "Select filter type..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search filter types..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No filter type found.</CommandEmpty>
                    <CommandGroup>
                      {getFilterTypeOptions().map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={(currentValue) => {
                            setFilterType(currentValue === filterType ? "" : currentValue);
                            setFilterValue(""); // Reset filter value when type changes
                            setTypeOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filterType === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filter Value */}
          <div className="flex-1">
            <Popover open={valueOpen} onOpenChange={setValueOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={valueOpen}
                  disabled={!filterType}
                  className="w-full justify-between text-sm h-10"
                >
                  {filterValue
                    ? getFilterValueOptionsForType(filterType).find((option) => option.value === filterValue)?.label
                    : filterType ? "Select value..." : "Select type first"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search values..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No value found.</CommandEmpty>
                    <CommandGroup>
                      {getFilterValueOptionsForType(filterType).map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={(currentValue) => {
                            setFilterValue(currentValue === filterValue ? "" : currentValue);
                            setValueOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filterValue === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Add Filter Button */}
          <button
            onClick={filterHelpers.addFilter}
            disabled={!filterType || !filterValue}
            className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            Add Filter
          </button>
        </div>
      </div>
    </div>
  );
}