import React from 'react';
import { Button } from './ui/button';

interface AMR_Human_NAVProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export function AMR_Human_NAV({ currentView, setCurrentView }: AMR_Human_NAVProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={currentView === 'overview' ? 'default' : 'outline'}
        onClick={() => setCurrentView('overview')} className="text-[13px]"
      >
        Overview
      </Button>
      <Button
        variant={currentView === 'resistance-heat-map' ? 'default' : 'outline'}
        onClick={() => setCurrentView('resistance-heat-map')} className="text-[13px]"
      >
        Resistance Heat Map
      </Button>
      <Button
        variant={currentView === 'amb-profiles' ? 'default' : 'outline'}
        onClick={() => setCurrentView('amb-profiles')} className="text-[13px]"
      >
        Antimicrobial Profile
      </Button>
      <Button
        variant={currentView === 'isolate-analytics' ? 'default' : 'outline'}
        onClick={() => setCurrentView('isolate-analytics')} className="text-[13px] hidden"
      >
        Pathogen Profile
      </Button>
      <Button
        variant={currentView === 'mdr-profile' ? 'default' : 'outline'}
        onClick={() => setCurrentView('mdr-profile')} className="text-[13px]"
      >
        Multi-Drug Resistance Profile
      </Button>
      <Button
        variant={currentView === 'hai-profile' ? 'default' : 'outline'}
        onClick={() => setCurrentView('hai-profile')} className="text-[13px]"
      >
        Hospital-Acquired Infection Profile
      </Button>
    </div>
  );
}