#!/bin/bash

echo "🚀 Auto-deploy script started..."

# Check if there are changes to commit
if git diff --quiet || git ls-files --others --exclude-standard | grep -q .; then
    echo "📝 Changes detected, committing and pushing..."
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    git commit -m "Auto-deploy $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Push to origin
    git push origin main
    
    echo "✅ Changes pushed to GitHub successfully!"
    echo "🔄 Railway will auto-update..."
else
    echo "✅ No changes to deploy"
fi

echo "🎯 Auto-deploy script completed!"
