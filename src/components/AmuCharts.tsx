import React, { useState, useMemo, useCallback } from 'react';
import { useAMUFilters, getFilterTypeOptions, getFilterValueOptions } from './AMU_FilterConfigs';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, ReferenceLine } from 'recharts';
import { DiagnosisProfileView, IndicationProfileAggregate } from './AmuChartsWithDiagnosis';
import { AMUNational } from './AMUNational';

import { AMU_Human_Timeline } from './AMU_Human_Timeline';
import { AMU_Human_Overview_Region } from './AMU_Human_Overview_Region';
import { AMU_Human_Overview_Hospital } from './AMU_Human_Overview_Hospital';
import { AMU_Human_Overview_Activity } from './AMU_Human_Overview_Activity';
import { AMU_Human_Overview_Activity2 } from './AMU_Human_Overview_Activity2';
import { AMU_Human_Overview_Ward } from './AMU_Human_Overview_Ward';
import { AMU_Human_ViewButtons } from './AMU_Human_ViewButtons';
import { AMU_Human_Overview_Sex } from './AMU_Human_Overview_Sex';
import { AMU_Human_Overview_Age } from './AMU_Human_Overview_Age';
import { AMU_Human_ATC4_MainDonut } from './AMU_Human_ATC4_MainDonut';
import { AMU_Human_ATC4_MainDonut2 } from './AMU_Human_ATC4_MainDonut2';
import { AMU_Human_ATC4_ViewBy } from './AMU_Human_ATC4_ViewBy';
import { AMU_Human_AWARE_MainDonut } from './AMU_Human_AWARE_MainDonut';
import { AMU_Human_AWARE_ViewBy } from './AMU_Human_AWARE_ViewBy';
import { AMU_Human_MISC_ATCxAWARE } from './AMU_Human_MISC_ATCxAWARE';
import { AMU_Human_Indication_MainDonut } from './AMU_Human_Indication_MainDonut';
import { AMU_Human_Indication_ViewBy } from './AMU_Human_Indication_ViewBy';
import { AMU_Human_Diagnosis_MainDonut } from './AMU_Human_Diagnosis_MainDonut';
import { AMU_Human_Diagnosis_ViewBy } from './AMU_Human_Diagnosis_ViewBy';
import { AMU_Human_Prophylaxis_MainDonut } from './AMU_Human_Prophylaxis_MainDonut';
import { AMU_Human_Prophylaxis_ViewBy } from './AMU_Human_Prophylaxis_ViewBy';
import { AMU_Human_Prophylaxis_Duration } from './AMU_Human_Prophylaxis_Duration';
import { AMU_Human_Prophylaxis_Compliance } from './AMU_Human_Prophylaxis_Compliance';
import { GenericWideFilter } from './GenericWideFilter';
import { QualitySummaryCards } from './QualitySummaryCards';
import { QualitySummaryCardsVertical } from './QualitySummaryCardsVertical';
import { AMU_Human_Quality_MainBar } from './AMU_Human_Quality_MainBar';
import { AMU_Human_Quality_ViewBy } from './AMU_Human_Quality_ViewBy';
import { AMU_Human_Quality_MainV2 } from './AMU_Human_Quality_MainV2';
import { AMU_Human_Quality_MainV3 } from './AMU_Human_Quality_MainV3';

import { Download } from 'lucide-react';

// Time series data for AMU prevalence (2023-2025)
const timeSeriesData = [
  { year: '2023', quarter: 'Q1', prevalence: 68.2, studies: 8 },
  { year: '2023', quarter: 'Q2', prevalence: 71.4, studies: 10 },
  { year: '2023', quarter: 'Q3', prevalence: 74.1, studies: 12 },
  { year: '2023', quarter: 'Q4', prevalence: 75.8, studies: 11 },
  { year: '2024', quarter: 'Q1', prevalence: 73.6, studies: 9 },
  { year: '2024', quarter: 'Q2', prevalence: 76.2, studies: 13 },
  { year: '2024', quarter: 'Q3', prevalence: 78.9, studies: 14 },
  { year: '2024', quarter: 'Q4', prevalence: 79.4, studies: 12 },
  { year: '2025', quarter: 'Q1', prevalence: 77.1, studies: 10 }
];

// PPS day prevalence data (patients prescribed at least one antimicrobial on day of PPS)
const ppsData = [
  { year: '2023', quarter: 'Q1', prevalence: 72.8, totalPatients: 8456, onAntimicrobials: 6154 },
  { year: '2023', quarter: 'Q2', prevalence: 75.1, totalPatients: 9234, onAntimicrobials: 6932 },
  { year: '2023', quarter: 'Q3', prevalence: 77.6, totalPatients: 10156, onAntimicrobials: 7881 },
  { year: '2023', quarter: 'Q4', prevalence: 79.2, totalPatients: 9867, onAntimicrobials: 7815 },
  { year: '2024', quarter: 'Q1', prevalence: 76.9, totalPatients: 8934, onAntimicrobials: 6870 },
  { year: '2024', quarter: 'Q2', prevalence: 80.1, totalPatients: 11245, onAntimicrobials: 9005 },
  { year: '2024', quarter: 'Q3', prevalence: 82.4, totalPatients: 12003, onAntimicrobials: 9891 },
  { year: '2024', quarter: 'Q4', prevalence: 83.7, totalPatients: 11567, onAntimicrobials: 9676 },
  { year: '2025', quarter: 'Q1', prevalence: 81.2, totalPatients: 9876, onAntimicrobials: 8019 }
];

// Ghana's 16 regions data
const regionData = [
  { region: 'Greater Accra', prevalence: 82.3, hospitals: 15, patients: 2840 },
  { region: 'Ashanti', prevalence: 79.1, hospitals: 12, patients: 2456 },
  { region: 'Western', prevalence: 76.8, hospitals: 8, patients: 1832 },
  { region: 'Eastern', prevalence: 75.2, hospitals: 9, patients: 1965 },
  { region: 'Central', prevalence: 73.6, hospitals: 7, patients: 1654 },
  { region: 'Northern', prevalence: 71.4, hospitals: 6, patients: 1423 },
  { region: 'Volta', prevalence: 69.8, hospitals: 5, patients: 1287 },
  { region: 'Brong Ahafo', prevalence: 72.5, hospitals: 6, patients: 1498 },
  { region: 'Upper East', prevalence: 68.3, hospitals: 4, patients: 987 },
  { region: 'Upper West', prevalence: 66.9, hospitals: 3, patients: 842 },
  { region: 'Western North', prevalence: 74.1, hospitals: 4, patients: 1156 },
  { region: 'Ahafo', prevalence: 70.7, hospitals: 3, patients: 894 },
  { region: 'Bono', prevalence: 71.9, hospitals: 4, patients: 1098 },
  { region: 'Bono East', prevalence: 69.5, hospitals: 3, patients: 956 },
  { region: 'Oti', prevalence: 67.2, hospitals: 3, patients: 743 },
  { region: 'North East', prevalence: 65.8, hospitals: 2, patients: 658 }
];

