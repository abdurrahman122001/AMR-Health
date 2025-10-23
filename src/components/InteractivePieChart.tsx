import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Shield, Download } from 'lucide-react';
import { FilterControls, Filter } from './FilterControls';
import { ResistanceProfileFilters, ResistanceFilter } from './ResistanceProfileFilters';
import { IsolateAnalytics } from './IsolateAnalytics';
import { HospitalAcquiredInfections } from './HospitalAcquiredInfections';
import { GhanaHeatmap } from './GhanaHeatmap';
import { AMR_Human_NAV } from './AMR_Human_NAV';
import { AMR_Human_Overview_IsolateSUM } from './AMR_Human_Overview_IsolateSUM';
import { AMR_Human_Overview_PairSUM } from './AMR_Human_Overview_PairSUM';
import { AMR_Human_Overview_MonitorSUM } from './AMR_Human_Overview_MonitorSUM';
import { AMR_Human_Resistance_Priority } from './AMR_Human_Resistance_Priority';
import { AMR_Human_Overview_Heat } from './AMR_Human_Overview_Heat';
import { AMR_Human_Overview_PriorityBars } from './AMR_Human_Overview_PriorityBars';
import { AMR_Human_Overview_PrioritySpark } from './AMR_Human_Overview_PrioritySpark';
import { AMR_Human_Demographic_AgeSUM } from './AMR_Human_Demographic_AgeSUM';
import { AMR_Human_Demographic_SexSUM } from './AMR_Human_Demographic_SexSUM';
import { AMR_Human_Demographic_GeographySUM } from './AMR_Human_Demographic_GeographySUM';
import { AMU_Human_Demograph_RSex } from './AMU_Human_Demograph_RSex';
import { AMR_Human_Demographic_AgeChart } from './AMR_Human_Demographic_AgeChart';
import { AMR_Human_Demographic_SexChart } from './AMR_Human_Demographic_SexChart';
import { AMR_Human_Demographic_GeographyChart } from './AMR_Human_Demographic_GeographyChart';
import { AMR_Human_Resistance_ViewBy } from './AMR_Human_Resistance_ViewBy';
import { AMU_Human_Overview_RMDR } from './AMU_Human_Overview_RMDR';
import { getCurrentVariation, getCurrentTotalIsolates } from './utils/isolateCountUtils';



