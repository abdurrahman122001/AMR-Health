import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function AMR_Animal_Resistance_ViewBy() {
  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Animal Resistance Patterns by Classification
        </CardTitle>
        <p className="text-sm text-gray-600 m-[0px]">
          Resistance analysis by animal species, production system, and antimicrobial class
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Resistance Classification Analysis
            </h3>
            <p className="text-gray-600 max-w-md">
              Interactive analysis of resistance patterns classified by animal species 
              (cattle, poultry, swine, small ruminants), production systems (dairy, beef, 
              layers, broilers), and veterinary antimicrobial classifications.
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