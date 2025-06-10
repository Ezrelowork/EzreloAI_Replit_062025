import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess = null;
let restartCount = 0;
const maxRestarts = 5;

function startServer() {
  if (restartCount >= maxRestarts) {
    console.log('Maximum restart attempts reached. Server may have a persistent issue.');
    return;
  }

  console.log(`Starting server (attempt ${restartCount + 1}/${maxRestarts})`);
  
  serverProcess = spawn('tsx', ['server/index.ts'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Server exited with code ${code} and signal ${signal}`);
    
    if (code !== 0 && signal !== 'SIGTERM') {
      restartCount++;
      console.log(`Restarting server in 2 seconds...`);
      setTimeout(startServer, 2000);
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Server error:', err);
    restartCount++;
    if (restartCount < maxRestarts) {
      setTimeout(startServer, 2000);
    }
  });
}

process.on('SIGINT', () => {
  console.log('Shutting down server manager...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

startServer();