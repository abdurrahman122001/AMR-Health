import React from 'react';
import { AmcSummaryCards } from './AmcSummaryCards';
import { AmcCharts } from './AmcCharts';

export function AmcDashboard() {
  return (
    <div>
      {/* AMC Summary Cards */}
      <AmcSummaryCards />
      
      {/* AMC Charts */}
      <AmcCharts />
    </div>
  );
}