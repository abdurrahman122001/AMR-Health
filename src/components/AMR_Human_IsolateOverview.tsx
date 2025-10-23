import React, { useState, useEffect } from 'react';
import { CardHeader, CardTitle, CardDescription } from './ui/card';
import { makeServerRequest } from '../utils/supabase/client';

interface OrganismData {
  organism: string;
  count: number;
}

export function AMR_Human_IsolateOverview() {
  const [topOrganisms, setTopOrganisms] = useState<OrganismData[]>([]);
  const [totalIsolates, setTotalIsolates] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch top organisms data from AMR_HH table
  useEffect(() => {
    const fetchTopOrganisms = async () => {
      try {
        setIsLoading(true);
        
        // Fetch top organisms by frequency
        const organismsResponse = await makeServerRequest('/amr-hh-top-organisms');
        if (organismsResponse.success && organismsResponse.topOrganisms) {
          setTopOrganisms(organismsResponse.topOrganisms);
          console.log('Top organisms from AMR_HH:', organismsResponse.topOrganisms);
        } else {
          console.error('Failed to fetch top organisms:', organismsResponse.error || 'Invalid response format');
          setTopOrganisms([]);
        }

        // Fetch total isolates count from same endpoint as SummaryCards for consistency
        const isolatesResponse = await makeServerRequest('/amr-hh-isolates-total');
        if (isolatesResponse.success && typeof isolatesResponse.total === 'number') {
          setTotalIsolates(isolatesResponse.total);
          console.log('Total isolates from AMR_HH (consistent with SummaryCards):', isolatesResponse.total);
        } else {
          console.error('Failed to fetch total isolates:', isolatesResponse.error || 'Invalid response format');
          setTotalIsolates(0);
        }
      } catch (error) {
        console.error('Error fetching AMR_HH data:', error);
        setTopOrganisms([]);
        setTotalIsolates(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopOrganisms();
  }, []);

  // Display loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="flex items-center justify-between bg-muted/30 rounded-lg px-[12px] mt-[0px] mr-[0px] mb-[10px] ml-[0px] py-[5px]">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-sm font-medium text-gray-400">Loading organism {index}...</span>
                  <p className="text-xs text-gray-400">Loading count...</p>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-400">--%</div>
            </div>
          ))}
        </div>
    );
  }

  // Display no data state
  if (!topOrganisms.length) {
    return (
      <div className="space-y-3">
        <div className="text-center py-4 text-sm text-gray-500">
          No organism data found in AMR_HH database
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
        {topOrganisms.map((item, index) => {
          const percentage = totalIsolates > 0 ? ((item.count / totalIsolates) * 100) : 0;
          return (
            <div key={item.organism} className="flex items-center justify-between bg-muted/30 rounded-lg px-[12px] mt-[0px] mr-[0px] mb-[10px] ml-[0px] py-[5px]">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-sm font-medium text-[12px]">{item.organism}</span>
                  <p className="text-xs text-gray-500 text-[11px]">
                    {item.count.toLocaleString()} isolates
                  </p>
                </div>
              </div>
              <div className="text-sm font-semibold">{percentage.toFixed(1)}%</div>
            </div>
          );
        })}
    </div>
  );
}