#!/bin/bash

# Kill any existing processes
pkill -f "node.*minimal-server" 2>/dev/null || true
pkill -f "node.*server-runner" 2>/dev/null || true

# Start the server
echo "Starting Ezrelo platform..."
node minimal-server.cjs &

# Get the PID and wait a moment
SERVER_PID=$!
sleep 2

# Check if server is responding
if curl -s http://localhost:5000/api/status > /dev/null 2>&1; then
    echo "✅ Server is running and responding on port 5000"
    echo "PID: $SERVER_PID"
else
    echo "❌ Server may not be responding properly"
fi

# Keep the script running to maintain the process
wait $SERVER_PID