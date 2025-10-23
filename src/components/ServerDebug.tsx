import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { makeServerRequest } from '../utils/supabase/client';

export function ServerDebug() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string) => {
    setLoading(true);
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const result = await makeServerRequest(endpoint);
      setTestResult(`✅ ${endpoint}:\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error(`Error testing ${endpoint}:`, error);
      setTestResult(`❌ ${endpoint}:\nError: ${error.message}\nStack: ${error.stack || 'No stack trace'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Server Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => testEndpoint('health')} 
            disabled={loading}
            size="sm"
          >
            Test Health
          </Button>
          <Button 
            onClick={() => testEndpoint('test')} 
            disabled={loading}
            size="sm"
          >
            Test Basic
          </Button>
          <Button 
            onClick={() => testEndpoint('amu-national')} 
            disabled={loading}
            size="sm"
          >
            Test AMU National
          </Button>
          <Button 
            onClick={() => testEndpoint('amu-prevalence?hospital=all')} 
            disabled={loading}
            size="sm"
          >
            Test AMU Prevalence
          </Button>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Database Setup for Real Data</h4>
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                setLoading(true);
                try {
                  const result = await makeServerRequest('setup-amu-table', {
                    method: 'POST'
                  });
                  setTestResult(`🗄️ Table Setup: ${JSON.stringify(result, null, 2)}`);
                } catch (error) {
                  setTestResult(`❌ Table Setup: ${error.message}`);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              Get Setup SQL
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Click to get SQL commands for creating the AMU patients table in Supabase. Run the SQL in your Supabase dashboard to enable real data.
          </p>
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
            <strong>Note:</strong> The system detected an existing "AMU_HH" table. It will try to use this table for real data if available.
          </div>
        </div>
        
        {loading && <p className="text-blue-600">Testing...</p>}
        
        {testResult && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-xs whitespace-pre-wrap overflow-auto">
              {testResult}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}