interface DataPoint {
  name: string;
  value: number;
  color: string;
  description: string;
  organism?: string;
  antibiotic?: string;
  resistant?: number;
  total?: number;
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

const BASE_DATA_SETS = {
  isolates: [
    { name: 'Escherichia coli', value: 32, color: '#dc2626', description: 'Most common Gram-negative isolate' },
    { name: 'Klebsiella pneumoniae', value: 28, color: '#ea580c', description: 'High carbapenem resistance rates' },
    { name: 'Pseudomonas aeruginosa', value: 22, color: '#ca8a04', description: 'Intrinsic and acquired resistance' },
    { name: 'Acinetobacter baumannii', value: 12, color: '#16a34a', description: 'Multi-drug resistant pathogen' },
    { name: 'Other', value: 6, color: '#2563eb', description: 'Other bacterial isolates' }
  ],
  resistance: [
    { name: 'A. baumannii: Carbapenem', organism: 'Acinetobacter baumannii', antibiotic: 'Carbapenem', value: 65, resistant: 156, total: 240, color: getResistanceAlertColor(65), description: 'Multi-drug resistant Acinetobacter' },
    { name: 'E. coli: 3rd Gen Cephalosporins', organism: 'Escherichia coli', antibiotic: '3rd Gen Cephalosporins', value: 38, resistant: 342, total: 900, color: getResistanceAlertColor(38), description: 'ESBL-producing E. coli strains' },
    { name: 'E. coli: Carbapenem', organism: 'Escherichia coli', antibiotic: 'Carbapenem', value: 8, resistant: 72, total: 900, color: getResistanceAlertColor(8), description: 'Carbapenem-resistant E. coli' },
    { name: 'Enterococci: Vancomycin', organism: 'Enterococci', antibiotic: 'Vancomycin', value: 15, resistant: 45, total: 300, color: getResistanceAlertColor(15), description: 'Vancomycin-resistant Enterococci (VRE)' },
    { name: 'K. pneumoniae: Aminoglycosides', organism: 'Klebsiella pneumoniae', antibiotic: 'Aminoglycosides', value: 32, resistant: 192, total: 600, color: getResistanceAlertColor(32), description: 'Aminoglycoside-resistant Klebsiella' },
    { name: 'K. pneumoniae: 3rd Gen Cephalosporins', organism: 'Klebsiella pneumoniae', antibiotic: '3rd Gen Cephalosporins', value: 35, resistant: 210, total: 600, color: getResistanceAlertColor(35), description: 'ESBL-producing Klebsiella' },
    { name: 'K. pneumoniae: Carbapenem', organism: 'Klebsiella pneumoniae', antibiotic: 'Carbapenem', value: 28, resistant: 168, total: 600, color: getResistanceAlertColor(28), description: 'Carbapenem-resistant Klebsiella' },
    { name: 'K. pneumoniae: Fluoroquinolones', organism: 'Klebsiella pneumoniae', antibiotic: 'Fluoroquinolones', value: 42, resistant: 252, total: 600, color: getResistanceAlertColor(42), description: 'Fluoroquinolone-resistant Klebsiella' },
    { name: 'P. aeruginosa: Carbapenem', organism: 'Pseudomonas aeruginosa', antibiotic: 'Carbapenem', value: 25, resistant: 100, total: 400, color: getResistanceAlertColor(25), description: 'Carbapenem-resistant Pseudomonas' },
    { name: 'S. aureus: Methicillin', organism: 'Staphylococcus aureus', antibiotic: 'Methicillin', value: 45, resistant: 270, total: 600, color: getResistanceAlertColor(45), description: 'MRSA prevalence in healthcare settings' },
    { name: 'S. pneumoniae: 3rd Gen Cephalosporins', organism: 'Streptococcus pneumoniae', antibiotic: '3rd Gen Cephalosporins', value: 18, resistant: 36, total: 200, color: getResistanceAlertColor(18), description: 'Cephalosporin-resistant Pneumococcus' },
    { name: 'S. pneumoniae: Penicillin', organism: 'Streptococcus pneumoniae', antibiotic: 'Penicillin', value: 22, resistant: 44, total: 200, color: getResistanceAlertColor(22), description: 'Penicillin-resistant Pneumococcus' }
  ]
};

export function InteractivePieChart() {
  const [currentView, setCurrentView] = useState('overview');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [resistanceFilters, setResistanceFilters] = useState<ResistanceFilter[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('');

  // Get consistent variation for all data
  const variation = getCurrentVariation();
  const currentTotalIsolates = getCurrentTotalIsolates();

  // Base Ghana regions data for the heatmap
  const baseGhanaRegionsData = [
    { id: 'greater-accra', name: 'Greater Accra', resistanceRate: 42, baseTotalIsolates: 8420, facilitiesCount: 3, description: 'High population density, major referral hospitals' },
    { id: 'ashanti', name: 'Ashanti', resistanceRate: 38, baseTotalIsolates: 6200, facilitiesCount: 2, description: 'Major teaching hospital region' },
    { id: 'northern', name: 'Northern', resistanceRate: 28, baseTotalIsolates: 3800, facilitiesCount: 1, description: 'Limited healthcare infrastructure' },
    { id: 'eastern', name: 'Eastern', resistanceRate: 25, baseTotalIsolates: 2100, facilitiesCount: 1, description: 'Mixed urban-rural population' },
    { id: 'western', name: 'Western', resistanceRate: 32, baseTotalIsolates: 1950, facilitiesCount: 1, description: 'Coastal region with mining activities' },
    { id: 'central', name: 'Central', resistanceRate: 35, baseTotalIsolates: 1800, facilitiesCount: 1, description: 'Cape Coast teaching hospital region' },
    { id: 'volta', name: 'Volta', resistanceRate: 22, baseTotalIsolates: 1200, facilitiesCount: 1, description: 'Ho teaching hospital coverage' },
    { id: 'brong-ahafo', name: 'Brong Ahafo', resistanceRate: 18, baseTotalIsolates: 900, facilitiesCount: 1, description: 'Sunyani teaching hospital region' },
    { id: 'upper-east', name: 'Upper East', resistanceRate: 15, baseTotalIsolates: 650, facilitiesCount: 0, description: 'Rural region, limited surveillance' },
    { id: 'upper-west', name: 'Upper West', resistanceRate: 12, baseTotalIsolates: 380, facilitiesCount: 0, description: 'Remote region, basic healthcare' }
  ];

  // Scale Ghana regions data with current variation
  const ghanaRegionsData = useMemo(() => 
    baseGhanaRegionsData.map(region => ({
      ...region,
      totalIsolates: Math.round(region.baseTotalIsolates * variation)
    })), [variation]
  );

  // Generate data based on current filters with dynamic variations
  const currentData = useMemo(() => {
    let baseData = BASE_DATA_SETS[currentView as keyof typeof BASE_DATA_SETS] || BASE_DATA_SETS.isolates;
    
    // Apply filter-based variations to simulate real-time responsiveness
    if (filters.length > 0 || resistanceFilters.length > 0) {
      const allFilters = [...filters, ...resistanceFilters];
      baseData = baseData.map(item => {
        let adjustedValue = item.value;
        let adjustedResistant = item.resistant;
        let adjustedTotal = item.total;
        
        // Apply variations based on filter types
        allFilters.forEach(filter => {
          switch (filter.type) {
            case 'facility':
              // Different facilities have different resistance patterns
              if (filter.value === 'korle_bu' || filter.value === 'komfo_anokye') {
                adjustedValue = Math.round(adjustedValue * 1.15); // Higher resistance in major hospitals
                if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 1.15);
              } else if (filter.value === 'tamale' || filter.value === 'sunyani') {
                adjustedValue = Math.round(adjustedValue * 0.85); // Lower resistance in smaller hospitals
                if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 0.85);
              }
              break;
            case 'ward':
              // ICUs and NICUs have higher resistance rates
              if (filter.value === 'icu' || filter.value === 'nicu') {
                adjustedValue = Math.round(adjustedValue * 1.25);
                if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 1.25);
              } else if (filter.value === 'outpatient') {
                adjustedValue = Math.round(adjustedValue * 0.75);
                if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 0.75);
              }
              break;
            case 'specimen':
              // Blood cultures typically show higher resistance
              if (filter.value === 'blood' || filter.value === 'catheter') {
                adjustedValue = Math.round(adjustedValue * 1.2);
                if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 1.2);
              } else if (filter.value === 'urine') {
                adjustedValue = Math.round(adjustedValue * 0.9);
                if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 0.9);
              }
              break;
            case 'age':
              // Neonates and elderly show higher resistance
              if (filter.value === 'neonates' || filter.value === '75-84' || filter.value === '85-94') {
                adjustedValue = Math.round(adjustedValue * 1.1);
                if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 1.1);
              }
              break;
            case 'year':
              // Resistance generally increases over time
              const yearAdjustment = filter.value === '2024' ? 1.05 : 
                                   filter.value === '2023' ? 1.02 : 
                                   filter.value === '2022' ? 0.98 : 
                                   filter.value === '2021' ? 0.95 : 0.92;
              adjustedValue = Math.round(adjustedValue * yearAdjustment);
              if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * yearAdjustment);
              break;
            case 'organism':
              // Organism-specific filters for resistance profiles
              if (currentView === 'resistance-profiles' && item.organism && filter.value === item.organism) {
                adjustedValue = Math.round(adjustedValue * 1.1);
                if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 1.1);
              }
              break;
            case 'antibiotic':
              // Antibiotic-specific filters for resistance profiles
              if (currentView === 'resistance-profiles' && item.antibiotic && filter.value === item.antibiotic) {
                adjustedValue = Math.round(adjustedValue * 1.1);
                if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 1.1);
              }
              break;
          }
        });
        
        // Ensure values don't exceed 100% for resistance rates
        if (currentView === 'resistance-profiles') {
          adjustedValue = Math.min(adjustedValue, 95);
        }
        
        // Update color based on new resistance value for resistance profiles
        const newColor = currentView === 'resistance-profiles' ? 
          getResistanceAlertColor(adjustedValue) : item.color;
        
        return {
          ...item,
          value: adjustedValue,
          resistant: adjustedResistant,
          total: adjustedTotal,
          color: newColor
        };
      });
    }
    
    return baseData;
  }, [currentView, filters, resistanceFilters]);

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Calculate isolate count for isolates view
      const isolateCount = currentView === 'isolates' 
        ? Math.round((data.value / 100) * currentTotalIsolates)
        : null;
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.description}</p>
          <div className="mt-2 space-y-1">
            {currentView === 'resistance-profiles' ? (
              <>
                <p className="text-sm">Resistance Rate: <span className="font-semibold">{data.value}%</span></p>
                {data.resistant && data.total && (
                  <p className="text-sm">Resistant: {data.resistant}/{data.total} isolates</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: data.color }}
                  />
                  <span className="text-xs">
                    {data.value < 20 ? 'Low Risk' : data.value < 40 ? 'Moderate Risk' : 'High Risk'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm">Prevalence: <span className="font-semibold">{data.value}%</span></p>
                {isolateCount && (
                  <p className="text-sm">Isolates: <span className="font-semibold">{isolateCount.toLocaleString()}</span></p>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    return `${entry.value}%`;
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const handleFilterChange = (newFilters: Filter[]) => {
    setFilters(newFilters);
  };

  const handleResistanceFilterChange = (newFilters: ResistanceFilter[]) => {
    setResistanceFilters(newFilters);
  };

  // Download functions
  const downloadChart = () => {
    if (!selectedFormat) return;

    const chartTitle = currentView === 'resistance-profiles' 
      ? 'Resistance Rates for Priority Pathogen-Antibiotic Combinations'
      : 'Bacterial Isolate Distribution';
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${chartTitle.replace(/\s+/g, '_')}_${timestamp}`;

    switch (selectedFormat) {
      case 'png':
        downloadAsPNG(filename);
        break;
      case 'svg':
        downloadAsSVG(filename);
        break;
      case 'pdf':
        downloadAsPDF(filename);
        break;
      case 'csv':
        downloadAsCSV(filename);
        break;
    }
    
    setDownloadDialogOpen(false);
    setSelectedFormat('');
  };

  const downloadAsPNG = async (filename: string) => {
    const chartContainer = document.querySelector('#resistance-chart-container .recharts-wrapper') || 
                          document.querySelector('#resistance-chart-container');
    if (!chartContainer) {
      console.error('Chart container not found');
      return;
    }

    try {
      // Dynamic import of html2canvas
      const html2canvas = await import('html2canvas');
      
      const canvas = await html2canvas.default(chartContainer as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename + '.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error capturing chart as PNG:', error);
      // Fallback: Create a basic canvas with chart data
      createFallbackPNG(filename);
    }
  };

  const createFallbackPNG = (filename: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Resistance Rates for Priority Pathogen-Antibiotic Combinations', canvas.width / 2, 50);
    
    // Draw a simple bar chart with actual data
    const data = getResistanceProfileData();
    const chartArea = { x: 100, y: 100, width: canvas.width - 200, height: canvas.height - 200 };
    const barWidth = chartArea.width / data.length;
    const maxRate = Math.max(...data.map(d => d.rate));
    
    data.forEach((item, index) => {
      const barHeight = (item.rate / maxRate) * (chartArea.height - 50);
      const x = chartArea.x + index * barWidth + barWidth * 0.1;
      const y = chartArea.y + chartArea.height - barHeight - 50;
      
      // Bar
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, barWidth * 0.8, barHeight);
      
      // Rate label
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.rate}%`, x + barWidth * 0.4, y - 5);
      
      // Organism label (rotated)
      ctx.save();
      ctx.translate(x + barWidth * 0.4, chartArea.y + chartArea.height - 10);
      ctx.rotate(-Math.PI / 4);
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(item.displayName, 0, 0);
      ctx.restore();
    });
    
    // Y-axis labels
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 100; i += 20) {
      const y = chartArea.y + chartArea.height - (i / 100) * (chartArea.height - 50) - 50;
      ctx.fillText(`${i}%`, chartArea.x - 10, y + 4);
      
      // Grid line
      ctx.strokeStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.moveTo(chartArea.x, y);
      ctx.lineTo(chartArea.x + chartArea.width, y);
      ctx.stroke();
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename + '.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  const downloadAsSVG = (filename: string) => {
    // Try to find the SVG element in the chart
    const svgElement = document.querySelector('#resistance-chart-container .recharts-wrapper svg') ||
                      document.querySelector('#resistance-chart-container svg');
    
    if (svgElement) {
      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Set a white background
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', 'white');
      clonedSvg.insertBefore(rect, clonedSvg.firstChild);
      
      // Get the SVG content
      const serializer = new XMLSerializer();
      const svgContent = serializer.serializeToString(clonedSvg);
      
      // Create proper SVG with XML declaration
      const fullSvgContent = `<?xml version="1.0" encoding="UTF-8"?>\n${svgContent}`;
      
      const blob = new Blob([fullSvgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename + '.svg';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Fallback: Create SVG with chart data
      createFallbackSVG(filename);
    }
  };

  const createFallbackSVG = (filename: string) => {
    const data = getResistanceProfileData();
    const width = 1200;
    const height = 800;
    const chartArea = { x: 100, y: 100, width: width - 200, height: height - 200 };
    const barWidth = chartArea.width / data.length;
    const maxRate = Math.max(...data.map(d => d.rate));
    
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="${width/2}" y="50" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="black">Resistance Rates for Priority Pathogen-Antibiotic Combinations</text>`;

    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.rate / maxRate) * (chartArea.height - 50);
      const x = chartArea.x + index * barWidth + barWidth * 0.1;
      const y = chartArea.y + chartArea.height - barHeight - 50;
      
      svgContent += `
  <rect x="${x}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="${item.color}"/>
  <text x="${x + barWidth * 0.4}" y="${y - 5}" font-family="Arial" font-size="12" text-anchor="middle" fill="black">${item.rate}%</text>`;
    });

    // Grid lines and labels
    for (let i = 0; i <= 100; i += 20) {
      const y = chartArea.y + chartArea.height - (i / 100) * (chartArea.height - 50) - 50;
      svgContent += `
  <line x1="${chartArea.x}" y1="${y}" x2="${chartArea.x + chartArea.width}" y2="${y}" stroke="#e5e7eb"/>
  <text x="${chartArea.x - 10}" y="${y + 4}" font-family="Arial" font-size="12" text-anchor="end" fill="black">${i}%</text>`;
    }

    svgContent += '\n</svg>';
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = async (filename: string) => {
    try {
      // Dynamic import of jsPDF
      const { jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Title
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('Resistance Rates for Priority Pathogen-Antibiotic Combinations', pageWidth / 2, 20, { align: 'center' });
      
      // Chart data
      const data = getResistanceProfileData();
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      let yPosition = 40;
      pdf.text('Organism', 20, yPosition);
      pdf.text('Antibiotic', 80, yPosition);
      pdf.text('Rate', 140, yPosition);
      pdf.text('Risk Level', 170, yPosition);
      
      yPosition += 10;
      pdf.line(20, yPosition - 5, 200, yPosition - 5);
      
      data.forEach((item, index) => {
        const riskLevel = item.rate < 20 ? 'Low' : item.rate < 40 ? 'Moderate' : 'High';
        
        pdf.text(item.organism || '', 20, yPosition);
        pdf.text(item.antibiotic || '', 80, yPosition);
        pdf.text(`${item.rate}%`, 140, yPosition);
        pdf.text(riskLevel, 170, yPosition);
        
        yPosition += 8;
        
        // Add new page if needed
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
      });
      
      // Try to capture chart as image and add to PDF
      const chartContainer = document.querySelector('#resistance-chart-container .recharts-wrapper') ||
                            document.querySelector('#resistance-chart-container');
      if (chartContainer) {
        try {
          const html2canvas = await import('html2canvas');
          const canvas = await html2canvas.default(chartContainer as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 1
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
        } catch (error) {
          console.warn('Could not capture chart image for PDF:', error);
        }
      }
      
      pdf.save(filename + '.pdf');
    } catch (error) {
      console.error('Error creating PDF:', error);
      // Fallback: Create simple text-based PDF
      createFallbackPDF(filename);
    }
  };

  const createFallbackPDF = (filename: string) => {
    // Simple fallback - create a text-based report
    const data = getResistanceProfileData();
    let content = 'Resistance Rates for Priority Pathogen-Antibiotic Combinations\n\n';
    content += 'Generated: ' + new Date().toLocaleDateString() + '\n\n';
    content += 'Organism\tAntibiotic\tResistance Rate\tRisk Level\n';
    content += '='.repeat(60) + '\n';
    
    data.forEach(item => {
      const riskLevel = item.rate < 20 ? 'Low' : item.rate < 40 ? 'Moderate' : 'High';
      content += `${item.organism}\t${item.antibiotic}\t${item.rate}%\t${riskLevel}\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '_report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsCSV = (filename: string) => {
    let csvContent = '';
    
    if (currentView === 'resistance-profiles') {
      const data = getResistanceProfileData();
      csvContent = 'Organism,Antibiotic,Resistance_Rate_Percent,Risk_Level\n';
      data.forEach(item => {
        const riskLevel = item.rate < 20 ? 'Low' : item.rate < 40 ? 'Moderate' : 'High';
        csvContent += `"${item.organism}","${item.antibiotic}",${item.rate},"${riskLevel}"\n`;
      });
    } else {
      csvContent = 'Organism,Prevalence_Percent,Description\n';
      currentData.forEach(item => {
        csvContent += `"${item.name}",${item.value},"${item.description}"\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render active filter summary
  const renderActiveFilterSummary = () => {
    const allActiveFilters = [...filters, ...resistanceFilters];
    
    if (allActiveFilters.length === 0) {
      return (
        <div className="bg-muted/30 rounded-lg p-3 mb-6">
          <p className="text-sm text-muted-foreground">No filters applied - showing all data</p>
        </div>
      );
    }

    return (
      <div className="bg-muted/30 rounded-lg p-3 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Active Filters:</span>
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
            {allActiveFilters.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allActiveFilters.map((filter, index) => (
            <div key={index} className="flex items-center gap-1 bg-background border rounded px-2 py-1">
              <span className="text-xs font-medium capitalize">{filter.type}:</span>
              <span className="text-xs">{filter.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Custom legend data for risk levels
  const riskLegendData = [
    { value: 'Low Risk (<20%)', color: '#16a34a' },
    { value: 'Moderate Risk (20-39%)', color: '#eab308' },
    { value: 'High Risk (≥40%)', color: '#dc2626' }
  ];

  // Generate data for resistance profile bar chart
  const getResistanceProfileData = () => {
    const resistanceData = BASE_DATA_SETS.resistance;
    
    // Apply filter-based variations
    let processedData = resistanceData.map(item => {
      let adjustedValue = item.value;
      let adjustedResistant = item.resistant;
      
      // Apply variations based on filter types
      const allFilters = [...filters, ...resistanceFilters];
      allFilters.forEach(filter => {
        switch (filter.type) {
          case 'facility':
            if (filter.value === 'korle_bu' || filter.value === 'komfo_anokye') {
              adjustedValue = Math.min(Math.round(adjustedValue * 1.15), 95);
              if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 1.15);
            } else if (filter.value === 'tamale' || filter.value === 'sunyani') {
              adjustedValue = Math.round(adjustedValue * 0.85);
              if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 0.85);
            }
            break;
          case 'ward':
            if (filter.value === 'icu' || filter.value === 'nicu') {
              adjustedValue = Math.min(Math.round(adjustedValue * 1.25), 95);
              if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 1.25);
            } else if (filter.value === 'outpatient') {
              adjustedValue = Math.round(adjustedValue * 0.75);
              if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 0.75);
            }
            break;
          case 'specimen':
            if (filter.value === 'blood' || filter.value === 'catheter') {
              adjustedValue = Math.min(Math.round(adjustedValue * 1.2), 95);
              if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 1.2);
            } else if (filter.value === 'urine') {
              adjustedValue = Math.round(adjustedValue * 0.9);
              if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 0.9);
            }
            break;
          case 'organism':
            if (item.organism && filter.value === item.organism) {
              adjustedValue = Math.min(Math.round(adjustedValue * 1.1), 95);
              if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 1.1);
            }
            break;
          case 'antibiotic':
            if (item.antibiotic && filter.value === item.antibiotic) {
              adjustedValue = Math.min(Math.round(adjustedValue * 1.1), 95);
              if (adjustedResistant) adjustedResistant = Math.round(adjustedResistant * 1.1);
            }
            break;
        }
      });
      
      return {
        organism: item.organism || item.name.split(':')[0],
        antibiotic: item.antibiotic || item.name.split(':')[1]?.trim(),
        rate: adjustedValue,
        color: getResistanceAlertColor(adjustedValue),
        isolates: adjustedResistant || Math.round((adjustedValue / 100) * (item.total || 1000)),
        fullName: item.name,
        displayName: item.name // This will be used for the X-axis
      };
    });
    
    // Sort alphabetically by full organism-antibiotic pair name
    return processedData.sort((a, b) => a.fullName.localeCompare(b.fullName));
  };

  // Render different views based on currentView
  const renderContent = () => {
    switch (currentView) {
      
      
      
      
      
      case 'resistance-profiles':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Resistance Rates for Priority Pathogen-Antibiotic Combinations</CardTitle>
                  
                  {/* Color-Coded Risk Level Legend */}
                  <div className="flex items-center gap-8 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16a34a' }}></div>
                      <span className="text-sm">Low Resistance Risk (&lt;20%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
                      <span className="text-sm">Moderate Resistance Risk (20-39%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
                      <span className="text-sm">High Resistance Risk (≥40%)</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 relative">
                  <div id="resistance-chart-container" className="h-[550px] px-[0px] py-[16px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getResistanceProfileData()}
                        margin={{ top: 10, right: 20, left: 50, bottom: 100 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis 
                          dataKey="displayName" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          fontSize={10}
                          tick={{ fontSize: 10, fill: '#374151' }}
                          axisLine={{ stroke: '#d1d5db' }}
                          tickLine={{ stroke: '#d1d5db' }}
                        />
                        <YAxis 
                          label={{ 
                            value: 'Resistance Rate (%)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#374151', fontSize: '12px' }
                          }}
                          domain={[0, 100]}
                          ticks={[0, 20, 40, 60, 80, 100]}
                          fontSize={11}
                          tick={{ fill: '#374151' }}
                          axisLine={{ stroke: '#d1d5db' }}
                          tickLine={{ stroke: '#d1d5db' }}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const riskLevel = data.rate < 20 ? 'Low risk' : data.rate < 40 ? 'Moderate risk' : 'High risk';
                              const riskColor = getResistanceAlertColor(data.rate);
                              return (
                                <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
                                  <p className="font-semibold text-gray-900 mb-1 italic">{data.organism}</p>
                                  <p className="text-sm text-gray-600 mb-2">{data.antibiotic}</p>
                                  <p className="text-sm text-gray-900">
                                    <span className="font-semibold" style={{ color: riskColor }}>{data.rate}%</span> resistance rate <span style={{ color: riskColor }}>({riskLevel})</span>
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {data.resistant || Math.round((data.rate/100) * (data.total || 600))} resistant / {data.total || 600} total tested
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="rate" 
                          radius={[2, 2, 0, 0]}
                          stroke="none"
                        >
                          {getResistanceProfileData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Download Button */}
                  <div className="absolute bottom-4 left-4">
                    <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white border-gray-300 hover:bg-gray-50">
                          <Download className="w-4 h-4" />
                          Download Chart
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Download Chart</DialogTitle>
                          <DialogDescription>
                            Choose your preferred format to download the resistance profiles chart.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Export Format</label>
                            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select format..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="png">PNG Image (.png)</SelectItem>
                                <SelectItem value="svg">SVG Vector (.svg)</SelectItem>
                                <SelectItem value="pdf">PDF Document (.pdf)</SelectItem>
                                <SelectItem value="csv">CSV Data (.csv)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDownloadDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={downloadChart} 
                              disabled={!selectedFormat}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <div>

                <ResistanceProfileFilters
                  activeFilters={resistanceFilters}
                  onFiltersChange={handleResistanceFilterChange}
                />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Interactive Features</CardTitle>
                  <CardDescription className="text-sm">
                    Learn how to interact with the resistance profiles visualization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Hover</p>
                    <p className="text-xs text-gray-600">over bars to see detailed resistance information</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Use filters</p>
                    <p className="text-xs text-gray-600">to analyze specific populations or time periods</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Switch datasets</p>
                    <p className="text-xs text-gray-600">using the buttons above</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
    {/* Isolate Profile View */}
      case 'isolate-analytics':
        return <IsolateAnalytics />;

    {/* HAI Profile View */}
      case 'hospital-infections':
        return <HospitalAcquiredInfections />;
    
    {/* Overall AMR Profile View - DEFAULT VIEW) */}
      default:
        return (
          <div className="space-y-6">
            <FilterControls activeFilters={filters} onFiltersChange={handleFilterChange} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Bacterial Isolate Distribution</CardTitle>
                    <CardDescription>
                      Relative distribution of bacterial isolates from clinical specimens (n={currentTotalIsolates.toLocaleString()})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={currentData}
                            cx="40%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                            onMouseLeave={onPieLeave}
                            className="cursor-pointer"
                          >
                            {currentData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke={activeIndex === index ? "#333" : "none"}
                                strokeWidth={activeIndex === index ? 2 : 0}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={renderCustomTooltip} />
                          <Legend
                            verticalAlign="middle"
                            align="right"
                            layout="vertical"
                            wrapperStyle={{ paddingLeft: '20px', fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Isolates</CardTitle>
                    <CardDescription>
                      Top bacterial isolates based on current filters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentData.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <div className="text-sm font-semibold">{item.value}%</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <GhanaHeatmap data={ghanaRegionsData} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation buttons */}
      <AMR_Human_NAV currentView={currentView} setCurrentView={setCurrentView} />

      {/* Summary info card panels */}
      {currentView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-[0px] mr-[0px] mb-[24px] ml-[0px]">
          <AMR_Human_Overview_IsolateSUM />
          <AMR_Human_Overview_PairSUM />
          <AMR_Human_Overview_MonitorSUM />
        </div>
      )}
     
      {/* Single column layout below - default views */}
      {currentView === 'overview' && (
        <div className="w-full space-y-6">
          <AMR_Human_Overview_PriorityBars />
          <AMU_Human_Overview_RMDR />
          <AMR_Human_Overview_PrioritySpark />
          <AMR_Human_Overview_Heat />
          <AMR_Human_Resistance_ViewBy />
        </div>
      )}
      
      {/* Demographic Profile Summary Cards */}
      {currentView === 'demograph' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-[0px] mr-[0px] mb-[24px] ml-[0px]">
          <AMR_Human_Demographic_AgeSUM />
          <AMR_Human_Demographic_SexSUM />
          <AMR_Human_Demographic_GeographySUM />
        </div>
      )}
      
      {/* Demographic Profile Charts */}
      {currentView === 'demograph' && (
        <div className="w-full space-y-6">
          <AMU_Human_Demograph_RSex />
          <AMR_Human_Demographic_AgeChart />
          <AMR_Human_Demographic_SexChart />
          <AMR_Human_Demographic_GeographyChart />
        </div>
      )}
    </div>
  );
}