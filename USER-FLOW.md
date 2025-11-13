# SCal Mobile RMA Portal - User Flow

## Visual User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                     LANDING PAGE                            │
│                                                             │
│              ┌─────────────────────┐                        │
│              │   SCAL MOBILE      │                        │
│              │   [Animated Logo]  │                        │
│              └─────────────────────┘                        │
│                                                             │
│                     RETURNS                                 │
│              [Loading Animation Bar]                        │
│                                                             │
│              ┌─────────────────┐                           │
│              │   CONTINUE      │                           │
│              └─────────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ (Click Continue)
┌─────────────────────────────────────────────────────────────┐
│                  CUSTOMER TYPE SELECTION                    │
│   ┌──────────────────────┐   ┌──────────────────────┐     │
│   │    🇺🇸                │   │    🌍                │     │
│   │  US Customer         │   │  International       │     │
│   │                      │   │  Customer            │     │
│   │  Returns shipped to  │   │  Prepaid shipping    │     │
│   │  Irvine, CA          │   │  labels provided     │     │
│   │                      │   │                      │     │
│   │  [Select]            │   │  [Select]            │     │
│   └──────────────────────┘   └──────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ (Select Type)
┌─────────────────────────────────────────────────────────────┐
│                   GUIDELINES DISPLAY                        │
│   [← Change Customer Type]                                  │
│                                                             │
│   ┌───────────────────────────────────────────────────┐   │
│   │ ⚠️ Important: RMAs must be submitted within      │   │
│   │   45 days from invoice date                       │   │
│   └───────────────────────────────────────────────────┘   │
│                                                             │
│   US/International Customers: Returns Process               │
│                                                             │
│   Timeframe                                                 │
│   • 45 days from invoice date                              │
│   • All devices must include IMEI                          │
│                                                             │
│   RMA Submission Process                                    │
│   1. Submit Online RMA Form                                │
│      • Complete and accurate information                   │
│      • Before 45-day deadline                              │
│   2. Review & Approval                                     │
│      • 2 business days review time                         │
│                                                             │
│   [US: Shipping to Irvine, CA address]                    │
│   [International: Prepaid labels provided]                 │
│                                                             │
│   Credit Processing                                         │
│   • Sunday following receipt and validation                │
│                                                             │
│   Questions? rma@scalmob.com                               │
│                                                             │
│   ┌─────────────────────────┐                             │
│   │  Proceed to RMA Form    │                             │
│   └─────────────────────────┘                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ (Proceed)
┌─────────────────────────────────────────────────────────────┐
│                   RMA SUBMISSION FORM                       │
│   [← Back to Guidelines]                                    │
│                                                             │
│   Submit RMA Request                                        │
│                                                             │
│   Company Name: *                                           │
│   ┌─────────────────────────────────────────┐             │
│   │ [Enter company name]                    │             │
│   └─────────────────────────────────────────┘             │
│                                                             │
│   Company Email: *                                          │
│   ┌─────────────────────────────────────────┐             │
│   │ [Enter email address]                   │             │
│   └─────────────────────────────────────────┘             │
│                                                             │
│   Order Number: *                                           │
│   ┌─────────────────────────────────────────┐             │
│   │ [Enter order number]                    │             │
│   └─────────────────────────────────────────┘             │
│                                                             │
│   Quantity to Return: *                                     │
│   ┌─────────────────────────────────────────┐             │
│   │ [Enter quantity]                        │             │
│   └─────────────────────────────────────────┘             │
│                                                             │
│   Upload Supporting Documents: *                            │
│   CSV, XLS, XLSX, PDF, images, or any files               │
│                                                             │
│   ┌─────────────────────────────────────────┐             │
│   │           📤                            │             │
│   │   Drag and drop files here              │             │
│   │           or                            │             │
│   │   [Browse Files]                        │             │
│   └─────────────────────────────────────────┘             │
│                                                             │
│   Files Added:                                              │
│   ┌─────────────────────────────────────────┐             │
│   │ 📄 sample-rma.csv (2.5 KB)   [Remove]  │             │
│   │ 📄 invoice.pdf (145 KB)       [Remove]  │             │
│   └─────────────────────────────────────────┘             │
│                                                             │
│   ┌─────────────────────────────────────────┐             │
│   │       Submit RMA Request                │             │
│   └─────────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ (Submit)
                    [Processing...]
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    SUCCESS SCREEN                           │
│                                                             │
│                    ┌─────┐                                 │
│                    │  ✓  │                                 │
│                    └─────┘                                 │
│                                                             │
│         RMA Request Submitted Successfully                  │
│                                                             │
│   Thank you for submitting your RMA request.               │
│   Our team will review your submission and                 │
│   respond within 2 business days.                          │
│                                                             │
│   Reference Number: RMA-ABC123-XYZ                         │
│                                                             │
│   ┌─────────────────────────┐                             │
│   │ Submit Another Request  │                             │
│   └─────────────────────────┘                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ (New Request)
                   [Returns to Customer Type Selection]
