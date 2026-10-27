/**
 * OMAH AKSARA — API RSVP & BUKU TAMU
 * Kompatibel dengan spreadsheet yang sudah ada.
 *
 * Tab wajib:
 * - RSVP: Timestamp, ID, Slug Klien, Nama Tamu, Jumlah Hadir,
 *   Status Kehadiran, Pesan/Doa, Kontak, Sumber, User Agent
 * - Guestbook: Timestamp, ID, Slug Klien, Nama Pengirim, Ucapan,
 *   Status Moderasi, Sumber
 * - Settings: slug, status (dibuat otomatis bila belum ada)
 *
 * Isi Settings dengan slug undangan dan status "published".
 * Ucapan buku tamu langsung disetujui setelah berhasil disimpan.
 */
const DATABASE_ID = "1V37A5smUiF5Ld4uTj7I0kh019QwsWi5gIll1xGKdSVI";
const DATABASE_ID_PROPERTY = "OMAH_AKSARA_DATABASE_ID";
const SHEET_RSVP = "RSVP";
const SHEET_GUESTBOOK = "Guestbook";
const SHEET_SETTINGS = "Settings";

const HEADERS = {
  RSVP: [
    "Timestamp", "ID", "Slug Klien", "Nama Tamu",
    "Jumlah Hadir", "Status Kehadiran", "Pesan/Doa",
    "Kontak", "Sumber", "User Agent"
  ],
  Guestbook: [
    "Timestamp", "ID", "Slug Klien", "Nama Pengirim",
    "Ucapan", "Status Moderasi", "Sumber"
  ],
  Settings: ["slug", "status"]
};

function setupDatabase() {
  const ss = SpreadsheetApp.openById(DATABASE_ID);
  [SHEET_RSVP, SHEET_GUESTBOOK].forEach(function(name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) throw new Error("Tab " + name + " tidak ditemukan.");
    const expected = HEADERS[name];
    const actual = sheet.getRange(1, 1, 1, expected.length).getDisplayValues()[0];
    if (actual.some(function(value, i) {
      return String(value).trim() !== expected[i];
    })) {
      throw new Error("Judul kolom tab " + name + " tidak sesuai. Periksa baris pertama sebelum melanjutkan.");
    }
  });

  let settings = ss.getSheetByName(SHEET_SETTINGS);
  if (!settings) {
    settings = ss.insertSheet(SHEET_SETTINGS);
    settings.appendRow(HEADERS.Settings);
    // Aktifkan slug demo saja. Slug klien lain harus ditambahkan oleh pengelola.
    settings.appendRow(["demo-katalog", "published"]);
  } else if (settings.getLastRow() === 0) {
    settings.appendRow(HEADERS.Settings);
    settings.appendRow(["demo-katalog", "published"]);
  } else {
    const headers = settings.getRange(1, 1, 1, 2).getDisplayValues()[0];
    if (String(headers[0]).trim() !== "slug" || String(headers[1]).trim() !== "status") {
      throw new Error("Judul kolom tab Settings harus: slug, status.");
    }
  }

  PropertiesService.getScriptProperties().setProperty(DATABASE_ID_PROPERTY, DATABASE_ID);
  Logger.log("Koneksi database berhasil: " + ss.getUrl());
  return ss.getUrl();
}

