import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

interface FilterOption {
  value: string;
  label: string;
}

interface ActiveFilter {
  type: string;
  value: string;
  label: string;
}

interface FilterHelpers {
  addFilter: () => void;
  removeFilter: (index: number) => void;
  clearAllFilters: () => void;
}

interface AMU_Human_ATC4_ViewByProps {
  regionFilterType?: string;
  setRegionFilterType?: (value: string) => void;
  regionFilterValue?: string;
  setRegionFilterValue?: (value: string) => void;
  regionActiveFilters?: ActiveFilter[];
  regionFilterHelpers?: FilterHelpers;
  filterTypeOptions?: FilterOption[];
  getFilterValueOptions?: (type: string) => FilterOption[];
}

// Move large data objects outside component to prevent recreation on every render
const ATC4_TO_ATC3_MAP = {
    "J01CR": "J01C", // Penicillin + β-lactamase inhibitor
    "J01CA": "J01C", // Penicillins, extended spectrum
    "J01CE": "J01C", // β-lactamase-sensitive penicillins
    "J01CF": "J01C", // Beta-lactamase resistant penicillins
    "J01DD": "J01D", // Cephalosporins, 3rd gen
    "J01DC": "J01D", // Cephalosporins, 2nd gen
    "J01DH": "J01D", // Carbapenems
    "J01EE": "J01E", // Sulfonamides + trimethoprim
    "J01FA": "J01F", // Macrolides
    "J01FF": "J01F", // Lincosamides
    "J01GB": "J01G", // Other aminoglycosides
    "J01MA": "J01M", // Fluoroquinolones
    "J01XA": "J01X", // Glycopeptides
    "J01XE": "J01X", // Nitrofurans
    "J01XX": "J01X", // Other antibacterials
    "J01XD": "J01X", // Imidazoles
    "J01XB": "J01X", // Polymyxins
    "P01AB": "P01A", // Nitroimidazole derivatives (antiprotozoal)
    "J04A": "J04A", // Drugs for treatment of tuberculosis
    "J02A": "J02A", // Antimycotics for systemic use
    "J05A": "J05A", // Direct acting antivirals
    "P01B": "P01B", // Antimalarials
};

// ATC3 definitions
const ATC3_COLORS = {
    "J01A": "#f59e0b", // Tetracyclines - amber
    "J01B": "#8b5cf6", // Amphenicols - purple
    "J01C": "#3b82f6", // Beta-lactam antibacterials, penicillins - blue
    "J01D": "#0891b2", // Other beta-lactam antibacterials - teal
    "J01E": "#6b7280", // Sulfonamides and trimethoprim - gray
    "J01F": "#8b5cf6", // Macrolides, lincosamides and streptogramins - purple
    "J01G": "#6b7280", // Aminoglycoside antibacterials - gray
    "J01M": "#f59e0b", // Quinolone antibacterials - amber
    "J01R": "#ef4444", // Combinations of antibacterials - red
    "J01X": "#9ca3af", // Other antibacterials - light gray
    "J02A": "#84cc16", // Antimycotics for systemic use - green
    "J04A": "#f97316", // Drugs for treatment of tuberculosis - orange
    "J05A": "#a855f7", // Direct acting antivirals - purple
    "P01A": "#dc2626", // Agents against amoebiasis and other protozoal diseases - red
    "P01B": "#b91c1c", // Antimalarials - dark red
};

const ATC3_LABELS = {
    "J01A": "Tetracyclines",
    "J01B": "Amphenicols",
    "J01C": "Beta-lactam antibacterials, penicillins",
    "J01D": "Other beta-lactam antibacterials",
    "J01E": "Sulfonamides and trimethoprim",
    "J01F": "Macrolides, lincosamides and streptogramins",
    "J01G": "Aminoglycoside antibacterials",
    "J01M": "Quinolone antibacterials",
    "J01R": "Combinations of antibacterials",
    "J01X": "Other antibacterials",
    "J02A": "Antimycotics for systemic use",
    "J04A": "Drugs for treatment of tuberculosis",
    "J05A": "Direct acting antivirals",
    "P01A": "Agents against amoebiasis and other protozoal diseases",
    "P01B": "Antimalarials",
};

// ATC4 color definitions - same as main donut component
const ATC4_COLORS = {
    "J01CR": "#3b82f6", // Penicillin + β-lactamase inhibitor - blue
    "J01CA": "#1e40af", // Penicillins, extended spectrum - darker blue
    "J01DD": "#0891b2", // Cephalosporins, 3rd gen - teal
    "J01DC": "#0e7490", // Cephalosporins, 2nd gen - darker teal
    "J01DH": "#164e63", // Carbapenems - darkest teal
    "J01MA": "#f59e0b", // Fluoroquinolones - orange
    "J01FA": "#8b5cf6", // Macrolides - purple
    "J01EE": "#6b7280", // Sulfonamides + trimethoprim - neutral grey
    "J01XA": "#9ca3af", // Glycopeptides - light grey
    "J01GB": "#6b7280", // Other aminoglycosides - neutral grey
    "J01FF": "#9ca3af", // Lincosamides - light grey
    "J01XE": "#6b7280", // Nitrofurans - neutral grey
    "J01XX": "#9ca3af", // Other antibacterials - light grey
    "J01XD": "#d97706", // Imidazoles - amber
    "J01CE": "#2563eb", // β-lactamase-sensitive penicillins - blue variant
    "J01CF": "#2563eb", // Beta-lactamase resistant penicillins - blue variant
    "J01XB": "#6b7280", // Polymyxins - neutral grey
    "P01AB": "#dc2626", // Nitroimidazole derivatives (antiprotozoal) - red
    "J04A": "#f97316", // Drugs for treatment of tuberculosis - orange
    "J02A": "#84cc16", // Antimycotics for systemic use - green
    "J05A": "#a855f7", // Direct acting antivirals - purple
    "P01B": "#b91c1c", // Antimalarials - dark red
    "OTHER": "#374151"  // Other (≤2%) - darkest grey
};

