#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DATABASE_ID = '1V37A5smUiF5Ld4uTj7I0kh019QwsWi5gIll1xGKdSVI';
const RSVP_HEADERS = ['Timestamp', 'ID', 'Slug Klien', 'Nama Tamu', 'Jumlah Hadir', 'Status Kehadiran', 'Pesan/Doa', 'Kontak', 'Sumber', 'User Agent'];
const GUESTBOOK_HEADERS = ['Timestamp', 'ID', 'Slug Klien', 'Nama Pengirim', 'Ucapan', 'Status Moderasi', 'Sumber'];

class Sheet {
  constructor(name, rows = []) { this.name = name; this.rows = rows.map(row => row.slice()); }
  setName(name) { this.name = name; return this; }
  appendRow(row) { this.rows.push(row.slice()); return this; }
  getLastRow() { return this.rows.length; }
  getDataRange() { return { getValues: () => this.rows.map(row => row.slice()) }; }
  getRange(row, col, numRows, numCols) {
    return { getDisplayValues: () => Array.from({length:numRows}, (_, ri) =>
      Array.from({length:numCols}, (_, ci) => String((this.rows[row - 1 + ri] || [])[col - 1 + ci] ?? ''))
    ) };
  }
}
class Spreadsheet {
  constructor(name, id, sheets) { this.name = name; this.id = id; this.sheets = sheets; }
  getName() { return this.name; }
  getId() { return this.id; }
  getUrl() { return 'https://docs.google.test/spreadsheets/d/' + this.id; }
  getSheets() { return this.sheets; }
  insertSheet(name) {
    if (this.getSheetByName(name)) throw new Error('Sheet already exists: ' + name);
    const sheet = new Sheet(name); this.sheets.push(sheet); return sheet;
  }
  getSheetByName(name) { return this.sheets.find(sheet => sheet.name === name) || null; }
}

const db = new Spreadsheet('Omah Aksara — Database RSVP & Buku Tamu', DATABASE_ID, [
  new Sheet('RSVP', [RSVP_HEADERS]),
  new Sheet('Guestbook', [GUESTBOOK_HEADERS])
]);
const properties = new Map();
const cacheValues = new Map();
const clientConfigs = new Map([
  ['uji-omah-aksara', { slug: 'uji-omah-aksara', status: 'published', demoMode: false }],
  ['auto-registered-client', { slug: 'auto-registered-client', status: 'published', demoMode: false }],
  ['draft-omah-aksara', { slug: 'draft-omah-aksara', status: 'draft', demoMode: false }],
  ['demo-katalog', { slug: 'demo-katalog', status: 'published', demoMode: true }],
  ['qa-test-oma', { slug: 'qa-test-oma', status: 'published', demoMode: true }]
]);
const spreadsheetApp = { openById(id) { if (id !== DATABASE_ID) throw new Error('Spreadsheet not found: ' + id); return db; } };
const context = {
  console,
  PropertiesService: { getScriptProperties: () => ({
    getProperty: key => properties.get(key) || null,
    setProperty: (key, value) => properties.set(key, value)
  }) },
  SpreadsheetApp: spreadsheetApp,
  CacheService: { getScriptCache: () => ({
    get: key => cacheValues.get(key) || null,
    put: (key, value) => cacheValues.set(key, value)
  }) },
  UrlFetchApp: { fetch: url => {
    const match = url.match(/\/clients\/([^/]+)\/data\.json/);
    const slug = match ? decodeURIComponent(match[1]) : '';
    const config = clientConfigs.get(slug);
    return {
      getResponseCode: () => config ? 200 : 404,
      getContentText: () => config ? JSON.stringify(config) : ''
    };
  } },
  LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
  Utilities: { getUuid: () => 'test-uuid-' + Math.random().toString(36).slice(2) },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput: content => ({ content, mimeType: null,
      setMimeType(type) { this.mimeType = type; return this; },
      getContent() { return this.content; }
    })
  },
  Logger: { log: () => {} }
};
vm.createContext(context);
const source = fs.readFileSync(path.join(__dirname, '..', 'backend', 'Code.gs'), 'utf8');
vm.runInContext(source, context, { filename: 'backend/Code.gs' });

function response(output) {
  assert.equal(output.mimeType, 'application/json');
  return JSON.parse(output.getContent());
}
function post(payload) {
  return response(context.doPost({ postData: { contents: JSON.stringify(payload) } }));
}

