import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function AMU_Human_MISC_ATCxAWARE() {
  // Colors for AWaRe categories
  const COLORS = {
    access: '#16a34a',
    watch: '#eab308', 
    reserve: '#dc2626'
  };

  return (
    <Card className="border border-gray-200 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-medium">ATC4 Classes vs AWaRe Classification</CardTitle>
        <p className="text-sm text-gray-600 m-[0px]">Distribution matrix showing ATC4 classes mapped to WHO AWaRe categories</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ATC4 Distribution */}
          <div>
            <h4 className="font-medium mb-4">ATC4 Class Distribution</h4>
            <div className="space-y-3">
              {[
                { class: 'Penicillins', value: 25.4, color: '#3b82f6' },
                { class: 'Others', value: 28.3, color: '#6b7280' },
                { class: 'Cephalosporins', value: 18.8, color: '#10b981' },
                { class: 'Quinolones', value: 15.6, color: '#f59e0b' },
                { class: 'Macrolides', value: 11.9, color: '#8b5cf6' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm">{item.class}</span>
                  </div>
                  <span className="font-medium text-sm">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* AWaRe Distribution */}
          <div>
            <h4 className="font-medium mb-4">WHO AWaRe Classification</h4>
            <div className="space-y-3">
              {[
                { category: 'Access', value: 62.6, color: COLORS.access, desc: 'First-line antibiotics' },
                { category: 'Watch', value: 31.4, color: COLORS.watch, desc: 'Second-line antibiotics' },
                { category: 'Reserve', value: 6.0, color: COLORS.reserve, desc: 'Last-resort antibiotics' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="text-xs text-gray-500">{item.desc}</span>
                    </div>
                  </div>
                  <span className="font-medium text-sm">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}