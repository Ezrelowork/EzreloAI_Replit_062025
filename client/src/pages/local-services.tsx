import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Search, Phone, Globe, Star, MapPin, DollarSign, Heart, GraduationCap, CheckCircle, Building, Users, Car, ShoppingBag, Dumbbell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface LocalService {
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
  address?: string;
  hours?: string;
  insurance?: string[];
  ageGroups?: string[];
  programs?: string[];
}

export default function LocalServices() {
  const [, setLocation] = useLocation();
  const [providers, setProviders] = useState<LocalService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [hasCompletedActions, setHasCompletedActions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(50); // Increased from 5
  const [selectedProvider, setSelectedProvider] = useState<LocalService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // Load location from URL params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from') || localStorage.getItem('aiFromLocation') || '';
    const to = urlParams.get('to') || localStorage.getItem('aiToLocation') || '';

    // Use destination for local services search - prioritize URL params over localStorage
    const destinationAddress = to || localStorage.getItem('aiToLocation') || '';

    if (destinationAddress && destinationAddress !== 'undefined' && destinationAddress.trim() !== '') {
      console.log('Auto-filling destination address:', destinationAddress);
      setSearchLocation(destinationAddress);
    }
  }, []);

  const canCompleteTask = () => {
    return hasCompletedActions && providers.length > 0;
  };

  const handleSearch = async (location = searchLocation) => {
    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to search for local services.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCategory) {
      toast({
        title: "Select Services",
        description: "Please select a service category to search for.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/search-local-services', {
        location: location.trim(),
        serviceTypes: [selectedCategory]
      });

      if (response.ok) {
        const data = await response.json();
        // Limit to maximum 15 results and reset to page 1
        setProviders((data.services || []).slice(0, 15));
        setCurrentPage(1);
        setShowResults(true);
        setHasCompletedActions(true); // Mark search as completed action
      }
    } catch (error) {
      console.error('Local services search error:', error);
      toast({
        title: "Search Error",
        description: "Unable to find local services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderClick = (provider: LocalService) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
    setHasCompletedActions(true); // Mark provider interaction
  };

  const handleContactClick = (provider: LocalService) => {
    setHasCompletedActions(true);

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
    if (cat.includes('school') || cat.includes('education')) return GraduationCap;
    if (cat.includes('health') || cat.includes('medical') || cat.includes('doctor')) return Heart;
    if (cat.includes('pharmacy') || cat.includes('drug')) return Heart;
    if (cat.includes('veterinary') || cat.includes('vet')) return Heart;
    if (cat.includes('gym') || cat.includes('fitness')) return Dumbbell;
    if (cat.includes('bank') || cat.includes('credit')) return DollarSign;
    if (cat.includes('storage') || cat.includes('warehouse')) return Building;
    if (cat.includes('grocery') || cat.includes('shopping')) return ShoppingBag;
    return Building;
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('school') || cat.includes('education')) return 'bg-blue-100 text-blue-800';
    if (cat.includes('health') || cat.includes('medical') || cat.includes('doctor')) return 'bg-red-100 text-red-800';
    if (cat.includes('pharmacy') || cat.includes('drug')) return 'bg-green-100 text-green-800';
    if (cat.includes('veterinary') || cat.includes('vet')) return 'bg-purple-100 text-purple-800';
    if (cat.includes('gym') || cat.includes('fitness')) return 'bg-orange-100 text-orange-800';
    if (cat.includes('bank') || cat.includes('credit')) return 'bg-yellow-100 text-yellow-800';
    if (cat.includes('storage') || cat.includes('warehouse')) return 'bg-indigo-100 text-indigo-800';
    if (cat.includes('grocery') || cat.includes('shopping')) return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
  };

  const toggleCategory = (categoryKey: string) => {
    setSelectedCategory(prev => (prev === categoryKey ? '' : categoryKey));
  };

  const getServiceCategoryName = (key: string) => {
    const categoryMap = {
      'schools': 'Schools & Daycares',
      'healthcare': 'Doctors & Clinics', 
      'pharmacies': 'Pharmacies',
      'veterinary': 'Veterinarians',
      'gyms': 'Gyms & Fitness',
      'banks': 'Banks & Credit Unions',
      'storage': 'Storage Facilities'
    };
    return categoryMap[key as keyof typeof categoryMap] || key;
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
                <h1 className="text-2xl font-bold text-gray-900">Local Services & Community</h1>
                <p className="text-gray-600">Find schools, healthcare, gyms, and essential services in your new area</p>
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
              <MapPin className="w-5 h-5" />
              Search Local Services
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
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">Select services to search for:</p>
              <div className="flex flex-wrap gap-2">
                {['schools', 'healthcare', 'pharmacies', 'veterinary', 'gyms', 'banks', 'storage'].map((categoryKey) => (
                  <Badge
                    key={categoryKey}
                    variant={selectedCategory === categoryKey ? "default" : "outline"}
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      selectedCategory === categoryKey
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'hover:bg-blue-50 hover:border-blue-300'
                    }`}
                    onClick={() => toggleCategory(categoryKey)}
                  >
                    {getServiceCategoryName(categoryKey)}
                  </Badge>
                ))}
              </div>
              <p className="text-xs mt-2 text-gray-500">
                Click categories to toggle them on/off. Selected category will be searched.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Finding local services in your area...</p>
          </div>
        )}

        {/* Results */}
        {showResults && !isLoading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Found {providers.length} Local Services in {searchLocation} (within 20 miles)
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
              <>
                <div className="space-y-3">
                  {(() => {
                    const startIndex = (currentPage - 1) * resultsPerPage;
                    const endIndex = startIndex + resultsPerPage;
                    const currentProviders = providers.slice(startIndex, endIndex);

                    return currentProviders.map((provider, index) => {
                      const IconComponent = getCategoryIcon(provider.category);

                      return (
                        <Card 
                          key={index} 
                          className="hover:shadow-md transition-all cursor-pointer hover:bg-blue-50/50 border-l-4 border-l-blue-500"
                          onClick={() => handleProviderClick(provider)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <IconComponent className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold truncate">{provider.provider}</h3>
                                    <Badge className={getCategoryColor(provider.category)} variant="secondary">
                                      {provider.category}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    {provider.rating > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium">{provider.rating.toFixed(1)}</span>
                                      </div>
                                    )}
                                    {provider.phone && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        <span>{provider.phone}</span>
                                      </div>
                                    )}
                                    {provider.address && (
                                      <div className="flex items-center gap-1 truncate">
                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{provider.address}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-lg font-semibold text-green-600">
                                  {provider.estimatedCost}
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProviderClick(provider);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white mt-1"
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    });
                  })()}
                </div>

                {/* Pagination Controls */}
                {providers.length > resultsPerPage && (
                  <div className="flex items-center justify-center space-x-4 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    <div className="flex items-center space-x-2">
                      {(() => {
                        const totalPages = Math.ceil(providers.length / resultsPerPage);
                        const pages = [];
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(i)}
                              className={currentPage === i ? "bg-blue-600 text-white" : ""}
                            >
                              {i}
                            </Button>
                          );
                        }
                        return pages;
                      })()}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(providers.length / resultsPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil(providers.length / resultsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                )}

                {/* Results Info */}
                <div className="text-center text-sm text-gray-600 mt-4">
                  Showing {Math.min((currentPage - 1) * resultsPerPage + 1, providers.length)} - {Math.min(currentPage * resultsPerPage, providers.length)} of {providers.length} results
                </div>
              </>
            )}
          </div>
        )}

        {!showResults && !isLoading && (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to Explore Your New Community?</h2>
            <p className="text-gray-600 mb-6">
              Search for essential services like schools, healthcare providers, gyms, and more in your destination area.
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

        {/* Provider Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedProvider && (
                  <>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const IconComponent = getCategoryIcon(selectedProvider.category);
                        return <IconComponent className="w-5 h-5 text-blue-600" />;
                      })()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{selectedProvider.provider}</span>
                        <Badge className={getCategoryColor(selectedProvider.category)} variant="secondary">
                          {selectedProvider.category}
                        </Badge>
                      </div>
                      {selectedProvider.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{selectedProvider.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedProvider && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <p className="text-gray-600">{selectedProvider.description}</p>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      {selectedProvider.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{selectedProvider.phone}</span>
                        </div>
                      )}
                      {selectedProvider.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{selectedProvider.address}</span>
                        </div>
                      )}
                      {selectedProvider.website && selectedProvider.website !== `https://www.google.com/search?q=${encodeURIComponent(selectedProvider.provider)}` && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-500" />
                          <a 
                            href={selectedProvider.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {selectedProvider.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Pricing & Hours</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>{selectedProvider.estimatedCost}</span>
                      </div>
                      {selectedProvider.hours && (
                        <div className="text-gray-600">
                          <strong>Hours:</strong> {selectedProvider.hours}
                        </div>
                      )}
                      {selectedProvider.availability && (
                        <div className="text-gray-600">
                          <strong>Availability:</strong> {selectedProvider.availability}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Services */}
                {selectedProvider.services && selectedProvider.services.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProvider.services.map((service, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialties */}
                {selectedProvider.specialties && selectedProvider.specialties.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      {selectedProvider.category.includes('School') ? 'Programs' : 'Specialties'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProvider.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insurance */}
                {selectedProvider.insurance && selectedProvider.insurance.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Insurance Accepted</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProvider.insurance.map((ins, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {ins}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedProvider.phone && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        window.open(`tel:${selectedProvider.phone}`, '_self');
                        setHasCompletedActions(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Call Now
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleContactClick(selectedProvider)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    {selectedProvider.category.includes('School') ? 'Learn More' : 'Get Info'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}