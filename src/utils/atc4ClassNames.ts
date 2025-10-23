/**
 * ATC4 Code to Class Name Mapping Utility
 * 
 * This utility provides a comprehensive mapping of ATC4 codes to their full class names
 * for antimicrobial surveillance reporting. ATC4 codes are 5-character codes that 
 * represent specific antimicrobial therapeutic subgroups.
 * 
 * Source: WHO ATC/DDD Index 2023
 */

export const ATC4_CLASS_NAMES: Record<string, string> = {
  // J01A - TETRACYCLINES
  'J01AA': 'Tetracyclines',
  
  // J01B - AMPHENICOLS
  'J01BA': 'Chloramphenicol and derivatives',
  
  // J01C - BETA-LACTAM ANTIBACTERIALS, PENICILLINS
  'J01CA': 'Penicillins with extended spectrum',
  'J01CE': 'Beta-lactamase sensitive penicillins',
  'J01CF': 'Beta-lactamase resistant penicillins',
  'J01CG': 'Beta-lactamase inhibitors',
  'J01CR': 'Combinations of penicillins, incl. beta-lactamase inhibitors',
  
  // J01D - OTHER BETA-LACTAM ANTIBACTERIALS
  'J01DA': 'Cephalosporins and related substances',
  'J01DB': 'First-generation cephalosporins',
  'J01DC': 'Second-generation cephalosporins',
  'J01DD': 'Third-generation cephalosporins',
  'J01DE': 'Fourth-generation cephalosporins',
  'J01DF': 'Monobactams',
  'J01DH': 'Carbapenems',
  'J01DI': 'Other cephalosporins and penems',
  
  // J01E - SULFONAMIDES AND TRIMETHOPRIM
  'J01EA': 'Trimethoprim and derivatives',
  'J01EB': 'Short-acting sulfonamides',
  'J01EC': 'Intermediate-acting sulfonamides',
  'J01ED': 'Long-acting sulfonamides',
  'J01EE': 'Combinations of sulfonamides and trimethoprim, incl. derivatives',
  
  // J01F - MACROLIDES, LINCOSAMIDES AND STREPTOGRAMINS
  'J01FA': 'Macrolides',
  'J01FF': 'Lincosamides',
  'J01FG': 'Streptogramins',
  
  // J01G - AMINOGLYCOSIDE ANTIBACTERIALS
  'J01GA': 'Streptomycins',
  'J01GB': 'Other aminoglycosides',
  
  // J01M - QUINOLONE ANTIBACTERIALS
  'J01MA': 'Fluoroquinolones',
  'J01MB': 'Other quinolones',
  
  // J01R - COMBINATIONS OF ANTIBACTERIALS
  'J01RA': 'Combinations of antibacterials',
  
  // J01X - OTHER ANTIBACTERIALS
  'J01XA': 'Glycopeptide antibacterials',
  'J01XB': 'Polymyxins',
  'J01XC': 'Steroid antibacterials',
  'J01XD': 'Imidazole derivatives',
  'J01XE': 'Nitrofuran derivatives',
  'J01XX': 'Other antibacterials',
  
  // J02 - ANTIMYCOTICS FOR SYSTEMIC USE
  'J02AA': 'Antibiotics',
  'J02AB': 'Imidazole derivatives',
  'J02AC': 'Triazole derivatives',
  'J02AX': 'Other antimycotics for systemic use',
  
  // J04 - ANTIMYCOBACTERIALS
  'J04AA': 'Aminosalicylic acid and derivatives',
  'J04AB': 'Antibiotics',
  'J04AC': 'Hydrazides',
  'J04AD': 'Thiocarbamide derivatives',
  'J04AK': 'Other antimycobacterials',
  'J04AM': 'Combinations of antimycobacterials',
  
  // J05 - ANTIVIRALS FOR SYSTEMIC USE
  'J05AA': 'Thiosemicarbazones',
  'J05AB': 'Nucleosides and nucleotides excl. reverse transcriptase inhibitors',
  'J05AC': 'Cyclic amines',
  'J05AD': 'Phosphonic acid derivatives',
  'J05AE': 'Protease inhibitors',
  'J05AF': 'Nucleoside and nucleotide reverse transcriptase inhibitors',
  'J05AG': 'Non-nucleoside reverse transcriptase inhibitors',
  'J05AH': 'Neuraminidase inhibitors',
  'J05AP': 'Antivirals for treatment of HCV infections',
  'J05AR': 'Antivirals for treatment of HIV infections, combinations',
  'J05AX': 'Other antivirals',
  
  // Additional common codes that might appear in surveillance data
  'J01': 'Antibacterials for systemic use',
  'J02': 'Antimycotics for systemic use',
  'J04': 'Antimycobacterials',
  'J05': 'Antivirals for systemic use',
  'J06': 'Immune sera and immunoglobulins',
  'J07': 'Vaccines',
};

/**
 * Get the full class name for an ATC4 code
 * @param atcCode - The ATC4 code (e.g., "J01CA")
 * @returns The full class name or the original code if not found
 */
export function getATC4ClassName(atcCode: string): string {
  if (!atcCode) return '';
  
  // First try exact match
  const exactMatch = ATC4_CLASS_NAMES[atcCode];
  if (exactMatch) return exactMatch;
  
  // If no exact match, try progressive truncation for broader categories
  // E.g., "J01CA01" -> "J01CA" -> "J01"
  const trimmedCode = atcCode.substring(0, 5); // Ensure max 5 chars for ATC4
  if (trimmedCode !== atcCode && ATC4_CLASS_NAMES[trimmedCode]) {
    return ATC4_CLASS_NAMES[trimmedCode];
  }
  
  const parentCode = atcCode.substring(0, 3);
  if (ATC4_CLASS_NAMES[parentCode]) {
    return ATC4_CLASS_NAMES[parentCode];
  }
  
  // Return original code if no match found
  return atcCode;
}

/**
 * Check if an ATC code is valid (exists in our mapping)
 * @param atcCode - The ATC code to validate
 * @returns True if the code exists in our mapping
 */
export function isValidATC4Code(atcCode: string): boolean {
  return Boolean(ATC4_CLASS_NAMES[atcCode]);
}

/**
 * Get all available ATC4 codes
 * @returns Array of all ATC4 codes in the mapping
 */
export function getAllATC4Codes(): string[] {
  return Object.keys(ATC4_CLASS_NAMES).sort();
}

/**
 * Search for ATC codes by class name (case-insensitive)
 * @param searchTerm - Term to search for in class names
 * @returns Array of matching codes and their class names
 */
export function searchATC4ByClassName(searchTerm: string): Array<{ code: string; className: string }> {
  const lowerSearchTerm = searchTerm.toLowerCase();
  return Object.entries(ATC4_CLASS_NAMES)
    .filter(([_, className]) => className.toLowerCase().includes(lowerSearchTerm))
    .map(([code, className]) => ({ code, className }));
}