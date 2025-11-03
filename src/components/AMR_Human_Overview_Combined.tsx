import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AMR_Human_Overview_IsolateSUM } from './AMR_Human_Overview_IsolateSUM';
import { AMR_Human_Overview_PairSUM } from './AMR_Human_Overview_PairSUM';
import { AMR_Human_Overview_MonitorSUM } from './AMR_Human_Overview_MonitorSUM';
import { AMR_Human_Overview_MonitorSUM_NoLimit } from './AMR_Human_Overview_MonitorSUM_NoLimit';
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

interface ApiResponse {
  success: boolean;
  data: {
    nodeId: string;
    nodeName: string;
    totalRows: number;
    columns: string[];
    rows: any[];
  };
}

// Antibiotic mappings for display names
const ANTIBIOTIC_MAPPINGS: { [key: string]: string } = {
  'AMP ND10': 'Ampicillin',
  'AMC ND20': 'Amoxicillin-clavulanate',
  'CTX ND30': 'Cefotaxime',
  'CAZ ND30': 'Ceftazidime',
  'CRO ND30': 'Ceftriaxone',
  'IPM ND10': 'Imipenem',
  'MEM ND10': 'Meropenem',
  'CIP ND5': 'Ciprofloxacin',
  'GEN ND10': 'Gentamicin',
  'AMK ND30': 'Amikacin',
  'TCY ND30': 'Tetracycline',
  'SXT ND1 2': 'Trimethoprim-sulfamethoxazole',
  'OXA ND1': 'Oxacillin',
  'VAN ND30': 'Vancomycin',
  'ERY ND15': 'Erythromycin',
  'CHL ND30': 'Chloramphenicol',
  'NIT ND300': 'Nitrofurantoin',
  'TOB ND10': 'Tobramycin',
  'CLI ND2': 'Clindamycin',
  'FOX ND30': 'Cefoxitin',
  'OFX ND5': 'Ofloxacin',
  'TCC ND75': 'Ticarcillin-clavulanate',
  'CXM ND30': 'Cefuroxime',
  'NOR ND10': 'Norfloxacin',
  'ATM ND30': 'Aztreonam',
  'RIF ND5': 'Rifampin',
  'DOX ND30': 'Doxycycline',
  'MNO ND30': 'Minocycline',
  'TEC ND30': 'Teicoplanin',
  'FEP ND30': 'Cefepime',
  'CTC ND30': 'Chlortetracycline',
  'CCV ND30': 'Cefaclor',
  'TIO ND30': 'Ceftiofur',
  'NAL ND30': 'Nalidixic acid',
  'TZP ND100': 'Piperacillin-tazobactam',
  'GEH ND120': 'Geopen'
};

// Organism mappings for display names
const ORGANISM_MAPPINGS: { [key: string]: string } = {
  'eco': 'E. coli',
  'kpn': 'K. pneumoniae',
  'pae': 'P. aeruginosa',
  'aba': 'A. baumannii',
  'sau': 'S. aureus',
  'efm': 'E. faecium',
  'efa': 'E. faecalis',
  'spn': 'S. pneumoniae',
  'sep': 'S. epidermidis',
  'sag': 'S. agalactiae',
  'sma': 'S. marcescens',
  'ecl': 'E. cloacae',
  'efa': 'E. faecalis',
  'efm': 'E. faecium'
};

