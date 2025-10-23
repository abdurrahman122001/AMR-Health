import React, { useState } from 'react';

interface RegionData {
  id: string;
  name: string;
  resistanceRate: number;
  totalIsolates: number;
  facilitiesCount: number;
  description: string;
}

interface GhanaHeatmapProps {
  data: RegionData[];
  onRegionClick?: (region: RegionData) => void;
  onRegionHover?: (region: RegionData | null) => void;
}

// Alert-based color system for resistance rates
const getResistanceAlertColor = (resistanceRate: number): string => {
  if (resistanceRate < 20) {
    return '#16a34a'; // Green - Low risk
  } else if (resistanceRate < 40) {
    return '#eab308'; // Yellow - Moderate risk
  } else {
    return '#dc2626'; // Red - High risk
  }
};

const getResistanceAlertLevel = (resistanceRate: number): string => {
  if (resistanceRate < 20) return 'Low Risk';
  if (resistanceRate < 40) return 'Moderate Risk';
  return 'High Risk';
};

export function GhanaHeatmap({ data, onRegionClick, onRegionHover }: GhanaHeatmapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const handleRegionMouseEnter = (regionId: string) => {
    setHoveredRegion(regionId);
    const region = data.find(r => r.id === regionId);
    if (region && onRegionHover) {
      onRegionHover(region);
    }
  };

  const handleRegionMouseLeave = () => {
    setHoveredRegion(null);
    if (onRegionHover) {
      onRegionHover(null);
    }
  };

  const handleRegionClick = (regionId: string) => {
    const region = data.find(r => r.id === regionId);
    if (region && onRegionClick) {
      onRegionClick(region);
    }
  };

  const getRegionColor = (regionId: string) => {
    const region = data.find(r => r.id === regionId);
    if (!region) return '#e5e7eb'; // Default gray
    return getResistanceAlertColor(region.resistanceRate);
  };

  const getRegionOpacity = (regionId: string) => {
    return hoveredRegion === regionId ? 0.8 : 1;
  };

  const getRegionStroke = (regionId: string) => {
    return hoveredRegion === regionId ? '#ffffff' : '#374151';
  };
}