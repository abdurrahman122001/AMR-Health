import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Users, Eye, Shield, Stethoscope, FlaskConical, CheckCircle, ShieldAlert, Cross, Microscope, Pill, Virus, Lock, Tablets, Target } from 'lucide-react';
import { AmuCharts } from './AmuCharts';
import { DiagnosisProfileView } from './AmuChartsWithDiagnosis';
import { AMU_Human_Demograph_RSex } from './AMU_Human_Demograph_RSex';
import { ServerDebug } from './ServerDebug';
import { makeServerRequest } from '../utils/supabase/client';

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

export function AmuDashboard() {
  // State for real antibiotic prevalence data from AMU_HH table
  const [prevalenceData, setPrevalenceData] = useState<{
    prevalencePercentage: string;
    totalRecords: number;
    patientsWithAntibiotics: number;
    loading: boolean;
    error: string | null;
  }>({
    prevalencePercentage: '0.0',
    totalRecords: 0,
    patientsWithAntibiotics: 0,
    loading: true,
    error: null
  });

  // State for real AWaRe Share data from AMU_HH table
  const [awareData, setAwareData] = useState<{
    watchReservePercentage: string;
    totalRecords: number;
    watchReserveCount: number;
    loading: boolean;
    error: string | null;
  }>({
    watchReservePercentage: '0.0',
    totalRecords: 0,
    watchReserveCount: 0,
    loading: true,
    error: null
  });

  // State for total record count from AMU_HH table
  const [totalRecordsData, setTotalRecordsData] = useState<{
    totalRecords: number;
    loading: boolean;
    error: string | null;
  }>({
    totalRecords: 0,
    loading: true,
    error: null
  });

  // State for targeted therapy data from AMU_HH table
  const [targetedTherapyData, setTargetedTherapyData] = useState<{
    targetedPercentage: string;
    totalRecords: number;
    targetedCount: number;
    loading: boolean;
    error: string | null;
  }>({
    targetedPercentage: '0.0',
    totalRecords: 0,
    targetedCount: 0,
    loading: true,
    error: null
  });

  // State for culture sent to lab data from AMU_HH table
  const [cultureLabData, setCultureLabData] = useState<{
    cultureLabPercentage: string;
    totalRecords: number;
    cultureYesCount: number;
    loading: boolean;
    error: string | null;
  }>({
    cultureLabPercentage: '0.0',
    totalRecords: 0,
    cultureYesCount: 0,
    loading: true,
    error: null
  });

  // State for STG compliance data from AMU_HH table
  const [stgComplianceData, setStgComplianceData] = useState<{
    compliancePercentage: string;
    totalRecords: number;
    compliantCount: number;
    loading: boolean;
    error: string | null;
  }>({
    compliancePercentage: '0.0',
    totalRecords: 0,
    compliantCount: 0,
    loading: true,
    error: null
  });

  // Fetch antibiotic prevalence data from AMU_HH table
  useEffect(() => {
    const fetchPrevalenceData = async () => {
      try {
        console.log('🔍 AMU Dashboard: Fetching antibiotic prevalence from AMU_HH table...');
        
        const data = await makeServerRequest('amu-prevalence?no_filters=true');
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 AMU Dashboard: Received prevalence data:', {
          total: data.totalRecords,
          withAntibiotics: data.patientsWithAntibiotics,
          percentage: data.prevalencePercentage,
          dataSource: data.dataSource
        });
        
        setPrevalenceData({
          prevalencePercentage: data.prevalencePercentage || '0.0',
          totalRecords: data.totalRecords || 0,
          patientsWithAntibiotics: data.patientsWithAntibiotics || 0,
          loading: false,
          error: null
        });
        
      } catch (err) {
        console.error('❌ AMU Dashboard: Error fetching prevalence data:', err);
        setPrevalenceData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch prevalence data'
        }));
      }
    };

    const fetchAwareData = async () => {
      try {
        console.log('🔍 AMU Dashboard: Fetching AWaRe Share from AMU_HH table...');
        
        const data = await makeServerRequest('amu-aware-share?no_filters=true');
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 AMU Dashboard: Received AWaRe data:', {
          total: data.totalRecords,
          watchReserve: data.watchReserveCount,
          percentage: data.watchReservePercentage,
          dataSource: data.dataSource
        });
        
        setAwareData({
          watchReservePercentage: data.watchReservePercentage || '0.0',
          totalRecords: data.totalRecords || 0,
          watchReserveCount: data.watchReserveCount || 0,
          loading: false,
          error: null
        });
        
      } catch (err) {
        console.error('❌ AMU Dashboard: Error fetching AWaRe data:', err);
        setAwareData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch AWaRe data'
        }));
      }
    };

    const fetchTotalRecordsData = async () => {
      try {
        console.log('🔍 AMU Dashboard: Fetching total record count from AMU_HH table...');
        
        const data = await makeServerRequest('amu-national');
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 AMU Dashboard: Received total records data:', {
          total: data.totalRecords,
          dataSource: data.dataSource
        });
        
        setTotalRecordsData({
          totalRecords: data.totalRecords || 0,
          loading: false,
          error: null
        });
        
      } catch (err) {
        console.error('❌ AMU Dashboard: Error fetching total records data:', err);
        setTotalRecordsData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch total records data'
        }));
      }
    };

    const fetchTargetedTherapyData = async () => {
      try {
        console.log('🔍 AMU Dashboard: Fetching targeted therapy data from AMU_HH table...');
        
        const data = await makeServerRequest('amu-targeted-therapy?no_filters=true');
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 AMU Dashboard: Received targeted therapy data:', {
          total: data.totalRecords,
          targeted: data.targetedCount,
          percentage: data.targetedPercentage,
          dataSource: data.dataSource
        });
        
        setTargetedTherapyData({
          targetedPercentage: data.targetedPercentage || '0.0',
          totalRecords: data.totalRecords || 0,
          targetedCount: data.targetedCount || 0,
          loading: false,
          error: null
        });
        
      } catch (err) {
        console.error('❌ AMU Dashboard: Error fetching targeted therapy data:', err);
        setTargetedTherapyData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch targeted therapy data'
        }));
      }
    };

    const fetchCultureLabData = async () => {
      try {
        console.log('🔍 AMU Dashboard: Fetching culture sent to lab data from AMU_HH table...');
        
        const data = await makeServerRequest('amu-culture-lab?no_filters=true');
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 AMU Dashboard: Received culture lab data:', {
          total: data.totalRecords,
          cultureYes: data.cultureYesCount,
          percentage: data.cultureLabPercentage,
          dataSource: data.dataSource
        });
        
        setCultureLabData({
          cultureLabPercentage: data.cultureLabPercentage || '0.0',
          totalRecords: data.totalRecords || 0,
          cultureYesCount: data.cultureYesCount || 0,
          loading: false,
          error: null
        });
        
      } catch (err) {
        console.error('❌ AMU Dashboard: Error fetching culture lab data:', err);
        setCultureLabData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch culture lab data'
        }));
      }
    };

    const fetchStgComplianceData = async () => {
      try {
        console.log('🔍 AMU Dashboard: Fetching STG compliance data from AMU_HH table...');
        
        const data = await makeServerRequest('amu-guideline-compliance?no_filters=true');
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log('📊 AMU Dashboard: Received STG compliance data:', {
          total: data.totalRecords,
          compliant: data.compliantCount,
          percentage: data.compliancePercentage,
          dataSource: data.dataSource
        });
        
        setStgComplianceData({
          compliancePercentage: data.compliancePercentage || '0.0',
          totalRecords: data.totalRecords || 0,
          compliantCount: data.compliantCount || 0,
          loading: false,
          error: null
        });
        
      } catch (err) {
        console.error('❌ AMU Dashboard: Error fetching STG compliance data:', err);
        setStgComplianceData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch STG compliance data'
        }));
      }
    };

    fetchPrevalenceData();
    fetchAwareData();
    fetchTotalRecordsData();
    fetchTargetedTherapyData();
    fetchCultureLabData();
    fetchStgComplianceData();
  }, []);

  const amuSummaryData = [
    {
      title: 'Total Records',
      value: totalRecordsData.loading ? 'Loading...' : 
             totalRecordsData.error ? 'Error' : 
             totalRecordsData.totalRecords.toLocaleString(),
      subtitle: totalRecordsData.loading ? 'Fetching data...' :
                totalRecordsData.error ? 'Data unavailable' :
                'Patient records',
      icon: <ShieldAlert className="h-5 w-5" />,
      color: totalRecordsData.error ? 'warning' as const : 'default' as const
    },
    {
      title: 'AMU Prevalence',
      value: prevalenceData.loading ? 'Loading...' : 
             prevalenceData.error ? 'Error' : 
             `${prevalenceData.prevalencePercentage}%`,
      subtitle: prevalenceData.loading ? 'Fetching data...' :
                prevalenceData.error ? 'Data unavailable' :
                 'of all patients',
      icon: <Tablets className="h-5 w-5" />,
      color: prevalenceData.error ? 'warning' as const : 'default' as const
    },
    {
      title: 'WaRe Share',
      value: awareData.loading ? 'Loading...' : 
             awareData.error ? 'Error' : 
             `${awareData.watchReservePercentage}%`,
      subtitle: awareData.loading ? 'Fetching data...' :
                awareData.error ? 'Data unavailable' :
                'of all prescriptions',
      icon: <Lock className="h-5 w-5" />,
      color: awareData.error ? 'warning' as const : 'warning' as const
    },
    {
      title: 'Targeted Therapy',
      value: targetedTherapyData.loading ? 'Loading...' : 
             targetedTherapyData.error ? 'Error' : 
             `${targetedTherapyData.targetedPercentage}%`,
      subtitle: targetedTherapyData.loading ? 'Fetching data...' :
                targetedTherapyData.error ? 'Data unavailable' :
                'of all prescriptions',
      icon: <Target className="h-5 w-5" />,
      color: targetedTherapyData.error ? 'warning' as const : 'default' as const
    },
    {
      title: 'Culture At/Before Start',
      value: cultureLabData.loading ? 'Loading...' : 
             cultureLabData.error ? 'Error' : 
             `${cultureLabData.cultureLabPercentage}%`,
      subtitle: cultureLabData.loading ? 'Fetching data...' :
                cultureLabData.error ? 'Data unavailable' :
                'of all prescriptions',
      icon: <Microscope className="h-5 w-5" />,
      color: cultureLabData.error ? 'warning' as const : 'default' as const
    },
    {
      title: 'STG Compliance',
      value: stgComplianceData.loading ? 'Loading...' : 
             stgComplianceData.error ? 'Error' : 
             `${stgComplianceData.compliancePercentage}%`,
      subtitle: stgComplianceData.loading ? 'Fetching data...' :
                stgComplianceData.error ? 'Data unavailable' :
                'Rx aligned to STGs',
      icon: <CheckCircle className="h-5 w-5" />,
      color: stgComplianceData.error ? 'warning' as const : 'success' as const
    }
  ];

  return (
    <div className="space-y-6">
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

      {/* Charts */}
      <AmuCharts />
    </div>
  );
}