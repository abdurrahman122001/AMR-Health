import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Sparkline data for animal pathogens over time (annual trends)
const sparklineData = {
  'E. coli': [
    { year: '2019', value: 58.3 },
    { year: '2020', value: 60.1 },
    { year: '2021', value: 62.4 },
    { year: '2022', value: 64.8 },
    { year: '2023', value: 66.5 },
    { year: '2024', value: 68.1 }
  ],
  'Salmonella spp.': [
    { year: '2019', value: 47.5 },
    { year: '2020', value: 49.2 },
    { year: '2021', value: 50.8 },
    { year: '2022', value: 52.3 },
    { year: '2023', value: 53.9 },
    { year: '2024', value: 55.2 }
  ],
  'S. aureus': [
    { year: '2019', value: 36.4 },
    { year: '2020', value: 38.1 },
    { year: '2021', value: 39.7 },
    { year: '2022', value: 41.2 },
    { year: '2023', value: 42.6 },
    { year: '2024', value: 43.7 }
  ],
  'Campylobacter': [
    { year: '2019', value: 34.1 },
    { year: '2020', value: 36.3 },
    { year: '2021', value: 38.2 },
    { year: '2022', value: 39.8 },
    { year: '2023', value: 41.1 },
    { year: '2024', value: 42.3 }
  ]
};

const pathogenInfo = [
  {
    name: 'E. coli',
    currentRate: 67.3,
    trend: '+5.2%',
    samples: 1847,
    priority: 'Critical',
    color: '#ef4444'
  },
  {
    name: 'Salmonella spp.',
    currentRate: 54.8,
    trend: '+4.0%',
    samples: 1156,
    priority: 'High',
    color: '#f59e0b'
  },
  {
    name: 'S. aureus',
    currentRate: 43.2,
    trend: '+2.9%',
    samples: 892,
    priority: 'High',
    color: '#f59e0b'
  },
  {
    name: 'Campylobacter',
    currentRate: 41.7,
    trend: '+3.4%',
    samples: 743,
    priority: 'Medium',
    color: '#22c55e'
  }
];

const MiniTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
        {data.year}: {data.value.toFixed(1)}%
      </div>
    );
  }
  return null;
};

