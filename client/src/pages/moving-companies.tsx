
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  Phone, 
  Star, 
  ExternalLink, 
  MapPin, 
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Globe,
  DollarSign,
  Users,
  Package
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

interface MovingRequest {
  fromAddress: string;
  fromCity: string;
  fromState: string;
  fromZip: string;
  toCity: string;
  toState: string;
  toZip: string;
  moveDate: string;
}

export default function MovingCompanies() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("local");
  const [companies, setCompanies] = useState<MovingCompany[]>([]);
  const [moveDetails, setMoveDetails] = useState({
    fromAddress: "",
    fromCity: "",
    fromState: "",
    fromZip: "",
    toAddress: "",
    toCity: "",
    toState: "",
    toZip: "",
    moveDate: ""
  });
  const [hasCompletedActions, setHasCompletedActions] = useState(false);
  const [quotesRequested, setQuotesRequested] = useState<Set<string>>(new Set());

  // Load move data from localStorage on component mount
  useEffect(() => {
    const aiFromLocation = localStorage.getItem('aiFromLocation');
    const aiToLocation = localStorage.getItem('aiToLocation');
    const aiMoveDate = localStorage.getItem('aiMoveDate');

    if (aiFromLocation && aiFromLocation !== 'undefined') {
      const fromParts = aiFromLocation.split(',').map(part => part.trim());
      if (fromParts.length >= 2) {
        const lastPart = fromParts[fromParts.length - 1];
        const zipMatch = lastPart.match(/\b(\d{5}(-\d{4})?)\b/);
        
        let state = '';
        let city = '';
        let zip = '';
        
        if (zipMatch) {
          zip = zipMatch[1];
          const withoutZip = lastPart.replace(zipMatch[0], '').trim();
          const stateCityParts = withoutZip.split(' ').filter(p => p.length > 0);
          
          if (stateCityParts.length >= 2) {
            state = stateCityParts[stateCityParts.length - 1];
            city = stateCityParts.slice(0, -1).join(' ');
          }
        } else {
          const stateCityParts = lastPart.split(' ').filter(p => p.length > 0);
          if (stateCityParts.length >= 2) {
            state = stateCityParts[stateCityParts.length - 1];
            city = stateCityParts.slice(0, -1).join(' ');
          }
        }

        setMoveDetails(prev => ({
          ...prev,
          fromAddress: aiFromLocation,
          fromCity: city,
          fromState: state,
          fromZip: zip
        }));
      }
    }

    if (aiToLocation && aiToLocation !== 'undefined') {
      const toParts = aiToLocation.split(',').map(part => part.trim());
      if (toParts.length >= 2) {
        const lastPart = toParts[toParts.length - 1];
        const zipMatch = lastPart.match(/\b(\d{5}(-\d{4})?)\b/);
        
        let state = '';
        let city = '';
        let zip = '';
        
        if (zipMatch) {
          zip = zipMatch[1];
          const withoutZip = lastPart.replace(zipMatch[0], '').trim();
          const stateCityParts = withoutZip.split(' ').filter(p => p.length > 0);
          
          if (stateCityParts.length >= 2) {
            state = stateCityParts[stateCityParts.length - 1];
            city = stateCityParts.slice(0, -1).join(' ');
          }
        } else {
          const stateCityParts = lastPart.split(' ').filter(p => p.length > 0);
          if (stateCityParts.length >= 2) {
            state = stateCityParts[stateCityParts.length - 1];
            city = stateCityParts.slice(0, -1).join(' ');
          }
        }

        setMoveDetails(prev => ({
          ...prev,
          toAddress: aiToLocation,
          toCity: city,
          toState: state,
          toZip: zip,
          moveDate: aiMoveDate || ""
        }));
      }
    }
  }, []);

  // Search for moving companies
  const searchMutation = useMutation({
    mutationFn: async (request: MovingRequest) => {
      const response = await apiRequest("POST", "/api/moving-companies", request);
      return await response.json();
    },
    onSuccess: (data) => {
      const companyList = data?.companies || [];
      setCompanies(companyList);
      toast({
        title: "Moving Companies Found",
        description: `Found ${companyList.length} qualified movers for your route`,
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
    if (!moveDetails.fromCity || !moveDetails.toCity) {
      toast({
        title: "Missing Information",
        description: "Please enter at least from and to cities to search for movers.",
        variant: "destructive",
      });
      return;
    }

    searchMutation.mutate(moveDetails);
  };

  const handleCompanyClick = async (company: MovingCompany, action: string) => {
    try {
      await apiRequest("POST", "/api/track-referral", {
        provider: company.provider,
        category: "Moving Companies",
        action: action,
        userAddress: `${moveDetails.fromCity}, ${moveDetails.fromState}`,
        affiliateCode: company.affiliateCode,
        referralUrl: company.referralUrl
      });

      if (action === "Get Quote") {
        setQuotesRequested(prev => new Set(prev).add(company.provider));
        setHasCompletedActions(true);
      }

      window.open(company.referralUrl, '_blank');
      setHasCompletedActions(true);

      toast({
        title: "Opening Provider",
        description: `Redirecting to ${company.provider}`,
      });
    } catch (error) {
      window.open(company.website, '_blank');
      setHasCompletedActions(true);
    }
  };

  const canCompleteTask = () => {
    return companies.length > 0 && (hasCompletedActions || quotesRequested.size > 0);
  };

  const movingTypes = {
    local: {
      title: "Local Movers",
      description: "Professional movers for local and short-distance moves",
      tips: ["Check local licensing", "Verify insurance coverage", "Get binding estimates"]
    },
    longDistance: {
      title: "Long-Distance Movers",
      description: "Interstate and cross-country moving specialists",
      tips: ["Verify DOT registration", "Check Better Business Bureau ratings", "Understand pricing structure"]
    },
    specialty: {
      title: "Specialty Movers",
      description: "Piano, antique, and fragile item specialists",
      tips: ["Verify specialty certifications", "Check handling procedures", "Review insurance options"]
    }
  };

  const currentType = movingTypes[selectedTab as keyof typeof movingTypes];

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
              <Truck className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Find Moving Companies</h1>
            </div>
            <p className="text-gray-600">Professional movers for your relocation</p>
          </div>
        </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Current Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromCity">City *</Label>
                    <Input
                      id="fromCity"
                      value={moveDetails.fromCity}
                      onChange={(e) => setMoveDetails(prev => ({ ...prev, fromCity: e.target.value }))}
                      placeholder="Current city"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromState">State *</Label>
                    <Input
                      id="fromState"
                      value={moveDetails.fromState}
                      onChange={(e) => setMoveDetails(prev => ({ ...prev, fromState: e.target.value }))}
                      placeholder="TX"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Destination</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="toCity">City *</Label>
                    <Input
                      id="toCity"
                      value={moveDetails.toCity}
                      onChange={(e) => setMoveDetails(prev => ({ ...prev, toCity: e.target.value }))}
                      placeholder="Destination city"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="toState">State *</Label>
                    <Input
                      id="toState"
                      value={moveDetails.toState}
                      onChange={(e) => setMoveDetails(prev => ({ ...prev, toState: e.target.value }))}
                      placeholder="CA"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="moveDate">Move Date</Label>
                <Input
                  id="moveDate"
                  type="date"
                  value={moveDetails.moveDate}
                  onChange={(e) => setMoveDetails(prev => ({ ...prev, moveDate: e.target.value }))}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={searchMutation.isPending || !moveDetails.fromCity || !moveDetails.toCity}
                className="px-8"
              >
                {searchMutation.isPending ? "Searching..." : "Find Movers"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Moving Type Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="local">Local Movers</TabsTrigger>
            <TabsTrigger value="longDistance">Long Distance</TabsTrigger>
            <TabsTrigger value="specialty">Specialty</TabsTrigger>
          </TabsList>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Tips for {currentType.title}</h3>
            <ul className="space-y-1">
              {currentType.tips.map((tip, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-blue-800">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </Tabs>

        {/* Companies Results */}
        {companies.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Available Moving Companies
              </h2>
              <Badge variant="outline" className="text-sm">
                {companies.length} companies found
              </Badge>
            </div>

            <div className="grid gap-4">
              {companies.map((company, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Truck className="w-5 h-5 text-blue-600" />
                          {company.provider}
                          {company.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-normal text-gray-600">
                                {company.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {company.description}
                        </CardDescription>
                        <Badge variant="outline" className="mt-2">{company.category}</Badge>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          {company.estimatedCost}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Company Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{company.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{company.hours}</span>
                        </div>
                        {company.availability && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{company.availability}</span>
                          </div>
                        )}
                      </div>

                      {/* Services */}
                      {company.services && company.services.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                          <div className="flex flex-wrap gap-2">
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

                      {/* Special Notes */}
                      {company.notes && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> {company.notes}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <Button 
                          onClick={() => handleCompanyClick(company, "Get Quote")}
                          className="flex-1"
                          variant={quotesRequested.has(company.provider) ? "secondary" : "default"}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {quotesRequested.has(company.provider) ? "Quote Requested" : "Get Quote"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleCompanyClick(company, "Visit Website")}
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Website
                        </Button>
                        {company.phone && (
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              window.open(`tel:${company.phone}`, '_self');
                              setHasCompletedActions(true);
                            }}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {companies.length === 0 && !searchMutation.isPending && moveDetails.fromCity && moveDetails.toCity && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No moving companies found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any moving companies for your route. 
              Try adjusting your search or check back later.
            </p>
            <Button variant="outline" onClick={handleSearch}>
              Search Again
            </Button>
          </div>
        )}

        {/* Call to Action */}
        {!moveDetails.fromCity && !moveDetails.toCity && (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Find Moving Companies?</h3>
              <p className="text-gray-600 mb-4">
                Start by setting up your move details through our AI assistant to get personalized moving company recommendations.
              </p>
              <Button onClick={() => window.location.href = '/ai-assistant'}>
                Start with AI Assistant
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Task Completion Bar */}
        {companies.length > 0 && (
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
                      window.location.href = '/moving-journey';
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
                {canCompleteTask() ? "Complete Moving Company Search" : "Request Quotes First"}
              </Button>
              
              <Button
                onClick={() => window.location.href = '/moving-journey'}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg text-sm shadow-sm transition-all"
              >
                Return to Journey
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
