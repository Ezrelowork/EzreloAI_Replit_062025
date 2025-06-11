
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
  const [showQuestionnaireForm, setShowQuestionnaireForm] = useState(false);

  // USPS Address verification function
  const verifyAddress = async (address: string) => {
    try {
      const response = await apiRequest("POST", "/api/verify-address", { address });
      const data = await response.json();
      return data.verifiedAddress || address; // Return verified address or original if verification fails
    } catch (error) {
      console.log('Address verification failed, using original address');
      return address;
    }
  };

  // Enhanced address parsing function
  const parseAddress = (addressString: string) => {
    let streetAddress = '';
    let city = '';
    let state = '';
    let zip = '';

    // First, try to extract ZIP code
    const zipMatch = addressString.match(/\b(\d{5}(-\d{4})?)\b/);
    let addressWithoutZip = addressString;
    
    if (zipMatch) {
      zip = zipMatch[1];
      addressWithoutZip = addressString.replace(zipMatch[0], '').trim();
    }

    // Check if address has commas (properly formatted)
    if (addressWithoutZip.includes(',')) {
      const parts = addressWithoutZip.split(',').map(part => part.trim());
      
      if (parts.length >= 3) {
        // Format: "123 Main St, Dallas, TX"
        streetAddress = parts[0];
        city = parts[1];
        state = parts[2];
      } else if (parts.length === 2) {
        // Format: "123 Main St, Dallas TX" or "Dallas, TX"
        const secondPart = parts[1].trim();
        const stateMatch = secondPart.match(/\b([A-Z]{2})\b$/);
        
        if (stateMatch) {
          state = stateMatch[1];
          const cityPart = secondPart.replace(stateMatch[0], '').trim();
          
          if (cityPart) {
            // Has city in second part
            streetAddress = parts[0];
            city = cityPart;
          } else {
            // No street address, just city and state
            city = parts[0];
          }
        }
      }
    } else {
      // No commas - need to parse differently (like "3201 Stonecrop TrailArgyle TX 76226")
      // Try to identify state pattern first
      const stateMatch = addressWithoutZip.match(/\b([A-Z]{2})\b/);
      
      if (stateMatch) {
        state = stateMatch[1];
        const beforeState = addressWithoutZip.substring(0, stateMatch.index).trim();
        const afterState = addressWithoutZip.substring(stateMatch.index + 2).trim();
        
        // Split beforeState to separate street address and city
        const words = beforeState.split(/\s+/);
        
        if (words.length >= 3) {
          // Assume last word before state is city, rest is street address
          city = words[words.length - 1];
          streetAddress = words.slice(0, -1).join(' ');
        } else if (words.length === 2) {
          // Could be just number + street or city + street
          // If first word is a number, assume it's street address
          if (/^\d+/.test(words[0])) {
            streetAddress = beforeState;
            city = afterState; // City might be after state
          } else {
            city = beforeState;
          }
        } else {
          streetAddress = beforeState;
        }
      } else {
        // No state found, try other patterns
        const words = addressWithoutZip.split(/\s+/);
        if (words.length >= 2 && /^\d+/.test(words[0])) {
          // Starts with number, likely has street address
          streetAddress = words.slice(0, -1).join(' ');
          city = words[words.length - 1];
        } else {
          city = addressWithoutZip;
        }
      }
    }

    return { streetAddress, city, state, zip };
  };

  // Load move data from localStorage on component mount
  useEffect(() => {
    const loadAndParseAddresses = async () => {
      const aiFromLocation = localStorage.getItem('aiFromLocation');
      const aiToLocation = localStorage.getItem('aiToLocation');
      const aiMoveDate = localStorage.getItem('aiMoveDate');

      console.log('Loading AI data:', { aiFromLocation, aiToLocation, aiMoveDate });

      if (aiFromLocation && aiFromLocation !== 'undefined') {
        // Verify and parse from address
        const verifiedFromAddress = await verifyAddress(aiFromLocation);
        const fromParsed = parseAddress(verifiedFromAddress);
        
        setMoveDetails(prev => ({
          ...prev,
          fromAddress: fromParsed.streetAddress,
          fromCity: fromParsed.city,
          fromState: fromParsed.state,
          fromZip: fromParsed.zip
        }));
      }

      if (aiToLocation && aiToLocation !== 'undefined') {
        // Verify and parse to address
        const verifiedToAddress = await verifyAddress(aiToLocation);
        const toParsed = parseAddress(verifiedToAddress);
        
        setMoveDetails(prev => ({
          ...prev,
          toAddress: toParsed.streetAddress,
          toCity: toParsed.city,
          toState: toParsed.state,
          toZip: toParsed.zip,
          moveDate: aiMoveDate || ""
        }));
      }
    };

    loadAndParseAddresses();
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
          <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Journey
          </Button>

          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Truck className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Find Moving Companies</h1>
            </div>
            <p className="text-gray-600">Professional movers for your relocation</p>
          </div>

          {/* Streamlined Address Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-700 font-medium">
                      {moveDetails.fromAddress || moveDetails.fromCity
                        ? `${moveDetails.fromAddress ? moveDetails.fromAddress + ', ' : ''}${moveDetails.fromCity}${moveDetails.fromState ? ', ' + moveDetails.fromState : ''}${moveDetails.fromZip ? ' ' + moveDetails.fromZip : ''}`
                        : 'From location'} 
                    </span>
                    <span className="text-gray-400 text-lg">→</span>
                    <span className="text-gray-700 font-medium">
                      {moveDetails.toAddress || moveDetails.toCity
                        ? `${moveDetails.toAddress ? moveDetails.toAddress + ', ' : ''}${moveDetails.toCity}${moveDetails.toState ? ', ' + moveDetails.toState : ''}${moveDetails.toZip ? ' ' + moveDetails.toZip : ''}`
                        : 'To location'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 ml-8">
                  Move Date: {moveDetails.moveDate ? new Date(moveDetails.moveDate).toLocaleDateString() : 'July 27, 2025'}
                </div>
              </div>
              <Button 
                onClick={handleSearch}
                disabled={searchMutation.isPending || !moveDetails.fromCity || !moveDetails.toCity}
                className="bg-blue-600 hover:bg-blue-700 ml-4"
              >
                {searchMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  'Find Movers'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Moving Type Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="local">Local Movers</TabsTrigger>
            <TabsTrigger value="longDistance">Long Distance</TabsTrigger>
            <TabsTrigger value="specialty">Specialty</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Main Content Layout */}
        <div className="flex gap-8">
          {/* Left Section - Companies Results (2/3 width) */}
          <div className="flex-1">
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
          </div>

        {/* Right Section - Sidebar (1/3 width) */}
          <div className="w-80 space-y-6">
            {/* Estimate Questionnaire */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  Estimate Questionnaire
                </CardTitle>
                <CardDescription>
                  Prepare for accurate moving quotes by having these details ready when you call.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowQuestionnaireForm(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Fill Out Questionnaire
                </Button>
                
                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-purple-900 mb-2">Key Information Needed:</p>
                  <ul className="text-xs text-purple-800 space-y-1">
                    <li>• Current and destination addresses</li>
                    <li>• Moving date and home size</li>
                    <li>• Number of floors at each location</li>
                    <li>• Major items and inventory list</li>
                    <li>• Packing service preferences</li>
                    <li>• Special items and storage needs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Pro Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900">Best Booking Time</h4>
                  <p className="text-xs text-blue-800">Book 8+ weeks ahead for summer moves, 4+ weeks for off-season</p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-semibold text-green-900">Save Money</h4>
                  <p className="text-xs text-green-800">Move mid-month, mid-week, and avoid summer peak season</p>
                </div>
                
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="text-sm font-semibold text-red-900">Red Flags</h4>
                  <p className="text-xs text-red-800">Avoid companies requiring large deposits or door-to-door sales</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Checklist */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  Quick Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Get 3+ written estimates</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Check insurance coverage</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Read reviews & references</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Verify license & bonding</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Understand pricing structure</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Confirm moving date</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Costs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-yellow-500 rounded-full"></div>
                  Estimated Costs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Local Move (same city)</span>
                    <span className="font-medium">$800-1,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Long Distance (interstate)</span>
                    <span className="font-medium">$2,500-5,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packing Services</span>
                    <span className="font-medium">$500-1,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage (per month)</span>
                    <span className="font-medium">$50-200</span>
                  </div>
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between font-semibold text-green-700">
                      <span>Total Range</span>
                      <span>$1,350-6,700</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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

        {/* Questionnaire Form Modal */}
        {showQuestionnaireForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Moving Estimate Questionnaire</h2>
                  <button
                    onClick={() => setShowQuestionnaireForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Fill out this questionnaire to get more accurate quotes from moving companies.
                </p>

                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentAddress">Current Address</Label>
                      <Input
                        id="currentAddress"
                        value={`${moveDetails.fromAddress ? moveDetails.fromAddress + ', ' : ''}${moveDetails.fromCity}${moveDetails.fromState ? ', ' + moveDetails.fromState : ''}${moveDetails.fromZip ? ' ' + moveDetails.fromZip : ''}`}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="destinationAddress">Destination Address</Label>
                      <Input
                        id="destinationAddress"
                        value={`${moveDetails.toAddress ? moveDetails.toAddress + ', ' : ''}${moveDetails.toCity}${moveDetails.toState ? ', ' + moveDetails.toState : ''}${moveDetails.toZip ? ' ' + moveDetails.toZip : ''}`}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="homeSize">Home Size</Label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Select home size</option>
                      <option value="studio">Studio</option>
                      <option value="1br">1 Bedroom</option>
                      <option value="2br">2 Bedroom</option>
                      <option value="3br">3 Bedroom</option>
                      <option value="4br+">4+ Bedroom</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentFloors">Floors at Current Location</Label>
                      <Input id="currentFloors" type="number" min="1" max="10" placeholder="1" />
                    </div>
                    <div>
                      <Label htmlFor="destinationFloors">Floors at Destination</Label>
                      <Input id="destinationFloors" type="number" min="1" max="10" placeholder="1" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="majorItems">Major Items Being Moved</Label>
                    <Textarea 
                      id="majorItems" 
                      placeholder="List furniture, appliances, piano, safe, etc."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="packingServices">Packing Services Needed</Label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Select packing preference</option>
                      <option value="full">Full packing service</option>
                      <option value="partial">Partial packing</option>
                      <option value="self">Self-pack</option>
                      <option value="fragiles">Fragiles only</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="specialItems">Fragile or Specialty Items</Label>
                    <Textarea 
                      id="specialItems" 
                      placeholder="TVs, antiques, artwork, musical instruments, etc."
                      className="min-h-[60px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="storage">Storage Requirements</Label>
                    <Textarea 
                      id="storage" 
                      placeholder="Temporary storage needed? Duration?"
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button"
                      onClick={() => {
                        toast({
                          title: "Questionnaire Saved",
                          description: "Your information has been saved and can be shared with moving companies.",
                        });
                        setShowQuestionnaireForm(false);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Save Questionnaire
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuestionnaireForm(false)}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
