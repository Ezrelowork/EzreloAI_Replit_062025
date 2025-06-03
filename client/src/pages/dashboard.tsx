import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Wrench
} from "lucide-react";

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

export default function Dashboard() {
  const [selectedPhase, setSelectedPhase] = useState("pre-move");

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
          description: "Find and book professional movers",
          icon: Truck,
          status: "in_progress",
          urgency: "high",
          route: "/moving-checklist",
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Relocation Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your progress and manage all relocation tasks</p>
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
      </div>
    </div>
  );
}