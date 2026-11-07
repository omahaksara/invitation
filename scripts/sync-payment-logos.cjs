#!/usr/bin/env node
"use strict";
const fs=require("node:fs/promises"),path=require("node:path"),ROOT=process.cwd();
const files=[
{name:"bca.svg",folder:"banks",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg"},
{name:"bri.svg",folder:"banks",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/5/59/BRI_2025.svg"},
{name:"mandiri.svg",folder:"banks",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg"},
{name:"bni.svg",folder:"banks",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg"},
{name:"bsi.svg",folder:"banks",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg"},
{name:"cimb-niaga.svg",folder:"banks",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/3/38/CIMB_Niaga_logo.svg"},
{name:"permata.svg",folder:"banks",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/f/ff/Permata_Bank_%282024%29.svg"},
{name:"danamon.svg",folder:"banks",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/a/a1/Danamon_%282024%29.svg"},
{name:"bank-jatim.svg",folder:"banks",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/3/3b/Bank-Jatim-Logo.svg"},
{name:"bank-sulteng.png",folder:"banks",type:"png",url:"https://newadmin.banksulteng.co.id/media/1787730284_LOGO%20PRODUK%20BANKSULTENG-04.png"},
{name:"gopay.svg",folder:"wallets",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/b/b1/GoPay_logo.svg"},
{name:"dana.png",folder:"wallets",type:"png",url:"https://upload.wikimedia.org/wikipedia/commons/5/52/Dana_logo.png"},
{name:"linkaja.svg",folder:"wallets",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/8/85/LinkAja.svg"},
{name:"qris.svg",folder:"wallets",type:"svg",url:"https://upload.wikimedia.org/wikipedia/commons/e/e1/QRIS_logo.svg"}];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function download(item){
 let response;
 for(let attempt=0;attempt<4;attempt++){
  response=await fetch(item.url,{headers:{"User-Agent":"OmahAksara-LocalAssetSync/1.2 (Omah Aksara repo asset sync)"},redirect:"follow"});
  if(response.ok)break;
  if(response.status!==429 && response.status!==503)throw new Error(item.name+": HTTP "+response.status);
  await sleep(2500*(attempt+1));
 }
 if(!response || !response.ok)throw new Error(item.name+": still rate limited after retries");
 return Buffer.from(await response.arrayBuffer());
}
async function main(){for(const item of files){await sleep(1800);const b=await download(item);if(item.type==="svg"){const s=b.toString("utf8");if(!/<svg[\s>]/i.test(s)||/<script\b|<foreignObject\b|\son[a-z]+\s*=|href=["']https?:/i.test(s))throw new Error(item.name+": unsafe/invalid SVG");}else if(!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error(item.name+": invalid PNG");const dir=path.join(ROOT,"assets/payment",item.folder);await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,item.name),b);if(["bca.svg","bri.svg","mandiri.svg"].includes(item.name))await fs.writeFile(path.join(ROOT,"clients/demo-katalog/bank","logo-"+item.name),b);console.log("Synced "+item.folder+"/"+item.name);}}
main().catch(e=>{console.error(e);process.exitCode=1;});