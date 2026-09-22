/* ヘッドレス整合テスト: index.html の <script src> を順に vm で読み、ガーデンを数年ぶん自動プレイする */
const fs=require("fs"),vm=require("vm"),path=require("path");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const srcs=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
const store={};
const el=()=>({innerHTML:"",style:{},remove(){},appendChild(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},querySelector(){return null},querySelectorAll(){return []}});
const win={ console, Math, Date, JSON, Number, String, Object, Array, Map, Set, WeakSet, Promise, RegExp, Error, parseInt, parseFloat, isFinite, isNaN, encodeURIComponent, decodeURIComponent,
  setTimeout:(f)=>0, clearTimeout(){}, setInterval:()=>0, clearInterval(){}, requestAnimationFrame:()=>0, queueMicrotask:(f)=>f(),
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}},
  sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  navigator:{userAgent:"node",language:"ja",serviceWorker:null,vibrate(){}},
  location:{href:"http://127.0.0.1/",search:"",hash:"",reload(){},pathname:"/"},
  addEventListener(){}, removeEventListener(){}, dispatchEvent(){}, matchMedia:()=>({matches:false,addListener(){},addEventListener(){}}),
  scrollTo(){}, alert(){}, confirm:()=>true, CustomEvent:function(){}, Event:function(){},
  AudioContext:undefined, __MM_STANDALONE:1, performance:{now:()=>Date.now()},
  getComputedStyle:()=>({}), innerWidth:390, innerHeight:800, devicePixelRatio:2, screen:{width:390,height:800},
  atob:s=>Buffer.from(s,"base64").toString("binary"), btoa:s=>Buffer.from(s,"binary").toString("base64"),
  Intl, structuredClone:(x)=>JSON.parse(JSON.stringify(x)), Uint8Array, Float32Array, Int32Array, ArrayBuffer, TextEncoder, TextDecoder, URL, Blob:function(){}, Image:function(){},
  fetch:()=>Promise.reject(new Error("no fetch")), caches:undefined, crypto:{getRandomValues:(a)=>{for(let i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*256);return a;},randomUUID:()=>"x"},
};
win.window=win; win.globalThis=win; win.self=win;
win.document={ getElementById:()=>el(), querySelector:()=>el(), querySelectorAll:()=>[], createElement:()=>el(), body:el(), documentElement:{style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}}}, addEventListener(){}, removeEventListener(){}, head:el(), hidden:false, visibilityState:"visible", createTextNode:()=>({}), activeElement:null, readyState:"complete", fonts:{ready:Promise.resolve()} };
vm.createContext(win);
let loaded=0;
for(const s of srcs){ const code=fs.readFileSync(path.join(root,s),"utf8"); try{ vm.runInContext(code,win,{filename:s}); loaded++; }catch(e){ console.log("LOAD FAIL",s,e.message); } }
console.log("scripts loaded:",loaded,"/",srcs.length);
const MM=win.MM; const ok=(c,m)=>{ if(!c){ console.log("✗",m); process.exitCode=1; } else console.log("✓",m); };
ok(win.Q&&win.Q.length>=500,"question bank loaded: "+(win.Q&&win.Q.length));
ok(MM&&MM.garden&&MM.DATA.garden,"MM.garden + data");
const GA=MM.garden, GD=MM.DATA.garden;
const ST={q:{},mm:null};
let seed=Number(process.env.SEED||42); const rand=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
const mk=()=>MM.state.ctx({ST,today:20000,now:Date.now(),rand,dstr:"2026-09-22"});
const c=mk();
MM.tutorial.finishIntro(c,"テスト街");
win.gameState=ST; MM.ui.ctx=mk;
const g=GA.W(c);
ok(g.on&&g.seeds.length===3&&g.mb.length===36&&g.rp.length===24*5,"init: seeds 3 / meiboku 36 / rival plants 120");
ok(GD.contests.length>=120,"graded contests "+GD.contests.length);
const ACC=Number(process.env.ACC||0.8);
function answer(okp){
  const subs=GA.openSubs(c); const id=MM.learn.pick(1,c,{subs})[0];
  const q=win.qById(id); const ok2=rand()<okp;
  const rw=MM.learn.commit(id,ok2,4000,c); const gain=MM.economy.grant(rw,c); MM.evolve.gainXp(c,q.s||0,ok2);
  return gain;
}
const stats={firstBloom:null,wins:0,g1:0,runs:0,breeds:0,pulls:0,bestSum:0,byYear:{},council:[]};
function autoTurn(){
  for(let i=0;i<g.plots.length;i++){ if(!g.plots[i]&&g.seeds.length){ let bi=0; g.seeds.forEach((s,k)=>{ if(GA.sum(s)>GA.sum(g.seeds[bi]))bi=k; }); GA.plant(c,bi,i); } }
  g.plots.forEach((p,i)=>{ if(p&&p.dead){ if(GA.canMeiboku(p)&&!GA.mbFull(g))GA.toMeiboku(c,i); else GA.compost(c,i); } });
  const cs=GA.contestsOf(c,g.w).filter(d=>!GA.isDone(c,d.id));
  g.plots.forEach((p,i)=>{ if(!p||p.bw==null||p.dead)return; for(const d of cs){ if(GA.isDone(c,d.id)||GA.eligible(c,p,d))continue;
      const s=GA.start(c,d.id,i); if(!s)continue; while(s.i<s.n){ GA.step(c,s,rand()<ACC,4000); answers++; } const r=GA.finish(c,s); stats.runs++; if(r.pos===1){stats.wins++; if(d.g===1)stats.g1++;}
      const y=stats.byYear[g.y]||(stats.byYear[g.y]={runs:0,wins:0,g1:0}); y.runs++; if(r.pos===1){y.wins++; if(d.g===1)y.g1++;} break; } });
  const bl=g.plots.map((p,i)=>({p,i})).filter(x=>x.p&&x.p.bw!=null&&!x.p.dead&&x.p.bk!==GA.aw(g)).sort((a,b)=>GA.sum(b.p)-GA.sum(a.p));
  if(bl.length>=1&&g.seeds.length<GA.seedCap(g)-2&&c.mm.res.g>3000){
    let best=null; const cands=bl.slice(0,3).map(x=>({k:"p",i:x.i})).concat(g.mb.slice().sort((a,b)=>GA.mbScore(b)-GA.mbScore(a)).slice(0,8).map(m=>({k:"m",i:m.i})));
    for(const A of cands.filter(x=>x.k==="p"))for(const B of cands){ if(A===B)continue; const pv=GA.preview(c,A,B); if(!pv||pv.err||pv.used||pv.cost>c.mm.res.g*0.5)continue; const v=pv.stats.h.mean+pv.stats.m.mean+pv.stats.o.mean+pv.stats.j.mean+pv.stats.s.mean; if(!best||v>best.v)best={A,B,v}; }
    if(best){ const r=GA.breed(c,best.A,best.B); if(!r.err)stats.breeds++; }
  }
  if(GA.freeReady(c))GA.pull(c,1,"normal",true);
  if(c.mm.res.g>12000&&GA.canPull(c,10,"normal")){ GA.pull(c,10,"normal"); stats.pulls+=10; }
  if(g.medal>=30&&GA.canPull(c,10,"council"))GA.pull(c,10,"council");
  for(const k of ["plot","water","seedbox","green","lab"]){ const cost=GA.facCost(g,k); if(cost!=null&&c.mm.res.g>cost*2.5)GA.upgrade(c,k); }
  while(g.seeds.length>GA.seedCap(g)-3){ let wi=0; g.seeds.forEach((s,k)=>{ if(GA.sum(s)<GA.sum(g.seeds[wi]))wi=k; }); GA.dropSeed(c,wi); }
}
const YEARS=Number(process.env.YEARS||5); let answers=0, lastW=GA.aw(g);
while(g.y<=YEARS&&answers<200000){
  const gain=answer(ACC); answers++;
  if(gain.garden&&gain.garden.bloom.length&&!stats.firstBloom)stats.firstBloom=answers;
  if(GA.aw(g)!==lastW){ lastW=GA.aw(g); autoTurn(); let p; while((p=GA.takePend(c))){ if(p.t==="council")stats.council.push(g.y+"/"+p.res.pos); } }
  if(answers%5===0){ for(let i=0;i<g.plots.length;i++){ if(!g.plots[i]&&g.seeds.length)GA.plant(c,0,i); } }
  g.plots.forEach(p=>{ if(p)stats.bestSum=Math.max(stats.bestSum,GA.sum(p)); });
}
console.log("answers",answers,"years",g.y-1,"firstBloom@",stats.firstBloom,"runs",stats.runs,"wins",stats.wins,"G1",stats.g1,"breeds",stats.breeds,"pulls",stats.pulls);
console.log("byYear",JSON.stringify(stats.byYear));
console.log("council",stats.council.join(" "));
console.log("bestSum",stats.bestSum,"rank",GA.rankOf(c).cur.name,GA.rankOf(c).score,"fame",g.fame,"statue",g.statue,"medal",g.medal,"coins",c.mm.res.g,"titles",Object.keys(g.titles).length+"/"+GD.TITLES.length,"lines+",g.lines.length,"mb",g.mb.length,"own mb",g.mb.filter(m=>m.own).length,"traits",Object.keys(g.trSeen).length,"shiny",g.shiny,"drops",g.drops,"nicks",Object.keys(g.hnf).length);
ok(stats.firstBloom&&stats.firstBloom<=60,"first bloom within 60 answers: "+stats.firstBloom);
ok(stats.runs>0&&stats.wins>0,"contests entered and won");
ok(g.awards.length>0,"year awards happened: "+g.awards.length);
ok(stats.council.length>=YEARS*4-1,"council held "+stats.council.length);
const bad=[]; const chk=(p,w)=>{ if(!p)return; GA.KEYS.forEach(k=>{ if(!(p[k]>=1&&p[k]<=100))bad.push(w+":"+p.n+":"+k+"="+p[k]); }); };
g.plots.forEach(p=>chk(p,"plot")); g.seeds.forEach(p=>chk(p,"seed")); g.mb.forEach(p=>chk(p,"mb")); g.rp.forEach(p=>chk(p,"rp"));
ok(!bad.length,"all stats in 1..100 "+bad.slice(0,3).join(","));
ok(Number.isFinite(c.mm.res.g)&&c.mm.res.g>=0,"coins finite "+c.mm.res.g);
const json=JSON.stringify(c.mm.gd); ok(json.length<400000,"garden save size "+json.length+" bytes");
const round=GA.normalize(JSON.parse(json)); ok(round.plots.length===g.plots.length&&round.mb.length===g.mb.length&&round.rp.length===g.rp.length&&round.seeds.length===g.seeds.length,"normalize roundtrip");
ok(json.indexOf("NaN")<0,"no NaN in save");
const UI=MM.ui; const scr=["garden","gSeeds","gGacha","gBreed","gMb","gFac","gContest","gCouncil","gRec","town","mons","gacha","zukan","build"];
for(const s of scr){ let html=""; try{ html=UI.screens[s]({plot:0})||""; }catch(e){ html="ERR "+e.message; }
  const u=html.indexOf("undefined"), n=html.indexOf("NaN");
  ok(html.length>200&&u<0&&n<0&&html.indexOf("ERR")!==0,"render "+s+" ("+html.length+")"+(u>=0?" undefined@"+html.slice(Math.max(0,u-80),u+10):"")+(n>=0?" NaN@"+html.slice(Math.max(0,n-80),n+5):"")+(html.indexOf("ERR")===0?html:"")); }
const pi=g.plots.findIndex(p=>p); if(pi>=0){ const h=UI.screens.gPlant({plot:pi}); ok(h.indexOf("undefined")<0&&h.indexOf("NaN")<0,"render gPlant"); }
const bp=g.plots.findIndex(p=>p&&p.bw!=null&&!p.dead); if(bp>=0){ UI.gd.sel={a:{k:"p",i:bp},b:{k:"m",i:g.mb[0].i}}; const h=UI.screens.gBreed(); ok(h.indexOf("配合評価")>=0&&h.indexOf("NaN")<0&&h.indexOf("undefined")<0,"render gBreed preview"); }
UI.gd.last={seeds:g.seeds.slice(0,10),from:"gacha"}; ok(UI.screens.gReveal().indexOf("undefined")<0,"render gReveal");
UI.gQuizStart(); ok(UI.screens.gQuiz().indexOf("mm-q")>=0,"render gQuiz");
const cr=GA.council(c); ok(cr&&cr.pos>=1,"council direct "+cr.pos+" "+cr.prize);
ok(GA.shareText(c).length>20,"share text");
console.log(process.exitCode?"FAILED":"ALL OK");
