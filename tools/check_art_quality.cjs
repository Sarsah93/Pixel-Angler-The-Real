/**
 * @file check_art_quality.cjs
 * @description 241차 — 실사 도트 에셋(어종 · 작물 초상) 5기준 실측기(사용자 지시 「해상도 · 비트심도 / 색 재현 / 선명도 · 대비 / 질감 / 노이즈 · 왜곡」).
 *
 *   node tools/check_art_quality.cjs <폴더> [--json out.json] [--fix-alpha]
 *
 *  - 해상도 · 격자: 긴 변 px · 셀 크기(경계 기울기 프로필의 자기상관 주기 · 2~24px) · 가로 셀 수.
 *  - 비트심도 · 알파: 8비트 RGBA 전제 · 불투명 비율 · 반투명 비율(10% 안팎이 정상 — 99%면 알파가 전면 252~253 = 블렌딩 잔재).
 *  - 색 재현: 6비트 양자화 표본 색 수(팔레트 양자화 없으면 수천).
 *  - 선명도 · 대비: 밝기 평균 · 표준편차(sdL) · 평균 경계 기울기(grad).
 *  - 질감 · 노이즈: 셀 평균들의 표준편차(tex) · 셀 안 표준편차(noise — 셀이 평평하면 0, 어종은 20 안팎의 부드러운 셀).
 *  기준(어종 53장 중앙값): 긴 변 1,259 · 셀 6 · 가로 192셀 · 반투명 10% · 색 5,000+ · sdL 60 · grad 6 · noise 22 · tex 49.
 *  `--fix-alpha`: 알파 ≥ 250 → 255 · ≤ 8 → 0으로 정규화한 사본을 `<파일>.fixed.png`로 쓴다(원본은 두지 않는다 — 확인 뒤 바꿔 넣을 것).
 */
