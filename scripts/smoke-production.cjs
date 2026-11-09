#!/usr/bin/env node
'use strict';

// Production browser smoke: checks the live catalogue and a published invitation.
// Never submits RSVP or guestbook forms. Opening a published invitation invokes
// the same guestbook GET used for visitors; the backend may auto-register a published
// slug in Settings on that first read if it is missing.
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
      invitationReady = /core\/app\.js\?v=20261107-payment-theme-assets2(?:["'&]|$)/.test(invitationHtml);
      catalogueReady = catalogueHtml.includes('preview-guest-name') && /frame\.src\s*=\s*demo\b/.test(catalogueHtml);
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
    console.log('CHECK catalogue previews: waiting for ' + expectedThemes.length + ' iframes.');
    try {
      await catalogue.waitForFunction(count =>
        document.querySelectorAll('#catalog-grid iframe').length === count,
        expectedThemes.length, { timeout: 25000 });
    } catch (error) {
      const diagnostic = await catalogue.evaluate(() => ({
        gridCount: document.querySelectorAll('#catalog-grid').length,
        iframeCount: document.querySelectorAll('#catalog-grid iframe').length,
        demoLinks: document.querySelectorAll('#catalog-grid .catalog-demo-link').length,
        title: document.title,
        readyState: document.readyState
      }));
      throw new Error('Catalogue preview stage timed out. Expected ' + expectedThemes.length +
        ' iframes; observed ' + JSON.stringify(diagnostic) + '. Original: ' + error.message);
    }
    console.log('PASS catalogue preview count: ' + expectedThemes.length + '.');

    const displayedThemes = await catalogue.locator('#catalog-grid iframe').evaluateAll(frames =>
      frames.map(frame => new URL(frame.src).searchParams.get('theme')).filter(Boolean).sort());
    assert.deepEqual(displayedThemes, expectedThemes, 'Catalogue previews must match every active theme.');
    assert.equal(await catalogue.locator('.catalog-demo-link').count(), expectedThemes.length,
      'Each theme must have a separate Demo link.');

    await catalogue.locator('#preview-guest-name').fill('Tamu Audit');
    const firstDemoHref = await catalogue.locator('.catalog-demo-link').first().getAttribute('href');
    const firstDemoUrl = new URL(firstDemoHref);
    const firstDemoPath = firstDemoUrl.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    assert.deepEqual(firstDemoPath.slice(0, 3), ['i', 'demo-katalog', 'Tamu Audit'],
      'Demo link must use the canonical personalized short path.');
    const selectedDemoTheme = firstDemoUrl.searchParams.get('theme');
    assert.ok(selectedDemoTheme, 'Demo link must preserve the selected theme.');

    // Follow the real public short URL. GitHub Pages serves this through its 404 fallback,
    // which must resolve the demo slug, guest name, and active theme before redirecting.
    const shortDemo = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
    const shortDemoErrors = [];
    shortDemo.on('pageerror', error => shortDemoErrors.push(error.message));
    // GitHub Pages serves unknown short paths through 404.html. The first
    // navigation can therefore return HTTP 404 while the router performs a
    // client-side redirect. Wait for the final engine URL instead of treating
    // that expected fallback response as a failed invitation.
    await shortDemo.goto(firstDemoHref, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await shortDemo.waitForFunction(({ slug, theme }) =>
      window.location.pathname === '/invitation/' &&
      window.__invitationData && window.__invitationData.slug === slug &&
      document.documentElement.dataset.oaTheme === theme,
      { slug: 'demo-katalog', theme: selectedDemoTheme }, { timeout: 30000 });
    const resolvedDemoUrl = new URL(shortDemo.url());
    assert.equal(resolvedDemoUrl.pathname, '/invitation/', 'Demo short URL must redirect to the invitation engine.');
    assert.equal(resolvedDemoUrl.searchParams.get('c'), 'demo-katalog', 'Demo short URL must preserve its isolated slug.');
    assert.equal(resolvedDemoUrl.searchParams.get('to'), 'Tamu Audit', 'Demo short URL must preserve the guest name.');
    assert.equal(resolvedDemoUrl.searchParams.get('theme'), selectedDemoTheme, 'Demo short URL must preserve the selected active theme.');
    assert.equal(await shortDemo.locator('#rsvp-form').count(), 1, 'Demo RSVP form must render.');
    assert.equal(await shortDemo.locator('#wishes-form').count(), 1, 'Demo guestbook form must render.');
    assert.ok(await shortDemo.locator('#bg-music').getAttribute('src'), 'Demo music source must be bound.');
    assert.equal(shortDemoErrors.length, 0, 'Demo short URL JavaScript errors: ' + shortDemoErrors.join('; '));
    console.log('PASS personalized demo short URL: slug, guest name, selected theme, forms, and music.');

    assert.equal(catalogueErrors.length, 0, 'Catalogue JavaScript errors: ' + catalogueErrors.join('; '));
    console.log('PASS public catalogue: ' + expectedThemes.length + ' live theme previews and personalized demo links.');

    // Do not open a real client's live invitation during this smoke test:
    // rendering the guestbook may issue a GET that auto-registers its slug in
    // the production Settings sheet. Demo data is isolated and safe to inspect.
    const layout = await shortDemo.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth
    }));
    assert.ok(layout.page <= layout.viewport + 2, 'Personalized demo overflows mobile width: ' + JSON.stringify(layout));
    await shortDemo.close();
    await catalogue.close();
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('PRODUCTION BROWSER SMOKE FAILED: ' + (error && error.message ? error.message : String(error)));
  process.exitCode = 1;
});
