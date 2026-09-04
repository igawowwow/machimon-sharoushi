/* ヘッドレス整合テスト: index.html の <script src> を順に vm で読み、ダービーを1年分回す */
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
ok(MM&&MM.derby&&MM.DATA.races,"MM.derby + races data");
/* 状態を作る */
const ST={q:{},mm:null};
let seed=42; const rand=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
const c=MM.state.ctx({ST,today:20000,now:Date.now(),rand});
MM.tutorial.finishIntro(c,"テスト街");
c.mm.res.tama=3; MM.hatch.hatch(c); MM.hatch.hatch(c);
MM.town.openArea; c.mm.res.ke=1000; MM.town.openArea(c,"anei");
const cal=MM.derby.cal(c); ok(cal.label==="第1年 4月1週","cal start: "+cal.label);
ok(MM.derby.weekOf(4,1)===1&&MM.derby.weekOf(3,4)===48&&MM.derby.weekOf(6,1)===9,"weekOf mapping");
/* 全レースが暦のどこかにある・重複週なし */
const weeks={}; MM.DATA.races.forEach(r=>{ const w=MM.derby.weekOf(r.m,r.w); ok(w>=1&&w<=48,"race in calendar: "+r.name+" w"+w); weeks[w]=(weeks[w]||0)+1; });
ok(Object.values(weeks).every(v=>v===1),"no two fixed races in the same week");
const st=MM.derby.stable(c); ok(st.length===3,"stable has 3 (uid list): "+st.map(x=>x.sp.name).join(","));
/* 1年ぶん回す: 出走できる週は出走(半分正解)、それ以外は休養 */
let races=0,wins=0,years=0,yearAwards=null; const posCount={};
for(let i=0;i<48*2;i++){
  const rs=MM.derby.weekRaces(c); ok(rs.length>=1&&rs.length<=3,"week "+MM.derby.cal(c).label+" has races "+rs.length);
  const cand=rs.filter(r=>!r.lock); const def=(cand.find(r=>r.def.grade===1)||cand[0]).def;
  const uid=MM.derby.stable(c).filter(x=>x.can)[0].uid;
  const need=MM.derby.needCorrect(c,uid,def);
  const g=MM.derby.enter(c,def.id,uid);
  if(!g){ console.log("✗ enter failed",def.id); process.exitCode=1; break; }
  ok(g.qids.length===def.n,"qids "+g.qids.length+"/"+def.n+" "+def.name+" (目安 正解"+need+"問, 総合力"+g.pw.total+")");
  let over=false, k=0;
  while(!over){ const r=MM.derby.step(c,g,(k%10)<8,4000+k*300); over=r.over; k++; }   /* 80%正解 */
  const f=MM.derby.finish(c,g); races++; if(def.grade===1&&races<40)console.log("  G1",def.name,"→",f.pos,"着 total",g.pw.total,"hits",g.hits); if(f.pos===1)wins++; posCount[f.pos]=(posCount[f.pos]||0)+1;
  ok(f.board.length===8&&f.board.filter(b=>b.me).length===1,"board ok "+def.name+" → "+f.pos+"着 prize "+f.prize);
  const wp=MM.derby.W(c); ok(wp.done===1,"done flag");
  const adv=MM.derby.advance(c); if(adv.newYear){ years++; yearAwards=adv.awards; }
  if(i===0){ /* 2週目は休養: 疲労が減る */ }
}
console.log("races",races,"wins",wins,"positions",JSON.stringify(posCount),"years",years);
ok(years===2,"2 years passed");
ok(yearAwards&&yearAwards.length>=1,"year awards: "+JSON.stringify((yearAwards||[]).map(a=>a.name+":"+a.text)));
const wp=MM.derby.W(c); ok(wp.total.run===races&&wp.total.win===wins,"totals consistent");
ok(c.mm.res.g>0,"coins earned: "+c.mm.res.g);
/* 引退・殿堂・血統 */
const u0=Object.keys(c.mm.mons)[0]; ok(MM.derby.age(c,u0)===4,"age after 2 years = 4: "+MM.derby.age(c,u0));
ok(MM.derby.canRetire(c,u0),"can retire");
const h=MM.derby.retire(c,u0); ok(h&&wp.hall.length===1,"hall entry "+JSON.stringify(h));
ok(!MM.derby.canRun(c,u0),"retired cannot run");
const sub=h.sub; ok(MM.derby.legacy(c,sub)===Math.min(15,h.g1*3+h.win),"legacy bonus "+MM.derby.legacy(c,sub));
/* 正規化の往復 */
const json=JSON.parse(JSON.stringify(c.mm));
const n=MM.state.normalize(json); ok(n.wp&&n.wp.y===wp.y&&n.wp.w===wp.w&&Object.keys(n.wp.rec).length===Object.keys(wp.rec).length&&n.wp.hall.length===1,"normalize round-trip keeps wp");
ok(MM.state.normalize({}).wp===null||MM.state.normalize({}).wp.y===1,"normalize with no wp is safe");
const n2=MM.derby.normalize({y:"x",w:999,rec:{a:{born:-5,fat:99}},hall:"bad"}); ok(n2.y===1&&n2.w===48&&n2.rec.a.born===1&&n2.rec.a.fat===20&&n2.hall.length===0,"normalize clamps garbage");
/* 秘書 */
ok(typeof MM.derby.secretary(c)==="string"&&MM.derby.secretary(c).length>4,"secretary: "+MM.derby.secretary(c));
/* UI画面が例外なく描ける */
win.gameState=ST; MM.ui.route={screen:"derby",params:{}};
for(const [scr,p] of [["derby",{}],["hall",{}],["derbyHist",{}],["horse",{uid:u0}],["derbyEntry",{race:MM.derby.weekRaces(c)[0].def.id}],["derbyYear",{awards:yearAwards,y:3}],["town",{}]]){
  try{ const html=MM.ui.screens[scr](p); ok(typeof html==="string"&&html.length>200&&html.indexOf("undefined")<0&&html.indexOf("NaN")<0,"screen "+scr+" renders ("+html.length+"ch)"); }catch(e){ ok(false,"screen "+scr+" threw: "+e.stack.split("\n").slice(0,2).join(" ")); }
}
/* レース画面(出走中) */
{ const rs=MM.derby.weekRaces(c).filter(r=>!r.lock); const uid=MM.derby.stable(c).filter(x=>x.can)[0].uid;
  MM.ui.derbyStart(rs[0].def.id,uid); ok(MM.ui.racing(),"racing state");
  const html=MM.ui.screens.derby({}); ok(html.indexOf("mm-track")>0&&html.indexOf("undefined")<0,"race screen renders track");
  MM.ui.raceAnswer(true); ok(MM.ui.racing(),"still racing after 1 answer");
  const html2=MM.ui.screens.derby({}); ok(html2.indexOf("2 / ")>0,"question 2 shown");
}
console.log(process.exitCode?"FAILED":"ALL OK");
