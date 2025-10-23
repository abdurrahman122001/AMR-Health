import React from 'react';
import { Button } from './ui/button';

interface AMR_Animal_NAVProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export function AMR_Animal_NAV({ currentView, setCurrentView }: AMR_Animal_NAVProps) {
  const navigationButtons = [
    { id: 'overview', label: 'Overview', description: 'Key metrics and priority pathogens' },
    { id: 'resistance-heat-map', label: 'Resistance Heat Map', description: 'Visual resistance patterns' },
    { id: 'amb-profiles', label: 'Antimicrobial Profiles', description: 'Detailed drug resistance analysis' },
    { id: 'pathogen-profiler', label: 'Pathogen Profiler', description: 'Species-specific resistance patterns' },
    { id: 'specimen-profile', label: 'Specimen Profile', description: 'Sample type analysis' },
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex overflow-x-auto scrollbar-hide">
        <div className="flex space-x-1 p-1 min-w-max">
          {navigationButtons.map((button) => (
            <Button
              key={button.id}
              variant={currentView === button.id ? "default" : "ghost"}
              onClick={() => setCurrentView(button.id)}
              className={`
                whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors
                ${currentView === button.id 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
              title={button.description}
            >
              {button.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}