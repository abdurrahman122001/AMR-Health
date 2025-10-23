// AMU CHARTS COMPLETE BACKUP - Current Working Version
// This file contains the complete working AmuCharts component with all views
// Last updated: Current restoration version
// Contains: Prevalence, ATC4 Profile, AWaRe Profile, Indication Profile views

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';

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

// Hospital data
const hospitalData = [
  { hospital: 'Korle-Bu TH', region: 'Greater Accra', prevalence: 84.2, patients: 450 },
  { hospital: 'Komfo Anokye TH', region: 'Ashanti', prevalence: 81.7, patients: 425 },
  { hospital: 'Ridge Hospital', region: 'Greater Accra', prevalence: 79.3, patients: 380 },
  { hospital: 'Cape Coast TH', region: 'Central', prevalence: 76.8, patients: 340 },
  { hospital: 'Tamale TH', region: 'Northern', prevalence: 74.5, patients: 315 },
  { hospital: '37 Military Hospital', region: 'Greater Accra', prevalence: 78.1, patients: 295 },
  { hospital: 'Ho Teaching Hospital', region: 'Volta', prevalence: 72.6, patients: 285 },
  { hospital: 'Effia Nkwanta RH', region: 'Western', prevalence: 75.9, patients: 275 },
  { hospital: 'Sunyani RH', region: 'Brong Ahafo', prevalence: 73.4, patients: 260 },
  { hospital: 'Bolgatanga RH', region: 'Upper East', prevalence: 70.2, patients: 245 }
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

// Hospital options (in order of appearance)
const hospitals = [
  'Eastern Regional Hospital',
  'Korle-Bu Teaching Hospital',
  'LEKMA Hospital',
  'Ho Teaching Hospital'
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

// Quality indicators data
const qualityData = [
  { hospital: 'Korle-Bu TH', reason: 78, guideline: 67, culture: 43, directed: 52, biomarker: 34, review: 61 },
  { hospital: 'Komfo Anokye TH', reason: 82, guideline: 71, culture: 38, directed: 48, biomarker: 29, review: 64 },
  { hospital: 'Ridge Hospital', reason: 75, guideline: 69, culture: 47, directed: 55, biomarker: 37, review: 58 }
];

// Radar chart data
const radarData = [
  { subject: 'Reason in Notes', value: 78 },
  { subject: 'Guideline Compliant', value: 67 },
  { subject: 'Culture Taken', value: 43 },
  { subject: 'Directed Therapy', value: 52 },
  { subject: 'Biomarker Used', value: 34 },
  { subject: 'Review Date', value: 61 }
];

// Empirical vs Culture scatter data
const empiricalCultureData = [
  { hospital: 'Korle-Bu TH', empirical: 61.3, culture: 42.7, size: 400 },
  { hospital: 'Komfo Anokye TH', empirical: 65.8, culture: 38.2, size: 350 },
  { hospital: 'Ridge Hospital', empirical: 58.4, culture: 46.9, size: 300 },
  { hospital: 'Cape Coast TH', empirical: 70.2, culture: 35.1, size: 280 },
  { hospital: 'Tamale TH', empirical: 67.5, culture: 40.3, size: 320 }
];

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

export function AmuCharts() {
  const [currentView, setCurrentView] = useState('prevalence');
  
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

  const filterTypeOptions = [
    { value: 'sex', label: 'Sex' },
    { value: 'ageGroup', label: 'Age Group' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'hospitalActivity', label: 'Hospital Activity' },
    { value: 'hospitalWard', label: 'Hospital Ward' },
    { value: 'indication', label: 'Indication' }
  ];

  const getFilterValueOptions = (filterType: string) => {
    switch (filterType) {
      case 'sex':
        return sexOptions.map(s => ({ value: s, label: s }));
      case 'ageGroup':
        return ageGroups.map(age => ({ value: age, label: age }));
      case 'hospital':
        return hospitals.map(h => ({ value: h, label: h }));
      case 'hospitalActivity':
        return hospitalActivities.map(ha => ({ value: ha, label: ha }));
      case 'hospitalWard':
        return hospitalWards.map(hw => ({ value: hw, label: hw }));
      case 'indication':
        return indications.map(ind => ({ value: ind, label: ind }));
      default:
        return [];
    }
  };

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

  // Memoized function to get indication ATC4 data based on hospital filter
  const getIndicationATC4Data = useMemo(() => {
    // Check if Eastern Regional Hospital is selected in the active filters
    const hasERHFilter = indicationsActiveFilters.some(
      filter => filter.type === 'hospital' && filter.value === 'Eastern Regional Hospital'
    );
    
    return hasERHFilter ? erhIndicationATC4Data : indicationATC4Data;
  }, [indicationsActiveFilters]);

  return (
    <div className="w-full space-y-6">
      {/* View Selection Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={currentView === 'prevalence' ? 'default' : 'outline'}
          onClick={() => setCurrentView('prevalence')}
        >
          Prevalence
        </Button>
        <Button
          variant={currentView === 'atc4' ? 'default' : 'outline'}
          onClick={() => setCurrentView('atc4')}
        >
          ATC4 Profile
        </Button>
        <Button
          variant={currentView === 'aware' ? 'default' : 'outline'}
          onClick={() => setCurrentView('aware')}
        >
          AWaRe
        </Button>
        <Button
          variant={currentView === 'indications' ? 'default' : 'outline'}
          onClick={() => setCurrentView('indications')}
        >
          Indication Profile
        </Button>
        <Button
          variant={currentView === 'prophylaxis' ? 'default' : 'outline'}
          onClick={() => setCurrentView('prophylaxis')}
        >
          Prophylaxis
        </Button>
        <Button
          variant={currentView === 'quality' ? 'default' : 'outline'}
          onClick={() => setCurrentView('quality')}
        >
          Rx Quality
        </Button>
      </div>

      {/* Prevalence Charts */}
      {currentView === 'prevalence' && (
        <div className="space-y-6">
          {/* Time Series Prevalence Trends Chart */}
          <Card>
            <CardHeader className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg">AMU Prevalence Trends (2023-2025)</CardTitle>
                <div className="text-sm text-gray-600">
                  Percentage of patients prescribed antimicrobials
                </div>
              </div>
              
              {/* Filter Controls */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={trendsFilterType} onValueChange={setTrendsFilterType}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {trendsFilterType && (
                    <>
                      <Select value={trendsFilterValue} onValueChange={setTrendsFilterValue}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFilterValueOptions(trendsFilterType).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={trendsFilterHelpers.addFilter} variant="outline">
                        Add Filter
                      </Button>
                    </>
                  )}
                  
                  {trendsActiveFilters.length > 0 && (
                    <Button onClick={trendsFilterHelpers.clearAllFilters} variant="outline">
                      Clear All
                    </Button>
                  )}
                </div>
                
                {/* Active Filters */}
                {trendsActiveFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {trendsActiveFilters.map((filter, index) => (
                      <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {filter.label}
                        <button
                          onClick={() => trendsFilterHelpers.removeFilter(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getFilteredTimeSeriesData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="quarter"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Prevalence (%)', angle: -90, position: 'insideLeft' }}
                    domain={[60, 85]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={CustomTooltip} />
                  <Line 
                    type="monotone" 
                    dataKey="prevalence" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prophylaxis Charts */}
      {currentView === 'prophylaxis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prophylaxis Breakdown Pie Chart */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Prophylaxis Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prophylaxisData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {prophylaxisData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value}%`, 'Percentage']}
                      labelFormatter={(label: any) => label}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {prophylaxisData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name}: {entry.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}