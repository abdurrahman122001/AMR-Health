/**
 * Age Category Ordering Utility
 * Ensures consistent ordering of age categories across all dashboards
 * per the standardized age groupings for Ghana's antimicrobial surveillance system
 */

// Standard age category order
export const AGE_CATEGORY_ORDER = [
  'Neonates (<28 days)',
  'Under 5 years',
  '5–14 years',
  '15–24 years',
  '25–34 years',
  '35–44 years',
  '45–54 years',
  '55–64 years',
  '65–74 years',
  '75–84 years',
  '85–94 years',
  '95+ years'
];

// Create a map for quick lookup of age category positions
const AGE_ORDER_MAP = new Map(
  AGE_CATEGORY_ORDER.map((category, index) => [category, index])
);

/**
 * Compare function for sorting age categories
 * @param a First age category
 * @param b Second age category
 * @returns Comparison result for sorting
 */
export const compareAgeCategories = (a: string, b: string): number => {
  const indexA = AGE_ORDER_MAP.get(a);
  const indexB = AGE_ORDER_MAP.get(b);
  
  // If both categories are in our standard list, sort by their order
  if (indexA !== undefined && indexB !== undefined) {
    return indexA - indexB;
  }
  
  // If only one is in the list, prioritize the known category
  if (indexA !== undefined) return -1;
  if (indexB !== undefined) return 1;
  
  // If neither is in the list, fall back to alphabetical sorting
  return a.localeCompare(b);
};

/**
 * Sort an array of age categories
 * @param categories Array of age category strings
 * @returns Sorted array
 */
export const sortAgeCategories = (categories: string[]): string[] => {
  return [...categories].sort(compareAgeCategories);
};

/**
 * Sort an array of objects by their age category property
 * @param data Array of objects containing age category data
 * @param ageCategoryKey Key name for the age category property
 * @returns Sorted array
 */
export const sortByAgeCategory = <T extends Record<string, any>>(
  data: T[],
  ageCategoryKey: string = 'age_category'
): T[] => {
  return [...data].sort((a, b) => 
    compareAgeCategories(a[ageCategoryKey], b[ageCategoryKey])
  );
};

/**
 * Get the index/position of an age category in the standard order
 * @param category Age category string
 * @returns Index (0-based) or -1 if not found
 */
export const getAgeCategoryIndex = (category: string): number => {
  return AGE_ORDER_MAP.get(category) ?? -1;
};

/**
 * Check if a string is a valid age category
 * @param category String to check
 * @returns true if it's a recognized age category
 */
export const isValidAgeCategory = (category: string): boolean => {
  return AGE_ORDER_MAP.has(category);
};
