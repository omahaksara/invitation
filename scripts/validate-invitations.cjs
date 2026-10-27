#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CLIENTS = path.join(ROOT, 'clients');
const TEMPLATES = path.join(ROOT, 'templates');
const THEME_REGISTRY_PATH = path.join(TEMPLATES, 'registry.json');
const THEME_REGISTRY = JSON.parse(fs.readFileSync(THEME_REGISTRY_PATH, 'utf8'));
const ALLOWED_THEMES = new Set((THEME_REGISTRY.themes || [])
  .filter(theme => theme && theme.status === 'active')
  .map(theme => theme.slug));
const errors = [];
const warnings = [];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isRemote(value) {
  return /^(?:https?:)?\/\//i.test(value) || /^(?:data:|blob:)/i.test(value);
}

function collectAssetCandidates(data, prefix = '') {
  const out = [];
  if (Array.isArray(data)) {
    data.forEach((value, index) => {
      if (typeof value === 'string' && /\.(?:avif|gif|jpe?g|mp3|ogg|png|svg|webp|wav|mp4|webm)$/i.test(value)) {
        out.push({ key: prefix + '[' + index + ']', value });
      } else if (isObject(value) || Array.isArray(value)) {
        out.push(...collectAssetCandidates(value, prefix + '[' + index + ']'));
      }
    });
    return out;
  }
  if (!isObject(data)) return out;

  for (const [key, value] of Object.entries(data)) {
    const current = prefix ? prefix + '.' + key : key;
    const assetKey = /^(?:image|photo|foto|src|music|audio|qr|qrCode|coverImage|backgroundImage)$/i.test(key);
    if (typeof value === 'string' && assetKey && value.trim()) {
      out.push({ key: current, value });
    } else if (typeof value === 'string' && key === 'gallery' && /\.(?:avif|gif|jpe?g|png|webp)$/i.test(value)) {
      out.push({ key: current, value });
    } else if (isObject(value) || Array.isArray(value)) {
      out.push(...collectAssetCandidates(value, current));
    }
  }
  return out;
}

function validateAsset(slug, file, key, value) {
  const clean = value.trim();
  if (!clean || isRemote(clean) || clean.startsWith('#')) return;
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean)) return;

  const normalized = clean.replace(/^\.\//, '');
  if (normalized.startsWith('/')) {
    warnings.push(`${slug}: aset ${key} memakai path absolut "${clean}"; pastikan path GitHub Pages memang benar.`);
    return;
  }

  const resolved = path.resolve(CLIENTS, slug, normalized);
  const clientRoot = path.resolve(CLIENTS, slug) + path.sep;
  if (!resolved.startsWith(clientRoot)) {
    errors.push(`${slug}: path aset ${key} keluar dari folder klien: "${clean}".`);
    return;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    errors.push(`${slug}: aset lokal tidak ditemukan untuk ${key}: "${clean}".`);
  }
}

