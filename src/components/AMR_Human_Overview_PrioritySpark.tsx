import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Download, ChevronDown, Check } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from './ui/utils';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { AMR_Human_Sparkline2 } from './AMR_Human_Sparkline2';

// WHO Priority Pathogen-Antibiotic Combinations with resistance trends by year
// Matches the same combinations shown in AMR_Human_Overview_PriorityBars.tsx
const priorityBugDrugData = [
  {
    organism: 'Acinetobacter baumannii',
    antibiotic: 'Carbapenems',
    trends: [
      { year: 2019, resistance: 32 },
      { year: 2020, resistance: 38 },
      { year: 2021, resistance: 45 },
      { year: 2022, resistance: 52 },
      { year: 2023, resistance: 48 }
    ]
  },
  {
    organism: 'Escherichia coli',
    antibiotic: '3G Cephalosporins',
    trends: [
      { year: 2019, resistance: 28 },
      { year: 2020, resistance: 31 },
      { year: 2021, resistance: 35 },
      { year: 2022, resistance: 42 },
      { year: 2023, resistance: 39 }
    ]
  },
  {
    organism: 'Escherichia coli',
    antibiotic: 'Carbapenems',
    trends: [
      { year: 2019, resistance: 8 },
      { year: 2020, resistance: 10 },
      { year: 2021, resistance: 12 },
      { year: 2022, resistance: 15 },
      { year: 2023, resistance: 12 }
    ]
  },
  {
    organism: 'Enterococci',
    antibiotic: 'Vancomycin',
    trends: [
      { year: 2019, resistance: 12 },
      { year: 2020, resistance: 15 },
      { year: 2021, resistance: 19 },
      { year: 2022, resistance: 23 },
      { year: 2023, resistance: 21 }
    ]
  },
  {
    organism: 'Klebsiella pneumoniae',
    antibiotic: '3G Cephalosporins',
    trends: [
      { year: 2019, resistance: 25 },
      { year: 2020, resistance: 28 },
      { year: 2021, resistance: 32 },
      { year: 2022, resistance: 38 },
      { year: 2023, resistance: 35 }
    ]
  },
  {
    organism: 'Klebsiella pneumoniae',
    antibiotic: 'Aminoglycosides',
    trends: [
      { year: 2019, resistance: 22 },
      { year: 2020, resistance: 25 },
      { year: 2021, resistance: 28 },
      { year: 2022, resistance: 33 },
      { year: 2023, resistance: 30 }
    ]
  },
  {
    organism: 'Klebsiella pneumoniae',
    antibiotic: 'Carbapenems',
    trends: [
      { year: 2019, resistance: 18 },
      { year: 2020, resistance: 22 },
      { year: 2021, resistance: 28 },
      { year: 2022, resistance: 34 },
      { year: 2023, resistance: 31 }
    ]
  },
  {
    organism: 'Klebsiella pneumoniae',
    antibiotic: 'Fluoroquinolones',
    trends: [
      { year: 2019, resistance: 30 },
      { year: 2020, resistance: 33 },
      { year: 2021, resistance: 37 },
      { year: 2022, resistance: 42 },
      { year: 2023, resistance: 39 }
    ]
  },
  {
    organism: 'Pseudomonas aeruginosa',
    antibiotic: 'Carbapenems',
    trends: [
      { year: 2019, resistance: 25 },
      { year: 2020, resistance: 29 },
      { year: 2021, resistance: 33 },
      { year: 2022, resistance: 37 },
      { year: 2023, resistance: 35 }
    ]
  },
  {
    organism: 'Staphylococcus aureus',
    antibiotic: 'Methicillin',
    trends: [
      { year: 2019, resistance: 41 },
      { year: 2020, resistance: 38 },
      { year: 2021, resistance: 35 },
      { year: 2022, resistance: 32 },
      { year: 2023, resistance: 29 }
    ]
  },
  {
    organism: 'Streptococcus pneumoniae',
    antibiotic: '3G Cephalosporins',
    trends: [
      { year: 2019, resistance: 12 },
      { year: 2020, resistance: 14 },
      { year: 2021, resistance: 17 },
      { year: 2022, resistance: 19 },
      { year: 2023, resistance: 21 }
    ]
  },
  {
    organism: 'Streptococcus pneumoniae',
    antibiotic: 'Penicillin',
    trends: [
      { year: 2019, resistance: 15 },
      { year: 2020, resistance: 17 },
      { year: 2021, resistance: 20 },
      { year: 2022, resistance: 22 },
      { year: 2023, resistance: 24 }
    ]
  }
];

