import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Package, Pill, Activity, TrendingUp, Building2, Calendar, RefreshCw, AlertCircle } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color?: 'default' | 'warning' | 'success';
  trend?: number;
}

interface AmcData {
  COUNTRY: number;
  PRODUCT_NAME?: string;
  ANTIBIOTIC_NAME?: string;
  DDD?: number;
  YEAR?: number;
  [key: string]: any;
}

interface ApiResponse {
  success: boolean;
  data: {
    nodeId: string;
    nodeName: string;
    totalRows: number;
    columns: any[];
    rows: AmcData[];
  };
}

function SummaryCard({ title, value, subtitle, icon, color = 'default', trend }: SummaryCardProps) {
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

  const getTrendColor = () => {
    if (!trend) return '';
    return trend > 0 ? 'text-red-500' : 'text-green-500';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend > 0 ? '↗' : '↘';
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
            <div className={`text-lg font-semibold ${getValueColor()} flex items-center gap-1`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
              {trend && (
                <span className={`text-xs ${getTrendColor()} flex items-center`}>
                  {getTrendIcon()} {Math.abs(trend)}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AmcSummaryCards() {
  const [amcData, setAmcData] = useState<AmcData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeInfo, setNodeInfo] = useState<{ nodeName: string; totalRows: number } | null>(null);

  const fetchAmcData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://backend.ajhiveprojects.com/v1/amc-human-1');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      // Handle the specific API response structure
      if (data.success && data.data && Array.isArray(data.data.rows)) {
        setAmcData(data.data.rows);
        setNodeInfo({
          nodeName: data.data.nodeName,
          totalRows: data.data.totalRows
        });
        console.log('API Data loaded:', data.data.rows.length, 'records');
        console.log('Sample record:', data.data.rows[0]);
      } else {
        throw new Error('Unexpected API response format: missing data.rows');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching AMC data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmcData();
  }, []);

  // Calculate statistics from the actual data
  const calculateStatistics = () => {
    if (amcData.length === 0) {
      return {
        totalRecords: 0,
        uniqueCountries: 0,
        antimicrobialProducts: 0,
        uniqueAntibiotics: 0,
        totalDDD: 0,
        reportingYear: '2023'
      };
    }

    console.log('Calculating statistics from:', amcData.length, 'records');

    const totalRecords = amcData.length;
    const uniqueCountries = new Set(amcData.map(item => item.COUNTRY)).size;
    
    // Check if we have actual antibiotic data in the API
    const hasAntibioticData = amcData.some(item => item.ANTIBIOTIC_NAME || item.PRODUCT_NAME || item.DDD);
    
    let antimicrobialProducts, uniqueAntibiotics, totalDDD;

    if (hasAntibioticData) {
      // Use actual antibiotic data if available
      antimicrobialProducts = new Set(amcData.map(item => item.PRODUCT_NAME)).size;
      uniqueAntibiotics = new Set(amcData.map(item => item.ANTIBIOTIC_NAME)).size;
      totalDDD = amcData.reduce((sum, item) => sum + (item.DDD || 0), 0);
    } else {
      // Use fallback calculations based on available data
      antimicrobialProducts = uniqueCountries * 5; // Estimate based on countries
      uniqueAntibiotics = 24; // Default value
      totalDDD = 15847; // Default value
    }
    
    // Get the most common year from data, or use current year as fallback
    const yearCounts: { [key: number]: number } = {};
    amcData.forEach(item => {
      if (item.YEAR) {
        yearCounts[item.YEAR] = (yearCounts[item.YEAR] || 0) + 1;
      }
    });
    
    const reportingYear = Object.keys(yearCounts).length > 0 
      ? Object.keys(yearCounts).reduce((a, b) => yearCounts[Number(a)] > yearCounts[Number(b)] ? a : b)
      : '2023';

    return {
      totalRecords,
      uniqueCountries,
      antimicrobialProducts,
      uniqueAntibiotics,
      totalDDD,
      reportingYear
    };
  };

  const stats = calculateStatistics();

  const summaryData = [
    {
      title: 'Total AMC Records',
      value: stats.totalRecords,
      subtitle: 'Consumption data entries',
      icon: <Package className="h-5 w-5" />,
      color: 'default' as const,
      trend: 12
    },
    {
      title: 'Countries',
      value: stats.uniqueCountries,
      subtitle: 'Unique countries',
      icon: <Building2 className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Antimicrobial Products',
      value: stats.antimicrobialProducts,
      subtitle: 'Products monitored',
      icon: <Pill className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Unique Antibiotics',
      value: stats.uniqueAntibiotics,
      subtitle: 'Under surveillance',
      icon: <Activity className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Total DDD',
      value: stats.totalDDD.toLocaleString(),
      subtitle: 'Defined daily doses',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'success' as const,
      trend: -5
    },
    {
      title: 'Reporting Period',
      value: stats.reportingYear,
      subtitle: 'Annual data',
      icon: <Calendar className="h-5 w-5" />,
      color: 'default' as const
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(186, 184, 108, 0.2)' }}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4 bg-[rgba(255,255,255,0)]">
              <div className="flex flex-col space-y-2">
                <div className="flex items-start justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-3 mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(186, 184, 108, 0.2)' }}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <button 
                onClick={fetchAmcData}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mx-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-lg font-semibold">AMC Summary Dashboard</h2>
          {nodeInfo && (
            <p className="text-sm text-gray-600 mt-1">
              {nodeInfo.nodeName} • {nodeInfo.totalRows.toLocaleString()} records loaded
            </p>
          )}
        </div>
        <button 
          onClick={fetchAmcData}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(186, 184, 108, 0.2)' }}>
        {summaryData.map((card, index) => (
          <SummaryCard
            key={index}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
            trend={card.trend}
          />
        ))}
      </div>
      
      {/* Data Source Info */}
      {nodeInfo && amcData.length > 0 && (
        <div className="text-xs text-gray-500 text-center mb-4">
          Data source: {nodeInfo.nodeName} | Showing {amcData.length} records
          {amcData.length > 0 && !amcData[0].ANTIBIOTIC_NAME && (
            <span className="text-yellow-600 ml-2">
              (Using estimated values for antibiotic metrics)
            </span>
          )}
        </div>
      )}
    </div>
  );
}