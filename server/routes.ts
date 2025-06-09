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
      
      // API DISABLED FOR DEVELOPMENT - Return empty response
      console.log('OpenAI API DISABLED for location:', location);
      
      // Check known territories first
      let providersData: ServiceProvidersData = {};
      const knownData = getKnownServiceTerritories(city, state, zip || "");
      if (knownData) {
        providersData = knownData as ServiceProvidersData;
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
      const validatedData = referralClickSchema.parse(req.body);
      
      await db.insert(referralClicks).values({
        ...validatedData,
        timestamp: new Date()
      });
      
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

      // API DISABLED FOR DEVELOPMENT - Return static data
      console.log('OpenAI API DISABLED: Would search moving companies from', fromCity, fromState, 'to', toCity, toState);

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

      // API DISABLED FOR DEVELOPMENT - Return static response
      console.log('OpenAI API DISABLED: Would analyze move from', fromLocation, 'to', toLocation);

      const staticResponse = {
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

      res.json(staticResponse);

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
      
      // API DISABLED FOR DEVELOPMENT - Return static data
      console.log('OpenAI API DISABLED for utility search:', utilityType, 'in', location);

      const staticUtilities = [
        {
          category: "Internet",
          provider: "AT&T Fiber",
          phone: "1-800-288-2020",
          description: "High-speed fiber internet with up to 5 Gig speeds",
          website: "att.com",
          referralUrl: "https://www.att.com/internet/fiber/",
          services: ["Fiber Internet", "Streaming TV", "Phone Service"],
          estimatedCost: "$55-80/month",
          rating: 4.2,
          availability: "Available in most areas"
        }
      ];

      res.json({
        success: true,
        utilities: staticUtilities
      });

    } catch (error) {
      console.error("Utilities search error:", error);
      res.status(500).json({ 
        error: "Search failed",
        utilities: []
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}