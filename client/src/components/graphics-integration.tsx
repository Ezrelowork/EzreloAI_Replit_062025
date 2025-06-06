import React, { useState, useEffect } from 'react';
import { GraphicAsset, JourneyGraphics } from './journey-assets';

// Graphics configuration manager
export class GraphicsManager {
  private static instance: GraphicsManager;
  private graphics: JourneyGraphics = {};
  private listeners: Array<(graphics: JourneyGraphics) => void> = [];

  static getInstance(): GraphicsManager {
    if (!GraphicsManager.instance) {
      GraphicsManager.instance = new GraphicsManager();
    }
    return GraphicsManager.instance;
  }

  // Load custom graphics from attached assets
  async loadCustomGraphics(assetMap: Record<string, string>): Promise<void> {
    const newGraphics: JourneyGraphics = {};

    // Load background graphics
    if (assetMap.roadBackground) {
      newGraphics.roadBackground = {
        src: assetMap.roadBackground,
        alt: 'Journey Road Background',
        width: 1200,
        height: 800
      };
    }

    if (assetMap.timelinePath) {
      newGraphics.timelinePath = {
        src: assetMap.timelinePath,
        alt: 'Timeline Path',
        width: 20,
        height: 800
      };
    }

    // Load task icons
    const taskIcons: Record<string, GraphicAsset> = {};
    Object.keys(assetMap).forEach(key => {
      if (key.startsWith('icon-')) {
        const taskType = key.replace('icon-', '');
        taskIcons[taskType] = {
          src: assetMap[key],
          alt: `${taskType} icon`,
          width: 48,
          height: 48
        };
      }
    });

    if (Object.keys(taskIcons).length > 0) {
      newGraphics.taskIcons = taskIcons;
    }

    // Load decorative elements
    const decorativeElements: GraphicAsset[] = [];
    Object.keys(assetMap).forEach(key => {
      if (key.startsWith('decoration-')) {
        decorativeElements.push({
          src: assetMap[key],
          alt: 'Decorative element',
          width: 100,
          height: 100
        });
      }
    });

    if (decorativeElements.length > 0) {
      newGraphics.decorativeElements = decorativeElements;
    }

    this.updateGraphics(newGraphics);
  }

  // Update graphics and notify listeners
  updateGraphics(newGraphics: JourneyGraphics): void {
    this.graphics = { ...this.graphics, ...newGraphics };
    this.listeners.forEach(listener => listener(this.graphics));
  }

  // Subscribe to graphics updates
  subscribe(callback: (graphics: JourneyGraphics) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Get current graphics
  getGraphics(): JourneyGraphics {
    return this.graphics;
  }

  // Check if custom graphics are loaded
  hasCustomGraphics(): boolean {
    return Object.keys(this.graphics).length > 0;
  }
}

// React hook for graphics integration
export const useCustomGraphics = () => {
  const [graphics, setGraphics] = useState<JourneyGraphics>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const manager = GraphicsManager.getInstance();
    setGraphics(manager.getGraphics());
    setIsLoaded(manager.hasCustomGraphics());

    const unsubscribe = manager.subscribe((newGraphics) => {
      setGraphics(newGraphics);
      setIsLoaded(manager.hasCustomGraphics());
    });

    return unsubscribe;
  }, []);

  const loadGraphics = async (assetMap: Record<string, string>) => {
    const manager = GraphicsManager.getInstance();
    await manager.loadCustomGraphics(assetMap);
  };

  return {
    graphics,
    isLoaded,
    loadGraphics
  };
};

// Enhanced task card with custom graphics support
export const GraphicsTaskCard: React.FC<{
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  iconKey: string;
  onClick: () => void;
  className?: string;
}> = ({ title, description, priority, iconKey, onClick, className }) => {
  const { graphics } = useCustomGraphics();
  const customIcon = graphics.taskIcons?.[iconKey];

  const priorityColors = {
    high: 'bg-red-100 text-red-600 border-red-200',
    medium: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    low: 'bg-green-100 text-green-600 border-green-200'
  };

  return (
    <div 
      className={`bg-white rounded-2xl shadow-xl border border-gray-200 p-6 cursor-pointer interactive-element group ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl border-2 ${priorityColors[priority]}`}>
          {customIcon ? (
            <img 
              src={customIcon.src}
              alt={customIcon.alt}
              width={customIcon.width}
              height={customIcon.height}
              className="w-6 h-6 object-contain"
            />
          ) : (
            <div className="w-6 h-6 bg-current rounded opacity-60" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
              priority === 'high' ? 'bg-red-500' : 
              priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
            }`}>
              {priority.toUpperCase()}
            </div>
          </div>
          
          <p className="text-gray-600 mb-4 leading-relaxed">{description}</p>
          
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
              Start Task
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};