// Hospital data - Updated to align with the 10 teaching hospitals
const hospitalData = [
  { hospital: 'Ho Teaching Hospital', region: 'Volta', prevalence: 72.6, patients: 300 },
  { hospital: 'Komfo Anokye Teaching Hospital', region: 'Ashanti', prevalence: 81.7, patients: 800 },
  { hospital: 'Tamale Teaching Hospital', region: 'Northern', prevalence: 74.5, patients: 350 },
  { hospital: 'LEKMA Hospital', region: 'Greater Accra', prevalence: 76.3, patients: 180 },
  { hospital: 'Sunyani Teaching Hospital', region: 'Brong Ahafo', prevalence: 73.4, patients: 250 },
  { hospital: 'St. Martin de Porres Hospital', region: 'Greater Accra', prevalence: 75.8, patients: 120 },
  { hospital: 'Korle-Bu Teaching Hospital', region: 'Greater Accra', prevalence: 84.2, patients: 624 },
  { hospital: 'Cape Coast Teaching Hospital', region: 'Central', prevalence: 76.8, patients: 280 },
  { hospital: 'Eastern Regional Hospital', region: 'Eastern', prevalence: 78.4, patients: 222 },
  { hospital: 'University of Ghana Medical Center', region: 'Greater Accra', prevalence: 82.1, patients: 400 }
];

// Ward types data
const wardData = [
  { ward: 'Medical Ward', prevalence: 72.5, patients: 3245, hospitals: 45 },
  { ward: 'Surgical Ward', prevalence: 84.3, patients: 2834, hospitals: 42 },
  { ward: 'ICU', prevalence: 91.7, patients: 1567, hospitals: 38 },
  { ward: 'Pediatric Ward', prevalence: 68.9, patients: 2156, hospitals: 35 },
  { ward: 'Maternity Ward', prevalence: 63.4, patients: 1876, hospitals: 40 },
  { ward: 'Emergency Department', prevalence: 77.8, patients: 2987, hospitals: 43 },
  { ward: 'Orthopedic Ward', prevalence: 79.6, patients: 1654, hospitals: 28 },
  { ward: 'Oncology Ward', prevalence: 88.2, patients: 987, hospitals: 15 }
];

// Activity breakdown data
const activityData = [
  { activity: 'Medical', prevalence: 68.5, hospitals: 45, patients: 3245 },
  { activity: 'Surgical', prevalence: 79.2, hospitals: 42, patients: 2834 },
  { activity: 'Intensive Care', prevalence: 89.7, hospitals: 38, patients: 1567 }
];

// Hospital ward breakdown data with abbreviations and full names
const hospitalWardData = [
  { ward: 'AMW', fullName: 'Adult Medical Ward (AMW)', prevalence: 72.1, hospitals: 4, patients: 845 },
  { ward: 'ASW', fullName: 'Adult Surgical Ward (ASW)', prevalence: 84.7, hospitals: 4, patients: 723 },
  { ward: 'AHRW', fullName: 'High-Risk Adult Ward (AHRW)', prevalence: 91.3, hospitals: 3, patients: 456 },
  { ward: 'AICU', fullName: 'Adult Intensive Care Unit (AICU)', prevalence: 95.2, hospitals: 4, patients: 234 },
  { ward: 'PMW', fullName: 'Paediatric Medical Ward (PMW)', prevalence: 67.8, hospitals: 3, patients: 567 },
  { ward: 'PSW', fullName: 'Paediatric Surgical Ward (PSW)', prevalence: 78.9, hospitals: 3, patients: 389 },
  { ward: 'PHRW', fullName: 'High-Risk Paediatric Ward (PHRW)', prevalence: 89.4, hospitals: 2, patients: 178 },
  { ward: 'PICU', fullName: 'Paediatric Intensive Care Unit (PICU)', prevalence: 92.7, hospitals: 3, patients: 156 },
  { ward: 'NMW', fullName: 'Neonatal Medical Ward (NMW)', prevalence: 71.6, hospitals: 3, patients: 298 },
  { ward: 'NICU', fullName: 'Neonatal Intensive Care Unit (NICU)', prevalence: 88.3, hospitals: 3, patients: 134 },
  { ward: 'MXW', fullName: 'Mixed Ward (MXW)', prevalence: 75.4, hospitals: 2, patients: 423 }
];

// Filter options
const regions = regionData.map(r => r.region);

// Sex options (in order of appearance)
const sexOptions = [
  'Female',
  'Male',
  'Unknown'
];

// Age groups (in order of appearance)
const ageGroups = [
  'Neonates',
  'Under 5',
  '5-14',
  '15-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65-74',
  '75-84',
  '85-94',
  '95+'
];

// Hospital options (in order of appearance) - Updated with all 10 Ghanaian teaching hospitals
const hospitals = [
  'Ho Teaching Hospital',
  'Komfo Anokye Teaching Hospital',
  'Tamale Teaching Hospital',
  'LEKMA Hospital',
  'Sunyani Teaching Hospital',
  'St. Martin de Porres Hospital',
  'Korle-Bu Teaching Hospital',
  'Cape Coast Teaching Hospital',
  'Eastern Regional Hospital',
  'University of Ghana Medical Center'
];

// Hospital Activity options (in order of appearance)
const hospitalActivities = [
  'Medical',
  'Surgical',
  'Intensive Care'
];

// Hospital Ward options (in order of appearance)
const hospitalWards = [
  'Adult Medical Ward (AMW)',
  'Adult Surgical Ward (ASW)',
  'High-Risk Adult Ward (AHRW)',
  'Adult Intensive Care Unit (AICU)',
  'Paediatric Medical Ward (PMW)',
  'Paediatric Surgical Ward (PSW)',
  'High-Risk Paediatric Ward (PHRW)',
  'Paediatric Intensive Care Unit (PICU)',
  'Neonatal Medical Ward (NMW)',
  'Neonatal Intensive Care Unit (NICU)',
  'Mixed Ward (MXW)'
];

// Indication options (in order of appearance)
const indications = [
  'Community-Acquired Infections (CAI)',
  'Hospital-Acquired Infections (HAI)',
  'Surgical Prophylaxis (SP)',
  'Medical Prophylaxis (MP)'
];

// ATC4 class distribution data
const atc4Data = [
  { hospital: 'Korle-Bu TH', penicillins: 25.3, cephalosporins: 18.7, quinolones: 15.2, macrolides: 12.1, others: 28.7 },
  { hospital: 'Komfo Anokye TH', penicillins: 28.9, cephalosporins: 16.4, quinolones: 14.8, macrolides: 10.5, others: 29.4 },
  { hospital: 'Ridge Hospital', penicillins: 22.1, cephalosporins: 21.3, quinolones: 16.9, macrolides: 13.2, others: 26.5 }
];

// AWaRe distribution data
const awareData = [
  { hospital: 'Korle-Bu TH', access: 62.5, watch: 31.2, reserve: 6.3 },
  { hospital: 'Komfo Anokye TH', access: 65.8, watch: 28.9, reserve: 5.3 },
  { hospital: 'Ridge Hospital', access: 59.4, watch: 34.1, reserve: 6.5 }
];

