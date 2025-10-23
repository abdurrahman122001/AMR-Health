import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardTitle } from './ui/card';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { shouldHideESBLPair } from '../utils/esblFilterUtils';

interface HeatmapData {
  organisms: string[];
  antibiotics: string[];
  heatmapData: Record<string, Record<string, number>>;
  heatmapCounts: Record<string, Record<string, { resistant: number, total: number }>>;
  totalRecords: number;
  dataSource: string;
  tableName: string;
  timestamp: string;
  appliedFilters: Array<[string, string]>;
}

interface ResistancePair {
  pair: string;
  resistant: number;
  total: number;
  percentage: number;
}

export function AMR_Human_Overview_PairSUM() {
  const [resistancePairs, setResistancePairs] = useState<ResistancePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [organismMappings, setOrganismMappings] = useState<{ [key: string]: string }>({});

  // Organism code to name translation utility using fetched mappings
  const getOrganismName = (code: string): string => {
    if (!code) return '';
    // Use fetched mappings from vw_amr_hh_organisms, fallback to code if not found
    return organismMappings[code] || organismMappings[code.toUpperCase()] || organismMappings[code.toLowerCase()] || code;
  };

  const getResistanceColor = (percentage: number) => {
    if (percentage >= 40) return 'text-red-600';
    if (percentage >= 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getResistanceStatus = (percentage: number) => {
    if (percentage >= 40) return 'High';
    if (percentage >= 20) return 'Moderate';
    return 'Low';
  };

  const getResistanceColorHex = (percentage: number) => {
    if (percentage >= 40) return '#dc2626';
    if (percentage >= 20) return '#eab308';
    return '#16a34a';
  };

  // Fetch heatmap data and process top resistance pairs
  const fetchTopResistancePairs = async (retryCount = 0, organismMappingsParam: { [key: string]: string } = {}) => {
    setLoading(true);
    setError(null);
    setRetryAttempt(retryCount);
    
    try {
      console.log(`Fetching heatmap data for top resistance pairs... (attempt ${retryCount + 1})`);
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-heatmap`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000); // Increased to 40 seconds
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data: HeatmapData = await response.json();
        console.log('Heatmap data received for resistance pairs:', data);
        
        // Process the heatmap data to find top resistance pairs with n>30
        const allPairs: ResistancePair[] = [];
        
        data.organisms.forEach(organism => {
          data.antibiotics.forEach(antibiotic => {
            // Skip ESBL-excluded pairs (β-lactams for ESBL organisms)
            if (shouldHideESBLPair(organism, antibiotic)) {
              console.log(`ESBL Filter: Excluding pair ${organism} - ${antibiotic}`);
              return;
            }
            
            const percentage = data.heatmapData[organism]?.[antibiotic];
            const counts = data.heatmapCounts[organism]?.[antibiotic];
            
            // Only include pairs with valid percentage data and n≥30 (consistent with server endpoints)
            if (percentage !== undefined && percentage !== -1 && counts && counts.total >= 30) {
              // Use passed-in mappings or fallback to state or organism code
              const organismDisplayName = organismMappingsParam[organism] || organismMappingsParam[organism.toUpperCase()] || organismMappingsParam[organism.toLowerCase()] || organism;
              
              allPairs.push({
                pair: `${organismDisplayName} - ${antibiotic}`,
                resistant: counts.resistant,
                total: counts.total,
                percentage: percentage
              });
            }
          });
        });
        
        // Sort by percentage descending, then by total descending for ties
        allPairs.sort((a, b) => {
          if (a.percentage !== b.percentage) {
            return b.percentage - a.percentage; // Higher percentage first
          }
          return b.total - a.total; // Higher n wins for ties
        });
        
        // Take top 5 pairs
        const topPairs = allPairs.slice(0, 5);
        console.log(`Found ${topPairs.length} top resistance pairs with n>30:`, topPairs);
        
        setResistancePairs(topPairs);
      } else {
        let errorText = 'Unknown server error';
        try {
          errorText = await response.text();
          console.error('Server error response:', errorText);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(`Server error ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }
    } catch (error) {
      console.error('Error fetching top resistance pairs:', error);
      if (error.name === 'AbortError' && retryCount < 2) {
        console.log(`Request timed out, retrying... (${retryCount + 1}/2)`);
        setTimeout(() => fetchTopResistancePairs(retryCount + 1, organismMappingsParam), 2000); // Retry after 2 seconds
        return;
      } else if (error.name === 'AbortError') {
        setError('Request timed out after multiple attempts. The server may be experiencing high load.');
      } else if (retryCount < 1) {
        console.log(`Request failed, retrying... (${retryCount + 1}/1)`);
        setTimeout(() => fetchTopResistancePairs(retryCount + 1, organismMappingsParam), 1000); // Retry after 1 second
        return;
      } else {
        setError(error instanceof Error ? error.message : 'Failed to load resistance data after retries');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch organism mappings first, then fetch resistance pairs
    const loadData = async () => {
      let currentOrganismMappings: { [key: string]: string } = {};
      
      try {
        console.log('Fetching organism name mappings...');
        const organismMappingsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/organism-mappings`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (organismMappingsResponse.ok) {
          const organismData = await organismMappingsResponse.json();
          if (organismData.success && organismData.mappings) {
            currentOrganismMappings = organismData.mappings;
            setOrganismMappings(currentOrganismMappings);
            console.log(`Loaded ${organismData.totalMappings} organism name mappings from vw_amr_hh_organisms`);
            console.log('Organism mappings object:', currentOrganismMappings);
            console.log('Sample mapping - sau:', currentOrganismMappings['sau'], currentOrganismMappings['SAU']);
          } else {
            console.error('Failed to parse organism mappings:', organismData);
          }
        } else {
          console.error('Failed to fetch organism mappings:', organismMappingsResponse.statusText);
        }
      } catch (error) {
        console.error('Error fetching organism mappings:', error);
      }
      
      // Fetch resistance pairs after mappings are loaded, passing the mappings
      fetchTopResistancePairs(0, currentOrganismMappings);
    };
    
    loadData();
  }, []);

  return (
    <div className="space-y-3">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-600">
            Loading resistance data...
            {retryAttempt > 0 && ` (Retry ${retryAttempt})`}
          </span>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-8 bg-red-50 border border-red-200 rounded-lg space-y-3">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="ml-2 text-sm text-red-700">Error: {error}</span>
          </div>
          <button 
            onClick={() => fetchTopResistancePairs(0)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && resistancePairs.length === 0 && (
        <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
          No resistance pairs with n≥30 total tested found
        </div>
      )}

      {!loading && !error && resistancePairs.length > 0 && resistancePairs.map((item, index) => (
        <div key={index} className="flex items-center justify-between bg-muted/30 rounded-lg px-[12px] mt-[0px] mr-[0px] mb-[10px] ml-[0px] py-[5px]">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: getResistanceColorHex(item.percentage) }}
            />
            <div>
              <span className="text-sm font-medium">
                {(() => {
                  const parts = item.pair.split(' - ');
                  if (parts.length === 2) {
                    return (
                      <>
                        <span className="italic text-[12px]">{parts[0]}</span>
                        <span className="text-[13px]"> - {parts[1]}</span>
                      </>
                    );
                  }
                  return item.pair;
                })()}
              </span>
              <p className="text-xs text-gray-500 text-[11px]">
                {item.resistant.toLocaleString()} / {item.total.toLocaleString()} isolates
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{item.percentage}%</div>
            <p className={`text-xs ${getResistanceColor(item.percentage)}`}>
              {getResistanceStatus(item.percentage)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}