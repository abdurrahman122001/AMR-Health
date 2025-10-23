// AMU DASHBOARD BACKUP - Current Working Version
// This file contains the complete working AmuDashboard component (Human Health AMU Dashboard)
// Last updated: Current restoration version

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Users, Eye, Shield, Stethoscope, FlaskConical, CheckCircle } from 'lucide-react';
import { AmuCharts } from '../AmuCharts';

interface AmuSummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color?: 'default' | 'warning' | 'success';
}

function AmuSummaryCard({ title, value, subtitle, icon, color = 'default' }: AmuSummaryCardProps) {
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
              {value}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AmuDashboard() {
  const amuSummaryData = [
    {
      title: 'AMU Prevalence',
      value: '74.2%',
      subtitle: 'Patients on ≥1 antimicrobial',
      icon: <Users className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Watch+Reserve Share',
      value: '34.8%',
      subtitle: 'Of all antibiotic Rx',
      icon: <Eye className="h-5 w-5" />,
      color: 'warning' as const
    },
    {
      title: 'Prophylaxis Use',
      value: '28.5%',
      subtitle: 'SP+MP of antibiotic Rx',
      icon: <Shield className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Empirical Therapy',
      value: '61.3%',
      subtitle: 'Empirical of antibiotic Rx',
      icon: <Stethoscope className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Culture at Start',
      value: '42.7%',
      subtitle: 'Sample before/at first dose',
      icon: <FlaskConical className="h-5 w-5" />,
      color: 'warning' as const
    },
    {
      title: 'Guideline Compliant',
      value: '67.9%',
      subtitle: 'Rx aligned to guideline',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'success' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(186, 184, 108, 0.2)' }}>
        {amuSummaryData.map((card, index) => (
          <AmuSummaryCard
            key={index}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>

      {/* Charts */}
      <AmuCharts />
    </div>
  );
}