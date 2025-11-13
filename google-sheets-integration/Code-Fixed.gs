// ============================================
// SCAL MOBILE RMA - GOOGLE SHEETS INTEGRATION
// ============================================
// CONFIGURATION
// ============================================

var SUPABASE_URL = 'https://pzkyojrrrvmxasiigrkb.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6a3lvanJycnZteGFzaWlncmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5Njc3MTEsImV4cCI6MjA3ODU0MzcxMX0.iaVZVnGXSM4zcGsF1WUVMuRylrE5ks9ANGcvLanONKo';

var SHEET_NAME = 'SUPABASE-IMPORT';
var LAST_SYNC_CELL = 'AA1';

// ============================================
// MAIN SYNC FUNCTIONS
// ============================================

function syncFromSupabase() {
  try {
    var sheet = getOrCreateSheet(SHEET_NAME);

    Logger.log('Starting sync from Supabase...');

    var devices = fetchDevicesWithSubmissions();

    if (!devices || devices.length === 0) {
      Logger.log('No devices found in Supabase');
      return;
    }

    Logger.log('Fetched ' + devices.length + ' devices from Supabase');

    updateSheet(sheet, devices);

    sheet.getRange(LAST_SYNC_CELL).setValue(new Date().toISOString());

    Logger.log('Successfully synced ' + devices.length + ' devices to Google Sheets');

  } catch (error) {
    Logger.log('ERROR: Sync from Supabase failed: ' + error.message);
    Logger.log(error.stack);

    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Sync failed: ' + error.message,
        'Error',
        5
      );
    } catch (e) {
      // Ignore if spreadsheet is not active
    }
  }
}

