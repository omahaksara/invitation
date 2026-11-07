#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const ROOT = process.cwd();
const files = [
  { name: "bca.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
  { name: "bri.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/5/59/BRI_2025.svg" },
  { name: "mandiri.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" },
  { name: "bni.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg" },
  { name: "bsi.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg" },
  { name: "cimb.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/3/38/CIMB_Niaga_logo.svg" },
  { name: "permata.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Permata_Bank_%282024%29.svg" },
  { name: "danamon.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Danamon_%282024%29.svg" },
  { name: "bank-jatim.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Bank-Jatim-Logo.svg" },
  { name: "btn.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/c/ca/BTN_2024.svg" },
  { name: "bank-jakarta.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Bank_Jakarta.svg" },
  { name: "bank-nagari.svg", folder: "banks", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/d/db/Bank_Nagari.svg" },
  { name: "bank-bsg.png", folder: "banks", type: "png", url: "https://upload.wikimedia.org/wikipedia/commons/4/48/Logo_Bank_BSG.png" },
  { name: "bank-ntt.png", folder: "banks", type: "png", url: "https://upload.wikimedia.org/wikipedia/commons/7/78/Logo_Bank_NTT.png" },
  { name: "bank-sulteng.png", folder: "banks", type: "png", url: "https://newadmin.banksulteng.co.id/media/1787730284_LOGO%20PRODUK%20BANKSULTENG-04.png" },
  { name: "gopay.svg", folder: "wallets", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/b/b1/GoPay_logo.svg" },
  { name: "dana.png", folder: "wallets", type: "png", url: "https://upload.wikimedia.org/wikipedia/commons/5/52/Dana_logo.png", replace: true },
  { name: "ovo.svg", folder: "wallets", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg", replace: true },
  { name: "linkaja.svg", folder: "wallets", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/8/85/LinkAja.svg" },
  { name: "shopeepay.svg", folder: "wallets", type: "svg", replace: true, url: "https://shopeepay.co.id/assets/spp-logo-C03WIzdh.svg" },
  { name: "qris.svg", folder: "wallets", type: "svg", url: "https://upload.wikimedia.org/wikipedia/commons/e/e1/QRIS_logo.svg" }
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, name) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "OmahAksara-LocalAssetSync/1.3 (payment logo asset maintenance)" },
        redirect: "follow"
      });
      if (response.ok) return Buffer.from(await response.arrayBuffer());
      lastError = new Error(name + ": HTTP " + response.status);
      if (![429, 500, 502, 503, 504].includes(response.status)) throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt === 4) throw lastError;
    }
    await sleep(1000 * (2 ** attempt));
  }
  throw lastError;
}

async function main() {
  for (const item of files) {
    const targetDir = path.join(ROOT, "assets/payment", item.folder);
    const target = path.join(targetDir, item.name);
    await fs.mkdir(targetDir, { recursive: true });

    // Do not redownload a previously validated local asset on every push.
    try {
      const current = await fs.readFile(target);
      if (current.length > 0 && !item.replace) {
        console.log("Already local; keeping " + item.folder + "/" + item.name);
        continue;
      }
    } catch {}

    const bytes = await fetchWithRetry(item.url, item.name);
    if (item.type === "svg") {
      const svg = bytes.toString("utf8");
      if (!/<svg[\s>]/i.test(svg) || /<script\b|<foreignObject\b|\son[a-z]+\s*=|href=["']https?:/i.test(svg)) {
        throw new Error(item.name + ": unsafe or invalid SVG");
      }
    } else if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      throw new Error(item.name + ": invalid PNG");
    }

    await fs.writeFile(target, bytes);
    if (["bca.svg", "bri.svg", "mandiri.svg"].includes(item.name)) {
      await fs.writeFile(path.join(ROOT, "clients/demo-katalog/bank", "logo-" + item.name), bytes);
    }
    console.log("Downloaded " + item.folder + "/" + item.name);
    await sleep(350);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
