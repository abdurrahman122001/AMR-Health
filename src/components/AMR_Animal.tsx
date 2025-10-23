import React, { useState } from 'react';
import { AMR_Animal_NAV } from './AMR_Animal_NAV';
import { AMR_Animal_Overview_Combined } from './AMR_Animal_Overview_Combined';
import { AMR_Animal_Overview_PriorityBars } from './AMR_Animal_Overview_PriorityBars';
import { AMR_Animal_Sparkline } from './AMR_Animal_Sparkline';

import { AMR_Animal_Resistance_ViewBy } from './AMR_Animal_Resistance_ViewBy';
import { AMR_Animal_Overview_Heat } from './AMR_Animal_Overview_Heat';
import { AMR_Animal_Profiler } from './AMR_Animal_Profiler';
import { AMR_Animal_Specimen_Profile } from './AMR_Animal_Specimen_Profile';
import { AMR_Animal_MDR_Profile } from './AMR_Animal_MDR_Profile';
import { AMR_Animal_SIR_ProfileChart } from './AMR_Animal_SIR_ProfileChart';
import { AMR_Animal_SIR_DonutChart } from './AMR_Animal_SIR_DonutChart';
import { AMR_Animal_SIR_PathogenBreakdown } from './AMR_Animal_SIR_PathogenBreakdown';
import { AMR_Animal_Amb_AllProfiles } from './AMR_Animal_Amb_AllProfiles';
import { AMR_Animal_HospitalAcquiredInfections } from './AMR_Animal_HospitalAcquiredInfections';
import { AMR_Animal_SpecimenTypeDistribution } from './AMR_Animal_SpecimenTypeDistribution';

export function AMR_Animal() {
  const [currentView, setCurrentView] = useState('overview');

  return (
    <div className="w-full max-w-none min-w-full space-y-6">
      {/* Navigation */}
      <div className="w-full max-w-none">
        <AMR_Animal_NAV currentView={currentView} setCurrentView={setCurrentView} />
      </div>

      {/* Overview View - Default */}
      {currentView === 'overview' && (
        <div className="w-full max-w-none min-w-full space-y-6">
          {/* Combined Summary Cards */}
          <div className="w-full max-w-none">
            <AMR_Animal_Overview_Combined />
          </div>
          
          {/* AMR Overview - Single Column Layout */}
          <div className="w-full max-w-none min-w-full space-y-6">
            <div className="w-full max-w-none">
              <AMR_Animal_Overview_PriorityBars />
            </div>

            <div className="w-full max-w-none">
              <AMR_Animal_Sparkline />
            </div>
          </div>
        </div>
      )}

      {/* Resistance Heat Map View */}
      {currentView === 'resistance-heat-map' && (
        <div className="w-full max-w-none min-w-full space-y-6">
          <div className="w-full max-w-none">
            <AMR_Animal_Overview_Heat />
          </div>
        </div>
      )}

      {/* Antimicrobial Profile View */}
      {currentView === 'amb-profiles' && (
        <div className="w-full max-w-none min-w-full space-y-6">
          <div className="w-full max-w-none">
            <AMR_Animal_Amb_AllProfiles />
          </div>
        </div>
      )}

      {/* Pathogen Profiler View */}
      {currentView === 'pathogen-profiler' && (
        <div className="w-full max-w-none min-w-full space-y-6">
          <div className="w-full max-w-none">
            <AMR_Animal_Profiler />
          </div>
        </div>
      )}

      {/* Specimen Profile View */}
      {currentView === 'specimen-profile' && (
        <div className="w-full max-w-none min-w-full space-y-6">
          <div className="w-full max-w-none">
            <AMR_Animal_SpecimenTypeDistribution />
          </div>
          <div className="w-full max-w-none">
            <AMR_Animal_Specimen_Profile />
          </div>
        </div>
      )}

      {/* Resistance Patterns by Classification */}
      {currentView === 'resistance-patterns' && (
        <div className="w-full max-w-none min-w-full space-y-6">
          <div className="w-full max-w-none">
            <AMR_Animal_Resistance_ViewBy />
          </div>
          <div className="w-full max-w-none grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            <div className="w-full max-w-none">
              <AMR_Animal_SIR_DonutChart />
            </div>
            <div className="w-full max-w-none">
              <AMR_Animal_SIR_PathogenBreakdown />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}