// Format organism name according to scientific convention
const formatOrganismName = (organism: string): string => {
  const abbreviations: { [key: string]: string } = {
    'Escherichia coli': 'E. coli',
    'E. coli': 'E. coli',
    'Klebsiella pneumoniae': 'K. pneumoniae',
    'Acinetobacter baumannii': 'A. baumannii',
    'Acinetobacter baumanii': 'A. baumannii', // Handle the typo in the data
    'Pseudomonas aeruginosa': 'P. aeruginosa',
    'Staphylococcus aureus': 'S. aureus',
    'Streptococcus pneumoniae': 'S. pneumoniae',
    'Enterococcus faecalis': 'E. faecalis',
    'Enterococcus faecium': 'E. faecium',
    'Enterococci': 'Enterococci', // Keep as is for generic term
    'Neisseria gonorrhoeae': 'N. gonorrhoeae'
  };
  return abbreviations[organism] || organism;
};

// Get resistance alert color based on percentage
const getResistanceAlertColor = (percentage: number): string => {
  if (percentage < 20) return '#16a34a'; // Green
  if (percentage < 40) return '#eab308'; // Yellow
  return '#dc2626'; // Red
};

// Get trend direction and color
const getTrendInfo = (trends: { year: number; resistance: number }[]) => {
  if (trends.length < 2) return { direction: 'stable', color: '#6b7280' };
  
  const firstValue = trends[0].resistance;
  const lastValue = trends[trends.length - 1].resistance;
  const change = lastValue - firstValue;
  
  if (change > 5) return { direction: 'increasing', color: '#dc2626' };
  if (change < -5) return { direction: 'decreasing', color: '#16a34a' };
  return { direction: 'stable', color: '#6b7280' };
};

// Filter interface
interface Filter {
  type: string;
  value: string;
  label: string;
}

// Standardized filter options across all AMR/AMU components
const filterTypeOptions = [
  { value: 'SEX', label: 'Sex' },
  { value: 'AGE_CAT', label: 'Age Category' },
  { value: 'PAT_TYPE', label: 'Patient Type' },
  { value: 'INSTITUTION', label: 'Institution' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'WARD_TYPE', label: 'Ward Type' },
  { value: 'YEAR_SPEC', label: 'Year Specimen Collected' },
  { value: 'X_REGION', label: 'Region' },
  { value: 'ORGANISM', label: 'Organism' }
];

// Dynamic filter value options - populated from database
const filterValueOptions = {
  SEX: [],
  AGE_CAT: [],
  PAT_TYPE: [],
  INSTITUTION: [],
  DEPARTMENT: [],
  WARD_TYPE: [],
  YEAR_SPEC: [],
  X_REGION: [],
  ORGANISM: []
};

