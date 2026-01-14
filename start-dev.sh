#!/bin/bash

# Start the ReUSE Store development environment
# This script runs both the backend API server and the frontend dev server

echo "🚀 Starting ReUSE Store Development Environment..."
echo ""

# Check if database exists
if [ ! -f "database/reuse-store.db" ]; then
  echo "⚠️  Warning: Database not found at database/reuse-store.db"
  echo "   Please ensure the database file exists before starting."
  exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

echo "Starting services..."
echo "  - Backend API: http://localhost:3001"
echo "  - Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Start backend in background
npm run server &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "🛑 Stopping services..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT

# Wait for both processes
wait
