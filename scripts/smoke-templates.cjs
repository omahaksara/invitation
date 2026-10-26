#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const errors = [];
const warnings = [];
const themes = ['karsa', 'royal-vintage', 'sirein', 'aksara-signature'];

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) errors.push('File wajib tidak ditemukan: ' + relativePath);
}

[
  'index.html',
  'core/app.js',
  'core/global.css',
  'scripts/validate-invitations.cjs',
  'backend/Code.gs'
].forEach(requireFile);

for (const theme of themes) {
  const htmlPath = path.join(root, 'templates', theme, 'index.html');
  const cssPath = path.join(root, 'templates', theme, 'style.css');
  if (!fs.existsSync(htmlPath)) {
    errors.push('Template HTML tidak ditemukan: templates/' + theme + '/index.html');
    continue;
  }
  if (!fs.existsSync(cssPath)) errors.push('CSS tema tidak ditemukan: templates/' + theme + '/style.css');
  const html = fs.readFileSync(htmlPath, 'utf8');
  for (const marker of ['couple.groom.nickname', 'couple.bride.nickname', 'bg-music']) {
    if (!html.includes(marker)) errors.push(theme + ': kontrak dasar tidak memuat ' + marker);
  }
  if (!/id=["'](?:open-invitation-btn|open-btn)["']/.test(html)) {
    warnings.push(theme + ': tidak ditemukan tombol pembuka standar; pastikan alur masuk tetap jelas.');
  }
  if (!/id=["'](?:music-toggle|music-btn)["']/.test(html)) {
    warnings.push(theme + ': kontrol musik belum ditemukan.');
  }
}

const clientsRoot = path.join(root, 'clients');
if (!fs.existsSync(clientsRoot)) {
  errors.push('Folder clients/ tidak ditemukan.');
} else {
  const dirs = fs.readdirSync(clientsRoot, { withFileTypes: true }).filter(entry => entry.isDirectory());
  if (!dirs.length) errors.push('Tidak ada data demo/klien di clients/.');
  for (const dir of dirs) {
    const file = path.join(clientsRoot, dir.name, 'data.json');
    if (!fs.existsSync(file)) {
      warnings.push(dir.name + ': data.json tidak ada; folder dilewati.');
      continue;
    }
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!data || typeof data !== 'object' || Array.isArray(data)) errors.push(dir.name + ': akar JSON harus berupa objek.');
      if (data.theme && !themes.includes(data.theme) && data.theme !== 'royal') errors.push(dir.name + ': tema tidak dikenal: ' + data.theme);
      if (data.features !== undefined && (!data.features || typeof data.features !== 'object' || Array.isArray(data.features))) {
        errors.push(dir.name + ': features harus berupa objek.');
      }
    } catch (error) {
      errors.push(dir.name + ': JSON tidak valid (' + error.message + ').');
    }
  }
}

const engine = fs.existsSync(path.join(root, 'core/app.js'))
  ? fs.readFileSync(path.join(root, 'core/app.js'), 'utf8')
  : '';
if (!engine.includes('function applyFeatureFlags')) errors.push('Engine belum memiliki pengelola fitur terpusat.');
if (!engine.includes('allowedThemes')) errors.push('Engine belum memvalidasi daftar tema.');
if (engine.includes('button.textContent = "♫"')) errors.push('Kontrol musik mengganti isi tombol dan berisiko menghapus ikon.');

const syntax = spawnSync(process.execPath, ['--check', path.join(root, 'core/app.js')], { encoding: 'utf8' });
if (syntax.status !== 0) errors.push('Sintaks core/app.js gagal diperiksa: ' + (syntax.stderr || syntax.stdout || 'unknown error').trim());

for (const warning of warnings) console.warn('WARN: ' + warning);
for (const error of errors) console.error('ERROR: ' + error);
if (errors.length) {
  console.error('\nSmoke test gagal: ' + errors.length + ' error, ' + warnings.length + ' warning.');
  process.exit(1);
}
console.log('Smoke test statis lolos: engine, empat tema, dan JSON dasar tersedia.');
if (warnings.length) console.log(warnings.length + ' warning perlu diperiksa; smoke test ini tidak menggantikan uji browser/API.');
