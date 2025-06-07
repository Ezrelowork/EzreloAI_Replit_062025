import { useState, useEffect, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressTracker, JourneyStats } from "@/components/progress-tracker";
import { TaskModal, useTaskModal } from "@/components/task-modal";
import { ZoomNavigation, useZoomNavigation } from "@/components/zoom-navigation";
import { TaskPage } from "@/components/task-page";
import { useToast } from "@/hooks/use-toast";
import { DynamicHighwaySign } from "@/components/dynamic-highway-sign";

// Direct imports for highway graphics
import highwayBackground from "@assets/highway-background.png";
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
  const { toast } = useToast();
  const taskCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const signPositionsRef = useRef<{ [key: string]: { left: string; top: string } }>({});
  
  // Store original sign positions and force reset after zoom out
  useEffect(() => {
    if (!isZoomed && !zoomOrigin) {
      // Small delay to ensure zoom animation completes
      setTimeout(() => {
        // Reset all sign positions to their stored originals
        Object.keys(signPositionsRef.current).forEach(stepId => {
          const signElement = document.querySelector(`[data-step-id="${stepId}"]`) as HTMLElement;
          if (signElement && signElement.style) {
            const originalPos = signPositionsRef.current[stepId];
            signElement.style.left = originalPos.left;
            signElement.style.top = originalPos.top;
            signElement.style.transform = 'translate(-50%, -50%)';
            signElement.style.transformOrigin = 'center';
          }
        });
        
        // Reset container
        const container = document.querySelector('.relative.max-w-7xl') as HTMLElement;
        if (container) {
          container.style.transform = 'none';
          container.style.transformOrigin = 'initial';
        }
      }, 100);
    }
  }, [isZoomed, zoomOrigin]);

  // Highway graphics
  const customGraphics = {
    roadBackground: {
      src: highwayBackground,
      alt: 'Highway Journey Background',
      width: 1200,
      height: 800
    }
  };

  // Load project data from database
  const projectQuery = useQuery({
    queryKey: ['/api/current-project'],
    retry: false,
  });

  const tasksQuery = useQuery({
    queryKey: ['/api/project-tasks', projectQuery.data?.id],
    enabled: !!projectQuery.data?.id,
    retry: false,
  });

  useEffect(() => {
    // Check for AI-generated project first
    const currentProjectId = localStorage.getItem('currentProjectId');
    
    if (projectQuery.data && tasksQuery.data) {
      // Use database project and tasks data
      const project = projectQuery.data;
      const tasks = tasksQuery.data || [];
      
      // Convert database tasks to journey steps
      const steps: JourneyStep[] = tasks.map((task: any, index: number) => {
        // Create curved path positions
        const baseX = 20 + (index * 15);
        const curveY = 50 + Math.sin(index * 0.8) * 20;
        
        // Determine sign type based on priority
        const signType = task.priority === 'high' ? 'warning' : 
                        task.priority === 'medium' ? 'highway' : 'info';
        
        return {
          id: `task-${task.id}`,
          title: task.title,
          description: task.description,
          week: task.timeframe || 'Week 1',
          tasks: [task.description],
          route: `/${task.taskType}` || '/dashboard',
          position: { x: baseX, y: curveY },
          signType: signType,
          completed: task.status === 'completed',
          priority: task.priority || 'medium'
        };
      });
      
      setJourneyData(steps);
      
      // Update localStorage for routing
      if (project.fromAddress && project.toAddress) {
        localStorage.setItem('aiFromLocation', project.fromAddress);
        localStorage.setItem('aiToLocation', project.toAddress);
        localStorage.setItem('aiMoveDate', project.moveDate || '');
      }
    } else {
      // Fallback to localStorage data (legacy support)
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
        // Create blank highway signs that await AI-generated content
        const blankSignPositions = [
          { x: 25, y: 45 },
          { x: 45, y: 35 },
          { x: 65, y: 55 },
          { x: 85, y: 40 }
        ];
        
        const blankSigns: JourneyStep[] = blankSignPositions.map((position, index) => ({
          id: `blank-sign-${index + 1}`,
          title: 'Generate Your Plan',
          description: 'Use the AI Assistant to create your personalized moving timeline',
          week: 'AI Planning',
          tasks: ['Start with AI Assistant to populate this sign with your custom plan'],
          route: '/ai-assistant',
          position,
          signType: 'info',
          completed: false,
          priority: 'medium'
        }));
        
        setJourneyData(blankSigns);
      }
    }
  }, [projectQuery.data, tasksQuery.data]);

  const handleTaskClick = (step: JourneyStep, event?: any) => {
    // Visual feedback - sign click animation
    if (event?.target) {
      const element = event.target as HTMLElement;
      element.style.transform = 'scale(0.95)';
      element.style.transition = 'transform 0.2s ease';
      
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 200);
    }
    
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

  const handleCompleteTask = (taskId: string) => {
    // Find the completed task
    const completedTask = journeyData.find(step => step.id === taskId);
    
    // Mark task as completed with celebration
    setJourneyData(prev => 
      prev.map(step => 
        step.id === taskId 
          ? { ...step, completed: true }
          : step
      )
    );
    
    // Show success notification
    if (completedTask) {
      toast({
        title: "Task Completed!",
        description: `${completedTask.title} has been marked as complete`,
        duration: 3000,
      });
    }
    
    // Visual celebration effect
    const taskElement = taskCardRefs.current[taskId];
    if (taskElement) {
      taskElement.style.transform = 'scale(1.1)';
      taskElement.style.filter = 'brightness(1.3)';
      setTimeout(() => {
        taskElement.style.transform = 'scale(1)';
        taskElement.style.filter = 'brightness(1)';
      }, 500);
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
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Hub
                </Button>
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/ai-assistant">
                <Button variant="ghost" size="sm" className="gap-2 text-blue-600 hover:text-blue-700">
                  AI Assistant
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
      <div 
        className="relative max-w-7xl mx-auto p-6 min-h-[600px] z-10"
        style={{ transform: 'none', transformOrigin: 'initial' }}
      >
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
          
          // Show only first 4 tasks as highway signs
          if (index >= 4) {
            return null;
          }
          
          // Position four signs with different graphics
          let position;
          if (index === 0) {
            position = { left: '20%', top: '75%' };    // Sign 1 - moving company (moved 5% right)
          } else if (index === 1) {
            position = { left: '75%', top: '65%' };    // Sign 2 - moved 35% total right to other side of road
          } else if (index === 2) {
            position = { left: '70%', top: '49%' };    // Sign 4 - transfer services (cropped)
          } else if (index === 3) {
            position = { left: '50%', top: '20%' };    // Sign 5 - essential services (top center)
          } else {
            // Hide remaining signs for now
            return null;
          }
          
          // Store original position
          signPositionsRef.current[step.id] = { left: position.left, top: position.top };
          
          return (
            <div
              key={step.id}
              ref={el => taskCardRefs.current[step.id] = el}
              data-step-id={step.id}
              className="absolute z-20"
              style={{
                left: position.left,
                top: position.top,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <DynamicHighwaySign
                title={step.title}
                description={step.description}
                week={step.week}
                priority={step.priority}
                completed={step.completed}
                onClick={() => handleTaskClick(step)}
                className="group"
              />
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
            onComplete={zoomOut}
            onBack={zoomOut}
            onTaskComplete={handleCompleteTask}
          />
        )}
      </ZoomNavigation>
    </div>
  );
}