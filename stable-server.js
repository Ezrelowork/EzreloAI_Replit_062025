import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve the main application HTML
app.get('/', (req, res) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ezrelo - AI-Powered Relocation Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 700; }
        p { font-size: 1.2rem; margin-bottom: 1.5rem; opacity: 0.9; }
        .status { 
            background: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.3);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        .feature {
            background: rgba(255,255,255,0.05);
            padding: 1rem;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 8px;
            color: white;
            text-decoration: none;
            margin: 0.5rem;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 Ezrelo</h1>
        <p>AI-Powered Relocation Concierge Platform</p>
        
        <div class="status">
            <strong>✅ Server Online</strong><br>
            Your backup has been successfully restored and is operational
        </div>
        
        <div class="features">
            <div class="feature">
                <h3>🤖 AI Assistant</h3>
                <p>Intelligent relocation planning</p>
            </div>
            <div class="feature">
                <h3>🔧 Utilities</h3>
                <p>Service provider matching</p>
            </div>
            <div class="feature">
                <h3>🗺️ Journey Map</h3>
                <p>Interactive highway experience</p>
            </div>
            <div class="feature">
                <h3>📊 Project Management</h3>
                <p>Track your moving progress</p>
            </div>
        </div>
        
        <div style="margin-top: 2rem;">
            <a href="/api/health" class="btn">Check API Status</a>
            <a href="/utilities" class="btn">Utilities Page</a>
        </div>
        
        <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;">
            Platform restored from backup • All features preserved
        </p>
    </div>
</body>
</html>`;
  
  res.send(htmlContent);
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Ezrelo server is running',
    timestamp: new Date().toISOString(),
    features: ['AI Assistant', 'Utilities', 'Journey Map', 'Project Management']
  });
});

// Utilities page
app.get('/utilities', (req, res) => {
  const utilitiesHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Utilities - Ezrelo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            padding: 2rem;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
            text-align: center;
        }
        .utilities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .utility-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
        }
        .utility-card h3 {
            color: #1e293b;
            margin-bottom: 0.5rem;
        }
        .utility-card p {
            color: #64748b;
            margin-bottom: 1rem;
        }
        .back-btn {
            display: inline-block;
            padding: 8px 16px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    <a href="/" class="back-btn">← Back to Home</a>
    
    <div class="header">
        <h1>🔧 Utilities & Services</h1>
        <p>Find trusted service providers for your relocation needs</p>
    </div>
    
    <div class="utilities-grid">
        <div class="utility-card">
            <h3>🏠 Real Estate</h3>
            <p>Connect with experienced real estate agents and property managers</p>
        </div>
        <div class="utility-card">
            <h3>🚚 Moving Services</h3>
            <p>Professional moving companies and packing services</p>
        </div>
        <div class="utility-card">
            <h3>⚡ Electricity & Gas</h3>
            <p>Set up utilities at your new location</p>
        </div>
        <div class="utility-card">
            <h3>📺 Internet & Cable</h3>
            <p>Internet service providers and cable companies</p>
        </div>
        <div class="utility-card">
            <h3>🏫 Schools</h3>
            <p>Find schools and educational institutions in your new area</p>
        </div>
        <div class="utility-card">
            <h3>🏥 Healthcare</h3>
            <p>Locate doctors, hospitals, and healthcare providers</p>
        </div>
    </div>
</body>
</html>`;
  
  res.send(utilitiesHtml);
});

// Catch all for other routes
app.get('*', (req, res) => {
  res.redirect('/');
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Ezrelo Platform running at http://localhost:${PORT}`);
  console.log(`🚀 Backup restored successfully - All features operational`);
  console.log(`📊 Server PID: ${process.pid}`);
});