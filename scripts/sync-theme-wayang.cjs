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
    const response = await fetch(asset.url, {
      redirect: "follow",
      headers: { "User-Agent": "OmahAksara-ThemeAssetSync/1.0" }
    });
    if (!response.ok) throw new Error(asset.file + ": HTTP " + response.status);
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
