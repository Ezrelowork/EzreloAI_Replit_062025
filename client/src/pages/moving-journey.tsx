import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskModal, useTaskModal } from "@/components/task-modal";
import { AllTasksPage } from "@/components/all-tasks-page";
import { DynamicHighwaySign } from "@/components/dynamic-highway-sign";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  Clipboard,
  MessageCircle,
  Send,
  Bot,
  X,
  Minimize2,
  Maximize2
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

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  suggestions?: string[];
  data?: any;
}

export default function MovingJourney() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => {
    // Load completed tasks from localStorage on initial load
    const saved = localStorage.getItem('completedTasks');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [showTaskPage, setShowTaskPage] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MovingTask | null>(null);
  const { isOpen: isTaskModalOpen, currentTask, openModal: openTaskModal, closeModal: closeTaskModal } = useTaskModal();
  const containerRef = useRef<HTMLDivElement>(null);
  const [moveData, setMoveData] = useState({
    from: '',
    to: '',
    date: '',
    fromAddress: '',
    toAddress: ''
  });

  // AI Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiModalContent, setAiModalContent] = useState({
    title: "Welcome to Your Moving Journey",
    message: "",
    suggestions: [] as string[]
  });

  // Position editing state
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Layout is now locked and finalized

  // Dynamic task state - starts empty, populated by AI interactions
  const [dynamicTasks, setDynamicTasks] = useState<MovingTask[]>(() => {
    // Load dynamic tasks from localStorage on initial load
    const saved = localStorage.getItem('dynamicTasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [lastAddedTask, setLastAddedTask] = useState<string | null>(null);

  // Available task templates that AI can activate
  const availableTaskTemplates: Record<string, MovingTask> = {
    "moving-company": {
      id: "moving-company",
      title: "Hire Moving Company",
      description: "Research and book professional movers for your relocation",
      priority: "high",
      week: "Week 1",
      category: "Core Moving",
      completed: false,
      position: { x: "300px", y: "650px" }, // Starting position on the left
      icon: Truck
    },
    "utilities-setup": {
      id: "utilities-setup",
      title: "Set Up Utilities",
      description: "Arrange electricity, gas, water, and internet services",
      priority: "high", 
      week: "Week 2",
      category: "Essential Services",
      completed: false,
      position: { x: "500px", y: "450px" }, // Middle-left section
      icon: Zap
    },
    "address-change": {
      id: "address-change",
      title: "Change Address",
      description: "Update address with banks, employers, and subscriptions",
      priority: "medium",
      week: "Week 3",
      category: "Administrative",
      completed: false,
      position: { x: "700px", y: "300px" }, // Middle-right section
      icon: FileText
    },
    "local-services": {
      id: "local-services",
      title: "Local Services",
      description: "Find schools, healthcare, gyms, and essential services",
      priority: "low",
      week: "Week 4",
      category: "Community",
      completed: false,
      position: { x: "900px", y: "200px" }, // End position on the right
      icon: Building
    }
  };

  // Function to add task from AI conversation
  const addTaskFromAI = (taskId: string, isHighPriority = false) => {
    const template = availableTaskTemplates[taskId];
    if (!template) return;

    const newTask = {
      ...template,
      // Make high priority tasks larger and more prominent
      position: isHighPriority ? 
        { x: "230px", y: "570px" } : // Large prominent position
        template.position
    };

    setDynamicTasks(prev => {
      if (prev.find(t => t.id === taskId)) return prev; // Don't duplicate
      const newTasks = [...prev, newTask];
      
      // Save to localStorage
      localStorage.setItem('dynamicTasks', JSON.stringify(newTasks));
      return newTasks;
    });

    setLastAddedTask(taskId);

    // Clear the highlight after animation
    setTimeout(() => setLastAddedTask(null), 3000);
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent, taskId: string) => {
    if (!isEditMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    setDraggedTask(taskId);
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    });
  };

  // Handle drag move
  const handleDragMove = (e: React.MouseEvent) => {
    if (!isEditMode || !draggedTask || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragOffset.x;
    const y = e.clientY - containerRect.top - dragOffset.y;

    // Update task position
    setDynamicTasks(prev => prev.map(task => 
      task.id === draggedTask 
        ? { ...task, position: { x: `${Math.max(0, Math.min(1200, x))}px`, y: `${Math.max(0, Math.min(800, y))}px` } }
        : task
    ));
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (draggedTask) {
      // Save updated positions to localStorage
      const updatedTasks = dynamicTasks.map(task => 
        task.id === draggedTask 
          ? { ...task, position: task.position }
          : task
      );
      localStorage.setItem('dynamicTasks', JSON.stringify(updatedTasks));
    }
    setDraggedTask(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
        
        // Trigger AI guidance based on completed task
        if (taskId === 'moving-company' && !dynamicTasks.find(t => t.id === 'utilities-setup')) {
          // Add utilities task and show AI guidance
          addTaskFromAI('utilities-setup');
          setTimeout(() => {
            showAIGuidance(
              "Great Progress! 🎉",
              "Excellent work booking your moving company! Now that you have your movers secured, it's time to focus on setting up utilities at your new home.\n\nI've added the 'Set Up Utilities' sign to your journey. This includes arranging electricity, gas, water, and internet services.\n\nClick on the utilities sign to get started with setting up your essential services.",
              ["Set up utilities now", "What utilities do I need?", "Continue journey"]
            );
          }, 1000);
        } else if (taskId === 'utilities-setup' && !dynamicTasks.find(t => t.id === 'address-change')) {
          // Add address change task
          addTaskFromAI('address-change');
          setTimeout(() => {
            showAIGuidance(
              "Utilities Complete! ⚡",
              "Perfect! Your utilities are all set up. Next, you'll want to update your address with important organizations like banks, employers, and subscription services.\n\nI've added the 'Change Address' sign to help you notify everyone about your move.",
              ["Update addresses now", "Who should I notify?", "Continue journey"]
            );
          }, 1000);
        } else if (taskId === 'address-change' && !dynamicTasks.find(t => t.id === 'local-services')) {
          // Add local services task
          addTaskFromAI('local-services');
          setTimeout(() => {
            showAIGuidance(
              "Address Updates Done! 📮",
              "Wonderful! You've updated your address everywhere. Now let's help you get settled by finding local services like schools, healthcare providers, and other essentials in your new area.\n\nI've added the 'Local Services' sign to complete your moving journey.",
              ["Find local services", "What do I need locally?", "Complete journey"]
            );
          }, 1000);
        }
      }
      
      // Save to localStorage
      localStorage.setItem('completedTasks', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const handleSignClick = (task: MovingTask) => {
    setSelectedTask(task);
    openTaskModal(task);
  };

  const completedCount = completedTasks.size;
  const totalTasks = dynamicTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // AI Modal Content Management
  const showAIGuidance = (title: string, message: string, suggestions: string[] = []) => {
    setAiModalContent({ title, message, suggestions });
    setShowAIModal(true);
  };

  // Initialize AI modal on first visit
  const initializeAIModal = () => {
    const welcomeMessage = `Welcome to your personalized moving journey! I'm your AI assistant, and I'll guide you step by step through your relocation.

${moveData.from && moveData.to ? `I can see you're moving from ${moveData.from} to ${moveData.to}${moveData.date ? ` on ${new Date(moveData.date).toLocaleDateString()}` : ''}.` : ''}

Here's how this works:
• I've placed highway signs along your journey for each moving task
• Start by clicking the "Hire Moving Company" sign to secure your movers
• As you complete each task, I'll guide you to the next step
• Each completed task unlocks new signs on your journey

To begin your moving journey, click the "Hire Moving Company" sign below. This is your most important first step!`;

    showAIGuidance("Welcome to Your Moving Journey! 🚛", welcomeMessage, [
      "I'm ready to start!",
      "Tell me more about the process",
      "What's my timeline?"
    ]);
  };

  // Load AI data and URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    const toParam = urlParams.get('to');
    const dateParam = urlParams.get('date');

    // Load from localStorage if not in URL
    const aiFromLocation = localStorage.getItem('aiFromLocation');
    const aiToLocation = localStorage.getItem('aiToLocation');
    const aiMoveDate = localStorage.getItem('aiMoveDate');

    setMoveData({
      from: fromParam || aiFromLocation || '',
      to: toParam || aiToLocation || '',
      date: dateParam || aiMoveDate || '',
      fromAddress: fromParam || aiFromLocation || '',
      toAddress: toParam || aiToLocation || ''
    });
  }, []);

  // Load initial tasks and show welcome modal
  useEffect(() => {
    // Only add moving-company if no tasks exist yet
    const existingTasks = localStorage.getItem('dynamicTasks');
    if (!existingTasks || JSON.parse(existingTasks).length === 0) {
      addTaskFromAI("moving-company");
      // Show welcome modal after a brief delay for new users
      setTimeout(() => {
        initializeAIModal();
      }, 1000);
    }
  }, []);

  if (showTaskPage) {
    return (
      <AllTasksPage 
        onBack={() => setShowTaskPage(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/ai-assistant">
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                    <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-green-600">Ezrelo</span>
                </div>
              </Link>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-bold text-gray-900">Your Moving Journey</h1>

                {moveData.from && moveData.to && (
                  <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 rounded-full p-1">
                        <Bot className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-700 font-medium">AI Insights Available</p>
                        <p className="text-xs text-gray-600">
                          I can help you prioritize tasks, find the best movers, and create a timeline for your {moveData.from} to {moveData.to} move.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Compact Progress Indicator - takes up right 1/3 */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-green-50 px-4 py-2 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-800">{completedCount}/{totalTasks} Tasks</div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      AI Guided
                    </div>
                  </div>
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              
              <Button
                onClick={() => setIsEditMode(!isEditMode)}
                variant={isEditMode ? "destructive" : "outline"}
                className={isEditMode ? "bg-red-600 hover:bg-red-700" : ""}
              >
                <Wrench className="w-4 h-4 mr-2" />
                {isEditMode ? "Exit Edit" : "Edit Positions"}
              </Button>
              <Button
                onClick={() => setShowTaskPage(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Clipboard className="w-4 h-4 mr-2" />
                View All Tasks
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Journey Container */}
      <div className="relative overflow-auto bg-gray-100" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Edit Mode Indicator */}
        {isEditMode && (
          <div className="absolute top-4 left-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              <span className="font-semibold">Edit Mode: Drag signs to reposition</span>
            </div>
          </div>
        )}

        {/* Highway Background - Fixed 1200x800 */}
        <div 
          ref={containerRef}
          className={`absolute bg-no-repeat ${isEditMode ? 'cursor-crosshair' : ''}`}
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
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {/* Dynamic Highway Signs - Appear from AI conversations */}
          {dynamicTasks.map((task, index) => (
            <div
              key={task.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 group ${
                isEditMode 
                  ? 'cursor-move hover:scale-110 hover:z-50' 
                  : 'cursor-pointer hover:scale-105'
              } ${draggedTask === task.id ? 'z-50 scale-110' : ''}`}
              style={{
                left: task.position.x,
                top: task.position.y,
                zIndex: draggedTask === task.id ? 50 : 20
              }}
              onClick={isEditMode ? undefined : () => handleSignClick(task)}
              onMouseDown={isEditMode ? (e) => handleDragStart(e, task.id) : undefined}
            >
              <div className="relative">
                {/* Progressive Step Indicator */}
                {(() => {
                  // Find the next incomplete task
                  const incompleteTasks = dynamicTasks.filter(t => !completedTasks.has(t.id));
                  const nextTask = incompleteTasks.length > 0 ? incompleteTasks[0] : null;
                  
                  // Show indicator on the next task to complete
                  if (nextTask && task.id === nextTask.id) {
                    const isFirstTask = task.id === 'moving-company';
                    return (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-center">
                        <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-pulse">
                          {isFirstTask ? 'Start Here' : 'To Do'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <DynamicHighwaySign
                  title={task.title}
                  description={task.description}
                  week={task.week}
                  priority={task.priority}
                  completed={completedTasks.has(task.id)}
                  onClick={() => handleSignClick(task)}
                />
              </div>

              {/* Edit Mode Position Display */}
              {isEditMode && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs rounded px-2 py-1 font-mono whitespace-nowrap">
                  x: {parseInt(task.position.x)}, y: {parseInt(task.position.y)}
                </div>
              )}

              {/* AI Smart Suggestion Tooltip */}
              {!isEditMode && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-blue-600 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <div className="flex items-center gap-2">
                      <Bot className="w-3 h-3" />
                      <span>
                        {task.id === 'moving-company' && 'AI found 12 local movers for you'}
                        {task.id === 'utilities-setup' && 'AI can help setup all utilities'}
                        {task.id === 'address-change' && 'AI knows 23+ places to update'}
                        {task.id === 'local-services' && 'AI found schools & services in Missoula'}
                      </span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-600"></div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Empty journey prompt when no tasks */}
          {dynamicTasks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border-2 border-dashed border-blue-300">
                <Bot className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Your Journey Awaits</h3>
                <p className="text-gray-600 mb-4">Chat with AI to start building your personalized moving plan!</p>
                <div className="text-sm text-blue-600 animate-pulse">
                  → Chat to add highway signs to your journey
                </div>
              </div>
            </div>
          )}

         
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

      {/* AI Help Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={initializeAIModal}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl"
          size="icon"
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>



      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl mx-auto shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{aiModalContent.title}</CardTitle>
                    <CardDescription className="text-blue-100">Your AI Moving Guide</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAIModal(false)}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {aiModalContent.message}
                </p>
                
                {aiModalContent.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {aiModalContent.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAIModal(false)}
                        className="text-sm"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setShowAIModal(false)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Got it!
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}