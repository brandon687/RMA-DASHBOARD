# Operations Manual

**SCal Mobile RMA Portal - Standard Operating Procedures**

SOP-style manual for daily operations, maintenance, and troubleshooting.

---

## Daily Operations

### Morning Routine (9:00 AM PT)

**Time Required**: 15-30 minutes

1. **Open Admin Dashboard**
   - URL: https://scal-rma-portal.railway.app/admin.html
   - Verify page loads correctly
   - Check statistics are populated

2. **Review New Submissions**
   - Click [Pending] filter
   - Count new submissions since yesterday
   - Note any urgent requests

3. **Triage Submissions**
   - For each new submission:
     - Open details (click VIEW)
     - Quick scan of devices and files
     - Flag for detailed review or immediate action
     - Change status to PENDING if needs review

4. **Check for Issues**
   - Invalid IMEIs
   - Missing information
   - Incomplete files
   - Orders outside 45-day window

---

### Submission Review Process

**Goal**: Complete within 2 business days of submission

#### Step 1: Open Submission

1. Click [Pending] filter
2. Select submission to review
3. Click VIEW to open details

#### Step 2: Verify Company Information

- [ ] Company name matches customer database
- [ ] Email address is valid
- [ ] Order number exists in sales system
- [ ] Customer type (US/International) is correct

**If invalid**: Change status to DENIED, email customer

#### Step 3: Review Devices

- [ ] IMEIs are valid (15 digits, start with 35)
- [ ] Models match what we sell
- [ ] Conditions are reasonable
- [ ] Issues are clearly described
- [ ] Repair/Return choices make sense

**Check IMEI Validation**:
- Look for red badges (invalid IMEIs)
- Review any validation warnings
- Cross-reference with sales database

**If devices need clarification**: Email customer requesting details

#### Step 4: Verify Timeline

- [ ] Submission within 45 days of invoice date
- [ ] Order date matches system

**If outside window**: Escalate to manager for exception approval

#### Step 5: Download and Review Files

- [ ] Download Excel file
- [ ] Verify data matches what's in system
- [ ] Check invoice if provided
- [ ] Review any photos/videos

**If files are missing or incomplete**: Email customer

#### Step 6: Make Decision

**If Approved**:
1. Change status to APPROVED
2. Send approval email (see template below)
3. Note shipping deadline (10 days from approval)

**If Denied**:
1. Change status to DENIED
2. Document reason internally
3. Send denial email with clear explanation

**If More Info Needed**:
1. Keep status as PENDING
2. Email customer with specific requests
3. Set follow-up reminder

---

### Afternoon Check (2:00 PM PT)

**Time Required**: 10-15 minutes

1. **Check for Customer Responses**
   - Review emails from customers
   - Update submissions with new information
   - Move PENDING to APPROVED/DENIED if ready

2. **Update Status Dashboard**
   - Ensure all reviewed submissions have correct status
   - Clear any stuck in SUBMITTED status

3. **Monitor Approved RMAs**
   - Check if shipping deadlines approaching
   - Send reminders if needed (7 days after approval)

---

## Email Templates

### Approval Email

```
Subject: RMA Approved - [REFERENCE_NUMBER]

Dear [COMPANY_NAME],

Your RMA request has been approved!

Reference Number: [REFERENCE_NUMBER]
Approved Devices: [COUNT]
Approval Date: [DATE]

[IF US CUSTOMER]
SHIPPING INSTRUCTIONS:
Please ship your devices to:

SCal Mobile
8583 Irvine Center Dr., #214
Irvine, CA 92618

You must ship within 10 days of this approval (by [DEADLINE_DATE]).

[IF INTERNATIONAL CUSTOMER]
SHIPPING INSTRUCTIONS:
A prepaid shipping label has been attached to this email. Please print and affix it to your package.

You must ship within 10 days of receiving this label (by [DEADLINE_DATE]).

PACKING REQUIREMENTS:
- Use bubble bags or protective wrapping for each device
- Pack in partition-style box or with adequate cushioning
- Include reference number [REFERENCE_NUMBER] on box exterior
- Send tracking number to rma@scalmob.com once shipped

CREDIT PROCESSING:
Credits are processed on Sundays following device receipt and verification.

Questions? Reply to this email.

Best regards,
SCal Mobile RMA Team
rma@scalmob.com
```

### Denial Email

```
Subject: RMA Status - [REFERENCE_NUMBER]

Dear [COMPANY_NAME],

Thank you for submitting RMA request [REFERENCE_NUMBER].

After review, we are unable to approve this request for the following reason(s):

[REASON - Examples:]
- Order number not found in our system
- Submission is outside the 45-day return window
- Devices do not match our sales records
- Incomplete device information

[IF NEXT STEPS AVAILABLE]
NEXT STEPS:
[Explain what customer can do to resolve]

[IF NO NEXT STEPS]
Unfortunately, we cannot process this RMA at this time.

If you have questions or believe this is in error, please contact us at rma@scalmob.com with your reference number.

Best regards,
SCal Mobile RMA Team
rma@scalmob.com
```

### Request for Information

