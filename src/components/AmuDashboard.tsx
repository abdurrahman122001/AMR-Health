import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Users, Eye, Shield, Stethoscope, FlaskConical, CheckCircle, ShieldAlert, Cross, Microscope, Pill, Virus, Lock, Tablets, Target } from 'lucide-react';
import { AmuCharts } from './AmuCharts';
import { DiagnosisProfileView } from './AmuChartsWithDiagnosis';
import { AMU_Human_Demograph_RSex } from './AMU_Human_Demograph_RSex';
import { ServerDebug } from './ServerDebug';

interface AmuSummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color?: 'default' | 'warning' | 'success';
}

function AmuSummaryCard({ title, value, subtitle, icon, color = 'default' }: AmuSummaryCardProps) {
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
              {value}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Interface for the API response
interface AmuHumanResponse {
  success: boolean;
  data: {
    nodeId: string;
    nodeName: string;
    totalRows: number;
    columns: string[];
    rows: any[];
  };
}

export function AmuDashboard() {
  // State for API data
  const [apiData, setApiData] = useState<AmuHumanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for calculated metrics
  const [calculatedMetrics, setCalculatedMetrics] = useState<{
    totalRecords: number;
    patientsWithAntibiotics: number;
    prevalencePercentage: string;
    watchReserveCount: number;
    watchReservePercentage: string;
    targetedCount: number;
    targetedPercentage: string;
    cultureYesCount: number;
    cultureLabPercentage: string;
    compliantCount: number;
    compliancePercentage: string;
  }>({
    totalRecords: 0,
    patientsWithAntibiotics: 0,
    prevalencePercentage: '0.0',
    watchReserveCount: 0,
    watchReservePercentage: '0.0',
    targetedCount: 0,
    targetedPercentage: '0.0',
    cultureYesCount: 0,
    cultureLabPercentage: '0.0',
    compliantCount: 0,
    compliancePercentage: '0.0'
  });

  // Fetch data from the API
  useEffect(() => {
    const fetchAmuHumanData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 AMU Dashboard: Fetching data from AMU Human API...');
        
        const response = await fetch('https://backend.ajhiveprojects.com/v1/amu-human', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AmuHumanResponse = await response.json();
        
        if (!data.success) {
          throw new Error('API returned unsuccessful response');
        }

        console.log('📊 AMU Dashboard: Received API data:', {
          totalRows: data.data.totalRows,
          columns: data.data.columns.length,
          rows: data.data.rows.length
        });

        setApiData(data);
        
        // Calculate metrics from the data
        calculateMetrics(data.data.rows);
        
      } catch (err) {
        console.error('❌ AMU Dashboard: Error fetching AMU Human data:', err);
        setError(err.message || 'Failed to fetch data from AMU Human API');
      } finally {
        setLoading(false);
      }
    };

    const calculateMetrics = (rows: any[]) => {
      try {
        console.log('🧮 AMU Dashboard: Calculating metrics from', rows.length, 'rows...');
        
        // Filter out empty rows and get actual patient data
        const patientRows = rows.filter(row => 
          row['Inquiry ID'] && 
          row['Inquiry ID'] !== '' && 
          row['Activity code'] !== 'M' // Exclude metadata rows
        );

        const totalRecords = patientRows.length;
        
        // Calculate antibiotic prevalence
        const patientsWithAntibiotics = patientRows.filter(row => 
          row['Antimicrobial name'] && row['Antimicrobial name'] !== ''
        ).length;
        
        const prevalencePercentage = totalRecords > 0 
          ? ((patientsWithAntibiotics / totalRecords) * 100).toFixed(1)
          : '0.0';

        // Calculate AWaRe Share (Watch/Reserve antibiotics)
        const antibioticRows = patientRows.filter(row => 
          row['Antimicrobial name'] && row['Antimicrobial name'] !== ''
        );
        
        const watchReserveCount = antibioticRows.filter(row => 
          row['AWaRe'] === 'Watch' || row['AWaRe'] === 'Reserve'
        ).length;
        
        const watchReservePercentage = antibioticRows.length > 0
          ? ((watchReserveCount / antibioticRows.length) * 100).toFixed(1)
          : '0.0';

        // Calculate Targeted Therapy
        const targetedCount = patientRows.filter(row => 
          row['Treatment based on biomarker data'] === 'Yes' || 
          row['Targeted treatment against other MDR organisms'] === 'Yes'
        ).length;
        
        const targetedPercentage = totalRecords > 0
          ? ((targetedCount / totalRecords) * 100).toFixed(1)
          : '0.0';

        // Calculate Culture Sent to Lab
        const cultureYesCount = patientRows.filter(row => 
          row['Culture to lab (Yes/No)'] === 'Yes'
        ).length;
        
        const cultureLabPercentage = totalRecords > 0
          ? ((cultureYesCount / totalRecords) * 100).toFixed(1)
          : '0.0';

        // Calculate STG Compliance
        const compliantCount = patientRows.filter(row => 
          row['Guideline Compliance'] === 'Yes'
        ).length;
        
        const compliancePercentage = totalRecords > 0
          ? ((compliantCount / totalRecords) * 100).toFixed(1)
          : '0.0';

        console.log('📈 AMU Dashboard: Calculated metrics:', {
          totalRecords,
          patientsWithAntibiotics,
          prevalencePercentage,
          watchReserveCount,
          watchReservePercentage,
          targetedCount,
          targetedPercentage,
          cultureYesCount,
          cultureLabPercentage,
          compliantCount,
          compliancePercentage
        });

        setCalculatedMetrics({
          totalRecords,
          patientsWithAntibiotics,
          prevalencePercentage,
          watchReserveCount,
          watchReservePercentage,
          targetedCount,
          targetedPercentage,
          cultureYesCount,
          cultureLabPercentage,
          compliantCount,
          compliancePercentage
        });

      } catch (err) {
        console.error('❌ AMU Dashboard: Error calculating metrics:', err);
      }
    };

    fetchAmuHumanData();
  }, []);

  const amuSummaryData = [
    {
      title: 'Total Records',
      value: loading ? 'Loading...' : 
             error ? 'Error' : 
             calculatedMetrics.totalRecords.toLocaleString(),
      subtitle: loading ? 'Fetching data...' :
                error ? 'Data unavailable' :
                'Patient records',
      icon: <ShieldAlert className="h-5 w-5" />,
      color: error ? 'warning' as const : 'default' as const
    },
    {
      title: 'AMU Prevalence',
      value: loading ? 'Loading...' : 
             error ? 'Error' : 
             `${calculatedMetrics.prevalencePercentage}%`,
      subtitle: loading ? 'Fetching data...' :
                error ? 'Data unavailable' :
                `of ${calculatedMetrics.totalRecords} patients`,
      icon: <Tablets className="h-5 w-5" />,
      color: error ? 'warning' as const : 'default' as const
    },
    {
      title: 'WaRe Share',
      value: loading ? 'Loading...' : 
             error ? 'Error' : 
             `${calculatedMetrics.watchReservePercentage}%`,
      subtitle: loading ? 'Fetching data...' :
                error ? 'Data unavailable' :
                'of all prescriptions',
      icon: <Lock className="h-5 w-5" />,
      color: error ? 'warning' as const : 'warning' as const
    },
    {
      title: 'Targeted Therapy',
      value: loading ? 'Loading...' : 
             error ? 'Error' : 
             `${calculatedMetrics.targetedPercentage}%`,
      subtitle: loading ? 'Fetching data...' :
                error ? 'Data unavailable' :
                'of all prescriptions',
      icon: <Target className="h-5 w-5" />,
      color: error ? 'warning' as const : 'default' as const
    },
    {
      title: 'Culture At/Before Start',
      value: loading ? 'Loading...' : 
             error ? 'Error' : 
             `${calculatedMetrics.cultureLabPercentage}%`,
      subtitle: loading ? 'Fetching data...' :
                error ? 'Data unavailable' :
                'of all prescriptions',
      icon: <Microscope className="h-5 w-5" />,
      color: error ? 'warning' as const : 'default' as const
    },
    {
      title: 'STG Compliance',
      value: loading ? 'Loading...' : 
             error ? 'Error' : 
             `${calculatedMetrics.compliancePercentage}%`,
      subtitle: loading ? 'Fetching data...' :
                error ? 'Data unavailable' :
                'Rx aligned to STGs',
      icon: <CheckCircle className="h-5 w-5" />,
      color: error ? 'warning' as const : 'success' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Cross className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800 text-sm font-medium">Error: {error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(186, 184, 108, 0.2)' }}>
        {amuSummaryData.map((card, index) => (
          <AmuSummaryCard
            key={index}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>

      {/* Debug Information */}
      {apiData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <FlaskConical className="h-5 w-5 text-blue-600 mr-2" />
            <p className="text-blue-800 text-sm font-medium">Data Source Information</p>
          </div>
          <p className="text-blue-700 text-xs">
            Node: {apiData.data.nodeName} | Total Rows: {apiData.data.totalRows} | 
            Columns: {apiData.data.columns.length} | Data Rows: {calculatedMetrics.totalRecords}
          </p>
        </div>
      )}

      {/* Charts */}
      {!loading && !error && <AmuCharts />}
    </div>
  );
}