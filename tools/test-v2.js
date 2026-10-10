/* 新しい遊び(GD.V2)のテスト: 種類105と絵 / つよさの式 / 個体差 / タマゴの確率 / 旧セーブの引っ越し / 画面
   使い方: node tools/test-v2.js   (npm test から呼ばれる) */
const fs=require("fs"),path=require("path");
const {win,MM,store}=require("./lib-load.js")();
const ok=(c,m)=>{ if(!c){ console.log("✗",m); process.exitCode=1; } else console.log("✓",m); };
const D=MM.DATA, GD=D.garden, GA=MM.garden, M=MM.mon, UI=MM.ui;
const mkRand=(seed)=>()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
const mkCtx=(ST,rand,day)=>MM.state.ctx({ST,today:20000+(day||0),now:1.7e12,rand,dstr:"2026-10-"+String(1+(day||0)).padStart(2,"0")});
const RAR=["N","R","SR","SSR","UR","LG"];
ok(GD.V2===false,"スイッチ GD.V2 は false で出荷状態(今の遊びのまま)");

/* ---------- 種類105と絵 ---------- */
{
  const K=D.kinds;
  ok(K.length===105&&K.filter(k=>!k.only).length===90&&K.filter(k=>k.only).length===15,"種類 105 = 9族×10 + 配合限定15");
  let pat=true; for(let f=0;f<9;f++){ const a=K.filter(k=>!k.only&&k.f===f).map(k=>k.rar).join(""); if(a!=="0001112234")pat=false; }
  ok(pat,"族ごとに N3 R3 SR2 SSR1 UR1");
  const oc=[0,0,0,0,0,0]; K.filter(k=>k.only).forEach(k=>oc[k.rar]++); ok(oc.join(",")==="0,0,3,3,3,6","配合限定 SR3 SSR3 UR3 LG6");
  ok(new Set(K.map(k=>k.id)).size===105&&K.every((k,i)=>k.id==="k"+String(i+1).padStart(3,"0")),"id は k001〜k105 の通し番号");
  ok(new Set(K.map(k=>k.name)).size===105,"名前が重ならない");
  ok(K.every(k=>["h","m","o","j","s"].reduce((a,x)=>a+k.base[x],0)===D.RAR_BASE[k.rar]&&["h","m","o","j","s"].every(x=>k.base[x]>0)),"基礎値の合計がレア度どおり(150/175/200/225/250/270)");
  const P=D.spriteParts; ok(P.bodies.length===8&&P.faces.length===6&&P.accs.length>=45&&P.patterns.length===6,"絵の部品: 体型"+P.bodies.length+" 顔"+P.faces.length+" 小物"+P.accs.length+" 模様"+P.patterns.length);
  ok(K.every(k=>P.bodies.includes(k.look.body)&&P.faces.includes(k.look.face)&&k.look.acc.every(a=>P.accs.includes(a))&&(!k.look.pat||P.patterns.includes(k.look.pat))),"どの種類も、ある部品だけで組まれている");
  const svgs=K.map(k=>MM.pxData(k.id)); 
  ok(svgs.every(s=>s.indexOf("data:image/svg+xml,")===0&&decodeURIComponent(s).split("<rect").length>60),"105種すべて絵が作れる");
  ok(new Set(svgs).size===105,"どの2種も同じ絵にならない(色こみ)");
  let dup=""; for(let f=0;f<9;f++){ const seen={}; K.filter(k=>k.f===f).forEach(k=>{ const g=MM.pxGrid(k.id); if(seen[g])dup=k.id+"="+seen[g]; seen[g]=k.id; }); }
  ok(!dup,"同じ族のなかで、ドットの形が重ならない "+dup);
  ok(K.every(k=>MM.pxData(k.id+"c")!==MM.pxData(k.id)&&MM.pxData(k.id+"c")!==MM.pxData("m01")),"こどもの姿(小物なし)も作れる");
  ok(MM.pxData("m05").length>100&&D.looks.m30,"旧30体の絵は残っている");
  ok(D.natures.length===10&&D.natures.filter(n=>!n.up).length===2&&D.natures.every(n=>(!n.up&&!n.dn)||(n.up&&n.dn&&n.up!==n.dn)),"性格10(うち増減なし2)");
}

/* ---------- つよさの式 ---------- */
const mon=(o)=>M.normMon(Object.assign({i:"t1",k:"k001",lv:1,xp:0,tl:[5,5,5,5,5],na:"n0",tr:[],ef:[0,0,0,0,0]},o));
{
  const base=mon({});
  ok(Math.abs(M.power(base)-150)<=3,"Nの才能ふつう・Lv1 = 約150 ("+M.power(base)+")");
  const kd=D.kindById.k010, p=mon({k:"k010",lv:50,tl:[10,10,10,10,10],ef:[60,60,60,60,60]});
  const want=["h","m","o","j","s"].reduce((a,k)=>a+Math.round(kd.base[k]*(1+0.04*49)*1.40+60),0);
  ok(M.power(p)===want&&Math.abs(want-1336)<=4,"URの才能満点・Lv50・けいこ値300 = 約1,336 ("+M.power(p)+")");
  const a=mon({tl:[0,0,0,0,0]}), b=mon({tl:[10,10,10,10,10]}); ok(Math.abs(M.power(b)/M.power(a)-1.4/0.6)<0.05,"才能で 0.60〜1.40 倍");
  ok(M.power(b)>M.power(mon({k:"k007"})),"才能満点のN("+M.power(b)+")は、ふつうのSR("+M.power(mon({k:"k007"}))+")を上回る");
  const n2=mon({na:"n2"}); ok(M.stat(n2,"o")>M.stat(base,"o")&&M.stat(n2,"m")<M.stat(base,"m")&&M.stat(n2,"h")===M.stat(base,"h"),"性格: 1つ上がり1つ下がる");
  const st=mon({tr:["star"]}); ok(M.power(st)>M.power(base)&&M.power(mon({tr:["giant"]}))>M.power(base),"特性の補正が つよさ に入る");
  ok(M.rank(b).top===1&&M.rank(a).top===100&&M.rank(mon({tl:[8,8,8,8,8]})).top<10,"才能の位置(上位◯%)");
  const g={mons:[mon({i:"x",lv:30}),mon({i:"y",lv:1,tl:[9,9,9,9,9]})],kan:"x",sub:[]};
  ok(M.diff(g,g.mons[1]).d<0&&M.pot(g,g.mons[1]).d>0&&M.pot(g,g.mons[0]).top,"矢印: Lv1でも才能が上なら「育てれば看板ごえ」と出る");
}

/* ---------- 個体差 ---------- */
{
  const c=mkCtx({q:{},mm:null},mkRand(7)), g=M.defaults();
  const pw=(kind,lv)=>{ const a=[]; for(let i=0;i<3000;i++){ const p=M.roll(c,g,{kind}); p.lv=lv; p.tr=[]; a.push(M.power(M.normMon(p))); } return a.sort((x,y)=>x-y); };
  const n=pw("k001",30), r=pw("k004",30), sr=pw("k007",30);
  ok(n[2999]/n[0]>=1.5,"同じ種類3,000体: つよさの最大÷最小 = "+(n[2999]/n[0]).toFixed(2)+" (1.5以上)");
  ok(n[2940]>r[1500],"才能のいいN(上位2% "+n[2940]+")は ふつうのR(真ん中 "+r[1500]+")を上回る");
  ok(sr[2999]>n[2999],"頂点は高レアの才能満点");
}

/* ---------- タマゴの確率と天井 ---------- */
{
  const c=mkCtx({q:{},mm:null},mkRand(99)); const cnt=[0,0,0,0,0], N=100000; for(let i=0;i<N;i++)cnt[M.rollRar(c)]++;
  const R=D.RATE2.rate; ok(cnt.every((x,i)=>Math.abs(x/N-R[i])<=0.003),"10万回: "+cnt.map((x,i)=>RAR[i]+(x/N*100).toFixed(2)+"%").join(" ")+" (表±0.3pt)");
  ok(Math.abs(R.reduce((a,b)=>a+b,0)-1)<1e-9,"確率の合計は100%");
  const ST={q:{},mm:null}; GD.V2=true; const c2=mkCtx(ST,()=>0.1); const g=M.W(c2); c2.mm.res.g=1e6; D.RATE2.cap=999;
  const rs=[]; for(let i=0;i<80;i++){ const r=M.pull(c2,false); rs.push(r.mon?M.rarOf(r.mon):-1); }
  ok(rs.slice(0,79).every(x=>x===0)&&rs[79]>=3&&g.pity===0,"80回目でかならずSSR以上(79回目までN → 80回目 "+RAR[rs[79]]+")");
  ok(c2.mm.res.g===1e6-80*D.RATE2.cost,"タマゴ1回 = コイン"+D.RATE2.cost);
  const f1=M.pull(c2,true), f2=M.pull(c2,true); ok(f1.mon&&f2.err,"無料は1日1回");
  D.RATE2.cap=60; GD.V2=false;
}

