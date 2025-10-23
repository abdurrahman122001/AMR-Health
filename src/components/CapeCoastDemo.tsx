import React, { useState } from 'react';
import { useAMUFilters } from './AMU_FilterConfigs';
import { AMU_Human_Quality_MainV2 } from './AMU_Human_Quality_MainV2';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function CapeCoastDemo() {
  const {
    activeFilters,
    filterType,
    setFilterType,
    filterValue,
    setFilterValue,
    filterHelpers,
    configs
  } = useAMUFilters();

  // State to directly manage Cape Coast filter for demo
  const [showCapeCoast, setShowCapeCoast] = useState(false);

  // Filter type options for quality view
  const filterTypeOptions = configs.map(config => ({
    value: config.type,
    label: config.label
  }));

  // Get value options for selected filter type
  const getFilterValueOptions = (selectedType: string) => {
    const config = configs.find(c => c.type === selectedType);
    return config ? config.options : [];
  };

  // Demo radar data (will be overridden by component logic)
  const demoRadarData = [
    { subject: 'Reason in Notes', value: 83.0, target: 80 },
    { subject: 'Guideline Compliant', value: 62.0, target: 80 },
    { subject: 'Culture Taken', value: 33.0, target: 80 },
    { subject: 'Directed Therapy', value: 5.0, target: 80 },
    { subject: 'Biomarker Used', value: 53.0, target: 80 },
    { subject: 'Review Date', value: 30.0, target: 80 }
  ];

  // Create demo active filters based on state
  const demoActiveFilters = showCapeCoast ? [
    {
      type: 'hospital',
      value: 'cape_coast',
      label: 'Hospital: Cape Coast Teaching Hospital'
    }
  ] : [];

  // Quick action to show Cape Coast filter
  const addCapeCoastFilter = () => {
    setShowCapeCoast(true);
  };

  // Clear filters action
  const clearFilters = () => {
    setShowCapeCoast(false);
    filterHelpers.clearAllFilters();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cape Coast Teaching Hospital Quality Metrics Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This demo shows how the quality chart responds to hospital filter selection. 
            Click the button below to filter data for Cape Coast Teaching Hospital.
          </p>
          
          <div className="flex gap-4 items-center mb-6">
            <button
              onClick={addCapeCoastFilter}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Show Cape Coast Data
            </button>
            
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Show National Averages
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <h3 className="font-medium mb-2">Expected Cape Coast Values:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>• Reason in Notes: <span className="font-semibold">83%</span></div>
              <div>• Guideline Compliant: <span className="font-semibold">62%</span></div>
              <div>• Culture Taken: <span className="font-semibold">33%</span></div>
              <div>• Directed Therapy: <span className="font-semibold">5%</span></div>
              <div>• Biomarker Used: <span className="font-semibold">53%</span></div>
              <div>• Review Date Documented: <span className="font-semibold">30%</span></div>
            </div>
          </div>

          {(demoActiveFilters.length > 0 || activeFilters.length > 0) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
              <p className="text-green-800 font-medium">
                Active Filters: {[...demoActiveFilters, ...activeFilters].map(f => f.label).join(', ')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AMU_Human_Quality_MainV2
        qualityActiveFilters={[...demoActiveFilters, ...activeFilters]}
        qualityFilterHelpers={filterHelpers}
        qualityFilterType={filterType}
        setQualityFilterType={setFilterType}
        qualityFilterValue={filterValue}
        setQualityFilterValue={setFilterValue}
        filterTypeOptions={filterTypeOptions}
        getFilterValueOptions={getFilterValueOptions}
        radarData={demoRadarData}
      />
    </div>
  );
}