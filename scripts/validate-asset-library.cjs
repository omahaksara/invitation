#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ROOT = process.cwd();

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}
function localFile(url) {
  assert.equal(typeof url, "string", "asset path must be a string");
  assert.ok(url.startsWith("/assets/"), "asset must use a local /assets path: " + url);
  const resolved = path.resolve(ROOT, url.slice(1));
  const assetRoot = path.resolve(ROOT, "assets") + path.sep;
  assert.ok(resolved.startsWith(assetRoot), "asset path escaped /assets: " + url);
  assert.ok(fs.existsSync(resolved) && fs.statSync(resolved).isFile(), "missing local asset: " + url);
  return resolved;
}
function validateSvg(file) {
  const svg = fs.readFileSync(file, "utf8");
  assert.match(svg, /<svg[\s>]/i, file + " is not SVG");
  assert.doesNotMatch(svg, /<script\b|<foreignObject\b|\son[a-z]+\s*=|href=["']https?:/i,
    file + " contains unsafe active/external SVG content");
  assert.ok(/viewBox=/i.test(svg) || /\bwidth=["\x27][0-9.]+/i.test(svg) && /\bheight=["\x27][0-9.]+/i.test(svg), file + " should declare a viewBox or intrinsic dimensions");
}
function validatePng(file) {
  const bytes = fs.readFileSync(file);
  assert.ok(bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), file + " is not PNG");
}

const payments = readJson("assets/payment/manifest.json");
const bankCatalog = readJson("assets/payment/banks/catalog/manifest.json");
const demo = readJson("clients/demo-katalog/data.json");
const themeManifest = readJson("assets/themes/manifest.json");
const ornamentManifest = readJson("assets/ornaments/manifest.json");

assert.ok(Array.isArray(payments.banks) && payments.banks.length >= 30, "payment manifest should expose at least 30 bank choices");
assert.ok(Array.isArray(payments.wallets) && payments.wallets.length >= 6, "payment manifest should expose at least 6 wallet/payment choices");
assert.ok(Array.isArray(bankCatalog.items) && bankCatalog.items.length >= 70, "full bank logo archive unexpectedly shrank");

for (const item of [...payments.banks, ...payments.wallets]) {
  const file = localFile(item.logo);
  if (file.endsWith(".svg")) validateSvg(file);
  else if (file.endsWith(".png")) validatePng(file);
  else throw new Error("Unsupported payment logo format: " + item.logo);
}
for (const item of bankCatalog.items) {
  const file = localFile(item.file);
  assert.ok(file.endsWith(".svg"), "bank catalog artwork must remain SVG: " + item.file);
  validateSvg(file);
}

const demoAccounts = demo.gifts && Array.isArray(demo.gifts.accounts) ? demo.gifts.accounts : [];
assert.equal(demo.demoMode, true, "catalog demo mode must remain enabled");
assert.ok(demo.gifts.message && /SIMULASI|SIMULASI|DATA SIMULASI/i.test(demo.gifts.message), "demo payment warning is required");
const demoBankCount = demoAccounts.filter(item => item.paymentType === "bank").length;
const demoWalletCount = demoAccounts.filter(item => item.paymentType === "ewallet" || item.paymentType === "qris").length;
assert.equal(demoBankCount, payments.banks.length, "every bank option must have one demo card");
assert.equal(demoWalletCount, payments.wallets.length, "every wallet/payment option must have one demo card");
for (const item of demoAccounts) {
  assert.equal(item.demoOnly, true, "all demo payment records must be marked demoOnly");
  assert.equal(item.copyable, false, "demo account copy action must remain disabled");
  assert.ok(item.logo, "demo payment card must have a local logo");
  localFile(item.logo);
  assert.ok(item.accountNumber, "demo payment card needs a clearly marked placeholder");
  assert.ok(/DEMO|XX|TIDAK ADA KODE BAYAR/i.test(item.accountNumber), "demo card must not expose a real account/payment identifier");
}

const themeFiles = [
  ...Object.values(themeManifest.categories).flat().filter(file => !file.startsWith("/")),
  ...ornamentManifest.assets.map(item => ornamentManifest.basePath + item.file).map(file => file.replace(/^\//, ""))
];
for (const file of themeFiles) {
  const resolved = path.resolve(ROOT, file);
  assert.ok(resolved.startsWith(path.resolve(ROOT, "assets") + path.sep), "theme asset path escaped assets: " + file);
  assert.ok(fs.existsSync(resolved) && fs.statSync(resolved).isFile(), "missing theme ornament/frame: " + file);
  if (resolved.endsWith(".svg")) validateSvg(resolved);
}
for (const file of themeManifest.categories.sharedOrnaments || []) {
  const resolved = localFile(file);
  validateSvg(resolved);
}

console.log(
  "Asset library passed: " + payments.banks.length + " banks, " +
  payments.wallets.length + " wallet/payment methods, " + bankCatalog.items.length +
  " archived bank SVGs, " + themeFiles.length + " theme assets; demo cards " +
  demoBankCount + " banks + " + demoWalletCount + " digital payment methods."
);
