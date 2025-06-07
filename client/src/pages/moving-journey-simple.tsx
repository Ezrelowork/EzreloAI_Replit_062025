import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressTracker, JourneyStats } from "@/components/progress-tracker";
import { TaskModal, useTaskModal } from "@/components/task-modal";
import { ZoomNavigation, useZoomNavigation } from "@/components/zoom-navigation";
import { TaskPage } from "@/components/task-page";

// Direct imports for highway graphics
import highwayBackground from "@assets/highway-background.png";
import sign1 from "@assets/SIgn1.png";
import sign2 from "@assets/Sign2.png";
import sign3 from "@assets/Sign3.png";
import sign4 from "@assets/Sign4.png";
import sign5 from "@assets/Sign5.png";
import { 
  ArrowLeft,
  Truck,
  Package,
  Home,
  Zap,
  FileText,
  Heart,
  GraduationCap,
  DollarSign,
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  week: string;
  tasks: string[];
  route: string;
  position: { x: number; y: number };
  signType: "stop" | "warning" | "highway" | "info";
  completed: boolean;
  priority: "high" | "medium" | "low";
}

// Helper function to get task icon
const getTaskIcon = (taskTitle: string) => {
  const title = taskTitle.toLowerCase();
  
  if (title.includes('moving') || title.includes('truck') || title.includes('mover')) return Truck;
  if (title.includes('pack') || title.includes('box') || title.includes('organization')) return Package;
  if (title.includes('home') || title.includes('house') || title.includes('real estate')) return Home;
  if (title.includes('utility') || title.includes('electric') || title.includes('internet') || title.includes('gas')) return Zap;
  if (title.includes('address') || title.includes('change') || title.includes('update') || title.includes('registration')) return FileText;
  if (title.includes('medical') || title.includes('health') || title.includes('doctor') || title.includes('prescription')) return Heart;
  if (title.includes('school') || title.includes('education') || title.includes('kids') || title.includes('children')) return GraduationCap;
  if (title.includes('bank') || title.includes('financial') || title.includes('credit') || title.includes('loan')) return DollarSign;
  
  return CheckCircle;
};

const getCategoryFromTask = (taskTitle: string): string => {
  const title = taskTitle.toLowerCase();
  
  if (title.includes('moving') || title.includes('truck') || title.includes('mover')) return 'moving';
  if (title.includes('pack') || title.includes('box') || title.includes('organization')) return 'packing';
  if (title.includes('home') || title.includes('house') || title.includes('real estate')) return 'housing';
  if (title.includes('utility') || title.includes('electric') || title.includes('internet') || title.includes('gas')) return 'utilities';
  if (title.includes('address') || title.includes('change') || title.includes('update') || title.includes('registration')) return 'documentation';
  if (title.includes('medical') || title.includes('health') || title.includes('doctor') || title.includes('prescription')) return 'medical';
  if (title.includes('school') || title.includes('education') || title.includes('kids') || title.includes('children')) return 'education';
  if (title.includes('bank') || title.includes('financial') || title.includes('credit') || title.includes('loan')) return 'financial';
  
  return 'general';
};

