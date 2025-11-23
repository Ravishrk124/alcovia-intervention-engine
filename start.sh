#!/bin/bash

# Alcovia Intervention Engine - Quick Setup Script

echo "🚀 Alcovia Intervention Engine - Setup"
echo "======================================"
echo ""

# Check if Supabase credentials are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "⚠️  Supabase credentials not found!"
    echo ""
    echo "Please follow these steps:"
    echo "1. Go to https://supabase.com and create a free account"
    echo "2. Create a new project"
    echo "3. Go to SQL Editor and run the contents of backend/schema.sql"
    echo "4. Go to Project Settings → API and copy:"
    echo "   - Project URL (SUPABASE_URL)"
    echo "   - anon public key (SUPABASE_KEY)"
    echo ""
    echo "Then create backend/.env with:"
    echo "SUPABASE_URL=your_url"
    echo "SUPABASE_KEY=your_key"
    echo "N8N_WEBHOOK_URL=will_add_later"
    echo "PORT=3001"
    echo "FRONTEND_URL=http://localhost:5173"
    echo ""
    exit 1
fi

echo "✅ Supabase credentials found"
echo ""

# Start backend
echo "📡 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

sleep 3

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers started!"
echo ""
echo "📌 Next steps:"
echo "1. Set up n8n (see n8n/SETUP.md)"
echo "2. Add N8N_WEBHOOK_URL to backend/.env"
echo "3. Restart backend: kill $BACKEND_PID && cd backend && npm run dev"
echo "4. Test the app at http://localhost:5173"
echo ""
echo "To stop servers:"
echo "kill $BACKEND_PID $FRONTEND_PID"
