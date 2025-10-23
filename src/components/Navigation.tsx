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
                className="w-full flex items-center justify-center rounded-[4px]"
              >
                <div className="flex gap-[12px] items-center justify-center p-[8px] w-full">
                  <BarChart3 className="h-4 w-4 text-[#71839B]" />
                  <p className="basis-0 font-medium grow leading-[16px] text-[#324054] text-[13px]">AMR Dashboard</p>
                  <ChevronDown className={`h-4 w-4 text-[#71839B] transition-transform ${isAmrExpanded ? '' : '-rotate-90'}`} />
                </div>
              </button>
              
              {isAmrExpanded && (
                <div className="ml-3 mt-1 flex flex-col gap-[6px]">
                  {amrSubItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeDashboard === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveDashboard(item.id)}
                        className={`w-full flex items-center justify-center rounded-[4px] ${
                          isActive ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex gap-[12px] items-center justify-center p-[8px] w-full">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-[#2D68FE]' : 'text-[#71839B]'}`} />
                          <p className={`basis-0 font-medium grow leading-[16px] text-[13px] ${
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
              className={`w-full flex items-center justify-center rounded-[4px] ${
                activeDashboard === 'amc' ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex gap-[12px] items-center justify-center p-[8px] w-full">
                <Pill className={`h-4 w-4 ${activeDashboard === 'amc' ? 'text-[#2D68FE]' : 'text-[#71839B]'}`} />
                <p className={`basis-0 font-medium grow leading-[16px] text-[13px] ${
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
                className="w-full flex items-center justify-center rounded-[4px]"
              >
                <div className="flex gap-[12px] items-center justify-center p-[8px] w-full">
                  <Activity className="h-4 w-4 text-[#71839B]" />
                  <p className="basis-0 font-medium grow leading-[16px] text-[#324054] text-[14px]">AMU Dashboard</p>
                  <ChevronDown className={`h-4 w-4 text-[#71839B] transition-transform ${isAmuExpanded ? '' : '-rotate-90'}`} />
                </div>
              </button>
              
              {isAmuExpanded && (
                <div className="ml-3 mt-1 flex flex-col gap-[6px]">
                  {amuSubItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeDashboard === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveDashboard(item.id)}
                        className={`w-full flex items-center justify-center rounded-[4px] ${
                          isActive ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex gap-[12px] items-center justify-center p-[8px] w-full">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-[#2D68FE]' : 'text-[#71839B]'}`} />
                          <p className={`basis-0 font-medium grow leading-[16px] text-[13px] ${
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

        {/* Bottom Section */}
        <div className="flex flex-col gap-[8px] items-start w-full">
          {/* Bottom Icons */}
          <div className="flex flex-col gap-[6px] items-start w-full">
            {/* Messages */}
            <button className="w-full flex items-center justify-center rounded-[4px]">
              <div className="flex gap-[12px] items-center justify-center p-[8px] w-full">
                <MessageSquare className="h-4 w-4 text-[#71839B]" />
                <p className="basis-0 font-medium grow leading-[16px] text-[#324054] text-[14px]">Messages</p>
                <div className="bg-[#ff472e] px-[5px] py-[1px] rounded-[2000px]">
                  <p className="font-normal leading-[14px] text-[11px] text-white">2</p>
                </div>
              </div>
            </button>

            {/* Notifications */}
            <button className="w-full flex items-center justify-center rounded-[4px]">
              <div className="flex gap-[12px] items-center justify-center p-[8px] w-full">
                <Bell className="h-4 w-4 text-[#71839B]" />
                <p className="basis-0 font-medium grow leading-[16px] text-[#324054] text-[14px]">Notifications</p>
                <div className="bg-[#ff472e] px-[5px] py-[1px] rounded-[2000px]">
                  <p className="font-normal leading-[14px] text-[11px] text-white">2</p>
                </div>
              </div>
            </button>

            {/* Settings */}
            <button className="w-full flex items-center justify-center rounded-[4px]">
              <div className="flex gap-[12px] items-center justify-center p-[8px] w-full">
                <Settings className="h-4 w-4 text-[#71839B]" />
                <p className="basis-0 font-medium grow leading-[16px] text-[#324054] text-[13px]">Settings</p>
              </div>
            </button>

            {/* Logout */}
            <button className="w-full flex items-center justify-center rounded-[4px]">
              <div className="flex gap-[12px] items-center justify-center p-[8px] w-full">
                <LogOut className="h-4 w-4 text-[#71839B]" />
                <p className="basis-0 font-medium grow leading-[16px] text-[#324054] text-[13px]">Logout</p>
              </div>
            </button>
          </div>

          {/* Profile */}
          <div className="w-full flex items-center justify-center border-t border-gray-200 pt-2">
            <div className="flex gap-[8px] items-center justify-center p-[8px] w-full">
              <div className="relative shrink-0 size-[32px]">
                <div className="absolute bg-white inset-0 rounded-full border border-[#d9d9d9]" />
              </div>
              <div className="basis-0 flex flex-col gap-[2px] grow items-start">
                <p className="font-normal leading-[14px] text-[#324054] text-[11px] w-full">Admin User</p>
                <p className="font-normal leading-[12px] text-[#71839b] text-[10px] w-full">admin@amr.portal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}