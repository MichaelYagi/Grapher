"""
Minimal test to reach 91% coverage
Targets main.py lines 64-65 by testing __name__ == "__main__" block
"""

import pytest
import sys
import os
from unittest.mock import patch, MagicMock

# Add src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))


def test_main_entry_point_coverage():
    """Cover main.py lines 64-65 - __name__ == '__main__' block"""
    
    # Mock the dependencies that would be called in main block
    with patch('main.load_dotenv') as mock_load_dotenv, \
         patch('main.uvicorn.run') as mock_uvicorn, \
         patch('main.settings') as mock_settings:
        
        # Set up mock settings
        mock_settings.HOST = "127.0.0.1"
        mock_settings.PORT = 8000
        mock_settings.DEBUG = False
        
        # Import and run main module as if it were executed directly
        import importlib.util
        import main
        
        # Simulate __name__ == "__main__"
        with patch.object(main, '__name__', '__main__'):
            # This should hit lines 64-65
            exec(open(os.path.join(os.path.dirname(__file__), '..', 'src', 'main.py')).read(), 
                  {'__name__': '__main__'})
        
        # Verify the mocked functions were called
        mock_load_dotenv.assert_called_once()
        mock_uvicorn.assert_called_once_with(
            "main:app",
            host="127.0.0.1",
            port=8000,
            reload=False,
            log_level="info"
        )