import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AMU_filter_topwide } from './AMU_filter_topwide';
import { useAMUFilters, AMU_FILTER_CONFIGS } from './AMU_FilterConfigs';
import { Download } from 'lucide-react';

/**
 * Example component demonstrating the new array-driven AMU_filter_topwide usage
 * This shows how to use the Hospital filter and other predefined filters
 */
export function AMU_FilterExample() {
  // Use the custom hook for array-driven filter management
  const {
    activeFilters,
    filterType,
    setFilterType,
    filterValue,
    setFilterValue,
    filterHelpers,
    configs
  } = useAMUFilters(AMU_FILTER_CONFIGS);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">AMU Dashboard with Array-Driven Filters</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => {
              console.log('Applied filters:', activeFilters);
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Example showing Hospital filter and array-driven filter configuration
        </p>
      </CardHeader>
      <CardContent>
        {/* Array-driven filter component */}
        <AMU_filter_topwide
          activeFilters={activeFilters}
          filterType={filterType}
          setFilterType={setFilterType}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          filterConfigs={configs}
          filterHelpers={filterHelpers}
          title="Filter AMU Data:"
          showActiveFilters={true}
        />

        {/* Display current filter state for debugging */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Current Filter State:</h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Selected Type:</strong> {filterType || 'None'}
            </div>
            <div>
              <strong>Selected Value:</strong> {filterValue || 'None'}
            </div>
            <div>
              <strong>Active Filters:</strong> {activeFilters.length === 0 ? 'None' : ''}
              {activeFilters.length > 0 && (
                <ul className="ml-4 mt-1">
                  {activeFilters.map((filter, index) => (
                    <li key={index} className="list-disc">
                      {filter.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Example content that would be filtered */}
        <div className="mt-6 p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Sample AMU Data</h4>
          <p className="text-sm text-gray-600">
            This area would display filtered AMU data based on the selected Hospital and other filters.
            {activeFilters.length > 0 && (
              <span className="font-medium text-blue-600">
                {' '}Currently filtered by: {activeFilters.map(f => f.label).join(', ')}
              </span>
            )}
          </p>
          
          {/* Show hospital-specific information if hospital filter is active */}
          {activeFilters.some(f => f.type === 'hospital') && (
            <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-sm text-blue-800">
                <strong>Hospital Filter Active:</strong> Data is now filtered to show results only from the selected hospital(s).
              </p>
            </div>
          )}
        </div>

        {/* Available filter types for reference */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium mb-2 text-green-800">Available Filter Types:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {configs.map((config) => (
              <div key={config.type} className="text-green-700">
                <strong>{config.label}</strong> ({config.options.length} options)
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}