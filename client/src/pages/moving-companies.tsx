
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Truck,
  Star,
  ExternalLink,
  Phone,
  Globe,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  Building2
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [movingCompanies, setMovingCompanies] = useState<MovingCompany[]>([]);
  const [selectedMover, setSelectedMover] = useState<MovingCompany | null>(null);
  const [quotesRequested, setQuotesRequested] = useState<Set<string>>(new Set());
  const [hasCompletedActions, setHasCompletedActions] = useState(false);
  const [moveAddresses, setMoveAddresses] = useState<MoveAddresses>(() => {
    // Load from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from') || localStorage.getItem('aiFromLocation') || '';
    const toParam = urlParams.get('to') || localStorage.getItem('aiToLocation') || '';
    const dateParam = urlParams.get('date') || localStorage.getItem('aiMoveDate') || '';
    
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

  // Determine if task can be marked complete based on user actions
  const canCompleteTask = () => {
    return movingCompanies.length > 0 && (hasCompletedActions || selectedMover || quotesRequested.size > 0);
  };

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
      setHasCompletedActions(true); // Mark search as completed action
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

  const handleSearch = () => {
    if (!moveAddresses.currentCity || !moveAddresses.newCity) {
      toast({
        title: "Missing Information",
        description: "Please enter both current and destination cities to search for moving companies.",
        variant: "destructive",
      });
      return;
    }

    movingCompanyMutation.mutate(moveAddresses);
  };

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
      setHasCompletedActions(true);
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

  // Auto-trigger search on component mount if addresses are available
  useEffect(() => {
    if (moveAddresses.currentCity && moveAddresses.newCity && movingCompanies.length === 0) {
      movingCompanyMutation.mutate(moveAddresses);
    }
  }, [moveAddresses.currentCity, moveAddresses.newCity]);

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
                <h1 className="text-2xl font-bold text-gray-900">Moving Companies</h1>
                <p className="text-gray-600">Find professional movers for your relocation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Move Details Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Your Move Details
            </CardTitle>
            <CardDescription>
              Enter your move information to find qualified moving companies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Address */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Current Location</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="currentAddress">Street Address</Label>
                    <Input
                      id="currentAddress"
                      value={moveAddresses.currentAddress}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, currentAddress: e.target.value }))}
                      placeholder="123 Current Street"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="currentCity">City *</Label>
                      <Input
                        id="currentCity"
                        value={moveAddresses.currentCity}
                        onChange={(e) => setMoveAddresses(prev => ({ ...prev, currentCity: e.target.value }))}
                        placeholder="Current City"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="currentState">State *</Label>
                      <Input
                        id="currentState"
                        value={moveAddresses.currentState}
                        onChange={(e) => setMoveAddresses(prev => ({ ...prev, currentState: e.target.value }))}
                        placeholder="TX"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="currentZip">ZIP Code</Label>
                    <Input
                      id="currentZip"
                      value={moveAddresses.currentZip}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, currentZip: e.target.value }))}
                      placeholder="12345"
                    />
                  </div>
                </div>
              </div>

              {/* New Address */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Destination</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="newAddress">Street Address</Label>
                    <Input
                      id="newAddress"
                      value={moveAddresses.newAddress}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, newAddress: e.target.value }))}
                      placeholder="456 New Street"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="newCity">City *</Label>
                      <Input
                        id="newCity"
                        value={moveAddresses.newCity}
                        onChange={(e) => setMoveAddresses(prev => ({ ...prev, newCity: e.target.value }))}
                        placeholder="New City"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newState">State *</Label>
                      <Input
                        id="newState"
                        value={moveAddresses.newState}
                        onChange={(e) => setMoveAddresses(prev => ({ ...prev, newState: e.target.value }))}
                        placeholder="CA"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newZip">ZIP Code</Label>
                    <Input
                      id="newZip"
                      value={moveAddresses.newZip}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, newZip: e.target.value }))}
                      placeholder="54321"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="moveDate">Move Date</Label>
                <Input
                  id="moveDate"
                  type="date"
                  value={moveAddresses.moveDate}
                  onChange={(e) => setMoveAddresses(prev => ({ ...prev, moveDate: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={movingCompanyMutation.isPending || !moveAddresses.currentCity || !moveAddresses.newCity}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {movingCompanyMutation.isPending ? "Searching..." : "Find Moving Companies"}
                </Button>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">We'll help you find:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Licensed & Insured Movers</Badge>
                <Badge variant="outline">Long Distance Specialists</Badge>
                <Badge variant="outline">Local Moving Companies</Badge>
                <Badge variant="outline">Full Service Movers</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {movingCompanyMutation.isPending && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Finding qualified moving companies for your route...</p>
          </div>
        )}

        {/* Results */}
        {movingCompanies.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Found {movingCompanies.length} Moving Companies
              </h2>
              <Badge variant="outline" className="text-sm">
                {moveAddresses.currentCity}, {moveAddresses.currentState} → {moveAddresses.newCity}, {moveAddresses.newState}
              </Badge>
            </div>

            <div className="grid gap-6">
              {movingCompanies.map((company, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{company.provider}</h3>
                            <Badge variant="outline">{company.category}</Badge>
                          </div>
                          {company.rating > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{company.rating.toFixed(1)}</span>
                            </div>
                          )}
                          <p className="text-gray-600 mb-3">{company.description}</p>
                          
                          {company.licenseInfo && (
                            <div className="flex items-center gap-1 mb-2 text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>{company.licenseInfo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600 mb-1">
                          {company.estimatedCost}
                        </div>
                        {company.availability && (
                          <div className="text-sm text-gray-500">
                            {company.availability}
                          </div>
                        )}
                        {company.estimatedTimeframe && (
                          <div className="text-sm text-gray-500">
                            {company.estimatedTimeframe}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Services */}
                    {company.services && company.services.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
                        <div className="flex flex-wrap gap-1">
                          {company.services.slice(0, 4).map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {company.services.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{company.services.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Insurance Options */}
                    {company.insuranceOptions && company.insuranceOptions.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Insurance Options:</h4>
                        <div className="flex flex-wrap gap-1">
                          {company.insuranceOptions.slice(0, 3).map((insurance, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {insurance}
                            </Badge>
                          ))}
                          {company.insuranceOptions.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{company.insuranceOptions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Special Notes */}
                    {company.notes && (
                      <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> {company.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-col gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          {company.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{company.phone}</span>
                            </div>
                          )}
                          {company.hours && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{company.hours}</span>
                            </div>
                          )}
                        </div>
                        {company.website && company.website !== `https://www.google.com/search?q=${encodeURIComponent(company.provider)}` && (
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            <a 
                              href={company.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                              onClick={() => setHasCompletedActions(true)}
                            >
                              {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {company.phone && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              window.open(`tel:${company.phone}`, '_self');
                              setHasCompletedActions(true);
                            }}
                          >
                            Call Now
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          onClick={() => handleReferralClick(company, "Get Quote")}
                          variant={quotesRequested.has(company.provider) ? "secondary" : "default"}
                        >
                          {quotesRequested.has(company.provider) ? "Quote Requested" : "Get Quote"}
                        </Button>
                        <Button 
                          onClick={() => handleSelectMover(company)}
                          variant={selectedMover?.provider === company.provider ? "default" : "outline"}
                          className={selectedMover?.provider === company.provider ? "bg-green-600 hover:bg-green-700" : ""}
                          size="sm"
                        >
                          {selectedMover?.provider === company.provider ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!movingCompanyMutation.isPending && movingCompanies.length === 0 && moveAddresses.currentCity && moveAddresses.newCity && (
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Moving Companies Found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find moving companies for your specific route. Try adjusting your search or contact us for assistance.
              </p>
              <Button onClick={handleSearch}>
                Search Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Address State */}
        {!moveAddresses.currentCity && !moveAddresses.newCity && (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to Find Your Moving Company?</h2>
            <p className="text-gray-600 mb-6">
              Enter your move details above to find qualified, licensed moving companies for your relocation.
            </p>
            <Button 
              onClick={() => document.getElementById('currentCity')?.focus()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started
            </Button>
          </div>
        )}

        {/* Task Completion Bar */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-lg shadow-lg border p-4 flex items-center gap-4">
            <Button
              onClick={() => {
                if (canCompleteTask()) {
                  toast({
                    title: "Moving Company Task Completed!",
                    description: "Returning to your moving journey...",
                  });
                  
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
              {canCompleteTask() ? "Complete Moving Company Search" : "Find & Contact Movers First"}
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
              className="border-blue-300 text-blue-700 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg text-sm shadow-sm transition-all"
            >
              Return to Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
