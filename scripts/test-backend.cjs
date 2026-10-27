#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Sheet {
  constructor(name) { this.name = name; this.rows = []; }
  setName(name) { this.name = name; return this; }
  appendRow(row) { this.rows.push(row.slice()); return this; }
  getLastRow() { return this.rows.length; }
  getDataRange() {
    return { getValues: () => this.rows.map(row => row.slice()) };
  }
}

class Spreadsheet {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.sheets = [new Sheet('Sheet1')];
  }
  getName() { return this.name; }
  getId() { return this.id; }
  getUrl() { return 'https://docs.google.test/spreadsheets/d/' + this.id; }
  getSheets() { return this.sheets; }
  insertSheet(name) {
    if (this.getSheetByName(name)) throw new Error('Sheet already exists: ' + name);
    const sheet = new Sheet(name);
    this.sheets.push(sheet);
    return sheet;
  }
  getSheetByName(name) { return this.sheets.find(sheet => sheet.name === name) || null; }
}

const properties = new Map();
const spreadsheets = new Map();
let nextId = 1;
const spreadsheetApp = {
  create(name) {
    const spreadsheet = new Spreadsheet(name, 'test-db-' + nextId++);
    spreadsheet.getSheets()[0].setName('RSVP');
    spreadsheets.set(spreadsheet.getId(), spreadsheet);
    return spreadsheet;
  },
  openById(id) {
    const spreadsheet = spreadsheets.get(id);
    if (!spreadsheet) throw new Error('Spreadsheet not found: ' + id);
    return spreadsheet;
  }
};
const context = {
  console,
  PropertiesService: { getScriptProperties: () => ({
    getProperty: key => properties.get(key) || null,
    setProperty: (key, value) => properties.set(key, value)
  }) },
  SpreadsheetApp: spreadsheetApp,
  LockService: { getScriptLock: () => ({
    waitLock: () => {},
    releaseLock: () => {}
  }) },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput: content => ({
      content,
      mimeType: null,
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
const dbId = properties.get('OMAH_AKSARA_DATABASE_ID');
const db = spreadsheets.get(dbId);
assert.ok(db, 'database is created');
assert.deepEqual(db.getSheets().map(sheet => sheet.name), ['RSVP', 'Guestbook', 'Settings']);
context.setupDatabase();
assert.equal(spreadsheets.size, 1, 'setupDatabase reuses the existing database');

const settings = db.getSheetByName('Settings');
settings.appendRow(['uji-omah-aksara', 'published']);
settings.appendRow(['draft-omah-aksara', 'draft']);

const health = response(context.doGet({ parameter: { action: 'health' } }));
assert.equal(health.ok, true);
assert.equal(health.databaseConfigured, true);
assert.equal(health.version, 3);

const rsvp = post({
  action: 'rsvp', slug: 'uji-omah-aksara', name: 'Tamu Uji',
  attendance: 'hadir', guestCount: 2
});
assert.equal(rsvp.ok, true);
assert.equal(db.getSheetByName('RSVP').getLastRow(), 2);

const guestbook = post({
  action: 'guestbook', slug: 'uji-omah-aksara',
  name: 'Tamu Uji', message: 'Semoga bahagia selalu.'
});
assert.equal(guestbook.ok, true);
assert.equal(db.getSheetByName('Guestbook').getLastRow(), 2);

const listed = response(context.doGet({
  parameter: { action: 'guestbook', slug: 'uji-omah-aksara' }
}));
assert.equal(listed.ok, true);
assert.equal(listed.items.length, 1);
assert.equal(listed.items[0].name, 'Tamu Uji');
assert.equal(listed.items[0].message, 'Semoga bahagia selalu.');

assert.equal(response(context.doGet({
  parameter: { action: 'guestbook', slug: 'draft-omah-aksara' }
})).ok, false, 'draft slug cannot read guestbook');
assert.equal(post({
  action: 'rsvp', slug: 'draft-omah-aksara', name: 'Tamu Uji',
  attendance: 'hadir', guestCount: 1
}).ok, false, 'draft slug cannot submit RSVP');
assert.equal(post({
  action: 'guestbook', slug: 'slug-tidak-terdaftar',
  name: 'Tamu Uji', message: 'Uji'
}).ok, false, 'unlisted slug cannot submit guestbook');
assert.equal(post({
  action: 'rsvp', slug: 'uji-omah-aksara', name: 'Tamu Uji',
  attendance: 'maybe', guestCount: 1
}).ok, false, 'invalid attendance is rejected');
assert.equal(post({
  action: 'rsvp', slug: 'uji-omah-aksara', name: 'Tamu Uji',
  attendance: 'hadir', guestCount: 11
}).ok, false, 'guest count over limit is rejected');
assert.equal(post({
  action: 'guestbook', slug: 'uji-omah-aksara',
  name: 'Tamu Uji', message: '   '
}).ok, false, 'empty guestbook message is rejected');

console.log('PASS backend unit tests: setup, health, RSVP, guestbook, allowlist, and validation.');
