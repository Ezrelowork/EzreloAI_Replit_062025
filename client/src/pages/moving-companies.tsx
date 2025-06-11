import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
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
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MovingCompany {
  id: string;
  name: string;
  description: string;
  phone: string;
  website: string;
  rating: number;
  services: string[];
  estimatedCost: string;
  specialties: string[];
  hours: string;
  location: string;
  licenseInfo: string;
  insuranceOptions: string[];
}

export default function MovingCompanies() {
  const { toast } = useToast();
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [quotesRequested, setQuotesRequested] = useState<Set<string>>(new Set());

  // Static moving companies data
  const movingCompanies: MovingCompany[] = [
    {
      id: "atlas-van-lines",
      name: "Atlas Van Lines",
      description: "Full-service moving company with nationwide coverage and professional packing services",
      phone: "(800) 252-8885",
      website: "https://www.atlasvanlines.com",
      rating: 4.2,
      services: ["Local Moving", "Long Distance", "International", "Packing", "Storage"],
      estimatedCost: "$2,800 - $4,500",
      specialties: ["Corporate Relocation", "Military Moves", "Senior Moving"],
      hours: "Mon-Fri 8AM-6PM, Sat 9AM-4PM",
      location: "Nationwide Service",
      licenseInfo: "USDOT #125550, MC-87113",
      insuranceOptions: ["Basic Coverage", "Full Value Protection", "Third-Party Insurance"]
    },
    {
      id: "united-van-lines",
      name: "United Van Lines",
      description: "America's largest household goods mover with comprehensive moving solutions",
      phone: "(800) 325-3870",
      website: "https://www.unitedvanlines.com",
      rating: 4.1,
      services: ["Residential Moving", "Corporate Relocation", "International", "Storage", "Vehicle Transport"],
      estimatedCost: "$3,200 - $5,200",
      specialties: ["High-Value Items", "Piano Moving", "Auto Transport"],
      hours: "Mon-Fri 7AM-7PM, Sat 8AM-5PM",
      location: "Nationwide Service",
      licenseInfo: "USDOT #077949, MC-67132",
      insuranceOptions: ["Released Value", "Full Value Protection", "Separate Liability Coverage"]
    },
    {
      id: "mayflower-transit",
      name: "Mayflower Transit",
      description: "Trusted moving company with over 90 years of experience in residential and commercial moves",
      phone: "(800) 428-1146",
      website: "https://www.mayflower.com",
      rating: 4.0,
      services: ["Household Moving", "Corporate Services", "International", "Specialty Items", "Storage Solutions"],
      estimatedCost: "$2,600 - $4,200",
      specialties: ["Antique Moving", "Fine Art", "Government Moves"],
      hours: "Mon-Fri 8AM-6PM, Sat 9AM-3PM",
      location: "Nationwide Service",
      licenseInfo: "USDOT #125563, MC-87113",
      insuranceOptions: ["Basic Protection", "Full Replacement Value", "High Value Article Coverage"]
    },
    {
      id: "north-american",
      name: "North American Van Lines",
      description: "Premium moving services with personalized moving consultants and quality assurance",
      phone: "(800) 348-2111",
      website: "https://www.northamerican.com",
      rating: 4.3,
      services: ["Residential Moving", "Corporate Relocation", "International Moving", "Storage", "Logistics"],
      estimatedCost: "$3,000 - $4,800",
      specialties: ["Executive Moving", "Lab & Medical Equipment", "Trade Shows"],
      hours: "Mon-Fri 8AM-7PM, Sat 9AM-4PM",
      location: "Nationwide Service",
      licenseInfo: "USDOT #070851, MC-67112",
      insuranceOptions: ["Released Value", "Full Value Protection", "Separate Liability Insurance"]
    },
    {
      id: "allied-van-lines",
      name: "Allied Van Lines",
      description: "Comprehensive moving services with a network of professional agents nationwide",
      phone: "(800) 689-8684",
      website: "https://www.allied.com",
      rating: 4.1,
      services: ["Local & Long Distance", "International", "Corporate Moving", "Storage", "Specialty Services"],
      estimatedCost: "$2,700 - $4,400",
      specialties: ["Military Relocations", "Senior Moving", "Student Moving"],
      hours: "Mon-Fri 8AM-6PM, Sat 9AM-5PM",
      location: "Nationwide Service",
      licenseInfo: "USDOT #076235, MC-67118",
      insuranceOptions: ["Basic Coverage", "Full Value Protection", "Third-Party Coverage"]
    },
    {
      id: "two-men-truck",
      name: "TWO MEN AND A TRUCK",
      description: "Local and long-distance moving with a focus on customer service and care",
      phone: "(800) 345-1070",
      website: "https://www.twomenandatruck.com",
      rating: 4.4,
      services: ["Local Moving", "Long Distance", "Packing", "Storage", "Junk Removal"],
      estimatedCost: "$1,200 - $2,800",
      specialties: ["Apartment Moving", "Senior Moving", "Business Moving"],
      hours: "Mon-Sat 8AM-6PM, Sun 10AM-4PM",
      location: "Multiple Locations",
      licenseInfo: "Varies by Location",
      insuranceOptions: ["Basic Protection", "Full Value Coverage", "Additional Insurance Available"]
    }
  ];

  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  };

  const handleRequestQuote = (company: MovingCompany) => {
    setQuotesRequested(prev => {
      const newSet = new Set(prev);
      newSet.add(company.id);
      return newSet;
    });

    toast({
      title: "Quote Requested",
      description: `Quote request sent to ${company.name}`,
    });

    // Open company website in new tab
    window.open(company.website, '_blank');
  };

  const handleVisitWebsite = (company: MovingCompany) => {
    window.open(company.website, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/moving-journey">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Journey
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Truck className="w-6 h-6 text-blue-600" />
                <span className="text-sm text-gray-500 font-medium">Moving Companies</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                {selectedCompanies.size} Selected
              </Badge>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Home
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Professional Moving Companies</h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Compare trusted moving companies with nationwide service. Get quotes, read reviews, and choose the best mover for your relocation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Moving Companies List */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {movingCompanies.map((company) => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Truck className="w-5 h-5 text-blue-600" />
                          {company.name}
                        </CardTitle>
                        <CardDescription className="mt-2">{company.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{company.rating}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Company Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{company.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{company.hours}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>{company.estimatedCost}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{company.location}</span>
                      </div>
                    </div>

                    {/* Services */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Services</div>
                      <div className="flex flex-wrap gap-2">
                        {company.services.map((service, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{service}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Specialties */}
                    {company.specialties.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Specialties</div>
                        <div className="flex flex-wrap gap-2">
                          {company.specialties.map((specialty, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{specialty}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* License Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">License Information</div>
                      <div className="text-sm text-gray-600">{company.licenseInfo}</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleRequestQuote(company)}
                        className="flex-1"
                        variant={quotesRequested.has(company.id) ? "secondary" : "default"}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {quotesRequested.has(company.id) ? "Quote Requested" : "Get Quote"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleVisitWebsite(company)}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Website
                      </Button>
                      <Button 
                        onClick={() => handleSelectCompany(company.id)}
                        variant={selectedCompanies.has(company.id) ? "default" : "outline"}
                        className={selectedCompanies.has(company.id) ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {selectedCompanies.has(company.id) ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}