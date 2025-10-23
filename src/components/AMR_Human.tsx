import React, { useState } from 'react';
import { AMR_Human_NAV } from './AMR_Human_NAV';
import { AMR_Human_Overview_Combined } from './AMR_Human_Overview_Combined';
import { AMR_Human_Overview_PriorityBars } from './AMR_Human_Overview_PriorityBars';
import { AMU_Human_Overview_RMDR } from './AMU_Human_Overview_RMDR';
import { AMR_Human_Overview_PrioritySpark } from './AMR_Human_Overview_PrioritySpark';
import { AMR_Human_Resistance_ViewBy } from './AMR_Human_Resistance_ViewBy';
import { AMR_Human_Overview_Heat } from './AMR_Human_Overview_Heat';
import { AMR_Human_Profiler } from './AMR_Human_Profiler';
import { AMR_Human_Specimen_Profile } from './AMR_Human_Specimen_Profile';
import { IsolateAnalytics } from './IsolateAnalytics';
import { AMR_Human_MDR_Profile } from './AMR_Human_MDR_Profile';
import { AMR_SIR_ProfileChart } from './AMR_SIR_ProfileChart';
import { AMR_Human_Amb_AllProfiles } from './AMR_Human_Amb_AllProfiles';
import { AMR_Human_Amb_DisagProfiles } from './AMR_Human_Amb_DisagProfiles';
import { AMR_Human_Pathogen_RProfile } from './AMR_Human_Pathogen_RProfile';
import { HospitalAcquiredInfections } from './HospitalAcquiredInfections';
import { MDRProfileMain } from './MDR_Profile_Main';
import { AllIsolatesDistribution } from './AllIsolates_Distribution';

export function AMR_Human() {
  const [currentView, setCurrentView] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <AMR_Human_NAV currentView={currentView} setCurrentView={setCurrentView} />

      {/* Overview View - Default */}
      {currentView === 'overview' && (
        <div className="space-y-6">
          {/* Combined Summary Cards */}
          <AMR_Human_Overview_Combined />
          
          {/* AMR Overview - Single Column Layout */}
          <div className="w-full space-y-6">
            <AMR_Human_Overview_PriorityBars />
            <AllIsolatesDistribution />
            <AMR_Human_Overview_PrioritySpark />
          </div>
        </div>
      )}

      {/* Resistance Heat Map View */}
      {currentView === 'resistance-heat-map' && (
        <div className="space-y-6">
          <AMR_Human_Overview_Heat />
        </div>
      )}

      {/* Antimicrobial Profile View */}
      {currentView === 'amb-profiles' && (
        <div className="space-y-6">
          <AMR_Human_Amb_AllProfiles />
          <AMR_Human_Amb_DisagProfiles />
        </div>
      )}

      {/* Isolate Analytics View */}
      {currentView === 'isolate-analytics' && (
        <div className="space-y-6">
          <IsolateAnalytics />
        </div>
      )}

      {/* MDR Profile View */}
      {currentView === 'mdr-profile' && (
        <div className="space-y-6">
          <MDRProfileMain />
        </div>
      )}

      {/* HAI Profile View */}
      {currentView === 'hai-profile' && (
        <div className="space-y-6">
          <HospitalAcquiredInfections />
        </div>
      )}

    </div>
  );
}