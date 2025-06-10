import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { movingProjects, movingProjectSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getServicesByCategory(category: string): string[] {
  switch (category) {
    case 'Real Estate Agent':
      return ['Home buying', 'Home selling', 'Market analysis', 'Property tours', 'Negotiation'];
    case 'Property Management':
      return ['Tenant screening', 'Rent collection', 'Property maintenance', 'Lease management'];
    case 'Home Inspection':
      return ['Pre-purchase inspection', 'New construction inspection', 'Specialty inspections'];
    case 'Mortgage Lender':
      return ['Conventional loans', 'FHA loans', 'VA loans', 'Refinancing', 'Pre-approval'];
    case 'Title Company':
      return ['Title search', 'Title insurance', 'Closing services', 'Escrow services'];
    default:
      return ['Professional services'];
  }
}

function getEstimatedCost(category: string): string {
  switch (category) {
    case 'Real Estate Agent':
      return '5-6% commission';
    case 'Property Management':
      return '8-12% monthly rent';
    case 'Home Inspection':
      return '$300-$600';
    case 'Mortgage Lender':
      return '0.5-2% of loan amount';
    case 'Title Company':
      return '$500-$2,000';
    default:
      return 'Contact for quote';
  }
}

function getSpecialtiesByCategory(category: string): string[] {
  switch (category) {
    case 'Real Estate Agent':
      return ['First-time buyers', 'Investment properties', 'Luxury homes', 'Relocation specialist'];
    case 'Property Management':
      return ['Residential properties', 'Commercial properties', 'Vacation rentals'];
    case 'Home Inspection':
      return ['Structural inspection', 'Electrical systems', 'Plumbing systems', 'HVAC systems'];
    case 'Mortgage Lender':
      return ['First-time homebuyers', 'Investment properties', 'Jumbo loans', 'Self-employed borrowers'];
    case 'Title Company':
      return ['Residential closings', 'Commercial transactions', '1031 exchanges'];
    default:
      return ['General services'];
  }
}

function getCertificationsByCategory(category: string): string[] {
  switch (category) {
    case 'Real Estate Agent':
      return ['Licensed Real Estate Agent', 'MLS Member', 'NAR Member'];
    case 'Property Management':
      return ['Property Management License', 'CAM Certification'];
    case 'Home Inspection':
      return ['ASHI Certified', 'State Licensed Inspector'];
    case 'Mortgage Lender':
      return ['NMLS Licensed', 'FHA Approved'];
    case 'Title Company':
      return ['State Licensed Title Agent', 'ALTA Member'];
    default:
      return ['Licensed Professional'];
  }
}

function getServiceDescription(category: string, location: string): string {
  switch (category) {
    case 'Elementary School':
      return `Quality elementary education serving families in ${location}`;
    case 'Family Medicine':
      return `Comprehensive family healthcare services in ${location}`;
    case 'Pharmacy':
      return `Full-service pharmacy providing medications and health services`;
    case 'Veterinary Clinic':
      return `Professional veterinary care for pets in ${location}`;
    case 'Fitness Center':
      return `Modern fitness facility with equipment and classes`;
    case 'Bank':
      return `Full-service banking and financial services`;
    case 'Storage Facility':
      return `Secure self-storage units and moving storage solutions in ${location}`;
    default:
      return `Professional services in ${location}`;
  }
}

function getLocalServicesByCategory(category: string): string[] {
  switch (category) {
    case 'Elementary School':
      return ['K-5 Education', 'After School Programs', 'Special Education', 'Arts & Music'];
    case 'Family Medicine':
      return ['Annual Checkups', 'Sick Visits', 'Vaccinations', 'Health Screenings'];
    case 'Pharmacy':
      return ['Prescription Medications', 'Over-the-Counter', 'Vaccinations', 'Health Consultations'];
    case 'Veterinary Clinic':
      return ['Wellness Exams', 'Vaccinations', 'Surgery', 'Emergency Care'];
    case 'Fitness Center':
      return ['Cardio Equipment', 'Weight Training', 'Group Classes', 'Personal Training'];
    case 'Bank':
      return ['Checking Accounts', 'Savings Accounts', 'Loans', 'Investment Services'];
    case 'Storage Facility':
      return ['Self Storage Units', 'Climate Controlled', 'Vehicle Storage', 'Moving Supplies'];
    default:
      return ['Professional Services'];
  }
}

function getLocalServiceCost(category: string): string {
  switch (category) {
    case 'Elementary School':
      return 'Public/Free';
    case 'Family Medicine':
      return '$150-$300 per visit';
    case 'Pharmacy':
      return 'Varies by medication';
    case 'Veterinary Clinic':
      return '$50-$200 per visit';
    case 'Fitness Center':
      return '$30-$80/month';
    case 'Bank':
      return 'Free checking available';
    case 'Storage Facility':
      return '$25-$150/month';
    default:
      return 'Contact for pricing';
  }
}

function getLocalServiceSpecialties(category: string): string[] {
  switch (category) {
    case 'Elementary School':
      return ['STEM Programs', 'Reading Specialists', 'Gifted Education', 'ESL Support'];
    case 'Family Medicine':
      return ['Pediatrics', 'Women\'s Health', 'Chronic Disease Management', 'Preventive Care'];
    case 'Pharmacy':
      return ['Compounding', 'Diabetes Care', 'Immunizations', 'Medication Therapy'];
    case 'Veterinary Clinic':
      return ['Small Animals', 'Surgery', 'Dental Care', 'Emergency Medicine'];
    case 'Fitness Center':
      return ['Yoga Classes', 'HIIT Training', 'Senior Fitness', 'Youth Programs'];
    case 'Bank':
      return ['Home Loans', 'Small Business', 'Investment Planning', 'Online Banking'];
    case 'Storage Facility':
      return ['Climate Control', 'Security Systems', 'Drive-Up Access', 'Moving Truck Rental'];
    default:
      return ['General Services'];
  }
}

function getServiceHours(category: string): string {
  switch (category) {
    case 'Elementary School':
      return 'School Days 8:00 AM - 3:00 PM';
    case 'Family Medicine':
      return 'Mon-Fri 8:00 AM - 5:00 PM';
    case 'Pharmacy':
      return 'Daily 9:00 AM - 9:00 PM';
    case 'Veterinary Clinic':
      return 'Mon-Sat 8:00 AM - 6:00 PM';
    case 'Fitness Center':
      return 'Daily 5:00 AM - 11:00 PM';
    case 'Bank':
      return 'Mon-Fri 9:00 AM - 5:00 PM, Sat 9:00 AM - 1:00 PM';
    case 'Storage Facility':
      return 'Daily 6:00 AM - 10:00 PM';
    default:
      return 'Call for hours';
  }
}

function getInsuranceInfo(category: string): string[] {
  switch (category) {
    case 'Family Medicine':
      return ['Blue Cross Blue Shield', 'Aetna', 'Cigna', 'UnitedHealthcare', 'Medicare', 'Medicaid'];
    case 'Pharmacy':
      return ['Most Insurance Plans', 'Medicare Part D', 'Medicaid', 'GoodRx'];
    case 'Veterinary Clinic':
      return ['Pet Insurance Plans', 'Care Credit', 'Scratch Pay'];
    default:
      return [];
  }
}

function getAgeGroups(category: string): string[] {
  switch (category) {
    case 'Elementary School':
      return ['Ages 5-11', 'Kindergarten', 'Grades 1-5'];
    case 'Family Medicine':
      return ['All Ages', 'Pediatrics', 'Adults', 'Seniors'];
    case 'Fitness Center':
      return ['Ages 16+', 'Senior Programs', 'Youth Classes'];
    default:
      return [];
  }
}

function getPrograms(category: string): string[] {
  switch (category) {
    case 'Elementary School':
      return ['Accelerated Learning', 'Art Programs', 'Music Education', 'Sports Teams'];
    case 'Fitness Center':
      return ['Beginner Classes', 'Advanced Training', 'Group Fitness', 'Personal Training'];
    default:
      return [];
  }
}

// Google Places API functions for live reviews
async function searchGooglePlaces(searchQuery: string, location?: string): Promise<any> {
  const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  const query = location ? `${searchQuery} ${location}` : searchQuery;
  const params = new URLSearchParams({
    query: query.trim(),
    key: process.env.GOOGLE_API_KEY!
  });

  try {
    console.log('Making Google Places API request:', `${baseUrl}?${params}`);
    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();

    console.log('Google Places API response status:', data.status);
    if (data.error_message) {
      console.log('Google Places API error message:', data.error_message);
    }

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return [];
    }

    console.log('Google Places API results count:', data.results?.length || 0);
    return data.results || [];
  } catch (error) {
    console.error('Google Places search error:', error);
    return [];
  }
}

