# Submitted On Column Added - Pacific Time Display

## Changes Made

Added "SUBMITTED ON" column to the admin dashboard submission list, showing date and time in Pacific Time (Irvine, CA timezone).

### New Column Layout:

**BEFORE (4 data columns):**
```
COMPANY NAME | CUSTOMER EMAIL | SALES ORDER NUMBER | QTY TO RETURN | [View Button]
```

**AFTER (5 data columns):**
```
SUBMITTED ON | COMPANY NAME | CUSTOMER EMAIL | SALES ORDER NUMBER | QTY TO RETURN | [View Button]
```

---

## Implementation Details

### 1. Added Pacific Time Formatter

**File: admin.js (lines 63-92)**

```javascript
function formatPacificTime(timestamp) {
    if (!timestamp) return 'N/A';

    const date = new Date(timestamp);

    // Format for Pacific Time (America/Los_Angeles - Irvine, CA)
    const options = {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    // Extract parts
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    const year = parts.find(p => p.type === 'year').value;
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    const dayPeriod = parts.find(p => p.type === 'dayPeriod').value;

    // Format: MM/DD/YYYY HH:MM AM/PM
    return `${month}/${day}/${year} ${hour}:${minute} ${dayPeriod}`;
}
```

**Features:**
- Uses browser's `Intl.DateTimeFormat` API
- Timezone: `America/Los_Angeles` (Pacific Time - Irvine, CA)
- Format: `MM/DD/YYYY HH:MM AM/PM`
- Example: `11/12/2025 01:46 PM`

### 2. Updated Table Header

**File: admin.js (lines 107-115)**

```javascript
let html = `
    <div class="submission-item-header">
        <div>SUBMITTED ON</div>        ← ADDED
        <div>COMPANY NAME</div>
        <div>CUSTOMER EMAIL</div>
        <div>SALES ORDER NUMBER</div>
        <div>QTY TO RETURN</div>
        <div></div>
    </div>
`;
```

### 3. Updated Row Rendering

**File: admin.js (lines 119-142)**

```javascript
html += filteredSubmissions
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(sub => `
        <div class="submission-item" onclick="viewSubmission('${sub.reference_number}')">
            <div style="font-size: 0.85rem; color: #86868b;">
                ${formatPacificTime(sub.submission_date || sub.created_at)}  ← ADDED
            </div>
            <div style="font-weight: 500;">
                ${sub.company_name}
            </div>
            <div style="color: #1d1d1f;">
                ${sub.company_email}
            </div>
            <div style="font-weight: 500;">
                ${sub.order_number || 'N/A'}
            </div>
            <div style="font-weight: 600; text-align: center;">
                ${sub.total_devices || 0}
            </div>
            <button class="view-btn">View</button>
        </div>
    `).join('');
```

**Styling:**
- Font size: `0.85rem` (smaller than other columns)
- Color: `#86868b` (gray, less prominent)
- Uses `submission_date` if available, falls back to `created_at`

### 4. Updated CSS Grid Layout

**File: admin.html (lines 136 and 145)**

**BEFORE:**
```css
grid-template-columns: 2fr 2fr 1.5fr 1fr 100px;  /* 5 columns */
```

**AFTER:**
```css
grid-template-columns: 1.5fr 2fr 2fr 1.5fr 1fr 100px;  /* 6 columns */
```

**Column Widths:**
1. `1.5fr` - SUBMITTED ON (timestamp)
2. `2fr` - COMPANY NAME
3. `2fr` - CUSTOMER EMAIL
4. `1.5fr` - SALES ORDER NUMBER
5. `1fr` - QTY TO RETURN
6. `100px` - View Button

---

## Date/Time Format Examples

### Input (from database):
```
"2025-11-12T21:46:27.332653"  (UTC timestamp)
```

### Output (displayed in Pacific Time):
```
11/12/2025 01:46 PM  (Pacific Time - Irvine, CA)
```

### Timezone Handling:

- **Server stores**: UTC timestamps
- **JavaScript converts**: UTC → Pacific Time (America/Los_Angeles)
- **User sees**: Local Irvine, CA time with AM/PM

