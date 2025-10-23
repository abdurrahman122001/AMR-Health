# AMU Charts Backup Instructions

## Purpose
These backup files preserve the working implementations of the Prevalence and ATC4 Profile views before adding AWaRe Profile and Indications views.

## Backup Files Created

### 1. PrevalenceViewBackup.tsx
- Contains the complete Prevalence view implementation
- Includes all 6 charts with filtering functionality
- Full filter system with active filter displays
- Interactive tooltips and responsive design

### 2. ATC4ProfileViewBackup.tsx  
- Contains the complete ATC4 Profile view implementation
- Includes all 3 charts: ATC4 distribution, top agents table, indication breakdown
- Proper legends and styling

### 3. AmuChartsCompleteBackup.tsx
- Placeholder for complete AmuCharts.tsx backup
- Should be populated with the full working file when needed

## How to Restore Views

### If Prevalence View Gets Deleted/Broken:
1. Open `/components/backups/PrevalenceViewBackup.tsx`
2. Copy the complete implementation
3. Replace the prevalence view section in AmuCharts.tsx with this backup
4. Ensure all imports and data constants are included

### If ATC4 Profile View Gets Deleted/Broken:
1. Open `/components/backups/ATC4ProfileViewBackup.tsx`  
2. Copy the complete implementation
3. Replace the ATC4 profile view section in AmuCharts.tsx with this backup
4. Ensure all imports and data constants are included

### If Complete File Gets Corrupted:
1. Copy your current working AmuCharts.tsx to AmuChartsCompleteBackup.tsx first
2. Use that as the master backup for full restoration

## Key Components Preserved

### Prevalence View Features:
- Time series bar chart with quarter/year labels
- Regional distribution horizontal bar chart
- Hospital prevalence chart
- Ward analysis chart  
- PPS data line chart
- Hospital ward breakdown chart
- Complete filter system for each chart
- Active filter tags with remove functionality
- Risk level color coding in tooltips

### ATC4 Profile View Features:
- Stacked bar chart showing ATC4 class distribution by hospital
- Top antimicrobial agents table with AWaRe classifications
- ATC4 breakdown by indication type
- Color-coded legends
- Proper responsive design

## Data Structure Preserved
All data constants are preserved including:
- timeSeriesData (2023-2025 quarterly data)
- regionData (Ghana's 16 regions)
- hospitalData (10 major hospitals)
- wardData (8 ward types)
- hospitalWardData (11 specific ward abbreviations)
- atc4Data (ATC4 class distributions)
- topAgentsData (top antimicrobial agents)
- indicationData (indication distributions)

## Filter System Preserved
Complete filter infrastructure including:
- Filter type/value selection dropdowns
- Active filter display with tags
- Filter helper functions
- Clear all functionality
- Individual filter removal

## Usage Notes
- These backups represent the last known working state
- Always test restored functionality thoroughly
- Update the complete backup when making successful changes
- Keep these files as reference implementations

## Restoration Steps
1. Identify which view is broken
2. Locate the corresponding backup file
3. Copy the implementation code
4. Replace the broken section in AmuCharts.tsx
5. Test all functionality
6. Update the complete backup if restoration is successful

Created: [Current Date]
Last Updated: [Current Date]