// Top agents data
const topAgentsData = [
  { agent: 'Amoxicillin/Clavulanate', atc4: 'Penicillins', aware: 'Access', share: 18.5, cai: 45, hai: 25, sp: 15, mp: 10, other: 5 },
  { agent: 'Ceftriaxone', atc4: 'Cephalosporins', aware: 'Watch', share: 15.2, cai: 40, hai: 35, sp: 10, mp: 8, other: 7 },
  { agent: 'Ciprofloxacin', atc4: 'Quinolones', aware: 'Watch', share: 12.8, cai: 50, hai: 30, sp: 8, mp: 7, other: 5 },
  { agent: 'Metronidazole', atc4: 'Others', aware: 'Access', share: 11.3, cai: 35, hai: 20, sp: 25, mp: 15, other: 5 }
];

// Indication distribution data
const indicationData = [
  { hospital: 'Korle-Bu TH', cai: 35.2, hai: 28.7, sp: 18.5, mp: 12.3, other: 5.3 },
  { hospital: 'Komfo Anokye TH', cai: 38.4, hai: 25.6, sp: 16.9, mp: 14.2, other: 4.9 },
  { hospital: 'Ridge Hospital', cai: 33.7, hai: 31.2, sp: 17.8, mp: 11.8, other: 5.5 }
];

// WHO ATC4 classes for systemic antibacterials (J01) - sample data distribution by indication
const indicationATC4Data = [
  { 
    indication: 'CAI', 
    J01CR: 28.5, // Penicillin + β-lactamase inhibitor
    J01DD: 18.2, // 3rd-gen cephalosporins
    J01MA: 15.8, // Fluoroquinolones
    J01FA: 12.4, // Macrolides
    J01CA: 8.7,  // Penicillins w/ extended spectrum
    J01DH: 5.9,  // Carbapenems
    J01EE: 4.2,  // Sulfonamides + trimethoprim
    J01XD: 3.8,  // Imidazole derivatives
    J01XX: 2.5   // Other antibacterials
  },
  { 
    indication: 'HAI', 
    J01DH: 32.1, // Carbapenems
    J01DD: 24.8, // 3rd-gen cephalosporins
    J01MA: 18.5, // Fluoroquinolones
    J01XA: 8.9,  // Glycopeptides
    J01CR: 6.7,  // Penicillin + β-lactamase inhibitor
    J01GB: 4.3,  // Other aminoglycosides
    J01XB: 2.8,  // Polymyxins
    J01DE: 1.9   // 4th-gen cephalosporins
  },
  { 
    indication: 'SP', 
    J01CR: 38.4, // Penicillin + β-lactamase inhibitor
    J01DB: 22.6, // 1st-gen cephalosporins
    J01DD: 15.3, // 3rd-gen cephalosporins
    J01XD: 12.8, // Imidazole derivatives
    J01CA: 6.2,  // Penicillins w/ extended spectrum
    J01EE: 4.7   // Sulfonamides + trimethoprim
  },
  { 
    indication: 'MP', 
    J01EE: 26.7, // Sulfonamides + trimethoprim
    J01CR: 18.9, // Penicillin + β-lactamase inhibitor
    J01MA: 16.2, // Fluoroquinolones
    J01FA: 14.5, // Macrolides
    J01XE: 8.8,  // Nitrofuran derivatives
    J01CA: 7.3,  // Penicillins w/ extended spectrum
    J01DD: 4.8,  // 3rd-gen cephalosporins
    J01XD: 2.8   // Imidazole derivatives
  },
  { 
    indication: 'Other', 
    J01MA: 24.1, // Fluoroquinolones
    J01CR: 19.3, // Penicillin + β-lactamase inhibitor
    J01DD: 16.8, // 3rd-gen cephalosporins
    J01FA: 12.6, // Macrolides
    J01CA: 9.4,  // Penicillins w/ extended spectrum
    J01EE: 8.2,  // Sulfonamides + trimethoprim
    J01XD: 5.3,  // Imidazole derivatives
    J01XX: 4.3   // Other antibacterials
  }
];

// Eastern Regional Hospital (ERH) specific ATC4 distribution by indication
const erhIndicationATC4Data = [
  { 
    indication: 'CAI', 
    sampleSize: 91,
    J01CA: 16.5, // Penicillins, extended spectrum
    J01DD: 15.4, // Cephalosporins, 3rd gen
    J01DC: 12.1, // Cephalosporins, 2nd gen
    J01GB: 12.1, // Other aminoglycosides
    J01MA: 8.8,  // Fluoroquinolones
    J01XD: 8.8,  // Imidazoles
    J01FF: 7.7,  // Lincosamides
    J01DH: 6.6,  // Carbapenems
    J01CE: 4.4,  // β-lactamase-sensitive penicillins
    J01CR: 4.4,  // Penicillin + β-lactamase inhibitor
    J01FA: 2.2,  // Macrolides
    J01XX: 1.1   // OTHER ATC4 (≤2% each)
  },
  { 
    indication: 'HAI', 
    sampleSize: 31,
    J01DD: 29.0, // Cephalosporins, 3rd gen
    J01CA: 25.8, // Penicillins, extended spectrum
    J01GB: 12.9, // Other aminoglycosides
    J01DC: 6.5,  // Cephalosporins, 2nd gen
    J01FA: 6.5,  // Macrolides
    J01XD: 6.5,  // Imidazoles
    J01AA: 3.2,  // Tetracyclines
    J01CR: 3.2,  // Penicillin + β-lactamase inhibitor
    J01DH: 3.2,  // Carbapenems
    J01MA: 3.2   // Fluoroquinolones
  },
  { 
    indication: 'SP', 
    sampleSize: 61,
    J01CA: 50.8, // Penicillins, extended spectrum
    J01XD: 24.6, // Imidazoles
    J01MA: 6.6,  // Fluoroquinolones
    J01DC: 4.9,  // Cephalosporins, 2nd gen
    J01DD: 4.9,  // Cephalosporins, 3rd gen
    J01FF: 4.9,  // Lincosamides
    J01CR: 3.3   // Penicillin + β-lactamase inhibitor
  },
  { 
    indication: 'MP', 
    sampleSize: 36,
    J01CA: 38.9, // Penicillins, extended spectrum
    J01GB: 30.6, // Other aminoglycosides
    J01DD: 16.7, // Cephalosporins, 3rd gen
    J01CR: 5.6,  // Penicillin + β-lactamase inhibitor
    J01CE: 2.8,  // β-lactamase-sensitive penicillins
    J01DH: 2.8,  // Carbapenems
    J01XD: 2.8   // Imidazoles
  },
  { 
    indication: 'Other', 
    sampleSize: 3,
    J01CA: 33.3, // Penicillins, extended spectrum
    J01DC: 33.3, // Cephalosporins, 2nd gen
    J01FF: 33.3  // Lincosamides
  }
];

