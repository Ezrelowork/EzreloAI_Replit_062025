import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import jsPDF from 'jspdf';
import { 
  ArrowLeft, 
  Truck, 
  Home, 
  Zap, 
  MapPin,
  Star,
  Clock,
  Phone,
  CheckCircle,
  AlertTriangle,
  Info,
  MessageSquare,
  User,
  Loader2
} from 'lucide-react';

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

interface UtilityService {
  category: string;
  provider: string;
  phone: string;
  description: string;
  website: string;
  referralUrl: string;
  services: string[];
  estimatedCost: string;
  rating: number;
  availability: string;
}

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
}

interface TaskPageProps {
  task: {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    week: string;
    category: string;
  };
  onComplete: () => void;
  onBack?: () => void;
  onTaskComplete?: (taskId: string) => void;
}

export const TaskPage: React.FC<TaskPageProps> = ({ task, onComplete, onBack, onTaskComplete }) => {
  const [, setLocation] = useLocation();
  const [movingCompanies, setMovingCompanies] = useState<MovingCompany[]>([]);
  const [utilities, setUtilities] = useState<UtilityService[]>([]);
  const [housingServices, setHousingServices] = useState<HousingService[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState<'moving' | 'utilities' | 'housing'>('moving');
  const [moveData, setMoveData] = useState({ from: '', to: '', date: '' });
  const [selectedFont, setSelectedFont] = useState('font-inter');
  const [selectedMover, setSelectedMover] = useState<MovingCompany | null>(null);
  const [movingProject, setMovingProject] = useState<any>(null);
  const [expandedReviews, setExpandedReviews] = useState<string[]>([]);
  const [showQuestionnaireForm, setShowQuestionnaireForm] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [savedQuestionnaires, setSavedQuestionnaires] = useState<any[]>([]);
  const [hasCompletedActions, setHasCompletedActions] = useState(false);

  // Determine if task can be marked complete based on user actions
  const canCompleteTask = () => {
    if (searchType === 'moving') {
      return selectedMover !== null || hasCompletedActions || 
             (currentQuestionnaire && Object.keys((currentQuestionnaire as any)?.majorItems || {}).length > 0);
    }
    return showResults; // For other task types, showing results indicates engagement
  };
  const [questionnaireData, setQuestionnaireData] = useState({
    currentAddress: '',
    destinationAddress: '',
    movingDate: '',
    homeSize: '',
    squareFootage: '',
    currentFloors: '',
    destinationFloors: '',
    majorItems: {} as Record<string, number>,
    packingServices: '',
    furnitureDisassembly: '',
    fragileItems: '',
    storageNeeds: '',
    parkingAccess: '',
    additionalNotes: '',
    email: ''
  });

  const { toast } = useToast();

  // Google reviews data state
  const [googleReviewsData, setGoogleReviewsData] = useState<{[key: string]: any}>({});
  const [loadingReviews, setLoadingReviews] = useState<{[key: string]: boolean}>({});

  // Function to fetch Google reviews for a specific company
  const fetchGoogleReviews = async (companyName: string, location: string, countOnly = false) => {
    if (googleReviewsData[companyName] || loadingReviews[companyName]) return;
    
    setLoadingReviews(prev => ({ ...prev, [companyName]: true }));
    
    try {
      const endpoint = countOnly ? 
        `/api/google-reviews/${encodeURIComponent(companyName)}?location=${encodeURIComponent(location || '')}&countOnly=true` :
        `/api/google-reviews/${encodeURIComponent(companyName)}?location=${encodeURIComponent(location || '')}`;
      
      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      setGoogleReviewsData(prev => ({ ...prev, [companyName]: data }));
    } catch (error) {
      console.error('Failed to fetch Google reviews for', companyName, error);
    } finally {
      setLoadingReviews(prev => ({ ...prev, [companyName]: false }));
    }
  };

  // Auto-fetch review counts when moving companies are loaded
  useEffect(() => {
    if (movingCompanies.length > 0 && moveData.to) {
      movingCompanies.forEach(company => {
        if (!googleReviewsData[company.provider] && !loadingReviews[company.provider]) {
          fetchGoogleReviews(company.provider, moveData.to, true);
        }
      });
    }
  }, [movingCompanies.length, moveData.to]);

  const queryClient = useQueryClient();

  // Auto-load or create project on page load
  useEffect(() => {
    const loadProject = async () => {
      if (!movingProject) {
        try {
          // Try to get existing project for user
          const response = await apiRequest("POST", "/api/moving-project", {
            userId: 1, // Default user for now
            fromAddress: "Not specified",
            toAddress: "Not specified",
            moveDate: null,
            projectStatus: "active"
          });
          if (response.ok) {
            const projectData = await response.json();
            setMovingProject(projectData.project);
          }
        } catch (error) {
          console.error('Error loading project:', error);
        }
      }
    };
    loadProject();
  }, [movingProject]);

  // Fetch current questionnaire
  const { data: currentQuestionnaire } = useQuery({
    queryKey: [`/api/current-questionnaire/${movingProject?.id}`, movingProject?.id],
    enabled: !!movingProject?.id,
  });



  const refreshCurrentQuestionnaire = () => {
    if (movingProject?.id) {
      queryClient.invalidateQueries({
        queryKey: [`/api/current-questionnaire/${movingProject.id}`, movingProject.id]
      });
      // Also refetch immediately
      queryClient.refetchQueries({
        queryKey: [`/api/current-questionnaire/${movingProject.id}`, movingProject.id]
      });
    }
  };



  // Load saved questionnaire data when available
  useEffect(() => {
    if (currentQuestionnaire && !showQuestionnaireForm) {
      setQuestionnaireData(currentQuestionnaire as any);
    }
  }, [currentQuestionnaire, showQuestionnaireForm]);

  // Create or get moving project
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await apiRequest("POST", "/api/moving-project", projectData);
      return response.json();
    },
    onSuccess: (data: any) => {
      setMovingProject(data.project);
    }
  });

  // Select mover mutation
  const selectMoverMutation = useMutation({
    mutationFn: async ({ projectId, moverData }: { projectId: number; moverData: MovingCompany }) => {
      const response = await apiRequest("POST", "/api/select-mover", { projectId, moverData });
      return response.json();
    },
    onSuccess: (data: any) => {
      setSelectedMover(data.project.selectedMover);
      setMovingProject(data.project);
      toast({
        title: "Mover Selected Successfully",
        description: `${data.project.selectedMover.provider} is now your chosen moving company. Your project has been created.`,
      });
    }
  });

  // Load move data and cached results from localStorage on component mount
  useEffect(() => {
    const fromLocation = localStorage.getItem('aiFromLocation') || 'Austin, TX';
    const toLocation = localStorage.getItem('aiToLocation') || 'Dallas, TX';
    const moveDate = localStorage.getItem('aiMoveDate') || '2024-08-15';
    
    setMoveData({
      from: fromLocation,
      to: toLocation,
      date: moveDate
    });

    // Load cached data based on task type
    const taskTitle = task.title.toLowerCase();
    if (taskTitle.includes('moving') || taskTitle.includes('mover')) {
      const cachedMovingData = localStorage.getItem(`movingCompanies_${fromLocation}_${toLocation}`);
      if (cachedMovingData) {
        const companies = JSON.parse(cachedMovingData);
        setMovingCompanies(companies);
        setSearchType('moving');
        setShowResults(true);
      }
    } else if (taskTitle.includes('utilities') || taskTitle.includes('electric') || taskTitle.includes('gas')) {
      const cachedUtilitiesData = localStorage.getItem(`utilities_${toLocation}`);
      if (cachedUtilitiesData) {
        const utilities = JSON.parse(cachedUtilitiesData);
        setUtilities(utilities);
        setSearchType('utilities');
        setShowResults(true);
      }
    } else if (taskTitle.includes('housing') || taskTitle.includes('real estate') || taskTitle.includes('home')) {
      const cachedHousingData = localStorage.getItem(`housing_${toLocation}`);
      if (cachedHousingData) {
        const housing = JSON.parse(cachedHousingData);
        setHousingServices(housing);
        setSearchType('housing');
        setShowResults(true);
      }
    }
  }, [task.title]);

  const movingCompanyMutation = useMutation({
    mutationFn: async () => {
      // Parse from and to locations
      const [fromCity, fromState] = moveData.from.split(', ');
      const [toCity, toState] = moveData.to.split(', ');
      
      const response = await apiRequest("POST", "/api/moving-companies", {
        fromCity,
        fromState,
        toCity,
        toState,
        moveDate: moveData.date
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const companies = data?.companies || [];
      setMovingCompanies(companies);
      setSearchType('moving');
      setShowResults(true);
      
      // Cache the results for future visits
      localStorage.setItem(`movingCompanies_${moveData.from}_${moveData.to}`, JSON.stringify(companies));
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Unable to find moving companies. Please try again.",
        variant: "destructive",
      });
    },
  });

  const utilitiesMutation = useMutation({
    mutationFn: async () => {
      const toParts = moveData.to.split(',');
      const response = await apiRequest("POST", "/api/utilities", {
        city: toParts[0]?.trim() || "Dallas",
        state: toParts[1]?.trim() || "TX",
        zipCode: toParts[2]?.trim() || "75201"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const services = data?.services || [];
      setUtilities(services);
      setSearchType('utilities');
      setShowResults(true);
      
      // Cache the results for future visits
      localStorage.setItem(`utilities_${moveData.to}`, JSON.stringify(services));
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Unable to find utility services. Please try again.",
        variant: "destructive",
      });
    },
  });

  const housingMutation = useMutation({
    mutationFn: async () => {
      const toParts = moveData.to.split(',');
      const response = await apiRequest("POST", "/api/housing-services", {
        city: toParts[0]?.trim() || "Dallas",
        state: toParts[1]?.trim() || "TX",
        zipCode: toParts[2]?.trim() || "75201"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const services = data?.services || [];
      setHousingServices(services);
      setSearchType('housing');
      setShowResults(true);
      
      // Cache the results for future visits
      localStorage.setItem(`housing_${moveData.to}`, JSON.stringify(services));
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Unable to find housing services. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReferralClick = async (company: MovingCompany, action: string) => {
    try {
      await apiRequest("POST", "/api/referral-click", {
        provider: company.provider,
        category: company.category,
        action: action,
        userAddress: moveData.from
      });
      
      if (action === 'website_visit') {
        window.open(company.website, '_blank');
        setHasCompletedActions(true); // Mark progress for website visits
      } else if (action === 'quote_request') {
        window.open(company.referralUrl, '_blank');
        setHasCompletedActions(true); // Mark progress for quote requests
      }
    } catch (error) {
      console.error('Failed to track referral click:', error);
    }
  };

  const handleSelectMover = async (company: MovingCompany) => {
    try {
      // First, create or get the moving project
      if (!movingProject) {
        const projectData = {
          userId: 1, // For now, using a default user ID - in real app would get from auth
          fromAddress: moveData.from,
          toAddress: moveData.to,
          moveDate: moveData.date
        };
        await createProjectMutation.mutateAsync(projectData);
      }

      // Then select the mover
      if (movingProject?.id) {
        await selectMoverMutation.mutateAsync({
          projectId: movingProject.id,
          moverData: company
        });
        
        // Mark that user has completed meaningful actions
        setHasCompletedActions(true);
      }
    } catch (error) {
      toast({
        title: "Selection Failed",
        description: "Unable to select mover. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateMovingQuestionnairePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Moving Estimate Questionnaire', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Complete this form to get accurate moving quotes from professionals', 20, 40);
    
    let yPosition = 60;
    
    // Pre-filled information from moveData
    if (moveData.from || moveData.to || moveData.date) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Your Moving Details:', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      
      if (moveData.from) {
        doc.text(`Current Location: ${moveData.from}`, 25, yPosition);
        yPosition += 10;
      }
      if (moveData.to) {
        doc.text(`Destination: ${moveData.to}`, 25, yPosition);
        yPosition += 10;
      }
      if (moveData.date) {
        doc.text(`Moving Date: ${moveData.date}`, 25, yPosition);
        yPosition += 15;
      }
    }
    
    // Questions section
    const questions = [
      { q: '1. Current Address:', detail: 'Include full address with unit/apartment number' },
      { q: '2. Destination Address:', detail: 'Include full address with unit/apartment number' },
      { q: '3. Desired Moving Date:', detail: 'Include preferred time of day if flexible' },
      { q: '4. Home Size:', detail: 'Studio / 1BR / 2BR / 3BR / 4BR+ or square footage' },
      { q: '5. Number of Floors:', detail: 'At current location: ___ At destination: ___' },
      { q: '6. Major Items Being Moved:', detail: 'List furniture, appliances, piano, safe, etc.' },
      { q: '7. Packing Services Needed:', detail: 'Full packing / Partial / Self-pack / Fragiles only' },
      { q: '8. Furniture Disassembly/Reassembly:', detail: 'List items that need disassembly' },
      { q: '9. Fragile or Specialty Items:', detail: 'TVs, antiques, artwork, musical instruments' },
      { q: '10. Storage Requirements:', detail: 'Temporary storage needed? Duration: ___' },
      { q: '11. Parking & Access:', detail: 'Truck access, elevators, stairs, permits needed?' }
    ];
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Questions for Moving Companies:', 20, yPosition);
    yPosition += 15;
    
    questions.forEach((item) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(item.q, 20, yPosition);
      yPosition += 8;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(item.detail, 25, yPosition);
      yPosition += 15;
      
      // Add lines for writing
      doc.setDrawColor(200, 200, 200);
      for (let i = 0; i < 3; i++) {
        doc.line(25, yPosition + (i * 5), 190, yPosition + (i * 5));
      }
      yPosition += 20;
    });
    
    // Add new page for additional notes
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Additional Notes & Special Requirements:', 20, 30);
    
    // Add lines for notes
    doc.setDrawColor(200, 200, 200);
    for (let i = 0; i < 20; i++) {
      doc.line(20, 50 + (i * 10), 190, 50 + (i * 10));
    }
    
    // Footer
    yPosition = 270;
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Tip: Having this information ready will help you get more accurate quotes faster!', 20, yPosition);
    
    // Save the PDF
    doc.save('moving-estimate-questionnaire.pdf');
    
    toast({
      title: "PDF Downloaded",
      description: "Your moving questionnaire has been saved as a PDF.",
    });
  };

  const generateFilledPDF = () => {
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
    
    // User's answers
    const responses = [
      { label: 'Current Address:', value: questionnaireData.currentAddress || moveData.from },
      { label: 'Destination Address:', value: questionnaireData.destinationAddress || moveData.to },
      { label: 'Moving Date:', value: questionnaireData.movingDate || moveData.date },
      { label: 'Home Size:', value: questionnaireData.homeSize },
      { label: 'Square Footage:', value: questionnaireData.squareFootage },
      { label: 'Current Location Floors:', value: questionnaireData.currentFloors },
      { label: 'Destination Floors:', value: questionnaireData.destinationFloors },
      { label: 'Major Items:', value: Object.entries(questionnaireData.majorItems).map(([item, qty]) => `${item} (${qty})`).join(', ') || 'None specified' },
      { label: 'Packing Services:', value: questionnaireData.packingServices },
      { label: 'Furniture Disassembly:', value: questionnaireData.furnitureDisassembly },
      { label: 'Fragile Items:', value: questionnaireData.fragileItems },
      { label: 'Storage Needs:', value: questionnaireData.storageNeeds },
      { label: 'Parking Access:', value: questionnaireData.parkingAccess },
      { label: 'Additional Notes:', value: questionnaireData.additionalNotes }
    ];

    responses.forEach((item) => {
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

    return doc;
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
      // Generate PDF with filled data
      const doc = generateFilledPDF();
      const pdfBlob = doc.output('blob');
      
      // Convert to base64 for sending
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64PDF = reader.result?.toString().split(',')[1];
        
        // Send email with PDF attachment
        const response = await apiRequest("POST", "/api/send-questionnaire-email", {
          email: questionnaireData.email,
          questionnaire: questionnaireData,
          pdfData: base64PDF,
          moveDetails: moveData
        });

        if (response.ok) {
          console.log('PDF sent successfully, now saving questionnaire...');
          
          // Create or get moving project and save questionnaire
          let projectToUse = movingProject;
          if (!projectToUse?.id) {
            console.log('Creating new project...');
            // Create a new project for this questionnaire
            const projectResponse = await apiRequest("POST", "/api/moving-project", {
              userId: 1, // Default user for now
              fromAddress: questionnaireData.currentAddress || "Not specified",
              toAddress: questionnaireData.destinationAddress || "Not specified",
              moveDate: questionnaireData.movingDate || null,
              projectStatus: "active"
            });
            if (projectResponse.ok) {
              const projectData = await projectResponse.json();
              projectToUse = projectData.project; // Extract the project from the response
              console.log('Project created:', projectToUse);
              setMovingProject(projectToUse);
            } else {
              console.error('Failed to create project:', projectResponse.status);
            }
          }
          
          if (projectToUse?.id) {
            console.log('Archiving questionnaire for project:', projectToUse.id);
            try {
              const archiveResponse = await apiRequest("POST", "/api/archive-questionnaire", {
                projectId: projectToUse.id,
                questionnaire: questionnaireData,
                pdfData: base64PDF,
                type: "email_pdf"
              });
              console.log('Archive response:', archiveResponse.status);
              
              if (archiveResponse.ok) {
                console.log('Questionnaire archived successfully');
                // Refresh current questionnaire
                refreshCurrentQuestionnaire();
              } else {
                console.error('Failed to archive questionnaire:', archiveResponse.status);
              }
            } catch (error) {
              console.error('Error archiving questionnaire:', error);
            }
          } else {
            console.error('No project available to save questionnaire');
          }
          
          toast({
            title: "PDF Sent Successfully",
            description: `Your moving questionnaire has been sent to ${questionnaireData.email}`,
          });
          
          // Close form but keep data
          setShowQuestionnaireForm(false);
          // Don't reset the data - it's now saved in the project
          setHasCompletedActions(true); // Mark progress for questionnaire completion
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

  const handleShareWithMovers = async () => {
    if (!questionnaireData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to share with movers.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    
    try {
      // Generate professional mover outreach
      const response = await apiRequest("POST", "/api/share-with-movers", {
        projectId: movingProject?.id,
        questionnaire: questionnaireData,
        moveDetails: moveData,
        selectedMovers: movingCompanies.slice(0, 3) // Top 3 recommended movers
      });

      if (response.ok) {
        toast({
          title: "AI Outreach Complete!",
          description: "Your move details have been sent to our top recommended movers. Expect quotes within 24 hours.",
        });
        
        // Create or get moving project and save questionnaire
        let projectToUse = movingProject;
        if (!projectToUse?.id) {
          // Create a new project for this questionnaire
          const projectResponse = await apiRequest("POST", "/api/moving-project", {
            userId: 1, // Default user for now
            fromAddress: questionnaireData.currentAddress || "Not specified",
            toAddress: questionnaireData.destinationAddress || "Not specified",
            moveDate: questionnaireData.movingDate || null,
            projectStatus: "active"
          });
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            projectToUse = projectData.project; // Extract the project from the response
            setMovingProject(projectToUse);
          }
        }
        
        if (projectToUse?.id) {
          await apiRequest("POST", "/api/archive-questionnaire", {
            projectId: projectToUse.id,
            questionnaire: questionnaireData,
            type: "ai_outreach"
          });
          
          await apiRequest("POST", "/api/communication", {
            projectId: projectToUse.id,
            communicationType: "ai_outreach",
            subject: "AI-Powered Mover Outreach Initiated",
            notes: `Ezrelo AI automatically shared comprehensive move details with ${movingCompanies.slice(0, 3).length} premium movers. Includes detailed inventory, preferences, and timeline.`,
            contactPerson: "Ezrelo AI Assistant"
          });
          
          // Refresh current questionnaire
          refreshCurrentQuestionnaire();
        }
        
        setShowQuestionnaireForm(false);
        // Don't reset data - it's saved in the project
      }
    } catch (error) {
      toast({
        title: "Sharing Failed",
        description: "Unable to share with movers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const getTaskConfig = () => {
    const title = task.title.toLowerCase();
    if (title.includes('moving') || title.includes('mover')) {
      return { icon: Truck, color: 'bg-blue-600' };
    } else if (title.includes('utilities') || title.includes('electric') || title.includes('gas')) {
      return { icon: Zap, color: 'bg-yellow-600' };
    } else if (title.includes('housing') || title.includes('real estate') || title.includes('home')) {
      return { icon: Home, color: 'bg-green-600' };
    }
    return { icon: Info, color: 'bg-gray-600' };
  };

  const getTaskSteps = () => {
    const taskTitle = task.title.toLowerCase();
    if (taskTitle.includes('moving') || taskTitle.includes('mover')) {
      return [
        { title: "Get Quotes", description: "Compare pricing from multiple providers" },
        { title: "Check Reviews", description: "Verify company reputation and licensing" },
        { title: "Book Service", description: "Schedule your preferred moving date" },
        { title: "Prepare Items", description: "Pack and organize belongings" }
      ];
    }
    return [
      { title: "Research Options", description: "Compare available services" },
      { title: "Contact Providers", description: "Get pricing and availability" },
      { title: "Schedule Setup", description: "Book installation or activation" },
      { title: "Confirm Details", description: "Verify service requirements" }
    ];
  };

  const config = getTaskConfig();
  const IconComponent = config.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${selectedFont}`}>
      {/* Questionnaire Form Modal */}
      {showQuestionnaireForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto mt-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Moving Estimate Questionnaire</h2>
                <button
                  onClick={() => setShowQuestionnaireForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(formProgress)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${formProgress}%` }}
                  ></div>
                </div>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentAddress">Current Address</Label>
                    <Input
                      id="currentAddress"
                      value={questionnaireData.currentAddress || moveData.from}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, currentAddress: e.target.value})}
                      placeholder="Full address with unit number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="destinationAddress">Destination Address</Label>
                    <Input
                      id="destinationAddress"
                      value={questionnaireData.destinationAddress || moveData.to}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, destinationAddress: e.target.value})}
                      placeholder="Full address with unit number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="movingDate">Moving Date</Label>
                    <Input
                      id="movingDate"
                      type="date"
                      value={questionnaireData.movingDate || moveData.date}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, movingDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="homeSize">Home Size</Label>
                    <Select value={questionnaireData.homeSize} onValueChange={(value) => setQuestionnaireData({...questionnaireData, homeSize: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select home size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="1br">1 Bedroom</SelectItem>
                        <SelectItem value="2br">2 Bedroom</SelectItem>
                        <SelectItem value="3br">3 Bedroom</SelectItem>
                        <SelectItem value="4br">4+ Bedroom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="squareFootage">Square Footage (if known)</Label>
                    <Input
                      id="squareFootage"
                      value={questionnaireData.squareFootage}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, squareFootage: e.target.value})}
                      placeholder="e.g., 1200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentFloors">Current Location Floors</Label>
                    <Input
                      id="currentFloors"
                      value={questionnaireData.currentFloors}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, currentFloors: e.target.value})}
                      placeholder="e.g., 2nd floor, elevator"
                    />
                  </div>
                  <div>
                    <Label htmlFor="destinationFloors">Destination Floors</Label>
                    <Input
                      id="destinationFloors"
                      value={questionnaireData.destinationFloors}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, destinationFloors: e.target.value})}
                      placeholder="e.g., 1st floor, stairs"
                    />
                  </div>
                </div>

                <div>
                  <Label>Major Items Being Moved</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 border rounded-lg bg-gray-50 max-h-80 overflow-y-auto">
                    {[
                      // Living Room
                      { category: 'Living Room', items: ['Sofa/Couch', 'Coffee Table', 'End Tables', 'TV Stand', 'Entertainment Center', 'Recliner', 'Bookshelf', 'Armchair'] },
                      // Bedroom
                      { category: 'Bedroom', items: ['Queen Bed', 'King Bed', 'Twin Bed', 'Dresser', 'Nightstand', 'Wardrobe', 'Mattress'] },
                      // Dining Room
                      { category: 'Dining Room', items: ['Dining Table', 'Dining Chairs', 'China Cabinet', 'Bar Stools'] },
                      // Kitchen
                      { category: 'Kitchen', items: ['Refrigerator', 'Dishwasher', 'Microwave', 'Washer', 'Dryer'] },
                      // Electronics
                      { category: 'Electronics', items: ['Large TV (55"+)', 'Medium TV (32-54")', 'Computer/Desk', 'Piano', 'Exercise Equipment'] },
                      // Storage & Misc
                      { category: 'Storage & Misc', items: ['Filing Cabinet', 'Safe', 'Tool Chest', 'Outdoor Furniture', 'Lawn Mower', 'Bicycles'] }
                    ].map((category) => (
                      <div key={category.category} className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-800 border-b pb-1">{category.category}</h4>
                        {category.items.map((item) => (
                          <div key={item} className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-sm flex-1">
                              <input
                                type="checkbox"
                                checked={(questionnaireData.majorItems[item] || 0) > 0}
                                onChange={(e) => {
                                  const newItems = { ...questionnaireData.majorItems };
                                  if (e.target.checked) {
                                    newItems[item] = 1;
                                  } else {
                                    delete newItems[item];
                                  }
                                  setQuestionnaireData({...questionnaireData, majorItems: newItems});
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-gray-700">{item}</span>
                            </label>
                            {(questionnaireData.majorItems[item] || 0) > 0 && (
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={questionnaireData.majorItems[item] || 1}
                                onChange={(e) => {
                                  const quantity = parseInt(e.target.value) || 1;
                                  setQuestionnaireData({
                                    ...questionnaireData, 
                                    majorItems: { ...questionnaireData.majorItems, [item]: quantity }
                                  });
                                }}
                                className="w-16 px-2 py-1 text-sm border rounded"
                                placeholder="1"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="packingServices">Packing Services Needed</Label>
                    <Select value={questionnaireData.packingServices} onValueChange={(value) => setQuestionnaireData({...questionnaireData, packingServices: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select packing preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full packing service</SelectItem>
                        <SelectItem value="partial">Partial packing</SelectItem>
                        <SelectItem value="self">Self-pack</SelectItem>
                        <SelectItem value="fragiles">Fragiles only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="furnitureDisassembly">Furniture Disassembly Needed</Label>
                    <Input
                      id="furnitureDisassembly"
                      value={questionnaireData.furnitureDisassembly}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, furnitureDisassembly: e.target.value})}
                      placeholder="List items needing disassembly"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fragileItems">Fragile or Specialty Items</Label>
                  <Textarea
                    id="fragileItems"
                    value={questionnaireData.fragileItems}
                    onChange={(e) => setQuestionnaireData({...questionnaireData, fragileItems: e.target.value})}
                    placeholder="TVs, antiques, artwork, musical instruments, etc."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storageNeeds">Storage Requirements</Label>
                    <Input
                      id="storageNeeds"
                      value={questionnaireData.storageNeeds}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, storageNeeds: e.target.value})}
                      placeholder="Duration and type needed"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parkingAccess">Parking & Truck Access</Label>
                    <Input
                      id="parkingAccess"
                      value={questionnaireData.parkingAccess}
                      onChange={(e) => setQuestionnaireData({...questionnaireData, parkingAccess: e.target.value})}
                      placeholder="Parking, elevators, permits needed?"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={questionnaireData.additionalNotes}
                    onChange={(e) => setQuestionnaireData({...questionnaireData, additionalNotes: e.target.value})}
                    placeholder="Any special requirements or concerns"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={questionnaireData.email}
                    onChange={(e) => setQuestionnaireData({...questionnaireData, email: e.target.value})}
                    placeholder="Where to send your PDF questionnaire"
                    required
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={handleSendPDFToEmail}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Send PDF to My Email
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuestionnaireForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <Button
                    type="button"
                    onClick={handleShareWithMovers}
                    disabled={isSharing}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-75 text-white font-medium flex items-center justify-center gap-2 relative overflow-hidden"
                  >
                    {isSharing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Processing AI Outreach...</span>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse"></div>
                        <span className="relative">🚀</span>
                        <span className="relative">AI-Powered Mover Outreach</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            {/* Left Section - 2/3 width */}
            <div className="flex items-center gap-6 flex-1 mr-8">
              <div className={`p-4 rounded-lg ${config.color} text-white shadow-lg`}>
                <IconComponent className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">{task.title}</h1>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${config.color}`}>
                    {task.priority.toUpperCase()}
                  </span>
                  <span className="text-gray-600 text-sm font-medium">Timeline: {task.week}</span>
                  <span className="text-gray-600 text-sm font-medium">Category: {task.category}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{moveData.from}</span>
                    <span className="text-blue-600">→</span>
                    <span>{moveData.to}</span>
                    <span className="text-gray-500 text-xs ml-3">Move Date: {new Date(moveData.date).toLocaleDateString()}</span>
                  </div>
                  {/* Status Information */}
                  <div className="min-h-[24px] flex items-center gap-2">
                    {showResults && searchType === 'moving' && movingCompanies.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md w-fit">
                        <CheckCircle className="w-3 h-3" />
                        <span>{movingCompanies.length} providers (cached)</span>
                      </div>
                    )}
                    {showResults && searchType === 'utilities' && utilities.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md w-fit">
                        <CheckCircle className="w-3 h-3" />
                        <span>{utilities.length} services (cached)</span>
                      </div>
                    )}
                    {showResults && searchType === 'housing' && housingServices.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md w-fit">
                        <CheckCircle className="w-3 h-3" />
                        <span>{housingServices.length} services (cached)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Section - Progress (1/3 width) */}
            <div className="w-1/3">
              <h3 className="text-sm font-bold text-gray-900 mb-3 text-right">Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    {selectedMover ? 'Book' : currentQuestionnaire ? 'Quote' : 'Research'}
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    {selectedMover ? '75' : currentQuestionnaire ? '50' : '25'}%
                  </span>
                </div>
                
                {/* Progress Bar with Milestone Markers */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3 relative">
                    {/* Progress Fill */}
                    <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${selectedMover ? '75' : currentQuestionnaire ? '50' : '25'}%` }}></div>
                    
                    {/* Milestone Markers - Quarters */}
                    <div className="absolute top-0 left-1/4 w-0.5 h-3 bg-gray-400 transform -translate-x-0.5"></div>
                    <div className="absolute top-0 left-2/4 w-0.5 h-3 bg-gray-400 transform -translate-x-0.5"></div>
                    <div className="absolute top-0 left-3/4 w-0.5 h-3 bg-gray-400 transform -translate-x-0.5"></div>
                  </div>
                  
                  {/* Milestone Labels with Dynamic Status */}
                  <div className="grid grid-cols-4 gap-1 text-xs mt-1">
                    <span className={`flex items-center gap-1 text-left ${movingCompanies.length > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {movingCompanies.length > 0 ? <CheckCircle className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3" />}
                      Research
                    </span>
                    <span className={`text-center flex items-center justify-center gap-1 ${currentQuestionnaire ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {currentQuestionnaire ? <CheckCircle className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3" />}
                      Quote
                    </span>
                    <span className={`text-center flex items-center justify-center gap-1 ${selectedMover ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {selectedMover ? <CheckCircle className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3" />}
                      Book
                    </span>
                    <span className="text-right flex items-center justify-end gap-1 text-gray-500">
                      <div className="w-3 h-3" />
                      Complete
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="gap-1 text-sm py-2 px-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Hub
          </Button>
          <Button
            onClick={() => onBack ? onBack() : setLocation('/moving-journey')}
            variant="outline"
            className="border border-blue-600 hover:border-blue-700 text-blue-700 hover:text-blue-800 font-medium py-2 px-4 rounded-lg text-sm shadow-sm"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Journey
          </Button>
          
          {/* Stage-based primary action button */}
          {!currentQuestionnaire ? (
            <Button
              onClick={() => setShowQuestionnaireForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg text-sm shadow-sm transition-all"
            >
              Fill Out Questionnaire
            </Button>
          ) : !selectedMover ? (
            <Button
              onClick={() => movingCompanyMutation.mutate()}
              disabled={movingCompanyMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm shadow-sm transition-all"
            >
              {movingCompanyMutation.isPending ? 'Searching...' : 'Get Quotes'}
            </Button>
          ) : (
            <Button
              onClick={() => {
                toast({
                  title: "Ready to Book",
                  description: "Contact your selected mover to finalize booking details.",
                });
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg text-sm shadow-sm transition-all"
            >
              Book Mover
            </Button>
          )}
          

          
          <Button
            onClick={() => {
              if (canCompleteTask()) {
                toast({
                  title: "Task Completed!",
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
                  
                  setLocation(journeyUrl);
                }, 1000); // Brief delay for cinematic effect
              }
            }}
            disabled={!canCompleteTask()}
            className={`font-medium py-2 px-6 rounded-lg text-sm shadow-sm transition-all ${
              canCompleteTask() 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            {canCompleteTask() ? "Complete" : "Complete Task First"}
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
              
              setLocation(journeyUrl);
            }}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg text-sm shadow-sm transition-all"
          >
            Return to Journey
          </Button>
        </div>



        {/* Main Content Layout */}
        <div className="flex gap-6">
          {/* Service Results (55% width) */}
          <div className="w-full max-w-[55%]">
            {showResults && (
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-md border border-blue-100 p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  {searchType === 'moving' && `Providers: ${moveData.from} → ${moveData.to}`}
                  {searchType === 'utilities' && `Services: ${moveData.to}`}
                  {searchType === 'housing' && `Housing Services for ${moveData.to}`}
                </h2>
                <div className="space-y-3">
                  {searchType === 'moving' && movingCompanies.length > 0 && 
                    movingCompanies.map((company, index) => {
                      const isExpanded = expandedReviews.includes(company.provider);
                      const googleData = googleReviewsData[company.provider];
                      const isLoadingReviews = loadingReviews[company.provider];
                      const displayRating = googleData?.rating || company.rating;
                      const totalReviews = googleData?.totalReviews || 0;
                      
                      const toggleReviews = () => {
                        if (!googleData && !isLoadingReviews) {
                          fetchGoogleReviews(company.provider, moveData.to);
                        }
                        setExpandedReviews(prev => 
                          isExpanded 
                            ? prev.filter(name => name !== company.provider)
                            : [...prev, company.provider]
                        );
                      };

                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-bold text-gray-900">{company.provider}</h3>
                            {company.estimatedCost && !company.estimatedCost.includes('Contact for') && (
                              <span className="text-base font-bold text-green-600">{company.estimatedCost}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(displayRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-gray-700 font-medium">
                                {displayRating.toFixed(1)}
                                {totalReviews > 0 && (
                                  <span className="text-gray-500"> ({totalReviews} reviews)</span>
                                )}
                              </span>
                              {googleData && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                                  Google Verified
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <a 
                              href={`tel:${googleData?.phone || company.phone}`}
                              onClick={() => setHasCompletedActions(true)}
                              className="text-sm text-blue-600 hover:text-blue-700 underline"
                            >
                              {googleData?.phone || company.phone}
                            </a>
                          </div>

                          <p className="text-sm text-gray-700 mb-3">{company.description}</p>

                          {/* Google Reviews Section */}
                          <div className="mb-3">
                            <button
                              onClick={toggleReviews}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium mb-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              {isLoadingReviews ? 'Loading Google Reviews...' : 
                               totalReviews > 0 ? 
                               `Google Reviews (${totalReviews})` :
                               'Google Reviews'}
                            </button>
                            
                            {isExpanded && googleData?.reviews && googleData.reviews.length > 0 && (
                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                {googleData.reviews.slice(0, 3).map((review: any, idx: number) => (
                                  <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                      <User className="w-4 h-4 text-gray-400" />
                                      <span className="font-medium text-gray-900">{review.author}</span>
                                      <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-3 h-3 ${
                                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-xs text-gray-500">{review.relativeTime}</span>
                                    </div>
                                    <p className="text-gray-700 text-xs leading-relaxed">
                                      {review.text.length > 150 
                                        ? `${review.text.substring(0, 150)}...` 
                                        : review.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {isExpanded && googleData && (!googleData.reviews || googleData.reviews.length === 0) && (
                              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                                No Google reviews found for this company.
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {company.services.slice(0, 3).map((service, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                  {service}
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReferralClick(company, 'website_visit')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                              >
                                Website
                              </button>
                              <button
                                onClick={() => handleSelectMover(company)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                              >
                                Choose This Mover
                              </button>
                            </div>
                          </div>

                          {isLoadingReviews && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Loading Google reviews...
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Moving Organization Sidebar */}
          <div className="w-full max-w-[40%]">
            <div className="space-y-4">
              
              {/* Moving Estimate Questionnaire */}
              <div className="bg-white rounded-lg shadow-md border p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  Estimate Questionnaire
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Prepare for accurate moving quotes by having these details ready when you call.
                </p>
                <div className="space-y-3">
                  {!currentQuestionnaire ? (
                    <button
                      onClick={() => setShowQuestionnaireForm(true)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Fill Out Questionnaire
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setQuestionnaireData(currentQuestionnaire as any);
                        setShowQuestionnaireForm(true);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your Questionnaire
                    </button>
                  )}
                  
                  {/* Questionnaire Summary */}
                  {currentQuestionnaire && (
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <div className="text-xs text-green-700">
                        <div className="font-medium">{Object.keys((currentQuestionnaire as any)?.majorItems || {}).length} items • {(currentQuestionnaire as any)?.homeSize}</div>
                        <div>Last updated: {new Date((currentQuestionnaire as any)?.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="text-sm font-medium text-purple-900 mb-2">Key Information Needed:</div>
                    <div className="text-xs text-purple-700 space-y-1">
                      <div>• Current and destination addresses</div>
                      <div>• Moving date and home size</div>
                      <div>• Number of floors at each location</div>
                      <div>• Major items and inventory list</div>
                      <div>• Packing service preferences</div>
                      <div>• Special items and storage needs</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro Tips - Moved to second */}
              <div className="bg-white rounded-lg shadow-md border p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  Pro Tips
                </h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm font-medium text-blue-900">Best Booking Time</div>
                    <div className="text-xs text-blue-700">Book 8+ weeks ahead for summer moves, 4+ weeks for off-season</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-sm font-medium text-green-900">Save Money</div>
                    <div className="text-xs text-green-700">Move mid-month, mid-week, and avoid summer peak season</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <div className="text-sm font-medium text-red-900">Red Flags</div>
                    <div className="text-xs text-red-700">Avoid companies requiring large deposits or door-to-door sales</div>
                  </div>
                </div>
              </div>

              {/* Moving Checklist */}
              <div className="bg-white rounded-lg shadow-md border p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  Quick Checklist
                </h3>
                <div className="space-y-2">
                  {[
                    'Get 3+ written estimates',
                    'Check insurance coverage',
                    'Read reviews & references', 
                    'Verify license & bonding',
                    'Understand pricing structure',
                    'Confirm moving date'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moving Costs */}
              <div className="bg-white rounded-lg shadow-md border p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  Estimated Costs
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Local Move (same city)</span>
                    <span className="font-medium">$800-1,500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Long Distance (interstate)</span>
                    <span className="font-medium">$2,500-5,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Packing Services</span>
                    <span className="font-medium">$500-1,200</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Storage (per month)</span>
                    <span className="font-medium">$50-200</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-gray-900">Total Range</span>
                      <span className="text-green-600">$1,350-6,700</span>
                    </div>
                  </div>
                </div>
              </div>



            </div>
          </div>
        </div>
      </div>
    </div>
  );
};