const {decode,encode}=require('./lib_png.cjs'); const fs=require('fs'); const path=require('path');
const argv=process.argv.slice(2); const dir=argv[0]; const FIX=argv.includes('--fix-alpha'); const jsonAt=argv.indexOf('--json'); const JSON_OUT=jsonAt>=0?argv[jsonAt+1]:null;
if(!dir||!fs.existsSync(dir)){console.error('폴더를 주세요'); process.exit(1);}
const files=fs.readdirSync(dir).filter(f=>f.toLowerCase().endsWith('.png')&&!f.endsWith('.fixed.png')&&!f.endsWith('_icon.png'));   // 64px 아이콘 판은 기준 대상이 아니다
const STD={long:1259,cell:6,cellsW:192,semiPct:10,colors:5000,sdL:60,grad:6,noise:22,texture:49};
const rows=[];
for(const f of files){
  let img; try{ img=decode(path.join(dir,f)); }catch(e){ rows.push({file:f,err:String(e.message)}); continue; }
  const {w,h,data}=img; const N=w*h;
  // 밝기 · 알파
  const L=new Float32Array(N); let opaque=0,semi=0; const colors=new Set(); let sumL=0,sumL2=0,n=0;
  for(let i=0;i<N;i++){const a=data[i*4+3]; const l=0.2126*data[i*4]+0.7152*data[i*4+1]+0.0722*data[i*4+2]; L[i]=l;
    if(a>0){opaque++; if(a<255)semi++; sumL+=l; sumL2+=l*l; n++; if(i%5===0)colors.add((data[i*4]>>2<<12)|(data[i*4+1]>>2<<6)|(data[i*4+2]>>2));}}
  const meanL=sumL/n, sdL=Math.sqrt(Math.max(0,sumL2/n-meanL*meanL));
  // 가로 경계 기울기 프로필(열마다 |dL/dx| 합) → 자기상관으로 셀 주기 추정
  const prof=new Float64Array(w); let gradSum=0, gcount=0;
  for(let y=0;y<h;y++)for(let x=1;x<w;x++){const i=y*w+x; if(data[i*4+3]===0||data[(i-1)*4+3]===0)continue; const g=Math.abs(L[i]-L[i-1]); prof[x]+=g; gradSum+=g; gcount++;}
  const meanGrad=gradSum/Math.max(1,gcount);
  const pm=prof.reduce((a,b)=>a+b,0)/w; const pc=Array.from(prof,v=>v-pm);
  let bestLag=1,best=-1; const ac=(lag)=>{let s=0;for(let x=0;x+lag<w;x++)s+=pc[x]*pc[x+lag];return s;}; const ac0=ac(0)||1;
  for(let lag=2;lag<=24;lag++){const v=ac(lag)/ac0; if(v>best){best=v;bestLag=lag;}}
  // 세로도
  const profY=new Float64Array(h); for(let y=1;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x; if(data[i*4+3]===0||data[(i-w)*4+3]===0)continue; profY[y]+=Math.abs(L[i]-L[i-w]);}
  const pmy=profY.reduce((a,b)=>a+b,0)/h; const pcy=Array.from(profY,v=>v-pmy); const acy=(lag)=>{let s=0;for(let y=0;y+lag<h;y++)s+=pcy[y]*pcy[y+lag];return s;}; const acy0=acy(0)||1;
  let bestLagY=1,bestY=-1; for(let lag=2;lag<=24;lag++){const v=acy(lag)/acy0; if(v>bestY){bestY=v;bestLagY=lag;}}
  const cell=best>0.25?bestLag:1;
  // 셀 내부 노이즈: 셀 크기로 블록 나눠 블록 내 분산 평균(격자 그림이면 낮다) · 질감: 블록 평균들의 분산
  let inVar=0,blocks=0; const bm=[];
  if(cell>1){for(let by=0;by+cell<=h;by+=cell)for(let bx=0;bx+cell<=w;bx+=cell){let s=0,s2=0,c=0;for(let y=by;y<by+cell;y++)for(let x=bx;x<bx+cell;x++){const i=y*w+x; if(data[i*4+3]<128)continue; s+=L[i];s2+=L[i]*L[i];c++;} if(c<cell*cell*0.9)continue; const m=s/c; inVar+=s2/c-m*m; blocks++; bm.push(m);} }
  const noise=blocks?Math.sqrt(inVar/blocks):NaN; const tm=bm.length?bm.reduce((a,b)=>a+b,0)/bm.length:0; const texture=bm.length?Math.sqrt(bm.reduce((a,b)=>a+(b-tm)*(b-tm),0)/bm.length):NaN;
  // 경계 품질: 반투명 테두리 두께 추정 = semi / (둘레 추정)
  rows.push({file:f,w,h,long:Math.max(w,h),cell,cellY:bestLagY,cellsW:Math.round(w/cell),opaquePct:+(100*opaque/N).toFixed(0),semiPct:+(100*semi/Math.max(1,opaque)).toFixed(1),colors:colors.size,meanL:+meanL.toFixed(0),sdL:+sdL.toFixed(0),grad:+meanGrad.toFixed(1),noise:+noise.toFixed(1),texture:+texture.toFixed(1),bytes:fs.statSync(path.join(dir,f)).size});
}
if(JSON_OUT)fs.writeFileSync(JSON_OUT,JSON.stringify(rows,null,1));
const pad=(s,n)=>String(s).padEnd(n);
console.log(pad('file',34),pad('w×h',10),pad('cell',6),pad('cellsW',6),pad('opq%',5),pad('semi%',6),pad('colors',7),pad('L',4),pad('sdL',4),pad('grad',5),pad('noise',6),pad('tex',5),'flags');
for(const r of rows){ if(r.err){console.log(r.file,'ERR',r.err);continue;}
  const flags=[];
  if(r.semiPct>90)flags.push('알파 전면 <255');
  if(r.cell<=2)flags.push('셀 없음(사진 그대로)'); else if(r.cell>=12)flags.push('셀 굵음('+r.cell+'px)');
  if(r.long<800)flags.push('작음('+r.long+'px)');
  if(r.cellsW<110)flags.push('해상도 낮음('+r.cellsW+'셀)');
  if(r.sdL<35)flags.push('대비 낮음');
  if(r.colors<1500)flags.push('색 적음');
  if(/[A-Z]/.test(r.file))flags.push('대문자 파일명');
  console.log(pad(r.file,34),pad(r.w+'x'+r.h,10),pad(r.cell+'/'+r.cellY,6),pad(r.cellsW,6),pad(r.opaquePct,5),pad(r.semiPct,6),pad(r.colors,7),pad(r.meanL,4),pad(r.sdL,4),pad(r.grad,5),pad(r.noise,6),pad(r.texture,5),flags.join(' · '));
  if(FIX&&r.semiPct>90){const img=decode(path.join(dir,r.file)); const d=img.data; for(let i=3;i<d.length;i+=4){ if(d[i]>=250)d[i]=255; else if(d[i]<=8)d[i]=0; } encode(img.w,img.h,d,path.join(dir,r.file.replace(/\.png$/i,'.fixed.png'))); console.log('   → 알파 정규화 사본:',r.file.replace(/\.png$/i,'.fixed.png')); }
}
const ok=rows.filter(r=>!r.err); const med=(a)=>{const b=[...a].sort((x,y)=>x-y);return b[b.length>>1];};
console.log('\n== 중앙값 (기준) ==');
for(const k of Object.keys(STD)){const a=ok.map(r=>r[k]).filter(v=>!isNaN(v)); console.log(pad(k,8),'med',pad(med(a),8),'min',pad(Math.min(...a),8),'max',pad(Math.max(...a),8),'기준',STD[k]);}
