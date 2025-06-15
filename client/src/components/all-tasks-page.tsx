
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
  Zap,
  FileText,
  Building,
  Calendar,
  MapPin
} from 'lucide-react';

interface MovingTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  week: string;
  category: string;
  completed: boolean;
  icon: any;
}

interface AllTasksPageProps {
  onBack: () => void;
}

export const AllTasksPage: React.FC<AllTasksPageProps> = ({ onBack }) => {
  const [, setLocation] = useLocation();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [moveData, setMoveData] = useState({ from: '', to: '', date: '' });

  // Define the same tasks from moving-journey.tsx
  const movingTasks: MovingTask[] = [
    {
      id: "moving-company",
      title: "Hire Moving Company",
      description: "Research and book professional movers for your relocation",
      priority: "high",
      week: "Week 1",
      category: "Core Moving",
      completed: false,
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
      icon: Building
    }
  ];

  useEffect(() => {
    // Load move data from localStorage
    const fromLocation = localStorage.getItem('aiFromLocation') || '';
    const toLocation = localStorage.getItem('aiToLocation') || '';
    const moveDate = localStorage.getItem('aiMoveDate') || '';

    setMoveData({
      from: fromLocation,
      to: toLocation,
      date: moveDate
    });

    // Load completed tasks from localStorage
    const saved = localStorage.getItem('completedTasks');
    if (saved) {
      setCompletedTasks(new Set(JSON.parse(saved)));
    }
  }, []);

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      
      // Save to localStorage
      localStorage.setItem('completedTasks', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const completedCount = completedTasks.size;
  const totalTasks = movingTasks.length;
  const progressPercentage = (completedCount / totalTasks) * 100;

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusIcon = (taskId: string) => {
    return completedTasks.has(taskId) ? CheckCircle2 : Clock;
  };

  const handleTaskClick = (task: MovingTask) => {
    // Navigate to the specific task page
    const params = new URLSearchParams();
    if (moveData.from) params.set('from', moveData.from);
    if (moveData.to) params.set('to', moveData.to);
    if (moveData.date) params.set('date', moveData.date);
    
    const taskRoute = `/task/${task.id}${params.toString() ? `?${params.toString()}` : ''}`;
    setLocation(taskRoute);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Journey
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Moving Tasks</h1>
                <p className="text-sm text-gray-600">
                  Track and manage your complete moving checklist
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {completedCount}/{totalTasks} Completed
            </Badge>
          </div>
        </div>
      </header>

      {/* Progress Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Moving Progress Overview
            </CardTitle>
            <CardDescription>
              {moveData.from && moveData.to ? 
                `${moveData.from} → ${moveData.to}` : 
                'Your personalized moving journey'
              }
              {moveData.date && ` • Moving Date: ${new Date(moveData.date).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-600">{Math.round(progressPercentage)}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{movingTasks.filter(t => t.priority === 'high').length}</div>
                  <div className="text-sm text-gray-600">High Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{movingTasks.filter(t => t.priority === 'medium').length}</div>
                  <div className="text-sm text-gray-600">Medium Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{movingTasks.filter(t => t.priority === 'low').length}</div>
                  <div className="text-sm text-gray-600">Low Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{completedCount}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {movingTasks.map((task) => {
            const IconComponent = task.icon;
            const StatusIcon = getStatusIcon(task.id);
            const isCompleted = completedTasks.has(task.id);

            return (
              <Card 
                key={task.id} 
                className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
                  isCompleted ? 'bg-green-50 border-green-200' : 'hover:border-blue-300'
                }`}
                onClick={() => handleTaskClick(task)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isCompleted ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          isCompleted ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className={`text-lg ${
                          isCompleted ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500">{task.week}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <StatusIcon className={`w-6 h-6 ${
                        isCompleted ? 'text-green-500' : 'text-gray-400'
                      }`} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompletion(task.id);
                        }}
                        className={`text-xs px-2 py-1 rounded ${
                          isCompleted 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {isCompleted ? 'Done' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {task.description}
                  </CardDescription>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {task.category}
                    </Badge>
                    <span className="text-xs text-blue-600 font-medium">
                      Click to manage →
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common next steps for your move</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => setLocation('/ai-assistant')}
                variant="outline"
                className="p-4 h-auto flex flex-col gap-2"
              >
                <div className="text-sm font-medium">Need More Help?</div>
                <div className="text-xs text-gray-600">Ask our AI Assistant</div>
              </Button>
              <Button
                onClick={() => handleTaskClick(movingTasks[0])}
                variant="outline"
                className="p-4 h-auto flex flex-col gap-2"
              >
                <div className="text-sm font-medium">Find Movers</div>
                <div className="text-xs text-gray-600">Get quotes & compare</div>
              </Button>
              <Button
                onClick={() => handleTaskClick(movingTasks[1])}
                variant="outline"
                className="p-4 h-auto flex flex-col gap-2"
              >
                <div className="text-sm font-medium">Setup Utilities</div>
                <div className="text-xs text-gray-600">Transfer services</div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
