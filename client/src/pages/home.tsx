import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSearchSchema, type AddressSearch, type ServiceProvidersData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  success: boolean;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  providers: ServiceProvidersData;
}

export default function Home() {
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();

  const form = useForm<AddressSearch>({
    resolver: zodResolver(addressSearchSchema),
    defaultValues: {
      address: "",
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (data: AddressSearch) => {
      const response = await apiRequest("POST", "/api/search", data);
      return response.json();
    },
    onSuccess: (data: SearchResult) => {
      setSearchResult(data);
      setTimeout(() => {
        const resultsSection = document.getElementById("results-section");
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    },
    onError: (error: any) => {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: error.message || "Unable to search for services. Please try again.",
      });
    },
  });

  const onSubmit = (data: AddressSearch) => {
    const address = data.address.trim();
    
    const isZipOnly = /^\d{5}(-\d{4})?$/.test(address);
    if (isZipOnly) {
      toast({
        variant: "destructive",
        title: "Incomplete Address",
        description: "Please enter your full address (street, city, state) for better results.",
      });
      return;
    }

    searchMutation.mutate(data);
  };

  const getServiceIcon = (category: string) => {
    const icons = {
      Electricity: "fas fa-bolt",
      Gas: "fas fa-fire",
      Water: "fas fa-tint", 
      Internet: "fas fa-wifi",
      Trash: "fas fa-trash-alt",
      Phone: "fas fa-phone",
      Healthcare: "fas fa-heartbeat",
      "Home Services": "fas fa-home",
    };
    return icons[category as keyof typeof icons] || "fas fa-circle";
  };

  const getServiceColor = (category: string) => {
    const colors = {
      Electricity: "bg-yellow-100 text-yellow-600",
      Gas: "bg-orange-100 text-orange-600", 
      Water: "bg-blue-100 text-blue-600",
      Internet: "bg-purple-100 text-purple-600",
      Trash: "bg-green-100 text-green-600",
      Phone: "bg-pink-100 text-pink-600",
      Healthcare: "bg-red-100 text-red-600",
      "Home Services": "bg-gray-100 text-gray-600",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  const normalizeWebsiteUrl = (website: string): string | null => {
    if (!website || typeof website !== 'string') return null;
    
    // Clean up the website string - take only the first valid URL if multiple exist
    const cleanWebsite = website.split(',')[0].split(' ')[0].trim();
    
    // Remove any protocol prefix and add https
    const cleanUrl = cleanWebsite.replace(/^https?:\/\//, '');
    
    // Validate it's a reasonable URL format
    if (cleanUrl.includes('.') && !cleanUrl.includes(' ')) {
      return `https://${cleanUrl}`;
    }
    
    return null;
  };

  const trackReferralClick = async (provider: any, category: string, action: string) => {
    try {
      const userAddress = searchResult?.address || '';
      await fetch('/api/referral-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.provider,
          category,
          action,
          userAddress,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to track referral:', error);
    }
  };

  const handleSignUp = (category: string, provider: any) => {
    // Track the referral click for monetization
    trackReferralClick(provider, category, 'signup');

    // Use referral URL if available, otherwise fall back to regular website
    const targetUrl = provider.referralUrl || provider.website;
    
    if (targetUrl) {
      const website = normalizeWebsiteUrl(targetUrl);
      if (website) {
        window.open(website, '_blank', 'noopener,noreferrer');
      } else {
        toast({
          title: `Contact ${provider.provider}`,
          description: `Call ${provider.phone} to sign up for ${category.toLowerCase()} service.`,
        });
      }
    } else {
      // Show contact information for manual signup
      toast({
        title: `Contact ${provider.provider}`,
        description: `Call ${provider.phone} to sign up for ${category.toLowerCase()} service.`,
      });
    }
  };

  const handleGetQuote = (category: string, provider: any) => {
    // Track the referral click for monetization
    trackReferralClick(provider, category, 'quote');

    // For quote requests, show contact information
    const cleanWebsite = provider.website ? provider.website.split(',')[0].trim() : null;
    const message = cleanWebsite
      ? `Visit ${cleanWebsite} or call ${provider.phone} for a quote on ${category.toLowerCase()} service.`
      : `Call ${provider.phone} for a quote on ${category.toLowerCase()} service.`;
    
    toast({
      title: `Get Quote from ${provider.provider}`,
      description: message,
    });

    // Use referral URL if available, otherwise fall back to regular website
    const targetUrl = provider.referralUrl || provider.website;
    if (targetUrl) {
      const website = normalizeWebsiteUrl(targetUrl);
      if (website) {
        window.open(website, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleLearnMore = (category: string, provider: any) => {
    // Track the referral click for monetization
    trackReferralClick(provider, category, 'learn_more');

    // Show detailed information about the provider
    const cleanWebsite = provider.website ? provider.website.split(',')[0].trim() : null;
    const details = [
      `Provider: ${provider.provider}`,
      `Phone: ${provider.phone}`,
      cleanWebsite ? `Website: ${cleanWebsite}` : null,
      provider.hours ? `Hours: ${provider.hours}` : null,
      `Service: ${provider.description}`
    ].filter(Boolean).join('\n');

    toast({
      title: `${category} Service Details`,
      description: details,
    });

    // Use referral URL if available, otherwise fall back to regular website
    const targetUrl = provider.referralUrl || provider.website;
    if (targetUrl) {
      const website = normalizeWebsiteUrl(targetUrl);
      if (website) {
        window.open(website, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" id="top">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-primary">Ezrelo</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#how-it-works" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200">
                How It Works
              </a>
              <a href="#services" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200">
                Services
              </a>
              <a href="#features" className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200">
                Features
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Relocate <span className="text-primary">Intelligently</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Enter your new address and let Ezrelo find and set up all the essential services you need for a seamless move.
            </p>
            
            {/* Address Search Form */}
            <div className="max-w-2xl mx-auto mb-12">
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-map-marker-alt text-gray-400"></i>
                  </div>
                  <Input
                    {...form.register("address")}
                    placeholder="Enter your full address (e.g., 123 Main St, New York, NY 10001)"
                    className="pl-12 pr-4 py-4 text-lg h-auto rounded-xl"
                    disabled={searchMutation.isPending}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={searchMutation.isPending}
                  className="py-4 px-8 text-lg h-auto rounded-xl min-w-[160px]"
                >
                  {searchMutation.isPending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      Find Services
                      <i className="fas fa-search ml-2"></i>
                    </>
                  )}
                </Button>
              </form>
              
              {form.formState.errors.address && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <i className="fas fa-exclamation-triangle text-red-600"></i>
                  <AlertDescription className="text-red-700">
                    {form.formState.errors.address.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* Service Highlights */}
            <div className="flex flex-wrap justify-center gap-6 text-primary">
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle"></i>
                <span className="font-medium">Utilities</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle"></i>
                <span className="font-medium">Internet</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle"></i>
                <span className="font-medium">Healthcare</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle"></i>
                <span className="font-medium">Home Services</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchResult && (
        <section id="results-section" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Results Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Services Available at:
              </h2>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-2">
                  <i className="fas fa-map-marker-alt text-primary"></i>
                  <span className="text-xl font-medium text-gray-900">
                    {searchResult.address}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="mb-16">
              <div className="flex items-center justify-center mb-8">
                <div className="bg-primary/10 rounded-full p-3 mr-3">
                  <i className="fas fa-robot text-primary text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">AI Recommendations</h3>
              </div>
              <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
                Based on your location, here are the service providers available in your area.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(searchResult.providers).slice(0, 3).map(([category, provider]) => (
                  <Card key={category} className="hover:shadow-lg transition-shadow duration-200 border-primary/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className={`rounded-full p-3 ${getServiceColor(category)}`}>
                          <i className={`${getServiceIcon(category)} text-xl`}></i>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                          Available
                        </span>
                      </div>
                      <CardTitle className="text-lg">{provider.provider}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-3">{provider.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{category}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleLearnMore(category, provider)}
                        >
                          Learn More <i className="fas fa-arrow-right ml-1"></i>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Service Providers List */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                All Available Service Providers
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Object.entries(searchResult.providers).map(([category, provider]) => (
                  <Card key={category} className="hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`rounded-full p-3 flex-shrink-0 ${getServiceColor(category)}`}>
                          <i className={`${getServiceIcon(category)} text-xl`}></i>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xl font-semibold text-gray-900">{category}</h4>
                            <span className="text-sm text-gray-500">Essential</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{provider.provider}</span>
                              <span className="text-green-600 text-sm font-medium">Available</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{provider.description}</p>
                            <div className="space-y-1 mb-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <i className="fas fa-phone mr-2 text-gray-400"></i>
                                <a 
                                  href={`tel:${provider.phone}`}
                                  className="text-primary hover:underline"
                                >
                                  {provider.phone}
                                </a>
                              </div>
                              {provider.website && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <i className="fas fa-globe mr-2 text-gray-400"></i>
                                  <a 
                                    href={normalizeWebsiteUrl(provider.website) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {provider.website.split(',')[0].trim()}
                                  </a>
                                </div>
                              )}
                              {provider.hours && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <i className="fas fa-clock mr-2 text-gray-400"></i>
                                  <span>{provider.hours}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                className="flex-1"
                                onClick={() => handleSignUp(category, provider)}
                              >
                                Sign Up
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => handleGetQuote(category, provider)}
                              >
                                Get Quote
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Ezrelo Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Setting up services in your new home has never been easier. Our AI-powered platform simplifies the entire process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-6">
                  <i className="fas fa-map-marker-alt text-2xl"></i>
                </div>
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mb-4 mx-auto">1</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Enter Your Address</h3>
                <p className="text-gray-600">
                  Simply enter your new full address. Our AI will identify your location and analyze available services in your area using real-time data.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-6">
                  <i className="fas fa-search text-2xl"></i>
                </div>
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mb-4 mx-auto">2</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Compare Providers</h3>
                <p className="text-gray-600">
                  Review and compare service providers available in your area, with pricing and features clearly displayed.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-6">
                  <i className="fas fa-check-circle text-2xl"></i>
                </div>
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mb-4 mx-auto">3</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Set Up Services</h3>
                <p className="text-gray-600">
                  Choose the services you want and sign up directly through our platform. We'll handle the rest.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Services We Help You Set Up
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to make your new house feel like home.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <i className="fas fa-wifi text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Internet</h3>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <i className="fas fa-bolt text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Electricity</h3>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <i className="fas fa-tint text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Water</h3>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <i className="fas fa-mobile-alt text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Phone</h3>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <i className="fas fa-heartbeat text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Healthcare</h3>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <i className="fas fa-home text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Home Services</h3>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <i className="fas fa-paw text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Veterinarians</h3>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <i className="fas fa-plus text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">And More</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Additional Features
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Ezrelo offers more than just service connections.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="text-blue-600 mb-4">
                  <i className="fas fa-tasks text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Moving Checklists</h3>
                <p className="text-gray-600 mb-4">Comprehensive checklists to ensure you don't forget anything during your move.</p>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Pre-move planning</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Moving day tasks</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Post-move setup</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="text-blue-600 mb-4">
                  <i className="fas fa-envelope text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Change of Address</h3>
                <p className="text-gray-600 mb-4">Easily update your address with important services and organizations.</p>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Postal service</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Subscription updates</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Account notifications</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-8">
                <div className="text-blue-600 mb-4">
                  <i className="fas fa-map-marked-alt text-4xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Neighborhood Information</h3>
                <p className="text-gray-600 mb-4">Comprehensive details about your new neighborhood to help you feel at home.</p>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Local attractions</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>School ratings</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Community resources</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-6">
            Ready to simplify your move?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Enter your address and let Ezrelo handle the rest. Setting up your new home has never been easier.
          </p>
          <Button 
            onClick={() => {
              const topElement = document.getElementById('top');
              if (topElement) {
                topElement.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="bg-white text-primary hover:bg-gray-50"
            size="lg"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Ezrelo</h3>
              <p className="text-gray-400">AI-powered relocation assistance to simplify your move and help you set up essential services.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Utilities</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Healthcare</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Home Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pet Services</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Moving Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Checklists</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partnerships</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Ezrelo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}