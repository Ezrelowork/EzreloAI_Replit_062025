import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Wifi, 
  Building, 
  Phone, 
  Star, 
  ExternalLink, 
  MapPin, 
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Globe
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UtilityProvider {
  provider: string;
  phone: string;
  website: string;
  referralUrl: string;
  affiliateCode: string;
  description: string;
  rating: number;
  services: string[];
  estimatedCost: string;
  availability: string;
  setupFee?: string;
  connectionTime?: string;
  connectionType?: string;
  maxSpeed?: string;
  notes?: string;
}

interface UtilityRequest {
  address: string;
  city: string;
  state: string;
  zip: string;
  moveDate: string;
  utilityType: string;
}

export default function Utilities() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("electricity");
  const [providers, setProviders] = useState<UtilityProvider[]>([]);
  const [userAddress, setUserAddress] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
    moveDate: ""
  });
  const [hasCompletedActions, setHasCompletedActions] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<UtilityProvider[]>([]);

  // Determine if task can be marked complete based on user actions
  const canCompleteTask = () => {
    return providers.length > 0 && (hasCompletedActions || selectedProviders.length > 0);
  };

  // Extract utility type from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const type = urlParams.get('type');
    if (type) {
      setSelectedTab(type);
    }

    // Auto-fill destination address from AI questionnaire data
    const aiToLocation = localStorage.getItem('aiToLocation');
    const aiMoveDate = localStorage.getItem('aiMoveDate');

    if (aiToLocation && aiToLocation !== 'undefined' && aiToLocation !== '') {
      console.log('Loading AI destination address:', aiToLocation);

      // Parse the destination address to extract components
      const addressParts = aiToLocation.split(',').map(part => part.trim());

      let streetAddress = '';
      let city = '';
      let state = '';
      let zip = '';

      if (addressParts.length >= 2) {
        // Last part usually contains city, state, and possibly ZIP
        const lastPart = addressParts[addressParts.length - 1];

        // Check if last part has ZIP code pattern
        const zipMatch = lastPart.match(/\b(\d{5}(-\d{4})?)\b/);
        if (zipMatch) {
          zip = zipMatch[1];
          // Remove ZIP from last part
          const withoutZip = lastPart.replace(zipMatch[0], '').trim();
          const stateCityParts = withoutZip.split(' ').filter(p => p.length > 0);

          if (stateCityParts.length >= 2) {
            state = stateCityParts[stateCityParts.length - 1];
            city = stateCityParts.slice(0, -1).join(' ');
          } else if (stateCityParts.length === 1) {
            state = stateCityParts[0];
            // Try to get city from second-to-last address part
            if (addressParts.length >= 2) {
              city = addressParts[addressParts.length - 2];
            }
          }
        } else {
          // No ZIP code, split city and state
          const stateCityParts = lastPart.split(' ').filter(p => p.length > 0);
          if (stateCityParts.length >= 2) {
            state = stateCityParts[stateCityParts.length - 1];
            city = stateCityParts.slice(0, -1).join(' ');
          } else if (stateCityParts.length === 1) {
            // Assume it's state, get city from previous part
            state = stateCityParts[0];
            if (addressParts.length >= 2) {
              city = addressParts[addressParts.length - 2];
            }
          }
        }

        // Street address is everything except the last part
        streetAddress = addressParts.slice(0, -1).join(', ');
      } else if (addressParts.length === 1) {
        // Only one part, assume it's city, state
        const parts = addressParts[0].split(' ').filter(p => p.length > 0);
        if (parts.length >= 2) {
          state = parts[parts.length - 1];
          city = parts.slice(0, -1).join(' ');
        }
      }

      setUserAddress({
        address: streetAddress,
        city: city,
        state: state,
        zip: zip,
        moveDate: aiMoveDate || ""
      });

      console.log('Parsed address:', { streetAddress, city, state, zip });
    }
  }, [location]);

  // Search for utility providers
  const providerMutation = useMutation({
    mutationFn: async (request: UtilityRequest) => {
      const response = await apiRequest("POST", "/api/utility-providers", request);
      return await response.json();
    },
    onSuccess: (data) => {
      const providerList = data?.providers || [];
      setProviders(providerList);
      toast({
        title: "Providers Found",
        description: `Found ${providerList.length} ${selectedTab} providers in your area`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search Error",
        description: "Unable to find providers. Please check your address and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!userAddress.city || !userAddress.state) {
      toast({
        title: "Missing Information",
        description: "Please enter at least city and state to search for providers.",
        variant: "destructive",
      });
      return;
    }

    providerMutation.mutate({
      ...userAddress,
      utilityType: selectedTab
    });
  };

  const handleProviderClick = async (provider: UtilityProvider) => {
    try {
      await apiRequest("POST", "/api/track-referral", {
        provider: provider.provider,
        category: `${selectedTab} providers`,
        action: "Contact Provider",
        userAddress: `${userAddress.city}, ${userAddress.state}`,
        affiliateCode: provider.affiliateCode,
        referralUrl: provider.referralUrl
      });

      window.open(provider.referralUrl, '_blank');
      setHasCompletedActions(true); // Mark progress for provider contact

      toast({
        title: "Opening Provider",
        description: `Redirecting to ${provider.provider}`,
      });
    } catch (error) {
      window.open(provider.website, '_blank');
      setHasCompletedActions(true); // Mark progress even for direct website visits
    }
  };

  const handleSelectProvider = (provider: UtilityProvider) => {
    setSelectedProviders(prev => {
      const isSelected = prev.find(p => p.provider === provider.provider);
      if (isSelected) {
        return prev.filter(p => p.provider !== provider.provider);
      } else {
        setHasCompletedActions(true); // Mark progress for provider selection
        return [...prev, provider];
      }
    });
  };

  const utilityTypes = {
    electricity: {
      title: "Electricity Providers",
      icon: Zap,
      description: "Find and compare electricity providers in your area",
      tips: ["Compare rates per kWh", "Check for green energy options", "Look for fixed vs variable rates"]
    },
    internet: {
      title: "Internet & Cable Providers",
      icon: Wifi,
      description: "Compare internet speeds and cable packages",
      tips: ["Check available speeds", "Compare bundling options", "Verify installation timelines"]
    },
    water: {
      title: "Water & Sewer Services",
      icon: Building,
      description: "Set up water and sewer utilities",
      tips: ["Contact local water authority", "Check deposit requirements", "Schedule service activation"]
    },
    waste: {
      title: "Waste Management Services",
      icon: Building,
      description: "Arrange trash and recycling pickup",
      tips: ["Check pickup schedules", "Verify recycling programs", "Compare service levels"]
    }
  };

  const currentUtility = utilityTypes[selectedTab as keyof typeof utilityTypes];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => window.history.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Journey
          </Button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <currentUtility.icon className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">{currentUtility.title}</h1>
            </div>
            <p className="text-gray-600">{currentUtility.description}</p>
          </div>
        </div>

        {/* Address Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Your New Address
            </CardTitle>
            <CardDescription>
              Enter your new address to find available utility providers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={userAddress.address}
                  onChange={(e) => setUserAddress(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={userAddress.city}
                  onChange={(e) => setUserAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Your city"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={userAddress.state}
                  onChange={(e) => setUserAddress(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="TX"
                  required
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={userAddress.zip}
                  onChange={(e) => setUserAddress(prev => ({ ...prev, zip: e.target.value }))}
                  placeholder="12345"
                />
              </div>
              <div>
                <Label htmlFor="moveDate">Move Date</Label>
                <Input
                  id="moveDate"
                  type="date"
                  value={userAddress.moveDate}
                  onChange={(e) => setUserAddress(prev => ({ ...prev, moveDate: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={providerMutation.isPending || !userAddress.city || !userAddress.state}
                  className="w-full"
                >
                  {providerMutation.isPending ? "Searching..." : "Find Providers"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Utility Type Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="electricity" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Electricity
            </TabsTrigger>
            <TabsTrigger value="internet" className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Internet
            </TabsTrigger>
            <TabsTrigger value="water" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Water
            </TabsTrigger>
            <TabsTrigger value="waste" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Waste
            </TabsTrigger>
          </TabsList>

          {/* Tips Section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Tips for {currentUtility.title}</h3>
            <ul className="space-y-1">
              {currentUtility.tips.map((tip, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-blue-800">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </Tabs>

        {/* Providers Results */}
        {providers.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Available {currentUtility.title}
              </h2>
              <Badge variant="outline" className="text-sm">
                {providers.length} providers found
              </Badge>
            </div>

            <div className="grid gap-4">
              {providers.map((provider, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {provider.provider}
                          {provider.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-normal text-gray-600">
                                {provider.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {provider.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-4">
                        {provider.estimatedCost}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Service Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Availability:</span>
                          <p className="text-gray-600 font-semibold">{provider.availability}</p>
                        </div>
                        {provider.connectionType && (
                          <div>
                            <span className="font-medium text-gray-700">Connection:</span>
                            <p className="text-gray-600">{provider.connectionType}</p>
                          </div>
                        )}
                        {provider.maxSpeed && (
                          <div>
                            <span className="font-medium text-gray-700">Max Speed:</span>
                            <p className="text-gray-600">{provider.maxSpeed}</p>
                          </div>
                        )}
                        {provider.setupFee && (
                          <div>
                            <span className="font-medium text-gray-700">Setup Fee:</span>
                            <p className="text-gray-600">{provider.setupFee}</p>
                          </div>
                        )}
                        {provider.connectionTime && (
                          <div>
                            <span className="font-medium text-gray-700">Activation:</span>
                            <p className="text-gray-600">{provider.connectionTime}</p>
                          </div>
                        )}
                      </div>

                      {/* Special Notes */}
                      {provider.notes && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> {provider.notes}
                          </p>
                        </div>
                      )}

                      {/* Services */}
                      {provider.services && provider.services.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                          <div className="flex flex-wrap gap-1">
                            {provider.services.slice(0, 4).map((service, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                            {provider.services.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{provider.services.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            {provider.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <span>{provider.phone}</span>
                              </div>
                            )}
                          </div>
                          {provider.website && provider.website !== `https://www.google.com/search?q=${encodeURIComponent(provider.provider)}` && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-4 h-4" />
                              <a 
                                href={provider.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {provider.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {provider.phone && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                window.open(`tel:${provider.phone}`, '_self');
                                setHasCompletedActions(true); // Mark progress for phone calls
                              }}
                            >
                              Call Now
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            onClick={() => handleProviderClick(provider)}
                            className="flex items-center gap-1"
                          >
                            Get Service
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {providers.length === 0 && !providerMutation.isPending && userAddress.city && userAddress.state && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any {selectedTab} providers for your area. 
              Try adjusting your search or check back later.
            </p>
            <Button variant="outline" onClick={handleSearch}>
              Search Again
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
                    title: "Utilities Task Completed!",
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
              {canCompleteTask() ? "Complete Utilities Setup" : "Research Providers First"}
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