// Google Apps Script - Paste this in your Google Sheet
// Go to: Extensions > Apps Script, then replace the code with this

// SHEET NAMES - change these if your tabs are named differently
const GUEST_LIST_SHEET_NAME = 'Guest List'; // read-only: ID | Nama | Pax
const RSVP_SHEET_NAME = 'RSVP';             // append-only: Waktu | ID | Nama | Kehadiran | Ucapan

const RSVP_HEADERS = ['Waktu', 'ID', 'Nama', 'Kehadiran', 'Ucapan'];

function jsonOut(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// Looks up an invitation in the guest list.
// Returns { name, pax } or null when the ID is not on the list.
// Throws when the sheet is missing the required columns.
function findGuest(invitationId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const guestSheet = ss.getSheetByName(GUEST_LIST_SHEET_NAME) || ss.getSheets()[0];

  const data = guestSheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().toLowerCase().trim());

  const idIndex = headers.indexOf('id');
  // Accept either the Indonesian or English header for the name column
  const nameIndex = headers.indexOf('nama') !== -1 ? headers.indexOf('nama') : headers.indexOf('name');
  const paxIndex = headers.indexOf('pax');

  if (idIndex === -1 || nameIndex === -1 || paxIndex === -1) {
    throw new Error('Sheet "' + GUEST_LIST_SHEET_NAME + '" must have columns: ID, Nama, Pax');
  }

  const wanted = invitationId.toString().trim();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex].toString().trim() === wanted) {
      return {
        name: data[i][nameIndex].toString(),
        pax: parseInt(data[i][paxIndex]) || 1
      };
    }
  }
  return null;
}

function doGet(e) {
  try {
    const invitationId = e.parameter.id;
    if (!invitationId) {
      return jsonOut({ success: false, error: 'Invitation ID required' });
    }

    const guest = findGuest(invitationId);
    if (!guest) {
      return jsonOut({ success: false, error: 'Invitation not found' });
    }

    return jsonOut({ success: true, name: guest.name, pax: guest.pax });

  } catch (error) {
    return jsonOut({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse(e.postData.contents);
    const invitationId = (data.id || '').toString().trim();

    if (!invitationId) {
      return jsonOut({ success: false, error: 'Invitation ID required' });
    }

    // Re-read the guest from the sheet: the browser can be tampered with,
    // so the name and the pax limit must come from our own data.
    const guest = findGuest(invitationId);
    if (!guest) {
      return jsonOut({ success: false, error: 'Invitation not found' });
    }

    // Clamp attendance to the invitation's allowance
    const requested = parseInt(data.kehadiran);
    const kehadiran = Math.max(0, Math.min(guest.pax, isNaN(requested) ? 0 : requested));

    // Serialise appends so simultaneous submissions cannot collide
    lock.waitLock(30000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let rsvpSheet = ss.getSheetByName(RSVP_SHEET_NAME);
    if (!rsvpSheet) {
      rsvpSheet = ss.insertSheet(RSVP_SHEET_NAME);
    }
    if (rsvpSheet.getLastRow() === 0) {
      rsvpSheet.appendRow(RSVP_HEADERS);
    }

    const waktu = Utilities.formatDate(
      new Date(),
      ss.getSpreadsheetTimeZone(),
      'dd/MM/yyyy HH:mm:ss'
    );

    rsvpSheet.appendRow([
      waktu,
      invitationId,
      guest.name,
      kehadiran,
      (data.ucapan || '').toString()
    ]);

    return jsonOut({
      success: true,
      message: 'RSVP recorded successfully',
      kehadiran: kehadiran
    });

  } catch (error) {
    return jsonOut({ success: false, error: error.toString() });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}