export default function MovingJourney() {
  const [, setLocation] = useLocation();
  const [journeyData, setJourneyData] = useState<JourneyStep[]>([]);
  const { isOpen, currentTask, openModal, closeModal } = useTaskModal();
  const { isZoomed, zoomOrigin, currentTaskData, zoomIntoTask, zoomOut } = useZoomNavigation();
  const taskCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Highway graphics
  const customGraphics = {
    roadBackground: {
      src: highwayBackground,
      alt: 'Highway Journey Background',
      width: 1200,
      height: 800
    },
    taskIcons: {
      'moving': { src: sign1, alt: 'Core Moving Tasks', width: 120, height: 80 },
      'utilities-setup': { src: sign2, alt: 'Set Up Utilities', width: 120, height: 80 },
      'address-changes': { src: sign3, alt: 'Address Changes', width: 120, height: 80 },
      'utilities-services': { src: sign4, alt: 'Utilities & Services', width: 120, height: 80 },
      'essential-services': { src: sign5, alt: 'Essential Services', width: 120, height: 80 }
    }
  };

  useEffect(() => {
    // Set up sample move data for testing
    localStorage.setItem('aiFromLocation', 'Austin, TX 78701');
    localStorage.setItem('aiToLocation', 'Dallas, TX 75201');
    localStorage.setItem('aiMoveDate', '2024-08-15');
    
    // Get action plan data from localStorage (from AI assistant)
    const savedActionPlan = localStorage.getItem('aiActionPlan');
    
    if (savedActionPlan) {
      const actionPlan = JSON.parse(savedActionPlan);
      
      // Convert action plan to journey steps
      const steps: JourneyStep[] = actionPlan.map((action: any, index: number) => {
        // Create curved path positions
        const baseX = 20 + (index * 15);
        const curveY = 50 + Math.sin(index * 0.8) * 20;
        
        // Determine sign type based on priority
        const signType = action.priority === 'high' ? 'warning' : 
                        action.priority === 'medium' ? 'highway' : 'info';
        
        return {
          id: `action-${index}`,
          title: action.title,
          description: action.description,
          week: action.timeframe,
          tasks: [action.description],
          route: action.route,
          position: { x: baseX, y: curveY },
          signType: signType,
          completed: false,
          priority: action.priority || 'medium'
        };
      });
      
      setJourneyData(steps);
    } else {
      // Sample data for testing highway graphics (4 signs only)
      const sampleSteps: JourneyStep[] = [
        {
          id: 'step-1',
          title: 'Find Moving Company',
          description: 'Research and get quotes from professional moving companies',
          week: 'Week 8-6',
          tasks: ['Get moving quotes', 'Compare services', 'Book moving company'],
          route: '/dashboard',
          position: { x: 15, y: 80 },
          signType: 'warning',
          completed: false,
          priority: 'high'
        },
        {
          id: 'step-3',
          title: 'Address Changes',
          description: 'Update address with banks, employers, and government',
          week: 'Week 2-1',
          tasks: ['Update bank records', 'Notify employer', 'Change voter registration'],
          route: '/moving-checklist',
          position: { x: 45, y: 50 },
          signType: 'info',
          completed: false,
          priority: 'medium'
        },
        {
          id: 'step-4',
          title: 'Transfer Services',
          description: 'Move internet, cable, and other services to new address',
          week: 'Week 1',
          tasks: ['Transfer internet', 'Move cable service', 'Update subscriptions'],
          route: '/utilities',
          position: { x: 65, y: 35 },
          signType: 'highway',
          completed: false,
          priority: 'medium'
        },
        {
          id: 'step-5',
          title: 'Essential Services',
          description: 'Find new doctor, dentist, and register kids for school',
          week: 'Week 1-2',
          tasks: ['Find healthcare providers', 'Transfer prescriptions', 'School registration'],
          route: '/moving-checklist',
          position: { x: 80, y: 20 },
          signType: 'info',
          completed: false,
          priority: 'low'
        }
      ];
      
      setJourneyData(sampleSteps);
    }
  }, []);

  const handleTaskClick = (step: JourneyStep, event: React.MouseEvent) => {
    // Visual feedback - sign click animation
    const element = event.currentTarget as HTMLElement;
    element.style.transform = 'scale(0.95)';
    element.style.transition = 'transform 0.2s ease';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 200);
    
    const cardElement = taskCardRefs.current[step.id];
    if (cardElement) {
      // Cinematic zoom into the task card
      zoomIntoTask(cardElement, {
        id: step.id,
        title: step.title,
        description: step.description,
        priority: step.priority,
        week: step.week,
        category: getCategoryFromTask(step.title)
      });
    }
  };

  const handleStartTask = (step: JourneyStep) => {
    // Smart routing with address data preservation
    const fromParam = localStorage.getItem('aiFromLocation');
    const toParam = localStorage.getItem('aiToLocation');
    const dateParam = localStorage.getItem('aiMoveDate');
    
    // Intelligent routing based on task content
    const taskLower = step.title.toLowerCase();
    const descLower = step.description.toLowerCase();
    const combined = `${taskLower} ${descLower}`;
    
    let targetRoute = step.route;
    
    // Override route based on task content for better UX
    if (combined.includes('mover') || combined.includes('moving') || combined.includes('truck') || combined.includes('quote')) {
      targetRoute = '/dashboard';
    } else if (combined.includes('utility') || combined.includes('electric') || combined.includes('internet') || 
               combined.includes('gas') || combined.includes('water') || combined.includes('cable')) {
      targetRoute = '/utilities';
    } else if (combined.includes('pack') || combined.includes('organize') || combined.includes('checklist')) {
      targetRoute = '/moving-checklist';
    }
    
    // Build query params for context preservation
    const params = new URLSearchParams();
    if (fromParam) params.set('from', fromParam);
    if (toParam) params.set('to', toParam);
    if (dateParam) params.set('date', dateParam);
    
    const queryString = params.toString();
    const finalRoute = queryString ? `${targetRoute}?${queryString}` : targetRoute;
    
    setLocation(finalRoute);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/ai-assistant">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to AI Assistant
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interactive Moving Journey</h1>
                <p className="text-sm text-gray-600">Your personalized step-by-step relocation roadmap</p>
              </div>
            </div>
            
            {/* Progress Tracker in Header */}
            <div className="flex items-center">
              <ProgressTracker 
                totalSteps={journeyData.length}
                completedSteps={journeyData.filter(step => step.completed).length}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Highway Timeline Container */}
      <div className="relative max-w-7xl mx-auto p-6 min-h-[600px] z-10">
        {/* Highway Background */}
        <div className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden z-0">
          <img 
            src={highwayBackground}
            alt="Highway Background"
            className="w-full h-full object-cover opacity-95"
            onError={(e) => {
              console.error('Background image failed to load:', highwayBackground);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => {}}
          />
        </div>

        {/* Highway Signs Positioned Along Road */}
        {journeyData.map((step, index) => {
          const IconComponent = getTaskIcon(step.title);
          const completedSteps = journeyData.filter(s => s.completed).length;
          const isCurrentStep = index === completedSteps && !step.completed;
          
          // Assign different sign for each position (4 signs total)
          const signsByIndex = [
            customGraphics.taskIcons['moving'],           // Sign 1 - Find Moving Company
            customGraphics.taskIcons['address-changes'],  // Sign 3 - Address Changes 
            customGraphics.taskIcons['utilities-services'], // Sign 4 - Transfer Services
            customGraphics.taskIcons['essential-services'] // Sign 5 - Essential Services
          ];

          const customSign = signsByIndex[index] || customGraphics.taskIcons['moving'];
          
          // Position four signs with different graphics
          let position;
          if (index === 0) {
            position = { left: '15%', top: '75%' };    // Sign 1 - moving company (largest)
          } else if (index === 1) {
            position = { left: '40%', top: '65%' };    // Sign 3 - address changes (cropped)
          } else if (index === 2) {
            position = { left: '70%', top: '49%' };    // Sign 4 - transfer services (cropped)
          } else if (index === 3) {
            position = { left: '50%', top: '20%' };    // Sign 5 - essential services (top center)
          } else {
            // Hide remaining signs for now
            return null;
          }
          
          return (
            <div
              key={step.id}
              ref={el => taskCardRefs.current[step.id] = el}
              className="absolute cursor-pointer transition-all duration-300 hover:scale-110 z-20"
              style={{
                left: position.left,
                top: position.top,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={(e) => handleTaskClick(step, e)}
            >
              {/* Custom Highway Sign */}
              <div className="relative group">
                <img 
                  src={customSign.src}
                  alt={customSign.alt}
                  className={`${index === 0 ? 'w-[26rem] h-[17rem]' : index === 1 ? 'w-96 h-64' : index === 2 ? 'w-96 h-64' : index === 3 ? 'w-96 h-64' : 'w-72 h-48'} object-contain transition-all duration-300 ${
                    step.completed ? 'opacity-80 saturate-50' : 'hover:brightness-110'
                  }`}
                  style={index === 1 ? { clipPath: 'inset(0 0 30% 0)' } : index === 2 ? { clipPath: 'inset(0 0 30% 0)' } : undefined}
                  onError={(e) => {
                    console.error(`Sign ${index + 1} failed to load:`, customSign.src);
                  }}
                />
                
                {/* Completion Check */}
                {step.completed && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
                

                
                {/* Hover Card with Smart Positioning */}
                <div className={`absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 ${
                  index === 0 ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-2' :
                  index === 1 ? 'bottom-full right-3/4 mb-2' :
                  index === 2 ? 'bottom-full right-0 mb-2' :
                  'top-1/2 right-3/4 mr-2'
                }`}>
                  <div className="bg-white rounded-lg shadow-xl p-3 border min-w-48 max-w-64">
                    <h4 className="font-semibold text-sm text-gray-900">{step.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                    <div className="flex gap-1 mt-2">
                      <Badge variant={step.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {step.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{step.week}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>



      {/* Priority Stats Box - In Grass Area Lower Right */}
      <div className="absolute bottom-28 right-8 z-30">
        <JourneyStats 
          highPriority={journeyData.filter(step => step.priority === 'high').length}
          mediumPriority={journeyData.filter(step => step.priority === 'medium').length}
          lowPriority={journeyData.filter(step => step.priority === 'low').length}
        />
      </div>

      {/* Cinematic Journey Info */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">🎬 Cinematic Journey</span>
            <span className="text-xs text-gray-300">Click any task card to zoom in • Experience immersive task management</span>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal 
        isOpen={isOpen}
        onClose={closeModal}
        task={currentTask}
        onStartTask={() => {
          if (currentTask) {
            const step = journeyData.find(s => s.title === currentTask.title);
            if (step) handleStartTask(step);
          }
          closeModal();
        }}
        onMarkComplete={() => {
          if (currentTask) {
            setJourneyData(prev => prev.map(step => 
              step.title === currentTask.title 
                ? { ...step, completed: true }
                : step
            ));
          }
        }}
      />

      {/* Zoom Navigation Overlay */}
      <ZoomNavigation 
        isZoomed={isZoomed}
        onZoomOut={zoomOut}
        zoomOrigin={zoomOrigin}
      >
        {currentTaskData && (
          <TaskPage 
            task={currentTaskData} 
            onComplete={() => {
              // Mark task as completed
              setJourneyData(prev => prev.map(step => 
                step.id === currentTaskData.id 
                  ? { ...step, completed: true }
                  : step
              ));
              zoomOut();
            }}
            onBack={zoomOut}
          />
        )}
      </ZoomNavigation>
    </div>
  );
}