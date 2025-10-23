import React from 'react';
import { Button } from './ui/button';

interface AMU_Human_ViewButtonsProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export function AMU_Human_ViewButtons({ currentView, setCurrentView }: AMU_Human_ViewButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={currentView === 'prevalence' ? 'default' : 'outline'}
        onClick={() => setCurrentView('prevalence')}
      >
        Overview
      </Button>
      <Button
        variant={currentView === 'demographics' ? 'default' : 'outline'}
        onClick={() => setCurrentView('demographics')}
      >
        Demographic Profile
      </Button>
      <Button
        variant={currentView === 'aware' ? 'default' : 'outline'}
        onClick={() => setCurrentView('aware')}
      >
        AWaRe Profile
      </Button>
      <Button
        variant={currentView === 'distribution' ? 'default' : 'outline'}
        onClick={() => setCurrentView('distribution')}
      >
        ATC Profile
      </Button>
      <Button
        variant={currentView === 'indications' ? 'default' : 'outline'}
        onClick={() => setCurrentView('indications')}
      >
        Indication Profile
      </Button>
      <Button
        variant={currentView === 'prophylaxis' ? 'default' : 'outline'}
        onClick={() => setCurrentView('prophylaxis')}
      >
        Prophylaxis Profile
      </Button>
      <Button
        variant={currentView === 'diagnosis-profile' ? 'default' : 'outline'}
        onClick={() => setCurrentView('diagnosis-profile')}
      >
        Diagnosis Profile
      </Button>
      <Button
        variant={currentView === 'quality' ? 'default' : 'outline'}
        onClick={() => setCurrentView('quality')}
      >
        Rx Quality
      </Button>
    </div>
  );
}