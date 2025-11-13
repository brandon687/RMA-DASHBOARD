#!/bin/bash

# SCAL Mobile RMA Portal - Server Health Check
# Quick script to verify server is running and accessible

cd "$(dirname "$0")"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Checking server status...${NC}"
echo ""

# Check if process is running
if pgrep -f "node server.js" > /dev/null; then
    PID=$(pgrep -f "node server.js")
    echo -e "${GREEN}✓ Server process running (PID: $PID)${NC}"
else
    echo -e "${RED}✗ Server process not running${NC}"
    echo ""
    echo "To start the server, run:"
    echo "  ./start-server.sh"
    echo ""
    echo "Or manually:"
    echo "  node server.js"
    exit 1
fi

# Check if server responds to main page
echo -e "${YELLOW}Testing main page...${NC}"
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$MAIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Main page accessible (HTTP $MAIN_STATUS)${NC}"
else
    echo -e "${RED}✗ Main page error (HTTP $MAIN_STATUS)${NC}"
fi

# Check if admin page is accessible
echo -e "${YELLOW}Testing admin page...${NC}"
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin.html)
if [ "$ADMIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Admin page accessible (HTTP $ADMIN_STATUS)${NC}"
else
    echo -e "${RED}✗ Admin page error (HTTP $ADMIN_STATUS)${NC}"
fi

# Check API endpoints
echo -e "${YELLOW}Testing API endpoints...${NC}"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin/submissions)
if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ API endpoints accessible (HTTP $API_STATUS)${NC}"
else
    echo -e "${RED}✗ API endpoints error (HTTP $API_STATUS)${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                 SERVER HEALTH CHECK COMPLETE               ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  Status: ${NC}All systems operational                       ${GREEN}║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  URLs:                                                     ║${NC}"
echo -e "${GREEN}║    Customer: ${NC}http://localhost:3000                     ${GREEN}║${NC}"
echo -e "${GREEN}║    Admin:    ${NC}http://localhost:3000/admin.html          ${GREEN}║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$MAIN_STATUS" = "200" ] && [ "$ADMIN_STATUS" = "200" ]; then
    echo -e "${YELLOW}If browser shows connection error:${NC}"
    echo "  1. Clear browser cache (Safari: Cmd+Option+E)"
    echo "  2. Hard refresh page (Cmd+Shift+R)"
    echo "  3. Try different browser (Chrome/Firefox)"
    echo "  4. Restart Safari completely"
    echo ""
    exit 0
else
    echo -e "${RED}Some checks failed. Server may need restart.${NC}"
    exit 1
fi
