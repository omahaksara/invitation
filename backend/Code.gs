/**
 * Omah Aksara — Backend RSVP & Buku Tamu.
 *
 * Database baru: "Omah Aksara — Database RSVP & Buku Tamu"
 * Cara pakai:
 * 1. Buat proyek Apps Script baru di script.google.com.
 * 2. Tempel kode ini, lalu simpan.
 * 3. Pilih fungsi setupDatabase lalu tekan Run dan berikan izin Google.
 * 4. Buka Execution log untuk mendapatkan URL spreadsheet baru.
 * 5. Deploy > New deployment > Web app; Execute as: Me.
 * 6. Pilih akses yang memungkinkan tamu undangan mengirim data, lalu Deploy.
 * 7. Uji URL /exec dengan ?action=health sebelum dipakai.
 *
 * Script ini membuat spreadsheet BARU. Tidak menyentuh database RSVP lama.
 */
const DATABASE_NAME = "Omah Aksara — Database RSVP & Buku Tamu";
const DATABASE_ID_PROPERTY = "OMAH_AKSARA_DATABASE_ID";
const SHEET_RSVP = "RSVP";
const SHEET_GUESTBOOK = "Guestbook";
const HEADERS = {
  RSVP: ["timestamp", "slug", "guest_name", "attendance", "guest_count"],
  Guestbook: ["timestamp", "slug", "guest_name", "message"]
};

/**
 * Jalankan SATU KALI secara manual dari editor Apps Script.
 * Membuat spreadsheet baru dan menyimpan ID-nya di Script Properties.
 */
function setupDatabase() {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty(DATABASE_ID_PROPERTY);
  if (existingId) {
    const existing = SpreadsheetApp.openById(existingId);
    Logger.log("Database sudah disiapkan: " + existing.getUrl());
    return existing.getUrl();
  }

  const spreadsheet = SpreadsheetApp.create(DATABASE_NAME);
  const firstSheet = spreadsheet.getSheets()[0];
  firstSheet.setName(SHEET_RSVP);
  firstSheet.appendRow(HEADERS.RSVP);
  const guestbook = spreadsheet.insertSheet(SHEET_GUESTBOOK);
  guestbook.appendRow(HEADERS.Guestbook);
  props.setProperty(DATABASE_ID_PROPERTY, spreadsheet.getId());
  Logger.log("Database Omah Aksara dibuat: " + spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = String(params.action || "health");

  if (action === "health") {
    const database = getDatabase_();
    return output({
      ok: true,
      service: "Omah Aksara RSVP & Guestbook",
      version: 3,
      databaseConfigured: true,
      databaseName: database.getName()
    });
  }

  if (action !== "guestbook") {
    return output({ ok: false, message: "Aksi tidak dikenal." });
  }

  const slug = validSlug(params.slug || "");
  if (!slug) return output({ ok: false, message: "Slug tidak valid." });

  const values = getSheet_(SHEET_GUESTBOOK).getDataRange().getValues();
  if (values.length < 2) return output({ ok: true, items: [] });

  const rows = values.slice(1)
    .filter(row => String(row[1]) === slug)
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .slice(0, 30)
    .map(row => ({
      name: String(row[2] || ""),
      message: String(row[3] || ""),
      timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || "")
    }));

  return output({ ok: true, items: rows });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const slug = validSlug(payload.slug || "");
    const name = cleanText(payload.name, 100);
    if (!slug || !name) {
      return output({ ok: false, message: "Slug atau nama tidak valid." });
    }

    if (payload.action === "rsvp") {
      const attendance = String(payload.attendance || "");
      const guestCountRaw = Number(payload.guestCount);
      const guestCount = Number.isFinite(guestCountRaw) ? Math.floor(guestCountRaw) : 1;
      if (["hadir", "tidak_hadir"].indexOf(attendance) < 0) {
        return output({ ok: false, message: "Pilihan kehadiran tidak valid." });
      }
      if (guestCount < 1 || guestCount > 10) {
        return output({ ok: false, message: "Jumlah tamu harus 1–10." });
      }
      lock.waitLock(10000);
      locked = true;
      getSheet_(SHEET_RSVP).appendRow([new Date(), slug, name, attendance, guestCount]);
      return output({ ok: true, message: "RSVP tersimpan." });
    }

    if (payload.action === "guestbook") {
      const message = cleanText(payload.message, 500);
      if (!message) return output({ ok: false, message: "Ucapan tidak boleh kosong." });
      lock.waitLock(10000);
      locked = true;
      getSheet_(SHEET_GUESTBOOK).appendRow([new Date(), slug, name, message]);
      return output({ ok: true, message: "Ucapan tersimpan." });
    }

    return output({ ok: false, message: "Aksi tidak dikenal." });
  } catch (error) {
    console.error(error);
    return output({ ok: false, message: "Permintaan gagal diproses. Periksa deployment dan izin spreadsheet." });
  } finally {
    if (locked) {
      try { lock.releaseLock(); } catch (ignored) {}
    }
  }
}

function getDatabase_() {
  const id = PropertiesService.getScriptProperties().getProperty(DATABASE_ID_PROPERTY);
  if (!id) throw new Error("Database belum disiapkan. Jalankan setupDatabase() dari editor Apps Script.");
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  const spreadsheet = getDatabase_();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS[name]);
  }
  return sheet;
}

function validSlug(value) {
  const slug = String(value || "");
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) ? slug : "";
}

function cleanText(value, maxLength) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
