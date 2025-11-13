// ============================================
// SCAL MOBILE RMA - GOOGLE SHEETS INTEGRATION
// ============================================
// Purpose: Sync RMA data from Supabase to Google Sheets for return specialist verification
// Sheet Name: SUPABASE-IMPORT
// Auto-refresh: Every 1 minute (pull from Supabase), Every 5 minutes (push to Supabase)
// ============================================

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://pzkyojrrrvmxasiigrkb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6a3lvanJycnZteGFzaWlncmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5Njc3MTEsImV4cCI6MjA3ODU0MzcxMX0.iaVZVnGXSM4zcGsF1WUVMuRylrE5ks9ANGcvLanONKo';

const SHEET_NAME = 'SUPABASE-IMPORT';
const LAST_SYNC_CELL = 'AA1'; // Hidden cell to track last sync timestamp

// ============================================
// MAIN SYNC FUNCTIONS
// ============================================

/**
 * Pull data from Supabase and update Google Sheets
 * Runs automatically every 1 minute via time-driven trigger
 */
function syncFromSupabase() {
  try {
    const sheet = getOrCreateSheet(SHEET_NAME);

    Logger.log('🔽 Starting sync from Supabase...');

    // Fetch all devices with their submission info using Supabase's embedded resources
    const devices = fetchDevicesWithSubmissions();

    if (!devices || devices.length === 0) {
      Logger.log('ℹ️  No devices found in Supabase');
      return;
    }

    Logger.log(`📦 Fetched ${devices.length} devices from Supabase`);

    // Update the sheet with fresh data
    updateSheet(sheet, devices);

    // Update last sync timestamp
    sheet.getRange(LAST_SYNC_CELL).setValue(new Date().toISOString());

    Logger.log(`✅ Successfully synced ${devices.length} devices to Google Sheets`);

  } catch (error) {
    Logger.log(`❌ Sync from Supabase failed: ${error.message}`);
    Logger.log(error.stack);

    // Show error notification in sheet (non-blocking)
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Sync failed: ${error.message}`,
        '❌ Error',
        5
      );
    } catch (e) {
      // Ignore if spreadsheet is not active
    }
  }
}

/**
 * Push verification data back to Supabase
 * Runs automatically every 5 minutes OR manually via menu
 */
function syncToSupabase() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      Logger.log('⚠️  Sheet not found: ' + SHEET_NAME);
      return;
    }

    Logger.log('🔼 Starting sync to Supabase...');

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      Logger.log('ℹ️  No data to sync');
      return;
    }

    const headers = data[0];

    // Find column indices
    const colIndices = {
      deviceId: headers.indexOf('Device ID'),
      actualIssueMatches: headers.indexOf('✅ Issue Matches?'),
      actualCondition: headers.indexOf('Actual Condition'),
      verificationNotes: headers.indexOf('Verification Notes'),
      verifiedBy: headers.indexOf('Verified By')
    };

    // Validate required columns exist
    if (colIndices.deviceId === -1) {
      throw new Error('Required column "Device ID" not found');
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Process each row (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const deviceId = row[colIndices.deviceId];
      const verifiedBy = row[colIndices.verifiedBy];

      // Only sync rows that have been verified (has verifiedBy)
      if (!deviceId || !verifiedBy || String(verifiedBy).trim() === '') {
        continue;
      }

      const verificationData = {
        actual_issue_matches: parseBooleanValue(row[colIndices.actualIssueMatches]),
        actual_condition: String(row[colIndices.actualCondition] || '').trim() || null,
        verification_notes: String(row[colIndices.verificationNotes] || '').trim() || null,
        verified_by: String(verifiedBy).trim(),
        verified_at: new Date().toISOString()
      };

      const success = updateDeviceVerification(deviceId, verificationData);

      if (success) {
        updatedCount++;
        // Mark row as synced with green background
        sheet.getRange(i + 1, 1, 1, headers.length).setBackground('#d9ead3');
      } else {
        errorCount++;
        // Mark row with error (light red background)
        sheet.getRange(i + 1, 1, 1, headers.length).setBackground('#f4cccc');
      }
    }

    Logger.log(`✅ Pushed ${updatedCount} verifications to Supabase`);
    if (errorCount > 0) {
      Logger.log(`⚠️  ${errorCount} rows failed to sync`);
    }

    // Show success notification
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Synced ${updatedCount} verifications to Supabase` + (errorCount > 0 ? ` (${errorCount} errors)` : ''),
        '✅ Success',
        3
      );
    } catch (e) {
      // Ignore if spreadsheet is not active
    }

  } catch (error) {
    Logger.log(`❌ Sync to Supabase failed: ${error.message}`);
    Logger.log(error.stack);

    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Push failed: ${error.message}`,
        '❌ Error',
        5
      );
    } catch (e) {
      // Ignore if spreadsheet is not active
    }
  }
}

// ============================================
// SUPABASE REST API FUNCTIONS
// ============================================

/**
 * Fetch all devices with their submission info using Supabase embedded resources
 */
function fetchDevicesWithSubmissions() {
  // Use Supabase's embedded resources to join rma_devices with rma_submissions
  // This gives us all device fields + submission fields in one query
  const url = `${SUPABASE_URL}/rest/v1/rma_devices?select=*,rma_submissions(*)&order=created_at.desc&limit=1000`;

  const options = {
    method: 'get',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    throw new Error(`Supabase API error: ${statusCode} - ${response.getContentText()}`);
  }

  const devices = JSON.parse(response.getContentText());

  // Flatten the nested submission data
  return devices.map(device => {
    const submission = device.rma_submissions || {};
    return {
      // Device fields
      device_id: device.id,
      submission_id: device.submission_id,
      reference_number: device.reference_number,
      imei: device.imei,
      imei_original: device.imei_original,
      imei_valid: device.imei_valid,
      model: device.model,
      storage: device.storage,
      condition: device.condition,
      device_status: device.device_status,
      inv: device.inv,
      issue_description: device.issue_description,
      issue_category: device.issue_category,
      requested_action: device.requested_action,
      action_type: device.action_type,
      unit_price: device.unit_price,
      repair_cost: device.repair_cost,
      approval_status: device.approval_status,
      requires_imei_review: device.requires_imei_review,

      // Verification fields (to be filled by return specialists)
      actual_issue_matches: device.actual_issue_matches,
      actual_condition: device.actual_condition,
      verification_notes: device.verification_notes,
      verified_by: device.verified_by,
      verified_at: device.verified_at,

      // Submission fields (from joined table)
      company_name: submission.company_name,
      company_email: submission.company_email,
      order_number: submission.order_number,
      customer_type: submission.customer_type,
      submission_date: submission.submission_date,
      overall_status: submission.overall_status,

      // Timestamps
      created_at: device.created_at,
      updated_at: device.updated_at
    };
  });
}

/**
 * Update device verification data in Supabase
 */
function updateDeviceVerification(deviceId, verificationData) {
  const url = `${SUPABASE_URL}/rest/v1/rma_devices?id=eq.${deviceId}`;

  const options = {
    method: 'patch',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    payload: JSON.stringify(verificationData),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 204 && statusCode !== 200) {
    Logger.log(`⚠️  Failed to update device ${deviceId}: ${response.getContentText()}`);
    return false;
  }

  return true;
}

// ============================================
// GOOGLE SHEETS FUNCTIONS
// ============================================

/**
 * Update sheet with device data
 */
function updateSheet(sheet, devices) {
  // Define column headers
  const headers = [
    'Device ID',
    'RMA #',
    'Company Name',
    'Company Email',
    'Order #',
    'Customer Type',
    'IMEI',
    'IMEI Original',
    'IMEI Valid?',
    'Model',
    'Storage',
    'Customer Condition',
    'Customer Issue',
    'Issue Category',
    'Action Requested',
    'Unit Price',
    'Repair Cost',
    'Approval Status',
    'Needs Review?',
    '✅ Issue Matches?',
    'Actual Condition',
    'Verification Notes',
    'Verified By',
    'Verified At',
    'Submission Date',
    'Created At',
    'Overall Status'
  ];

  // Clear existing data (except header if it exists)
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol > 0 ? lastCol : headers.length).clear();
  }

  // Set or update headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  sheet.setFrozenRows(1);

  if (devices.length === 0) {
    return;
  }

  // Prepare data rows
  const rows = devices.map(d => [
    d.device_id || '',
    d.reference_number || '',
    d.company_name || '',
    d.company_email || '',
    d.order_number || '',
    (d.customer_type || '').toUpperCase(),
    d.imei || '',
    d.imei_original || '',
    d.imei_valid ? 'Yes' : 'No',
    d.model || '',
    d.storage || '',
    d.condition || '',
    d.issue_description || '',
    d.issue_category || '',
    d.requested_action || '',
    d.unit_price || 0,
    d.repair_cost || 0,
    d.approval_status || 'PENDING',
    d.requires_imei_review ? 'Yes' : 'No',
    d.actual_issue_matches === true ? 'Yes' : (d.actual_issue_matches === false ? 'No' : ''),
    d.actual_condition || '',
    d.verification_notes || '',
    d.verified_by || '',
    d.verified_at ? formatDate(d.verified_at) : '',
    d.submission_date ? formatDate(d.submission_date) : '',
    d.created_at ? formatDate(d.created_at) : '',
    d.overall_status || 'SUBMITTED'
  ]);

  // Write data to sheet
  const dataRange = sheet.getRange(2, 1, rows.length, headers.length);
  dataRange.setValues(rows);

  // Apply formatting
  applyFormatting(sheet, headers, rows.length);

  // Auto-resize columns for better readability
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

/**
 * Apply formatting to the sheet
 */
function applyFormatting(sheet, headers, rowCount) {
  if (rowCount === 0) return;

  // Find column indices
  const issueMatchesCol = headers.indexOf('✅ Issue Matches?') + 1;
  const actualConditionCol = headers.indexOf('Actual Condition') + 1;
  const verifiedByCol = headers.indexOf('Verified By') + 1;
  const imeiValidCol = headers.indexOf('IMEI Valid?') + 1;
  const approvalStatusCol = headers.indexOf('Approval Status') + 1;

  // Add checkbox validation for "Issue Matches?" column
  if (issueMatchesCol > 0) {
    const matchesRange = sheet.getRange(2, issueMatchesCol, rowCount, 1);
    const checkboxRule = SpreadsheetApp.newDataValidation()
      .requireCheckbox('Yes', 'No')
      .setAllowInvalid(false)
      .build();
    matchesRange.setDataValidation(checkboxRule);
  }

  // Add dropdown for "Actual Condition" column
  if (actualConditionCol > 0) {
    const conditionRange = sheet.getRange(2, actualConditionCol, rowCount, 1);
    const conditionRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['A Grade', 'B Grade', 'C Grade', 'D Grade', 'Damaged', 'DOA', 'Not As Described'], true)
      .setAllowInvalid(true)
      .build();
    conditionRange.setDataValidation(conditionRule);
  }

  // Highlight rows that need IMEI review
  for (let i = 2; i <= rowCount + 1; i++) {
    const needsReview = sheet.getRange(i, headers.indexOf('Needs Review?') + 1).getValue();
    if (needsReview === 'Yes') {
      sheet.getRange(i, 1, 1, headers.length).setBackground('#fff4e5'); // Light orange
    }
  }

  // Apply alternating row colors for unverified rows
  for (let i = 2; i <= rowCount + 1; i++) {
    const verifiedBy = sheet.getRange(i, verifiedByCol).getValue();
    if (!verifiedBy || String(verifiedBy).trim() === '') {
      // Unverified rows - alternating white/light gray
      const bgColor = (i % 2 === 0) ? '#ffffff' : '#f8f9fa';
      sheet.getRange(i, 1, 1, headers.length).setBackground(bgColor);
    }
  }

  // Center align certain columns
  const centerAlignCols = ['IMEI Valid?', '✅ Issue Matches?', 'Approval Status', 'Customer Type', 'Needs Review?'];
  centerAlignCols.forEach(colName => {
    const colIndex = headers.indexOf(colName) + 1;
    if (colIndex > 0) {
      sheet.getRange(2, colIndex, rowCount, 1).setHorizontalAlignment('center');
    }
  });

  // Format currency columns
  const currencyCols = ['Unit Price', 'Repair Cost'];
  currencyCols.forEach(colName => {
    const colIndex = headers.indexOf(colName) + 1;
    if (colIndex > 0) {
      sheet.getRange(2, colIndex, rowCount, 1).setNumberFormat('$#,##0.00');
    }
  });
}

/**
 * Get or create sheet with given name
 */
function getOrCreateSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    Logger.log(`✨ Created new sheet: ${sheetName}`);
  }

  return sheet;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Parse boolean values from various formats
 */
function parseBooleanValue(value) {
  if (value === true || value === 'true' || value === 'TRUE' || value === 'Yes' || value === 'YES') {
    return true;
  }
  if (value === false || value === 'false' || value === 'FALSE' || value === 'No' || value === 'NO') {
    return false;
  }
  return null;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm');
  } catch (e) {
    return dateString;
  }
}

// ============================================
// MENU & TRIGGERS
// ============================================

/**
 * Add custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔄 RMA Sync')
    .addItem('🔽 Pull from Supabase', 'syncFromSupabase')
    .addItem('🔼 Push to Supabase', 'syncToSupabase')
    .addSeparator()
    .addItem('⚙️ Setup Auto-Sync (1min pull / 5min push)', 'setupTriggers')
    .addItem('🗑️ Remove Auto-Sync', 'deleteTriggers')
    .addSeparator()
    .addItem('📊 View Sync Status', 'showSyncStatus')
    .addToUi();
}

/**
 * Setup automatic time-driven triggers
 */
function setupTriggers() {
  // Delete existing triggers first to avoid duplicates
  deleteTriggers();

  // Create trigger to pull from Supabase every 1 minute
  ScriptApp.newTrigger('syncFromSupabase')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log('✅ Created trigger: Pull from Supabase every 1 minute');

  // Create trigger to push to Supabase every 5 minutes
  ScriptApp.newTrigger('syncToSupabase')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('✅ Created trigger: Push to Supabase every 5 minutes');

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Auto-sync enabled!\n\n• Pulls from Supabase every 1 minute\n• Pushes to Supabase every 5 minutes',
    '✅ Triggers Set',
    8
  );
}

/**
 * Delete all project triggers
 */
function deleteTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let count = 0;

  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
    count++;
  });

  Logger.log(`🗑️  Deleted ${count} trigger(s)`);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Deleted ${count} trigger(s). Auto-sync disabled.`,
    '🗑️ Triggers Removed',
    3
  );
}

/**
 * Show sync status dialog
 */
function showSyncStatus() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const triggers = ScriptApp.getProjectTriggers();

  let lastSync = 'Never';
  if (sheet) {
    const lastSyncValue = sheet.getRange(LAST_SYNC_CELL).getValue();
    if (lastSyncValue) {
      lastSync = formatDate(lastSyncValue);
    }
  }

  const activeTriggers = triggers.length;
  const autoSyncStatus = activeTriggers > 0 ? '✅ Enabled' : '❌ Disabled';

  const message = `
📊 RMA SYNC STATUS

Last Sync: ${lastSync}
Active Triggers: ${activeTriggers}
Auto-Sync: ${autoSyncStatus}

Sheet: ${SHEET_NAME}
Supabase: Connected

${activeTriggers > 0 ? '• Pulling every 1 minute\n• Pushing every 5 minutes' : 'Use "Setup Auto-Sync" to enable automatic syncing'}
  `;

  const ui = SpreadsheetApp.getUi();
  ui.alert('🔄 RMA Sync Status', message, ui.ButtonSet.OK);
}
