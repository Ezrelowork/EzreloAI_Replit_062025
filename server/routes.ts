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

      // Use OpenAI to find service providers
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that finds local utility and service providers. Respond only with valid JSON in the exact format requested."
          },
          {
            role: "user",
            content: `Find the actual utility and service providers for ZIP code ${zip} in ${city}, ${state}. 

Respond ONLY with valid JSON in this exact format (no markdown, no explanation, no additional text):

{
  "Electricity": {
    "provider": "Actual Provider Name",
    "phone": "Actual Phone Number",
    "description": "Brief description of service",
    "website": "www.provider.com",
    "hours": "Service hours"
  },
  "Gas": {
    "provider": "Actual Provider Name", 
    "phone": "Actual Phone Number",
    "description": "Brief description of service",
    "website": "www.provider.com",
    "hours": "Service hours"
  },
  "Water": {
    "provider": "Actual Provider Name",
    "phone": "Actual Phone Number", 
    "description": "Brief description of service",
    "website": "www.provider.com",
    "hours": "Service hours"
  },
  "Internet": {
    "provider": "Actual Provider Name",
    "phone": "Actual Phone Number",
    "description": "Brief description of service", 
    "website": "www.provider.com",
    "hours": "Service hours"
  },
  "Trash": {
    "provider": "Actual Provider Name",
    "phone": "Actual Phone Number",
    "description": "Brief description of service",
    "website": "www.provider.com", 
    "hours": "Service hours"
  }
}

Use real, actual service providers that serve this specific location. Include real phone numbers and websites where possible.`
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
