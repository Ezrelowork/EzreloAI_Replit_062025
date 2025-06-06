import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JourneyRoad, JourneyLandscape } from "@/components/journey-assets";
import { ProgressTracker, JourneyStats } from "@/components/progress-tracker";
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
    
    // Pass location data for relevant routes
    if ((targetRoute === '/dashboard' || targetRoute === '/utilities') && fromParam && toParam) {
      setLocation(`${targetRoute}?from=${encodeURIComponent(fromParam)}&to=${encodeURIComponent(toParam)}&date=${dateParam || ''}`);
    } else {
      setLocation(targetRoute);
    }
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
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(to bottom, #87ceeb 0%, #98d982 40%, #7cb342 100%)'
    }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/ai-assistant">
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to AI Assistant
            </Button>
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-wide drop-shadow-lg">MOVING JOURNEY</h1>
          <div className="w-32"></div>
        </div>
      </div>

      {/* Rolling Hills Background with Trees */}
      <div className="absolute inset-0">
        {/* Background Hills */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <defs>
            <radialGradient id="treeGradient" cx="50%" cy="30%">
              <stop offset="0%" stopColor="#2d5016"/>
              <stop offset="100%" stopColor="#1a3009"/>
            </radialGradient>
          </defs>
          
          {/* Rolling hills layers */}
          <path d="M0,800 Q200,600 400,650 T800,620 T1200,640 L1200,800 Z" fill="#7cb342" opacity="0.9"/>
          <path d="M0,800 Q300,580 600,610 T1000,590 T1200,605 L1200,800 Z" fill="#689f38" opacity="0.8"/>
          <path d="M0,800 Q150,620 350,640 T700,630 T1200,650 L1200,800 Z" fill="#558b2f" opacity="0.7"/>
          
          {/* Trees scattered on hills */}
          <ellipse cx="150" cy="620" rx="25" ry="40" fill="url(#treeGradient)" opacity="0.8"/>
          <ellipse cx="320" cy="640" rx="30" ry="45" fill="url(#treeGradient)" opacity="0.7"/>
          <ellipse cx="480" cy="610" rx="20" ry="35" fill="url(#treeGradient)" opacity="0.9"/>
          <ellipse cx="650" cy="630" rx="35" ry="50" fill="url(#treeGradient)" opacity="0.6"/>
          <ellipse cx="820" cy="620" rx="25" ry="40" fill="url(#treeGradient)" opacity="0.8"/>
          <ellipse cx="950" cy="640" rx="28" ry="42" fill="url(#treeGradient)" opacity="0.7"/>
          <ellipse cx="1100" cy="630" rx="22" ry="38" fill="url(#treeGradient)" opacity="0.9"/>
          
          {/* Additional tree clusters */}
          <ellipse cx="90" cy="680" rx="15" ry="25" fill="url(#treeGradient)" opacity="0.6"/>
          <ellipse cx="250" cy="690" rx="18" ry="30" fill="url(#treeGradient)" opacity="0.8"/>
          <ellipse cx="420" cy="670" rx="20" ry="35" fill="url(#treeGradient)" opacity="0.7"/>
          <ellipse cx="580" cy="685" rx="16" ry="28" fill="url(#treeGradient)" opacity="0.9"/>
          <ellipse cx="750" cy="675" rx="22" ry="36" fill="url(#treeGradient)" opacity="0.6"/>
          <ellipse cx="890" cy="690" rx="19" ry="32" fill="url(#treeGradient)" opacity="0.8"/>
          <ellipse cx="1050" cy="680" rx="17" ry="29" fill="url(#treeGradient)" opacity="0.7"/>
        </svg>
      </div>

      {/* Enhanced Diagonal Highway - Ready for Custom Graphics */}
      <div className="absolute inset-0 pt-20">
        <JourneyRoad className="w-full h-full" />
      </div>

      {/* Compact Highway Signs Following Diagonal Road */}
      <div className="absolute inset-0 pt-24">
        {journeyData.map((step, index) => {
          const IconComponent = getTaskIcon(step.title);
          
          // Calculate position along the diagonal curved path from top-left to bottom-right
          const progress = index / (journeyData.length - 1 || 1);
          
          // Follow the curved road path: M 100 100 Q 300 200 500 150 Q 700 100 900 250 Q 1000 350 1100 700
          let xPosition, yPosition;
          
          if (progress <= 0.33) {
            // First curve: Q 300 200 500 150
            const t = progress / 0.33;
            xPosition = 100 + t * 400; // 100 to 500
            yPosition = 100 + t * 50; // 100 to 150
          } else if (progress <= 0.66) {
            // Second curve: Q 700 100 900 250
            const t = (progress - 0.33) / 0.33;
            xPosition = 500 + t * 400; // 500 to 900
            yPosition = 150 + t * 100; // 150 to 250
          } else {
            // Final curve: Q 1000 350 1100 700
            const t = (progress - 0.66) / 0.34;
            xPosition = 900 + t * 200; // 900 to 1100
            yPosition = 250 + t * 450; // 250 to 700
          }
          
          // Offset signs to alternate sides of the road
          const signOffset = index % 2 === 0 ? 80 : -80;
          const finalX = xPosition + signOffset;
          
          return (
            <div
              key={step.id}
              className="absolute cursor-pointer group transform hover:scale-125 transition-all duration-300"
              style={{
                left: `${(finalX / 1200) * 100}%`,
                top: `${(yPosition / 800) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handleStartTask(step)}
            >
              {/* Compact Sign */}
              <div className="flex flex-col items-center">
                {/* Interactive Highway Sign with Dynamic Styling */}
                <div className={`text-white px-4 py-3 rounded-xl shadow-2xl border-3 border-white transform group-hover:rotate-2 group-hover:scale-110 transition-all duration-300 min-w-24 text-center relative cursor-pointer ${
                  step.priority === 'high' ? 'bg-red-600 hover:bg-red-500' : 
                  step.priority === 'medium' ? 'bg-yellow-600 hover:bg-yellow-500' : 
                  'bg-green-600 hover:bg-green-500'
                }`}>
                  {/* Inner border glow effect */}
                  <div className="absolute inset-1 border border-white/40 rounded-lg"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-2">
                      <IconComponent className="w-5 h-5 drop-shadow-lg" />
                    </div>
                    <div className="text-xs font-black uppercase tracking-wider leading-tight drop-shadow-md">
                      {step.title.length > 10 ? 
                        step.title.substring(0, 10).replace(/\s+/g, '').toUpperCase() : 
                        step.title.replace(/\s+/g, '').toUpperCase()
                      }
                    </div>
                    <div className="text-xs opacity-90 mt-1 font-semibold">
                      {step.week}
                    </div>
                  </div>
                  
                  {/* Enhanced priority indicator with animation */}
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-lg animate-pulse ${
                    step.priority === 'high' ? 'bg-red-500' : 
                    step.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Click indicator */}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white text-gray-800 text-xs px-2 py-1 rounded font-bold shadow-lg">
                      CLICK
                    </div>
                  </div>
                </div>

                {/* Stylized sign post with shadow */}
                <div className="w-3 h-12 bg-gradient-to-b from-gray-600 to-gray-800 shadow-lg mt-2 rounded-sm"></div>

                {/* Enhanced hover details popup */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 absolute top-16 bg-white/96 backdrop-blur-md rounded-2xl p-4 shadow-2xl border-2 border-blue-200 min-w-64 z-30 transform group-hover:scale-105">
                  <div className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                    {step.title}
                  </div>
                  <div className="text-sm text-gray-700 mb-4 leading-relaxed">
                    {step.description}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`px-3 py-2 rounded-full text-xs font-bold text-white shadow-lg ${
                      step.priority === 'high' ? 'bg-red-500' : 
                      step.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}>
                      {step.priority.toUpperCase()} PRIORITY
                    </div>
                    <div className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-2 rounded-lg">
                      START TASK →
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg text-center">
                    Timeline: {step.week}
                  </div>
                  
                  {/* Arrow pointing to sign */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-blue-200 rotate-45"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Journey Progress Tracking */}
      <div className="absolute top-24 right-6 space-y-4 w-80">
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

      {/* Start and End Markers */}
      <div className="absolute top-24 left-20 flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border-2 border-blue-200">
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
        <span className="text-base font-bold text-gray-800">START YOUR JOURNEY</span>
      </div>
      
      <div className="absolute bottom-16 right-20 flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border-2 border-green-200">
        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
        <span className="text-base font-bold text-gray-800">NEW HOME AWAITS!</span>
      </div>

      {/* Interactive Instructions */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-2xl">
        <div className="text-white text-center">
          <div className="text-lg font-bold mb-2">🛣️ Interactive Moving Journey</div>
          <div className="text-sm opacity-90">Click any highway sign to start that task • Follow the road from start to finish</div>
        </div>
      </div>

    </div>
  );
}