import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Brain, Calendar, MapPin, DollarSign, ArrowRight, ArrowLeft, CheckCircle2, Home, Truck, Wifi, Zap, Phone, CreditCard, FileText, Package, Users, Clock, Search, Building } from "lucide-react";
import { Link } from "wouter";
import { DynamicHighwaySign } from "@/components/dynamic-highway-sign";

interface RelocationQuery {
  query: string;
  fromLocation: string;
  toLocation: string;
  moveDate: string;
  familySize: string;
  budget: string;
  priorities: string[];
}

interface AIResponse {
  summary: string;
  timeline: Array<{
    week: string;
    tasks: string[];
  }>;
  estimatedTotalCost: string;
  actionPlan: Array<{
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
  const [relocationDetails, setRelocationDetails] = useState({
    fromLocation: "",
    toLocation: "",
    moveDate: "",
    familySize: "",
    budget: "",
    priorities: [] as string[]
  });
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [showJourneyButton, setShowJourneyButton] = useState(false);

  const priorityOptions = [
    "Cost savings",
    "Speed of move", 
    "Professional handling",
    "Minimal disruption",
    "Full-service experience",
    "DIY approach"
  ];

  const generatePlan = useMutation({
    mutationFn: async (queryData: RelocationQuery) => {
      const response = await apiRequest("POST", "/api/ai-recommendations", queryData);
      return await response.json();
    },
    onSuccess: async (data: AIResponse) => {
      setAiResponse(data);
      
      // Create moving project with AI data
      try {
        const projectData = {
          userId: 1, // Default user ID for now
          fromAddress: relocationDetails.fromLocation,
          toAddress: relocationDetails.toLocation,
          moveDate: relocationDetails.moveDate,
          homeSize: relocationDetails.familySize,
          budget: relocationDetails.budget,
          priorities: relocationDetails.priorities.join(', '),
          aiGenerated: true,
          aiSummary: data.summary,
          aiTimeline: JSON.stringify(data.timeline),
          aiActionPlan: JSON.stringify(data.actionPlan)
        };

        const projectResponse = await apiRequest("POST", "/api/moving-project", projectData);
        const project = await projectResponse.json();
        
        // Create project tasks from AI action plan
        for (const action of data.actionPlan) {
          await apiRequest("POST", "/api/project-task", {
            projectId: project.project.id,
            title: action.title,
            description: action.description,
            priority: action.priority,
            status: action.status,
            timeframe: action.timeframe,
            taskType: action.route.replace('/', '') || 'general'
          });
        }

        // Save data for journey integration
        localStorage.setItem('currentProjectId', project.project.id.toString());
        localStorage.setItem('aiTimeline', JSON.stringify(data.timeline));
        localStorage.setItem('aiActionPlan', JSON.stringify(data.actionPlan));
        localStorage.setItem('aiFromLocation', relocationDetails.fromLocation);
        localStorage.setItem('aiToLocation', relocationDetails.toLocation);
        localStorage.setItem('aiMoveDate', relocationDetails.moveDate);
        
        toast({
          title: "Moving Project Created", 
          description: "Your AI-powered relocation plan is now active in your journey!",
        });
        
        // Show success message with journey link
        setShowJourneyButton(true);
      } catch (error) {
        console.error('Failed to create moving project:', error);
        // Fallback to localStorage only
        localStorage.setItem('aiTimeline', JSON.stringify(data.timeline));
        localStorage.setItem('aiActionPlan', JSON.stringify(data.actionPlan));
        localStorage.setItem('aiFromLocation', relocationDetails.fromLocation);
        localStorage.setItem('aiToLocation', relocationDetails.toLocation);
        localStorage.setItem('aiMoveDate', relocationDetails.moveDate);
        
        toast({
          title: "Plan Generated",
          description: "Your personalized relocation strategy is ready!",
        });
      }
    },
    onError: (error) => {
      console.error("Error generating plan:", error);
      toast({
        title: "Error",
        description: "Failed to generate relocation plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePriorityChange = (priority: string, checked: boolean) => {
    setRelocationDetails(prev => ({
      ...prev,
      priorities: checked
        ? [...prev.priorities, priority]
        : prev.priorities.filter(p => p !== priority)
    }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryData = {
      query,
      ...relocationDetails
    };
    generatePlan.mutate(queryData);
  };

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getTaskIcon = (task: string) => {
    const taskLower = task.toLowerCase();
    if (taskLower.includes('mover') || taskLower.includes('moving') || taskLower.includes('truck')) return Truck;
    if (taskLower.includes('internet') || taskLower.includes('wifi') || taskLower.includes('cable')) return Wifi;
    if (taskLower.includes('electric') || taskLower.includes('power') || taskLower.includes('utility')) return Zap;
    if (taskLower.includes('phone') || taskLower.includes('mobile') || taskLower.includes('cellular')) return Phone;
    if (taskLower.includes('bank') || taskLower.includes('credit') || taskLower.includes('financial')) return CreditCard;
    if (taskLower.includes('document') || taskLower.includes('paperwork') || taskLower.includes('form')) return FileText;
    if (taskLower.includes('pack') || taskLower.includes('box') || taskLower.includes('storage')) return Package;
    if (taskLower.includes('school') || taskLower.includes('family') || taskLower.includes('children')) return Users;
    if (taskLower.includes('schedule') || taskLower.includes('timing') || taskLower.includes('calendar')) return Clock;
    if (taskLower.includes('research') || taskLower.includes('find') || taskLower.includes('search')) return Search;
    if (taskLower.includes('home') || taskLower.includes('house') || taskLower.includes('property')) return Home;
    if (taskLower.includes('office') || taskLower.includes('work') || taskLower.includes('business')) return Building;
    return CheckCircle2; // Default icon
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/moving-journey">
                <Button variant="ghost" size="sm" className="gap-2 text-blue-600 hover:text-blue-700">
                  View Journey
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Relocation Assistant</h1>
                <p className="text-sm text-gray-600">Create your personalized moving plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <svg 
              className="w-12 h-12 mr-3" 
              viewBox="0 0 48 48" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* AI Brain Core */}
              <circle cx="24" cy="24" r="16" fill="url(#brainGradient)" stroke="#1e40af" strokeWidth="2"/>
              
              {/* Neural Network Connections */}
              <g stroke="#3b82f6" strokeWidth="1.5" opacity="0.8">
                <path d="M12 18 L20 14 L28 18 L36 14" fill="none" strokeLinecap="round"/>
                <path d="M12 30 L20 34 L28 30 L36 34" fill="none" strokeLinecap="round"/>
                <path d="M16 24 L32 24" fill="none" strokeLinecap="round"/>
              </g>
              
              {/* Neural Nodes */}
              <circle cx="12" cy="18" r="2" fill="#1e40af"/>
              <circle cx="20" cy="14" r="2" fill="#3b82f6"/>
              <circle cx="28" cy="18" r="2" fill="#1e40af"/>
              <circle cx="36" cy="14" r="2" fill="#3b82f6"/>
              <circle cx="16" cy="24" r="2" fill="#60a5fa"/>
              <circle cx="32" cy="24" r="2" fill="#60a5fa"/>
              <circle cx="12" cy="30" r="2" fill="#1e40af"/>
              <circle cx="20" cy="34" r="2" fill="#3b82f6"/>
              <circle cx="28" cy="30" r="2" fill="#1e40af"/>
              <circle cx="36" cy="34" r="2" fill="#3b82f6"/>
              
              {/* Central Processing Unit */}
              <rect x="20" y="20" width="8" height="8" rx="2" fill="#ffffff" stroke="#1e40af" strokeWidth="1.5"/>
              <circle cx="22" cy="22" r="1" fill="#1e40af"/>
              <circle cx="26" cy="22" r="1" fill="#1e40af"/>
              <circle cx="22" cy="26" r="1" fill="#3b82f6"/>
              <circle cx="26" cy="26" r="1" fill="#3b82f6"/>
              
              {/* Gradient Definition */}
              <defs>
                <radialGradient id="brainGradient" cx="0.3" cy="0.3">
                  <stop offset="0%" stopColor="#dbeafe"/>
                  <stop offset="100%" stopColor="#bfdbfe"/>
                </radialGradient>
              </defs>
            </svg>
            <h1 className="text-3xl font-bold text-gray-900">AI Relocation Concierge</h1>
          </div>
          <p className="text-lg text-gray-600">Get your personalized moving strategy and action plan</p>
        </div>

        {!aiResponse ? (
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your move</CardTitle>
              <CardDescription>
                The more details you provide, the better we can plan your relocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="query">What specific help do you need with your move?</Label>
                  <Textarea
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="I'm moving for a new job and need help with timing, finding movers, and setting up utilities..."
                    className="mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromLocation">Current Address *</Label>
                    <Input
                      id="fromLocation"
                      value={relocationDetails.fromLocation}
                      onChange={(e) => setRelocationDetails(prev => ({ ...prev, fromLocation: e.target.value }))}
                      placeholder="123 Main St, Dallas, TX 75201"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="toLocation">Moving To *</Label>
                    <Input
                      id="toLocation"
                      value={relocationDetails.toLocation}
                      onChange={(e) => setRelocationDetails(prev => ({ ...prev, toLocation: e.target.value }))}
                      placeholder="456 Oak Ave, Austin, TX 78701"
                      required
                    />
                  </div>
                </div>

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
                    <Input
                      id="familySize"
                      value={relocationDetails.familySize}
                      onChange={(e) => setRelocationDetails(prev => ({ ...prev, familySize: e.target.value }))}
                      placeholder="2 adults, 1 child"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Moving Budget</Label>
                    <Input
                      id="budget"
                      value={relocationDetails.budget}
                      onChange={(e) => setRelocationDetails(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="$3,000 - $5,000"
                    />
                  </div>
                </div>

                <div>
                  <Label>What's most important to you? (Select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {priorityOptions.map((priority) => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={priority}
                          checked={relocationDetails.priorities.includes(priority)}
                          onCheckedChange={(checked) => handlePriorityChange(priority, checked as boolean)}
                        />
                        <Label htmlFor={priority} className="text-sm">{priority}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={generatePlan.isPending}
                  className="w-full"
                  size="lg"
                >
                  {generatePlan.isPending ? "Creating Your Plan..." : "Generate My Relocation Plan"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Plan Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  Your Strategic Relocation Plan
                </CardTitle>
                <CardDescription>
                  Your personalized moving strategy and roadmap
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                  <h4 className="font-semibold text-blue-900 mb-3">Strategic Overview</h4>
                  <p className="text-blue-900 leading-relaxed mb-4">{aiResponse.summary}</p>
                  
                  {/* Move Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <MapPin className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <div className="text-xs text-blue-700 font-medium">From</div>
                      <div className="text-sm text-blue-900 truncate">{relocationDetails.fromLocation}</div>
                    </div>
                    <div className="text-center">
                      <MapPin className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <div className="text-xs text-blue-700 font-medium">To</div>
                      <div className="text-sm text-blue-900 truncate">{relocationDetails.toLocation}</div>
                    </div>
                    <div className="text-center">
                      <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <div className="text-xs text-blue-700 font-medium">Move Date</div>
                      <div className="text-sm text-blue-900">{relocationDetails.moveDate || 'Flexible'}</div>
                    </div>
                    <div className="text-center">
                      <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <div className="text-xs text-blue-700 font-medium">Budget</div>
                      <div className="text-sm text-blue-900">{relocationDetails.budget || 'Not specified'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-lg font-bold text-blue-800">
                    <DollarSign className="w-5 h-5" />
                    Estimated Total Cost: {aiResponse.estimatedTotalCost}
                  </div>
                </div>
              </CardContent>
            </Card>





            <div className="text-center mt-6">
              <Link href="/moving-journey">
                <div className="w-full max-w-md mx-auto p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <MapPin className="w-8 h-8 text-blue-600" />
                    <div className="text-xl font-semibold text-gray-800">Your Moving Journey Awaits</div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Click any road sign to execute tasks → Find movers → Set up utilities → Complete your move
                  </p>
                </div>
              </Link>
            </div>


          </div>
        )}
      </div>
    </div>
  );
}