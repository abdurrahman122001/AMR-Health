import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function AMR_Animal_HospitalAcquiredInfections() {
  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Veterinary Healthcare-Associated Infections
        </CardTitle>
        <p className="text-sm text-gray-600 m-[0px]">
          HAI surveillance and resistance patterns in veterinary healthcare settings
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-4">🏥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Veterinary Healthcare-Associated Infections
            </h3>
            <p className="text-gray-600 max-w-md">
              Analysis of healthcare-associated infections in veterinary facilities 
              including surgical site infections, catheter-associated infections, 
              and nosocomial transmission patterns in animal healthcare settings.
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