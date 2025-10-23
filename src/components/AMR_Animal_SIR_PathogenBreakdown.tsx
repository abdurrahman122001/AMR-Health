import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Dummy data for pathogen breakdown
const pathogenBreakdown = [
  {
    pathogen: 'E. coli',
    total: 1847,
    susceptible: 52.3,
    intermediate: 18.7,
    resistant: 29.0
  },
  {
    pathogen: 'S. aureus',
    total: 1254,
    susceptible: 61.2,
    intermediate: 14.1,
    resistant: 24.7
  },
  {
    pathogen: 'Salmonella spp.',
    total: 986,
    susceptible: 58.9,
    intermediate: 16.3,
    resistant: 24.8
  },
  {
    pathogen: 'Enterococcus spp.',
    total: 743,
    susceptible: 64.7,
    intermediate: 11.2,
    resistant: 24.1
  },
  {
    pathogen: 'K. pneumoniae',
    total: 621,
    susceptible: 49.8,
    intermediate: 19.6,
    resistant: 30.6
  },
  {
    pathogen: 'P. aeruginosa',
    total: 498,
    susceptible: 55.4,
    intermediate: 13.9,
    resistant: 30.7
  },
  {
    pathogen: 'S. epidermidis',
    total: 387,
    susceptible: 67.2,
    intermediate: 8.8,
    resistant: 24.0
  },
  {
    pathogen: 'Streptococcus spp.',
    total: 294,
    susceptible: 71.4,
    intermediate: 12.6,
    resistant: 16.0
  }
];

export function AMR_Animal_SIR_PathogenBreakdown() {
  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-[16px]">
          Top Pathogens Breakdown
        </CardTitle>
        <p className="text-sm text-gray-600 m-[0px] text-[13px]">
          S/I/R distribution by most common veterinary pathogens
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3 mt-[5px] mr-[0px] mb-[0px] ml-[0px]">
            {pathogenBreakdown.slice(0, 5).map((pathogen, index) => (
              <div key={pathogen.pathogen} className="space-y-2 mt-[0px] mr-[0px] mb-[16px] ml-[0px] mb-[15px]">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {pathogen.pathogen}
                  </span>
                  <span className="text-xs text-gray-500">
                    n = {pathogen.total.toLocaleString()}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="flex h-6 rounded-md overflow-hidden bg-gray-100">
                  <div 
                    className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${pathogen.susceptible}%` }}
                  >
                    {pathogen.susceptible >= 15 ? `${pathogen.susceptible.toFixed(0)}%` : ''}
                  </div>
                  <div 
                    className="bg-amber-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${pathogen.intermediate}%` }}
                  >
                    {pathogen.intermediate >= 10 ? `${pathogen.intermediate.toFixed(0)}%` : ''}
                  </div>
                  <div 
                    className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${pathogen.resistant}%` }}
                  >
                    {pathogen.resistant >= 15 ? `${pathogen.resistant.toFixed(0)}%` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}