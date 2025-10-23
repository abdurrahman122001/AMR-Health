import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardTitle } from './ui/card';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ResistancePattern {
  pattern: string;
  resistant: number;
  total: number;
  percentage: number;
}

export function AMR_Human_Overview_MonitorSUM_NoLimit() {
  const [resistancePatterns, setResistancePatterns] = useState<ResistancePattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  const fetchResistanceData = async (attempt: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      setRetryAttempt(attempt);
      
      console.log('Fetching resistance data from AMR_HH (no sample size limit)...');
      
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
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Resistance patterns response (no limit):', data);
      console.log('Number of patterns received:', data.patterns?.length || 0);
      console.log('Pattern details:', data.patterns);
      
      if (data.success && data.patterns) {
        console.log('Setting resistance patterns (no limit):', data.patterns);
        setResistancePatterns(data.patterns);
      } else {
        throw new Error(data.message || 'Failed to fetch resistance data');
      }
    } catch (err) {
      console.error('Error fetching resistance data (no limit):', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Retry logic with exponential backoff
      if (attempt < 2) {
        const retryDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        setTimeout(() => fetchResistanceData(attempt + 1), retryDelay);
        return;
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchResistanceData(0);
  }, []);

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
            onClick={() => fetchResistanceData(0)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && resistancePatterns.length === 0 && (
        <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
          No resistance patterns found
        </div>
      )}

      {!loading && !error && resistancePatterns.length > 0 && resistancePatterns.slice(0, 5).map((item, index) => (
        <div key={index} className="flex items-center justify-between bg-muted/30 rounded-lg px-[12px] mt-[0px] mr-[0px] mb-[10px] ml-[0px] py-[5px]">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: getResistanceColorHex(item.percentage) }}
            />
            <div>
              <span className="text-sm font-medium text-[12px]">{item.pattern}</span>
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