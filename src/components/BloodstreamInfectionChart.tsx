import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BloodstreamInfectionData {
  resistant: number;
  total: number;
}

interface BloodstreamInfectionChartProps {
  endpoint: string; // New prop for the API endpoint
  title: string;
  chartId: string;
  filters?: Record<string, string>; // Optional filters
}

export function BloodstreamInfectionChart({ endpoint, title, chartId, filters }: BloodstreamInfectionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [data, setData] = useState<BloodstreamInfectionData>({ resistant: 0, total: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBloodstreamData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching bloodstream infection data from endpoint: ${endpoint}`);
        
        // Build URL with filters if provided
        const url = new URL(`https://${projectId}.supabase.co/functions/v1/make-server-2267887d/${endpoint}`);
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'no_filters') {
              url.searchParams.append(key, value);
            }
          });
        }
        
        console.log('Request URL:', url.toString());
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Bloodstream infection data response:', result);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        // Map the response to our data format
        setData({
          resistant: result.resistantCount || 0,
          total: result.totalTested || 0
        });
        
      } catch (error) {
        console.error('Error fetching bloodstream infection data:', error);
        setError(`Failed to load data: ${error.message}`);
        setData({ resistant: 0, total: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchBloodstreamData();
  }, [endpoint, filters]);

  const resistanceRate = (data.resistant / data.total) * 100;
  const susceptibleRate = 100 - resistanceRate;

  // Color coding based on resistance rate thresholds
  const getResistanceColor = (rate: number) => {
    if (rate < 20) return '#22c55e'; // Green for low risk
    if (rate < 40) return '#eab308'; // Yellow for moderate risk
    return '#ef4444'; // Red for high risk
  };

  const chartData = [
    {
      name: 'Resistant',
      value: data.resistant,
      percentage: resistanceRate,
      color: getResistanceColor(resistanceRate)
    },
    {
      name: 'Susceptible',
      value: data.total - data.resistant,
      percentage: susceptibleRate,
      color: '#64748b' // Gray for susceptible
    }
  ];

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Cases: {data.value}</p>
          <p className="text-sm">Percentage: {data.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(1)}%`;
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading bloodstream infection data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">⚠️ {error}</p>
          <p className="text-xs text-muted-foreground">Please check server connection</p>
        </div>
      </div>
    );
  }

  // Show no data state
  if (data.total === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No bloodstream infection data available</p>
          <p className="text-xs text-muted-foreground">for the selected filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-96 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={160}
              innerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${chartId}-${index}`} 
                  fill={entry.color}
                  stroke={activeIndex === index ? "#333" : "none"}
                  strokeWidth={activeIndex === index ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip content={renderCustomTooltip} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label for donut chart */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: getResistanceColor(resistanceRate) }}>
              {resistanceRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Resistance
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Resistance Rate</p>
            <p className="font-medium" style={{ color: getResistanceColor(resistanceRate) }}>
              {resistanceRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Cases</p>
            <p className="font-medium">{data.total}</p>
          </div>
        </div>
      </div>
    </div>
  );
}