#!/bin/bash

echo "🎉 Activity Tracker - Flask Edition Setup Complete!"
echo "=================================================="
echo ""
echo "📍 Server Status:"
if pgrep -f "python app.py" > /dev/null; then
    echo "   ✅ Flask server is running"
    echo "   🌐 Access at: http://localhost:5000"
else
    echo "   ❌ Flask server is not running"
    echo "   🚀 Start with: ./start.sh"
fi
echo ""
echo "📁 Project Structure:"
echo "   ├── app.py              # Flask backend"
echo "   ├── templates/index.html # Web interface"
echo "   ├── static/script.js    # Frontend logic"
echo "   ├── static/style.css    # Styling"
echo "   ├── data/               # JSON data files"
echo "   ├── venv/               # Python virtual environment"
echo "   └── requirements.txt    # Dependencies"
echo ""
echo "🔧 Features Available:"
echo "   ✅ Beautiful web interface"
echo "   ✅ Activity tracking with quantities"
echo "   ✅ Auto-save to JSON files"
echo "   ✅ Automatic Git commits"
echo "   ✅ Data history viewing"
echo "   ✅ Push to GitHub functionality"
echo "   ✅ Local storage backup"
echo ""
echo "🚀 Quick Start:"
echo "   1. Open: http://localhost:5000"
echo "   2. Select your activities"
echo "   3. Set quantities where needed"
echo "   4. Click 'Save Activities'"
echo "   5. Data saved to ./data/ and committed to Git!"
echo ""
echo "📊 Data files will be saved as:"
echo "   └── data/YYYY-MM-DD.json"
echo ""

# Check if there are any data files
if [ -d "data" ] && [ "$(ls -A data/ 2>/dev/null | grep -v README.json | wc -l)" -gt 0 ]; then
    echo "📋 Existing Data Files:"
    ls -la data/*.json 2>/dev/null | grep -v README.json | while read -r line; do
        echo "   📄 $line"
    done
else
    echo "📋 No data files yet - start tracking to create your first file!"
fi

echo ""
echo "🎯 Ready to track your daily activities!"
