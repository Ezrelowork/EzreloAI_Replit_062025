import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ZoomNavigationProps {
  isZoomed: boolean;
  onZoomOut: () => void;
  zoomOrigin: { x: number; y: number } | null;
  children: React.ReactNode;
}

export const ZoomNavigation: React.FC<ZoomNavigationProps> = ({
  isZoomed,
  onZoomOut,
  zoomOrigin,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isZoomed || zoomOrigin) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isZoomed, zoomOrigin]);

  if (!isZoomed && !isTransitioning) {
    return null;
  }

  const transformOrigin = zoomOrigin 
    ? `${zoomOrigin.x}px ${zoomOrigin.y}px`
    : '50% 50%';

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-white zoom-container ${
        isZoomed ? 'zoom-in' : 'zoom-out'
      }`}
      style={{
        transform: isZoomed ? 'scale(1)' : 'scale(0.1)',
        transformOrigin,
        opacity: isZoomed ? 1 : 0,
      }}
    >


      {/* Zoomed Content */}
      <div className="w-full h-full overflow-auto">
        {children}
      </div>
    </div>
  );
};

// Hook for managing zoom navigation
export const useZoomNavigation = () => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState<{ x: number; y: number } | null>(null);
  const [currentTaskData, setCurrentTaskData] = useState<any>(null);

  const zoomIntoTask = (element: HTMLElement, taskData: any) => {
    // Store original positions of all signs before zoom starts
    const signs = document.querySelectorAll('[data-step-id]');
    const originalPositions: { [key: string]: { left: string; top: string } } = {};
    
    signs.forEach((sign) => {
      const htmlSign = sign as HTMLElement;
      const stepId = htmlSign.getAttribute('data-step-id');
      if (stepId && htmlSign.style) {
        originalPositions[stepId] = {
          left: htmlSign.style.left,
          top: htmlSign.style.top
        };
      }
    });
    
    // Store positions globally for restoration
    (window as any).originalSignPositions = originalPositions;
    
    // Get the element's position relative to the viewport
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setZoomOrigin({ x: centerX, y: centerY });
    setCurrentTaskData(taskData);
    setIsZoomed(true);

    // Add smooth transition to body
    document.body.style.overflow = 'hidden';
  };

  const zoomOut = () => {
    setIsZoomed(false);
    document.body.style.overflow = 'auto';
    
    // Immediately restore positions to prevent jump
    const originalPositions = (window as any).originalSignPositions;
    if (originalPositions) {
      const signs = document.querySelectorAll('[data-step-id]');
      signs.forEach((sign) => {
        const htmlSign = sign as HTMLElement;
        const stepId = htmlSign.getAttribute('data-step-id');
        if (stepId && originalPositions[stepId] && htmlSign.style) {
          htmlSign.style.left = originalPositions[stepId].left;
          htmlSign.style.top = originalPositions[stepId].top;
          htmlSign.style.transform = 'translate(-50%, -50%)';
          htmlSign.style.transformOrigin = 'center';
        }
      });
    }
    
    // Clear data after transition
    setTimeout(() => {
      setZoomOrigin(null);
      setCurrentTaskData(null);
      
      // Reset any lingering transform effects on the body/page
      const body = document.body;
      body.style.transform = '';
      body.style.transformOrigin = '';
      
      // Reset highway container
      const container = document.querySelector('.relative.max-w-7xl') as HTMLElement;
      if (container && container.style) {
        container.style.transform = 'none';
        container.style.transformOrigin = 'initial';
      }
      
      // Clean up stored positions
      (window as any).originalSignPositions = null;
      
      // Force a reflow to ensure positions are reset
      window.scrollTo(0, 0);
    }, 800);
  };

  return {
    isZoomed,
    zoomOrigin,
    currentTaskData,
    zoomIntoTask,
    zoomOut
  };
};