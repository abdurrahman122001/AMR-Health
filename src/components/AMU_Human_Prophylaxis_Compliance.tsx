import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ReferenceLine, Cell } from 'recharts';
import { Download, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

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

interface AMU_Human_Prophylaxis_ComplianceProps {
  regionFilterType?: string;
  setRegionFilterType?: (value: string) => void;
  regionFilterValue?: string;
  setRegionFilterValue?: (value: string) => void;
  regionActiveFilters?: ActiveFilter[];
  regionFilterHelpers?: FilterHelpers;
  filterTypeOptions?: FilterOption[];
  getFilterValueOptions?: (type: string) => FilterOption[];
}

export function AMU_Human_Prophylaxis_Compliance({
  regionFilterType = '',
  setRegionFilterType = () => {},
  regionFilterValue = '',
  setRegionFilterValue = () => {},
  regionActiveFilters = [],
  regionFilterHelpers = { addFilter: () => {}, removeFilter: () => {}, clearAllFilters: () => {} },
  filterTypeOptions = [],
  getFilterValueOptions = () => []
}: AMU_Human_Prophylaxis_ComplianceProps) {
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'indicators', 'hospital', 'trends'
  
  // Overall compliance metrics
  const complianceOverview = [
    {
      metric: 'Overall Compliance Score',
      value: 72.4,
      target: 85.0,
      grade: 'B-',
      color: '#eab308',
      icon: AlertTriangle,
      description: 'Weighted average of all compliance indicators'
    },
    {
      metric: 'Appropriate Agent Selection',
      value: 78.6,
      target: 90.0,
      grade: 'B+',
      color: '#22c55e',
      icon: CheckCircle,
      description: 'Use of recommended first-line agents'
    },
    {
      metric: 'Optimal Duration Compliance',
      value: 58.3,
      target: 80.0,
      grade: 'C+',
      color: '#f97316',
      icon: AlertTriangle,
      description: 'Adherence to ≤24 hour duration guidelines'
    },
    {
      metric: 'Timing Appropriateness',
      value: 84.2,
      target: 95.0,
      grade: 'A-',
      color: '#22c55e',
      icon: CheckCircle,
      description: 'Pre-operative administration within 1-2 hours'
    },
    {
      metric: 'Documentation Quality',
      value: 65.7,
      target: 85.0,
      grade: 'C+',
      color: '#f97316',
      icon: AlertTriangle,
      description: 'Complete indication and duration documentation'
    },
    {
      metric: 'Guideline Adherence',
      value: 69.8,
      target: 90.0,
      grade: 'B-',
      color: '#eab308',
      icon: AlertTriangle,
      description: 'Following local/international prophylaxis guidelines'
    }
  ];

  // Radar chart data for compliance indicators
  const radarData = [
    { indicator: 'Agent Selection', value: 78.6, target: 90 },
    { indicator: 'Duration', value: 58.3, target: 80 },
    { indicator: 'Timing', value: 84.2, target: 95 },
    { indicator: 'Documentation', value: 65.7, target: 85 },
    { indicator: 'Guidelines', value: 69.8, target: 90 },
    { indicator: 'Monitoring', value: 71.2, target: 85 }
  ];

  // Hospital comparison data
  const hospitalComplianceData = [
    {
      hospital: 'Korle-Bu TH',
      overall: 76.8,
      agent: 82.1,
      duration: 62.4,
      timing: 87.3,
      documentation: 71.2,
      guidelines: 74.8,
      cases: 1247
    },
    {
      hospital: 'Komfo Anokye TH',
      overall: 74.2,
      agent: 79.6,
      duration: 59.8,
      timing: 85.7,
      documentation: 68.9,
      guidelines: 71.4,
      cases: 1034
    },
    {
      hospital: 'Cape Coast TH',
      overall: 71.5,
      agent: 76.3,
      duration: 55.2,
      timing: 82.4,
      documentation: 63.1,
      guidelines: 68.7,
      cases: 892
    },
    {
      hospital: 'Ho TH',
      overall: 69.1,
      agent: 74.8,
      duration: 52.6,
      timing: 80.3,
      documentation: 60.4,
      guidelines: 66.2,
      cases: 734
    },
    {
      hospital: 'Tamale TH',
      overall: 67.8,
      agent: 72.4,
      duration: 49.7,
      timing: 78.9,
      documentation: 58.1,
      guidelines: 64.8,
      cases: 681
    }
  ];

  // Quality score distribution
  const qualityScoreData = [
    { range: '90-100% (A)', count: 156, percentage: 12.1, color: '#22c55e' },
    { range: '80-89% (B)', count: 324, percentage: 25.2, color: '#84cc16' },
    { range: '70-79% (C)', count: 487, percentage: 37.9, color: '#eab308' },
    { range: '60-69% (D)', count: 218, percentage: 17.0, color: '#f97316' },
    { range: '&lt;60% (F)', count: 101, percentage: 7.8, color: '#ef4444' }
  ];

  const viewModeOptions = [
    { value: 'overview', label: 'Compliance Overview' },
    { value: 'indicators', label: 'Quality Indicators' },
    { value: 'hospital', label: 'Hospital Comparison' },
    { value: 'trends', label: 'Quality Distribution' }
  ];

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#22c55e';
    if (grade.startsWith('B')) return '#84cc16';
    if (grade.startsWith('C')) return '#eab308';
    if (grade.startsWith('D')) return '#f97316';
    return '#ef4444';
  };

  const renderChart = () => {
    switch (viewMode) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Compliance Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {complianceOverview.map((metric, index) => {
                const IconComponent = metric.icon;
                const progressPercentage = (metric.value / metric.target) * 100;
                
                return (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
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
          </div>
        );

      case 'indicators':
        return (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Quality Indicators Radar Analysis</h3>
            <div className="h-96 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                  <PolarGrid />
                  <PolarAngleAxis tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }}
                    tickCount={6}
                  />
                  <Radar
                    name="Current Performance"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Target"
                    dataKey="target"
                    stroke="#dc2626"
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length > 0) {
                        return (
                          <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
                            <div className="font-medium text-sm text-gray-900 mb-1">{label}</div>
                            <div className="text-blue-600 text-sm">Current: {payload[0]?.value}%</div>
                            <div className="text-red-600 text-sm">Target: {payload[1]?.value || 'N/A'}%</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend for Radar Chart */}
            <div className="flex justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-blue-500"></div>
                <span className="text-sm text-gray-700">Current Performance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-red-500 border-dashed border-t-2 border-red-500"></div>
                <span className="text-sm text-gray-700">Target</span>
              </div>
            </div>
          </div>
        );

      case 'hospital':
        return (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Hospital Compliance Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hospitalComplianceData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hospital" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                    label={{ value: 'Compliance Score (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[280px]">
                            <div className="font-medium text-sm text-gray-900 mb-2">{label}</div>
                            <div className="text-gray-600 text-sm mb-2">
                              {data.cases.toLocaleString()} procedures analyzed
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Overall Score:</span>
                                <span className="font-medium">{data.overall}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Agent Selection:</span>
                                <span>{data.agent}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Duration:</span>
                                <span>{data.duration}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Timing:</span>
                                <span>{data.timing}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Documentation:</span>
                                <span>{data.documentation}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Guidelines:</span>
                                <span>{data.guidelines}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="overall" fill="#3b82f6">
                    {hospitalComplianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.overall >= 85 ? '#22c55e' :
                        entry.overall >= 75 ? '#84cc16' :
                        entry.overall >= 65 ? '#eab308' :
                        entry.overall >= 55 ? '#f97316' : '#ef4444'
                      } />
                    ))}
                  </Bar>
                  <ReferenceLine y={85} stroke="#22c55e" strokeDasharray="5,5" label="Target: 85%" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'trends':
        return (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Quality Score Distribution</h3>
            <div className="grid grid-cols-2 gap-8">
              {/* Distribution Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualityScoreData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3">
                              <div className="font-medium text-sm text-gray-900 mb-1">{label}</div>
                              <div className="text-gray-600 text-sm">
                                {data.count} procedures ({data.percentage}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count">
                      {qualityScoreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Distribution Summary */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-900">Performance Summary</h4>
                {qualityScoreData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                      <div>
                        <div className="font-medium text-sm">{item.range}</div>
                        <div className="text-xs text-gray-600">Grade Range</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{item.count}</div>
                      <div className="text-xs text-gray-600">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
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
              Guideline Compliance Metrics - Prophylactic Use
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
              console.log('Download Compliance Metrics data');
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 m-[0px]">
          Quality Assessment Based on International & Local Prophylaxis Guidelines • {(1286 - (regionActiveFilters.length * 45)).toLocaleString()} procedures evaluated
        </p>
        
        {/* Filter Tool */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900 text-sm">Filter Compliance Data:</h3>
            
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
        
        {/* Performance Summary */}
        {viewMode === 'overview' && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-sm text-green-900 mb-2">Performance Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <div>• Overall compliance: <span className="font-medium">72.4%</span> (B- grade)</div>
                <div>• Best performance: <span className="font-medium">Timing</span> (84.2%)</div>
                <div>• Priority improvement: <span className="font-medium">Duration</span> (58.3%)</div>
              </div>
              <div>
                <div>• {((complianceOverview[0].value + complianceOverview[1].value + complianceOverview[3].value) / 3).toFixed(1)}% average for top 3 indicators</div>
                <div>• {hospitalComplianceData.filter(h => h.overall >= 75).length} hospitals above 75% compliance</div>
                <div>• {qualityScoreData[0].count + qualityScoreData[1].count} procedures (37.3%) achieving A/B grades</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Guidelines Reference */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-sm text-gray-900 mb-2">Guideline References</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• WHO Guidelines for Prevention of Surgical Site Infection (2016)</div>
            <div>• CDC/HICPAC Guidelines for Prevention of Surgical Site Infection (2017)</div>
            <div>• Ghana National Guidelines for Antimicrobial Prophylaxis (2023)</div>
            <div>• ASHP Therapeutic Guidelines on Antimicrobial Prophylaxis (2022)</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Compliance assessment based on evidence-based guidelines for surgical prophylaxis. Scores weighted by procedure complexity and patient risk factors.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}