function syncToSupabase() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      Logger.log('Sheet not found: ' + SHEET_NAME);
      return;
    }

    Logger.log('Starting sync to Supabase...');

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      Logger.log('No data to sync');
      return;
    }

    var headers = data[0];

    var colIndices = {
      deviceId: headers.indexOf('Device ID'),
      actualIssueMatches: headers.indexOf('Issue Matches?'),
      actualCondition: headers.indexOf('Actual Condition'),
      verificationNotes: headers.indexOf('Verification Notes'),
      verifiedBy: headers.indexOf('Verified By')
    };

    if (colIndices.deviceId === -1) {
      throw new Error('Required column "Device ID" not found');
    }

    var updatedCount = 0;
    var errorCount = 0;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var deviceId = row[colIndices.deviceId];
      var verifiedBy = row[colIndices.verifiedBy];

      if (!deviceId || !verifiedBy || String(verifiedBy).trim() === '') {
        continue;
      }

      var verificationData = {
        actual_issue_matches: parseBooleanValue(row[colIndices.actualIssueMatches]),
        actual_condition: String(row[colIndices.actualCondition] || '').trim() || null,
        verification_notes: String(row[colIndices.verificationNotes] || '').trim() || null,
        verified_by: String(verifiedBy).trim(),
        verified_at: new Date().toISOString()
      };

      var success = updateDeviceVerification(deviceId, verificationData);

      if (success) {
        updatedCount++;
        sheet.getRange(i + 1, 1, 1, headers.length).setBackground('#d9ead3');
      } else {
        errorCount++;
        sheet.getRange(i + 1, 1, 1, headers.length).setBackground('#f4cccc');
      }
    }

    Logger.log('Pushed ' + updatedCount + ' verifications to Supabase');
    if (errorCount > 0) {
      Logger.log('WARNING: ' + errorCount + ' rows failed to sync');
    }

    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Synced ' + updatedCount + ' verifications to Supabase' + (errorCount > 0 ? ' (' + errorCount + ' errors)' : ''),
        'Success',
        3
      );
    } catch (e) {
      // Ignore if spreadsheet is not active
    }

  } catch (error) {
    Logger.log('ERROR: Sync to Supabase failed: ' + error.message);
    Logger.log(error.stack);

    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Push failed: ' + error.message,
        'Error',
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

function fetchDevicesWithSubmissions() {
  var url = SUPABASE_URL + '/rest/v1/rma_devices?select=*,rma_submissions(*)&order=created_at.desc&limit=1000';

  var options = {
    method: 'get',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    throw new Error('Supabase API error: ' + statusCode + ' - ' + response.getContentText());
  }

  var devices = JSON.parse(response.getContentText());

  var result = [];
  for (var i = 0; i < devices.length; i++) {
    var device = devices[i];
    var submission = device.rma_submissions || {};

    result.push({
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
      actual_issue_matches: device.actual_issue_matches,
      actual_condition: device.actual_condition,
      verification_notes: device.verification_notes,
      verified_by: device.verified_by,
      verified_at: device.verified_at,
      company_name: submission.company_name,
      company_email: submission.company_email,
      order_number: submission.order_number,
      customer_type: submission.customer_type,
      submission_date: submission.submission_date,
      overall_status: submission.overall_status,
      created_at: device.created_at,
      updated_at: device.updated_at
    });
  }

  return result;
}

function updateDeviceVerification(deviceId, verificationData) {
  var url = SUPABASE_URL + '/rest/v1/rma_devices?id=eq.' + deviceId;

  var options = {
    method: 'patch',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    payload: JSON.stringify(verificationData),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var statusCode = response.getResponseCode();

  if (statusCode !== 204 && statusCode !== 200) {
    Logger.log('Failed to update device ' + deviceId + ': ' + response.getContentText());
    return false;
  }

  return true;
}

// ============================================
// GOOGLE SHEETS FUNCTIONS
// ============================================

function updateSheet(sheet, devices) {
  var headers = [
    'Device ID',
    'Ref #',
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
    'Issue Matches?',
    'Actual Condition',
    'Verification Notes',
    'Verified By',
    'Verified At',
    'Submission Date',
    'Created At',
    'Overall Status'
  ];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol > 0 ? lastCol : headers.length).clear();
  }

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  sheet.setFrozenRows(1);

  if (devices.length === 0) {
    return;
  }

  var rows = [];
  for (var i = 0; i < devices.length; i++) {
    var d = devices[i];
    rows.push([
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
  }

  var dataRange = sheet.getRange(2, 1, rows.length, headers.length);
  dataRange.setValues(rows);

  applyFormatting(sheet, headers, rows.length);

  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

function applyFormatting(sheet, headers, rowCount) {
  if (rowCount === 0) return;

  var issueMatchesCol = headers.indexOf('Issue Matches?') + 1;
  var actualConditionCol = headers.indexOf('Actual Condition') + 1;
  var verifiedByCol = headers.indexOf('Verified By') + 1;

  if (issueMatchesCol > 0) {
    var matchesRange = sheet.getRange(2, issueMatchesCol, rowCount, 1);
    var checkboxRule = SpreadsheetApp.newDataValidation()
      .requireCheckbox('Yes', 'No')
      .setAllowInvalid(false)
      .build();
    matchesRange.setDataValidation(checkboxRule);
  }

  if (actualConditionCol > 0) {
    var conditionRange = sheet.getRange(2, actualConditionCol, rowCount, 1);
    var conditionRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['A Grade', 'B Grade', 'C Grade', 'D Grade', 'Damaged', 'DOA', 'Not As Described'], true)
      .setAllowInvalid(true)
      .build();
    conditionRange.setDataValidation(conditionRule);
  }

  for (var i = 2; i <= rowCount + 1; i++) {
    var needsReview = sheet.getRange(i, headers.indexOf('Needs Review?') + 1).getValue();
    if (needsReview === 'Yes') {
      sheet.getRange(i, 1, 1, headers.length).setBackground('#fff4e5');
    }
  }

  for (var i = 2; i <= rowCount + 1; i++) {
    var verifiedBy = sheet.getRange(i, verifiedByCol).getValue();
    if (!verifiedBy || String(verifiedBy).trim() === '') {
      var bgColor = (i % 2 === 0) ? '#ffffff' : '#f8f9fa';
      sheet.getRange(i, 1, 1, headers.length).setBackground(bgColor);
    }
  }

  var centerAlignCols = ['IMEI Valid?', 'Issue Matches?', 'Approval Status', 'Customer Type', 'Needs Review?'];
  for (var i = 0; i < centerAlignCols.length; i++) {
    var colIndex = headers.indexOf(centerAlignCols[i]) + 1;
    if (colIndex > 0) {
      sheet.getRange(2, colIndex, rowCount, 1).setHorizontalAlignment('center');
    }
  }

  var currencyCols = ['Unit Price', 'Repair Cost'];
  for (var i = 0; i < currencyCols.length; i++) {
    var colIndex = headers.indexOf(currencyCols[i]) + 1;
    if (colIndex > 0) {
      sheet.getRange(2, colIndex, rowCount, 1).setNumberFormat('$#,##0.00');
    }
  }
}

function getOrCreateSheet(sheetName) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    Logger.log('Created new sheet: ' + sheetName);
  }

  return sheet;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function parseBooleanValue(value) {
  if (value === true || value === 'true' || value === 'TRUE' || value === 'Yes' || value === 'YES') {
    return true;
  }
  if (value === false || value === 'false' || value === 'FALSE' || value === 'No' || value === 'NO') {
    return false;
  }
  return null;
}

function formatDate(dateString) {
  if (!dateString) return '';

  try {
    var date = new Date(dateString);
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm');
  } catch (e) {
    return dateString;
  }
}

// ============================================
// MENU & TRIGGERS
// ============================================

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('RMA Sync')
    .addItem('Pull from Supabase', 'syncFromSupabase')
    .addItem('Push to Supabase', 'syncToSupabase')
    .addSeparator()
    .addItem('Setup Auto-Sync', 'setupTriggers')
    .addItem('Remove Auto-Sync', 'deleteTriggers')
    .addSeparator()
    .addItem('View Sync Status', 'showSyncStatus')
    .addToUi();
}

