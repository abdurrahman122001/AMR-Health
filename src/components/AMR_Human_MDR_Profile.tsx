import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, Shield, TrendingUp } from 'lucide-react';

export function AMR_Human_MDR_Profile() {
  return (
    <div className="space-y-6">
      {/* MDR Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              MDR Isolates
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              4.9% of total isolates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              XDR Isolates
            </CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">389</div>
            <p className="text-xs text-muted-foreground">
              1.5% of total isolates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              PDR Isolates
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              0.2% of total isolates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MDR Patterns Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Multidrug Resistance Patterns</CardTitle>
          <CardDescription>
            Analysis of resistance patterns across key pathogen-antibiotic combinations
          </CardDescription>
        </CardHeader>
        <CardContent>

        </CardContent>
      </Card>
    </div>
  );
}