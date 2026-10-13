// @file img_sheet.cjs — 비교 시트(node tools/img_sheet.cjs out.png 높이 a.png b.png …) — 여러 PNG를 같은 높이로 줄여 가로로 붙인다(면적 평균 축소 · 어두운 바탕)
const fs=require('fs'); const path=require('path'); const {decode,encode}=require('./lib_png.cjs');
const [,,out,hS,...files]=process.argv; const H=+hS||320; const pad=12;
const imgs=files.map(f=>{const im=decode(f); const sc=H/im.h; const W=Math.max(1,Math.round(im.w*sc)); const buf=Buffer.alloc(W*H*4);
  // 면적 평균(축소) 또는 최근접(확대)
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const x0=Math.floor(x/sc),x1=Math.max(x0+1,Math.floor((x+1)/sc)),y0=Math.floor(y/sc),y1=Math.max(y0+1,Math.floor((y+1)/sc)); let r=0,g=0,b=0,a=0,n=0; for(let yy=y0;yy<y1&&yy<im.h;yy++)for(let xx=x0;xx<x1&&xx<im.w;xx++){const o=(yy*im.w+xx)*4; const al=im.data[o+3]/255; r+=im.data[o]*al;g+=im.data[o+1]*al;b+=im.data[o+2]*al;a+=al;n++;} const d=(y*W+x)*4; if(a>0){buf[d]=r/a;buf[d+1]=g/a;buf[d+2]=b/a;} buf[d+3]=n?Math.round(a/n*255):0;}
  return {W,H,buf};});
const TW=imgs.reduce((s,i)=>s+i.W+pad,pad), TH=H+pad*2; const out4=Buffer.alloc(TW*TH*4); for(let i=0;i<TW*TH;i++){out4[i*4]=30;out4[i*4+1]=34;out4[i*4+2]=40;out4[i*4+3]=255;}
let ox=pad; for(const im of imgs){for(let y=0;y<im.H;y++)for(let x=0;x<im.W;x++){const s=(y*im.W+x)*4; const a=im.buf[s+3]/255; if(!a)continue; const d=((y+pad)*TW+ox+x)*4; out4[d]=Math.round(im.buf[s]*a+out4[d]*(1-a)); out4[d+1]=Math.round(im.buf[s+1]*a+out4[d+1]*(1-a)); out4[d+2]=Math.round(im.buf[s+2]*a+out4[d+2]*(1-a));} ox+=im.W+pad;}
encode(TW,TH,out4,out); console.log('sheet',out,TW,TH);