```
Subject: Additional Information Needed - [REFERENCE_NUMBER]

Dear [COMPANY_NAME],

We're reviewing your RMA request [REFERENCE_NUMBER] and need additional information:

[SPECIFIC REQUESTS - Examples:]
- Please provide complete IMEIs (15 digits) for devices #5, #12, #18
- Missing original sales order number - please provide
- Device models are incomplete - please clarify storage capacities
- Uploaded file is unreadable - please resend in Excel or CSV format

Please provide this information by [DATE - 2 business days from now] to avoid delays.

Reply to this email with the requested details.

Questions? Call us at [PHONE] or reply to this email.

Best regards,
SCal Mobile RMA Team
rma@scalmob.com
```

---

## Weekly Tasks

### Every Monday

1. **Review Weekend Submissions**
   - Check for any submissions received Saturday/Sunday
   - Triage and assign for review

2. **Update Credit Schedule**
   - Verify which approved RMAs shipped last week
   - Prepare list for Sunday credit processing

### Every Friday

1. **Week-End Summary**
   - Count submissions received this week
   - Count submissions approved/denied
   - Note any pending that need follow-up
   - Email summary to manager

2. **Shipping Deadline Reminders**
   - Check approved RMAs approaching 10-day deadline
   - Send reminder emails (see template)

---

## Monthly Tasks

### First Monday of Month

1. **Generate Monthly Report**
   - Total submissions
   - Total devices
   - Approval rate
   - Average processing time
   - Common denial reasons

2. **Database Cleanup**
   - Archive old submissions (optional)
   - Verify backups are current

---

## Troubleshooting

### Submission Missing from Dashboard

**Problem**: Customer says they submitted, but not in dashboard

**Steps**:
1. Check spam/junk folder for confirmation email from system
2. Search database directly (Supabase dashboard)
3. Check server logs (Railway dashboard)
4. Ask customer for reference number or screenshot
5. If truly missing, have customer resubmit

### File Won't Download

**Problem**: Click Download, nothing happens

**Steps**:
1. Verify file exists in uploads folder
2. Check file path in database
3. Try direct URL: `/api/admin/download/[REF]/[FILE_ID]`
4. Check Railway logs for errors
5. If file missing, request from customer

### Status Won't Change

**Problem**: Click status dropdown, doesn't update

**Steps**:
1. Refresh page, try again
2. Check browser console for errors (F12)
3. Verify database connection (Railway dashboard)
4. Try different browser
5. Update status directly in Supabase dashboard as workaround
6. Contact IT

### Invalid IMEIs

**Problem**: Many devices showing invalid IMEIs

**Steps**:
1. Download original Excel file
2. Check if IMEIs are in scientific notation (Excel issue)
3. If customer error: Email customer for corrected file
4. If system error: Contact IT to check extraction

### Portal Down

**Problem**: Portal not loading

**Steps**:
1. Check Railway dashboard (https://railway.app)
2. Verify deployment is active
3. Check for recent deployments that may have caused issues
4. Review Railway logs for errors
5. Contact IT immediately
6. Inform customers via email if extended outage

---

## Escalation Procedures

### When to Escalate

**To Operations Manager**:
- RMA outside 45-day window (needs exception approval)
- Large RMA (>100 devices)
- Customer dispute
- Unusual circumstances

**To IT/Development**:
- Portal technical issues
- Database errors
- File processing failures
- Integration issues (Google Sheets/Drive)

**To Finance**:
- Credit disputes
- Pricing questions
- Invoice discrepancies

### How to Escalate

1. **Email** appropriate party with:
   - RMA reference number
   - Description of issue
   - Screenshots if applicable
   - Your recommendation (if any)

2. **Document** in submission notes (future feature)

3. **Follow up** within 24 hours if no response

---

## Environment Variable Management

### Critical Variables

Located in Railway dashboard → Variables tab:

```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[key]
NODE_ENV=production
PORT=3000
```

**Never change** these without IT guidance.

### Updating Variables

If IT instructs you to update:

1. Go to Railway dashboard
2. Click on service
3. Go to Variables tab
4. Edit variable
5. Save
6. Redeploy if necessary

---

## Backup Procedures

### Daily Automatic Backup

**Supabase** automatically backs up database.

**Retention**: 7 days on free tier, 30 days on pro

### Manual Backup

**When**: Before major changes or monthly

**How**:
1. Go to Supabase dashboard
2. SQL Editor
3. Run backup queries (see DATABASE-SCHEMA.md)
4. Save results to secure location

### File Storage Backup

**When**: Weekly

**How**:
1. Download /uploads/ folder from Railway
2. Store in company backup location
3. Verify backup completed successfully

---

## Monitoring

### Daily Checks

- [ ] Dashboard loads
- [ ] Submissions appearing
- [ ] Files downloading
- [ ] Status changes working

### Weekly Checks

- [ ] Database connection stable
- [ ] File storage not full
- [ ] Email delivery working
- [ ] No errors in Railway logs

### Monthly Checks

- [ ] SSL certificate valid
- [ ] Backups running
- [ ] Performance acceptable
- [ ] Storage within limits

---

## Contact List

**Operations Manager**: operations@scalmob.com
**IT Support**: tech@scalmob.com
**Finance**: finance@scalmob.com
**RMA General**: rma@scalmob.com

**Railway Dashboard**: https://railway.app
**Supabase Dashboard**: https://supabase.com/dashboard

---

## Version History

- **1.2.0** (Current): Admin dashboard, status management
- **1.1.0**: Google Sheets integration
- **1.0.0**: Initial release

---

**Last Updated**: November 2025
**For**: SCal Mobile Operations Team
