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

  const movingCompanyMutation = useMutation({
    mutationFn: async () => {
      // Parse from and to locations
      const [fromCity, fromState] = moveData.from.split(', ');
      const [toCity, toState] = moveData.to.split(', ');
      
      const response = await apiRequest("POST", "/api/moving-companies", {
        fromCity,
        fromState,
        toCity,
        toState,
        moveDate: moveData.date
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

  const utilitiesMutation = useMutation({
    mutationFn: async () => {
      const toParts = moveData.to.split(',');
      const response = await apiRequest("POST", "/api/utilities", {
        city: toParts[0]?.trim() || "Dallas",
        state: toParts[1]?.trim() || "TX",
        zipCode: toParts[2]?.trim() || "75201"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const services = data?.services || [];
      setUtilities(services);
      setSearchType('utilities');
      setShowResults(true);
      
      // Cache the results for future visits
      localStorage.setItem(`utilities_${moveData.to}`, JSON.stringify(services));
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Unable to find utility services. Please try again.",
        variant: "destructive",
      });
    },
  });

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
      return { icon: Zap, color: 'bg-yellow-600' };
    } else if (title.includes('housing') || title.includes('real estate') || title.includes('home')) {
      return { icon: Home, color: 'bg-green-600' };
    }
    return { icon: Info, color: 'bg-gray-600' };
  };

  const getTaskSteps = () => {
    const taskTitle = task.title.toLowerCase();
    if (taskTitle.includes('moving') || taskTitle.includes('mover')) {
      return [
        { title: "Get Quotes", description: "Compare pricing from multiple providers" },
        { title: "Check Reviews", description: "Verify company reputation and licensing" },
        { title: "Book Service", description: "Schedule your preferred moving date" },
        { title: "Prepare Items", description: "Pack and organize belongings" }
      ];
    }
    return [
      { title: "Research Options", description: "Compare available services" },
      { title: "Contact Providers", description: "Get pricing and availability" },
      { title: "Schedule Setup", description: "Book installation or activation" },
      { title: "Confirm Details", description: "Verify service requirements" }
    ];
  };

  const config = getTaskConfig();
  const IconComponent = config.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${selectedFont}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-lg ${config.color} text-white shadow-lg`}>
              <IconComponent className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">{task.title}</h1>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${config.color}`}>
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
                {/* Status Information */}
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
            className="border border-blue-600 hover:border-blue-700 text-blue-700 hover:text-blue-800 font-medium py-2 px-4 rounded-lg text-sm shadow-sm"
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

        {/* Main Content - Service Results (55% width) */}
        <div className="w-full max-w-[55%]">
          {showResults && (
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-md border border-blue-100 p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  {searchType === 'moving' && `Providers: ${moveData.from} → ${moveData.to}`}
                  {searchType === 'utilities' && `Services: ${moveData.to}`}
                  {searchType === 'housing' && `Housing Services for ${moveData.to}`}
                </h2>
                <div className="space-y-3">
                  {searchType === 'moving' && movingCompanies.length > 0 && 
                    movingCompanies.map((company, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all">
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
                        <p className="text-xs text-gray-700 mb-2">{company.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {company.services.slice(0, 4).map((service, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {service}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleReferralClick(company, 'website_visit')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                          >
                            Website
                          </Button>
                          <Button
                            onClick={() => window.open(`tel:${company.phone}`, '_self')}
                            variant="outline"
                            className="border-green-500 text-green-700 hover:bg-green-50 px-3 py-1 rounded text-xs font-medium"
                          >
                            Call
                          </Button>
                          <Button
                            onClick={() => handleReferralClick(company, 'quote_request')}
                            variant="outline"
                            className="border-orange-500 text-orange-700 hover:bg-orange-50 px-3 py-1 rounded text-xs font-medium"
                          >
                            Quote
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};