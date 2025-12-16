# Installation Notes

## "externally-managed-environment" Message

**This is completely normal and expected** on modern Linux systems!

### What this means:
- Your system protects system Python packages (PEP 668)
- Application packages should be installed separately
- Our scripts handle this automatically

### How we handle it:
```bash
# First try normal install
pip3 install packages...

# If that fails, use override (safe for app packages)
pip3 install packages... --break-system-packages
```

### This is safe because:
- FastAPI, uvicorn, numpy, scipy, etc. are application packages
- They won't conflict with system Python
- No risk to your OS installation

### Alternatives (if you prefer):
```bash
# User-specific install
pip3 install --user packages...

# System packages (Ubuntu/Debian)
sudo apt install python3-fastapi python3-uvicorn

# Virtual environment (cleanest)
./quick-setup.sh && ./start_grapher.sh
```

### TL;DR:
- **See the message?** Normal! Script handles it automatically.
- **Don't want system packages?** Use virtual environment option.
- **Still works?** Yes! Server starts successfully.