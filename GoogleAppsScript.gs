// Google Apps Script - Paste this in your Google Sheet
// Go to: Extensions > Apps Script, then replace the code with this

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
