#!/bin/bash
# Helper script to fix database permissions

echo "🔧 Fixing database permissions..."

if [ -f "database/reuse-store.db" ]; then
    chmod 666 database/reuse-store.db
    echo "✅ Database file permissions fixed"
else
    echo "⚠️  Database file not found"
fi

if [ -d "database" ]; then
    chmod 777 database
    echo "✅ Database directory permissions fixed"
fi

echo "✨ Done!"
