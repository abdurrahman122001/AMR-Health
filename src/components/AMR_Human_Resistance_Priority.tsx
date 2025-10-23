import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AMR_Human_Overview_Heat } from './AMR_Human_Overview_Heat';
import { AMR_Human_Overview_PriorityBars } from './AMR_Human_Overview_PriorityBars';

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Download, ChevronDown, Check } from 'lucide-react';
import { cn } from './ui/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface ActiveFilter {
  type: string;
  value: string;
  label: string;
}

export function AMR_Human_Resistance_Priority() {
  // Filter state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);



  // Filter type options
  const getFilterTypeOptions = (): FilterOption[] => [
    { value: 'pathogen', label: 'Pathogen' },
    { value: 'antibiotic', label: 'Antibiotic' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'ward', label: 'Ward/Unit' },
    { value: 'specimen', label: 'Specimen Source' },
    { value: 'year', label: 'Year' }
  ];

  // Filter value options based on type
  const getFilterValueOptionsForType = (type: string): FilterOption[] => {
    switch (type) {
      case 'pathogen':
        return [
          { value: 'acinetobacter', label: 'Acinetobacter baumanii' },
          { value: 'ecoli', label: 'E. coli' },
          { value: 'klebsiella', label: 'Klebsiella pneumoniae' },
          { value: 'pseudomonas', label: 'Pseudomonas aeruginosa' },
          { value: 'staph_aureus', label: 'Staphylococcus aureus' },
          { value: 'enterococcus', label: 'Enterococcus spp.' }
        ];
      case 'antibiotic':
        return [
          { value: 'amikacin', label: 'Amikacin' },
          { value: 'ampicillin', label: 'Ampicillin' },
          { value: 'ceftriaxone', label: 'Ceftriaxone' },
          { value: 'ciprofloxacin', label: 'Ciprofloxacin' },
          { value: 'gentamicin', label: 'Gentamicin' },
          { value: 'meropenem', label: 'Meropenem' },
          { value: 'vancomycin', label: 'Vancomycin' }
        ];
      case 'hospital':
        return [
          { value: 'cape_coast', label: 'Cape Coast Teaching Hospital' },
          { value: 'korle_bu', label: 'Korle-Bu Teaching Hospital' },
          { value: 'komfo_anokye', label: 'Komfo Anokye Teaching Hospital' },
          { value: 'tamale_teaching', label: 'Tamale Teaching Hospital' }
        ];
      case 'ward':
        return [
          { value: 'icu', label: 'Intensive Care Unit' },
          { value: 'medical', label: 'Medical Ward' },
          { value: 'surgical', label: 'Surgical Ward' },
          { value: 'pediatric', label: 'Pediatric Ward' }
        ];
      case 'specimen':
        return [
          { value: 'blood', label: 'Blood' },
          { value: 'urine', label: 'Urine' },
          { value: 'wound', label: 'Wound' },
          { value: 'respiratory', label: 'Respiratory' }
        ];
      case 'year':
        return [
          { value: '2024', label: '2024' },
          { value: '2023', label: '2023' },
          { value: '2022', label: '2022' }
        ];
      default:
        return [];
    }
  };

  // Filter helpers
  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeOption = getFilterTypeOptions().find(option => option.value === filterType);
        const valueOption = getFilterValueOptionsForType(filterType).find(option => option.value === filterValue);
        
        if (typeOption && valueOption) {
          const newFilter: ActiveFilter = {
            type: filterType,
            value: filterValue,
            label: `${typeOption.label}: ${valueOption.label}`
          };
          
          setActiveFilters(prev => [...prev, newFilter]);
          setFilterType("");
          setFilterValue("");
        }
      }
    },
    removeFilter: (index: number) => {
      setActiveFilters(prev => prev.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setActiveFilters([]);
    }
  };

  // Get resistance alert color
  const getResistanceAlertColor = (rate: number): string => {
    if (rate < 20) return '#16a34a'; // Green
    if (rate < 40) return '#eab308'; // Yellow
    return '#dc2626'; // Red
  };

  // Mock resistance data
  const getResistanceProfileData = () => {
    const mockData = [
      { organism: 'Acinetobacter baumanii', antibiotic: 'Meropenem', rate: 78.5, resistant: 157, total: 200, displayName: 'A. baumanii - Meropenem' },
      { organism: 'Acinetobacter baumanii', antibiotic: 'Ciprofloxacin', rate: 65.2, resistant: 130, total: 200, displayName: 'A. baumanii - Ciprofloxacin' },
      { organism: 'E. coli', antibiotic: 'Ampicillin', rate: 72.3, resistant: 289, total: 400, displayName: 'E. coli - Ampicillin' },
      { organism: 'E. coli', antibiotic: 'Ceftriaxone', rate: 45.8, resistant: 183, total: 400, displayName: 'E. coli - Ceftriaxone' },
      { organism: 'Klebsiella pneumoniae', antibiotic: 'Ceftriaxone', rate: 52.7, resistant: 158, total: 300, displayName: 'K. pneumoniae - Ceftriaxone' },
      { organism: 'Klebsiella pneumoniae', antibiotic: 'Meropenem', rate: 28.3, resistant: 85, total: 300, displayName: 'K. pneumoniae - Meropenem' },
      { organism: 'Pseudomonas aeruginosa', antibiotic: 'Meropenem', rate: 42.1, resistant: 84, total: 200, displayName: 'P. aeruginosa - Meropenem' },
      { organism: 'Pseudomonas aeruginosa', antibiotic: 'Amikacin', rate: 18.5, resistant: 37, total: 200, displayName: 'P. aeruginosa - Amikacin' },
      { organism: 'Staphylococcus aureus', antibiotic: 'Oxacillin', rate: 35.6, resistant: 71, total: 200, displayName: 'S. aureus - Oxacillin' },
      { organism: 'Enterococcus spp.', antibiotic: 'Vancomycin', rate: 12.8, resistant: 19, total: 150, displayName: 'Enterococcus - Vancomycin' }
    ];

    return mockData.map(item => ({
      ...item,
      color: getResistanceAlertColor(item.rate)
    }));
  };



  // Find active hospital filter for footer
  const hospitalFilter = activeFilters.find(filter => filter.type === 'hospital');

  return (
    <div className="space-y-8">
      {/* Heatmap Component */}
      <div className="mb-8">
        <AMR_Human_Overview_Heat />
      </div>
      
      {/* Bar Chart Component */}
      <div>
        <AMR_Human_Overview_PriorityBars />
      </div>
    </div>
  );
}