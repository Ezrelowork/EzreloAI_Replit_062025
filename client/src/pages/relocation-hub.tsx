import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Truck, 
  Zap, 
  Wifi, 
  Droplets, 
  Stethoscope, 
  PawPrint, 
  Wrench, 
  GraduationCap, 
  Building,
  ChevronRight,
  CheckCircle,
  Clock,
  Calendar
} from "lucide-react";
import { Link } from "wouter";

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

export default function RelocationHub() {
  const [selectedPhase, setSelectedPhase] = useState("planning");

  const relocationPhases: RelocationPhase[] = [
    {
      id: "planning",
      title: "Pre-Move Planning",
      description: "Essential planning and research before your move",
      timeframe: "8-4 weeks before",
      progress: 25,
      categories: [
        {
          id: "moving-companies",
          title: "Moving Services",
          description: "Professional movers, packing services, and moving supplies",
          icon: Truck,
          status: "completed",
          urgency: "high",
          route: "/moving-checklist",
          estimatedTime: "2-3 weeks to book"
        },
        {
          id: "address-change",
          title: "Address Changes",
          description: "Update address with government, banks, and subscriptions",
          icon: MapPin,
          status: "in_progress",
          urgency: "high",
          route: "/address-changes",
          estimatedTime: "1-2 weeks"
        },
        {
          id: "school-enrollment",
          title: "School & Education",
          description: "Research schools and handle enrollment transfers",
          icon: GraduationCap,
          status: "not_started",
          urgency: "high",
          route: "/education",
          estimatedTime: "3-4 weeks"
        }
      ]
    },
    {
      id: "utilities",
      title: "Essential Services Setup",
      description: "Connect utilities and essential home services",
      timeframe: "2-4 weeks before",
      progress: 60,
      categories: [
        {
          id: "electricity",
          title: "Electricity",
          description: "Connect power service at your new address",
          icon: Zap,
          status: "completed",
          urgency: "high",
          route: "/utilities?type=electricity",
          estimatedTime: "1-2 weeks"
        },
        {
          id: "internet",
          title: "Internet & Cable",
          description: "High-speed internet and cable TV services",
          icon: Wifi,
          status: "in_progress",
          urgency: "high",
          route: "/utilities?type=internet",
          estimatedTime: "2-3 weeks"
        },
        {
          id: "water",
          title: "Water & Sewer",
          description: "Municipal water and waste management services",
          icon: Droplets,
          status: "completed",
          urgency: "high",
          route: "/utilities?type=water",
          estimatedTime: "1 week"
        },
        {
          id: "waste",
          title: "Waste Management",
          description: "Garbage, recycling, and waste pickup services",
          icon: Building,
          status: "not_started",
          urgency: "medium",
          route: "/utilities?type=waste",
          estimatedTime: "1 week"
        }
      ]
    },
    {
      id: "settling",
      title: "Settling In",
      description: "Healthcare, home services, and local connections",
      timeframe: "Moving week & after",
      progress: 15,
      categories: [
        {
          id: "healthcare",
          title: "Healthcare Providers",
          description: "Find doctors, dentists, and medical specialists",
          icon: Stethoscope,
          status: "not_started",
          urgency: "medium",
          route: "/healthcare",
          estimatedTime: "2-4 weeks"
        },
        {
          id: "veterinary",
          title: "Pet Services",
          description: "Veterinarians and pet care services",
          icon: PawPrint,
          status: "not_started",
          urgency: "medium",
          route: "/pet-services",
          estimatedTime: "1-2 weeks"
        },
        {
          id: "home-services",
          title: "Home Services",
          description: "Contractors, maintenance, and home improvement",
          icon: Wrench,
          status: "not_started",
          urgency: "low",
          route: "/home-services",
          estimatedTime: "Ongoing"
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "border-l-red-500";
      case "medium": return "border-l-yellow-500";
      default: return "border-l-green-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle;
      case "in_progress": return Clock;
      default: return Calendar;
    }
  };

  const currentPhase = relocationPhases.find(phase => phase.id === selectedPhase);
  const overallProgress = Math.round(
    relocationPhases.reduce((sum, phase) => sum + phase.progress, 0) / relocationPhases.length
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Relocation Hub</h1>
              <p className="text-gray-600 mt-1">Your complete moving and settling-in command center</p>
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
                className="flex flex-col items-center p-4 h-auto data-[state=active]:bg-blue-50"
              >
                <div className="font-semibold text-sm">{phase.title}</div>
                <div className="text-xs text-gray-500 mt-1">{phase.timeframe}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={phase.progress} className="w-16 h-1" />
                  <span className="text-xs font-medium">{phase.progress}%</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Phase Content */}
          {relocationPhases.map((phase) => (
            <TabsContent key={phase.id} value={phase.id} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{phase.title}</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">{phase.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {phase.categories.map((category) => {
                  const StatusIcon = getStatusIcon(category.status);
                  const CategoryIcon = category.icon;
                  
                  return (
                    <Card 
                      key={category.id} 
                      className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${getUrgencyColor(category.urgency)}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <CategoryIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{category.title}</h3>
                              <Badge className={getStatusColor(category.status)}>
                                {category.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <StatusIcon className="w-5 h-5 text-gray-400" />
                        </div>

                        <p className="text-gray-600 text-sm mb-4">{category.description}</p>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <span>Est. time: {category.estimatedTime}</span>
                          <Badge variant="outline" className={
                            category.urgency === 'high' ? 'border-red-200 text-red-700' :
                            category.urgency === 'medium' ? 'border-yellow-200 text-yellow-700' :
                            'border-green-200 text-green-700'
                          }>
                            {category.urgency} priority
                          </Badge>
                        </div>

                        <Link href={category.route}>
                          <Button className="w-full" variant={category.status === 'completed' ? 'outline' : 'default'}>
                            {category.status === 'completed' ? 'Review & Update' : 
                             category.status === 'in_progress' ? 'Continue Setup' : 'Get Started'}
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/moving-checklist">
                <Button variant="outline" className="w-full">
                  <Truck className="w-4 h-4 mr-2" />
                  Moving Checklist
                </Button>
              </Link>
              <Link href="/utilities">
                <Button variant="outline" className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Setup Utilities
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline" className="w-full">
                  <Building className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
              <Button variant="outline" className="w-full">
                <MapPin className="w-4 h-4 mr-2" />
                Print Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}