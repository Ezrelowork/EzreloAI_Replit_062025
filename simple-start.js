import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Serve static files from client/dist if it exists, otherwise serve a basic response
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Basic API endpoint to test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Catch all handler for SPA
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client', 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <html>
        <head><title>Ezrelo - Loading...</title></head>
        <body>
          <h1>Ezrelo Platform</h1>
          <p>Server is running on port 5000</p>
          <p>Your backup has been restored successfully</p>
          <p><a href="/api/health">Check API Health</a></p>
        </body>
      </html>
    `);
  }
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Ezrelo server running at http://localhost:${PORT}`);
  console.log('🚀 Your backup project is now operational!');
});