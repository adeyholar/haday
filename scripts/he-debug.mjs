import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { verifyLetterInk } = await jiti.import("/workspace/src/lib/letter-shape.ts");
const { strokeModels, rankStrokeModels } = await jiti.import("/workspace/src/lib/letter-strokes.ts");
const { staveRegion } = await jiti.import("/workspace/src/lib/letter-models.ts");
const H=208, W=640, TOP=H*0.24, BASE=H*0.66;
function line(x1,y1,x2,y2,n=24){const s=[];for(let i=0;i<=n;i++){const t=i/n;s.push({x:x1+(x2-x1)*t,y:y1+(y2-y1)*t});}return s;}
function densify(path, step=3.2){const out=[];for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];const d=Math.hypot(b.x-a.x,b.y-a.y);const n=Math.max(1,Math.round(d/step));for(let k=0;k<n;k++){const t=k/n;out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}if(path.length)out.push(path.at(-1));return out;}
function modelInk(letter,mi=0){const model=strokeModels(letter)[mi];const region=staveRegion(letter);const bandH=H*(region.bottom-region.top);const ox=(W-bandH)/2, oy=H*region.top;return model.paths.map(path=>densify(path.map(p=>({x:ox+(p.x/100)*bandH,y:oy+(p.y/100)*bandH}))));}
function screenshotHe(gap=26){
  const T=TOP+6, B=BASE-4, L=300, R=372;
  return [line(L,T,R,T,18), line(R,T,R,B,20), line(L+6,T+gap,L+6,B,16)];
}
function screenshotHe2stroke(gap=26){
  const T=TOP+6, B=BASE-4, L=300, R=372;
  return [line(L,T,R,T,16).concat(line(R,T,R,B,20).slice(1)), line(L+8,T+gap,L+8,B,16)];
}
function chet(){
  const T=TOP+6, B=BASE-4, L=300, R=372;
  return [line(L,T,R,T,18), line(L,T,L,B,20), line(R,T,R,B,20)];
}
function feats(strokes){
  const pts=strokes.flat();
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const p of pts){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);}
  const w=maxX-minX,h=maxY-minY;
  let gapOld=0,gapNew=0,blMin=Infinity,blMax=-Infinity;
  for(const p of pts){
    const xn=(p.x-minX)/w, yn=(p.y-minY)/h;
    if(xn<0.28 && yn>0.12 && yn<0.32) gapOld++;
    if(xn<0.32 && yn>0.04 && yn<0.18) gapNew++;
    if(yn>0.75 && xn<0.55){blMin=Math.min(blMin,p.x);blMax=Math.max(blMax,p.x);}
  }
  const hasLeftFoot=Number.isFinite(blMin) && blMax-blMin>w*0.16;
  return {w:+w.toFixed(1),h:+h.toFixed(1),n:strokes.length,gapOld,gapNew,leftJoinsOld:gapOld>=3,leftJoinsNew:gapNew>=4,hasLeftFoot,footSpan:Number.isFinite(blMin)?+(blMax-blMin).toFixed(1):0};
}
for (const [name,ink,L] of [
  ["chart he 0", modelInk("ה",0), "ה"],
  ["chart he 1", modelInk("ה",1), "ה"],
  ["chart chet 0", modelInk("ח",0), "ה"],
  ["chart chet 0 as chet", modelInk("ח",0), "ח"],
  ["shot he gap26", screenshotHe(26), "ה"],
  ["shot he gap18", screenshotHe(18), "ה"],
  ["shot he gap12", screenshotHe(12), "ה"],
  ["shot he 2s gap26", screenshotHe2stroke(26), "ה"],
  ["shot chet as he", chet(), "ה"],
  ["shot chet as chet", chet(), "ח"],
]) {
  const r=verifyLetterInk(ink,L,{height:H});
  const f=feats(ink);
  const rank=rankStrokeModels(ink).slice(0,4).map(x=>`${x.id}:${x.score.toFixed(2)}`).join(" ");
  console.log(name, "=>", r.match, r.read||"∅", r.score.toFixed(2), f, rank);
}