/* ---------- 旧セーブからの引っ越し ---------- */
{
  /* 旧い遊びでしばらく遊ぶ(ガチャ・育成・週送り) */
  const ST={q:{},rq:[],mm:null}; const rand=mkRand(42); const c=mkCtx(ST,rand); MM.tutorial.finishIntro(c,"テスト街"); win.gameState=ST;
  const g1=GA.W(c); c.mm.res.g+=40000;
  for(let i=0;i<1500;i++){ const id=MM.learn.pick(1,c,{subs:GA.openSubs(c)})[0]; const rw=MM.learn.commit(id,rand()<0.8,4000,c); MM.economy.grant(rw,c);
    if(i%20===0){ for(let k=0;k<g1.plots.length;k++)if(!g1.plots[k]&&g1.seeds.length)GA.plant(c,0,k); if(GA.canPull(c,10,"normal"))GA.pull(c,10,"normal"); }
    g1.plots.forEach((p,k)=>{ if(p&&p.dead)GA.compost(c,k); }); let pd; while((pd=GA.takePend(c))){} }
  c.mm.tix=7; g1.medal=4; c.mm.res.g=12345;
  const alive=g1.plots.filter(p=>p&&!p.dead).length+g1.seeds.length, adults=g1.plots.filter(p=>p&&!p.dead&&p.bw!=null).length, lg=g1.plots.concat(g1.seeds).filter(p=>p&&!p.dead&&GA.sum(p)>=440).length;
  const raw=JSON.stringify(ST); store["machimon-v1"]=raw; delete store[M.BACKUP_KEY];
  ok(raw.length>30000&&alive>=10,"旧セーブを用意("+raw.length+"バイト・個体"+alive+"・おとな"+adults+")");
  const qBefore=JSON.stringify(ST.q), rqBefore=JSON.stringify(ST.rq), oldGd=JSON.stringify(c.mm.gd);
  const m1=JSON.stringify(M.migrateV1toV2(c.mm.gd,c.mm)), m2=JSON.stringify(M.migrateV1toV2(c.mm.gd,c.mm));
  ok(m1===m2&&JSON.stringify(c.mm.gd)===oldGd,"引っ越しを2回かけても同じ結果・元のデータを書きかえない");
  GD.V2=true;
  const c2=mkCtx(ST,rand); let g2=null, err=""; try{ g2=M.W(c2); }catch(e){ err=e.message; }
  ok(g2&&!err,"引っ越しで落ちない "+err);
  ok(JSON.stringify(ST.q)===qBefore&&JSON.stringify(ST.rq)===rqBefore,"学習の記録(ST.q / ST.rq)が1バイトも変わらない ("+qBefore.length+"バイト)");
  ok(g2.mons.length===alive&&g2.mig===1,"個体の数が保たれる("+g2.mons.length+")");
  ok(g2.mons.filter(p=>p.lv===10).length===adults&&g2.mons.every(p=>p.lv===1||p.lv===10),"おとなはLv10・それ以外はLv1");
  ok(g2.mons.filter(p=>p.first).length===lg&&g2.mons.every(p=>M.rarOf(p)<=4),"LGは同じ族のURへ移し「初代」の印");
  ok(g2.mons.every(p=>GD.families[M.kindOf(p).f]&&p.tl.every(t=>t>=0&&t<=10)),"才能は0〜10");
  ok(c2.mm.res.g===5000&&g2.shard===7+3*(7+4),"コインは5,000まで・超えたぶんと券はかけらへ(かけら "+g2.shard+")");
  ok(store[M.BACKUP_KEY]===raw,"旧セーブを別のキーへ写してある(戻せる)");
  ok(c2.mm.gd===null,"写しが取れたので旧データは手放す");
  const js=JSON.stringify(ST); ok(js.indexOf("NaN")<0&&js.indexOf("undefined")<0,"NaN が無い");
  ok(M.kanban(g2)&&M.power(M.kanban(g2))===Math.max(...g2.mons.map(p=>M.power(p))),"いちばん強い子が看板に立つ");
  const g2b=M.W(mkCtx(ST,rand)); ok(g2b===g2,"引っ越しは1回きり(2回目の起動では走らない)");
  const rt=M.normalize(JSON.parse(JSON.stringify(g2))); ok(JSON.stringify(rt.mons)===JSON.stringify(g2.mons)&&rt.kan===g2.kan&&rt.shard===g2.shard,"保存して読み直しても同じ");
  /* 途中で失敗したら: 元のセーブを残し、最初の1体から始める */
  const ST3=JSON.parse(raw); ST3.mm=MM.state.normalize(ST3.mm); const keep=ST3.mm.gd; const real=GA.normalize; GA.normalize=()=>{ throw new Error("boom"); };
  const wn=win.console.warn; win.console.warn=()=>{}; let g3=null; try{ g3=M.W(mkCtx(ST3,rand)); }catch(e){} GA.normalize=real; win.console.warn=wn;
  ok(g3&&g3.mf===1&&g3.mons.length===1&&ST3.mm.gd===keep&&ST3.mm.res.g===12345,"引っ越しに失敗したら元のセーブをそのまま残す");
  /* 写しが取れない(保存先が使えない)ときも旧データを消さない */
  const ST4=JSON.parse(raw); ST4.mm=MM.state.normalize(ST4.mm); delete store[M.BACKUP_KEY]; delete store["machimon-v1"];
  const g4=M.W(mkCtx(ST4,rand)); ok(g4.mig===1&&ST4.mm.gd&&ST4.mm.gd.on===1,"写しが取れないときは旧データをセーブに残す");
  /* 空・壊れたセーブ */
  const g5=M.W(mkCtx({q:{},mm:null},rand)); ok(g5.mons.length===1&&g5.kan===g5.mons[0].i,"空のセーブ: 最初の1体から始まる");
  const bad={q:{},mm:MM.state.normalize({res:{g:"abc"},gd:{on:1,seeds:"x",plots:[{f:"z",h:"NaN",i:5},null,7],mb:null,fac:"no",medal:"many"},g2:"oops"})};
  let g6=null,e6=""; try{ g6=M.W(mkCtx(bad,rand)); }catch(e){ e6=e.message; } ok(g6&&g6.mons.length>=1&&JSON.stringify(bad).indexOf("NaN")<0,"壊れたセーブでも起動できる "+e6);
  const g7=M.normalize({on:1,mons:[{i:"a1",k:"nope"},{i:"a2",k:"k003",lv:"x",tl:[99,-4,"a"],ef:[1e9],na:"zz",tr:["no","star","star"]},"str"],kan:"a9",sub:["a2","a2","q"],shard:-5});
  ok(g7.mons.length===1&&g7.mons[0].lv===1&&g7.mons[0].tl.join()==="10,0,0,0,0"&&g7.mons[0].ef[0]===100&&g7.mons[0].tr.join()==="star"&&g7.kan===""&&g7.shard===0,"壊れた値は安全な値へ丸める");

  /* ---------- 育つ(けいこ) ---------- */
  const STn={q:{},rq:[],mm:null}, cn=mkCtx(STn,mkRand(5)); MM.tutorial.finishIntro(cn,"あたらしい街"); win.gameState=STn; UI.ctx=()=>mkCtx(STn,cn.rand,cn._d||0);
  const gn=M.W(cn), k=M.kanban(gn), c0=cn.mm.res.g;
  let id=MM.learn.pick(1,cn,{subs:[0]})[0]; let gain=MM.economy.grant(MM.learn.commit(id,true,500,cn),cn);
  ok(gain.g===0&&k.xp===0&&cn.mm.res.g===c0,"2秒未満のまぐれ当たりは何も出ない");
  id=MM.learn.pick(1,cn,{subs:[0]})[0]; gain=MM.economy.grant(MM.learn.commit(id,false,4000,cn),cn); ok(gain.g===0&&k.xp===0,"まちがいは何も出ない");
  id=MM.learn.pick(1,cn,{subs:[0]})[0]; gain=MM.economy.grant(MM.learn.commit(id,true,4000,cn),cn);
  ok(gain.g===10&&gain.mon.xp===10&&cn.mm.res.g===c0+10&&gain.ke===0&&gain.tama===0&&gain.mat===0,"あたらしい問題の正解 = コイン10・経験10(ほかのお金は出ない)");
  MM.state.rollDay(cn); const w0=JSON.stringify(cn.mm.res); MM.economy.idle(cn); ok(JSON.stringify(cn.mm.g2.mons)===JSON.stringify(gn.mons),"放置では育たない");
  const pz=mon({i:"z",k:k.k}); M.addXp(pz,1e7,M.lvCap(cn,pz)); ok(pz.lv===D.LVCAP.base,"習熟が無いうちは Lv"+D.LVCAP.base+" が上限(それ以上にならない)");
  const pe=mon({i:"e"}); for(let i=0;i<5000;i++)M.addEf(pe,"hmojs"[i%5],0.9); ok(Math.abs(pe.ef.reduce((a,b)=>a+b,0)-300)<1e-6&&pe.ef.every(v=>v<=100),"けいこ値は合計300・1つ100まで");
  ok(M.release(cn,k.i).err&&gn.mons.length===1,"看板と最後の1体は手放せない");
  cn.mm.res.g=3000; const pr=M.pull(cn,false); const sh0=gn.shard; ok(pr.mon&&M.release(cn,pr.mon.i).shard===D.SHARD[M.rarOf(pr.mon)]&&gn.shard===sh0+D.SHARD[M.rarOf(pr.mon)],"手放すとレア度どおりのかけらになる");

  /* ---------- 画面 ---------- */
  for(let i=0;i<6;i++)M.pull(cn,false);
  const scr=[["h2",{}],["n2",{}],["n2d",{id:gn.mons[1].i}],["n2d",{id:gn.kan}],["t2",{}]];
  UI.v2.last={mon:gn.mons[gn.mons.length-1],isNew:true}; scr.push(["t2r",{}]); scr.push(["k2m",{}]); UI.k2Go("new"); scr.push(["k2",{}]);
  for(const [s,p] of scr){ let h=""; try{ h=UI.screens[s](p)||""; }catch(e){ h="ERR "+e.message; } const u=h.indexOf("undefined"), n=h.indexOf("NaN");
    ok(h.length>200&&u<0&&n<0&&h.indexOf("ERR")!==0,"render "+s+" ("+h.length+")"+(u>=0?" undefined@"+h.slice(Math.max(0,u-60),u+10):"")+(n>=0?" NaN@"+h.slice(Math.max(0,n-60),n+5):"")+(h.indexOf("ERR")===0?h:"")); }
  ok(UI.screens.h2().indexOf("つよさ")>0&&UI.screens.n2().split("つよさ").length>=1&&UI.screens.n2d({id:gn.mons[1].i}).indexOf("才能")>0,"ホーム・詳細に つよさ と 才能 が出る");
  UI.go("garden"); const r1=UI.route.screen; UI.go("gContest"); const r2=UI.route.screen; UI.go("town"); ok(r1==="h2"&&r2==="h2"&&UI.route.screen==="h2","新しい遊びのあいだ、旧い画面(大会・街評議会・街)へは行けない");
  ok(GA.tick(cn)===null&&!cn.mm.gd,"暦(週送り)は動かない・旧セーブは作られない");
  module.exports={STn,cn,gn,mkCtx,mkRand,ok,win,MM,store,mon};
}