function setupTriggers() {
  deleteTriggers();

  ScriptApp.newTrigger('syncFromSupabase')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log('Created trigger: Pull from Supabase every 1 minute');

  ScriptApp.newTrigger('syncToSupabase')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Created trigger: Push to Supabase every 5 minutes');

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Auto-sync enabled! Pulls every 1 min, pushes every 5 min.',
    'Triggers Set',
    5
  );
}

function deleteTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var count = 0;

  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
    count++;
  }

  Logger.log('Deleted ' + count + ' trigger(s)');

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Deleted ' + count + ' trigger(s). Auto-sync disabled.',
    'Triggers Removed',
    3
  );
}

function showSyncStatus() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var triggers = ScriptApp.getProjectTriggers();

  var lastSync = 'Never';
  if (sheet) {
    var lastSyncValue = sheet.getRange(LAST_SYNC_CELL).getValue();
    if (lastSyncValue) {
      lastSync = formatDate(lastSyncValue);
    }
  }

  var activeTriggers = triggers.length;
  var autoSyncStatus = activeTriggers > 0 ? 'Enabled' : 'Disabled';

  var message = 'RMA SYNC STATUS\n\n' +
                'Last Sync: ' + lastSync + '\n' +
                'Active Triggers: ' + activeTriggers + '\n' +
                'Auto-Sync: ' + autoSyncStatus + '\n\n' +
                'Sheet: ' + SHEET_NAME + '\n' +
                'Supabase: Connected\n\n' +
                (activeTriggers > 0 ? 'Pulling every 1 minute\nPushing every 5 minutes' : 'Use Setup Auto-Sync to enable');

  var ui = SpreadsheetApp.getUi();
  ui.alert('RMA Sync Status', message, ui.ButtonSet.OK);
}
