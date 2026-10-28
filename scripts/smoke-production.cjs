#!/usr/bin/env node
'use strict';

// Production browser smoke: checks the public catalogue and published invitation.
// It never reads or writes the live RSVP/guestbook API: even a guestbook GET
// can auto-register a slug in Settings, so Apps Script requests are blocked.
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
      invitationReady = invitationHtml.includes('core/app.js?v=20261027c');
      catalogueReady = catalogueHtml.includes('preview-guest-name') && catalogueHtml.includes('frame.src = demo');
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

    // Keep this production smoke strictly non-mutating: block Apps Script API
    // calls in the browser. Even a guestbook GET can auto-register a slug in
    // Settings when missing, so production smoke must not call the live API.
    await invitation.route('**/*', async route => {
      const requestUrl = route.request().url();
      if (requestUrl.includes('script.google.com/macros/s/')) {
        await route.abort();
      } else {
        await route.continue();
      }
    });

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

    assert.ok(await invitation.locator('#wishes-list').count(),
      'Published invitation must include the guestbook display container.');
    assert.ok(await invitation.locator('#wishes-form').count(),
      'Published invitation must include the guestbook form.');
    assert.ok(await invitation.locator('#rsvp-form').count(),
      'Published invitation must include the RSVP form.');
    const layout = await invitation.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth
    }));
    assert.ok(layout.page <= layout.viewport + 2, 'Published invitation overflows mobile width: ' + JSON.stringify(layout));
    assert.equal(pageErrors.length, 0, 'Published invitation JavaScript errors: ' + pageErrors.join('; '));
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
