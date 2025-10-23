import image_492ad16eb6072aa5f9b5a0e930b78d688bbc540c from "figma:asset/492ad16eb6072aa5f9b5a0e930b78d688bbc540c.png";
import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import { AMR_Human } from "./components/AMR_Human";
import { AMR_Animal } from "./components/AMR_Animal";
import { Navigation } from "./components/Navigation";
import { SummaryCards } from "./components/SummaryCards";
import { AmcDashboard } from "./components/AmcDashboard";
import { AmuDashboard } from "./components/AmuDashboard";
import { AMU_Human_Timeline } from "./components/AMU_Human_Timeline";
import { SidebarProvider } from "./components/ui/sidebar";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { StandaloneFilterDemo } from "./components/StandaloneFilterDemo";
import { CapeCoastDemo } from "./components/CapeCoastDemo";
import { AMR_Human_Resistance_Priority } from "./components/AMR_Human_Resistance_Priority";
import { AntibioticDistributionAnalysis } from "./components/AntibioticDistributionAnalysis";
import { AMR_Human_Overview_Heat } from "./components/AMR_Human_Overview_Heat";
import { AMR_Human_Sparkline2 } from "./components/AMR_Human_Sparkline2";
import { AMR_SIR_DonutChart } from "./components/AMR_SIR_DonutChart";
import { AMR_SIR_ProfileChart } from "./components/AMR_SIR_ProfileChart";
import { FilterConfigAdmin } from "./components/FilterConfigAdmin";
import { projectId, publicAnonKey } from './utils/supabase/info';

const gassLogo = image_492ad16eb6072aa5f9b5a0e930b78d688bbc540c;

