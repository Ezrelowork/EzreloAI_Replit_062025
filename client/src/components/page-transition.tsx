import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const [location] = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true);
      
      // Immediately update the display location and reset transition
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div className={`page-transition-container ${className}`}>
      <div 
        className={`page-content ${isTransitioning ? 'opacity-0' : 'opacity-100'} transition-opacity duration-100`}
        key={displayLocation}
      >
        {children}
      </div>
    </div>
  );
};

export const TransitionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full">
      <PageTransition>
        {children}
      </PageTransition>
    </div>
  );
};