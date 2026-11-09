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
    const shortDemoResponse = await shortDemo.goto(firstDemoHref, { waitUntil: 'domcontentloaded', timeout: 45000 });
    assert.ok(shortDemoResponse && shortDemoResponse.ok(), 'Personalized demo short URL must resolve.');
    await shortDemo.waitForFunction(({ slug, theme }) =>
      window.__invitationData && window.__invitationData.slug === slug &&
      document.documentElement.dataset.oaTheme === theme,
      { slug: 'demo-katalog', theme: selectedDemoTheme }, { timeout: 25000 });
    const resolvedDemoUrl = new URL(shortDemo.url());
    assert.equal(resolvedDemoUrl.pathname, '/invitation/', 'Demo short URL must redirect to the invitation engine.');
    assert.equal(resolvedDemoUrl.searchParams.get('c'), 'demo-katalog', 'Demo short URL must preserve its isolated slug.');
    assert.equal(resolvedDemoUrl.searchParams.get('to'), 'Tamu Audit', 'Demo short URL must preserve the guest name.');
    assert.equal(resolvedDemoUrl.searchParams.get('theme'), selectedDemoTheme, 'Demo short URL must preserve the selected active theme.');
    assert.equal(shortDemoErrors.length, 0, 'Demo short URL JavaScript errors: ' + shortDemoErrors.join('; '));
    await shortDemo.close();
    console.log('PASS personalized demo short URL: slug, guest name, and selected theme.');

    assert.equal(catalogueErrors.length, 0, 'Catalogue JavaScript errors: ' + catalogueErrors.join('; '));
    console.log('PASS public catalogue: ' + expectedThemes.length + ' live theme previews and personalized demo links.');

    const invitation = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
    const pageErrors = [];
    invitation.on('pageerror', error => pageErrors.push(error.message));

    const invitationResponse = await invitation.goto(
      CATALOGUE_URL + 'i/budi-ani/Tamu%20Audit',
      { waitUntil: 'domcontentloaded', timeout: 45000 }
    );
    assert.ok(invitationResponse && invitationResponse.ok(), 'Published Budi–Ani short URL must load.');
    const resolvedBudiUrl = new URL(invitation.url());
    assert.equal(resolvedBudiUrl.pathname, '/invitation/', 'Budi–Ani short URL must redirect to the invitation engine.');
    assert.equal(resolvedBudiUrl.searchParams.get('c'), 'budi-ani', 'Budi–Ani short URL must preserve the client slug.');
    assert.equal(resolvedBudiUrl.searchParams.get('to'), 'Tamu Audit', 'Budi–Ani short URL must preserve the guest name.');
    assert.equal(resolvedBudiUrl.searchParams.get('theme'), 'sirein', 'Budi–Ani short URL must retain its configured theme.');
    console.log('CHECK Budi–Ani invitation data and forms.');
    try {
      await invitation.waitForFunction(() =>
        window.__invitationData && window.__invitationData.slug === 'budi-ani' &&
        document.querySelector('#rsvp-form') && document.querySelector('#wishes-form'),
        undefined, { timeout: 25000 });
    } catch (error) {
      const diagnostic = await invitation.evaluate(() => ({
        readyState: document.readyState,
        dataLoaded: Boolean(window.__invitationData),
        slug: window.__invitationData?.slug || null,
        rsvpForm: Boolean(document.querySelector('#rsvp-form')),
        wishesForm: Boolean(document.querySelector('#wishes-form')),
        title: document.title
      }));
      throw new Error('Budi–Ani data/forms stage timed out. Observed ' +
        JSON.stringify(diagnostic) + '. Original: ' + error.message);
    }
    console.log('PASS Budi–Ani data and forms.');

    assert.equal(await invitation.locator('[data-bind="couple.groom.nickname"]').first().textContent().then(x => x.trim()),
      'Budi', 'Published groom data must load.');
    assert.equal(await invitation.locator('[data-bind="couple.bride.nickname"]').first().textContent().then(x => x.trim()),
      'Ani', 'Published bride data must load.');
    assert.ok(await invitation.locator('#bg-music').getAttribute('src'), 'Invitation music source must be bound.');

    // The invitation itself loads the guestbook once, exactly as a real visitor does.
    // Observe the rendered result instead of issuing a second, redundant API GET.
    await invitation.waitForFunction(() => {
      const root = document.getElementById('wishes-list');
      return !!root && !!root.querySelector('.wish-card, .empty-wishes');
    }, undefined, { timeout: 15000 });
    const guestbookCount = await invitation.locator('#wishes-list .wish-card').count();



    const layout = await invitation.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth
    }));
    assert.ok(layout.page <= layout.viewport + 2, 'Published invitation overflows mobile width: ' + JSON.stringify(layout));
    assert.equal(pageErrors.length, 0, 'Published invitation JavaScript errors: ' + pageErrors.join('; '));
    console.log('PASS live Budi–Ani invitation: couple data, RSVP, guestbook rendered (' + guestbookCount +
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
