import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  CheckCircle,
  Clock,
  MapPin,
  Truck,
  Zap,
  Wifi,
  Phone,
  Stethoscope,
  GraduationCap,
  Heart,
  Building,
  Wrench,
  Star,
  ExternalLink
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RelocationPhase {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  progress: number;
  categories: RelocationCategory[];
}

interface RelocationCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: "not_started" | "in_progress" | "completed";
  urgency: "high" | "medium" | "low";
  route: string;
  estimatedTime: string;
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
}

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedPhase, setSelectedPhase] = useState("pre-move");
  const [moveSetupComplete, setMoveSetupComplete] = useState(false);
  const [movingCompanies, setMovingCompanies] = useState<MovingCompany[]>([]);
  const [moveAddresses, setMoveAddresses] = useState<MoveAddresses>({
    currentAddress: "",
    currentCity: "",
    currentState: "",
    currentZip: "",
    newAddress: "",
    newCity: "",
    newState: "",
    newZip: "",
    moveDate: ""
  });

  // Moving company search mutation
  const movingCompanyMutation = useMutation({
    mutationFn: async (addresses: MoveAddresses) => {
      const response = await apiRequest("POST", "/api/moving-companies", {
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

      window.open(company.referralUrl, '_blank');
      
      toast({
        title: "Opening Provider",
        description: `Redirecting to ${company.provider}`,
      });
    } catch (error) {
      window.open(company.website, '_blank');
    }
  };

  const relocationPhases: RelocationPhase[] = [
    {
      id: "pre-move",
      title: "Pre-Move Planning",
      description: "Essential preparations 8-4 weeks before your move",
      timeframe: "8-4 weeks before",
      progress: 50,
      categories: [
        {
          id: "moving-services",
          title: "Moving Services",
          description: movingCompanies.length > 0 
            ? `${movingCompanies.length} verified movers found for your route`
            : "Find and book professional movers",
          icon: Truck,
          status: movingCompanies.length > 0 ? "completed" : "not_started",
          urgency: "high",
          route: "#moving-services",
          estimatedTime: "30-45 min"
        },
        {
          id: "address-changes",
          title: "Address Changes",
          description: "Update your address with important institutions",
          icon: MapPin,
          status: "not_started",
          urgency: "high",
          route: "#",
          estimatedTime: "60-90 min"
        },
        {
          id: "school-education",
          title: "School & Education",
          description: "Transfer school records and find new schools",
          icon: GraduationCap,
          status: "not_started",
          urgency: "medium",
          route: "#",
          estimatedTime: "45-60 min"
        }
      ]
    },
    {
      id: "essential-services",
      title: "Essential Services Setup",
      description: "Critical utilities and services for your new home",
      timeframe: "2-4 weeks before",
      progress: 25,
      categories: [
        {
          id: "electricity",
          title: "Electricity",
          description: "Set up power service at your new address",
          icon: Zap,
          status: "completed",
          urgency: "high",
          route: "/utilities?type=electricity",
          estimatedTime: "15-20 min"
        },
        {
          id: "internet-cable",
          title: "Internet & Cable",
          description: "Schedule internet and cable installation",
          icon: Wifi,
          status: "not_started",
          urgency: "high",
          route: "/utilities?type=internet",
          estimatedTime: "20-30 min"
        },
        {
          id: "water-sewer",
          title: "Water & Sewer",
          description: "Activate water and sewer services",
          icon: Building,
          status: "not_started",
          urgency: "high",
          route: "/utilities?type=water",
          estimatedTime: "10-15 min"
        },
        {
          id: "waste-management",
          title: "Waste Management",
          description: "Set up trash and recycling pickup",
          icon: Building,
          status: "not_started",
          urgency: "medium",
          route: "/utilities?type=waste",
          estimatedTime: "10-15 min"
        }
      ]
    },
    {
      id: "settling-in",
      title: "Settling In",
      description: "Complete your relocation and get established",
      timeframe: "Moving week & after",
      progress: 0,
      categories: [
        {
          id: "healthcare",
          title: "Healthcare Providers",
          description: "Find doctors, dentists, and transfer medical records",
          icon: Stethoscope,
          status: "not_started",
          urgency: "medium",
          route: "#",
          estimatedTime: "45-60 min"
        },
        {
          id: "pet-services",
          title: "Pet Services",
          description: "Find veterinarians and pet care services",
          icon: Heart,
          status: "not_started",
          urgency: "low",
          route: "#",
          estimatedTime: "30-45 min"
        },
        {
          id: "home-services",
          title: "Home Services",
          description: "Set up maintenance, security, and other home services",
          icon: Wrench,
          status: "not_started",
          urgency: "low",
          route: "#",
          estimatedTime: "60-90 min"
        }
      ]
    }
  ];

  const overallProgress = Math.round(
    relocationPhases.reduce((sum, phase) => sum + phase.progress, 0) / relocationPhases.length
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in_progress": return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const handleMoveSetup = () => {
    if (moveAddresses.currentCity && moveAddresses.currentState && 
        moveAddresses.newCity && moveAddresses.newState && moveAddresses.moveDate) {
      setMoveSetupComplete(true);
      // Automatically search for moving companies once setup is complete
      movingCompanyMutation.mutate(moveAddresses);
    }
  };

  const isFormValid = moveAddresses.currentCity && moveAddresses.currentState && 
                      moveAddresses.newCity && moveAddresses.newState && moveAddresses.moveDate;

  // If move setup is not complete, show the address setup form
  if (!moveSetupComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 pt-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Your Move</h1>
            <p className="text-gray-600">Let's organize your relocation by setting up your move details</p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Move Information
              </CardTitle>
              <CardDescription>
                Enter your current address and destination to create a personalized moving plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Address Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Current Address</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-10">
                  <div className="md:col-span-2">
                    <Label htmlFor="currentAddress">Street Address</Label>
                    <Input
                      id="currentAddress"
                      value={moveAddresses.currentAddress}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, currentAddress: e.target.value }))}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentCity">City *</Label>
                    <Input
                      id="currentCity"
                      value={moveAddresses.currentCity}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, currentCity: e.target.value }))}
                      placeholder="Current city"
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

              <Separator />

              {/* New Address Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">New Home Address</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-10">
                  <div className="md:col-span-2">
                    <Label htmlFor="newAddress">Street Address</Label>
                    <Input
                      id="newAddress"
                      value={moveAddresses.newAddress}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, newAddress: e.target.value }))}
                      placeholder="456 Oak Avenue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCity">City *</Label>
                    <Input
                      id="newCity"
                      value={moveAddresses.newCity}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, newCity: e.target.value }))}
                      placeholder="New city"
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
                  <div>
                    <Label htmlFor="newZip">ZIP Code</Label>
                    <Input
                      id="newZip"
                      value={moveAddresses.newZip}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, newZip: e.target.value }))}
                      placeholder="90210"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Move Date Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Move Date</h3>
                </div>
                
                <div className="pl-10">
                  <Label htmlFor="moveDate">Target Move Date *</Label>
                  <Input
                    id="moveDate"
                    type="date"
                    value={moveAddresses.moveDate}
                    onChange={(e) => setMoveAddresses(prev => ({ ...prev, moveDate: e.target.value }))}
                    required
                    className="max-w-xs"
                  />
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  onClick={handleMoveSetup} 
                  disabled={!isFormValid}
                  className="w-full"
                  size="lg"
                >
                  Create My Moving Plan
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                {!isFormValid && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Please fill in the required fields (*)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Move Command Center</h1>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">From:</span>
                    <span className="text-gray-600">
                      {moveAddresses.currentCity}, {moveAddresses.currentState}
                      {moveAddresses.currentZip && ` ${moveAddresses.currentZip}`}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="font-medium">To:</span>
                    <span className="text-gray-600">
                      {moveAddresses.newCity}, {moveAddresses.newState}
                      {moveAddresses.newZip && ` ${moveAddresses.newZip}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Move Date:</span>
                  <span className="text-gray-600">
                    {new Date(moveAddresses.moveDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setMoveSetupComplete(false)}
                    className="ml-2 text-blue-600 hover:text-blue-700"
                  >
                    Edit Details
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Overall Progress</div>
              <div className="flex items-center gap-3">
                <Progress value={overallProgress} className="w-32" />
                <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Phase Navigation */}
        <Tabs value={selectedPhase} onValueChange={setSelectedPhase} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            {relocationPhases.map((phase) => (
              <TabsTrigger 
                key={phase.id} 
                value={phase.id}
                className="flex flex-col items-center p-4 space-y-2 data-[state=active]:bg-blue-50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{phase.title}</span>
                  {phase.progress === 100 && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <div className="text-xs text-gray-500">{phase.timeframe}</div>
                <Progress value={phase.progress} className="w-20 h-2" />
              </TabsTrigger>
            ))}
          </TabsList>

          {relocationPhases.map((phase) => (
            <TabsContent key={phase.id} value={phase.id} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{phase.title}</h2>
                <p className="text-gray-600 mb-4">{phase.description}</p>
                <div className="flex justify-center items-center gap-4">
                  <Progress value={phase.progress} className="w-64" />
                  <span className="text-xl font-semibold text-blue-600">{phase.progress}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {phase.categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Card key={category.id} className="relative hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{category.title}</CardTitle>
                              <div className="flex gap-2 mt-1">
                                <Badge className={getStatusColor(category.status)}>
                                  {category.status.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className={getUrgencyColor(category.urgency)}>
                                  {category.urgency} priority
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <CardDescription className="mt-2">
                          {category.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{category.estimatedTime}</span>
                          </div>
                          {category.route !== "#" ? (
                            <Link href={category.route}>
                              <Button size="sm" className="flex items-center gap-2">
                                Get Started
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          ) : category.id === "moving-services" ? (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                if (movingCompanies.length === 0) {
                                  movingCompanyMutation.mutate(moveAddresses);
                                } else {
                                  document.getElementById('moving-companies-section')?.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              disabled={movingCompanyMutation.isPending}
                              className="flex items-center gap-2"
                            >
                              {movingCompanyMutation.isPending ? "Searching..." : 
                               movingCompanies.length > 0 ? "View Companies" : "Find Movers"}
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled className="flex items-center gap-2">
                              Coming Soon
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Moving Companies Section */}
        {movingCompanies.length > 0 && (
          <div id="moving-companies-section" className="mt-12">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Recommended Moving Companies</h2>
                  <p className="text-gray-600 mt-1">
                    {movingCompanies.length} verified movers for {moveAddresses.currentCity}, {moveAddresses.currentState} → {moveAddresses.newCity}, {moveAddresses.newState}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => movingCompanyMutation.mutate(moveAddresses)}
                  disabled={movingCompanyMutation.isPending}
                >
                  Refresh Search
                </Button>
              </div>

              <div className="grid gap-4">
                {movingCompanies.map((company, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {company.provider}
                            {company.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-normal text-gray-600">{company.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {company.description}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {company.estimatedCost}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {company.services && company.services.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
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
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
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
                          
                          <div className="flex gap-2">
                            {company.phone && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`tel:${company.phone}`, '_self')}
                              >
                                Call Now
                              </Button>
                            )}
                            <Button 
                              size="sm"
                              onClick={() => handleReferralClick(company, "Get Quote")}
                              className="flex items-center gap-1"
                            >
                              Get Quote
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
          </div>
        )}
      </div>
    </div>
  );
}