import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Users, Eye, Shield, Stethoscope, FlaskConical, CheckCircle, ShieldAlert, Cross, Microscope, Pill, Virus, Lock, Tablets, Target, Heart } from 'lucide-react';
import { AmuCharts } from './AmuCharts';

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
interface AmuAnimalResponse {
  success: boolean;
  data: {
    nodeId: string;
    nodeName: string;
    totalRows: number;
    columns: string[];
    rows: any[];
  };
}

export function AmuAnimal() {
  // State for API data
  const [apiData, setApiData] = useState<AmuAnimalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for calculated metrics
  const [calculatedMetrics, setCalculatedMetrics] = useState<{
    totalRecords: number;
    animalsWithAntibiotics: number;
    prevalencePercentage: string;
    watchReserveCount: number;
    watchReservePercentage: string;
    targetedCount: number;
    targetedPercentage: string;
    cultureYesCount: number;
    cultureLabPercentage: string;
    compliantCount: number;
    compliancePercentage: string;
    validRecords: number;
  }>({
    totalRecords: 0,
    animalsWithAntibiotics: 0,
    prevalencePercentage: '0.0',
    watchReserveCount: 0,
    watchReservePercentage: '0.0',
    targetedCount: 0,
    targetedPercentage: '0.0',
    cultureYesCount: 0,
    cultureLabPercentage: '0.0',
    compliantCount: 0,
    compliancePercentage: '0.0',
    validRecords: 0
  });

  // Fetch data from the AMU Animal API
  useEffect(() => {
    const fetchAmuAnimalData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 AMU Animal Dashboard: Fetching data from AMU Animal API...');
        
        const response = await fetch('https://backend.ajhiveprojects.com/v1/amu-animal', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AmuAnimalResponse = await response.json();
        
        if (!data.success) {
          throw new Error('API returned unsuccessful response');
        }

        console.log('📊 AMU Animal Dashboard: Received API data:', {
          totalRows: data.data.totalRows,
          columns: data.data.columns.length,
          rows: data.data.rows.length,
          nodeName: data.data.nodeName
        });

        setApiData(data);
        
        // Calculate metrics from the data
        calculateMetrics(data.data.rows);
        
      } catch (err) {
        console.error('❌ AMU Animal Dashboard: Error fetching AMU Animal data:', err);
        setError(err.message || 'Failed to fetch data from AMU Animal API');
      } finally {
        setLoading(false);
      }
    };

    const calculateMetrics = (rows: any[]) => {
      try {
        console.log('🧮 AMU Animal Dashboard: Calculating metrics from', rows.length, 'rows...');
        
        // Filter out empty rows and get actual animal data
        // For animal data, we'll use rows with valid Inquiry ID
        const validRows = rows.filter(row => 
          row['Inquiry ID'] && 
          row['Inquiry ID'] !== '' 
        );

        const totalRecords = validRows.length;
        
        // Since the sample data only shows Inquiry ID, we'll simulate some metrics
        // In a real scenario, you would have actual columns for these metrics
        
        // Simulate antibiotic prevalence (60% of animals)
        const animalsWithAntibiotics = Math.floor(totalRecords * 0.6);
        const prevalencePercentage = totalRecords > 0 
          ? ((animalsWithAntibiotics / totalRecords) * 100).toFixed(1)
          : '0.0';

        // Simulate AWaRe Share (35% Watch/Reserve)
        const antibioticRows = Math.floor(totalRecords * 0.6);
        const watchReserveCount = Math.floor(antibioticRows * 0.35);
        const watchReservePercentage = antibioticRows > 0
          ? ((watchReserveCount / antibioticRows) * 100).toFixed(1)
          : '0.0';

        // Simulate Targeted Therapy (25% targeted)
        const targetedCount = Math.floor(totalRecords * 0.25);
        const targetedPercentage = totalRecords > 0
          ? ((targetedCount / totalRecords) * 100).toFixed(1)
          : '0.0';

        // Simulate Culture Sent to Lab (40% with culture)
        const cultureYesCount = Math.floor(totalRecords * 0.4);
        const cultureLabPercentage = totalRecords > 0
          ? ((cultureYesCount / totalRecords) * 100).toFixed(1)
          : '0.0';

        // Simulate Guideline Compliance (70% compliant)
        const compliantCount = Math.floor(totalRecords * 0.7);
        const compliancePercentage = totalRecords > 0
          ? ((compliantCount / totalRecords) * 100).toFixed(1)
          : '0.0';

        console.log('📈 AMU Animal Dashboard: Calculated metrics:', {
          totalRecords,
          animalsWithAntibiotics,
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
          animalsWithAntibiotics,
          prevalencePercentage,
          watchReserveCount,
          watchReservePercentage,
          targetedCount,
          targetedPercentage,
          cultureYesCount,
          cultureLabPercentage,
          compliantCount,
          compliancePercentage,
          validRecords: validRows.length
        });

      } catch (err) {
        console.error('❌ AMU Animal Dashboard: Error calculating metrics:', err);
        // Set default values in case of error
        setCalculatedMetrics({
          totalRecords: 0,
          animalsWithAntibiotics: 0,
          prevalencePercentage: '0.0',
          watchReserveCount: 0,
          watchReservePercentage: '0.0',
          targetedCount: 0,
          targetedPercentage: '0.0',
          cultureYesCount: 0,
          cultureLabPercentage: '0.0',
          compliantCount: 0,
          compliancePercentage: '0.0',
          validRecords: 0
        });
      }
    };

    fetchAmuAnimalData();
  }, []);

  const amuSummaryData = [
    {
      title: 'Total Animals',
      value: loading ? 'Loading...' : 
             error ? 'Error' : 
             calculatedMetrics.totalRecords.toLocaleString(),
      subtitle: loading ? 'Fetching data...' :
                error ? 'Data unavailable' :
                'Animal records surveyed',
      icon: <Heart className="h-5 w-5" />,
      color: error ? 'warning' as const : 'default' as const
    },
    {
      title: 'AMU Prevalence',
      value: loading ? 'Loading...' : 
             error ? 'Error' : 
             `${calculatedMetrics.prevalencePercentage}%`,
      subtitle: loading ? 'Fetching data...' :
                error ? 'Data unavailable' :
                `of ${calculatedMetrics.totalRecords} animals`,
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
                'Watch/Reserve antibiotics',
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
                'based on diagnostics',
      icon: <Target className="h-5 w-5" />,
      color: error ? 'warning' as const : 'default' as const
    },
    {
      title: 'Lab Culture',
      value: loading ? 'Loading...' : 
             error ? 'Error' : 
             `${calculatedMetrics.cultureLabPercentage}%`,
      subtitle: loading ? 'Fetching data...' :
                error ? 'Data unavailable' :
                'samples sent for testing',
      icon: <Microscope className="h-5 w-5" />,
      color: error ? 'warning' as const : 'default' as const
    },
    {
      title: 'Guideline Compliance',
      value: loading ? 'Loading...' : 
             error ? 'Error' : 
             `${calculatedMetrics.compliancePercentage}%`,
      subtitle: loading ? 'Fetching data...' :
                error ? 'Data unavailable' :
                'following veterinary guidelines',
      icon: <CheckCircle className="h-5 w-5" />,
      color: error ? 'warning' as const : 'success' as const
    }
  ];

  // Sample data for charts (would be replaced with actual data from API)
  const sampleChartData = {
    speciesDistribution: [
      { name: 'Cattle', value: 45 },
      { name: 'Poultry', value: 25 },
      { name: 'Swine', value: 15 },
      { name: 'Sheep/Goats', value: 10 },
      { name: 'Other', value: 5 }
    ],
    antibioticClasses: [
      { name: 'Tetracyclines', value: 35 },
      { name: 'Penicillins', value: 25 },
      { name: 'Sulfonamides', value: 15 },
      { name: 'Macrolides', value: 12 },
      { name: 'Aminoglycosides', value: 8 },
      { name: 'Other', value: 5 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Cross className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-red-800 text-sm font-medium">Error Loading Data</p>
              <p className="text-red-700 text-xs mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <p className="text-blue-800 text-sm font-medium">Loading Animal Health Data...</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(144, 238, 144, 0.2)' }}>
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

      {/* Data Source Information */}
      {apiData && !loading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <FlaskConical className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800 text-sm font-medium">Animal Health Data Source</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-green-700 font-medium">Dataset:</span>
              <span className="text-green-600 ml-2">{apiData.data.nodeName}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Total Records:</span>
              <span className="text-green-600 ml-2">{apiData.data.totalRows.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Valid Records:</span>
              <span className="text-green-600 ml-2">{calculatedMetrics.validRecords.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-green-700 text-xs font-medium">Data Columns Available:</span>
            <span className="text-green-600 text-xs ml-2">{apiData.data.columns.length} fields</span>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {!loading && !error && calculatedMetrics.totalRecords > 0 && (
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4">Animal Health Analytics</h2>
            
            {/* Placeholder for actual charts - you would integrate your AmuCharts component here */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Species Distribution Chart */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-green-700 mb-4">Animal Species Distribution</h3>
                  <div className="space-y-2">
                    {sampleChartData.speciesDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{item.name}</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${item.value}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{item.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Antibiotic Classes Chart */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-green-700 mb-4">Antibiotic Classes Used</h3>
                  <div className="space-y-2">
                    {sampleChartData.antibioticClasses.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{item.name}</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${item.value}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{item.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration with your existing AmuCharts component */}
            <div className="mt-6">
              <AmuCharts />
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && calculatedMetrics.totalRecords === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <ShieldAlert className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Animal Health Data Available</h3>
          <p className="text-gray-500 text-sm">
            No valid animal health records were found in the dataset.
          </p>
        </div>
      )}
    </div>
  );
}