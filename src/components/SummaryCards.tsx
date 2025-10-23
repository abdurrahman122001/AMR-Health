import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { TestTube, Building2, Eye, Shield, BarChart3, AlertTriangle } from 'lucide-react';
import { makeServerRequest } from '../utils/supabase/client';

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

  // Fetch real database counts from AMR_HH table
  useEffect(() => {
    const fetchAMRDatabaseCounts = async () => {
      try {
        setIsLoading(true);
        
        // Fetch unique organism count from AMR_HH table (excluding NULL and 'xxx')
        const organismsResponse = await makeServerRequest('/amr-hh-total');
        if (organismsResponse.success && typeof organismsResponse.total === 'number') {
          setAmrHHOrganisms(organismsResponse.total);
          console.log('AMR_HH unique organisms count:', organismsResponse.total);
          if (organismsResponse.sampleOrganisms) {
            console.log('Sample organisms:', organismsResponse.sampleOrganisms);
          }
        } else {
          console.error('Failed to fetch AMR_HH organisms:', organismsResponse.error || 'Invalid response format');
          setAmrHHOrganisms(0);
        }

        // Fetch total isolates count from AMR_HH table (valid organism + valid AST)
        const isolatesResponse = await makeServerRequest('/amr-hh-isolates-total');
        if (isolatesResponse.success && typeof isolatesResponse.total === 'number') {
          setAmrHHIsolates(isolatesResponse.total);
          console.log('AMR_HH total isolates:', isolatesResponse.total);
        } else {
          console.error('Failed to fetch AMR_HH total isolates:', isolatesResponse.error || 'Invalid response format');
          setAmrHHIsolates(0);
        }

        // Fetch total cultured specimens count from AMR_HH table (ORGANISM is not NULL)
        const culturedSpecimensResponse = await makeServerRequest('/amr-hh-cultured-specimens');
        if (culturedSpecimensResponse.success && typeof culturedSpecimensResponse.total === 'number') {
          setAmrHHCulturedSpecimens(culturedSpecimensResponse.total);
          console.log('AMR_HH total cultured specimens:', culturedSpecimensResponse.total);
        } else {
          console.error('Failed to fetch AMR_HH cultured specimens:', culturedSpecimensResponse.error || 'Invalid response format');
          setAmrHHCulturedSpecimens(0);
        }

        // Fetch unique institutions count from AMR_HH table
        const institutionsResponse = await makeServerRequest('/amr-hh-institutions');
        if (institutionsResponse.success && typeof institutionsResponse.total === 'number') {
          setAmrHHInstitutions(institutionsResponse.total);
          console.log('AMR_HH unique institutions count:', institutionsResponse.total);
          if (institutionsResponse.sampleInstitutions) {
            console.log('Sample institutions:', institutionsResponse.sampleInstitutions);
          }
        } else {
          console.error('Failed to fetch AMR_HH institutions:', institutionsResponse.error || 'Invalid response format');
          setAmrHHInstitutions(0);
        }

        // Fetch MDR rate calculation from AMR_HH table (with VALID_AST filter)
        const mdrResponse = await makeServerRequest('/amr-mdr-calculation');
        if (mdrResponse.success && typeof mdrResponse.mdrRate === 'number') {
          setMdrRate(mdrResponse.mdrRate);
          console.log('MDR rate calculation:', {
            mdrRate: mdrResponse.mdrRate,
            mdrCases: mdrResponse.mdrCases,
            totalAdmissions: mdrResponse.totalAdmissions,
            calculation: mdrResponse.calculation,
            methodology: mdrResponse.methodology
          });
        } else {
          console.error('Failed to fetch MDR calculation:', mdrResponse.error || 'Invalid response format');
          setMdrRate(0);
        }

        // Fetch MDR bacteria percentage calculation from AMR_HH table
        const mdrBacteriaResponse = await makeServerRequest('/amr-mdr-bacteria');
        if (mdrBacteriaResponse.success && typeof mdrBacteriaResponse.mdrPercentage === 'number') {
          setMdrBacteriaPercentage(mdrBacteriaResponse.mdrPercentage);
          console.log('MDR bacteria percentage calculation:', {
            mdrPercentage: mdrBacteriaResponse.mdrPercentage,
            mdrCases: mdrBacteriaResponse.mdrCases,
            totalIndicatorOrganisms: mdrBacteriaResponse.totalIndicatorOrganisms,
            calculation: mdrBacteriaResponse.calculation,
            methodology: mdrBacteriaResponse.methodology,
            organismBreakdown: mdrBacteriaResponse.organismBreakdown
          });
        } else {
          console.error('Failed to fetch MDR bacteria calculation:', mdrBacteriaResponse.error || 'Invalid response format');
          setMdrBacteriaPercentage(0);
        }

        // Fetch overall resistance percentage from AMR_HH table (ANY_R = TRUE, organisms with >30 isolates)
        const overallResistanceResponse = await makeServerRequest('/overall-resistance-percentage');
        if (overallResistanceResponse.success && typeof overallResistanceResponse.percentage === 'number') {
          setOverallResistancePercentage(overallResistanceResponse.percentage);
          console.log('Overall resistance percentage calculation (30+ isolate minimum):', {
            percentage: overallResistanceResponse.percentage,
            totalIsolates: overallResistanceResponse.total_isolates,
            resistantIsolates: overallResistanceResponse.resistant_isolates,
            organismsIncluded: overallResistanceResponse.organisms_included,
            organismsExcluded: overallResistanceResponse.organisms_excluded,
            calculation: overallResistanceResponse.calculation,
            organismBreakdown: overallResistanceResponse.organism_breakdown
          });
        } else {
          console.error('Failed to fetch overall resistance percentage:', overallResistanceResponse.error || 'Invalid response format');
          setOverallResistancePercentage(0);
        }
      } catch (error) {
        console.error('Error fetching AMR_HH database counts:', error);
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

    fetchAMRDatabaseCounts();
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