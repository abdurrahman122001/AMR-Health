import React from 'react';
import { BarChart3, Building2 } from 'lucide-react';

export function QualitySummaryCards() {
  // Mock data for average compliance across 6 quality indicators
  const averageComplianceData = {
    value: 68,
    target: 75,
    metric: "Average Compliance",
    description: "Mean compliance rate across all 6 quality prescribing indicators",
    color: "#f59e0b", // Amber for fair compliance
    grade: "B+"
  };

  // Mock data for hospitals meeting performance threshold
  const hospitalPerformanceData = {
    value: 42,
    target: 75,
    metric: "Hospitals Meeting Threshold",
    description: "Percentage of hospitals achieving ≥75% average compliance rate",
    color: "#ea580c", // Orange for needs improvement
    grade: "C+"
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return '#16a34a'; // Green
      case 'A-':
      case 'B+':
        return '#f59e0b'; // Amber
      case 'B':
      case 'B-':
      case 'C+':
        return '#ea580c'; // Orange
      case 'C':
      case 'C-':
      case 'D':
      case 'F':
        return '#dc2626'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const metrics = [averageComplianceData, hospitalPerformanceData];
  const icons = [BarChart3, Building2];

  return (
    <div className="flex gap-6">
      {metrics.map((metric, index) => {
        const IconComponent = icons[index];
        const progressPercentage = (metric.value / metric.target) * 100;
        
        return (
          <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white flex-1">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <IconComponent 
                  className="w-5 h-5" 
                  style={{ color: metric.color }}
                />
                <div className="font-medium text-sm text-gray-900">{metric.metric}</div>
              </div>
              <div 
                className="px-2 py-1 rounded text-xs font-medium text-white"
                style={{ backgroundColor: getGradeColor(metric.grade) }}
              >
                {metric.grade}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold" style={{ color: metric.color }}>
                  {metric.value}%
                </div>
                <div className="text-sm text-gray-500 pb-1">
                  / {metric.target}% target
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full" 
                  style={{ 
                    backgroundColor: metric.color, 
                    width: `${Math.min(progressPercentage, 100)}%` 
                  }}
                ></div>
              </div>
              
              <div className="text-xs text-gray-600">
                {metric.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}