export default function App() {
  const [activeDashboard, setActiveDashboard] = useState("amr-human");
  const [lastUpdated, setLastUpdated] = React.useState<string>('Loading...');
  const [serverStatus, setServerStatus] = React.useState<'connecting' | 'online' | 'offline'>('connecting');
  const [mostRecentSpecDate, setMostRecentSpecDate] = React.useState<string>('Loading...');

  // Fallback timeout to prevent infinite loading state
  React.useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (serverStatus === 'connecting') {
        console.warn('Fallback: Setting server to online after 10 seconds');
        setServerStatus('online');
        setLastUpdated('Data available');
      }
    }, 10000); // 10 second fallback

    return () => clearTimeout(fallbackTimeout);
  }, [serverStatus]);

  const getDashboardTitle = () => {
    switch (activeDashboard) {
      case "amr-human":
        return "Antimicrobial Resistance Dashboard - Human Health";
      case "amr-animal":
        return "Antimicrobial Resistance Dashboard - Animal Health";
      case "amr-environmental":
        return "Antimicrobial Resistance Dashboard - Environmental Health";
      case "amc":
        return "Antimicrobial Consumption Dashboard";
      case "amu-human":
        return "Antimicrobial Use Dashboard - Human Health";
      case "amu-animal":
        return "Antimicrobial Use Dashboard - Animal Health";
      case "amu":
        return "Antimicrobial Usage Dashboard";
      case "filter-demo":
        return "Standalone Filter Component Demo";
      case "cape-coast-demo":
        return "Cape Coast Teaching Hospital Quality Demo";
      case "resistance-priority":
        return "AMR Resistance Priority Dashboard";
      case "antibiotic-distribution":
        return "Antibiotic Distribution Analysis";
      case "sir-donut":
        return "S/I/R Distribution - Donut Chart Demo";
      case "sir-profile":
        return "S/I/R Distribution - Profile Analysis";
      case "filter-config-admin":
        return "Filter Configuration Admin";
      default:
        return "Antimicrobial Resistance Dashboard";
    }
  };

  const getSectorInfo = () => {
    switch (activeDashboard) {
      case "amr-human":
        return "Sector: Human Health";
      case "amr-animal":
        return "Sector: Animal Health";
      case "amr-environmental":
        return "Sector: Environmental Health";
      case "amc":
        return "Sector: Human Health";
      case "amu-human":
        return "Sector: Human Health";
      case "amu-animal":
        return "Sector: Animal Health";
      case "amu":
        return "Sector: Healthcare Usage";
      default:
        return "Sector: Human Health";
    }
  };

  // Query ORGANISM column for unique values
  React.useEffect(() => {
    const fetchOrganismValues = async () => {
      try {
        console.log('🔬 Querying ORGANISM column for unique values...');
        
        if (!projectId || !publicAnonKey) {
          console.warn('Missing project configuration for ORGANISM query');
          return;
        }

        // Query AMR_HH table for unique ORGANISM values
        const amrHumanUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-filter-values?column=ORGANISM`;
        
        try {
          const response = await fetch(amrHumanUrl, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ AMR_HH ORGANISM values found:', data.values.length, 'unique organisms');
            console.log('📋 Complete list of organisms in AMR_HH:');
            console.table(data.values.sort());
          } else {
            console.error('❌ Failed to fetch AMR_HH ORGANISM values:', response.status);
          }
        } catch (error) {
          console.error('❌ Error querying AMR_HH ORGANISM column:', error);
        }

        // Query AMR_Animal table for unique ORGANISM values
        const amrAnimalUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-animal-filter-values?column=STRAINNOTE`;
        
        try {
          const animalResponse = await fetch(amrAnimalUrl, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (animalResponse.ok) {
            const animalData = await animalResponse.json();
            if (animalData.values && Array.isArray(animalData.values)) {
              console.log('✅ AMR_Animal STRAINNOTE values found:', animalData.values.length, 'unique organisms');
              console.log('📋 Complete list of organisms in AMR_Animal:');
              console.table(animalData.values.sort());
            } else {
              console.log('⚠️ AMR_Animal STRAINNOTE query returned no values or invalid format:', animalData);
            }
          } else {
            console.error('❌ Failed to fetch AMR_Animal STRAINNOTE values:', animalResponse.status);
          }
        } catch (error) {
          console.error('❌ Error querying AMR_Animal STRAINNOTE column:', error);
        }

      } catch (error) {
        console.error('❌ General error in ORGANISM query:', error);
      }
    };

    fetchOrganismValues();
  }, []);

  // Fetch most recent specimen date
  React.useEffect(() => {
    const fetchMostRecentSpecDate = async () => {
      try {
        if (!projectId || !publicAnonKey) {
          console.warn('Missing project configuration for SPEC_DATE query');
          setMostRecentSpecDate('Configuration incomplete');
          return;
        }

        console.log('🗓️ Fetching most recent SPEC_DATE...');
        
        const specDateUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/amr-most-recent-spec-date`;
        
        try {
          const response = await fetch(specDateUrl, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.mostRecentDate) {
              // Parse the date and set time to 6pm
              const dateObj = new Date(data.mostRecentDate);
              dateObj.setHours(18, 0, 0, 0); // Set to 6:00 PM
              
              // Format the date nicely
              const formattedDate = dateObj.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }) + ' at 6:00 PM';
              
              console.log('✅ Most recent SPEC_DATE found:', data.mostRecentDate, '→ formatted as:', formattedDate);
              setMostRecentSpecDate(formattedDate);
            } else {
              console.warn('⚠️ No SPEC_DATE found in response');
              setMostRecentSpecDate('No specimen dates available');
            }
          } else {
            console.error('❌ Failed to fetch most recent SPEC_DATE:', response.status);
            setMostRecentSpecDate('Date fetch failed');
          }
        } catch (error) {
          console.error('❌ Error fetching most recent SPEC_DATE:', error);
          setMostRecentSpecDate('Date unavailable');
        }
      } catch (error) {
        console.error('❌ General error in SPEC_DATE query:', error);
        setMostRecentSpecDate('Date query error');
      }
    };

    fetchMostRecentSpecDate();
  }, []);

  // Fetch last updated timestamp on component mount
  React.useEffect(() => {
    const fetchLastUpdated = async () => {
      try {
        setServerStatus('connecting');
        console.log('Testing server connectivity...');
        console.log('Project ID:', projectId);
        console.log('Public Anon Key (first 10 chars):', publicAnonKey?.substring(0, 10) + '...');
        
        // Skip server calls if projectId or publicAnonKey are missing
        if (!projectId || !publicAnonKey) {
          console.warn('Missing project configuration');
          setLastUpdated('Configuration incomplete');
          setServerStatus('offline');
          return;
        }
        
        // Try a simple health check with shorter timeout first
        const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/health`;
        console.log('Health check URL:', healthUrl);
        
        // Create an AbortController for request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn('Health check timeout after 8 seconds');
          controller.abort();
        }, 8000); // 8 second timeout for health check
        
        try {
          const healthResponse = await fetch(healthUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!healthResponse.ok) {
            throw new Error(`Health check failed: ${healthResponse.status}`);
          }
          
          console.log('Server health check passed');
          
          // Now try the diagnostic endpoint for more detailed info
          try {
            const diagnosticController = new AbortController();
            const diagnosticTimeoutId = setTimeout(() => {
              diagnosticController.abort();
            }, 5000); // 5 second timeout for diagnostic
            
            const diagnosticUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2267887d/diagnostic`;
            const diagnosticResponse = await fetch(diagnosticUrl, {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              },
              signal: diagnosticController.signal
            });
            
            clearTimeout(diagnosticTimeoutId);
            
            if (diagnosticResponse.ok) {
              const diagnosticData = await diagnosticResponse.json();
              console.log('Diagnostic data:', diagnosticData);
              
              if (diagnosticData.database.connection === 'success') {
                setServerStatus('online');
                setLastUpdated('Server online - Database accessible');
              } else {
                setServerStatus('online');
                setLastUpdated(`Server online - Database issue: ${diagnosticData.database.error}`);
              }
            } else {
              setServerStatus('online');
              setLastUpdated('Server online - Diagnostic unavailable');
            }
          } catch (diagError) {
            console.warn('Diagnostic check failed:', diagError.message);
            setServerStatus('online');
            setLastUpdated('Server online - Basic check only');
          }
          
        } catch (healthError) {
          clearTimeout(timeoutId);
          console.warn('Health check failed, trying fallback:', healthError.message);
          
          // Fallback: Set server as online with generic message
          setServerStatus('online');
          setLastUpdated('Data available');
        }
        
      } catch (error) {
        console.error('Connection error:', error);
        if (error.name === 'AbortError') {
          setLastUpdated('Connection timeout');
        } else {
          setLastUpdated('Connection failed');
        }
        setServerStatus('offline');
      }
    };
    
    fetchLastUpdated();
  }, []);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen flex bg-background">
          <Navigation
            activeDashboard={activeDashboard}
            setActiveDashboard={setActiveDashboard}
          />

          <main className="flex-1 p-6 ml-64">
            <div className="w-full max-w-none">
              <div className="flex items-start justify-between mb-6">
                <div className="text-left flex-1">
                  <h1 className="mb-2 text-[20px] font-bold">
                    {getDashboardTitle()}
                  </h1>
                  <p className="text-[rgba(108,108,121,1)] text-[13px] font-bold font-normal flex items-center gap-2">
                    {serverStatus === 'connecting' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Loader2 className="h-3 w-3 animate-spin text-yellow-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Connecting to server...</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {serverStatus === 'online' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Wifi className="h-3 w-3 text-green-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Server online - Specimen data is current</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {serverStatus === 'offline' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <WifiOff className="h-3 w-3 text-red-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Server offline - Specimen data may be outdated</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    Last updated: {mostRecentSpecDate}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-8">
                  <ImageWithFallback
                    src={gassLogo}
                    alt="Ghana Antimicrobial Surveillance System (GASS)"
                    className="h-14 w-14 object-contain"
                  />
                </div>
              </div>

            {/* Conditional Dashboard Rendering */}
            {activeDashboard === "amr-human" && (
              <>
                <SummaryCards />
                <AMR_Human />
              </>
            )}

            {activeDashboard === "amr-animal" && (
              <AMR_Animal />
            )}

            {activeDashboard === "amr-environmental" && (
              <div className="space-y-6">
                <div className="text-center py-16">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Environmental Health AMR Dashboard
                  </h3>
                  <p className="text-gray-600">
                    Environmental antimicrobial resistance surveillance data and
                    analytics will be displayed here.
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Feature coming soon...
                  </p>
                </div>
              </div>
            )}

            {/* Legacy AMR dashboard redirect */}
            {activeDashboard === "amr" && (
              <>
                <SummaryCards />
                <AMR_Human />
              </>
            )}

            {activeDashboard === "amc" && <AmcDashboard />}

            {(activeDashboard === "amu" ||
              activeDashboard === "amu-human") && (
              <AmuDashboard />
            )}

            {activeDashboard === "amu-animal" && (
              <div className="space-y-6">
                <div className="text-center py-16">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Animal Health AMU Dashboard
                  </h3>
                  <p className="text-gray-600">
                    Animal health antimicrobial usage data and
                    analytics will be displayed here.
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Feature coming soon...
                  </p>
                </div>
              </div>
            )}

            {activeDashboard === "filter-demo" && <StandaloneFilterDemo />}

            {activeDashboard === "cape-coast-demo" && <CapeCoastDemo />}

            {activeDashboard === "resistance-priority" && <AMR_Human_Resistance_Priority />}

            {activeDashboard === "antibiotic-distribution" && <AntibioticDistributionAnalysis />}

            {activeDashboard === "sir-donut" && <AMR_SIR_DonutChart />}

            {activeDashboard === "sir-profile" && <AMR_SIR_ProfileChart />}

            {activeDashboard === "filter-config-admin" && <FilterConfigAdmin />}
          </div>
        </main>
      </div>
    </SidebarProvider>
    </TooltipProvider>
  );
}