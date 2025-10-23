import React from 'react';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

interface AmuFiltersProps {
  onFilterChange?: (filters: any) => void;
}

export function AmuFilters({ onFilterChange }: AmuFiltersProps) {
  return (
    <Card className="border border-gray-200 mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* PPS Round */}
          <div className="min-w-[120px]">
            <Select defaultValue="2023-q4">
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="PPS Round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023-q4">2023 Q4</SelectItem>
                <SelectItem value="2023-q3">2023 Q3</SelectItem>
                <SelectItem value="2023-q2">2023 Q2</SelectItem>
                <SelectItem value="2023-q1">2023 Q1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Region */}
          <div className="min-w-[120px]">
            <Select defaultValue="all">
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="greater-accra">Greater Accra</SelectItem>
                <SelectItem value="ashanti">Ashanti</SelectItem>
                <SelectItem value="northern">Northern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hospital */}
          <div className="min-w-[140px]">
            <Select defaultValue="all">
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Hospital" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hospitals</SelectItem>
                <SelectItem value="korle-bu">Korle-Bu TH</SelectItem>
                <SelectItem value="komfo-anokye">Komfo Anokye TH</SelectItem>
                <SelectItem value="ridge">Ridge Hospital</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ward Type */}
          <div className="min-w-[120px]">
            <Select defaultValue="all">
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Ward Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="surgical">Surgical</SelectItem>
                <SelectItem value="icu">ICU</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activity */}
          <div className="min-w-[120px]">
            <Select defaultValue="all">
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="surgical">Surgical</SelectItem>
                <SelectItem value="icu">ICU</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Age Group */}
          <div className="min-w-[120px]">
            <Select defaultValue="all">
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="0-17">0-17 years</SelectItem>
                <SelectItem value="18-64">18-64 years</SelectItem>
                <SelectItem value="65+">65+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sex */}
          <div className="min-w-[100px]">
            <Select defaultValue="all">
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Button */}
          <Button variant="outline" size="sm" className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Export GLASS CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}