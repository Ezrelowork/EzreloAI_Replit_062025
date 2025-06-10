import { useState, useEffect, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{ title: string; description: string } | null>(null);
  const [showEditPanel, setShowEditPanel] = useState(false);
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

  // Load project data from database with simplified error handling
  const projectQuery = useQuery({
    queryKey: ['/api/current-project'],
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.log('Database project query failed, will use localStorage fallback:', error);
    }
  });

  const tasksQuery = useQuery({
    queryKey: ['/api/project-tasks', projectQuery.data?.id],
    enabled: false, // Disable this query for now to prevent cascading errors
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    console.log('Journey data setup running...');

    try {
      // Always check localStorage first for AI-generated action plan
      const savedActionPlan = localStorage.getItem('aiActionPlan');

      if (savedActionPlan) {
        try {
          console.log('Using saved AI action plan from localStorage');
          const actionPlan = JSON.parse(savedActionPlan);

          // Transform action plan into journey steps with road positions
          const steps: JourneyStep[] = actionPlan.map((action: any, index: number) => {
            let title = action.task || action.title || `Task ${index + 1}`;
            let description = action.details || action.description || 'Complete this moving task';

            // Customize the first sign to be "Moving and Storage"
            if (index === 0) {
              title = "Moving and Storage";
              description = "Find moving companies and storage solutions for your relocation";
            }

            return {
              id: `action-${index}`,
              title: title,
              description: description,
              week: action.timeframe || action.week || `Week ${Math.floor(index / 2) + 1}`,
              tasks: [description],
              priority: action.priority || (index < 2 ? 'high' : index < 4 ? 'medium' : 'low'),
              completed: false,
              route: action.route || '/dashboard',
              position: { x: 20 + (index * 15), y: 50 + Math.sin(index * 0.8) * 20 },
              signType: action.priority === 'high' ? 'warning' : action.priority === 'medium' ? 'highway' : 'info',
            };
          });

          console.log('Setting journey data from action plan:', steps.length, 'steps');
          setJourneyData(steps);
          return; // Exit early if we successfully loaded from localStorage
        } catch (parseError) {
          console.error('Failed to parse action plan:', parseError);
        }
      }

      // Fallback to default signs if no saved data or parsing failed
      console.log('Using default highway signs');
      setJourneyData(getDefaultSigns());

    } catch (error) {
      console.error('Error in journey data setup:', error);
      // Ensure we always have some journey data
      setJourneyData(getDefaultSigns());
    }
  }, []); // Remove all dependencies to prevent infinite re-renders

  // Helper function for default signs
  const getDefaultSigns = (): JourneyStep[] => {
    return [
      {
        id: 'default-sign-1',
        title: 'Moving and Storage',
        description: 'Find moving companies and storage solutions for your relocation',
        week: 'Week 1',
        tasks: ['Research moving companies', 'Get quotes', 'Compare options'],
        route: '/task',
        position: { x: 25, y: 45 },
        signType: 'highway',
        completed: false,
        priority: 'high'
      },
      {
        id: 'default-sign-2',
        title: 'Utility Setup',
        description: 'Set up internet, electric, gas, and water services',
        week: 'Week 2',
        tasks: ['Contact utility providers', 'Schedule connections', 'Transfer services'],
        route: '/utilities',
        position: { x: 45, y: 35 },
        signType: 'warning',
        completed: false,
        priority: 'high'
      },
      {
        id: 'default-sign-3',
        title: 'Change of Address',
        description: 'USPS official address change. Update banks, insurance, subscriptions, etc.',
        week: 'Week 3',
        tasks: ['File USPS change of address', 'Update banks', 'Update insurance', 'Update subscriptions'],
        route: '/documentation',
        position: { x: 65, y: 55 },
        signType: 'info',
        completed: false,
        priority: 'medium'
      },
      {
        id: 'default-sign-4',
        title: 'Local Services',
        description: 'Find schools, healthcare, and community services in your new area',
        week: 'Week 4',
        tasks: ['Research schools', 'Find healthcare providers', 'Locate essential services'],
        route: '/local-services',
        position: { x: 85, y: 40 },
        signType: 'info',
        completed: false,
        priority: 'low'
      }
    ];
  };

  const handleTaskClick = (step: JourneyStep, event: React.MouseEvent, stepIndex: number) => {
    const cardElement = taskCardRefs.current[step.id];
    if (cardElement) {
      // Override Sign 3 content for task modal
      let taskTitle = step.title;
      let taskDescription = step.description;

      if (stepIndex === 2) {
        taskTitle = "Change of Address";
        taskDescription = "USPS official address change. Update banks, insurance, subscriptions, etc.";
      }

      // Cinematic zoom into the task card
      zoomIntoTask(cardElement, {
        id: step.id,
        title: taskTitle,
        description: taskDescription,
        priority: step.priority,
        week: step.week,
        category: getCategoryFromTask(taskTitle)
      });
    }
  };

  const handleEditTask = (step: JourneyStep) => {
    setEditingTaskId(step.id);
    setEditingData({
      title: step.title,
      description: step.description
    });
    setShowEditPanel(true);

    toast({
      title: "Edit Mode",
      description: "You can now edit the task details inline",
      duration: 2000,
    });
  };

  const handleSaveEdit = () => {
    if (!editingTaskId || !editingData) return;

    setJourneyData(prev => 
      prev.map(step => 
        step.id === editingTaskId 
          ? { ...step, title: editingData.title, description: editingData.description }
          : step
      )
    );

    // Update localStorage if using AI action plan
    const savedActionPlan = localStorage.getItem('aiActionPlan');
    if (savedActionPlan) {
      const actionPlan = JSON.parse(savedActionPlan);
      const updatedPlan = actionPlan.map((action: any, index: number) => 
        `action-${index}` === editingTaskId 
          ? { ...action, task: editingData.title, details: editingData.description }
          : action
      );
      localStorage.setItem('aiActionPlan', JSON.stringify(updatedPlan));
    }

    setEditingTaskId(null);
    setEditingData(null);
    setShowEditPanel(false);

    toast({
      title: "Task Updated",
      description: "Your changes have been saved successfully",
      duration: 2000,
    });
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingData(null);
    setShowEditPanel(false);
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
      targetRoute = '/task';
    } else if (combined.includes('utility') || combined.includes('electric') || combined.includes('internet') || 
               combined.includes('gas') || combined.includes('water') || combined.includes('cable')) {
      targetRoute = '/utilities';
    } else if (combined.includes('local') || combined.includes('school') || combined.includes('doctor') || 
               combined.includes('healthcare') || combined.includes('community') || combined.includes('services')) {
      targetRoute = '/local-services';
    } else if (combined.includes('address') || combined.includes('documentation') || combined.includes('registration') || 
               combined.includes('voter') || combined.includes('license') || combined.includes('update')) {
      targetRoute = '/documentation';
    } else if (combined.includes('pack') || combined.includes('organize') || combined.includes('checklist')) {
      targetRoute = '/moving-checklist';
    }

    // Build query params for context preservation
    const params = new URLSearchParams();
    if (fromParam) params.set('from', fromParam);
    if (toParam) params.set('to', toParam);
    if (dateParam) params.set('date', dateParam);

    // Add task details for the task page
    params.set('taskId', step.id);
    params.set('taskTitle', step.title);
    params.set('taskDescription', step.description);
    params.set('taskPriority', step.priority);
    params.set('taskWeek', step.week);

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
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  // Only go to hub if we don't have journey data, otherwise stay on journey
                  if (journeyData.length === 0) {
                    window.location.href = '/';
                  } else {
                    // Refresh journey page to reset any zoom state
                    window.location.reload();
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                {journeyData.length === 0 ? 'Back to Hub' : 'Reset Journey'}
              </Button>
              <span className="text-gray-300">|</span>
              <Link href="/ai-assistant">
                <Button variant="ghost" size="sm" className="gap-2 text-blue-600 hover:text-blue-700">
                  AI Assistant
                </Button>
              </Link>
              <span className="text-gray-300">|</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-green-600 hover:text-green-700"
                onClick={() => setShowEditPanel(true)}
              >
                Edit Mode
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interactive Moving Journey</h1>
                <p className="text-sm text-gray-600">Your personalized step-by-step relocation roadmap • Hold Shift + Click signs to edit</p>
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
            position = { left: '22%', top: '73%' };    // Sign 1 - moved right 7% total and up 2%
          } else if (index === 1) {
            position = { left: '75%', top: '65%' };    // Sign 2 - moved 35% total right to other side of road
          } else if (index === 2) {
            position = { left: '38%', top: '29%' };    // Sign 3 - moved left 32% total and up 20% total
          } else if (index === 3) {
            position = { left: '78%', top: '23%' };    // Sign 4 - moved right 28% total and down 3%
          } else {
            // Hide remaining signs for now
            return null;
          }

          // Store original position
          signPositionsRef.current[step.id] = { left: position.left, top: position.top };

          // Override Sign 3 content specifically
          let displayTitle = step.title;
          let displayDescription = step.description;

          if (index === 2) {
            displayTitle = "Change of Address";
            displayDescription = "USPS official address change. Update banks, insurance, subscriptions, etc.";
          }

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
                title={displayTitle}
                description={displayDescription}
                week={step.week}
                priority={step.priority}
                completed={step.completed}
                onClick={(e) => handleTaskClick(step, e, index)}
                className="group"
              />

              {/* Hover Card */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="bg-white rounded-lg shadow-xl p-3 border min-w-48">
                      <h4 className="font-semibold text-sm text-gray-900">{displayTitle}</h4>
                      <p className="text-xs text-gray-600 mt-1">{displayDescription}</p>
                      <div className="flex gap-1 mt-2">
                        <Badge variant={step.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {step.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{step.week}</Badge>
                      </div>
                    </div>
                  </div>
            </div>
          );
        })}
      </div>



      {/* Priority Stats Box - In Grass Area Lower Right */}
      <div className="absolute bottom-16 right-8 z-30">
        <JourneyStats 
          highPriority={journeyData.filter(step => step.priority === 'high').length}
          mediumPriority={journeyData.filter(step => step.priority === 'medium').length}
          lowPriority={journeyData.filter(step => step.priority === 'low').length}
        />
      </div>

      {/* Inline Editing Panel */}
      {showEditPanel && editingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Edit Task</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <Input
                  value={editingData.title}
                  onChange={(e) => setEditingData(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={editingData.description}
                  onChange={(e) => setEditingData(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
              <Button 
                onClick={handleCancelEdit}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cinematic Journey Info */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">🎬 Cinematic Journey</span>
            <span className="text-xs text-gray-300">Click any task • Hold Shift + Click to edit • Stay on this page</span>
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