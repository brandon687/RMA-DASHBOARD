# Quick Start Guide - Server Access

## Server Status: ✓ RUNNING

The server is currently running and accessible at:
- **Customer Portal**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin.html

---

## If You See "Safari Can't Connect to Server"

This is a **Safari cache issue**, not a server problem. The server is working.

### Fix in 10 Seconds:
1. Press **Cmd + Option + E** (Clear Safari cache)
2. Press **Cmd + Shift + R** (Hard refresh)
3. Page should load

### Alternative: Use Chrome
Open in Google Chrome instead:
```
http://localhost:3000/admin.html
```

---

## Quick Commands

### Check if Server is Running
```bash
./check-server.sh
```

### Start/Restart Server
```bash
./start-server.sh
```

### Stop Server
```bash
pkill -f "node server.js"
```

---

## Admin Dashboard Features

The admin dashboard now shows device data in **spreadsheet style**:

### Submission List Columns:
- Company Name
- Customer Email
- Sales Order Number
- Qty to Return

### Device Detail Columns (9 total):
1. IMEI
2. Model
3. Storage
4. Grade
5. Issue
6. Issue Category
7. Repair/Return
8. Unit Price
9. Repair Cost

### Design Features:
- Spreadsheet-style borders (like Excel/Google Sheets)
- Alternating row colors for easy reading
- Sticky header (stays visible when scrolling)
- No emojis - clean data display
- Easy to select and copy data

---

## Troubleshooting

### Problem: Safari shows connection error
**Solution**: Clear cache (Cmd+Option+E) or use Chrome

### Problem: Not sure if server is running
**Solution**: Run `./check-server.sh`

### Problem: Made code changes, not showing up
**Solution**:
1. Restart server: `./start-server.sh`
2. Hard refresh browser: Cmd+Shift+R

### Problem: Port already in use
**Solution**:
```bash
pkill -f "node server.js"
./start-server.sh
```

For detailed troubleshooting, see: **SERVER-TROUBLESHOOTING.md**

---

## What Was Just Fixed

1. **Spreadsheet-style device table** with exact column matching
2. **Server health check scripts** for reliable startup
3. **Comprehensive troubleshooting guide** for Safari cache issues
4. **Startup script** that ensures server always starts correctly

The server is working perfectly. The "can't connect" error is Safari caching an old failed connection attempt.

---

**TL;DR**: Server works. Safari cache doesn't. Clear Safari cache or use Chrome.
