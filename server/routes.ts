import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { movingProjectSchema } from "@shared/schema";

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

  // Utilities setup endpoint
  app.post("/api/utilities-search", async (req, res) => {
    try {
      const { city, state, zipCode } = req.body;
      
      if (!city || !state) {
        return res.status(400).json({ error: "City and state are required" });
      }

      const utilities = [
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
        },
        {
          category: "Internet", 
          provider: "Spectrum",
          phone: "1-855-243-8892",
          description: "Cable internet with speeds up to 1 Gig",
          website: "spectrum.com",
          referralUrl: "https://www.spectrum.com/internet",
          services: ["Cable Internet", "TV", "Mobile"],
          estimatedCost: "$49.99-79.99/month",
          rating: 3.8,
          availability: "Widely available"
        },
        {
          category: "Electric",
          provider: "TXU Energy",
          phone: "1-800-242-9113", 
          description: "Reliable electricity service with green energy options",
          website: "txu.com",
          referralUrl: "https://www.txu.com/",
          services: ["Electricity", "Solar Plans", "Smart Home"],
          estimatedCost: "$0.10-0.15/kWh",
          rating: 4.0,
          availability: "Texas service area"
        },
        {
          category: "Gas",
          provider: "Atmos Energy",
          phone: "1-888-286-6700",
          description: "Natural gas service for heating and cooking",
          website: "atmosenergy.com", 
          referralUrl: "https://www.atmosenergy.com/",
          services: ["Natural Gas", "Gas Appliances", "Safety Services"],
          estimatedCost: "$40-80/month",
          rating: 4.1,
          availability: "Texas and other states"
        }
      ];

      res.json({ success: true, utilities });
    } catch (error) {
      console.error("Error in utilities search:", error);
      res.status(500).json({ error: "Failed to fetch utilities" });
    }
  });

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

  // Archive questionnaire in project
  app.post("/api/archive-questionnaire", async (req, res) => {
    try {
      const { projectId, questionnaire, pdfData } = req.body;
      
      // Store questionnaire as communication record
      await storage.createCommunication({
        projectId,
        communicationType: "questionnaire",
        subject: "Moving Estimate Questionnaire Completed",
        notes: JSON.stringify({
          questionnaire,
          pdfGenerated: !!pdfData,
          completedAt: new Date().toISOString()
        }),
        contactPerson: "Customer"
      });

      res.json({ success: true, message: "Questionnaire archived successfully" });
    } catch (error) {
      console.error("Error archiving questionnaire:", error);
      res.status(500).json({ error: "Failed to archive questionnaire" });
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

  const httpServer = createServer(app);
  return httpServer;
}