function validateClient(slug, file) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`${slug}: data.json tidak valid JSON (${error.message}).`);
    return;
  }

  if (!isObject(data)) {
    errors.push(`${slug}: akar data.json harus berupa objek.`);
    return;
  }

  const looksLikeV2 = data.schemaVersion === 2;
  if (!looksLikeV2) {
    warnings.push(`${slug}: format data lama belum mengikuti skema V2; perlu migrasi sebelum rilis publik.`);
    return;
  }

  if (typeof data.theme !== 'string' || !ALLOWED_THEMES.has(data.theme)) {
    errors.push(`${slug}: theme harus salah satu dari: ${[...ALLOWED_THEMES].join(', ')}.`);
  }

  if (data.slug !== undefined && data.slug !== slug) {
    errors.push(`${slug}: properti slug tidak cocok dengan nama folder.`);
  }
  if (data.status !== undefined && !['draft', 'published'].includes(data.status)) {
    errors.push(`${slug}: status harus draft atau published.`);
  }
  if (data.features !== undefined) {
    if (!isObject(data.features)) {
      errors.push(`${slug}: features harus berupa objek boolean.`);
    } else {
      for (const [feature, enabled] of Object.entries(data.features)) {
        if (typeof enabled !== 'boolean') errors.push(`${slug}: features.${feature} harus bernilai boolean.`);
      }
    }
  }
  if (data.integrations && data.integrations.apiUrl && !/^https:\/\//i.test(data.integrations.apiUrl)) {
    errors.push(`${slug}: integrations.apiUrl harus menggunakan HTTPS.`);
  }
  const configuredApiUrl = (data.integrations && data.integrations.apiUrl) ||
    (data.api && (data.api.apiUcapan || data.api.apiUrl)) || '';
  if (data.demoMode === true && configuredApiUrl) {
    errors.push(`${slug}: undangan demo tidak boleh menunjuk ke API RSVP/buku tamu produksi.`);
  }
  const events = Array.isArray(data.events) ? data.events : (isObject(data.events) ? Object.values(data.events) : []);
  events.forEach((event, index) => {
    if (!isObject(event)) { errors.push(`${slug}: data.events[${index}] harus berupa objek.`); return; }
    if (event.dateISO && !/^\d{4}-\d{2}-\d{2}$/.test(event.dateISO)) {
      errors.push(`${slug}: tanggal ISO acara ke-${index + 1} harus berformat YYYY-MM-DD.`);
    }
    for (const key of ['startTime', 'endTime']) {
      if (event[key] && !/^\d{2}:\d{2}$/.test(event[key])) errors.push(`${slug}: ${key} acara ke-${index + 1} harus berformat HH:mm.`);
    }
  });

  if (data.schemaVersion !== 2) {
    warnings.push(`${slug}: data masih kompatibel dengan engine lama; tambahkan schemaVersion: 2 setelah migrasi diverifikasi.`);
  }

  if (!isObject(data.couple)) {
    errors.push(`${slug}: objek couple belum tersedia.`);
  } else {
    for (const role of ['groom', 'bride']) {
      if (!isObject(data.couple[role])) {
        errors.push(`${slug}: couple.${role} belum tersedia.`);
      } else if (!(data.couple[role].fullName || data.couple[role].nickname || data.couple[role].name)) {
        warnings.push(`${slug}: nama ${role} belum terisi.`);
      }
    }
  }

  const eventCount = Array.isArray(data.events)
    ? data.events.length
    : (isObject(data.events) ? Object.keys(data.events).length : 0);
  if (eventCount === 0) warnings.push(`${slug}: belum ada acara pada data.events.`);

  if (data.gallery !== undefined && !Array.isArray(data.gallery) && !isObject(data.gallery)) {
    errors.push(`${slug}: gallery harus berupa array atau objek dengan daftar items.`);
  }

  if (data.gifts !== undefined && !Array.isArray(data.gifts) && !isObject(data.gifts)) {
    errors.push(`${slug}: gifts harus berupa array atau objek.`);
  }

  for (const asset of collectAssetCandidates(data)) {
    validateAsset(slug, file, asset.key, asset.value);
  }
}

for (const theme of THEME_REGISTRY.themes || []) {
  if (!theme || typeof theme.slug !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(theme.slug)) {
    errors.push('templates/registry.json: setiap tema harus memiliki slug yang valid.');
    continue;
  }
  if (theme.status === 'active' && !fs.existsSync(path.join(TEMPLATES, theme.slug, 'index.html'))) {
    errors.push('Tema aktif ' + theme.slug + ' tercatat di registry tetapi templates/' + theme.slug + '/index.html tidak ditemukan.');
  }
}
for (const entry of fs.readdirSync(TEMPLATES, { withFileTypes: true }).filter(entry => entry.isDirectory() && fs.existsSync(path.join(TEMPLATES, entry.name, 'index.html')))) {
  if (!THEME_REGISTRY.themes.some(theme => theme && theme.slug === entry.name)) {
    errors.push('Tema templates/' + entry.name + ' memiliki index.html tetapi belum terdaftar di templates/registry.json.');
  }
}

if (!fs.existsSync(CLIENTS)) {
  console.error('ERROR: folder clients/ tidak ditemukan.');
  process.exit(1);
}

const clientDirs = fs.readdirSync(CLIENTS, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

if (clientDirs.length === 0) {
  errors.push('Belum ada folder klien di clients/.');
}

for (const slug of clientDirs) {
  const file = path.join(CLIENTS, slug, 'data.json');
  if (!fs.existsSync(file)) {
    warnings.push(`${slug}: data.json belum ada; folder dilewati.`);
    continue;
  }
  validateClient(slug, file);
}

for (const warning of warnings) console.warn('WARN: ' + warning);
for (const error of errors) console.error('ERROR: ' + error);

if (errors.length) {
  console.error(`\nValidasi gagal: ${errors.length} error, ${warnings.length} warning.`);
  process.exit(1);
}

console.log(`Pemeriksaan selesai untuk ${clientDirs.length} folder klien. Data V2 yang ditandai schemaVersion: 2 telah diperiksa; data lama yang belum berversi hanya dilaporkan sebagai warning.`);
if (warnings.length) console.log(`${warnings.length} warning perlu ditinjau sebelum rilis publik.`);
