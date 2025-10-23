import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { SearchableSelect } from './SearchableSelect';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, LabelList } from 'recharts';
import { Download, Table } from 'lucide-react';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { LowSampleLabel } from './LowSampleLabel';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Animal health priority pathogen-antibiotic combinations resistance data
// These will be calculated from animal health AMR data with specific formulas
const animalResistanceData = [
  { organism: 'Escherichia coli', antibiotic: '3rd Generation Cephalosporins', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_E_COLI_3G_CEPHALOSPORINS' },
  { organism: 'Escherichia coli', antibiotic: 'Carbapenems', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_E_COLI_CARBAPENEMS' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Carbapenems', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_K_PNEUMONIAE_CARBAPENEMS' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Aminoglycosides', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_K_PNEUMONIAE_AMINOGLYCOSIDES' },
  { organism: 'Klebsiella pneumoniae', antibiotic: 'Fluoroquinolones', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_K_PNEUMONIAE_FLUOROQUINOLONES' },
  { organism: 'Klebsiella pneumoniae', antibiotic: '3rd-Generation Cephalosporins', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_K_PNEUMONIAE_3G_CEPHALOSPORINS' },
  { organism: 'Enterococci', antibiotic: 'Vancomycin', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_ENTEROCOCCI_VANCOMYCIN' },
  { organism: 'Staphylococcus aureus', antibiotic: 'Methicillin', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_S_AUREUS_METHICILLIN' },
  { organism: 'Streptococcus agalactiae', antibiotic: 'Ampicillin', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_S_AGALACTIAE_AMPICILLIN' },
  { organism: 'Pseudomonas aeruginosa', antibiotic: 'Carbapenems', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_P_AERUGINOSA_CARBAPENEMS' },
  { organism: 'Acinetobacter baumannii', antibiotic: 'Carbapenems', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_A_BAUMANNII_CARBAPENEMS' },
  { organism: 'Campylobacter species', antibiotic: 'Fluoroquinolones', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_CAMPYLOBACTER_FLUOROQUINOLONES' },
  { organism: 'Salmonella species', antibiotic: 'Fluoroquinolones', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_SALMONELLA_FLUOROQUINOLONES' },
  { organism: 'Aeromonas species', antibiotic: 'Carbapenems', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_AEROMONAS_CARBAPENEMS' },
  { organism: 'Aeromonas species', antibiotic: '3rd-Generation Cephalosporins', rate: 0, resistant: 0, total: 0, formula: 'ANIMAL_AEROMONAS_3G_CEPHALOSPORINS' }
];

// Animal health filter options (based on verified AMR_Animal table columns)
const animalFilterTypeOptions = [
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'ORIGIN', label: 'Origin' },
  { value: 'SURV_PROG', label: 'Surveillance Program' },
  { value: 'SPECIES', label: 'Species' },
  { value: 'SPECIES_NT', label: 'Species Notes' },
  { value: 'SCALENOTES', label: 'Scale Notes' },
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
  { value: 'MKTCATNOTE', label: 'Market Category Notes' },
  { value: 'SPEC_TYPE', label: 'Specimen Type' },
  { value: 'SPEC_NOTES', label: 'Specimen Notes' },
  { value: 'FOOD', label: 'Food' },
  { value: 'BRAND', label: 'Brand' },
  { value: 'FOOD_TYPE', label: 'Food Type' },
  { value: 'ORGANISM', label: 'Organism' },
  { value: 'ORG_NOTE', label: 'Organism Notes' },
  { value: 'STRAINNOTE', label: 'Strain Notes' },
  { value: 'SEROTYPE', label: 'Serotype' },
  { value: 'PHENO_CODE', label: 'Phenotype Code' },
  { value: 'SPEC_YEAR', label: 'Specimen Year' }
];

// Get resistance alert color based on percentage for animal health
const getAnimalResistanceAlertColor = (percentage: number): string => {
  if (percentage < 20) return '#16a34a'; // Green
  if (percentage < 40) return '#eab308'; // Yellow
  return '#dc2626'; // Red
};

// Format organism name according to scientific convention for animal health
const formatAnimalOrganismName = (organism: string): string => {
  const abbreviations: { [key: string]: string } = {
    'Acinetobacter baumannii': 'A. baumannii',
    'Escherichia coli': 'E. coli',
    'Enterococci': 'Enterococci',
    'Klebsiella pneumoniae': 'K. pneumoniae',
    'Pseudomonas aeruginosa': 'P. aeruginosa',
    'Staphylococcus aureus': 'S. aureus',
    'Streptococcus agalactiae': 'S. agalactiae',
    'Campylobacter species': 'Campylobacter spp.',
    'Salmonella species': 'Salmonella spp.',
    'Aeromonas species': 'Aeromonas spp.'
  };
  return abbreviations[organism] || organism;
};

// Filter interface for animal health
interface AnimalFilter {
  type: string;
  value: string;
  label: string;
}

interface AnimalFilterValueOption {
  value: string;
  label: string;
}

export function AMR_Animal_Overview_PriorityBars() {
  const [activeAnimalFilters, setActiveAnimalFilters] = useState<AnimalFilter[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [displayMode, setDisplayMode] = useState<'chart' | 'table'>('chart');

  const [realAnimalResistanceData, setRealAnimalResistanceData] = useState<{
    ANIMAL_E_COLI_3G_CEPHALOSPORINS?: any;
    ANIMAL_E_COLI_CARBAPENEMS?: any;
    ANIMAL_K_PNEUMONIAE_CARBAPENEMS?: any;
    ANIMAL_K_PNEUMONIAE_AMINOGLYCOSIDES?: any;
    ANIMAL_K_PNEUMONIAE_FLUOROQUINOLONES?: any;
    ANIMAL_K_PNEUMONIAE_3G_CEPHALOSPORINS?: any;
    ANIMAL_ENTEROCOCCI_VANCOMYCIN?: any;
    ANIMAL_S_AUREUS_METHICILLIN?: any;
    ANIMAL_S_AGALACTIAE_AMPICILLIN?: any;
    ANIMAL_P_AERUGINOSA_CARBAPENEMS?: any;
    ANIMAL_A_BAUMANNII_CARBAPENEMS?: any;
    ANIMAL_CAMPYLOBACTER_FLUOROQUINOLONES?: any;
    ANIMAL_SALMONELLA_FLUOROQUINOLONES?: any;
    ANIMAL_AEROMONAS_CARBAPENEMS?: any;
    ANIMAL_AEROMONAS_3G_CEPHALOSPORINS?: any;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic filter value management for animal health
  const [filterAnimalValueCache, setFilterAnimalValueCache] = useState<Record<string, AnimalFilterValueOption[]>>({});
  const [loadingAnimalFilterValues, setLoadingAnimalFilterValues] = useState<Record<string, boolean>>({});
  const [filterAnimalValueErrors, setFilterAnimalValueErrors] = useState<Record<string, string>>({});

  // Fetch unique values for a specific column from AMR_Animal table
  const fetchAnimalFilterValues = async (columnName: string) => {
    if (filterAnimalValueCache[columnName]) {
      return filterAnimalValueCache[columnName];
    }

    try {
      setLoadingAnimalFilterValues(prev => ({ ...prev, [columnName]: true }));
      setFilterAnimalValueErrors(prev => ({ ...prev, [columnName]: '' }));

      console.log(`Fetching unique values for AMR_Animal column: ${columnName}`);
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-filter-values?column=${columnName}`;
      
      // Add timeout to filter value requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 8000); // 8 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch animal filter values: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load animal filter values');
      }
      
      const options: AnimalFilterValueOption[] = data.options || [];
      
      // Cache the results
      setFilterAnimalValueCache(prev => ({ ...prev, [columnName]: options }));
      
      console.log(`Loaded ${options.length} values for AMR_Animal column ${columnName}`);
      
      return options;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn(`Animal filter values request cancelled for ${columnName}`);
        return [];
      }
      console.error(`Error fetching animal filter values for ${columnName}:`, err);
      const errorMessage = err.message || 'Failed to fetch animal filter values';
      setFilterAnimalValueErrors(prev => ({ ...prev, [columnName]: errorMessage }));
      
      // Set empty array as fallback
      setFilterAnimalValueCache(prev => ({ ...prev, [columnName]: [] }));
      return [];
    } finally {
      setLoadingAnimalFilterValues(prev => ({ ...prev, [columnName]: false }));
    }
  };

  const getAnimalFilterValueOptions = (type: string) => {
    return filterAnimalValueCache[type] || [];
  };

  // Load filter values when filter type changes
  useEffect(() => {
    if (filterType && !filterAnimalValueCache[filterType] && !loadingAnimalFilterValues[filterType]) {
      fetchAnimalFilterValues(filterType);
    }
  }, [filterType]);

  // Fetch real animal resistance data from AMR_Animal database
  const fetchAnimalResistanceData = async () => {
    try {
      setIsLoading(true);
      console.log('=== Fetching REAL Animal AMR resistance data from database ===');
      console.log('Active filters:', activeAnimalFilters);
      
      // Build URL with filter parameters
      let url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-priority-resistance`;
      
      // Add filter parameters if active filters exist
      if (activeAnimalFilters.length > 0) {
        const filterParams = new URLSearchParams();
        activeAnimalFilters.forEach(filter => {
          filterParams.append(`filter_${filter.type}`, filter.value);
        });
        url += `?${filterParams.toString()}`;
        console.log('Request URL with filters:', url);
      } else {
        console.log('Request URL (no filters):', url);
      }
      
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000); // 15 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('=== REAL DATA RESPONSE ANALYSIS ===');
      console.log('Response success:', responseData.success);
      console.log('Available calculations:', Object.keys(responseData.calculations || {}));
      console.log('Total records processed:', responseData.totalRecords);
      console.log('Filters applied by backend:', responseData.filtersApplied);
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to fetch resistance calculations');
      }
      
      const realCalculations = responseData.calculations || {};
      
      // Log specific E. coli 3GC calculation for verification
      if (realCalculations.ANIMAL_E_COLI_3G_CEPHALOSPORINS) {
        const ecoliCalc = realCalculations.ANIMAL_E_COLI_3G_CEPHALOSPORINS;
        console.log('=== E. COLI 3GC REAL CALCULATION ===');
        console.log(`Resistance Rate: ${ecoliCalc.resistanceRate?.toFixed(1)}%`);
        console.log(`Resistant Count: ${ecoliCalc.resistantCount}`);
        console.log(`Total Tested: ${ecoliCalc.totalTested}`);
        console.log(`Calculation Method: ${ecoliCalc.calculation}`);
      } else {
        console.warn('⚠️ No E. coli 3GC calculation found in response');
      }
      
      if (Object.keys(realCalculations).length === 0) {
        console.warn('No resistance calculations returned from server');
        setRealAnimalResistanceData({});
      } else {
        console.log(`✅ Successfully loaded ${Object.keys(realCalculations).length} real resistance calculations`);
        setRealAnimalResistanceData(realCalculations);
      }
      
    } catch (error) {
      console.error('=== ERROR fetching real animal resistance data ===');
      console.error('Error details:', error);
      
      if (error.name === 'AbortError') {
        console.error('Request timeout - server took too long to respond');
      }
      
      // Fallback to empty data on error
      setRealAnimalResistanceData({});
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchAnimalResistanceData();
  }, [activeAnimalFilters]);

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
        
        // Reset form
        setFilterType('');
        setFilterValue('');
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
    return animalFilterTypeOptions;
  };

  // Get resistance profile data for chart
  const getAnimalResistanceProfileData = () => {
    const currentData = animalResistanceData.map(item => {
      // Use real data if available for implemented formulas
      const realData = realAnimalResistanceData[item.formula as keyof typeof realAnimalResistanceData];
      if (realData) {
        // Debug logging for new calculations
        if (['ANIMAL_AEROMONAS_CARBAPENEMS', 'ANIMAL_AEROMONAS_3G_CEPHALOSPORINS', 'ANIMAL_CAMPYLOBACTER_FLUOROQUINOLONES'].includes(item.formula)) {
          console.log(`✅ NEW CALCULATION: ${item.formula} - Rate: ${realData.resistanceRate}%, Resistant: ${realData.resistantCount}, Total: ${realData.totalTested}`);
        }
        return {
          ...item,
          rate: realData.resistanceRate,
          resistant: realData.resistantCount,
          total: realData.totalTested
        };
      }
      
      // Debug logging for calculations without real data
      if (['ANIMAL_AEROMONAS_CARBAPENEMS', 'ANIMAL_AEROMONAS_3G_CEPHALOSPORINS', 'ANIMAL_CAMPYLOBACTER_FLUOROQUINOLONES'].includes(item.formula)) {
        console.log(`⚠️ NO REAL DATA: ${item.formula} - Using default values (rate: ${item.rate}%)`);
      }
      
      // Return original data if no real data available
      return item;
    });
    
    const chartData = currentData.map(item => ({
      organism: item.organism,
      antibiotic: item.antibiotic,
      rate: item.rate,
      resistant: item.resistant,
      total: item.total,
      displayName: `${formatAnimalOrganismName(item.organism)} vs ${item.antibiotic.replace('3rd Generation Cephalosporins', '3GCS').replace('3rd-Generation Cephalosporins', '3GCS').replace('Carbapenems', 'CARB').replace('Fluoroquinolones', 'FQ')}`,
      color: getAnimalResistanceAlertColor(item.rate)
    }));
    
    // Debug logging to verify new calculations are included in chart data
    const newCalculationEntries = chartData.filter(item => 
      item.organism === 'Aeromonas species' || item.organism === 'Campylobacter species'
    );
    if (newCalculationEntries.length > 0) {
      console.log('📊 NEW CALCULATIONS IN CHART DATA:');
      newCalculationEntries.forEach(entry => {
        console.log(`  - ${entry.displayName}: ${entry.rate}% (${entry.resistant}/${entry.total})`);
      });
    }
    
    // Sort by resistance rate in descending order (highest resistance first)
    const sortedData = chartData.sort((a, b) => b.rate - a.rate);
    console.log(`📊 Total chart entries being displayed: ${sortedData.length}`);
    return sortedData;
  };

  // Custom label component for low sample size indicator
  const AnimalLowSampleLabel = (props: any) => {
    const { x, y, width, payload, value } = props;
    
    // Show asterisk if total count is <= 30
    const total = payload?.total || 
                  payload?.payload?.total || 
                  payload?.data?.total ||
                  payload?.originalData?.total;
    
    // Also check if we can calculate total from resistant/rate
    let calculatedTotal = null;
    if (!total && payload?.resistant && payload?.rate && payload.rate > 0) {
      calculatedTotal = Math.round(payload.resistant / (payload.rate / 100));
    }
    
    const finalTotal = total || calculatedTotal;
    
    if (finalTotal && finalTotal <= 30) {
      return (
        <text
          x={x + width / 2}
          y={y - 8}
          fill="#dc2626"
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
        >
          *
        </text>
      );
    }
    return null;
  };

  return (
    <Card className="mx-[0px] my-[24px]">
      <CardHeader className="pt-[16px] pr-[24px] pb-[0px] pl-[24px]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-[16px]">Resistance Rates for Priority Pathogen-Antibiotic Combinations</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => setDisplayMode(displayMode === 'chart' ? 'table' : 'chart')}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log('Download Animal Resistance Priority chart data');
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 m-[0px] text-[13px]">
          High-risk animal pathogen-antibiotic combinations (% resistance)
        </p>
      </CardHeader>

      <CardContent className="p-0">
        {/* Main Layout - Chart Area + Side Panel */}
        <div className="flex gap-6">
          {/* Chart Area */}
          <div className="flex-1 min-w-0 my-[0px] mt-[0px] mr-[0px] mb-[0px] ml-[20px] px-[10px] py-[0px] p-[0px]">
            {/* Color-Coded Risk Level Legend */}
            <div className="flex justify-center m-[0px] gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#16a34a' }}></div>
                <span className="text-sm text-[11px]">Low Resistance Risk (&lt;20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }}></div>
                <span className="text-sm text-[11px]">Moderate Resistance Risk (20-39%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }}></div>
                <span className="text-sm text-[11px]">High Resistance Risk (&ge;40%)</span>
              </div>
            </div>

            {/* Chart/Table Container */}
            <div id="animal-resistance-chart-container" className="h-[350px] m-[0px] p-[0px]">
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading animal resistance data...</div>
                </div>
              )}
              {!isLoading && (() => {
                // Memoize chart data to prevent recalculation on every render
                const rawChartData = getAnimalResistanceProfileData();
                
                // Sort chart data alphabetically by displayName
                const sortedChartData = rawChartData.sort((a, b) => 
                  a.displayName.localeCompare(b.displayName)
                );
                
                // Apply antibiotic class abbreviations
                const chartData = sortedChartData.map(entry => ({
                  ...entry,
                  displayName: entry.displayName.replace(/aminoglycosides/gi, 'AG')
                }));

                if (displayMode === 'table') {
                  return (
                    <div className="h-full overflow-auto">
                      <TableComponent>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[25%]">Pathogen</TableHead>
                            <TableHead className="w-[30%]">Antibiotic</TableHead>
                            <TableHead className="w-[15%] text-center">Resistance Rate</TableHead>
                            <TableHead className="w-[15%] text-center">Resistant</TableHead>
                            <TableHead className="w-[15%] text-center">Total</TableHead>

                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {chartData.map((entry, index) => {
                            const hasNoData = !entry.total || entry.total === 0;
                            const riskColor = getAnimalResistanceAlertColor(entry.rate);
                            const isSmallSample = entry.total && entry.total <= 30;
                            
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  <span className={`italic text-[12px] ${hasNoData ? 'text-gray-400' : ''}`}>
                                    {formatAnimalOrganismName(entry.organism)}
                                  </span>
                                </TableCell>
                                <TableCell className={`text-[12px] ${hasNoData ? 'text-gray-400' : ''}`}>
                                  {entry.antibiotic}
                                </TableCell>
                                <TableCell className="text-center text-[12px] text-[13px]">
                                  {hasNoData ? (
                                    <span className="text-gray-400 text-xs">No data</span>
                                  ) : (
                                    <>
                                      <span style={{ color: riskColor, fontWeight: 'bold' }}>
                                        {entry.rate.toFixed(1)}%
                                      </span>
                                      {isSmallSample && (
                                        <span className="text-orange-600 ml-1" title="N < 30 - interpret with caution">*</span>
                                      )}
                                    </>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-[12px]">
                                  {hasNoData ? <span className="text-gray-400">-</span> : entry.resistant}
                                </TableCell>
                                <TableCell className="text-center text-[12px] text-[13px]">
                                  {hasNoData ? <span className="text-gray-400">-</span> : entry.total}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </TableComponent>
                      {chartData.some(entry => entry.total && entry.total <= 30) && (
                        <div className="mt-4 text-xs text-orange-600 flex items-center gap-1">
                          <span className="text-orange-500">*</span>
                          <span>N &lt; 30 - interpret with caution</span>
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Chart view (default)
                const cellColors = chartData.map(entry => {
                  const hasNoData = !entry.total || entry.total === 0;
                  const isSmallSample = entry.total && entry.total <= 30;
                  
                  if (hasNoData) {
                    return '#d1d5db'; // Grey color for no data
                  }
                  return isSmallSample ? entry.color + '99' : entry.color;
                });

                // Optimized tooltip content function
                const renderTooltip = ({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  
                  const data = payload[0].payload;
                  const rate = data.rate;
                  const totalTested = data.total || 0;
                  const resistant = data.resistant || 0;
                  const hasNoData = !totalTested || totalTested === 0;
                  
                  if (hasNoData) {
                    return (
                      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
                        <p className="font-semibold text-gray-900 mb-1 italic">{formatAnimalOrganismName(data.organism)}</p>
                        <p className="text-sm text-gray-600 mb-2">{data.antibiotic}</p>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                            <span className="text-gray-400 text-sm">📊</span>
                            No data available in database
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            No isolates found for this pathogen-antibiotic combination
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  const riskLevel = rate < 20 ? 'Low risk' : rate < 40 ? 'Moderate risk' : 'High risk';
                  const riskColor = getAnimalResistanceAlertColor(rate);
                  const isSmallSample = totalTested <= 30;
                  
                  return (
                    <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
                      <p className="font-semibold text-gray-900 mb-1 italic">{formatAnimalOrganismName(data.organism)}</p>
                      <p className="text-sm text-gray-600 mb-2">{data.antibiotic}</p>
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold" style={{ color: riskColor }}>{rate}%</span> resistance rate <span style={{ color: riskColor }}>({riskLevel})</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {resistant} resistant / {totalTested} total tested
                      </p>
                      {isSmallSample && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                            <span className="text-orange-500 text-sm">⚠️</span>
                            N &lt; 30 - interpret with caution
                          </p>
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 70 }}
                    >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="displayName" 
                      angle={-30}
                      textAnchor="end"
                      height={10}
                      interval={0}
                      fontSize={10}
                      tick={(props) => {
                        const { x, y, payload } = props;
                        const chartEntry = chartData.find(entry => entry.displayName === payload.value);
                        const hasNoData = !chartEntry?.total || chartEntry.total === 0;
                        const textColor = hasNoData ? '#9ca3af' : '#374151'; // Grey out if no data
                        
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill={textColor}
                            fontSize={10}
                            textAnchor="end"
                            transform={`rotate(-30 ${x} ${y})`}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Resistance Rate (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#374151', fontSize: '12px' }
                      }}
                      domain={[0, 100]}
                      ticks={[0, 20, 40, 60, 80, 100]}
                      fontSize={10}
                      tick={{ fill: '#374151' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <Tooltip content={renderTooltip} />
                    <Bar 
                      dataKey="rate" 
                      radius={[2, 2, 0, 0]}
                      stroke="none"
                    >
                      {cellColors.map((fillColor, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={fillColor}
                        />
                      ))}
                      <LabelList content={AnimalLowSampleLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                );
              })()}
            </div>

            {/* Footer */}

          </div>

          {/* Filter Side Panel */}
          <div className="w-60 flex-shrink-0 bg-gray-50 rounded-lg border space-y-4 mt-[25px] mr-[24px] mb-[0px] ml-[0px] max-h-[260px] pt-[16px] pr-[16px] pb-[0px] pl-[16px]">
            {/* Filter Controls */}
            <div>
              <TooltipComponent>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-gray-900 text-sm cursor-help mb-4">Filter Animal Resistance Data</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dynamic filters for animal AMR data (9 available)</p>
                </TooltipContent>
              </TooltipComponent>
              
              <div className="space-y-3">
                {/* Filter Type */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Filter Type</label>
                  <SearchableSelect
                    value={filterType}
                    onValueChange={setFilterType}
                    options={getAnimalFilterTypeOptions()}
                    placeholder="Search filter type..."
                    className="w-full text-sm"
                  />
                </div>

                {/* Filter Value */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Filter Value</label>
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
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Add Filter
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeAnimalFilters.length > 0 && (
              <div>
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
        </div>

        {/* Footer */}

      </CardContent>
    </Card>
  );
}