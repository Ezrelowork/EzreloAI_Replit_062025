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
}

export const TaskPage: React.FC<TaskPageProps> = ({ task, onComplete }) => {
  const [, setLocation] = useLocation();
  const [movingCompanies, setMovingCompanies] = useState<MovingCompany[]>([]);
  const [utilities, setUtilities] = useState<UtilityService[]>([]);
  const [housingServices, setHousingServices] = useState<HousingService[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchType, setSearchType] = useState<'moving' | 'utilities' | 'housing'>('moving');
  const [moveData, setMoveData] = useState({ from: '', to: '', date: '' });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const { toast } = useToast();

  // Load move data from localStorage on component mount
  useEffect(() => {
    const fromLocation = localStorage.getItem('aiFromLocation') || 'Austin, TX';
    const toLocation = localStorage.getItem('aiToLocation') || 'Dallas, TX';
    const moveDate = localStorage.getItem('aiMoveDate') || '2024-08-15';
    
    setMoveData({
      from: fromLocation,
      to: toLocation,
      date: moveDate
    });
  }, []);

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
      
      // Show centered notification
      setNotificationMessage(`Found ${companies.length} moving companies for your route`);
      setShowNotification(true);
      setShowResults(true);
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
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
      toast({
        title: "Utilities Found",
        description: `Found ${utilityServices.length} utility services in your area`,
      });
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
      toast({
        title: "Housing Services Found",
        description: `Found ${services.length} housing services in your area`,
      });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Top Notification */}
      {showNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-3 text-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <p className="text-lg font-semibold text-gray-900">{notificationMessage}</p>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-6">
            <div className={`p-6 rounded-3xl ${config.color} text-white shadow-xl`}>
              <IconComponent className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{task.title}</h1>
              <div className="flex items-center gap-4 mb-2">
                <span className={`px-4 py-2 rounded-full text-sm font-bold text-white ${config.color}`}>
                  {task.priority.toUpperCase()} PRIORITY
                </span>
                <span className="text-gray-600 font-medium">Timeline: {task.week}</span>
                <span className="text-gray-600 font-medium">Category: {task.category}</span>
              </div>
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>{moveData.from}</span>
                <span className="text-blue-600">→</span>
                <span>{moveData.to}</span>
                <span className="text-gray-500 text-base ml-4">Move Date: {new Date(moveData.date).toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Task Progress - moved from sidebar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 min-w-[280px]">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Task Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion</span>
                  <span className="text-sm font-bold text-blue-600">25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Research phase completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setLocation('/moving-journey')}
            variant="outline"
            className="border-2 border-blue-600 hover:border-blue-700 text-blue-700 hover:text-blue-800 font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Journey
          </Button>
          
          <Button
            onClick={() => movingCompanyMutation.mutate()}
            disabled={movingCompanyMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all"
          >
            {movingCompanyMutation.isPending ? 'Searching...' : 'Find Movers'}
          </Button>
          
          <Button
            onClick={onComplete}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Mark Complete
          </Button>
          
          <Button
            variant="outline"
            className="border-2 border-gray-400 hover:border-gray-500 text-gray-700 hover:text-gray-900 font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all"
          >
            Need Help?
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Overview and Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Results */}
            {showResults && (
              <div className="mb-6">
                <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-100 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                    {searchType === 'moving' && `Moving Companies for ${moveData.from} → ${moveData.to}`}
                    {searchType === 'utilities' && `Utilities & Services for ${moveData.to}`}
                    {searchType === 'housing' && `Housing Services for ${moveData.to}`}
                  </h2>
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
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleReferralClick(company, 'website_visit')}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                            >
                              Visit Website
                            </Button>
                            <Button
                              onClick={() => window.open(`tel:${company.phone}`, '_self')}
                              variant="outline"
                              className="border-green-500 text-green-700 hover:bg-green-50 px-6 py-2 rounded-lg font-semibold"
                            >
                              Call {company.phone}
                            </Button>
                            <Button
                              onClick={() => handleReferralClick(company, 'quote_request')}
                              variant="outline"
                              className="border-orange-500 text-orange-700 hover:bg-orange-50 px-6 py-2 rounded-lg font-semibold"
                            >
                              Get Quote
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
        </div>
      </div>
    </div>
  );
};