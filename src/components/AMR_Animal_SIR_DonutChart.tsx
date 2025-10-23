import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Dummy data for animal health S/I/R distribution
const animalSIRData = [
  { name: 'Susceptible', value: 4849, percentage: 58.8, color: '#22c55e' },
  { name: 'Intermediate', value: 1237, percentage: 15.0, color: '#eab308' },
  { name: 'Resistant', value: 2161, percentage: 26.2, color: '#ef4444' }
];

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium mb-1">{data.name}</p>
        <p className="text-sm text-gray-600">
          Count: {data.value.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600">
          Percentage: {data.percentage}%
        </p>
      </div>
    );
  }
  return null;
};

export function AMR_Animal_SIR_DonutChart() {
  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-[16px]">
          Overall S/I/R Distribution
        </CardTitle>
        <p className="text-sm text-gray-600 m-[0px] text-[13px]">
          Animal health antimicrobial susceptibility overview
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-[300px] my-[30px] mx-[0px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={animalSIRData}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={150}
                  paddingAngle={1}
                  dataKey="value"
                >
                  {animalSIRData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {animalSIRData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div 
                  className="w-4 h-4 rounded-full mx-auto"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-600">
                  {item.value.toLocaleString()} ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}