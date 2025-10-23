import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AMR_Animal_Overview_IsolateSUM } from './AMR_Animal_Overview_IsolateSUM';
import { AMR_Animal_Overview_PairSUM } from './AMR_Animal_Overview_PairSUM';
import { AMR_Animal_Overview_MonitorSUM_NoLimit } from './AMR_Animal_Overview_MonitorSUM_NoLimit';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AnimalPathogen {
  organism: string;
  count: number;
  percentage: number;
}

interface AnimalResistancePair {
  pair: string;
  resistant: number;
  total: number;
  percentage: number;
}

interface AnimalSentinelPhenotype {
  pattern: string;
  resistant: number;
  total: number;
  percentage: number;
}

export function AMR_Animal_Overview_Combined() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalIsolates, setTotalIsolates] = useState(0);
  
  // Animal-specific data
  const [topOrganisms, setTopOrganisms] = useState<AnimalPathogen[]>([]);
  const [resistancePairs, setResistancePairs] = useState<AnimalResistancePair[]>([]);
  const [sentinelPhenotypes, setSentinelPhenotypes] = useState<AnimalSentinelPhenotype[]>([]);

  // Fallback dummy data for resistance pairs and sentinel phenotypes (to be replaced with real data later)
  const fallbackData = {
    totalIsolates: 8247,
    topOrganisms: [
      { organism: 'E. coli', count: 2847, percentage: 34.5 },
      { organism: 'Salmonella spp.', count: 1923, percentage: 23.3 },
      { organism: 'S. aureus', count: 1456, percentage: 17.7 },
      { organism: 'Campylobacter spp.', count: 892, percentage: 10.8 },
      { organism: 'Pasteurella spp.', count: 634, percentage: 7.7 }
    ],
    resistancePairs: [
      { pair: 'E. coli - Tetracycline', resistant: 892, total: 1456, percentage: 61.3 },
      { pair: 'Salmonella spp. - Ampicillin', resistant: 634, total: 1123, percentage: 56.5 },
      { pair: 'S. aureus - Penicillin', resistant: 723, total: 1289, percentage: 56.1 },
      { pair: 'E. coli - Sulfamethoxazole', resistant: 567, total: 1034, percentage: 54.8 },
      { pair: 'Campylobacter spp. - Erythromycin', resistant: 234, total: 456, percentage: 51.3 }
    ],
    sentinelPhenotypes: [
      { pattern: 'E. coli ESBL-producing', resistant: 234, total: 892, percentage: 26.2 },
      { pattern: 'MRSA (livestock-associated)', resistant: 89, total: 456, percentage: 19.5 },
      { pattern: 'Salmonella MDR', resistant: 178, total: 923, percentage: 19.3 },
      { pattern: 'Campylobacter fluoroquinolone-R', resistant: 67, total: 378, percentage: 17.7 },
      { pattern: 'Enterococcus vancomycin-R', resistant: 23, total: 145, percentage: 15.9 }
    ]
  };

  // Animal organism name mapping - Updated for ORGANISM values
  const getAnimalOrganismName = (organism) => {
    const animalOrganismMap = {
      'E. coli': 'E. coli',
      'K. Pneumoniae': 'K. pneumoniae', 
      'Enterococus': 'Enterococcus',
      'S. aureus': 'S. aureus',
      'S. agalacticae': 'S. agalactiae',
      'P. Aeruginosa': 'P. aeruginosa',
      'A. Baumanni': 'A. baumannii',
      'Campylobacter': 'Campylobacter spp.',
      'Salmonella sp': 'Salmonella spp.',
      'Aeromonas': 'Aeromonas spp.',
      'Edwardsiella': 'Edwardsiella spp.',
      // Legacy fallbacks
      'ec': 'E. coli',
      'sa': 'S. aureus',
      'se': 'S. epidermidis',
      'pa': 'P. aeruginosa',
      'kp': 'K. pneumoniae',
      'ef': 'Enterococcus spp.',
      'st': 'Streptococcus spp.',
      'cp': 'C. perfringens',
      'pi': 'P. indologenes',
      'ab': 'A. baumannii'
    };
    return animalOrganismMap[organism] || organism;
  };

  // Antibiotic name mapping
  const getAntibioticName = (code) => {
    const antibioticMap = {
      'AMP': 'Ampicillin',
      'AZM': 'Azithromycin',
      'CHL': 'Chloramphenicol',
      'CIP': 'Ciprofloxacin',
      'CTX': 'Cefotaxime',
      'CRO': 'Ceftriaxone',
      'CAZ': 'Ceftazidime',
      'GEN': 'Gentamicin',
      'MEM': 'Meropenem',
      'TCY': 'Tetracycline',
      'SXT': 'Trimethoprim-sulfamethoxazole'
    };
    return antibioticMap[code] || code;
  };

  useEffect(() => {
    // Load real animal data from both pathogen and heatmap endpoints
    const loadAnimalData = async () => {
      setIsLoading(true);
      
      try {
        console.log('Loading AMR_Animal overview data...');
        
        // Fetch top pathogens data
        const pathogenUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-top-pathogens`;
        const pathogenController = new AbortController();
        const pathogenTimeoutId = setTimeout(() => {
          pathogenController.abort();
        }, 10000);
        
        const pathogenResponse = await fetch(pathogenUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: pathogenController.signal
        });
        
        clearTimeout(pathogenTimeoutId);
        
        // Fetch heatmap data for resistance pairs
        const heatmapUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-heatmap`;
        const heatmapController = new AbortController();
        const heatmapTimeoutId = setTimeout(() => {
          heatmapController.abort();
        }, 10000);
        
        const heatmapResponse = await fetch(heatmapUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: heatmapController.signal
        });
        
        clearTimeout(heatmapTimeoutId);
        
        // Process pathogen data
        if (pathogenResponse.ok) {
          const pathogenData = await pathogenResponse.json();
          console.log('Received AMR_Animal top pathogens data:', pathogenData);
          
          if (pathogenData.success) {
            // Filter out records where ORGANISM === 'xxx' from both total count and organisms list
            const filteredPathogens = pathogenData.topPathogens.filter(pathogen => pathogen.organism !== 'xxx');
            
            // Calculate adjusted total isolates excluding 'xxx' records
            const excludedCount = pathogenData.topPathogens.find(pathogen => pathogen.organism === 'xxx')?.count || 0;
            const adjustedTotalIsolates = pathogenData.totalIsolates - excludedCount;
            
            setTotalIsolates(adjustedTotalIsolates);
            setTopOrganisms(filteredPathogens);
            console.log(`Loaded ${adjustedTotalIsolates} animal isolates (excluding ${excludedCount} 'xxx' records) with ${filteredPathogens.length} top pathogens`);
          }
        } else {
          console.warn('Failed to fetch pathogen data, using fallback');
          // Also filter fallback data to exclude 'xxx' records
          const filteredFallbackPathogens = fallbackData.topOrganisms.filter(pathogen => pathogen.organism !== 'xxx');
          const excludedFallbackCount = fallbackData.topOrganisms.find(pathogen => pathogen.organism === 'xxx')?.count || 0;
          const adjustedFallbackTotal = fallbackData.totalIsolates - excludedFallbackCount;
          
          setTotalIsolates(adjustedFallbackTotal);
          setTopOrganisms(filteredFallbackPathogens);
        }
        
        // Fetch resistance pairs using new STRAINNOTE-based endpoint
        try {
          console.log('Fetching animal resistance signals from STRAINNOTE-antibiotic combinations...');
          const resistanceSignalsController = new AbortController();
          const resistanceSignalsTimeoutId = setTimeout(() => {
            resistanceSignalsController.abort();
          }, 10000);
          
          const resistanceSignalsUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-resistance-signals`;
          const resistanceSignalsResponse = await fetch(resistanceSignalsUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            signal: resistanceSignalsController.signal
          });
          
          clearTimeout(resistanceSignalsTimeoutId);
          
          if (resistanceSignalsResponse.ok) {
            const resistanceData = await resistanceSignalsResponse.json();
            console.log('Animal resistance signals data received:', resistanceData);
            
            if (resistanceData.success && resistanceData.resistanceSignals) {
              // Map the resistance signals to the expected format
              const mappedPairs: AnimalResistancePair[] = resistanceData.resistanceSignals.map((signal: any) => ({
                pair: signal.pair,
                resistant: signal.resistant,
                total: signal.total,
                percentage: signal.percentage
              }));
              
              setResistancePairs(mappedPairs);
              console.log(`Found ${mappedPairs.length} top animal resistance signals from STRAINNOTE data:`, mappedPairs);
            } else {
              console.warn('Invalid resistance signals response, using fallback for resistance pairs');
              setResistancePairs(fallbackData.resistancePairs);
            }
          } else {
            console.warn('Failed to fetch resistance signals, using fallback for resistance pairs');
            setResistancePairs(fallbackData.resistancePairs);
          }
        } catch (resistanceError) {
          if (resistanceError.name === 'AbortError') {
            console.warn('Resistance signals request timeout, using fallback');
          } else {
            console.error('Error fetching resistance signals:', resistanceError);
          }
          setResistancePairs(fallbackData.resistancePairs);
        }
        
        // Fetch sentinel phenotypes using AMR_Animal priority resistance endpoint
        try {
          console.log('Fetching animal sentinel phenotypes from priority resistance endpoint...');
          const sentinelController = new AbortController();
          const sentinelTimeoutId = setTimeout(() => {
            sentinelController.abort();
          }, 10000);
          
          const sentinelUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-priority-resistance`;
          const sentinelResponse = await fetch(sentinelUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            signal: sentinelController.signal
          });
          
          clearTimeout(sentinelTimeoutId);
          
          if (sentinelResponse.ok) {
            const sentinelData = await sentinelResponse.json();
            console.log('Animal sentinel phenotype data received:', sentinelData);
            
            if (sentinelData.success && sentinelData.calculations) {
              // Extract the top 5 highest resistance phenotypes from the calculations
              const resistanceCalculations = Object.entries(sentinelData.calculations)
                .map(([formulaKey, calculation]: [string, any]) => {
                  if (calculation?.resistanceRate && calculation?.totalTested >= 30) {
                    // Parse the formula key to create a display name
                    const displayName = formulaKey
                      .replace('ANIMAL_', '')
                      .replace(/_/g, ' ')
                      .replace(/3G CEPHALOSPORINS/g, '3rd-gen Cephalosporins')
                      .replace(/ENTEROCOCCI/g, 'Enterococci')
                      .replace(/AGALACTIAE/g, 'agalactiae')
                      .replace(/AUREUS/g, 'aureus')
                      .replace(/PNEUMONIAE/g, 'pneumoniae')
                      .replace(/AERUGINOSA/g, 'aeruginosa')
                      .replace(/BAUMANNII/g, 'baumannii')
                      .replace(/CAMPYLOBACTER/g, 'Campylobacter')
                      .replace(/SALMONELLA/g, 'Salmonella')
                      .replace(/AEROMONAS/g, 'Aeromonas')
                      .replace(/FLUOROQUINOLONES/g, 'FQ')
                      .replace(/CARBAPENEMS/g, 'Carbapenems')
                      .replace(/METHICILLIN/g, 'Methicillin')
                      .replace(/VANCOMYCIN/g, 'Vancomycin')
                      .replace(/AMPICILLIN/g, 'Ampicillin')
                      .replace(/AMINOGLYCOSIDES/g, 'Aminoglycosides');
                    
                    return {
                      pattern: displayName,
                      resistant: calculation.resistantCount,
                      total: calculation.totalTested,
                      percentage: parseFloat(calculation.resistanceRate.toFixed(1))
                    };
                  }
                  return null;
                })
                .filter(item => item !== null)
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 5);
              
              setSentinelPhenotypes(resistanceCalculations as AnimalSentinelPhenotype[]);
              console.log(`Found ${resistanceCalculations.length} top animal sentinel phenotypes:`, resistanceCalculations);
            } else {
              console.warn('Invalid sentinel phenotype response, using fallback');
              setSentinelPhenotypes(fallbackData.sentinelPhenotypes);
            }
          } else {
            console.warn('Failed to fetch sentinel phenotypes, using fallback');
            setSentinelPhenotypes(fallbackData.sentinelPhenotypes);
          }
        } catch (sentinelError) {
          if (sentinelError.name === 'AbortError') {
            console.warn('Sentinel phenotypes request timeout, using fallback');
          } else {
            console.error('Error fetching sentinel phenotypes:', sentinelError);
          }
          setSentinelPhenotypes(fallbackData.sentinelPhenotypes);
        }
        
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Animal data request was cancelled');
          return;
        }
        
        console.error('Error loading animal data:', error);
        
        // Fallback to dummy data on error
        console.warn('Using fallback dummy data due to error');
        
        // Filter fallback data to exclude 'xxx' records
        const filteredFallbackPathogens = fallbackData.topOrganisms.filter(pathogen => pathogen.organism !== 'xxx');
        const excludedFallbackCount = fallbackData.topOrganisms.find(pathogen => pathogen.organism === 'xxx')?.count || 0;
        const adjustedFallbackTotal = fallbackData.totalIsolates - excludedFallbackCount;
        
        setTotalIsolates(adjustedFallbackTotal);
        setTopOrganisms(filteredFallbackPathogens);
        setResistancePairs(fallbackData.resistancePairs);
        setSentinelPhenotypes(fallbackData.sentinelPhenotypes);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnimalData();
  }, []);

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 text-[16px]">Animal Health AMR Surveillance Overview</h2>
          <p className="text-sm text-muted-foreground text-[13px]">Key animal pathogen prevalence, resistance signals, and veterinary surveillance priorities</p>
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
          {/* Top Animal Pathogens Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-blue-900">Top 5 Animal Pathogens</h3>
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
                      <div key={item.organism} className="flex justify-between items-center">
                        <span className="text-xs text-blue-700 not-italic">{item.organism}</span>
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

          {/* Animal Resistance Signals Summary */}
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

          {/* Animal Sentinel Phenotypes Summary */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-yellow-900">Veterinary Sentinel Phenotypes</h3>
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
          {/* Top 5 Animal Pathogens Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-medium text-gray-900">Top 5 Animal Pathogens</h3>
              <p className="text-xs text-muted-foreground">Share of all animal bacterial isolates</p>
            </div>
            <AMR_Animal_Overview_IsolateSUM />
          </div>

          {/* Top Animal Resistance Signals Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-medium text-gray-900">Top Resistance Signals</h3>
              <p className="text-xs text-muted-foreground">Highest % resistance pairs with n≥30 total tested</p>
            </div>
            <AMR_Animal_Overview_PairSUM />
          </div>

          {/* Key Animal Sentinel Phenotypes Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-medium text-gray-900">Key Veterinary Sentinel Phenotypes</h3>
              <p className="text-xs text-muted-foreground">All animal surveillance priorities (no sample size limit)</p>
            </div>
            <AMR_Animal_Overview_MonitorSUM_NoLimit />
          </div>
        </div>
      )}
    </div>
  );
}