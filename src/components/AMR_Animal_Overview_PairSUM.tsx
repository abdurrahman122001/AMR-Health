import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface AnimalResistancePair {
  pair: string;
  resistant: number;
  total: number;
  percentage: number;
}

export function AMR_Animal_Overview_PairSUM() {
  const [resistancePairs, setResistancePairs] = useState<AnimalResistancePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Animal-specific resistance pairs with dummy data
  const animalResistancePairs: AnimalResistancePair[] = [
    { pair: 'E. coli - Tetracycline', resistant: 892, total: 1456, percentage: 61.3 },
    { pair: 'Salmonella spp. - Ampicillin', resistant: 634, total: 1123, percentage: 56.5 },
    { pair: 'S. aureus - Penicillin', resistant: 723, total: 1289, percentage: 56.1 },
    { pair: 'E. coli - Sulfamethoxazole', resistant: 567, total: 1034, percentage: 54.8 },
    { pair: 'Campylobacter spp. - Erythromycin', resistant: 234, total: 456, percentage: 51.3 }
  ];

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

  const fetchAnimalResistancePairs = async (attempt: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      setRetryAttempt(attempt);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      console.log('Loading animal resistance pairs...');
      setResistancePairs(animalResistancePairs);
      
    } catch (err) {
      console.error('Error fetching animal resistance pairs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Retry logic
      if (attempt < 2) {
        const retryDelay = Math.pow(2, attempt) * 1000;
        setTimeout(() => fetchAnimalResistancePairs(attempt + 1), retryDelay);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimalResistancePairs(0);
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
            onClick={() => fetchAnimalResistancePairs(0)}
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