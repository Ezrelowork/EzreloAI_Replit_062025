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
    // Get timeline data from localStorage (from AI assistant)
    const savedTimeline = localStorage.getItem('aiTimeline');
    const savedActionPlan = localStorage.getItem('aiActionPlan');
    
    if (savedTimeline && savedActionPlan) {
      const timeline = JSON.parse(savedTimeline);
      const actionPlan = JSON.parse(savedActionPlan);
      
      // Transform timeline into journey steps with road positions
      const steps: JourneyStep[] = timeline.map((phase: any, index: number) => {
        const totalSteps = timeline.length;
        const progress = index / (totalSteps - 1 || 1);
        
        // Calculate curved road positions
        const baseX = 10 + (progress * 80);
        const curveY = 20 + Math.sin(progress * Math.PI * 2) * 15;
        
        // Find matching action from action plan
        const matchingAction = actionPlan.find((action: any) => 
          action.title.toLowerCase().includes(phase.week.toLowerCase()) ||
          phase.tasks.some((task: string) => action.title.toLowerCase().includes(task.toLowerCase()))
        );
        
        return {
          id: `step-${index}`,
          title: phase.week,
          description: phase.tasks.join(', '),
          week: phase.week,
          tasks: phase.tasks,
          route: matchingAction?.route || '/dashboard',
          position: { x: baseX, y: curveY },
          signType: index === 0 ? 'stop' : index === timeline.length - 1 ? 'highway' : 'warning',
          completed: false
        };
      });
      
      setJourneyData(steps);
    }
  }, []);

  const handleStepClick = (step: JourneyStep) => {
    setSelectedStep(step);
  };

  const handleStartTask = (route: string) => {
    setLocation(route);
  };

  const getSignColor = (signType: string) => {
    switch (signType) {
      case 'stop': return 'bg-red-600';
      case 'warning': return 'bg-yellow-500';
      case 'highway': return 'bg-green-600';
      case 'info': return 'bg-blue-600';
      default: return 'bg-gray-600';
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

      {/* Journey Steps */}
      <div className="absolute inset-0 pt-24">
        {journeyData.map((step, index) => {
          const IconComponent = getTaskIcon(step.tasks[0] || "");
          return (
            <div
              key={step.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${step.position.x}%`,
                top: `${step.position.y + 40}%`,
              }}
              onClick={() => handleStepClick(step)}
            >
              {/* Sign Post */}
              <div className="flex flex-col items-center">
                <div className="w-2 h-16 bg-gray-700 mb-2"></div>
                
                {/* Road Sign */}
                <div 
                  className={`${getSignColor(step.signType)} text-white px-4 py-3 rounded-lg shadow-xl transform hover:scale-105 transition-all duration-200 min-w-28 text-center border-2 border-white`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <IconComponent className="w-5 h-5" />
                    <span className="font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="text-xs font-semibold whitespace-nowrap">
                    {step.week.replace('Week ', 'WK ')}
                  </div>
                  {step.completed && (
                    <CheckCircle className="w-4 h-4 text-green-300 mx-auto mt-1" />
                  )}
                </div>

                {/* Task Preview */}
                <div className="mt-3 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 max-w-44 text-center">
                  <div className="text-xs font-semibold text-gray-800 mb-1">
                    {step.tasks[0]}
                  </div>
                  {step.tasks.length > 1 && (
                    <div className="text-xs text-gray-500">
                      +{step.tasks.length - 1} more
                    </div>
                  )}
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

      {/* Step Detail Modal */}
      {selectedStep && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedStep.title}</h3>
              <button 
                onClick={() => setSelectedStep(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              {selectedStep.tasks.map((task, index) => {
                const IconComponent = getTaskIcon(task);
                return (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <IconComponent className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-700">{task}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setSelectedStep(null)}
                variant="outline" 
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                onClick={() => handleStartTask(selectedStep.route)}
                className="flex-1"
              >
                Start Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}