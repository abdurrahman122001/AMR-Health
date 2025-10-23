import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const antibioticDDDData = [
  { name: 'Doxycycline', value: 98.56 },
  { name: 'Amoxicillin', value: 51.47 },
  { name: 'Amoxicillin/Clavulanic-acid', value: 17.63 },
  { name: 'Cefuroxime', value: 16.31 },
  { name: 'Ciprofloxacin', value: 1.90 },
  { name: 'Streptomycin', value: 1.30 },
  { name: 'Clindamycin', value: 1.03 },
  { name: 'Metronidazole', value: 0.62 },
  { name: 'Clarithromycin', value: 0.60 },
  { name: 'Levofloxacin', value: 0.37 }
];

const antibioticDIDData = [
  { name: 'Doxycycline', value: 8.76 },
  { name: 'Amoxicillin', value: 4.57 },
  { name: 'Amoxicillin/Clavulanic-acid', value: 1.57 },
  { name: 'Cefuroxime', value: 1.45 },
  { name: 'Ciprofloxacin', value: 0.17 },
  { name: 'Streptomycin', value: 0.12 },
  { name: 'Clindamycin', value: 0.09 },
  { name: 'Metronidazole', value: 0.05 },
  { name: 'Clarithromycin', value: 0.05 },
  { name: 'Levofloxacin', value: 0.03 }
];

const awareData = [
  { name: 'Access', value: 65.2, color: '#22c55e' },
  { name: 'Watch', value: 28.1, color: '#f59e0b' },
  { name: 'Reserve', value: 6.7, color: '#ef4444' }
];

export function AmcCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Top 10 Antibiotics by DDD */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Top 10 Antibiotics by Total DDD</CardTitle>
        </CardHeader>
        <CardContent className="pt-[0px] pr-[50px] pb-[24px] pl-[0px] aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={antibioticDDDData} margin={{ top: 5, right: 5, left: 15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
                fontSize={11}
              />
              <YAxis 
                fontSize={11} 
                label={{ 
                  value: 'Total DDD (Millions)', 
                  angle: -90, 
                  position: 'insideLeftMiddle',
                  fontSize: 11
                }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 10 Antibiotics by DID */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Top 10 Antibiotics by DID</CardTitle>
        </CardHeader>
        <CardContent className="pt-[0px] pr-[50px] pb-[24px] pl-[0px] aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={antibioticDIDData} margin={{ top: 5, right: 5, left: 15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
                fontSize={11}
              />
              <YAxis 
                fontSize={11} 
                label={{ 
                  value: 'Total DID', 
                  angle: -90, 
                  position: 'insideLeftMiddle',
                  fontSize: 11
                }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Total DDD by AWaRE */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Total DDD by AWaRE Classification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center justify-center">
            <ResponsiveContainer width="100%" height={400} className="lg:w-1/2">
              <PieChart>
                <Pie
                  data={awareData}
                  cx="40%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {awareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="lg:w-1/2 lg:pl-8 mt-4 lg:mt-0">
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  AWaRE Classification System
                </div>
                {awareData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-3"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total DID by AWaRE */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Total DID by AWaRE Classification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center justify-center">
            <ResponsiveContainer width="100%" height={400} className="lg:w-1/2">
              <PieChart>
                <Pie
                  data={awareData}
                  cx="40%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {awareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="lg:w-1/2 lg:pl-8 mt-4 lg:mt-0">
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  AWaRE Classification System
                </div>
                {awareData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-3"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}