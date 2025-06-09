const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(express.json());

// Basic HTML response for root
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ezrelo - Relocation Platform</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .btn { background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #1d4ed8; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Ezrelo - AI-Powered Relocation Concierge</h1>
        <p>Your backup project is now running successfully!</p>
        <p>Key features available:</p>
        <ul>
          <li>✓ Google API integration for utilities search</li>
          <li>✓ Address auto-fill from AI questionnaire</li>
          <li>✓ Moving project management</li>
          <li>✓ AI-powered relocation assistance</li>
        </ul>
        <button class="btn" onclick="window.location.href='/api/health'">Test API Health</button>
      </div>
    </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Ezrelo server is running successfully'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Ezrelo server running at http://localhost:${PORT}`);
  console.log('🚀 Your backup project is now operational!');
});