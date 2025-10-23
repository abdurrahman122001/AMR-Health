// NAVIGATION BACKUP - Current Working Version
// This file contains the complete working Navigation component
// Last updated: Current restoration version

import React, { useState } from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Activity, Users, Leaf, ChevronDown, ChevronRight, BarChart3, Pill } from 'lucide-react';

const amrSubItems = [
  {
    title: 'Human Health',
    icon: Activity,
    isActive: true,
  },
  {
    title: 'Animal Health',
    icon: Users,
    isActive: false,
  },
  {
    title: 'Environmental Health',
    icon: Leaf,
    isActive: false,
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
    icon: Users,
    isActive: false,
    id: 'amu-animal'
  },
];

interface NavigationProps {
  activeDashboard: string;
  setActiveDashboard: (dashboard: string) => void;
}

export function Navigation({ activeDashboard, setActiveDashboard }: NavigationProps) {
  const [isAmrExpanded, setIsAmrExpanded] = useState(true);
  const [isAmuExpanded, setIsAmuExpanded] = useState(true);
  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-medium mb-4">
            Dashboards
          </SidebarGroupLabel>
          <SidebarMenu>
            {/* AMR Dashboard - Expandable */}
            <SidebarMenuItem>
              <Collapsible open={isAmrExpanded} onOpenChange={setIsAmrExpanded}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="w-full justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-4 w-4" />
                      <span>AMR Dashboard</span>
                    </div>
                    {isAmrExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4">
                  <SidebarMenu>
                    {amrSubItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          isActive={activeDashboard === 'amr' && item.isActive}
                          className="w-full justify-start"
                          onClick={() => setActiveDashboard('amr')}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>

            {/* AMC Dashboard */}
            <SidebarMenuItem>
              <SidebarMenuButton 
                className="w-full justify-start"
                onClick={() => setActiveDashboard('amc')}
                isActive={activeDashboard === 'amc'}
              >
                <Pill className="h-4 w-4" />
                <span>AMC Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* AMU Dashboard - Expandable */}
            <SidebarMenuItem>
              <Collapsible open={isAmuExpanded} onOpenChange={setIsAmuExpanded}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="w-full justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4" />
                      <span>AMU Dashboard</span>
                    </div>
                    {isAmuExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4">
                  <SidebarMenu>
                    {amuSubItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          isActive={activeDashboard === item.id}
                          className="w-full justify-start"
                          onClick={() => setActiveDashboard(item.id)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}