// ATC4 label definitions - same as main donut component
const ATC4_LABELS = {
    "J01CR": "Penicillin + β-lactamase inhibitor",
    "J01CA": "Penicillins, extended spectrum", 
    "J01DD": "Cephalosporins, 3rd gen",
    "J01DC": "Cephalosporins, 2nd gen",
    "J01DH": "Carbapenems",
    "J01MA": "Fluoroquinolones",
    "J01FA": "Macrolides",
    "J01EE": "Sulfonamides + trimethoprim",
    "J01XA": "Glycopeptides",
    "J01GB": "Other aminoglycosides",
    "J01FF": "Lincosamides",
    "J01XE": "Nitrofurans",
    "J01XX": "Other antibacterials",
    "J01XD": "Imidazoles",
    "J01CE": "β-lactamase-sensitive penicillins",
    "J01CF": "Beta-lactamase resistant penicillins",
    "J01XB": "Polymyxins",
    "P01AB": "Nitroimidazole derivatives (antiprotozoal)",
    "J04A": "Drugs for treatment of tuberculosis",
    "J02A": "Antimycotics for systemic use",
    "J05A": "Direct acting antivirals",
    "P01B": "Antimalarials",
    "OTHER": "Other (≤2% each)"
};

// ATC5 color definitions for specific antimicrobials
const ATC5_COLORS = {
    "J01DD04": "#0891b2", // Ceftriaxone - teal
    "J01CR02": "#3b82f6", // Amoxicillin/clavulanic acid - blue
    "J01XD01": "#d97706", // Metronidazole - amber
    "P01AB01": "#dc2626", // Metronidazole (antiprotozoal) - red
    "J01DC02": "#0e7490", // Cefuroxime - darker teal
    "J01DH02": "#164e63", // Meropenem - darkest teal
    "J01FF01": "#9ca3af", // Clindamycin - light grey
    "J01CA04": "#1e40af", // Amoxicillin - darker blue
    "J01FA10": "#8b5cf6", // Azithromycin - purple
    "J01MA12": "#f59e0b", // Levofloxacin - orange
    "J01MA02": "#f59e0b", // Ciprofloxacin - orange
    "J01GB03": "#6b7280", // Gentamicin - neutral grey
    "J01GB06": "#6b7280", // Amikacin - neutral grey
    "J01DD01": "#0891b2", // Cefotaxime - teal
    "J01XA01": "#9ca3af", // Vancomycin - light grey
    "J01XB02": "#6b7280", // Polymyxin B - neutral grey
    "J01CE01": "#2563eb", // Benzylpenicillin - blue variant
    "J01CA01": "#1e40af", // Ampicillin - darker blue
    "J01CF02": "#2563eb", // Cloxacillin - blue variant
    "J01EE01": "#6b7280", // Sulfamethoxazole/trimethoprim - neutral grey
    "OTHER": "#374151"  // Other - darkest grey
};

// ATC5 label definitions for specific antimicrobials
const ATC5_LABELS = {
    "J01DD04": "Ceftriaxone",
    "J01CR02": "Amoxicillin/clavulanic acid",
    "J01XD01": "Metronidazole",
    "P01AB01": "Metronidazole (antiprotozoal)",
    "J01DC02": "Cefuroxime",
    "J01DH02": "Meropenem",
    "J01FF01": "Clindamycin",
    "J01CA04": "Amoxicillin",
    "J01FA10": "Azithromycin",
    "J01MA12": "Levofloxacin",
    "J01MA02": "Ciprofloxacin",
    "J01GB03": "Gentamicin",
    "J01GB06": "Amikacin",
    "J01DD01": "Cefotaxime",
    "J01XA01": "Vancomycin",
    "J01XB02": "Polymyxin B",
    "J01CE01": "Benzylpenicillin",
    "J01CA01": "Ampicillin",
    "J01CF02": "Cloxacillin",
    "J01EE01": "Sulfamethoxazole/trimethoprim",
    "OTHER": "Other (≤2% each)"
};