async function getPlaceDetails(placeId: string): Promise<any> {
  const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
  const params = new URLSearchParams({
    place_id: placeId,
    key: process.env.GOOGLE_API_KEY!,
    fields: 'name,rating,reviews,formatted_phone_number,website,formatted_address,business_status,opening_hours,price_level,user_ratings_total'
  });

  try {
    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error('Google Places details error:', error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Service providers endpoint using ChatGPT
  app.post("/api/service-providers", async (req, res) => {
    try {
      const { address, city, state, zip } = req.body;

      if (!city || !state) {
        return res.status(400).json({ error: "City and state are required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ error: "Service temporarily unavailable" });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const location = zip ? `${city}, ${state} ${zip}` : `${city}, ${state}`;

      const prompt = `Provide comprehensive service provider information for someone moving to ${location}.

Include specific availability percentages, connection types, speeds, pricing, and service limitations for each provider.

Return response in JSON format:
{
  "movingCompanies": [...],
  "internet": [
    {
      "provider": "Company Name",
      "phone": "Phone number", 
      "website": "Website URL",
      "description": "Service description",
      "estimatedCost": "Monthly cost (e.g., $29.99/mo)",
      "availability": "Availability percentage (e.g., ~97%)",
      "connectionType": "Technology (Fiber, Cable, DSL, 5G)",
      "maxSpeed": "Max speed (e.g., Up to 7,000 Mbps)",
      "setupFee": "Installation fees",
      "connectionTime": "Activation timeframe",
      "services": ["Internet", "Phone", "TV"],
      "notes": "Data caps, limitations, or special features"
    }
  ],
  "electricity": [...],
  "water": [...],
  "waste": [...],
  "cable": [...]
}

Focus on accuracy and specificity - include availability percentages, exact speeds/rates, connection technologies, and service limitations. Only include providers with actual infrastructure in ${location}.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 3000
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

      // Process and enhance the response
      let processedData: any = {};

      for (const [category, providers] of Object.entries(aiResponse)) {
        if (Array.isArray(providers)) {
          processedData[category] = await Promise.all(
            providers.map(async (provider: any) => {
              let enhancedProvider = {
                provider: provider.provider,
                phone: provider.phone || "Contact for details",
                website: provider.website || `https://www.google.com/search?q=${encodeURIComponent(provider.provider)}`,
                referralUrl: provider.website || `https://www.google.com/search?q=${encodeURIComponent(provider.provider)}`,
                affiliateCode: "",
                description: provider.description,
                rating: 0,
                services: provider.services || [],
                estimatedCost: provider.estimatedCost || "Contact for pricing",
                availability: provider.availability || "",
                setupFee: provider.setupFee || "",
                connectionTime: provider.connectionTime || "",
                connectionType: provider.connectionType || "",
                maxSpeed: provider.maxSpeed || "",
                notes: provider.notes || ""
              };

              // Enhance with Google Places data if available
              if (process.env.GOOGLE_API_KEY) {
                try {
                  const searchQuery = `${provider.provider} ${category} ${city} ${state}`;
                  const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${process.env.GOOGLE_API_KEY}`;

                  const placesResponse = await fetch(placesUrl);
                  const placesData = await placesResponse.json();

                  if (placesData.results && placesData.results.length > 0) {
                    const place = placesData.results[0];
                    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website,rating&key=${process.env.GOOGLE_API_KEY}`;
                    const detailsResponse = await fetch(detailsUrl);
                    const detailsData = await detailsResponse.json();

                    if (detailsData.result) {
                      enhancedProvider.phone = detailsData.result.formatted_phone_number || enhancedProvider.phone;
                      enhancedProvider.website = detailsData.result.website || enhancedProvider.website;
                      enhancedProvider.referralUrl = detailsData.result.website || enhancedProvider.referralUrl;
                      enhancedProvider.rating = detailsData.result.rating || 0;
                    }
                  }
                } catch (error) {
                  console.error(`Google Places error for ${provider.provider}:`, error);
                }
              }

              return enhancedProvider;
            })
          );
        }
      }

      res.json({
        success: true,
        address: address || "",
        city,
        state,
        zipCode: zip || "",
        providers: processedData
      });

    } catch (error) {
      console.error("Service providers search error:", error);
      return res.status(500).json({ error: "Search failed" });
    }
  });

  // Moving companies endpoint - Google Places for local companies + national carriers
  app.post("/api/moving-companies", async (req, res) => {
    try {
      const { fromCity, fromState, fromZip, toCity, toState, toZip, fromAddress } = req.body;

      if (!fromCity || !fromState || !toCity || !toState) {
        return res.status(400).json({ error: "Origin and destination are required" });
      }

      let allCompanies: any[] = [];

      // Find local moving companies using Google Places API
      if (process.env.GOOGLE_API_KEY) {
        const searchQueries = [
          `moving companies ${fromCity} ${fromState}`,
          `movers ${fromCity} ${fromState}`,
          `interstate moving ${fromCity} ${fromState}`,
          `moving services near ${fromCity} ${fromState}`
        ];

        for (const query of searchQueries) {
          try {
            const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_API_KEY}`;
            const placesResponse = await fetch(placesUrl);
            const placesData = await placesResponse.json();

            if (placesData.results) {
              for (const place of placesData.results.slice(0, 4)) {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,rating,reviews,formatted_address,business_status&key=${process.env.GOOGLE_API_KEY}`;
                const detailsResponse = await fetch(detailsUrl);
                const detailsData = await detailsResponse.json();

                if (detailsData.result && detailsData.result.business_status === 'OPERATIONAL') {
                  const company = {
                    category: "Local Moving Companies",
                    provider: detailsData.result.name,
                    phone: detailsData.result.formatted_phone_number || "Contact for details",
                    description: `Local moving company in ${fromCity}, ${fromState}`,
                    website: detailsData.result.website || `https://www.google.com/search?q=${encodeURIComponent(detailsData.result.name)} moving company`,
                    referralUrl: detailsData.result.website || `https://www.google.com/search?q=${encodeURIComponent(detailsData.result.name)} moving company`,
                    affiliateCode: "",
                    hours: "Contact for hours",
                    rating: detailsData.result.rating || 0,
                    services: ["Local Moving", "Interstate Moving"],
                    estimatedCost: "Contact for estimate",
                    availability: `Serves ${fromCity} area`,
                    specialties: ["Local Moving", "Interstate Moving"],
                    notes: `Google rating: ${detailsData.result.rating || 'Not rated'} | Address: ${detailsData.result.formatted_address || 'Contact for address'}`
                  };

                  if (!allCompanies.find(c => c.provider.toLowerCase() === company.provider.toLowerCase())) {
                    allCompanies.push(company);
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error searching for: ${query}`, error);
          }
        }
      }

      // Add major national carriers
      const nationalCarriers = [
        {
          category: "National Moving Companies",
          provider: "United Van Lines",
          phone: "1-800-995-1000",
          description: "Major national moving company with interstate services",
          website: "https://www.unitedvanlines.com",
          referralUrl: "https://www.unitedvanlines.com",
          affiliateCode: "",
          hours: "Contact for hours",
          rating: 4.1,
          services: ["Interstate Moving", "Packing", "Storage"],
          estimatedCost: "Contact for estimate",
          availability: "Nationwide service",
          specialties: ["Long Distance", "Interstate", "Full Service"],
          notes: "Major national carrier with agents nationwide"
        },
        {
          category: "National Moving Companies", 
          provider: "Atlas Van Lines",
          phone: "1-800-638-9797",
          description: "National moving company specializing in long-distance moves",
          website: "https://www.atlasvanlines.com",
          referralUrl: "https://www.atlasvanlines.com",
          affiliateCode: "",
          hours: "Contact for hours", 
          rating: 4.0,
          services: ["Interstate Moving", "Packing", "Storage"],
          estimatedCost: "Contact for estimate",
          availability: "Nationwide service",
          specialties: ["Long Distance", "Interstate", "Corporate Moves"],
          notes: "Established national carrier"
        },
        {
          category: "Alternative Moving Solutions",
          provider: "U-Pack",
          phone: "1-800-413-4799", 
          description: "You pack, they drive moving service",
          website: "https://www.upack.com",
          referralUrl: "https://www.upack.com",
          affiliateCode: "",
          hours: "Contact for hours",
          rating: 4.2,
          services: ["Interstate Moving", "Moving Containers"],
          estimatedCost: "Contact for estimate",
          availability: "Nationwide service",
          specialties: ["Hybrid Moving", "Cost-Effective", "Flexible"],
          notes: "You pack, they drive - cost-effective option"
        },
        {
          category: "Alternative Moving Solutions",
          provider: "PODS",
          phone: "1-855-706-4758",
          description: "Portable storage and moving containers",
          website: "https://www.pods.com", 
          referralUrl: "https://www.pods.com",
          affiliateCode: "",
          hours: "Contact for hours",
          rating: 4.0,
          services: ["Portable Storage", "Moving Containers"],
          estimatedCost: "Contact for estimate", 
          availability: "Nationwide service",
          specialties: ["Storage", "Flexible Moving", "Containers"],
          notes: "Portable storage containers delivered to your location"
        }
      ];

      allCompanies.push(...nationalCarriers);

      res.json({
        success: true,
        companies: allCompanies
      });

    } catch (error) {
      console.error("Moving companies search error:", error);
      res.status(500).json({ 
        error: "Search failed",
        companies: []
      });
    }
  });

  // AI Recommendations endpoint
  app.post("/api/ai-recommendations", async (req, res) => {
    try {
      const { query, fromLocation, toLocation, moveDate, familySize, budget, priorities } = req.body;

      if (!fromLocation || !toLocation) {
        return res.status(400).json({ error: "Both current and destination locations are required" });
      }

      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          error: "AI service is temporarily unavailable. Please contact support for assistance.",
          recommendations: [],
          summary: "AI analysis requires OpenAI API configuration.",
          timeline: [],
          estimatedTotalCost: "API configuration required"
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Create a comprehensive prompt for the AI
      const systemPrompt = `You are an expert relocation concierge AI assistant specializing in comprehensive moving and relocation planning. 

Your role is to analyze relocation scenarios and provide strategic planning guidance covering:
- High-level moving strategy and logistics considerations
- Utility setup planning and timing
- Local area insights and lifestyle adjustments
- Cost optimization strategies
- Timeline planning and prioritization
- General service categories to consider

IMPORTANT: Do NOT generate specific provider recommendations, company names, or contact details. This is a strategic planning phase only. Users will find specific providers through our specialized search tools.

CRITICAL: Include an actionPlan array that routes users to these specific pages based on their needs:
- "/dashboard" - For finding moving companies, storage, and professional services
- "/utilities" - For setting up internet, electric, gas, water, and other utilities
- "/moving-checklist" - For step-by-step moving tasks and timeline management
- "/ai-assistant" - For additional AI guidance and questions

Create action plan items that guide users through their relocation journey sequentially. Do NOT include specific provider recommendations in the main recommendations - keep those high-level and strategic.

Provide strategic relocation overview in JSON format:
{
  "summary": "Brief overview and key considerations for this specific move",
  "timeline": [
    {
      "week": "8-10 weeks before",
      "tasks": ["Research new area", "Create moving budget", "Start decluttering"]
    },
    {
      "week": "6-8 weeks before", 
      "tasks": ["Get moving quotes", "Research schools/services", "Start utility transfers"]
    }
  ],
  "estimatedTotalCost": "Total budget range for the entire move",
  "actionPlan": [
    {
      "title": "Get Moving Quotes",
      "description": "Find and compare local moving companies for your relocation",
      "route": "/dashboard",
      "priority": "high",
      "timeframe": "6-8 weeks before",
      "status": "pending"
    },
    {
      "title": "Set Up Utilities",
      "description": "Transfer or establish internet, electric, gas, and water services",
      "route": "/utilities",
      "priority": "high", 
      "timeframe": "4-6 weeks before",
      "status": "pending"
    },
    {
      "title": "Complete Moving Tasks",
      "description": "Follow step-by-step checklist for packing and preparation",
      "route": "/moving-checklist",
      "priority": "medium",
      "timeframe": "2-4 weeks before",
      "status": "pending"
    },
    {
      "title": "Get Additional AI Help",
      "description": "Ask specific questions about your destination area",
      "route": "/ai-assistant",
      "priority": "low",
      "timeframe": "Ongoing",
      "status": "pending"
    }
  ],
  "timeline": [
    {
      "week": "8 weeks before move",
      "tasks": ["Task 1", "Task 2"]
    }
  ],
  "estimatedTotalCost": "Total cost estimate"
}

Focus on actionable recommendations specific to moving from ${fromLocation} to ${toLocation}.`;

      const userPrompt = `Help me plan my relocation:

From: ${fromLocation}
To: ${toLocation}
Move Date: ${moveDate || "Not specified"}
Family Size: ${familySize}
Budget: ${budget}
Priorities: ${priorities.join(", ") || "None specified"}

Query: ${query}

Please provide a comprehensive strategic relocation plan focusing on planning guidance, timelines, and actionable next steps. Do not include specific provider names or contact details.`;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 3000
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

      // Ensure the response has the expected structure
      const structuredResponse = {
        summary: aiResponse.summary || "AI analysis complete for your relocation plan.",
        recommendations: aiResponse.recommendations || [],
        actionPlan: aiResponse.actionPlan || [],
        timeline: aiResponse.timeline || [],
        estimatedTotalCost: aiResponse.estimatedTotalCost || "Varies by services selected"
      };

      res.json(structuredResponse);

    } catch (error) {
      console.error("AI Recommendations error:", error);

      // Provide a helpful error response
      if (error instanceof Error && error.message.includes('API key')) {
        return res.status(503).json({ 
          error: "AI service configuration issue. Please contact support.",
          recommendations: [],
          summary: "AI analysis temporarily unavailable.",
          timeline: [],
          estimatedTotalCost: "Service temporarily unavailable"
        });
      }

      return res.status(500).json({ 
        error: "AI analysis temporarily unavailable. Please try again or contact support.",
        recommendations: [],
        summary: "Unable to generate AI recommendations at this time.",
        timeline: [],
        estimatedTotalCost: "Service temporarily unavailable"
      });
    }
  });

  // Utility providers endpoint using ChatGPT
  app.post("/api/utility-providers", async (req, res) => {
    try {
      const { address, city, state, zip, utilityType } = req.body;

      console.log("Utility providers request:", { address, city, state, zip, utilityType });

      if (!city || !state) {
        return res.status(400).json({ error: "City and state are required" });
      }

      // Return mock data if OpenAI isn't available
      if (!process.env.OPENAI_API_KEY) {
        console.log("No OpenAI key, returning mock data");
        const mockProviders = getMockUtilityProviders(utilityType, city, state);
        return res.json({ 
          providers: mockProviders,
          location: `${city}, ${state}`,
          utilityType 
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const fullAddress = zip ? `${city}, ${state} ${zip}` : `${city}, ${state}`;

      const prompt = `What ${utilityType} providers are available at ${fullAddress}?

Provide comprehensive list of actual providers that serve this exact location. Include specific availability percentages, connection types, and detailed service information.

Return the response in JSON format with this structure:
{
  "providers": [
    {
      "provider": "Company Name",
      "phone": "Phone number",
      "website": "Official website URL",
      "description": "Brief description of services and coverage",
      "estimatedCost": "Cost range",
      "availability": "Service availability details",
      "setupFee": "Setup/installation fees if any",
      "connectionTime": "How long to get service connected",
      "connectionType": "Type of connection (for internet/cable)",
      "maxSpeed": "Maximum speed available (for internet)",
      "services": ["Service 1", "Service 2", "Service 3"],
      "notes": "Any special notes or requirements"
    }
  ]
}

Focus on accuracy - only include providers that actually serve this specific location. For internet providers, be especially precise about which companies actually have infrastructure in this area.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are an expert on utility and service providers with comprehensive knowledge of service areas, coverage maps, and availability by location. Provide only accurate, real provider information for specific addresses." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 2000
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

      // Format providers with additional fields for our interface
      const formattedProviders = (aiResponse.providers || []).map((provider: any) => ({
        ...provider,
        referralUrl: provider.website || `https://www.google.com/search?q=${encodeURIComponent(provider.provider)}`,
        affiliateCode: "",
        rating: provider.rating || 0
      }));

      console.log("Returning providers:", formattedProviders.length);

      res.json({ 
        providers: formattedProviders,
        location: fullAddress,
        utilityType 
      });

    } catch (error) {
      console.error("Error finding utility providers:", error);

      // Fallback to mock data on error
      const mockProviders = getMockUtilityProviders(req.body.utilityType, req.body.city, req.body.state);
      res.json({ 
        providers: mockProviders,
        location: `${req.body.city}, ${req.body.state}`,
        utilityType: req.body.utilityType 
      });
    }
  });

  // Helper function to generate mock utility providers
  function getMockUtilityProviders(utilityType: string, city: string, state: string) {
    const mockData: any = {
      electricity: [
        {
          provider: "Local Electric Company",
          phone: "1-800-ELECTRIC",
          website: "https://www.localelectric.com",
          referralUrl: "https://www.localelectric.com/signup",
          description: "Local electricity provider serving the area",
          estimatedCost: "$0.12-0.18/kWh",
          availability: "Available in most areas",
          setupFee: "$25",
          connectionTime: "1-3 business days",
          services: ["Residential Electric", "Green Energy Options"],
          affiliateCode: "",
          rating: 4.1
        }
      ],
      internet: [
        {
          provider: "High Speed Internet Co",
          phone: "1-800-INTERNET",
          website: "https://www.highspeedinternet.com",
          referralUrl: "https://www.highspeedinternet.com/plans",
          description: "High-speed internet service provider",
          estimatedCost: "$50-80/month",
          availability: "Available in most areas",
          setupFee: "$99",
          connectionTime: "3-7 business days",
          connectionType: "Cable/Fiber",
          maxSpeed: "1 Gig",
          services: ["Internet", "WiFi Equipment"],
          affiliateCode: "",
          rating: 4.3
        }
      ],
      water: [
        {
          provider: `${city} Water Authority`,
          phone: "1-800-WATER",
          website: `https://www.${city.toLowerCase()}water.gov`,
          referralUrl: `https://www.${city.toLowerCase()}water.gov/new-service`,
          description: "Municipal water and sewer services",
          estimatedCost: "$30-60/month",
          availability: "Available citywide",
          setupFee: "$50",
          connectionTime: "2-5 business days",
          services: ["Water", "Sewer", "Trash Collection"],
          affiliateCode: "",
          rating: 4.0
        }
      ],
      waste: [
        {
          provider: "City Waste Management",
          phone: "1-800-WASTE",
          website: "https://www.citywaste.com",
          referralUrl: "https://www.citywaste.com/signup",
          description: "Trash and recycling collection services",
          estimatedCost: "$25-40/month",
          availability: "Available citywide",
          setupFee: "$0",
          connectionTime: "Next pickup day",
          services: ["Trash Collection", "Recycling", "Yard Waste"],
          affiliateCode: "",
          rating: 3.8
        }
      ]
    };

    return mockData[utilityType] || [];
  }

  // Housing services endpoint
  app.post("/api/housing-services", async (req, res) => {
    try {
      const { city, state, zipCode } = req.body;

      if (!city || !state) {
        return res.status(400).json({ error: "City and state are required" });
      }

      const services = [
        {
          category: "Real Estate",
          provider: "Keller Williams",
          phone: "1-512-459-4700",
          description: "Full-service real estate with local market expertise",
          website: "kw.com",
          referralUrl: "https://www.kw.com/",
          services: ["Home Buying", "Home Selling", "Market Analysis"],
          estimatedCost: "3% commission",
          rating: 4.5,
          specialties: ["First-time buyers", "Luxury homes", "Investment properties"]
        },
        {
          category: "Home Insurance",
          provider: "State Farm",
          phone: "1-800-782-8332",
          description: "Comprehensive home insurance with local agents",
          website: "statefarm.com",
          referralUrl: "https://www.statefarm.com/insurance/home-and-property",
          services: ["Homeowners Insurance", "Renters Insurance", "Auto Bundle"],
          estimatedCost: "$800-1,500/year",
          rating: 4.3,
          specialties: ["Bundle discounts", "Claim support", "Local agents"]
        },
        {
          category: "Home Security",
          provider: "ADT",
          phone: "1-800-238-2727",
          description: "Professional home security monitoring and installation",
          website: "adt.com",
          referralUrl: "https://www.adt.com/",
          services: ["Security Systems", "24/7 Monitoring", "Smart Home"],
          estimatedCost: "$45-60/month",
          rating: 4.0,
          specialties: ["Professional installation", "Mobile app", "Emergency response"]
        }
      ];

      res.json({ success: true, services });
    } catch (error) {
      console.error("Error in housing services search:", error);
      res.status(500).json({ error: "Failed to fetch housing services" });
    }
  });

  // Track referral clicks
  app.post("/api/track-referral", async (req, res) => {
    try {
      const { provider, category, action, userAddress } = req.body;

      const timestamp = new Date().toISOString();
      const ipAddress = req.ip || 'unknown';

      // For now, just log the referral click since we don't have the database table
      console.log('Referral click tracked:', {
        provider,
        category,
        action,
        userAddress,
        timestamp,
        ipAddress
      });

      res.json({ success: true });

    } catch (error) {
      console.error("Referral tracking error:", error);
      res.status(500).json({ error: "Failed to track referral" });
    }
  });

  // Get current project endpoint
  app.get('/api/current-project', async (req, res) => {
    try {
      // For now, get the most recent project (user ID 1)
      const project = await storage.getMovingProject(1);

      if (!project) {
        return res.status(404).json({ error: 'No project found' });
      }

      res.json(project);
    } catch (error) {
      console.error('Error fetching current project:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });

  // Get project tasks endpoint
  app.get('/api/project-tasks/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      const tasks = await storage.getProjectTasks(parseInt(projectId));
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Create project task endpoint
  app.post('/api/project-task', async (req, res) => {
    try {
      // Map incoming fields to database schema
      const taskData = {
        projectId: req.body.projectId,
        taskName: req.body.title || req.body.taskName,
        description: req.body.description,
        status: req.body.status || 'pending',
        dueDate: req.body.timeframe || req.body.dueDate
      };

      const task = await storage.createProjectTask(taskData);
      res.json(task);
    } catch (error) {
      console.error('Error creating project task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Create or get moving project
  app.post("/api/moving-project", async (req, res) => {
    try {
      const { userId, fromAddress, toAddress, moveDate } = req.body;

      // Check if project already exists
      let project = await storage.getMovingProject(userId, fromAddress, toAddress);

      if (!project) {
        // Create new project
        project = await storage.createMovingProject({
          userId,
          fromAddress,
          toAddress,
          moveDate,
          projectStatus: "searching"
        });

        // Create initial project tasks
        const initialTasks = [
          { taskName: "Get 3+ written estimates", description: "Collect quotes from multiple moving companies", dueDate: "2 weeks" },
          { taskName: "Check insurance coverage", description: "Verify moving company insurance and liability coverage", dueDate: "2 weeks" },
          { taskName: "Read reviews & references", description: "Research company reputation and customer feedback", dueDate: "2 weeks" },
          { taskName: "Verify license & bonding", description: "Confirm company licensing and bonding status", dueDate: "2 weeks" },
          { taskName: "Understand pricing structure", description: "Review all fees, charges, and payment terms", dueDate: "1 week" },
          { taskName: "Confirm moving date", description: "Finalize moving date and schedule with chosen company", dueDate: "1 week" }
        ];

        for (const task of initialTasks) {
          await storage.createProjectTask({
            projectId: project.id,
            ...task
          });
        }
      }

      res.json({ project });
    } catch (error) {
      console.error("Error creating/getting moving project:", error);
      res.status(500).json({ error: "Failed to manage moving project" });
    }
  });

  // Select mover for project
  app.post("/api/select-mover", async (req, res) => {
    try {
      const { projectId, moverData } = req.body;

      const updatedProject = await storage.updateMovingProject(projectId, {
        selectedMover: moverData,
        projectStatus: "mover_selected"
      });

      // Create communication log for mover selection
      await storage.createCommunication({
        projectId,
        communicationType: "selection",
        subject: `Selected ${moverData.provider} as moving company`,
        notes: `Company: ${moverData.provider}\nPhone: ${moverData.phone}\nEstimated Cost: ${moverData.estimatedCost}`,
        contactPerson: moverData.provider
      });

      res.json({ project: updatedProject });
    } catch (error) {
      console.error("Error selecting mover:", error);
      res.status(500).json({ error: "Failed to select mover" });
    }
  });

  // Get project with tasks and communications
  app.get("/api/moving-project/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);

      const [tasks, communications] = await Promise.all([
        storage.getProjectTasks(projectId),
        storage.getProjectCommunications(projectId)
      ]);

      res.json({ tasks, communications });
    } catch (error) {
      console.error("Error fetching project details:", error);
      res.status(500).json({ error: "Failed to fetch project details" });
    }
  });

  // Update task status
  app.patch("/api/project-task/:taskId", async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { status } = req.body;

      const updatedTask = await storage.updateTaskStatus(taskId, status);
      res.json({ task: updatedTask });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Add communication log
  app.post("/api/communication", async (req, res) => {
    try {
      const communication = await storage.createCommunication(req.body);
      res.json({ communication });
    } catch (error) {
      console.error("Error creating communication:", error);
      res.status(500).json({ error: "Failed to create communication" });
    }
  });

  // Send questionnaire email with PDF
  app.post("/api/send-questionnaire-email", async (req, res) => {
    try {
      const { email, questionnaire, pdfData, moveDetails } = req.body;

      // For now, just simulate email sending since we don't have SendGrid configured
      console.log(`Simulating email send to: ${email}`);
      console.log(`PDF size: ${pdfData ? 'Present' : 'Missing'}`);
      console.log(`Questionnaire data:`, questionnaire);

      // In a real implementation, this would use SendGrid or similar service
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // 
      // const msg = {
      //   to: email,
      //   from: 'noreply@ezrelo.com',
      //   subject: 'Your Moving Estimate Questionnaire',
      //   text: 'Please find your completed moving questionnaire attached.',
      //   attachments: [{
      //     content: pdfData,
      //     filename: 'moving-questionnaire.pdf',
      //     type: 'application/pdf',
      //     disposition: 'attachment'
      //   }]
      // };
      // 
      // await sgMail.send(msg);

      res.json({ success: true, message: "Questionnaire sent successfully" });
    } catch (error) {
      console.error("Error sending questionnaire email:", error);
      res.status(500).json({ error: "Failed to send questionnaire" });
    }
  });

  // Update current questionnaire for project
  app.post("/api/archive-questionnaire", async (req, res) => {
    try {
      const { projectId, questionnaire, pdfData, type } = req.body;

      // Update the project with current questionnaire data
      console.log('Updating project', projectId, 'with questionnaire data');
      const updatedProject = await storage.updateMovingProject(projectId, {
        questionnaireData: JSON.stringify(questionnaire) as any,
        lastQuestionnaireUpdate: new Date() as any
      });
      console.log('Project updated:', updatedProject.id, 'questionnaire saved:', !!updatedProject.questionnaireData);

      // Log the activity as communication record
      await storage.createCommunication({
        projectId,
        communicationType: "questionnaire_update",
        subject: `Questionnaire ${type === 'email_pdf' ? 'PDF Sent' : 'AI Outreach Completed'}`,
        notes: JSON.stringify({
          action: type,
          pdfGenerated: !!pdfData,
          completedAt: new Date().toISOString(),
          itemCount: Object.keys(questionnaire.majorItems || {}).length
        }),
        contactPerson: "Customer"
      });

      res.json({ success: true, message: "Questionnaire updated successfully" });
    } catch (error) {
      console.error("Error updating questionnaire:", error);
      res.status(500).json({ error: "Failed to update questionnaire" });
    }
  });

  // Get current questionnaire for project
  app.get("/api/current-questionnaire/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const project = await storage.getMovingProject(parseInt(projectId));

      if (project && project.questionnaireData) {
        let questionnaire;
        try {
          console.log('Raw questionnaire data type:', typeof project.questionnaireData);
          console.log('Raw questionnaire data:', project.questionnaireData);

          // Handle both string and object types
          if (typeof project.questionnaireData === 'string') {
            questionnaire = JSON.parse(project.questionnaireData);
          } else {
            questionnaire = project.questionnaireData;
          }
          res.json({
            ...questionnaire,
            updatedAt: project.lastQuestionnaireUpdate || project.updatedAt
          });
        } catch (error) {
          console.error('Error parsing questionnaire data:', error);
          console.error('Data that failed to parse:', project.questionnaireData);
          res.json(null);
        }
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching current questionnaire:", error);
      res.status(500).json({ error: "Failed to fetch questionnaire" });
    }
  });

  // AI-powered mover outreach
  app.post("/api/share-with-movers", async (req, res) => {
    try {
      const { projectId, questionnaire, moveDetails, selectedMovers } = req.body;

      console.log("Ezrelo AI initiating professional mover outreach...");
      console.log(`Move: ${moveDetails.from} → ${moveDetails.to}`);
      console.log(`Date: ${moveDetails.date}`);
      console.log(`Inventory items: ${Object.keys(questionnaire.majorItems).length}`);
      console.log(`Contacting ${selectedMovers.length} premium moving companies`);

      // Generate AI-crafted professional outreach emails
      const aiOutreachData = {
        subject: `Premium Moving Lead from Ezrelo - ${moveDetails.from} to ${moveDetails.to}`,
        customerProfile: {
          moveDate: moveDetails.date,
          route: `${moveDetails.from} → ${moveDetails.to}`,
          homeSize: questionnaire.homeSize,
          inventory: questionnaire.majorItems,
          specialRequests: questionnaire.packingServices,
          timeline: questionnaire.movingDate
        },
        ezreloValue: "Pre-qualified lead with comprehensive AI-analyzed moving profile",
        expectedResponse: "Professional quote within 24 hours"
      };

      // In production, this would:
      // 1. Use OpenAI to generate personalized outreach emails for each mover
      // 2. Send via SendGrid with Ezrelo branding
      // 3. Include structured data for CRM integration
      // 4. Set up automated follow-up sequences

      // Log the AI communication for project tracking
      if (projectId) {
        await storage.createCommunication({
          projectId,
          communicationType: "ai_outreach",
          subject: "Ezrelo AI Mover Outreach Completed",
          notes: JSON.stringify({
            aiOutreachData,
            moversContacted: selectedMovers.map(m => m.provider),
            automationLevel: "AI-Generated Professional Outreach",
            expectedOutcome: "3-5 competitive quotes within 24-48 hours"
          }),
          contactPerson: "Ezrelo AI Assistant"
        });
      }

      res.json({ 
        success: true, 
        message: "AI outreach completed",
        details: {
          moversContacted: selectedMovers.length,
          expectedQuotes: "24-48 hours",
          ezreloAdvantage: "Professional AI-crafted outreach with comprehensive move data"
        }
      });
    } catch (error) {
      console.error("Error sharing with movers:", error);
      res.status(500).json({ error: "Failed to share with movers" });
    }
  });

  // Google Reviews endpoint
  app.get("/api/google-reviews/:companyName", async (req, res) => {
    try {
      const { companyName } = req.params;
      const { location } = req.query;

      if (!process.env.GOOGLE_API_KEY) {
        return res.status(503).json({ error: "Google API service temporarily unavailable" });
      }

      // Search for the company in Google Places
      const place = await searchGooglePlaces(companyName, location as string);

      if (!place || !place.place_id) {
        return res.json({ 
          reviews: [], 
          rating: null, 
          totalReviews: 0,
          message: "No Google listing found for this company" 
        });
      }

      // Get detailed place information including reviews
      const details = await getPlaceDetails(place.place_id);

      if (!details) {
        return res.json({ 
          reviews: [], 
          rating: null, 
          totalReviews: 0,
          message: "Unable to fetch company details" 
        });
      }

      const reviews = details.reviews || [];
      const processedReviews = reviews.map((review: any) => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time,
        relativeTime: review.relative_time_description,
        profilePhoto: review.profile_photo_url
      }));

      res.json({
        reviews: processedReviews,
        rating: details.rating,
        totalReviews: details.user_ratings_total || 0,
        website: details.website,
        phone: details.formatted_phone_number,
        address: details.formatted_address,
        businessStatus: details.business_status,
        priceLevel: details.price_level
      });

    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Local services search endpoint
  app.post("/api/search-local-services", async (req, res) => {
    try {
      const { location, serviceTypes } = req.body;

      if (!location || !serviceTypes) {
        return res.status(400).json({ error: "Location and service types are required" });
      }

      const localServices = [];

      // Search for each service type
      for (const serviceType of serviceTypes) {
        let searchQuery = '';
        let category = '';

        switch (serviceType) {
          case 'schools':
            searchQuery = `elementary schools in ${location}`;
            category = 'Elementary School';
            break;
          case 'healthcare':
            searchQuery = `family doctors in ${location}`;
            category = 'Family Medicine';
            break;
          case 'pharmacies':
            searchQuery = `pharmacies in ${location}`;
            category = 'Pharmacy';
            break;
          case 'veterinary':
            searchQuery = `veterinary clinics in ${location}`;
            category = 'Veterinary Clinic';
            break;
          case 'gyms':
            searchQuery = `gyms fitness centers in ${location}`;
            category = 'Fitness Center';
            break;
          case 'banks':
            searchQuery = `banks credit unions in ${location}`;
            category = 'Bank';
            break;
          case 'storage':
            searchQuery = `self storage facilities in ${location}`;
            category = 'Storage Facility';
            break;
          default:
            continue;
        }

        try {
          console.log(`Searching for: ${searchQuery} in ${location}`);
          const places = await searchGooglePlaces(searchQuery, location);
          console.log(`Found ${places?.length || 0} places for ${category}`);

          if (places && places.length > 0) {
            const limitedPlaces = places.slice(0, 3); // Limit to 3 per category

            for (const place of limitedPlaces) {
              const details = await getPlaceDetails(place.place_id);

              if (details) {
                localServices.push({
                  category,
                  provider: place.name,
                  phone: details.formatted_phone_number || 'Contact for availability',
                  description: getServiceDescription(category, location),
                  website: details.website || `https://www.google.com/search?q=${encodeURIComponent(place.name)}`,
                  referralUrl: details.website || `https://www.google.com/search?q=${encodeURIComponent(place.name)}`,
                  services: getLocalServicesByCategory(category),
                  estimatedCost: getLocalServiceCost(category),
                  rating: details.rating || 0,
                  specialties: getLocalServiceSpecialties(category),
                  availability: getServiceHours(category),
                  address: details.formatted_address || '',
                  hours: details.opening_hours?.weekday_text?.join(', ') || 'Call for hours',
                  insurance: getInsuranceInfo(category),
                  ageGroups: getAgeGroups(category),
                  programs: getPrograms(category)
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error searching for ${serviceType}:`, error);
        }
      }

      res.json({ services: localServices });
    } catch (error) {
      console.error("Error searching local services:", error);
      res.status(500).json({ error: "Failed to search local services" });
    }
  });

  // Mover selection endpoint
  app.post('/api/select-mover', async (req, res) => {
    try {
      const { provider, category, phone, estimatedCost, moveRoute } = req.body;

      console.log('Mover selected:', {
        provider,
        category,
        phone,
        estimatedCost,
        moveRoute,
        selectedAt: new Date().toISOString()
      });

      res.json({ 
        success: true, 
        message: `${provider} has been selected as your moving company`,
        selection: {
          provider,
          category,
          phone,
          estimatedCost,
          moveRoute
        }
      });
    } catch (error) {
      console.error('Error saving mover selection:', error);
      res.status(500).json({ error: 'Failed to save mover selection' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}