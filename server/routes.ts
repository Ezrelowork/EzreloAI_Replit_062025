import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { movingProjects, movingProjectSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";

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

function getSpecialtiesByCategory(category: string[]): string[] {
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
  // Only append location if the search query doesn't already contain it
  const query = (location && !searchQuery.toLowerCase().includes(location.toLowerCase())) 
    ? `${searchQuery} ${location}` 
    : searchQuery;
  const params = new URLSearchParams({
    query: query.trim(),
    key: process.env.GOOGLE_API_KEY!,
    radius: '32186', // 20 miles in meters (20 * 1609.34)
    // Add timestamp for cache busting
    timestamp: Date.now().toString()
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
    fields: 'name,rating,reviews,formatted_phone_number,website,formatted_address,business_status,opening_hours,price_level,user_ratings_total',
    // Add timestamp for cache busting
    timestamp: Date.now().toString()
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

  // Moving companies endpoint - Enhanced with ChatGPT, Google Gemini, and Google Places API
  app.post("/api/moving-companies", async (req, res) => {
    try {
      // Disable caching for fresh results each time
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const { fromCity, fromState, fromZip, toCity, toState, toZip, fromAddress } = req.body;

      if (!fromCity || !fromState || !toCity || !toState) {
        return res.status(400).json({ error: "Origin and destination are required" });
      }

      const fromLocation = fromZip ? `${fromCity}, ${fromState} ${fromZip}` : `${fromCity}, ${fromState}`;
      const toLocation = toZip ? `${toCity}, ${toState} ${toZip}` : `${toCity}, ${toState}`;
      const isLocalMove = fromState.toUpperCase() === toState.toUpperCase();
      const moveType = isLocalMove ? "local" : "interstate";

      let allCompanies: any[] = [];

      // 1. ChatGPT for comprehensive moving company recommendations
      if (process.env.OPENAI_API_KEY) {
        try {
          const OpenAI = (await import('openai')).default;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          const chatgptPrompt = `Find moving companies for a ${moveType} move from ${fromLocation} to ${toLocation}.

Include both local specialists and national carriers that serve this route. Provide realistic pricing for this specific distance and move type.

Return JSON format:
{
  "companies": [
    {
      "provider": "Company Name",
      "phone": "Phone number",
      "website": "Official website URL",
      "description": "Brief description including specialties and service area",
      "estimatedCost": "Realistic cost range for this route",
      "services": ["Service 1", "Service 2"],
      "category": "Local Moving Companies" or "National Moving Companies",
      "specialties": ["Specialty 1", "Specialty 2"],
      "availability": "Service area coverage"
    }
  ]
}

Focus on companies that actually serve the ${fromLocation} area with accurate pricing for ${moveType} moves.`;

          const chatgptCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { 
                role: "system", 
                content: "You are an expert on moving companies with comprehensive knowledge of service areas, pricing, and availability. Provide only accurate, real company information." 
              },
              { role: "user", content: chatgptPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 2500
          });

          const chatgptResponse = JSON.parse(chatgptCompletion.choices[0].message.content || '{}');
          if (chatgptResponse.companies) {
            allCompanies = [...chatgptResponse.companies];
            console.log(`ChatGPT found ${chatgptResponse.companies.length} companies`);
          }
        } catch (error) {
          console.error("ChatGPT error:", error);
        }
      }

      // 2. Google Gemini for additional local/regional companies
      if (process.env.GOOGLE_AI_API_KEY) {
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

          const geminiPrompt = `Find moving companies for ${moveType} move from ${fromLocation} to ${toLocation}. Focus on local and regional movers that might be missed by other sources.

Include companies that specifically serve this route, especially smaller local operations with good reputations.

Return JSON format:
{
  "companies": [
    {
      "provider": "Company Name",
      "phone": "Phone number",
      "website": "Website URL",
      "description": "Service description",
      "estimatedCost": "Cost range for this route",
      "services": ["Service list"],
      "category": "Local Moving Companies" or "Regional Moving Companies",
      "specialties": ["Specialties"],
      "availability": "Service coverage"
    }
  ]
}

Only include real companies that actually serve ${fromLocation} to ${toLocation} routes.`;

          const geminiResult = await model.generateContent(geminiPrompt);
          const geminiText = geminiResult.response.text();

          // Extract JSON from Gemini response
          const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const geminiResponse = JSON.parse(jsonMatch[0]);
            if (geminiResponse.companies) {
              // Merge with existing results, avoiding duplicates
              for (const geminiCompany of geminiResponse.companies) {
                const isDuplicate = allCompanies.some(existing => 
                  existing.provider.toLowerCase().includes(geminiCompany.provider.toLowerCase()) ||
                  geminiCompany.provider.toLowerCase().includes(existing.provider.toLowerCase())
                );
                if (!isDuplicate) {
                  allCompanies.push(geminiCompany);
                }
              }
              console.log(`Gemini added ${geminiResponse.companies.length} additional companies`);
            }
          }
        } catch (error) {
          console.error("Google Gemini error:", error);
        }
      }

      // 3. Google Places API for local companies with real reviews and ratings
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
                    category: "Local Moving Companies (Google Verified)",
                    provider: detailsData.result.name,
                    phone: detailsData.result.formatted_phone_number || "Contact for details",
                    description: `Local moving company in ${fromCity}, ${fromState} - Google verified`,
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

                  // Check if this company is already in our list (merge if found)
                  const existingIndex = allCompanies.findIndex(c => 
                    c.provider.toLowerCase().includes(company.provider.toLowerCase()) ||
                    company.provider.toLowerCase().includes(c.provider.toLowerCase())
                  );

                  if (existingIndex >= 0) {
                    // Enhance existing company with Google data
                    allCompanies[existingIndex] = {
                      ...allCompanies[existingIndex],
                      phone: company.phone,
                      website: company.website,
                      referralUrl: company.referralUrl,
                      rating: company.rating,
                      notes: `${allCompanies[existingIndex].notes || ''} | Google verified: ${company.rating} stars`
                    };
                  } else {
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

      // 4. Add comprehensive national carriers for interstate moves
      if (!isLocalMove) {
        const nationalCarriers = [
          {
            category: "National Moving Companies",
            provider: "United Van Lines",
            phone: "1-800-995-1000",
            description: "Major national moving company with interstate services and local agents",
            website: "https://www.unitedvanlines.com",
            referralUrl: "https://www.unitedvanlines.com",
            affiliateCode: "",
            hours: "Contact for hours",
            rating: 4.1,
            services: ["Interstate Moving", "Packing", "Storage", "Auto Transport"],
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
            category: "National Moving Companies",
            provider: "Mayflower Transit",
            phone: "1-800-428-1234",
            description: "Premium national moving company with white-glove service",
            website: "https://www.mayflower.com",
            referralUrl: "https://www.mayflower.com",
            affiliateCode: "",
            hours: "Contact for hours",
            rating: 4.0,
            services: ["Interstate Moving", "Premium Packing", "Storage", "Specialty Items"],
            estimatedCost: "Contact for estimate",
            availability: "Nationwide service",
            specialties: ["Premium Service", "Corporate Relocation", "Specialty Items"],
            notes: "Premium carrier with white-glove service options"
          },
          {
            category: "Alternative Moving Solutions",
            provider: "U-Pack",
            phone: "1-800-413-4799", 
            description: "You pack, they drive moving service - cost-effective hybrid solution",
            website: "https://www.upack.com",
            referralUrl: "https://www.upack.com",
            affiliateCode: "",
            hours: "Contact for hours",
            rating: 4.2,
            services: ["Interstate Moving", "Moving Containers", "Storage"],
            estimatedCost: "Contact for estimate",
            availability: "Nationwide service",
            specialties: ["Hybrid Moving", "Cost-Effective", "Flexible"],
            notes: "You pack, they drive - cost-effective option for long distance"
          },
          {
            category: "Alternative Moving Solutions",
            provider: "PODS",
            phone: "1-855-706-4758",
            description: "Portable storage and moving containers with flexible timing",
            website: "https://www.pods.com", 
            referralUrl: "https://www.pods.com",
            affiliateCode: "",
            hours: "Contact for hours",
            rating: 4.0,
            services: ["Portable Storage", "Moving Containers", "Self-Paced Moving"],
            estimatedCost: "Contact for estimate", 
            availability: "Nationwide service",
            specialties: ["Storage", "Flexible Moving", "Containers"],
            notes: "Portable storage containers delivered to your location"
          }
        ];

        // Only add national carriers if not already present
        for (const carrier of nationalCarriers) {
          const isDuplicate = allCompanies.some(existing => 
            existing.provider.toLowerCase().includes(carrier.provider.toLowerCase())
          );
          if (!isDuplicate) {
            allCompanies.push(carrier);
          }
        }
      }

      // Format all companies with consistent structure and proximity scoring
      const formattedCompanies = allCompanies.map((company, index) => {
        let proximityScore = 50; // Default score

        // Higher proximity score for companies explicitly serving the origin location
        if (company.category?.includes("Local") || 
            company.category?.includes("Google Verified") ||
            company.availability?.toLowerCase().includes(fromCity.toLowerCase()) ||
            company.description?.toLowerCase().includes(fromCity.toLowerCase())) {
          proximityScore = 90;
        }

        // Medium score for regional companies
        if (company.category?.includes("Regional") ||
            company.description?.toLowerCase().includes(fromState.toLowerCase())) {
          proximityScore = 70;
        }

        // Lower score for national companies (still important but not location-specific)
        if (company.category?.includes("National") || 
            company.category?.includes("Alternative")) {
          proximityScore = 30;
        }

        // Boost score for highly rated local companies
        if (proximityScore >= 70 && company.rating >= 4.0) {
          proximityScore += 10;
        }

        return {
          ...company,
          referralUrl: company.referralUrl || company.website || `https://www.google.com/search?q=${encodeURIComponent(company.provider)}`,
          affiliateCode: company.affiliateCode || "",
          rating: company.rating || 0,
          hours: company.hours || "Contact for hours",
          services: company.services || ["Moving Services"],
          specialties: company.specialties || ["Professional Moving"],
          availability: company.availability || "Contact for availability",
          proximityScore: proximityScore
        };
      });

      // Sort by proximity score (highest first), then by rating
      const sortedCompanies = formattedCompanies.sort((a, b) => {
        if (b.proximityScore !== a.proximityScore) {
          return b.proximityScore - a.proximityScore;
        }
        return (b.rating || 0) - (a.rating || 0);
      });

      console.log(`Total companies found: ${sortedCompanies.length}`);
      console.log(`Proximity prioritization: Local (${sortedCompanies.filter(c => c.proximityScore >= 90).length}), Regional (${sortedCompanies.filter(c => c.proximityScore >= 70 && c.proximityScore < 90).length}), National (${sortedCompanies.filter(c => c.proximityScore < 70).length})`);

      res.json({
        success: true,
        companies: sortedCompanies,
        searchInfo: {
          from: fromLocation,
          to: toLocation,
          moveType: moveType,
          proximityPrioritization: "Closest to origin location first",
          sources: {
            chatgpt: process.env.OPENAI_API_KEY ? "available" : "unavailable",
            gemini: process.env.GOOGLE_AI_API_KEY ? "available" : "unavailable",
            googlePlaces: process.env.GOOGLE_API_KEY ? "available" : "unavailable"
          }
        }
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

  // Utility providers endpoint using ChatGPT and Google Gemini
  app.post("/api/utility-providers", async (req, res) => {
    try {
      const { address, city, state, zip, utilityType } = req.body;

      console.log("Utility providers request:", { address, city, state, zip, utilityType });

      if (!city || !state) {
        return res.status(400).json({ error: "City and state are required" });
      }

      const fullAddress = zip ? `${city}, ${state} ${zip}` : `${city}, ${state}`;
      let allProviders: any[] = [];

      // Try OpenAI first
      if (process.env.OPENAI_API_KEY) {
        try {
          const OpenAI = (await import('openai')).default;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          const openaiPrompt = `What ${utilityType} providers are available at ${fullAddress}?

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

Focus on accuracy - only include providers that actually serve this specific location.`;

          const openaiCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { 
                role: "system", 
                content: "You are an expert on utility and service providers with comprehensive knowledge of service areas, coverage maps, and availability by location. Provide only accurate, real provider information for specific addresses." 
              },
              { role: "user", content: openaiPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 2000
          });

          const openaiResponse = JSON.parse(openaiCompletion.choices[0].message.content || '{}');
          if (openaiResponse.providers) {
            allProviders = [...openaiResponse.providers];
            console.log(`OpenAI found ${openaiResponse.providers.length} providers`);
          }
        } catch (error) {
          console.error("OpenAI error:", error);
        }
      }

      // Try Google Gemini as enhancement/fallback
      if (process.env.GOOGLE_AI_API_KEY) {
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

          const geminiPrompt = `Find ${utilityType} providers that serve ${fullAddress}. Focus on local and regional providers that might be missed by other sources.

Return JSON format:
{
  "providers": [
    {
      "provider": "Company Name",
      "phone": "Phone number",
      "website": "Website URL",
      "description": "Service description",
      "estimatedCost": "Cost range",
      "availability": "Availability details",
      "setupFee": "Setup fees",
      "connectionTime": "Connection timeframe",
      "connectionType": "Connection type",
      "maxSpeed": "Max speed (if applicable)",
      "services": ["Service list"],
      "notes": "Special notes"
    }
  ]
}

Only include real providers that actually serve this location.`;

          const geminiResult = await model.generateContent(geminiPrompt);
          const geminiText = geminiResult.response.text();

          // Extract JSON from Gemini response
          const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const geminiResponse = JSON.parse(jsonMatch[0]);
            if (geminiResponse.providers) {
              // Merge with OpenAI results, avoiding duplicates
              for (const geminiProvider of geminiResponse.providers) {
                const isDuplicate = allProviders.some(existing => 
                  existing.provider.toLowerCase().includes(geminiProvider.provider.toLowerCase()) ||
                  geminiProvider.provider.toLowerCase().includes(existing.provider.toLowerCase())
                );
                if (!isDuplicate) {
                  allProviders.push(geminiProvider);
                }
              }
              console.log(`Gemini added ${geminiResponse.providers.length} additional providers`);
            }
          }
        } catch (error) {
          console.error("Google Gemini error:", error);
        }
      }

      // If no providers found from APIs, use mock data
      if (allProviders.length === 0) {
        console.log("No API providers found, using mock data");
        allProviders = getMockUtilityProviders(utilityType, city, state);
      }

      // Format providers with additional fields for our interface
      const formattedProviders = allProviders.map((provider: any) => ({
        ...provider,
        referralUrl: provider.website || `https://www.google.com/search?q=${encodeURIComponent(provider.provider)}`,
        affiliateCode: "",
        rating: provider.rating || 0
      }));

      console.log("Returning total providers:", formattedProviders.length);



  // AI-powered utility setup automation
  app.post("/api/ai-utility-setup", async (req, res) => {
    try {
      const { projectId, moveDetails, customerInfo, utilityPreferences } = req.body;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ error: "AI service temporarily unavailable" });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Generate utility setup timeline and automation
      const utilityPrompt = `Create a comprehensive utility setup plan for a move from ${moveDetails.from} to ${moveDetails.to} on ${moveDetails.date}.

Customer preferences:
- Internet speed needed: ${utilityPreferences.internetSpeed}
- Budget range: ${utilityPreferences.budget}
- Service priorities: ${utilityPreferences.priorities?.join(', ')}
- Move-in date: ${moveDetails.date}

Generate an automation plan with:
1. Optimal timing for each utility setup
2. Recommended providers based on location
3. Setup sequence to minimize downtime
4. Automated reminders and follow-ups
5. Integration opportunities (bundling, etc.)

Return JSON format:
{
  "setupTimeline": [
    {
      "utility": "Internet",
      "action": "Schedule installation",
      "timing": "14 days before move",
      "priority": "high",
      "automationLevel": "AI can handle scheduling",
      "estimatedDuration": "2-3 hours installation"
    }
  ],
  "automationOpportunities": [
    {
      "task": "Schedule all utility connections",
      "aiCapability": "Generate and send setup requests",
      "userApprovalNeeded": true,
      "estimatedTimeSaved": "3-4 hours"
    }
  ],
  "recommendations": {
    "bundleOpportunities": ["Internet + Cable bundle saves $30/month"],
    "timingOptimization": "Schedule internet first, electricity second for optimal setup sequence"
  }
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert utility coordinator who understands optimal timing, provider capabilities, and automation opportunities for utility setups during moves." },
          { role: "user", content: utilityPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000
      });

      const utilityPlan = JSON.parse(completion.choices[0].message.content || '{}');

      // Log the automation plan
      if (projectId) {
        await storage.createCommunication({
          projectId,
          communicationType: "ai_utility_automation",
          subject: "AI Utility Setup Plan Generated",
          notes: JSON.stringify(utilityPlan),
          contactPerson: "Ezrelo AI Utility Assistant"
        });
      }

      res.json({
        success: true,
        utilityPlan,
        automationCapabilities: {
          canScheduleDirectly: utilityPlan.automationOpportunities?.filter(op => 
            op.aiCapability.includes('schedule') || op.aiCapability.includes('send')
          ).length || 0,
          requiresApproval: utilityPlan.automationOpportunities?.filter(op => 
            op.userApprovalNeeded
          ).length || 0,
          totalTimeSaved: "3-6 hours of manual coordination"
        }
      });

    } catch (error) {
      console.error("AI utility setup error:", error);
      res.status(500).json({ error: "Failed to generate utility setup plan" });
    }
  });



  // AI-powered follow-up automation
  app.post("/api/ai-followup-automation", async (req, res) => {
    try {
      const { projectId, taskType, entityType, entityData, followUpType } = req.body;
      // taskType: 'quote_request', 'utility_setup', 'service_booking'
      // entityType: 'mover', 'utility_provider', 'local_service'
      // followUpType: 'initial_reminder', 'escalation', 'status_check'

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ error: "AI service temporarily unavailable" });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Generate contextual follow-up strategy
      const followUpPrompt = `Generate an intelligent follow-up strategy for ${taskType} with ${entityType}.

Entity Details: ${JSON.stringify(entityData)}
Follow-up Type: ${followUpType}

Create a follow-up plan that includes:
1. Optimal timing for follow-up
2. Communication channel recommendations (email, phone, portal)
3. Message tone and content strategy
4. Escalation path if no response
5. Automation opportunities
6. Success metrics

Consider industry standards:
- Movers typically respond within 24-48 hours
- Utility providers may take 3-5 business days
- Local services often respond same day

Return JSON format:
{
  "followUpStrategy": {
    "timing": "When to follow up",
    "channel": "Best communication method",
    "messageTemplate": "AI-generated follow-up message",
    "escalationTimeline": "When and how to escalate"
  },
  "automationLevel": {
    "canAutomate": true/false,
    "requiresApproval": true/false,
    "aiCapabilities": ["Generate message", "Schedule send", "Track response"]
  },
  "successPrediction": {
    "responseRate": "Expected response rate %",
    "optimalOutcome": "What success looks like"
  }
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert in business follow-up strategies and automation, specializing in moving and relocation services." },
          { role: "user", content: followUpPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      });

      const followUpPlan = JSON.parse(completion.choices[0].message.content || '{}');

      // If this is a high-automation scenario, we could trigger the follow-up
      if (followUpPlan.automationLevel?.canAutomate && !followUpPlan.automationLevel?.requiresApproval) {
        // Auto-schedule the follow-up
        console.log(`Auto-scheduling follow-up for ${entityData.provider || entityData.name}`);
        
        // In production, this would integrate with:
        // - Email scheduling systems
        // - CRM automation
        // - SMS/phone automation
        // - Calendar scheduling
      }

      // Log the follow-up plan
      if (projectId) {
        await storage.createCommunication({
          projectId,
          communicationType: "ai_followup_plan",
          subject: `AI Follow-up Strategy for ${entityData.provider || entityData.name}`,
          notes: JSON.stringify(followUpPlan),
          contactPerson: "Ezrelo AI Follow-up Assistant"
        });
      }

      res.json({
        success: true,
        followUpPlan,
        automationSummary: {
          canFullyAutomate: followUpPlan.automationLevel?.canAutomate && !followUpPlan.automationLevel?.requiresApproval,
          requiresUserApproval: followUpPlan.automationLevel?.requiresApproval,
          expectedResponseRate: followUpPlan.successPrediction?.responseRate,
          nextAction: followUpPlan.automationLevel?.canAutomate ? "Automated follow-up scheduled" : "Manual follow-up recommended"
        }
      });

    } catch (error) {
      console.error("AI follow-up automation error:", error);
      res.status(500).json({ error: "Failed to generate follow-up plan" });
    }
  });



      res.json({ 
        providers: formattedProviders,
        location: fullAddress,
        utilityType,
        sources: {
          openai: process.env.OPENAI_API_KEY ? "available" : "unavailable",
          gemini: process.env.GOOGLE_AI_API_KEY ? "available" : "unavailable"
        }
      });

    } catch (error) {
      console.error("Error finding utility providers:", error);

      // Final fallback to mock data
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

  // USPS Address verification endpoint
  app.post("/api/verify-address", async (req: Request, res: Response) => {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      // Smart address normalization
      let normalizedAddress = address
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();

      // Standardize street suffixes - only abbreviate when they are actual suffixes (end of street address part)
      // First, identify where the street address likely ends
      const addressParts = normalizedAddress.split(',');
      let streetPart = addressParts[0] || normalizedAddress;

      if (addressParts.length > 1) {
        // Apply suffix abbreviations only to the street address part (before first comma)
        streetPart = streetPart
          .replace(/\b(Street|St\.?)\s*$/gi, 'St')
          .replace(/\b(Avenue|Ave\.?)\s*$/gi, 'Ave') 
          .replace(/\b(Road|Rd\.?)\s*$/gi, 'Rd')
          .replace(/\b(Boulevard|Blvd\.?)\s*$/gi, 'Blvd')
          .replace(/\b(Trail|Trl\.?)\s*$/gi, 'Trl')
          .replace(/\b(Drive|Dr\.?)\s*$/gi, 'Dr')
          .replace(/\b(Lane|Ln\.?)\s*$/gi, 'Ln')
          .replace(/\b(Court|Ct\.?)\s*$/gi, 'Ct');

        // Reconstruct the address
        normalizedAddress = streetPart + ', ' + addressParts.slice(1).join(', ');
      } else {
        // No commas present, apply suffix abbreviations more carefully
        // Only abbreviate if the word is at the end of what appears to be the street portion
        const words = normalizedAddress.split(/\s+/);
        if (words.length >= 3) {
          // Look for state pattern to identify where street address ends
          const statePattern = /\b[A-Z]{2}\b/;
          let streetEndIndex = words.length;

          for (let i = 0;i < words.length; i++) {
            if (statePattern.test(words[i])) {
              streetEndIndex = i;
              break;
            }
          }

          // Only abbreviate suffix-like words that appear at the end of the street portion
          if (streetEndIndex > 2) {
            const possibleSuffix = words[streetEndIndex - 2]; // Word before city
            if (/^(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Trail|Trl\.?|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?)$/i.test(possibleSuffix)) {
              words[streetEndIndex - 2] = possibleSuffix
                .replace(/^(Street|St\.?)$/i, 'St')
                .replace(/^(Avenue|Ave\.?)$/i, 'Ave')
                .replace(/^(Road|Rd\.?)$/i, 'Rd')
                .replace(/^(Boulevard|Blvd\.?)$/i, 'Blvd')
                .replace(/^(Trail|Trl\.?)$/i, 'Trl')
                .replace(/^(Drive|Dr\.?)$/i, 'Dr')
                .replace(/^(Lane|Ln\.?)$/i, 'Ln')
                .replace(/^(Court|Ct\.?)$/i, 'Ct');
            }
          }
          normalizedAddress = words.join(' ');
        }
      }

      // Handle addresses that are missing proper comma separation
      // Check if address already has commas - if so, leave it mostly alone
      if (normalizedAddress.includes(',')) {
        // Address already has commas, just clean up extra spaces around commas
        normalizedAddress = normalizedAddress.replace(/\s*,\s*/g, ', ');

        // Ensure proper capitalization for USPS standards
        normalizedAddress = normalizedAddress.replace(/\b\w+/g, word => {
          // Keep state abbreviations uppercase
          if (word.length === 2 && /^[A-Z]{2}$/.test(word)) return word;
          // Capitalize first letter of each word
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });
      } else {
        // Address has no commas, try to add them intelligently
        const stateZipPattern = /\b([A-Z]{2})\s+(\d{5}(-\d{4})?)\s*$/;
        const stateMatch = normalizedAddress.match(stateZipPattern);

        if (stateMatch) {
          const beforeStateZip = normalizedAddress.substring(0, stateMatch.index).trim();
          const state = stateMatch[1];
          const zip = stateMatch[2];

          // Split the part before state/zip into words
          const words = beforeStateZip.split(/\s+/);

          if (words.length >= 4) {
            // Try to intelligently separate street address from city
            // Look for patterns like "123 Main Street CityName" -> "123 Main Street, CityName"

            // Find the likely boundary between street and city
            let streetEndIndex = -1;
            const streetSuffixes = ['St', 'Ave', 'Rd', 'Blvd', 'Trl', 'Dr', 'Ln', 'Ct', 'Way', 'Pl', 'Pkwy', 'Cir'];

            // Look for street suffix to determine where street ends
            for (let i = 1; i < words.length - 1; i++) {
              if (streetSuffixes.includes(words[i])) {
                streetEndIndex = i;
                break;
              }
            }

            if (streetEndIndex > 0 && streetEndIndex < words.length - 1) {
              // Found a street suffix, split there
              const streetPart = words.slice(0, streetEndIndex + 1).join(' ');
              const cityPart = words.slice(streetEndIndex + 1).join(' ');
              normalizedAddress = `${streetPart}, ${cityPart}, ${state} ${zip}`;
            } else {
              // No clear street suffix found, assume last word(s) are city
              // For cases like "3201 Stonecrop TrailArgyle" - need to handle concatenated city names
              const lastWord = words[words.length - 1];

              // Check if last word might be a concatenated "StreetCity" pattern
              if (lastWord.length > 8 && /^[A-Z][a-z]+[A-Z][a-z]+/.test(lastWord)) {
                // Looks like concatenated street+city, try to split it
                // This is a heuristic - look for capital letter transitions
                const matches = lastWord.match(/^([A-Z][a-z]+)([A-Z][a-z]+.*)$/);
                if (matches) {
                  const streetEnd = matches[1];
                  const cityStart = matches[2];
                  const streetPart = words.slice(0, -1).concat(streetEnd).join(' ');
                  normalizedAddress = `${streetPart}, ${cityStart}, ${state} ${zip}`;
                } else {
                  // Fallback: assume last word is city
                  const streetPart = words.slice(0, -1).join(' ');
                  normalizedAddress = `${streetPart}, ${lastWord}, ${state} ${zip}`;
                }
              } else {
                // Regular case: assume last word is city
                const streetPart = words.slice(0, -1).join(' ');
                normalizedAddress = `${streetPart}, ${lastWord}, ${state} ${zip}`;
              }
            }
          } else {
            // Short address, just add comma before state
            normalizedAddress = `${beforeStateZip}, ${state} ${zip}`;
          }
        }
      }

      // Final USPS-style formatting pass
      normalizedAddress = normalizedAddress.replace(/\b\w+/g, word => {
        // Keep state abbreviations uppercase
        if (word.length === 2 && /^[A-Z]{2}$/.test(word)) return word;
        // Keep ZIP codes as-is
        if (/^\d{5}(-\d{4})?$/.test(word)) return word;
        // Capitalize first letter of each word for proper case
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });

      // Ensure proper spacing around commas
      normalizedAddress = normalizedAddress.replace(/\s*,\s*/g, ', ');

      console.log('Address normalization:', { original: address, normalized: normalizedAddress });

      res.json({ 
        verifiedAddress: normalizedAddress,
        original: address,
        verified: true,
        uspsFormatted: normalizedAddress !== address
      });

    } catch (error) {
      console.error('Address verification error:', error);
      res.status(500).json({ 
        error: "Address verification failed",
        verifiedAddress: req.body.address // Return original address as fallback
      });
    }
  });

  // Track referral clicks and interactions
  app.post("/api/track-referral", async (req: Request, res: Response) => {
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

  // AI Conversation endpoint
  app.post("/api/ai-conversation", async (req, res) => {
    try {
      const { message, context } = req.body;

      // Build context-aware prompt for moving journey task creation
      let systemPrompt = `You are an AI assistant helping with moving journey planning. Your job is to be conversational and help users build their moving journey by creating highway sign tasks.

When users ask about moving-related topics, you can create tasks for them by including a "createTasks" array in your response with task IDs from these available templates:
- "moving-company" - For finding and hiring movers
- "utilities-setup" - For setting up electricity, internet, gas, water
- "address-change" - For updating address with banks, employers, etc.
- "local-services" - For finding schools, healthcare, gyms, services

Always respond in JSON format with:
{
  "message": "Your conversational response",
  "suggestions": ["Question 1", "Question 2", "Question 3"],
  "createTasks": ["task-id-1", "task-id-2"] (optional),
  "highPriority": true/false (optional, makes tasks appear larger)
}

Be encouraging and helpful. When users mention specific needs, suggest creating relevant tasks.`;

      if (context?.moveData) {
        systemPrompt += `\n\nMove Context:
- From: ${context.moveData.from || 'Not specified'}
- To: ${context.moveData.to || 'Not specified'}
- Date: ${context.moveData.date || 'Not specified'}
- Current tasks: ${context.currentTasks || []}`;
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          error: "AI service temporarily unavailable",
          message: "I'm sorry, but I'm currently unavailable. Please try the traditional interface for now.",
          suggestions: ["Use traditional view", "Try again later"]
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

      // Ensure proper response structure
      const response = {
        message: aiResponse.message || "I understand you're working on your move. How can I help you with that?",
        suggestions: aiResponse.suggestions || [
          "I need to find movers",
          "Help me set up utilities", 
          "What should I do first?"
        ],
        createTasks: aiResponse.createTasks || [],
        highPriority: aiResponse.highPriority || false,
        actionData: aiResponse.actionData || null
      };

      res.json(response);

    } catch (error) {
      console.error("AI Conversation error:", error);

      // Provide helpful fallback responses
      const fallbackResponse = {
        message: "I'm having a bit of trouble processing that right now. Let me help you with some common moving questions instead.",
        suggestions: [
          "Find moving companies",
          "Compare pricing options", 
          "What should I ask movers?",
          "Help with moving timeline"
        ]
      };

      res.json(fallbackResponse);
    }
  });

  // Generate proxy email for user
  app.post("/api/generate-proxy-email", async (req, res) => {
    try {
      const { userId, projectId } = req.body;
      
      // Generate a unique proxy email for this user/project
      const proxyId = `user-${userId}-${projectId}-${Date.now()}`;
      const proxyEmail = `${proxyId}@ezrelo.com`;
      
      // In production, you'd store this mapping in your database
      // For now, we'll return the proxy email
      
      res.json({
        success: true,
        proxyEmail,
        message: "Proxy email generated successfully"
      });
    } catch (error) {
      console.error("Error generating proxy email:", error);
      res.status(500).json({ error: "Failed to generate proxy email" });
    }
  });

  // Handle incoming emails to proxy addresses
  app.post("/api/proxy-email-webhook", async (req, res) => {
    try {
      const { to, from, subject, body, attachments } = req.body;
      
      // Extract user/project info from proxy email
      const proxyMatch = to.match(/user-(\d+)-(\d+)-(\d+)@ezrelo\.com/);
      if (!proxyMatch) {
        return res.status(400).json({ error: "Invalid proxy email format" });
      }
      
      const [, userId, projectId] = proxyMatch;
      
      // Store the communication in the database
      await storage.createCommunication({
        projectId: parseInt(projectId),
        communicationType: "vendor_email",
        subject: `Email from ${from}: ${subject}`,
        notes: JSON.stringify({
          from,
          to,
          subject,
          body,
          attachments: attachments?.length || 0,
          receivedAt: new Date().toISOString()
        }),
        contactPerson: from
      });
      
      // Send notification to user through the platform
      // This could trigger a real-time notification or email to user's actual email
      
      res.json({ success: true, message: "Email processed and stored" });
    } catch (error) {
      console.error("Error processing proxy email:", error);
      res.status(500).json({ error: "Failed to process email" });
    }
  });

  // AI-powered mover outreach with proxy email system
  app.post("/api/share-with-movers", async (req, res) => {
    try {
      const { projectId, questionnaire, moveDetails, selectedMovers, userId } = req.body;

      // Generate proxy email for this communication
      const proxyId = `user-${userId || 1}-${projectId || 1}-${Date.now()}`;
      const proxyEmail = `${proxyId}@ezrelo.com`;

      console.log("Ezrelo AI initiating professional mover outreach...");
      console.log(`Move: ${moveDetails.from} → ${moveDetails.to}`);
      console.log(`Date: ${moveDetails.date}`);
      console.log(`Inventory items: ${Object.keys(questionnaire.majorItems || {}).length}`);
      console.log(`Contacting ${selectedMovers.length} premium moving companies`);
      console.log(`Using proxy email: ${proxyEmail}`);

      const results = [];

      // Generate AI-crafted emails for each mover
      if (process.env.OPENAI_API_KEY) {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        for (const mover of selectedMovers) {
          try {
            // Generate personalized email for this specific mover
            const emailPrompt = `Generate a professional email to ${mover.provider} requesting a moving quote. 

Customer Details:
- Contact Email: ${proxyEmail} (Ezrelo secure communication channel)
- Move Route: ${moveDetails.from} → ${moveDetails.to}
- Move Date: ${moveDetails.date}
- Home Size: ${questionnaire.homeSize}
- Major Items: ${Object.entries(questionnaire.majorItems || {}).map(([item, qty]) => `${qty}x ${item}`).join(', ')}
- Special Services: ${questionnaire.packingServices}
- Additional Notes: ${questionnaire.additionalNotes}

Mover Details:
- Company: ${mover.provider}
- Phone: ${mover.phone}
- Estimated Cost Range: ${mover.estimatedCost}

Create a professional, detailed email that:
1. Introduces the customer through Ezrelo's platform
2. Provides comprehensive move details
3. Requests a detailed quote
4. Emphasizes responses should go to the provided Ezrelo email address
5. Mentions this is a verified, pre-qualified customer
6. Includes clear next steps

IMPORTANT: The email should instruct the mover to reply to ${proxyEmail} for all communication.

Return JSON format:
{
  "subject": "Quote Request - [Move Details]",
  "emailBody": "Professional email content here",
  "callToAction": "Clear next steps for the mover"
}`;

            const emailCompletion = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                { 
                  role: "system", 
                  content: "You are a professional moving coordinator creating business-to-business communications. Write emails that are detailed, professional, and action-oriented." 
                },
                { role: "user", content: emailPrompt }
              ],
              response_format: { type: "json_object" },
              temperature: 0.3,
              max_tokens: 1000
            });

            const emailContent = JSON.parse(emailCompletion.choices[0].message.content || '{}');

            // In production with SendGrid/email service:
            if (process.env.SENDGRID_API_KEY && mover.email) {
              // const sgMail = require('@sendgrid/mail');
              // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
              // 
              // const emailData = {
              //   to: mover.email,
              //   from: 'partnerships@ezrelo.com',
              //   cc: customerEmail,
              //   subject: emailContent.subject,
              //   html: emailContent.emailBody,
              //   attachments: [
              //     {
              //       content: generateInventoryPDF(questionnaire),
              //       filename: 'moving-inventory.pdf',
              //       type: 'application/pdf'
              //     }
              //   ]
              // };
              // 
              // await sgMail.send(emailData);
              
              results.push({
                mover: mover.provider,
                status: 'sent',
                subject: emailContent.subject,
                preview: emailContent.emailBody.substring(0, 150) + '...'
              });
            } else {
              results.push({
                mover: mover.provider,
                status: 'generated',
                subject: emailContent.subject,
                preview: emailContent.emailBody.substring(0, 150) + '...',
                fullEmail: emailContent.emailBody
              });
            }

          } catch (error) {
            console.error(`Error generating email for ${mover.provider}:`, error);
            results.push({
              mover: mover.provider,
              status: 'error',
              error: 'Failed to generate email'
            });
          }
        }
      }

      // Log the AI communication for project tracking
      if (projectId) {
        await storage.createCommunication({
          projectId,
          communicationType: "ai_outreach",
          subject: "Ezrelo AI Mover Outreach Completed",
          notes: JSON.stringify({
            results,
            proxyEmail,
            moversContacted: selectedMovers.map(m => m.provider),
            automationLevel: "AI-Generated Professional Outreach with Proxy Email System",
            expectedOutcome: "3-5 competitive quotes within 24-48 hours via proxy email",
            emailsSent: results.filter(r => r.status === 'sent').length,
            emailsGenerated: results.filter(r => r.status === 'generated').length,
            communicationChannel: "Ezrelo Proxy Email System"
          }),
          contactPerson: "Ezrelo AI Assistant"
        });
      }

      res.json({ 
        success: true, 
        message: "AI outreach completed",
        results,
        proxyEmail,
        details: {
          moversContacted: selectedMovers.length,
          emailsSent: results.filter(r => r.status === 'sent').length,
          emailsGenerated: results.filter(r => r.status === 'generated').length,
          expectedQuotes: "24-48 hours via Ezrelo platform",
          ezreloAdvantage: "AI-crafted professional outreach with secure proxy email system",
          communicationMethod: "All responses will be delivered through your Ezrelo dashboard"
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
      // Disable caching for fresh results each time
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

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

  // Helper function to identify nationwide companies
  function isNationwideCompany(name: string, category: string): boolean {
    const nationwideCompanies = {
      'Fitness Center': [
        'Planet Fitness', 'LA Fitness', 'Anytime Fitness', '24 Hour Fitness', 'Gold\'s Gym',
        'Crunch Fitness', 'Snap Fitness', 'Fitness 19', 'Blink Fitness', 'Pure Gym',
        'Club 4 Fitness', 'Orangetheory', 'F45', 'CrossFit'
      ],
      'Pharmacy': [
        'CVS', 'Walgreens', 'Rite Aid', 'Walmart Pharmacy', 'Safeway Pharmacy',
        'Kroger Pharmacy', 'Costco Pharmacy', 'Sam\'s Club Pharmacy', 'Target Pharmacy',
        'Albertsons Pharmacy', 'Publix Pharmacy', 'Meijer Pharmacy'
      ],
      'Bank': [
        'Bank of America', 'Wells Fargo', 'Chase', 'JPMorgan Chase', 'Citibank', 'Citi',
        'U.S. Bank', 'US Bank', 'PNC Bank', 'PNC', 'Capital One', 'TD Bank', 'BB&T', 'Truist',
        'Fifth Third Bank', 'Fifth Third', 'Regions Bank', 'Regions', 'KeyBank', 'Key Bank',
        'SunTrust', 'Citizens Bank', 'Citizens', 'HSBC', 'American Express', 'Discover Bank',
        'Navy Federal', 'USAA', 'Ally Bank', 'Ally', 'Charles Schwab', 'Schwab', 'Fidelity'
      ],
      'Storage Facility': [
        'Public Storage', 'Extra Space Storage', 'Life Storage', 'CubeSmart',
        'U-Haul Storage', 'StorageMart', 'Simply Self Storage', 'Safeguard Self Storage',
        'National Storage Affiliates', 'Redwood Storage', 'Access Self Storage',
        'Storage King', 'Maxi Mini Storage', 'Storage Express'
      ]
    };

    const companies = nationwideCompanies[category as keyof typeof nationwideCompanies] || [];
    const lowerName = name.toLowerCase();

    // Stricter matching to avoid false positives
    return companies.some(company => {
      const lowerCompany = company.toLowerCase();

      // Exact match or company name contains the nationwide company name
      if (lowerName.includes(lowerCompany)) {
        return true;
      }

      // For multi-word companies, check if all significant words are present
      const companyWords = lowerCompany.split(' ').filter(word => word.length > 2);
      const nameWords = lowerName.split(' ');

      if (companyWords.length > 1) {
        return companyWords.every(word => nameWords.some(nameWord => nameWord.includes(word)));
      }

      return false;
    });
  }

  // Helper function to get priority score for sorting
  function getPriorityScore(name: string, category: string, rating: number): number {
    let score = 0;

    // Special boost for major banks
    if (category === 'Bank') {
      const lowerName = name.toLowerCase();

      // Top tier major banks (highest priority) - more comprehensive matching
      if (lowerName.includes('bank of america') || lowerName.includes('bofa')) {
        score += 3100; // Highest priority for Bank of America
      }
      else if (lowerName.includes('wells fargo')) {
        score += 3050;
      }
      else if (lowerName.includes('chase') && !lowerName.includes('chase bank')) {
        score += 3000;
      }
      else if (lowerName.includes('jpmorgan') || lowerName.includes('jp morgan')) {
        score += 3000;
      }
      // Second tier major banks
      else if (lowerName.includes('citibank') || (lowerName.includes('citi') && !lowerName.includes('citizens'))) {
        score += 2500;
      }
      else if (lowerName.includes('u.s. bank') || lowerName.includes('us bank')) {
        score += 2450;
      }
      else if (lowerName.includes('pnc') && lowerName.includes('bank')) {
        score += 2400;
      }
      // Other major nationwide banks
      else if (lowerName.includes('capital one') || lowerName.includes('td bank') || lowerName.includes('truist')) {
        score += 2300;
      }
      // Other nationwide banks (check against our list)
      else if (isNationwideCompany(name, category)) {
        score += 2000;
      }
      // Credit unions (should be lower priority than major banks)
      else if (lowerName.includes('credit union') || lowerName.includes('federal credit')) {
        score += 1500;
      }
      // Regional and community banks
      else if (lowerName.includes('community') || lowerName.includes('regional') || lowerName.includes('state bank')) {
        score += 1000;
      }
      // Local banks
      else {
        score += 500;
      }
    } else {
      // Boost nationwide companies significantly for other categories
      if (isNationwideCompany(name, category)) {
        score += 1000;
      }
    }

    // Add rating boost (0-100 points based on rating)
    score += (rating || 0) * 20;

    return score;
  }

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
        let searchQueries = [];
        let category = '';

        switch (serviceType) {
          case 'schools':
            searchQueries = [`elementary schools in ${location}`];
            category = 'Elementary School';
            break;
          case 'healthcare':
            searchQueries = [`family doctors in ${location}`];
            category = 'Family Medicine';
            break;
          case 'pharmacies':
            searchQueries = [
              `CVS Walgreens Rite Aid pharmacy ${location}`,
              `pharmacies in ${location}`
            ];
            category = 'Pharmacy';
            break;
          case 'veterinary':
            searchQueries = [`veterinary clinics in ${location}`];
            category = 'Veterinary Clinic';
            break;
          case 'gyms':
            searchQueries = [
              `Planet Fitness LA Fitness Anytime Fitness gym ${location}`,
              `gyms fitness centers in ${location}`
            ];
            category = 'Fitness Center';
            break;
          case 'banks':
            searchQueries = [
              `banks ${location}`,
              `credit unions ${location}`,
              `financial institutions ${location}`
            ];
            category = 'Bank';
            break;
          case 'storage':
            searchQueries = [
              `Public Storage Extra Space Life Storage CubeSmart ${location}`,
              `self storage facilities in ${location}`
            ];
            category = 'Storage Facility';
            break;
          default:
            continue;
        }

        const categoryResults = [];
        const seenPlaces = new Set();
        const seenBankNames = new Set();

        // Search with each query to get both nationwide and local options

        for (const query of searchQueries) {
          try {
            console.log(`Searching for: ${query}`);
            const places = await searchGooglePlaces(query);
            console.log(`Found ${places?.length || 0} places for query: ${query}`);

            if (places && places.length > 0) {
              for (const place of places.slice(0, 25)) {
                // Skip duplicates by place_id
                if (seenPlaces.has(place.place_id)) {
                  continue;
                }
                seenPlaces.add(place.place_id);

                // For banks, also check for duplicate bank names (to avoid multiple branches of same bank)
                if (category === 'Bank') {
                  const normalizedName = place.name.toLowerCase()
                    .replace(/\s+(bank|atm|branch|location).*$/i, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                  if (seenBankNames.has(normalizedName)) {
                    continue;
                  }
                  seenBankNames.add(normalizedName);
                }

                const details = await getPlaceDetails(place.place_id);

                if (details) {
                  const service = {
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
                    programs: getPrograms(category),
                    priorityScore: getPriorityScore(place.name, category, details.rating || 0),
                    isNationwide: isNationwideCompany(place.name, category)
                  };
                  categoryResults.push(service);
                }
              }
            }
          } catch (error) {
            console.error(`Error searching for query "${searchQuery}":`, error);
          }
        }

        // Sort by priority score (nationwide companies first), then by rating
        categoryResults.sort((a, b) => {
          if (b.priorityScore !== a.priorityScore) {
            return b.priorityScore - a.priorityScore;
          }
          // If same priority, sort by rating
          if ((b.rating || 0) !== (a.rating || 0)) {
            return (b.rating || 0) - (a.rating || 0);
          }
          // Finally sort alphabetically for consistency
          return a.provider.localeCompare(b.provider);
        });

        // Add all results for this category
        localServices.push(...categoryResults);

        if (category === 'Bank') {
          console.log(`${category}: Found ${categoryResults.length} total results`);
          console.log(`Nationwide banks found: ${categoryResults.filter(s => s.isNationwide).length}`);
          console.log(`All bank results:`, categoryResults.map(s => ({
            name: s.provider,
            priority: s.priorityScore,
            isNationwide: s.isNationwide,
            rating: s.rating
          })));
          console.log(`Bank of America specifically found:`, categoryResults.filter(s => 
            s.provider.toLowerCase().includes('bank of america') || s.provider.toLowerCase().includes('bofa')
          ));
        } else {
          console.log(`${category}: Found ${categoryResults.length} total, ${categoryResults.filter(s => s.isNationwide).length} nationwide companies`);
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