#!/bin/bash

echo "Starting Ezrelo server..."

# Kill any existing processes on port 5000
pkill -f "simple-start.js" 2>/dev/null
pkill -f "tsx server" 2>/dev/null

# Start the simple server in background
nohup node simple-start.js > server.log 2>&1 &
SERVER_PID=$!

echo "Server started with PID: $SERVER_PID"
echo "Waiting for server to initialize..."

sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server is running on port 5000"
    echo "📋 PID: $SERVER_PID"
    tail -5 server.log
else
    echo "❌ Server failed to start"
    cat server.log
fi