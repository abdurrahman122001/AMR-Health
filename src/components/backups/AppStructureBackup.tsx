// APP STRUCTURE BACKUP - Current Working Version
// This file contains the complete App component structure and layout
// Last updated: Current restoration version

import image_492ad16eb6072aa5f9b5a0e930b78d688bbc540c from "figma:asset/492ad16eb6072aa5f9b5a0e930b78d688bbc540c.png";
import React, { useState } from "react";
import { InteractivePieChart } from "../InteractivePieChart";
import { Navigation } from "../Navigation";
import { SummaryCards } from "../SummaryCards";
import { AmcDashboard } from "../AmcDashboard";
import { AmuDashboard } from "../AmuDashboard";
import { SidebarProvider } from "../ui/sidebar";
import { ImageWithFallback } from "../figma/ImageWithFallback";
const gassLogo = image_492ad16eb6072aa5f9b5a0e930b78d688bbc540c;

export default function App() {
  const [activeDashboard, setActiveDashboard] =
    useState("amu-human");

  const getDashboardTitle = () => {
    switch (activeDashboard) {
      case "amc":
        return "Antimicrobial Consumption Dashboard";
      case "amu-human":
        return "Antimicrobial Use Dashboard - Human Health";
      case "amu-animal":
        return "Antimicrobial Use Dashboard - Animal Health";
      case "amu":
        return "Antimicrobial Usage Dashboard";
      default:
        return "Antimicrobial Resistance Dashboard";
    }
  };

  const getSectorInfo = () => {
    switch (activeDashboard) {
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
  return (
    <SidebarProvider>
      <div className="min-h-screen flex bg-background">
        <Navigation
          activeDashboard={activeDashboard}
          setActiveDashboard={setActiveDashboard}
        />

        <main className="flex-1 p-6">
          <div className="w-full max-w-none">
            <div className="flex items-start justify-between mb-6">
              <div className="text-left flex-1">
                <h1 className="mb-2 text-[20px] font-bold">
                  {getDashboardTitle()}
                </h1>
                <p className="text-[rgba(15,15,86,1)] font-bold text-[16px]">
                  {getSectorInfo()}
                </p>
              </div>
              <div className="flex-shrink-0 ml-8">
                <ImageWithFallback
                  src={gassLogo}
                  alt="Ghana Antimicrobial Surveillance System (GASS)"
                  className="h-15 w-15 object-contain"
                />
              </div>
            </div>

            {/* Conditional Dashboard Rendering */}
            {activeDashboard === "amr" && (
              <>
                <SummaryCards />
                <InteractivePieChart />
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
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}