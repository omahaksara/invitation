/**
 * Omah Aksara — Google Apps Script backend.
 * Create this script from Extensions > Apps Script inside the shared spreadsheet.
 * Deploy as Web app: execute as owner; access: anyone.
 */
const SHEET_RSVP = "RSVP";
const SHEET_GUESTBOOK = "Guestbook";
const HEADERS = {
  RSVP: ["timestamp", "slug", "guest_name", "attendance", "guest_count"],
  Guestbook: ["timestamp", "slug", "guest_name", "message"]
};

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || "");
  if (action !== "guestbook") return output({ ok: true, service: "Omah Aksara", version: 1 });
  const slug = validSlug((e.parameter && e.parameter.slug) || "");
  if (!slug) return output({ ok: false, message: "Slug tidak valid." });
  const sheet = getSheet_(SHEET_GUESTBOOK);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return output({ ok: true, items: [] });
  const rows = values.slice(1).filter(row => String(row[1]) === slug)
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .slice(0, 30)
    .map(row => ({ name: String(row[2] || ""), message: String(row[3] || ""), timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || "") }));
  return output({ ok: true, items: rows });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const slug = validSlug(payload.slug || "");
    const name = cleanText(payload.name, 100);
    if (!slug || !name) return output({ ok: false, message: "Slug atau nama tidak valid." });
    lock.waitLock(10000);
    if (payload.action === "rsvp") {
      const attendance = String(payload.attendance || "");
      const guestCount = Math.max(1, Math.min(10, Number(payload.guestCount) || 1));
      if (["hadir", "tidak_hadir"].indexOf(attendance) < 0) return output({ ok: false, message: "Pilihan kehadiran tidak valid." });
      getSheet_(SHEET_RSVP).appendRow([new Date(), slug, name, attendance, guestCount]);
      return output({ ok: true });
    }
    if (payload.action === "guestbook") {
      const message = cleanText(payload.message, 500);
      if (!message) return output({ ok: false, message: "Ucapan tidak boleh kosong." });
      getSheet_(SHEET_GUESTBOOK).appendRow([new Date(), slug, name, message]);
      return output({ ok: true });
    }
    return output({ ok: false, message: "Aksi tidak dikenal." });
  } catch (error) {
    return output({ ok: false, message: "Permintaan gagal diproses." });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function getSheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS[name]);
  return sheet;
}

function validSlug(value) {
  const slug = String(value || "");
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) ? slug : "";
}

function cleanText(value, maxLength) {
  return String(value == null ? "" : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}

function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
