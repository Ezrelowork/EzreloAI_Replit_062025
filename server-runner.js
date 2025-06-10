#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess = null;
let restartCount = 0;
const maxRestarts = 5;

function startServer() {
  console.log(`Starting Ezrelo server (attempt ${restartCount + 1})`);
  
  serverProcess = spawn('node', ['minimal-server.cjs'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    detached: false
  });

  serverProcess.on('spawn', () => {
    console.log(`✅ Server spawned with PID: ${serverProcess.pid}`);
    
    // Write PID to file for monitoring
    fs.writeFileSync('server.pid', serverProcess.pid.toString());
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Server exited with code ${code}, signal ${signal}`);
    
    if (restartCount < maxRestarts && code !== 0) {
      restartCount++;
      console.log(`Restarting server in 2 seconds...`);
      setTimeout(startServer, 2000);
    } else {
      console.log('Server stopped permanently');
      process.exit(code || 0);
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping server...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping server...');
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
});

// Start the server
startServer();

// Keep the runner alive
setInterval(() => {
  if (serverProcess && !serverProcess.killed) {
    // Server is still running
  }
}, 30000);