function getDatabase_() {
  const id = PropertiesService.getScriptProperties().getProperty(DATABASE_ID_PROPERTY) || DATABASE_ID;
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  const sheet = getDatabase_().getSheetByName(name);
  if (!sheet) throw new Error("Tab " + name + " tidak ditemukan.");
  return sheet;
}

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = String(params.action || "health");

    if (action === "health") {
      const ss = getDatabase_();
      return output({
        ok: true,
        service: "Omah Aksara RSVP & Guestbook",
        version: 4,
        databaseConfigured: true,
        databaseName: ss.getName()
      });
    }

    if (action === "guestbook") {
      const slug = validSlug(params.slug || "");
      if (!slug) return output({ok: false, message: "Slug tidak valid."});
      if (!isAllowedSlug_(slug) && !registerPublishedSlugIfMissing_(slug)) {
        return output({ok: false, message: "Undangan belum aktif pada backend."});
      }

      const values = getSheet_(SHEET_GUESTBOOK).getDataRange().getValues();
      const items = values.slice(1)
        .filter(function(row) {
          return String(row[2] || "").trim() === slug &&
            String(row[5] || "").trim().toLowerCase() === "disetujui";
        })
        .sort(function(a, b) {
          return new Date(b[0]).getTime() - new Date(a[0]).getTime();
        })
        .slice(0, 30)
        .map(function(row) {
          return {
            name: String(row[3] || ""),
            message: String(row[4] || ""),
            timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || "")
          };
        });
      return output({ok: true, items: items});
    }

    return output({ok: false, message: "Aksi tidak dikenal."});
  } catch (error) {
    console.error(error);
    return output({ok: false, message: "Terjadi kesalahan saat membaca database."});
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const slug = validSlug(payload.slug || "");
    const name = cleanText(payload.name, 100);
    if (!slug || !name) return output({ok: false, message: "Slug atau nama tidak valid."});
    if (!isAllowedSlug_(slug) && !registerPublishedSlugIfMissing_(slug)) {
      return output({ok: false, message: "Undangan belum aktif pada backend."});
    }

    const action = String(payload.action || "");
    if (action === "rsvp") {
      const attendance = String(payload.attendance || "");
      const count = Number(payload.guestCount);
      const guestCount = Number.isFinite(count) ? Math.floor(count) : 1;
      if (["hadir", "tidak_hadir"].indexOf(attendance) < 0) {
        return output({ok: false, message: "Status kehadiran tidak valid."});
      }
      if (guestCount < 1 || guestCount > 10) {
        return output({ok: false, message: "Jumlah tamu harus 1–10."});
      }

      lock.waitLock(10000);
      locked = true;
      getSheet_(SHEET_RSVP).appendRow([
        new Date(), Utilities.getUuid(), slug, name, guestCount, attendance,
        cleanText(payload.message, 500), cleanText(payload.contact, 100),
        "Website", cleanText(payload.userAgent, 300)
      ]);
      return output({ok: true, message: "RSVP tersimpan."});
    }

    if (action === "guestbook") {
      const message = cleanText(payload.message, 500);
      if (!message) return output({ok: false, message: "Ucapan tidak boleh kosong."});

      lock.waitLock(10000);
      locked = true;
      getSheet_(SHEET_GUESTBOOK).appendRow([
        new Date(), Utilities.getUuid(), slug, name, message, "Disetujui", "Website"
      ]);
      return output({ok: true, message: "Ucapan tersimpan dan langsung ditampilkan."});
    }

    return output({ok: false, message: "Aksi tidak dikenal."});
  } catch (error) {
    console.error(error);
    return output({ok: false, message: "Permintaan gagal diproses. Periksa izin dan konfigurasi."});
  } finally {
    if (locked) {
      try { lock.releaseLock(); } catch (ignored) {}
    }
  }
}

/**
 * Daftarkan otomatis slug baru hanya jika data.json publik di GitHub
 * benar-benar ada, slug cocok, dan status undangan = published.
 * Slug yang sudah ada dengan status non-published tidak otomatis diaktifkan.
 */
function registerPublishedSlugIfMissing_(slug) {
  const settings = getSheet_(SHEET_SETTINGS);
  const rows = settings.getDataRange().getValues();

  // Jika slug sudah tercatat, hormati status yang ditetapkan pengelola.
  const existing = rows.slice(1).find(function(row) {
    return String(row[0] || "").trim().toLowerCase() === slug;
  });
  if (existing) {
    return String(existing[1] || "").trim().toLowerCase() === "published";
  }

  const url = "https://raw.githubusercontent.com/omahaksara/invitation/main/clients/" +
    encodeURIComponent(slug) + "/data.json";
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true
  });
  if (response.getResponseCode() !== 200) return false;

  let data;
  try {
    data = JSON.parse(response.getContentText());
  } catch (error) {
    return false;
  }
  if (
    String(data.slug || "").trim().toLowerCase() !== slug ||
    String(data.status || "").trim().toLowerCase() !== "published"
  ) {
    return false;
  }

  // Cek ulang sebelum menulis agar tidak menggandakan slug pada pengiriman bersamaan.
  const latest = settings.getDataRange().getValues();
  const found = latest.slice(1).find(function(row) {
    return String(row[0] || "").trim().toLowerCase() === slug;
  });
  if (found) {
    return String(found[1] || "").trim().toLowerCase() === "published";
  }

  settings.appendRow([slug, "published"]);
  return true;
}

function isAllowedSlug_(slug) {
  const settings = getSheet_(SHEET_SETTINGS).getDataRange().getValues();
  return settings.slice(1).some(function(row) {
    return String(row[0] || "").trim().toLowerCase() === slug &&
      String(row[1] || "").trim().toLowerCase() === "published";
  });
}

function validSlug(value) {
  const slug = String(value || "").trim().toLowerCase();
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
