#!/bin/bash

echo "🚀 Starting Activity Tracker Flask Server..."

# Activate virtual environment
source venv/bin/activate

# Check if Flask is installed
if ! python -c "import flask" 2>/dev/null; then
    echo "Installing Flask..."
    pip install -r requirements.txt
fi

echo "📍 Server will run at: http://localhost:5001"
echo "📁 Data will be saved to: ./data/"
echo "🔧 Git commits will be made automatically"
echo "🚀 Changes will be pushed to GitHub automatically"
echo "⚡ Press Ctrl+C to stop the server"
echo ""

# Start Flask app
python app.py
