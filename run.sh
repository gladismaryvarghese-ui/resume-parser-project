#!/bin/bash
# Start both frontend and backend

echo "Starting Resume Parser..."
echo ""

# Backend
echo "Starting Backend on http://127.0.0.1:5000..."
cd backend
python -m pip install -r requirements.txt > /dev/null 2>&1
python -m spacy download en_core_web_sm > /dev/null 2>&1
python backend.py &
BACKEND_PID=$!

cd ..

# Frontend
echo "Starting Frontend on http://localhost:3000..."
cd frontend
npm install > /dev/null 2>&1
BACKEND_URL=http://127.0.0.1:5000 npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ Ready!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://127.0.0.1:5000"
echo ""
echo "Press Ctrl+C to stop both services..."
wait
