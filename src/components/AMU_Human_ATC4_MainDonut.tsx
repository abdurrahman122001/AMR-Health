import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Download } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface ActiveFilter {
  type: string;
  value: string;
  label: string;
}

interface FilterHelpers {
  addFilter: () => void;
  removeFilter: (index: number) => void;
  clearAllFilters: () => void;
}

interface AMU_Human_ATC4_MainDonutProps {
  regionFilterType: string;
  setRegionFilterType: (value: string) => void;
  regionFilterValue: string;
  setRegionFilterValue: (value: string) => void;
  regionActiveFilters: ActiveFilter[];
  regionFilterHelpers: FilterHelpers;
  filterTypeOptions: FilterOption[];
  getFilterValueOptions: (type: string) => FilterOption[];
}

export function AMU_Human_ATC4_MainDonut({
  regionFilterType,
  setRegionFilterType,
  regionFilterValue,
  setRegionFilterValue,
  regionActiveFilters,
  regionFilterHelpers,
  filterTypeOptions,
  getFilterValueOptions
}: AMU_Human_ATC4_MainDonutProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">ATC4 Profile of Antimicrobial Use in Ghana</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              // Add download functionality here
              console.log('Download ATC4 chart data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">Share of Systemic Antibacterial Prescriptions (J01) by ATC4 Class</p>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Data:</h3>
            
            {/* Filter Type */}
            <div className="flex-1">
              <Select value={regionFilterType} onValueChange={setRegionFilterType}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select filter type..." />
                </SelectTrigger>
                <SelectContent>
                  {filterTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Value */}
            <div className="flex-1">
              <Select 
                value={regionFilterValue} 
                onValueChange={setRegionFilterValue}
                disabled={!regionFilterType}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder={regionFilterType ? "Select value..." : "Select type first"} />
                </SelectTrigger>
                <SelectContent>
                  {getFilterValueOptions(regionFilterType).map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Filter Button */}
            <button
              onClick={regionFilterHelpers.addFilter}
              disabled={!regionFilterType || !regionFilterValue}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {regionActiveFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({regionActiveFilters.length})
              </span>
              <button
                onClick={regionFilterHelpers.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {regionActiveFilters.map((filter, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => regionFilterHelpers.removeFilter(index)}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          {/* Main Chart Area */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={(() => {
                    // Check if filtering by Eastern Regional Hospital
                    const isEasternRegionalHospital = regionActiveFilters.some(filter => 
                      filter.type === 'hospital' && filter.value === 'Eastern Regional Hospital'
                    );

                    let fullAtc4Data;
                    
                    if (isEasternRegionalHospital) {
                      // Real PPS data from Eastern Regional Hospital
                      fullAtc4Data = [
                        { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 31.1, prescriptions: 69 },
                        { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 14.4, prescriptions: 32 },
                        { atc4: "J01XD", label: "Imidazoles", value: 11.7, prescriptions: 26 },
                        { atc4: "J01GB", label: "Other aminoglycosides", value: 11.7, prescriptions: 26 },
                        { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 7.7, prescriptions: 17 },
                        { atc4: "J01MA", label: "Fluoroquinolones", value: 5.9, prescriptions: 13 },
                        { atc4: "J01FF", label: "Lincosamides", value: 5.0, prescriptions: 11 },
                        { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 4.1, prescriptions: 9 },
                        { atc4: "J01DH", label: "Carbapenems", value: 3.6, prescriptions: 8 },
                        { atc4: "J01CE", label: "β-lactamase-sensitive penicillins", value: 2.3, prescriptions: 5 },
                        { atc4: "OTHER", label: "All remaining ATC4 (< Top 10)", value: 2.7, prescriptions: 6 }
                      ];
                    } else {
                      // Default aggregated data across all hospitals
                      fullAtc4Data = [
                        { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 22.4, prescriptions: 5648 },
                        { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 18.7, prescriptions: 4713 },
                        { atc4: "J01MA", label: "Fluoroquinolones", value: 15.2, prescriptions: 3830 },
                        { atc4: "J01FA", label: "Macrolides", value: 12.1, prescriptions: 3049 },
                        { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 8.9, prescriptions: 2244 },
                        { atc4: "J01DH", label: "Carbapenems", value: 6.4, prescriptions: 1613 },
                        { atc4: "J01EE", label: "Sulfonamides + trimethoprim", value: 5.3, prescriptions: 1335 },
                        { atc4: "J01XA", label: "Glycopeptides", value: 2.8, prescriptions: 705 },
                        { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 2.4, prescriptions: 605 },
                        { atc4: "J01GB", label: "Other aminoglycosides", value: 1.9, prescriptions: 479 },
                        { atc4: "J01FF", label: "Lincosamides", value: 1.7, prescriptions: 428 },
                        { atc4: "J01XE", label: "Nitrofurans", value: 1.2, prescriptions: 302 },
                        { atc4: "J01XX", label: "Other antibacterials", value: 1.0, prescriptions: 252 }
                      ];
                    }

                    let displayData;
                    
                    if (isEasternRegionalHospital) {
                      // For Eastern Regional Hospital, data already includes "OTHER" category
                      displayData = fullAtc4Data;
                    } else {
                      // Keep top 10, group rest into "Other"
                      const top10 = fullAtc4Data.slice(0, 10);
                      const remaining = fullAtc4Data.slice(10);
                      const otherTotal = remaining.reduce((sum, item) => sum + item.value, 0);
                      const otherPrescriptions = remaining.reduce((sum, item) => sum + item.prescriptions, 0);

                      displayData = [...top10];
                      if (remaining.length > 0) {
                        displayData.push({
                          atc4: "OTHER",
                          label: "Other (≤2% each)",
                          value: otherTotal,
                          prescriptions: otherPrescriptions
                        });
                      }
                    }

                    // Apply color mapping
                    const colorMap = {
                      "J01CR": "#3b82f6", // Penicillin + β-lactamase inhibitor - blue
                      "J01CA": "#1e40af", // Penicillins, extended spectrum - darker blue
                      "J01DD": "#0891b2", // Cephalosporins, 3rd gen - teal
                      "J01DC": "#0e7490", // Cephalosporins, 2nd gen - darker teal
                      "J01DH": "#164e63", // Carbapenems - darkest teal
                      "J01MA": "#f59e0b", // Fluoroquinolones - orange
                      "J01FA": "#8b5cf6", // Macrolides - purple
                      "J01EE": "#6b7280", // Sulfonamides + trimethoprim - neutral grey
                      "J01XA": "#9ca3af", // Glycopeptides - light grey
                      "J01GB": "#6b7280", // Other aminoglycosides - neutral grey
                      "J01FF": "#9ca3af", // Lincosamides - light grey
                      "J01XE": "#6b7280", // Nitrofurans - neutral grey
                      "J01XX": "#9ca3af", // Other antibacterials - light grey
                      "J01XD": "#d97706", // Imidazoles - amber
                      "J01CE": "#2563eb", // β-lactamase-sensitive penicillins - blue variant
                      "OTHER": "#374151"  // Other (≤2%) - darkest grey
                    };

                    return displayData.map(item => ({
                      ...item,
                      color: colorMap[item.atc4] || "#6b7280"
                    }));
                  })()}
                  cx="40%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={180}
                  innerRadius={100} // ~65% inner radius
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(() => {
                    // Check if filtering by Eastern Regional Hospital
                    const isEasternRegionalHospital = regionActiveFilters.some(filter => 
                      filter.type === 'hospital' && filter.value === 'Eastern Regional Hospital'
                    );

                    let fullAtc4Data;
                    
                    if (isEasternRegionalHospital) {
                      // Real PPS data from Eastern Regional Hospital
                      fullAtc4Data = [
                        { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 31.1, prescriptions: 69 },
                        { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 14.4, prescriptions: 32 },
                        { atc4: "J01XD", label: "Imidazoles", value: 11.7, prescriptions: 26 },
                        { atc4: "J01GB", label: "Other aminoglycosides", value: 11.7, prescriptions: 26 },
                        { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 7.7, prescriptions: 17 },
                        { atc4: "J01MA", label: "Fluoroquinolones", value: 5.9, prescriptions: 13 },
                        { atc4: "J01FF", label: "Lincosamides", value: 5.0, prescriptions: 11 },
                        { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 4.1, prescriptions: 9 },
                        { atc4: "J01DH", label: "Carbapenems", value: 3.6, prescriptions: 8 },
                        { atc4: "J01CE", label: "β-lactamase-sensitive penicillins", value: 2.3, prescriptions: 5 },
                        { atc4: "OTHER", label: "All remaining ATC4 (< Top 10)", value: 2.7, prescriptions: 6 }
                      ];
                    } else {
                      // Default aggregated data across all hospitals
                      fullAtc4Data = [
                        { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 22.4, prescriptions: 5648 },
                        { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 18.7, prescriptions: 4713 },
                        { atc4: "J01MA", label: "Fluoroquinolones", value: 15.2, prescriptions: 3830 },
                        { atc4: "J01FA", label: "Macrolides", value: 12.1, prescriptions: 3049 },
                        { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 8.9, prescriptions: 2244 },
                        { atc4: "J01DH", label: "Carbapenems", value: 6.4, prescriptions: 1613 },
                        { atc4: "J01EE", label: "Sulfonamides + trimethoprim", value: 5.3, prescriptions: 1335 },
                        { atc4: "J01XA", label: "Glycopeptides", value: 2.8, prescriptions: 705 },
                        { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 2.4, prescriptions: 605 },
                        { atc4: "J01GB", label: "Other aminoglycosides", value: 1.9, prescriptions: 479 },
                        { atc4: "J01FF", label: "Lincosamides", value: 1.7, prescriptions: 428 },
                        { atc4: "J01XE", label: "Nitrofurans", value: 1.2, prescriptions: 302 },
                        { atc4: "J01XX", label: "Other antibacterials", value: 1.0, prescriptions: 252 }
                      ];
                    }

                    let displayData;
                    
                    if (isEasternRegionalHospital) {
                      // For Eastern Regional Hospital, data already includes "OTHER" category
                      displayData = fullAtc4Data;
                    } else {
                      // Keep top 10, group rest into "Other"
                      const top10 = fullAtc4Data.slice(0, 10);
                      const remaining = fullAtc4Data.slice(10);
                      const otherTotal = remaining.reduce((sum, item) => sum + item.value, 0);
                      const otherPrescriptions = remaining.reduce((sum, item) => sum + item.prescriptions, 0);

                      displayData = [...top10];
                      if (remaining.length > 0) {
                        displayData.push({
                          atc4: "OTHER",
                          label: "Other (≤2% each)",
                          value: otherTotal,
                          prescriptions: otherPrescriptions
                        });
                      }
                    }

                    const colorMap = {
                      "J01CR": "#3b82f6",
                      "J01CA": "#1e40af",
                      "J01DD": "#0891b2",
                      "J01DC": "#0e7490",
                      "J01DH": "#164e63",
                      "J01MA": "#f59e0b",
                      "J01FA": "#8b5cf6",
                      "J01EE": "#6b7280",
                      "J01XA": "#9ca3af",
                      "J01GB": "#6b7280",
                      "J01FF": "#9ca3af",
                      "J01XE": "#6b7280",
                      "J01XX": "#9ca3af",
                      "J01XD": "#d97706", // Imidazoles - amber
                      "J01CE": "#2563eb", // β-lactamase-sensitive penicillins - blue variant
                      "OTHER": "#374151"
                    };

                    return displayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colorMap[entry.atc4] || "#6b7280"} />
                    ));
                  })()}
                </Pie>
                <text x="40%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-medium fill-gray-700">
                  ATC4 Mix
                </text>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
                          <div className="text-gray-900 font-medium mb-1">
                            {data.label} — {data.atc4}
                          </div>
                          <div className="text-gray-600 text-sm mb-2">
                            {data.prescriptions.toLocaleString()} prescriptions
                          </div>
                          <div className="font-medium" style={{ color: data.color }}>
                            {data.value}% of total
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="w-80 space-y-2 py-[15px] px-[0px] py-[10px]">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Top 10 ATC4 Classes</h3>
            <div className="space-y-3">
              {(() => {
                // Use the same data calculation logic as the pie chart for dynamic legend
                const isEasternRegionalHospital = regionActiveFilters.some(filter => 
                  filter.type === 'hospital' && filter.value === 'Eastern Regional Hospital'
                );

                let fullAtc4Data;
                
                if (isEasternRegionalHospital) {
                  // Real PPS data from Eastern Regional Hospital
                  fullAtc4Data = [
                    { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 31.1, prescriptions: 69 },
                    { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 14.4, prescriptions: 32 },
                    { atc4: "J01XD", label: "Imidazoles", value: 11.7, prescriptions: 26 },
                    { atc4: "J01GB", label: "Other aminoglycosides", value: 11.7, prescriptions: 26 },
                    { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 7.7, prescriptions: 17 },
                    { atc4: "J01MA", label: "Fluoroquinolones", value: 5.9, prescriptions: 13 },
                    { atc4: "J01FF", label: "Lincosamides", value: 5.0, prescriptions: 11 },
                    { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 4.1, prescriptions: 9 },
                    { atc4: "J01DH", label: "Carbapenems", value: 3.6, prescriptions: 8 },
                    { atc4: "J01CE", label: "β-lactamase-sensitive penicillins", value: 2.3, prescriptions: 5 },
                    { atc4: "OTHER", label: "All remaining ATC4 (< Top 10)", value: 2.7, prescriptions: 6 }
                  ];
                } else {
                  // Default aggregated data across all hospitals
                  fullAtc4Data = [
                    { atc4: "J01CR", label: "Penicillin + β-lactamase inhibitor", value: 22.4, prescriptions: 5648 },
                    { atc4: "J01DD", label: "Cephalosporins, 3rd gen", value: 18.7, prescriptions: 4713 },
                    { atc4: "J01MA", label: "Fluoroquinolones", value: 15.2, prescriptions: 3830 },
                    { atc4: "J01FA", label: "Macrolides", value: 12.1, prescriptions: 3049 },
                    { atc4: "J01CA", label: "Penicillins, extended spectrum", value: 8.9, prescriptions: 2244 },
                    { atc4: "J01DH", label: "Carbapenems", value: 6.4, prescriptions: 1613 },
                    { atc4: "J01EE", label: "Sulfonamides + trimethoprim", value: 5.3, prescriptions: 1335 },
                    { atc4: "J01XA", label: "Glycopeptides", value: 2.8, prescriptions: 705 },
                    { atc4: "J01DC", label: "Cephalosporins, 2nd gen", value: 2.4, prescriptions: 605 },
                    { atc4: "J01GB", label: "Other aminoglycosides", value: 1.9, prescriptions: 479 },
                    { atc4: "J01FF", label: "Lincosamides", value: 1.7, prescriptions: 428 },
                    { atc4: "J01XE", label: "Nitrofurans", value: 1.2, prescriptions: 302 },
                    { atc4: "J01XX", label: "Other antibacterials", value: 1.0, prescriptions: 252 }
                  ];
                }

                let displayData;
                
                if (isEasternRegionalHospital) {
                  // For Eastern Regional Hospital, data already includes "OTHER" category
                  displayData = fullAtc4Data;
                } else {
                  // Keep top 10, group rest into "Other" (same as pie chart)
                  const top10 = fullAtc4Data.slice(0, 10);
                  const remaining = fullAtc4Data.slice(10);
                  const otherTotal = remaining.reduce((sum, item) => sum + item.value, 0);
                  const otherPrescriptions = remaining.reduce((sum, item) => sum + item.prescriptions, 0);

                  displayData = [...top10];
                  if (remaining.length > 0) {
                    displayData.push({
                      atc4: "OTHER",
                      label: "Other (≤2% each)",
                      value: otherTotal,
                      prescriptions: otherPrescriptions
                    });
                  }
                }

                const colorMap = {
                  "J01CR": "#3b82f6",
                  "J01CA": "#1e40af", 
                  "J01DD": "#0891b2",
                  "J01DC": "#0e7490",
                  "J01DH": "#164e63",
                  "J01MA": "#f59e0b",
                  "J01FA": "#8b5cf6",
                  "J01EE": "#6b7280",
                  "J01XA": "#9ca3af",
                  "J01GB": "#6b7280",
                  "J01FF": "#9ca3af",
                  "J01XE": "#6b7280",
                  "J01XX": "#9ca3af",
                  "J01XD": "#d97706", // Imidazoles - amber
                  "J01CE": "#2563eb", // β-lactamase-sensitive penicillins - blue variant
                  "OTHER": "#374151"
                };

                return displayData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: colorMap[item.atc4] || "#6b7280" }}
                      ></div>
                      <span className="text-gray-700 text-sm">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-gray-900 font-medium text-sm">
                      {item.value}%
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
        
        {/* Footnote */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            PPS data; excludes topical antibacterials and anti-TB drugs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}