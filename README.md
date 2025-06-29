# Activity Tracker - Flask Edition

A beautiful, modern activity tracker web application that automatically saves your daily activities to JSON files and commits them to Git.

## 🚀 Features

- **Daily Activity Tracking**: Track various activities with quantities
- **Auto-Save to Git**: Automatically saves data to JSON files and commits to Git
- **Beautiful UI**: Modern, responsive design with animations
- **Data Persistence**: Both local storage and file-based storage
- **Git Integration**: Automatic commits and push functionality
- **Data History**: View and load previous days' data

## 📋 Categories

1. **🆔 Identities** - Engineering, Algorithm, Teknokian, Runner
2. **❤️ Health** - Water, Eggs, Supplements, Sleep, etc.
3. **🎮 Recreations** - Sleep, Podcast, Finance

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.7+
- Git repository initialized
- Flask (auto-installed)

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd /Users/prakharsrivastava/sandbox/svc/tracker
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the Flask server:**
   ```bash
   python app.py
   ```
   
   Or use the startup script:
   ```bash
   ./start.sh
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5000`

## 📁 Data Storage

- **Local Files**: Data saved to `data/YYYY-MM-DD.json`
- **Git Integration**: Files automatically committed to Git
- **Backup**: Also saved to browser localStorage

## 🔧 API Endpoints

- `GET /` - Main application page
- `POST /api/save-data` - Save activity data
- `GET /api/get-data/<date>` - Get data for specific date
- `GET /api/list-data` - List all saved data files
- `GET /api/git-status` - Get current Git status
- `POST /api/push-to-github` - Push changes to GitHub

## 💻 Usage

1. **Select Activities**: Check boxes for completed activities
2. **Set Quantities**: Enter amounts for quantifiable activities
3. **Save**: Click "Save Activities" to store and commit data
4. **View History**: Click "View History" to see previous days
5. **Push to GitHub**: Use the Git status panel to push changes

## 🌐 GitHub Deployment

The Flask app runs locally, but you can still deploy the static version to GitHub Pages:

1. **Copy static files to root** (for GitHub Pages):
   ```bash
   cp templates/index.html .
   cp static/* .
   ```

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

## 🔄 Development

### File Structure
```
tracker/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── start.sh           # Startup script
├── data/              # JSON data files
├── templates/         # HTML templates
│   └── index.html
├── static/            # CSS/JS files
│   ├── style.css
│   └── script.js
└── venv/              # Virtual environment
```

### Adding New Activities

1. **Update HTML** (templates/index.html):
   ```html
   <div class="activity-item">
       <label class="activity-label">
           <input type="checkbox" name="activity" value="new_activity" data-has-quantity="true">
           <span class="checkmark"></span>
           New Activity
       </label>
       <div class="quantity-control hidden">
           <label>Amount:</label>
           <input type="number" name="new_activity_quantity" min="1" value="1">
       </div>
   </div>
   ```

2. **Update JavaScript** (static/script.js):
   ```javascript
   // Add to getActivityDisplayName()
   'new_activity': 'New Activity',
   
   // Add to getActivityUnit()
   'new_activity': 'units',
   ```

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Git Errors
```bash
# Initialize git if needed
git init
git add .
git commit -m "Initial commit"
```

### Port Already in Use
- Change port in `app.py`: `app.run(port=5001)`
- Or kill existing process: `lsof -ti:5000 | xargs kill`

## 📊 Data Format

Each day's data is saved as JSON:
```json
{
  "activities": ["engineering", "water", "sleep"],
  "quantities": {
    "engineering": 5,
    "water": 2.5,
    "sleep": 8
  },
  "date": "2025-06-30",
  "timestamp": "2025-06-30T10:30:00.000Z"
}
```

## 🎉 Enjoy tracking your daily activities!

Your data is automatically saved and version-controlled with Git. Perfect for building habits and tracking progress over time.
