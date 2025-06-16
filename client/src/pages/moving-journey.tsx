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

  // Load saved template positions
  const loadSavedPositions = () => {
    const savedPositions = localStorage.getItem('taskTemplatePositions');
    return savedPositions ? JSON.parse(savedPositions) : {};
  };

  const savedPositions = loadSavedPositions();

  // Calculate days until task is due based on move date
  const calculateTaskDueDate = (taskId: string, moveDate: string) => {
    if (!moveDate) return "Set move date";
    
    const moveDateObj = new Date(moveDate);
    const today = new Date();
    const daysUntilMove = Math.ceil((moveDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    // Define when each task should be completed (days before move)
    const taskTimelines: Record<string, number> = {
      "moving-company": 42, // 6 weeks before
      "utilities-setup": 21,  // 3 weeks before
      "address-change": 14,   // 2 weeks before
      "local-services": 7     // 1 week before
    };
    
    const daysBeforeMove = taskTimelines[taskId] || 7;
    const dueDate = daysUntilMove - daysBeforeMove;
    
    if (dueDate > 0) {
      return `Due in ${dueDate} days`;
    } else if (dueDate === 0) {
      return "Due today";
    } else {
      return `Overdue by ${Math.abs(dueDate)} days`;
    }
  };

  // Available task templates that AI can activate
  const availableTaskTemplates: Record<string, MovingTask> = {
    "moving-company": {
      id: "moving-company",
      title: "Hire Moving Company",
      description: "Research and book professional movers for your relocation",
      priority: "high",
      week: calculateTaskDueDate("moving-company", moveData.date),
      category: "Core Moving",
      completed: false,
      position: savedPositions["moving-company"] || { x: "300px", y: "650px" }, // Starting position on the left
      icon: Truck
    },
    "utilities-setup": {
      id: "utilities-setup",
      title: "Set Up Utilities",
      description: "Arrange electricity, gas, water, and internet services",
      priority: "high", 
      week: calculateTaskDueDate("utilities-setup", moveData.date),
      category: "Essential Services",
      completed: false,
      position: savedPositions["utilities-setup"] || { x: "500px", y: "450px" }, // Middle-left section
      icon: Zap
    },
    "address-change": {
      id: "address-change",
      title: "Change Address",
      description: "Update address with banks, employers, and subscriptions",
      priority: "medium",
      week: calculateTaskDueDate("address-change", moveData.date),
      category: "Administrative",
      completed: false,
      position: savedPositions["address-change"] || { x: "700px", y: "300px" }, // Middle-right section
      icon: FileText
    },
    "local-services": {
      id: "local-services",
      title: "Local Services",
      description: "Find schools, healthcare, gyms, and essential services",
      priority: "low",
      week: calculateTaskDueDate("local-services", moveData.date),
      category: "Community",
      completed: false,
      position: savedPositions["local-services"] || { x: "900px", y: "200px" }, // End position on the right
      icon: Building
    }
  };

  // Function to add task from AI conversation
  const addTaskFromAI = (taskId: string, isHighPriority = false) => {
    const template = availableTaskTemplates[taskId];
    if (!template) return;

    // Check if there's a saved position for this task in localStorage
    const savedTasks = localStorage.getItem('dynamicTasks');
    const existingSavedTasks = savedTasks ? JSON.parse(savedTasks) : [];
    const existingSavedTask = existingSavedTasks.find((t: MovingTask) => t.id === taskId);

    const newTask = {
      ...template,
      // Recalculate the week/due date when adding task
      week: calculateTaskDueDate(taskId, moveData.date),
      // Use saved position if it exists, otherwise use template/priority position
      position: existingSavedTask?.position || 
        (isHighPriority ? 
          { x: "230px", y: "570px" } : // Large prominent position
          template.position)
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

  // Check for overdue tasks and trigger AI reminders
  const checkForOverdueTasks = () => {
    if (!moveData.date) return;

    const overdueTasks = dynamicTasks.filter(task => {
      if (completedTasks.has(task.id)) return false;
      const dueText = calculateTaskDueDate(task.id, moveData.date);
      return dueText.includes("Overdue");
    });

    if (overdueTasks.length > 0) {
      const overdueTaskNames = overdueTasks.map(t => t.title).join(", ");
      showAIGuidance(
        "⚠️ Urgent: Overdue Tasks Detected",
        `I've noticed you have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}:\n\n${overdueTaskNames}\n\nThese tasks are critical for a smooth move and should be completed as soon as possible. Would you like me to help you prioritize and tackle these tasks?`,
        ["Help me prioritize", "Show task details", "I'll handle this later"]
      );
    }
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
      // Find the dragged task
      const draggedTaskData = dynamicTasks.find(task => task.id === draggedTask);
      
      if (draggedTaskData) {
        // Update the permanent template position
        if (availableTaskTemplates[draggedTask]) {
          availableTaskTemplates[draggedTask].position = draggedTaskData.position;
        }
        
        // Save updated template positions to localStorage
        localStorage.setItem('taskTemplatePositions', JSON.stringify(
          Object.fromEntries(
            Object.entries(availableTaskTemplates).map(([key, template]) => [
              key, 
              template.position
            ])
          )
        ));
        
        // Save updated dynamic tasks to localStorage
        const updatedTasks = dynamicTasks.map(task => 
          task.id === draggedTask 
            ? { ...task, position: task.position }
            : task
        );
        localStorage.setItem('dynamicTasks', JSON.stringify(updatedTasks));
      }
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

  // Handle AI suggestion clicks
  const handleAISuggestion = (suggestion: string) => {
    // Close the current modal
    setShowAIModal(false);
    
    // Process the suggestion and show appropriate response
    setTimeout(() => {
      if (suggestion.toLowerCase().includes("tell me more about the process")) {
        showAIGuidance(
          "Your Moving Process Explained 📋",
          `Here's how your personalized moving journey works:

**Step-by-Step Process:**
1. **Start with Moving Company** - Secure professional movers first (this unlocks everything else)
2. **Set Up Utilities** - Once movers are booked, arrange electricity, gas, water, and internet
3. **Change Your Address** - After utilities are planned, notify banks, employers, and services
4. **Find Local Services** - Finally, discover schools, healthcare, and community resources

**Why This Order?**
• Moving companies book up fast, especially during peak seasons
• Utilities need 1-2 weeks lead time for activation
• Address changes are easier once you have confirmed move dates
• Local services can be researched closer to your move date

**Your Progress:**
Each completed task automatically unlocks the next step and triggers personalized AI guidance. The highway signs appear as you progress, creating your unique moving roadmap.`,
          ["Got it, let's continue!", "What if I need to change the order?", "How long does each step take?"]
        );
      } else if (suggestion.toLowerCase().includes("timeline") || suggestion.toLowerCase().includes("what's my timeline")) {
        const moveDate = moveData.date ? new Date(moveData.date).toLocaleDateString() : "your selected date";
        showAIGuidance(
          "Your Moving Timeline 📅",
          `Based on your move ${moveDate !== "your selected date" ? `on ${moveDate}` : ""}, here's your recommended timeline:

**6-8 Weeks Before:**
• Get moving company quotes and book your movers
• Start researching utilities for your new location

**4-6 Weeks Before:**
• Finalize moving company contract
• Schedule utility connections for your new home
• Begin change of address notifications

**2-4 Weeks Before:**
• Complete all address changes
• Confirm utility activation dates
• Research local services and schools

**1-2 Weeks Before:**
• Final confirmations with all service providers
• Complete any remaining local service setups
• Prepare for moving day

**Moving Day & After:**
• Supervise the move
• Verify all utilities are working
• Register with local services as needed

${moveDate !== "your selected date" ? `Your move date gives you ${Math.ceil((new Date(moveData.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days to complete these steps.` : "Set your move date to get a personalized countdown!"}`,
          ["This timeline works for me", "I need to move faster", "What if I'm behind schedule?"]
        );
      } else if (suggestion.toLowerCase().includes("ready to start") || suggestion.toLowerCase().includes("i'm ready")) {
        showAIGuidance(
          "Let's Get Started! 🚀",
          `Perfect! You're ready to begin your moving journey. Here's your next step:

**Step 1: Hire Moving Company**
Click on the "Hire Moving Company" highway sign below to:
• Get quotes from local professional movers
• Compare prices and services
• Book your moving date

**Why Start Here?**
Moving companies are the backbone of your relocation. Good movers book up quickly, especially during peak season (May-September), so securing them first ensures you have professional help on your chosen date.

**What Happens Next?**
Once you complete the moving company step, I'll automatically add the next highway sign for setting up utilities, and guide you through each subsequent step.

Ready to click that first highway sign? 🛣️`,
          ["Yes, let's find movers!", "I want to do this myself", "What if I can't find good movers?"]
        );
      } else if (suggestion.toLowerCase().includes("continue journey") || suggestion.toLowerCase().includes("continue")) {
        showAIGuidance(
          "Journey Continues! 🛣️",
          `Great progress! You're building momentum on your moving journey.

**Your Current Status:**
• ${completedTasks.size} out of ${dynamicTasks.length} tasks completed
• ${Math.round(progressPercentage)}% of your journey finished

**Next Steps:**
Look for highway signs marked "To Do" - these are your priority tasks. Complete them in order for the smoothest moving experience.

**Need Help?**
• Click any highway sign to see detailed instructions
• Use the AI help button (bottom right) for guidance anytime
• Your progress is automatically saved as you work

Keep up the excellent work! Each completed task gets you closer to a successful move. 🎯`,
          ["Show me what's next", "I have a question", "Back to journey"]
        );
      } else if (suggestion.toLowerCase().includes("change the order") || suggestion.toLowerCase().includes("different order")) {
        showAIGuidance(
          "Customizing Your Journey Order 🔄",
          `I understand you might want to tackle tasks in a different order! Here's what you need to know:

**Recommended vs. Custom Order:**
The standard sequence (Movers → Utilities → Address → Local Services) is optimized for most situations, but you can adapt it:

**Alternative Approaches:**
• **DIY Move:** Skip professional movers, focus on truck rental and utilities
• **Rushed Timeline:** Handle utilities and movers simultaneously
• **Flexible Timeline:** Address changes can happen earlier if you have confirmed dates

**Using Edit Mode:**
• Click "Edit Positions" to move highway signs around
• This changes the visual layout but doesn't affect task dependencies
• You can complete tasks in any order you prefer

**Important Notes:**
• Some tasks have natural dependencies (need move date before scheduling utilities)
• The AI guidance adapts to your chosen sequence
• Progress tracking works regardless of completion order

Would you like to customize your approach?`,
          ["Yes, help me reorder", "I'll stick with recommendations", "Tell me more about dependencies"]
        );
      } else if (suggestion.toLowerCase().includes("help me prioritize") || suggestion.toLowerCase().includes("prioritize")) {
        const overdueTasks = dynamicTasks.filter(task => {
          if (completedTasks.has(task.id)) return false;
          const dueText = calculateTaskDueDate(task.id, moveData.date);
          return dueText.includes("Overdue");
        });

        const dueSoonTasks = dynamicTasks.filter(task => {
          if (completedTasks.has(task.id)) return false;
          const dueText = calculateTaskDueDate(task.id, moveData.date);
          return dueText.includes("Due today") || 
                 (dueText.includes("Due in") && parseInt(dueText.split(" ")[2]) <= 3);
        });

        let priorityMessage = "Here's your task priority breakdown:\n\n";
        
        if (overdueTasks.length > 0) {
          priorityMessage += `🚨 **URGENT - Overdue Tasks:**\n`;
          overdueTasks.forEach(task => {
            priorityMessage += `• ${task.title} - ${calculateTaskDueDate(task.id, moveData.date)}\n`;
          });
          priorityMessage += "\n";
        }

        if (dueSoonTasks.length > 0) {
          priorityMessage += `⚠️ **HIGH PRIORITY - Due Soon:**\n`;
          dueSoonTasks.forEach(task => {
            priorityMessage += `• ${task.title} - ${calculateTaskDueDate(task.id, moveData.date)}\n`;
          });
          priorityMessage += "\n";
        }

        const upcomingTasks = dynamicTasks.filter(task => {
          if (completedTasks.has(task.id)) return false;
          const dueText = calculateTaskDueDate(task.id, moveData.date);
          return dueText.includes("Due in") && parseInt(dueText.split(" ")[2]) > 3;
        });

        if (upcomingTasks.length > 0) {
          priorityMessage += `📅 **UPCOMING TASKS:**\n`;
          upcomingTasks.forEach(task => {
            priorityMessage += `• ${task.title} - ${calculateTaskDueDate(task.id, moveData.date)}\n`;
          });
        }

        priorityMessage += "\n**Recommendation:** Focus on overdue and urgent tasks first, then work through upcoming tasks in order.";

        showAIGuidance(
          "Task Priority Guide 📋",
          priorityMessage,
          ["Start with most urgent", "Show task details", "I understand"]
        );
      } else {
        // Generic response for other suggestions
        showAIGuidance(
          "I'm Here to Help! 🤖",
          `Thanks for that input! I'm continuously learning to provide better guidance for your moving journey.

**What I Can Help With:**
• Step-by-step moving guidance
• Timeline planning and recommendations
• Task prioritization and sequencing
• Local service recommendations
• Moving company selection advice

**Current Journey Status:**
You have ${dynamicTasks.length} highway signs on your journey, with ${completedTasks.size} completed tasks.

**Getting Started:**
Click on any highway sign to begin that task, or select from the suggestions below for more specific guidance.`,
          ["Help me prioritize tasks", "I have a specific question", "Continue with my journey"]
        );
      }
    }, 300);
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

  // Check for overdue tasks and refresh countdowns when move date or tasks change
  useEffect(() => {
    if (moveData.date && dynamicTasks.length > 0) {
      // Update all task due dates
      setDynamicTasks(prev => prev.map(task => ({
        ...task,
        week: calculateTaskDueDate(task.id, moveData.date)
      })));

      // Check for overdue tasks every time the data changes
      const checkTimer = setTimeout(() => {
        checkForOverdueTasks();
      }, 2000);

      return () => clearTimeout(checkTimer);
    }
  }, [moveData.date, dynamicTasks.length]);

  // Set up daily reminder check for overdue tasks
  useEffect(() => {
    const dailyCheck = setInterval(() => {
      if (moveData.date && dynamicTasks.length > 0) {
        checkForOverdueTasks();
      }
    }, 24 * 60 * 60 * 1000); // Check once per day

    return () => clearInterval(dailyCheck);
  }, [moveData.date, dynamicTasks, completedTasks]);

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
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-gray-100">
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
                  <div className="mt-1">
                    <p className="text-sm text-gray-600">
                      {moveData.from} → {moveData.to}
                    </p>
                    {moveData.date && (
                      <div className="mt-1 space-y-1">
                        <p className="text-sm font-semibold text-blue-600">
                          {(() => {
                            const moveDate = new Date(moveData.date);
                            const today = new Date();
                            const timeDiff = moveDate.getTime() - today.getTime();
                            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            const formattedDate = moveDate.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            });
                            
                            if (daysDiff > 0) {
                              return `${daysDiff} days until move date: ${formattedDate}`;
                            } else if (daysDiff === 0) {
                              return `Moving day is today! ${formattedDate}`;
                            } else {
                              return `Moved ${Math.abs(daysDiff)} days ago: ${formattedDate}`;
                            }
                          })()}
                        </p>
                        
                        {/* Task urgency indicators */}
                        {(() => {
                          const urgentTasks = dynamicTasks.filter(task => {
                            if (completedTasks.has(task.id)) return false;
                            const dueText = calculateTaskDueDate(task.id, moveData.date);
                            return dueText.includes("Overdue") || dueText.includes("Due today") || 
                                   (dueText.includes("Due in") && parseInt(dueText.split(" ")[2]) <= 3);
                          });

                          if (urgentTasks.length > 0) {
                            const overdueCount = urgentTasks.filter(task => 
                              calculateTaskDueDate(task.id, moveData.date).includes("Overdue")
                            ).length;
                            
                            const dueSoonCount = urgentTasks.length - overdueCount;

                            return (
                              <div className="flex items-center gap-2 text-xs">
                                {overdueCount > 0 && (
                                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium animate-pulse">
                                    {overdueCount} Overdue
                                  </span>
                                )}
                                {dueSoonCount > 0 && (
                                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                                    {dueSoonCount} Due Soon
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsEditMode(!isEditMode)}
                variant={isEditMode ? "destructive" : "outline"}
                className={isEditMode ? "bg-red-600 hover:bg-red-700" : ""}
              >
                <Wrench className="w-4 h-4 mr-2" />
                {isEditMode ? "Exit Edit" : "Edit Positions"}
              </Button>
              <Button
                onClick={() => {
                  // Clear all saved progress
                  localStorage.removeItem('completedTasks');
                  localStorage.removeItem('dynamicTasks');
                  
                  // Reset state
                  setCompletedTasks(new Set());
                  setDynamicTasks([]);
                  
                  // Add the initial task back with proper positioning
                  setTimeout(() => {
                    // Reload saved positions to get the most current template position
                    const currentSavedPositions = loadSavedPositions();
                    const initialTask = {
                      ...availableTaskTemplates["moving-company"],
                      // Use saved template position if available, otherwise use template default
                      position: currentSavedPositions["moving-company"] || availableTaskTemplates["moving-company"].position
                    };
                    
                    setDynamicTasks([initialTask]);
                    localStorage.setItem('dynamicTasks', JSON.stringify([initialTask]));
                    
                    // Show welcome modal after reset
                    setTimeout(() => {
                      initializeAIModal();
                    }, 500);
                  }, 100);
                  
                  toast({
                    title: "Journey Reset",
                    description: "Your moving journey has been reset. Welcome back!",
                  });
                }}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Reset Journey
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
      <div className="relative bg-gray-100" style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
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
            transform: 'none',
            zIndex: 10
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
                  week={completedTasks.has(task.id) ? "Complete" : task.week}
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
          <Card className="w-full max-w-2xl mx-auto shadow-2xl h-[600px] flex flex-col">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex-shrink-0">
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
            <CardContent className="p-6 flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4">
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
                        onClick={() => handleAISuggestion(suggestion)}
                        className="text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4 border-t mt-4 flex-shrink-0">
                <Button
                  onClick={() => setShowAIModal(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Got it!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}