/* ================= スライス3: 番付と五番勝負 ================= */
{
  const {STn,cn,gn}=module.exports; const BZ=MM.banzuke, B=D.banzuke, R=D.BASHO; const {banHit,rpgHit}=require("./lib-load.js");
  /* ---------- 番付の表 ---------- */
  ok(B.length===60&&B.every((b,i)=>b.pos===i+1),"番付は60枚(1=横綱 … 60=いちばん下)");
  let mono=true, monoS=true; for(let i=1;i<60;i++){ if(B[i-1].power<=B[i].power)mono=false; if(BZ.foePower(B[i-1])<=BZ.foePower(B[i]))monoS=false; }
  ok(mono&&monoS,"相手60体のつよさが、下から上へ必ず大きくなる("+B[59].power+" → "+B[0].power+")");
  ok(B.every(b=>["h","m","o","j","s"].reduce((a,k)=>a+b.stats[k],0)===b.power&&D.kindById[b.kind]&&D.bzRival(b.rival).taunt),"相手の能力の合計=つよさ・種類と親方がそろっている");
  const cover={}; D.DAN.forEach(d=>{ for(let p=d.top;p<=d.bot;p++)cover[p]=(cover[p]||0)+1; });
  ok(D.DAN.length===8&&Object.keys(cover).length===60&&Object.values(cover).every(v=>v===1)&&D.DAN.map(d=>d.name).join()==="序ノ口,序二段,三段目,幕下,十両,前頭,三役,横綱","8段が60枚をすきまなく分ける");
  ok(D.DAN.slice(1).every(d=>B[d.bot-1].gate)&&B.filter(b=>b.gate).length===7,"段の入口(関門)が7つ");
  ok(new Set(B.map(b=>b.rival)).size===25,"相手は今のライバル24組＋いまの横綱");
  const J1=JSON.stringify(B); const again=require("./lib-load.js")().MM.DATA.banzuke; ok(JSON.stringify(again)===J1,"相手は決め打ち(読み込み直しても同じ)");

  /* ---------- 五番勝負に運が無い ---------- */
  const fresh=(seed)=>{ const ST={q:{},rq:[],mm:null}; const c=mkCtx(ST,mkRand(seed)); MM.tutorial.finishIntro(c,"番付の街"); M.W(c); return c; };
  const day=(c,n)=>{ c.dstr="2027-01-"+String(n).padStart(3,"0"); c.today=21000+n; MM.state.rollDay(c); };
  const run=(c,pat,ms,scale)=>{ const s=BZ.start(c); if(s.err)return s; if(scale!=null){ const foe=D.bzAt(s.foe); ["h","m","o","j","s"].forEach(k=>{ s.mine[k]=foe.stats[k]*scale; }); }
    let r,i=0; do{ r=BZ.round(c,s,!!pat[i],ms); i++; }while(r&&!r.over); return {s,res:BZ.finish(c,s)}; };
  const a1=fresh(1), a2=fresh(999); a2.mm.g2.mons=JSON.parse(JSON.stringify(a1.mm.g2.mons)); a2.mm.g2.kan=a1.mm.g2.kan; const o1=run(a1,[1,0,1,1,0],4000), o2=run(a2,[1,0,1,1,0],4000);
  ok(JSON.stringify(o1.s.rounds)===JSON.stringify(o2.s.rounds)&&o1.res.won===o2.res.won,"同じ入力なら必ず同じ結果(乱数の種を変えても、数字も勝ち負けも同じ)");
  { const c=fresh(3); const s=BZ.start(c); const mr=win.Math.random, cr=c.rand; let used=0; win.Math.random=()=>{ used++; return 0.5; }; c.rand=()=>{ used++; return 0.5; };
    let r; do{ r=BZ.round(c,s,true,4000); }while(r&&!r.over); BZ.finish(c,s); win.Math.random=mr; c.rand=cr; ok(used===0,"勝ち負けを決める間、乱数を1回も使わない"); }
  { const c=fresh(4); const h=run(c,[1,1,1,1,1],4000,0.5); ok(!h.res.won&&h.s.w===0,"つよさが相手の半分なら、全問(はやく)正解でも負ける");
    const d=run(c,[0,0,0,0,0],4000,2); ok(d.res.won&&d.s.l===0,"つよさが相手の2倍なら、全問不正解でも勝つ");
    day(c,2); const e1=run(c,[1,1,1,1,1],20000,1), e2=run(c,[0,0,0,0,0],20000,1);
    day(c,3); const e3=run(c,[1,0,0,1,1],20000,1), e4=run(c,[1,0,0,1,0],20000,1);
    ok(e1.res.won&&!e2.res.won&&e3.res.won&&!e4.res.won,"同じつよさなら、正解の数で決まる(3問正解で勝ち・2問では負け)"); }
  { const c=fresh(5); const s=BZ.start(c), foe=D.bzAt(s.foe); let good=true;
    s.fc.rows.forEach((row,i)=>{ const me=s.mine[row.k]; const fo=BZ.foeShow(foe,row.k);
      const w=(m)=>Math.round(me*m)>fo; const want=w(R.miss)?"◎":(w(R.hit)?"▲":(w(R.fast)?"△":"▼")); if(want!==row.mark)good=false; });
    ok(good&&s.fc.rows.length===5&&s.qids.length===5&&new Set(s.qids).size===5,"見込みの印(◎▲△▼)は、実際の勝ち負けの式と同じ・5問は重ならない");
    const exN=s.qids.filter(id=>GA.isExam(win.qById(id))).length; ok(exN===R.exam,"5問のうち本試験形式が"+R.exam+"問 ("+exN+")");
    const before=Object.keys(c.ST.q).filter(id=>(c.ST.q[id].c||0)+(c.ST.q[id].w||0)>0).length; let r,n=0; do{ r=BZ.round(c,s,true,5000); n++; }while(r&&!r.over); BZ.finish(c,s);
    const after=Object.keys(c.ST.q).filter(id=>(c.ST.q[id].c||0)+(c.ST.q[id].w||0)>0).length; ok(after-before===n,"取組で答えた問題も、学習の記録に入る("+n+"問)"); }
  { const c=fresh(6); const s=BZ.start(c); const q1=BZ.round(c,s,true,500), q2=BZ.round(c,s,true,4000), q3=BZ.round(c,s,true,9000);
    ok(q1.mult===1&&q2.mult===R.fast&&q3.mult===1&&BZ.round(c,s,false,4000).mult===R.miss,"はやさ: 2〜8秒の正解だけ×1.1(2秒未満のまぐれ当たりには付かない)・不正解は×0.5"); }

  /* ---------- 場所: 1日2番・7番で締め・昇降 ---------- */
  { const c=fresh(7), z=BZ.Z(c); let d=1; day(c,d);
    const bout=(winIt)=>{ if(BZ.leftToday(c)<=0){ d++; day(c,d); } return run(c,[1,1,1,1,1],20000,winIt?3:0.1); };
    ok(z.pos===61&&BZ.state(c).left===4,"はじめは番付の外・序ノ口と序二段のあいだは1日4番");
    for(let i=0;i<4;i++)bout(true); const fifth=BZ.start(c); ok(fifth.err&&z.n===4,"1日4番を超えて取れない");
    d++; day(c,d); ok(BZ.state(c).left===4,"日付が変わると取れる");
    for(let i=0;i<2;i++)bout(true); ok(z.n===6&&z.w===6&&z.basho===1,"6番まで: 場所は続く");
    { const zp=z.pos; z.pos=50; const l2=BZ.perDay(c); z.pos=51; const l4=BZ.perDay(c); z.pos=zp; ok(l2===2&&l4===4,"三段目からは1日2番"); }
    const last=bout(true); ok(last.res.basho&&last.res.basho.w===7&&z.n===0&&z.w===0&&z.basho===2&&z.hist.length===1,"7番で場所が締まる(星取りは0にもどる)");
    ok(z.pos===56&&last.res.basho.delta===5&&BZ.isPromo(z),"全勝で5枚あがる(61→56=序ノ口のいちばん上)。次は昇進の一番");
    const st0=z.story; const pl=bout(false); ok(pl.res.promo&&!pl.res.promo.won&&z.pos===56&&z.n===0,"昇進の一番に負けても、番付は動かない(星取りにも入らない)");
    const pw=bout(true); ok(pw.res.promo.won&&z.pos===55&&BZ.danOf(z.pos).name==="序二段"&&z.story===st0+1&&pw.res.story===z.story,"昇進の一番に勝つと次の段へ・物語が1話ひらく");
    /* 昇降の表 */
    const basho=(from,wins)=>{ z.pos=from; z.w=0; z.l=0; z.n=0; let res; for(let i=0;i<7;i++)res=bout(i<wins); return {to:z.pos,res:res.res}; };
    ok(basho(40,4).to===39&&basho(40,5).to===38&&basho(40,6).to===37&&basho(42,7).to===37,"4勝+1枚 5勝+2枚 6勝+3枚 全勝+5枚");
    ok(basho(40,3).to===41&&basho(40,0).to===41,"3勝以下は1枚さがる");
    ok(basho(60,2).to===60&&basho(61,1).to===61,"最下位と番付の外では さがらない");
    ok(basho(34,7).to===33&&BZ.isPromo(z),"段をまたぐには昇進の一番が要る(幕下のいちばん上で止まる)");
    z.pos=2; ok(BZ.isPromo(z)&&BZ.nextFoe(c).foe.pos===1,"三役のいちばん上の次は 横綱との一番"); const yk=bout(true); ok(z.pos===1&&yk.res.promo.won&&BZ.state(c).yokozuna,"勝てば横綱");
    ok(basho(1,0).to===1&&BZ.foes(z).length===7,"横綱は さがらない(守る場所が続く)");
    /* 途中でやめたら負け */
    z.pos=40; z.w=0; z.l=0; z.n=0; d++; day(c,d); const tl0=z.tl; BZ.start(c); const stA=(BZ.settleAbandoned(c),BZ.state(c)); ok(stA.l===1&&stA.n===1&&z.tl===tl0+1&&z.cur===null,"取組を途中でやめたら負けになる(無かったことにはできない)");
    const f7=BZ.foes(z); ok(f7.length===7&&f7.every(p=>p>=33&&p<=60)&&f7.join()===f7.slice().sort((a,b)=>b-a).join(),"今場所の相手は7人・同じ段までの相手・弱い順");
    const nz=BZ.norm(JSON.parse(JSON.stringify(z))); ok(JSON.stringify(nz)===JSON.stringify(z),"番付の保存→読み直しで同じ");
    ok(BZ.norm({pos:"x",w:99,l:-3,n:"q",day:5,hist:"no",story:77}).pos===61,"壊れた番付の値は安全な値へ丸める"); }

  /* ---------- 画面 ---------- */
  { win.gameState=STn; cn._d=20; const c=UI.ctx(); MM.state.rollDay(c); UI.bzS.noScroll=1;
    const chk=(name,h)=>{ const u=h.indexOf("undefined"), n=h.indexOf("NaN"), b=banHit(h), r=rpgHit(h); ok(h.length>200&&u<0&&n<0&&!b&&!r,"render "+name+" ("+h.length+")"+(u>=0?" undefined@"+h.slice(Math.max(0,u-60),u+10):"")+(n>=0?" NaN@"+h.slice(Math.max(0,n-60),n+5):"")+(b?" 禁止語:"+b:"")+(r?" RPGの言葉:"+r:"")); };
    chk("h2(番付つき)",UI.screens.h2()); ok(UI.screens.h2().indexOf("つぎの相手")>0,"ホームに 番付・つぎの相手・見込み が出る");
    chk("bz",UI.screens.bz()); chk("bzPre",UI.screens.bzPre()); ok(/◎|▲|△|▼/.test(UI.screens.bzPre())&&UI.screens.bzPre().indexOf("3本とれば勝ち")>0,"取組の前に 見込み(◎▲△▼) が出る");
    UI.bzGo(); ok(UI.route.screen==="bzBout","取組がはじまる"); chk("bzBout(問題)",UI.screens.bzBout());
    let guard=0; while(UI.bzS.bout&&guard++<6){ const s=UI.bzS.bout, q=win.qById(s.qids[s.i]); if(q.sentaku){ for(let k=0;k<q.blanks.length;k++)UI.bzAns(q.blanks[k].ok); } else UI.bzAns(q.choices&&q.choices.length&&q.format!=="true_false"?0:true); if(guard===1)chk("bzBout(1本の結果)",UI.screens.bzBout()); UI.bzNext(); }
    ok(UI.route.screen==="bzRes"&&UI.bzS.res,"取組が終わると結果の画面へ"); chk("bzRes",UI.screens.bzRes());
    for(const sname of ["n2","t2","k2"])chk(sname,UI.screens[sname]({}));
    chk("n2d",UI.screens.n2d({id:gn.kan})); }

}

