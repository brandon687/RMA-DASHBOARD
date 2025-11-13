#!/bin/bash

# SCAL Mobile RMA Portal - Server Startup Script
# This script ensures the server starts reliably and stays running

cd "$(dirname "$0")"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║      SCAL MOBILE RMA PORTAL - SERVER STARTUP               ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Kill any existing server processes
echo -e "${YELLOW}Checking for existing server processes...${NC}"
pkill -f "node server.js" 2>/dev/null
sleep 1

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}WARNING: .env file not found${NC}"
    echo "Creating .env from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env with your configuration${NC}"
    fi
fi

# Start the server
echo -e "${GREEN}Starting server...${NC}"
echo ""

# Start server in background and capture PID
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Check if server is running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Server started successfully (PID: $SERVER_PID)${NC}"
    echo ""

    # Test if server is responding
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q "200"; then
        echo -e "${GREEN}✓ Server is responding to requests${NC}"
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    SERVER READY                            ║${NC}"
        echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
        echo -e "${GREEN}║                                                            ║${NC}"
        echo -e "${GREEN}║  Customer Portal:  ${NC}http://localhost:3000              ${GREEN}║${NC}"
        echo -e "${GREEN}║  Admin Dashboard:  ${NC}http://localhost:3000/admin.html   ${GREEN}║${NC}"
        echo -e "${GREEN}║                                                            ║${NC}"
        echo -e "${GREEN}║  Server PID: ${NC}$SERVER_PID                                 ${GREEN}║${NC}"
        echo -e "${GREEN}║                                                            ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}Tips:${NC}"
        echo "  • If browser shows connection error, clear cache (Cmd+Shift+R)"
        echo "  • View logs: tail -f server.log"
        echo "  • Stop server: kill $SERVER_PID"
        echo ""

        # Save PID to file
        echo $SERVER_PID > .server.pid

        # Follow server logs
        echo -e "${GREEN}Server is running. Press Ctrl+C to stop.${NC}"
        wait $SERVER_PID
    else
        echo -e "${RED}✗ Server started but not responding${NC}"
        echo "Check server.js for errors"
        exit 1
    fi
else
    echo -e "${RED}✗ Server failed to start${NC}"
    echo "Check for errors above"
    exit 1
fi
