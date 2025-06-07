import React, { useState, useEffect } from 'react';
import { Truck, Zap, Package, Home, Phone, Building, Heart, Users, Star, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MovingCompany {
  category: string;
  provider: string;
  phone: string;
  description: string;
  website: string;
  referralUrl: string;
  affiliateCode: string;
  hours: string;
  rating: number;
  services: string[];
  estimatedCost: string;
  availability?: string;
  licenseInfo?: string;
  specialties?: string[];
  insuranceOptions?: string[];
  estimatedTimeframe?: string;
  notes?: string;
}

interface UtilityService {
  category: string;
  provider: string;
  phone: string;
  description: string;
  website: string;
  referralUrl: string;
  services: string[];
  estimatedCost: string;
  rating: number;
  availability: string;
}

interface HousingService {
  category: string;
  provider: string;
  phone: string;
  description: string;
  website: string;
  referralUrl: string;
  services: string[];
  estimatedCost: string;
  rating: number;
  specialties: string[];
}

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
  const [movingCompanies, setMovingCompanies] = useState<MovingCompany[]>([]);
  const [utilities, setUtilities] = useState<UtilityService[]>([]);
  const [housingServices, setHousingServices] = useState<HousingService[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState<'moving' | 'utilities' | 'housing'>('moving');
  const { toast } = useToast();
  
  // Determine task type from title
  const getTaskType = () => {
    const title = task.title.toLowerCase();
    if (title.includes('utility') || title.includes('electric') || title.includes('internet') || title.includes('gas')) {
      return 'utilities';
    }
    if (title.includes('home') || title.includes('house') || title.includes('insurance') || title.includes('real estate')) {
      return 'housing';
    }
    return 'moving';
  };

  // Moving company search mutation
  const movingCompanyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/moving-companies", {
        fromAddress: "",
        fromCity: "Austin",
        fromState: "TX",
        fromZip: "78701",
        toCity: "Dallas",
        toState: "TX",
        toZip: "75201"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const companies = data?.companies || [];
      setMovingCompanies(companies);
      setSearchType('moving');
      setShowResults(true);
      toast({
        title: "Moving Companies Found",
        description: `Found ${companies.length} qualified moving companies for your route`,
      });
    },
    onError: () => {
      toast({
        title: "Search Error",
        description: "Unable to find moving companies. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Utilities search mutation
  const utilitiesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/utilities-search", {
        city: "Dallas",
        state: "TX",
        zipCode: "75201"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const utilityServices = data?.utilities || [];
      setUtilities(utilityServices);
      setSearchType('utilities');
      setShowResults(true);
      toast({
        title: "Utilities Found",
        description: `Found ${utilityServices.length} utility providers for your new area`,
      });
    },
    onError: () => {
      toast({
        title: "Search Error",
        description: "Unable to find utilities. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Housing services search mutation
  const housingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/housing-services", {
        city: "Dallas",
        state: "TX",
        zipCode: "75201"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const services = data?.services || [];
      setHousingServices(services);
      setSearchType('housing');
      setShowResults(true);
      toast({
        title: "Housing Services Found",
        description: `Found ${services.length} housing service providers`,
      });
    },
    onError: () => {
      toast({
        title: "Search Error",
        description: "Unable to find housing services. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFindServices = () => {
    const taskType = getTaskType();
    
    if (showResults) {
      setShowResults(false);
      return;
    }

    switch (taskType) {
      case 'utilities':
        utilitiesMutation.mutate();
        break;
      case 'housing':
        housingMutation.mutate();
        break;
      default:
        movingCompanyMutation.mutate();
        break;
    }
  };

  const getButtonText = () => {
    const taskType = getTaskType();
    const isLoading = movingCompanyMutation.isPending || utilitiesMutation.isPending || housingMutation.isPending;
    
    if (isLoading) return 'Searching...';
    if (showResults) return 'Hide Results';
    
    switch (taskType) {
      case 'utilities':
        return 'Find Utilities';
      case 'housing':
        return 'Find Services';
      default:
        return 'Find Movers';
    }
  };

  const handleReferralClick = async (company: MovingCompany, action: string) => {
    try {
      await apiRequest("POST", "/api/referral-click", {
        provider: company.provider,
        category: company.category,
        action: action,
        userAddress: "Austin, TX → Dallas, TX"
      });
      
      window.open(company.referralUrl, '_blank');
    } catch (error) {
      console.error('Error tracking referral click:', error);
      window.open(company.referralUrl, '_blank');
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-3xl p-8 mb-6`}>
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

        {/* Prominent Action Buttons */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <Button
            onClick={handleFindServices}
            disabled={movingCompanyMutation.isPending || utilitiesMutation.isPending || housingMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all disabled:opacity-70"
          >
            {getButtonText()}
          </Button>
          <Button
            onClick={onComplete}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all"
          >
            Mark Complete
          </Button>
          <Button
            variant="outline"
            className="border-2 border-gray-400 hover:border-gray-500 text-gray-700 hover:text-gray-900 font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all"
          >
            Need Help?
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Results or Task Details */}
          <div className="lg:col-span-2 space-y-6">
            {showResults ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {searchType === 'moving' && 'Moving Companies for Austin → Dallas'}
                  {searchType === 'utilities' && 'Utilities & Services for Dallas, TX'}
                  {searchType === 'housing' && 'Housing Services for Dallas, TX'}
                </h2>
                {/* Results Display */}
                <div className="space-y-4">
                  {searchType === 'moving' && movingCompanies.length > 0 && 
                    movingCompanies.map((company, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{company.provider}</h3>
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < company.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-sm text-gray-600 ml-1">({company.rating})</span>
                              </div>
                              <span className="text-lg font-bold text-green-600">{company.estimatedCost}</span>
                            </div>
                            <p className="text-gray-700 mb-3">{company.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {company.services.slice(0, 3).map((service, idx) => (
                                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  {service}
                                </span>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{company.hours}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{company.phone}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                          <Button
                            onClick={() => handleReferralClick(company, 'get_quote')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl flex-1"
                          >
                            Get Quote
                          </Button>
                          <Button
                            onClick={() => handleReferralClick(company, 'call_now')}
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50 font-semibold px-6 py-2 rounded-xl flex-1"
                          >
                            Call Now
                          </Button>
                          <Button
                            onClick={() => handleReferralClick(company, 'view_website')}
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-6 py-2 rounded-xl"
                          >
                            Website
                          </Button>
                        </div>
                      </div>
                    ))
                  }

                  {searchType === 'utilities' && utilities.length > 0 && 
                    utilities.map((utility, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{utility.provider}</h3>
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-3 inline-block">
                              {utility.category}
                            </span>
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < utility.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-sm text-gray-600 ml-1">({utility.rating})</span>
                              </div>
                              <span className="text-lg font-bold text-green-600">{utility.estimatedCost}</span>
                            </div>
                            <p className="text-gray-700 mb-3">{utility.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {utility.services.slice(0, 3).map((service, idx) => (
                                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                          <Button
                            onClick={() => window.open(utility.referralUrl, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl flex-1"
                          >
                            Get Service
                          </Button>
                          <Button
                            onClick={() => window.open(`tel:${utility.phone}`, '_self')}
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50 font-semibold px-6 py-2 rounded-xl flex-1"
                          >
                            Call Now
                          </Button>
                        </div>
                      </div>
                    ))
                  }

                  {searchType === 'housing' && housingServices.length > 0 &&
                    housingServices.map((service, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{service.provider}</h3>
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-3 inline-block">
                              {service.category}
                            </span>
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < service.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-sm text-gray-600 ml-1">({service.rating})</span>
                              </div>
                              <span className="text-lg font-bold text-green-600">{service.estimatedCost}</span>
                            </div>
                            <p className="text-gray-700 mb-3">{service.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {service.services.slice(0, 3).map((serviceItem, idx) => (
                                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  {serviceItem}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                          <Button
                            onClick={() => window.open(service.referralUrl, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl flex-1"
                          >
                            Get Quote
                          </Button>
                          <Button
                            onClick={() => window.open(`tel:${service.phone}`, '_self')}
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50 font-semibold px-6 py-2 rounded-xl flex-1"
                          >
                            Call Now
                          </Button>
                        </div>
                      </div>
                    ))
                  }

                  {/* No Results Message */}
                  {((searchType === 'moving' && movingCompanies.length === 0) ||
                    (searchType === 'utilities' && utilities.length === 0) ||
                    (searchType === 'housing' && housingServices.length === 0)) && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No services found. Please try again.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Overview</h2>
                <p className="text-gray-700 leading-relaxed text-lg">{task.description}</p>
              </div>
            )}

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