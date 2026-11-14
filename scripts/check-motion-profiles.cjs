#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'templates/registry.json'), 'utf8'));
const app = fs.readFileSync(path.join(root, 'core/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'core/global.css'), 'utf8');

const activeThemes = (registry.themes || [])
  .filter(theme => theme && theme.status === 'active' && theme.slug !== 'army')
  .map(theme => theme.slug);
assert.ok(activeThemes.length > 0, 'Registry tidak memiliki tema aktif.');

const mappingStart = app.indexOf('const motionProfiles = {');
const mappingEnd = app.indexOf('\n    };', mappingStart);
assert.ok(mappingStart >= 0 && mappingEnd > mappingStart, 'Pemetaan motionProfiles tidak ditemukan.');
const mappingSource = app.slice(mappingStart, mappingEnd);
assert.ok(!/"army"\s*:/.test(mappingSource), 'Army tidak boleh memiliki profil motion adaptif.');
assert.match(app, /if \(themeSlug === "army"\)\s*\{\s*setupLegacyReveal\(\);\s*return;/,
  'Army harus tetap memakai jalur reveal lama tanpa inisialisasi motion adaptif.');
assert.match(app, /themeSlug === "army"\s*\?\s*680\s*:/,
  'Army / Venni–Rama harus mempertahankan timer cover legacy 680ms.');
const mappings = Object.fromEntries(
  [...mappingSource.matchAll(/"([a-z0-9-]+)"\s*:\s*"([a-z]+)"/g)]
    .map(match => [match[1], match[2]])
);

const profiles = new Set();
for (const slug of activeThemes) {
  assert.ok(mappings[slug], 'Tema aktif belum memiliki profil motion: ' + slug);
  profiles.add(mappings[slug]);
}
assert.equal(activeThemes.length, new Set(activeThemes).size, 'Slug tema aktif duplikat.');

const expectedProfiles = ['cinematic', 'curtain', 'editorial', 'organic', 'soft', 'bold', 'dramatic'];
for (const profile of expectedProfiles) {
  assert.ok(profiles.has(profile), 'Profil tidak dipakai oleh tema aktif: ' + profile);
  const blockMatch = css.match(new RegExp(
    'html\\[data-oa-motion-profile="' + profile + '"\\]\\s*\\{([^}]+)\\}'
  ));
  assert.ok(blockMatch, 'Token CSS profil tidak ditemukan: ' + profile);
  const block = blockMatch[1];
  const duration = Number((block.match(/--oa-motion-duration:\s*(\d+)ms/) || [])[1]);
  const opening = Number((block.match(/--oa-motion-opening-duration:\s*(\d+)ms/) || [])[1]);
  assert.ok(duration >= 500 && duration <= 550,
    profile + ': durasi reveal di luar batas 500–550ms (' + duration + 'ms).');
  assert.ok(opening >= 650 && opening <= 900,
    profile + ': durasi opening di luar batas 650–900ms (' + opening + 'ms).');
  assert.ok(/--oa-motion-ease:/.test(block), profile + ': easing belum didefinisikan.');
  assert.ok(/--oa-motion-photo-distance:/.test(block), profile + ': jarak gerak foto belum didefinisikan.');
}

assert.ok(/prefers-reduced-motion:\s*reduce/.test(app),
  'Aturan prefers-reduced-motion tidak ditemukan pada engine.');
assert.ok(/oa-motion-photo\.oa-motion-visible[^}]*clip-path:\s*inset\(0 0 0 0/.test(app),
  'Foto tidak memiliki state clip-path penuh setelah reveal.');
const choreographyProfiles = ['cinematic', 'curtain', 'editorial', 'organic', 'soft', 'bold', 'dramatic'];
for (const profile of choreographyProfiles) {
  assert.ok(app.includes('html[data-oa-motion-profile="' + profile + '"] #app .oa-motion-item:not(.oa-motion-visible)'),
    profile + ': choreography scroll khusus belum tersedia.');
}
for (const animation of ['oa-cover-cinematic-exit', 'oa-cover-curtain-exit', 'oa-cover-editorial-exit', 'oa-cover-organic-exit', 'oa-cover-soft-exit', 'oa-cover-bold-exit', 'oa-cover-dramatic-exit']) {
  assert.ok(app.includes(animation), 'Animasi cover khusus belum tersedia: ' + animation);
}
assert.ok(/clip-path var\(--oa-motion-duration/.test(app), 'Reveal belum mentransisikan clip-path.');
assert.ok(/filter var\(--oa-motion-duration/.test(app), 'Reveal belum mentransisikan filter blur.');
assert.ok(/IntersectionObserver/.test(app), 'Observer reveal tidak ditemukan.');
assert.ok(/getPropertyValue\("--oa-motion-opening-duration"\)/.test(app),
  'Penutupan cover harus membaca durasi opening dari profil aktif.');
assert.ok(/reducedMotionPreference \? 0 : safeOpeningDuration/.test(app),
  'Timer penutupan cover harus mengikuti durasi profil dan reduced-motion.');

console.log(
  'PASS motion profile audit: ' + activeThemes.length + ' tema non-Army yang memenuhi syarat, ' +
  profiles.size + ' profil, timing, easing, photo reveal, dan reduced-motion.'
);
