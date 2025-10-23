// SUMMARY CARDS BACKUP - Current Working Version
// This file contains the complete working SummaryCards component (AMR Dashboard)
// Last updated: Current restoration version

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { TestTube, Building2, Eye, Shield, BarChart3, AlertTriangle } from 'lucide-react';
import { getCurrentTotalIsolates, getCurrentVariation } from '../utils/isolateCountUtils';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color?: 'default' | 'warning' | 'success';
}

function SummaryCard({ title, value, subtitle, icon, color = 'default' }: SummaryCardProps) {
  const getValueColor = () => {
    switch (color) {
      case 'warning':
        return 'text-red-600';
      case 'success':
        return 'text-green-600';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Card className="relative">
      <CardContent className="p-4 bg-[rgba(255,255,255,0)]">
        <div className="flex flex-col space-y-2">
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground leading-tight font-semibold">{title}</p>
            <div className="text-muted-foreground/60 flex-shrink-0">
              {icon}
            </div>
          </div>
          <div>
            <div className={`text-lg font-semibold ${getValueColor()}`}>
              {value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryCards() {
  // Use shared utility for consistent total isolate count across all components
  const currentTotalIsolates = getCurrentTotalIsolates();
  const variation = getCurrentVariation();
  
  const summaryData = [
    {
      title: 'Total Bacterial Isolates',
      value: currentTotalIsolates,
      subtitle: 'Laboratory specimens',
      icon: <TestTube className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Surveillance Sites',
      value: 11,
      subtitle: 'Ghanaian teaching hospitals',
      icon: <Building2 className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Organisms Monitored',
      value: 72,
      subtitle: 'Under surveillance',
      icon: <Eye className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Average Resistance',
      value: `${Math.round(31 * variation)}%`,
      subtitle: 'Across all combinations',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'MDRO Incidence',
      value: (15.7 * variation).toFixed(1),
      subtitle: 'per 1,000 admissions',
      icon: <Shield className="h-5 w-5" />,
      color: 'warning' as const
    },
    {
      title: 'MDR Indicator Bacteria',
      value: `${Math.round(15.7 * variation)}%`,
      subtitle: 'Indicator bacteria isolates',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'warning' as const
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(186, 184, 108, 0.2)' }}>
      {summaryData.map((card, index) => (
        <SummaryCard
          key={index}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  );
}