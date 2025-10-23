import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { makeServerRequest } from '../utils/supabase/client';
import { OrganismMappingDebug } from './OrganismMappingDebug';

interface DistributionData {
  table: string;
  field: string;
  totalRecords: number;
  distribution: {
    true_count: number;
    false_count: number;
    null_count: number;
    other_count: number;
    true_percentage: string;
    false_percentage: string;
    null_percentage: string;
    other_percentage: string;
  };
  uniqueValues: any[];
  sampleValues: Array<{
    value: any;
    type: string;
    stringified: string;
  }>;
  dataSource: string;
  timestamp: string;
}

const COLORS = {
  true: '#10b981',  // green
  false: '#ef4444', // red
  null: '#6b7280',  // gray
  other: '#f59e0b'  // amber
};

export function AntibioticDistributionAnalysis() {
  const [data, setData] = useState<DistributionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDistribution = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching antibiotic distribution analysis...');
      
      const result = await makeServerRequest('amu-antibiotic-distribution');
      console.log('Distribution analysis result:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setData(result);
    } catch (err) {
      console.error('Error fetching antibiotic distribution:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistribution();
  }, []);

  const getPieChartData = () => {
    if (!data) return [];
    
    const chartData = [];
    
    if (data.distribution.true_count > 0) {
      chartData.push({
        name: 'TRUE',
        value: data.distribution.true_count,
        percentage: data.distribution.true_percentage,
        color: COLORS.true
      });
    }
    
    if (data.distribution.false_count > 0) {
      chartData.push({
        name: 'FALSE',
        value: data.distribution.false_count,
        percentage: data.distribution.false_percentage,
        color: COLORS.false
      });
    }
    
    if (data.distribution.null_count > 0) {
      chartData.push({
        name: 'NULL',
        value: data.distribution.null_count,
        percentage: data.distribution.null_percentage,
        color: COLORS.null
      });
    }
    
    if (data.distribution.other_count > 0) {
      chartData.push({
        name: 'OTHER',
        value: data.distribution.other_count,
        percentage: data.distribution.other_percentage,
        color: COLORS.other
      });
    }
    
    return chartData;
  };

  const getBarChartData = () => {
    if (!data) return [];
    
    return [
      {
        name: 'TRUE',
        count: data.distribution.true_count,
        percentage: parseFloat(data.distribution.true_percentage)
      },
      {
        name: 'FALSE', 
        count: data.distribution.false_count,
        percentage: parseFloat(data.distribution.false_percentage)
      },
      {
        name: 'NULL',
        count: data.distribution.null_count,
        percentage: parseFloat(data.distribution.null_percentage)
      },
      {
        name: 'OTHER',
        count: data.distribution.other_count,
        percentage: parseFloat(data.distribution.other_percentage)
      }
    ].filter(item => item.count > 0);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Count: {data.value.toLocaleString()}</p>
          <p className="text-sm">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium">
                Antibiotic_yn Distribution Analysis
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Distribution of antibiotic_yn values in AMU_HH table
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDistribution}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">
                <strong>⚠️ Error:</strong> {error}
              </p>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading distribution analysis...</p>
              </div>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {data.distribution.true_count.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">
                    TRUE ({data.distribution.true_percentage}%)
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {data.distribution.false_count.toLocaleString()}
                  </div>
                  <div className="text-sm text-red-600">
                    FALSE ({data.distribution.false_percentage}%)
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">
                    {data.distribution.null_count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    NULL ({data.distribution.null_percentage}%)
                  </div>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-amber-700">
                    {data.distribution.other_count.toLocaleString()}
                  </div>
                  <div className="text-sm text-amber-600">
                    OTHER ({data.distribution.other_percentage}%)
                  </div>
                </div>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <h3 className="font-medium mb-4">Distribution Pie Chart</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Bar Chart */}
                <div>
                  <h3 className="font-medium mb-4">Count Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getBarChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Unique Values */}
              <div>
                <h3 className="font-medium mb-3">Unique Values Found</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    {data.uniqueValues.length} unique values:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.uniqueValues.map((value, index) => (
                      <span
                        key={index}
                        className="inline-block bg-white px-2 py-1 rounded text-sm border"
                      >
                        {String(value)} ({typeof value})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Sample Values */}
              <div>
                <h3 className="font-medium mb-3">Sample Values (First 20 records)</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                  <div className="space-y-1">
                    {data.sampleValues.map((sample, index) => (
                      <div key={index} className="text-sm font-mono">
                        Record {index + 1}: {sample.stringified} ({sample.type})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Metadata */}
              <div className="text-xs text-gray-500 border-t pt-4">
                <p>Total Records: {data.totalRecords.toLocaleString()}</p>
                <p>Table: {data.table}</p>
                <p>Field: {data.field}</p>
                <p>Last Updated: {new Date(data.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      
      {/* Debug Tool */}
      <OrganismMappingDebug />
    </div>
  );
}