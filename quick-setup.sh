#!/bin/bash
# Simple setup script for Grapher

echo "🚀 Setting up Grapher..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 required. Install from python.org"
    exit 1
fi

# Setup virtual environment
echo "📦 Setting up Python environment..."
rm -rf venv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📚 Installing packages..."
pip install --upgrade pip
pip install fastapi uvicorn python-dotenv numpy scipy pydantic-settings numexpr

# Fix static file paths if needed
echo "🔧 Configuring paths..."
if [ -f "backend/src/main.py" ]; then
    sed -i 's/directory="static"/directory=os.path.join(os.path.dirname(__file__), "static")/' backend/src/main.py 2>/dev/null || true
fi

# Create startup script
echo "🔨 Creating startup script..."
cat > start_grapher.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run ./quick-setup.sh first"
    exit 1
fi

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    echo "❌ Virtual environment activation not found"
    exit 1
fi

# Use Python from virtual environment
python backend/src/main.py
EOF
chmod +x start_grapher.sh

echo "✅ Done!"
echo "Run: ./start_grapher.sh"