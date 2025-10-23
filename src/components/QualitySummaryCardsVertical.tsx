import React from 'react';
import { BarChart3, Building2 } from 'lucide-react';

interface QualityIndicator {
  subject: string;
  field: string;
  value: number;
  count: number;
  target: number;
}

interface QualityResponse {
  totalRecords: number;
  indicators: QualityIndicator[];
  dataSource: string;
  tableName?: string;
  timestamp?: string;
  error?: string;
}

interface FacilityComplianceResponse {
  totalFacilities: number;
  facilitiesMeetingTarget: number;
  facilitiesNotMeetingTarget: number;
  targetPercentage: string;
  facilityDetails: Array<{
    name: string;
    totalRecords: number;
    aggregateScore: string;
    meetingTarget: boolean;
    indicators: Record<string, string>;
  }>;
  dataSource: string;
  tableName?: string;
  timestamp?: string;
  error?: string;
}

interface QualitySummaryCardsVerticalProps {
  qualityData: QualityResponse | null;
  currentRadarData: QualityIndicator[];
  loading: boolean;
  error: string | null;
  facilityComplianceData: FacilityComplianceResponse | null;
  facilityLoading: boolean;
  facilityError: string | null;
}

export function QualitySummaryCardsVertical({ 
  qualityData, 
  currentRadarData, 
  loading, 
  error,
  facilityComplianceData,
  facilityLoading,
  facilityError
}: QualitySummaryCardsVerticalProps) {
  // Calculate dynamic compliance data from real filtered data
  const getAverageComplianceData = () => {
    if (loading || error || !currentRadarData || currentRadarData.length === 0) {
      return {
        value: 0,
        target: 80,
        metric: "Aggregate Compliance",
        description: "Mean compliance across all 6 quality Rx indicators",
        color: "#6b7280", // Gray for no data
        grade: "N/A"
      };
    }
    
    const mean = currentRadarData.reduce((sum, item) => sum + item.value, 0) / currentRadarData.length;
    
    // Determine color and grade based on mean compliance
    let color, grade;
    if (mean >= 80) {
      color = "#16a34a"; // Green
      grade = "A";
    } else if (mean >= 70) {
      color = "#22c55e"; // Light green
      grade = "B+";
    } else if (mean >= 60) {
      color = "#f59e0b"; // Amber
      grade = "B";
    } else if (mean >= 50) {
      color = "#ea580c"; // Orange
      grade = "C+";
    } else if (mean >= 40) {
      color = "#dc2626"; // Red
      grade = "C";
    } else {
      color = "#991b1b"; // Dark red
      grade = "D";
    }
    
    return {
      value: mean,
      target: 80,
      metric: "Aggregate Compliance",
      description: "Mean compliance across all 6 quality Rx indicators",
      color: color,
      grade: grade
    };
  };
  
  const averageComplianceData = getAverageComplianceData();

  // Calculate dynamic hospital performance data from real facility compliance data
  const getHospitalPerformanceData = () => {
    if (facilityLoading || facilityError || !facilityComplianceData) {
      return {
        value: 0,
        target: 80,
        metric: "Facilities Meeting Threshold",
        description: "Facilities achieving ≥80% aggregate compliance",
        color: "#6b7280", // Gray for no data
        grade: "N/A"
      };
    }
    
    const facilitiesMeetingTarget = facilityComplianceData.facilitiesMeetingTarget;
    const totalFacilities = facilityComplianceData.totalFacilities;
    const percentage = totalFacilities > 0 ? (facilitiesMeetingTarget / totalFacilities * 100) : 0;
    
    // Determine color and grade based on percentage of facilities meeting target
    let color, grade;
    if (percentage >= 80) {
      color = "#16a34a"; // Green
      grade = "A";
    } else if (percentage >= 70) {
      color = "#22c55e"; // Light green
      grade = "B+";
    } else if (percentage >= 60) {
      color = "#f59e0b"; // Amber
      grade = "B";
    } else if (percentage >= 50) {
      color = "#ea580c"; // Orange
      grade = "C+";
    } else if (percentage >= 40) {
      color = "#dc2626"; // Red
      grade = "C";
    } else {
      color = "#991b1b"; // Dark red
      grade = "D";
    }
    
    return {
      value: facilitiesMeetingTarget,
      target: totalFacilities,
      metric: "Facilities Meeting Threshold",
      description: "Facilities achieving ≥80% aggregate compliance",
      color: color,
      grade: grade
    };
  };
  
  const hospitalPerformanceData = getHospitalPerformanceData();

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
    <>
      {metrics.map((metric, index) => {
        const IconComponent = icons[index];
        const progressPercentage = (metric.value / metric.target) * 100;
        
        return (
          <div key={index} className="border border-gray-200 rounded-lg bg-white mt-[0px] mr-[0px] mb-[30px] ml-[0px] py-[6px] px-[10px] p-[10px]">
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
                  {(() => {
                    if (index === 0) {
                      // Calculate average compliance from real filtered quality data
                      if (loading) return '...';
                      if (error || !currentRadarData || currentRadarData.length === 0) return '0.0%';
                      
                      // Calculate mean from the actual filtered data
                      const mean = currentRadarData.reduce((sum, item) => sum + item.value, 0) / currentRadarData.length;
                      return `${mean.toFixed(1)}%`;
                    } else if (index === 1) {
                      // Display number of facilities meeting 80% compliance target
                      if (facilityLoading) return '...';
                      if (facilityError || !facilityComplianceData) return '0';
                      
                      return facilityComplianceData.facilitiesMeetingTarget.toString();
                    }
                    
                    return metric.value;
                  })()}
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
    </>
  );
}