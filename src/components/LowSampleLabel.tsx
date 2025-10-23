import React from 'react';

interface LowSampleLabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    total: number;
    [key: string]: any;
  };
}

export function LowSampleLabel({ x, y, width, height, payload }: LowSampleLabelProps) {
  // Only show asterisk if sample size is 30 or less
  if (!payload || !payload.total || payload.total > 30) {
    return null;
  }

  // Calculate position above the bar
  const centerX = (x || 0) + (width || 0) / 2;
  const asteriskY = (y || 0) - 15; // Position 15px above the bar for better visibility

  return (
    <g>
      {/* White background circle for better contrast */}
      <circle
        cx={centerX}
        cy={asteriskY}
        r="12"
        fill="white"
        stroke="#dc2626"
        strokeWidth="1"
        opacity="0.9"
        style={{ 
          zIndex: 9999,
          pointerEvents: 'none'
        }}
      />
      {/* Red asterisk on top */}
      <text
        x={centerX}
        y={asteriskY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="18"
        fontWeight="bold"
        fill="#dc2626"
        style={{ 
          zIndex: 10000,
          pointerEvents: 'none',
          paintOrder: 'stroke fill markers'
        }}
        stroke="white"
        strokeWidth="0.5"
      >
        *
      </text>
    </g>
  );
}