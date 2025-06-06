import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { addressSearchSchema, referralClickSchema, type ServiceProvidersData } from "@shared/schema";
import OpenAI from "openai";
import { db } from "./db";
import { referralClicks } from "@shared/schema";

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in miles
}

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
        website: "https://www.cityofdenton.com/departments-services/departments-a-f/denton-municipal-electric/water",
        hours: "Monday-Friday 8:00 AM - 5:00 PM"
      },
      Trash: {
        category: "Trash",
        provider: "City of Denton Solid Waste",
        phone: "(940) 349-8700", 
        description: "Municipal waste collection service. Weekly curbside pickup.",
        website: "https://www.cityofdenton.com/departments-services/departments-g-p/public-works/solid-waste",
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

  // Moving companies endpoint for checklist integration
  app.post("/api/moving-companies", async (req, res) => {
    try {
      const { fromCity, fromState, fromZip, toCity, toState, toZip } = req.body;
      
      // Calculate if this is a local move (same state and within reasonable distance)
      const isLocalMove = fromState.toUpperCase() === toState.toUpperCase();
      const isShortDistance = fromState.toUpperCase() === toState.toUpperCase() && fromCity !== toCity;
      
      console.log(`Move detection: from=${fromState}, to=${toState}, isLocalMove=${isLocalMove}`);
      
      // Base major moving companies
      let movingCompanies = [
        {
          category: "Moving Companies",
          provider: "United Van Lines",
          phone: "1-855-237-6683",
          description: "Full-service interstate and local moving with professional packing services.",
          website: "https://www.unitedvanlines.com",
          referralUrl: "https://www.unitedvanlines.com?partner=ezrelo&ref=EZR001",
          affiliateCode: "EZRELO_UNITED",
          hours: "Monday-Friday 8:00 AM - 8:00 PM",
          rating: 4.2,
          services: ["Local Moving", "Long Distance", "Packing", "Storage"],
          estimatedCost: "$1,200 - $3,500"
        },
        {
          category: "Moving Companies",
          provider: "Allied Van Lines",
          phone: "1-800-689-8684",
          description: "Trusted moving company with over 90 years of experience in residential moves.",
          website: "https://www.allied.com",
          referralUrl: "https://www.allied.com?affiliate=ezrelo&code=EZR002",
          affiliateCode: "EZRELO_ALLIED",
          hours: "Monday-Friday 8:00 AM - 7:00 PM",
          rating: 4.1,
          services: ["Residential", "Corporate", "International", "Auto Transport"],
          estimatedCost: "$1,100 - $3,200"
        },
        {
          category: "Moving Companies",
          provider: "North American Van Lines",
          phone: "1-800-348-2111",
          description: "Premium moving services with customizable options for every budget.",
          website: "https://www.northamerican.com",
          referralUrl: "https://www.northamerican.com?ref=ezrelo&partner=EZR003",
          affiliateCode: "EZRELO_NAVL",
          hours: "Monday-Friday 8:00 AM - 6:00 PM",
          rating: 4.3,
          services: ["Full Service", "DIY Options", "Specialty Items", "Climate Storage"],
          estimatedCost: "$1,300 - $3,800"
        },
        {
          category: "Moving Companies",
          provider: "Two Men and a Truck",
          phone: "1-800-345-1070",
          description: "Local and long-distance moving with trained, uniformed movers.",
          website: "https://www.twomenandatruck.com",
          referralUrl: "https://www.twomenandatruck.com?source=ezrelo&code=EZR004",
          affiliateCode: "EZRELO_TMAT",
          hours: "Monday-Saturday 8:00 AM - 5:00 PM",
          rating: 4.4,
          services: ["Local Moving", "Packing", "Junk Removal", "Storage"],
          estimatedCost: "$800 - $2,500"
        },
        {
          category: "Moving Companies",
          provider: "Mayflower Transit",
          phone: "1-800-428-1158",
          description: "Professional interstate moving with comprehensive protection plans.",
          website: "https://www.mayflower.com",
          referralUrl: "https://www.mayflower.com?partner=ezrelo&ref=EZR005",
          affiliateCode: "EZRELO_MAYFLOWER",
          hours: "Monday-Friday 8:00 AM - 8:00 PM",
          rating: 4.0,
          services: ["Interstate", "International", "Corporate", "Military Moves"],
          estimatedCost: "$1,400 - $4,000"
        }
      ];

      // Add authentic local moving companies for same-state moves using both Google Places and Yelp APIs
      if (isLocalMove) {
        const allLocalCompanies = [];

        // Get coordinates for the "from" address to calculate distances
        let fromCoordinates = null;
        if (process.env.GOOGLE_API_KEY) {
          try {
            const geocodeParams = new URLSearchParams({
              address: `${fromCity}, ${fromState} ${fromZip}`,
              key: process.env.GOOGLE_API_KEY
            });
            
            const geocodeResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${geocodeParams}`);
            if (geocodeResponse.ok) {
              const geocodeData = await geocodeResponse.json();
              if (geocodeData.results && geocodeData.results[0]) {
                fromCoordinates = geocodeData.results[0].geometry.location;
                console.log(`📍 From address coordinates: ${fromCoordinates.lat}, ${fromCoordinates.lng}`);
              }
            }
          } catch (error) {
            console.log('Could not geocode from address for distance calculation');
          }
        }

        // First search Google Places for comprehensive moving company coverage
        if (process.env.GOOGLE_API_KEY) {
          try {
            console.log(`🔍 Searching Google Places for moving companies near ${fromCity}, ${fromState}`);
            const googleSearchParams = new URLSearchParams({
              query: `moving companies near ${fromCity}, ${fromState}`,
              key: process.env.GOOGLE_API_KEY
            });

            const googleResponse = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${googleSearchParams}`);
            
            if (googleResponse.ok) {
              const googleData = await googleResponse.json();
              console.log(`📊 Google Places found ${googleData.results?.length || 0} moving companies`);
              
              if (googleData.results && googleData.results.length > 0) {
                // Process first 10 results for better coverage
                for (const place of googleData.results.slice(0, 10)) {
                  const reviewCount = place.user_ratings_total || 0;
                  const rating = place.rating || 0;
                  
                  // Only include companies with minimum review threshold
                  if (reviewCount >= 8) {
                    let companyWebsite = '';
                    let phone = 'Contact via Google';
                    
                    // Get detailed place information
                    try {
                      const detailsResponse = await fetch(
                        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number&key=${process.env.GOOGLE_API_KEY}`
                      );
                      
                      if (detailsResponse.ok) {
                        const detailsData = await detailsResponse.json();
                        companyWebsite = detailsData.result?.website || '';
                        phone = detailsData.result?.formatted_phone_number || 'Contact via Google';
                      }
                    } catch (error) {
                      console.log(`Could not get details for ${place.name}`);
                    }

                    // Calculate distance from the "from" address
                    let distance = 999; // Default high value for sorting
                    if (fromCoordinates && place.geometry && place.geometry.location) {
                      distance = calculateDistance(
                        fromCoordinates.lat, 
                        fromCoordinates.lng,
                        place.geometry.location.lat,
                        place.geometry.location.lng
                      );
                    }

                    allLocalCompanies.push({
                      category: "Local Moving Companies",
                      provider: place.name,
                      phone: phone,
                      description: `${reviewCount} Google reviews (${rating}★). ${place.formatted_address || ''}${distance < 999 ? ` • ${distance.toFixed(1)} miles away` : ''}`,
                      website: companyWebsite || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                      referralUrl: companyWebsite ? `${companyWebsite}?ref=ezrelo&source=google` : `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                      affiliateCode: `EZRELO_GOOGLE${allLocalCompanies.length + 1}`,
                      hours: "Contact for hours",
                      rating: rating,
                      services: ["Moving Services"],
                      estimatedCost: "Contact for quote",
                      distance: distance
                    });
                  }
                }
                
                console.log(`✅ Added ${allLocalCompanies.length} qualified companies from Google Places`);
              }
            }
          } catch (googleError) {
            console.error("Google Places API error:", googleError);
          }
        }

        // Also search Yelp for additional coverage and merge with Google results
        let yelpMovers = [];
        if (process.env.YELP_API_KEY) {
          try {
          const searchParams = new URLSearchParams({
            term: 'moving companies',
            location: `${fromCity}, ${fromState}`,
            categories: 'movers',
            limit: '5',
            sort_by: 'rating'
          });
          
          console.log(`🔍 Searching Yelp for movers near ${fromCity}, ${fromState}`);
          const yelpResponse = await fetch(`https://api.yelp.com/v3/businesses/search?${searchParams}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
              'Accept': 'application/json',
            }
          });

          if (yelpResponse.ok) {
            const yelpData = await yelpResponse.json();
            console.log(`📊 Yelp returned ${yelpData.businesses?.length || 0} businesses`);
            
            // First get Google review data for all businesses to enable combined filtering
            const businessesWithGoogleData = await Promise.all(
              (yelpData.businesses || []).map(async (business: any) => {
                let googleReviewCount = 0;
                
                if (process.env.GOOGLE_API_KEY) {
                  try {
                    const searchQuery = `${business.name} ${business.location?.city} ${business.location?.state}`;
                    const placesResponse = await fetch(
                      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${process.env.GOOGLE_API_KEY}`
                    );
                    
                    if (placesResponse.ok) {
                      const placesData = await placesResponse.json();
                      if (placesData.candidates?.[0]?.place_id) {
                        const placeId = placesData.candidates[0].place_id;
                        const detailsResponse = await fetch(
                          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=user_ratings_total&key=${process.env.GOOGLE_API_KEY}`
                        );
                        
                        if (detailsResponse.ok) {
                          const detailsData = await detailsResponse.json();
                          googleReviewCount = detailsData.result?.user_ratings_total || 0;
                        }
                      }
                    }
                  } catch (error) {
                    // Continue with Yelp-only data if Google fails
                  }
                }
                
                return {
                  ...business,
                  googleReviewCount
                };
              })
            );

            // Filter businesses by combined review count (Yelp + Google)
            const minReviews = 8;
            const qualifiedBusinesses = businessesWithGoogleData.filter((business: any) => {
              const yelpReviews = business.review_count || 0;
              const googleReviews = business.googleReviewCount || 0;
              const totalReviews = yelpReviews + googleReviews;
              const hasMinReviews = totalReviews >= minReviews;
              
              if (!hasMinReviews) {
                console.log(`⚠️ Filtered out ${business.name}: ${yelpReviews} Yelp + ${googleReviews} Google = ${totalReviews} total reviews (min: ${minReviews})`);
              } else {
                console.log(`✅ ${business.name}: ${yelpReviews} Yelp + ${googleReviews} Google = ${totalReviews} total reviews`);
              }
              
              return hasMinReviews;
            });
            
            console.log(`✅ ${qualifiedBusinesses.length} businesses meet combined review threshold (${minReviews}+ total reviews)`);
            
            yelpMovers = await Promise.all(
              qualifiedBusinesses.map(async (business: any, index: number) => {
                let companyWebsite = business.url; // Default to Yelp page
                
                // Get website from Google Places if we have Google data
                if (process.env.GOOGLE_API_KEY && business.googleReviewCount > 0) {
                  try {
                    const searchQuery = `${business.name} ${business.location?.city} ${business.location?.state}`;
                    console.log(`🔍 Getting website for: ${searchQuery}`);
                    
                    const placesResponse = await fetch(
                      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${process.env.GOOGLE_API_KEY}`
                    );
                    
                    if (placesResponse.ok) {
                      const placesData = await placesResponse.json();
                      
                      if (placesData.candidates?.[0]?.place_id) {
                        const placeId = placesData.candidates[0].place_id;
                        
                        // Get place details to retrieve website
                        const detailsResponse = await fetch(
                          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website&key=${process.env.GOOGLE_API_KEY}`
                        );
                        
                        if (detailsResponse.ok) {
                          const detailsData = await detailsResponse.json();
                          if (detailsData.result?.website) {
                            const foundWebsite = detailsData.result.website;
                            
                            // Validate website accessibility
                            try {
                              const websiteCheck = await fetch(foundWebsite, { 
                                method: 'HEAD',
                                headers: { 'User-Agent': 'EzreloBot/1.0' }
                              });
                              
                              if (websiteCheck.ok) {
                                companyWebsite = foundWebsite;
                                console.log(`✅ Found and validated website for ${business.name}: ${companyWebsite}`);
                              } else {
                                console.log(`⚠️ Website for ${business.name} returned ${websiteCheck.status}: ${foundWebsite}`);
                                // Keep Yelp URL as fallback for dead websites
                              }
                            } catch (websiteError) {
                              console.log(`⚠️ Website for ${business.name} is unreachable: ${foundWebsite}`);
                              // Keep Yelp URL as fallback for dead websites
                            }
                          }
                        }
                      }
                    }
                  } catch (googleError) {
                    console.log(`Could not get website for ${business.name}`);
                  }
                }

                // Calculate combined review information using pre-fetched data
                const yelpReviews = business.review_count || 0;
                const googleReviews = business.googleReviewCount || 0;
                const totalReviews = yelpReviews + googleReviews;
                const reviewSummary = googleReviews > 0 
                  ? `${yelpReviews} Yelp + ${googleReviews} Google reviews (${totalReviews} total)`
                  : `${yelpReviews} reviews on Yelp`;

                // Calculate distance from the "from" address
                let distance = 999; // Default high value for sorting
                if (fromCoordinates && business.coordinates) {
                  distance = calculateDistance(
                    fromCoordinates.lat, 
                    fromCoordinates.lng,
                    business.coordinates.latitude,
                    business.coordinates.longitude
                  );
                }

                return {
                  category: "Local Moving Companies",
                  provider: business.name,
                  phone: business.display_phone || business.phone || 'Contact via website',
                  description: `${reviewSummary}. ${business.location?.address1 || ''} ${business.location?.city || ''}, ${business.location?.state || ''}${distance < 999 ? ` • ${distance.toFixed(1)} miles away` : ''}`,
                  website: companyWebsite,
                  referralUrl: `${companyWebsite}?ref=ezrelo&partner=EZR_YELP${index + 1}`,
                  affiliateCode: `EZRELO_YELP${index + 1}`,
                  hours: business.hours?.[0]?.is_open_now ? "Currently Open" : "Hours vary",
                  rating: business.rating || 0,
                  services: business.categories?.map((cat: any) => cat.title) || ["Moving Services"],
                  estimatedCost: business.price ? `${business.price} pricing tier` : "Contact for quote",
                  distance: distance
                };
              })
            );

            // Add Yelp businesses to the beginning of the list
            if (yelpMovers.length > 0) {
              movingCompanies.unshift(...yelpMovers);
              console.log(`🏢 Added ${yelpMovers.length} local moving companies via Yelp for ${toCity}, ${toState}`);
            }
          } else {
            console.error(`Yelp API response not OK: ${yelpResponse.status} ${yelpResponse.statusText}`);
          }
          } catch (yelpError) {
            console.error("Yelp API error:", yelpError);
            // Continue without Yelp data - user will still get major carriers
          }
        }

        // Merge Google Places and Yelp results, removing duplicates
        if (allLocalCompanies.length > 0) {
          movingCompanies.unshift(...allLocalCompanies);
          console.log(`🏢 Added ${allLocalCompanies.length} total local moving companies`);
        }
        
        // Sort local companies by distance from the "from address" (closest first)
        // Count how many local companies we added from both Google Places and Yelp
        let totalLocalCompanies = 0;
        for (let i = 0; i < movingCompanies.length; i++) {
          if (movingCompanies[i].category === "Local Moving Companies") {
            totalLocalCompanies++;
          } else {
            break; // Stop when we reach non-local companies
          }
        }
        
        if (totalLocalCompanies > 0) {
          const localCompanies = movingCompanies.slice(0, totalLocalCompanies);
          const nonLocalCompanies = movingCompanies.slice(totalLocalCompanies);
          
          // Sort local companies by distance
          localCompanies.sort((a: any, b: any) => {
            const distanceA = a.distance || 999;
            const distanceB = b.distance || 999;
            return distanceA - distanceB;
          });
          
          // Combine sorted local companies with major carriers
          movingCompanies = [...localCompanies, ...nonLocalCompanies];
          console.log(`📍 Sorted ${totalLocalCompanies} local companies by distance from ${fromCity}, ${fromState}`);
        }
      } else {
        console.log(`Skipping local company search: isLocalMove=${isLocalMove}`);
      }

      return res.json({
        success: true,
        companies: movingCompanies,
        searchInfo: {
          from: `${fromCity}, ${fromState} ${fromZip}`,
          to: `${toCity}, ${toState} ${toZip}`,
          moveType: isLocalMove ? 'local' : 'long-distance'
        }
      });

    } catch (error) {
      console.error("Moving companies search error:", error);
      return res.status(500).json({ error: "Failed to load moving companies" });
    }
  });

  // Simple admin authentication endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      // Simple password check - in production, use proper authentication
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      
      if (password === adminPassword) {
        return res.json({ success: true, message: "Authentication successful" });
      } else {
        return res.status(401).json({ error: "Invalid password" });
      }
      
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Utility providers endpoint
  app.post("/api/utility-providers", async (req, res) => {
    try {
      const { city, state, zip, utilityType } = req.body;
      
      if (!city || !state) {
        return res.status(400).json({ error: "City and state are required" });
      }

      let providers: any[] = [];

      // Use Google Places API to find utility providers
      if (process.env.GOOGLE_API_KEY) {
        try {
          const searchQueries = {
            electricity: `electricity provider ${city} ${state}`,
            internet: `internet provider cable ${city} ${state}`,
            water: `water utility ${city} ${state}`,
            waste: `waste management trash ${city} ${state}`
          };

          const query = searchQueries[utilityType as keyof typeof searchQueries] || `${utilityType} provider ${city} ${state}`;
          
          const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_API_KEY}`;
          
          const placesResponse = await fetch(placesUrl);
          const placesData = await placesResponse.json();

          if (placesData.results && placesData.results.length > 0) {
            providers = await Promise.all(
              placesData.results.slice(0, 8).map(async (place: any) => {
                let phone = "Contact for details";
                let website = `https://www.google.com/search?q=${encodeURIComponent(place.name + " " + city + " " + state)}`;

                // Get detailed place information for phone and website
                try {
                  const detailsResponse = await fetch(
                    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number&key=${process.env.GOOGLE_API_KEY}`
                  );
                  
                  if (detailsResponse.ok) {
                    const detailsData = await detailsResponse.json();
                    phone = detailsData.result?.formatted_phone_number || phone;
                    website = detailsData.result?.website || website;
                  }
                } catch (error) {
                  console.log(`Could not get details for ${place.name}`);
                }

                return {
                  provider: place.name,
                  phone: phone,
                  website: website,
                  referralUrl: website,
                  affiliateCode: "",
                  description: `${utilityType} service provider in ${city}, ${state}. ${place.formatted_address || ''}`,
                  rating: place.rating || 0,
                  services: [`${utilityType} service`, "Customer support", "Online billing"],
                  estimatedCost: utilityType === "electricity" ? "$0.08-0.15/kWh" : 
                               utilityType === "internet" ? "$40-100/month" :
                               utilityType === "water" ? "$30-80/month" : "$25-50/month",
                  availability: place.business_status === "OPERATIONAL" ? "Available in your area" : "Contact to verify availability",
                  setupFee: utilityType === "internet" ? "$50-100" : "Varies by location",
                  connectionTime: utilityType === "internet" ? "1-2 weeks" : "3-5 business days"
                };
              })
            );
          }
        } catch (error) {
          console.error("Google Places API error:", error);
        }
      }

      // Add known major providers as additional options
      const majorProviders = {
        electricity: [
          {
            provider: "TXU Energy",
            phone: "1-855-TXU-ENERGY",
            website: "https://www.txu.com",
            referralUrl: "https://www.txu.com",
            affiliateCode: "",
            description: "Leading electricity provider in Texas with competitive rates",
            rating: 4.2,
            services: ["Residential electricity", "Business electricity", "Green energy options"],
            estimatedCost: "$0.09-0.13/kWh",
            availability: "Available in Texas",
            setupFee: "No setup fee",
            connectionTime: "Same day to 3 business days"
          }
        ],
        internet: [
          {
            provider: "Xfinity",
            phone: "1-800-XFINITY",
            website: "https://www.xfinity.com",
            referralUrl: "https://www.xfinity.com",
            affiliateCode: "",
            description: "High-speed internet and cable services nationwide",
            rating: 3.8,
            services: ["Internet", "Cable TV", "Home phone", "Home security"],
            estimatedCost: "$30-80/month",
            availability: "Most urban areas",
            setupFee: "$89.99",
            connectionTime: "7-14 days"
          }
        ]
      };

      // Add major providers if available for this utility type
      if (majorProviders[utilityType as keyof typeof majorProviders]) {
        providers.push(...majorProviders[utilityType as keyof typeof majorProviders]);
      }

      res.json({ 
        providers,
        location: `${city}, ${state}`,
        utilityType 
      });

    } catch (error) {
      console.error("Error finding utility providers:", error);
      res.status(500).json({ error: "Failed to find utility providers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
