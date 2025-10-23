/**
 * Utility function to get indication name from indication code
 * Based on detailed indication categories for antimicrobial usage analysis
 */

const indicationNames: Record<string, string> = {
  // Community and Healthcare Associated Infections
  'CAI': 'Community-acquired (<48h)',
  'HAI1': 'Post-op surgical site infection',
  'HAI2': 'Device/intervention-related (CR-BSI, VAP, CA-UTI)',
  'HAI3': 'C. difficile–associated diarrhoea',
  'HAI4': 'Other hospital-acquired (incl. HAP)',
  'HAI5': 'Present on admission from another hospital',
  'HAI6': 'Present on admission from LTCF/Nursing Home',
  
  // Surgical Prophylaxis
  'SP1': 'Surgical prophylaxis: single dose',
  'SP2': 'Surgical prophylaxis: one day',
  'SP3': 'Surgical prophylaxis: >1 day',
  
  // Medical Prophylaxis
  'MP': 'Medical prophylaxis',
  
  // Other Categories
  'OTH': 'Other indication',
  'UNK': 'Unknown indication'
};

/**
 * Get indication name from indication code
 * @param code - The indication code (e.g., 'CAI', 'HAI1', 'SP1')
 * @returns The full indication name or the code itself if not found
 */
export function getIndicationName(code: string): string {
  return indicationNames[code] || code;
}

/**
 * Get all available indication codes and names
 * @returns Array of {code, name} objects
 */
export function getAllIndications(): Array<{code: string, name: string}> {
  return Object.entries(indicationNames).map(([code, name]) => ({
    code,
    name
  }));
}

/**
 * Check if an indication code exists in the mapping
 * @param code - The indication code to check
 * @returns True if the code exists, false otherwise
 */
export function isValidIndicationCode(code: string): boolean {
  return code in indicationNames;
}