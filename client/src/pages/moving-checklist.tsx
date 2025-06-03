import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Star, Phone, Globe, ExternalLink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  task: string;
  description?: string;
  timeframe: string;
  category: string;
  completed: boolean;
  hasProviders?: boolean;
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

export default function MovingChecklist() {
  const { toast } = useToast();
  const [movingCompanies, setMovingCompanies] = useState<MovingCompany[]>([]);
  const [showMovingDialog, setShowMovingDialog] = useState(false);
  const [moveAddresses, setMoveAddresses] = useState({
    fromAddress: "",
    fromCity: "",
    fromState: "",
    fromZip: "",
    toAddress: "",
    toCity: "",
    toState: "",
    toZip: ""
  });

  const searchMutation = useMutation({
    mutationFn: async (addresses: typeof moveAddresses) => {
      return await apiRequest("POST", "/api/moving-companies", addresses);
    },
    onSuccess: (data) => {
      const companies = data?.companies || [];
      setMovingCompanies(companies);
      toast({
        title: "Success",
        description: `Found ${companies.length} moving companies for your route`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load moving companies. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReferralClick = async (company: MovingCompany, action: string) => {
    try {
      // Track the referral click
      await apiRequest("POST", "/api/track-referral", {
        provider: company.provider,
        category: "Moving Companies",
        action: action,
        userAddress: `${moveAddresses.fromCity}, ${moveAddresses.fromState}`,
        affiliateCode: company.affiliateCode,
        referralUrl: company.referralUrl
      });

      // Open the referral URL
      window.open(company.referralUrl, '_blank');
      
      toast({
        title: "Referral Tracked",
        description: `Opening ${company.provider} website`,
      });
    } catch (error) {
      // Fallback to regular website if referral tracking fails
      window.open(company.website, '_blank');
    }
  };

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    // 8 Weeks Before
    { id: "1", task: "Research moving companies", description: "Get quotes from at least 3 moving companies", timeframe: "8 weeks", category: "planning", completed: false, hasProviders: true },
    { id: "2", task: "Create moving budget", description: "Include moving costs, deposits, and unexpected expenses", timeframe: "8 weeks", category: "planning", completed: false },
    { id: "3", task: "Start decluttering", description: "Donate or sell items you don't need", timeframe: "8 weeks", category: "organizing", completed: false },
    
    // 6 Weeks Before
    { id: "4", task: "Book moving company", description: "Confirm dates and get written estimate", timeframe: "6 weeks", category: "planning", completed: false },
    { id: "5", task: "Research new area", description: "Find schools, hospitals, grocery stores", timeframe: "6 weeks", category: "research", completed: false },
    { id: "6", task: "Start using up food", description: "Reduce pantry and freezer items", timeframe: "6 weeks", category: "organizing", completed: false },
    
    // 4 Weeks Before
    { id: "7", task: "Submit change of address", description: "File with postal service", timeframe: "4 weeks", category: "utilities", completed: false },
    { id: "8", task: "Research utility providers", description: "Contact electricity, gas, water, internet companies", timeframe: "4 weeks", category: "utilities", completed: false },
    { id: "9", task: "Transfer school records", description: "Request transcripts and records", timeframe: "4 weeks", category: "documents", completed: false },
    
    // 2 Weeks Before
    { id: "10", task: "Confirm utility connections", description: "Schedule service start dates for new home", timeframe: "2 weeks", category: "utilities", completed: false },
    { id: "11", task: "Pack non-essentials", description: "Start with seasonal items and decorations", timeframe: "2 weeks", category: "packing", completed: false },
    { id: "12", task: "Update address with banks", description: "Notify credit cards, loans, and investment accounts", timeframe: "2 weeks", category: "documents", completed: false },
    
    // 1 Week Before
    { id: "13", task: "Pack survival kit", description: "Essential items for first few days", timeframe: "1 week", category: "packing", completed: false },
    { id: "14", task: "Confirm moving details", description: "Call moving company to confirm time and details", timeframe: "1 week", category: "planning", completed: false },
    { id: "15", task: "Backup important data", description: "Save computer files and photos", timeframe: "1 week", category: "documents", completed: false },
    
    // Moving Day
    { id: "16", task: "Be present for movers", description: "Supervise loading and inventory", timeframe: "moving day", category: "execution", completed: false },
    { id: "17", task: "Check inventory list", description: "Verify all items are loaded", timeframe: "moving day", category: "execution", completed: false },
    { id: "18", task: "Keep important documents", description: "Carry personally - don't pack in truck", timeframe: "moving day", category: "execution", completed: false },
    
    // After Moving
    { id: "19", task: "Update voter registration", description: "Register at new address", timeframe: "after move", category: "documents", completed: false },
    { id: "20", task: "Find new doctors", description: "Transfer medical records", timeframe: "after move", category: "services", completed: false },
    { id: "21", task: "Update insurance policies", description: "Auto, home, health insurance", timeframe: "after move", category: "documents", completed: false },
  ]);

  const toggleItem = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const getTimeframes = () => {
    return Array.from(new Set(checklist.map(item => item.timeframe)));
  };

  const getCategories = () => {
    return Array.from(new Set(checklist.map(item => item.category)));
  };

  const getProgress = () => {
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      planning: "bg-blue-100 text-blue-800",
      organizing: "bg-green-100 text-green-800",
      research: "bg-purple-100 text-purple-800",
      utilities: "bg-yellow-100 text-yellow-800",
      documents: "bg-red-100 text-red-800",
      packing: "bg-orange-100 text-orange-800",
      execution: "bg-pink-100 text-pink-800",
      services: "bg-indigo-100 text-indigo-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getItemsByTimeframe = (timeframe: string) => {
    return checklist.filter(item => item.timeframe === timeframe);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Moving Checklist</h1>
          <p className="text-gray-600 mt-2">Stay organized with our comprehensive moving timeline</p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Track your moving preparation progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">{getProgress()}% Complete</span>
              </div>
              <Progress value={getProgress()} className="h-3" />
              <div className="text-sm text-gray-600">
                {checklist.filter(item => item.completed).length} of {checklist.length} tasks completed
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist Tabs */}
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">By Timeline</TabsTrigger>
            <TabsTrigger value="category">By Category</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6">
            {getTimeframes().map(timeframe => {
              const items = getItemsByTimeframe(timeframe);
              const completedInTimeframe = items.filter(item => item.completed).length;
              
              return (
                <Card key={timeframe}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="capitalize">{timeframe}</CardTitle>
                      <Badge variant="outline">
                        {completedInTimeframe}/{items.length} Complete
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.map(item => (
                        <div key={item.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleItem(item.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {item.task}
                              </h4>
                              <Badge className={getCategoryColor(item.category)}>
                                {item.category}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className={`text-sm ${item.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                                {item.description}
                              </p>
                            )}
                            {item.hasProviders && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowMovingDialog(true)}
                                className="mt-2"
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                Find Movers
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="category" className="space-y-6">
            {getCategories().map(category => {
              const items = checklist.filter(item => item.category === category);
              const completedInCategory = items.filter(item => item.completed).length;
              
              return (
                <Card key={category}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="capitalize">{category}</CardTitle>
                      <Badge variant="outline">
                        {completedInCategory}/{items.length} Complete
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.map(item => (
                        <div key={item.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleItem(item.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {item.task}
                              </h4>
                              <Badge variant="outline">
                                {item.timeframe}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className={`text-sm ${item.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline"
            onClick={() => setChecklist(prev => prev.map(item => ({ ...item, completed: false })))}
          >
            Reset All
          </Button>
          <Button 
            onClick={() => window.print()}
          >
            Print Checklist
          </Button>
        </div>
      </div>

      {/* Moving Companies Dialog */}
      <Dialog open={showMovingDialog} onOpenChange={setShowMovingDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Find Moving Companies</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Address Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">From Address</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fromCity">City</Label>
                    <Input
                      id="fromCity"
                      value={moveAddresses.fromCity}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, fromCity: e.target.value }))}
                      placeholder="Current city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromState">State</Label>
                    <Input
                      id="fromState"
                      value={moveAddresses.fromState}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, fromState: e.target.value }))}
                      placeholder="Current state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromZip">ZIP Code</Label>
                    <Input
                      id="fromZip"
                      value={moveAddresses.fromZip}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, fromZip: e.target.value }))}
                      placeholder="Current ZIP"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">To Address</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="toCity">City</Label>
                    <Input
                      id="toCity"
                      value={moveAddresses.toCity}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, toCity: e.target.value }))}
                      placeholder="Destination city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="toState">State</Label>
                    <Input
                      id="toState"
                      value={moveAddresses.toState}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, toState: e.target.value }))}
                      placeholder="Destination state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="toZip">ZIP Code</Label>
                    <Input
                      id="toZip"
                      value={moveAddresses.toZip}
                      onChange={(e) => setMoveAddresses(prev => ({ ...prev, toZip: e.target.value }))}
                      placeholder="Destination ZIP"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => searchMutation.mutate(moveAddresses)}
              disabled={searchMutation.isPending || !moveAddresses.fromCity || !moveAddresses.toCity}
              className="w-full"
            >
              {searchMutation.isPending ? "Searching..." : "Find Moving Companies"}
            </Button>

            {/* Moving Companies Results */}
            {movingCompanies.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Recommended Moving Companies</h3>
                <div className="grid gap-4">
                  {movingCompanies.map((company, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-semibold text-gray-900">{company?.provider || 'Moving Company'}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.floor(company?.rating || 0)
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-sm text-gray-600">{company?.rating || 'N/A'}</span>
                              </div>
                              <Badge variant="secondary">{company?.estimatedCost || 'Contact for Quote'}</Badge>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4">{company?.description || 'Professional moving services'}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2" />
                              {company?.phone || 'Contact for phone number'}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Globe className="w-4 h-4 mr-2" />
                              {company?.hours || 'Business hours available upon contact'}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Services:</p>
                            <div className="flex flex-wrap gap-1">
                              {(company?.services || []).map((service, serviceIndex) => (
                                <Badge key={serviceIndex} variant="outline" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleReferralClick(company, "get_quote")}
                            className="flex-1"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Get Quote
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReferralClick(company, "view_website")}
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            Website
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}