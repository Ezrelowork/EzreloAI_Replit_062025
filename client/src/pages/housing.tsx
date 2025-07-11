import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search, Phone, Globe, Star, MapPin, DollarSign, Home, CheckCircle, Building, Users, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface HousingService {
  category: string;
  provider: string;
  phone: string;
  description: string;
  website: string;
  referralUrl: string;
  services: string[];
  estimatedCost: string;
  rating: number;
  specialties: string[];
  availability?: string;
  licenseInfo?: string;
  serviceAreas?: string[];
  experience?: string;
  certifications?: string[];
}

export default function Housing() {
  const [, setLocation] = useLocation();
  const [providers, setProviders] = useState<HousingService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [hasCompletedActions, setHasCompletedActions] = useState(false);
  const { toast } = useToast();

  // Load location from URL params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from') || localStorage.getItem('aiFromLocation') || '';
    const toParam = urlParams.get('to') || localStorage.getItem('aiToLocation') || '';
    
    // Use destination for housing search
    if (toParam) {
      setSearchLocation(toParam);
      handleSearch(toParam);
    }
  }, []);

  const canCompleteTask = () => {
    return hasCompletedActions && providers.length > 0;
  };

  const handleSearch = async (location = searchLocation) => {
    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to search for housing services.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/search-housing-services', {
        location: location.trim(),
        serviceTypes: ['real_estate', 'property_management', 'home_inspection', 'mortgage', 'title_company']
      });
      
      if (response.ok) {
        const data = await response.json();
        setProviders(data.services || []);
        setShowResults(true);
        setHasCompletedActions(true); // Mark search as completed action
      }
    } catch (error) {
      console.error('Housing search error:', error);
      toast({
        title: "Search Error",
        description: "Unable to find housing services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderClick = (provider: HousingService) => {
    setHasCompletedActions(true); // Mark provider interaction
    
    // Track referral click
    apiRequest('POST', '/api/track-referral', {
      provider: provider.provider,
      category: provider.category,
      action: 'provider_click',
      referralUrl: provider.referralUrl
    }).catch(console.error);

    if (provider.referralUrl && provider.referralUrl !== '#') {
      window.open(provider.referralUrl, '_blank');
    } else if (provider.website) {
      window.open(provider.website, '_blank');
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('real') || cat.includes('estate')) return Home;
    if (cat.includes('mortgage') || cat.includes('loan')) return DollarSign;
    if (cat.includes('inspection')) return Search;
    if (cat.includes('property') || cat.includes('management')) return Building;
    if (cat.includes('title')) return Building;
    return Home;
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('real') || cat.includes('estate')) return 'bg-blue-100 text-blue-800';
    if (cat.includes('mortgage') || cat.includes('loan')) return 'bg-green-100 text-green-800';
    if (cat.includes('inspection')) return 'bg-orange-100 text-orange-800';
    if (cat.includes('property') || cat.includes('management')) return 'bg-purple-100 text-purple-800';
    if (cat.includes('title')) return 'bg-gray-100 text-gray-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const from = urlParams.get('from');
                  const to = urlParams.get('to');
                  const date = urlParams.get('date');
                  
                  let journeyUrl = '/moving-journey';
                  if (from || to || date) {
                    const params = new URLSearchParams();
                    if (from) params.set('from', from);
                    if (to) params.set('to', to);
                    if (date) params.set('date', date);
                    journeyUrl += `?${params.toString()}`;
                  }
                  
                  window.location.href = journeyUrl;
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Journey
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Housing Services</h1>
                <p className="text-gray-600">Find real estate agents, mortgage lenders, inspectors, and more</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Search Housing Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter your destination city..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={() => handleSearch()}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </div>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find Services
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Finding housing services in your area...</p>
          </div>
        )}

        {/* Results */}
        {showResults && !isLoading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Found {providers.length} Housing Services in {searchLocation}
              </h2>
              <Button variant="outline" onClick={() => handleSearch()}>
                Search Again
              </Button>
            </div>

            {providers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Found</h3>
                  <p className="text-gray-600">Try searching a different location or check back later.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {providers.map((provider, index) => {
                  const IconComponent = getCategoryIcon(provider.category);
                  
                  return (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <IconComponent className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold">{provider.provider}</h3>
                                <Badge className={getCategoryColor(provider.category)}>
                                  {provider.category}
                                </Badge>
                              </div>
                              {provider.rating > 0 && (
                                <div className="flex items-center gap-1 mb-2">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">{provider.rating.toFixed(1)}</span>
                                </div>
                              )}
                              <p className="text-gray-600 mb-3">{provider.description}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600 mb-1">
                              {provider.estimatedCost}
                            </div>
                            {provider.availability && (
                              <div className="text-sm text-gray-500">
                                {provider.availability}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Specialties */}
                        {provider.specialties && provider.specialties.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Specialties:</h4>
                            <div className="flex flex-wrap gap-1">
                              {provider.specialties.slice(0, 4).map((specialty, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {provider.specialties.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{provider.specialties.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Services */}
                        {provider.services && provider.services.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
                            <div className="flex flex-wrap gap-1">
                              {provider.services.slice(0, 4).map((service, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                              {provider.services.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{provider.services.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                              {provider.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  <span>{provider.phone}</span>
                                </div>
                              )}
                            </div>
                            {provider.website && provider.website !== `https://www.google.com/search?q=${encodeURIComponent(provider.provider)}` && (
                              <div className="flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                <a 
                                  href={provider.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                  onClick={() => setHasCompletedActions(true)}
                                >
                                  {provider.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </a>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {provider.phone && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  window.open(`tel:${provider.phone}`, '_self');
                                  setHasCompletedActions(true); // Mark progress for phone calls
                                }}
                              >
                                Call Now
                              </Button>
                            )}
                            <Button 
                              size="sm"
                              onClick={() => handleProviderClick(provider)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Get Quote
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!showResults && !isLoading && (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to Find Housing Services?</h2>
            <p className="text-gray-600 mb-6">
              Search for real estate agents, mortgage lenders, home inspectors, and other housing professionals in your destination area.
            </p>
            <Button 
              onClick={() => handleSearch()}
              disabled={!searchLocation.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Search
            </Button>
          </div>
        )}

        {/* Task Completion Bar */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-lg shadow-lg border p-4 flex items-center gap-4">
            <Button
              onClick={() => {
                if (canCompleteTask()) {
                  toast({
                    title: "Housing Task Completed!",
                    description: "Returning to your moving journey...",
                  });
                  
                  // Zoom back to journey page with preserved context
                  setTimeout(() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const from = urlParams.get('from');
                    const to = urlParams.get('to');
                    const date = urlParams.get('date');
                    
                    let journeyUrl = '/moving-journey';
                    if (from || to || date) {
                      const params = new URLSearchParams();
                      if (from) params.set('from', from);
                      if (to) params.set('to', to);
                      if (date) params.set('date', date);
                      journeyUrl += `?${params.toString()}`;
                    }
                    
                    window.location.href = journeyUrl;
                  }, 1000);
                }
              }}
              disabled={!canCompleteTask()}
              className={`font-medium py-2 px-6 rounded-lg text-sm shadow-sm transition-all ${
                canCompleteTask() 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {canCompleteTask() ? "Complete Housing Setup" : "Research Services First"}
            </Button>
            
            <Button
              onClick={() => {
                const urlParams = new URLSearchParams(window.location.search);
                const from = urlParams.get('from');
                const to = urlParams.get('to');
                const date = urlParams.get('date');
                
                let journeyUrl = '/moving-journey';
                if (from || to || date) {
                  const params = new URLSearchParams();
                  if (from) params.set('from', from);
                  if (to) params.set('to', to);
                  if (date) params.set('date', date);
                  journeyUrl += `?${params.toString()}`;
                }
                
                window.location.href = journeyUrl;
              }}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50 font-medium py-2 px-4 rounded-lg text-sm shadow-sm transition-all"
            >
              Return to Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}