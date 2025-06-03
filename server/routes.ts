import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { addressSearchSchema, referralClickSchema, type ServiceProvidersData } from "@shared/schema";
import OpenAI from "openai";
import { db } from "./db";
import { referralClicks } from "@shared/schema";

// Known service territory database for verified locations
function getKnownServiceTerritories(city: string, state: string, zip: string): Partial<ServiceProvidersData> | null {
  const location = `${city.toLowerCase()}, ${state.toLowerCase()}`;
  
  // Texas municipalities with known exclusive service territories
  const knownTerritories: Record<string, Partial<ServiceProvidersData>> = {
    "argyle, texas": {
      Electricity: {
        category: "Electricity",
        provider: "Denton Municipal Electric",
        phone: "(940) 349-8700",
        description: "Municipal electric utility serving Argyle area residents. Exclusive service territory.",
        website: "www.cityofdenton.com/departments-services/departments-a-f/denton-municipal-electric",
        hours: "Monday-Friday 8:00 AM - 5:00 PM"
      },
      Water: {
        category: "Water",
        provider: "Denton Water Utilities", 
        phone: "(940) 349-8700",
        description: "Municipal water service for Argyle area. Contact for new service connections.",
        website: "www.cityofdenton.com/departments-services/departments-a-f/denton-municipal-electric/water",
        hours: "Monday-Friday 8:00 AM - 5:00 PM"
      },
      Trash: {
        category: "Trash",
        provider: "City of Denton Solid Waste",
        phone: "(940) 349-8700", 
        description: "Municipal waste collection service. Weekly curbside pickup.",
        website: "www.cityofdenton.com/departments-services/departments-g-p/public-works/solid-waste",
        hours: "Monday-Friday 8:00 AM - 5:00 PM"
      },
      Internet: [
        {
          category: "Internet",
          provider: "Frontier",
          phone: "1-800-921-8101",
          description: "Fiber and DSL internet service provider serving North Texas including Argyle.",
          website: "www.frontier.com",
          referralUrl: "www.frontier.com?referrer=ezrelo",
          affiliateCode: "EZRELO_FRONTIER",
          hours: "24/7 Customer Support"
        },
        {
          category: "Internet",
          provider: "Spectrum",
          phone: "1-855-243-8892",
          description: "High-speed cable internet service available in Argyle area.",
          website: "www.spectrum.com",
          referralUrl: "www.spectrum.com?partner=ezrelo",
          affiliateCode: "EZRELO_SPECTRUM",
          hours: "24/7 Customer Support"
        },
        {
          category: "Internet",
          provider: "AT&T",
          phone: "1-800-288-2020",
          description: "Fiber and DSL internet options for residential customers in Argyle.",
          website: "www.att.com",
          referralUrl: "www.att.com/referral?code=EZRELO",
          affiliateCode: "EZRELO_ATT",
          hours: "24/7 Customer Support"
        },
        {
          category: "Internet",
          provider: "Viasat",
          phone: "1-855-810-1308",
          description: "Satellite internet service available throughout North Texas including rural areas.",
          website: "www.viasat.com",
          referralUrl: "www.viasat.com?affiliate=ezrelo",
          affiliateCode: "EZRELO_VIASAT",
          hours: "24/7 Customer Support"
        }
      ],
      Gas: {
        category: "Gas", 
        provider: "Atmos Energy",
        phone: "1-888-286-6700",
        description: "Natural gas distribution service for North Texas including Argyle area.",
        website: "www.atmosenergy.com",
        hours: "24/7 Emergency Service"
      }
    }
  };

  return knownTerritories[location] || null;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Search for service providers by address
  app.post("/api/search", async (req, res) => {
    try {
      const { address } = addressSearchSchema.parse(req.body);

      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      // Validate Google Maps API key
      const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.MAPS_API_KEY;
      if (!googleApiKey) {
        return res.status(500).json({ error: "Google Maps API key not configured" });
      }

      // Validate OpenAI API key
      if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY_ENV_VAR) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      // Geocode the address using Google Maps API
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`;
      
      const geoResponse = await fetch(geoUrl);
      if (!geoResponse.ok) {
        throw new Error(`Google Maps API error: ${geoResponse.status}`);
      }

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        return res.status(404).json({ error: "Address not found. Please check your address and try again." });
      }

      const result = geoData.results[0];
      const addressComponents = result.address_components;

      const zipComponent = addressComponents.find((c: any) => c.types.includes('postal_code'));
      const cityComponent = addressComponents.find((c: any) => c.types.includes('locality'));
      const stateComponent = addressComponents.find((c: any) => c.types.includes('administrative_area_level_1'));

      const zip = zipComponent?.long_name;
      const city = cityComponent?.long_name;
      const state = stateComponent?.long_name || stateComponent?.short_name;

      if (!zip || !city || !state) {
        return res.status(404).json({ error: "Could not determine complete location details from the provided address." });
      }

      const formattedAddress = result.formatted_address;

      console.log(`📍 Resolved address: ${formattedAddress} (${city}, ${state} ${zip})`);

      // Check for known service territory overrides
      const knownTerritories = getKnownServiceTerritories(city, state, zip);
      
      // Use OpenAI to find service providers with enhanced accuracy
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert utility service territory researcher. You have access to comprehensive databases of municipal utilities, rural electric cooperatives, and exclusive service territories. Always provide the actual monopoly provider that serves each specific address, not general options. If multiple providers exist, specify which one serves this exact location."
          },
          {
            role: "user", 
            content: `You must find the EXACT utility monopoly providers for this specific address: ${formattedAddress}

CRITICAL: For ${city}, ${state} ${zip} specifically:

Step 1: Determine if this address falls within any municipal utility service territories
Step 2: Check for rural electric cooperative boundaries  
Step 3: Identify exclusive franchise areas
Step 4: If uncertain, explicitly state "Verify with local authorities"

Special attention for Texas locations like Argyle:
- Many Texas municipalities have their own electric/water utilities
- Denton County area may be served by Denton Municipal Electric
- Municipal boundaries determine service providers
- Some areas have NO choice in providers (monopoly service)

Return JSON with ONLY the actual providers that serve this exact address. If multiple options exist, state the primary/required provider. If uncertain about exact boundaries, include verification instructions.

{
  "Electricity": {
    "provider": "[Municipal Electric Company Name OR Rural Coop OR Retail Provider Name - BE SPECIFIC]",
    "phone": "[Actual service phone]",
    "description": "Service territory: [specific area served]. Connection process: [how to establish service]",
    "website": "[actual website]",
    "hours": "[service hours]"
  },
  "Water": {
    "provider": "[Municipal Water Dept OR Water District OR Private Utility Name]", 
    "phone": "[Actual service phone]",
    "description": "Service territory: [specific area]. Setup requirements: [deposit/connection info]",
    "website": "[actual website]",
    "hours": "[service hours]"
  },
  "Gas": {
    "provider": "[Distribution Company Name - usually regional monopoly]",
    "phone": "[Actual service phone]", 
    "description": "Distribution area: [territory served]. Service availability: [if available at address]",
    "website": "[actual website]",
    "hours": "[service hours]"
  },
  "Internet": {
    "provider": "[Primary ISP name OR Multiple available: ISP1, ISP2]",
    "phone": "[Service phone]",
    "description": "Available services: [speeds/plans for this location]", 
    "website": "[actual website]",
    "hours": "[service hours]"
  },
  "Trash": {
    "provider": "[Municipal Service OR Contracted Company Name]",
    "phone": "[Service phone]",
    "description": "Collection area: [territory]. Schedule: [pickup days if known]",
    "website": "[actual website]", 
    "hours": "[service hours]"
  }
}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const gptContent = completion.choices?.[0]?.message?.content;
      if (!gptContent) {
        throw new Error("No response from OpenAI");
      }

      let providersData: ServiceProvidersData;
      try {
        providersData = JSON.parse(gptContent);
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        console.error("Raw response:", gptContent);
        throw new Error("Invalid response format from AI service");
      }

      // Validate the response structure
      if (!providersData || typeof providersData !== 'object') {
        throw new Error("Invalid service provider data format");
      }

      // Override with known accurate service territories when available
      if (knownTerritories) {
        console.log(`🎯 Using verified service territories for ${city}, ${state}`);
        // Merge known territories with AI results, prioritizing known data
        for (const [category, knownProvider] of Object.entries(knownTerritories)) {
          if (knownProvider) {
            if (Array.isArray(knownProvider)) {
              // For arrays (like multiple Internet providers), add each one with unique keys
              knownProvider.forEach((provider, index) => {
                if (index === 0) {
                  providersData[category] = provider;
                } else {
                  providersData[`${category}_${index + 1}`] = provider;
                }
              });
            } else {
              // For single providers, replace directly
              providersData[category] = knownProvider;
            }
          }
        }
      }

      return res.json({
        success: true,
        address: formattedAddress,
        city,
        state,
        zipCode: zip,
        providers: providersData
      });

    } catch (error) {
      console.error("Search error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request format",
          details: error.errors 
        });
      }

      const errorMessage = error instanceof Error ? error.message : "Internal server error";
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Track referral clicks for monetization
  app.post("/api/referral-click", async (req, res) => {
    try {
      const { provider, category, action, userAddress } = referralClickSchema.parse(req.body);
      
      // Log the referral click to database
      const timestamp = new Date().toISOString();
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      await db.insert(referralClicks).values({
        provider,
        category,
        action,
        userAddress,
        timestamp,
        ipAddress,
        userAgent
      });

      console.log(`💰 Referral click tracked: ${provider} - ${action} for ${userAddress}`);
      
      return res.json({ success: true, message: "Referral tracked successfully" });

    } catch (error) {
      console.error("Referral tracking error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid referral data",
          details: error.errors 
        });
      }

      return res.status(500).json({ error: "Failed to track referral" });
    }
  });

  // Analytics endpoint for monetization dashboard
  app.get("/api/analytics", async (req, res) => {
    try {
      // Get all referral clicks
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

  const httpServer = createServer(app);
  return httpServer;
}
