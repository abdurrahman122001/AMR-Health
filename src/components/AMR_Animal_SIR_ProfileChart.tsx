import React from 'react';
import { AMR_Animal_SIR_DonutChart } from './AMR_Animal_SIR_DonutChart';
import { AMR_Animal_SIR_PathogenBreakdown } from './AMR_Animal_SIR_PathogenBreakdown';

export function AMR_Animal_SIR_ProfileChart() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AMR_Animal_SIR_DonutChart />
      <AMR_Animal_SIR_PathogenBreakdown />
    </div>
  );
}