```

## Detailed Step-by-Step Flow

### Step 1: Landing Page (0:00 - 0:05)
**User sees:**
- Animated SCal Mobile logo appearing with fade-in effect
- "RETURNS" title in large letters
- Smooth loading bar animation
- Professional black background with white text

**User action:**
- Observes branding and animation (builds trust)
- Clicks "CONTINUE" button

**System response:**
- Smooth transition to main portal
- Header appears with navigation

---

### Step 2: Customer Type Selection (0:05 - 0:15)
**User sees:**
- Two cards side-by-side (or stacked on mobile)
- US Customer card with 🇺🇸 icon
- International Customer card with 🌍 icon
- Clear descriptions of each option

**User action:**
- Reads both options
- Clicks "Select" on appropriate card

**System response:**
- Stores customer type
- Loads appropriate guidelines
- Smooth transition to guidelines page

---

### Step 3: Guidelines Review (0:15 - 1:00)
**User sees:**
- Prominent warning about 45-day deadline
- Complete process documentation
- Shipping information specific to their customer type
- Contact information

**US Customers see:**
- Ship to Irvine, CA address
- 10-day shipping window after approval

**International Customers see:**
- Prepaid shipping labels will be provided
- Special instructions for international returns

**User action:**
- Reads and understands requirements
- Notes the 45-day deadline
- Reviews shipping instructions
- Clicks "Proceed to RMA Form"

**System response:**
- Maintains customer type selection
- Transitions to form
- Pre-fills customer type field

---

### Step 4: Form Completion (1:00 - 3:00)
**User sees:**
- Clean, professional form
- All required fields marked with *
- File upload area with clear instructions

**User actions:**
1. **Enters company information:**
   - Company Name: "ABC Electronics Inc."
   - Company Email: "returns@abcelectronics.com"

2. **Enters order details:**
   - Order Number: "ORD-20250105-ABC"
   - Quantity: "50"

3. **Uploads files (multiple methods):**
   - **Option A**: Drag CSV file from desktop to upload area
   - **Option B**: Click "Browse Files" and select files
   - **Option C**: Select multiple files at once

4. **Reviews uploaded files:**
   - Sees file names
   - Sees file sizes
   - Can remove files if needed

5. **Submits form:**
   - Clicks "Submit RMA Request"

**System response (during upload):**
- Upload area highlights when files are dragged over
- Files appear in list immediately after selection
- File icons and sizes displayed
- Remove buttons functional

**System response (during submission):**
- Submit button shows loading spinner
- Button disabled to prevent double-submission
- Backend processes files:
  - CSV → Converts to JSON
  - Excel → Converts to JSON + CSV
  - PDF → Extracts text
  - Images → Stores with metadata
- Generates unique reference number
- Saves submission to database/JSON

---

### Step 5: Success Confirmation (3:00 - 3:15)
**User sees:**
- Large green checkmark ✓
- Success message
- Unique reference number (RMA-ABC123-XYZ)
- "Submit Another Request" button

**User action:**
- Notes reference number for future correspondence
- Either:
  - Closes browser (done)
  - Clicks "Submit Another Request" (returns to Step 2)

**System response:**
- Reference number is saved in database
- Files are stored securely
- Submission data is recorded
- (In production) Email sent to customer and admin

---

## Additional User Journeys

### Journey A: FAQ Exploration
**From any page:**
1. User clicks "FAQ" in header navigation
2. Scrolls to FAQ section
3. Clicks FAQ question
4. Reads answer
5. Accordion expands smoothly
6. Can click again to collapse

### Journey B: Guidelines Review
**From any page:**
1. User clicks "Guidelines" in header navigation
2. Scrolls to guidelines section
3. Reads 4 information cards:
   - Timeframe requirements
   - Review process
   - Authorization requirements
   - Credit processing

### Journey C: Contact
**From any page:**
1. User clicks "Contact" in header
2. Opens email client to rma@scalmob.com
3. Or scrolls to footer for additional contact info

### Journey D: Mobile Experience
**Same flow, optimized for mobile:**
1. Touch-friendly button sizes
2. Stacked layouts instead of side-by-side
3. Mobile keyboard optimized inputs
4. Touch drag-and-drop for files
5. Camera access for photo uploads (if enabled)

---

## Backend Processing Flow

```
[User Submits Form]
        ↓
