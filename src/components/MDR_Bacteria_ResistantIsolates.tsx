import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, AlertTriangle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DonutData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface MDRResistantDataResponse {
  totalResistantIsolates: number;
  mdrAmongResistant: number;
  nonMdrResistant: number;
  mdrPercentage: number;
  nonMdrPercentage: number;
  donutData: DonutData[];
}

interface MDRBacteriaResistantIsolatesProps {
  activeFilters: Array<{ column: string; value: string; label: string }>;
}

export function MDRBacteriaResistantIsolates({ activeFilters }: MDRBacteriaResistantIsolatesProps) {
  const [mdrData, setMdrData] = useState<MDRResistantDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMDRData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching MDR bacteria resistant isolates data');
      console.log('Active filters:', activeFilters);

      // Build query parameters
      const params = new URLSearchParams();

      // Add active filters
      activeFilters.forEach(filter => {
        params.append(filter.column, filter.value);
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/mdr-bacteria-resistant-isolates?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('MDR bacteria resistant isolates response:', result);

      if (result.success && result.data) {
        setMdrData(result.data);
      } else {
        throw new Error(result.error || 'No MDR resistant data received');
      }

    } catch (err) {
      console.error('Error fetching MDR resistant bacteria data:', err);
      setError(`Failed to load MDR resistant bacteria data: ${err.message}`);
      setMdrData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMDRData();
  }, [activeFilters]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-gray-600">
            <span className="font-medium">Count:</span> {data.value.toLocaleString()}
          </p>
          <p className="text-blue-600">
            <span className="font-medium">Percentage:</span> {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            MDR Bacteria % of All R (Resistant) Isolates
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log('Download MDR bacteria resistant isolates data');
                // TODO: Implement download functionality
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Multi-drug resistant bacteria as percentage of all resistant isolates (ANY_R = TRUE) • 
          {activeFilters.length > 0 ? (
            <span className="font-medium text-blue-600 ml-1">
              Filtered ({activeFilters.length} filter{activeFilters.length === 1 ? '' : 's'})
            </span>
          ) : (
            <span className="text-gray-700 ml-1">All records</span>
          )}
          {loading && (
            <span className="ml-2 text-gray-500 italic">
              (Updating...)
            </span>
          )}
        </p>
      </CardHeader>

      <CardContent className="pt-0 pr-6 pb-8 pl-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">
              <strong>⚠️ Data Error:</strong> {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading MDR resistant bacteria data...</p>
            </div>
          </div>
        ) : mdrData ? (
          <div className="flex gap-6">
            {/* Donut Chart */}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={mdrData.donutData}
                    cx="40%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={140}
                    innerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {mdrData.donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <text 
                    x="40%" 
                    y="46%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="text-lg font-bold fill-gray-700"
                  >
                    {mdrData.mdrPercentage}%
                  </text>
                  <text 
                    x="40%" 
                    y="54%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="text-sm fill-gray-600"
                  >
                    MDR Rate
                  </text>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend and Stats */}
            <div className="space-y-6 my-6">
              <h4 className="font-medium">
                MDR Distribution
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Among Resistant)
                </span>
              </h4>

              {/* Legend Items */}
              <div className="space-y-3">
                {mdrData.donutData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between rounded px-2 py-1">
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-700 text-sm">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-sm font-semibold">
                        {item.percentage}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.value.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Key Statistics */}
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Resistant:</span>
                    <span className="text-sm font-medium">{mdrData.totalResistantIsolates.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">MDR among Resistant:</span>
                    <span className="text-sm font-medium text-red-600">{mdrData.mdrAmongResistant.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Non-MDR Resistant:</span>
                    <span className="text-sm font-medium text-orange-600">{mdrData.nonMdrResistant.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Alert Level Indicator */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    mdrData.mdrPercentage >= 40 ? 'bg-red-100 text-red-800' :
                    mdrData.mdrPercentage >= 20 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {mdrData.mdrPercentage >= 40 ? (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        High Alert (≥40%)
                      </>
                    ) : mdrData.mdrPercentage >= 20 ? (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        Medium Alert (20-39%)
                      </>
                    ) : (
                      <>
                        ✓ Low Alert (&lt;20%)
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No MDR resistant data available</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Calculation: ((MDR_TF === TRUE) / (ANY_R === TRUE)) × 100. 
            Shows MDR prevalence specifically among isolates with confirmed resistance to at least one antibiotic.
            Includes organisms: S. aureus, E. coli, S. pneumoniae, K. pneumoniae, Enterobacter spp., E. faecium, E. faecalis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}