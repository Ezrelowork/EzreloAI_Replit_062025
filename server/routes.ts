import type { Express } from "express";
import { createServer, type Server } from "http";

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
          estimatedCost: "Contact for quote",
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
          estimatedCost: "Contact for quote",
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
          estimatedCost: "Contact for quote",
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
          estimatedCost: "Contact for quote", 
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

  // Other endpoints would continue here...

  const httpServer = createServer(app);
  return httpServer;
}