const url = context.setupDatabase();
assert.match(url, /^https:\/\/docs\.google\.test\//);
assert.equal(properties.get('OMAH_AKSARA_DATABASE_ID'), DATABASE_ID);
assert.deepEqual(db.getSheets().map(sheet => sheet.name), ['RSVP', 'Guestbook', 'Settings']);
context.setupDatabase();
assert.equal(db.getSheetByName('Settings').getLastRow(), 2, 'setup does not duplicate demo allowlist row');

const settings = db.getSheetByName('Settings');
settings.appendRow(['uji-omah-aksara', 'published']);
settings.appendRow(['draft-omah-aksara', 'draft']);

const health = response(context.doGet({ parameter: { action: 'health' } }));
assert.equal(health.ok, true);
assert.equal(health.databaseConfigured, true);
assert.equal(health.version, 4);

const rsvp = post({ action: 'rsvp', slug: 'uji-omah-aksara', name: 'Tamu Uji', attendance: 'hadir', guestCount: 2 });
assert.equal(rsvp.ok, true);
assert.equal(db.getSheetByName('RSVP').getLastRow(), 2);

const autoRegistered = post({ action: 'rsvp', slug: 'auto-registered-client', name: 'Tamu Baru', attendance: 'hadir', guestCount: 1 });
assert.equal(autoRegistered.ok, true, 'published production slug is automatically registered on first valid submission');
assert.ok(settings.rows.some(row => row[0] === 'auto-registered-client' && row[1] === 'published'),
  'automatic registration adds the published slug to Settings');
assert.ok(db.getSheetByName('RSVP').rows.some(row => row[2] === 'auto-registered-client'),
  'auto-registered RSVP is stored under its own slug');

const guestbook = post({ action: 'guestbook', slug: 'uji-omah-aksara', name: 'Tamu Uji', message: 'Semoga bahagia selalu.' });
assert.equal(guestbook.ok, true);
assert.match(guestbook.message, /langsung ditampilkan/);
assert.equal(db.getSheetByName('Guestbook').getLastRow(), 2);
assert.equal(db.getSheetByName('Guestbook').rows[1][5], 'Disetujui', 'new guestbook entries are immediately approved');

const listed = response(context.doGet({ parameter: { action: 'guestbook', slug: 'uji-omah-aksara' } }));
assert.equal(listed.ok, true);
assert.equal(listed.items.length, 1);
assert.equal(listed.items[0].name, 'Tamu Uji');
assert.equal(listed.items[0].message, 'Semoga bahagia selalu.');

const demoSlug = response(context.doGet({ parameter: { action: 'guestbook', slug: 'demo-katalog' } }));
assert.equal(demoSlug.ok, false, 'demo slug cannot read the production guestbook');
assert.equal(post({ action: 'rsvp', slug: 'demo-katalog', name: 'Demo', attendance: 'hadir', guestCount: 1 }).ok, false,
  'demo slug cannot write RSVP even if an old Settings row exists');
assert.equal(post({ action: 'guestbook', slug: 'qa-test-oma', name: 'Demo', message: 'Not production' }).ok, false,
  'QA demo slug cannot write to the production guestbook');

assert.equal(response(context.doGet({ parameter: { action: 'guestbook', slug: 'draft-omah-aksara' } })).ok, false, 'draft slug cannot read guestbook');
assert.equal(post({ action: 'rsvp', slug: 'draft-omah-aksara', name: 'Tamu Uji', attendance: 'hadir', guestCount: 1 }).ok, false, 'draft slug cannot submit RSVP');
assert.equal(post({ action: 'guestbook', slug: 'slug-tidak-terdaftar', name: 'Tamu Uji', message: 'Uji' }).ok, false, 'unlisted slug cannot submit guestbook');
assert.equal(post({ action: 'rsvp', slug: 'uji-omah-aksara', name: 'Tamu Uji', attendance: 'maybe', guestCount: 1 }).ok, false, 'invalid attendance is rejected');
assert.equal(post({ action: 'rsvp', slug: 'uji-omah-aksara', name: 'Tamu Uji', attendance: 'hadir', guestCount: 11 }).ok, false, 'guest count over limit is rejected');
assert.equal(post({ action: 'guestbook', slug: 'uji-omah-aksara', name: 'Tamu Uji', message: '   ' }).ok, false, 'empty guestbook message is rejected');

console.log('PASS backend unit tests: existing schema, setup, health, RSVP, immediate guestbook publication, slug isolation, allowlist, and validation.');
