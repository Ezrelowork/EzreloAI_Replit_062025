import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { referralClicks } from "@shared/schema";
import { referralClickSchema } from "@shared/schema";
import { z } from "zod";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Search endpoint using ChatGPT with Google Business enhancement
  app.post("/api/search", async (req, res) => {
    try {
      const { city, state, zip } = req.body;
      
      if (!city || !state) {
        return res.status(400).json({ error: "City and state are required" });
      }

      // Use ChatGPT to provide comprehensive service provider data
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          error: "AI service temporarily unavailable. Please contact support.",
          providers: {}
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const location = zip ? `${city}, ${state} ${zip}` : `${city}, ${state}`;
      
      const prompt = `Provide comprehensive service provider information for someone moving to ${location}.

Include specific availability percentages, connection types, speeds, pricing, and service limitations for each provider.

Return response in JSON format:
{
  "movingCompanies": [
    {
      "provider": "Company Name",
      "phone": "Phone number",
      "website": "Website URL",
      "description": "Service description with years in business",
      "estimatedCost": "Price range for typical move",
      "availability": "Service coverage percentage",
      "services": ["Local Moving", "Long Distance", "Packing"],
      "notes": "Special features or limitations"
    }
  ],
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
  "electricity": [
    {
      "provider": "Company Name",
      "phone": "Phone number",
      "website": "Website URL", 
      "description": "Service description",
      "estimatedCost": "Rate per kWh or monthly estimate",
      "availability": "Service area coverage",
      "planTypes": ["Fixed Rate", "Variable Rate", "Green Energy"],
      "setupFee": "Connection fees",
      "connectionTime": "Service activation time",
      "services": ["Residential", "Business", "Green Options"],
      "notes": "Contract terms, renewable options, or special programs"
    }
  ],
  "water": [...],
  "waste": [...],
  "cable": [...]
}

Focus on accuracy and specificity - include availability percentages, exact speeds/rates, connection technologies, and service limitations. Only include providers with actual infrastructure in ${location}.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are an expert on service providers with comprehensive knowledge of coverage areas and accurate contact information. Provide only real, verified provider information." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 3000
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Enhance with Google Business data if available
      const enhancedProviders: any = {};
      
      for (const [category, providers] of Object.entries(aiResponse)) {
        if (Array.isArray(providers)) {
          enhancedProviders[category] = await Promise.all(
            providers.map(async (provider: any) => {
              let enhancedData = { ...provider };

              // Enhance with Google Places data
              if (process.env.GOOGLE_API_KEY) {
                try {
                  const searchQuery = `${provider.provider} ${city} ${state}`;
                  const placesResponse = await fetch(
                    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${process.env.GOOGLE_API_KEY}`
                  );
                  
                  if (placesResponse.ok) {
                    const placesData = await placesResponse.json();
                    if (placesData.candidates?.[0]?.place_id) {
                      const placeId = placesData.candidates[0].place_id;
                      const detailsResponse = await fetch(
                        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,formatted_phone_number,website&key=${process.env.GOOGLE_API_KEY}`
                      );
                      
                      if (detailsResponse.ok) {
                        const detailsData = await detailsResponse.json();
                        const result = detailsData.result;
                        
                        if (result.rating) {
                          enhancedData.rating = result.rating;
                        }
                        if (result.user_ratings_total) {
                          enhancedData.reviewCount = result.user_ratings_total;
                        }
                        if (result.formatted_phone_number && !provider.phone) {
                          enhancedData.phone = result.formatted_phone_number;
                        }
                        if (result.website && !provider.website) {
                          enhancedData.website = result.website;
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.log(`Could not enhance data for ${provider.provider}`);
                }
              }

              return enhancedData;
            })
          );
        }
      }

      return res.json({
        success: true,
        address: location,
        city,
        state,
        zipCode: zip,
        providers: enhancedProviders
      });

    } catch (error) {
      console.error("Search error:", error);
      return res.status(500).json({ error: "Search failed" });
    }
  });

  // Moving companies endpoint using ChatGPT with Google Business enhancement
  app.post("/api/moving-companies", async (req, res) => {
    try {
      const { fromCity, fromState, fromZip, toCity, toState, toZip } = req.body;
      
      if (!fromCity || !fromState || !toCity || !toState) {
        return res.status(400).json({ error: "Origin and destination are required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          error: "Service temporarily unavailable",
          companies: []
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const fromLocation = fromZip ? `${fromCity}, ${fromState} ${fromZip}` : `${fromCity}, ${fromState}`;
      const toLocation = toZip ? `${toCity}, ${toState} ${toZip}` : `${toCity}, ${toState}`;
      const isLocalMove = fromState.toUpperCase() === toState.toUpperCase();
      const moveType = isLocalMove ? "local" : "long-distance";
      
      const prompt = `Find comprehensive moving options for a ${moveType} move from ${fromLocation} to ${toLocation}.

Include ALL types of moving solutions:
1. Local/regional moving companies in the ${fromLocation} area that handle long-distance moves
2. Major national moving companies (United Van Lines, Atlas, Mayflower, North American, etc.)
3. Alternative moving options (U-Pack, PODS, Budget Truck Rental, etc.)
4. Hybrid solutions (you pack, they drive)

Return JSON format with detailed information:
{
  "companies": [
    {
      "provider": "Company Name",
      "phone": "Phone number",
      "website": "Website URL",
      "description": "Company description with years in business and specialties",
      "estimatedCost": "Realistic cost range for this specific route and distance",
      "availability": "Service area coverage percentage or availability details",
      "services": ["Local Moving", "Long Distance", "Packing", "Storage"],
      "category": "Local Moving Companies" or "National Moving Companies" or "Alternative Moving Solutions",
      "licenseInfo": "DOT number, state licensing, or certification details",
      "specialties": ["Residential", "Commercial", "Piano Moving", "Fragile Items"],
      "insuranceOptions": ["Basic", "Full Value Protection", "Third Party"],
      "estimatedTimeframe": "Typical delivery timeframe for this route",
      "notes": "Important details about services, restrictions, or special features"
    }
  ]
}

Provide at least 8-12 options covering:
- Local movers in ${fromLocation} area who do interstate moves
- Major national carriers with service to this route
- Alternative solutions like U-Pack, PODS, portable storage
- DIY options with truck rentals

Focus on companies that actually serve this specific route with accurate pricing estimates.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are an expert on the moving industry with comprehensive knowledge of companies, service areas, and pricing. Provide accurate, real company information only." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 3000
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Enhance with Google Business information
      const enhancedCompanies = await Promise.all(
        (aiResponse.companies || []).map(async (company: any) => {
          let enhancedData = {
            category: company.category || "Moving Companies",
            provider: company.provider,
            phone: company.phone || "Contact for details",
            description: company.description,
            website: company.website || `https://www.google.com/search?q=${encodeURIComponent(company.provider)}`,
            referralUrl: company.website || `https://www.google.com/search?q=${encodeURIComponent(company.provider)}`,
            affiliateCode: "",
            hours: "Contact for hours",
            rating: 0,
            services: company.services || ["Moving Services"],
            estimatedCost: company.estimatedCost || "Contact for estimate",
            availability: company.availability || undefined,
            licenseInfo: company.licenseInfo || undefined,
            specialties: company.specialties || undefined,
            insuranceOptions: company.insuranceOptions || undefined,
            estimatedTimeframe: company.estimatedTimeframe || undefined,
            notes: company.notes || undefined
          };

          // Enhance with Google Places data
          if (process.env.GOOGLE_API_KEY) {
            try {
              const searchQuery = `${company.provider} ${fromCity} ${fromState}`;
              const placesResponse = await fetch(
                `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${process.env.GOOGLE_API_KEY}`
              );
              
              if (placesResponse.ok) {
                const placesData = await placesResponse.json();
                if (placesData.candidates?.[0]?.place_id) {
                  const placeId = placesData.candidates[0].place_id;
                  const detailsResponse = await fetch(
                    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,formatted_phone_number,website,opening_hours&key=${process.env.GOOGLE_API_KEY}`
                  );
                  
                  if (detailsResponse.ok) {
                    const detailsData = await detailsResponse.json();
                    const result = detailsData.result;
                    
                    if (result.rating) {
                      enhancedData.rating = result.rating;
                    }
                    if (result.formatted_phone_number && enhancedData.phone === "Contact for details") {
                      enhancedData.phone = result.formatted_phone_number;
                    }
                    if (result.website && !company.website) {
                      enhancedData.website = result.website;
                      enhancedData.referralUrl = result.website;
                    }
                    if (result.opening_hours?.weekday_text) {
                      enhancedData.hours = result.opening_hours.weekday_text[0] || "Contact for hours";
                    }
                    if (result.user_ratings_total) {
                      enhancedData.description += ` • ${result.user_ratings_total} Google reviews`;
                    }
                  }
                }
              }
            } catch (error) {
              console.log(`Could not enhance data for ${company.provider}`);
            }
          }

          return enhancedData;
        })
      );

      return res.json({
        success: true,
        companies: enhancedCompanies,
        searchInfo: {
          from: fromLocation,
          to: toLocation,
          moveType: moveType
        }
      });

    } catch (error) {
      console.error("Moving companies search error:", error);
      return res.status(500).json({ error: "Failed to load moving companies" });
    }
  });

  // Utility providers endpoint using ChatGPT
  app.post("/api/utility-providers", async (req, res) => {
    try {
      const { city, state, zip, utilityType } = req.body;
      
      if (!city || !state) {
        return res.status(400).json({ error: "City and state are required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          error: "Service temporarily unavailable",
          providers: []
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const fullAddress = zip ? `${city}, ${state} ${zip}` : `${city}, ${state}`;
      
      const prompt = `What ${utilityType} providers are available at ${fullAddress}?

Provide comprehensive list of actual providers that serve this exact location. Include specific availability percentages, connection types, and detailed service information.

Return JSON format:
{
  "providers": [
    {
      "provider": "Company Name",
      "phone": "Phone number", 
      "website": "Official website URL",
      "description": "Service description and coverage details",
      "estimatedCost": "Monthly cost range (e.g., $29.99/mo)",
      "availability": "Availability percentage in this area (e.g., ~97%)",
      "connectionType": "Technology type (e.g., Fiber, Cable, DSL, 5G)",
      "maxSpeed": "Maximum speed offered (e.g., Up to 7,000 Mbps)",
      "setupFee": "Installation/setup fees",
      "connectionTime": "Service activation timeframe",
      "services": ["Service 1", "Service 2"],
      "notes": "Important details about data caps, limitations, or special features"
    }
  ]
}

Focus on accuracy and specificity - include availability percentages, exact speeds, connection technologies, and any service limitations or special features. Only include providers with actual infrastructure in this area.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are an expert on utility providers with comprehensive knowledge of service areas and coverage maps. Provide only accurate, real provider information." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 2000
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
      
      const formattedProviders = (aiResponse.providers || []).map((provider: any) => ({
        ...provider,
        referralUrl: provider.website || `https://www.google.com/search?q=${encodeURIComponent(provider.provider)}`,
        affiliateCode: "",
        rating: 0
      }));

      res.json({ 
        providers: formattedProviders,
        location: fullAddress,
        utilityType 
      });

    } catch (error) {
      console.error("Error finding utility providers:", error);
      res.status(500).json({ error: "Failed to find utility providers" });
    }
  });

  // AI Recommendations endpoint
  app.post("/api/ai-recommendations", async (req, res) => {
    try {
      const { query, fromLocation, toLocation, moveDate, familySize, budget, priorities } = req.body;
      
      if (!fromLocation || !toLocation) {
        return res.status(400).json({ error: "Both locations are required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          error: "AI service temporarily unavailable",
          recommendations: [],
          summary: "AI analysis requires configuration",
          timeline: [],
          estimatedTotalCost: "Contact for estimate"
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are an expert relocation concierge AI assistant specializing in comprehensive moving and relocation planning.

Provide detailed, actionable recommendations covering:
- Moving services and logistics
- Utility setup and transfers  
- Local area insights and lifestyle adjustments
- Cost optimization strategies
- Timeline planning
- Service provider recommendations

Always provide specific, practical advice with reasoning.`;

      const userPrompt = `Help plan relocation with these details:

Moving from: ${fromLocation}
Moving to: ${toLocation}
Move date: ${moveDate || 'Not specified'}
Household size: ${familySize}
Budget range: ${budget}
Priorities: ${priorities.length > 0 ? priorities.join(', ') : 'None specified'}

${query ? `Specific question: ${query}` : ''}

Provide comprehensive relocation plan in JSON format:
{
  "summary": "Brief overview and key considerations",
  "recommendations": [
    {
      "category": "Category name",
      "title": "Recommendation title", 
      "description": "Detailed description",
      "reasoning": "Why this recommendation makes sense",
      "priority": "high|medium|low",
      "estimatedCost": "Cost range",
      "timeframe": "When to handle this",
      "providers": [
        {
          "name": "Provider name",
          "description": "Why recommended",
          "contact": "Contact information"
        }
      ],
      "nextSteps": ["Step 1", "Step 2"]
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

Focus on actionable recommendations for ${fromLocation} to ${toLocation}.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 3000
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

      const structuredResponse = {
        summary: aiResponse.summary || "AI analysis complete for your relocation plan.",
        recommendations: aiResponse.recommendations || [],
        timeline: aiResponse.timeline || [],
        estimatedTotalCost: aiResponse.estimatedTotalCost || "Varies by services selected"
      };

      res.json(structuredResponse);

    } catch (error) {
      console.error("AI Recommendations error:", error);
      return res.status(500).json({ 
        error: "AI analysis temporarily unavailable",
        recommendations: [],
        summary: "Unable to generate recommendations at this time",
        timeline: [],
        estimatedTotalCost: "Contact for estimate"
      });
    }
  });

  // Track referral clicks
  app.post("/api/track-referral", async (req, res) => {
    try {
      const { provider, category, action, userAddress } = referralClickSchema.parse(req.body);
      
      const timestamp = new Date().toISOString();
      const ipAddress = req.ip || 'unknown';

      await db.insert(referralClicks).values({
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

  // Analytics endpoint
  app.get("/api/analytics", async (req, res) => {
    try {
      const allClicks = await db.select().from(referralClicks);
      
      const totalClicks = allClicks.length;
      
      const providerCounts = allClicks.reduce((acc, click) => {
        acc[click.provider] = (acc[click.provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const clicksByProvider = Object.entries(providerCounts)
        .map(([provider, clicks]) => ({ provider, clicks }))
        .sort((a, b) => b.clicks - a.clicks);
      
      const categoryCounts = allClicks.reduce((acc, click) => {
        acc[click.category] = (acc[click.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const clicksByCategory = Object.entries(categoryCounts)
        .map(([category, clicks]) => ({ category, clicks }))
        .sort((a, b) => b.clicks - a.clicks);
      
      const actionCounts = allClicks.reduce((acc, click) => {
        acc[click.action] = (acc[click.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const clicksByAction = Object.entries(actionCounts)
        .map(([action, clicks]) => ({ action, clicks }))
        .sort((a, b) => b.clicks - a.clicks);
      
      const locationCounts = allClicks.reduce((acc, click) => {
        acc[click.userAddress] = (acc[click.userAddress] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topLocations = Object.entries(locationCounts)
        .map(([location, clicks]) => ({ location, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
      
      const recentClicks = allClicks
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);
      
      return res.json({
        totalClicks,
        clicksByProvider,
        clicksByCategory,
        clicksByAction,
        topLocations,
        recentClicks
      });
      
    } catch (error) {
      console.error("Analytics error:", error);
      return res.status(500).json({ error: "Failed to load analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}