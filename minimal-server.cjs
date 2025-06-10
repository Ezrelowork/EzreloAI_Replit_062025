const express = require('express');
const { createServer } = require('http');
const path = require('path');

const app = express();
const server = createServer(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Root route
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Ezrelo - Platform Restored</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; padding: 2rem; min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 3rem; border-radius: 20px;
            text-align: center; max-width: 500px;
            backdrop-filter: blur(10px);
        }
        h1 { margin: 0 0 1rem 0; font-size: 2.5rem; }
        p { margin: 0.5rem 0; font-size: 1.1rem; opacity: 0.9; }
        .status { 
            background: rgba(34, 197, 94, 0.3);
            padding: 1rem; border-radius: 10px;
            margin: 1.5rem 0; border: 1px solid rgba(34, 197, 94, 0.5);
        }
        a { 
            color: white; text-decoration: none;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px; border-radius: 6px;
            margin: 0.5rem; display: inline-block;
            border: 1px solid rgba(255,255,255,0.3);
        }
        a:hover { background: rgba(255,255,255,0.3); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 Ezrelo</h1>
        <p>AI-Powered Relocation Platform</p>
        
        <div class="status">
            <strong>✅ Server Online</strong><br>
            Backup restored successfully
        </div>
        
        <p>Platform is operational on port 5000</p>
        
        <div>
            <a href="/api/status">API Status</a>
            <a href="/utilities">Utilities</a>
        </div>
    </div>
</body>
</html>
  `);
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Ezrelo',
    message: 'Platform restored from backup',
    timestamp: new Date().toISOString(),
    pid: process.pid
  });
});

app.get('/utilities', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Utilities - Ezrelo</title>
    <style>
        body { font-family: system-ui; background: #f8fafc; margin: 0; padding: 2rem; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                 color: white; padding: 2rem; border-radius: 15px; margin-bottom: 2rem; text-align: center; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
               gap: 1rem; max-width: 800px; margin: 0 auto; }
        .card { background: white; padding: 1.5rem; border-radius: 10px; 
               box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .back { display: inline-block; background: #667eea; color: white; 
               padding: 8px 16px; text-decoration: none; border-radius: 6px; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <a href="/" class="back">← Back to Home</a>
    
    <div class="header">
        <h1>🔧 Utilities & Services</h1>
        <p>Service providers for your relocation</p>
    </div>
    
    <div class="grid">
        <div class="card">
            <h3>🏠 Real Estate</h3>
            <p>Agents and property managers</p>
        </div>
        <div class="card">
            <h3>🚚 Moving Services</h3>
            <p>Professional movers and packers</p>
        </div>
        <div class="card">
            <h3>⚡ Utilities</h3>
            <p>Electricity, gas, and water setup</p>
        </div>
        <div class="card">
            <h3>📺 Internet & Cable</h3>
            <p>ISPs and cable providers</p>
        </div>
    </div>
</body>
</html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = 5000;
server.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`✅ Ezrelo server running at http://localhost:${PORT}`);
  console.log(`🚀 Platform restored and operational`);
  console.log(`📊 Process ID: ${process.pid}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Keep process alive
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});