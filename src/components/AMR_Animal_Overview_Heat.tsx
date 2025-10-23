import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { SearchableSelect } from './SearchableSelect';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { shouldHideESBLPair } from '../utils/esblFilterUtils';

// Animal filter types
interface AnimalFilter {
  type: string;
  value: string;
  label: string;
}

interface AnimalFilterTypeOption {
  value: string;
  label: string;
}

interface AnimalFilterValueOption {
  value: string;
  label: string;
}

export const AMR_Animal_Overview_Heat = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [antibioticNames, setAntibioticNames] = useState({});
  
  // Standardized animal filter states
  const [activeAnimalFilters, setActiveAnimalFilters] = useState<AnimalFilter[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  
  // Dynamic filter value management for animal health
  const [filterAnimalValueCache, setFilterAnimalValueCache] = useState<Record<string, AnimalFilterValueOption[]>>({});
  const [loadingAnimalFilterValues, setLoadingAnimalFilterValues] = useState<Record<string, boolean>>({});
  const [filterAnimalValueErrors, setFilterAnimalValueErrors] = useState<Record<string, string>>({});
  
  // Legacy filter states (for backward compatibility)
  const [activeFilters, setActiveFilters] = useState([]);
  const [filterValues, setFilterValues] = useState({});

  // Define specific antibiotics list for animal health dashboard
  const SPECIFIC_ANTIBIOTICS = ['AMP', 'AZM', 'CHL', 'CIP', 'CTX', 'CRO', 'CAZ', 'GEN', 'MEM', 'TCY', 'SXT'];

  // Animal filter type options for AMR_Animal table
  const animalFilterTypeOptions: AnimalFilterTypeOption[] = [
    { value: 'LABORATORY', label: 'Laboratory' },
    { value: 'ORIGIN', label: 'Origin' },
    { value: 'SURV_PROG', label: 'Surveillance Program' },
    { value: 'SPECIES', label: 'Species' },
    { value: 'SPECIES_NT', label: 'Species Notes' },
    { value: 'ANIM_TYPE', label: 'Animal Type' },
    { value: 'BREED', label: 'Breed' },
    { value: 'SEX_CATEG', label: 'Sex Category' },
    { value: 'PROD_NOTES', label: 'Production Notes' },
    { value: 'MARKET_CAT', label: 'Market Category' },
    { value: 'REGION', label: 'Region' },
    { value: 'DISTRICT', label: 'District' },
    { value: 'CITY', label: 'City' },
    { value: 'TOWN', label: 'Town' },
    { value: 'FARM_TYPE', label: 'Farm Type' },
    { value: 'ORGANISM', label: 'Organism' },
    { value: 'ORG_NOTE', label: 'Organism Notes' },
    { value: 'STRAINNOTE', label: 'Strain Notes' },
    { value: 'SEROTYPE', label: 'Serotype' },
    { value: 'SPEC_TYPE', label: 'Specimen Type' },
    { value: 'SPEC_NOTES', label: 'Specimen Notes' },
    { value: 'SPEC_YEAR', label: 'Specimen Year' }
  ];

  // Fetch unique values for a specific column from AMR_Animal table
  const fetchAnimalFilterValues = async (columnName: string): Promise<AnimalFilterValueOption[]> => {
    if (!columnName) return [];

    try {
      setLoadingAnimalFilterValues(prev => ({ ...prev, [columnName]: true }));
      setFilterAnimalValueErrors(prev => ({ ...prev, [columnName]: '' }));

      console.log(`Fetching unique values for AMR_Animal column: ${columnName}`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-filter-values?column=${encodeURIComponent(columnName)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`AMR_Animal filter values for ${columnName}:`, data);

      // Handle different response formats
      let processedValues: AnimalFilterValueOption[] = [];
      
      if (data.success && Array.isArray(data.options)) {
        // New format: { success: true, options: [{value, label}], ... }
        processedValues = data.options
          .filter((option: any) => 
            option && 
            option.value !== null && 
            option.value !== undefined && 
            String(option.value).trim() !== ''
          )
          .map((option: any) => ({
            value: String(option.value),
            label: String(option.label || option.value)
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
      } else if (data.success && Array.isArray(data.values)) {
        // Legacy format: { success: true, values: [string] }
        processedValues = data.values
          .filter((value: any) => value !== null && value !== undefined && String(value).trim() !== '')
          .map((value: any) => ({
            value: String(value),
            label: String(value)
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
      } else if (Array.isArray(data.values)) {
        // Direct values array
        processedValues = data.values
          .filter((value: any) => value !== null && value !== undefined && String(value).trim() !== '')
          .map((value: any) => ({
            value: String(value),
            label: String(value)
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
      } else if (Array.isArray(data)) {
        // Direct array response
        processedValues = data
          .filter((value: any) => value !== null && value !== undefined && String(value).trim() !== '')
          .map((value: any) => ({
            value: String(value),
            label: String(value)
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
      } else {
        console.warn(`Unexpected response format for ${columnName}:`, data);
        processedValues = [];
      }

      console.log(`Processed ${processedValues.length} values for ${columnName}`);

      // Cache the processed values
      setFilterAnimalValueCache(prev => ({
        ...prev,
        [columnName]: processedValues
      }));

      return processedValues;

    } catch (err: any) {
      console.error(`Error fetching animal filter values for ${columnName}:`, err);
      const errorMessage = err.message || 'Failed to fetch animal filter values';
      setFilterAnimalValueErrors(prev => ({ ...prev, [columnName]: errorMessage }));
      
      // Set empty array as fallback
      setFilterAnimalValueCache(prev => ({
        ...prev,
        [columnName]: []
      }));
      return [];
    } finally {
      setLoadingAnimalFilterValues(prev => ({ ...prev, [columnName]: false }));
    }
  };

  const getAnimalFilterValueOptions = (type: string) => {
    const options = filterAnimalValueCache[type] || [];
    // Ensure options are sorted alphabetically by label
    return options.sort((a, b) => a.label.localeCompare(b.label));
  };

  // Load filter values when filter type changes
  useEffect(() => {
    if (filterType && !filterAnimalValueCache[filterType] && !loadingAnimalFilterValues[filterType]) {
      fetchAnimalFilterValues(filterType);
    }
  }, [filterType]);

  // Animal filter helper functions
  const animalFilterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeOption = animalFilterTypeOptions.find(opt => opt.value === filterType);
        const valueOption = getAnimalFilterValueOptions(filterType).find(opt => opt.value === filterValue);
        
        if (typeOption && valueOption) {
          const newFilter: AnimalFilter = {
            type: filterType,
            value: filterValue,
            label: `${typeOption.label}: ${valueOption.label}`
          };
          
          // Avoid duplicate filters
          const isDuplicate = activeAnimalFilters.some(
            filter => filter.type === newFilter.type && filter.value === newFilter.value
          );
          
          if (!isDuplicate) {
            setActiveAnimalFilters([...activeAnimalFilters, newFilter]);
          }
        }
        
        // Clear selection
        setFilterType("");
        setFilterValue("");
      }
    },
    
    removeFilter: (index: number) => {
      setActiveAnimalFilters(activeAnimalFilters.filter((_, i) => i !== index));
    },
    
    clearAllFilters: () => {
      setActiveAnimalFilters([]);
    }
  };

  // Get filter type options for animal health
  const getAnimalFilterTypeOptions = () => {
    // Sort filter types alphabetically by label
    return [...animalFilterTypeOptions].sort((a, b) => a.label.localeCompare(b.label));
  };

  // Extract organisms from heatmap data
  const organisms = useMemo(() => {
    if (!heatmapData?.heatmapData) return [];
    return Object.keys(heatmapData.heatmapData).sort();
  }, [heatmapData]);

  // Use specific antibiotics list instead of extracting from data
  const antibiotics = useMemo(() => {
    return SPECIFIC_ANTIBIOTICS;
  }, []);

  // Create flat data structure for filtering and calculations
  const filteredData = useMemo(() => {
    if (!heatmapData?.heatmapData) return [];
    
    const flatData = [];
    organisms.forEach(organism => {
      antibiotics.forEach(antibiotic => {
        const percentage = heatmapData.heatmapData[organism]?.[antibiotic];
        if (percentage !== undefined && percentage !== -1) {
          flatData.push({
            organism,
            antibiotic,
            percentage
          });
        }
      });
    });
    
    // Apply active animal filters
    return flatData.filter(item => {
      // Check legacy activeFilters first for backward compatibility
      const legacyFilterMatch = activeFilters.every(filter => {
        if (filter.type === 'organism_code') {
          return item.organism === filter.value;
        }
        if (filter.type === 'antibiotic_code') {
          return item.antibiotic === filter.value;
        }
        return true;
      });
      
      // Check new activeAnimalFilters
      const animalFilterMatch = activeAnimalFilters.every(filter => {
        if (filter.type === 'ORGANISM') {
          return item.organism === filter.value;
        }
        if (filter.type === 'STRAINNOTE') {
          return item.organism === filter.value;
        }
        // For database column filters, we trust the server-side filtering
        return true;
      });
      
      return legacyFilterMatch && animalFilterMatch;
    });
  }, [heatmapData, organisms, antibiotics, activeFilters, activeAnimalFilters]);



  // Animal organism name mapping - Updated for STRAINNOTES values
  const getAnimalOrganismName = (organism) => {
    const animalOrganismMap = {
      'E. coli': 'E. coli',
      'K. Pneumoniae': 'K. pneumoniae', 
      'Enterococus': 'Enterococcus',
      'S. aureus': 'S. aureus',
      'S. agalacticae': 'S. agalactiae',
      'P. Aeruginosa': 'P. aeruginosa',
      'A. Baumanni': 'A. baumannii',
      'Campylobacter': 'Campylobacter spp.',
      'Salmonella sp': 'Salmonella spp.',
      'Aeromonas': 'Aeromonas spp.',
      'Edwardsiella': 'Edwardsiella spp.',
      // Legacy fallbacks
      'ec': 'E. coli',
      'sa': 'S. aureus',
      'se': 'S. epidermidis',
      'pa': 'P. aeruginosa',
      'kp': 'K. pneumoniae',
      'ef': 'Enterococcus spp.',
      'st': 'Streptococcus spp.',
      'cp': 'C. perfringens',
      'pi': 'P. indologenes',
      'ab': 'A. baumannii'
    };
    return animalOrganismMap[organism] || organism;
  };

  // Fetch antibiotic names from database
  const fetchAntibioticNames = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2267887d/antibiotics/names`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          antibiotics: SPECIFIC_ANTIBIOTICS
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAntibioticNames(data.names || {});
      } else {
        console.warn('Failed to fetch antibiotic names from database, using fallback');
        setAntibioticNames({});
      }
    } catch (error) {
      console.warn('Error fetching antibiotic names:', error);
      setAntibioticNames({});
    }
  };

  // Antibiotic name mapping with database integration
  const getAntibioticName = (code) => {
    // First try database names
    if (antibioticNames[code]) {
      return antibioticNames[code];
    }
    
    // Fallback to static mapping
    const antibioticMap = {
      'AMP': 'Ampicillin',
      'AZM': 'Azithromycin',
      'CHL': 'Chloramphenicol',
      'CIP': 'Ciprofloxacin',
      'CTX': 'Cefotaxime',
      'CRO': 'Ceftriaxone',
      'CAZ': 'Ceftazidime',
      'GEN': 'Gentamicin',
      'MEM': 'Meropenem',
      'TCY': 'Tetracycline',
      'SXT': 'Trimethoprim-sulfamethoxazole'
    };
    return antibioticMap[code] || code;
  };

  // Animal resistance alert color function
  const getAnimalResistanceAlertColor = (percentage) => {
    if (percentage < 20) return '#16a34a'; // Green
    if (percentage < 40) return '#eab308'; // Yellow
    return '#dc2626'; // Red
  };



  // Fetch antibiotic names on component mount
  useEffect(() => {
    fetchAntibioticNames();
  }, []);

  // Fetch real animal heatmap data
  useEffect(() => {
    const fetchAnimalHeatmapData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching animal heatmap data with filters:', activeAnimalFilters);
        
        const filterParams = encodeURIComponent(JSON.stringify(activeAnimalFilters));
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-heatmap?filters=${filterParams}&exclude_organism=xxx`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Animal heatmap data received:', data);

        if (data.success) {
          setHeatmapData(data);
          
          // Initialize special filter values
          const organisms = Object.keys(data.heatmapData || {});
          setFilterValues(prev => ({
            ...prev,
            organism_code: organisms,
            antibiotic_code: data.antibioticColumns || SPECIFIC_ANTIBIOTICS
          }));
        } else {
          throw new Error(data.error || 'Failed to fetch heatmap data');
        }
      } catch (error) {
        console.error('Error fetching animal heatmap data:', error);
        setError(error.message);
        
        // Fallback to dummy data
        console.log('Falling back to dummy data');
        const dummyData = generateAnimalDummyHeatmapData();
        setHeatmapData(dummyData);
        setFilterValues(prev => ({
          ...prev,
          organism_code: Object.keys(dummyData.heatmapData || {}),
          antibiotic_code: SPECIFIC_ANTIBIOTICS
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchAnimalHeatmapData();
  }, [activeAnimalFilters]);

  // Generate dummy data for animal resistance - Updated organism list
  const generateAnimalDummyHeatmapData = () => {
    const animalOrganisms = [
      'E. coli',
      'K. Pneumoniae', 
      'Enterococus',
      'S. aureus',
      'S. agalacticae',
      'P. Aeruginosa',
      'A. Baumanni'
    ];
    
    const heatmapData = {};
    const heatmapCounts = {};
    
    animalOrganisms.forEach(organism => {
      heatmapData[organism] = {};
      heatmapCounts[organism] = {};
      
      SPECIFIC_ANTIBIOTICS.forEach(antibiotic => {
        // Generate resistance rates typically lower than human data
        const rate = Math.random() * 60; // 0-60% range
        const total = Math.floor(Math.random() * 200) + 30; // 30-230 samples
        const resistant = Math.floor((rate / 100) * total);
        
        heatmapData[organism][antibiotic] = parseFloat(rate.toFixed(1));
        heatmapCounts[organism][antibiotic] = {
          resistant,
          total
        };
      });
    });
    
    return {
      heatmapData,
      heatmapCounts,
      totalRecords: 1500 // Mock total
    };
  };

  return (
    <Card className="w-full max-w-none">
      <CardHeader>
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg font-medium break-words">Animal Pathogen-Antibiotic Resistance Heatmap for Veterinary Priority Pathogens</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 flex-shrink-0"
            onClick={() => {
              console.log('Download animal heatmap data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Comprehensive resistance patterns across animal pathogen-antibiotic combinations • Veterinary resistance surveillance overview
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filter Controls */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm flex-shrink-0">Filter Resistance Data:</h3>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {/* Filter Type */}
              <div className="flex-1 min-w-0">
                <SearchableSelect
                  value={filterType}
                  onValueChange={setFilterType}
                  options={getAnimalFilterTypeOptions()}
                  placeholder="Search filter type..."
                  className="w-full text-sm"
                />
              </div>

              {/* Filter Value */}
              <div className="flex-1 min-w-0">
                <SearchableSelect
                  value={filterValue}
                  onValueChange={setFilterValue}
                  options={getAnimalFilterValueOptions(filterType)}
                  disabled={!filterType || loadingAnimalFilterValues[filterType]}
                  placeholder={
                    !filterType ? "Select type first" :
                    loadingAnimalFilterValues[filterType] ? "Loading values..." :
                    filterAnimalValueErrors[filterType] ? "Error loading values" :
                    "Search value..."
                  }
                  className="w-full text-sm"
                />
              </div>

              {/* Add Filter Button */}
              <button
                onClick={animalFilterHelpers.addFilter}
                disabled={!filterType || !filterValue || loadingAnimalFilterValues[filterType] || filterAnimalValueErrors[filterType]}
                className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap flex-shrink-0"
              >
                Add Filter
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeAnimalFilters.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Active Filters ({activeAnimalFilters.length})
                </span>
                <button
                  onClick={animalFilterHelpers.clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeAnimalFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                  >
                    <span>{filter.label}</span>
                    <button
                      onClick={() => animalFilterHelpers.removeFilter(index)}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>



        {/* Color-Coded Risk Level Legend */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16a34a' }}></div>
            <span className="text-sm text-[13px]">Low Resistance Risk (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
            <span className="text-sm text-[13px]">Moderate Resistance Risk (20-39%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
            <span className="text-sm text-[13px]">High Resistance Risk (≥40%)</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading animal resistance data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-12 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <span className="ml-2 text-red-700">Error loading data: {error}</span>
          </div>
        )}

        {/* Heatmap Container */}
        {!loading && !error && heatmapData && organisms.length > 0 && antibiotics.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              {/* Header row with organisms */}
              <div className="flex bg-gray-50 border-b min-w-max">
                <div className="w-32 sm:w-40 lg:w-48 font-semibold text-sm border-r py-[0px] px-2 sm:px-[12px] flex items-center text-[13px] flex-shrink-0">Antibiotic / Organism</div>
                <div className="flex flex-1">
                  {organisms.map((organism, index) => {
                    return (
                      <div
                        key={organism}
                        className={`w-20 sm:w-24 lg:w-28 xl:flex-1 h-16 flex items-center justify-center relative px-1 ${
                          index < organisms.length - 1 ? 'border-r' : ''
                        }`}
                      >
                        <span 
                          className="font-medium text-center leading-tight text-[11px] sm:text-[13px] italic"
                          title={`${getAnimalOrganismName(organism)} (${organism})`}
                        >
                          {getAnimalOrganismName(organism)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data rows */}
              {antibiotics.map((antibiotic, rowIndex) => (
                <div key={antibiotic} className={`flex min-w-max ${rowIndex < antibiotics.length - 1 ? 'border-b' : ''}`}>
                  <div className="w-32 sm:w-40 lg:w-48 p-2 sm:p-3 text-sm font-medium border-r bg-gray-50 text-[11px] sm:text-[13px] flex-shrink-0">
                    {getAntibioticName(antibiotic)}
                  </div>
                  <div className="flex flex-1">
                    {organisms.map((organism, colIndex) => {
                      // ESBL filtering: hide inappropriate β-lactam pairs
                      const isESBLExcluded = shouldHideESBLPair(organism, antibiotic);
                      
                      const percentage = heatmapData?.heatmapData?.[organism]?.[antibiotic];
                      const counts = heatmapData?.heatmapCounts?.[organism]?.[antibiotic];
                      const hasData = percentage !== undefined && percentage !== -1;
                      
                      // Apply greyed-out styling for ESBL-excluded pairs
                      const backgroundColor = isESBLExcluded ? '#f9fafb' : (hasData ? getAnimalResistanceAlertColor(percentage) : '#f3f4f6');
                      const textColor = isESBLExcluded ? '#9ca3af' : (hasData && percentage >= 40 ? 'white' : 'black');
                      
                      // Create tooltip content
                      const getTooltipContent = () => {
                        const displayName = getAnimalOrganismName(organism);
                        const antibioticDisplayName = getAntibioticName(antibiotic);

                        if (isESBLExcluded) {
                          return (
                            <div className="text-sm">
                              <div className="font-medium mb-1"><span className="italic">{displayName}</span> vs {antibioticDisplayName}</div>
                              <div className="text-xs text-gray-500">
                                Hidden: ESBL phenotype excludes β-lactams
                              </div>
                            </div>
                          );
                        } else if (hasData && counts) {
                          return (
                            <div className="text-sm">
                              <div className="font-medium mb-1"><span className="italic">{displayName}</span> vs {antibioticDisplayName}</div>
                              <div className="text-xs space-y-1">
                                <div>Resistance Rate: <span className="font-semibold">{percentage}%</span></div>
                                <div>Resistant Isolates: <span className="font-semibold">{counts.resistant}</span> out of <span className="font-semibold">{counts.total}</span></div>
                              </div>
                            </div>
                          );
                        } else if (counts) {
                          return (
                            <div className="text-sm">
                              <div className="font-medium mb-1"><span className="italic">{displayName}</span> vs {antibioticDisplayName}</div>
                              <div className="text-xs space-y-1">
                                <div>Insufficient data (N &lt; 10)</div>
                                <div>Available Isolates: <span className="font-semibold">{counts.total}</span></div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-sm">
                              <div className="font-medium mb-1"><span className="italic">{displayName}</span> vs {antibioticDisplayName}</div>
                              <div className="text-xs">No data available</div>
                            </div>
                          );
                        }
                      };
                      
                      return (
                        <Tooltip key={`${antibiotic}-${organism}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-20 sm:w-24 lg:w-28 xl:flex-1 h-10 flex items-center justify-center text-xs cursor-help ${
                                colIndex < organisms.length - 1 ? 'border-r' : ''
                              }`}
                              style={{ 
                                backgroundColor, 
                                color: textColor
                              }}
                            >
                              {isESBLExcluded ? (
                                <span className="text-gray-400">—</span>
                              ) : hasData ? (
                                <span className="font-semibold text-[10px] sm:text-xs">{percentage}%</span>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {getTooltipContent()}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {!loading && !error && heatmapData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-xl sm:text-2xl font-bold text-blue-700">
                {filteredData.length > 0 
                  ? `${(filteredData.reduce((sum, d) => sum + d.percentage, 0) / filteredData.length).toFixed(1)}%`
                  : '0.0%'
                }
              </div>
              <div className="text-sm text-blue-600">Aggregate Resistance</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-xl sm:text-2xl font-bold text-red-700">
                {filteredData.filter(d => d.percentage >= 40).length}
              </div>
              <div className="text-sm text-red-600">High Risk (≥40%)</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-xl sm:text-2xl font-bold text-yellow-700">
                {filteredData.filter(d => d.percentage >= 20 && d.percentage < 40).length}
              </div>
              <div className="text-sm text-yellow-600">Moderate Risk (20-39%)</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-xl sm:text-2xl font-bold text-green-700">
                {filteredData.filter(d => d.percentage < 20).length}
              </div>
              <div className="text-sm text-green-600">Low Risk (&lt;20%)</div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && !error && heatmapData && (
          <div className="pt-4 border-t border-gray-200 m-[0px]">
            <p className="text-xs text-gray-500">
              Animal pathogen-antibiotic resistance surveillance heatmap • Veterinary isolate resistance patterns across drug-bug combinations
              {activeAnimalFilters.length > 0 && ` • Filtered view showing ${filteredData.length} combinations`}
              {activeAnimalFilters.length === 0 && ` • Showing all combinations from ${heatmapData.totalRecords} records`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};