import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DollarSign,
  Home,
  Search,
  Loader2,
  X
} from "lucide-react";
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
  availability: string;
  specialties: string[];
  notes?: string;
}

export default function MovingCompanies() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [movingCompanies, setMovingCompanies] = useState<MovingCompany[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [quotesRequested, setQuotesRequested] = useState<Set<string>>(new Set());
  const [searchFormData, setSearchFormData] = useState({
    fromCity: "",
    fromState: "",
    fromZip: "",
    toCity: "",
    toState: "",
    toZip: "",
    moveDate: ""
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [showQuestionnaireForm, setShowQuestionnaireForm] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [questionnaireData, setQuestionnaireData] = useState({
    currentAddress: '',
    destinationAddress: '',
    movingDate: '',
    homeSize: '',
    squareFootage: '',
    currentFloors: '',
    destinationFloors: '',
    majorItems: {} as Record<string, number>,
    packingServices: '',
    furnitureDisassembly: '',
    fragileItems: '',
    storageNeeds: '',
    parkingAccess: '',
    additionalNotes: '',
    email: ''
  });

  // Check for URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    const toParam = urlParams.get('to');
    const dateParam = urlParams.get('date');

    if (fromParam && toParam) {
      // Parse the from and to addresses
      const [fromCity, fromStateZip] = fromParam.split(', ');
      const [toCity, toStateZip] = toParam.split(', ');

      // Extract state and zip from state/zip combo
      const fromStateParts = fromStateZip?.trim().split(' ');
      const fromState = fromStateParts?.[0] || '';
      const fromZip = fromStateParts?.[1] || '';

      const toStateParts = toStateZip?.trim().split(' ');
      const toState = toStateParts?.[0] || '';
      const toZip = toStateParts?.[1] || '';

      const formData = {
        fromCity: fromCity || '',
        fromState,
        fromZip,
        toCity: toCity || '',
        toState,
        toZip,
        moveDate: dateParam || ''
      };

      setSearchFormData(formData);

      // Automatically search if we have the required data
      if (fromCity && fromState && toCity && toState) {
        searchMutation.mutate(formData);
      }
    }
  }, []);

  // API request helper
  const apiRequest = async (method: string, url: string, data?: any) => {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response;
  };

  // Moving companies search mutation
  const searchMutation = useMutation({
    mutationFn: async (formData: typeof searchFormData) => {
      const response = await apiRequest("POST", "/api/moving-companies", {
        fromCity: formData.fromCity,
        fromState: formData.fromState,
        fromZip: formData.fromZip,
        toCity: formData.toCity,
        toState: formData.toState,
        toZip: formData.toZip,
        moveDate: formData.moveDate
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const companies = data?.companies || [];
      setMovingCompanies(companies);
      setHasSearched(true);
      toast({
        title: "Search Complete",
        description: `Found ${companies.length} moving companies for your route`,
      });
    },
    onError: (error) => {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "Unable to find moving companies. Please try again.",
        variant: "destructive",
      });
      setHasSearched(true);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchFormData.fromCity || !searchFormData.fromState || !searchFormData.toCity || !searchFormData.toState) {
      toast({
        title: "Missing Information",
        description: "Please fill in both origin and destination cities and states.",
        variant: "destructive",
      });
      return;
    }

    searchMutation.mutate(searchFormData);
  };

  const handleSelectCompany = (provider: string) => {
    setSelectedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(provider)) {
        newSet.delete(provider);
      } else {
        newSet.add(provider);
      }
      return newSet;
    });
  };

  const handleRequestQuote = async (company: MovingCompany) => {
    setQuotesRequested(prev => {
      const newSet = new Set(prev);
      newSet.add(company.provider);
      return newSet;
    });

    // Track referral click
    try {
      await apiRequest("POST", "/api/track-referral", {
        provider: company.provider,
        category: "Moving Companies",
        action: "quote_request",
        userAddress: `${searchFormData.fromCity}, ${searchFormData.fromState}`,
        affiliateCode: company.affiliateCode,
        referralUrl: company.referralUrl
      });
    } catch (error) {
      console.error("Referral tracking failed:", error);
    }

    toast({
      title: "Quote Requested",
      description: `Opening ${company.provider} website for quote`,
    });

    // Open company website
    window.open(company.referralUrl || company.website, '_blank');
  };

  const handleVisitWebsite = async (company: MovingCompany) => {
    // Track referral click
    try {
      await apiRequest("POST", "/api/track-referral", {
        provider: company.provider,
        category: "Moving Companies",
        action: "website_visit",
        userAddress: `${searchFormData.fromCity}, ${searchFormData.fromState}`,
        affiliateCode: company.affiliateCode,
        referralUrl: company.referralUrl
      });
    } catch (error) {
      console.error("Referral tracking failed:", error);
    }

    window.open(company.referralUrl || company.website, '_blank');
  };

    // Calculate form progress
    useEffect(() => {
      const totalFields = 12; // Total number of fields in the questionnaire
      const filledFields = [
        questionnaireData.currentAddress,
        questionnaireData.destinationAddress,
        questionnaireData.movingDate,
        questionnaireData.homeSize,
        questionnaireData.squareFootage,
        questionnaireData.currentFloors,
        questionnaireData.destinationFloors,
        Object.keys(questionnaireData.majorItems).length > 0 ? 'filled' : '',
        questionnaireData.packingServices,
        questionnaireData.furnitureDisassembly,
        questionnaireData.fragileItems,
        questionnaireData.email
      ].filter(field => field).length;
  
      setFormProgress((filledFields / totalFields) * 100);
    }, [questionnaireData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Questionnaire Form Modal */}
      {showQuestionnaireForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto mt-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Moving Estimate Questionnaire</h2>
                <button
                  onClick={() => setShowQuestionnaireForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(formProgress)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${formProgress}%` }}
                  ></div>
                </div>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentAddress">Current Address</Label>
                    <Input
                      id="currentAddress"
                      value={questionnaireData.currentAddress || searchFormData.fromCity + ", " + searchFormData.fromState}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, currentAddress: e.target.value})}
                      placeholder="Full address with unit number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="destinationAddress">Destination Address</Label>
                    <Input
                      id="destinationAddress"
                      value={questionnaireData.destinationAddress || searchFormData.toCity + ", " + searchFormData.toState}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, destinationAddress: e.target.value})}
                      placeholder="Full address with unit number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="movingDate">Moving Date</Label>
                    <Input
                      id="movingDate"
                      type="date"
                      value={questionnaireData.movingDate || searchFormData.moveDate}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, movingDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="homeSize">Home Size</Label>
                    <Select value={questionnaireData.homeSize} onValueChange={(value) => setQuestionnaireData({...questionnaireData, homeSize: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select home size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="1br">1 Bedroom</SelectItem>
                        <SelectItem value="2br">2 Bedroom</SelectItem>
                        <SelectItem value="3br">3 Bedroom</SelectItem>
                        <SelectItem value="4br">4+ Bedroom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="squareFootage">Square Footage (if known)</Label>
                    <Input
                      id="squareFootage"
                      value={questionnaireData.squareFootage}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, squareFootage: e.target.value})}
                      placeholder="e.g., 1200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentFloors">Current Location Floors</Label>
                    <Input
                      id="currentFloors"
                      value={questionnaireData.currentFloors}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, currentFloors: e.target.value})}
                      placeholder="e.g., 2nd floor, elevator"
                    />
                  </div>
                  <div>
                    <Label htmlFor="destinationFloors">Destination Floors</Label>
                    <Input
                      id="destinationFloors"
                      value={questionnaireData.destinationFloors}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, destinationFloors: e.target.value})}
                      placeholder="e.g., 1st floor, stairs"
                    />
                  </div>
                </div>

                <div>
                  <Label>Major Items Being Moved</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 border rounded-lg bg-gray-50 max-h-80 overflow-y-auto">
                    {[
                      // Living Room
                      { category: 'Living Room', items: ['Sofa/Couch', 'Coffee Table', 'End Tables', 'TV Stand', 'Entertainment Center', 'Recliner', 'Bookshelf', 'Armchair'] },
                      // Bedroom
                      { category: 'Bedroom', items: ['Queen Bed', 'King Bed', 'Twin Bed', 'Dresser', 'Nightstand', 'Wardrobe', 'Mattress'] },
                      // Dining Room
                      { category: 'Dining Room', items: ['Dining Table', 'Dining Chairs', 'China Cabinet', 'Bar Stools'] },
                      // Kitchen
                      { category: 'Kitchen', items: ['Refrigerator', 'Dishwasher', 'Microwave', 'Washer', 'Dryer'] },
                      // Electronics
                      { category: 'Electronics', items: ['Large TV (55"+)', 'Medium TV (32-54")', 'Computer/Desk', 'Piano', 'Exercise Equipment'] },
                      // Storage & Misc
                      { category: 'Storage & Misc', items: ['Filing Cabinet', 'Safe', 'Tool Chest', 'Outdoor Furniture', 'Lawn Mower', 'Bicycles'] }
                    ].map((category) => (
                      <div key={category.category} className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-800 border-b pb-1">{category.category}</h4>
                        {category.items.map((item) => (
                          <div key={item} className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-sm flex-1">
                              <input
                                type="checkbox"
                                checked={(questionnaireData.majorItems[item] || 0) > 0}
                                onChange={(e) => {
                                  const newItems = { ...questionnaireData.majorItems };
                                  if (e.target.checked) {
                                    newItems[item] = 1;
                                  } else {
                                    delete newItems[item];
                                  }
                                  setQuestionnaireData({...questionnaireData, majorItems: newItems});
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-gray-700">{item}</span>
                            </label>
                            {(questionnaireData.majorItems[item] || 0) > 0 && (
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={questionnaireData.majorItems[item] || 1}
                                onChange={(e) => {
                                  const quantity = parseInt(e.target.value) || 1;
                                  setQuestionnaireData({
                                    ...questionnaireData, 
                                    majorItems: { ...questionnaireData.majorItems, [item]: quantity }
                                  });
                                }}
                                className="w-16 px-2 py-1 text-sm border rounded"
                                placeholder="1"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="packingServices">Packing Services Needed</Label>
                    <Select value={questionnaireData.packingServices} onValueChange={(value) => setQuestionnaireData({...questionnaireData, packingServices: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select packing preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full packing service</SelectItem>
                        <SelectItem value="partial">Partial packing</SelectItem>
                        <SelectItem value="self">Self-pack</SelectItem>
                        <SelectItem value="fragiles">Fragiles only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="furnitureDisassembly">Furniture Disassembly Needed</Label>
                    <Input
                      id="furnitureDisassembly"
                      value={questionnaireData.furnitureDisassembly}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, furnitureDisassembly: e.target.value})}
                      placeholder="List items needing disassembly"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fragileItems">Fragile or Specialty Items</Label>
                  <Textarea
                    id="fragileItems"
                    value={questionnaireData.fragileItems}
                    onChange={(e) => setQuestionnaireData({...questionnaireData, fragileItems: e.target.value})}
                    placeholder="TVs, antiques, artwork, musical instruments, etc."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storageNeeds">Storage Requirements</Label>
                    <Input
                      id="storageNeeds"
                      value={questionnaireData.storageNeeds}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, storageNeeds: e.target.value})}
                      placeholder="Duration and type needed"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parkingAccess">Parking & Truck Access</Label>
                    <Input
                      id="parkingAccess"
                      value={questionnaireData.parkingAccess}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, parkingAccess: e.target.value})}
                      placeholder="Parking, elevators, permits needed?"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={questionnaireData.additionalNotes}
                    onChange={(e) => setQuestionnaireData({...questionnaireData, additionalNotes: e.target.value})}
                    placeholder="Any special requirements or concerns"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={questionnaireData.email}
                    onChange={(e) => setQuestionnaireData({...questionnaireData, email: e.target.value})}
                    placeholder="Where to send your PDF questionnaire"
                    required
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        toast({
                          title: "Questionnaire Saved",
                          description: "Your moving details have been saved for getting accurate quotes.",
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
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header Row */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">i</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Generate Your Plan</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <Badge variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700">
                    MEDIUM
                  </Badge>
                  <span>Timeline: AI Planning</span>
                  <span>Category: Moving Services</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {searchFormData.fromCity && searchFormData.fromState 
                      ? `${searchFormData.fromCity}, ${searchFormData.fromState}` 
                      : 'Austin, TX'
                    } → {searchFormData.toCity && searchFormData.toState 
                      ? `${searchFormData.toCity}, ${searchFormData.toState}` 
                      : 'Dallas, TX'
                    }
                  </span>
                  <span className="ml-4">
                    Move Date: {searchFormData.moveDate || '8/14/2024'}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 mb-2">Progress</div>
              <div className="text-2xl font-bold text-blue-600 mb-1">25%</div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="text-center">
                  <div className="text-blue-600 font-medium">Research</div>
                  <div className="w-16 h-2 bg-blue-600 rounded-full mt-1"></div>
                </div>
                <div className="text-center">
                  <div>Quote</div>
                  <div className="w-16 h-2 bg-gray-200 rounded-full mt-1"></div>
                </div>
                <div className="text-center">
                  <div>Book</div>
                  <div className="w-16 h-2 bg-gray-200 rounded-full mt-1"></div>
                </div>
                <div className="text-center">
                  <div>Complete</div>
                  <div className="w-16 h-2 bg-gray-200 rounded-full mt-1"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Row */}
          <div className="border-t border-gray-200 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/ai-assistant">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Hub
                  </Button>
                </Link>
                <Link href="/moving-journey">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Journey
                  </Button>
                </Link>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowQuestionnaireForm(true)}>
                  Fill Out Questionnaire
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400">
                  <span className="mr-2">✓</span>
                  Complete Task First
                </Button>
              </div>
              <Link href="/moving-journey">
                <Button variant="outline" size="sm">
                  Return to Journey
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Moving Companies</h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Professional movers for your relocation
          </p>

          {/* Search Form */}
          <div className="mt-8 bg-white rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Your Move Details</h2>
            </div>

            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From City</label>
                  <input 
                    type="text" 
                    placeholder="Current city"
                    value={searchFormData.fromCity}
                    onChange={(e) => setSearchFormData(prev => ({ ...prev, fromCity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From State</label>
                  <input 
                    type="text" 
                    placeholder="State (e.g., NY)"
                    value={searchFormData.fromState}
                    onChange={(e) => setSearchFormData(prev => ({ ...prev, fromState: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Zip (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Zip code"
                    value={searchFormData.fromZip}
                    onChange={(e) => setSearchFormData(prev => ({ ...prev, fromZip: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To City</label>
                  <input 
                    type="text" 
                    placeholder="Destination city"
                    value={searchFormData.toCity}
                    onChange={(e) => setSearchFormData(prev => ({ ...prev, toCity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To State</label>
                  <input 
                    type="text" 
                    placeholder="State (e.g., CA)"
                    value={searchFormData.toState}
                    onChange={(e) => setSearchFormData(prev => ({ ...prev, toState: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Move Date (Optional)</label>
                  <input 
                    type="date" 
                    value={searchFormData.moveDate}
                    onChange={(e) => setSearchFormData(prev => ({ ...prev, moveDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={searchMutation.isPending}
              >
                {searchMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching Moving Companies...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Moving Companies
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Moving Companies Results */}
          <div className="lg:col-span-2">
            {searchMutation.isPending && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Searching for moving companies...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                </div>
              </div>
            )}

            {!searchMutation.isPending && !hasSearched && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <Truck className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Find Moving Companies?</h3>
                  <p className="text-gray-600 mb-6">
                    Enter your move details above to get personalized moving company recommendations.
                  </p>
                  <Link href="/ai-assistant">
                    <Button>
                      Start with AI Assistant
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {hasSearched && movingCompanies.length === 0 && !searchMutation.isPending && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Moving Companies Found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find moving companies for this route. Try adjusting your search criteria or contact us for assistance.
                  </p>
                  <Button onClick={() => setHasSearched(false)}>
                    Try Different Search
                  </Button>
                </div>
              </div>
            )}

            {movingCompanies.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Found {movingCompanies.length} Moving Companies
                </h3>
                {movingCompanies.map((company, index) => (
                  <Card key={`${company.provider}-${index}`} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <Truck className="w-5 h-5 text-blue-600" />
                            {company.provider}
                          </CardTitle>
                          <Badge variant="outline" className="mt-2">{company.category}</Badge>
                          <CardDescription className="mt-2">{company.description}</CardDescription>
                        </div>
                        {company.rating > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">{company.rating}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Company Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{company.phone}</span>
                        </div>
                        {company.hours && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>{company.hours}</span>
                          </div>
                        )}
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

                      {/* Services */}
                      {company.services && company.services.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Services</div>
                          <div className="flex flex-wrap gap-2">
                            {company.services.map((service, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{service}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Specialties */}
                      {company.specialties && company.specialties.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Specialties</div>
                          <div className="flex flex-wrap gap-2">
                            {company.specialties.map((specialty, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{specialty}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {company.notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">{company.notes}</div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleRequestQuote(company)}
                          className="flex-1"
                          variant={quotesRequested.has(company.provider) ? "secondary" : "default"}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {quotesRequested.has(company.provider) ? "Quote Requested" : "Get Quote"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleVisitWebsite(company)}
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Website
                        </Button>
                        <Button 
                          onClick={() => handleSelectCompany(company.provider)}
                          variant={selectedCompanies.has(company.provider) ? "default" : "outline"}
                          className={selectedCompanies.has(company.provider) ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {selectedCompanies.has(company.provider) ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Moving Tips */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg text-blue-700">Moving Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium text-blue-800 text-sm mb-1">Get Multiple Quotes</div>
                  <div className="text-blue-700 text-xs">Request quotes from at least 3 companies to compare pricing and services</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="font-medium text-green-800 text-sm mb-1">Book Early</div>
                  <div className="text-green-700 text-xs">Reserve your moving company 6-8 weeks in advance for best availability</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="font-medium text-yellow-800 text-sm mb-1">Verify Credentials</div>
                  <div className="text-yellow-700 text-xs">Check USDOT number and read reviews before making your decision</div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Estimator */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg text-green-700">Estimated Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Local Move (under 50 miles)</span>
                    <span className="font-medium">$800 - $1,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Long Distance Move</span>
                    <span className="font-medium">$2,500 - $5,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Packing Service</span>
                    <span className="font-medium">$500 - $1,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage (per month)</span>
                    <span className="font-medium">$50 - $300</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-green-600">
                    <span>Average Total</span>
                    <span>$1,350 - $6,700</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Moving Checklist */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">Moving Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Research and get quotes</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Check company credentials</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Read contract carefully</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Schedule moving date</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Arrange packing services</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Purchase moving insurance</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Moving Estimate Questionnaire */}
              <div className="bg-white rounded-lg shadow-md border p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  Estimate Questionnaire
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Prepare for accurate moving quotes by having these details ready when you call.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowQuestionnaireForm(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Fill Out Questionnaire
                  </button>
                  <button
                    onClick={() => {}}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF Form
                  </button>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}