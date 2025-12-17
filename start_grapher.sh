#!/bin/bash
cd "$(dirname "$0")"
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate 2>/dev/null
python3 backend/src/main.py
