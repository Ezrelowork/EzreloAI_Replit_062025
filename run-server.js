const { spawn } = require('child_process');
const path = require('path');

process.env.NODE_ENV = 'development';

const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  if (code !== 0) {
    console.log('Restarting server...');
    setTimeout(() => {
      const newServer = spawn('tsx', ['server/index.ts'], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: process.env
      });
    }, 1000);
  }
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill();
  process.exit(0);
});