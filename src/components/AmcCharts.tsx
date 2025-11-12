import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Mock data as fallback
const mockAntibioticDDDData = [
  { name: 'Doxycycline', value: 98.56 },
  { name: 'Amoxicillin', value: 51.47 },
  { name: 'Amoxicillin/Clavulanic-acid', value: 17.63 },
  { name: 'Cefuroxime', value: 16.31 },
  { name: 'Ciprofloxacin', value: 1.90 },
  { name: 'Streptomycin', value: 1.30 },
  { name: 'Clindamycin', value: 1.03 },
  { name: 'Metronidazole', value: 0.62 },
  { name: 'Clarithromycin', value: 0.60 },
  { name: 'Levofloxacin', value: 0.37 }
];

const mockAntibioticDIDData = [
  { name: 'Doxycycline', value: 8.76 },
  { name: 'Amoxicillin', value: 4.57 },
  { name: 'Amoxicillin/Clavulanic-acid', value: 1.57 },
  { name: 'Cefuroxime', value: 1.45 },
  { name: 'Ciprofloxacin', value: 0.17 },
  { name: 'Streptomycin', value: 0.12 },
  { name: 'Clindamycin', value: 0.09 },
  { name: 'Metronidazole', value: 0.05 },
  { name: 'Clarithromycin', value: 0.05 },
  { name: 'Levofloxacin', value: 0.03 }
];

const mockAwareData = [
  { name: 'Access', value: 65.2, color: '#22c55e' },
  { name: 'Watch', value: 28.1, color: '#f59e0b' },
  { name: 'Reserve', value: 6.7, color: '#ef4444' }
];

interface ApiResponse {
  success: boolean;
  data: {
    nodeId: string;
    nodeName: string;
    totalRows: number;
    columns: any[];
    rows: Array<{
      COUNTRY: number;
      ANTIBIOTIC_NAME?: string;
      PRODUCT_NAME?: string;
      DDD?: number;
      DID?: number;
      AWARE_CATEGORY?: string;
      YEAR?: number;
    }>;
  };
}

