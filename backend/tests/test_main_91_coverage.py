"""
Final test to reach 91% coverage
Simple test that covers main.py lines 64-65
"""

import pytest
import sys
import os
from unittest.mock import patch

# Add src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))


def test_main_script_coverage():
    """Cover main.py lines 64-65 by simulating script execution"""
    
    # Mock the uvicorn.run and load_dotenv calls
    with patch('main.uvicorn.run') as mock_uvicorn, \
         patch('main.load_dotenv') as mock_load_dotenv, \
         patch('main.settings') as mock_settings:
        
        # Set up mock settings to avoid config issues
        mock_settings.HOST = "127.0.0.1"
        mock_settings.PORT = 8000
        mock_settings.DEBUG = False
        
        # Mock sys.argv to simulate script execution
        original_argv = sys.argv
        sys.argv = ['main.py']
        
        try:
            # Import and execute main module content directly
            with open(os.path.join(os.path.dirname(__file__), '..', 'src', 'main.py'), 'r') as f:
                main_code = f.read()
                
            # Execute the main code with mocked __name__
            exec_globals = {'__name__': '__main__', '__file__': 'main.py'}
            exec(main_code, exec_globals)
            
        finally:
            # Restore original argv
            sys.argv = original_argv
        
        # Verify that the mocked functions were called
        mock_load_dotenv.assert_called_once()
        mock_uvicorn.assert_called_once()