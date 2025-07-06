#!/bin/bash

# StocksShorts Backup Startup Script
# This script helps you quickly restore and run the backed up application

echo "🔄 Starting StocksShorts Backup Restoration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL environment variable is not set"
    echo "   Please set your PostgreSQL connection string"
fi

if [ -z "$GOOGLE_CLIENT_EMAIL" ]; then
    echo "⚠️  GOOGLE_CLIENT_EMAIL environment variable is not set"
    echo "   Please set your Google service account email"
fi

if [ -z "$GOOGLE_PRIVATE_KEY" ]; then
    echo "⚠️  GOOGLE_PRIVATE_KEY environment variable is not set"
    echo "   Please set your Google service account private key"
fi

if [ -z "$GOOGLE_SHEETS_ID" ]; then
    echo "⚠️  GOOGLE_SHEETS_ID environment variable is not set"
    echo "   Please set your Google Sheets spreadsheet ID"
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY environment variable is not set"
    echo "   Please set your OpenAI API key"
fi

# Push database schema
echo "🗄️  Setting up database schema..."
npm run db:push

# Start the application
echo "🚀 Starting StocksShorts application..."
echo "   - Frontend: http://localhost:5000"
echo "   - API: http://localhost:5000/api"
echo ""
echo "Press Ctrl+C to stop the application"

npm run dev