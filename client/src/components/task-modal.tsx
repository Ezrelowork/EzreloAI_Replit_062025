
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Clock, AlertTriangle, CheckCircle, Truck, Zap, FileText, Stethoscope, GraduationCap, Phone, Wifi, MapPin, CreditCard, Shield, Users, Heart, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  } | null;
  onToggleComplete: () => void;
  isCompleted: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onToggleComplete,
  isCompleted
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

  if (!isVisible || !task) return null;

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

  // Task-specific content and actions
  const getTaskContent = () => {
    switch (task.id) {
      case 'moving-company':
        return {
          icon: Truck,
          color: 'blue',
          quickActions: [
            {
              title: 'Get Moving Quotes',
              description: 'Compare prices from verified moving companies',
              action: () => {
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
              },
              buttonText: 'Find Movers',
              primary: true
            },
            {
              title: 'Moving Checklist',
              description: 'Comprehensive packing and moving timeline',
              action: () => {
                onClose();
                setLocation('/moving-checklist');
              },
              buttonText: 'View Checklist',
              primary: false
            }
          ],
          checklist: [
            'Research and get quotes from 3+ moving companies',
            'Verify company licenses and insurance',
            'Read reviews and check Better Business Bureau ratings',
            'Schedule in-home estimates',
            'Compare services: packing, storage, specialty items',
            'Book your preferred mover 6-8 weeks in advance',
            'Confirm moving date and inventory list'
          ]
        };

      case 'utilities-setup':
        return {
          icon: Zap,
          color: 'orange',
          quickActions: [
            {
              title: 'Find Utility Providers',
              description: 'Discover available utility services in your new area',
              action: () => {
                onClose();
                setLocation('/utilities');
              },
              buttonText: 'Find Utilities',
              primary: true
            },
            {
              title: 'Transfer Services',
              description: 'Set up service transfers and new accounts',
              action: () => {
                onClose();
                setLocation('/dashboard');
              },
              buttonText: 'Manage Services',
              primary: false
            }
          ],
          checklist: [
            'Contact electricity provider to transfer/setup service',
            'Arrange gas service connection if applicable',
            'Set up water and sewer services',
            'Schedule internet and cable installation',
            'Transfer or setup phone service',
            'Arrange trash and recycling pickup',
            'Confirm all service start dates match your move-in'
          ]
        };

      case 'address-change':
        return {
          icon: FileText,
          color: 'purple',
          quickActions: [
            {
              title: 'Change of Address Service',
              description: 'Update your address with key organizations',
              action: () => {
                onClose();
                setLocation('/change-of-address');
              },
              buttonText: 'Update Address',
              primary: true
            },
            {
              title: 'Document Checklist',
              description: 'Track which organizations you\'ve notified',
              action: () => {
                onClose();
                setLocation('/dashboard');
              },
              buttonText: 'View Tracker',
              primary: false
            }
          ],
          checklist: [
            'File postal service change of address form',
            'Update address with bank and credit card companies',
            'Notify employer and HR department',
            'Update voter registration',
            'Change address on driver\'s license and vehicle registration',
            'Update insurance policies (auto, home, health)',
            'Notify subscription services and online accounts'
          ]
        };

      case 'healthcare-transfer':
        return {
          icon: Stethoscope,
          color: 'red',
          quickActions: [
            {
              title: 'Find Healthcare Providers',
              description: 'Locate doctors, specialists, and medical facilities',
              action: () => {
                onClose();
                setLocation('/local-services');
              },
              buttonText: 'Find Doctors',
              primary: true
            },
            {
              title: 'Transfer Records',
              description: 'Manage medical record transfers and prescriptions',
              action: () => {
                onClose();
                setLocation('/dashboard');
              },
              buttonText: 'Manage Records',
              primary: false
            }
          ],
          checklist: [
            'Research and select new primary care physician',
            'Find specialists if needed (dentist, eye doctor, etc.)',
            'Request medical records from current providers',
            'Transfer prescriptions to new pharmacy',
            'Update health insurance provider information',
            'Schedule initial appointments with new doctors',
            'Locate nearest hospital and urgent care facilities'
          ]
        };

      case 'school-enrollment':
        return {
          icon: GraduationCap,
          color: 'indigo',
          quickActions: [
            {
              title: 'School District Information',
              description: 'Find schools and enrollment requirements in your area',
              action: () => {
                onClose();
                setLocation('/local-services');
              },
              buttonText: 'Find Schools',
              primary: true
            },
            {
              title: 'Enrollment Checklist',
              description: 'Track required documents and deadlines',
              action: () => {
                onClose();
                setLocation('/dashboard');
              },
              buttonText: 'View Requirements',
              primary: false
            }
          ],
          checklist: [
            'Research school districts and school ratings',
            'Contact schools to understand enrollment process',
            'Gather required documents (birth certificate, immunization records)',
            'Request school records transfer from current school',
            'Schedule school tours and meet with administrators',
            'Register for before/after school care if needed',
            'Apply for school transportation if available'
          ]
        };

      default:
        return {
          icon: CheckCircle,
          color: 'gray',
          quickActions: [],
          checklist: []
        };
    }
  };

  const taskContent = getTaskContent();
  const TaskIcon = taskContent.icon;

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
      <div className={`relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden transform transition-all duration-300 ${
        isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Header */}
        <div className={`${config.bgColor} ${config.borderColor} border-b-2 p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-${taskContent.color}-500 text-white shadow-lg`}>
                <TaskIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary" className={`${config.color} text-white font-bold`}>
                    {task.priority.toUpperCase()} PRIORITY
                  </Badge>
                  <Badge variant="outline" className="font-medium">
                    {task.week}
                  </Badge>
                  <Badge variant="outline" className="font-medium">
                    {task.category}
                  </Badge>
                  {isCompleted && (
                    <Badge className="bg-green-500 text-white">
                      ✓ Completed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-white/50"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Content with Tabs */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TaskIcon className="w-5 h-5" />
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed text-lg mb-4">{task.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                      <p className="text-gray-600">Recommended completion: {task.week}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Category</h4>
                      <p className="text-gray-600">{task.category}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Step-by-Step Checklist</CardTitle>
                  <CardDescription>
                    Complete these items to finish this task successfully
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {taskContent.checklist.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 flex-1">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              {taskContent.quickActions.map((action, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                        <p className="text-gray-600">{action.description}</p>
                      </div>
                      <Button
                        onClick={action.action}
                        className={action.primary ? 
                          `bg-${taskContent.color}-600 hover:bg-${taskContent.color}-700 text-white` : 
                          "border-gray-300 text-gray-700 hover:bg-gray-100"
                        }
                        variant={action.primary ? "default" : "outline"}
                      >
                        {action.buttonText}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Mark Complete Action */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                      </h3>
                      <p className="text-gray-600">
                        {isCompleted ? 'Reopen this task if you need to make changes' : 'Already finished? Update your progress'}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        onToggleComplete();
                        onClose();
                      }}
                      variant={isCompleted ? "outline" : "default"}
                      className={isCompleted ? "" : "bg-green-600 hover:bg-green-700 text-white"}
                    >
                      {isCompleted ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Mark Incomplete
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Task ID: {task.id} • Priority: {task.priority} • {task.category}
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
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const openTaskModal = () => setIsTaskModalOpen(true);
  const closeTaskModal = () => setIsTaskModalOpen(false);

  return {
    isTaskModalOpen,
    openTaskModal,
    closeTaskModal
  };
};
