#!/usr/bin/env node
'use strict';

// Read-only production probe. This script never submits RSVP or guestbook writes.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const clientPath = path.join(root, 'clients', 'budi-ani', 'data.json');
const client = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
const apiUrl = client.integrations && client.integrations.apiUrl;

if (!apiUrl || !/^https:\/\//i.test(apiUrl)) {
  console.error('LIVE API CHECK FAILED: clients/budi-ani/data.json has no HTTPS integrations.apiUrl.');
  process.exit(1);
}

async function main() {
  const url = new URL(apiUrl);
  url.searchParams.set('action', 'health');
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
  if (!response.ok) {
    throw new Error('Health endpoint returned HTTP ' + response.status + '.');
  }

  const result = await response.json();
  if (!result || result.ok !== true || result.databaseConfigured !== true) {
    throw new Error('Health endpoint did not confirm a configured database.');
  }
  if (Number(result.version) < 4) {
    throw new Error(
      'Live Apps Script is version ' + String(result.version) +
      ', but repository backend/Code.gs requires version 4 or newer. Deploy the latest backend code as a new Apps Script version.'
    );
  }

  console.log('PASS live API health: database configured; backend version ' + result.version + '.');
  console.log('Read-only probe completed. No RSVP or guestbook rows were created.');
}

main().catch(error => {
  console.error('LIVE API CHECK FAILED: ' + (error && error.message ? error.message : String(error)));
  process.exitCode = 1;
});
