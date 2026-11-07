#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const root = process.cwd();
const assets = [
  {
    file: "anggada.svg",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Anggada.svg",
    source: "https://commons.wikimedia.org/wiki/File:Anggada.svg"
  },
  {
    file: "hanoman.svg",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/df/Hanoman.svg",
    source: "https://commons.wikimedia.org/wiki/File:Hanoman.svg"
  },
  {
    file: "rama.svg",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Wayang_Rama.svg",
    source: "https://commons.wikimedia.org/wiki/File:Wayang_Rama.svg"
  }
];

async function main() {
  const dir = path.join(root, "assets/themes/wayang");
  await fs.mkdir(dir, { recursive: true });
  for (const asset of assets) {
    let response;
    for (let attempt = 0; attempt < 5; attempt++) {
      response = await fetch(asset.url, {
        redirect: "follow",
        headers: {
          "User-Agent": "OmahAksara-ThemeAssetSync/1.0 (local theme asset mirror)",
          "Accept": "image/svg+xml,text/plain;q=0.9,*/*;q=0.8"
        }
      });
      if (response.ok) break;
      if (response.status !== 429 && response.status < 500) {
        throw new Error(asset.file + ": HTTP " + response.status);
      }
      if (attempt === 4) throw new Error(asset.file + ": HTTP " + response.status + " after retries");
      const waitMs = 4000 * (attempt + 1);
      console.log("Wikimedia rate limit; retrying " + asset.file + " in " + waitMs + "ms");
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    const svg = await response.text();
    if (!/<svg[\s>]/i.test(svg)) throw new Error(asset.file + ": invalid SVG");
    if (/<script\b|<foreignObject\b|\son[a-z]+\s*=|href=["']https?:/i.test(svg)) {
      throw new Error(asset.file + ": unsafe SVG rejected");
    }
    await fs.writeFile(path.join(dir, asset.file), svg, "utf8");
    console.log("Saved " + asset.file + " (" + Buffer.byteLength(svg) + " bytes)");
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
