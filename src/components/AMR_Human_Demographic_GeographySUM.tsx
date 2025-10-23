import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react';

export function AMR_Human_Demographic_GeographySUM() {
  // Mock data for geographic resistance patterns
  const geoData = {
    rankedRegions: [
      { rank: 1, name: 'Greater Accra', rate: 45.8 },
      { rank: 2, name: 'Ashanti', rate: 42.3 },
      { rank: 3, name: 'Western', rate: 38.7 },
      { rank: 4, name: 'Central', rate: 35.2 },
      { rank: 5, name: 'Eastern', rate: 32.9 },
      { rank: 6, name: 'Volta', rate: 29.4 },
      { rank: 7, name: 'Brong Ahafo', rate: 27.1 },
      { rank: 8, name: 'Northern', rate: 25.6 },
      { rank: 9, name: 'Upper West', rate: 23.8 },
      { rank: 10, name: 'Upper East', rate: 22.4 }
    ]
  };

  const getResistanceColor = (rate: number): string => {
    if (rate < 20) return '#16a34a'; // Green
    if (rate < 40) return '#eab308'; // Yellow
    return '#dc2626'; // Red
  };

  const getTrendIcon = () => {
    if (geoData.trending === 'increasing') {
      return <TrendingUp className="h-4 w-4 text-orange-600" />;
    } else if (geoData.trending === 'decreasing') {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
    return <div className="h-4 w-4" />; // Stable
  };

  const getTrendColor = () => {
    return geoData.trending === 'increasing' ? 'text-orange-600' : 
           geoData.trending === 'decreasing' ? 'text-green-600' : 'text-gray-600';
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-[15px]">Geographic Distribution</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Resistance by geographic region</p>
        </div>
        <MapPin className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="mt-[5px] mr-[0px] mb-[0px] ml-[0px] py-[8px] py-[0px] px-[24px]">
        <div className="space-y-1 mx-[0px] my-[5px] mt-[0px] mr-[0px] mb-[5px] ml-[0px]">
          {/* Primary Metric */}
          <div>

          </div>

          {/* Ranked Regions */}
          <div className="space-y-1 py-[2px] px-[0px] p-[0px]">
            {/* Top 3 */}
            {geoData.rankedRegions.slice(0, 3).map((region) => (
              <div key={region.rank} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{region.rank}</span>
                  <span className="text-xs text-gray-700 font-medium">{region.name}</span>
                </div>
                <span 
                  className="text-sm font-semibold"
                  style={{ color: getResistanceColor(region.rate) }}
                >
                  {region.rate}%
                </span>
              </div>
            ))}
            
            {/* Separator for bottom 3 */}
            <div className="border-t border-gray-100 my-1"></div>
            
            {/* Bottom 3 */}
            {geoData.rankedRegions.slice(-3).map((region) => (
              <div key={region.rank} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{region.rank}</span>
                  <span className="text-xs text-gray-700 font-medium">{region.name}</span>
                </div>
                <span 
                  className="text-sm font-semibold"
                  style={{ color: getResistanceColor(region.rate) }}
                >
                  {region.rate}%
                </span>
              </div>
            ))}
          </div>


        </div>
      </CardContent>
    </Card>
  );
}