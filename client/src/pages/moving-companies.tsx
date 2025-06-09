import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Truck,
  Star,
  ExternalLink,
  Phone,
  Globe,
  MapPin,
  Clock,
  DollarSign
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

interface MoveAddresses {
  currentAddress: string;
  currentCity: string;
  currentState: string;
  currentZip: string;
  newAddress: string;
  newCity: string;
  newState: string;
  newZip: string;
  moveDate: string;
}

export default function MovingCompanies() {
  const { toast } = useToast();
  const [movingCompanies, setMovingCompanies] = useState<MovingCompany[]>([]);
  const [selectedMover, setSelectedMover] = useState<MovingCompany | null>(null);
  const [quotesRequested, setQuotesRequested] = useState<Set<string>>(new Set());
  const [hasCompletedActions, setHasCompletedActions] = useState(false);
  const [moveAddresses, setMoveAddresses] = useState<MoveAddresses>(() => {
    // Get addresses from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    const toParam = urlParams.get('to');
    const dateParam = urlParams.get('date');
    
    if (fromParam && toParam) {
      const parseAddress = (address: string) => {
        const parts = address.split(',').map(part => part.trim());
        if (parts.length >= 3) {
          const street = parts[0] || '';
          const city = parts[1] || '';
          const stateZip = parts[2] || '';
          const stateZipParts = stateZip.split(' ');
          const state = stateZipParts[0] || '';
          const zip = stateZipParts[1] || '';
          return { street, city, state, zip };
        }
        return { street: address, city: '', state: '', zip: '' };
      };
      
      const fromParsed = parseAddress(fromParam);
      const toParsed = parseAddress(toParam);
      
      return {
        currentAddress: fromParsed.street,
        currentCity: fromParsed.city,
        currentState: fromParsed.state,
        currentZip: fromParsed.zip,
        newAddress: toParsed.street,
        newCity: toParsed.city,
        newState: toParsed.state,
        newZip: toParsed.zip,
        moveDate: dateParam || ""
      };
    }
    
    return {
      currentAddress: "",
      currentCity: "",
      currentState: "",
      currentZip: "",
      newAddress: "",
      newCity: "",
      newState: "",
      newZip: "",
      moveDate: ""
    };
  });

  // Moving company search mutation
  const movingCompanyMutation = useMutation({
    mutationFn: async (addresses: MoveAddresses) => {
      const response = await apiRequest("POST", "/api/moving-companies", {
        fromAddress: addresses.currentAddress,
        fromCity: addresses.currentCity,
        fromState: addresses.currentState,
        fromZip: addresses.currentZip,
        toCity: addresses.newCity,
        toState: addresses.newState,
        toZip: addresses.newZip
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const companies = data?.companies || [];
      setMovingCompanies(companies);
      toast({
        title: "Moving Companies Found",
        description: `Found ${companies.length} qualified moving companies for your route`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search Error",
        description: "Unable to find moving companies. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReferralClick = async (company: MovingCompany, action: string) => {
    try {
      await apiRequest("POST", "/api/track-referral", {
        provider: company.provider,
        category: "Moving Companies",
        action: action,
        userAddress: `${moveAddresses.currentCity}, ${moveAddresses.currentState}`,
        affiliateCode: company.affiliateCode,
        referralUrl: company.referralUrl
      });

      if (action === "Get Quote") {
        setQuotesRequested(prev => {
          const newSet = new Set(prev);
          newSet.add(company.provider);
          return newSet;
        });
        setHasCompletedActions(true);
      }

      window.open(company.referralUrl, '_blank');
      
      toast({
        title: "Opening Provider",
        description: `Redirecting to ${company.provider}`,
      });
    } catch (error) {
      window.open(company.website, '_blank');
    }
  };

  const handleSelectMover = async (company: MovingCompany) => {
    setSelectedMover(company);
    setHasCompletedActions(true);
    
    toast({
      title: "Mover Selected",
      description: `You've selected ${company.provider} as your moving company`,
    });

    // Save selection to project if available
    try {
      await apiRequest("POST", "/api/select-mover", {
        provider: company.provider,
        category: company.category,
        phone: company.phone,
        estimatedCost: company.estimatedCost,
        moveRoute: `${moveAddresses.currentCity}, ${moveAddresses.currentState} to ${moveAddresses.newCity}, ${moveAddresses.newState}`
      });
    } catch (error) {
      console.error("Error saving mover selection:", error);
    }
  };

  const canCompleteTask = () => {
    return hasCompletedActions && (selectedMover || quotesRequested.size > 0);
  };

  // Auto-trigger search on component mount if addresses are available
  useEffect(() => {
    if (moveAddresses.currentCity && moveAddresses.newCity && movingCompanies.length === 0) {
      movingCompanyMutation.mutate(moveAddresses);
    }
  }, [moveAddresses.currentCity, moveAddresses.newCity]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
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
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Journey
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Find Moving Companies</h1>
                <p className="text-sm text-gray-600">Professional movers for your relocation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Move Details */}
        {(moveAddresses.currentCity || moveAddresses.newCity) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Your Move Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">From</div>
                  <div className="text-lg font-semibold">
                    {moveAddresses.currentCity}, {moveAddresses.currentState}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">To</div>
                  <div className="text-lg font-semibold">
                    {moveAddresses.newCity}, {moveAddresses.newState}
                  </div>
                </div>
                {moveAddresses.moveDate && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Move Date</div>
                    <div className="text-lg font-semibold">{moveAddresses.moveDate}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Status */}
        {movingCompanyMutation.isPending && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Searching for Moving Companies</h3>
              <p className="text-gray-600">Finding qualified movers for your route...</p>
            </CardContent>
          </Card>
        )}

        {/* Moving Companies Results */}
        {movingCompanies.length > 0 && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {movingCompanies.length} Moving Companies Found
              </h2>
              <p className="text-gray-600">
                Professional movers serving your route from {moveAddresses.currentCity} to {moveAddresses.newCity}
              </p>
            </div>

            <div className="grid gap-6">
              {movingCompanies.map((company, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Truck className="w-5 h-5 text-blue-600" />
                          {company.provider}
                        </CardTitle>
                        <CardDescription className="mt-1">{company.description}</CardDescription>
                        <Badge variant="outline" className="mt-2">{company.category}</Badge>
                      </div>
                      {company.rating > 0 && (
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{company.rating}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{company.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{company.hours}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>{company.estimatedCost}</span>
                      </div>
                      {company.availability && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{company.availability}</span>
                        </div>
                      )}
                    </div>

                    {company.services.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Services</div>
                        <div className="flex flex-wrap gap-2">
                          {company.services.slice(0, 4).map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{service}</Badge>
                          ))}
                          {company.services.length > 4 && (
                            <Badge variant="secondary" className="text-xs">+{company.services.length - 4} more</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {company.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">{company.notes}</div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleReferralClick(company, "Get Quote")}
                        className="flex-1"
                        variant={quotesRequested.has(company.provider) ? "secondary" : "default"}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {quotesRequested.has(company.provider) ? "Quote Requested" : "Get Quote"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleReferralClick(company, "Visit Website")}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Website
                      </Button>
                      <Button 
                        onClick={() => handleSelectMover(company)}
                        variant={selectedMover?.provider === company.provider ? "default" : "outline"}
                        className={selectedMover?.provider === company.provider ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {selectedMover?.provider === company.provider ? "Selected" : "Select Mover"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {!movingCompanyMutation.isPending && movingCompanies.length === 0 && moveAddresses.currentCity && (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Moving Companies Found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find moving companies for your specific route. Try searching for a broader area or contact us for assistance.
              </p>
              <Button onClick={() => movingCompanyMutation.mutate(moveAddresses)}>
                Search Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        {!moveAddresses.currentCity && (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Find Moving Companies?</h3>
              <p className="text-gray-600 mb-4">
                Start by setting up your move details through our AI assistant to get personalized moving company recommendations.
              </p>
              <Link href="/ai-assistant">
                <Button>
                  Start with AI Assistant
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Task Completion Bar */}
        {movingCompanies.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white rounded-lg shadow-lg border p-4 flex items-center gap-4">
              <Button
                onClick={() => {
                  if (canCompleteTask()) {
                    toast({
                      title: "Moving Company Search Complete",
                      description: selectedMover 
                        ? "Moving company selected and ready to proceed" 
                        : "Moving quotes requested from selected companies",
                    });
                  }
                }}
                disabled={!canCompleteTask()}
                className={`font-medium py-2 px-6 rounded-lg text-sm shadow-sm transition-all ${
                  canCompleteTask() 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Truck className="w-4 h-4 mr-2" />
                {canCompleteTask() ? "Complete Moving Company Search" : "Request Quotes or Select Mover First"}
              </Button>
              

            </div>
          </div>
        )}
      </div>
    </div>
  );
}