#!/bin/bash
echo "Activating venv..."
cd "$(dirname "$0")/server"
source venv/bin/activate
echo "Starting Personal Dispatch..."
python main.py
