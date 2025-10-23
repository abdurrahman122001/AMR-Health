import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface FilterTypeOption {
  value: string;
  label: string;
}

interface FilterValueOption {
  value: string;
  label: string;
}

interface GenericWideFilterProps {
  filterType: string;
  setFilterType: (value: string) => void;
  filterValue: string;
  setFilterValue: (value: string) => void;
  filterTypeOptions: FilterTypeOption[];
  getFilterValueOptions: (filterType: string) => FilterValueOption[];
  onAddFilter: () => void;
  disabled?: boolean;
}

export function GenericWideFilter({
  filterType,
  setFilterType,
  filterValue,
  setFilterValue,
  filterTypeOptions,
  getFilterValueOptions,
  onAddFilter,
  disabled = false
}: GenericWideFilterProps) {
  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
      <div className="flex items-center gap-4">
        <h3 className="font-semibold text-gray-900 text-sm">Filter Data:</h3>
        
        {/* Filter Type */}
        <div className="flex-1">
          <Select value={filterType} onValueChange={setFilterType} disabled={disabled}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Select filter type..." />
            </SelectTrigger>
            <SelectContent>
              {filterTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Value */}
        <div className="flex-1">
          <Select 
            value={filterValue} 
            onValueChange={setFilterValue}
            disabled={!filterType || disabled}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder={filterType ? "Select value..." : "Select type first"} />
            </SelectTrigger>
            <SelectContent>
              {getFilterValueOptions(filterType).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Filter Button */}
        <button
          onClick={onAddFilter}
          disabled={!filterType || !filterValue || disabled}
          className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          Add Filter
        </button>
      </div>
    </div>
  );
}