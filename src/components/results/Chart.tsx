import React from 'react';

interface ChartProps {
  data: Record<string, number>;
}

export const Chart: React.FC<ChartProps> = ({ data }) => {
  // Format disease names for display
  const formatDiseaseName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Get bar color based on probability
  const getBarColor = (probability: number) => {
    if (probability > 0.5) return '#ef4444'; // Red
    if (probability > 0.25) return '#f59e0b'; // Amber
    return '#22c55e'; // Green
  };

  return (
    <div className="w-full">
      {Object.entries(data).map(([disease, probability]) => (
        <div key={disease} className="mb-4 last:mb-0">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              {formatDiseaseName(disease)}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {(probability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 h-5 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${probability * 100}%`,
                backgroundColor: getBarColor(probability)
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};