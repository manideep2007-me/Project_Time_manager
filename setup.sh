#!/bin/bash

# Project Time Manager - Setup Script
# This script sets up the complete development environment

echo "🚀 Setting up Project Time Manager..."
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL v12 or higher."
    exit 1
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
fi

echo "✅ Prerequisites check passed!"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

# Create environment file for server
echo "⚙️  Setting up environment configuration..."
if [ ! -f server/.env ]; then
    cp server/env.example server/.env
    echo "📝 Created server/.env file. Please update with your database credentials."
else
    echo "📝 server/.env already exists."
fi

# Database setup instructions
echo ""
echo "🗄️  Database Setup Required:"
echo "============================="
echo "1. Create a PostgreSQL database:"
echo "   CREATE DATABASE project_time_manager;"
echo ""
echo "2. Run the schema script:"
echo "   psql -U your_username -d project_time_manager -f server/database/schema.sql"
echo ""
echo "3. Update server/.env with your database credentials"
echo ""

# Start instructions
echo "🚀 To start the application:"
echo "============================"
echo ""
echo "Backend (Terminal 1):"
echo "  cd server"
echo "  npm run dev"
echo ""
echo "Frontend (Terminal 2):"
echo "  cd client"
echo "  npm start"
echo ""
echo "📱 Default Login Credentials:"
echo "  Email: admin@company.com"
echo "  Password: admin123"
echo ""
echo "🌐 Backend will run on: http://localhost:5000"
echo "📱 Mobile app will be available via Expo"
echo ""
echo "✅ Setup complete! Follow the instructions above to start the application."






