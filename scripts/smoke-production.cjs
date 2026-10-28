#!/usr/bin/env node
'use strict';

// Production browser smoke: reads the live catalogue and guestbook only.
// Never submits RSVP or guestbook forms. A guestbook GET may auto-register
// an already-published slug in Settings if it is missing, as designed by the backend.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const INVITATION_URL = 'https://omahaksara.github.io/invitation/';
const CATALOGUE_URL = 'https://omahaksara.github.io/';
const REGISTRY_URL = 'https://raw.githubusercontent.com/omahaksara/invitation/main/templates/registry.json';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchText(url) {
  const response = await fetch(url, { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' while checking public deployment.');
  return response.text();
}

async function waitForCurrentDeployments() {
  let invitationReady = false;
  let catalogueReady = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const [invitationHtml, catalogueHtml] = await Promise.all([
        fetchText(INVITATION_URL),
        fetchText(CATALOGUE_URL)
      ]);
      invitationReady = invitationHtml.includes('core/app.js?v=20261028b');
      catalogueReady = catalogueHtml.includes('preview-guest-name') && /frame\\.src\\s*=\\s*demo\\b/.test(catalogueHtml);
      if (invitationReady && catalogueReady) return;
    } catch (error) {
      // GitHub Pages may still be propagating the latest deployment; retry briefly.
    }
    await sleep(2000);
  }
  throw new Error('Latest GitHub Pages deployment was not visible in time (invitation=' +
    invitationReady + ', catalogue=' + catalogueReady + ').');
}

async function main() {
  await waitForCurrentDeployments();

  const registryResponse = await fetch(REGISTRY_URL, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!registryResponse.ok) throw new Error('Could not load the active-theme registry.');
  const registry = await registryResponse.json();
  const expectedThemes = (registry.themes || [])
    .filter(theme => theme && theme.status === 'active')
    .map(theme => theme.slug)
    .sort();
  assert.ok(expectedThemes.length > 0, 'Registry must contain active themes.');

  const browser = await chromium.launch({ headless: true });
  try {
    const catalogue = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const catalogueErrors = [];
    catalogue.on('pageerror', error => catalogueErrors.push(error.message));
    const catalogueResponse = await catalogue.goto(CATALOGUE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    assert.ok(catalogueResponse && catalogueResponse.ok(), 'Public catalogue must load.');
    await catalogue.waitForFunction(count =>
      document.querySelectorAll('#catalog-grid iframe').length === count,
      expectedThemes.length, { timeout: 25000 });

    const displayedThemes = await catalogue.locator('#catalog-grid iframe').evaluateAll(frames =>
      frames.map(frame => new URL(frame.src).searchParams.get('theme')).filter(Boolean).sort());
    assert.deepEqual(displayedThemes, expectedThemes, 'Catalogue previews must match every active theme.');
    assert.equal(await catalogue.locator('.catalog-demo-link').count(), expectedThemes.length,
      'Each theme must have a separate Demo link.');

    await catalogue.locator('#preview-guest-name').fill('Tamu Audit');
    const firstDemoHref = await catalogue.locator('.catalog-demo-link').first().getAttribute('href');
    assert.equal(new URL(firstDemoHref).searchParams.get('to'), 'Tamu Audit',
      'Demo link must carry the personalized guest name.');
    assert.equal(catalogueErrors.length, 0, 'Catalogue JavaScript errors: ' + catalogueErrors.join('; '));
    console.log('PASS public catalogue: ' + expectedThemes.length + ' live theme previews and personalized demo links.');

    const invitation = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
    const pageErrors = [];
    invitation.on('pageerror', error => pageErrors.push(error.message));

    const invitationResponse = await invitation.goto(
      INVITATION_URL + '?c=budi-ani&to=Tamu%20Audit',
      { waitUntil: 'domcontentloaded', timeout: 45000 }
    );
    assert.ok(invitationResponse && invitationResponse.ok(), 'Published Budi–Ani invitation must load.');
    await invitation.waitForFunction(() =>
      window.__invitationData && window.__invitationData.slug === 'budi-ani' &&
      document.querySelector('#rsvp-form') && document.querySelector('#wishes-form'),
      undefined, { timeout: 25000 });

    assert.equal(await invitation.locator('[data-bind="couple.groom.nickname"]').first().textContent().then(x => x.trim()),
      'Budi', 'Published groom data must load.');
    assert.equal(await invitation.locator('[data-bind="couple.bride.nickname"]').first().textContent().then(x => x.trim()),
      'Ani', 'Published bride data must load.');
    assert.ok(await invitation.locator('#bg-music').getAttribute('src'), 'Invitation music source must be bound.');

    // Execute the same cross-origin GET in the real browser context used by guests.
    // This is read-only and does not submit any form.
    const guestbook = await invitation.evaluate(async () => {
      const apiUrl = window.__invitationData?.integrations?.apiUrl;
      if (!apiUrl) throw new Error('Published invitation has no configured API URL.');
      const url = new URL(apiUrl);
      url.searchParams.set('action', 'guestbook');
      url.searchParams.set('slug', 'budi-ani');
      const response = await fetch(url, { cache: 'no-store', redirect: 'follow' });
      if (!response.ok) throw new Error('Guestbook GET returned HTTP ' + response.status + '.');
      const result = await response.json();
      if (!result || result.ok !== true || !Array.isArray(result.items)) {
        throw new Error('Guestbook GET returned an invalid API response.');
      }
      return { count: result.items.length };
    });
    await invitation.waitForFunction(count => {
      const root = document.getElementById('wishes-list');
      if (!root) return false;
      const cards = root.querySelectorAll('.wish-card').length;
      const empty = Boolean(root.querySelector('.empty-wishes'));
      return count === 0 ? empty : cards === count;
    }, guestbook.count, { timeout: 10000 });

    const layout = await invitation.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth
    }));
    assert.ok(layout.page <= layout.viewport + 2, 'Published invitation overflows mobile width: ' + JSON.stringify(layout));
    assert.equal(pageErrors.length, 0, 'Published invitation JavaScript errors: ' + pageErrors.join('; '));
    console.log('PASS live Budi–Ani invitation: couple data, RSVP, guestbook GET (' + guestbook.count +
      ' entries), music source, and mobile width. No production forms were submitted; a published slug may auto-register in Settings if missing.');
    await catalogue.close();
    await invitation.close();
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('PRODUCTION BROWSER SMOKE FAILED: ' + (error && error.message ? error.message : String(error)));
  process.exitCode = 1;
});
