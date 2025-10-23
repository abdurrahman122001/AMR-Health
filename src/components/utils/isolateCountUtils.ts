// Utility for calculating dynamic total isolate count with consistent variation across all components

const BASE_TOTAL_ISOLATES = 25212;

export function getCurrentTotalIsolates(): number {
  // Add some randomization to make the count feel more dynamic
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const variation = 1 + (Math.sin(dayOfYear / 10) * 0.05); // ±5% variation based on day of year
  
  return Math.round(BASE_TOTAL_ISOLATES * variation);
}

export function getCurrentVariation(): number {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return 1 + (Math.sin(dayOfYear / 10) * 0.05); // ±5% variation based on day of year
}

export const BASE_TOTAL_ISOLATES_COUNT = BASE_TOTAL_ISOLATES;