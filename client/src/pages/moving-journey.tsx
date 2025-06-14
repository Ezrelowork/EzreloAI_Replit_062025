import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskModal, useTaskModal } from "@/components/task-modal";
import { TaskPage } from "@/components/task-page";
import { DynamicHighwaySign } from "@/components/dynamic-highway-sign";

// Import highway background
import highwayBackground from "@assets/highway-background.png";

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

interface MovingTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  week: string;
  category: string;
  completed: boolean;
  position: { x: string; y: string };
  icon: any;
}

export default function MovingJourney() {
  const [, setLocation] = useLocation();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showTaskPage, setShowTaskPage] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MovingTask | null>(null);
  const { isOpen: isTaskModalOpen, currentTask, openModal: openTaskModal, closeModal: closeTaskModal } = useTaskModal();
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout is now locked and finalized

  // Define moving tasks with highway positions - Fixed pixel positions within 1200x800 container
  // LOCKED POSITIONS - DO NOT REVERT: User specified exact coordinates
  const movingTasks: MovingTask[] = [
    {
      id: "moving-company",
      title: "Hire Moving Company",
      description: "Research and book professional movers for your relocation",
      priority: "high",
      week: "Week 1",
      category: "Core Moving",
      completed: false,
      position: { x: "230px", y: "580px" }, // Custom positioning: 230px from left, 580px from top (raised 20px)
      icon: Truck
    },
    {
      id: "utilities-setup",
      title: "Set Up Utilities",
      description: "Arrange electricity, gas, water, and internet services",
      priority: "high", 
      week: "Week 2",
      category: "Essential Services",
      completed: false,
      position: { x: "840px", y: "560px" }, // 70% of 1200px = 840px, 70% of 800px = 560px
      icon: Zap
    },
    {
      id: "address-change",
      title: "Change Address",
      description: "Update address with banks, employers, and subscriptions",
      priority: "medium",
      week: "Week 3",
      category: "Administrative",
      completed: false,
      position: { x: "456px", y: "360px" }, // 38% of 1200px = 456px, 45% of 800px = 360px
      icon: FileText
    },
    {
      id: "local-services",
      title: "Local Services",
      description: "Find schools, healthcare, gyms, and essential services",
      priority: "medium",
      week: "Week 4",
      category: "Community",
      completed: false,
      position: { x: "936px", y: "236px" }, // 78% of 1200px = 936px, moved down 20px from 216px to 236px
      icon: Building
    },
    {
      id: "school-enrollment",
      title: "School Enrollment",
      description: "Enroll children in new schools and transfer records",
      priority: "low",
      week: "Week 5",
      category: "Family",
      completed: false,
      position: { x: "600px", y: "164px" }, // 50% of 1200px = 600px, moved down 20px from 144px to 164px
      icon: GraduationCap
    }
  ];

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSignClick = (task: MovingTask) => {
    // Navigate directly to local-services page for Local Services task
    if (task.id === "local-services") {
      const urlParams = new URLSearchParams(window.location.search);
      const from = urlParams.get('from');
      const to = urlParams.get('to');
      const date = urlParams.get('date');
      
      let servicesUrl = '/local-services';
      if (from || to || date) {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (date) params.set('date', date);
        servicesUrl += `?${params.toString()}`;
      }
      
      window.location.href = servicesUrl;
      return;
    }
    
    setSelectedTask(task);
    openTaskModal(task);
  };

  const completedCount = completedTasks.size;
  const totalTasks = movingTasks.length;
  const progressPercentage = (completedCount / totalTasks) * 100;

  if (showTaskPage) {
    return <TaskPage onBack={() => setShowTaskPage(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span className="text-2xl font-bold text-blue-600">Ezrelo</span>
              </div>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-bold text-gray-900">Your Moving Journey</h1>
                <p className="text-sm text-gray-600">
                  Click signs to explore tasks and track progress
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-sm">
                {completedCount}/{totalTasks} Completed
              </Badge>
              <Button
                onClick={() => setShowTaskPage(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Clipboard className="w-4 h-4 mr-2" />
                View All Tasks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Journey Progress</span>
            <span className="text-sm text-gray-600">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Journey Container */}
      <div className="relative overflow-auto bg-gray-100" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Highway Background - Fixed 1200x800 */}
        <div 
          ref={containerRef}
          className="absolute bg-no-repeat"
          style={{
            width: '1200px',
            height: '800px',
            backgroundImage: `url(${highwayBackground})`,
            backgroundSize: '1200px 800px',
            backgroundPosition: '0 0',
            left: '0',
            top: '0',
            transform: 'none'
          }}
        >
          {/* Dynamic Highway Signs */}
          {movingTasks.map((task) => (
            <div
              key={task.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-105 transition-all duration-300"
              style={{
                left: task.position.x,
                top: task.position.y,
              }}
              onClick={() => handleSignClick(task)}
            >
              <DynamicHighwaySign
                title={task.title}
                description={task.description}
                week={task.week}
                priority={task.priority}
                completed={completedTasks.has(task.id)}
                onClick={() => handleSignClick(task)}
              />
            </div>
          ))}

          {/* Journey Path Indicators */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Start indicator */}
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg" style={{ left: "96px", top: "640px" }}>
              <MapPin className="w-4 h-4 inline mr-2" />
              Start Here
            </div>

            {/* End indicator */}
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg" style={{ left: "1020px", top: "80px" }}>
              <Home className="w-4 h-4 inline mr-2" />
              New Home
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white/90 backdrop-blur-lg border-t border-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Low Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {currentTask && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={closeTaskModal}
          task={currentTask}
          onStartTask={() => {}}
          onMarkComplete={() => {
            if (currentTask) {
              toggleTaskCompletion(currentTask.id);
            }
          }}
        />
      )}
    </div>
  );
}