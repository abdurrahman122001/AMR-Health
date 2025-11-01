import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { TestTube, Building2, Eye, Shield, BarChart3, AlertTriangle } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color?: 'default' | 'warning' | 'success';
}

function SummaryCard({ title, value, subtitle, icon, color = 'default' }: SummaryCardProps) {
  const getValueColor = () => {
    switch (color) {
      case 'warning':
        return 'text-red-600';
      case 'success':
        return 'text-green-600';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Card className="relative">
      <CardContent className="p-4 bg-[rgba(255,255,255,0)]">
        <div className="flex flex-col space-y-2">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground leading-tight font-semibold">{title}</p>
            <div className="text-muted-foreground/60 flex-shrink-0">
              {icon}
            </div>
          </div>
          <div>
            <div className={`text-lg font-semibold ${getValueColor()}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ApiResponse {
  success: boolean;
  data: {
    nodeId: string;
    nodeName: string;
    totalRows: number;
    columns: string[];
    rows: any[];
  };
}

export function SummaryCards() {
  // State for database counts
  const [amrHHOrganisms, setAmrHHOrganisms] = useState<number>(0);
  const [amrHHIsolates, setAmrHHIsolates] = useState<number>(0);
  const [amrHHCulturedSpecimens, setAmrHHCulturedSpecimens] = useState<number>(0);
  const [amrHHInstitutions, setAmrHHInstitutions] = useState<number>(0);
  const [mdrRate, setMdrRate] = useState<number>(0);
  const [mdrBacteriaPercentage, setMdrBacteriaPercentage] = useState<number>(0);
  const [overallResistancePercentage, setOverallResistancePercentage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to extract unique organisms count
  const extractUniqueOrganisms = (rows: any[]): number => {
    const uniqueOrganisms = new Set();
    rows.forEach(row => {
      const organism = row.ORGANISM;
      if (organism && organism.trim() && organism.toLowerCase() !== 'xxx') {
        uniqueOrganisms.add(organism.toLowerCase());
      }
    });
    return uniqueOrganisms.size;
  };

  // Helper function to extract total isolates count (valid organism + some AST data)
  const extractTotalIsolates = (rows: any[]): number => {
    let isolateCount = 0;
    const antibioticColumns = ['AMP ND10', 'AMC ND20', 'CTX ND30', 'CAZ ND30', 'CRO ND30', 'IPM ND10', 'MEM ND10', 'CIP ND5', 'GEN ND10', 'AMK ND30'];
    
    rows.forEach(row => {
      const organism = row.ORGANISM;
      if (organism && organism.trim() && organism.toLowerCase() !== 'xxx') {
        // Check if there's at least one antibiotic test result
        const hasAST = antibioticColumns.some(abx => {
          const value = row[abx];
          return value !== undefined && value !== null && value !== '';
        });
        
        if (hasAST) {
          isolateCount++;
        }
      }
    });
    return isolateCount;
  };

  // Helper function to extract cultured specimens count
  const extractCulturedSpecimens = (rows: any[]): number => {
    let culturedCount = 0;
    rows.forEach(row => {
      const organism = row.ORGANISM;
      if (organism && organism.trim()) {
        culturedCount++;
      }
    });
    return culturedCount;
  };

  // Helper function to extract unique institutions count
  const extractUniqueInstitutions = (rows: any[]): number => {
    const uniqueInstitutions = new Set();
    rows.forEach(row => {
      const institution = row.INSTITUTION;
      if (institution && institution.trim()) {
        uniqueInstitutions.add(institution.toLowerCase());
      }
    });
    return uniqueInstitutions.size;
  };

  // Helper function to calculate MDR rate (simplified calculation)
  const calculateMdrRate = (rows: any[]): number => {
    // This is a simplified MDR calculation - adjust based on your actual MDR criteria
    let mdrCases = 0;
    let totalPatients = new Set();
    
    rows.forEach(row => {
      const patientId = row['PATIENT ID'];
      if (patientId) {
        totalPatients.add(patientId);
        
        // Simplified MDR detection: resistant to at least 3 antibiotic classes
        const resistanceCount = countResistanceClasses(row);
        if (resistanceCount >= 3) {
          mdrCases++;
        }
      }
    });
    
    const totalAdmissions = totalPatients.size;
    return totalAdmissions > 0 ? (mdrCases / totalAdmissions) * 1000 : 0; // per 1000 admissions
  };

  // Helper function to count resistance classes for a row
  const countResistanceClasses = (row: any): number => {
    const classResistance: { [key: string]: boolean } = {};
    
    // Beta-lactams
    if (isResistant(row['AMP ND10']) || isResistant(row['AMC ND20']) || 
        isResistant(row['CTX ND30']) || isResistant(row['CAZ ND30']) || 
        isResistant(row['CRO ND30'])) {
      classResistance.betaLactam = true;
    }
    
    // Carbapenems
    if (isResistant(row['IPM ND10']) || isResistant(row['MEM ND10'])) {
      classResistance.carbapenem = true;
    }
    
    // Fluoroquinolones
    if (isResistant(row['CIP ND5'])) {
      classResistance.fluoroquinolone = true;
    }
    
    // Aminoglycosides
    if (isResistant(row['GEN ND10']) || isResistant(row['AMK ND30'])) {
      classResistance.aminoglycoside = true;
    }
    
    // Tetracyclines
    if (isResistant(row['TCY ND30'])) {
      classResistance.tetracycline = true;
    }
    
    // Sulfonamides
    if (isResistant(row['SXT ND1 2'])) {
      classResistance.sulfonamide = true;
    }
    
    return Object.keys(classResistance).length;
  };

  // Helper function to determine resistance from zone size
  const isResistant = (zoneSize: any): boolean => {
    if (!zoneSize || zoneSize === '') return false;
    const zoneNum = parseFloat(zoneSize);
    return !isNaN(zoneNum) && zoneNum <= 15; // Simplified resistance breakpoint
  };

  // Helper function to calculate MDR bacteria percentage
  const calculateMdrBacteriaPercentage = (rows: any[]): number => {
    let mdrBacteriaCount = 0;
    let totalIndicatorOrganisms = 0;
    const indicatorOrganisms = ['eco', 'kpn', 'pae', 'aba', 'sau'];
    
    rows.forEach(row => {
      const organism = row.ORGANISM;
      if (organism && indicatorOrganisms.includes(organism.toLowerCase())) {
        totalIndicatorOrganisms++;
        const resistanceCount = countResistanceClasses(row);
        if (resistanceCount >= 3) {
          mdrBacteriaCount++;
        }
      }
    });
    
    return totalIndicatorOrganisms > 0 ? (mdrBacteriaCount / totalIndicatorOrganisms) * 100 : 0;
  };

  // Helper function to calculate overall resistance percentage
  const calculateOverallResistancePercentage = (rows: any[]): number => {
    let resistantIsolates = 0;
    let totalIsolatesWithAST = 0;
    
    rows.forEach(row => {
      const organism = row.ORGANISM;
      if (organism && organism.trim() && organism.toLowerCase() !== 'xxx') {
        // Check if there's at least one antibiotic test result
        const antibioticColumns = ['AMP ND10', 'AMC ND20', 'CTX ND30', 'CAZ ND30', 'CRO ND30', 'IPM ND10', 'MEM ND10', 'CIP ND5', 'GEN ND10', 'AMK ND30'];
        const hasAST = antibioticColumns.some(abx => {
          const value = row[abx];
          return value !== undefined && value !== null && value !== '';
        });
        
        if (hasAST) {
          totalIsolatesWithAST++;
          // Consider resistant if resistant to at least one antibiotic class
          const resistanceCount = countResistanceClasses(row);
          if (resistanceCount > 0) {
            resistantIsolates++;
          }
        }
      }
    });
    
    return totalIsolatesWithAST > 0 ? (resistantIsolates / totalIsolatesWithAST) * 100 : 0;
  };

  // Fetch all data from local API endpoint
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        console.log('Fetching all AMR data from local API for SummaryCards...');
        const response = await fetch('http://localhost:5001/v1/amr-health-v2', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const apiData: ApiResponse = await response.json();
        console.log('Full API response received for SummaryCards:', apiData);

        if (!apiData.success || !apiData.data || !apiData.data.rows) {
          throw new Error('Invalid API response format');
        }

        const rows = apiData.data.rows;
        const totalRows = apiData.data.totalRows;

        console.log(`Processing ${rows.length} rows for SummaryCards calculations`);

        // 1. Calculate unique organisms count
        const uniqueOrganisms = extractUniqueOrganisms(rows);
        setAmrHHOrganisms(uniqueOrganisms);
        console.log('Unique organisms calculated:', uniqueOrganisms);

        // 2. Calculate total isolates count
        const totalIsolates = extractTotalIsolates(rows);
        setAmrHHIsolates(totalIsolates);
        console.log('Total isolates calculated:', totalIsolates);

        // 3. Calculate cultured specimens count
        const culturedSpecimens = extractCulturedSpecimens(rows);
        setAmrHHCulturedSpecimens(culturedSpecimens);
        console.log('Cultured specimens calculated:', culturedSpecimens);

        // 4. Calculate unique institutions count
        const uniqueInstitutions = extractUniqueInstitutions(rows);
        setAmrHHInstitutions(uniqueInstitutions);
        console.log('Unique institutions calculated:', uniqueInstitutions);

        // 5. Calculate MDR rate
        const calculatedMdrRate = calculateMdrRate(rows);
        setMdrRate(calculatedMdrRate);
        console.log('MDR rate calculated:', calculatedMdrRate);

        // 6. Calculate MDR bacteria percentage
        const calculatedMdrBacteriaPercentage = calculateMdrBacteriaPercentage(rows);
        setMdrBacteriaPercentage(calculatedMdrBacteriaPercentage);
        console.log('MDR bacteria percentage calculated:', calculatedMdrBacteriaPercentage);

        // 7. Calculate overall resistance percentage
        const calculatedOverallResistance = calculateOverallResistancePercentage(rows);
        setOverallResistancePercentage(calculatedOverallResistance);
        console.log('Overall resistance percentage calculated:', calculatedOverallResistance);

      } catch (error) {
        console.error('Error fetching AMR data from local API for SummaryCards:', error);
        // Set fallback values
        setAmrHHOrganisms(0);
        setAmrHHIsolates(0);
        setAmrHHCulturedSpecimens(0);
        setAmrHHInstitutions(0);
        setMdrRate(0);
        setMdrBacteriaPercentage(0);
        setOverallResistancePercentage(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);
  
  // Calculate culture positive rate
  const culturePositiveRate = amrHHCulturedSpecimens > 0 ? 
    ((amrHHIsolates / amrHHCulturedSpecimens) * 100).toFixed(1) : '0.0';
  
  const summaryData = [
    {
      title: 'Total Isolates',
      value: isLoading ? 'Loading...' : amrHHIsolates,
      subtitle: 'Laboratory specimens',
      icon: <TestTube className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Organisms',
      value: isLoading ? 'Loading...' : amrHHOrganisms,
      subtitle: 'Isolated from Specimen',
      icon: <Eye className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Surveillance Sites',
      value: isLoading ? 'Loading...' : amrHHInstitutions,
      subtitle: 'Institutions reporting',
      icon: <Building2 className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'MDRO Incidence',
      value: isLoading ? 'Loading...' : mdrRate.toFixed(1),
      subtitle: 'per 1,000 admissions',
      icon: <Shield className="h-5 w-5" />,
      color: 'warning' as const
    },
    {
      title: 'MDR Bacteria',
      value: isLoading ? 'Loading...' : `${mdrBacteriaPercentage.toFixed(1)}%`,
      subtitle: 'Indicator bacteria isolates',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'warning' as const
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(186, 184, 108, 0.2)' }}>
      {summaryData.map((card, index) => (
        <SummaryCard
          key={index}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  );
}