export function AMU_Human_ATC4_ViewBy({
  regionFilterType = '',
  setRegionFilterType = () => {},
  regionFilterValue = '',
  setRegionFilterValue = () => {},
  regionActiveFilters = [],
  regionFilterHelpers = { addFilter: () => {}, removeFilter: () => {}, clearAllFilters: () => {} },
  filterTypeOptions = [],
  getFilterValueOptions = () => []
}: AMU_Human_ATC4_ViewByProps) {
  // ATC level state management
  const [atcLevel, setAtcLevel] = useState<string>('atc4');
  
  const [viewBy, setViewBy] = useState('facility');

  // Convert MainDonut2 data format to ViewBy bar chart format
  const transformDataForViewBy = (donutData: any[], category: string) => {
    const result: any = { category };
    let totalShown = 0;
    
    // Add all the individual antimicrobials
    donutData.forEach(item => {
      if (item.atc4 && item.value > 0) {
        result[item.atc4] = item.value;
        totalShown += item.value;
      }
    });
    
    // Calculate and add OTHER category to make total = 100%
    const remainingPercentage = Math.max(0, 100 - totalShown);
    if (remainingPercentage > 0) {
      result['OTHER'] = Math.round(remainingPercentage * 10) / 10; // Round to 1 decimal place
    }
    
    return result;
  };

  // Generate data based on view selection using same logic as MainDonut2
  const getViewByData = () => {
    switch (viewBy) {
      case 'facility':
        // Data for different facilities
        const facilityData = [];
        
        if (atcLevel === 'atc5') {
          // Eastern Regional Hospital ATC5 data (N=245)
          facilityData.push(transformDataForViewBy([
            { atc4: "J01CR02", label: "Amoxicillin/clavulanic acid", value: 20.0, prescriptions: 49 },
            { atc4: "J01DD04", label: "Ceftriaxone", value: 12.2, prescriptions: 30 },
            { atc4: "J01CA01", label: "Ampicillin", value: 10.6, prescriptions: 26 },
            { atc4: "J01XD01", label: "Metronidazole", value: 10.6, prescriptions: 26 },
            { atc4: "J01GB06", label: "Amikacin", value: 10.6, prescriptions: 26 },
            { atc4: "P01AB01", label: "Metronidazole", value: 9.4, prescriptions: 23 },
            { atc4: "J01FF01", label: "Clindamycin", value: 6.1, prescriptions: 15 },
            { atc4: "J01MA02", label: "Ciprofloxacin", value: 5.3, prescriptions: 13 },
            { atc4: "J01CE01", label: "Benzylpenicillin", value: 3.3, prescriptions: 8 },
            { atc4: "J01DE01", label: "Cefazolin", value: 2.9, prescriptions: 7 }
          ], 'Eastern Regional Hospital'));
          
          // Korle Bu University Teaching Hospital ATC5 data (N=725)
          facilityData.push(transformDataForViewBy([
            { atc4: "J01DD04", label: "Ceftriaxone", value: 14.3, prescriptions: 104 },
            { atc4: "J01CR02", label: "Amoxicillin/clavulanic acid", value: 13.9, prescriptions: 101 },
            { atc4: "J01XD01", label: "Metronidazole", value: 8.6, prescriptions: 62 },
            { atc4: "J01DH02", label: "Meropenem", value: 7.4, prescriptions: 54 },
            { atc4: "P01AB01", label: "Metronidazole", value: 7.2, prescriptions: 52 },
            { atc4: "J01MA02", label: "Ciprofloxacin", value: 6.1, prescriptions: 44 },
            { atc4: "J01FF01", label: "Clindamycin", value: 5.9, prescriptions: 43 },
            { atc4: "J01DC02", label: "Cefuroxime", value: 4.8, prescriptions: 35 },
            { atc4: "J01CA01", label: "Ampicillin", value: 4.1, prescriptions: 30 },
            { atc4: "J01GB06", label: "Amikacin", value: 4.0, prescriptions: 29 }
          ], 'Korle-Bu Teaching Hospital'));
        } else if (atcLevel === 'atc4') {
          // Eastern Regional Hospital ATC4 data (N=245)
          facilityData.push(transformDataForViewBy([
            { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 20.4, prescriptions: 50 },
            { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 18.4, prescriptions: 45 },
            { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 13.5, prescriptions: 33 },
            { atc4: "J01XD", label: "Imidazoles", value: 10.6, prescriptions: 26 },
            { atc4: "J01GB", label: "Other aminoglycosides", value: 10.6, prescriptions: 26 },
            { atc4: "P01AB", label: "Nitroimidazole derivatives", value: 9.4, prescriptions: 23 },
            { atc4: "J01FF", label: "Lincosamides", value: 6.1, prescriptions: 15 },
            { atc4: "J01MA", label: "Fluoroquinolones", value: 5.3, prescriptions: 13 },
            { atc4: "J01CE", label: "β-lactamase-sensitive penicillins", value: 3.3, prescriptions: 8 },
            { atc4: "J01DE", label: "Cephalosporins, 1st gen", value: 2.9, prescriptions: 7 }
          ], 'Eastern Regional Hospital'));
          
          // Korle Bu University Teaching Hospital ATC4 data (N=725)
          facilityData.push(transformDataForViewBy([
            { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 14.3, prescriptions: 104 },
            { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 13.9, prescriptions: 101 },
            { atc4: "J01XD", label: "Imidazoles", value: 8.6, prescriptions: 62 },
            { atc4: "J01DH", label: "Carbapenems", value: 7.4, prescriptions: 54 },
            { atc4: "P01AB", label: "Nitroimidazole derivatives", value: 7.2, prescriptions: 52 },
            { atc4: "J01MA", label: "Fluoroquinolones", value: 6.1, prescriptions: 44 },
            { atc4: "J01FF", label: "Lincosamides", value: 5.9, prescriptions: 43 },
            { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 4.8, prescriptions: 35 },
            { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 4.1, prescriptions: 30 },
            { atc4: "J01GB", label: "Other aminoglycosides", value: 4.0, prescriptions: 29 }
          ], 'Korle-Bu Teaching Hospital'));
        } else { // ATC3
          facilityData.push(transformDataForViewBy([
            { atc4: "J01C", label: "Beta-lactam antibacterials, penicillins", value: 44.3, prescriptions: 108 },
            { atc4: "J01D", label: "Other beta-lactam antibacterials", value: 18.4, prescriptions: 45 },
            { atc4: "J01X", label: "Other antibacterials", value: 12.3, prescriptions: 30 },
            { atc4: "J01G", label: "Aminoglycoside antibacterials", value: 10.6, prescriptions: 26 },
            { atc4: "P01A", label: "Agents against amoebiasis and protozoal diseases", value: 9.4, prescriptions: 23 },
            { atc4: "J01F", label: "Macrolides, lincosamides and streptogramins", value: 6.1, prescriptions: 15 },
            { atc4: "J01M", label: "Quinolone antibacterials", value: 5.3, prescriptions: 13 }
          ], 'Eastern Regional Hospital'));
          
          facilityData.push(transformDataForViewBy([
            { atc4: "J01D", label: "Other beta-lactam antibacterials", value: 26.5, prescriptions: 192 },
            { atc4: "J01C", label: "Beta-lactam antibacterials, penicillins", value: 18.0, prescriptions: 131 },
            { atc4: "J01X", label: "Other antibacterials", value: 8.6, prescriptions: 62 },
            { atc4: "P01A", label: "Agents against amoebiasis and protozoal diseases", value: 7.2, prescriptions: 52 },
            { atc4: "J01M", label: "Quinolone antibacterials", value: 6.1, prescriptions: 44 },
            { atc4: "J01F", label: "Macrolides, lincosamides and streptogramins", value: 5.9, prescriptions: 43 },
            { atc4: "J01G", label: "Aminoglycoside antibacterials", value: 4.0, prescriptions: 29 }
          ], 'Korle-Bu Teaching Hospital'));
        }
        
        return facilityData;

      case 'subDepartment':
        const subDeptData = [];
        
        if (atcLevel === 'atc5') {
          // Adult Medical Ward ATC5 data (N=348)
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01DD04", label: "Ceftriaxone", value: 18.4, prescriptions: 64 },
            { atc4: "J01CR02", label: "Amoxicillin/clavulanic acid", value: 12.9, prescriptions: 45 },
            { atc4: "J01XD01", label: "Metronidazole", value: 10.6, prescriptions: 37 },
            { atc4: "P01AB01", label: "Metronidazole", value: 8.9, prescriptions: 31 },
            { atc4: "J01DC02", label: "Cefuroxime", value: 8.3, prescriptions: 29 },
            { atc4: "J01DH02", label: "Meropenem", value: 5.2, prescriptions: 18 },
            { atc4: "J01FF01", label: "Clindamycin", value: 4.9, prescriptions: 17 },
            { atc4: "J01CA04", label: "Amoxicillin", value: 4.6, prescriptions: 16 },
            { atc4: "J01FA10", label: "Azithromycin", value: 4.6, prescriptions: 16 },
            { atc4: "J01MA12", label: "Levofloxacin", value: 4.3, prescriptions: 15 }
          ], 'Adult Medical Ward'));
          
          // Adult Surgical Ward ATC5 data (N=338)
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01CR02", label: "Amoxicillin/clavulanic acid", value: 16.0, prescriptions: 54 },
            { atc4: "J01XD01", label: "Metronidazole", value: 12.4, prescriptions: 42 },
            { atc4: "P01AB01", label: "Metronidazole", value: 11.5, prescriptions: 39 },
            { atc4: "J01MA02", label: "Ciprofloxacin", value: 10.7, prescriptions: 36 },
            { atc4: "J01DD04", label: "Ceftriaxone", value: 10.4, prescriptions: 35 },
            { atc4: "J01FF01", label: "Clindamycin", value: 9.2, prescriptions: 31 },
            { atc4: "J01CA04", label: "Amoxicillin", value: 7.4, prescriptions: 25 },
            { atc4: "J01DC02", label: "Cefuroxime", value: 5.3, prescriptions: 18 },
            { atc4: "J01DH02", label: "Meropenem", value: 5.0, prescriptions: 17 },
            { atc4: "J01GB03", label: "Gentamicin", value: 3.6, prescriptions: 12 }
          ], 'Adult Surgical Ward'));
          
          // Neonatal Intensive Care Unit ATC5 data (N=105)
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01CA01", label: "Ampicillin", value: 43.8, prescriptions: 46 },
            { atc4: "J01GB03", label: "Gentamicin", value: 20.0, prescriptions: 21 },
            { atc4: "J01GB06", label: "Amikacin", value: 19.0, prescriptions: 20 },
            { atc4: "J01DD01", label: "Cefotaxime", value: 7.6, prescriptions: 8 },
            { atc4: "J01DH02", label: "Meropenem", value: 7.6, prescriptions: 8 },
            { atc4: "J01XA01", label: "Vancomycin", value: 1.0, prescriptions: 1 },
            { atc4: "J01XB02", label: "Polymyxin B", value: 1.0, prescriptions: 1 }
          ], 'Neonatal Intensive Care Unit'));
          
          // Pediatric Medical Ward ATC5 data (N=95)
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01DD04", label: "Ceftriaxone", value: 17.9, prescriptions: 17 },
            { atc4: "J01GB03", label: "Gentamicin", value: 10.5, prescriptions: 10 },
            { atc4: "J01DH02", label: "Meropenem", value: 9.5, prescriptions: 9 },
            { atc4: "J01CE01", label: "Benzylpenicillin", value: 9.5, prescriptions: 9 },
            { atc4: "J01CA01", label: "Ampicillin", value: 9.5, prescriptions: 9 },
            { atc4: "J01DD01", label: "Cefotaxime", value: 6.3, prescriptions: 6 },
            { atc4: "J01CF02", label: "Phenoxymethylpenicillin", value: 5.3, prescriptions: 5 },
            { atc4: "J01CR02", label: "Amoxicillin/clavulanic acid", value: 3.2, prescriptions: 3 },
            { atc4: "J01FF01", label: "Clindamycin", value: 3.2, prescriptions: 3 },
            { atc4: "J01EE01", label: "Sulfamethoxazole/trimethoprim", value: 3.2, prescriptions: 3 }
          ], 'Pediatric Medical Ward'));
        } else if (atcLevel === 'atc4') {
          // Adult Medical Ward ATC4 data
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 19.0, prescriptions: 66 },
            { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 12.9, prescriptions: 45 },
            { atc4: "J01XD", label: "Imidazoles", value: 10.6, prescriptions: 37 },
            { atc4: "P01AB", label: "Nitroimidazole derivatives", value: 9.2, prescriptions: 32 },
            { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 8.3, prescriptions: 29 },
            { atc4: "J01MA", label: "Fluoroquinolones", value: 7.5, prescriptions: 26 },
            { atc4: "J01FA", label: "Macrolides", value: 5.5, prescriptions: 19 },
            { atc4: "J01DH", label: "Carbapenems", value: 5.2, prescriptions: 18 },
            { atc4: "J01FF", label: "Lincosamides", value: 4.9, prescriptions: 17 },
            { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 4.6, prescriptions: 16 }
          ], 'Adult Medical Ward'));
          
          // Adult Surgical Ward ATC4 data
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 16.0, prescriptions: 54 },
            { atc4: "J01XD", label: "Imidazoles", value: 12.4, prescriptions: 42 },
            { atc4: "P01AB", label: "Nitroimidazole derivatives", value: 11.8, prescriptions: 40 },
            { atc4: "J01MA", label: "Fluoroquinolones", value: 11.5, prescriptions: 39 },
            { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 10.9, prescriptions: 37 },
            { atc4: "J01FF", label: "Lincosamides", value: 9.2, prescriptions: 31 },
            { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 7.4, prescriptions: 25 },
            { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 5.3, prescriptions: 18 },
            { atc4: "J01DH", label: "Carbapenems", value: 5.0, prescriptions: 17 },
            { atc4: "J01GB", label: "Other aminoglycosides", value: 4.4, prescriptions: 15 }
          ], 'Adult Surgical Ward'));
          
          // Neonatal Intensive Care Unit ATC4 data
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 43.8, prescriptions: 46 },
            { atc4: "J01GB", label: "Other aminoglycosides", value: 39.0, prescriptions: 41 },
            { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 7.6, prescriptions: 8 },
            { atc4: "J01DH", label: "Carbapenems", value: 7.6, prescriptions: 8 },
            { atc4: "J01XA", label: "Glycopeptides", value: 1.0, prescriptions: 1 },
            { atc4: "J01XB", label: "Polymyxins", value: 1.0, prescriptions: 1 }
          ], 'Neonatal Intensive Care Unit'));
          
          // Pediatric Medical Ward ATC4 data
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 24.2, prescriptions: 23 },
            { atc4: "J01CE", label: "β-lactamase-sensitive penicillins", value: 12.6, prescriptions: 12 },
            { atc4: "J01GB", label: "Other aminoglycosides", value: 12.6, prescriptions: 12 },
            { atc4: "J01DH", label: "Carbapenems", value: 9.5, prescriptions: 9 },
            { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 9.5, prescriptions: 9 },
            { atc4: "J01CF", label: "Beta-lactamase resistant penicillins", value: 5.3, prescriptions: 5 },
            { atc4: "J01FA", label: "Macrolides", value: 4.2, prescriptions: 4 },
            { atc4: "J01FF", label: "Lincosamides", value: 3.2, prescriptions: 3 },
            { atc4: "J01EE", label: "Sulfonamides + trimethoprim", value: 3.2, prescriptions: 3 },
            { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 3.2, prescriptions: 3 }
          ], 'Pediatric Medical Ward'));
        } else { // ATC3
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01D", label: "Other beta-lactam antibacterials", value: 32.5, prescriptions: 113 },
            { atc4: "J01C", label: "Beta-lactam antibacterials, penicillins", value: 20.1, prescriptions: 70 },
            { atc4: "J01X", label: "Other antibacterials", value: 10.9, prescriptions: 38 },
            { atc4: "J01F", label: "Macrolides, lincosamides and streptogramins", value: 10.3, prescriptions: 36 },
            { atc4: "P01A", label: "Agents against amoebiasis and protozoal diseases", value: 9.2, prescriptions: 32 },
            { atc4: "J01M", label: "Quinolone antibacterials", value: 7.5, prescriptions: 26 }
          ], 'Adult Medical Ward'));
          
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01C", label: "Beta-lactam antibacterials, penicillins", value: 24.6, prescriptions: 83 },
            { atc4: "J01D", label: "Other beta-lactam antibacterials", value: 21.3, prescriptions: 72 },
            { atc4: "J01X", label: "Other antibacterials", value: 13.6, prescriptions: 46 },
            { atc4: "P01A", label: "Agents against amoebiasis and protozoal diseases", value: 11.8, prescriptions: 40 },
            { atc4: "J01M", label: "Quinolone antibacterials", value: 11.5, prescriptions: 39 },
            { atc4: "J01F", label: "Macrolides, lincosamides and streptogramins", value: 10.4, prescriptions: 35 },
            { atc4: "J01G", label: "Aminoglycoside antibacterials", value: 4.4, prescriptions: 15 }
          ], 'Adult Surgical Ward'));
          
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01C", label: "Beta-lactam antibacterials, penicillins", value: 43.8, prescriptions: 46 },
            { atc4: "J01G", label: "Aminoglycoside antibacterials", value: 39.0, prescriptions: 41 },
            { atc4: "J01D", label: "Other beta-lactam antibacterials", value: 15.2, prescriptions: 16 },
            { atc4: "J01X", label: "Other antibacterials", value: 1.9, prescriptions: 2 }
          ], 'Neonatal Intensive Care Unit'));
          
          subDeptData.push(transformDataForViewBy([
            { atc4: "J01D", label: "Other beta-lactam antibacterials", value: 35.8, prescriptions: 34 },
            { atc4: "J01C", label: "Beta-lactam antibacterials, penicillins", value: 30.5, prescriptions: 29 },
            { atc4: "J01G", label: "Aminoglycoside antibacterials", value: 12.6, prescriptions: 12 },
            { atc4: "J01F", label: "Macrolides, lincosamides and streptogramins", value: 7.4, prescriptions: 7 },
            { atc4: "J01E", label: "Sulfonamides and trimethoprim", value: 3.2, prescriptions: 3 }
          ], 'Pediatric Medical Ward'));
        }
        
        return subDeptData;

      case 'mainDepartment':
        const mainDeptData = [];
        
        if (atcLevel === 'atc5') {
          // Adult Department ATC5 data (N=702)
          mainDeptData.push(transformDataForViewBy([
            { atc4: "J01DD04", label: "Ceftriaxone", value: 15.1, prescriptions: 106 },
            { atc4: "J01CR02", label: "Amoxicillin/clavulanic acid", value: 14.4, prescriptions: 101 },
            { atc4: "J01XD01", label: "Metronidazole", value: 11.4, prescriptions: 80 },
            { atc4: "P01AB01", label: "Metronidazole", value: 10.3, prescriptions: 72 },
            { atc4: "J01MA02", label: "Ciprofloxacin", value: 9.7, prescriptions: 68 },
            { atc4: "J01FA10", label: "Azithromycin", value: 8.8, prescriptions: 62 },
            { atc4: "J01DC02", label: "Cefuroxime", value: 6.4, prescriptions: 45 },
            { atc4: "J01DH02", label: "Meropenem", value: 5.7, prescriptions: 40 },
            { atc4: "J01CA04", label: "Amoxicillin", value: 4.6, prescriptions: 32 },
            { atc4: "J01FF01", label: "Clindamycin", value: 3.4, prescriptions: 24 }
          ], 'Adult Ward'));
          
          // Paediatric Department ATC5 data (N=268)
          mainDeptData.push(transformDataForViewBy([
            { atc4: "J01CA01", label: "Ampicillin", value: 21.6, prescriptions: 58 },
            { atc4: "J01GB03", label: "Gentamicin", value: 11.9, prescriptions: 32 },
            { atc4: "J01GB06", label: "Amikacin", value: 9.3, prescriptions: 25 },
            { atc4: "J01DD04", label: "Ceftriaxone", value: 9.0, prescriptions: 24 },
            { atc4: "J01DH02", label: "Meropenem", value: 9.0, prescriptions: 24 },
            { atc4: "J01DD01", label: "Cefotaxime", value: 6.7, prescriptions: 18 },
            { atc4: "J01CR02", label: "Amoxicillin/clavulanic acid", value: 3.4, prescriptions: 9 },
            { atc4: "J01CE01", label: "Benzylpenicillin", value: 3.4, prescriptions: 9 },
            { atc4: "J01XD01", label: "Metronidazole", value: 3.0, prescriptions: 8 },
            { atc4: "J01MA02", label: "Ciprofloxacin", value: 2.6, prescriptions: 7 }
          ], 'Paediatric Ward'));
        } else if (atcLevel === 'atc4') {
          // Adult Department ATC4 data
          mainDeptData.push(transformDataForViewBy([
            { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 15.1, prescriptions: 106 },
            { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 14.4, prescriptions: 101 },
            { atc4: "J01XD", label: "Imidazoles", value: 11.4, prescriptions: 80 },
            { atc4: "P01AB", label: "Nitroimidazole derivatives", value: 10.3, prescriptions: 72 },
            { atc4: "J01MA", label: "Fluoroquinolones", value: 9.7, prescriptions: 68 },
            { atc4: "J01FA", label: "Macrolides", value: 8.8, prescriptions: 62 },
            { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 6.4, prescriptions: 45 },
            { atc4: "J01DH", label: "Carbapenems", value: 5.7, prescriptions: 40 },
            { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 4.6, prescriptions: 32 },
            { atc4: "J01FF", label: "Lincosamides", value: 3.4, prescriptions: 24 }
          ], 'Adult Ward'));
          
          // Paediatric Department ATC4 data
          mainDeptData.push(transformDataForViewBy([
            { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 25.0, prescriptions: 67 },
            { atc4: "J01GB", label: "Other aminoglycosides", value: 21.2, prescriptions: 57 },
            { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 15.7, prescriptions: 42 },
            { atc4: "J01DH", label: "Carbapenems", value: 9.0, prescriptions: 24 },
            { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 3.4, prescriptions: 9 },
            { atc4: "J01CE", label: "β-lactamase-sensitive penicillins", value: 3.4, prescriptions: 9 },
            { atc4: "J01XD", label: "Imidazoles", value: 3.0, prescriptions: 8 },
            { atc4: "J01MA", label: "Fluoroquinolones", value: 2.6, prescriptions: 7 }
          ], 'Paediatric Ward'));
        } else { // ATC3
          mainDeptData.push(transformDataForViewBy([
            { atc4: "J01C", label: "Beta-lactam antibacterials, penicillins", value: 22.4, prescriptions: 157 },
            { atc4: "J01D", label: "Other beta-lactam antibacterials", value: 26.8, prescriptions: 188 },
            { atc4: "J01X", label: "Other antibacterials", value: 11.4, prescriptions: 80 },
            { atc4: "P01A", label: "Agents against amoebiasis and protozoal diseases", value: 10.3, prescriptions: 72 },
            { atc4: "J01M", label: "Quinolone antibacterials", value: 9.7, prescriptions: 68 },
            { atc4: "J01F", label: "Macrolides, lincosamides and streptogramins", value: 12.2, prescriptions: 86 }
          ], 'Adult Ward'));
          
          mainDeptData.push(transformDataForViewBy([
            { atc4: "J01C", label: "Beta-lactam antibacterials, penicillins", value: 28.4, prescriptions: 76 },
            { atc4: "J01G", label: "Aminoglycoside antibacterials", value: 21.2, prescriptions: 57 },
            { atc4: "J01D", label: "Other beta-lactam antibacterials", value: 24.7, prescriptions: 66 },
            { atc4: "J01X", label: "Other antibacterials", value: 3.0, prescriptions: 8 },
            { atc4: "J01M", label: "Quinolone antibacterials", value: 2.6, prescriptions: 7 }
          ], 'Paediatric Ward'));
        }
        
        return mainDeptData;

      case 'sex':
        const sexData = [];
        
        if (atcLevel === 'atc5') {
          // Male ATC5 data (N=392)
          sexData.push(transformDataForViewBy([
            { atc4: "J01DD04", label: "Ceftriaxone", value: 18.1, prescriptions: 71 },
            { atc4: "J01MA02", label: "Ciprofloxacin", value: 11.5, prescriptions: 45 },
            { atc4: "J01CR02", label: "Amoxicillin/clavulanic acid", value: 10.5, prescriptions: 41 },
            { atc4: "J01DC02", label: "Cefuroxime", value: 9.9, prescriptions: 39 },
            { atc4: "J01FA10", label: "Azithromycin", value: 9.2, prescriptions: 36 },
            { atc4: "J01CA04", label: "Amoxicillin", value: 8.4, prescriptions: 33 },
            { atc4: "J01GB03", label: "Gentamicin", value: 6.1, prescriptions: 24 },
            { atc4: "J01XD01", label: "Metronidazole", value: 5.9, prescriptions: 23 },
            { atc4: "J01DH02", label: "Meropenem", value: 5.4, prescriptions: 21 },
            { atc4: "J01FF01", label: "Clindamycin", value: 5.1, prescriptions: 20 }
          ], 'Male'));
          
          // Female ATC5 data (N=578)
          sexData.push(transformDataForViewBy([
            { atc4: "J01CR02", label: "Amoxicillin/clavulanic acid", value: 14.2, prescriptions: 82 },
            { atc4: "J01DD04", label: "Ceftriaxone", value: 11.8, prescriptions: 68 },
            { atc4: "J01XD01", label: "Metronidazole", value: 10.9, prescriptions: 63 },
            { atc4: "P01AB01", label: "Metronidazole", value: 10.7, prescriptions: 62 },
            { atc4: "J01DC02", label: "Cefuroxime", value: 6.1, prescriptions: 35 },
            { atc4: "J01DH02", label: "Meropenem", value: 6.1, prescriptions: 35 },
            { atc4: "J01CA04", label: "Amoxicillin", value: 5.7, prescriptions: 33 },
            { atc4: "J01FF01", label: "Clindamycin", value: 4.8, prescriptions: 28 },
            { atc4: "J01CA01", label: "Ampicillin", value: 4.0, prescriptions: 23 },
            { atc4: "J01MA02", label: "Ciprofloxacin", value: 3.8, prescriptions: 22 }
          ], 'Female'));
        } else if (atcLevel === 'atc4') {
          // Male ATC4 data (N=392)
          sexData.push(transformDataForViewBy([
            { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 18.4, prescriptions: 72 },
            { atc4: "J01MA", label: "Fluoroquinolones", value: 11.5, prescriptions: 45 },
            { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 11.2, prescriptions: 44 },
            { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 9.9, prescriptions: 39 },
            { atc4: "J01FA", label: "Macrolides", value: 9.2, prescriptions: 36 },
            { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 8.4, prescriptions: 33 },
            { atc4: "J01GB", label: "Other aminoglycosides", value: 7.9, prescriptions: 31 },
            { atc4: "J01DH", label: "Carbapenems", value: 6.6, prescriptions: 26 },
            { atc4: "J01XD", label: "Imidazoles", value: 6.6, prescriptions: 26 },
            { atc4: "J01FF", label: "Lincosamides", value: 6.1, prescriptions: 24 }
          ], 'Male'));
          
          // Female ATC4 data (N=578)
          sexData.push(transformDataForViewBy([
            { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 14.2, prescriptions: 82 },
            { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 11.8, prescriptions: 68 },
            { atc4: "J01XD", label: "Imidazoles", value: 10.9, prescriptions: 63 },
            { atc4: "P01AB", label: "Nitroimidazole derivatives", value: 10.7, prescriptions: 62 },
            { atc4: "J01GB", label: "Other aminoglycosides", value: 6.2, prescriptions: 36 },
            { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 6.1, prescriptions: 35 },
            { atc4: "J01DH", label: "Carbapenems", value: 6.1, prescriptions: 35 },
            { atc4: "J01MA", label: "Fluoroquinolones", value: 5.4, prescriptions: 31 },
            { atc4: "J01FF", label: "Lincosamides", value: 4.8, prescriptions: 28 },
            { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 4.0, prescriptions: 23 }
          ], 'Female'));
        } else { // ATC3
          sexData.push(transformDataForViewBy([
            { atc4: "J01D", label: "Other beta-lactam antibacterials", value: 28.3, prescriptions: 111 },
            { atc4: "J01M", label: "Quinolone antibacterials", value: 11.5, prescriptions: 45 },
            { atc4: "J01C", label: "Beta-lactam antibacterials, penicillins", value: 19.6, prescriptions: 77 },
            { atc4: "J01F", label: "Macrolides, lincosamides and streptogramins", value: 15.3, prescriptions: 60 },
            { atc4: "J01G", label: "Aminoglycoside antibacterials", value: 7.9, prescriptions: 31 },
            { atc4: "J01X", label: "Other antibacterials", value: 6.6, prescriptions: 26 }
          ], 'Male'));
          
          sexData.push(transformDataForViewBy([
            { atc4: "J01C", label: "Beta-lactam antibacterials, penicillins", value: 18.2, prescriptions: 105 },
            { atc4: "J01D", label: "Other beta-lactam antibacterials", value: 17.9, prescriptions: 103 },
            { atc4: "J01X", label: "Other antibacterials", value: 10.9, prescriptions: 63 },
            { atc4: "P01A", label: "Agents against amoebiasis and protozoal diseases", value: 10.7, prescriptions: 62 },
            { atc4: "J01G", label: "Aminoglycoside antibacterials", value: 6.2, prescriptions: 36 },
            { atc4: "J01M", label: "Quinolone antibacterials", value: 5.4, prescriptions: 31 },
            { atc4: "J01F", label: "Macrolides, lincosamides and streptogramins", value: 4.8, prescriptions: 28 }
          ], 'Female'));
        }
        
        return sexData;

      default:
        return [];
    }
  };

  const viewByOptions = useMemo(() => [
    { value: 'facility', label: 'by Facility' },
    { value: 'subDepartment', label: 'by Sub-Department' },
    { value: 'mainDepartment', label: 'by Main Department' },
    { value: 'sex', label: 'by Sex' }
  ], []);

  const data = useMemo(() => getViewByData(), [viewBy, atcLevel, regionActiveFilters]);
  
  // Get all unique codes from data for consistent rendering
  const allCodes = useMemo(() => {
    return Array.from(new Set(
      data.flatMap(item => Object.keys(item).filter(key => key !== 'category'))
    ));
  }, [data]);

  // Get appropriate colors and labels based on ATC level
  const colors = useMemo(() => {
    if (atcLevel === 'atc3') return ATC3_COLORS;
    if (atcLevel === 'atc5') return ATC5_COLORS;
    return ATC4_COLORS;
  }, [atcLevel]);
  
  const labels = useMemo(() => {
    if (atcLevel === 'atc3') return ATC3_LABELS;
    if (atcLevel === 'atc5') return ATC5_LABELS;
    return ATC4_LABELS;
  }, [atcLevel]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const hoveredSegment = payload[payload.length - 1];
      
      if (hoveredSegment && hoveredSegment.value > 0) {
        const code = hoveredSegment.dataKey;
        const percentage = hoveredSegment.value.toFixed(1);
        const codeLabel = labels[code as keyof typeof labels];
        
        // Calculate estimated prescription count
        const estimatedPrescriptions = Math.round((hoveredSegment.value * 252) / 10);
        
        return (
          <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
            <div className="text-black font-medium text-sm mb-1">
              {codeLabel || 'Unknown'} — {code}
            </div>
            <div className="text-gray-600 text-sm mb-1">
              {estimatedPrescriptions.toLocaleString()} prescriptions
            </div>
            <div className="text-cyan-600 font-medium text-sm">
              {percentage}% of {label}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg font-medium">
              Comparison of {atcLevel.toUpperCase()} Antimicrobial Use in Ghana
            </CardTitle>
            <Select value={viewBy} onValueChange={setViewBy}>
              <SelectTrigger className="w-[140px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {viewByOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log(`Download ${atcLevel.toUpperCase()} ViewBy chart data`);
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 m-[0px]">
            Distribution of Systemic Antibacterial Prescriptions by {atcLevel.toUpperCase()} {atcLevel === 'atc3' ? 'Class' : atcLevel === 'atc4' ? 'Class' : 'Antibiotic'} {viewByOptions.find(o => o.value === viewBy)?.label}
          </p>
          <ToggleGroup 
            type="single" 
            value={atcLevel} 
            onValueChange={(value) => value && setAtcLevel(value)}
            className="bg-gray-100 rounded-md p-0.5 h-5"
          >
            <ToggleGroupItem 
              value="atc3" 
              className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
            >
              ATC3
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="atc4" 
              className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
            >
              ATC4
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="atc5" 
              className="text-xs px-1.5 py-0 h-4 data-[state=on]:bg-white data-[state=on]:shadow-sm"
            >
              ATC5
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Select value={regionFilterType} onValueChange={setRegionFilterType}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select filter type..." />
                </SelectTrigger>
                <SelectContent>
                  {filterTypeOptions?.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <Select 
                value={regionFilterValue} 
                onValueChange={setRegionFilterValue}
                disabled={!regionFilterType}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder={regionFilterType ? "Select value..." : "Select type first"} />
                </SelectTrigger>
                <SelectContent>
                  {getFilterValueOptions?.(regionFilterType)?.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Filter Button */}
            <button
              onClick={regionFilterHelpers?.addFilter}
              disabled={!regionFilterType || !regionFilterValue}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {regionActiveFilters && regionActiveFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({regionActiveFilters.length})
              </span>
              <button
                onClick={regionFilterHelpers?.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {regionActiveFilters?.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => regionFilterHelpers.removeFilter(index)}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-[0px] pr-[24px] pb-[20px] pl-[24px]">
        {/* Chart Area */}
        <div className="w-full h-96 mb-[15px] mt-[0px] mr-[0px] ml-[0px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              barCategoryGap="10%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                angle={viewBy === 'subDepartment' ? -45 : 0}
                textAnchor={viewBy === 'subDepartment' ? 'end' : 'middle'}
                height={viewBy === 'subDepartment' ? 80 : 60}
                label={{ 
                  value: (() => {
                    switch (viewBy) {
                      case 'facility': return 'Facility';
                      case 'subDepartment': return 'Sub-Department';
                      case 'mainDepartment': return 'Main Department';
                      case 'sex': return 'Sex';
                      default: return 'Category';
                    }
                  })(),
                  position: 'insideBottom',
                  offset: 0,
                  style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => `${value}%`}
                label={{ 
                  value: 'Share of Prescriptions (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                }}
              />
              <Tooltip 
                shared={false}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length > 0) {
                    const hoveredSegment = payload[0];
                    
                    if (hoveredSegment && hoveredSegment.value > 0) {
                      const code = hoveredSegment.dataKey;
                      const percentage = hoveredSegment.value.toFixed(1);
                      // colors and labels are already available in scope
                      const codeLabel = labels[code as keyof typeof labels];
                      const color = colors[code as keyof typeof colors];
                      
                      // Calculate prescription counts
                      let slicePrescriptions, totalBarPrescriptions;
                      
                      if (viewBy === 'subDepartment') {
                        // Use actual sub-department totals
                        const subDeptTotals: Record<string, number> = {
                          'Adult Medical Ward': 348,
                          'Adult Surgical Ward': 338,
                          'Neonatal Intensive Care Unit': 105,
                          'Pediatric Medical Ward': 95
                        };
                        
                        totalBarPrescriptions = subDeptTotals[label as string] || 0;
                        slicePrescriptions = Math.round((parseFloat(percentage) * totalBarPrescriptions) / 100);
                      } else if (viewBy === 'facility') {
                        // Use actual facility totals
                        const facilityTotals: Record<string, number> = {
                          'Eastern Regional Hospital': 245,
                          'Korle-Bu Teaching Hospital': 725
                        };
                        
                        totalBarPrescriptions = facilityTotals[label as string] || 0;
                        slicePrescriptions = Math.round((parseFloat(percentage) * totalBarPrescriptions) / 100);
                      } else if (viewBy === 'mainDepartment') {
                        // Use actual main department totals
                        const mainDeptTotals: Record<string, number> = {
                          'Adult Ward': 702,
                          'Paediatric Ward': 268
                        };
                        
                        totalBarPrescriptions = mainDeptTotals[label as string] || 0;
                        slicePrescriptions = Math.round((parseFloat(percentage) * totalBarPrescriptions) / 100);
                      } else if (viewBy === 'sex') {
                        // Use actual sex totals
                        const sexTotals: Record<string, number> = {
                          'Male': 392,
                          'Female': 578
                        };
                        
                        totalBarPrescriptions = sexTotals[label as string] || 0;
                        slicePrescriptions = Math.round((parseFloat(percentage) * totalBarPrescriptions) / 100);
                      } else {
                        // For other views, use estimated total based on national average
                        const estimatedTotal = 252; // Average per category
                        totalBarPrescriptions = estimatedTotal;
                        slicePrescriptions = Math.round((parseFloat(percentage) * estimatedTotal) / 100);
                      }
                      
                      return (
                        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
                          {/* ATC Code with color dot */}
                          <div className="flex items-center gap-2 mb-1">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: color || "#6b7280" }}
                            />
                            <span className="font-mono text-sm font-medium text-gray-900">
                              {code}
                            </span>
                          </div>
                          
                          {/* ATC category name */}
                          <div className="text-gray-900 text-sm mb-1">
                            {codeLabel || `Unknown ${atcLevel.toUpperCase()} Class`}
                          </div>
                          
                          {/* Prescription count */}
                          <div className="text-gray-600 text-sm mb-1">
                            {slicePrescriptions.toLocaleString()} of {totalBarPrescriptions.toLocaleString()} prescriptions
                          </div>
                          
                          {/* Percentage */}
                          <div className="text-sm" style={{ color: color || "#6b7280" }}>
                            {percentage}% of total
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                }}
              />
              
              {/* Render bars for each code */}
              {allCodes.map((code) => {
                return (
                  <Bar
                    key={code}
                    dataKey={code}
                    stackId={atcLevel}
                    fill={colors[code as keyof typeof colors] || "#6b7280"}
                    cursor="pointer"
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - 4 Column Grid */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {atcLevel.toUpperCase()} {atcLevel === 'atc3' ? 'Categories' : 'Classes'}
          </h3>
          <div className="grid grid-cols-4 gap-x-6 gap-y-3 min-h-[120px]">
            {[...allCodes].sort().map((code) => {
              const label = labels[code as keyof typeof labels];
              const color = colors[code as keyof typeof colors];
              
              return (
                <div key={code} className="flex items-center gap-2 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: color || "#6b7280" }}
                  ></div>
                  <span className="text-gray-700 text-xs truncate min-w-0 flex-1" title={label}>
                    <span className="font-mono">{code}</span> {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footnote */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            PPS data; excludes topical antibacterials and anti-TB drugs. Bars show 100% stacked distribution.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}