import React from 'react';
import blankSignPath from '@assets/9097D925-400E-4B8C-9697-19B7E4BDA0C9_1749334781517.png';

interface DynamicSignProps {
  title: string;
  description: string;
  week: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  onClick: () => void;
  className?: string;
}

export const DynamicHighwaySign: React.FC<DynamicSignProps> = ({
  title,
  description,
  week,
  priority,
  completed,
  onClick,
  className = ''
}) => {
  const priorityColors = {
    high: 'text-red-600',
    medium: 'text-yellow-600', 
    low: 'text-blue-600'
  };

  const priorityBorders = {
    high: 'border-red-300',
    medium: 'border-yellow-300',
    low: 'border-blue-300'
  };

  return (
    <div 
      className={`relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${className}`}
      onClick={onClick}
    >
      {/* Custom blank sign background */}
      <div className="relative w-48 h-32">
        <img 
          src={blankSignPath} 
          alt="Highway Sign" 
          className="w-full h-full object-contain"
        />
        
        {/* Dynamic text overlay */}
        <div className="absolute inset-0 flex flex-col justify-center items-center p-2">
          <div className={`text-center text-white ${completed ? 'opacity-60' : ''}`}>
            {/* Priority indicator */}
            <div className={`text-[8px] font-bold mb-0.5 ${priorityColors[priority]} uppercase tracking-wider`}>
              {priority} PRIORITY
            </div>
            
            {/* Main title - smaller and more lines */}
            <div className="text-[10px] font-bold mb-0.5 leading-tight px-1">
              {title.length > 50 ? title.substring(0, 50) + '...' : title}
            </div>
            
            {/* Description - additional info */}
            <div className="text-[8px] opacity-90 leading-tight px-1 mb-0.5">
              {description.length > 60 ? description.substring(0, 60) + '...' : description}
            </div>
            
            {/* Week/timeframe */}
            <div className="text-[8px] opacity-80 font-semibold">
              {week}
            </div>
          </div>
        </div>

        {/* Completion checkmark */}
        {completed && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Priority border indicator */}
        <div className={`absolute inset-0 border-2 ${priorityBorders[priority]} rounded-lg ${completed ? 'opacity-40' : ''}`} />
      </div>

      {/* Hover tooltip with description */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {description.length > 50 ? description.substring(0, 50) + '...' : description}
      </div>
    </div>
  );
};

export default DynamicHighwaySign;