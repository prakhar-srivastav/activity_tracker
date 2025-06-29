from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import os
import subprocess
from datetime import datetime
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure data directory exists
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')

@app.route('/api/save-data', methods=['POST'])
def save_data():
    """Save activity data to JSON file and commit to git"""
    try:
        data = request.get_json()
        date = data.get('date')
        activity_data = data.get('data')
        
        if not date or not activity_data:
            return jsonify({'error': 'Missing date or data'}), 400
        
        # Save to JSON file with additive updates
        filename = f"{date}.json"
        filepath = os.path.join(DATA_DIR, filename)
        
        # Load existing data if file exists, otherwise start with empty structure
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                existing_data = json.load(f)
        else:
            existing_data = {
                'activities': [],
                'quantities': {},
                'date': date,
                'timestamp': datetime.now().isoformat()
            }
        
        # Merge activities (union of existing and new activities)
        new_activities = set(existing_data.get('activities', []))
        new_activities.update(activity_data.get('activities', []))
        
        # Merge quantities (add new quantities to existing ones)
        merged_quantities = existing_data.get('quantities', {}).copy()
        for key, value in activity_data.get('quantities', {}).items():
            if key in merged_quantities:
                merged_quantities[key] += value  # Add to existing quantity
            else:
                merged_quantities[key] = value   # Set new quantity
        
        # Create merged data structure
        merged_data = {
            'activities': sorted(list(new_activities)),  # Sort for consistency
            'quantities': merged_quantities,
            'date': date,
            'timestamp': datetime.now().isoformat()
        }
        
        # Save merged data
        with open(filepath, 'w') as f:
            json.dump(merged_data, f, indent=2)
        
        logger.info(f"Saved data to {filepath}")
        
        # Git operations
        try:
            # Add the file to git
            subprocess.run(['git', 'add', filepath], check=True, cwd='.')
            
            # Commit the file
            commit_message = f"Update activity data for {date}"
            subprocess.run(['git', 'commit', '-m', commit_message], check=True, cwd='.')
            
            logger.info(f"Committed {filepath} to git")
            
            # Push to remote repository
            try:
                push_result = subprocess.run(['git', 'push', 'origin', 'main'], 
                                           capture_output=True, text=True, check=True, cwd='.')
                logger.info(f"Pushed changes to GitHub: {push_result.stdout}")
                
                return jsonify({
                    'message': f'Data saved, committed, and pushed to GitHub successfully for {date}',
                    'filename': filename,
                    'committed': True,
                    'pushed': True,
                    'push_output': push_result.stdout
                })
                
            except subprocess.CalledProcessError as push_error:
                logger.warning(f"Git push failed: {push_error}")
                return jsonify({
                    'message': f'Data saved and committed for {date}, but push to GitHub failed',
                    'filename': filename,
                    'committed': True,
                    'pushed': False,
                    'push_error': str(push_error)
                })
            
        except subprocess.CalledProcessError as e:
            logger.warning(f"Git operation failed: {e}")
            return jsonify({
                'message': f'Data saved to {filename} but git commit failed',
                'filename': filename,
                'committed': False,
                'pushed': False
            })
    
    except Exception as e:
        logger.error(f"Error saving data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-data/<date>')
def get_data(date):
    """Get activity data for a specific date"""
    try:
        filename = f"{date}.json"
        filepath = os.path.join(DATA_DIR, filename)
        
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                data = json.load(f)
            return jsonify(data)
        else:
            return jsonify({'error': 'Data not found'}), 404
            
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/git-status')
def git_status():
    """Get current git status"""
    try:
        # Get git status
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              capture_output=True, text=True, check=True, cwd='.')
        
        # Get current branch
        branch_result = subprocess.run(['git', 'branch', '--show-current'], 
                                     capture_output=True, text=True, check=True, cwd='.')
        
        return jsonify({
            'status': result.stdout,
            'branch': branch_result.stdout.strip(),
            'has_changes': bool(result.stdout.strip())
        })
        
    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'Git command failed: {e}'}), 500

@app.route('/api/push-to-github', methods=['POST'])
def push_to_github():
    """Push commits to GitHub"""
    try:
        result = subprocess.run(['git', 'push', 'origin', 'main'], 
                              capture_output=True, text=True, check=True, cwd='.')
        
        return jsonify({
            'message': 'Successfully pushed to GitHub',
            'output': result.stdout
        })
        
    except subprocess.CalledProcessError as e:
        return jsonify({
            'error': f'Push failed: {e}',
            'output': e.stderr
        }), 500

# Serve static files
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    print("🚀 Starting Activity Tracker Flask Server...")
    print("📍 Server running at: http://localhost:5001")
    print("📁 Data will be saved to: ./data/")
    print("🔧 Git commits will be made automatically")
    print("🚀 Changes will be pushed to GitHub automatically")
    print("⚡ Press Ctrl+C to stop the server")
    
    app.run(debug=True, host='localhost', port=5001)
