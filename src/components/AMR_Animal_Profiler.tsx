import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AMR_Animal_Overview_PrioritySpark } from './AMR_Animal_Overview_PrioritySpark';
import { AMR_Animal_IsolateAnalytics } from './AMR_Animal_IsolateAnalytics';
import { AMR_Animal_PathogenResistanceBar } from './AMR_Animal_PathogenResistanceBar';

export function AMR_Animal_Profiler() {
  return (
    <div className="space-y-6">
      {/* Priority Pathogen Trends */}
      <AMR_Animal_Overview_PrioritySpark />
      
      {/* Veterinary Isolate Distribution Analysis */}
      <AMR_Animal_IsolateAnalytics />
      
      {/* Pathogen Resistance Rates Bar Chart */}
      <AMR_Animal_PathogenResistanceBar />
    </div>
  );
}