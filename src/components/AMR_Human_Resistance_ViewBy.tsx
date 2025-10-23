import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function AMR_Human_Resistance_ViewBy() {
  const [selectedCategory, setSelectedCategory] = useState('SEX');
  const [resistanceData, setResistanceData] = useState({});
  const [loading, setLoading] = useState(false);

  // Dynamic filter value options - populated from database
  const [filterValueOptions, setFilterValueOptions] = useState({
    SEX: [],
    AGE_CAT: [],
    PAT_TYPE: [],
    INSTITUTION: [],
    DEPARTMENT: [],
    WARD_TYPE: [],
    YEAR_SPEC: [],
    X_REGION: [],
    ORGANISM: []
  });

  // Load filter options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      for (const filterType of ['SEX', 'AGE_CAT', 'PAT_TYPE', 'INSTITUTION', 'DEPARTMENT', 'WARD_TYPE', 'YEAR_SPEC', 'X_REGION', 'ORGANISM']) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-filter-options?column=${filterType}`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.options) {
              setFilterValueOptions(prev => ({
                ...prev,
                [filterType]: data.options
              }));
            }
          }
        } catch (error) {
          console.error(`Error loading filter options for ${filterType}:`, error);
        }
      }
    };
    
    loadFilterOptions();
  }, []);

  // Generate mock data based on selected category
  const generateMockDataForCategory = (category) => {
    const options = filterValueOptions[category] || [];
    if (options.length === 0) {
      // Fallback data while loading
      return [
        { name: 'Loading...', resistance: 0, isolates: 0, trend: 'stable' }
      ];
    }

    return options.slice(0, 8).map((option, index) => ({
      name: option,
      resistance: Math.round((Math.random() * 60 + 10) * 10) / 10, // 10-70% resistance
      isolates: Math.floor(Math.random() * 5000 + 500), // 500-5500 isolates
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)]
    }));
  };

  const currentData = useMemo(() => {
    return generateMockDataForCategory(selectedCategory);
  }, [selectedCategory, filterValueOptions]);

  const getColorByResistance = (resistance) => {
    if (resistance >= 40) return '#ef4444'; // Red for high resistance
    if (resistance >= 20) return '#f59e0b'; // Yellow/amber for moderate resistance
    return '#10b981'; // Green for low resistance
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  // Standardized filter options across all AMR/AMU components
  const categoryOptions = [
    { value: 'SEX', label: 'Sex' },
    { value: 'AGE_CAT', label: 'Age Category' },
    { value: 'PAT_TYPE', label: 'Patient Type' },
    { value: 'INSTITUTION', label: 'Institution' },
    { value: 'DEPARTMENT', label: 'Department' },
    { value: 'WARD_TYPE', label: 'Ward Type' },
    { value: 'YEAR_SPEC', label: 'Year Specimen Collected' },
    { value: 'X_REGION', label: 'Region' },
    { value: 'ORGANISM', label: 'Organism' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            Resistance: <span className="font-medium">{data.resistance}%</span>
          </p>
          <p className="text-sm text-gray-600">
            Isolates: <span className="font-medium">{data.isolates?.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resistance by Category</CardTitle>
            <CardDescription>
              % Resistance across different categories with resistance level indicators
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Resistance level legend */}
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Low (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Moderate (20-39%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">High (≥40%)</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Resistance (%)', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="resistance" radius={[4, 4, 0, 0]}>
                {currentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorByResistance(entry.resistance)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-600">Average Resistance</p>
            <p className="text-lg font-medium">
              {(currentData.reduce((sum, item) => sum + item.resistance, 0) / currentData.length).toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Isolates</p>
            <p className="text-lg font-medium">
              {currentData.reduce((sum, item) => sum + (item.isolates || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">High Risk (≥40%)</p>
            <p className="text-lg font-medium text-red-500">
              {currentData.filter(item => item.resistance >= 40).length}/{currentData.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Categories</p>
            <p className="text-lg font-medium">
              {currentData.length}
            </p>
          </div>
        </div>
        
        {/* Trending indicators */}

      </CardContent>
    </Card>
  );
}