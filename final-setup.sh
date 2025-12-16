#!/bin/bash
echo "🚀 Setting up Grapher..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 required"
    exit 1
fi

# Create venv and install packages
echo "📦 Setting up environment..."
rm -rf venv
python3 -m venv venv

# Install packages directly in venv
echo "📚 Installing dependencies..."
venv/bin/pip install --upgrade pip
venv/bin/pip install fastapi uvicorn python-dotenv numpy scipy pydantic-settings numexpr

# Create startup script
echo "🔨 Creating startup script..."
cat > start_grapher.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run ./quick-setup.sh first"
    exit 1
fi
venv/bin/python backend/src/main.py
EOF
chmod +x start_grapher.sh

echo "✅ Setup complete!"
echo "Run: ./start_grapher.sh"