// Google Apps Script - Paste this in your Google Sheet
// Go to: Extensions > Apps Script, then replace the code with this

// GUEST DATA SHEET - Configure your guest list sheet name here
const GUEST_LIST_SHEET_NAME = 'Guest List'; // Change if your sheet has a different name

function doGet(e) {
  try {
    const invitationId = e.parameter.id;
    if (!invitationId) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Invitation ID required' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let guestSheet = ss.getSheetByName(GUEST_LIST_SHEET_NAME);
    
    if (!guestSheet) {
      guestSheet = ss.getSheets()[0]; // Fall back to first sheet
    }
    
    const data = guestSheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().toLowerCase().trim());
    
    const idIndex = headers.indexOf('id');
    const nameIndex = headers.indexOf('name');
    const paxIndex = headers.indexOf('pax');
    
    if (idIndex === -1 || nameIndex === -1 || paxIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Sheet must have columns: ID, Name, Pax' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex].toString().trim() === invitationId) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            name: data[i][nameIndex].toString(),
            pax: parseInt(data[i][paxIndex]) || 1
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Invitation not found' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Parse the JSON data from the request
    const data = JSON.parse(e.postData.contents);
    
    // Create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Invitation ID',
        'Guest Name',
        'Attendance',
        'Guest Count',
        'Guest Details',
        'Wishes'
      ]);
    }
    
    // Format guest details
    let guestDetailsText = '';
    if (data.guest_details && data.guest_details.length > 0) {
      guestDetailsText = data.guest_details.map(g => `${g.no}. ${g.name} (${g.relation})`).join(' | ');
    }
    
    // Append new row with data
    sheet.appendRow([
      new Date().toLocaleString('id-ID'),
      data.invitation_id || '',
      data.invitation_name || '',
      data.attendance || '',
      data.guest_count || 0,
      guestDetailsText,
      data.wishes || ''
    ]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'RSVP recorded successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
