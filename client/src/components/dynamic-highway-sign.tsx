import React from 'react';

interface DynamicSignProps {
  title?: string;
  description?: string;
  week?: string;
  priority?: 'high' | 'medium' | 'low';
  completed?: boolean;
  onClick?: () => void;
  className?: string;
}

export const DynamicHighwaySign: React.FC<DynamicSignProps> = ({
  title = "Default Title",
  description = "Default description text for this highway sign",
  week = "Week 1", 
  priority = "medium",
  completed = false,
  onClick,
  className = ""
}) => {
  // Ensure description is always a string
  const safeDescription = typeof description === 'string' ? description : "Default description text for this highway sign";

  const priorityColors = {
    high: 'text-red-600',
    medium: 'text-yellow-600', 
    low: 'text-green-600'
  };

  return (
    <div 
      className={`relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${className}`}
      onClick={onClick}
    >
      {/* Text overlay positioned to fit on background signs */}
      <div className="bg-green-700 text-white p-4 rounded-lg shadow-lg min-w-[200px] max-w-[280px] border-4 border-white">
        {/* Priority indicator */}
        <div className={`text-xs font-bold mb-2 ${priorityColors[priority]} bg-white px-2 py-1 rounded uppercase tracking-wider text-center`}>
          {priority} PRIORITY
        </div>

        {/* Main title */}
        <div className="text-sm font-bold mb-2 leading-tight text-center">
          {title && title.length > 35 ? title.substring(0, 35) + '...' : title || ''}
        </div>

        {/* Description */}
        <div className="text-xs opacity-90 leading-tight text-center mb-2">
          {safeDescription.length > 45 ? safeDescription.substring(0, 45) + '...' : safeDescription}
        </div>

        {/* Week/timeframe */}
        <div className="text-xs opacity-80 font-semibold text-center border-t border-green-500 pt-2 mt-2">
          {week}
        </div>

        {/* Completion checkmark */}
        {completed && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicHighwaySign;