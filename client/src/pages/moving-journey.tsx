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

      {/* Vertical Zigzag Highway */}
      <div className="absolute inset-0 pt-20">
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <defs>
            <pattern id="roadDashes" patternUnits="userSpaceOnUse" width="30" height="8">
              <rect width="15" height="8" fill="#fbbf24" />
            </pattern>
          </defs>
          
          {/* Road shadow/depth */}
          <path 
            d="M 200 150 Q 400 250 200 350 Q 0 450 200 550 Q 400 650 200 750" 
            stroke="#2d3748" 
            strokeWidth="120" 
            fill="none"
            opacity="0.3"
            transform="translate(5, 5)"
          />
          
          {/* Main road surface */}
          <path 
            d="M 200 150 Q 400 250 200 350 Q 0 450 200 550 Q 400 650 200 750" 
            stroke="#4a5568" 
            strokeWidth="110" 
            fill="none"
          />
          
          {/* Road edge lines */}
          <path 
            d="M 200 150 Q 400 250 200 350 Q 0 450 200 550 Q 400 650 200 750" 
            stroke="#2d3748" 
            strokeWidth="6" 
            fill="none"
            transform="translate(-52, 0)"
          />
          <path 
            d="M 200 150 Q 400 250 200 350 Q 0 450 200 550 Q 400 650 200 750" 
            stroke="#2d3748" 
            strokeWidth="6" 
            fill="none"
            transform="translate(52, 0)"
          />
          
          {/* Yellow center dashed line */}
          <path 
            d="M 200 150 Q 400 250 200 350 Q 0 450 200 550 Q 400 650 200 750" 
            stroke="url(#roadDashes)" 
            strokeWidth="8" 
            fill="none"
            strokeDasharray="25,15"
          />
        </svg>
      </div>

      {/* Cartoon Highway Signs Following Zigzag Road */}
      <div className="absolute inset-0 pt-24">
        {journeyData.map((step, index) => {
          const IconComponent = getTaskIcon(step.title);
          
          // Calculate position along the vertical zigzag path
          const progress = index / (journeyData.length - 1 || 1);
          const yPosition = 150 + (progress * 600); // Vertical progression from 150 to 750
          
          // Calculate horizontal zigzag position
          const segment = Math.floor(progress * 4); // 4 segments in the zigzag
          const localProgress = (progress * 4) % 1;
          
          let xPosition;
          if (segment % 2 === 0) {
            // Moving right: from center to right
            xPosition = 200 + (localProgress * 200);
          } else {
            // Moving left: from right to left
            xPosition = 400 - (localProgress * 400);
          }
          
          // Offset signs to the side of the road
          const signOffset = index % 2 === 0 ? 150 : -150;
          const finalX = xPosition + signOffset;
          
          return (
            <div
              key={step.id}
              className="absolute cursor-pointer group transform hover:scale-110 transition-all duration-300"
              style={{
                left: `${(finalX / 1200) * 100}%`,
                top: `${(yPosition / 800) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handleStartTask(step)}
            >
              {/* Sign Post */}
              <div className="flex flex-col items-center">
                {/* Cartoon-style green highway sign */}
                <div className="bg-green-600 text-white px-8 py-6 rounded-2xl shadow-2xl border-4 border-white transform group-hover:rotate-2 transition-all duration-300 min-w-64 text-center relative">
                  {/* Sign border effect */}
                  <div className="absolute inset-2 border-2 border-white/30 rounded-xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <IconComponent className="w-10 h-10 drop-shadow-lg" />
                    </div>
                    <div className="text-2xl font-black uppercase tracking-wider leading-tight drop-shadow-md">
                      {step.title.length > 12 ? 
                        step.title.substring(0, 12).toUpperCase() : 
                        step.title.toUpperCase()
                      }
                    </div>
                    <div className="text-sm font-bold mt-2 opacity-95 leading-relaxed">
                      {step.description.substring(0, 50)}...
                    </div>
                  </div>
                  
                  {/* Priority indicator */}
                  <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-lg ${
                    step.priority === 'high' ? 'bg-red-500' : 
                    step.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Sign post */}
                <div className="w-6 h-32 bg-gray-600 shadow-lg mt-2"></div>

                {/* Interactive details on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-4 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-2xl border-2 border-green-200 max-w-72">
                  <div className="text-lg font-bold text-gray-800 mb-3">
                    {step.title}
                  </div>
                  <div className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {step.description}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`px-4 py-2 rounded-full text-sm font-bold text-white ${
                      step.priority === 'high' ? 'bg-red-500' : 
                      step.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}>
                      {step.priority.toUpperCase()} PRIORITY
                    </div>
                    <div className="text-sm font-bold text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                      CLICK TO START →
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-3 text-center">
                    Timeline: {step.week}
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