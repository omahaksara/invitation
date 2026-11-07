#!/usr/bin/env node
"use strict";

/**
 * Download verified Indonesian bank/payment marks into local Omah Aksara assets.
 * Sources are Wikimedia Commons original files; no CDN/hotlink is used at runtime.
 * This script runs only in the dedicated repository branch workflow.
 */
const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = process.cwd();
const files = [
  {
    name: "bca.svg",
    type: "svg",
    url: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg",
    source: "https://commons.wikimedia.org/wiki/File:Bank_Central_Asia.svg",
    credit: "PT Bank Central Asia Tbk; Wikimedia Commons, PD-textlogo",
  },
  {
    name: "bri.svg",
    type: "svg",
    url: "https://upload.wikimedia.org/wikipedia/commons/5/59/BRI_2025.svg",
    source: "https://commons.wikimedia.org/wiki/File:BRI_2025.svg",
    credit: "PT Bank Rakyat Indonesia (Persero) Tbk; Wikimedia Commons, PD-textlogo",
  },
  {
    name: "mandiri.svg",
    type: "svg",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg",
    source: "https://commons.wikimedia.org/wiki/File:Bank_Mandiri_logo_2016.svg",
    credit: "PT Bank Mandiri (Persero) Tbk; Wikimedia Commons, PD-textlogo",
  },
  {
    name: "bni.svg",
    type: "svg",
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg",
    source: "https://commons.wikimedia.org/wiki/File:Bank_Negara_Indonesia_logo_(2004).svg",
    credit: "PT Bank Negara Indonesia (Persero) Tbk; Wikimedia Commons, PD-textlogo",
  },
  {
    name: "bsi.svg",
    type: "svg",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg",
    source: "https://commons.wikimedia.org/wiki/File:Bank_Syariah_Indonesia.svg",
    credit: "PT Bank Syariah Indonesia Tbk; Wikimedia Commons, PD-textlogo",
  },
  {
    name: "gopay.svg",
    type: "svg",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b1/GoPay_logo.svg",
    source: "https://commons.wikimedia.org/wiki/File:GoPay_logo.svg",
    credit: "GoPay; source: official GoPay media kit, Wikimedia Commons, PD-textlogo",
  },
  {
    name: "bank-sulteng.png",
    type: "png",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/db/Logo_Bank_Sulteng.png",
    source: "https://commons.wikimedia.org/wiki/File:Logo_Bank_Sulteng.png",
    credit: "PT Bank Pembangunan Daerah Sulawesi Tengah; Wikimedia Commons, PD-textlogo",
  },
];

async function download(item) {
  const response = await fetch(item.url, {
    headers: { "User-Agent": "OmahAksara-LocalAssetSync/1.0 (repository maintenance)" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${item.name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (item.type === "svg") {
    const svg = bytes.toString("utf8");
    if (!/<svg[\s>]/i.test(svg)) throw new Error(`${item.name}: response is not SVG`);
    if (/<script\b|<foreignObject\b|\son[a-z]+\s*=|href=["']https?:/i.test(svg)) {
      throw new Error(`${item.name}: unsafe SVG content rejected`);
    }
  } else if (item.type === "png") {
    if (bytes.length < 8 || !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
      throw new Error(`${item.name}: response is not PNG`);
    }
  }
  return bytes;
}

async function main() {
  const banksDir = path.join(ROOT, "assets/payment/banks");
  const walletsDir = path.join(ROOT, "assets/payment/wallets");
  await fs.mkdir(banksDir, { recursive: true });
  await fs.mkdir(walletsDir, { recursive: true });

  for (const item of files) {
    const targetDir = item.name === "gopay.svg" ? walletsDir : banksDir;
    const bytes = await download(item);
    await fs.writeFile(path.join(targetDir, item.name), bytes);

    // Preserve the old demo-relative filenames while replacing their mock artwork.
    const legacy = {
      "bca.svg": "clients/demo-katalog/bank/logo-bca.svg",
      "bri.svg": "clients/demo-katalog/bank/logo-bri.svg",
      "mandiri.svg": "clients/demo-katalog/bank/logo-mandiri.svg",
    }[item.name];
    if (legacy) await fs.writeFile(path.join(ROOT, legacy), bytes);
    console.log(`Downloaded ${item.name} (${bytes.length} bytes)`);
  }

  await fs.writeFile(
    path.join(ROOT, "assets/payment/README.md"),
    manifest.join("\n") + "\n"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
