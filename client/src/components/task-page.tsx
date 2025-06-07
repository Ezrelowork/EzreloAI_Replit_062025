import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const [selectedFont, setSelectedFont] = useState('font-inter');
  const [selectedMover, setSelectedMover] = useState<MovingCompany | null>(null);
  const [movingProject, setMovingProject] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create or get moving project
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await apiRequest("POST", "/api/moving-project", projectData);
      return response.json();
    },
    onSuccess: (data: any) => {
      setMovingProject(data.project);
    }
  });

  // Select mover mutation
  const selectMoverMutation = useMutation({
    mutationFn: async ({ projectId, moverData }: { projectId: number; moverData: MovingCompany }) => {
      const response = await apiRequest("POST", "/api/select-mover", { projectId, moverData });
      return response.json();
    },
    onSuccess: (data: any) => {
      setSelectedMover(data.project.selectedMover);
      setMovingProject(data.project);
      toast({
        title: "Mover Selected Successfully",
        description: `${data.project.selectedMover.provider} is now your chosen moving company. Your project has been created.`,
      });
    }
  });

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

  const handleSelectMover = async (company: MovingCompany) => {
    try {
      // First, create or get the moving project
      if (!movingProject) {
        const projectData = {
          userId: 1, // For now, using a default user ID - in real app would get from auth
          fromAddress: moveData.from,
          toAddress: moveData.to,
          moveDate: moveData.date
        };
        await createProjectMutation.mutateAsync(projectData);
      }

      // Then select the mover
      if (movingProject?.id) {
        await selectMoverMutation.mutateAsync({
          projectId: movingProject.id,
          moverData: company
        });
      }
    } catch (error) {
      toast({
        title: "Selection Failed",
        description: "Unable to select mover. Please try again.",
        variant: "destructive",
      });
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

        {/* Main Content Layout */}
        <div className="flex gap-6">
          {/* Service Results (55% width) */}
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
                          <h3 className="text-base font-bold text-gray-900">{company.provider}</h3>
                          {company.estimatedCost && !company.estimatedCost.includes('Contact for') && (
                            <span className="text-base font-bold text-green-600">{company.estimatedCost}</span>
                          )}
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
                            <span className="text-sm text-gray-600">({company.rating})</span>
                          </div>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">{company.phone}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{company.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {company.services.slice(0, 4).map((service, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
                                {service}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleReferralClick(company, 'website_visit')}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                            >
                              Website
                            </button>
                            <button
                              onClick={() => window.open(`tel:${company.phone}`, '_self')}
                              className="text-green-600 hover:text-green-700 text-sm font-medium underline"
                            >
                              Call
                            </button>
                            <button
                              onClick={() => handleSelectMover(company)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                            >
                              Choose This Mover
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Moving Organization Sidebar */}
          <div className="w-full max-w-[40%]">
            <div className="space-y-4">
              
              {/* Pro Tips - Moved to top */}
              <div className="bg-white rounded-lg shadow-md border p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  Pro Tips
                </h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm font-medium text-blue-900">Best Booking Time</div>
                    <div className="text-xs text-blue-700">Book 8+ weeks ahead for summer moves, 4+ weeks for off-season</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="text-sm font-medium text-yellow-900">Save Money</div>
                    <div className="text-xs text-yellow-700">Move mid-month, mid-week, and avoid summer peak season</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-sm font-medium text-green-900">Red Flags</div>
                    <div className="text-xs text-green-700">Avoid companies requiring large deposits or door-to-door sales</div>
                  </div>
                </div>
              </div>

              {/* Moving Checklist */}
              <div className="bg-white rounded-lg shadow-md border p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  Quick Checklist
                </h3>
                <div className="space-y-2">
                  {[
                    'Get 3+ written estimates',
                    'Check insurance coverage',
                    'Read reviews & references', 
                    'Verify license & bonding',
                    'Understand pricing structure',
                    'Confirm moving date'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moving Costs */}
              <div className="bg-white rounded-lg shadow-md border p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  Estimated Costs
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Local Move (same city)</span>
                    <span className="font-medium">$800-1,500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Long Distance (interstate)</span>
                    <span className="font-medium">$2,500-5,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Packing Services</span>
                    <span className="font-medium">$500-1,200</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Storage (per month)</span>
                    <span className="font-medium">$50-200</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-gray-900">Total Range</span>
                      <span className="text-green-600">$1,350-6,700</span>
                    </div>
                  </div>
                </div>
              </div>



            </div>
          </div>
        </div>
      </div>
    </div>
  );
};