import React from 'react';
import { SummaryCards } from '../SummaryCards';
import { InteractivePieChart } from '../InteractivePieChart';

/**
 * AMR Dashboard Backup
 * 
 * This backup represents the AMR dashboard structure from the current working state.
 * It includes:
 * - SummaryCards: Displays key AMR metrics like total isolates, surveillance sites, organisms monitored, etc.
 * - InteractivePieChart: Comprehensive resistance analysis with multiple views and filtering capabilities
 * 
 * This structure was working in App.tsx with the conditional rendering:
 * {activeDashboard === "amr" && (
 *   <>
 *     <SummaryCards />
 *     <InteractivePieChart />
 *   </>
 * )}
 */
export function AmrDashboard() {
  return (
    <div className="space-y-6">
      {/* AMR Summary Cards - Key metrics for antimicrobial resistance surveillance */}
      <SummaryCards />
      
      {/* Interactive Resistance Analysis - Comprehensive charts and filtering */}
      <InteractivePieChart />
    </div>
  );
}