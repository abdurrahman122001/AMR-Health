import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AMR_Human_Overview_IsolateSUM } from './AMR_Human_Overview_IsolateSUM';
import { AMR_Human_Overview_PairSUM } from './AMR_Human_Overview_PairSUM';
import { AMR_Human_Overview_MonitorSUM } from './AMR_Human_Overview_MonitorSUM';
import { AMR_Human_Overview_MonitorSUM_NoLimit } from './AMR_Human_Overview_MonitorSUM_NoLimit';
import { makeServerRequest } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { shouldHideESBLPair } from '../utils/esblFilterUtils';

interface OrganismData {
  organism: string;
  count: number;
}

interface ResistancePair {
  pair: string;
  resistant: number;
  total: number;
  percentage: number;
}

interface SentinelPhenotype {
  pattern: string;
  resistant: number;
  total: number;
  percentage: number;
}

interface AntibioticMapping {
  column_name: string;
  simple_name: string;
}

export function AMR_Human_Overview_Combined() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [topOrganisms, setTopOrganisms] = useState<OrganismData[]>([]);
  const [totalIsolates, setTotalIsolates] = useState<number>(0);
  const [resistancePairs, setResistancePairs] = useState<ResistancePair[]>([]);
  const [sentinelPhenotypes, setSentinelPhenotypes] = useState<SentinelPhenotype[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [antibioticMappings, setAntibioticMappings] = useState<{ [key: string]: string }>({});
  const [organismMappings, setOrganismMappings] = useState<{ [key: string]: string }>({});

  // Helper function to get organism name from code using fetched mappings
  const getOrganismName = (code: string): string => {
    if (!code) return '';
    // Use fetched mappings from vw_amr_hh_organisms, fallback to code if not found
    return organismMappings[code] || organismMappings[code.toUpperCase()] || organismMappings[code.toLowerCase()] || code;
  };

  // Helper function to get antibiotic simple name from column name
  const getAntibioticName = (columnName: string): string => {
    return antibioticMappings[columnName] || columnName;
  };

  // Fetch all data from AMR_HH table (same endpoints as expanded view)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        // 0. First fetch antibiotic column mappings
        console.log('Fetching antibiotic column mappings...');
        const mappingsController = new AbortController();
        const mappingsTimeoutId = setTimeout(() => {
          console.warn('Antibiotic mappings request timeout after 30 seconds');
          mappingsController.abort();
        }, 30000);

        const mappingsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/antibiotic-mappings`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            signal: mappingsController.signal
          }
        );
        
        clearTimeout(mappingsTimeoutId);

        let currentMappings: { [key: string]: string } = {};
        if (mappingsResponse.ok) {
          const mappingsData = await mappingsResponse.json();
          console.log('Antibiotic mappings response:', mappingsData);
          
          if (mappingsData.success && mappingsData.mappings) {
            // Convert array to object for faster lookups
            mappingsData.mappings.forEach((mapping: AntibioticMapping) => {
              currentMappings[mapping.column_name] = mapping.simple_name;
            });
            
            setAntibioticMappings(currentMappings);
            console.log('Antibiotic mappings loaded for this session:', currentMappings);
          } else {
            console.error('Failed to get antibiotic mappings:', mappingsData.message);
          }
        } else {
          console.error('Failed to fetch antibiotic mappings:', mappingsResponse.statusText);
        }
        
        // 0b. Fetch organism name mappings from vw_amr_hh_organisms
        console.log('Fetching organism name mappings...');
        let currentOrganismMappings: { [key: string]: string } = {};
        try {
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
              console.log('Sample mapping - eco:', currentOrganismMappings['eco'], currentOrganismMappings['ECO'], currentOrganismMappings['E. coli']);
            } else {
              console.error('Failed to parse organism mappings:', organismData);
            }
          } else {
            console.error('Failed to fetch organism mappings:', organismMappingsResponse.statusText);
          }
        } catch (error) {
          console.error('Error fetching organism mappings:', error);
        }
        
        // 1. Fetch top organisms by frequency
        const organismsResponse = await makeServerRequest('/amr-hh-top-organisms');
        if (organismsResponse.success && organismsResponse.topOrganisms) {
          setTopOrganisms(organismsResponse.topOrganisms);
          console.log('Top organisms from AMR_HH:', organismsResponse.topOrganisms);
        } else {
          console.error('Failed to fetch top organisms:', organismsResponse.error || 'Invalid response format');
          setTopOrganisms([]);
        }

        // 2. Fetch total isolates count from same endpoint as SummaryCards for consistency
        const isolatesResponse = await makeServerRequest('/amr-hh-isolates-total');
        if (isolatesResponse.success && typeof isolatesResponse.total === 'number') {
          setTotalIsolates(isolatesResponse.total);
          console.log('Total isolates from AMR_HH (consistent with SummaryCards):', isolatesResponse.total);
        } else {
          console.error('Failed to fetch total isolates:', isolatesResponse.error || 'Invalid response format');
          setTotalIsolates(0);
        }

        // 3. Fetch resistance pairs from heatmap endpoint (same as PairSUM component)
        try {
          const url = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-heatmap`;
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const heatmapData = await response.json();
            console.log('Heatmap data received for resistance pairs:', heatmapData);
            
            // Process the heatmap data to find top resistance pairs with n≥30
            const allPairs: ResistancePair[] = [];
            
            heatmapData.organisms?.forEach((organism: string) => {
              heatmapData.antibiotics?.forEach((antibiotic: string) => {
                // Skip ESBL-excluded pairs (β-lactams for ESBL organisms)
                if (shouldHideESBLPair(organism, antibiotic)) {
                  console.log(`ESBL Filter (Combined): Excluding pair ${organism} - ${antibiotic}`);
                  return;
                }
                
                const percentage = heatmapData.heatmapData[organism]?.[antibiotic];
                const counts = heatmapData.heatmapCounts[organism]?.[antibiotic];
                
                // Only include pairs with valid percentage data and n≥30
                if (percentage !== undefined && percentage !== -1 && counts && counts.total >= 30) {
                  // Use the mappings fetched in this session
                  const antibioticDisplayName = currentMappings[antibiotic] || antibiotic;
                  const organismDisplayName = currentOrganismMappings[organism] || currentOrganismMappings[organism.toUpperCase()] || currentOrganismMappings[organism.toLowerCase()] || organism;
                  console.log(`Mapping ${organism} -> ${organismDisplayName}, ${antibiotic} -> ${antibioticDisplayName}`);
                  
                  allPairs.push({
                    pair: `${organismDisplayName} - ${antibioticDisplayName}`,
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
            
            // Take top 5 pairs for collapsed view
            const topPairs = allPairs.slice(0, 5);
            console.log(`Found ${topPairs.length} top resistance pairs with n≥30:`, topPairs);
            setResistancePairs(topPairs);
          } else {
            console.error('Failed to fetch heatmap data:', response.statusText);
            setResistancePairs([]);
          }
        } catch (error) {
          console.error('Error fetching resistance pairs:', error);
          setResistancePairs([]);
        }

        // 4. Fetch sentinel phenotypes (same as MonitorSUM_NoLimit component)
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-resistance-patterns-no-limit`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log('Sentinel phenotypes response (no limit):', data);
            
            if (data.success && data.patterns) {
              let allPatterns = [...data.patterns];
              
              // 5. Fetch K. pneumoniae 3rd-gen cephalosporin resistance
              try {
                const kpnResponse = await fetch(
                  `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-kpneumoniae-3gc-resistance`,
                  {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${publicAnonKey}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                if (kpnResponse.ok) {
                  const kpnData = await kpnResponse.json();
                  console.log('K. pneumoniae 3GCS resistance response:', kpnData);
                  
                  if (typeof kpnData.resistanceRate === 'number') {
                    // Add K. pneumoniae 3GCS to the patterns array
                    allPatterns.push({
                      pattern: 'K. pneumoniae vs 3GCS',
                      resistant: kpnData.resistantCount || 0,
                      total: kpnData.totalTested || 0,
                      percentage: kpnData.resistanceRate
                    });
                    console.log('Added K. pneumoniae 3GCS data to sentinel phenotypes:', {
                      resistant: kpnData.resistantCount,
                      total: kpnData.totalTested,
                      percentage: kpnData.resistanceRate
                    });
                  } else {
                    console.warn('K. pneumoniae 3GCS data not available or invalid format:', kpnData);
                  }
                } else {
                  console.warn('Failed to fetch K. pneumoniae 3GCS resistance:', kpnResponse.statusText);
                }
              } catch (kpnError) {
                console.warn('Error fetching K. pneumoniae 3GCS resistance:', kpnError);
              }
              
              // Sort all patterns by percentage (descending) and take top 5
              allPatterns.sort((a, b) => b.percentage - a.percentage);
              const topPatterns = allPatterns.slice(0, 5);
              console.log('Setting sentinel phenotypes (collapsed view) with K. pneumoniae 3GCS:', topPatterns);
              setSentinelPhenotypes(topPatterns);
            } else {
              console.error('Failed to get sentinel phenotypes:', data.message);
              setSentinelPhenotypes([]);
            }
          } else {
            console.error('Failed to fetch sentinel phenotypes:', response.statusText);
            setSentinelPhenotypes([]);
          }
        } catch (error) {
          console.error('Error fetching sentinel phenotypes:', error);
          setSentinelPhenotypes([]);
        }

      } catch (error) {
        console.error('Error fetching AMR_HH data:', error);
        setTopOrganisms([]);
        setTotalIsolates(0);
        setResistancePairs([]);
        setSentinelPhenotypes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 text-[16px]">AMR Surveillance Overview</h2>
          <p className="text-sm text-muted-foreground text-[13px]">Key pathogen prevalence, resistance signals, and surveillance priorities</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      
      {!isExpanded ? (
        /* Compact Summary View */
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Pathogens Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-blue-900">Top 5 Pathogens</h3>
              <span className="text-xs text-blue-600">
                {isLoading ? 'Loading...' : `${totalIsolates.toLocaleString()} total isolates`}
              </span>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                // Loading state
                <>
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-blue-700">Loading...</span>
                      <span className="text-xs font-medium text-blue-800">--%</span>
                    </div>
                  ))}
                </>
              ) : topOrganisms.length > 0 ? (
                // Data loaded successfully
                <>
                  {topOrganisms.slice(0, 5).map((item, index) => {
                    return (
                      <div key={item.organismCode || item.organism} className="flex justify-between items-center">
                        <span className="text-xs text-blue-700">{item.organism}</span>
                        <span className="text-xs font-medium text-blue-800">{item.count.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </>
              ) : (
                // No data state
                <div className="text-xs text-blue-600">No pathogen data available</div>
              )}
            </div>
          </div>

          {/* Resistance Signals Summary */}
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-red-900">Top Resistance Signals</h3>
              <span className="text-xs text-red-600">n≥30 tested</span>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                // Loading state
                <>
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-red-700">Loading...</span>
                      <span className="text-xs font-medium text-red-800">--%</span>
                    </div>
                  ))}
                </>
              ) : resistancePairs.length > 0 ? (
                // Data loaded successfully
                <>
                  {resistancePairs.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-red-700">{item.pair}</span>
                      <span className="text-xs font-medium text-red-800">{item.percentage}%</span>
                    </div>
                  ))}
                </>
              ) : (
                // No data state
                <div className="text-xs text-red-600">No resistance signals with n≥30</div>
              )}
            </div>
          </div>

          {/* Sentinel Phenotypes Summary */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-yellow-900">Sentinel Phenotypes</h3>
              <span className="text-xs text-yellow-600">WHO priority</span>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                // Loading state
                <>
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-yellow-700">Loading...</span>
                      <span className="text-xs font-medium text-yellow-800">--%</span>
                    </div>
                  ))}
                </>
              ) : sentinelPhenotypes.length > 0 ? (
                // Data loaded successfully
                <>
                  {sentinelPhenotypes.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-yellow-700">{item.pattern}</span>
                      <span className="text-xs font-medium text-yellow-800">{item.percentage}%</span>
                    </div>
                  ))}
                </>
              ) : (
                // No data state
                <div className="text-xs text-yellow-600">No sentinel phenotypes available</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Expanded Detailed View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top 5 Pathogens Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-medium text-gray-900">Top 5 Pathogens</h3>
              <p className="text-xs text-muted-foreground">Share of all bacterial isolates</p>
            </div>
            <AMR_Human_Overview_IsolateSUM />
          </div>

          {/* Top Resistance Signals Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-medium text-gray-900">Top Resistance Signals</h3>
              <p className="text-xs text-muted-foreground">Highest % resistance pairs with n≥30 total tested</p>
            </div>
            <AMR_Human_Overview_PairSUM />
          </div>

          {/* Key Sentinel Phenotypes Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-medium text-gray-900">Key Sentinel Phenotypes</h3>
              <p className="text-xs text-muted-foreground">All surveillance priorities (no sample size limit)</p>
            </div>
            <AMR_Human_Overview_MonitorSUM_NoLimit />
          </div>
        </div>
      )}
    </div>
  );
}