export function AmcCharts() {
  const [antibioticDDDData, setAntibioticDDDData] = useState(mockAntibioticDDDData);
  const [antibioticDIDData, setAntibioticDIDData] = useState(mockAntibioticDIDData);
  const [awareDDDData, setAwareDDDData] = useState(mockAwareData);
  const [awareDIDData, setAwareDIDData] = useState(mockAwareData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeInfo, setNodeInfo] = useState<{ nodeName: string; totalRows: number } | null>(null);

  const fetchAmcData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://backend.ajhiveprojects.com/v1/amc-animal');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data.rows)) {
        // Set node information
        setNodeInfo({
          nodeName: data.data.nodeName,
          totalRows: data.data.totalRows
        });

        const apiData = data.data.rows;

        // Check if we have actual antibiotic data in the API response
        const hasAntibioticData = apiData.some(item => 
          item.ANTIBIOTIC_NAME || item.DDD || item.DID || item.AWARE_CATEGORY
        );

        if (hasAntibioticData) {
          // Process actual antibiotic data from API
          processApiData(apiData);
        } else {
          // Use mock data but show API info
          console.log('Using mock data - no antibiotic data in API response');
        }
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching AMC data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processApiData = (apiData: any[]) => {
    // Process DDD data
    const dddByAntibiotic = apiData.reduce((acc, item) => {
      const antibioticName = item.ANTIBIOTIC_NAME || 'Unknown';
      const ddd = item.DDD || 0;
      
      if (!acc[antibioticName]) {
        acc[antibioticName] = 0;
      }
      acc[antibioticName] += ddd;
      return acc;
    }, {} as { [key: string]: number });

    const processedDDDData = Object.entries(dddByAntibiotic)
      .map(([name, value]) => ({ name, value: Number((value / 1000000).toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    if (processedDDDData.length > 0) {
      setAntibioticDDDData(processedDDDData);
    }

    // Process DID data
    const didByAntibiotic = apiData.reduce((acc, item) => {
      const antibioticName = item.ANTIBIOTIC_NAME || 'Unknown';
      const did = item.DID || 0;
      
      if (!acc[antibioticName]) {
        acc[antibioticName] = 0;
      }
      acc[antibioticName] += did;
      return acc;
    }, {} as { [key: string]: number });

    const processedDIDData = Object.entries(didByAntibiotic)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    if (processedDIDData.length > 0) {
      setAntibioticDIDData(processedDIDData);
    }

    // Process AWaRE data for DDD
    const dddByAware = apiData.reduce((acc, item) => {
      const category = item.AWARE_CATEGORY || 'Access';
      const ddd = item.DDD || 0;
      
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += ddd;
      return acc;
    }, {} as { [key: string]: number });

    const totalDDD = Object.values(dddByAware).reduce((sum, value) => sum + value, 0);
    const processedAwareDDD = Object.entries(dddByAware).map(([name, value]) => ({
      name,
      value: totalDDD > 0 ? Number(((value / totalDDD) * 100).toFixed(1)) : 0,
      color: getAwareColor(name)
    }));

    if (processedAwareDDD.length > 0) {
      setAwareDDDData(processedAwareDDD);
    }

    // Process AWaRE data for DID
    const didByAware = apiData.reduce((acc, item) => {
      const category = item.AWARE_CATEGORY || 'Access';
      const did = item.DID || 0;
      
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += did;
      return acc;
    }, {} as { [key: string]: number });

    const totalDID = Object.values(didByAware).reduce((sum, value) => sum + value, 0);
    const processedAwareDID = Object.entries(didByAware).map(([name, value]) => ({
      name,
      value: totalDID > 0 ? Number(((value / totalDID) * 100).toFixed(1)) : 0,
      color: getAwareColor(name)
    }));

    if (processedAwareDID.length > 0) {
      setAwareDIDData(processedAwareDID);
    }
  };

  const getAwareColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'access':
        return '#22c55e';
      case 'watch':
        return '#f59e0b';
      case 'reserve':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  useEffect(() => {
    fetchAmcData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-[0px] pr-[50px] pb-[24px] pl-[0px] aspect-square">
              <div className="w-full h-full bg-gray-100 rounded animate-pulse flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card className="border border-red-200">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Charts</h3>
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            Value: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">AMC Consumption Analytics</h2>
          {nodeInfo && (
            <p className="text-sm text-gray-600 mt-1">
              {nodeInfo.nodeName} • {nodeInfo.totalRows.toLocaleString()} records
            </p>
          )}
        </div>
        <button 
          onClick={fetchAmcData}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top 10 Antibiotics by DDD */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Top 10 Antibiotics by Total DDD</CardTitle>
          </CardHeader>
          <CardContent className="pt-[0px] pr-[50px] pb-[24px] pl-[0px] aspect-square">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={antibioticDDDData} margin={{ top: 5, right: 5, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  fontSize={11}
                />
                <YAxis 
                  fontSize={11} 
                  label={{ 
                    value: 'Total DDD (Millions)', 
                    angle: -90, 
                    position: 'insideLeftMiddle',
                    fontSize: 11
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 Antibiotics by DID */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Top 10 Antibiotics by DID</CardTitle>
          </CardHeader>
          <CardContent className="pt-[0px] pr-[50px] pb-[24px] pl-[0px] aspect-square">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={antibioticDIDData} margin={{ top: 5, right: 5, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  fontSize={11}
                />
                <YAxis 
                  fontSize={11} 
                  label={{ 
                    value: 'Total DID', 
                    angle: -90, 
                    position: 'insideLeftMiddle',
                    fontSize: 11
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Total DDD by AWaRE */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Total DDD by AWaRE Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center justify-center">
              <ResponsiveContainer width="100%" height={400} className="lg:w-1/2">
                <PieChart>
                  <Pie
                    data={awareDDDData}
                    cx="40%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {awareDDDData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="lg:w-1/2 lg:pl-8 mt-4 lg:mt-0">
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    AWaRE Classification System
                  </div>
                  {awareDDDData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-3"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total DID by AWaRE */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Total DID by AWaRE Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center justify-center">
              <ResponsiveContainer width="100%" height={400} className="lg:w-1/2">
                <PieChart>
                  <Pie
                    data={awareDIDData}
                    cx="40%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {awareDIDData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="lg:w-1/2 lg:pl-8 mt-4 lg:mt-0">
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    AWaRE Classification System
                  </div>
                  {awareDIDData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-3"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Status Info */}
      {nodeInfo && (
        <Card className="border border-blue-200 mb-8">
          <CardContent className="p-4">
            <div className="text-sm text-blue-700">
              <strong>Data Source:</strong> {nodeInfo.nodeName} ({nodeInfo.totalRows.toLocaleString()} records)
              <br />
              <span className="text-xs">
                Note: Charts display demonstration data. Actual antibiotic consumption data will be shown when available in the API response.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}