/* ================= スライス4: 配合と育成どうぐ ================= */
{
  const {mkCtx,mkRand,mon}=module.exports; const BR=MM.breed, KE=MM.keiko, BZ=MM.banzuke, B=D.BREED; const {banHit,rpgHit}=require("./lib-load.js");
  const fresh=(seed)=>{ const ST={q:{},rq:[],mm:null}; const c=mkCtx(ST,mkRand(seed)); MM.tutorial.finishIntro(c,"配合の街"); win.gameState=ST; M.W(c); return c; };
  const put=(c,o)=>{ const g=M.W(c); const p=M.normMon(Object.assign({i:"a"+(g.nid++),k:"k001",lv:1,xp:0,tl:[5,5,5,5,5],na:"n0",tr:[],ef:[0,0,0,0,0]},o)); g.mons.push(p); return p; };
  const c=fresh(11), g=M.W(c); g.hn=["0|1"]; g.hnf={};
  ok(D.ITEMS.length===12&&new Set(D.ITEMS.map(t=>t.id)).size===12&&D.ITEMS.every(t=>t.name&&t.desc&&"bmk".includes(t.use)),"育成どうぐは12種");
  /* 才能の継ぎ方(1万回) */
  const A=put(c,{k:"k001",tl:[10,2,6,6,3]}), Bn=put(c,{k:"k021",tl:[4,8,6,6,9]}), cpN=BR.compat(g,A,Bn);     /* ザンギョン×キューキュー: 相性なし */
  ok(!cpN.any,"相性の無い組");
  const N=10000, r=mkRand(77), cnt={hi:0,lo:0,re:0,up:0,same:0}, dn=BR.kindDist(A,Bn,"");
  for(let i=0;i<N;i++){ const p=BR.make(r,g,A,Bn,"",dn,cpN); if(p.tl[0]===10)cnt.hi++; else if(p.tl[0]===4)cnt.lo++; else cnt.re++; if(p.tl[2]===7)cnt.up++; }
  const w=D.TALENT_W, wt=w.reduce((a,b)=>a+b,0), pHi=B.hi+(1-B.hi-B.lo)*w[10]/wt, pLo=B.lo+(1-B.hi-B.lo)*w[4]/wt;
  ok(Math.abs(cnt.hi/N-pHi)<0.02&&Math.abs(cnt.lo/N-pLo)<0.02,"才能: 高いほう"+(cnt.hi/N*100).toFixed(1)+"% 低いほう"+(cnt.lo/N*100).toFixed(1)+"% (高50%・低25%・ふり直し25%)");
  ok(Math.abs(cnt.up/N-(B.up+(1-B.up)*(1-B.hi-B.lo)*w[7]/wt))<0.012,"両親が同じ値のときだけ +1 ("+(cnt.up/N*100).toFixed(1)+"%)");
  const Bc=put(c,{k:"k061",tl:[4,8,6,6,9]}), cpC=BR.compat(g,A,Bc), dc=BR.kindDist(A,Bc,""); let hiC=0, other=0;   /* ザンギョン×キソネン: 族の相性 */
  for(let i=0;i<N;i++){ const p=BR.make(r,g,A,Bc,"",dc,cpC); if(p.tl[0]===10)hiC++; if(p.tl[0]!==10&&p.tl[0]!==4)other++; }
  ok(cpC.pub&&Math.abs(hiC/N-0.75)<0.02&&other===0,"族の相性がある組は 75%で高いほう・ふり直しなし ("+(hiC/N*100).toFixed(1)+"%)");
  const Bh=put(c,{k:"k011",tl:[4,8,6,6,9]}), cpH=BR.compat(g,A,Bh), dh=BR.kindDist(A,Bh,""); let upH=0; for(let i=0;i<N;i++){ if(BR.make(r,g,A,Bh,"",dh,cpH).tl[2]===7)upH++; }
  ok(cpH.hid&&!cpH.known&&Math.abs(upH/N-B.upHidden)<0.012,"かくれ相性は +1 が10% ("+(upH/N*100).toFixed(1)+"%)");
  /* 種類 */
  const kc={}; for(let i=0;i<N;i++){ const p=BR.make(r,g,A,Bn,"",dn,cpN); kc[p.k]=(kc[p.k]||0)+1; }
  ok(Math.abs(kc.k001/N-0.70)<0.02&&Math.abs(kc.k021/N-0.25)<0.02&&Math.abs((N-kc.k001-kc.k021)/N-0.05)<0.01,"子の種類: おや1 "+(kc.k001/N*100).toFixed(1)+"% おや2 "+(kc.k021/N*100).toFixed(1)+"% べつ "+((N-kc.k001-kc.k021)/N*100).toFixed(1)+"%");
  ok(Object.keys(kc).every(id=>D.kindById[id].rar===0),"N×N の子は かならずN");
  const SSR=put(c,{k:"k009",tl:[3,3,3,3,3]}), dS=BR.kindDist(SSR,Bn,""), dS2=BR.kindDist(Bn,SSR,"");
  ok(dS.capped&&dS.list.every(x=>x.k.rar===0)&&dS.pool.every(k=>k.rar===0),"子のレア度は おや2 より上がらない(SSR×N の子はN)");
  ok(!dS2.capped&&Math.abs(dS2.list.find(x=>x.k.id==="k009").p-0.25)<0.001,"おや2がSSRなら、その種類は25%で継がれる");
  ok(BR.kindDist(Bn,SSR,"utsushi").list.length===1&&BR.kindDist(Bn,SSR,"utsushi").list[0].k.id==="k009","うつしの札: 子の種類は かならず おや2");
  const R0=put(c,{k:"k004"}), R1=put(c,{k:"k014"}), dO=BR.kindDist(R0,R1,""), on=dO.list.find(x=>x.only);
  ok(on&&on.k.name==="ロウロウコンビ"&&Math.abs(on.p-B.only[2])<1e-9&&!BR.kindDist(A,put(c,{k:"k011"}),"").list.some(x=>x.only),"配合限定: 族とレア度がそろったときだけ("+(on?on.k.name+" "+on.p*100+"%":"")+")");
  ok(D.kinds.filter(k=>k.only).every(k=>B.only[k.rar]>0),"配合限定15種すべてに生まれる道がある");
  /* 配合券と、親の行き先 */
  g.bt=0; ok(BR.breed(c,A.i,Bn.i).err,"配合券なしでは配合できない");
  ok(BR.preview(c,A.i,g.kan).err&&BR.preview(c,A.i,A.i).err,"看板は おや2 にできない・同じ子どうしは不可");
  g.bt=2; const n0=g.mons.length, rs=g.mons.filter(p=>M.rarOf(p)>=3).length, res=BR.breed(c,A.i,Bn.i);
  ok(res.kids.length===1&&g.bt===1&&g.mons.length===n0&&!M.byId(g,Bn.i)&&M.byId(g,A.i)&&g.brd===1,"配合: 券を1枚使う・おや1は残る・おや2は子に生まれかわる(数は増えない)");
  ok(res.kids[0].mon.a.join()===A.i+","+Bn.i&&res.kids[0].mon.lv===1&&g.dex[res.kids[0].mon.k],"子は親の記録を持ち、図鑑に入る");
  const r2=BR.breed(c,A.i,Bh.i); ok(r2.found&&g.hnf["0|1"]===1&&BR.compat(g,A,A).known===false&&BR.breed(c,A.i,Bc.i).err,"かくれ相性は 配合してはじめて分かる");
  ok(g.mons.filter(p=>M.rarOf(p)>=3).length<=rs,"配合でSSR以上の数は増えない");
  /* 予想 */
  const P1=put(c,{k:"k001",tl:[9,9,9,9,9]}), P2=put(c,{k:"k002",tl:[8,8,8,8,8]}); g.bt=5;
  const pv=BR.preview(c,P1.i,P2.i,""), pv2=BR.preview(c,P1.i,P2.i,"");
  ok(pv.lo<=pv.hi&&pv.lo>=30&&pv.hi<=50&&pv.pBeat>=0&&pv.pBeat<=1&&JSON.stringify([pv.lo,pv.hi,pv.pBeat])===JSON.stringify([pv2.lo,pv2.hi,pv2.pBeat]),"予想: 子の才能の見込み "+pv.lo+"〜"+pv.hi+"／50・看板を超える確率 "+Math.round(pv.pBeat*100)+"%(同じ組なら いつ見ても同じ)");
  { let beat=0, inR=0; const rr=mkRand(5), k=M.kanban(g), kv=M.power(k), d=BR.kindDist(P1,P2,""), cp=BR.compat(g,P1,P2);
    for(let i=0;i<4000;i++){ const p=BR.make(rr,g,P1,P2,"",d,cp), h=M.handover(p,k), t=p.tl.reduce((a,b)=>a+b,0); if(M.atLv(p,h.lv,h.ef)>kv)beat++; if(t>=pv.lo&&t<=pv.hi)inR++; }
    ok(Math.abs(beat/4000-pv.pBeat)<0.05&&inR/4000>=0.75,"予想の数字は、実際に生まれる子と合う(超える "+(beat/40).toFixed(0)+"%・見込みの幅に入る "+(inR/40).toFixed(0)+"%)"); }
  /* どうぐ */
  g.items={ito:1,omamori:1,suzu:1,futago:1,mi:1,ishi:2,happa:1,wasure:1,cho:1,mochi:1};
  const I1=put(c,{k:"k001",tl:[10,0,5,5,5],na:"n4",tr:["star"]}), I2=put(c,{k:"k001",tl:[0,1,5,5,5],na:"n0"});
  { const d=BR.kindDist(I1,I2,"ito"), cp=BR.compat(g,I1,I2); let all=true, nat=true, tr=true; const rr=mkRand(3);
    for(let i=0;i<300;i++){ if(BR.make(rr,g,I1,I2,"ito",d,cp).tl[0]!==10)all=false; if(BR.make(rr,g,I1,I2,"omamori",d,cp).na!=="n4")nat=false; if(BR.make(rr,g,I1,I2,"suzu",d,cp).tr[0]!=="star")tr=false; }
    ok(BR.itoIndex(I1,I2)===0&&all,"ひきつぎの糸: 差がいちばん大きい能力を かならず高いほうから継ぐ"); ok(nat,"性格のおまもり: おや1の性格を かならず継ぐ"); ok(tr,"むすびの鈴: 特性を かならず継ぐ"); }
  ok(BR.breed(c,I1.i,I2.i,{item:"cho"}).err&&BR.useItem(c,"ito",I1.i).err,"どうぐは使う場面が決まっている");
  const k9=M.kanban(g), lo=k9.tl.indexOf(Math.min(...k9.tl)); const u1=BR.useItem(c,"mi",k9.i); ok(u1.k===M.KEYS[lo]&&!g.items.mi&&k9.tl[lo]>=0&&k9.tl[lo]<=10,"ふり直しの実: いちばん低い才能を ふり直す");
  k9.tr=[]; BR.useItem(c,"ishi",k9.i); BR.useItem(c,"ishi",k9.i); ok(k9.tr.length===2&&k9.tr[0]!==k9.tr[1]&&BR.useItem(c,"ishi",k9.i).err,"ひらめきの石: 特性を ふやす(2つまで)");
  const na0=k9.na; BR.useItem(c,"happa",k9.i); ok(k9.na!==na0,"きがえの葉: 性格を ふり直す");
  k9.ef=[10,40,5,0,0]; BR.useItem(c,"wasure",k9.i); ok(k9.ef.join()==="10,0,5,0,0","わすれ草: いちばん多い けいこ値を0に");
  BR.useItem(c,"cho",""); BR.useItem(c,"mochi",""); ok(g.boost.ef===10&&g.boost.xp===10,"けいこ帳・ちから餅: つぎの10問が2倍");
  { const id=MM.learn.pick(1,c,{subs:[0],filter:(q,st)=>!MM.learn.seen(st)})[0], lv0=k9.lv; k9.lv=1; k9.xp=0; k9.ef=[0,0,0,0,0]; const gain=MM.economy.grant(MM.learn.commit(id,true,4000,c),c); k9.lv=Math.max(lv0,k9.lv);
    ok(gain.mon.xp===20&&gain.g===10&&Math.abs(gain.mon.ef.o-0.24)<1e-9&&g.boost.ef===9&&g.boost.xp===9,"2倍のあいだは 経験20・けいこ値0.24(コインは増えない)"); }
  /* ごほうび: 順番で決まる・乱数なし */
  { const c2=fresh(12), g2=M.W(c2), out=[]; const cr=c2.rand; let used=0; c2.rand=()=>{ used++; return 0.5; }; BR.give(c2,{t0:6,t1:8,bt:1},out,"x"); c2.rand=cr;
    ok(used===0&&out.length===15&&g2.bt===1&&D.ITEMS.every(t=>g2.items[t.id]>=1),"ごほうびは順番で決まる(乱数なし)・12種すべてが順にもらえる");
    const z=BZ.Z(c2), it0=BR.itemCount(g2); const day=(n)=>{ c2.dstr="g"+n; c2.today=24000+n; MM.state.rollDay(c2); }; let d=1; day(d);
    const bout=(winIt)=>{ if(BZ.leftToday(c2)<=0){ d++; day(d); } const s=BZ.start(c2); const foe=D.bzAt(s.foe); ["h","m","o","j","s"].forEach(k=>{ s.mine[k]=foe.stats[k]*(winIt?3:0.1); }); let r; do{ r=BZ.round(c2,s,false,20000); }while(r&&!r.over); return BZ.finish(c2,s); };
    z.pos=40; let last; for(let i=0;i<7;i++)last=bout(i<3); ok(last.gifts.length===0&&BR.itemCount(g2)===it0,"負け越しの場所に ごほうびは無い");
    for(let i=0;i<7;i++)last=bout(i<5); ok(last.gifts.length===2&&BR.itemCount(g2)===it0+2,"5勝の場所: 育成どうぐ2つ");
    const bt0=g2.bt; for(let i=0;i<7;i++)last=bout(true); ok(last.gifts.some(x=>x.bt)&&g2.bt===bt0+1,"全勝の場所: とっておき2つ＋配合券");
    z.pos=45; z.n=0; z.w=0; z.l=0; const pr=bout(true); ok(pr.promo&&pr.promo.won&&pr.gifts.some(x=>x.bt)&&pr.gifts.some(x=>x.item),"昇進の一番に勝つ: とっておき＋配合券"); }
  /* 画面 */
  { win.gameState=c.ST; const base=UI.ctx; UI.ctx=()=>c; g.bt=3; g.items={ito:1,kawari:2};
    const chk=(name,h)=>{ const u=h.indexOf("undefined"), n=h.indexOf("NaN"), b=banHit(h), rp=rpgHit(h); ok(h.length>200&&u<0&&n<0&&!b&&!rp,"render "+name+" ("+h.length+")"+(u>=0?" undefined@"+h.slice(Math.max(0,u-60),u+10):"")+(n>=0?" NaN@"+h.slice(Math.max(0,n-60),n+5):"")+(b?" 禁止語:"+b:"")+(rp?" RPGの言葉:"+rp:"")); };
    UI.b2Open(); chk("b2(おや2を選ぶ前)",UI.screens.b2()); chk("b2p(おや2の一覧)",UI.screens.b2p({w:"b"})); chk("b2p(おや1の一覧)",UI.screens.b2p({w:"a"}));
    UI.b2Pick("b",P2.i); UI.b2Item("ito"); const h=UI.screens.b2(); chk("b2(見込み)",h);
    ok(/子の才能の見込み <b>\d+〜\d+<\/b>／50/.test(h)&&/いまの看板を超える確率 <b>[\d]+%/.test(h.replace("1%未満","0%")),"予想画面に「子の才能の見込み ◯〜◯／50」「いまの看板を超える確率 ◯%」の2行");
    UI.b2Do(); ok(UI.route.screen==="b2r"&&g.bt===2&&!g.items.ito,"配合すると結果の画面へ(券とどうぐが減る)"); chk("b2r",UI.screens.b2r());
    chk("n2d(どうぐ)",(g.items.mi=1,UI.screens.n2d({id:g.kan}))); UI.ctx=base; }
  /* 保存 */
  { const rt=M.normalize(JSON.parse(JSON.stringify(g))); ok(JSON.stringify(rt.items)===JSON.stringify(g.items)&&rt.bt===g.bt&&rt.hn.join()===g.hn.join()&&rt.hnf["0|1"]===1&&rt.brd===g.brd&&rt.gn.join()===g.gn.join(),"配合券・どうぐ・かくれ相性は 保存→読み直しで同じ");
    const bad=M.normalize({on:1,mons:[],items:{ito:"x",nope:5,mi:1e9},bt:-4,hn:["L00|L11","0|1","9|9"],gn:"q",boost:{xp:"a"}}); ok(bad.bt===0&&!bad.items.nope&&!bad.items.ito&&bad.items.mi===D.ITEM_CAP&&bad.hn.join()==="0|1"&&bad.gn.join()==="0,0"&&bad.boost.xp===0,"壊れた値は安全な値へ丸める(旧い形のかくれ相性は捨てる)"); }
  module.exports.fresh4=fresh; module.exports.put4=put;
}
/* ================= スライス5: けいこ3択・けいこ値・Lvの上限 ================= */
{
  const {mkCtx,mkRand,mon,fresh4:fresh,put4:put}=module.exports; const KE=MM.keiko, BR=MM.breed, K=D.KEIKO; const {banHit,rpgHit}=require("./lib-load.js");
  const Q=win.Q, bySub=(s)=>Q.filter(q=>q.s===s);
  const seenSt=(c,id,o)=>{ c.ST.q[id]=Object.assign({c:1,w:0,ng:false,s:0,bm:false,box:1,due:c.today-1,la:c.today-3,ease:2.3},o||{}); };
  const ans=(c,id,ok)=>MM.economy.grant(MM.learn.commit(id,ok,4000,c),c);
  const c=fresh(21), g=M.W(c), k=M.kanban(g);
  /* 献立 */
  let m=KE.menu(c); const L=(id)=>m.list.find(x=>x.id===id);
  ok(m.list.map(x=>x.id).join()==="new,rev,nig"&&m.list.map(x=>x.stat).join()==="o,j,s"&&K.size===10,"けいこは3つ(あたらしい問題=ちから／復習=ねばり／苦手つぶし=ひらめき)・1回10問");
  ok(L("new").left===Q.length&&L("rev").left===0&&L("nig").left===0&&KE.start(c,"rev").err&&KE.start(c,"nig").err,"期限の来た問題が0のとき 復習は選べない(苦手も同じ)");
  /* 何が伸びるか */
  const e0=()=>{ k.ef=[0,0,0,0,0]; c.mm.combo=0; };
  const qNew=bySub(3)[0].id, qRev=bySub(3)[1].id, qLate=bySub(3)[2].id, qNig=bySub(3)[3].id, qEarly=bySub(3)[4].id;
  seenSt(c,qRev); seenSt(c,qLate,{due:c.today-9,la:c.today-12}); seenSt(c,qNig,{ng:true,c:0,w:1,due:c.today}); seenSt(c,qEarly,{due:c.today+5,la:c.today-1});
  ok(KE.classOf(c.ST.q[qNew],c.today)==="new"&&KE.classOf(c.ST.q[qRev],c.today)==="rev"&&KE.classOf(c.ST.q[qNig],c.today)==="nig"&&KE.classOf(c.ST.q[qEarly],c.today)==="other","問題の状態: まだ／期限の来た復習／前にまちがえた／期限前");
  e0(); let gn=ans(c,qNew,true); ok(gn.g===10&&gn.mon.cls==="new"&&k.ef[2]===K.kinds[0].ef&&k.ef[3]===0&&k.ef[4]===0,"あたらしい問題の正解 → ちから(コイン10)");
  e0(); gn=ans(c,qRev,true); ok(gn.g===20&&gn.mon.cls==="rev"&&k.ef[3]===0.12&&k.ef[2]===0,"復習の正解 → ねばり(コイン20)");
  e0(); gn=ans(c,qLate,true); ok(gn.mon.late&&k.ef[3]===0.24,"7日以上ためた復習は けいこ値2倍");
  e0(); gn=ans(c,qNig,true); ok(gn.g===30&&gn.mon.cls==="nig"&&k.ef[4]===0.12&&k.ef[2]===0&&k.ef[3]===0,"苦手つぶしの正解 → ひらめき(コイン30)");
  e0(); gn=ans(c,qEarly,true); ok(gn.g<=5&&k.ef.every(v=>v===0),"期限前の問題は ほぼ何も出ない");
  e0(); gn=ans(c,bySub(3)[5].id,false); ok(gn.g===0&&k.ef.every(v=>v===0)&&gn.mon.xp===0,"まちがいは何も出ない");
  e0(); c.mm.combo=4; gn=ans(c,bySub(3)[6].id,true); ok(c.mm.combo===5&&k.ef[0]===K.comboEf,"連続正解5問ごとに いきおい");
  e0(); const exId=MM.garden.examIds()[0]; gn=ans(c,exId,true); ok(k.ef[1]===K.examEf,"本試験形式の正解で かしこさ");
  e0(); gn=ans(c,qNew,true); ok(gn.g<10&&k.ef.every(v=>v===0),"同じ日のくり返しでは けいこ値は入らない");
  /* 1回10問・4問に1問は本試験形式・あたらしい問題は1回=1科目 */
  { const c2=fresh(22); let s=KE.start(c2,"new"); const sub0=s.sub, subs=new Set(), ex=[]; let n=0;
    while(s.qid!=null){ const q=win.qById(s.qid); subs.add(q.s); ex.push(MM.garden.isExam(q)?1:0); const o=(n%3!==0); const gain=ans(c2,s.qid,o); KE.advance(c2,s,o,gain); n++; }
    ok(n===10&&s.over&&s.n===10&&subs.size===1&&[...subs][0]===sub0,"1回は10問で終わる・あたらしい問題は1回=1科目");
    ok(ex.join("")==="0001000100","4問に1問は本試験形式 ("+ex.join("")+")");
    ok(s.coin>0&&s.xp>0&&s.hits===6,"1回ぶんの コイン・経験・正解数がまとまる");
    const s2=KE.start(c2,"new"); ok(s2.sub!==sub0,"つぎの回は べつの科目(いちばん進んでいない科目)から出る");
    ok(KE.menu(c2).list[2].left===0,"きょう まちがえた問題は、きょうの 苦手つぶし には出ない(あした出る)");
    c2.dstr="d2"; c2.today+=1; MM.state.rollDay(c2); const m2=KE.menu(c2); ok(m2.list[2].left===4,"まちがえた問題は つぎの日から 苦手つぶし に入る("+m2.list[2].left+"問)");
    const sn=KE.start(c2,"nig"); ok(!sn.err&&KE.classOf(c2.ST.q[sn.qid],c2.today)==="nig","苦手つぶしは 前にまちがえた問題だけ"); }
  /* 勉強が1科目にかたよらない */
  { const c2=fresh(23), cnt=[0,0,0,0,0,0,0,0,0]; for(let i=0;i<45;i++){ const s=KE.start(c2,"new"); while(s.qid!=null){ cnt[win.qById(s.qid).s]++; const gain=ans(c2,s.qid,true); KE.advance(c2,s,true,gain); } c2.mm.qx={}; }
    const per=KE.census(c2).per.map(p=>p.seen/p.n); ok(Math.min(...cnt)>=40&&Math.max(...cnt)<=60,"あたらしい問題45回(450問): どの科目も40〜60問("+cnt.join(",")+")");
    ok(Math.max(...per)-Math.min(...per)<0.06,"解いた割合の差は科目間で6ポイント未満"); }
  { const full=(subs,v)=>{ const o={}; for(let i=0;i<9;i++)o[i]=subs.includes(i)?v:0; return o; }, T=D.LVCAP.steps, b=D.LVCAP.base, all=[0,1,2,3,4,5,6,7,8];
    ok(KE.lvCap(c,full([],0)).cap===b&&KE.lvCap(c,full([0],1)).cap===b+3&&KE.lvCap(c,full([0,1,2],1)).cap===b+9,"Lvの上限: 1科目だけ仕上げても +3 どまり(1科目 Lv"+(b+3)+"・3科目 Lv"+(b+9)+")");
    ok(KE.lvCap(c,full(all,T[0])).cap===b+9&&KE.lvCap(c,full(all,T[1])).cap===b+18&&KE.lvCap(c,full(all,T[2])).cap===50&&KE.lvCap(c,full(all,T[2]-0.001)).cap===b+18,"全科目が段をこえるたびに +9、9科目そろって Lv50");
    const nx=KE.lvCap(c,Object.assign(full(all,T[0]),{4:T[0]-0.01})).next; ok(nx.sub===4&&nx.to===T[0],"つぎに上げる科目を教える(いちばん近い段)");
    const a=mon({i:"p1",k:"k001"}), z=mon({i:"p2",k:"k081"}); ok(M.lvCap(c,a)===M.lvCap(c,z),"Lvの上限は看板の族と関係ない(看板の科目だけ解いても強くならない)"); }
  /* Lvと経験 */
  { const p=mon({i:"x1"}); M.addXp(p,10,50); ok(p.lv===2,"最初の正解1問で Lv2 になる"); let tot=0; for(let l=1;l<50;l++)tot+=M.need(l); ok(tot>100000&&tot<140000,"Lv50までの経験は約12万("+tot+")"); }
  /* 配合券: きょうの復習をやりきった日だけ・1日1枚 */
  { const c2=fresh(24), g2=M.W(c2); bySub(0).slice(0,12).forEach(q=>seenSt(c2,q.id)); const t0=KE.ticketState(c2);
    ok(t0.need===12&&t0.done===0&&!t0.ready&&g2.bt===0,"きょうの復習 = その日 期限の来ていた問題(12問)");
    for(let i=0;i<15;i++)ans(c2,bySub(1)[i].id,true); ok(g2.bt===0&&!KE.ticketState(c2).ready,"あたらしい問題を何問といても、復習が残っていれば配合券は出ない");
    const s=KE.start(c2,"rev"); let got=0, n=0; while(s.qid!=null){ const gain=ans(c2,s.qid,n%2===0); if(gain.mon.ticket)got++; KE.advance(c2,s,true,gain); n++; }
    ok(g2.bt===0&&KE.ticketState(c2).done===10,"復習10問(まちがいも「やった」に入る)。まだ2問のこり");
    const s3=KE.start(c2,"rev"); n=0; let tk=0; while(s3.qid!=null){ const gain=ans(c2,s3.qid,true); if(gain.mon.ticket)tk++; KE.advance(c2,s3,true,gain); n++; }
    ok(n===2&&tk===1&&g2.bt===1&&s3.ticket===1&&KE.ticketState(c2).got,"復習をやりきった瞬間に 配合券1枚");
    for(let i=20;i<40;i++)ans(c2,bySub(1)[i].id,true); ok(g2.bt===1,"配合券は1日1枚まで");
    c2.dstr="next"; c2.today+=3; MM.state.rollDay(c2); const t1=KE.ticketState(c2); ok(!t1.got&&t1.need>0,"日付が変わると また もらえる(きょうの復習 "+t1.need+"問)");
    const c3=fresh(25), g3=M.W(c3); for(let i=0;i<9;i++)ans(c3,bySub(2)[i].id,true); const b9=g3.bt; ans(c3,bySub(2)[9].id,false); ok(b9===0&&g3.bt===1,"復習が無い日は 10問といたら1枚(最初の日)");
    const c4=fresh(26); bySub(0).slice(0,80).forEach(q=>seenSt(c4,q.id)); ok(KE.ticketState(c4).need===K.revQuota,"たまりすぎた日の「きょうの復習」は"+K.revQuota+"問まで"); }
  /* 看板の乗りかえで失うものの上限 */
  { const c2=fresh(27), g2=M.W(c2), old=M.kanban(g2); old.lv=30; old.xp=500; old.ef=[40,20,100,90,50];
    const nw=put(c2,{k:"k004",tl:[8,8,8,8,8]}), same=M.atLv(nw,30,old.ef), pv=M.pot(g2,nw), r=M.setKan(c2,nw.i);
    ok(g2.kan===nw.i&&nw.lv===30&&nw.xp===500,"看板をゆずる: Lv と経験は そのまま引きつぐ");
    ok(nw.ef.every((v,i)=>Math.abs(v-old.ef[i]*K.keep)<0.011)&&old.ef.join()==="40,20,100,90,50","けいこ値は9割を引きつぐ(前の看板のぶんは減らない)");
    ok(same-M.power(nw)<=D.EF_TOTAL*(1-K.keep)+3&&same-M.power(nw)>=0,"乗りかえで失うのは つよさ "+(same-M.power(nw))+" だけ(上限 "+D.EF_TOTAL*(1-K.keep)+"＝けいこ値の1割)");
    ok(pv.v===M.power(nw)&&r.to===pv.v&&pv.d===pv.v-r.from,"▲▼の数字は、看板にしたあとの つよさ と同じ");
    M.setKan(c2,old.i); M.setKan(c2,nw.i); M.setKan(c2,old.i); ok(old.ef.join()==="40,20,100,90,50"&&nw.ef.reduce((a,b)=>a+b,0)<=270.01,"行ったり来たりしても けいこ値は増えない");
    const strong=put(c2,{k:"k004",lv:40,ef:[100,100,100,0,0]}); M.setKan(c2,strong.i); ok(strong.lv===40&&strong.ef.reduce((a,b)=>a+b,0)<=D.EF_TOTAL+0.01&&strong.ef.join()==="100,100,100,0,0","引きついでも けいこ値の合計は"+D.EF_TOTAL+"をこえない"); }
  /* 画面 */
  { win.gameState=c.ST; const base=UI.ctx; UI.ctx=()=>c; g.items.cho=1;
    const chk=(name,h)=>{ const u=h.indexOf("undefined"), n=h.indexOf("NaN"), b=banHit(h), rp=rpgHit(h); ok(h.length>200&&u<0&&n<0&&!b&&!rp,"render "+name+" ("+h.length+")"+(u>=0?" undefined@"+h.slice(Math.max(0,u-60),u+10):"")+(n>=0?" NaN@"+h.slice(Math.max(0,n-60),n+5):"")+(b?" 禁止語:"+b:"")+(rp?" RPGの言葉:"+rp:"")); };
    const hm=UI.screens.k2m(); chk("k2m",hm); ok(["あたらしい問題","復習","苦手つぶし","ちから","ねばり","ひらめき"].every(w=>hm.indexOf(w)>0)&&(hm.match(/class="mm-v2-kbtn/g)||[]).length===3,"けいこを えらぶ画面: ボタン3つと、のびる能力");
    UI.k2Go("new"); ok(UI.route.screen==="k2"&&UI.v2.quiz.qid!=null,"えらぶと すぐ問題"); chk("k2(問題)",UI.screens.k2());
    let guard=0; while(UI.v2.quiz&&UI.route.screen==="k2"&&guard++<40){ const s=UI.v2.quiz; if(s.fb){ if(guard===2)chk("k2(答えたあと)",UI.screens.k2()); UI.k2Next(); continue; } const q=win.qById(s.qid); if(q.sentaku){ for(let i=0;i<q.blanks.length;i++)UI.k2Ans(q.blanks[i].ok); } else UI.k2Ans(q.choices&&q.choices.length&&q.format!=="true_false"?0:true); }
    ok(UI.route.screen==="k2r"&&UI.v2.quiz.n===10,"10問で けいこの結果へ"); chk("k2r",UI.screens.k2r()); UI.v2.quiz=null; UI.ctx=base; }
}
/* ================= スライス6: ホームの一本化・オープニング・自動プレイ ================= */
{
  const {mkCtx,mkRand}=module.exports; const KE=MM.keiko, BZ=MM.banzuke; const {banHit,rpgHit}=require("./lib-load.js");
  const chk=(name,h)=>{ const u=h.indexOf("undefined"), n=h.indexOf("NaN"), b=banHit(h), rp=rpgHit(h); ok(h.length>200&&u<0&&n<0&&!b&&!rp,"render "+name+" ("+h.length+")"+(u>=0?" undefined@"+h.slice(Math.max(0,u-60),u+10):"")+(n>=0?" NaN@"+h.slice(Math.max(0,n-60),n+5):"")+(b?" 禁止語:"+b:"")+(rp?" RPGの言葉:"+rp:"")); };
  const text=(h)=>h.replace(/<[^>]*>/g,"");
  /* ---------- 初回起動 → オープニング → 最初の問題(2タップ) ---------- */
  const ST={q:{},rq:[],mm:null}; win.gameState=ST; const base=UI.ctx; UI.ctx=()=>MM.state.ctx({ST,rand:mkRand(31)});
  UI.open(); ok(UI.route.screen==="intro","初回起動はオープニングから");
  const op=UI.screens.intro(UI.route.params); chk("オープニング",op);
  ok((op.match(/class="mm-v2-eggbtn"/g)||[]).length===3&&op.indexOf("街が育つんだモン")<0&&op.indexOf("横綱")>0,"オープニングは1画面: 物語3行と タマゴ3つ(旧い文言は出ない)");
  let taps=0; UI.opPick(1); taps++;
  const g=M.W(UI.ctx()), k=M.kanban(g);
  ok(UI.route.screen==="intro"&&UI.route.params.page===2&&g.st===1&&g.mons.length===1&&k.k===D.STARTERS[1]&&M.rarOf(k)===0&&ST.mm.ms.intro===1,"1タップめ: えらんだタマゴから最初の1体(N)が生まれる");
  ok(k.tl.every(t=>t>=3&&t<=6)&&k.tr.length===0,"最初の1体の才能は ふつう(3〜6)");
  chk("生まれた子",UI.screens.intro(UI.route.params));
  UI.opGo(); taps++;
  ok(taps===2&&UI.route.screen==="k2"&&UI.v2.quiz&&UI.v2.quiz.qid!=null&&UI.screens.k2().indexOf("MM.ui.k2Ans")>0,"2タップめで最初の問題が出る(初回起動から2タップ)");
  { const s=UI.v2.quiz, q=win.qById(s.qid), p0=M.power(k); s.t0=Date.now()-5000; const right=(typeof q.a==="boolean")?q.a:!!q.answer; UI.k2Ans(right);
    ok(k.lv===2&&M.power(k)>p0,"最初の正解で Lv2・つよさ の数字が増える("+p0+" → "+M.power(k)+")"); UI.v2.quiz=null; }
  ok(M.starter(UI.ctx(),2)===k&&g.mons.length===1,"最初の1体は えらび直せない");
  UI.open(); ok(UI.route.screen==="h2","2回目からはホームへ");
  /* ---------- ホーム ---------- */
  const h=UI.screens.h2(), t=text(h); chk("h2(ホーム)",h);
  ok(h.indexOf('class="mm-v2-kan')>0&&t.indexOf("つよさ")>0&&t.indexOf(String(M.power(k)))>0,"ホームの真ん中に看板マチモンと つよさ");
  ok(t.indexOf("番付の外")>0&&t.indexOf("つぎの相手")>0&&/勝てる|あと つよさ/.test(t),"ホームに 番付の位置 と「次の相手まで あといくつ」");
  const btns=(h.match(/<button[^>]*>/g)||[]).length, tabs=h.slice(h.indexOf("<nav")), menu=h.slice(0,h.indexOf("<nav"));
  ok(["けいこ","タマゴ","配合","品評会"].every(w=>text(menu).indexOf(w)>0)&&(menu.match(/class="mm-gmenu[^"]*"[^>]*>(.*?)<\/div>/)[1].match(/<button/g)||[]).length===3&&menu.indexOf("mm-v2-keiko")>0,"ホームのボタンは4つ(けいこ／タマゴ／配合／品評会)");
  ok((tabs.match(/<button/g)||[]).length===4&&["ホーム","なかま","図鑑","きろく"].every(w=>tabs.indexOf(w)>0),"下のタブは4つ(ホーム／なかま／図鑑／きろく)");
  ok(btns<=12,"ホームの押せるものは12こ以下("+btns+")");
  /* 番付が上がると街の景色がにぎやかになる */
  { const c=UI.ctx(), z=BZ.Z(c), cnt=[], seen=new Set(); for(let i=0;i<6;i++)M.pull(Object.assign(c,{rand:mkRand(40+i)}),true)&&(g.free="");
    [61,55,50,44,32,22,8,1].forEach(pos=>{ z.pos=pos; const sc=UI.scene2(c,g,M.kanban(g)); cnt.push((sc.match(/class="mm-bld/g)||[]).length+(sc.match(/class="mm-walker/g)||[]).length); seen.add(sc); });
    ok(seen.size===8&&cnt.every((v,i)=>i===0||v>=cnt[i-1])&&cnt[7]>cnt[0]+6,"段が上がるほど 街の建物と なかま が増える("+cnt.join("→")+")"); z.pos=61; }
  /* ほかの画面 */
  chk("z2(図鑑)",UI.screens.z2()); ok(text(UI.screens.z2()).indexOf("/105")>0&&(UI.screens.z2().match(/class="mm-dex mm-v2-dex/g)||[]).length===105,"図鑑は105種 × はんこ3つ");
  chk("r2(きろく)",UI.screens.r2()); ok(D.ITEMS.every(it=>UI.screens.r2().indexOf(it.name)>0)&&UI.screens.r2().indexOf("Lvの上限")>0,"きろくに 育成どうぐ12種 と Lvの上限(9科目)");
  chk("n2",UI.screens.n2()); chk("n2d",UI.screens.n2d({id:g.mons[1].i})); chk("t2",UI.screens.t2()); chk("k2m",UI.screens.k2m()); UI.b2Open(); chk("b2",UI.screens.b2()); UI.bzS.noScroll=1; chk("bz",UI.screens.bz()); chk("bzPre",UI.screens.bzPre());
  ["garden","gContest","town","build","zukan","record","gGacha"].forEach(sn=>UI.go(sn)); ok(UI.route.screen==="h2","旧い画面(街・建設・ガチャ・旧図鑑・旧記録)へは行けない");
  ok(Object.keys(UI.v2ok).every(sn=>UI.screens[sn]),"登録した画面はすべて在る("+Object.keys(UI.v2ok).length+")");
  UI.ctx=base;

  /* ---------- 自動で遊ばせる(1日60問・正答率75%・180日。配合・けいこ込み。つり合わせの仕上げはスライス8) ---------- */
  { const r=require("./sim-v2.js").run({seed:42,days:180,marks:[7,30,90,180]}), at=r.at;
    console.log("  自動プレイ:",[7,30,90,180].map(d=>d+"日 "+at[d].dan+at[d].pos+"枚目 つよさ"+at[d].pw+" SSR以上"+at[d].ssr+"体 図鑑"+at[d].dex+" 配合"+at[d].breeds+" 習熟"+at[d].mast.join(",")).join("\n             "),"\n             横綱",r.yoko||"—","日目 / 才能40・45・50までの配合",r.t40,r.t45,r.t50);
    ok(at[7].pos>=49&&at[7].pos<=58,"7日: 序二段あたり ("+at[7].dan+at[7].pos+"枚目)");
    ok(at[30].pos>=34&&at[30].pos<=47,"30日: 幕下あたり ("+at[30].dan+at[30].pos+"枚目)");
    ok(at[90].pos>=9&&at[90].pos<=32,"90日: 十両の上〜前頭 ("+at[90].dan+at[90].pos+"枚目)");
    ok(at[180].pos<=14,"180日: 前頭の上〜横綱 ("+at[180].dan+at[180].pos+"枚目)"+(r.yoko?" 横綱 "+r.yoko+"日目":""));
    ok(!r.yoko||r.yoko>=120,"横綱は早くても4か月より先");
    ok(at[30].ssr<=4&&at[90].ssr<=12&&at[30].lg===0&&at[90].lg===0,"SSR以上は 30日で数体・90日で十体ほどまで("+at[30].ssr+"・"+at[90].ssr+"・180日 "+at[180].ssr+")、LGは90日では出ない");
    ok(at[30].pw<at[90].pw&&at[90].pw<=at[180].pw&&at[180].pw<1450,"看板のつよさは伸び続け、上限に張りつかない("+at[30].pw+" → "+at[90].pw+" → "+at[180].pw+")");
    ok(at[30].dex>=35&&at[30].dex<=65&&at[180].dex<105,"図鑑: 30日で "+at[30].dex+"種・180日で "+at[180].dex+"種(105種はうまらない)");
    [30,90,180].forEach(d=>{ const m=at[d].mast, sh=at[d].share, sn=at[d].seen; ok(Math.max(...m)-Math.min(...m)<=6&&Math.max(...sn)-Math.min(...sn)<=6&&Math.max(...sh)<=18,d+"日: 9科目の習熟がそろう("+m.join(",")+"%)・1科目に出題が偏らない(最大"+Math.max(...sh)+"%)"); });
    ok(at[30].lv<=at[30].cap&&at[180].cap===50,"まんべんなく解けば Lvの上限は Lv50 まで開く(30日 Lv"+at[30].lv+"/"+at[30].cap+"・180日 Lv"+at[180].lv+"/"+at[180].cap+")");
    ok(r.t45===0||r.t45>=8,"才能45以上は 配合を重ねてから("+r.t40+"・"+r.t45+"・"+r.t50+"回目)");
    ok(at[180].tickets>=150&&at[180].breeds>=100,"配合券は ほぼ毎日1枚("+at[180].tickets+"枚・配合"+at[180].breeds+"回)");
    const js=JSON.stringify(r.ST.mm.g2); ok(js.indexOf("NaN")<0&&js.length<60000,"セーブの大きさ "+js.length+" バイト・NaNなし"); }
}
if(require.main===module)console.log(process.exitCode?"FAILED":"ALL OK (v2)");
