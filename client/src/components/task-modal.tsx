import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    week: string;
    category: string;
  };
  onStartTask: () => void;
  onMarkComplete?: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onStartTask,
  onMarkComplete
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const priorityConfig = {
    high: {
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: AlertTriangle
    },
    medium: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: Clock
    },
    low: {
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle
    }
  };

  const config = priorityConfig[task.priority];
  const IconComponent = config.icon;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
      isOpen ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-300 ${
        isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Header */}
        <div className={`${config.bgColor} ${config.borderColor} border-b-2 rounded-t-3xl p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${config.color} text-white shadow-lg`}>
                <IconComponent className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{task.title}</h2>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${config.color}`}>
                    {task.priority.toUpperCase()} PRIORITY
                  </span>
                  <span className="text-sm text-gray-600 font-medium">
                    Timeline: {task.week}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-white/50"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Details</h3>
            <p className="text-gray-700 leading-relaxed text-base">{task.description}</p>
          </div>

          {/* Task Category Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
            <h4 className="font-semibold text-gray-900 mb-2">Category: {task.category}</h4>
            <div className="text-sm text-gray-600">
              This task is part of your {task.category.toLowerCase()} checklist and should be completed during {task.week}.
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            {/* Moving Company Actions */}
            {task.title.toLowerCase().includes('moving') && (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-200">
                <div>
                  <div className="font-semibold text-gray-900">Find & Book Moving Companies</div>
                  <div className="text-sm text-gray-600">Get quotes from professional movers</div>
                </div>
                <Button
                  onClick={() => {
                    const fromParam = localStorage.getItem('aiFromLocation');
                    const toParam = localStorage.getItem('aiToLocation');
                    const dateParam = localStorage.getItem('aiMoveDate');
                    
                    const params = new URLSearchParams();
                    if (fromParam) params.set('from', fromParam);
                    if (toParam) params.set('to', toParam);
                    if (dateParam) params.set('date', dateParam);
                    
                    const queryString = params.toString();
                    const finalRoute = queryString ? `/moving-companies?${queryString}` : '/moving-companies';
                    
                    onClose();
                    setLocation(finalRoute);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-xl flex items-center gap-2"
                >
                  Find Movers
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Default Action for Other Tasks */}
            {!task.title.toLowerCase().includes('moving') && (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-200">
                <div>
                  <div className="font-semibold text-gray-900">Ready to start this task?</div>
                  <div className="text-sm text-gray-600">Access tools and resources to complete this step</div>
                </div>
                <Button
                  onClick={() => {
                    const fromParam = localStorage.getItem('aiFromLocation');
                    const toParam = localStorage.getItem('aiToLocation');
                    const dateParam = localStorage.getItem('aiMoveDate');
                    
                    const params = new URLSearchParams();
                    if (fromParam) params.set('from', fromParam);
                    if (toParam) params.set('to', toParam);
                    if (dateParam) params.set('date', dateParam);
                    
                    const taskLower = task.title.toLowerCase();
                    let targetRoute = '/dashboard';
                    
                    if (taskLower.includes('utility') || taskLower.includes('utilities') || taskLower.includes('electric') || taskLower.includes('internet') || taskLower.includes('gas') || taskLower.includes('water')) {
                      targetRoute = '/utilities';
                    } else if (taskLower.includes('address') || taskLower.includes('change') && taskLower.includes('address')) {
                      targetRoute = '/change-of-address';
                    } else if (taskLower.includes('local') || taskLower.includes('services') || taskLower.includes('community')) {
                      targetRoute = '/local-services';
                    }
                    
                    const queryString = params.toString();
                    const finalRoute = queryString ? `${targetRoute}?${queryString}` : targetRoute;
                    
                    onClose();
                    setLocation(finalRoute);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-xl flex items-center gap-2"
                >
                  Start Task
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <div className="font-semibold text-gray-900">
                  {/* Check if task is completed by looking at localStorage */}
                  {(() => {
                    const completedTasks = localStorage.getItem('completedTasks');
                    const completedSet = completedTasks ? new Set(JSON.parse(completedTasks)) : new Set();
                    const isCompleted = completedSet.has(task.id);
                    
                    return isCompleted ? "Undo completion" : "Mark as completed";
                  })()}
                </div>
                <div className="text-sm text-gray-600">
                  {(() => {
                    const completedTasks = localStorage.getItem('completedTasks');
                    const completedSet = completedTasks ? new Set(JSON.parse(completedTasks)) : new Set();
                    const isCompleted = completedSet.has(task.id);
                    
                    return isCompleted 
                      ? "Click to mark this task as incomplete and return it to your active list" 
                      : "Already finished? Update your progress";
                  })()}
                </div>
              </div>
              <Button
                onClick={() => {
                  onMarkComplete?.();
                  onClose();
                }}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold px-6 py-2 rounded-xl"
              >
                {(() => {
                  const completedTasks = localStorage.getItem('completedTasks');
                  const completedSet = completedTasks ? new Set(JSON.parse(completedTasks)) : new Set();
                  const isCompleted = completedSet.has(task.id);
                  
                  return isCompleted ? "Undo" : "Mark Done";
                })()}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 rounded-b-3xl bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Task {task.id} • {task.category} Category
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for managing task modal state
export const useTaskModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);

  const openModal = (task: any) => {
    setCurrentTask(task);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setCurrentTask(null), 300);
  };

  return {
    isOpen,
    currentTask,
    openModal,
    closeModal
  };
};