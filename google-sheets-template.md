# Google Sheets Master Database Template

## Quick Setup Instructions

### 1. Create Your Master Database Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet: **"SCal Mobile RMA Master Database"**
3. Create 3 tabs (sheets) as shown below

### 2. Tab 1: "RMA Submissions"

**Column Headers (Row 1):**

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Reference Number | Company Name | Company Email | Order Number | Quantity | Customer Type | Status | Files Uploaded | Drive Folder Link | Submitted Date | Approval Date | Received Date | Credit Date | Notes | Assigned To |

**Format Row 1:**
- Bold text
- Background color: Light gray (#f3f3f3)
- Freeze row: View → Freeze → 1 row

**Column Widths:**
- A: 150px (Timestamp)
- B: 150px (Reference Number)
- C: 200px (Company Name)
- D: 250px (Company Email)
- E: 150px (Order Number)
- F: 80px (Quantity)
- G: 120px (Customer Type)
- H: 120px (Status)
- I: 300px (Files Uploaded)
- J: 200px (Drive Folder Link)
- K-N: 120px each (Dates)
- O: 250px (Notes)
- P: 150px (Assigned To)

**Data Validation:**
- Column G (Customer Type): List → "US,International"
- Column H (Status): List → "Submitted,Approved,Shipped,Received,Credited,Denied"

**Conditional Formatting:**
- Status = "Submitted": Light yellow background
- Status = "Approved": Light green background
- Status = "Credited": Dark green background
- Status = "Denied": Light red background

### 3. Tab 2: "Device Details"

**Column Headers (Row 1):**

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| RMA Reference | IMEI | Device Model | Issue Description | Condition | Requested Action | Status |

**Format Row 1:**
- Bold text
- Background color: Light blue (#cfe2f3)
- Freeze row: View → Freeze → 1 row

**Column Widths:**
- A: 150px (RMA Reference)
- B: 180px (IMEI)
- C: 150px (Device Model)
- D: 300px (Issue Description)
- E: 100px (Condition)
- F: 150px (Requested Action)
- G: 120px (Status)

**Data Validation:**
- Column E (Condition): List → "Excellent,Very Good,Good,Fair,Poor"
- Column F (Requested Action): List → "Credit,Replacement,Repair"
- Column G (Status): List → "Pending Review,Approved,Denied,Credited"

### 4. Tab 3: "Audit Log"

**Column Headers (Row 1):**

| A | B | C | D | E |
|---|---|---|---|---|
| Action Time | Action Type | RMA Reference | User/System | Details |

**Format Row 1:**
- Bold text
- Background color: Light orange (#fce5cd)
- Freeze row: View → Freeze → 1 row

**Column Widths:**
- A: 150px (Action Time)
- B: 150px (Action Type)
- C: 150px (RMA Reference)
- D: 120px (User/System)
- E: 400px (Details)

### 5. Create Summary Dashboard (Tab 4: "Dashboard")

**Add these formulas:**

```
A2: Total RMAs This Month:
B2: =COUNTIF('RMA Submissions'!K:K,">="&EOMONTH(TODAY(),-1)+1)

A3: Pending Approval:
B3: =COUNTIF('RMA Submissions'!H:H,"Submitted")

A4: Approved Awaiting Ship:
B4: =COUNTIF('RMA Submissions'!H:H,"Approved")

A5: Received This Week:
B5: =COUNTIFS('RMA Submissions'!H:H,"Received",'RMA Submissions'!M:M,">="&TODAY()-7)

A6: Credits Issued This Month:
B6: =COUNTIFS('RMA Submissions'!H:H,"Credited",'RMA Submissions'!N:N,">="&EOMONTH(TODAY(),-1)+1)

A7: Average Processing Time (days):
B7: =AVERAGE('RMA Submissions'!N:N-'RMA Submissions'!K:K)

A8: Total Devices Returned:
B8: =SUM('RMA Submissions'!F:F)
```

**Format Dashboard:**
- Titles (Column A): Bold, font size 11
- Values (Column B): Font size 14, bold
- Add borders around cells
- Background color: Light green for positive metrics

### 6. Share Sheet with Service Account

1. Click **Share** button (top right)
2. Enter the service account email (from google-credentials.json)
   - Format: `something@projectname.iam.gserviceaccount.com`
3. Set permission to **Editor**
4. Uncheck "Notify people"
5. Click **Done**

### 7. Copy Sheet ID

From the URL:
```
https://docs.google.com/spreadsheets/d/1ABC123DEF456GHI789JKL/edit
                                        ^^^^^^^^^^^^^^^^
                                      This is your Sheet ID
```

Add to `.env`:
```
GOOGLE_SHEET_ID=1ABC123DEF456GHI789JKL
```

## Sample Data for Testing

### Sample Row (RMA Submissions):
```
11/11/2025 14:30:00 | RMA-ABC123-XYZ | ABC Electronics | returns@abc.com | ORD-12345 | 50 | US | Submitted | device-list.csv, invoice.pdf | [Link] | 11/11/2025 | | | | Initial submission | John D.
```

### Sample Row (Device Details):
```
RMA-ABC123-XYZ | 356938035643809 | iPhone 13 Pro Max | Screen cracked | Fair | Credit | Pending Review
```

### Sample Row (Audit Log):
```
11/11/2025 14:30:15 | New Submission | RMA-ABC123-XYZ | System | Company: ABC Electronics, Quantity: 50, Files: 2
```

## Formulas for Automation

### Auto-calculate Days Since Submission:
In column Q (add this column):
```
=IF(K2<>"", TODAY()-K2, "")
```

### Auto-flag Overdue RMAs:
In column R (add this column):
```
=IF(AND(H2="Submitted", Q2>2), "⚠️ OVERDUE", "")
```

### Color code by age:
Conditional formatting for column Q:
- Less than 2: Green
- 2-5: Yellow
- Greater than 5: Red

## Pivot Tables

### RMAs by Status:
1. Data → Pivot table
2. Rows: Status
3. Values: COUNTA of Reference Number

### RMAs by Company:
1. Data → Pivot table
2. Rows: Company Name
3. Values: SUM of Quantity, COUNTA of Reference Number

### Monthly Trend:
1. Data → Pivot table
2. Rows: Submitted Date (Group by Month)
3. Values: COUNTA of Reference Number
4. Insert Chart → Line chart

## Google Apps Script (Optional)

Add this script for automatic email notifications:

1. Extensions → Apps Script
2. Paste this code:

```javascript
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;

  // Check if status was changed to "Approved"
  if (sheet.getName() === "RMA Submissions" && range.getColumn() === 8) {
    var newStatus = range.getValue();

    if (newStatus === "Approved") {
      var row = range.getRow();
      var refNumber = sheet.getRange(row, 2).getValue();
      var companyName = sheet.getRange(row, 3).getValue();
      var email = sheet.getRange(row, 4).getValue();

      sendApprovalEmail(email, companyName, refNumber);
    }
  }
}

function sendApprovalEmail(email, companyName, refNumber) {
  var subject = "RMA Approved: " + refNumber;
  var body = "Dear " + companyName + ",\n\n" +
             "Your RMA request " + refNumber + " has been approved.\n\n" +
             "Please ship your devices within 10 days.\n\n" +
             "Thank you,\nSCal Mobile Returns Team";

  MailApp.sendEmail(email, subject, body);
}
```

3. Save and authorize the script

## Mobile Access

Install Google Sheets mobile app to:
- View submissions on the go
- Update status from anywhere
- Add notes and comments
- Quick reference lookup

## Data Export

Export for external analysis:
```
File → Download → CSV (current sheet)
File → Download → Excel (.xlsx)
File → Download → PDF
```

---

**Your master database is now ready to receive live RMA data from the portal!**
