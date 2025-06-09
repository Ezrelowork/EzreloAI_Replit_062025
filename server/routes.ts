import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { movingProjects, movingProjectSchema, referralClicks, referralClickSchema, type ServiceProvidersData } from "@shared/schema";
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

function getKnownServiceTerritories(city: string, state: string, zip: string): Partial<ServiceProvidersData> | null {
  const location = `${city.toLowerCase()}, ${state.toLowerCase()}`;
  
  // Static data for development
  const knownTerritories: Record<string, Partial<ServiceProvidersData>> = {
    "austin, texas": {
      Internet: {
        category: "Internet",
        provider: "AT&T Fiber",
        phone: "(800) 288-2020",
        description: "High-speed fiber internet service in Austin area",
        website: "www.att.com",
        hours: "24/7 Customer Support"
      }
    }
  };
  
  return knownTerritories[location] || null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Service providers endpoint - API DISABLED FOR DEVELOPMENT
  app.post("/api/service-providers", async (req, res) => {
    try {
      const { address, city, state, zip } = req.body;
      
      if (!city || !state) {
        return res.status(400).json({ error: "City and state are required" });
      }

      const location = zip ? `${city}, ${state} ${zip}` : `${city}, ${state}`;
      
      // Check known territories first
      let providersData: ServiceProvidersData = {};
      const knownData = getKnownServiceTerritories(city, state, zip || "");
      if (knownData) {
        providersData = knownData as ServiceProvidersData;
      }

      // If no known data and API key available, use OpenAI
      if (Object.keys(providersData).length === 0 && process.env.OPENAI_API_KEY) {
        try {
          const OpenAI = (await import('openai')).default;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
              role: "system",
              content: "You are a relocation specialist. Provide accurate utility and service provider information for the specified location."
            }, {
              role: "user", 
              content: `Find utility providers and essential services for ${city}, ${state}. Include electric, gas, water, internet, waste management. Provide real company names, phone numbers, and websites.`
            }],
            response_format: { type: "json_object" }
          });

          const response = completion.choices[0].message.content;
          if (response) {
            const aiData = JSON.parse(response);
            providersData = { ...providersData, ...aiData };
          }
        } catch (error) {
          console.error("OpenAI API error:", error);
        }
      }

      res.json({
        success: true,
        address: address || "",
        city,
        state,
        zipCode: zip || "",
        providers: providersData
      });
      
    } catch (error) {
      console.error("Service providers search error:", error);
      return res.status(500).json({ error: "Search failed" });
    }
  });

  // Track referral clicks
  app.post("/api/referral-click", async (req, res) => {
    try {
      // TODO: Fix database schema mismatch - temporarily disabled
      console.log("Referral click:", req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Referral click tracking error:", error);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", async (req, res) => {
    try {
      const allClicks = await db.select().from(referralClicks);
      
      // Calculate analytics
      const totalClicks = allClicks.length;
      
      // Group by provider
      const providerCounts = allClicks.reduce((acc, click) => {
        acc[click.provider] = (acc[click.provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const clicksByProvider = Object.entries(providerCounts)
        .map(([provider, clicks]) => ({ provider, clicks }))
        .sort((a, b) => b.clicks - a.clicks);
      
      // Group by category
      const categoryCounts = allClicks.reduce((acc, click) => {
        acc[click.category] = (acc[click.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const clicksByCategory = Object.entries(categoryCounts)
        .map(([category, clicks]) => ({ category, clicks }))
        .sort((a, b) => b.clicks - a.clicks);
      
      // Group by action
      const actionCounts = allClicks.reduce((acc, click) => {
        acc[click.action] = (acc[click.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const clicksByAction = Object.entries(actionCounts)
        .map(([action, clicks]) => ({ action, clicks }))
        .sort((a, b) => b.clicks - a.clicks);
      
      // Top locations
      const locationCounts = allClicks.reduce((acc, click) => {
        // Extract city from address
        const addressParts = click.userAddress.split(',');
        const city = addressParts.length >= 2 ? addressParts[1].trim() : click.userAddress;
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topLocations = Object.entries(locationCounts)
        .map(([location, clicks]) => ({ location, clicks }))
        .sort((a, b) => b.clicks - a.clicks);
      
      // Recent clicks (last 50)
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

  // Moving companies endpoint - API DISABLED
  app.post("/api/moving-companies", async (req, res) => {
    try {
      const { fromCity, fromState, fromZip, toCity, toState, toZip } = req.body;
      
      if (!fromCity || !fromState || !toCity || !toState) {
        return res.status(400).json({ error: "Origin and destination cities and states are required" });
      }

      // First provide static companies, then enhance with API data if available
      const staticCompanies = [
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
        }
      ];

      res.json({
        success: true,
        companies: staticCompanies
      });
      
    } catch (error) {
      console.error("Moving companies search error:", error);
      res.status(500).json({ 
        error: "Search failed",
        companies: []
      });
    }
  });

  // AI Recommendations endpoint - API DISABLED
  app.post("/api/ai-recommendations", async (req, res) => {
    try {
      const { query, fromLocation, toLocation, moveDate, familySize, budget, priorities } = req.body;
      
      if (!fromLocation || !toLocation) {
        return res.status(400).json({ error: "Both current and destination locations are required" });
      }

      // Use OpenAI if API key is available, otherwise return static response
      let response;
      
      if (process.env.OPENAI_API_KEY) {
        try {
          const OpenAI = (await import('openai')).default;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
              role: "system",
              content: "You are an expert relocation concierge AI assistant specializing in comprehensive moving and relocation planning."
            }, {
              role: "user",
              content: `Create a detailed moving plan from ${fromLocation} to ${toLocation}. Move date: ${moveDate || 'Not specified'}. Family size: ${familySize || 'Not specified'}. Budget: ${budget || 'Not specified'}. Priorities: ${priorities || 'Standard relocation'}. Provide strategic recommendations and actionable timeline in JSON format.`
            }],
            response_format: { type: "json_object" }
          });

          const aiResponse = completion.choices[0].message.content;
          if (aiResponse) {
            response = JSON.parse(aiResponse);
          }
        } catch (error) {
          console.error("OpenAI API error:", error);
        }
      }

      // Fallback to static response if no AI response
      if (!response) {
        response = {
          summary: `Strategic relocation plan for your move from ${fromLocation} to ${toLocation}. Budget range: ${budget || '$8,000-$15,000'}`,
          recommendations: [
            {
              category: "Cost Optimization",
              advice: "Consider timing and seasonal factors",
              week: "8 weeks before move",
              tasks: ["Compare quotes", "Book early for discounts"]
            }
          ],
          actionPlan: [
            {
              title: "Get Moving Quotes",
              description: "Find and compare local moving companies for your relocation",
              route: "/dashboard",
              priority: "high",
              timeframe: "6-8 weeks before",
              status: "pending"
            },
            {
              title: "Set Up Utilities",
              description: "Transfer or establish internet, electric, gas, and water services",
              route: "/utilities",
              priority: "high", 
              timeframe: "4-6 weeks before",
              status: "pending"
          }
        ],
        timeline: [
          {
            week: "8-10 weeks before",
            tasks: ["Research new area", "Create moving budget", "Start decluttering"]
          },
          {
            week: "6-8 weeks before", 
            tasks: ["Get moving quotes", "Research schools/services", "Start utility transfers"]
          }
        ],
        estimatedTotalCost: budget || "$8,000 - $15,000"
      };
      }

      res.json(response);

    } catch (error) {
      console.error("AI Recommendations error:", error);
      
      return res.status(500).json({ 
        error: "AI analysis temporarily unavailable. Please try again or contact support.",
        recommendations: [],
        summary: "Unable to generate AI recommendations at this time.",
        timeline: [],
        estimatedTotalCost: "Service temporarily unavailable"
      });
    }
  });

  // Utilities search endpoint - API DISABLED
  app.post("/api/utilities-search", async (req, res) => {
    try {
      const { city, state, zipCode, utilityType } = req.body;
      
      if (!city || !state) {
        return res.status(400).json({ error: "City and state are required" });
      }

      const location = zipCode ? `${city}, ${state} ${zipCode}` : `${city}, ${state}`;
      
      // Use OpenAI if available, otherwise provide basic static data
      let utilities = [];
      
      if (process.env.OPENAI_API_KEY) {
        try {
          const OpenAI = (await import('openai')).default;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
              role: "system",
              content: "You are a utility service specialist. Provide accurate, real utility provider information for the specified location."
            }, {
              role: "user",
              content: `Find ${utilityType || 'all utility'} providers for ${location}. Include electric, gas, water, internet, cable TV, and waste management. Provide real company names, accurate phone numbers, and official websites.`
            }],
            response_format: { type: "json_object" }
          });

          const response = completion.choices[0].message.content;
          if (response) {
            const aiData = JSON.parse(response);
            utilities = aiData.utilities || aiData.providers || [];
          }
        } catch (error) {
          console.error("OpenAI API error:", error);
        }
      }

      // Provide minimal fallback only if no AI data
      if (utilities.length === 0) {
        utilities = [
          {
            category: "Internet",
            provider: "Local Internet Provider",
            phone: "Contact local directory",
            description: "Contact local directory assistance for internet providers in your area",
            website: "N/A",
            referralUrl: "N/A",
            services: ["Internet Service"],
            estimatedCost: "Contact for pricing",
            rating: 0,
            availability: "Contact for availability"
          }
        ];
      }

      res.json({
        success: true,
        utilities: utilities
      });

    } catch (error) {
      console.error("Utilities search error:", error);
      res.status(500).json({ 
        error: "Search failed",
        utilities: []
      });
    }
  });

  // Utility providers endpoint (used by utilities page)
  app.post("/api/utility-providers", async (req, res) => {
    try {
      const { city, state, zip, utilityType } = req.body;
      
      if (!city || !state) {
        return res.status(400).json({ error: "City and state are required" });
      }

      const fullAddress = zip ? `${city}, ${state} ${zip}` : `${city}, ${state}`;
      let providers = [];

      // Use OpenAI if available for real provider data
      if (process.env.OPENAI_API_KEY) {
        try {
          const OpenAI = (await import('openai')).default;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          const prompt = `What ${utilityType || 'utility'} providers are available at this specific address: ${fullAddress}?

Please provide a comprehensive list of actual ${utilityType || 'utility'} providers that serve this exact location. Include only real companies that actually provide service to this area.

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
      "connectionTime": "How long to get service",
      "services": ["Service 1", "Service 2", "Service 3"]
    }
  ]
}

Focus on accuracy - only include providers that actually serve this specific location.`;

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
          
          providers = (aiResponse.providers || []).map((provider: any) => ({
            ...provider,
            referralUrl: provider.website || `https://www.google.com/search?q=${encodeURIComponent(provider.provider)}`,
            affiliateCode: "",
            rating: provider.rating || 4.0
          }));

        } catch (error) {
          console.error("OpenAI API error:", error);
        }
      }

      // If no providers found, provide basic fallback data
      if (providers.length === 0) {
        console.log('No providers found via OpenAI, providing fallback data for:', fullAddress, utilityType);
        
        const fallbackProviders = [
          {
            provider: "Local Electric Company",
            phone: "Call 411 for local directory",
            website: "https://www.google.com/search?q=electric+company+" + encodeURIComponent(city + " " + state),
            description: "Contact your local electric utility company for service in this area",
            estimatedCost: "Contact for rates",
            availability: "Contact for availability",
            setupFee: "Contact for details",
            connectionTime: "Contact for timeline",
            services: ["Electric Service"],
            referralUrl: "https://www.google.com/search?q=electric+company+" + encodeURIComponent(city + " " + state),
            affiliateCode: "",
            rating: 0
          },
          {
            provider: "Local Internet Provider",
            phone: "Call 411 for local directory", 
            website: "https://www.google.com/search?q=internet+provider+" + encodeURIComponent(city + " " + state),
            description: "Contact local internet service providers in your area",
            estimatedCost: "Contact for rates",
            availability: "Contact for availability",
            setupFee: "Contact for details",
            connectionTime: "Contact for timeline",
            services: ["Internet Service"],
            referralUrl: "https://www.google.com/search?q=internet+provider+" + encodeURIComponent(city + " " + state),
            affiliateCode: "",
            rating: 0
          }
        ];
        
        providers = fallbackProviders;
      }

      res.json({ 
        providers,
        location: fullAddress,
        utilityType 
      });

    } catch (error) {
      console.error("Error finding utility providers:", error);
      res.status(500).json({ 
        error: "Failed to find utility providers",
        providers: []
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}