#!/usr/bin/env node
"use strict";

/**
 * Build a local, attributed catalogue of the SVG bank marks in Wikimedia Commons'
 * "SVG logos of banks in Indonesia" category. Commons permits commercial reuse
 * subject to each file's individual license; non-commercial/restricted items are skipped.
 */
const fs=require("node:fs/promises");
const path=require("node:path");
const ROOT=process.cwd();
const OUT=path.join(ROOT,"assets/payment/banks/catalog");
const API="https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=Category%3ASVG%20logos%20of%20banks%20in%20Indonesia&gcmtype=file&gcmlimit=100&prop=imageinfo&iiprop=url%7Cextmetadata&format=json";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function fetchRetry(url,label){
 let last;
 for(let i=0;i<8;i++){
  let res;
  try{
   res=await fetch(url,{headers:{"User-Agent":"OmahAksara-BankLogoCatalog/1.0 (Wikimedia Commons attribution sync)"},redirect:"follow"});
  }catch(error){
   last=error;
   if(i===7)throw last;
   await sleep(5000*(i+1));
   continue;
  }
  if(res.ok)return res;
  last=new Error(label+" HTTP "+res.status);
  if(![429,500,502,503,504].includes(res.status))throw last;
  const retryAfter=Number(res.headers.get("retry-after")||0)*1000;
  if(i===7)throw last;
  await sleep(Math.max(retryAfter,5000*(i+1)));
 }
 throw last;
}
function clean(v){return String(v||"").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();}
function slug(title){
 return title.replace(/^File:/i,"").replace(/\.svg$/i,"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"bank-logo";
}
async function main(){
 await fs.mkdir(OUT,{recursive:true});
 const apiRes=await fetchRetry(API,"Commons category API");
 const payload=await apiRes.json();
 const pages=Object.values(payload.query?.pages||{}).filter(p=>/\.svg$/i.test(p.title||"")&&p.imageinfo?.[0]?.url);
 const manifest=[];
 let saved=0, skipped=0;
 for(const page of pages){
  const info=page.imageinfo[0], meta=info.extmetadata||{};
  const license=clean(meta.LicenseShortName?.value);
  if(/non.?commercial|\bNC\b|no.?derivatives|\bND\b/i.test(license)){skipped++;continue;}
  const name=slug(page.title)+".svg";
  const target=path.join(OUT,name);
  let bytes;
  try{bytes=await fs.readFile(target);}catch{}
  if(!bytes){
   await sleep(1800);
   const res=await fetchRetry(info.url,page.title);
   bytes=Buffer.from(await res.arrayBuffer());
   const svg=bytes.toString("utf8");
   if(!/<svg[\s>]/i.test(svg)||/<script\b|<foreignObject\b|\son[a-z]+\s*=|href=["']https?:/i.test(svg)){skipped++;continue;}
   await fs.writeFile(target,bytes);saved++;
  }
  manifest.push({
   title:page.title,
   file:"/assets/payment/banks/catalog/"+name,
   source:"https://commons.wikimedia.org/wiki/"+encodeURIComponent(page.title.replace(/ /g,"_")),
   license:license||"See Commons file page",
   licenseUrl:clean(meta.LicenseUrl?.value),
   creator:clean(meta.Artist?.value),
   credit:clean(meta.Credit?.value),
   description:clean(meta.ImageDescription?.value)
  });
 }
 manifest.sort((a,b)=>a.title.localeCompare(b.title));
 await fs.writeFile(path.join(OUT,"manifest.json"),JSON.stringify({source:"Wikimedia Commons — Category:SVG logos of banks in Indonesia",count:manifest.length,items:manifest},null,2)+"\n");
 console.log("Bank logo catalogue: "+manifest.length+" available; "+saved+" downloaded; "+skipped+" skipped.");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
