#!/bin/bash

echo "🚀 GitHub Pages Deployment Script"
echo "=================================="

# Check if GitHub username is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your GitHub username"
    echo "Usage: ./deploy.sh YOUR_GITHUB_USERNAME"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="activity-tracker"

echo "📝 Setting up remote origin..."
git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git

echo "📤 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Repository pushed to GitHub!"
echo ""
echo "🌐 To enable GitHub Pages:"
echo "1. Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "2. Click on 'Settings' tab"
echo "3. Scroll down to 'Pages' section"
echo "4. Under 'Source', select 'Deploy from a branch'"
echo "5. Select 'main' branch and '/ (root)' folder"
echo "6. Click 'Save'"
echo ""
echo "🎉 Your website will be available at:"
echo "   https://$GITHUB_USERNAME.github.io/$REPO_NAME"
echo ""
echo "⏰ It may take a few minutes for the site to become available."
