import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function AMR_Human_Demographic_AgeSUM() {
  const [ageData, setAgeData] = useState({
    totalAgeGroups: 0,
    totalRecords: 0,
    rankedCategories: [],
    trending: 'stable'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch age distribution data from AMU_HH table
  const fetchAgeDistribution = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching age distribution data...');
      
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d`;
      const response = await fetch(`${baseUrl}/amr-age-distribution`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Age distribution data received:', data);
        
        if (data.success && data.rankedCategories) {
          setAgeData({
            totalAgeGroups: data.totalAgeGroups || 0,
            totalRecords: data.totalRecords || 0,
            rankedCategories: data.rankedCategories || [],
            trending: 'stable' // Could be calculated based on trends over time
          });
        } else {
          throw new Error(data.error || 'Failed to fetch age distribution data');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error('Error fetching age distribution:', err);
      setError(err.message || 'Failed to fetch age distribution data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAgeDistribution();
  }, []);

  const getResistanceColor = (rate: number): string => {
    // Color scheme for isolate distribution (not resistance rates)
    if (rate < 5) return '#6b7280'; // Gray - Low representation
    if (rate < 15) return '#16a34a'; // Green - Moderate representation
    if (rate < 25) return '#eab308'; // Yellow - High representation
    return '#dc2626'; // Red - Very high representation
  };

  const getTrendIcon = () => {
    if (ageData.trending === 'increasing') {
      return <TrendingUp className="h-4 w-4 text-blue-600" />;
    } else if (ageData.trending === 'decreasing') {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
    return <div className="h-4 w-4" />; // Stable
  };

  const getTrendColor = () => {
    return ageData.trending === 'increasing' ? 'text-blue-600' : 
           ageData.trending === 'decreasing' ? 'text-green-600' : 'text-gray-600';
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-[15px]">Age-Stratified Isolate Distribution</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Ranked by isolate frequency</p>
        </div>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="m-[0px] py-[8px] px-[24px] pt-[8px] pr-[24px] pb-[0px] pl-[24px]">
        <div className="space-y-1 mx-[0px] my-[5px] mt-[0px] mr-[0px] mb-[5px] ml-[0px]">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              <span className="ml-2 text-xs text-gray-500">Loading age data...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-4">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Data Display */}
          {!isLoading && !error && ageData.rankedCategories.length > 0 && (
            <>
              {/* Primary Metric */}
              <div className="mb-2">
                <div className="text-xs text-gray-500">
                  {ageData.totalAgeGroups} age groups • {ageData.totalRecords.toLocaleString()} total records
                </div>
              </div>

              {/* Ranked Categories */}
              <div className="space-y-1 py-[2px] px-[0px] p-[0px]">
                {/* Top 3 */}
                {ageData.rankedCategories.slice(0, 3).map((category) => (
                  <div key={category.rank} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">#{category.rank}</span>
                      <span className="text-xs text-gray-700 font-medium text-[12px]">
                        {category.group}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: getResistanceColor(category.rate) }}
                      >
                        {category.rate}%
                      </span>
                      <span className="text-xs text-gray-400">
                        ({category.count?.toLocaleString() || 0})
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Separator for bottom 3 */}
                {ageData.rankedCategories.length > 6 && (
                  <div className="border-t border-gray-100 my-1"></div>
                )}
                
                {/* Bottom 3 (or remaining if less than 6 total) */}
                {ageData.rankedCategories.length > 3 && ageData.rankedCategories.slice(-3).map((category) => (
                  <div key={category.rank} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">#{category.rank}</span>
                      <span className="text-xs text-gray-700 font-medium text-[12px]">
                        {category.group}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: getResistanceColor(category.rate) }}
                      >
                        {category.rate}%
                      </span>
                      <span className="text-xs text-gray-400">
                        ({category.count?.toLocaleString() || 0})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* No Data State */}
          {!isLoading && !error && ageData.rankedCategories.length === 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">No age distribution data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}