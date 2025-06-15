import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search, Phone, Globe, Star, MapPin, DollarSign, FileText, CheckCircle, Building, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DocumentationTask {
  category: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  requirements: string[];
  estimatedTime: string;
  relatedServices?: string[];
  website?: string;
  phone?: string;
  notes?: string;
}

export default function Documentation() {
  const [, setLocation] = useLocation();
  const [tasks, setTasks] = useState<DocumentationTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [searchLocation, setSearchLocation] = useState('');
  const [hasCompletedActions, setHasCompletedActions] = useState(false);
  const { toast } = useToast();

  // Load location from URL params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from') || localStorage.getItem('aiFromLocation') || '';
    const toParam = urlParams.get('to') || localStorage.getItem('aiToLocation') || '';
    
    if (toParam) {
      setSearchLocation(toParam);
    }
    
    // Generate documentation tasks based on the move
    generateDocumentationTasks(fromParam, toParam);
  }, []);

  const canCompleteTask = () => {
    return hasCompletedActions && completedTasks.size > 0;
  };

  const generateDocumentationTasks = (fromLocation: string, toLocation: string) => {
    const documentationTasks: DocumentationTask[] = [
      {
        category: 'Address Changes',
        title: 'Update Voter Registration',
        description: 'Register to vote in your new location and update your voter registration',
        deadline: '30 days after move',
        priority: 'high',
        completed: false,
        requirements: ['Driver\'s license or state ID', 'Proof of residence', 'Social Security number'],
        estimatedTime: '15-30 minutes',
        website: 'https://www.vote.gov/',
        notes: 'Required for federal and local elections'
      },
      {
        category: 'Vehicle Registration',
        title: 'Register Vehicle in New State',
        description: 'Update vehicle registration and obtain new license plates',
        deadline: '30 days after move',
        priority: 'high',
        completed: false,
        requirements: ['Current registration', 'Proof of insurance', 'Driver\'s license', 'VIN verification'],
        estimatedTime: '1-2 hours',
        notes: 'Visit local DMV office'
      },
      {
        category: 'Driver\'s License',
        title: 'Update Driver\'s License',
        description: 'Obtain a new driver\'s license in your new state of residence',
        deadline: '30 days after move',
        priority: 'high',
        completed: false,
        requirements: ['Current license', 'Proof of residence', 'Social Security card', 'Birth certificate'],
        estimatedTime: '1-2 hours',
        notes: 'Required before vehicle registration'
      },
      {
        category: 'IRS & Taxes',
        title: 'Update Address with IRS',
        description: 'Notify the IRS of your address change for tax purposes',
        deadline: '30 days after move',
        priority: 'medium',
        completed: false,
        requirements: ['Form 8822', 'Previous tax return'],
        estimatedTime: '15 minutes',
        website: 'https://www.irs.gov/',
        notes: 'Can be done online or by mail'
      },
      {
        category: 'Social Security',
        title: 'Update Social Security Records',
        description: 'Update your address with the Social Security Administration',
        deadline: '10 days after move',
        priority: 'medium',
        completed: false,
        requirements: ['Social Security card', 'Photo ID', 'Proof of address'],
        estimatedTime: '30 minutes',
        website: 'https://www.ssa.gov/',
        phone: '1-800-772-1213'
      },
      {
        category: 'Employment',
        title: 'Update Employer Records',
        description: 'Notify your employer of address change for payroll and tax purposes',
        deadline: 'Before next pay period',
        priority: 'high',
        completed: false,
        requirements: ['New address information', 'Employee handbook'],
        estimatedTime: '15 minutes',
        notes: 'Contact HR department'
      },
      {
        category: 'Banking & Finance',
        title: 'Update Bank Information',
        description: 'Change address for all bank accounts, credit cards, and financial institutions',
        deadline: '2 weeks after move',
        priority: 'medium',
        completed: false,
        requirements: ['Account numbers', 'New address', 'Photo ID'],
        estimatedTime: '30-45 minutes',
        notes: 'Can often be done online or by phone'
      },
      {
        category: 'Insurance',
        title: 'Update Insurance Policies',
        description: 'Update address for auto, home, health, and life insurance policies',
        deadline: '30 days after move',
        priority: 'high',
        completed: false,
        requirements: ['Policy numbers', 'New address', 'Phone numbers'],
        estimatedTime: '45 minutes',
        notes: 'May affect rates and coverage'
      },
      {
        category: 'Subscriptions',
        title: 'Update Subscription Services',
        description: 'Change address for magazines, newspapers, and subscription services',
        deadline: '2 weeks before move',
        priority: 'low',
        completed: false,
        requirements: ['Account information', 'New address'],
        estimatedTime: '30 minutes',
        notes: 'Include streaming services that require location'
      },
      {
        category: 'Healthcare',
        title: 'Transfer Medical Records',
        description: 'Request medical records transfer to new healthcare providers',
        deadline: '2 weeks after move',
        priority: 'medium',
        completed: false,
        requirements: ['Insurance information', 'Previous provider contact', 'Photo ID'],
        estimatedTime: '45 minutes',
        notes: 'Allow 2-4 weeks for processing'
      }
    ];

    setTasks(documentationTasks);
  };

  const handleTaskComplete = (taskTitle: string) => {
    setCompletedTasks(prev => new Set(Array.from(prev).concat(taskTitle)));
    setHasCompletedActions(true);
    
    toast({
      title: "Task Marked Complete",
      description: `${taskTitle} has been completed.`,
    });
  };

  const handleTaskClick = (task: DocumentationTask) => {
    setHasCompletedActions(true);
    
    if (task.website) {
      window.open(task.website, '_blank');
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('address') || cat.includes('voter')) return MapPin;
    if (cat.includes('vehicle') || cat.includes('driver')) return Building;
    if (cat.includes('tax') || cat.includes('irs')) return DollarSign;
    if (cat.includes('social') || cat.includes('security')) return Users;
    if (cat.includes('employment') || cat.includes('employer')) return Building;
    if (cat.includes('bank') || cat.includes('finance')) return DollarSign;
    if (cat.includes('insurance')) return FileText;
    if (cat.includes('subscription')) return Globe;
    if (cat.includes('health') || cat.includes('medical')) return FileText;
    return FileText;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const from = urlParams.get('from');
                  const to = urlParams.get('to');
                  const date = urlParams.get('date');
                  
                  let journeyUrl = '/moving-journey';
                  if (from || to || date) {
                    const params = new URLSearchParams();
                    if (from) params.set('from', from);
                    if (to) params.set('to', to);
                    if (date) params.set('date', date);
                    journeyUrl += `?${params.toString()}`;
                  }
                  
                  window.location.href = journeyUrl;
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Journey
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documentation & Address Changes</h1>
                <p className="text-gray-600">Complete essential paperwork and update your information</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Documentation Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium">
                {completedTasks.size} of {tasks.length} tasks completed
              </span>
              <div className="w-64 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(completedTasks.size / tasks.length) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-gray-600">
              Complete these essential documentation tasks to finalize your relocation
            </p>
          </CardContent>
        </Card>

        {/* Tasks by Category */}
        <div className="space-y-8">
          {['Address Changes', 'Vehicle Registration', 'Driver\'s License', 'IRS & Taxes', 'Social Security', 'Employment', 'Banking & Finance', 'Insurance', 'Subscriptions', 'Healthcare'].map(category => {
            const categoryTasks = tasks.filter(task => task.category === category);
            if (categoryTasks.length === 0) return null;

            return (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-4">{category}</h2>
                <div className="grid gap-4">
                  {categoryTasks.map((task, index) => {
                    const IconComponent = getCategoryIcon(task.category);
                    const isCompleted = completedTasks.has(task.title);
                    
                    return (
                      <Card key={index} className={`hover:shadow-lg transition-shadow ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                                {isCompleted ? (
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                  <IconComponent className="w-6 h-6 text-blue-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                                    {task.title}
                                  </h3>
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                  {isCompleted && (
                                    <Badge className="bg-green-100 text-green-800">
                                      Completed
                                    </Badge>
                                  )}
                                </div>
                                <p className={`text-gray-600 mb-3 ${isCompleted ? 'line-through' : ''}`}>
                                  {task.description}
                                </p>
                                
                                {/* Deadline and Time */}
                                <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Deadline: {task.deadline}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Time needed: {task.estimatedTime}</span>
                                  </div>
                                </div>

                                {/* Requirements */}
                                <div className="mb-3">
                                  <h4 className="text-sm font-medium text-gray-700 mb-1">Requirements:</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {task.requirements.map((req, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {req}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Contact Info */}
                                {(task.website || task.phone) && (
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    {task.website && (
                                      <div className="flex items-center gap-1">
                                        <Globe className="w-4 h-4" />
                                        <a 
                                          href={task.website} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 underline"
                                          onClick={() => setHasCompletedActions(true)}
                                        >
                                          Visit Website
                                        </a>
                                      </div>
                                    )}
                                    {task.phone && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        <span>{task.phone}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {task.notes && (
                                  <div className="mt-2 text-sm text-gray-500 italic">
                                    Note: {task.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-2">
                            {task.website && !isCompleted && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTaskClick(task)}
                              >
                                Visit Website
                              </Button>
                            )}
                            {task.phone && !isCompleted && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  window.open(`tel:${task.phone}`, '_self');
                                  setHasCompletedActions(true);
                                }}
                              >
                                Call Now
                              </Button>
                            )}
                            <Button 
                              size="sm"
                              onClick={() => handleTaskComplete(task.title)}
                              disabled={isCompleted}
                              className={isCompleted ? 
                                "bg-green-600 text-white cursor-default" : 
                                "bg-green-600 hover:bg-green-700 text-white"
                              }
                            >
                              {isCompleted ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Completed
                                </>
                              ) : (
                                "Mark Complete"
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Task Completion Bar */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-lg shadow-lg border p-4 flex items-center gap-4">
            <Button
              onClick={() => {
                if (canCompleteTask()) {
                  toast({
                    title: "Documentation Task Completed!",
                    description: "Returning to your moving journey...",
                  });
                  
                  // Zoom back to journey page with preserved context
                  setTimeout(() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const from = urlParams.get('from');
                    const to = urlParams.get('to');
                    const date = urlParams.get('date');
                    
                    let journeyUrl = '/moving-journey';
                    if (from || to || date) {
                      const params = new URLSearchParams();
                      if (from) params.set('from', from);
                      if (to) params.set('to', to);
                      if (date) params.set('date', date);
                      journeyUrl += `?${params.toString()}`;
                    }
                    
                    window.location.href = journeyUrl;
                  }, 1000);
                }
              }}
              disabled={!canCompleteTask()}
              className={`font-medium py-2 px-6 rounded-lg text-sm shadow-sm transition-all ${
                canCompleteTask() 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {canCompleteTask() ? "Complete Documentation Setup" : "Mark Tasks Complete First"}
            </Button>
            
            <Button
              onClick={() => {
                const urlParams = new URLSearchParams(window.location.search);
                const from = urlParams.get('from');
                const to = urlParams.get('to');
                const date = urlParams.get('date');
                
                let journeyUrl = '/moving-journey';
                if (from || to || date) {
                  const params = new URLSearchParams();
                  if (from) params.set('from', from);
                  if (to) params.set('to', to);
                  if (date) params.set('date', date);
                  journeyUrl += `?${params.toString()}`;
                }
                
                window.location.href = journeyUrl;
              }}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50 font-medium py-2 px-4 rounded-lg text-sm shadow-sm transition-all"
            >
              Return to Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}