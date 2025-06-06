import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  MessageCircle, 
  Lightbulb, 
  MapPin, 
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Users,
  Globe,
  Phone,
  Star,
  ExternalLink
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RelocationQuery {
  query: string;
  fromLocation: string;
  toLocation: string;
  moveDate: string;
  familySize: string;
  budget: string;
  priorities: string[];
}

interface AIRecommendation {
  category: string;
  title: string;
  description: string;
  reasoning: string;
  priority: "high" | "medium" | "low";
  estimatedCost: string;
  timeframe: string;
  providers?: Array<{
    name: string;
    description: string;
    contact: string;
    website?: string;
    rating?: number;
    services?: string[];
  }>;
  nextSteps: string[];
}

interface AIResponse {
  recommendations: AIRecommendation[];
  summary: string;
  timeline: Array<{
    week: string;
    tasks: string[];
  }>;
  estimatedTotalCost: string;
  actionPlan?: Array<{
    title: string;
    description: string;
    route: string;
    priority: "high" | "medium" | "low";
    timeframe: string;
    status: "pending" | "in_progress" | "completed";
  }>;
}

export default function AIAssistant() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [relocationDetails, setRelocationDetails] = useState<RelocationQuery>({
    query: "",
    fromLocation: "",
    toLocation: "",
    moveDate: "",
    familySize: "1-2 people",
    budget: "$5,000-$10,000",
    priorities: []
  });
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  const priorityOptions = [
    "Cost-effective solutions",
    "Premium service quality",
    "Speed and efficiency",
    "Eco-friendly options",
    "Family-friendly services",
    "Minimal disruption",
    "Technology integration",
    "Local expertise"
  ];

  const budgetOptions = [
    "Under $2,500",
    "$2,500-$5,000",
    "$5,000-$10,000",
    "$10,000-$20,000",
    "$20,000+"
  ];

  const familySizeOptions = [
    "Just me",
    "1-2 people", 
    "3-4 people",
    "5+ people",
    "Business relocation"
  ];

  // AI Assistant mutation
  const aiMutation = useMutation({
    mutationFn: async (queryData: RelocationQuery) => {
      const response = await apiRequest("POST", "/api/ai-recommendations", queryData);
      return await response.json();
    },
    onSuccess: (data) => {
      setAiResponse(data);
      toast({
        title: "AI Analysis Complete",
        description: "Your personalized relocation plan is ready",
      });
    },
    onError: (error) => {
      toast({
        title: "AI Service Temporarily Unavailable",
        description: "Please try again or contact support for assistance",
        variant: "destructive",
      });
    },
  });

  const handlePriorityToggle = (priority: string) => {
    const updated = selectedPriorities.includes(priority)
      ? selectedPriorities.filter(p => p !== priority)
      : [...selectedPriorities, priority];
    
    setSelectedPriorities(updated);
    setRelocationDetails(prev => ({ ...prev, priorities: updated }));
  };

  const handleSubmit = () => {
    if (!relocationDetails.fromLocation || !relocationDetails.toLocation) {
      toast({
        title: "Missing Information",
        description: "Please enter both your current and destination locations",
        variant: "destructive",
      });
      return;
    }

    const fullQuery = query || `Help me plan my relocation from ${relocationDetails.fromLocation} to ${relocationDetails.toLocation}`;
    
    aiMutation.mutate({
      ...relocationDetails,
      query: fullQuery
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Relocation Concierge</h1>
              <p className="text-gray-600">Create your personalized moving plan, then execute it step-by-step</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Personalized Plans</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              <span>Smart Recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <span>Instant Insights</span>
            </div>
          </div>
        </div>

        {!aiResponse ? (
          // Input Form
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Tell Me About Your Move
              </CardTitle>
              <CardDescription>
                I'll analyze your move and create a custom action plan that guides you through our specialized tools for movers, utilities, and checklists
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Custom Query */}
              <div>
                <Label htmlFor="query">Specific Questions or Concerns (Optional)</Label>
                <Textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., I need help finding pet-friendly movers and setting up utilities quickly..."
                  className="min-h-[80px]"
                />
              </div>

              <Separator />

              {/* Location Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromLocation">Current Location *</Label>
                  <Input
                    id="fromLocation"
                    value={relocationDetails.fromLocation}
                    onChange={(e) => setRelocationDetails(prev => ({ ...prev, fromLocation: e.target.value }))}
                    placeholder="Dallas, TX"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="toLocation">Moving To *</Label>
                  <Input
                    id="toLocation"
                    value={relocationDetails.toLocation}
                    onChange={(e) => setRelocationDetails(prev => ({ ...prev, toLocation: e.target.value }))}
                    placeholder="Austin, TX"
                    required
                  />
                </div>
              </div>

              {/* Move Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="moveDate">Target Move Date</Label>
                  <Input
                    id="moveDate"
                    type="date"
                    value={relocationDetails.moveDate}
                    onChange={(e) => setRelocationDetails(prev => ({ ...prev, moveDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="familySize">Household Size</Label>
                  <select
                    id="familySize"
                    value={relocationDetails.familySize}
                    onChange={(e) => setRelocationDetails(prev => ({ ...prev, familySize: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {familySizeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="budget">Moving Budget</Label>
                  <select
                    id="budget"
                    value={relocationDetails.budget}
                    onChange={(e) => setRelocationDetails(prev => ({ ...prev, budget: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {budgetOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priorities */}
              <div>
                <Label>Your Priorities (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {priorityOptions.map(priority => (
                    <Button
                      key={priority}
                      variant={selectedPriorities.includes(priority) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePriorityToggle(priority)}
                      className="justify-start h-auto py-2 px-3"
                    >
                      <span className="text-xs">{priority}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleSubmit}
                  disabled={aiMutation.isPending || !relocationDetails.fromLocation || !relocationDetails.toLocation}
                  className="w-full"
                  size="lg"
                >
                  {aiMutation.isPending ? (
                    <>
                      <Bot className="w-5 h-5 mr-2 animate-spin" />
                      AI is analyzing your move...
                    </>
                  ) : (
                    <>
                      Get My AI-Powered Plan
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // AI Response Display
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  AI Summary & Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{aiResponse.summary}</p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {relocationDetails.fromLocation} → {relocationDetails.toLocation}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {relocationDetails.familySize}
                  </Badge>
                  <Badge variant="outline">
                    Est. Total: {aiResponse.estimatedTotalCost}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Personalized Recommendations</h2>
              <div className="grid gap-4">
                {aiResponse.recommendations.map((rec, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {rec.title}
                            <Badge variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"}>
                              {rec.priority} priority
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {rec.category}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {rec.estimatedCost}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700">{rec.description}</p>
                      
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>AI Reasoning:</strong> {rec.reasoning}
                        </p>
                      </div>

                      {rec.providers && rec.providers.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Recommended Providers:</h4>
                          <div className="space-y-3">
                            {rec.providers.map((provider, idx) => (
                              <div key={idx} className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-lg flex items-center gap-2">
                                      {provider.name}
                                      {provider.rating && provider.rating > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                          <span className="text-sm font-normal text-gray-600">
                                            {provider.rating.toFixed(1)}
                                          </span>
                                        </div>
                                      )}
                                    </h5>
                                    <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                                  </div>
                                </div>
                                
                                {provider.services && provider.services.length > 0 && (
                                  <div className="mb-3">
                                    <div className="flex flex-wrap gap-1">
                                      {provider.services.slice(0, 3).map((service, serviceIdx) => (
                                        <Badge key={serviceIdx} variant="secondary" className="text-xs">
                                          {service}
                                        </Badge>
                                      ))}
                                      {provider.services.length > 3 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{provider.services.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col gap-1 text-sm text-gray-600">
                                    {provider.contact && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        <span>{provider.contact}</span>
                                      </div>
                                    )}
                                    {provider.website && (
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
                                    {provider.contact && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => window.open(`tel:${provider.contact}`, '_self')}
                                      >
                                        Call
                                      </Button>
                                    )}
                                    {provider.website && (
                                      <Button 
                                        size="sm"
                                        onClick={() => window.open(provider.website, '_blank')}
                                        className="flex items-center gap-1"
                                      >
                                        Visit
                                        <ExternalLink className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Next Steps:</h4>
                        <ul className="space-y-1">
                          {rec.nextSteps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Timeline: {rec.timeframe}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Personalized Action Plan */}
            {aiResponse.actionPlan && aiResponse.actionPlan.length > 0 && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Your Personalized Action Plan
                  </CardTitle>
                  <CardDescription>
                    AI-generated steps tailored to your relocation from {relocationDetails.fromLocation} to {relocationDetails.toLocation}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {aiResponse.actionPlan.map((action, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-lg flex items-center gap-2">
                              {action.title}
                              <Badge variant={action.priority === "high" ? "destructive" : action.priority === "medium" ? "default" : "secondary"}>
                                {action.priority} priority
                              </Badge>
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                          </div>
                          <Badge variant="outline" className="ml-4">
                            {action.timeframe}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>Status: {action.status.replace('_', ' ')}</span>
                            </div>
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                          </div>
                          
                          <Button 
                            size="sm"
                            onClick={() => window.location.href = action.route}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                          >
                            Start Task
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            {aiResponse.timeline && aiResponse.timeline.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Suggested Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiResponse.timeline.map((week, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-4">
                        <h4 className="font-medium text-gray-900">{week.week}</h4>
                        <ul className="mt-2 space-y-1">
                          {week.tasks.map((task, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                onClick={() => {
                  setAiResponse(null);
                  setQuery("");
                  setSelectedPriorities([]);
                }}
                variant="outline"
                size="lg"
              >
                Create New Plan
              </Button>
              
              {aiResponse.actionPlan && aiResponse.actionPlan.length > 0 && (
                <Button
                  onClick={() => window.location.href = aiResponse.actionPlan![0].route}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Start First Task
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}