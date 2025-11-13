# Server Troubleshooting Guide

## Quick Diagnosis

The server is working correctly, but Safari may cache connection errors. This guide ensures you can always access the RMA portal reliably.

---

## How to Check if Server is Running

### Method 1: Use Health Check Script (RECOMMENDED)
```bash
./check-server.sh
```

This will test:
- Server process is running
- Main page is accessible (http://localhost:3000)
- Admin page is accessible (http://localhost:3000/admin.html)
- API endpoints are responding

### Method 2: Manual Check
```bash
# Check if node server is running
ps aux | grep "node server.js"

# Test if server responds
curl -I http://localhost:3000/admin.html
```

If you see `HTTP/1.1 200 OK`, the server is working correctly.

---

## Safari "Can't Connect to Server" Error

### THE PROBLEM:
Safari caches connection failures aggressively. When the server restarts or wasn't running previously, Safari remembers the failed connection even after the server is back online.

### THE SOLUTION:

#### Option 1: Clear Safari Cache (BEST)
1. Open Safari
2. Press **Cmd + Option + E** (Clear Safari cache)
3. Press **Cmd + Shift + R** (Hard refresh the page)
4. Navigate to http://localhost:3000/admin.html

#### Option 2: Force Reload
1. Open the page that shows the error
2. Press **Cmd + Shift + R** (Hard refresh)
3. If that doesn't work, try **Cmd + R** multiple times

#### Option 3: Restart Safari
1. Quit Safari completely (Cmd + Q)
2. Reopen Safari
3. Navigate to http://localhost:3000/admin.html

#### Option 4: Use Chrome/Firefox (FASTEST)
Safari can be stubborn with localhost. Chrome and Firefox handle localhost better:
```
Google Chrome: http://localhost:3000/admin.html
Firefox:       http://localhost:3000/admin.html
```

---

## How to Start the Server Reliably

### Method 1: Use Startup Script (RECOMMENDED)
```bash
./start-server.sh
```

This script will:
- Kill any existing server processes
- Install dependencies if needed
- Check for .env file
- Start the server
- Verify it's responding
- Show clear status messages

### Method 2: Manual Start
```bash
# Kill existing server
pkill -f "node server.js"

# Start new server
node server.js
```

---

## Common Issues and Fixes

### Issue 1: "Safari Can't Connect to the Server"
**Symptoms:** Error page in Safari saying it can't connect to localhost

**Diagnosis:**
```bash
./check-server.sh
```

**If health check shows all green:**
- Server is running correctly
- Problem is Safari cache
- Follow "Safari Can't Connect to Server" section above

**If health check shows red:**
- Server is not running
- Run `./start-server.sh`

### Issue 2: Port Already in Use
**Symptoms:** Server won't start, error about port 3000

**Fix:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or kill all node servers
pkill -f "node server.js"

# Restart
./start-server.sh
```

### Issue 3: Server Starts But Pages Don't Load
**Symptoms:** Server says it's running but pages return 404

**Diagnosis:**
```bash
# Check if files exist
ls -la admin.html index.html

# Check server routing
curl -I http://localhost:3000/admin.html
```

**Fix:**
Make sure you're in the correct directory:
```bash
cd "/Users/brandonin/scal rma dashboard"
./start-server.sh
```

### Issue 4: Changes Not Showing Up
**Symptoms:** Made code changes but page looks the same

**Fix:**
1. **Restart server** (picks up server-side changes)
   ```bash
   pkill -f "node server.js"
   ./start-server.sh
   ```

2. **Clear browser cache** (picks up client-side changes)
   - Safari: Cmd + Option + E, then Cmd + Shift + R
   - Chrome: Cmd + Shift + Delete, check "Cached images and files"

3. **Hard refresh**
   - Cmd + Shift + R (bypass cache)

---

## URLs to Bookmark

### Customer RMA Submission Portal
```
http://localhost:3000
http://localhost:3000/index.html
```

### Admin Dashboard
```
http://localhost:3000/admin.html
```

### API Endpoints (for testing)
```
http://localhost:3000/api/admin/submissions
http://localhost:3000/api/admin/submission/RMA-XXXXX
```

---

## Testing Checklist

Before telling anyone to access the portal, run this checklist:

1. **Server Health Check**
   ```bash
   ./check-server.sh
   ```
   ✓ All checks should be green

2. **Test in Browser**
   - Open http://localhost:3000/admin.html
   - Should see admin dashboard
   - Click "View" on a submission
   - Should see device table with 9 columns

3. **Test API**
   ```bash
   curl http://localhost:3000/api/admin/submissions
   ```
   ✓ Should return JSON with submissions

4. **If Any Test Fails**
   - Clear Safari cache (Cmd + Option + E)
   - Restart server (./start-server.sh)
   - Try different browser

---

## Why This Happens

### Technical Explanation:
1. **Development Environment**: We're running on localhost, which browsers treat specially
2. **Safari Caching**: Safari aggressively caches DNS and connection failures for localhost
3. **Server Restarts**: Every time we restart the server, there's a brief moment where it's unreachable
4. **Cache Duration**: Safari may cache the failure for several minutes

### Prevention:
- Use the health check script before accessing the portal
- Use Chrome/Firefox for development (better localhost handling)
- Keep server running continuously (don't restart unnecessarily)
- Clear cache preemptively when making changes

---

## Quick Command Reference

```bash
# Start server
./start-server.sh

# Check server health
./check-server.sh

# Stop server
pkill -f "node server.js"

# View server logs
tail -f server.log  # (if logging enabled)

# Test endpoints
curl http://localhost:3000/
curl http://localhost:3000/admin.html
curl http://localhost:3000/api/admin/submissions
```

---

## When to Use Each Tool

| Scenario | Use This |
|----------|----------|
| Starting fresh | `./start-server.sh` |
| Not sure if running | `./check-server.sh` |
| Safari won't connect | Clear cache (Cmd+Option+E) |
| Made code changes | Restart server + hard refresh |
| Server won't start | `pkill -f "node server.js"` then retry |
| Pages not loading | Check you're in right directory |

---

## Support

If server still won't work after following this guide:

1. Run health check and share output:
   ```bash
   ./check-server.sh > health-check.txt
   ```

2. Check server logs:
   ```bash
   node server.js 2>&1 | tee server-output.txt
   ```

3. Verify file structure:
   ```bash
   ls -la | grep -E "(admin|index|server)"
   ```

Share these outputs for diagnosis.

---

**IMPORTANT**: The server is currently running and accessible. The issue in your screenshot is Safari cache. Clear Safari cache (Cmd+Option+E) and hard refresh (Cmd+Shift+R), or use Chrome.
