// Simple Node.js server to handle file operations
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Save activity data and commit to git
app.post('/api/save-data', async (req, res) => {
    try {
        const { date, data } = req.body;
        const fileName = `${date}.json`;
        const filePath = path.join(DATA_DIR, fileName);
        
        // Write JSON file
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        
        // Git operations
        const gitCommands = [
            `git add data/${fileName}`,
            `git commit -m "Update activity data for ${date}"`
        ];
        
        for (const command of gitCommands) {
            await new Promise((resolve, reject) => {
                exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
                    if (error && !error.message.includes('nothing to commit')) {
                        console.warn(`Git warning: ${error.message}`);
                    }
                    resolve();
                });
            });
        }
        
        console.log(`✅ Data saved and committed for ${date}`);
        res.json({ success: true, message: `Data saved for ${date}` });
        
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get activity data for a specific date
app.get('/api/get-data/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const fileName = `${date}.json`;
        const filePath = path.join(DATA_DIR, fileName);
        
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'Data not found for this date' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Initialize and start server
async function startServer() {
    await ensureDataDir();
    app.listen(PORT, () => {
        console.log(`🚀 Activity Tracker Server running on http://localhost:${PORT}`);
        console.log(`📁 Data will be saved to: ${DATA_DIR}`);
    });
}

startServer().catch(console.error);