export function AMR_Human_Overview_Combined() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [topOrganisms, setTopOrganisms] = useState<OrganismData[]>([]);
  const [totalIsolates, setTotalIsolates] = useState<number>(0);
  const [resistancePairs, setResistancePairs] = useState<ResistancePair[]>([]);
  const [sentinelPhenotypes, setSentinelPhenotypes] = useState<SentinelPhenotype[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get organism name from code
  const getOrganismName = (code: string): string => {
    if (!code) return '';
    return ORGANISM_MAPPINGS[code.toLowerCase()] || code.toUpperCase();
  };

  // Helper function to get antibiotic simple name from column name
  const getAntibioticName = (columnName: string): string => {
    return ANTIBIOTIC_MAPPINGS[columnName] || columnName;
  };

  // Helper function to extract top organisms from raw data
  const extractTopOrganisms = (rows: any[]): OrganismData[] => {
    const organismCounts: { [key: string]: number } = {};
    
    rows.forEach(row => {
      const organism = row.ORGANISM;
      if (organism && organism.trim() && organism.toLowerCase() !== 'xxx') {
        const organismKey = organism.toLowerCase();
        organismCounts[organismKey] = (organismCounts[organismKey] || 0) + 1;
      }
    });
    
    return Object.entries(organismCounts)
      .map(([organism, count]) => ({ 
        organism: getOrganismName(organism),
        count 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Helper function to calculate resistance rates
  const calculateResistancePairs = (rows: any[]): ResistancePair[] => {
    const resistanceData: { [key: string]: { resistant: number; total: number } } = {};
    
    // Define antibiotic columns to check
    const antibioticColumns = ['AMP ND10', 'AMC ND20', 'CTX ND30', 'CAZ ND30', 'CRO ND30', 'IPM ND10', 'MEM ND10', 'CIP ND5', 'GEN ND10', 'AMK ND30'];
    
    rows.forEach(row => {
      const organism = row.ORGANISM;
      if (!organism || organism.toLowerCase() === 'xxx') return;
      
      antibioticColumns.forEach(antibiotic => {
        const organismCode = organism.toLowerCase();
        const key = `${organismCode}-${antibiotic}`;
        
        // Skip ESBL-excluded pairs
        if (shouldHideESBLPair(organismCode, antibiotic)) {
          return;
        }
        
        const zoneSize = row[antibiotic];
        
        if (zoneSize !== undefined && zoneSize !== null && zoneSize !== '') {
          // Initialize if not exists
          if (!resistanceData[key]) {
            resistanceData[key] = { resistant: 0, total: 0 };
          }
          
          resistanceData[key].total += 1;
          
          // Simple resistance determination based on zone size
          const zoneNum = parseFloat(zoneSize);
          if (!isNaN(zoneNum)) {
            // Zone size <= 15 considered resistant (adjust as needed)
            if (zoneNum <= 15) {
              resistanceData[key].resistant += 1;
            }
          }
        }
      });
    });
    
    // Convert to ResistancePair array and calculate percentages
    const allPairs: ResistancePair[] = Object.entries(resistanceData)
      .map(([key, data]) => {
        const [organismCode, antibiotic] = key.split('-');
        
        const percentage = data.total > 0 ? Math.round((data.resistant / data.total) * 100) : 0;
        
        return {
          pair: `${getOrganismName(organismCode)} - ${getAntibioticName(antibiotic)}`,
          resistant: data.resistant,
          total: data.total,
          percentage: percentage
        };
      })
      .filter(pair => pair.total >= 30) // Only include pairs with n≥30
      .sort((a, b) => {
        if (a.percentage !== b.percentage) {
          return b.percentage - a.percentage; // Higher percentage first
        }
        return b.total - a.total; // Higher n wins for ties
      })
      .slice(0, 5);
    
    return allPairs;
  };

  // Helper function to calculate sentinel phenotypes
  const calculateSentinelPhenotypes = (rows: any[]): SentinelPhenotype[] => {
    const patterns: SentinelPhenotype[] = [];
    
    // MRSA pattern (S. aureus resistant to oxacillin)
    const mrsaData = { resistant: 0, total: 0 };
    // VRE pattern (Enterococcus resistant to vancomycin)
    const vreData = { resistant: 0, total: 0 };
    // ESBL pattern (E. coli, K. pneumoniae resistant to 3rd gen cephalosporins)
    const esblData = { resistant: 0, total: 0 };
    // Carbapenem-resistant Enterobacteriaceae
    const creData = { resistant: 0, total: 0 };
    // K. pneumoniae vs 3rd gen cephalosporins
    const kpn3gcData = { resistant: 0, total: 0 };
    
    rows.forEach(row => {
      const organism = row.ORGANISM;
      if (!organism) return;
      
      const organismLower = organism.toLowerCase();
      
      // MRSA detection
      if (organismLower.includes('sau')) {
        mrsaData.total++;
        const oxaZone = row['OXA ND1'];
        if (oxaZone && parseFloat(oxaZone) <= 17) { // MRSA breakpoint
          mrsaData.resistant++;
        }
      }
      
      // VRE detection
      if (organismLower.includes('efa') || organismLower.includes('efm')) {
        vreData.total++;
        const vanZone = row['VAN ND30'];
        if (vanZone && parseFloat(vanZone) <= 17) { // VRE breakpoint
          vreData.resistant++;
        }
      }
      
      // ESBL detection (E. coli, K. pneumoniae with resistance to CTX, CAZ, or CRO)
      if (organismLower === 'eco' || organismLower === 'kpn') {
        esblData.total++;
        const ctxZone = row['CTX ND30'];
        const cazZone = row['CAZ ND30'];
        const croZone = row['CRO ND30'];
        
        if ((ctxZone && parseFloat(ctxZone) <= 22) || 
            (cazZone && parseFloat(cazZone) <= 22) || 
            (croZone && parseFloat(croZone) <= 22)) {
          esblData.resistant++;
        }
      }
      
      // CRE detection (Enterobacteriaceae resistant to carbapenems)
      if (['eco', 'kpn', 'pae', 'aba'].includes(organismLower)) {
        creData.total++;
        const ipmZone = row['IPM ND10'];
        const memZone = row['MEM ND10'];
        
        if ((ipmZone && parseFloat(ipmZone) <= 19) || 
            (memZone && parseFloat(memZone) <= 19)) {
          creData.resistant++;
        }
      }
      
      // K. pneumoniae vs 3rd gen cephalosporins
      if (organismLower === 'kpn') {
        kpn3gcData.total++;
        const ctxZone = row['CTX ND30'];
        const cazZone = row['CAZ ND30'];
        const croZone = row['CRO ND30'];
        
        if ((ctxZone && parseFloat(ctxZone) <= 22) || 
            (cazZone && parseFloat(cazZone) <= 22) || 
            (croZone && parseFloat(croZone) <= 22)) {
          kpn3gcData.resistant++;
        }
      }
    });
    
    // Add patterns with sufficient data
    if (mrsaData.total >= 10) {
      patterns.push({
        pattern: 'MRSA',
        resistant: mrsaData.resistant,
        total: mrsaData.total,
        percentage: Math.round((mrsaData.resistant / mrsaData.total) * 100)
      });
    }
    
    if (vreData.total >= 10) {
      patterns.push({
        pattern: 'VRE',
        resistant: vreData.resistant,
        total: vreData.total,
        percentage: Math.round((vreData.resistant / vreData.total) * 100)
      });
    }
    
    if (esblData.total >= 10) {
      patterns.push({
        pattern: 'ESBL E. coli/K. pneumoniae',
        resistant: esblData.resistant,
        total: esblData.total,
        percentage: Math.round((esblData.resistant / esblData.total) * 100)
      });
    }
    
    if (creData.total >= 10) {
      patterns.push({
        pattern: 'CRE',
        resistant: creData.resistant,
        total: creData.total,
        percentage: Math.round((creData.resistant / creData.total) * 100)
      });
    }
    
    if (kpn3gcData.total >= 10) {
      patterns.push({
        pattern: 'K. pneumoniae vs 3GCS',
        resistant: kpn3gcData.resistant,
        total: kpn3gcData.total,
        percentage: Math.round((kpn3gcData.resistant / kpn3gcData.total) * 100)
      });
    }
    
    // Sort by percentage descending and take top 5
    return patterns.sort((a, b) => b.percentage - a.percentage).slice(0, 5);
  };

  // Fetch all data from local API endpoint
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        console.log('Fetching all AMR data from local API for Combined Overview...');
        const response = await fetch('https://backend.ajhiveprojects.com/v1/amr-health-v2', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const apiData: ApiResponse = await response.json();
        console.log('Full API response received for Combined Overview:', apiData);

        if (!apiData.success || !apiData.data || !apiData.data.rows) {
          throw new Error('Invalid API response format');
        }

        const rows = apiData.data.rows;
        const totalRows = apiData.data.totalRows;

        console.log(`Processing ${rows.length} rows for Combined Overview calculations`);

        // 1. Extract and set top organisms
        const organisms = extractTopOrganisms(rows);
        setTopOrganisms(organisms);
        console.log('Top organisms calculated:', organisms);

        // 2. Set total isolates (using total rows as approximation)
        setTotalIsolates(totalRows);
        console.log('Total isolates:', totalRows);

        // 3. Calculate resistance pairs
        const resistancePairsData = calculateResistancePairs(rows);
        setResistancePairs(resistancePairsData);
        console.log('Resistance pairs calculated:', resistancePairsData);

        // 4. Calculate sentinel phenotypes
        const sentinelData = calculateSentinelPhenotypes(rows);
        setSentinelPhenotypes(sentinelData);
        console.log('Sentinel phenotypes calculated:', sentinelData);

      } catch (error) {
        console.error('Error fetching AMR data from local API for Combined Overview:', error);
        // Set fallback empty states
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
                      <span className="text-xs font-medium text-blue-800">--</span>
                    </div>
                  ))}
                </>
              ) : topOrganisms.length > 0 ? (
                // Data loaded successfully
                <>
                  {topOrganisms.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-blue-700">{item.organism}</span>
                      <span className="text-xs font-medium text-blue-800">{item.count.toLocaleString()}</span>
                    </div>
                  ))}
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
                  {resistancePairs.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-red-700 truncate" title={item.pair}>
                        {item.pair.length > 25 ? `${item.pair.substring(0, 25)}...` : item.pair}
                      </span>
                      <span className="text-xs font-medium text-red-800 whitespace-nowrap">
                        {item.percentage}%
                      </span>
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
                  {sentinelPhenotypes.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-yellow-700 truncate" title={item.pattern}>
                        {item.pattern.length > 25 ? `${item.pattern.substring(0, 25)}...` : item.pattern}
                      </span>
                      <span className="text-xs font-medium text-yellow-800 whitespace-nowrap">
                        {item.percentage}%
                      </span>
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