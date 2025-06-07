import React from 'react';
import { Truck, Zap, Package, Home, Phone, Building, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface TaskPageProps {
  task: {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    week: string;
    category: string;
  };
  onComplete: () => void;
}

export const TaskPage: React.FC<TaskPageProps> = ({ task, onComplete }) => {
  const [, setLocation] = useLocation();
  
  const handleFindServices = () => {
    // Navigate to the appropriate service page based on task type
    const taskType = task.title.toLowerCase();
    if (taskType.includes('mover') || taskType.includes('moving') || taskType.includes('quote')) {
      setLocation('/moving-companies?from=Austin,%20TX&to=Dallas,%20TX&date=2024-07-15');
    } else if (taskType.includes('pack') || taskType.includes('organize') || taskType.includes('checklist')) {
      setLocation('/moving-checklist?from=Austin,%20TX&to=Dallas,%20TX&date=2024-07-15');
    } else {
      // Default to moving companies for other tasks
      setLocation('/moving-companies?from=Austin,%20TX&to=Dallas,%20TX&date=2024-07-15');
    }
  };

  const getTaskIcon = (title: string) => {
    const taskLower = title.toLowerCase();
    if (taskLower.includes('mover') || taskLower.includes('moving')) return Truck;
    if (taskLower.includes('utility') || taskLower.includes('electric')) return Zap;
    if (taskLower.includes('pack') || taskLower.includes('organize')) return Package;
    if (taskLower.includes('home') || taskLower.includes('house')) return Home;
    if (taskLower.includes('phone') || taskLower.includes('internet')) return Phone;
    if (taskLower.includes('bank') || taskLower.includes('insurance')) return Building;
    if (taskLower.includes('health') || taskLower.includes('medical')) return Heart;
    if (taskLower.includes('family') || taskLower.includes('school')) return Users;
    return Package;
  };

  const IconComponent = getTaskIcon(task.title);

  const priorityConfig = {
    high: { color: 'bg-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    medium: { color: 'bg-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    low: { color: 'bg-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
  };

  const config = priorityConfig[task.priority];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-3xl p-8 mb-8`}>
          <div className="flex items-center gap-6">
            <div className={`p-6 rounded-3xl ${config.color} text-white shadow-xl`}>
              <IconComponent className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{task.title}</h1>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full text-sm font-bold text-white ${config.color}`}>
                  {task.priority.toUpperCase()} PRIORITY
                </span>
                <span className="text-gray-600 font-medium">Timeline: {task.week}</span>
                <span className="text-gray-600 font-medium">Category: {task.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Overview</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{task.description}</p>
            </div>

            {/* Task Steps */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Steps to Complete</h3>
              <div className="space-y-3">
                {getTaskSteps(task.title).map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{step.title}</div>
                      <div className="text-sm text-gray-600">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Helpful Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getTaskResources(task.title).map((resource, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                    <div className="font-semibold text-blue-600">{resource.title}</div>
                    <div className="text-sm text-gray-600">{resource.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Task Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="text-orange-600 font-semibold">In Progress</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Due Date</span>
                  <span className="font-semibold">{task.week}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estimated Time</span>
                  <span className="font-semibold">30-60 min</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={onComplete}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg"
              >
                Mark as Complete
              </Button>
              <Button
                variant="outline"
                className="w-full border-2 border-gray-300 hover:border-gray-400 font-bold py-4 rounded-xl text-lg"
              >
                Need Help?
              </Button>
              <Button
                variant="outline"
                onClick={handleFindServices}
                className="w-full border-2 border-blue-300 hover:border-blue-400 text-blue-600 font-bold py-4 rounded-xl text-lg"
              >
                Find Services
              </Button>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h4 className="font-bold text-blue-900 mb-3">Pro Tips</h4>
              <div className="space-y-2 text-sm text-blue-800">
                {getTaskTips(task.title).map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for dynamic content
const getTaskSteps = (title: string) => {
  const taskLower = title.toLowerCase();
  
  if (taskLower.includes('mover') || taskLower.includes('moving')) {
    return [
      { title: "Research moving companies", description: "Get quotes from 3-5 licensed movers" },
      { title: "Compare estimates", description: "Review pricing, services, and reviews" },
      { title: "Book your mover", description: "Schedule moving date and confirm details" },
      { title: "Prepare for moving day", description: "Pack essentials and prepare home" }
    ];
  }
  
  if (taskLower.includes('utility') || taskLower.includes('electric')) {
    return [
      { title: "Contact utility providers", description: "Reach out to electric, gas, water companies" },
      { title: "Schedule service dates", description: "Arrange disconnection and connection dates" },
      { title: "Confirm new service", description: "Verify service activation at new address" },
      { title: "Test all utilities", description: "Ensure everything works properly" }
    ];
  }

  return [
    { title: "Plan your approach", description: "Understand what needs to be done" },
    { title: "Gather information", description: "Collect necessary documents and details" },
    { title: "Take action", description: "Complete the required steps" },
    { title: "Verify completion", description: "Confirm everything is properly finished" }
  ];
};

const getTaskResources = (title: string) => {
  const taskLower = title.toLowerCase();
  
  if (taskLower.includes('mover') || taskLower.includes('moving')) {
    return [
      { title: "Moving Calculator", description: "Estimate your moving costs" },
      { title: "Mover Reviews", description: "Check company ratings and feedback" },
      { title: "Moving Checklist", description: "Complete step-by-step guide" },
      { title: "Insurance Guide", description: "Understand moving insurance options" }
    ];
  }

  return [
    { title: "Online Tools", description: "Digital resources to help you" },
    { title: "Contact Information", description: "Important phone numbers and websites" },
    { title: "Document Templates", description: "Forms and checklists you might need" },
    { title: "Expert Guidance", description: "Professional tips and advice" }
  ];
};

const getTaskTips = (title: string) => {
  const taskLower = title.toLowerCase();
  
  if (taskLower.includes('mover') || taskLower.includes('moving')) {
    return [
      "Get quotes at least 6 weeks before moving",
      "Ask about additional fees and hidden costs",
      "Check if the company is licensed and insured",
      "Read reviews from multiple sources"
    ];
  }

  return [
    "Start this task as early as possible",
    "Keep all confirmation numbers and receipts",
    "Follow up to ensure completion",
    "Ask questions if anything is unclear"
  ];
};