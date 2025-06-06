import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Clock
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

// Enhanced icon mapping for tasks
const getTaskIcon = (task: string) => {
  const taskLower = task.toLowerCase();
  if (taskLower.includes('mover') || taskLower.includes('moving') || taskLower.includes('transport')) return Truck;
  if (taskLower.includes('pack') || taskLower.includes('box') || taskLower.includes('organize')) return Package;
  if (taskLower.includes('home') || taskLower.includes('house') || taskLower.includes('property')) return Home;
  if (taskLower.includes('electric') || taskLower.includes('power') || taskLower.includes('utility')) return Zap;
  if (taskLower.includes('internet') || taskLower.includes('wifi') || taskLower.includes('cable')) return Wifi;
  if (taskLower.includes('phone') || taskLower.includes('mobile') || taskLower.includes('cellular')) return Phone;
  if (taskLower.includes('health') || taskLower.includes('medical') || taskLower.includes('doctor')) return Stethoscope;
  if (taskLower.includes('school') || taskLower.includes('education') || taskLower.includes('enroll')) return GraduationCap;
  if (taskLower.includes('bank') || taskLower.includes('financial') || taskLower.includes('insurance')) return Building;
  return CheckCircle;
};

export default function MovingJourney() {
  const [, setLocation] = useLocation();
  const [journeyData, setJourneyData] = useState<JourneyStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<JourneyStep | null>(null);

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

  const handleStepClick = (step: JourneyStep) => {
    setSelectedStep(step);
  };

  const handleStartTask = (step: JourneyStep) => {
    // Pass address data to dashboard route if needed
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = localStorage.getItem('aiFromLocation');
    const toParam = localStorage.getItem('aiToLocation');
    const dateParam = localStorage.getItem('aiMoveDate');
    
    if (step.route === '/dashboard' && fromParam && toParam) {
      setLocation(`/dashboard?from=${encodeURIComponent(fromParam)}&to=${encodeURIComponent(toParam)}&date=${dateParam || ''}`);
    } else {
      setLocation(step.route);
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
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-green-200 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/ai-assistant">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to AI Assistant
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Your Moving Journey</h1>
          <div className="w-32"></div>
        </div>
      </div>

      {/* Sky and Clouds */}
      <div className="absolute inset-0">
        {/* Clouds */}
        <div className="absolute top-20 left-20 w-32 h-16 bg-white rounded-full opacity-80 animate-pulse"></div>
        <div className="absolute top-32 right-40 w-24 h-12 bg-white rounded-full opacity-70 animate-pulse"></div>
        <div className="absolute top-16 right-80 w-28 h-14 bg-white rounded-full opacity-75 animate-pulse"></div>
      </div>

      {/* Ground/Hills */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-green-400 to-green-200">
        <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path d="M0,200 Q300,150 600,180 T1200,160 L1200,200 Z" fill="#22c55e" opacity="0.8"/>
          <path d="M0,200 Q200,170 400,190 T800,175 T1200,185 L1200,200 Z" fill="#16a34a" opacity="0.6"/>
        </svg>
      </div>

      {/* Main Road */}
      <div className="absolute inset-0 pt-24">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Road surface */}
          <path 
            d="M 5 50 Q 25 30 50 50 Q 75 70 95 50" 
            stroke="#374151" 
            strokeWidth="8" 
            fill="none"
          />
          {/* Road centerline */}
          <path 
            d="M 5 50 Q 25 30 50 50 Q 75 70 95 50" 
            stroke="#fbbf24" 
            strokeWidth="0.5" 
            fill="none"
            strokeDasharray="2,2"
          />
        </svg>
      </div>

      {/* Journey Steps - Action Plan as Road Signs */}
      <div className="absolute inset-0 pt-24">
        {journeyData.map((step, index) => {
          const IconComponent = getTaskIcon(step.title);
          const signColor = getSignColor(step.signType, step.priority);
          
          return (
            <div
              key={step.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                left: `${step.position.x}%`,
                top: `${step.position.y + 35}%`,
              }}
              onClick={() => handleStartTask(step)}
            >
              {/* Sign Post */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-20 bg-gray-700 mb-3 shadow-lg"></div>
                
                {/* Road Sign - Different shapes based on type */}
                <div 
                  className={`${signColor} text-white px-5 py-4 shadow-2xl transform hover:scale-110 transition-all duration-300 min-w-32 text-center border-4 border-white group-hover:rotate-2`}
                  style={step.signType === 'stop' ? { 
                    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                    borderRadius: '0px'
                  } : step.signType === 'warning' ? {
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    borderRadius: '0px'
                  } : {
                    borderRadius: step.signType === 'info' ? '50%' : '12px'
                  }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <IconComponent className="w-6 h-6" />
                    {step.signType === 'stop' && <div className="text-lg font-black">STOP</div>}
                    {step.signType === 'warning' && <div className="text-sm font-bold">STEP {index + 1}</div>}
                    {step.signType === 'highway' && <div className="text-sm font-bold">FINISH</div>}
                    {step.signType === 'info' && <div className="text-sm font-bold">GO</div>}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {step.title.substring(0, 12)}
                    {step.title.length > 12 ? '...' : ''}
                  </div>
                </div>

                {/* Action Details */}
                <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 max-w-48 text-center group-hover:shadow-xl transition-shadow">
                  <div className="text-sm font-bold text-gray-800 mb-2">
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-600 mb-3 leading-relaxed">
                    {step.description.substring(0, 80)}
                    {step.description.length > 80 ? '...' : ''}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <div className={`px-2 py-1 rounded-full text-white font-medium ${
                      step.priority === 'high' ? 'bg-red-500' : 
                      step.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}>
                      {step.priority} priority
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {step.week}
                  </div>
                  <div className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                    Click to Start →
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start and End Markers */}
      <div className="absolute bottom-20 left-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-gray-700">Start Journey</span>
      </div>
      
      <div className="absolute bottom-20 right-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-gray-700">New Home!</span>
      </div>


    </div>
  );
}