export const AMR_Human_Overview_PrioritySpark = React.memo(function AMR_Human_Overview_PrioritySpark() {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);

  // State for real resistance data
  const [realResistanceData, setRealResistanceData] = useState<{
    [key: string]: { resistance_rate?: number; resistance_percentage?: number; total_tested?: number; total_resistant?: number; year_data?: Array<{year: number, resistance_rate: number, total_tested: number}> };
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load filter options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      for (const filterType of ['SEX', 'AGE_CAT', 'PAT_TYPE', 'INSTITUTION', 'DEPARTMENT', 'WARD_TYPE', 'YEAR_SPEC', 'X_REGION', 'ORGANISM']) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-filter-options?column=${filterType}`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.options) {
              filterValueOptions[filterType] = data.options;
            }
          }
        } catch (error) {
          console.error(`Error loading filter options for ${filterType}:`, error);
        }
      }
    };
    
    loadFilterOptions();
  }, []);

  // Fetch real resistance trend data from server
  const fetchResistanceTrendData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching resistance trend data...');

      // Build filter query parameters
      const filterParams = new URLSearchParams();
      activeFilters.forEach(filter => {
        // AMR_HH filter types are already the column names
        filterParams.append(filter.type, filter.value);
      });
      
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d`;
      const endpoints = [
        { 
          organism: 'Acinetobacter baumannii', 
          antibiotic: 'Carbapenems',
          url: `${baseUrl}/amr-abaumannii-carbapenems-trend?${filterParams.toString()}` 
        },
        { 
          organism: 'Escherichia coli', 
          antibiotic: '3G Cephalosporins',
          url: `${baseUrl}/amr-ecoli-3gc-trend?${filterParams.toString()}` 
        },
        { 
          organism: 'Escherichia coli', 
          antibiotic: 'Carbapenems',
          url: `${baseUrl}/amr-ecoli-carbapenems-trend?${filterParams.toString()}` 
        },
        { 
          organism: 'Klebsiella pneumoniae', 
          antibiotic: '3G Cephalosporins',
          url: `${baseUrl}/amr-kpneumoniae-3gc-trend?${filterParams.toString()}` 
        },
        { 
          organism: 'Klebsiella pneumoniae', 
          antibiotic: 'Aminoglycosides',
          url: `${baseUrl}/amr-kpneumoniae-aminoglycosides-trend?${filterParams.toString()}` 
        },
        { 
          organism: 'Klebsiella pneumoniae', 
          antibiotic: 'Carbapenems',
          url: `${baseUrl}/amr-kpneumoniae-carbapenems-trend?${filterParams.toString()}` 
        },
        { 
          organism: 'Klebsiella pneumoniae', 
          antibiotic: 'Fluoroquinolones',
          url: `${baseUrl}/amr-kpneumoniae-fluoroquinolones-trend?${filterParams.toString()}` 
        },
        { 
          organism: 'Pseudomonas aeruginosa', 
          antibiotic: 'Carbapenems',
          url: `${baseUrl}/amr-paeruginosa-carbapenems-trend?${filterParams.toString()}` 
        },
        { 
          organism: 'Staphylococcus aureus', 
          antibiotic: 'Methicillin',
          url: `${baseUrl}/amr-saureus-methicillin-trend?${filterParams.toString()}` 
        },
        { 
          organism: 'Streptococcus pneumoniae', 
          antibiotic: '3G Cephalosporins',
          url: `${baseUrl}/amr-spneumoniae-3gc-trend?${filterParams.toString()}` 
        },
        { 
          organism: 'Streptococcus pneumoniae', 
          antibiotic: 'Penicillin',
          url: `${baseUrl}/amr-spneumoniae-penicillin-trend?${filterParams.toString()}` 
        },
        { 
          organism: 'Enterococci', 
          antibiotic: 'Vancomycin',
          url: `${baseUrl}/amr-enterococci-vancomycin-trend?${filterParams.toString()}` 
        }
      ];
      
      // Fetch all endpoints simultaneously
      const fetchPromises = endpoints.map(async ({ organism, antibiotic, url }) => {
        try {
          console.log(`Fetching ${organism} vs ${antibiotic} trend data from: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`${organism} vs ${antibiotic} trend data received:`, data);
            return { organism, antibiotic, data };
          } else {
            const errorText = await response.text();
            console.error(`Failed to fetch ${organism} vs ${antibiotic} trend data:`, errorText);
            return { organism, antibiotic, data: null };
          }
        } catch (error) {
          console.error(`Error fetching ${organism} vs ${antibiotic} trend data:`, error);
          return { organism, antibiotic, data: null };
        }
      });
      
      // Wait for all requests to complete
      const results = await Promise.all(fetchPromises);
      
      // Organize results by organism-antibiotic pair
      const trendDataMap: typeof realResistanceData = {};
      results.forEach(({ organism, antibiotic, data }) => {
        const key = `${organism}_${antibiotic}`;
        if (data) {
          trendDataMap[key] = data;
        }
      });
      
      console.log('All resistance trend data fetched:', trendDataMap);
      setRealResistanceData(trendDataMap);
      
    } catch (error) {
      console.error('Error fetching resistance trend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Test endpoint to discover column names
  useEffect(() => {
    const testColumns = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-columns-test`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('AMR_HH Table Columns:', data);
          console.log('Antibiotic Columns:', data.antibiotic_columns);
        }
      } catch (error) {
        console.error('Error testing columns:', error);
      }
    };
    
    testColumns();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchResistanceTrendData();
  }, [activeFilters]);

  // Filter helper functions
  const filterHelpers = {
    addFilter: () => {
      if (filterType && filterValue) {
        const typeOption = filterTypeOptions.find(opt => opt.value === filterType);
        const valueOptions = getFilterValueOptionsForType(filterType);
        const valueOption = valueOptions.find(opt => opt.value === filterValue);
        
        if (typeOption && valueOption) {
          const newFilter: Filter = {
            type: filterType,
            value: filterValue,
            label: `${typeOption.label}: ${valueOption.label}`
          };
          
          // Check if filter already exists
          const exists = activeFilters.some(f => f.type === filterType && f.value === filterValue);
          if (!exists) {
            setActiveFilters([...activeFilters, newFilter]);
          }
        }
        
        setFilterType("");
        setFilterValue("");
      }
    },
    
    removeFilter: (index: number) => {
      setActiveFilters(activeFilters.filter((_, i) => i !== index));
    },
    
    clearAllFilters: () => {
      setActiveFilters([]);
    }
  };

  // Get filter type options
  const getFilterTypeOptions = () => {
    return filterTypeOptions;
  };

  // Get filter value options for selected type
  const getFilterValueOptionsForType = (type: string) => {
    const options = filterValueOptions[type] || [];
    return options.map(option => ({ value: option, label: option }));
  };

  const sparklineData = useMemo(() => {
    // If we have real data, use it; otherwise fall back to mock data
    if (Object.keys(realResistanceData).length > 0) {
      const realSparklineData = [];
      
      // Map real data to sparkline format
      const dataMappings = [
        { organism: 'Acinetobacter baumannii', antibiotic: 'Carbapenems', key: 'Acinetobacter baumannii_Carbapenems' },
        { organism: 'Escherichia coli', antibiotic: '3G Cephalosporins', key: 'Escherichia coli_3G Cephalosporins' },
        { organism: 'Escherichia coli', antibiotic: 'Carbapenems', key: 'Escherichia coli_Carbapenems' },
        { organism: 'Klebsiella pneumoniae', antibiotic: '3G Cephalosporins', key: 'Klebsiella pneumoniae_3G Cephalosporins' },
        { organism: 'Klebsiella pneumoniae', antibiotic: 'Aminoglycosides', key: 'Klebsiella pneumoniae_Aminoglycosides' },
        { organism: 'Klebsiella pneumoniae', antibiotic: 'Carbapenems', key: 'Klebsiella pneumoniae_Carbapenems' },
        { organism: 'Klebsiella pneumoniae', antibiotic: 'Fluoroquinolones', key: 'Klebsiella pneumoniae_Fluoroquinolones' },
        { organism: 'Pseudomonas aeruginosa', antibiotic: 'Carbapenems', key: 'Pseudomonas aeruginosa_Carbapenems' },
        { organism: 'Staphylococcus aureus', antibiotic: 'Methicillin', key: 'Staphylococcus aureus_Methicillin' },
        { organism: 'Streptococcus pneumoniae', antibiotic: '3G Cephalosporins', key: 'Streptococcus pneumoniae_3G Cephalosporins' },
        { organism: 'Streptococcus pneumoniae', antibiotic: 'Penicillin', key: 'Streptococcus pneumoniae_Penicillin' },
        { organism: 'Enterococci', antibiotic: 'Vancomycin', key: 'Enterococci_Vancomycin' }
      ];
      
      dataMappings.forEach(({ organism, antibiotic, key }) => {
        const data = realResistanceData[key];
        if (data && data.year_data && Array.isArray(data.year_data)) {
          // Convert year_data to trends format
          const trends = data.year_data
            .sort((a, b) => a.year - b.year)
            .map(yearData => ({
              year: yearData.year,
              resistance: Math.round(yearData.resistance_rate * 100) / 100, // Round to 2 decimal places
              specimens: yearData.total_tested || 0
            }));
          
          if (trends.length > 0) {
            const currentResistance = trends[trends.length - 1]?.resistance || 0;
            const trendInfo = getTrendInfo(trends);
            
            realSparklineData.push({
              organism,
              antibiotic,
              trends,
              currentResistance,
              trendInfo
            });
          }
        }
      });
      
      if (realSparklineData.length > 0) {
        return realSparklineData;
      }
    }
    
    // Fallback to mock data if no real data available
    return priorityBugDrugData.map(combo => {
      const currentResistance = combo.trends[combo.trends.length - 1]?.resistance || 0;
      const trendInfo = getTrendInfo(combo.trends);
      
      return {
        ...combo,
        currentResistance,
        trendInfo
      };
    });
  }, [realResistanceData]);

  return (
    <AMR_Human_Sparkline2 />
  );
});