export function AMR_Animal_Overview_PrioritySpark() {
  const [ecoliData, setEcoliData] = useState<Array<{year: string, value: number}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEcoliRate, setCurrentEcoliRate] = useState(67.3); // fallback value
  
  // New state for live pathogen stats
  const [pathogenStats, setPathogenStats] = useState<{[key: string]: {samples: number, trend: string, currentResistance?: number}}>({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Fetch pathogen stats (samples and trends) for all pathogens
  useEffect(() => {
    const fetchPathogenStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        
        console.log('Fetching animal pathogen stats from AMR_Animal...');
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-pathogen-stats`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Pathogen stats data received:', data);

        if (data.success && data.pathogenStats) {
          setPathogenStats(data.pathogenStats);
          console.log('Pathogen stats updated:', data.pathogenStats);
        } else {
          throw new Error(data.error || 'Failed to fetch pathogen stats');
        }
      } catch (err) {
        console.error('Error fetching pathogen stats:', err);
        setStatsError(err instanceof Error ? err.message : 'Unknown error occurred');
        // Keep using fallback data on error
      } finally {
        setStatsLoading(false);
      }
    };

    // Only fetch if we have the required environment variables
    if (projectId && publicAnonKey) {
      fetchPathogenStats();
    } else {
      console.warn('Missing project configuration for pathogen stats fetch');
      setStatsLoading(false);
    }
  }, []);

  // Fetch E. coli resistance data from the new endpoint
  useEffect(() => {
    const fetchEcoliData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching E. coli resistance data from AMR_Animal...');
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-ecoli-resistance-by-year`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('E. coli resistance data received:', data);

        if (data.success && data.yearData && Array.isArray(data.yearData)) {
          // Transform the data to match the sparkline format
          const transformedData = data.yearData.map((item: any) => ({
            year: item.year.toString(),
            value: item.resistance || 0
          }));
          
          setEcoliData(transformedData);
          
          // Update current rate if available
          if (data.currentResistance !== undefined) {
            setCurrentEcoliRate(data.currentResistance);
          }
          
          console.log('E. coli data transformed:', transformedData);
        } else if (data.success && data.yearData && data.yearData.length === 0) {
          console.log('No E. coli data available, using fallback');
          // Keep using fallback data
        } else {
          throw new Error(data.error || 'Failed to fetch E. coli resistance data');
        }
      } catch (err) {
        console.error('Error fetching E. coli resistance data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        // Keep using fallback data on error
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have the required environment variables
    if (projectId && publicAnonKey) {
      fetchEcoliData();
    } else {
      console.warn('Missing project configuration for E. coli data fetch');
      setIsLoading(false);
    }
  }, []);

  // Update pathogen info with real data from API
  const pathogenInfoWithRealData = pathogenInfo.map(pathogen => {
    const liveStats = pathogenStats[pathogen.name];
    
    if (pathogen.name === 'E. coli') {
      return {
        ...pathogen,
        currentRate: currentEcoliRate,
        samples: liveStats?.samples || pathogen.samples,
        trend: liveStats?.trend || pathogen.trend
      };
    } else if (liveStats) {
      return {
        ...pathogen,
        currentRate: liveStats.currentResistance || pathogen.currentRate,
        samples: liveStats.samples,
        trend: liveStats.trend
      };
    }
    return pathogen;
  });

  // Update sparkline data to use real data when available
  const sparklineDataWithReal = { ...sparklineData };
  
  // Use real E. coli data if available
  if (ecoliData.length > 0) {
    sparklineDataWithReal['E. coli'] = ecoliData;
  }
  
  // Use real data for other pathogens if available
  Object.entries(pathogenStats).forEach(([pathogenName, stats]) => {
    if (stats.yearData && Array.isArray(stats.yearData) && stats.yearData.length > 0) {
      sparklineDataWithReal[pathogenName as keyof typeof sparklineData] = stats.yearData.map((item: any) => ({
        year: item.year.toString(),
        value: item.resistance || 0
      }));
    }
  });

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Animal Health Resistance Trends - Top Priority Pathogens
        </CardTitle>
        <p className="text-sm text-gray-600 m-[0px]">
          Annual resistance rate trends for critical veterinary pathogens
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pathogenInfoWithRealData.map((pathogen, index) => (
            <div key={pathogen.name} className="space-y-3">
              {/* Pathogen Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {pathogen.name}
                  </h4>
                  <span 
                    className="text-xs px-2 py-1 rounded-full text-white font-medium"
                    style={{ backgroundColor: pathogen.color }}
                  >
                    {pathogen.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  {((pathogen.name === 'E. coli' && isLoading) || (pathogen.name !== 'E. coli' && statsLoading)) ? (
                    <>
                      <span className="text-gray-400">Loading samples...</span>
                      <span className="text-gray-400">Loading trend...</span>
                    </>
                  ) : (
                    <>
                      <span>{pathogen.samples.toLocaleString()} samples</span>
                      <span className="text-red-600 font-medium">{pathogen.trend}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Current Rate */}
              <div className="text-center">
                {((pathogen.name === 'E. coli' && isLoading) || (pathogen.name !== 'E. coli' && statsLoading)) ? (
                  <div className="text-center">
                    <div className="text-lg font-medium text-gray-400">
                      Loading...
                    </div>
                    <div className="text-xs text-gray-500">fetching data</div>
                  </div>
                ) : pathogen.samples === 0 ? (
                  <div className="text-center">
                    <div className="text-lg font-medium text-gray-500">
                      No Data
                    </div>
                    <div className="text-xs text-gray-500">insufficient isolates</div>
                  </div>
                ) : pathogen.samples < 30 ? (
                  <div className="text-center">
                    <div className="text-lg font-medium text-gray-500">
                      Insufficient Data
                    </div>
                    <div className="text-xs text-gray-500">N &lt; 30</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: pathogen.color }}>
                      {pathogen.currentRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">resistance rate</div>
                  </div>
                )}
              </div>

              {/* Sparkline */}
              <div className="h-16">
                {pathogen.samples === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <span className="ml-2 text-xs text-gray-500">No data</span>
                  </div>
                ) : pathogen.samples < 30 ? (
                  <div className="flex items-center justify-center h-full">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <span className="ml-2 text-xs text-gray-500">Insufficient data</span>
                  </div>
                ) : ((pathogen.name === 'E. coli' && isLoading) || (pathogen.name !== 'E. coli' && statsLoading)) ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="ml-2 text-xs text-gray-500">Loading...</span>
                  </div>
                ) : ((pathogen.name === 'E. coli' && error) || (pathogen.name !== 'E. coli' && statsError)) ? (
                  <div className="flex items-center justify-center h-full" 
                       title={`Error: ${pathogen.name === 'E. coli' ? error : statsError}`}>
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="ml-2 text-xs text-gray-600">Data not available</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={sparklineDataWithReal[pathogen.name as keyof typeof sparklineDataWithReal] || []}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip content={<MiniTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={pathogen.color}
                        strokeWidth={2}
                        fill={`${pathogen.color}20`}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Summary */}
        <div className="mt-[10px] border-t border-gray-200 pt-[10px] pr-[0px] pb-[0px] pl-[0px] mr-[0px] mb-[0px] ml-[0px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">4</div>
              <div className="text-gray-600">Critical priority pathogens</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-600">
                {(() => {
                  // Calculate average trend from live data if available
                  const livePathogens = Object.entries(pathogenStats).filter(([_, stats]) => stats.samples > 0);
                  if (livePathogens.length > 0) {
                    const trends = livePathogens.map(([_, stats]) => {
                      const trendValue = parseFloat(stats.trend.replace('%', '').replace('+', ''));
                      return isNaN(trendValue) ? 0 : trendValue;
                    });
                    const avgTrend = trends.reduce((sum, trend) => sum + trend, 0) / trends.length;
                    return avgTrend >= 0 ? `+${avgTrend.toFixed(1)}%` : `${avgTrend.toFixed(1)}%`;
                  }
                  return '+3.9%'; // fallback
                })()}
              </div>
              <div className="text-gray-600">Average resistance increase</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {(() => {
                  // Calculate total samples from live data if available
                  const totalSamples = Object.values(pathogenStats).reduce((sum, stats) => sum + (stats.samples || 0), 0);
                  return totalSamples > 0 ? totalSamples.toLocaleString() : '4,638'; // fallback
                })()}
              </div>
              <div className="text-gray-600">Total isolates analyzed</div>
            </div>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}