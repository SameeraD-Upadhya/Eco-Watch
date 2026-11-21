#!/usr/bin/env python3
"""
EcoWatch: Unified Cross-Platform Application Launcher
Starts:
1. Local MongoDB connectivity verification (port 27017)
2. FastAPI Backend server on http://127.0.0.1:8000
3. React Vite Frontend server on http://127.0.0.1:5173
4. Automatically opens http://localhost:5173 in default browser
5. Graceful shutdown on Ctrl+C
"""

import sys
import os
import time
import socket
import subprocess
import webbrowser
import signal
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def is_port_in_use(port, host="127.0.0.1"):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0

def check_mongodb():
    print("Checking local MongoDB connection on port 27017...")
    if not is_port_in_use(27017):
        print("\n[WARNING] MongoDB does not appear to be running on 127.0.0.1:27017!")
        print("Please start MongoDB before launching EcoWatch:")
        print("  Windows:    Start-Service MongoDB (PowerShell as Admin)")
        print("  Linux:      sudo systemctl start mongod")
        print("  macOS:      brew services start mongodb-community\n")
        response = input("Do you want to proceed anyway? (y/N): ").strip().lower()
        if response != 'y':
            sys.exit(1)
    else:
        print("-> MongoDB is active and reachable.")

def main():
    print("================================================================")
    print("ECOWATCH: COMMUNITY ENVIRONMENTAL MONITORING SYSTEM")
    print("Unified Application Launcher")
    print("================================================================\n")

    check_mongodb()

    processes = []

    def shutdown(sig=None, frame=None):
        print("\nShutting down EcoWatch processes...")
        for p in processes:
            try:
                p.terminate()
                p.wait(timeout=3)
            except Exception:
                try:
                    p.kill()
                except Exception:
                    pass
        print("All processes stopped. Goodbye!")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, shutdown)

    # 1. Start Backend
    print("\nStarting FastAPI backend server on http://127.0.0.1:8000...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    processes.append(backend_proc)

    # 2. Start Frontend
    print("Starting Vite frontend server on http://127.0.0.1:5173...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = [npm_cmd, "--prefix", "frontend", "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    processes.append(frontend_proc)

    # Wait for servers to be accessible
    print("\nWaiting for servers to initialize...")
    for _ in range(30):
        if is_port_in_use(8000) and is_port_in_use(5173):
            break
        time.sleep(0.5)

    print("\n----------------------------------------------------------------")
    print("EcoWatch is live and operational!")
    print("  Frontend Application: http://localhost:5173")
    print("  Backend REST API:     http://127.0.0.1:8000")
    print("  API Documentation:    http://127.0.0.1:8000/docs")
    print("----------------------------------------------------------------")
    print("Opening browser at http://localhost:5173...")
    try:
        webbrowser.open("http://localhost:5173")
    except Exception:
        pass

    print("\nPress Ctrl+C to terminate all servers.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    main()
