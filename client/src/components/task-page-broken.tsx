import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  ArrowLeft, 
  Truck, 
  Home, 
  Zap, 
  MapPin,
  Star,
  Clock,
  Phone,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

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
  onBack?: () => void;
  onTaskComplete?: (taskId: string) => void;
}

export const TaskPage: React.FC<TaskPageProps> = ({ task, onComplete, onBack, onTaskComplete }) => {
  const [, setLocation] = useLocation();
  const [movingCompanies, setMovingCompanies] = useState<MovingCompany[]>([]);
  const [utilities, setUtilities] = useState<UtilityService[]>([]);
  const [housingServices, setHousingServices] = useState<HousingService[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchType, setSearchType] = useState<'moving' | 'utilities' | 'housing'>('moving');
  const [moveData, setMoveData] = useState({ from: '', to: '', date: '' });
  const [selectedFont, setSelectedFont] = useState('font-source');

  const { toast } = useToast();

  // Load move data and cached results from localStorage on component mount
  useEffect(() => {
    const fromLocation = localStorage.getItem('aiFromLocation') || 'Austin, TX';
    const toLocation = localStorage.getItem('aiToLocation') || 'Dallas, TX';
    const moveDate = localStorage.getItem('aiMoveDate') || '2024-08-15';
    
    setMoveData({
      from: fromLocation,
      to: toLocation,
      date: moveDate
    });

    // Load cached data based on task type
    const taskTitle = task.title.toLowerCase();
    if (taskTitle.includes('moving') || taskTitle.includes('mover')) {
      const cachedMovingData = localStorage.getItem(`movingCompanies_${fromLocation}_${toLocation}`);
      if (cachedMovingData) {
        const companies = JSON.parse(cachedMovingData);
        setMovingCompanies(companies);
        setSearchType('moving');
        setShowResults(true);
      }
    } else if (taskTitle.includes('utilities') || taskTitle.includes('electric') || taskTitle.includes('gas')) {
      const cachedUtilitiesData = localStorage.getItem(`utilities_${toLocation}`);
      if (cachedUtilitiesData) {
        const utilities = JSON.parse(cachedUtilitiesData);
        setUtilities(utilities);
        setSearchType('utilities');
        setShowResults(true);
      }
    } else if (taskTitle.includes('housing') || taskTitle.includes('real estate') || taskTitle.includes('home')) {
      const cachedHousingData = localStorage.getItem(`housing_${toLocation}`);
      if (cachedHousingData) {
        const housing = JSON.parse(cachedHousingData);
        setHousingServices(housing);
        setSearchType('housing');
        setShowResults(true);
      }
    }
  }, [task.title]);

  // Moving company search mutation
  const movingCompanyMutation = useMutation({
    mutationFn: async () => {
      const fromParts = moveData.from.split(',');
      const toParts = moveData.to.split(',');
      
      const response = await apiRequest("POST", "/api/moving-companies", {
        fromAddress: "",
        fromCity: fromParts[0]?.trim() || "Austin",
        fromState: fromParts[1]?.trim() || "TX",
        fromZip: fromParts[2]?.trim() || "78701",
        toCity: toParts[0]?.trim() || "Dallas",
        toState: toParts[1]?.trim() || "TX",
        toZip: toParts[2]?.trim() || "75201"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const companies = data?.companies || [];
      setMovingCompanies(companies);
      setSearchType('moving');
      setShowResults(true);
      
      // Cache the results for future visits
      localStorage.setItem(`movingCompanies_${moveData.from}_${moveData.to}`, JSON.stringify(companies));
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Unable to find moving companies. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Utilities search mutation
  const utilitiesMutation = useMutation({
    mutationFn: async () => {
      const toParts = moveData.to.split(',');
      const response = await apiRequest("POST", "/api/utilities-search", {
        city: toParts[0]?.trim() || "Dallas",
        state: toParts[1]?.trim() || "TX",
        zipCode: toParts[2]?.trim() || "75201"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const utilityServices = data?.utilities || [];
      setUtilities(utilityServices);
      setSearchType('utilities');
      setShowResults(true);
      
      // Cache the results for future visits
      localStorage.setItem(`utilities_${moveData.to}`, JSON.stringify(utilityServices));
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Unable to find utility services. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Housing services search mutation
  const housingMutation = useMutation({
    mutationFn: async () => {
      const toParts = moveData.to.split(',');
      const response = await apiRequest("POST", "/api/housing-services", {
        city: toParts[0]?.trim() || "Dallas",
        state: toParts[1]?.trim() || "TX",
        zipCode: toParts[2]?.trim() || "75201"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const services = data?.services || [];
      setHousingServices(services);
      setSearchType('housing');
      setShowResults(true);
      
      // Cache the results for future visits
      localStorage.setItem(`housing_${moveData.to}`, JSON.stringify(services));
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Unable to find housing services. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReferralClick = async (company: MovingCompany, action: string) => {
    try {
      await apiRequest("POST", "/api/referral-click", {
        provider: company.provider,
        category: company.category,
        action: action,
        userAddress: moveData.from
      });
      
      if (action === 'website_visit') {
        window.open(company.website, '_blank');
      } else if (action === 'quote_request') {
        window.open(company.referralUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to track referral click:', error);
    }
  };

  const getTaskConfig = () => {
    const title = task.title.toLowerCase();
    if (title.includes('moving') || title.includes('mover')) {
      return { icon: Truck, color: 'bg-blue-600' };
    } else if (title.includes('utilities') || title.includes('electric') || title.includes('gas')) {
      return { icon: Zap, color: 'bg-green-600' };
    } else if (title.includes('housing') || title.includes('real estate') || title.includes('home')) {
      return { icon: Home, color: 'bg-purple-600' };
    }
    return { icon: Info, color: 'bg-gray-600' };
  };

  const config = getTaskConfig();
  const IconComponent = config.icon;

  const getTaskSteps = (taskTitle: string) => {
    if (taskTitle.toLowerCase().includes('moving') || taskTitle.toLowerCase().includes('mover')) {
      return [
        { title: "Get Multiple Quotes", description: "Contact 3-5 moving companies for estimates" },
        { title: "Check Credentials", description: "Verify licensing and insurance" },
        { title: "Read Reviews", description: "Check online reviews and references" },
        { title: "Compare Services", description: "Evaluate pricing and service options" },
        { title: "Book Your Move", description: "Schedule your preferred moving company" }
      ];
    }
    return [
      { title: "Research Options", description: "Look into available services in your area" },
      { title: "Compare Providers", description: "Evaluate different service providers" },
      { title: "Contact Providers", description: "Reach out for quotes and information" },
      { title: "Make Decision", description: "Choose the best option for your needs" }
    ];
  };

  const getTaskResources = (taskTitle: string) => {
    if (taskTitle.toLowerCase().includes('moving') || taskTitle.toLowerCase().includes('mover')) {
      return [
        { title: "Moving Checklist", description: "Complete timeline for your move" },
        { title: "Packing Tips", description: "How to pack efficiently and safely" },
        { title: "Insurance Guide", description: "Understanding moving insurance options" },
        { title: "Cost Calculator", description: "Estimate your total moving costs" }
      ];
    }
    return [
      { title: "Service Guide", description: "Understanding your options" },
      { title: "Cost Information", description: "Typical pricing and fees" },
      { title: "Setup Process", description: "How to get started" },
      { title: "Tips & Tricks", description: "Make the most of your service" }
    ];
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${selectedFont}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-6">
            <div className={`p-6 rounded-3xl ${config.color} text-white shadow-xl`}>
              <IconComponent className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">{task.title}</h1>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${config.color}`}>
                  {task.priority.toUpperCase()}
                </span>
                <span className="text-gray-600 text-sm font-medium">Timeline: {task.week}</span>
                <span className="text-gray-600 text-sm font-medium">Category: {task.category}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{moveData.from}</span>
                  <span className="text-blue-600">→</span>
                  <span>{moveData.to}</span>
                  <span className="text-gray-500 text-xs ml-3">Move Date: {new Date(moveData.date).toLocaleDateString()}</span>
                </div>
                {/* Status Information - Reserve space to prevent layout shift */}
                <div className="min-h-[24px] flex items-center gap-2">
                  {showResults && searchType === 'moving' && movingCompanies.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md w-fit">
                      <CheckCircle className="w-3 h-3" />
                      <span>{movingCompanies.length} providers (cached)</span>
                    </div>
                  )}
                  {showResults && searchType === 'utilities' && utilities.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md w-fit">
                      <CheckCircle className="w-3 h-3" />
                      <span>{utilities.length} services (cached)</span>
                    </div>
                  )}
                  {showResults && searchType === 'housing' && housingServices.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md w-fit">
                      <CheckCircle className="w-3 h-3" />
                      <span>{housingServices.length} services (cached)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Task Progress - compact version */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-4 min-w-[220px]">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Complete</span>
                  <span className="text-xs font-bold text-blue-600">25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Research done</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Font Selector */}
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow-sm border p-3">
            <label className="text-xs font-medium text-gray-700 mb-2 block">Font Style:</label>
            <div className="flex gap-2">
              {[
                { value: 'font-source', label: 'Source Sans Pro' },
                { value: 'font-inter', label: 'Inter' },
                { value: 'font-roboto', label: 'Roboto' },
                { value: 'font-open', label: 'Open Sans' }
              ].map((font) => (
                <button
                  key={font.value}
                  onClick={() => setSelectedFont(font.value)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    selectedFont === font.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="gap-1 text-sm py-2 px-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Hub
          </Button>
          <Button
            onClick={() => onBack ? onBack() : setLocation('/moving-journey')}
            variant="outline"
            className="border border-blue-600 hover:border-blue-700 text-blue-700 hover:text-blue-800 font-medium py-2 px-4 rounded-lg text-sm shadow-sm transform hover:scale-105 transition-all"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Journey
          </Button>
          
          <Button
            onClick={() => movingCompanyMutation.mutate()}
            disabled={movingCompanyMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm shadow-sm transition-all"
          >
            {movingCompanyMutation.isPending ? 'Searching...' : 'Find Providers'}
          </Button>
          
          <Button
            onClick={onComplete}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg text-sm shadow-sm transition-all"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Complete
          </Button>
          
          <Button
            variant="outline"
            className="border border-gray-400 hover:border-gray-500 text-gray-700 hover:text-gray-900 font-medium py-2 px-6 rounded-lg text-sm shadow-sm transition-all"
          >
            Help
          </Button>
        </div>

        {/* Task Overview - moved from sidebar */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md border p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-1 h-6 bg-gray-600 rounded-full"></div>
              Task Overview
            </h2>
            <p className="text-sm text-gray-700 mb-3">{task.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {getTaskSteps().map((step, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-xs font-bold text-gray-900 mb-1">{step.title}</h4>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Service Results */}
        <div className="w-full max-w-[55%]">
          {/* Service Results */}
          {showResults && (
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-md border border-blue-100 p-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                    {searchType === 'moving' && `Providers: ${moveData.from} → ${moveData.to}`}
                    {searchType === 'utilities' && `Services: ${moveData.to}`}
                    {searchType === 'housing' && `Housing Services for ${moveData.to}`}
                  </h2>
                  <div className="space-y-4">
                    {searchType === 'moving' && movingCompanies.length > 0 && 
                      movingCompanies.map((company, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all relative">
                          <div className="flex-1 pr-20">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-bold text-gray-900">{company.provider}</h3>
                              <span className="text-sm font-bold text-green-600">{company.estimatedCost}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < company.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-gray-600">({company.rating})</span>
                              </div>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-600">{company.phone}</span>
                            </div>
                            <p className="text-xs text-gray-700 mb-2 line-clamp-2">{company.description}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {company.services.slice(0, 4).map((service, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="absolute bottom-3 right-3">
                            <Button
                              onClick={() => handleReferralClick(company, 'quote_request')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
                            >
                              Get Estimate
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
            {/* Task Overview */}
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
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => window.open('tel:+18007685522', '_self')}
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50 font-semibold py-3 rounded-xl"
                >
                  📞 Call Moving Hotline
                </Button>
                <Button
                  onClick={() => window.open('https://www.moving.org/checklist/', '_blank')}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold py-3 rounded-xl"
                >
                  📋 Download Checklist
                </Button>
                <Button
                  onClick={() => window.open('https://www.calculator.net/moving-cost-calculator.html', '_blank')}
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold py-3 rounded-xl"
                >
                  💰 Cost Calculator
                </Button>
              </div>
            </div>

            {/* Moving Timeline */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Moving Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">8 weeks before: Start planning</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">6 weeks before: Get quotes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">4 weeks before: Book movers</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">2 weeks before: Confirm details</span>
                </div>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pro Tips</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <span>Get binding estimates in writing</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <span>Check company credentials online</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <span>Read all contracts carefully</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Task Completion Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mt-8">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Complete This Task?</h3>
              <p className="text-gray-600 mb-6">Mark this task as complete to continue your relocation journey</p>
              
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    if (onTaskComplete) {
                      onTaskComplete(task.id);
                    }
                    onComplete();
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Mark Task Complete
                </Button>
                
                {onBack && (
                  <Button
                    onClick={onBack}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-8 py-3 rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Journey
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};