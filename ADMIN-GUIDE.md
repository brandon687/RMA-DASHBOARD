# Admin Dashboard User Guide

**SCal Mobile RMA Portal - Admin Dashboard Manual**

Complete guide for finance and operations staff to manage RMA submissions through the admin dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Accessing the Dashboard](#accessing-the-dashboard)
- [Dashboard Overview](#dashboard-overview)
- [Managing Submissions](#managing-submissions)
- [Viewing Submission Details](#viewing-submission-details)
- [Changing Status](#changing-status)
- [Downloading Files](#downloading-files)
- [Understanding Statistics](#understanding-statistics)
- [Filtering Submissions](#filtering-submissions)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Admin Dashboard is your central hub for managing all RMA submissions. It provides:

- Real-time submission tracking
- Device details with IMEI validation
- Status management workflow
- File download capability
- Statistics and metrics
- Return vs Repair analytics

**Dashboard URL**: `https://your-domain.com/admin.html`

---

## Accessing the Dashboard

### 1. Navigate to Admin URL

**Local Development**:
```
http://localhost:3000/admin.html
```

**Production (Railway)**:
```
https://scal-rma-portal.railway.app/admin.html
```

### 2. No Login Required (Current)

The dashboard currently loads automatically without authentication.

**Note**: In production, this should be protected with login credentials. See IT team for access setup.

### 3. Dashboard Loads

Once accessed, the dashboard automatically:
- Fetches all submissions from database
- Calculates statistics
- Displays submission list
- Renders in Pacific Time (Irvine, CA timezone)

---

## Dashboard Overview

### Header Section

```
┌─────────────────────────────────────────────────┐
│  SCal Mobile RMA        [Admin Dashboard]       │
└─────────────────────────────────────────────────┘
```

- **Logo**: SCal Mobile RMA branding
- **Badge**: "Admin Dashboard" indicator

### Statistics Cards (Top Row)

Three main metrics displayed in large cards:

| Card | Shows | Description |
|------|-------|-------------|
| **Total Submissions** | Number | Total RMA submissions received |
| **Total Devices** | Number | Total devices across all RMAs |
| **Our Devices** | X/X (100%) | Devices verified as sold by SCal Mobile |

### Status Breakdown (Second Row)

Three status cards:

| Card | Shows | Description |
|------|-------|-------------|
| **Pending Review** | Number | Submissions in SUBMITTED or PENDING status |
| **Approved** | Number | Approved RMAs |
| **Denied** | Number | Denied RMAs |

### Submissions List

Main table showing all submissions with columns:
1. **Company Name**
2. **Sales Order Number**
3. **Qty to Return** (device count)
4. **Customer Email**
5. **Submitted On** (Pacific Time)
6. **Status** (clickable dropdown)
7. **VIEW button**

---

## Managing Submissions

### Submission List Columns

#### 1. Company Name
- Company submitting the RMA
- Bold text for easy reading
- Example: "Tech Solutions Inc"

#### 2. Sales Order Number
- Original order number from invoice
- Used to match RMA to original sale
- Example: "SO-2025-001"

#### 3. Qty to Return
- Number of devices in this RMA
- Bold, centered display
- Example: "50"

#### 4. Customer Email
- Contact email for this submission
- Used for communication
- Example: "returns@techsolutions.com"

#### 5. Submitted On
- **Date**: MM/DD/YYYY
- **Time**: HH:MM AM/PM
- **Timezone**: Pacific Time (America/Los_Angeles)
- Format Example:
  ```
  11/13/2025
  02:46 PM
  ```

**Important**: All times are displayed in **Pacific Time** (Irvine, CA) regardless of your local timezone.

#### 6. Status Badge
- **Color-coded** for quick identification:
  - **Gray** (SUBMITTED) - Just received
  - **Orange** (PENDING) - Under review
  - **Green** (APPROVED) - Approved for return/repair
  - **Red** (DENIED) - Request denied

- **Clickable** - Opens dropdown to change status
- **Hover effect** - Lifts up slightly on hover

#### 7. VIEW Button
- Blue button matching status badge width
- Opens detailed modal view
- Click to see full submission details

---

## Viewing Submission Details

### Opening Detail Modal

Click either:
1. **VIEW button** in submission row
2. Anywhere on the **submission row** (except status dropdown)

### Modal Structure

#### Header
```
┌─────────────────────────────────────────────────┐
│  Tech Solutions Inc - RMA-1M8X9C2-A3F5     [×]  │
└─────────────────────────────────────────────────┘
```
- Shows company name and reference number
- Click [×] to close

#### Section 1: Submission Information

Displays in two-column grid:

**Row 1**:
- Company Name: Tech Solutions Inc
- Customer Type: US or INTERNATIONAL

**Row 2**:
- Company Email: returns@techsolutions.com
- Submitted: Nov 13, 2025, 10:30 AM

**Row 3**:
- Sales Order Number: SO-2025-001
- Status: Color-coded badge

**Row 4**:
- Reference Number: RMA-1M8X9C2-A3F5
- Total Devices: 50

#### Section 2: Request Breakdown

Three statistics cards showing:

**Returns Requested**:
- Icon: ↩
- Shows: 45/50 (90%)
- Red border

**Repairs Requested**:
- Icon: 🔧
- Shows: 5/50 (10%)
- Green border

**Our Devices**:
- Icon: ✓
- Shows: 50/50 (100%)
- Blue border

#### Section 3: Devices Table

Scrollable table with device details:

| Column | Description | Example |
|--------|-------------|---------|
| **IMEI** | 15-digit IMEI (blue badge) | 357069403525410 |
| **Model** | Device model | iPhone 14 Pro |
| **Storage** | Storage capacity | 256GB |
| **Grade** | Condition grade | B |
| **Issue** | Problem description | Screen crack |
| **Issue Category** | Category type | Physical Damage |
| **Repair/Return** | Action requested | RETURN |
| **Unit Price** | Device value | $750 |
| **Repair Cost** | Repair cost if applicable | $50 |

**Table Features**:
- Sticky header (stays visible when scrolling)
- Zebra striping (alternating row colors)
- Hover highlights entire row
- Bordered cells for clarity

#### Section 4: Uploaded Files

List of files with download buttons:

```
┌─────────────────────────────────────────────────┐
│  [XLSX] devices.xlsx                            │
│  15.42 KB • 50 devices extracted  [Download]    │
├─────────────────────────────────────────────────┤
│  [PDF] invoice.pdf                              │
│  245.8 KB • 0 devices extracted   [Download]    │
└─────────────────────────────────────────────────┘
```

**File Info Shows**:
- File extension in icon
- Original filename
- File size in KB/MB
- Number of devices extracted
- Download button

---

## Changing Status

### Status Workflow

Standard workflow progression:

```
SUBMITTED → PENDING → APPROVED/DENIED
```

### How to Change Status

1. **Locate submission** in the list
2. **Click status badge** (colored pill)
3. **Dropdown menu appears** with 4 options:
   - Submitted
   - Pending
   - Approved
   - Denied
4. **Click desired status**
5. **Status updates immediately**
6. **Database updated** in real-time

### Status Meanings

#### SUBMITTED (Gray)
- **Meaning**: Just received, not yet reviewed
- **Next Step**: Review submission, change to PENDING
- **Action**: None yet

#### PENDING (Orange)
- **Meaning**: Under review by team
- **Next Step**: Complete review, approve or deny
- **Action**: Reviewing device details, verifying order

#### APPROVED (Green)
- **Meaning**: RMA approved, customer can ship devices
- **Next Step**: Wait for devices to arrive
- **Action**: Send approval email to customer (manual for now)

#### DENIED (Red)
- **Meaning**: RMA request denied
- **Next Step**: None
- **Action**: Send denial email with reason (manual for now)

### Status Change Example

**Scenario**: New submission needs review

1. Find submission with status **SUBMITTED** (gray)
2. Click the gray **SUBMITTED** badge
3. Dropdown opens showing:
   ```
   Submitted
   Pending     ← Click this
   Approved
   Denied
   ```
4. Click **Pending**
5. Badge turns **orange** and shows **PENDING**
6. Submission stays selected, review continues

---

## Downloading Files

### Why Download Files?

- Review device details in original spreadsheet
- Verify invoice information
- Check condition photos
- Archive for records

### How to Download

1. **Open submission** (click VIEW or row)
2. **Scroll to** "Uploaded Files" section
3. **Click [Download] button** next to file
4. **File downloads** to your computer
5. **Original filename preserved**

### File Types You'll See

| Type | Icon | Description |
|------|------|-------------|
| **XLSX** | [XLSX] | Excel spreadsheet with device data |
| **CSV** | [CSV] | Comma-separated values |
| **PDF** | [PDF] | Invoice, packing slip, or report |
| **JPG/PNG** | [JPG] | Photos of devices or damage |
| **MP4** | [MP4] | Video of device issues |

### What Happens After Download

- File saved to your **Downloads** folder
- **Filename** matches original upload
- **No changes** made to database
- File can be **re-downloaded** anytime

---

## Understanding Statistics

### Top Statistics

#### Total Submissions
- **What**: Count of all RMA requests received
- **Includes**: All statuses (Submitted, Pending, Approved, Denied)
- **Updates**: Real-time as new submissions arrive

#### Total Devices
- **What**: Sum of all devices across all RMAs
- **Calculation**: Adds up device count from each submission
- **Example**: 3 RMAs with 50, 25, and 10 devices = 85 total

#### Our Devices
- **What**: Percentage of devices verified as sold by SCal Mobile
- **Current**: Always shows 100% (all devices assumed ours)
- **Future**: Will filter by IMEI verification against sales database

### Status Breakdown

#### Pending Review
- **What**: Submissions needing attention
- **Includes**: Both SUBMITTED and PENDING statuses
- **Action**: These need your review

#### Approved
- **What**: RMAs approved for return/repair
- **Status**: Waiting for customer to ship
- **Next Step**: Monitor for receipt

#### Denied
- **What**: RMAs that were rejected
- **Reason**: Typically documented in notes (future feature)
- **Action**: None (customer has been notified)

### Request Breakdown (In Modal)

When viewing a submission, you'll see:

#### Returns Requested
- **Count**: Number of devices to be returned (refunded)
- **Percentage**: % of total devices in this RMA
- **Calculation**: Devices where "Requested Action" = "RETURN"

#### Repairs Requested
- **Count**: Number of devices to be repaired
- **Percentage**: % of total devices in this RMA
- **Calculation**: Devices where "Requested Action" = "REPAIR"

---

## Filtering Submissions

### Filter Buttons

Located above submission list:

```
[All]  [Pending]  [Approved]  [Denied]
```

### How to Filter

1. **Click filter button** you want
2. **Button turns blue** (active state)
3. **List updates** to show only matching submissions
4. **Other buttons** turn gray (inactive)

### Filter Options

#### ALL (Default)
- Shows every submission
- All statuses included
- Most recent at top

#### Pending
- Shows only SUBMITTED and PENDING statuses
- These need your attention
- Use this view for daily review

#### Approved
- Shows only APPROVED submissions
- Customers can ship these
- Use for tracking approved RMAs

#### Denied
- Shows only DENIED submissions
- Requests that were rejected
- Use for reference/history

### Clearing Filter

Click **[All]** button to see everything again.

---

## Common Workflows

### Daily Review Process

**Goal**: Review all new submissions and update statuses

1. **Open dashboard** at start of day
2. **Click [Pending] filter** to see submissions needing review
3. **For each submission**:
   - Click **VIEW** to open details
   - Review devices and files
   - Check IMEI validation
   - Verify against sales records
   - Click status badge → Select **PENDING** or **APPROVED**/**DENIED**
4. **Download files** if needed for records
5. **Email customer** with approval/denial (manual for now)

### Approving an RMA

**Goal**: Approve valid RMA request

1. **Open submission** details
2. **Review checklist**:
   - [ ] Company matches customer database
   - [ ] Order number is valid
   - [ ] Devices were sold by us (verify IMEIs)
   - [ ] Within 45-day window
   - [ ] Device data looks accurate
3. **If all checks pass**:
   - Click status badge
   - Select **APPROVED**
4. **Send approval email to customer** with:
   - RMA reference number
   - Shipping instructions (US: Irvine address, International: prepaid label)
   - 10-day shipping deadline
   - List of approved devices

### Denying an RMA

**Goal**: Reject invalid RMA request

1. **Open submission** details
2. **Identify reason** for denial:
   - Order not found
   - Outside 45-day window
   - Devices not from SCal Mobile
   - Missing required information
3. **Change status** to **DENIED**
4. **Send denial email to customer** with:
   - RMA reference number
   - Clear explanation of reason
   - Next steps (if any)

### Handling Incomplete Submissions

**Goal**: Get missing information from customer

1. **Review submission** details
2. **Identify what's missing**:
   - Invalid/incomplete IMEIs
   - Missing device models
   - No condition grades
   - No files uploaded
3. **Change status** to **PENDING**
4. **Email customer** requesting:
   - Specific information needed
   - Format/template to use
   - Deadline for response
5. **Keep checking** for their reply
6. **Update status** once complete

---

## Troubleshooting

### Dashboard Won't Load

**Symptoms**: Blank page, loading spinner forever

**Causes**:
- Database connection lost
- Network issue
- Server down

**Solutions**:
1. **Refresh page** (F5 or Cmd+R)
2. **Check internet connection**
3. **Try different browser**
4. **Contact IT** if persists

### Submissions Not Showing

**Symptoms**: "No submissions found" message

**Causes**:
- No submissions in database yet
- Filter active with no matches
- Database query error

**Solutions**:
1. **Click [All] filter** to clear filters
2. **Refresh page**
3. **Check console** (F12) for errors
4. **Contact IT** with error message

### Status Won't Change

**Symptoms**: Click status, nothing happens

**Causes**:
- JavaScript error
- API call failed
- Database update error

**Solutions**:
1. **Try again** (might be temporary)
2. **Refresh page** and retry
3. **Check console** (F12) for errors
4. **Contact IT** with:
   - Reference number
   - Status trying to change to
   - Error message (if any)

### File Won't Download

**Symptoms**: Click Download, nothing happens or error

**Causes**:
- File not found on server
- File path incorrect
- Permission issue

**Solutions**:
1. **Try again** (might be network issue)
2. **Right-click → Save As** instead
3. **Check if file exists** in uploads folder
4. **Contact IT** with:
   - Reference number
   - Filename
   - Error message

### Modal Won't Close

**Symptoms**: Can't close submission detail modal

**Solutions**:
1. **Click [×] button** in top-right
2. **Click outside modal** (dark area)
3. **Press ESC key**
4. **Refresh page** if nothing works

### Times Look Wrong

**Symptoms**: Submission times don't match expectation

**Causes**:
- Timezone confusion (all times are Pacific)
- Daylight Saving Time change
- Browser timezone setting

**Solutions**:
1. **Remember**: All times shown in **Pacific Time**
2. **Convert to your timezone** if needed
3. **Check system clock** is accurate
4. **Contact IT** if times are completely off

---

## Best Practices

### Daily Habits

1. **Check dashboard** at least twice daily (morning, afternoon)
2. **Process [Pending] filter** first
3. **Keep status up-to-date** (don't let submissions languish)
4. **Download files** for your records before approving
5. **Email customers promptly** after status changes

### Data Accuracy

1. **Verify IMEIs** against sales database
2. **Double-check order numbers**
3. **Confirm customer email** is correct before sending
4. **Review all devices** in table, not just first few
5. **Check for duplicates** across submissions

### Communication

1. **Use reference number** in all customer communication
2. **Be specific** in approval/denial reasons
3. **Set clear expectations** for shipping deadlines
4. **Respond to customer questions** within 1 business day
5. **Document unusual cases** (note feature coming soon)

---

## Keyboard Shortcuts

Currently no keyboard shortcuts implemented.

**Future Enhancement**: Will add shortcuts for common actions.

---

## Support

### For Admin Dashboard Issues

**Contact**: IT Support
**Email**: tech@scalmob.com

**Include in your message**:
- Screenshot of issue
- Reference number (if specific submission)
- Browser and version
- Steps to reproduce

### For RMA Policy Questions

**Contact**: Operations Manager
**Email**: rma@scalmob.com

---

## Appendix: Status Reference Card

Print this for quick reference:

```
┌─────────────────────────────────────────────────┐
│              RMA STATUS GUIDE                    │
├──────────────┬──────────────────────────────────┤
│  SUBMITTED   │  Just received, not reviewed     │
│  (Gray)      │  Action: Review and triage       │
├──────────────┼──────────────────────────────────┤
│  PENDING     │  Under review                    │
│  (Orange)    │  Action: Complete review         │
├──────────────┼──────────────────────────────────┤
│  APPROVED    │  Approved for return/repair      │
│  (Green)     │  Action: Email customer          │
├──────────────┼──────────────────────────────────┤
│  DENIED      │  Request denied                  │
│  (Red)       │  Action: Email customer w/reason │
└──────────────┴──────────────────────────────────┘
```

---

**Last Updated**: November 2025
**Dashboard Version**: 1.2.0
**For**: SCal Mobile Finance & Operations Teams
