import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function AMR_Animal_MDR_Profile() {
  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Animal Multi-Drug Resistance Profile
        </CardTitle>
        <p className="text-sm text-gray-600 m-[0px]">
          MDR patterns and co-resistance analysis in veterinary pathogens
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Multi-Drug Resistance Analysis
            </h3>
            <p className="text-gray-600 max-w-md">
              Analysis of multi-drug resistant isolates in animal health including 
              ESBL-producing E. coli, MDR Salmonella, MRSA in companion animals, 
              and co-resistance patterns across veterinary antimicrobials.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Component ready for data integration
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}