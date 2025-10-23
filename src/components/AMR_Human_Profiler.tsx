import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie, Legend } from 'recharts';
import { Download, ChevronDown, Check, Loader2, AlertCircle, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from './ui/utils';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Interface for profiler data
interface ProfilerData {
  aggregated?: {
    organism: string;
    antibiotic: string;
    resistanceRate: number;
    resistantCount: number;
    totalCount: number;
    confidenceInterval?: [number, number];
    // S/I/R distribution data for donut chart
    susceptibleCount?: number;
    intermediateCount?: number;
    susceptibleRate?: number;
    intermediateRate?: number;
  };
  disaggregated?: Array<{
    category: string;
    categoryValue: string;
    resistanceRate: number;
    resistantCount: number;
    totalCount: number;
    confidenceInterval?: [number, number];
  }>;
  metadata: {
    totalRecords: number;
    appliedFilters: Array<[string, string]>;
    timestamp: string;
  };
}

// Helper functions
const getResistanceAlertColor = (percentage: number): string => {
  if (percentage < 20) return '#16a34a'; // Green - Low risk
  if (percentage < 40) return '#eab308'; // Yellow - Moderate risk
  return '#dc2626'; // Red - High risk
};

const formatOrganismName = (code: string): string => {
  const organismMapping: { [key: string]: string } = {
    'eco': 'E. coli',
    'kpn': 'K. pneumoniae', 
    'pae': 'P. aeruginosa',
    'sau': 'S. aureus',
    'spn': 'S. pneumoniae',
    'efm': 'E. faecium',
    'efa': 'E. faecalis',
    'ab-': 'Acinetobacter spp.',
    'abu': 'A. baumannii',
    'sal': 'Salmonella spp.',
    'stv': 'S. typhi',
    'shi': 'Shigella spp.',
    'ent': 'Enterobacter spp.',
    'cfr': 'C. freundii',
    'ser': 'S. marcescens',
    'pro': 'Proteus spp.',
    'mor': 'M. morganii',
    'cit': 'Citrobacter spp.',
    'har': 'Hafnia spp.',
    'yer': 'Yersinia spp.',
    'ste': 'S. epidermidis',
    'sho': 'S. hominis',
    'sha': 'S. haemolyticus',
    'sco': 'CoNS',
    'str': 'Streptococcus spp.',
    'spg': 'S. pyogenes',
    'sag': 'S. agalactiae',
    'svi': 'S. viridans',
    'enc': 'Enterococcus spp.'
  };
  
  if (organismMapping[code.toLowerCase()]) {
    return organismMapping[code.toLowerCase()];
  }
  
  if (code.toLowerCase().startsWith('ac') || code.toLowerCase().startsWith('ab')) {
    return 'Acinetobacter spp.';
  }
  
  return code;
};

export function AMR_Human_Profiler() {
  // State management - Set defaults for sau + CIP_ND5
  const [selectedOrganism, setSelectedOrganism] = useState<string>('sau');
  const [selectedAntibiotic, setSelectedAntibiotic] = useState<string>('CIP_ND5');
  const [viewMode, setViewMode] = useState<'aggregated' | 'disaggregated'>('aggregated');
  const [disaggregationCategory, setDisaggregationCategory] = useState<string>('YEAR_SPEC');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  
  // Dropdown states
  const [organismOpen, setOrganismOpen] = useState(false);
  const [antibioticOpen, setAntibioticOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  
  // Data states
  const [availableOrganisms, setAvailableOrganisms] = useState<Array<{value: string, label: string}>>([]);
  const [availableAntibiotics, setAvailableAntibiotics] = useState<Array<{value: string, label: string}>>([]);
  const [filteredAntibiotics, setFilteredAntibiotics] = useState<Array<{value: string, label: string, count?: number}>>([]);
  const [loadingAntibiotics, setLoadingAntibiotics] = useState(false);
  const [profilerData, setProfilerData] = useState<ProfilerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Disaggregation categories
  const disaggregationOptions = [
    { value: 'INSTITUTION', label: 'Hospital/Institution' },
    { value: 'WARD_TYPE', label: 'Ward Type' },
    { value: 'AGE_CAT', label: 'Age Category' },
    { value: 'YEAR_SPEC', label: 'Year of Specimen' },
    { value: 'SEX', label: 'Sex' },
    { value: 'PAT_TYPE', label: 'Patient Type' },
    { value: 'DEPARTMENT', label: 'Department' },
    { value: 'X_REGION', label: 'Region' }
  ];

  // Fetch available organisms and set hardcoded antibiotics on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        console.log('AMR_Human_Profiler: Fetching organism options...');
        
        // Try the standard amr-filter-options endpoint first (without table parameter)
        let organismResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-filter-options?column=ORGANISM`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('AMR_Human_Profiler: Organism response status:', organismResponse.status);

        if (organismResponse.ok) {
          const organismData = await organismResponse.json();
          console.log('AMR_Human_Profiler: Organism data received:', organismData);
          
          if (organismData.success && organismData.options && organismData.options.length > 0) {
            const formattedOrganisms = organismData.options.map((org: string) => ({
              value: org,
              label: formatOrganismName(org)
            }));
            console.log('AMR_Human_Profiler: Setting organisms:', formattedOrganisms);
            setAvailableOrganisms(formattedOrganisms);
          } else {
            console.warn('AMR_Human_Profiler: No organisms found in response:', organismData);
            // Fallback: Try a different endpoint or use hardcoded list
            await tryAlternativeOrganismFetch();
          }
        } else {
          console.error('AMR_Human_Profiler: Organism response not ok:', organismResponse.status, organismResponse.statusText);
          await tryAlternativeOrganismFetch();
        }

        // Set hardcoded antibiotics from AMR_HH table columns
        const amrAntibiotics = [
          'AMC_ND20', 'AMK_ND30', 'AMP_ND10', 'AMX_ND30', 'AZM_ND15', 'CAZ_ND30', 
          'CHL_ND30', 'CIP_ND5', 'CLI_ND2', 'CRO_ND30', 'CTX_ND30', 'CXM_ND30', 
          'ERY_ND15', 'ETP_ND10', 'FOX_ND30', 'GEN_ND10', 'LVX_ND5', 'MEM_ND10', 
          'OXA_ND1', 'PNV_ND10', 'SXT_ND1_2', 'TCY_ND30', 'TGC_ND15', 'TZP_ND100', 
          'CLO_ND5', 'FEP_ND30', 'FLC_ND', 'LEX_ND30', 'LIN_ND4', 'LNZ_ND30', 
          'MNO_ND30', 'NAL_ND30', 'PEN_ND10', 'RIF_ND5', 'VAN_ND30'
        ];
        
        console.log('AMR_Human_Profiler: Setting antibiotics:', amrAntibiotics.length, 'items');
        setAvailableAntibiotics(
          amrAntibiotics.map((ab: string) => ({
            value: ab,
            label: ab
          }))
        );
      } catch (error) {
        console.error('AMR_Human_Profiler: Error fetching options:', error);
        await tryAlternativeOrganismFetch();
      }
    };

    const tryAlternativeOrganismFetch = async () => {
      console.log('AMR_Human_Profiler: Trying alternative organism fetch...');
      
      // Try AMR overview endpoint which might have organism data
      try {
        const overviewResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-overview`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (overviewResponse.ok) {
          const overviewData = await overviewResponse.json();
          console.log('AMR_Human_Profiler: Overview data sample:', overviewData);
          // Extract unique organisms if available in the response
          
          // If that doesn't work, use a hardcoded list of common organisms
          const commonOrganisms = [
            'eco', 'kpn', 'pae', 'sau', 'spn', 'efm', 'efa', 'ab-', 'abu', 
            'sal', 'stv', 'shi', 'ent', 'cfr', 'ser', 'pro', 'mor', 'cit'
          ];
          
          console.log('AMR_Human_Profiler: Using fallback organism list');
          setAvailableOrganisms(
            commonOrganisms.map((org: string) => ({
              value: org,
              label: formatOrganismName(org)
            }))
          );
        }
      } catch (fallbackError) {
        console.error('AMR_Human_Profiler: Fallback fetch also failed:', fallbackError);
        
        // Final fallback - hardcoded organism list
        const commonOrganisms = [
          'eco', 'kpn', 'pae', 'sau', 'spn', 'efm', 'efa', 'ab-', 'abu', 
          'sal', 'stv', 'shi', 'ent', 'cfr', 'ser', 'pro', 'mor', 'cit'
        ];
        
        console.log('AMR_Human_Profiler: Using final fallback organism list');
        setAvailableOrganisms(
          commonOrganisms.map((org: string) => ({
            value: org,
            label: formatOrganismName(org)
          }))
        );
      }
    };

    fetchOptions();
  }, []);

  // Fetch valid antibiotics when organism changes
  useEffect(() => {
    const fetchValidAntibiotics = async () => {
      if (!selectedOrganism) {
        // If no organism selected, show all antibiotics
        setFilteredAntibiotics(availableAntibiotics);
        return;
      }

      setLoadingAntibiotics(true);
      console.log('AMR_Human_Profiler: Fetching valid antibiotics for:', selectedOrganism);

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-valid-antibiotics?organism=${selectedOrganism}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('AMR_Human_Profiler: Valid antibiotics response:', data);
          
          if (data.success && data.validAntibiotics) {
            setFilteredAntibiotics(data.validAntibiotics);
            console.log(`AMR_Human_Profiler: Set ${data.validAntibiotics.length} valid antibiotics for ${selectedOrganism}`);
            
            // Clear selected antibiotic if it's not valid for the new organism
            if (selectedAntibiotic && !data.validAntibiotics.some(ab => ab.value === selectedAntibiotic)) {
              console.log(`AMR_Human_Profiler: Clearing invalid antibiotic selection: ${selectedAntibiotic}`);
              setSelectedAntibiotic('');
            }
          } else {
            console.warn('AMR_Human_Profiler: No valid antibiotics found for organism:', selectedOrganism);
            setFilteredAntibiotics([]);
            setSelectedAntibiotic('');
          }
        } else {
          console.error('AMR_Human_Profiler: Failed to fetch valid antibiotics:', response.status);
          // Fallback to all antibiotics
          setFilteredAntibiotics(availableAntibiotics);
        }
      } catch (error) {
        console.error('AMR_Human_Profiler: Error fetching valid antibiotics:', error);
        // Fallback to all antibiotics
        setFilteredAntibiotics(availableAntibiotics);
      } finally {
        setLoadingAntibiotics(false);
      }
    };

    fetchValidAntibiotics();
  }, [selectedOrganism, availableAntibiotics]);

  // Initialize filtered antibiotics when availableAntibiotics loads
  useEffect(() => {
    if (availableAntibiotics.length > 0 && filteredAntibiotics.length === 0 && !selectedOrganism) {
      setFilteredAntibiotics(availableAntibiotics);
    }
  }, [availableAntibiotics]);

  // Fetch profiler data when selections change
  const fetchProfilerData = async () => {
    if (!selectedOrganism || !selectedAntibiotic) {
      console.log('AMR_Human_Profiler: Cannot fetch data - missing selections:', {
        selectedOrganism,
        selectedAntibiotic
      });
      return;
    }
    
    console.log('AMR_Human_Profiler: Starting profiler data fetch with params:', {
      selectedOrganism,
      selectedAntibiotic,
      viewMode,
      disaggregationCategory
    });
    
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        organism: selectedOrganism,
        antibiotic: selectedAntibiotic,
        viewMode: viewMode
      });

      if (viewMode === 'disaggregated' && disaggregationCategory) {
        queryParams.append('category', disaggregationCategory);
        console.log('AMR_Human_Profiler: Added disaggregation category:', disaggregationCategory);
      }
      
      const requestUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-profiler?${queryParams.toString()}`;
      console.log('AMR_Human_Profiler: Request URL:', requestUrl);
      console.log('AMR_Human_Profiler: Query parameters:', queryParams.toString());

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-profiler?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('AMR_Human_Profiler: Successful response:', data);
        setProfilerData(data);
      } else {
        const errorText = await response.text();
        console.error('AMR_Human_Profiler: Server error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          requestUrl: requestUrl,
          queryParams: queryParams.toString()
        });
        
        // Try to parse error as JSON to get more details
        try {
          const errorData = JSON.parse(errorText);
          console.error('AMR_Human_Profiler: Parsed error data:', errorData);
          throw new Error(`Server error: ${response.status} - ${errorData.error || response.statusText}`);
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('AMR_Human_Profiler: Error fetching profiler data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profiler data');
    } finally {
      setLoading(false);
    }
  };

  // Set up default selections and ensure they're maintained
  useEffect(() => {
    // Ensure we have defaults set on component mount
    if (!selectedOrganism) {
      console.log('AMR_Human_Profiler: Setting default organism to sau');
      setSelectedOrganism('sau');
    }
    if (!selectedAntibiotic) {
      console.log('AMR_Human_Profiler: Setting default antibiotic to CIP_ND5');
      setSelectedAntibiotic('CIP_ND5');
    }
    if (!disaggregationCategory) {
      console.log('AMR_Human_Profiler: Setting default disaggregation category to YEAR_SPEC');
      setDisaggregationCategory('YEAR_SPEC');
    }
  }, []);

  // Fetch data when selections change
  useEffect(() => {
    fetchProfilerData();
  }, [selectedOrganism, selectedAntibiotic, viewMode, disaggregationCategory]);

  // Prepare chart data (placeholder - not used since UI was removed)
  const chartData = useMemo(() => {
    return [];
  }, [profilerData, viewMode]);

  return (
    <div className="space-y-6">
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Resistance Profile Analysis
        </h3>
        <p className="text-gray-600">
          Component content has been removed.
        </p>
      </div>
    </div>
  );
}