**Automatic DST handling:**
- Pacific Daylight Time (PDT): UTC-7 (March - November)
- Pacific Standard Time (PST): UTC-8 (November - March)
- JavaScript automatically adjusts for DST

---

## Files Modified

### 1. admin.js
- **Lines 63-92**: Added `formatPacificTime()` function
- **Lines 107-115**: Updated header to include "SUBMITTED ON"
- **Lines 119-142**: Updated row rendering to show timestamp

### 2. admin.html
- **Line 136**: Updated `.submission-item` grid columns (5→6)
- **Line 145**: Updated `.submission-item-header` grid columns (5→6)

---

## Testing

### Current Server Status:
```
✓ Server running: PID 91407
✓ Port: 3000
✓ Admin dashboard: http://127.0.0.1:3000/admin.html
```

### How to Test:

1. **Open Admin Dashboard:**
   ```
   http://127.0.0.1:3000/admin.html
   ```

2. **Verify Column Layout:**
   - Header shows: SUBMITTED ON | COMPANY NAME | CUSTOMER EMAIL | SALES ORDER NUMBER | QTY TO RETURN
   - 5 data columns + 1 button column = 6 total columns

3. **Check Timestamp Format:**
   - Format: MM/DD/YYYY HH:MM AM/PM
   - Example: 11/12/2025 01:46 PM
   - Timezone: Pacific Time (Irvine, CA)

4. **Verify Sorting:**
   - Submissions sorted by newest first (most recent at top)
   - SUBMITTED ON should show decreasing timestamps as you scroll down

---

## Sample Display

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║ SUBMITTED ON        │ COMPANY NAME  │ CUSTOMER EMAIL    │ SALES ORDER │ QTY │   ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║ 11/12/2025 01:46 PM │ jonjon       │ jonjon@m.com      │ TEST-...    │ 8   │ View║
║ 11/12/2025 01:39 PM │ jonjon       │ jonjon@m.com      │ 12324       │ 8   │ View║
║ 11/12/2025 12:37 PM │ FINAL TEST   │ test@overhaul.com │ ORD-111125  │ 14  │ View║
║ 11/12/2025 12:15 PM │ AMERICATECH  │ test@america...   │ ORD-110725  │ 0   │ View║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Benefits

### 1. Chronological Context
- Users can see exactly when each submission was made
- Easy to identify recent vs old submissions
- Helps with time-sensitive RMA processing

### 2. Accurate Local Time
- Displays in Irvine, CA timezone (Pacific Time)
- Matches user's expected local time
- Automatic DST adjustment

### 3. Professional Format
- 12-hour format with AM/PM (US standard)
- Date in MM/DD/YYYY format
- Consistent with US business practices

### 4. Sort by Recency
- List already sorted by newest first
- SUBMITTED ON column confirms the sort order
- Easy to find most recent submissions

---

## Technical Notes

### Timezone Conversion:

The `Intl.DateTimeFormat` API handles timezone conversion automatically:

```javascript
Database (UTC):        2025-11-12T21:46:27Z
↓ Convert to Pacific
Pacific Time (PST/PDT): 11/12/2025 01:46 PM
```

**Current Time Offset (as of test):**
- PST (Standard Time): UTC-8
- PDT (Daylight Time): UTC-7

### Browser Compatibility:

`Intl.DateTimeFormat` with `timeZone` option supported in:
- ✓ Chrome 24+
- ✓ Firefox 29+
- ✓ Safari 10+
- ✓ Edge 14+

All modern browsers support this feature.

---

## Summary

✓ **Added SUBMITTED ON column** to admin dashboard
✓ **Displays Pacific Time** (America/Los_Angeles - Irvine, CA)
✓ **Format: MM/DD/YYYY HH:MM AM/PM**
✓ **Updated CSS grid** for 6 columns (was 5)
✓ **Automatic DST handling**
✓ **Sorted by newest first**

**Column Layout:**
1. SUBMITTED ON (timestamp in PT)
2. COMPANY NAME
3. CUSTOMER EMAIL
4. SALES ORDER NUMBER
5. QTY TO RETURN
6. [View Button]

**Ready to test at:** http://127.0.0.1:3000/admin.html
