import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { UserCheck } from 'lucide-react';

export function AMR_Human_Demographic_SexSUM() {
  // Mock data for sex-based resistance patterns
  const sexData = {
    male: {
      resistanceRate: 34.2,
      topBugDrugPairs: [
        { pair: 'E. coli - Ciprofloxacin', resistance: 68.4 },
        { pair: 'K. pneumoniae - Ceftriaxone', resistance: 63.2 },
        { pair: 'P. aeruginosa - Meropenem', resistance: 58.7 }
      ]
    },
    female: {
      resistanceRate: 31.7,
      topBugDrugPairs: [
        { pair: 'K. pneumoniae - Ceftriaxone', resistance: 62.1 },
        { pair: 'E. coli - Ciprofloxacin', resistance: 59.8 },
        { pair: 'A. baumannii - Imipenem', resistance: 54.3 }
      ]
    }
  };

  const getResistanceColor = (rate: number): string => {
    if (rate < 20) return '#16a34a'; // Green
    if (rate < 40) return '#eab308'; // Yellow
    return '#dc2626'; // Red
  };

  const formatBacteriaNames = (pair: string) => {
    // Simple replacement approach to avoid regex escaping issues
    const replacements = [
      { bacteria: 'E. coli', replacement: '<em>E. coli</em>' },
      { bacteria: 'K. pneumoniae', replacement: '<em>K. pneumoniae</em>' },
      { bacteria: 'P. aeruginosa', replacement: '<em>P. aeruginosa</em>' },
      { bacteria: 'A. baumannii', replacement: '<em>A. baumannii</em>' },
      { bacteria: 'Acinetobacter baumanii', replacement: '<em>Acinetobacter baumanii</em>' },
      { bacteria: 'Klebsiella pneumoniae', replacement: '<em>Klebsiella pneumoniae</em>' },
      { bacteria: 'Pseudomonas aeruginosa', replacement: '<em>Pseudomonas aeruginosa</em>' },
      { bacteria: 'Staphylococcus aureus', replacement: '<em>Staphylococcus aureus</em>' },
      { bacteria: 'Enterococcus faecium', replacement: '<em>Enterococcus faecium</em>' },
      { bacteria: 'Streptococcus pneumoniae', replacement: '<em>Streptococcus pneumoniae</em>' }
    ];
    
    let result = pair;
    replacements.forEach(({ bacteria, replacement }) => {
      result = result.replace(bacteria, replacement);
    });
    
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-[15px]">Sex-Based Resistance Profile</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Resistance by sex and top signals</p>
        </div>
        <UserCheck className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="mt-[5px] mr-[0px] mb-[0px] ml-[0px] py-[8px] px-[24px]">
        <div className="space-y-2 mx-[0px] my-[5px] mt-[0px] mr-[0px] mb-[5px] ml-[0px]">
          {/* Male Profile */}
          <div className="space-y-1 pt-[0px] pr-[0px] pb-[2px] pl-[0px]">
            {/* Main aggregate resistance */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Male</span>
              <span 
                className="text-sm font-semibold"
                style={{ color: getResistanceColor(sexData.male.resistanceRate) }}
              >
                {sexData.male.resistanceRate}%
              </span>
            </div>
            

            
            {/* Top 2 bug-drug pairs */}
            <div className="space-y-0.5 ml-2">
              {sexData.male.topBugDrugPairs.slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                    <span className="text-xs text-gray-700">{formatBacteriaNames(item.pair)}</span>
                  </div>
                  <span 
                    className="text-xs font-semibold"
                    style={{ color: getResistanceColor(item.resistance) }}
                  >
                    {item.resistance}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Female Profile */}
          <div className="space-y-1">
            {/* Main aggregate resistance */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Female</span>
              <span 
                className="text-sm font-semibold"
                style={{ color: getResistanceColor(sexData.female.resistanceRate) }}
              >
                {sexData.female.resistanceRate}%
              </span>
            </div>
            

            
            {/* Top 2 bug-drug pairs */}
            <div className="space-y-0.5 ml-2">
              {sexData.female.topBugDrugPairs.slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                    <span className="text-xs text-gray-700">{formatBacteriaNames(item.pair)}</span>
                  </div>
                  <span 
                    className="text-xs font-semibold"
                    style={{ color: getResistanceColor(item.resistance) }}
                  >
                    {item.resistance}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}