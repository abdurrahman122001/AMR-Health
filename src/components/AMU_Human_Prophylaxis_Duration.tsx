import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
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

interface AMU_Human_Prophylaxis_DurationProps {
  regionFilterType?: string;
  setRegionFilterType?: (value: string) => void;
  regionFilterValue?: string;
  setRegionFilterValue?: (value: string) => void;
  regionActiveFilters?: ActiveFilter[];
  regionFilterHelpers?: FilterHelpers;
  filterTypeOptions?: FilterOption[];
  getFilterValueOptions?: (type: string) => FilterOption[];
}

export function AMU_Human_Prophylaxis_Duration({
  regionFilterType = '',
  setRegionFilterType = () => {},
  regionFilterValue = '',
  setRegionFilterValue = () => {},
  regionActiveFilters = [],
  regionFilterHelpers = { addFilter: () => {}, removeFilter: () => {}, clearAllFilters: () => {} },
  filterTypeOptions = [],
  getFilterValueOptions = () => []
}: AMU_Human_Prophylaxis_DurationProps) {
  const [viewMode, setViewMode] = useState('duration'); // 'duration', 'timing', 'procedure'
  
  // Duration distribution data (compliance with guidelines)
  const durationData = [
    { 
      category: '≤24 hours', 
      percentage: 58.3, 
      count: 4512,
      compliance: 'Optimal',
      color: '#22c55e', // green
      guideline: 'Recommended for most procedures'
    },
    { 
      category: '24-48 hours', 
      percentage: 28.7, 
      count: 2221,
      compliance: 'Acceptable',
      color: '#eab308', // yellow
      guideline: 'May be appropriate for complex cases'
    },
    { 
      category: '48-72 hours', 
      percentage: 9.1, 
      count: 704,
      compliance: 'Extended',
      color: '#f97316', // orange
      guideline: 'Requires clinical justification'
    },
    { 
      category: '&gt;72 hours', 
      percentage: 3.9, 
      count: 302,
      compliance: 'Excessive',
      color: '#ef4444', // red
      guideline: 'Not recommended - increased resistance risk'
    }
  ];

  // Timing relative to surgery
  const timingData = [
    {
      category: 'Pre-operative Only',
      percentage: 34.2,
      count: 2647,
      color: '#3b82f6',
      guideline: 'Standard for clean procedures'
    },
    {
      category: 'Pre + Intra-operative',
      percentage: 41.8,
      count: 3235,
      color: '#8b5cf6',
      guideline: 'Recommended for prolonged surgeries'
    },
    {
      category: 'Pre + Post-operative',
      percentage: 19.4,
      count: 1501,
      color: '#06b6d4',
      guideline: 'For high-risk procedures'
    },
    {
      category: 'Post-operative Only',
      percentage: 4.6,
      count: 356,
      color: '#ef4444',
      guideline: 'Not optimal timing'
    }
  ];

  // Procedure type breakdown
  const procedureData = [
    {
      procedure: 'General Surgery',
      optimal: 62.4,
      acceptable: 25.8,
      extended: 8.9,
      excessive: 2.9,
      totalCases: 2847
    },
    {
      procedure: 'Orthopedic',
      optimal: 71.2,
      acceptable: 21.3,
      extended: 5.8,
      excessive: 1.7,
      totalCases: 1934
    },
    {
      procedure: 'Cardiac',
      optimal: 45.7,
      acceptable: 38.2,
      extended: 12.4,
      excessive: 3.7,
      totalCases: 856
    },
    {
      procedure: 'Neurosurgery',
      optimal: 48.9,
      acceptable: 35.1,
      extended: 11.8,
      excessive: 4.2,
      totalCases: 674
    },
    {
      procedure: 'Obstetric/Gynecologic',
      optimal: 68.3,
      acceptable: 24.7,
      extended: 5.4,
      excessive: 1.6,
      totalCases: 1428
    }
  ];

  // Trend data over time
  const trendData = [
    { month: 'Jan 2024', optimal: 54.2, acceptable: 31.8, extended: 10.3, excessive: 3.7 },
    { month: 'Feb 2024', optimal: 56.1, acceptable: 30.4, extended: 9.8, excessive: 3.7 },
    { month: 'Mar 2024', optimal: 57.8, acceptable: 29.7, extended: 9.2, excessive: 3.3 },
    { month: 'Apr 2024', optimal: 58.9, acceptable: 28.9, extended: 8.9, excessive: 3.3 },
    { month: 'May 2024', optimal: 59.4, acceptable: 28.2, extended: 8.7, excessive: 3.7 },
    { month: 'Jun 2024', optimal: 58.3, acceptable: 28.7, extended: 9.1, excessive: 3.9 }
  ];

  const viewModeOptions = [
    { value: 'duration', label: 'Duration Distribution' },
    { value: 'timing', label: 'Timing Analysis' },
    { value: 'procedure', label: 'by Procedure Type' },
    { value: 'trend', label: 'Compliance Trends' }
  ];

  const renderChart = () => {
    switch (viewMode) {
      case 'duration':
        return (
          <div className="space-y-6">
            {/* Duration Distribution Bar Chart */}
            <div className="h-80">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Duration Distribution of Surgical Prophylaxis</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Duration', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[280px]">
                            <div className="font-medium text-sm text-gray-900 mb-2">
                              {label}
                            </div>
                            <div className="text-gray-900 text-sm mb-1">
                              {data.guideline}
                            </div>
                            <div className="text-gray-600 text-sm mb-1">
                              {data.count.toLocaleString()} cases ({data.percentage}%)
                            </div>
                            <div className="font-medium text-sm" style={{ color: data.color }}>
                              {data.compliance} Duration
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="percentage" fill="#8884d8">
                    {durationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Duration Legend */}
            <div className="grid grid-cols-2 gap-4">
              {durationData.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-4 h-4 rounded mt-0.5" style={{ backgroundColor: item.color }}></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{item.category}</div>
                    <div className="text-xs text-gray-600">{item.guideline}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.count.toLocaleString()} cases ({item.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'timing':
        return (
          <div className="space-y-6">
            {/* Timing Distribution Pie Chart */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <h3 className="text-sm font-medium text-gray-900 mb-4 text-center">
                  Timing of Prophylaxis Administration
                </h3>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={timingData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="percentage"
                        label={({ name, percentage }) => `${percentage}%`}
                      >
                        {timingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[250px]">
                                <div className="font-medium text-sm text-gray-900 mb-2">
                                  {data.category}
                                </div>
                                <div className="text-gray-900 text-sm mb-1">
                                  {data.guideline}
                                </div>
                                <div className="text-gray-600 text-sm">
                                  {data.count.toLocaleString()} cases ({data.percentage}%)
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
              </div>
            </div>

            {/* Timing Legend */}
            <div className="grid grid-cols-2 gap-4">
              {timingData.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-4 h-4 rounded mt-0.5" style={{ backgroundColor: item.color }}></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{item.category}</div>
                    <div className="text-xs text-gray-600">{item.guideline}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.count.toLocaleString()} cases ({item.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'procedure':
        return (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Duration Compliance by Procedure Type</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={procedureData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="procedure" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    label={{ value: 'Procedure Type', position: 'insideBottom', offset: 0 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                    label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[250px]">
                            <div className="font-medium text-sm text-gray-900 mb-2">
                              {label}
                            </div>
                            <div className="text-gray-600 text-sm mb-2">
                              Total Cases: {data.totalCases.toLocaleString()}
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs">
                                <span className="text-green-600">Optimal (≤24h):</span> {data.optimal}%
                              </div>
                              <div className="text-xs">
                                <span className="text-yellow-600">Acceptable (24-48h):</span> {data.acceptable}%
                              </div>
                              <div className="text-xs">
                                <span className="text-orange-600">Extended (48-72h):</span> {data.extended}%
                              </div>
                              <div className="text-xs">
                                <span className="text-red-600">Excessive (&gt;72h):</span> {data.excessive}%
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="optimal" stackId="duration" fill="#22c55e" name="≤24 hours" />
                  <Bar dataKey="acceptable" stackId="duration" fill="#eab308" name="24-48 hours" />
                  <Bar dataKey="extended" stackId="duration" fill="#f97316" name="48-72 hours" />
                  <Bar dataKey="excessive" stackId="duration" fill="#ef4444" name="&gt;72 hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Procedure Legend */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: '≤24 hours', color: '#22c55e', label: 'Optimal' },
                { name: '24-48 hours', color: '#eab308', label: 'Acceptable' },
                { name: '48-72 hours', color: '#f97316', label: 'Extended' },
                { name: '&gt;72 hours', color: '#ef4444', label: 'Excessive' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'trend':
        return (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Duration Compliance Trends (2024)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[0, 70]}
                    label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length > 0) {
                        return (
                          <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
                            <div className="font-medium text-sm text-gray-900 mb-2">{label}</div>
                            {payload.map((entry, index) => (
                              <div key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {entry.value}%
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="optimal" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    name="Optimal (≤24h)"
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="acceptable" 
                    stroke="#eab308" 
                    strokeWidth={2}
                    name="Acceptable (24-48h)"
                    dot={{ fill: '#eab308', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="extended" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    name="Extended (48-72h)"
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="excessive" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Excessive (&gt;72h)"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg font-medium">
              Duration & Timing Analysis - Surgical Prophylaxis
            </CardTitle>
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-[180px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {viewModeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log('Download Duration Analysis data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Compliance with Optimal Duration Guidelines for Surgical Prophylaxis • Total: {(7739 - (regionActiveFilters.length * 150)).toLocaleString()} procedures
        </p>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Duration Data:</h3>
            
            <div className="flex-1">
              <Select value={regionFilterType} onValueChange={setRegionFilterType}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select filter type..." />
                </SelectTrigger>
                <SelectContent>
                  {filterTypeOptions?.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  {getFilterValueOptions?.(regionFilterType)?.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={regionFilterHelpers?.addFilter}
              disabled={!regionFilterType || !regionFilterValue}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Filter
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {regionActiveFilters && regionActiveFilters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Active Filters ({regionActiveFilters.length})
              </span>
              <button
                onClick={regionFilterHelpers?.clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {regionActiveFilters?.map((filter, index) => (
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
      
      <CardContent className="pt-[0px] pr-[24px] pb-[20px] pl-[24px]">
        {renderChart()}
        
        {/* Key Insights */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-sm text-blue-900 mb-2">Key Insights</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {(durationData[0].percentage + durationData[1].percentage).toFixed(1)}% of cases follow recommended duration guidelines (≤48 hours)</li>
            <li>• Orthopedic procedures show highest compliance ({procedureData[1].optimal}% optimal duration)</li>
            <li>• {durationData[3].percentage}% of cases exceed 72 hours, increasing resistance risk</li>
            <li>• Optimal duration compliance improved {(58.3 - 54.2).toFixed(1)}% over 6 months</li>
          </ul>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Analysis based on surgical procedure data; optimal duration varies by procedure complexity and patient risk factors.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}