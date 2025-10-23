/**
 * ESBL Phenotype Filtering Utilities
 * 
 * Purpose: Hide irrelevant β-lactam antibiotics for organisms where ESBL phenotype is clinically relevant
 * to avoid misleading insights in resistance surveillance dashboards.
 */

// ESBL-producing organisms (Enterobacterales)
const ESBL_ORGANISMS = [
  'eco',   // Escherichia coli
  'kpn',   // Klebsiella pneumoniae
  'kox',   // Klebsiella oxytoca
  'pmi',   // Proteus mirabilis
  'pvu',   // Proteus vulgaris
  'prv',   // Providencia spp.
  'pst',   // Providencia stuartii
  'mmo',   // Morganella morganii
  'ecl',   // Enterobacter cloacae complex
  'eae',   // (Klebsiella) aerogenes
  'cfr',   // Citrobacter freundii
  'sma'    // Serratia marcescens
];

// Penicillins & BL/BLI combinations to exclude for ESBL organisms
// Note: These patterns match both short codes (AMP) and database column names (AMP_ND10)
const ESBL_EXCLUDED_PENICILLINS = [
  // Penicillins
  'AMP',   // Ampicillin (matches AMP_ND10)
  'AMX',   // Amoxicillin (matches AMX_ND30)
  'PIP',   // Piperacillin
  'TIC',   // Ticarcillin
  'PEN',   // Penicillin G (matches PEN_ND10)
  'PNV',   // Penicillin V (matches PNV_ND10)
  
  // Beta-lactam/Beta-lactamase inhibitor combinations
  'AMC',   // Amoxicillin-clavulanate (matches AMC_ND20)
  'SAM',   // Ampicillin-sulbactam
  'TIM',   // Ticarcillin-clavulanate
  'TZP',   // Piperacillin-tazobactam (matches TZP_ND100)
];

// Cephalosporins (all generations) and cephamycins to exclude for ESBL organisms
const ESBL_EXCLUDED_CEPHALOSPORINS = [
  // 1st generation
  'CEF',   // Cefazolin
  'LEX',   // Cephalexin (matches LEX_ND30)
  'CLO',   // Cloxacillin (matches CLO_ND5)
  'FLC',   // Flucloxacillin (matches FLC_ND)
  
  // 2nd generation
  'CXM',   // Cefuroxime (matches CXM_ND30)
  'FOX',   // Cefoxitin (matches FOX_ND30)
  'CTT',   // Cefotetan
  
  // 3rd generation
  'CTX',   // Cefotaxime (matches CTX_ND30)
  'CRO',   // Ceftriaxone (matches CRO_ND30)
  'CAZ',   // Ceftazidime (matches CAZ_ND30)
  'CFM',   // Cefixime
  'CPD',   // Cefpodoxime
  'CDR',   // Cefdinir
  'CZX',   // Ceftizoxime
  'CTB',   // Ceftibuten
  'CDD',   // Cefditoren
  
  // 4th generation
  'FEP',   // Cefepime (matches FEP_ND30)
];

// Monobactams to exclude for ESBL organisms
const ESBL_EXCLUDED_MONOBACTAMS = [
  'ATM',   // Aztreonam
];

// All excluded antibiotics for ESBL organisms
const ESBL_EXCLUDED_ANTIBIOTICS = [
  ...ESBL_EXCLUDED_PENICILLINS,
  ...ESBL_EXCLUDED_CEPHALOSPORINS,
  ...ESBL_EXCLUDED_MONOBACTAMS
];

/**
 * Check if an organism is an ESBL producer
 * @param organismCode - The organism code (e.g., 'eco', 'kpn')
 * @returns true if the organism is an ESBL producer
 */
export function isESBLOrganism(organismCode: string): boolean {
  if (!organismCode) return false;
  const normalizedCode = organismCode.toLowerCase().trim();
  return ESBL_ORGANISMS.includes(normalizedCode);
}

/**
 * Check if an antibiotic should be excluded for ESBL organisms
 * @param antibioticCode - The antibiotic code (e.g., 'AMP', 'CTX', 'AMP_ND10', 'CTX_ND30')
 * @returns true if the antibiotic should be excluded for ESBL organisms
 */
export function isESBLExcludedAntibiotic(antibioticCode: string): boolean {
  if (!antibioticCode) return false;
  const normalizedCode = antibioticCode.toUpperCase().trim();
  
  // Extract the base antibiotic code from database column names (e.g., 'AMP_ND10' -> 'AMP')
  const baseCode = normalizedCode.split('_')[0];
  
  // Check both the full code and the base code
  return ESBL_EXCLUDED_ANTIBIOTICS.includes(normalizedCode) || 
         ESBL_EXCLUDED_ANTIBIOTICS.includes(baseCode);
}

/**
 * Check if a specific organism-antibiotic pair should be hidden due to ESBL rules
 * @param organismCode - The organism code
 * @param antibioticCode - The antibiotic code
 * @returns true if the pair should be hidden
 */
export function shouldHideESBLPair(organismCode: string, antibioticCode: string): boolean {
  return isESBLOrganism(organismCode) && isESBLExcludedAntibiotic(antibioticCode);
}

/**
 * Filter a list of antibiotics to remove ESBL-excluded ones for a given organism
 * @param antibiotics - List of antibiotic codes
 * @param organismCode - The organism code
 * @returns Filtered list of antibiotics
 */
export function filterAntibioticsForOrganism(antibiotics: string[], organismCode: string): string[] {
  if (!isESBLOrganism(organismCode)) {
    return antibiotics; // No filtering needed for non-ESBL organisms
  }
  
  return antibiotics.filter(antibiotic => !isESBLExcludedAntibiotic(antibiotic));
}

/**
 * Filter organism-antibiotic pairs based on ESBL rules
 * @param pairs - Array of {organism, antibiotic} objects
 * @returns Filtered array excluding ESBL-inappropriate pairs
 */
export function filterESBLPairs<T extends { organism: string; antibiotic: string }>(pairs: T[]): T[] {
  return pairs.filter(pair => !shouldHideESBLPair(pair.organism, pair.antibiotic));
}

/**
 * Get a list of all ESBL organisms
 * @returns Array of ESBL organism codes
 */
export function getESBLOrganisms(): string[] {
  return [...ESBL_ORGANISMS];
}

/**
 * Get a list of all ESBL-excluded antibiotics
 * @returns Array of excluded antibiotic codes
 */
export function getESBLExcludedAntibiotics(): string[] {
  return [...ESBL_EXCLUDED_ANTIBIOTICS];
}
