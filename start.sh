#!/bin/bash

echo "🚀 Starting Feedback Platform..."

# Check if MongoDB is running
if ! pgrep -f mongod > /dev/null; then
    echo "📦 Starting MongoDB..."
    if command -v mongod &> /dev/null; then
        mongod --dbpath /opt/homebrew/var/mongodb --fork --logpath /opt/homebrew/var/log/mongodb/mongo.log
    elif command -v brew &> /dev/null; then
        brew services start mongodb-community
    else
        echo "❌ MongoDB not found. Please install MongoDB or use Docker:"
        echo "   brew install mongodb-community"
        echo "   or"
        echo "   docker run -d -p 27017:27017 --name mongodb mongo:latest"
        exit 1
    fi
    sleep 3
fi

echo "✅ MongoDB is running"

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm install > /dev/null 2>&1
npm run dev &
BACKEND_PID=$!

sleep 5

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend
npm install > /dev/null 2>&1
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 Feedback Platform is starting up!"
echo ""
echo "📋 Services:"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo "   MongoDB:  mongodb://localhost:27017"
echo ""
echo "👉 Open http://localhost:3000 in your browser"
echo ""
echo "To stop all services, press Ctrl+C"

# Wait for user to stop
trap 'echo ""; echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

wait
