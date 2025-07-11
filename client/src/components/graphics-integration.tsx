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

  // Load static background with road and separate road signs
  async loadCustomGraphics(assetFiles: string[]): Promise<void> {
    const newGraphics: JourneyGraphics = {};

    // Process each asset file with dynamic imports
    for (const fileName of assetFiles) {
      try {
        // Use dynamic import to properly load assets
        const assetModule = await import(`@assets/${fileName}`);
        const assetPath = assetModule.default;
        
        // Main background with road
        if (fileName.toLowerCase().includes('background') || fileName.toLowerCase().includes('road')) {
          newGraphics.roadBackground = {
            src: assetPath,
            alt: 'Highway Journey Background',
            width: 1200,
            height: 800
          };
        }

        // Blank highway sign template for dynamic text overlay
        if (fileName.includes('9097D925-400E-4B8C-9697-19B7E4BDA0C9_1749334781517')) {
          newGraphics.blankSignTemplate = {
            src: assetPath,
            alt: 'Blank Highway Sign Template',
            width: 256,
            height: 176
          };
        }
      } catch (error) {
        console.log(`Could not load asset: ${fileName}`, error);
      }
    }

    this.updateGraphics(newGraphics);
    console.log('Static highway graphics loaded:', newGraphics);
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

  const loadGraphics = async (assetFiles: string[]) => {
    const manager = GraphicsManager.getInstance();
    await manager.loadCustomGraphics(assetFiles);
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