// WHO ATC4 class definitions and colors organized by category families
const ATC4_DEFINITIONS = {
  // Tetracyclines (Brown family)
  J01AA: { label: 'Tetracyclines', color: '#8B4513' },
  
  // Amphenicols (Saddle brown family)
  J01BA: { label: 'Amphenicols', color: '#A0522D' },
  
  // Penicillins (Blue family - various shades)
  J01CA: { label: 'Penicillins w/ extended spectrum', color: '#3B82F6' },
  J01CE: { label: 'β-lactamase-sensitive penicillins', color: '#1E40AF' },
  J01CF: { label: 'β-lactamase-resistant penicillins', color: '#1D4ED8' },
  J01CG: { label: 'β-lactamase inhibitors', color: '#2563EB' },
  J01CR: { label: 'Penicillin + β-lactamase inhibitor', color: '#60A5FA' },
  
  // Other Beta-lactams - Cephalosporins/Carbapenems/Monobactams (Red family)
  J01DB: { label: '1st-gen cephalosporins', color: '#EF4444' },
  J01DC: { label: '2nd-gen cephalosporins', color: '#DC2626' },
  J01DD: { label: '3rd-gen cephalosporins', color: '#B91C1C' },
  J01DE: { label: '4th-gen cephalosporins', color: '#991B1B' },
  J01DF: { label: 'Monobactams', color: '#7F1D1D' },
  J01DH: { label: 'Carbapenems', color: '#450A0A' },
  J01DI: { label: 'Other cephalosporins/penems', color: '#FCA5A5' },
  
  // Sulfonamides & Trimethoprim (Cyan family)
  J01EA: { label: 'Trimethoprim and derivatives', color: '#06B6D4' },
  J01EB: { label: 'Short-acting sulfonamides', color: '#0891B2' },
  J01EC: { label: 'Intermediate-acting sulfonamides', color: '#0E7490' },
  J01ED: { label: 'Long-acting sulfonamides', color: '#155E75' },
  J01EE: { label: 'Sulfonamides + trimethoprim', color: '#0C4A6E' },
  
  // Macrolides, Lincosamides, Streptogramins (Green family)
  J01FA: { label: 'Macrolides', color: '#22C55E' },
  J01FF: { label: 'Lincosamides', color: '#16A34A' },
  J01FG: { label: 'Streptogramins', color: '#15803D' },
  
  // Aminoglycosides (Dark green family)
  J01GA: { label: 'Streptomycin', color: '#166534' },
  J01GB: { label: 'Other aminoglycosides', color: '#14532D' },
  
  // Quinolones (Orange family)
  J01MA: { label: 'Fluoroquinolones', color: '#F97316' },
  J01MB: { label: 'Other quinolones', color: '#EA580C' },
  
  // Other antibacterials (Purple/Violet family)
  J01XA: { label: 'Glycopeptides', color: '#8B5CF6' },
  J01XB: { label: 'Polymyxins', color: '#7C3AED' },
  J01XC: { label: 'Steroid antibacterials (fusidic acid)', color: '#6D28D9' },
  J01XD: { label: 'Imidazole derivatives', color: '#5B21B6' },
  J01XE: { label: 'Nitrofuran derivatives', color: '#4C1D95' },
  J01XX: { label: 'Other antibacterials', color: '#581C87' },
  
  // Combinations (Gray family)
  J01RA: { label: 'Combinations of antibacterials', color: '#6B7280' }
};

// Extract colors for chart rendering
const ATC4_COLORS = Object.fromEntries(
  Object.entries(ATC4_DEFINITIONS).map(([code, info]) => [code, info.color])
);

// Prophylaxis breakdown data
const prophylaxisData = [
  { name: 'Surgical Prophylaxis', value: 65.3, color: '#16a34a' },
  { name: 'Medical Prophylaxis', value: 34.7, color: '#2563eb' }
];

// Donut chart data for prophylaxis overview
const prophylaxisShareData = [
  { name: 'Prophylaxis', value: 30.6, color: '#8b5cf6' },
  { name: 'Other Rx', value: 69.4, color: '#e5e7eb' }
];

const prophylaxisTypeData = [
  { name: 'Surgical Prophylaxis', value: 65.3, color: '#16a34a' },
  { name: 'Medical Prophylaxis', value: 34.7, color: '#2563eb' }
];

// Diagnosis distribution data (top 10 + others)
const diagnosisDistributionData = [
  { name: 'Pneumonia', value: 18.5, color: '#3B82F6', prescriptions: 2467 },
  { name: 'Sepsis', value: 15.2, color: '#EF4444', prescriptions: 2028 },
  { name: 'UTI', value: 12.8, color: '#10B981', prescriptions: 1708 },
  { name: 'Soft Tissue Infections', value: 9.3, color: '#F59E0B', prescriptions: 1241 },
  { name: 'Surgical Site Infections', value: 8.7, color: '#8B5CF6', prescriptions: 1161 },
  { name: 'Gastroenteritis', value: 6.4, color: '#06B6D4', prescriptions: 854 },
  { name: 'Meningitis', value: 5.1, color: '#EC4899', prescriptions: 681 },
  { name: 'Endocarditis', value: 4.2, color: '#84CC16', prescriptions: 560 },
  { name: 'Osteomyelitis', value: 3.8, color: '#F97316', prescriptions: 507 },
  { name: 'Bloodstream Infections', value: 3.6, color: '#14B8A6', prescriptions: 481 },
  { name: 'Others', value: 12.4, color: '#6B7280', prescriptions: 1655 }
];

// Comprehensive Hospital Quality Indicators Data - All 10 Ghanaian Teaching Hospitals
const hospitalQualityData = [
  { 
    hospital: 'Ho Teaching Hospital',
    shortName: 'Ho TH',
    sampleSize: 300,
    reason: 82.0,           // Reason in Notes
    guideline: 60.0,        // Guideline Compliant
    culture: 35.0,          // Culture Taken
    directed: 5.0,          // Directed Therapy
    biomarker: 55.0,        // Biomarker Used
    review: 32.0            // Review Date Documented
  },
  { 
    hospital: 'Komfo Anokye Teaching Hospital',
    shortName: 'Komfo Anokye TH',
    sampleSize: 800,
    reason: 88.0,
    guideline: 70.0,
    culture: 50.0,
    directed: 6.0,
    biomarker: 65.0,
    review: 38.0
  },
  { 
    hospital: 'Tamale Teaching Hospital',
    shortName: 'Tamale TH',
    sampleSize: 350,
    reason: 80.0,
    guideline: 58.0,
    culture: 30.0,
    directed: 4.0,
    biomarker: 50.0,
    review: 28.0
  },
  { 
    hospital: 'LEKMA Hospital',
    shortName: 'LEKMA',
    sampleSize: 180,
    reason: 72.0,
    guideline: 42.0,
    culture: 18.0,
    directed: 3.0,
    biomarker: 45.0,
    review: 22.0
  },
  { 
    hospital: 'Sunyani Teaching Hospital',
    shortName: 'Sunyani TH',
    sampleSize: 250,
    reason: 78.0,
    guideline: 55.0,
    culture: 28.0,
    directed: 4.0,
    biomarker: 48.0,
    review: 26.0
  },
  { 
    hospital: 'St. Martin de Porres Hospital',
    shortName: 'St. Martin',
    sampleSize: 120,
    reason: 76.0,
    guideline: 50.0,
    culture: 22.0,
    directed: 3.0,
    biomarker: 46.0,
    review: 24.0
  },
  { 
    hospital: 'Korle-Bu Teaching Hospital',
    shortName: 'Korle-Bu TH',
    sampleSize: 624,
    reason: 67.1,
    guideline: 30.9,
    culture: 11.4,
    directed: 4.0,
    biomarker: 38.3,
    review: 21.8
  },
  { 
    hospital: 'Cape Coast Teaching Hospital',
    shortName: 'Cape Coast TH',
    sampleSize: 280,
    reason: 83.0,
    guideline: 62.0,
    culture: 33.0,
    directed: 5.0,
    biomarker: 53.0,
    review: 30.0
  },
  { 
    hospital: 'Eastern Regional Hospital',
    shortName: 'Eastern Regional',
    sampleSize: 222,
    reason: 95.0,
    guideline: 87.4,
    culture: 72.5,
    directed: 2.7,
    biomarker: 89.2,
    review: 41.9
  },
  { 
    hospital: 'University of Ghana Medical Center',
    shortName: 'UG Medical Center',
    sampleSize: 400,
    reason: 90.0,
    guideline: 75.0,
    culture: 55.0,
    directed: 8.0,
    biomarker: 70.0,
    review: 45.0
  }
];

