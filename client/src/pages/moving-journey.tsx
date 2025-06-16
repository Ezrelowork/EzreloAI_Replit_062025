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
      position: { x: "290px", y: "550px" }, // Custom positioning: moved right 15px (230->245) and up 10px (580->570)
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
      position: { x: "865px", y: "470px" }, // moved right 25px (840->865) and up 30px (560->530)
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
      position: { x: "456px", y: "335px" }, // moved up 25px (360->335)
      icon: FileText
    },
    {
      id: "local-services",
      title: "Local Services",
      description: "Find schools, healthcare, gyms, and essential services",
      priority: "low",
      week: "Week 4",
      category: "Community",
      completed: false,
      position: { x: "650px", y: "175px" }, // moved right 30px (600->630)
      icon: Building
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
    setSelectedTask(task);
    openTaskModal(task);
  };

  const completedCount = completedTasks.size;
  const totalTasks = movingTasks.length;
  const progressPercentage = (completedCount / totalTasks) * 100;

  // AI Conversation Mutation
  const aiConversationMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai-conversation", {
        message,
        context: {
          taskType: "moving-journey",
          taskTitle: "Moving Journey Overview",
          moveData,
          conversationHistory: conversation.slice(-5)
        }
      });
      return await response.json();
    },
    onSuccess: (data) => {
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
        message: `Hi! I'm your AI moving assistant. I can see you're moving from ${moveData.from} to ${moveData.to}${moveData.date ? ` on ${new Date(moveData.date).toLocaleDateString()}` : ''}. 

I can help you with:
• Finding the best moving companies
• Setting up utilities and services
• Creating a personalized timeline
• Answering questions about your new location
• Prioritizing tasks based on your move date

What would you like help with today?`,
        timestamp: new Date(),
        suggestions: [
          "Find moving companies",
          "Set up utilities",
          "What should I do first?",
          "Tell me about my new area"
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
                className="bg-green-600 hover:bg-green-700"
              >
                <Clipboard className="w-4 h-4 mr-2" />
                View All Tasks
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

      {/* AI Chat Float Button */}
      {!showAIChat && (
        <Button
          onClick={initializeAIChat}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
          size="icon"
        >
          <Bot className="w-6 h-6" />
        </Button>
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