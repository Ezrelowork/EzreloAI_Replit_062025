import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Truck, 
  Phone, 
  Star, 
  ExternalLink, 
  MapPin, 
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Globe,
  DollarSign,
  Users,
  Package
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

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
  availability?: string;
  licenseInfo?: string;
  specialties?: string[];
  insuranceOptions?: string[];
  estimatedTimeframe?: string;
  notes?: string;
}

interface MovingRequest {
  fromAddress: string;
  fromCity: string;
  fromState: string;
  fromZip: string;
  toCity: string;
  toState: string;
  toZip: string;
  moveDate: string;
}

export default function MovingCompanies() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("local");
  const [companies, setCompanies] = useState<MovingCompany[]>(() => {
    const saved = localStorage.getItem('movingCompaniesResults');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing saved companies:', error);
      }
    }
    return [];
  });
  const [moveDetails, setMoveDetails] = useState({
    fromAddress: "",
    fromCity: "",
    fromState: "",
    fromZip: "",
    toAddress: "",
    toCity: "",
    toState: "",
    toZip: "",
    moveDate: ""
  });
  const [hasCompletedActions, setHasCompletedActions] = useState(false);
  const [quotesRequested, setQuotesRequested] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('quotesRequested');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [showQuestionnaireForm, setShowQuestionnaireForm] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState<string | null>(null);
  const [questionnaireData, setQuestionnaireData] = useState({
    currentAddress: "",
    destinationAddress: "",
    movingDate: "",
    homeSize: "",
    squareFootage: "",
    currentFloors: "",
    destinationFloors: "",
    livingRoomItems: {},
    bedroomItems: {},
    kitchenDiningItems: {},
    largeAppliances: {},
    specialtyItems: {},
    smallBoxes: "",
    mediumBoxes: "",
    largeBoxes: "",
    packingServices: "",
    additionalServices: [],
    specialInstructions: "",
    email: ""
  });

  // USPS Address verification function
  const verifyAddress = async (address: string) => {
    try {
      const response = await apiRequest("POST", "/api/verify-address", { address });
      const data = await response.json();
      return data.verifiedAddress || address; // Return verified address or original if verification fails
    } catch (error) {
      console.log('Address verification failed, using original address');
      return address;
    }
  };

  // Enhanced address parsing function
  const parseAddress = (addressString: string) => {
    let streetAddress = '';
    let city = '';
    let state = '';
    let zip = '';

    // First, try to extract ZIP code
    const zipMatch = addressString.match(/\b(\d{5}(-\d{4})?)\b/);
    let addressWithoutZip = addressString;

    if (zipMatch) {
      zip = zipMatch[1];
      addressWithoutZip = addressString.replace(zipMatch[0], '').trim();
    }

    // Check if address has commas (properly formatted)
    if (addressWithoutZip.includes(',')) {
      const parts = addressWithoutZip.split(',').map(part => part.trim());

      if (parts.length >= 3) {
        // Format: "123 Main St, Dallas, TX"
        streetAddress = parts[0];
        city = parts[1];
        state = parts[2];
      } else if (parts.length === 2) {
        // Format: "123 Main St, Dallas TX" or "Dallas, TX"
        const secondPart = parts[1].trim();
        const stateMatch = secondPart.match(/\b([A-Z]{2})\b$/);

        if (stateMatch) {
          state = stateMatch[1];
          const cityPart = secondPart.replace(stateMatch[0], '').trim();

          if (cityPart) {
            // Has city in second part
            streetAddress = parts[0];
            city = cityPart;
          } else {
            // No street address, just city and state
            city = parts[0];
          }
        }
      }
    } else {
      // No commas - need to parse differently (like "3201 Stonecrop TrailArgyle TX 76226")
      // Try to identify state pattern first
      const stateMatch = addressWithoutZip.match(/\b([A-Z]{2})\b/);

      if (stateMatch) {
        state = stateMatch[1];
        const beforeState = addressWithoutZip.substring(0, stateMatch.index).trim();
        const afterState = addressWithoutZip.substring(stateMatch.index + 2).trim();

        // Split beforeState to separate street address and city
        const words = beforeState.split(/\s+/);

        if (words.length >= 3) {
          // Assume last word before state is city, rest is street address
          city = words[words.length - 1];
          streetAddress = words.slice(0, -1).join(' ');
        } else if (words.length === 2) {
          // Could be just number + street or city + street
          // If first word is a number, assume it's street address
          if (/^\d+/.test(words[0])) {
            streetAddress = beforeState;
            city = afterState; // City might be after state
          } else {
            city = beforeState;
          }
        } else {
          streetAddress = beforeState;
        }
      } else {
        // No state found, try other patterns
        const words = addressWithoutZip.split(/\s+/);
        if (words.length >= 2 && /^\d+/.test(words[0])) {
          // Starts with number, likely has street address
          streetAddress = words.slice(0, -1).join(' ');
          city = words[words.length - 1];
        } else {
          city = addressWithoutZip;
        }
      }
    }

    return { streetAddress, city, state, zip };
  };

  // Load move data from localStorage on component mount
  useEffect(() => {
    const loadAndParseAddresses = async () => {
      const aiFromLocation = localStorage.getItem('aiFromLocation');
      const aiToLocation = localStorage.getItem('aiToLocation');
      const aiMoveDate = localStorage.getItem('aiMoveDate');

      console.log('Loading AI data:', { aiFromLocation, aiToLocation, aiMoveDate });

      if (aiFromLocation && aiFromLocation !== 'undefined') {
        // Verify and parse from address
        const verifiedFromAddress = await verifyAddress(aiFromLocation);
        const fromParsed = parseAddress(verifiedFromAddress);

        setMoveDetails(prev => ({
          ...prev,
          fromAddress: fromParsed.streetAddress,
          fromCity: fromParsed.city,
          fromState: fromParsed.state,
          fromZip: fromParsed.zip
        }));
      }

      if (aiToLocation && aiToLocation !== 'undefined') {
        // Verify and parse to address
        const verifiedToAddress = await verifyAddress(aiToLocation);
        const toParsed = parseAddress(verifiedToAddress);

        setMoveDetails(prev => ({
          ...prev,
          toAddress: toParsed.streetAddress,
          toCity: toParsed.city,
          toState: toParsed.state,
          toZip: toParsed.zip,
          moveDate: aiMoveDate || ""
        }));
      }
    };

    loadAndParseAddresses();

    // Auto-show questionnaire modal if user came from AI assistant
    const aiData = localStorage.getItem('aiFromLocation');
    const existingQuestionnaire = localStorage.getItem('ezrelo_questionnaire');

    if (aiData && !existingQuestionnaire) {
      // Show questionnaire modal after a brief delay to let the page load
      setTimeout(() => {
        setShowQuestionnaireForm(true);
        toast({
          title: "Complete Your Profile",
          description: "Fill out the questionnaire to enable AI-powered quotes from movers",
          duration: 5000,
        });
      }, 1500);
    }
  }, []);

  // Search for moving companies
  const searchMutation = useMutation({
    mutationFn: async (request: MovingRequest) => {
      const response = await apiRequest("POST", "/api/moving-companies", request);
      return await response.json();
    },
    onSuccess: (data) => {
      const companyList = data?.companies || [];
      setCompanies(companyList);
      localStorage.setItem('movingCompaniesResults', JSON.stringify(companyList));
      toast({
        title: "Moving Companies Found",
        description: `Found ${companyList.length} qualified movers for your route`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search Error",
        description: "Unable to find moving companies. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!moveDetails.fromCity || !moveDetails.toCity) {
      toast({
        title: "Missing Information",
        description: "Please enter at least from and to cities to search for movers.",
        variant: "destructive",
      });
      return;
    }

    searchMutation.mutate(moveDetails);
  };

  const handleCompanyClick = async (company: MovingCompany, action: string) => {
    try {
      await apiRequest("POST", "/api/track-referral", {
        provider: company.provider,
        category: "Moving Companies",
        action: action,
        userAddress: `${moveDetails.fromCity}, ${moveDetails.fromState}`,
        affiliateCode: company.affiliateCode,
        referralUrl: company.referralUrl
      });

      if (action === "Get Quote") {
        setQuotesRequested(prev => new Set(prev).add(company.provider));
        setHasCompletedActions(true);
      }

      window.open(company.referralUrl, '_blank');
      setHasCompletedActions(true);

      toast({
        title: "Opening Provider",
        description: `Redirecting to ${company.provider}`,
      });
    } catch (error) {
      window.open(company.website, '_blank');
      setHasCompletedActions(true);
    }
  };

  // Check if questionnaire is completed
  const isQuestionnaireComplete = () => {
    // Check both current state and saved data
    const savedQuestionnaire = localStorage.getItem('ezrelo_questionnaire');
    if (savedQuestionnaire) {
      try {
        const parsedData = JSON.parse(savedQuestionnaire);
        // More lenient check - just need home size to be considered complete
        return parsedData.homeSize && parsedData.homeSize !== '';
      } catch (error) {
        console.log('Failed to parse saved questionnaire');
      }
    }
    return questionnaireData.homeSize && questionnaireData.homeSize !== '';
  };

  // AI-powered quote request
  const requestAIQuote = useMutation({
    mutationFn: async (company: MovingCompany) => {
      // Check if questionnaire is filled out
      const hasBasicInfo = isQuestionnaireComplete();

      if (!hasBasicInfo) {
        throw new Error('questionnaire_required');
      }

      const response = await apiRequest("POST", "/api/share-with-movers", {
        questionnaire: questionnaireData,
        moveDetails: {
          from: `${moveDetails.fromAddress ? moveDetails.fromAddress + ', ' : ''}${moveDetails.fromCity}${moveDetails.fromState ? ', ' + moveDetails.fromState : ''}${moveDetails.fromZip ? ' ' + moveDetails.fromZip : ''}`,
          to: `${moveDetails.toAddress ? moveDetails.toAddress + ', ' : ''}${moveDetails.toCity}${moveDetails.toState ? ', ' + moveDetails.toState : ''}${moveDetails.toZip ? ' ' + moveDetails.toZip : ''}`,
          date: moveDetails.moveDate
        },
        selectedMovers: [company],
        userId: 1, // In production, get from auth context
        projectId: 1 // In production, get from current project
      });

      return response.json();
    },
    onSuccess: (data, company) => {
      const newQuotesRequested = new Set(quotesRequested).add(company.provider);
      setQuotesRequested(newQuotesRequested);
      localStorage.setItem('quotesRequested', JSON.stringify([...newQuotesRequested]));
      setHasCompletedActions(true);
      setIsGeneratingEmail(null);

      toast({
        title: "🤖 AI Quote Request Sent!",
        description: `Professional email sent to ${company.provider} with your detailed requirements. All responses will appear in your Ezrelo dashboard within 24-48 hours.`,
        duration: 5000,
      });
    },
    onError: (error: any, company) => {
      setIsGeneratingEmail(null);

      if (error.message === 'questionnaire_required') {
        toast({
          title: "Questionnaire Required",
          description: "Please fill out the questionnaire first to send AI-generated quote requests",
          variant: "destructive",
        });
        setShowQuestionnaireForm(true);
      } else {
        toast({
          title: "Request Failed",
          description: "Unable to send AI quote request. Please try the regular quote button.",
          variant: "destructive",
        });
      }
    },
  });

  const handleAIQuoteRequest = (company: MovingCompany) => {
    setIsGeneratingEmail(company.provider);
    requestAIQuote.mutate(company);
  };

  const canCompleteTask = () => {
    return companies.length > 0 && (hasCompletedActions || quotesRequested.size > 0);
  };

  // Generate PDF from questionnaire data
  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Moving Estimate Questionnaire', 20, 30);

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Completed form for accurate moving quotes', 20, 40);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 50);

    let yPosition = 70;

    // Basic Information
    const basicInfo = [
      { label: 'Current Address:', value: questionnaireData.currentAddress || `${moveDetails.fromAddress ? moveDetails.fromAddress + ', ' : ''}${moveDetails.fromCity}${moveDetails.fromState ? ', ' + moveDetails.fromState : ''}${moveDetails.fromZip ? ' ' + moveDetails.fromZip : ''}` },
      { label: 'Destination Address:', value: questionnaireData.destinationAddress || `${moveDetails.toAddress ? moveDetails.toAddress + ', ' : ''}${moveDetails.toCity}${moveDetails.toState ? ', ' + moveDetails.toState : ''}${moveDetails.toZip ? ' ' + moveDetails.toZip : ''}` },
      { label: 'Moving Date:', value: questionnaireData.movingDate || moveDetails.moveDate },
      { label: 'Home Size:', value: questionnaireData.homeSize },
      { label: 'Square Footage:', value: questionnaireData.squareFootage },
      { label: 'Current Location Access:', value: questionnaireData.currentFloors },
      { label: 'Destination Access:', value: questionnaireData.destinationFloors }
    ];

    basicInfo.forEach((item) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(item.label, 20, yPosition);
      yPosition += 8;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      const value = item.value || 'Not specified';
      const lines = doc.splitTextToSize(value, 170);
      doc.text(lines, 25, yPosition);
      yPosition += (lines.length * 6) + 10;
    });

    // Items sections
    const itemSections = [
      { title: 'Living Room Items', items: questionnaireData.livingRoomItems },
      { title: 'Bedroom Items', items: questionnaireData.bedroomItems },
      { title: 'Kitchen & Dining Items', items: questionnaireData.kitchenDiningItems },
      { title: 'Large Appliances', items: questionnaireData.largeAppliances },
      { title: 'Specialty Items', items: questionnaireData.specialtyItems }
    ];

    itemSections.forEach((section) => {
      const itemList = Object.entries(section.items).filter(([_, qty]) => qty > 0);
      if (itemList.length > 0) {
        if (yPosition > 230) {
          doc.addPage();
          yPosition = 30;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(section.title + ':', 20, yPosition);
        yPosition += 10;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);
        itemList.forEach(([item, qty]) => {
          doc.text(`• ${item}: ${qty}`, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
    });

    // Boxes and Services
    if (questionnaireData.smallBoxes || questionnaireData.mediumBoxes || questionnaireData.largeBoxes) {
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Estimated Boxes:', 20, yPosition);
      yPosition += 10;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      if (questionnaireData.smallBoxes) doc.text(`• Small Boxes: ${questionnaireData.smallBoxes}`, 25, yPosition), yPosition += 6;
      if (questionnaireData.mediumBoxes) doc.text(`• Medium Boxes: ${questionnaireData.mediumBoxes}`, 25, yPosition), yPosition += 6;
      if (questionnaireData.largeBoxes) doc.text(`• Large Boxes: ${questionnaireData.largeBoxes}`, 25, yPosition), yPosition += 6;
      yPosition += 10;
    }

    if (questionnaireData.packingServices) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Packing Services:', 20, yPosition);
      yPosition += 8;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.text(questionnaireData.packingServices, 25, yPosition);
      yPosition += 15;
    }

    if (questionnaireData.additionalServices.length > 0) {
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Additional Services:', 20, yPosition);
      yPosition += 10;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      questionnaireData.additionalServices.forEach(service => {
        doc.text(`• ${service}`, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    if (questionnaireData.specialInstructions) {
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Special Instructions:', 20, yPosition);
      yPosition += 8;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(questionnaireData.specialInstructions, 170);
      doc.text(lines, 25, yPosition);
    }

    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    doc.save('moving-estimate-questionnaire.pdf');

    toast({
      title: "PDF Downloaded",
      description: "Your moving questionnaire has been saved as a PDF.",
    });
  };

  const handleSaveQuestionnaire = () => {
    // Save to localStorage for now
    const savedData = {
      ...questionnaireData,
      savedAt: new Date().toISOString(),
      moveDetails: moveDetails
    };

    localStorage.setItem('ezrelo_questionnaire', JSON.stringify(savedData));

    toast({
      title: "Questionnaire Saved",
      description: "Your questionnaire has been saved locally.",
    });

    setHasCompletedActions(true);
    setShowQuestionnaireForm(false); // Close the modal after saving
  };

  const handleSendPDFToEmail = async () => {
    if (!questionnaireData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to receive the PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = generatePDF();
      const pdfBlob = doc.output('blob');

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64PDF = reader.result?.toString().split(',')[1];

        const response = await apiRequest("POST", "/api/send-questionnaire-email", {
          email: questionnaireData.email,
          questionnaire: questionnaireData,
          pdfData: base64PDF,
          moveDetails: moveDetails
        });

        if (response.ok) {
          toast({
            title: "PDF Sent Successfully",
            description: `Your moving questionnaire has been sent to ${questionnaireData.email}`,
          });
          setHasCompletedActions(true);
        } else {
          throw new Error('Failed to send email');
        }
      };

      reader.readAsDataURL(pdfBlob);

    } catch (error) {
      toast({
        title: "Failed to Send PDF",
        description: "Unable to send questionnaire. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load saved questionnaire on component mount
  useEffect(() => {
    const savedQuestionnaire = localStorage.getItem('ezrelo_questionnaire');
    if (savedQuestionnaire) {
      try {
        const parsedData = JSON.parse(savedQuestionnaire);
        setQuestionnaireData(parsedData);
        console.log('Loaded saved questionnaire:', parsedData);
      } catch (error) {
        console.log('Failed to load saved questionnaire');
      }
    }
  }, []);

  // Force re-render when questionnaire data changes
  useEffect(() => {
    console.log('Questionnaire completion status:', isQuestionnaireComplete());
  }, [questionnaireData]);

  const movingTypes = {
    local: {
      title: "Local Movers",
      description: "Professional movers for local and short-distance moves",
      tips: ["Check local licensing", "Verify insurance coverage", "Get binding estimates"]
    },
    longDistance: {
      title: "Long-Distance Movers",
      description: "Interstate and cross-country moving specialists",
      tips: ["Verify DOT registration", "Check Better Business Bureau ratings", "Understand pricing structure"]
    },
    specialty: {
      title: "Specialty Movers",
      description: "Piano, antique, and fragile item specialists",
      tips: ["Verify specialty certifications", "Check handling procedures", "Review insurance options"]
    }
  };

  const currentType = movingTypes[selectedTab as keyof typeof movingTypes];

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = company.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           company.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Assuming serviceAreas is a property of MovingCompany
      // const matchesLocation = !locationFilter || company.serviceAreas.includes(locationFilter);
      const matchesLocation = true;

      const matchesRating = company.rating >= ratingFilter;

      const matchesPrice = !priceRange || 
                          (parseFloat(company.estimatedCost.replace('$', '')) >= priceRange.min && 
                           parseFloat(company.estimatedCost.replace('$', '')) <= priceRange.max);

      return matchesSearch && matchesLocation && matchesRating && matchesPrice;
    });
  }, [companies, searchTerm, locationFilter, ratingFilter, priceRange]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
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
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Journey
          </Button>

          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Truck className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Find Moving Companies</h1>
            </div>
            <p className="text-gray-600">Professional movers for your relocation</p>
          </div>

          {/* Streamlined Address Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-700 font-medium">
                      {moveDetails.fromAddress || moveDetails.fromCity
                        ? `${moveDetails.fromAddress ? moveDetails.fromAddress + ', ' : ''}${moveDetails.fromCity}${moveDetails.fromState ? ', ' + moveDetails.fromState : ''}${moveDetails.fromZip ? ' ' + moveDetails.fromZip : ''}`
                        : 'From location'} 
                    </span>
                    <span className="text-gray-400 text-lg">→</span>
                    <span className="text-gray-700 font-medium">
                      {moveDetails.toAddress || moveDetails.toCity
                        ? `${moveDetails.toAddress ? moveDetails.toAddress + ', ' : ''}${moveDetails.toCity}${moveDetails.toState ? ', ' + moveDetails.toState : ''}${moveDetails.toZip ? ' ' + moveDetails.toZip : ''}`
                        : 'To location'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 ml-8">
                  Move Date: {moveDetails.moveDate ? new Date(moveDetails.moveDate).toLocaleDateString() : 'July 27, 2025'}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  onClick={handleSearch}
                  disabled={searchMutation.isPending || !moveDetails.fromCity || !moveDetails.toCity}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {searchMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    'Find Movers'
                  )}
                </Button>
                {companies.length > 0 && (
                  <Button 
                    onClick={() => {
                      setCompanies([]);
                      setQuotesRequested(new Set());
                      localStorage.removeItem('movingCompaniesResults');
                      localStorage.removeItem('quotesRequested');
                    }}
                    variant="outline"
                    className="text-gray-600"
                  >
                    Clear Results
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Moving Type Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="local">Local Movers</TabsTrigger>
            <TabsTrigger value="longDistance">Long Distance</TabsTrigger>
            <TabsTrigger value="specialty">Specialty Movers</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Main Content Layout */}
        <div className="flex gap-8">
          {/* Left Section - Companies Results (2/3 width) */}
          <div className="flex-1">
            {companies.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Available Moving Companies
                  </h2>
                  <Badge variant="outline" className="text-sm">
                    {companies.length} companies found
                  </Badge>
                </div>

            <div className="grid gap-4">
                  {filteredCompanies.map((company, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Truck className="w-5 h-5 text-blue-600" />
                              {company.provider}
                              {company.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-normal text-gray-600">
                                    {company.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {company.description}
                            </CardDescription>
                            <Badge variant="outline" className="mt-2">{company.category}</Badge>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-800">
                              {company.estimatedCost}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Company Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                                                            <span>{company.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span>{company.hours}</span>
                            </div>
                            {company.availability && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span>{company.availability}</span>
                              </div>
                            )}
                          </div>

                          {/* Services */}
                          {company.services && company.services.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                              <div className="flex flex-wrap gap-2">
                                {company.services.slice(0, 4).map((service, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {service}
                                  </Badge>
                                ))}
                                {company.services.length > 4 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{company.services.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Special Notes */}
                          {company.notes && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-800">
                                <strong>Note:</strong> {company.notes}
                              </p>
                            </div>
                          )}

                          {/* AI Quote Ready Status */}
                          {isQuestionnaireComplete() && (
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200 mb-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">🤖 AI Quote Ready</span>
                              </div>
                              <p className="text-xs text-green-700 mt-1">
                                Your questionnaire is complete - ready for instant AI quote request
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <div className="flex flex-col gap-2 flex-1">
                              <Button 
                                onClick={() => handleAIQuoteRequest(company)}
                                className={`w-full ${
                                  quotesRequested.has(company.provider) 
                                    ? "bg-green-600 hover:bg-green-700" 
                                    : isGeneratingEmail === company.provider
                                    ? "bg-purple-400"
                                    : isQuestionnaireComplete()
                                    ? "bg-purple-600 hover:bg-purple-700"
                                    : "bg-gray-400 hover:bg-gray-500"
                                }`}
                                disabled={isGeneratingEmail === company.provider || quotesRequested.has(company.provider) || !isQuestionnaireComplete()}
                              >
                                {isGeneratingEmail === company.provider ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    🤖 AI Crafting Email...
                                  </>
                                ) : quotesRequested.has(company.provider) ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    ✅ AI Quote Request Sent
                                  </>
                                ) : isQuestionnaireComplete() ? (
                                  <>
                                    <Package className="w-4 h-4 mr-2" />
                                    🤖 Send AI Quote Request
                                  </>
                                ) : (
                                  <>
                                    <Package className="w-4 h-4 mr-2" />
                                    Complete Questionnaire First
                                  </>
                                )}
                              </Button>
                              <Button 
                                onClick={() => handleCompanyClick(company, "Get Quote")}
                                variant="outline"
                                className="w-full text-xs"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Manual Quote
                              </Button>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => handleCompanyClick(company, "Visit Website")}
                                className="px-3"
                              >
                                <Globe className="w-4 h-4" />
                              </Button>
                              {company.phone && (
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    window.open(`tel:${company.phone}`, '_self');
                                    setHasCompletedActions(true);
                                  }}
                                  className="px-3"
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

        {/* Right Section - Sidebar (1/3 width) */}
          <div className="w-80 space-y-6">
            {/* Estimate Questionnaire */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className={`w-1 h-6 ${isQuestionnaireComplete() ? 'bg-green-500' : 'bg-purple-500'} rounded-full`}></div>
                  Estimate Questionnaire
                  {isQuestionnaireComplete() && (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                  )}
                </CardTitle>
                <CardDescription>
                  {isQuestionnaireComplete() 
                    ? "✅ Complete! You can now send AI-generated quotes to all movers."
                    : "Fill this out to send AI-generated professional emails to movers for instant quote requests."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowQuestionnaireForm(true)}
                  className={`w-full ${
                    isQuestionnaireComplete()
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  } text-white`}
                >
                  <Package className="w-4 h-4 mr-2" />
                  {isQuestionnaireComplete() 
                    ? "✅ Edit Questionnaire" 
                    : "Complete Questionnaire"
                  }
                </Button>

                {isQuestionnaireComplete() ? (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900 mb-2">🎉 Ready for AI Quotes!</p>
                    <ul className="text-xs text-green-800 space-y-1">
                      <li>• ✅ Home size: {questionnaireData.homeSize}</li>
                      <li>• ✅ Packing needs: {questionnaireData.packingServices}</li>
                      <li>• ✅ Move details: {moveDetails.fromCity} → {moveDetails.toCity}</li>
                      <li>• 🤖 All movers can receive instant AI quotes</li>
                    </ul>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-900 mb-2">🤖 AI Quote Benefits:</p>
                    <ul className="text-xs text-purple-800 space-y-1">
                      <li>• Professional emails sent instantly</li>
                      <li>• Complete move details included</li>
                      <li>• Inventory automatically formatted</li>
                      <li>• No phone calls or forms needed</li>
                      <li>• Faster response from movers</li>
                      <li>• Higher quality quotes received</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pro Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900">Best Booking Time</h4>
                  <p className="text-xs text-blue-800">Book 8+ weeks ahead for summer moves, 4+ weeks for off-season</p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-semibold text-green-900">Save Money</h4>
                  <p className="text-xs text-green-800">Move mid-month, mid-week, and avoid summer peak season</p>
                </div>

                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="text-sm font-semibold text-red-900">Red Flags</h4>
                  <p className="text-xs text-red-800">Avoid companies requiring large deposits or door-to-door sales</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Checklist */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  Quick Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Get 3+ written estimates</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Check insurance coverage</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Read reviews & references</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Verify license & bonding</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Understand pricing structure</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Confirm moving date</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Costs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-yellow-500 rounded-full"></div>
                  Estimated Costs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Local Move (same city)</span>
                    <span className="font-medium">$800-1,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Long Distance (interstate)</span>
                    <span className="font-medium">$2,500-5,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packing Services</span>
                    <span className="font-medium">$500-1,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage (per month)</span>
                    <span className="font-medium">$50-200</span>
                  </div>
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between font-semibold text-green-700">
                      <span>Total Range</span>
                      <span>$1,350-6,700</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Empty State */}
        {filteredCompanies.length === 0 && !searchMutation.isPending && moveDetails.fromCity && moveDetails.toCity && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No moving companies found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any moving companies for your route. 
              Try adjusting your search or check back later.
            </p>
            <Button variant="outline" onClick={handleSearch}>
              Search Again
            </Button>
          </div>
        )}

        {/* Call to Action */}
        {!moveDetails.fromCity && !moveDetails.toCity && (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Find Moving Companies?</h3>
              <p className="text-gray-600 mb-4">
                Start by setting up your move details through our AI assistant to get personalized moving company recommendations.
              </p>
              <Button onClick={() => window.location.href = '/ai-assistant'}>
                Start with AI Assistant
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Task Completion Section */}
        {companies.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Move Forward?
                </h3>
                <p className="text-gray-600 text-sm">
                  {canCompleteTask() 
                    ? "You've successfully researched moving companies and requested quotes." 
                    : "Request quotes from at least one moving company to complete this task."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={() => {
                    if (canCompleteTask()) {
                      toast({
                        title: "Moving Company Task Completed!",
                        description: "Returning to your moving journey...",
                      });

                      setTimeout(() => {
                        window.location.href = '/moving-journey';
                      }, 1000);
                    }
                  }}
                  disabled={!canCompleteTask()}
                  className={`font-medium py-3 px-8 rounded-lg text-sm shadow-sm transition-all w-full sm:w-auto ${
                    canCompleteTask() 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {canCompleteTask() ? "Complete Moving Company Search" : "Request Quotes First"}
                </Button>

                <Button
                  onClick={() => window.location.href = '/moving-journey'}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50 font-medium py-3 px-6 rounded-lg text-sm shadow-sm transition-all w-full sm:w-auto"
                >
                  Return to Journey
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Questionnaire Form Modal */}
        {showQuestionnaireForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">Moving Estimate Questionnaire</h2>
                    {isQuestionnaireComplete() && (
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    )}
                  </div>
                  <button
                    onClick={() => setShowQuestionnaireForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {isQuestionnaireComplete() ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="font-medium text-green-900">Questionnaire Complete!</p>
                    </div>
                    <p className="text-sm text-green-800">
                      You can now send AI-generated quotes to all moving companies. Edit any details below if needed.
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-6">
                    Fill out this questionnaire to enable AI-generated quote requests from moving companies.
                  </p>
                )}

                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentAddress">Current Address</Label>
                      <Input
                        id="currentAddress"
                        value={questionnaireData.currentAddress || `${moveDetails.fromAddress ? moveDetails.fromAddress + ', ' : ''}${moveDetails.fromCity}${moveDetails.fromState ? ', ' + moveDetails.fromState : ''}${moveDetails.fromZip ? ' ' + moveDetails.fromZip : ''}`}
                        onChange={(e) => setQuestionnaireData({...questionnaireData, currentAddress: e.target.value})}
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="destinationAddress">Destination Address</Label>
                      <Input
                        id="destinationAddress"
                        value={questionnaireData.destinationAddress || `${moveDetails.toAddress ? moveDetails.toAddress + ', ' : ''}${moveDetails.toCity}${moveDetails.toState ? ', ' + moveDetails.toState : ''}${moveDetails.toZip ? ' ' + moveDetails.toZip : ''}`}
                        onChange={(e) => setQuestionnaireData({...questionnaireData, destinationAddress: e.target.value})}
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="homeSize">Home Size</Label>
                      <select 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={questionnaireData.homeSize}
                        onChange={(e) => setQuestionnaireData({...questionnaireData, homeSize: e.target.value})}
                      >
                        <option value="">Select home size</option>
                        <option value="studio">Studio</option>
                        <option value="1br">1 Bedroom</option>
                        <option value="2br">2 Bedroom</option>
                        <option value="3br">3 Bedroom</option>
                        <option value="4br+">4+ Bedroom</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="squareFootage">Square Footage (if known)</Label>
                      <Input 
                        id="squareFootage" 
                        type="number" 
                        placeholder="e.g., 1200"
                        value={questionnaireData.squareFootage}
                        onChange={(e) => setQuestionnaireData({...questionnaireData, squareFootage: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentFloors">Current Location Access</Label>
                      <Input 
                        id="currentFloors" 
                        placeholder="e.g., 2nd floor, elevator available"
                        value={questionnaireData.currentFloors}
                        onChange={(e) => setQuestionnaireData({...questionnaireData, currentFloors: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="destinationFloors">Destination Access</Label>
                      <Input 
                        id="destinationFloors" 
                        placeholder="e.g., 1st floor, stairs only"
                        value={questionnaireData.destinationFloors}
                        onChange={(e) => setQuestionnaireData({...questionnaireData, destinationFloors: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Living Room / Family Room */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🛋️ Living Room / Family Room
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Sofas / Couches (sectionals, recliners)', 'Loveseats', 'Armchairs / Accent chairs', 'Coffee tables',
                        'End tables', 'Entertainment center / TV stand', 'Flat screen TVs (specify size)', 'Bookshelves',
                        'Lamps (floor and table)', 'Area rugs', 'Ottomans', 'Wall décor / Mirrors',
                        'Speakers / Sound systems', 'Houseplants'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                            checked={questionnaireData.livingRoomItems[item] > 0}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.livingRoomItems };
                              if (e.target.checked) {
                                newItems[item] = 1;
                              } else {
                                newItems[item] = 0;
                              }
                              setQuestionnaireData({...questionnaireData, livingRoomItems: newItems});
                            }}
                          />
                          <span className="text-xs flex-1 leading-tight">{item}</span>
                          <Input 
                            type="number" 
                            min="0" 
                            max="20" 
                            className="w-12 h-6 text-xs flex-shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            placeholder="#"
                            value={questionnaireData.livingRoomItems[item] || ""}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.livingRoomItems };
                              newItems[item] = parseInt(e.target.value) || 0;
                              setQuestionnaireData({...questionnaireData, livingRoomItems: newItems});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dining Room */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🍽️ Dining Room
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Dining table (specify size)', 'Dining chairs', 'China cabinet / Hutch', 'Sideboard / Buffet',
                        'Bar cart', 'Rugs', 'Artwork or framed items'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                            checked={questionnaireData.bedroomItems[item] > 0}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.bedroomItems };
                              if (e.target.checked) {
                                newItems[item] = 1;
                              } else {
                                newItems[item] = 0;
                              }
                              setQuestionnaireData({...questionnaireData, bedroomItems: newItems});
                            }}
                          />
                          <span className="text-xs flex-1 leading-tight">{item}</span>
                          <Input 
                            type="number" 
                            min="0" 
                            max="20" 
                            className="w-12 h-6 text-xs flex-shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            placeholder="#"
                            value={questionnaireData.bedroomItems[item] || ""}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.bedroomItems };
                              newItems[item] = parseInt(e.target.value) || 0;
                              setQuestionnaireData({...questionnaireData, bedroomItems: newItems});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bedrooms */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🛏️ Bedrooms
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Beds (twin, full, queen, king, bunk)', 'Mattresses & box springs', 'Headboard / Footboard', 'Nightstands',
                        'Dressers', 'Armoires', 'Wardrobes / Closet organizers', 'Mirrors',
                        'Desks or vanities', 'Bedding, linens', 'Lamps', 'Toys (for kids\' rooms)',
                        'Cribs / Changing tables'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                            checked={questionnaireData.kitchenDiningItems[item] > 0}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.kitchenDiningItems };
                              if (e.target.checked) {
                                newItems[item] = 1;
                              } else {
                                newItems[item] = 0;
                              }
                              setQuestionnaireData({...questionnaireData, kitchenDiningItems: newItems});
                            }}
                          />
                          <span className="text-xs flex-1 leading-tight">{item}</span>
                          <Input 
                            type="number" 
                            min="0" 
                            max="20" 
                            className="w-12 h-6 text-xs flex-shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            placeholder="#"
                            value={questionnaireData.kitchenDiningItems[item] || ""}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.kitchenDiningItems };
                              newItems[item] = parseInt(e.target.value) || 0;
                              setQuestionnaireData({...questionnaireData, kitchenDiningItems: newItems});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kitchen */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🍳 Kitchen
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Table & chairs (if eat-in)', 'Bar stools', 'Microwave', 'Small appliances (toaster, blender, etc.)',
                        'Dishes, glassware', 'Pots & pans', 'Utensils', 'Pantry items',
                        'Trash can / Recycling bin'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                            checked={questionnaireData.largeAppliances[item] > 0}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.largeAppliances };
                              if (e.target.checked) {
                                newItems[item] = 1;
                              } else {
                                newItems[item] = 0;
                              }
                              setQuestionnaireData({...questionnaireData, largeAppliances: newItems});
                            }}
                          />
                          <span className="text-xs flex-1 leading-tight">{item}</span>
                          <Input 
                            type="number" 
                            min="0" 
                            max="20" 
                            className="w-12 h-6 text-xs flex-shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            placeholder="#"
                            value={questionnaireData.largeAppliances[item] || ""}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.largeAppliances };
                              newItems[item] = parseInt(e.target.value) || 0;
                              setQuestionnaireData({...questionnaireData, largeAppliances: newItems});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Laundry Room */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🧺 Laundry Room
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Washer', 'Dryer', 'Ironing board', 'Laundry baskets',
                        'Cleaning supplies', 'Vacuum cleaner', 'Mop / Broom / Swiffer'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                            checked={questionnaireData.specialtyItems[item] > 0}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.specialtyItems };
                              if (e.target.checked) {
                                newItems[item] = 1;
                              } else {
                                newItems[item] = 0;
                              }
                              setQuestionnaireData({...questionnaireData, specialtyItems: newItems});
                            }}
                          />
                          <span className="text-xs flex-1 leading-tight">{item}</span>
                          <Input 
                            type="number" 
                            min="0" 
                            max="20" 
                            className="w-12 h-6 text-xs flex-shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            placeholder="#"
                            value={questionnaireData.specialtyItems[item] || ""}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.specialtyItems };
                              newItems[item] = parseInt(e.target.value) || 0;
                              setQuestionnaireData({...questionnaireData, specialtyItems: newItems});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Office / Study */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🧑‍💻 Office / Study
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Desk', 'Office chair', 'Filing cabinets', 'Bookcases',
                        'Computers / Monitors', 'Printer / Scanner', 'Office supplies', 'Paper shredder',
                        'Storage bins'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                            checked={questionnaireData.livingRoomItems[item] > 0}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.livingRoomItems };
                              if (e.target.checked) {
                                newItems[item] = 1;
                              } else {
                                newItems[item] = 0;
                              }
                              setQuestionnaireData({...questionnaireData, livingRoomItems: newItems});
                            }}
                          />
                          <span className="text-xs flex-1 leading-tight">{item}</span>
                          <Input 
                            type="number" 
                            min="0" 
                            max="```text
20" 
                            className="w-12 h-6 text-xs flex-shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            placeholder="#"
                            value={questionnaireData.livingRoomItems[item] || ""}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.livingRoomItems };
                              newItems[item] = parseInt(e.target.value) || 0;
                              setQuestionnaireData({...questionnaireData, livingRoomItems: newItems});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bathroom(s) */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🛁 Bathroom(s)
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Cabinets / Shelving units', 'Towels', 'Toiletries', 'Laundry hampers',
                        'Shower curtains / bath mats'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                            checked={questionnaireData.bedroomItems[item] > 0}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.bedroomItems };
                              if (e.target.checked) {
                                newItems[item] = 1;
                              } else {
                                newItems[item] = 0;
                              }
                              setQuestionnaireData({...questionnaireData, bedroomItems: newItems});
                            }}
                          />
                          <span className="text-xs flex-1 leading-tight">{item}</span>
                          <Input 
                            type="number" 
                            min="0" 
                            max="20" 
                            className="w-12 h-6 text-xs flex-shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            placeholder="#"
                            value={questionnaireData.bedroomItems[item] || ""}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.bedroomItems };
                              newItems[item] = parseInt(e.target.value) || 0;
                              setQuestionnaireData({...questionnaireData, bedroomItems: newItems});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Closets / Storage */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🧳 Closets / Storage
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Clothing (hanging and boxed)', 'Shoes', 'Suitcases', 'Storage bins',
                        'Seasonal items (holiday decor, luggage)', 'Safe / Lockbox'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                            checked={questionnaireData.kitchenDiningItems[item] > 0}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.kitchenDiningItems };
                              if (e.target.checked) {
                                newItems[item] = 1;
                              } else {
                                newItems[item] = 0;
                              }
                              setQuestionnaireData({...questionnaireData, kitchenDiningItems: newItems});
                            }}
                          />
                          <span className="text-xs flex-1 leading-tight">{item}</span>
                          <Input 
                            type="number" 
                            min="0" 
                            max="20" 
                            className="w-12 h-6 text-xs flex-shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            placeholder="#"
                            value={questionnaireData.kitchenDiningItems[item] || ""}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.kitchenDiningItems };
                              newItems[item] = parseInt(e.target.value) || 0;
                              setQuestionnaireData({...questionnaireData, kitchenDiningItems: newItems});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Garage / Shed / Outdoors */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🏡 Garage / Shed / Outdoors
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Lawn mower', 'Snow blower', 'Garden tools', 'Power tools',
                        'Tool chest', 'Bicycles / Scooters', 'Workbenches', 'Sports equipment',
                        'Patio furniture', 'Grill / BBQ', 'Umbrellas / Outdoor heaters', 'Storage bins / Totes',
                        'Ladders'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                            checked={questionnaireData.largeAppliances[item] > 0}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.largeAppliances };
                              if (e.target.checked) {
                                newItems[item] = 1;
                              } else {
                                newItems[item] = 0;
                              }
                              setQuestionnaireData({...questionnaireData, largeAppliances: newItems});
                            }}
                          />
                          <span className="text-xs flex-1 leading-tight">{item}</span>
                          <Input 
                            type="number" 
                            min="0" 
                            max="20" 
                            className="w-12 h-6 text-xs flex-shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            placeholder="#"
                            value={questionnaireData.largeAppliances[item] || ""}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.largeAppliances };
                              newItems[item] = parseInt(e.target.value) || 0;
                              setQuestionnaireData({...questionnaireData, largeAppliances: newItems});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Miscellaneous / Special Items */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🎮 Miscellaneous / Special Items
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Piano (upright, baby grand)', 'Safes', 'Gun cabinets', 'Artwork (high-value)',
                        'Fish tanks', 'Large mirrors', 'Antiques / Fragile heirlooms', 'Exercise equipment (treadmill, bike, elliptical)',
                        'Pool table', 'Hot tub (specialist move)', 'Generators', 'Boxes (how many and what size)'
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                            checked={questionnaireData.specialtyItems[item] > 0}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.specialtyItems };
                              if (e.target.checked) {
                                newItems[item] = 1;
                              } else {
                                newItems[item] = 0;
                              }
                              setQuestionnaireData({...questionnaireData, specialtyItems: newItems});
                            }}
                          />
                          <span className="text-xs flex-1 leading-tight">{item}</span>
                          <Input 
                            type="number" 
                            min="0" 
                            max="20" 
                            className="w-12 h-6 text-xs flex-shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            placeholder="#"
                            value={questionnaireData.specialtyItems[item] || ""}
                            onChange={(e) => {
                              const newItems = { ...questionnaireData.specialtyItems };
                              newItems[item] = parseInt(e.target.value) || 0;
                              setQuestionnaireData({...questionnaireData, specialtyItems: newItems});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Boxes and Miscellaneous */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Estimated Boxes & Miscellaneous</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="smallBoxes" className="text-sm">Small Boxes (1.5 cu ft)</Label>
                        <Input 
                          id="smallBoxes" 
                          type="number" 
                          min="0" 
                          placeholder="0"
                          value={questionnaireData.smallBoxes}
                          onChange={(e) => setQuestionnaireData({...questionnaireData, smallBoxes: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mediumBoxes" className="text-sm">Medium Boxes (3.0 cu ft)</Label>
                        <Input 
                          id="mediumBoxes" 
                          type="number" 
                          min="0" 
                          placeholder="0"
                          value={questionnaireData.mediumBoxes}
                          onChange={(e) => setQuestionnaireData({...questionnaireData, mediumBoxes: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="largeBoxes" className="text-sm">Large Boxes (4.5 cu ft)</Label>
                        <Input 
                          id="largeBoxes" 
                          type="number" 
                          min="0" 
                          placeholder="0"
                          value={questionnaireData.largeBoxes}
                          onChange={(e) => setQuestionnaireData({...questionnaireData, largeBoxes: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="packingServices">Packing Services Needed</Label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={questionnaireData.packingServices}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, packingServices: e.target.value})}
                    >
                      <option value="">Select packing preference</option>
                      <option value="full">Full packing service</option>
                      <option value="partial">Partial packing (fragiles only)</option>
                      <option value="supplies">Packing supplies only</option>
                      <option value="self">Self-pack everything</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="additionalServices">Additional Services</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        'Furniture disassembly/reassembly',
                        'Appliance disconnection/reconnection',
                        'Temporary storage',
                        'Junk removal/disposal',
                        'Cleaning services'
                      ].map((service) => (
                        <label key={service} className="flex items-center space-x-2 text-sm">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded"
                            checked={questionnaireData.additionalServices.includes(service)}
                            onChange={(e) => {
                              const newServices = e.target.checked 
                                ? [...questionnaireData.additionalServices, service]
                                : questionnaireData.additionalServices.filter(s => s !== service);
                              setQuestionnaireData({...questionnaireData, additionalServices: newServices});
                            }}
                          />
                          <span>{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialInstructions">Special Instructions or Concerns</Label>
                    <Textarea 
                      id="specialInstructions" 
                      placeholder="Narrow doorways, stairs, parking restrictions, fragile items requiring special care, etc."
                      className="min-h-[80px]"
                      value={questionnaireData.specialInstructions}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, specialInstructions: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={questionnaireData.email}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, email: e.target.value})}
                      placeholder="Where to send your PDF questionnaire"
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <div className="flex gap-3">
                      <Button 
                        type="button"
                        onClick={handleSaveQuestionnaire}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Save Questionnaire
                      </Button>
                      <Button 
                        type="button"
                        onClick={handleDownloadPDF}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>

                    {questionnaireData.email && (
                      <Button 
                        type="button"
                        onClick={handleSendPDFToEmail}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Send PDF to Email
                      </Button>
                    )}

                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuestionnaireForm(false)}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}