// Legacy quality data for backward compatibility (uses aggregate/sample data)
const qualityData = hospitalQualityData.slice(0, 3).map(hospital => ({
  hospital: hospital.shortName,
  reason: hospital.reason,
  guideline: hospital.guideline,
  culture: hospital.culture,
  directed: hospital.directed,
  biomarker: hospital.biomarker,
  review: hospital.review
}));

// Radar chart data with target values - National averages across all hospitals
const radarData = [
  { 
    subject: 'Reason in Notes', 
    value: hospitalQualityData.reduce((sum, h) => sum + h.reason, 0) / hospitalQualityData.length, 
    target: 80 
  },
  { 
    subject: 'Guideline Compliant', 
    value: hospitalQualityData.reduce((sum, h) => sum + h.guideline, 0) / hospitalQualityData.length, 
    target: 80 
  },
  { 
    subject: 'Culture Taken', 
    value: hospitalQualityData.reduce((sum, h) => sum + h.culture, 0) / hospitalQualityData.length, 
    target: 80 
  },
  { 
    subject: 'Directed Therapy', 
    value: hospitalQualityData.reduce((sum, h) => sum + h.directed, 0) / hospitalQualityData.length, 
    target: 80 
  },
  { 
    subject: 'Biomarker Used', 
    value: hospitalQualityData.reduce((sum, h) => sum + h.biomarker, 0) / hospitalQualityData.length, 
    target: 80 
  },
  { 
    subject: 'Review Date', 
    value: hospitalQualityData.reduce((sum, h) => sum + h.review, 0) / hospitalQualityData.length, 
    target: 80 
  }
];

// Empirical vs Culture scatter data - updated with comprehensive hospital data
const empiricalCultureData = hospitalQualityData.map(hospital => ({
  hospital: hospital.shortName,
  empirical: 100 - hospital.directed, // Empirical therapy is inverse of directed therapy
  culture: hospital.culture,
  size: Math.min(hospital.sampleSize, 600) // Scale size for visualization
}));

// Colors for charts
const COLORS = {
  access: '#16a34a',
  watch: '#eab308', 
  reserve: '#dc2626',
  cai: '#3b82f6',
  hai: '#ef4444',
  sp: '#16a34a',
  mp: '#8b5cf6',
  other: '#6b7280'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-blue-600">
          Prevalence: {data.prevalence}%
        </p>
        <p className="text-xs text-gray-600">
          {data.numerator}/{data.denominator} patients
        </p>
        <p className="text-xs text-gray-600">
          95% CI: {data.ci_lower}% - {data.ci_upper}%
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for ATC4 indications chart - simplified format
const ATC4Tooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Get the segment that's actually being hovered (the last one in payload for stacked bars)
    const hoveredSegment = payload[payload.length - 1];
    
    if (hoveredSegment && hoveredSegment.value > 0) {
      const atc4Code = hoveredSegment.dataKey;
      const percentage = hoveredSegment.value.toFixed(1);
      const atc4Definition = ATC4_DEFINITIONS[atc4Code];
      
      // Calculate estimated prescription count (using a base multiplier for demonstration)
      const estimatedPrescriptions = Math.round((hoveredSegment.value * 252) / 10); // Scaled for demo
      
      return (
        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
          <div className="text-black font-medium text-sm mb-1">
            {atc4Definition?.label || 'Unknown'} — {atc4Code}
          </div>
          <div className="text-gray-600 text-sm mb-1">
            {estimatedPrescriptions.toLocaleString()} prescriptions
          </div>
          <div className="text-cyan-600 font-medium text-sm">
            {percentage}% of total
          </div>
        </div>
      );
    }
  }
  return null;
};

