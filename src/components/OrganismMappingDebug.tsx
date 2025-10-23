import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function OrganismMappingDebug() {
  const [debugResults, setDebugResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDebug = async () => {
    setLoading(true);
    setError(null);
    setDebugResults(null);

    try {
      console.log('🔬 Running organism mapping debug...');
      
      const debugUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/debug-organism-mapping`;
      const response = await fetch(debugUrl, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Debug endpoint failed: ${response.status}`);
      }

      const data = await response.json();
      setDebugResults(data);
      
      console.log('🔬 Debug results:', data);
      
    } catch (err) {
      setError(err.message);
      console.error('❌ Debug error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔬 Organism Mapping Debug Tool
          <Button 
            onClick={runDebug} 
            disabled={loading}
            size="sm"
          >
            {loading ? 'Running...' : 'Run Debug'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {debugResults && (
          <div className="space-y-6">
            {/* Organism View Test */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                vw_amr_hh_organisms View Test
                <Badge variant={debugResults.organismView.exists ? "default" : "destructive"}>
                  {debugResults.organismView.exists ? "EXISTS" : "NOT FOUND"}
                </Badge>
              </h3>
              
              {debugResults.organismView.error && (
                <p className="text-red-600 text-sm mb-2">Error: {debugResults.organismView.error}</p>
              )}
              
              {debugResults.organismView.exists && (
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Columns found:</strong> {debugResults.organismView.columns.join(', ')}
                  </p>
                  <div>
                    <p className="text-sm font-medium">Sample data:</p>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(debugResults.organismView.sampleData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* AMR Organism Codes Test */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                AMR_HH Organism Codes Test
                <Badge variant={debugResults.amrOrganismCodes.exists ? "default" : "destructive"}>
                  {debugResults.amrOrganismCodes.exists ? "FOUND" : "NOT FOUND"}
                </Badge>
              </h3>
              
              {debugResults.amrOrganismCodes.error && (
                <p className="text-red-600 text-sm mb-2">Error: {debugResults.amrOrganismCodes.error}</p>
              )}
              
              {debugResults.amrOrganismCodes.exists && (
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Unique codes found:</strong> {debugResults.amrOrganismCodes.uniqueCodes?.length || 0}
                  </p>
                  <p className="text-sm">
                    <strong>Sample codes:</strong> {debugResults.amrOrganismCodes.uniqueCodes?.slice(0, 10).join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Mapping Test */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                Code-to-Name Mapping Test
                <Badge variant={debugResults.mapping.created ? "default" : "destructive"}>
                  {debugResults.mapping.created ? "SUCCESS" : "FAILED"}
                </Badge>
              </h3>
              
              {debugResults.mapping.error && (
                <p className="text-red-600 text-sm mb-2">Error: {debugResults.mapping.error}</p>
              )}
              
              {debugResults.mapping.created && (
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Mappings created:</strong> {debugResults.mapping.mappingCount}
                  </p>
                  
                  {debugResults.mapping.sampleMappings && (
                    <div>
                      <p className="text-sm font-medium">Sample mappings:</p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {debugResults.mapping.sampleMappings.map((mapping, idx) => (
                          <div key={idx} className="text-xs bg-blue-50 p-2 rounded">
                            <code>{mapping.code}</code> → {mapping.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {debugResults.mapping.testResults && (
                    <div>
                      <p className="text-sm font-medium">Test against actual codes:</p>
                      <div className="space-y-1 mt-1">
                        {debugResults.mapping.testResults.map((test, idx) => (
                          <div key={idx} className={`text-xs p-2 rounded ${test.hasMapping ? 'bg-green-50' : 'bg-red-50'}`}>
                            <code>{test.originalCode}</code> → {test.mappedName}
                            <Badge size="sm" variant={test.hasMapping ? "default" : "destructive"} className="ml-2">
                              {test.hasMapping ? "MAPPED" : "NO MAPPING"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}