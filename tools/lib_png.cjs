// 순수 Node PNG 디코더/인코더(zlib 내장) — 8비트 RGB/RGBA/그레이/팔레트, 비인터레이스
const zlib = require('zlib');
const fs = require('fs');
function crc32(buf){let c,crc=0xffffffff;for(let n=0;n<buf.length;n++){c=(crc^buf[n])&0xff;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crc=(crc>>>8)^c;}return (crc^0xffffffff)>>>0;}
function decode(file){
  const b=fs.readFileSync(file); let p=8; let w,h,bd,ct,il; const idat=[]; let plte=null, trns=null;
  while(p<b.length){const len=b.readUInt32BE(p); const type=b.toString('ascii',p+4,p+8); const d=b.subarray(p+8,p+8+len);
    if(type==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);bd=d[8];ct=d[9];il=d[12];}
    else if(type==='IDAT')idat.push(d); else if(type==='PLTE')plte=d; else if(type==='tRNS')trns=d;
    p+=12+len;}
  if(bd!==8) throw new Error('bitdepth '+bd+' unsupported'); if(il) throw new Error('interlaced unsupported');
  const ch = ct===6?4: ct===2?3: ct===4?2: 1; const bpp=ch; const stride=w*ch;
  const raw=zlib.inflateSync(Buffer.concat(idat)); const out=Buffer.alloc(w*h*4);
  let prev=Buffer.alloc(stride), cur=Buffer.alloc(stride); let rp=0;
  for(let y=0;y<h;y++){const f=raw[rp++]; raw.copy(cur,0,rp,rp+stride); rp+=stride;
    for(let i=0;i<stride;i++){const a=i>=bpp?cur[i-bpp]:0, bb=prev[i], c=i>=bpp?prev[i-bpp]:0; let v=cur[i];
      if(f===1)v+=a; else if(f===2)v+=bb; else if(f===3)v+=(a+bb)>>1; else if(f===4){const pp=a+bb-c;const pa=Math.abs(pp-a),pb=Math.abs(pp-bb),pc=Math.abs(pp-c); v+= (pa<=pb&&pa<=pc)?a:(pb<=pc?bb:c);} cur[i]=v&255;}
    for(let x=0;x<w;x++){const o=(y*w+x)*4;
      if(ct===6){out[o]=cur[x*4];out[o+1]=cur[x*4+1];out[o+2]=cur[x*4+2];out[o+3]=cur[x*4+3];}
      else if(ct===2){out[o]=cur[x*3];out[o+1]=cur[x*3+1];out[o+2]=cur[x*3+2];out[o+3]=255;}
      else if(ct===0){out[o]=out[o+1]=out[o+2]=cur[x];out[o+3]=255;}
      else if(ct===4){out[o]=out[o+1]=out[o+2]=cur[x*2];out[o+3]=cur[x*2+1];}
      else if(ct===3){const i=cur[x];out[o]=plte[i*3];out[o+1]=plte[i*3+1];out[o+2]=plte[i*3+2];out[o+3]=trns&&i<trns.length?trns[i]:255;}}
    const t=prev;prev=cur;cur=t;}
  return {w,h,data:out,ct,bd};
}
function encode(w,h,data,file){ // RGBA
  const stride=w*4; const raw=Buffer.alloc((stride+1)*h);
  for(let y=0;y<h;y++){raw[y*(stride+1)]=0; data.copy(raw,y*(stride+1)+1,y*stride,(y+1)*stride);}
  const chunk=(type,d)=>{const len=Buffer.alloc(4);len.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(type,'ascii'),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc32(td));return Buffer.concat([len,td,c]);};
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
  fs.writeFileSync(file,png); return png.length;
}
module.exports={decode,encode};