// Dynamic filter value fetching function
const fetchDynamicFilterValues = async (filterType: string): Promise<{value: string, label: string}[]> => {
  try {
    if (!projectId || !publicAnonKey) {
      console.warn('Missing project configuration for dynamic filter fetching');
      return [];
    }

    const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amu-quality-filter-values?column=${filterType}`;
    console.log('Fetching dynamic filter values from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch filter values');
    }
    
    console.log(`Received ${result.options.length} filter options for ${filterType}`);
    return result.options || [];
    
  } catch (error) {
    console.error('Error fetching dynamic filter values:', error);
    // Fallback to static values from AMU_FilterConfigs if dynamic fetch fails
    return getFilterValueOptions(filterType);
  }
};

export function AmuCharts() {
  const [currentView, setCurrentView] = useState('prevalence');
  
  // Hover state for quality chart
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // AMU Filters for Quality component
  const qualityFilters = useAMUFilters();
  
  // Prevalence view filters
  const [timeSeriesFilters, setTimeSeriesFilters] = useState({
    region: 'all',
    hospital: 'all',
    ward: 'all'
  });

  // Filter system for prevalence trends
  const [trendsFilterType, setTrendsFilterType] = useState('');
  const [trendsFilterValue, setTrendsFilterValue] = useState('');
  const [trendsActiveFilters, setTrendsActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for region chart
  const [regionFilterType, setRegionFilterType] = useState('');
  const [regionFilterValue, setRegionFilterValue] = useState('');
  const [regionActiveFilters, setRegionActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for hospital chart
  const [hospitalFilterType, setHospitalFilterType] = useState('');
  const [hospitalFilterValue, setHospitalFilterValue] = useState('');
  const [hospitalActiveFilters, setHospitalActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for ward chart
  const [wardFilterType, setWardFilterType] = useState('');
  const [wardFilterValue, setWardFilterValue] = useState('');
  const [wardActiveFilters, setWardActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for PPS chart
  const [ppsFilterType, setPpsFilterType] = useState('');
  const [ppsFilterValue, setPpsFilterValue] = useState('');
  const [ppsActiveFilters, setPpsActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for hospital ward chart
  const [hospitalWardFilterType, setHospitalWardFilterType] = useState('');
  const [hospitalWardFilterValue, setHospitalWardFilterValue] = useState('');
  const [hospitalWardActiveFilters, setHospitalWardActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for AWaRe chart
  const [awareFilterType, setAwareFilterType] = useState('');
  const [awareFilterValue, setAwareFilterValue] = useState('');
  const [awareActiveFilters, setAwareActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for indications chart
  const [indicationsFilterType, setIndicationsFilterType] = useState('');
  const [indicationsFilterValue, setIndicationsFilterValue] = useState('');
  const [indicationsActiveFilters, setIndicationsActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for prophylaxis chart
  const [prophylaxisFilterType, setProphylaxisFilterType] = useState('');
  const [prophylaxisFilterValue, setProphylaxisFilterValue] = useState('');
  const [prophylaxisActiveFilters, setProphylaxisActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for prophylaxis donut charts
  const [prophylaxisDonutFilterType, setProphylaxisDonutFilterType] = useState('');
  const [prophylaxisDonutFilterValue, setProphylaxisDonutFilterValue] = useState('');
  const [prophylaxisDonutActiveFilters, setProphylaxisDonutActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for quality prescribing chart
  const [qualityFilterType, setQualityFilterType] = useState('');
  const [qualityFilterValue, setQualityFilterValue] = useState('');
  const [qualityActiveFilters, setQualityActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Filter system for diagnosis chart
  const [diagnosisFilterType, setDiagnosisFilterType] = useState('');
  const [diagnosisFilterValue, setDiagnosisFilterValue] = useState('');
  const [diagnosisActiveFilters, setDiagnosisActiveFilters] = useState<Array<{type: string, value: string, label: string}>>([]);

  // Dynamic filter values state
  const [dynamicFilterOptions, setDynamicFilterOptions] = useState<Record<string, {value: string, label: string}[]>>({});
  const [filterOptionsLoading, setFilterOptionsLoading] = useState<Record<string, boolean>>({});

  const filterTypeOptions = [
    { value: 'sex', label: 'Sex' },
    { value: 'age_cat', label: 'Age Group' },
    { value: 'county', label: 'Region' },
    { value: 'name', label: 'Hospital' },
    { value: 'subtype', label: 'Hospital Type' },
    { value: 'main_dept', label: 'Hospital Department' },
    { value: 'dept_type', label: 'Hospital Department Type' },
    { value: 'sub_dept', label: 'Hospital Sub-department' },
    { value: 'activity', label: 'Hospital Activity' },
    { value: 'diagnosis', label: 'Diagnosis' },
    { value: 'indication', label: 'Indication' },
    { value: 'treatment', label: 'Treatment Approach' },
    { value: 'district', label: 'District' },
    { value: 'year_of_survey', label: 'Year of Survey' },
    { value: 'antimicrobial_name', label: 'Antimicrobial Name' },
    { value: 'atc5', label: 'ATC5 Code' },
    { value: 'atc4', label: 'ATC4 Code' },
    { value: 'atc3', label: 'ATC3 Code' },
    { value: 'atc2', label: 'ATC2 Code' },
    { value: 'aware', label: 'AWaRe Category' },
    { value: 'diagnosis_site', label: 'Diagnosis Site' }
  ];

  const getFilterValueOptions = (filterType: string) => {
    switch (filterType) {
      case 'sex':
        return sexOptions.map(s => ({ value: s, label: s }));
      case 'age_cat':
        return ageGroups.map(age => ({ value: age, label: age }));
      case 'name':
        return hospitals.map(h => ({ value: h, label: h }));
      case 'county':
        return regions.map(r => ({ value: r, label: r }));
      case 'main_dept':
        return hospitalActivities.map(ha => ({ value: ha, label: ha }));
      case 'sub_dept':
        return hospitalWards.map(hw => ({ value: hw, label: hw }));
      case 'indication':
        return indications.map(ind => ({ value: ind, label: ind }));
      case 'subtype':
        return [
          { value: 'Teaching Hospital', label: 'Teaching Hospital' },
          { value: 'Regional Hospital', label: 'Regional Hospital' },
          { value: 'District Hospital', label: 'District Hospital' }
        ];
      case 'dept_type':
        return [
          { value: 'Medical', label: 'Medical' },
          { value: 'Surgical', label: 'Surgical' },
          { value: 'Mixed', label: 'Mixed' }
        ];
      case 'activity':
        return hospitalActivities.map(ha => ({ value: ha, label: ha }));
      case 'diagnosis':
        return [
          { value: 'Pneumonia', label: 'Pneumonia' },
          { value: 'Sepsis', label: 'Sepsis' },
          { value: 'UTI', label: 'UTI' },
          { value: 'Surgical Site Infection', label: 'Surgical Site Infection' }
        ];
      case 'treatment':
        return [
          { value: 'Empirical', label: 'Empirical' },
          { value: 'Targeted', label: 'Targeted' },
          { value: 'Prophylactic', label: 'Prophylactic' }
        ];
      case 'district':
        return [
          { value: 'Accra Metropolitan', label: 'Accra Metropolitan' },
          { value: 'Kumasi Metropolitan', label: 'Kumasi Metropolitan' },
          { value: 'Tamale Metropolitan', label: 'Tamale Metropolitan' }
        ];
      case 'year_of_survey':
        return [
          { value: '2023', label: '2023' },
          { value: '2024', label: '2024' },
          { value: '2025', label: '2025' }
        ];
      case 'antimicrobial_name':
        return [
          { value: 'Amoxicillin/Clavulanate', label: 'Amoxicillin/Clavulanate' },
          { value: 'Ceftriaxone', label: 'Ceftriaxone' },
          { value: 'Ciprofloxacin', label: 'Ciprofloxacin' },
          { value: 'Metronidazole', label: 'Metronidazole' }
        ];
      case 'atc5':
        return [
          { value: 'J01CR02', label: 'J01CR02 (Amoxicillin/Clavulanate)' },
          { value: 'J01DD04', label: 'J01DD04 (Ceftriaxone)' },
          { value: 'J01MA02', label: 'J01MA02 (Ciprofloxacin)' }
        ];
      case 'atc4':
        return [
          { value: 'J01CR', label: 'J01CR (Penicillin + β-lactamase inhibitor)' },
          { value: 'J01DD', label: 'J01DD (3rd-gen cephalosporins)' },
          { value: 'J01MA', label: 'J01MA (Fluoroquinolones)' }
        ];
      case 'atc3':
        return [
          { value: 'J01C', label: 'J01C (Beta-lactams, penicillins)' },
          { value: 'J01D', label: 'J01D (Other beta-lactams)' },
          { value: 'J01M', label: 'J01M (Quinolones)' }
        ];
      case 'atc2':
        return [
          { value: 'J01', label: 'J01 (Antibacterials for systemic use)' }
        ];
      case 'aware':
        return [
          { value: 'Access', label: 'Access' },
          { value: 'Watch', label: 'Watch' },
          { value: 'Reserve', label: 'Reserve' }
        ];
      case 'diagnosis_site':
        return [
          { value: 'Respiratory', label: 'Respiratory' },
          { value: 'Bloodstream', label: 'Bloodstream' },
          { value: 'Urinary tract', label: 'Urinary tract' },
          { value: 'Surgical site', label: 'Surgical site' }
        ];
      default:
        return [];
    }
  };

  // Dynamic filter value fetching hook
  const getDynamicFilterValueOptions = useCallback(async (filterType: string) => {
    if (!filterType) return [];
    
    // Check if we already have cached options
    if (dynamicFilterOptions[filterType]) {
      return dynamicFilterOptions[filterType];
    }
    
    // Check if we're already loading this filter type
    if (filterOptionsLoading[filterType]) {
      return [];
    }
    
    try {
      setFilterOptionsLoading(prev => ({ ...prev, [filterType]: true }));
      const options = await fetchDynamicFilterValues(filterType);
      
      // Cache the results
      setDynamicFilterOptions(prev => ({ ...prev, [filterType]: options }));
      
      return options;
    } catch (error) {
      console.error(`Error fetching dynamic filter values for ${filterType}:`, error);
      // Fallback to static options
      return getFilterValueOptions(filterType);
    } finally {
      setFilterOptionsLoading(prev => ({ ...prev, [filterType]: false }));
    }
  }, [dynamicFilterOptions, filterOptionsLoading]);

  // Enhanced getFilterValueOptions that uses dynamic fetching for quality filters
  const getEnhancedFilterValueOptions = useCallback((filterType: string) => {
    // Return cached dynamic options if available
    if (dynamicFilterOptions[filterType]) {
      return dynamicFilterOptions[filterType];
    }
    
    // Trigger dynamic fetch for quality filter types
    const qualityFilterTypes = [
      'sex', 'age_cat', 'county', 'name', 'subtype', 'main_dept', 'dept_type',
      'sub_dept', 'activity', 'diagnosis', 'indication', 'treatment', 'district',
      'year_of_survey', 'antimicrobial_name', 'atc5', 'atc4', 'atc3', 'atc2',
      'aware', 'diagnosis_site'
    ];
    
    if (qualityFilterTypes.includes(filterType)) {
      // Trigger dynamic fetch (async)
      getDynamicFilterValueOptions(filterType);
    }
    
    // Return static options as fallback while loading
    return getFilterValueOptions(filterType);
  }, [dynamicFilterOptions, getDynamicFilterValueOptions]);

  // Helper functions for each chart
  const createFilterHelpers = (
    filterType: string,
    setFilterType: (value: string) => void,
    filterValue: string,
    setFilterValue: (value: string) => void,
    activeFilters: Array<{type: string, value: string, label: string}>,
    setActiveFilters: (filters: Array<{type: string, value: string, label: string}>) => void
  ) => ({
    addFilter: () => {
      if (filterType && filterValue) {
        const typeLabel = filterTypeOptions.find(t => t.value === filterType)?.label || filterType;
        const newFilter = {
          type: filterType,
          value: filterValue,
          label: `${typeLabel}: ${filterValue}`
        };
        
        if (!activeFilters.some(f => f.type === filterType && f.value === filterValue)) {
          setActiveFilters([...activeFilters, newFilter]);
        }
        
        setFilterType('');
        setFilterValue('');
      }
    },
    removeFilter: (index: number) => {
      setActiveFilters(activeFilters.filter((_, i) => i !== index));
    },
    clearAllFilters: () => {
      setActiveFilters([]);
    }
  });

  const trendsFilterHelpers = createFilterHelpers(
    trendsFilterType, setTrendsFilterType, trendsFilterValue, setTrendsFilterValue,
    trendsActiveFilters, setTrendsActiveFilters
  );

  const regionFilterHelpers = createFilterHelpers(
    regionFilterType, setRegionFilterType, regionFilterValue, setRegionFilterValue,
    regionActiveFilters, setRegionActiveFilters
  );

  const hospitalFilterHelpers = createFilterHelpers(
    hospitalFilterType, setHospitalFilterType, hospitalFilterValue, setHospitalFilterValue,
    hospitalActiveFilters, setHospitalActiveFilters
  );

  const wardFilterHelpers = createFilterHelpers(
    wardFilterType, setWardFilterType, wardFilterValue, setWardFilterValue,
    wardActiveFilters, setWardActiveFilters
  );

  const ppsFilterHelpers = createFilterHelpers(
    ppsFilterType, setPpsFilterType, ppsFilterValue, setPpsFilterValue,
    ppsActiveFilters, setPpsActiveFilters
  );

  const hospitalWardFilterHelpers = createFilterHelpers(
    hospitalWardFilterType, setHospitalWardFilterType, hospitalWardFilterValue, setHospitalWardFilterValue,
    hospitalWardActiveFilters, setHospitalWardActiveFilters
  );

  const awareFilterHelpers = createFilterHelpers(
    awareFilterType, setAwareFilterType, awareFilterValue, setAwareFilterValue,
    awareActiveFilters, setAwareActiveFilters
  );

  const indicationsFilterHelpers = createFilterHelpers(
    indicationsFilterType, setIndicationsFilterType, indicationsFilterValue, setIndicationsFilterValue,
    indicationsActiveFilters, setIndicationsActiveFilters
  );

  const prophylaxisFilterHelpers = createFilterHelpers(
    prophylaxisFilterType, setProphylaxisFilterType, prophylaxisFilterValue, setProphylaxisFilterValue,
    prophylaxisActiveFilters, setProphylaxisActiveFilters
  );

  const prophylaxisDonutFilterHelpers = createFilterHelpers(
    prophylaxisDonutFilterType, setProphylaxisDonutFilterType, prophylaxisDonutFilterValue, setProphylaxisDonutFilterValue,
    prophylaxisDonutActiveFilters, setProphylaxisDonutActiveFilters
  );

  const qualityFilterHelpers = createFilterHelpers(
    qualityFilterType, setQualityFilterType, qualityFilterValue, setQualityFilterValue,
    qualityActiveFilters, setQualityActiveFilters
  );
  
  const [regionViewFilters, setRegionViewFilters] = useState({
    ward: 'all'
  });
  
  const [hospitalViewFilters, setHospitalViewFilters] = useState({
    ward: 'all'
  });
  
  const [wardViewFilters, setWardViewFilters] = useState({
    regions: [] as string[],
    hospitals: [] as string[]
  });

  // Helper function to apply filters
  const getFilteredTimeSeriesData = () => {
    // For demo purposes, return base data (in real app, would filter based on selections)
    return timeSeriesData;
  };

  const getFilteredRegionData = () => {
    // Apply ward filter if needed (in real app, would filter based on ward selection)
    return [...regionData].sort((a, b) => a.region.localeCompare(b.region));
  };

  const getFilteredHospitalData = () => {
    // Apply ward filter if needed
    return hospitalData;
  };

  const getFilteredWardData = () => {
    // Apply region and hospital filters to activity data
    return activityData;
  };

  const getFilteredPpsData = () => {
    // For demo purposes, return base data (in real app, would filter based on selections)
    return ppsData;
  };

  const getFilteredHospitalWardData = () => {
    // Apply filters to hospital ward data (in real app, would filter based on selections)
    return hospitalWardData;
  };

  // Memoized function to get indication ATC4 data based on active filters
  const currentIndicationData = useMemo(() => {
    // Check if there's a hospital filter for Eastern Regional Hospital
    const hasERHFilter = indicationsActiveFilters.some(filter => 
      filter.type === 'hospital' && filter.value === 'Eastern Regional Hospital'
    );
    
    return hasERHFilter ? erhIndicationATC4Data : indicationATC4Data;
  }, [indicationsActiveFilters]);

  // Memoized unique ATC4 codes from the current data
  const uniqueATC4Codes = useMemo(() => {
    return Array.from(new Set(
      currentIndicationData.flatMap(item => 
        Object.keys(item).filter(key => key !== 'indication' && key !== 'sampleSize')
      )
    )).sort();
  }, [currentIndicationData]);

  return (
    <div className="space-y-6">
      
      {/* 1 - Human AMU Dashboard View Selector Buttons*/}
      <AMU_Human_ViewButtons currentView={currentView} setCurrentView={setCurrentView} />
      
      {/* A. AMU Prevalence Summary Views */}
      {currentView === 'prevalence' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/*UHA1 -  National AMU Overview Pie Chart */}
            <AMUNational/>
          </div>
        </div>
      )}

      {/* B. AMU Demographics View */}
      {currentView === 'demographics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            
            {/*UHB1 -  AMU Prevalence by Sex */}
            <AMU_Human_Overview_Sex/>

            {/*UHB2 -  AMU Prevalence by Age */}
            <AMU_Human_Overview_Age/>
           
            {/*UHB3 -  AMU Prevalence by Region */}
            <AMU_Human_Overview_Region/>
            
          </div>
        </div>
      )}
      
      {/* C. ATC4 Profile Views */}
      {currentView === 'distribution' && (
        <div className="space-y-6">
          
          {/* 1. Overall ATC4 Distribution - Donut Chart */}
          <AMU_Human_ATC4_MainDonut2/>

           {/* 2. ATC4 Distribution by Selected Category - 100% Stacked Bar Chart */}
          <AMU_Human_ATC4_ViewBy/>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 2. ATC4 Distribution by Hospital - Stacked Bar Chart */}


            {/* 3. Top ATC4 Agents by Indication */}


            {/* 4. ATC4 vs AWaRe Classification Matrix */}

          </div>
        </div>
      )}

      {/* C. Indications Views */}
      {currentView === 'indications' && (
        <div className="space-y-6">
          <div className="space-y-6">
            {/* NEW: Indication Profile Aggregate - First Chart */}
            <IndicationProfileAggregate />
            {/* Indication Distribution Chart */}
             <AMU_Human_Indication_ViewBy />
          </div>
        </div>
      )}

      {/* D. Prophylaxis Views */}
      {currentView === 'prophylaxis' && (
        <div className="space-y-6">
          <div className="space-y-6">
            
            {/* Prophylaxis Overview Donut Charts */}
            <AMU_Human_Prophylaxis_MainDonut />

            {/* Prophylaxis Use by Variable Category - 100% Stacked Bar Chart */}
            <AMU_Human_Prophylaxis_ViewBy
              regionFilterType={prophylaxisFilterType}
              setRegionFilterType={setProphylaxisFilterType}
              regionFilterValue={prophylaxisFilterValue}
              setRegionFilterValue={setProphylaxisFilterValue}
              regionActiveFilters={prophylaxisActiveFilters}
              regionFilterHelpers={prophylaxisFilterHelpers}
              filterTypeOptions={filterTypeOptions}
              getFilterValueOptions={getFilterValueOptions}
            />
            
            <AMU_Human_Prophylaxis_Duration
              regionFilterType={prophylaxisFilterType}
              setRegionFilterType={setProphylaxisFilterType}
              regionFilterValue={prophylaxisFilterValue}
              setRegionFilterValue={setProphylaxisFilterValue}
              regionActiveFilters={prophylaxisActiveFilters}
              regionFilterHelpers={prophylaxisFilterHelpers}
              filterTypeOptions={filterTypeOptions}
              getFilterValueOptions={getFilterValueOptions}
            />
            
            <AMU_Human_Prophylaxis_Compliance
              regionFilterType={prophylaxisFilterType}
              setRegionFilterType={setProphylaxisFilterType}
              regionFilterValue={prophylaxisFilterValue}
              setRegionFilterValue={setProphylaxisFilterValue}
              regionActiveFilters={prophylaxisActiveFilters}
              regionFilterHelpers={prophylaxisFilterHelpers}
              filterTypeOptions={filterTypeOptions}
              getFilterValueOptions={getFilterValueOptions}
            />


          </div>
        </div>
      )}

      {/* E. Quality Views */}
      {currentView === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            

            
            {/* Radar Chart - Quality Prescribing Indicators */}
            <AMU_Human_Quality_MainV3
              qualityActiveFilters={qualityActiveFilters}
              qualityFilterHelpers={qualityFilterHelpers}
              qualityFilterType={qualityFilterType}
              setQualityFilterType={setQualityFilterType}
              qualityFilterValue={qualityFilterValue}
              setQualityFilterValue={setQualityFilterValue}
              filterTypeOptions={filterTypeOptions}
              getFilterValueOptions={getFilterValueOptions}
            />
          </div>

            {/* Quality Prescribing by Selectable Category - 100% Stacked Bar Chart */}
            <AMU_Human_Quality_ViewBy 
              regionFilterType={regionFilterType}
              setRegionFilterType={setRegionFilterType}
              regionFilterValue={regionFilterValue}
              setRegionFilterValue={setRegionFilterValue}
              regionActiveFilters={regionActiveFilters}
              regionFilterHelpers={regionFilterHelpers}
              filterTypeOptions={filterTypeOptions}
              getFilterValueOptions={getEnhancedFilterValueOptions}
              dynamicFilterOptions={dynamicFilterOptions}
              filterOptionsLoading={filterOptionsLoading}
            />
          
        </div>
      )}

      {/* F. AWaRe Views */}
      {currentView === 'aware' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            
            {/* Overall AWaRe Distribution */}
            <AMU_Human_AWARE_MainDonut />

            {/* Overall AWaRe Distribution */}
            <AMU_Human_AWARE_ViewBy />
            
          </div>
        </div>
      )}

      {/* G. Diagnoses Profile View */}
      {currentView === 'diagnosis-profile' && (
        <div className="space-y-6">

          {/* Overall Diagnosis Distribution of Antibiotic Use - Donut Chart */}
          <AMU_Human_Diagnosis_MainDonut />

          {/* Diagnosis Distribution of Antibiotic Use by Selectable Categort - 100% Stacked Bar Chart */}
          <AMU_Human_Diagnosis_ViewBy />
          
        </div>
      )}
    </div>
  );
}