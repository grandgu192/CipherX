"""
Entry point for both web and desktop versions.
This file can be used to create an .exe with PyInstaller.
"""
import os
import sys
from app import app

def main():
    # Check if running as executable or web server
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        import webbrowser
        port = 5000
        url = f"http://127.0.0.1:{port}"
        print(f"Starting encryption tool...")
        print(f"Opening {url} in your default browser...")
        # Open browser after a short delay to ensure server is running
        webbrowser.open(url)
        app.run(host='127.0.0.1', port=port)
    else:
        # Running as web server
        port = int(os.environ.get("PORT", 5000))
        app.run(host='0.0.0.0', port=port)

if __name__ == "__main__":
    main()
