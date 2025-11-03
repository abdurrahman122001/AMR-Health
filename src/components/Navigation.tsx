import React, { useState } from 'react';
import { Activity, Leaf, ChevronDown, BarChart3, Pill, Dog, MessageSquare, Bell, Settings, LogOut } from 'lucide-react';
import svgPaths from '../imports/svg-3hodhsygob';

const amrSubItems = [
  {
    title: 'Human Health',
    icon: Activity,
    isActive: true,
    id: 'amr-human'
  },
  {
    title: 'Animal Health',
    icon: Dog,
    isActive: false,
    id: 'amr-animal'
  },
  {
    title: 'Environmental Health',
    icon: Leaf,
    isActive: false,
    id: 'amr-environmental'
  },
];

const amuSubItems = [
  {
    title: 'Human Health',
    icon: Activity,
    isActive: true,
    id: 'amu-human'
  },
  {
    title: 'Animal Health', 
    icon: Dog,
    isActive: false,
    id: 'amu-animal'
  },
];

interface NavigationProps {
  activeDashboard: string;
  setActiveDashboard: (dashboard: string) => void;
}

// Logo component from Figma
function Logo() {
  return (
    <div className="relative shrink-0 size-[32px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g>
          <rect fill="#2D68FE" height="32" rx="4" width="32" />
          <path d={svgPaths.p27e83100} fill="white" />
        </g>
      </svg>
    </div>
  );
}

export function Navigation({ activeDashboard, setActiveDashboard }: NavigationProps) {
  const [isAmrExpanded, setIsAmrExpanded] = useState(true);
  const [isAmuExpanded, setIsAmuExpanded] = useState(true);
  
  return (
    <div className="bg-white h-screen border-r border-gray-200 fixed left-0 top-0 w-64 overflow-hidden">
      <div className="flex flex-col items-start justify-between p-[16px] h-full">
        {/* Top Section */}
        <div className="flex flex-col gap-[12px] items-start w-full">
          {/* Logo */}
          <div className="flex flex-row items-center w-full">
            <div className="flex gap-[8px] items-center p-[4px] w-full">
              <Logo />
              <p className="font-semibold leading-[20px] text-[#324054] text-[18px]">AMR Portal</p>
            </div>
          </div>

          {/* Top Navigation Items */}
          <div className="flex flex-col gap-[8px] items-start w-full">
            {/* AMR Dashboard - Expandable */}
            <div className="w-full">
              <button
                onClick={() => setIsAmrExpanded(!isAmrExpanded)}
                className="w-full flex items-center rounded-[4px] hover:bg-gray-50 transition-colors"
              >
                <div className="flex gap-[12px] items-center p-[8px] w-full">
                  <BarChart3 className="h-4 w-4 text-[#71839B]" />
                  <p className="font-medium leading-[16px] text-[#324054] text-[13px] text-left flex-1">AMR Dashboard</p>
                  <ChevronDown className={`h-4 w-4 text-[#71839B] transition-transform ${isAmrExpanded ? '' : '-rotate-90'}`} />
                </div>
              </button>
              
              {isAmrExpanded && (
                <div className="ml-6 mt-1 flex flex-col gap-[2px]">
                  {amrSubItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeDashboard === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveDashboard(item.id)}
                        className={`w-full flex items-center rounded-[4px] hover:bg-gray-50 transition-colors ${
                          isActive ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex gap-[12px] items-center p-[8px] w-full">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-[#2D68FE]' : 'text-[#71839B]'}`} />
                          <p className={`font-medium leading-[16px] text-[13px] text-left flex-1 ${
                            isActive ? 'text-[#2D68FE]' : 'text-[#324054]'
                          }`}>
                            {item.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AMC Dashboard */}
            <button
              onClick={() => setActiveDashboard('amc')}
              className={`w-full flex items-center rounded-[4px] hover:bg-gray-50 transition-colors ${
                activeDashboard === 'amc' ? 'bg-blue-50 border-l-2 border-blue-500' : ''
              }`}
            >
              <div className="flex gap-[12px] items-center p-[8px] w-full">
                <Pill className={`h-4 w-4 ${activeDashboard === 'amc' ? 'text-[#2D68FE]' : 'text-[#71839B]'}`} />
                <p className={`font-medium leading-[16px] text-[13px] text-left flex-1 ${
                  activeDashboard === 'amc' ? 'text-[#2D68FE]' : 'text-[#324054]'
                }`}>
                  AMC Dashboard
                </p>
              </div>
            </button>

            {/* AMU Dashboard - Expandable */}
            <div className="w-full">
              <button
                onClick={() => setIsAmuExpanded(!isAmuExpanded)}
                className="w-full flex items-center rounded-[4px] hover:bg-gray-50 transition-colors"
              >
                <div className="flex gap-[12px] items-center p-[8px] w-full">
                  <Activity className="h-4 w-4 text-[#71839B]" />
                  <p className="font-medium leading-[16px] text-[#324054] text-[14px] text-left flex-1">AMU Dashboard</p>
                  <ChevronDown className={`h-4 w-4 text-[#71839B] transition-transform ${isAmuExpanded ? '' : '-rotate-90'}`} />
                </div>
              </button>
              
              {isAmuExpanded && (
                <div className="ml-6 mt-1 flex flex-col gap-[2px]">
                  {amuSubItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeDashboard === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveDashboard(item.id)}
                        className={`w-full flex items-center rounded-[4px] hover:bg-gray-50 transition-colors ${
                          isActive ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex gap-[12px] items-center p-[8px] w-full">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-[#2D68FE]' : 'text-[#71839B]'}`} />
                          <p className={`font-medium leading-[16px] text-[13px] text-left flex-1 ${
                            isActive ? 'text-[#2D68FE]' : 'text-[#324054]'
                          }`}>
                            {item.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}