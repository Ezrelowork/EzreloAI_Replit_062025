import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const [location] = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'idle' | 'exiting' | 'entering'>('idle');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('exiting');
      
      const exitTimer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('entering');
        
        const enterTimer = setTimeout(() => {
          setTransitionStage('idle');
        }, 400);
        
        return () => clearTimeout(enterTimer);
      }, 200);

      return () => clearTimeout(exitTimer);
    }
  }, [location, displayLocation]);

  return (
    <div className={`page-transition-container ${className}`}>
      <div 
        className={`page-content ${
          transitionStage === 'exiting' ? 'slide-out-left' :
          transitionStage === 'entering' ? 'slide-in-from-right' :
          'slide-in'
        }`}
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