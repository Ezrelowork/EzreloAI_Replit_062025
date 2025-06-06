// Journey Graphics Components for Custom Asset Integration
import React from 'react';

// Placeholder for future custom graphics integration
export const JourneyRoad: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Enhanced winding road with realistic curves */}
      <defs>
        <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4a5568" />
          <stop offset="50%" stopColor="#2d3748" />
          <stop offset="100%" stopColor="#1a202c" />
        </linearGradient>
        <pattern id="roadLines" patternUnits="userSpaceOnUse" width="40" height="20">
          <rect width="40" height="20" fill="transparent" />
          <rect x="10" y="8" width="20" height="4" fill="#ffd700" opacity="0.8" />
        </pattern>
      </defs>
      
      {/* Main road path with enhanced curves */}
      <path
        d="M 50 100 Q 200 50 400 120 Q 600 200 800 150 Q 950 100 1100 180 Q 1150 250 1050 350 Q 950 450 1100 550 Q 1150 650 1050 700"
        stroke="url(#roadGradient)"
        strokeWidth="80"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Road centerline */}
      <path
        d="M 50 100 Q 200 50 400 120 Q 600 200 800 150 Q 950 100 1100 180 Q 1150 250 1050 350 Q 950 450 1100 550 Q 1150 650 1050 700"
        stroke="url(#roadLines)"
        strokeWidth="80"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Road shoulders */}
      <path
        d="M 50 100 Q 200 50 400 120 Q 600 200 800 150 Q 950 100 1100 180 Q 1150 250 1050 350 Q 950 450 1100 550 Q 1150 650 1050 700"
        stroke="#2a2a2a"
        strokeWidth="84"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
};

export const JourneyLandscape: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Enhanced rolling hills with depth */}
      <defs>
        <linearGradient id="hillGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#68d391" />
          <stop offset="100%" stopColor="#38a169" />
        </linearGradient>
        <linearGradient id="hillGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9ae6b4" />
          <stop offset="100%" stopColor="#68d391" />
        </linearGradient>
        <radialGradient id="treeGradient" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#48bb78" />
          <stop offset="100%" stopColor="#2f855a" />
        </radialGradient>
      </defs>
      
      {/* Background hills (far) */}
      <path
        d="M 0 600 Q 300 500 600 550 Q 900 600 1200 520 L 1200 800 L 0 800 Z"
        fill="url(#hillGradient2)"
        opacity="0.6"
      />
      
      {/* Middle hills */}
      <path
        d="M 0 650 Q 200 580 500 620 Q 800 660 1200 600 L 1200 800 L 0 800 Z"
        fill="url(#hillGradient1)"
        opacity="0.8"
      />
      
      {/* Foreground hills */}
      <path
        d="M 0 700 Q 400 650 800 680 Q 1000 700 1200 660 L 1200 800 L 0 800 Z"
        fill="url(#hillGradient1)"
      />
      
      {/* Scattered trees for depth */}
      {[...Array(12)].map((_, i) => {
        const x = 100 + (i * 90) + (Math.random() * 40);
        const y = 620 + (Math.random() * 80);
        const scale = 0.6 + (Math.random() * 0.4);
        
        return (
          <g key={i} transform={`translate(${x}, ${y}) scale(${scale})`}>
            {/* Tree trunk */}
            <rect x="-3" y="20" width="6" height="25" fill="#8b4513" />
            {/* Tree crown */}
            <circle cx="0" cy="15" r="18" fill="url(#treeGradient)" />
            <circle cx="-8" cy="10" r="12" fill="url(#treeGradient)" opacity="0.8" />
            <circle cx="8" cy="12" r="10" fill="url(#treeGradient)" opacity="0.9" />
          </g>
        );
      })}
      
      {/* Clouds for atmosphere */}
      {[...Array(6)].map((_, i) => {
        const x = 150 + (i * 180);
        const y = 80 + (Math.random() * 100);
        
        return (
          <g key={i} transform={`translate(${x}, ${y})`} opacity="0.7">
            <circle cx="0" cy="0" r="25" fill="white" />
            <circle cx="20" cy="-5" r="20" fill="white" />
            <circle cx="40" cy="0" r="22" fill="white" />
            <circle cx="15" cy="-20" r="18" fill="white" />
          </g>
        );
      })}
    </svg>
  );
};

// Highway Sign Templates for Custom Graphics
export const HighwaySignTemplate: React.FC<{
  className?: string;
  priority: 'high' | 'medium' | 'low';
  children: React.ReactNode;
}> = ({ className, priority, children }) => {
  const colorMap = {
    high: 'bg-red-600 border-red-800',
    medium: 'bg-yellow-600 border-yellow-800', 
    low: 'bg-green-600 border-green-800'
  };
  
  return (
    <div className={`${colorMap[priority]} ${className} relative`}>
      {/* Sign structure placeholder for custom graphics */}
      {children}
    </div>
  );
};

// Custom asset loader utility
export const loadCustomAsset = (assetPath: string) => {
  // This will be used when custom graphics are provided
  return assetPath;
};