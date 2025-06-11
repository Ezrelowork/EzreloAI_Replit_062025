import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JourneyRoad, JourneyLandscape, GraphicsTimeline } from "@/components/journey-assets";
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
  Wifi,
  Phone,
  Stethoscope,
  GraduationCap,
  Building,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  MapPin,
  Car,
  AlertTriangle,
  Info,
  Heart,
  Wrench,
  Key,
  Users,
  CreditCard,
  Clipboard
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

// Comprehensive icon mapping for all moving tasks
const getTaskIcon = (task: string) => {
  const taskLower = task.toLowerCase();
  
  // Moving & Transport
  if (taskLower.includes('mover') || taskLower.includes('moving') || taskLower.includes('transport') || taskLower.includes('truck')) return Truck;
  if (taskLower.includes('pack') || taskLower.includes('box') || taskLower.includes('organize') || taskLower.includes('inventory')) return Package;
  
  // Housing & Property
  if (taskLower.includes('home') || taskLower.includes('house') || taskLower.includes('property') || taskLower.includes('inspection')) return Home;
  if (taskLower.includes('key') || taskLower.includes('lock') || taskLower.includes('access') || taskLower.includes('security')) return Key;
  
  // Utilities & Services
  if (taskLower.includes('electric') || taskLower.includes('power') || taskLower.includes('utility') || taskLower.includes('gas')) return Zap;
  if (taskLower.includes('internet') || taskLower.includes('wifi') || taskLower.includes('cable') || taskLower.includes('broadband')) return Wifi;
  if (taskLower.includes('phone') || taskLower.includes('mobile') || taskLower.includes('cellular') || taskLower.includes('landline')) return Phone;
  if (taskLower.includes('water') || taskLower.includes('sewer') || taskLower.includes('trash') || taskLower.includes('waste')) return Wrench;
  
  // Healthcare & Medical
  if (taskLower.includes('health') || taskLower.includes('medical') || taskLower.includes('doctor') || taskLower.includes('dentist') || taskLower.includes('prescription')) return Stethoscope;
  if (taskLower.includes('veterinar') || taskLower.includes('pet') || taskLower.includes('animal')) return Heart;
  
  // Education & Family
  if (taskLower.includes('school') || taskLower.includes('education') || taskLower.includes('enroll') || taskLower.includes('daycare')) return GraduationCap;
  if (taskLower.includes('family') || taskLower.includes('children') || taskLower.includes('kids') || taskLower.includes('spouse')) return Users;
  
  // Financial & Legal
  if (taskLower.includes('bank') || taskLower.includes('financial') || taskLower.includes('credit') || taskLower.includes('loan')) return CreditCard;
  if (taskLower.includes('insurance') || taskLower.includes('policy') || taskLower.includes('coverage')) return Shield;
  if (taskLower.includes('legal') || taskLower.includes('attorney') || taskLower.includes('lawyer') || taskLower.includes('contract')) return FileText;
  
  // Address Changes & Registration
  if (taskLower.includes('address') || taskLower.includes('registration') || taskLower.includes('voter') || taskLower.includes('dmv')) return MapPin;
  if (taskLower.includes('license') || taskLower.includes('permit') || taskLower.includes('id') || taskLower.includes('vehicle')) return Car;
  
  // Documentation & Records
  if (taskLower.includes('record') || taskLower.includes('document') || taskLower.includes('file') || taskLower.includes('paperwork')) return Clipboard;
  if (taskLower.includes('notify') || taskLower.includes('inform') || taskLower.includes('update') || taskLower.includes('change')) return Info;
  
  // Emergency & Important
  if (taskLower.includes('urgent') || taskLower.includes('important') || taskLower.includes('critical') || taskLower.includes('deadline')) return AlertTriangle;
  
  return CheckCircle;
};

