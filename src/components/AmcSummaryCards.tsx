import React from 'react';
import { Card, CardContent } from './ui/card';
import { Package, Pill, Activity, TrendingUp, Building2, Calendar } from 'lucide-react';

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

export function AmcSummaryCards() {
  const summaryData = [
    {
      title: 'Total AMC Records',
      value: 402,
      subtitle: 'Consumption data entries',
      icon: <Package className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Antimicrobial Products',
      value: 258,
      subtitle: 'Products monitored',
      icon: <Pill className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Unique Antibiotics',
      value: 24,
      subtitle: 'Under surveillance',
      icon: <Activity className="h-5 w-5" />,
      color: 'default' as const
    },
    {
      title: 'Total DDD',
      value: '15,847',
      subtitle: 'Defined daily doses',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'success' as const
    },
    {
      title: 'Reporting Period',
      value: '2023',
      subtitle: 'Annual data',
      icon: <Calendar className="h-5 w-5" />,
      color: 'default' as const
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