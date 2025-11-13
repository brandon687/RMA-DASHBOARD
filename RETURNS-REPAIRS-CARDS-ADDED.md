# Returns vs Repairs Statistics Cards Added

## Changes Made

Updated the submission detail modal to show:
1. **New header format:** "Customer Name - RMA Number" (e.g., "branbran - RMA-MHWJ5AFD-JAII")
2. **Two statistics cards** showing Returns vs Repairs breakdown with percentages

---

## New Modal Layout

### Header Format:
**BEFORE:** `RMA-MHWJ5AFD-JAII - branbran`
**AFTER:** `branbran - RMA-MHWJ5AFD-JAII`

Format is now: **Company Name - RMA Number**

### New Section: Request Breakdown

Two cards displayed side-by-side showing:

**Returns Requested Card:**
- Icon: ↩ (return arrow)
- Count: X/Total (e.g., 7/8)
- Percentage: XX.X% (e.g., 87.5%)
- Color: Red (#ff3b30)

**Repairs Requested Card:**
- Icon: 🔧 (wrench)
- Count: X/Total (e.g., 1/8)
- Percentage: XX.X% (e.g., 12.5%)
- Color: Green (#34c759)

---

## Example Display

### Sample Data:
```
8 total devices:
- 7 devices with "Return" action
- 1 device with "Repair" action
```

### Display:
```
╔═══════════════════════════════════════════════════════════╗
║ branbran - RMA-MHWJ5AFD-JAII                              ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║ Submission Information                                    ║
║ [Reference Number] [Company Name] [Email] [Order #]...    ║
║                                                           ║
║ Request Breakdown                                         ║
║ ┌──────────────────────┐  ┌──────────────────────┐       ║
║ │ ↩ Returns Requested │  │ 🔧 Repairs Requested │       ║
║ │ 7/8          87.5%   │  │ 1/8          12.5%   │       ║
║ └──────────────────────┘  └──────────────────────┘       ║
║                                                           ║
║ Devices (8)                                               ║
║ [Device Table...]                                         ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Implementation Details

### 1. Header Update (admin.js line 172)

**BEFORE:**
```javascript
modalTitle.textContent = `${data.submission.reference_number} - ${data.submission.company_name}`;
```

**AFTER:**
```javascript
// Format: Company Name - RMA Number
modalTitle.textContent = `${data.submission.company_name} - ${data.submission.reference_number}`;
```

### 2. Statistics Calculation (admin.js lines 174-185)

```javascript
// Calculate Returns vs Repairs statistics
const devices = data.devices || [];
const totalDevices = devices.length;
const returnDevices = devices.filter(d =>
    d.requested_action && d.requested_action.toLowerCase().includes('return')
).length;
const repairDevices = devices.filter(d =>
    d.requested_action && d.requested_action.toLowerCase().includes('repair')
).length;

const returnPercentage = totalDevices > 0 ? ((returnDevices / totalDevices) * 100).toFixed(1) : 0;
const repairPercentage = totalDevices > 0 ? ((repairDevices / totalDevices) * 100).toFixed(1) : 0;
```

**Logic:**
- Filters devices by `requested_action` field
- Checks if field contains "return" or "repair" (case-insensitive)
- Calculates percentage with 1 decimal place
- Handles edge case of 0 devices

### 3. Statistics Cards HTML (admin.js lines 230-256)

```javascript
${totalDevices > 0 ? `
<div class="detail-section">
    <h3>Request Breakdown</h3>
    <div class="stats-cards">
        <div class="stat-card-inline stat-card-return">
            <div class="stat-card-header">
                <div class="stat-card-icon">↩</div>
                <div class="stat-card-title">Returns Requested</div>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-number">${returnDevices}/${totalDevices}</div>
                <div class="stat-card-percentage">${returnPercentage}%</div>
            </div>
        </div>
        <div class="stat-card-inline stat-card-repair">
            <div class="stat-card-header">
                <div class="stat-card-icon">🔧</div>
                <div class="stat-card-title">Repairs Requested</div>
            </div>
            <div class="stat-card-body">
                <div class="stat-card-number">${repairDevices}/${totalDevices}</div>
                <div class="stat-card-percentage">${repairPercentage}%</div>
            </div>
        </div>
    </div>
</div>
` : ''}
```

**Features:**
- Only shows if there are devices
- Two cards in grid layout
- Each card shows count (X/Total) and percentage
- Color-coded by type (red for returns, green for repairs)

### 4. CSS Styling (admin.html lines 316-400)

**Card Container:**
```css
.stats-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-top: 1rem;
}
```

**Card Base Style:**
```css
.stat-card-inline {
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border: 2px solid #e5e5e7;
    transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card-inline:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
```

**Color Variations:**
```css
.stat-card-return {
    border-color: #ff3b30;  /* Red border */
}

.stat-card-repair {
    border-color: #34c759;  /* Green border */
}

.stat-card-return .stat-card-icon {
    background: #ffe5e5;  /* Light red background */
}

.stat-card-repair .stat-card-icon {
    background: #e5f7e5;  /* Light green background */
}

.stat-card-return .stat-card-number {
    color: #ff3b30;  /* Red number */
}

.stat-card-repair .stat-card-number {
    color: #34c759;  /* Green number */
}
```

**Typography:**
```css
.stat-card-number {
    font-size: 2rem;
    font-weight: 700;
}

.stat-card-percentage {
    font-size: 1.5rem;
    font-weight: 600;
    color: #86868b;
}
```

---

## Calculation Examples

### Example 1: 7 Returns, 1 Repair (8 total)
```
Returns: 7/8 = 0.875 = 87.5%
Repairs: 1/8 = 0.125 = 12.5%
```

### Example 2: All Returns (5 total)
```
Returns: 5/5 = 1.0 = 100.0%
Repairs: 0/5 = 0.0 = 0.0%
```

### Example 3: All Repairs (3 total)
```
Returns: 0/3 = 0.0 = 0.0%
Repairs: 3/3 = 1.0 = 100.0%
```

### Example 4: Even Split (10 total)
```
Returns: 5/10 = 0.5 = 50.0%
Repairs: 5/10 = 0.5 = 50.0%
```

---

## Field Matching Logic

The calculation filters devices based on the `requested_action` field:

**Counts as "Return":**
- "Return"
- "RETURN"
- "return"
- Any text containing "return" (case-insensitive)

**Counts as "Repair":**
- "Repair"
- "REPAIR"
- "repair"
- Any text containing "repair" (case-insensitive)

**Edge Cases:**
- Empty/null `requested_action`: Not counted in either category
- "PENDING": Not counted (doesn't contain "return" or "repair")
- Other values: Not counted

---

## Visual Design

### Color Scheme:

**Returns Card (Red):**
- Border: #ff3b30 (Apple Red)
- Icon Background: #ffe5e5 (Light Red)
- Number: #ff3b30 (Red)
- Percentage: #86868b (Gray)

**Repairs Card (Green):**
- Border: #34c759 (Apple Green)
- Icon Background: #e5f7e5 (Light Green)
- Number: #34c759 (Green)
- Percentage: #86868b (Gray)

### Layout:
- 2-column grid (50/50 split)
- 1.5rem gap between cards
- Cards have subtle shadow and hover effect
- Icon in rounded square (40x40px)
- Large number (2rem) next to percentage (1.5rem)

---

## Files Modified

### 1. admin.js
**Lines 171-172:** Updated header format
**Lines 174-185:** Added statistics calculation
**Lines 230-256:** Added statistics cards HTML

### 2. admin.html
**Lines 316-400:** Added CSS for statistics cards

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

2. **Click "View" on any submission with devices**

3. **Verify Modal Display:**
   - Header shows: "Company Name - RMA Number"
   - "Request Breakdown" section appears
   - Two cards: Returns Requested and Repairs Requested
   - Each card shows: Count (X/Total) and Percentage (XX.X%)
   - Returns card is red, Repairs card is green

4. **Test with Different Data:**
   - Submission with all returns (should show 100% / 0%)
   - Submission with mixed returns and repairs
   - Submission with all repairs (should show 0% / 100%)

---

## Sample Test Data

Using the example data provided:

**Input:**
```
8 devices:
Row 1: Repair/Return = "Return"
Row 2: Repair/Return = "Return"
Row 3: Repair/Return = "Return"
Row 4: Repair/Return = "Return"
Row 5: Repair/Return = "Return"
Row 6: Repair/Return = "Return"
Row 7: Repair/Return = "Return"
Row 8: Repair/Return = "Repair"
```

**Expected Output:**
```
Returns Requested: 7/8 (87.5%)
Repairs Requested: 1/8 (12.5%)
```

---

## Summary

✓ **Header updated** to "Company Name - RMA Number" format
✓ **Statistics cards added** showing Returns vs Repairs breakdown
✓ **Percentages calculated** with 1 decimal precision
✓ **Color-coded design** (red for returns, green for repairs)
✓ **Responsive layout** with 2-column grid
✓ **Hover effects** for better UX

**Changes complete - ready to test!**

Access the admin dashboard and click "View" on any submission to see the new display.
