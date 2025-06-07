import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface ProgressTrackerProps {
  totalSteps: number;
  completedSteps: number;
  currentStep?: number;
  className?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  totalSteps,
  completedSteps,
  currentStep,
  className
}) => {
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="text-sm font-bold text-gray-600">
        {completedSteps}/{totalSteps}
      </div>
      
      {/* Minimal progress bar */}
      <div className="w-64 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <span className="text-sm text-green-600 font-medium">
        {progressPercentage.toFixed(0)}%
      </span>
    </div>
  );
};

export const JourneyStats: React.FC<{
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  className?: string;
}> = ({ highPriority, mediumPriority, lowPriority, className }) => {
  const total = highPriority + mediumPriority + lowPriority;
  
  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border-2 border-yellow-200 ${className}`}>
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
        Task Priorities
      </h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-semibold">High Priority</span>
          </div>
          <span className="text-sm font-bold text-red-600">{highPriority}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-semibold">Medium Priority</span>
          </div>
          <span className="text-sm font-bold text-yellow-600">{mediumPriority}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-semibold">Low Priority</span>
          </div>
          <span className="text-sm font-bold text-green-600">{lowPriority}</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-center text-sm font-bold text-gray-700">
          Total: {total} Tasks
        </div>
      </div>
    </div>
  );
};