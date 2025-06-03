import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { addressSearchSchema, type ServiceProvidersData } from "@shared/schema";
import OpenAI from "openai";

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
            content: `Find the EXACT utility and service providers that serve the specific address: ${formattedAddress} in ${city}, ${state} ${zip}.

IMPORTANT: This must be the actual monopoly or specific providers for this exact location, not general options. Some areas have only ONE provider option (like municipal utilities). Research the specific service territory for this address.

For areas like Argyle, TX or other small municipalities, check if they have:
- Municipal utility services (like Denton Municipal Electric, Denton Water)
- Specific regional providers that have exclusive service territories
- Rural electric cooperatives
- Municipal waste services

Respond ONLY with valid JSON in this exact format (no markdown, no explanation, no additional text):

{
  "Electricity": {
    "provider": "Exact Provider Name (e.g., Denton Municipal Electric if in their service area)",
    "phone": "Actual customer service phone",
    "description": "Service territory and connection info",
    "website": "actual website URL",
    "hours": "Customer service hours"
  },
  "Gas": {
    "provider": "Exact Provider Name (e.g., Atmos Energy if they serve this area)",
    "phone": "Actual customer service phone",
    "description": "Service territory and connection info",
    "website": "actual website URL",
    "hours": "Customer service hours"
  },
  "Water": {
    "provider": "Exact Provider Name (municipal or private utility that serves this address)",
    "phone": "Actual customer service phone",
    "description": "Service territory and connection info",
    "website": "actual website URL",
    "hours": "Customer service hours"
  },
  "Internet": {
    "provider": "Primary high-speed provider available at this address",
    "phone": "Actual customer service phone",
    "description": "Available plans and speeds for this location",
    "website": "actual website URL",
    "hours": "Customer service hours"
  },
  "Trash": {
    "provider": "Exact waste management provider (municipal or contracted service)",
    "phone": "Actual customer service phone",
    "description": "Collection schedule and service details",
    "website": "actual website URL",
    "hours": "Customer service hours"
  }
}

Be specific to the exact service territories. If uncertain about a provider, indicate "Contact city hall for verification" in the description.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
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

  const httpServer = createServer(app);
  return httpServer;
}
