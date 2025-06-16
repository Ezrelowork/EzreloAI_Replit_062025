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
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
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

  // AI Chat State
  const [showAIChat, setShowAIChat] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');

  // Layout is now locked and finalized

  // Dynamic task state - starts empty, populated by AI interactions
  const [dynamicTasks, setDynamicTasks] = useState<MovingTask[]>([]);
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
      position: { x: "220px", y: "450px" }, // Left side for immediate action
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
      position: { x: "700px", y: "400px" }, // Middle section
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
      position: { x: "800px", y: "250px" }, // Right section
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
      position: { x: "950px", y: "150px" }, // Far right
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
      return [...prev, newTask];
    });

    setLastAddedTask(taskId);

    // Clear the highlight after animation
    setTimeout(() => setLastAddedTask(null), 3000);
  };

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
    setSelectedTask(task);
    openTaskModal(task);
  };

  const completedCount = completedTasks.size;
  const totalTasks = dynamicTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // AI Conversation Mutation with task creation
  const aiConversationMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai-conversation", {
        message,
        context: {
          taskType: "moving-journey",
          taskTitle: "Moving Journey Overview",
          moveData,
          conversationHistory: conversation.slice(-5),
          currentTasks: dynamicTasks.map(t => t.id)
        }
      });
      return await response.json();
    },
    onSuccess: (data) => {
      // Check if AI wants to create tasks
      if (data.createTasks && Array.isArray(data.createTasks)) {
        data.createTasks.forEach((taskId: string) => {
          addTaskFromAI(taskId, data.highPriority || false);
        });
      }

      // Parse AI message for task keywords and add relevant tasks
      const messageText = data.message.toLowerCase();
      const userMessage = currentMessage.toLowerCase();
      
      // Check for utilities-related keywords
      if ((messageText.includes('utilities') || messageText.includes('electricity') || 
           messageText.includes('power') || messageText.includes('gas') || 
           messageText.includes('water') || messageText.includes('internet') ||
           userMessage.includes('utilities') || userMessage.includes('electricity') ||
           userMessage.includes('power') || userMessage.includes('set up utilities')) && 
          !dynamicTasks.find(t => t.id === 'utilities-setup')) {
        addTaskFromAI('utilities-setup');
      }

      // Check for address change keywords
      if ((messageText.includes('address change') || messageText.includes('update address') ||
           messageText.includes('change address') || userMessage.includes('address')) &&
          !dynamicTasks.find(t => t.id === 'address-change')) {
        addTaskFromAI('address-change');
      }

      // Check for local services keywords
      if ((messageText.includes('local services') || messageText.includes('schools') ||
           messageText.includes('healthcare') || messageText.includes('doctors') ||
           userMessage.includes('local') || userMessage.includes('services')) &&
          !dynamicTasks.find(t => t.id === 'local-services')) {
        addTaskFromAI('local-services');
      }

      const aiMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        message: data.message,
        timestamp: new Date(),
        suggestions: data.suggestions,
        data: data.actionData
      };

      setConversation(prev => [...prev, aiMessage]);
    },
    onError: (error) => {
      console.error('AI conversation error:', error);
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        message: "I'm having trouble processing that. Could you try rephrasing your question?",
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      message: currentMessage,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    aiConversationMutation.mutate(currentMessage);
    setCurrentMessage('');
  };

  const initializeAIChat = () => {
    if (conversation.length === 0) {
      const welcomeMessage = {
        id: 'welcome',
        role: 'assistant' as const,
        message: `Welcome to your personalized moving journey! I'm your AI assistant, and I'll help create your path step by step.

${moveData.from && moveData.to ? `I can see you're moving from ${moveData.from} to ${moveData.to}${moveData.date ? ` on ${new Date(moveData.date).toLocaleDateString()}` : ''}.` : 'Tell me about your move, and I\'ll start building your journey!'}

As we chat, I'll add highway signs to your journey for each task we discuss. The more urgent tasks will appear larger and closer to help you prioritize.

What would you like to tackle first?`,
        timestamp: new Date(),
        suggestions: [
          "I need to find movers",
          "Help me plan my timeline", 
          "What should I do first?",
          "I need to set up utilities"
        ]
      };
      setConversation([welcomeMessage]);
    }
    setShowAIChat(true);
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

  // Load initial tasks
  useEffect(() => {
      addTaskFromAI("moving-company");
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
              <Badge variant="secondary" className="text-sm">
                {completedCount}/{totalTasks} Completed
              </Badge>
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

      {/* Progress Bar with AI Insights */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Journey Progress</span>
              <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <Bot className="w-3 h-3" />
                AI Optimized
              </div>
            </div>
            <span className="text-sm text-gray-600">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* AI Smart Insights */}
          {moveData.date && (
            <div className="mt-3 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-green-600">
                <Bot className="w-3 h-3" />
                <span>AI Insight: {Math.ceil((new Date(moveData.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days until move</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <Info className="w-3 h-3" />
                <span>Priority: {progressPercentage < 25 ? 'Book movers now' : progressPercentage < 50 ? 'Setup utilities' : 'Finalize details'}</span>
              </div>
            </div>
          )}
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
          {/* Dynamic Highway Signs - Appear from AI conversations */}
          {dynamicTasks.map((task, index) => (
            <div
              key={task.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-105 transition-all duration-500 group"
              style={{
                left: task.position.x,
                top: task.position.y,
                zIndex: 20
              }}
              onClick={() => handleSignClick(task)}
            >
              <div className="relative">
                {/* Animated Step Indicator for first task (moving company) */}
                {task.id === 'moving-company' && (
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-pulse">
                      Start Here
                    </div>
                   
                    {/* Arrow pointing to sign */}
                   
                  </div>
                )}

                <DynamicHighwaySign
                  title={task.title}
                  description={task.description}
                  week={task.week}
                  priority={task.priority}
                  completed={completedTasks.has(task.id)}
                  onClick={() => handleSignClick(task)}
                />
              </div>

              {/* AI Smart Suggestion Tooltip */}
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

      {/* AI Chat Float Button - Enhanced with dynamic prompts */}
      {!showAIChat && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            <Button
              onClick={initializeAIChat}
              className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl animate-pulse"
              size="icon"
            >
              <Bot className="w-8 h-8" />
            </Button>
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              AI
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-3 mt-2 max-w-xs">
            <p className="text-sm font-medium text-gray-800">
              🎯 Ready to help with your move!
            </p>
            <p className="text-xs text-gray-600">
              Chat to get personalized moving advice
            </p>
          </div>
        </div>
      )}



      {/* AI Chat Interface */}
      {showAIChat && (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
        }`}>
          <Card className="h-full flex flex-col shadow-xl border-2 border-blue-200">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-medium">AI Moving Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-blue-700 h-8 w-8 p-0"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAIChat(false)}
                  className="text-white hover:bg-blue-700 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {conversation.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>

                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {msg.suggestions.map((suggestion, idx) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 px-2"
                                onClick={() => {
                                  setCurrentMessage(suggestion);
                                  handleSendMessage();
                                }}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {aiConversationMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 text-gray-900 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                  <div className="flex gap-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Ask me anything about your move..."
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || aiConversationMutation.isPending}
                      size="icon"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}