export default function MovingJourney() {
  const [, setLocation] = useLocation();
  const [journeyData, setJourneyData] = useState<JourneyStep[]>([]);
  const { isOpen, currentTask, openModal, closeModal } = useTaskModal();
  const { isZoomed, zoomOrigin, currentTaskData, zoomIntoTask, zoomOut } = useZoomNavigation();
  const taskCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Create static graphics object from imports
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
    // Get action plan data from localStorage (from AI assistant)
    const savedActionPlan = localStorage.getItem('aiActionPlan');
    
    if (savedActionPlan) {
      const actionPlan = JSON.parse(savedActionPlan);
      
      // Transform action plan into journey steps with road positions
      const steps: JourneyStep[] = actionPlan.map((action: any, index: number) => {
        const totalSteps = actionPlan.length;
        const progress = index / (totalSteps - 1 || 1);
        
        // Calculate curved road positions with more spacing
        const baseX = 8 + (progress * 84);
        const curveY = 25 + Math.sin(progress * Math.PI * 1.5) * 20;
        
        // Determine sign type based on priority and position
        let signType = 'warning';
        if (action.priority === 'high') signType = 'stop';
        else if (index === actionPlan.length - 1) signType = 'highway';
        else if (action.route === '/dashboard') signType = 'info';
        
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
    }
  }, []);



  const handleTaskClick = (step: JourneyStep, event: React.MouseEvent) => {
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
               combined.includes('cable') || combined.includes('phone') || combined.includes('gas') || 
               combined.includes('water') || combined.includes('wifi')) {
      targetRoute = '/utilities';
    } else if (combined.includes('checklist') || combined.includes('organize') || combined.includes('pack') || 
               combined.includes('inventory') || combined.includes('timeline')) {
      targetRoute = '/moving-checklist';
    } else if (combined.includes('research') || combined.includes('compare') || combined.includes('recommend') || 
               combined.includes('evaluate') || combined.includes('analysis')) {
      targetRoute = '/ai-assistant';
    }
    
    // Close modal and navigate
    closeModal();
    
    // Pass location data for relevant routes
    if ((targetRoute === '/dashboard' || targetRoute === '/utilities') && fromParam && toParam) {
      setLocation(`${targetRoute}?from=${encodeURIComponent(fromParam)}&to=${encodeURIComponent(toParam)}&date=${dateParam || ''}`);
    } else {
      setLocation(targetRoute);
    }
  };

  const getCategoryFromTask = (title: string) => {
    const taskLower = title.toLowerCase();
    if (taskLower.includes('mover') || taskLower.includes('moving')) return 'Moving & Transport';
    if (taskLower.includes('utility') || taskLower.includes('electric') || taskLower.includes('internet')) return 'Utilities & Services';
    if (taskLower.includes('pack') || taskLower.includes('organize')) return 'Organization & Planning';
    if (taskLower.includes('address') || taskLower.includes('registration')) return 'Address Changes';
    if (taskLower.includes('health') || taskLower.includes('medical')) return 'Healthcare & Services';
    return 'General Tasks';
  };

  const getSignColor = (signType: string, priority?: string) => {
    if (priority === 'high') return 'bg-red-600 border-red-800';
    if (priority === 'medium') return 'bg-yellow-500 border-yellow-700';
    if (priority === 'low') return 'bg-green-600 border-green-800';
    
    switch (signType) {
      case 'stop': return 'bg-red-600 border-red-800';
      case 'warning': return 'bg-yellow-500 border-yellow-700';
      case 'highway': return 'bg-green-600 border-green-800';
      case 'info': return 'bg-blue-600 border-blue-800';
      default: return 'bg-gray-600 border-gray-800';
    }
  };

  const getSignShape = (signType: string) => {
    switch (signType) {
      case 'stop': return 'clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
      case 'warning': return 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%)';
      case 'highway': return 'border-radius: 8px';
      case 'info': return 'border-radius: 50%';
      default: return 'border-radius: 8px';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="relative z-20 p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/ai-assistant">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to AI Assistant
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Interactive Moving Journey</h1>
          <div className="w-32"></div>
        </div>
      </div>

      {/* Enhanced Journey Timeline with Custom Graphics */}
      <div className="relative max-w-7xl mx-auto p-6 min-h-[800px]">
        {/* Highway Background */}
        <div className="absolute inset-0 -z-10">
          <img 
            src={highwayBackground}
            alt="Highway Journey Background"
            className="w-full h-full object-cover opacity-80 rounded-3xl"
          />
        </div>

        {/* Highway Signs Positioned Along Road */}
        {journeyData.map((step, index) => {
          const IconComponent = getTaskIcon(step.title);
          const completedSteps = journeyData.filter(s => s.completed).length;
          const isCurrentStep = index === completedSteps && !step.completed;
          
          // Get custom sign for this task category
          const getCustomSign = (stepTitle: string) => {
            if (stepTitle.includes('Moving') || stepTitle.includes('Truck')) return customGraphics.taskIcons['moving'];
            if (stepTitle.includes('Utility') && stepTitle.includes('Setup')) return customGraphics.taskIcons['utilities-setup'];
            if (stepTitle.includes('Address')) return customGraphics.taskIcons['address-changes'];
            if (stepTitle.includes('Utility') || stepTitle.includes('Service')) return customGraphics.taskIcons['utilities-services'];
            if (stepTitle.includes('Essential') || stepTitle.includes('Medical')) return customGraphics.taskIcons['essential-services'];
            return customGraphics.taskIcons['moving']; // Default to first sign
          };

          const customSign = getCustomSign(step.title);
          
          // Position signs along the winding road path - more realistic highway positions
          const roadPositions = [
            { left: '12%', top: '75%' },   // Bottom left curve start
            { left: '28%', top: '58%' },   // Lower curve
            { left: '50%', top: '45%' },   // Middle section
            { left: '72%', top: '32%' },   // Upper curve
            { left: '85%', top: '18%' }    // Top right
          ];
          
          const position = roadPositions[index % roadPositions.length] || { left: '50%', top: '50%' };
          
          return (
            <div
              key={step.id}
              ref={el => taskCardRefs.current[step.id] = el}
              data-step-id={step.id}
              className="absolute cursor-pointer transition-all duration-300 hover:scale-110 hover:z-10"
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
                  className={`w-28 h-20 object-contain transition-all duration-300 drop-shadow-lg ${
                    step.completed ? 'opacity-80 saturate-50' : 'hover:brightness-110'
                  }`}
                />
                
                {/* Completion Check */}
                {step.completed && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Current Step Indicator */}
                {isCurrentStep && (
                  <div className="absolute inset-0 rounded-lg ring-4 ring-blue-400 ring-opacity-50 animate-pulse"></div>
                )}
                
                {/* Hover Card */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                  <div className="bg-white rounded-lg shadow-xl p-3 border min-w-48">
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

      {/* Fixed Position Progress Tracker */}
      <div className="fixed top-24 right-6 space-y-4 w-80 z-30">
        <ProgressTracker 
          totalSteps={journeyData.length}
          completedSteps={journeyData.filter(step => step.completed).length}
          currentStep={journeyData.findIndex(step => !step.completed) + 1}
        />
        
        <JourneyStats
          highPriority={journeyData.filter(step => step.priority === 'high').length}
          mediumPriority={journeyData.filter(step => step.priority === 'medium').length}
          lowPriority={journeyData.filter(step => step.priority === 'low').length}
        />
      </div>

      {/* Interactive Instructions */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-2xl z-30">
        <div className="text-white text-center">
          <div className="text-lg font-bold mb-2">🎬 Cinematic Journey</div>
          <div className="text-sm opacity-90">Click any task card to zoom in • Experience immersive task management</div>
        </div>
      </div>

      {/* Cinematic Zoom Navigation */}
      <ZoomNavigation
        isZoomed={isZoomed}
        onZoomOut={zoomOut}
        zoomOrigin={zoomOrigin}
      >
        {currentTaskData && (
          <TaskPage
            task={currentTaskData}
            onComplete={() => {
              // Mark task as complete and zoom out
              zoomOut();
            }}
          />
        )}
      </ZoomNavigation>

    </div>
  );
}