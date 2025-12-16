#!/bin/bash
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run ./quick-setup.sh first"
    exit 1
fi

# Use Python directly from virtual environment
venv/bin/python backend/src/main.py