[Server receives POST /api/submit-rma]
        ↓
[Validate required fields]
        ↓
[Process each uploaded file]
        ↓
    ┌───┴───┐
    │ File  │
    │ Type? │
    └───┬───┘
        ↓
┌───────┼───────┐
│       │       │
CSV   Excel   PDF   Image   Video   Other
│       │       │     │       │       │
↓       ↓       ↓     ↓       ↓       ↓
JSON   JSON   Text  Store   Store   Store
+CSV   +CSV
        │
        ↓
[Save processed data]
        ↓
[Generate reference number]
        ↓
[Store submission record]
        ↓
[Send confirmation to client]
        ↓
[(Optional) Send email notification]
        ↓
[Return success response]
```

---

## Error Handling Flows

### Missing Required Field
```
[User clicks Submit]
      ↓
[Form validation fails]
      ↓
[Field highlights in red]
      ↓
[User corrects field]
      ↓
[Red highlight removed]
      ↓
[User submits again]
```

### No Files Uploaded
```
[User clicks Submit with no files]
      ↓
[Alert displays: "Please upload at least one file"]
      ↓
[User adds files]
      ↓
[User submits again]
```

### File Too Large
```
[User drags 20MB file]
      ↓
[Alert displays: "File too large. Max 10MB"]
      ↓
[File not added to list]
      ↓
[User selects smaller file]
```

### Server Error
```
[User submits form]
      ↓
[Server encounters error]
      ↓
[Error alert displays]
      ↓
[Form remains filled]
      ↓
[User can try again]
```

---

## Time Estimates

**Average completion time**: 2-3 minutes

| Step | Time | Details |
|------|------|---------|
| Landing page | 5 sec | Quick branding impression |
| Customer type selection | 10 sec | Easy decision |
| Guidelines review | 30-45 sec | Important reading |
| Form filling | 60-90 sec | Data entry |
| File upload | 10-20 sec | Depends on file size |
| Submission | 2-5 sec | Processing time |
| Success screen | 5 sec | Confirmation |

**First-time users**: 3-4 minutes (reading guidelines carefully)
**Returning users**: 1-2 minutes (skip guidelines, know process)

---

## User Experience Highlights

### What Makes This Flow Great:

1. **Progressive Disclosure**: Information revealed step-by-step
2. **Clear Navigation**: Always know where you are, can go back
3. **Visual Feedback**: Animations confirm actions
4. **Error Prevention**: Validation before submission
5. **Mobile Friendly**: Works on any device
6. **Professional**: Matches SCal Mobile brand
7. **Trust Building**: Clear process, reference numbers
8. **Accessibility**: Keyboard navigation, clear labels
9. **Speed**: Fast loading, no unnecessary steps
10. **Flexibility**: Multiple file upload methods

---

**This user flow has been optimized based on industry best practices from top RMA systems!**
