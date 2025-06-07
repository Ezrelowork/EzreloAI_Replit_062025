import React from 'react';
import blankSignPath from '@assets/AA3AE1F5-3D99-434C-8AE7-89798991FE36_1749333999352.png';

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
        <div 
          className="w-full h-full bg-green-600 rounded-lg border-4 border-white shadow-lg"
          style={{
            background: 'linear-gradient(145deg, #059669, #047857)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
        />
        
        {/* Dynamic text overlay */}
        <div className="absolute inset-0 flex flex-col justify-center items-center p-4">
          <div className={`text-center text-white ${completed ? 'opacity-60' : ''}`}>
            {/* Priority indicator */}
            <div className={`text-xs font-semibold mb-1 ${priorityColors[priority]}`}>
              {priority.toUpperCase()} PRIORITY
            </div>
            
            {/* Main title */}
            <div className="text-sm font-bold mb-1 leading-tight">
              {title.length > 30 ? title.substring(0, 30) + '...' : title}
            </div>
            
            {/* Week/timeframe */}
            <div className="text-xs opacity-90">
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