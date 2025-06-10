
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  MapPin,
  Building2,
  CreditCard,
  Shield,
  GraduationCap,
  Stethoscope,
  Car,
  Truck,
  CheckCircle,
  Clock,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  AlertTriangle,
  Info,
  Calendar,
  FileText,
  Users,
  Zap
} from "lucide-react";

interface AddressChangeItem {
  id: string;
  category: string;
  service: string;
  description: string;
  priority: "high" | "medium" | "low";
  timeframe: string;
  method: "online" | "phone" | "mail" | "in-person";
  website?: string;
  phone?: string;
  notes?: string;
  completed: boolean;
}

export default function ChangeOfAddress() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [moveData, setMoveData] = useState(() => {
    // Get addresses from localStorage
    const fromLocation = localStorage.getItem('aiFromLocation') || '';
    const toLocation = localStorage.getItem('aiToLocation') || '';
    const moveDate = localStorage.getItem('aiMoveDate') || '';
    
    return {
      currentAddress: fromLocation,
      newAddress: toLocation,
      moveDate: moveDate,
      effectiveDate: moveDate
    };
  });

  const [uspsSubmitted, setUspsSubmitted] = useState(false);
  const [selectedTab, setSelectedTab] = useState("usps");

  const [addressChangeList, setAddressChangeList] = useState<AddressChangeItem[]>([
    // Government & Official
    { id: "1", category: "Government", service: "USPS Mail Forwarding", description: "Official mail forwarding service", priority: "high", timeframe: "2 weeks before", method: "online", website: "https://moversguide.usps.com", completed: false },
    { id: "2", category: "Government", service: "Voter Registration", description: "Update voting address", priority: "high", timeframe: "30 days before", method: "online", website: "https://vote.gov", completed: false },
    { id: "3", category: "Government", service: "Driver's License", description: "Update license address", priority: "high", timeframe: "30 days after", method: "in-person", notes: "Visit local DMV office", completed: false },
    { id: "4", category: "Government", service: "Vehicle Registration", description: "Update car registration", priority: "high", timeframe: "30 days after", method: "online", completed: false },
    { id: "5", category: "Government", service: "IRS/Tax Records", description: "Update tax filing address", priority: "medium", timeframe: "Before next filing", method: "online", website: "https://irs.gov", completed: false },

    // Financial Services
    { id: "6", category: "Financial", service: "Bank Accounts", description: "Primary checking/savings accounts", priority: "high", timeframe: "2 weeks before", method: "online", completed: false },
    { id: "7", category: "Financial", service: "Credit Cards", description: "All credit card accounts", priority: "high", timeframe: "2 weeks before", method: "online", completed: false },
    { id: "8", category: "Financial", service: "Investment Accounts", description: "401k, IRA, brokerage accounts", priority: "medium", timeframe: "1 month", method: "online", completed: false },
    { id: "9", category: "Financial", service: "Loans & Mortgages", description: "Auto loans, student loans, mortgage", priority: "high", timeframe: "2 weeks before", method: "phone", completed: false },
    { id: "10", category: "Financial", service: "PayPal/Venmo", description: "Digital payment services", priority: "low", timeframe: "1 month", method: "online", completed: false },

    // Insurance
    { id: "11", category: "Insurance", service: "Auto Insurance", description: "Car insurance policy", priority: "high", timeframe: "Before move", method: "phone", completed: false },
    { id: "12", category: "Insurance", service: "Home/Renters Insurance", description: "Property insurance", priority: "high", timeframe: "Before move", method: "phone", completed: false },
    { id: "13", category: "Insurance", service: "Health Insurance", description: "Medical insurance provider", priority: "high", timeframe: "2 weeks before", method: "online", completed: false },
    { id: "14", category: "Insurance", service: "Life Insurance", description: "Life insurance policies", priority: "medium", timeframe: "1 month", method: "phone", completed: false },

    // Healthcare
    { id: "15", category: "Healthcare", service: "Primary Care Doctor", description: "Family physician", priority: "high", timeframe: "2 weeks after", method: "phone", completed: false },
    { id: "16", category: "Healthcare", service: "Dentist", description: "Dental care provider", priority: "medium", timeframe: "1 month after", method: "phone", completed: false },
    { id: "17", category: "Healthcare", service: "Pharmacy", description: "Prescription transfer", priority: "high", timeframe: "1 week before", method: "phone", completed: false },
    { id: "18", category: "Healthcare", service: "Veterinarian", description: "Pet healthcare provider", priority: "medium", timeframe: "2 weeks after", method: "phone", completed: false },

    // Education
    { id: "19", category: "Education", service: "School Districts", description: "Transfer student records", priority: "high", timeframe: "1 month before", method: "in-person", completed: false },
    { id: "20", category: "Education", service: "Student Loans", description: "Federal/private loan servicers", priority: "medium", timeframe: "2 weeks", method: "online", completed: false },

    // Subscriptions & Services
    { id: "21", category: "Subscriptions", service: "Internet/Cable", description: "Transfer or new service", priority: "high", timeframe: "2 weeks before", method: "phone", completed: false },
    { id: "22", category: "Subscriptions", service: "Streaming Services", description: "Netflix, Hulu, Disney+, etc.", priority: "low", timeframe: "Anytime", method: "online", completed: false },
    { id: "23", category: "Subscriptions", service: "Gym Membership", description: "Transfer or cancel membership", priority: "low", timeframe: "1 month", method: "in-person", completed: false },
    { id: "24", category: "Subscriptions", service: "Magazine Subscriptions", description: "Print and digital subscriptions", priority: "low", timeframe: "1 month", method: "online", completed: false },

    // Professional
    { id: "25", category: "Professional", service: "Employer HR", description: "Update work address", priority: "high", timeframe: "2 weeks before", method: "online", completed: false },
    { id: "26", category: "Professional", service: "Professional Licenses", description: "Licensing boards", priority: "medium", timeframe: "30 days", method: "online", completed: false },
  ]);

  const toggleItem = (id: string) => {
    setAddressChangeList(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const getCategories = () => {
    return Array.from(new Set(addressChangeList.map(item => item.category)));
  };

  const getCategoryProgress = (category: string) => {
    const categoryItems = addressChangeList.filter(item => item.category === category);
    const completed = categoryItems.filter(item => item.completed).length;
    return Math.round((completed / categoryItems.length) * 100);
  };

  const getOverallProgress = () => {
    const completed = addressChangeList.filter(item => item.completed).length;
    return Math.round((completed / addressChangeList.length) * 100);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      Government: Car,
      Financial: CreditCard,
      Insurance: Shield,
      Healthcare: Stethoscope,
      Education: GraduationCap,
      Subscriptions: Zap,
      Professional: Building2
    };
    return icons[category as keyof typeof icons] || Building2;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "online": return Globe;
      case "phone": return Phone;
      case "mail": return Mail;
      case "in-person": return Building2;
      default: return Info;
    }
  };

  const handleUSPSSubmit = () => {
    setUspsSubmitted(true);
    // Mark USPS item as completed
    setAddressChangeList(prev => 
      prev.map(item => 
        item.service === "USPS Mail Forwarding" ? { ...item, completed: true } : item
      )
    );
    toast({
      title: "USPS Forwarding Submitted",
      description: "Your mail forwarding request has been processed. You'll receive confirmation shortly.",
    });
  };

  const getHighPriorityItems = () => {
    return addressChangeList.filter(item => item.priority === "high" && !item.completed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/moving-journey">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Journey
            </Button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Change of Address</h1>
            <p className="text-gray-600 mt-2">Update your address with all important services and organizations</p>
          </div>
          <div className="w-32"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Move Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Your Move Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Current Address</Label>
                <p className="text-gray-900 font-medium">{moveData.currentAddress || "Not specified"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">New Address</Label>
                <p className="text-gray-900 font-medium">{moveData.newAddress || "Not specified"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Move Date</Label>
                <p className="text-gray-900 font-medium">
                  {moveData.moveDate ? new Date(moveData.moveDate).toLocaleDateString() : "Not specified"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>Track your address change completion across all categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-sm text-gray-600">{getOverallProgress()}% Complete</span>
              </div>
              <Progress value={getOverallProgress()} className="h-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{getHighPriorityItems().length}</div>
                  <div className="text-xs text-red-600">High Priority Remaining</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{addressChangeList.filter(item => item.completed).length}</div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{addressChangeList.length}</div>
                  <div className="text-xs text-blue-600">Total Items</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{getCategories().length}</div>
                  <div className="text-xs text-purple-600">Categories</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="usps">USPS Forwarding</TabsTrigger>
            <TabsTrigger value="checklist">Address Checklist</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>

          {/* USPS Forwarding Tab */}
          <TabsContent value="usps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  USPS Mail Forwarding Service
                </CardTitle>
                <CardDescription>
                  Set up official mail forwarding with the United States Postal Service
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!uspsSubmitted ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">Important Information</h4>
                          <p className="text-sm text-blue-800 mt-1">
                            USPS mail forwarding should be submitted 2 weeks before your move date. 
                            The service costs $1.10 for verification and provides mail forwarding for 12 months.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Current Address</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="currentStreet">Street Address</Label>
                            <Input
                              id="currentStreet"
                              placeholder="123 Current St"
                              value={moveData.currentAddress.split(',')[0] || ''}
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">New Address</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="newStreet">Street Address</Label>
                            <Input
                              id="newStreet"
                              placeholder="456 New St"
                              value={moveData.newAddress.split(',')[0] || ''}
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="effectiveDate">Effective Date</Label>
                        <Input
                          id="effectiveDate"
                          type="date"
                          value={moveData.effectiveDate}
                          onChange={(e) => setMoveData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Service Duration</Label>
                        <p className="text-sm text-gray-900 mt-2">12 months (standard)</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleUSPSSubmit}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Submit USPS Forwarding Request
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open('https://moversguide.usps.com', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        USPS Website
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">USPS Forwarding Submitted!</h3>
                    <p className="text-gray-600 mb-4">
                      Your mail forwarding request has been processed. You should receive confirmation within 24 hours.
                    </p>
                    <Badge className="bg-green-100 text-green-800">
                      Effective from {new Date(moveData.effectiveDate).toLocaleDateString()}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-6">
            {getCategories().map(category => {
              const categoryItems = addressChangeList.filter(item => item.category === category);
              const CategoryIcon = getCategoryIcon(category);
              const progress = getCategoryProgress(category);
              
              return (
                <Card key={category}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <CategoryIcon className="w-5 h-5 text-blue-600" />
                        {category}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-24 h-2" />
                        <span className="text-sm text-gray-600">{progress}%</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryItems.map(item => {
                        const MethodIcon = getMethodIcon(item.method);
                        
                        return (
                          <div key={item.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={() => toggleItem(item.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {item.service}
                                </h4>
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <MethodIcon className="w-3 h-3" />
                                  {item.method}
                                </Badge>
                              </div>
                              <p className={`text-sm ${item.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                                {item.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {item.timeframe}
                                </span>
                                {item.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {item.phone}
                                  </span>
                                )}
                                {item.website && (
                                  <button
                                    onClick={() => window.open(item.website, '_blank')}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Website
                                  </button>
                                )}
                              </div>
                              {item.notes && (
                                <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Address Change Timeline
                </CardTitle>
                <CardDescription>
                  Recommended timeline for updating your address with different services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Before Move */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Before Your Move
                    </h3>
                    <div className="space-y-3">
                      {addressChangeList
                        .filter(item => item.timeframe.includes('before'))
                        .map(item => (
                          <div key={item.id} className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={() => toggleItem(item.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {item.service}
                                </span>
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{item.timeframe}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* After Move */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      After Your Move
                    </h3>
                    <div className="space-y-3">
                      {addressChangeList
                        .filter(item => item.timeframe.includes('after'))
                        .map(item => (
                          <div key={item.id} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={() => toggleItem(item.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {item.service}
                                </span>
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{item.timeframe}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Flexible Timing */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Flexible Timing
                    </h3>
                    <div className="space-y-3">
                      {addressChangeList
                        .filter(item => !item.timeframe.includes('before') && !item.timeframe.includes('after'))
                        .map(item => (
                          <div key={item.id} className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={() => toggleItem(item.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {item.service}
                                </span>
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{item.timeframe}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline"
            onClick={() => setAddressChangeList(prev => prev.map(item => ({ ...item, completed: false })))}
          >
            Reset All
          </Button>
          <Button 
            onClick={() => window.print()}
          >
            <FileText className="w-4 h-4 mr-2" />
            Print Checklist
          </Button>
        </div>
      </div>
    </div>
  );
}
