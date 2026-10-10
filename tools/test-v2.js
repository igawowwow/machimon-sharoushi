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
  ok(n[2850]>r[1500],"才能のいいN(上位5% "+n[2850]+")は ふつうのR(真ん中 "+r[1500]+")を上回る");
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
  const pz=mon({i:"z",k:k.k}); M.addXp(pz,1e7,M.lvCap(cn,pz)); ok(pz.lv===30,"科目の習熟40%未満では Lv30 が上限(Lv31にならない)");
  const pe=mon({i:"e"}); for(let i=0;i<5000;i++)M.addEf(pe,"hmojs"[i%5],0.9); ok(Math.abs(pe.ef.reduce((a,b)=>a+b,0)-300)<1e-6&&pe.ef.every(v=>v<=100),"けいこ値は合計300・1つ100まで");
  ok(M.release(cn,k.i).err&&gn.mons.length===1,"看板と最後の1体は手放せない");
  cn.mm.res.g=3000; const pr=M.pull(cn,false); const sh0=gn.shard; ok(pr.mon&&M.release(cn,pr.mon.i).shard===D.SHARD[M.rarOf(pr.mon)]&&gn.shard===sh0+D.SHARD[M.rarOf(pr.mon)],"手放すとレア度どおりのかけらになる");

  /* ---------- 画面 ---------- */
  for(let i=0;i<6;i++)M.pull(cn,false);
  const scr=[["h2",{}],["n2",{}],["n2d",{id:gn.mons[1].i}],["n2d",{id:gn.kan}],["t2",{}]];
  UI.v2.last={mon:gn.mons[gn.mons.length-1],isNew:true}; scr.push(["t2r",{}]); UI.k2Start(); scr.push(["k2",{}]);
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
    ok(z.pos===61&&BZ.state(c).left===2,"はじめは番付の外・きょうは2番");
    bout(true); bout(true); const third=BZ.start(c); ok(third.err&&z.n===2,"1日2番を超えて取れない");
    d++; day(c,d); ok(BZ.state(c).left===2,"日付が変わると取れる");
    for(let i=0;i<4;i++)bout(true); ok(z.n===6&&z.w===6&&z.basho===1,"6番まで: 場所は続く");
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

  /* ---------- 自動で遊ばせる(1日60問・正答率75%・180日。つり合わせはスライス8。ここでは幅を広めに) ---------- */
  { const ST={q:{},rq:[],mm:null}, rand=mkRand(42), c=mkCtx(ST,rand); MM.tutorial.finishIntro(c,"じどうの街"); win.gameState=ST; const g=M.W(c), z=BZ.Z(c); const at={}; let yoko=0, DAY=0;
    const manage=()=>{ const k=M.kanban(g); let best=null; g.mons.forEach(p=>{ const d=M.pot(g,p).d; if(p!==k&&(!best||d>best.d))best={p,d}; });
      if(best&&DAY<110&&best.d>M.power(k)*0.12)M.setKan(c,best.p.i);
      const k2=M.kanban(g); g.sub=g.mons.filter(p=>p!==k2).sort((a,b)=>M.pot(g,b).d-M.pot(g,a).d).slice(0,2).map(p=>p.i);
      while(g.mons.length>D.RATE2.cap-3){ const w=g.mons.filter(p=>p.i!==g.kan&&g.sub.indexOf(p.i)<0).sort((a,b)=>M.pot(g,a).d-M.pot(g,b).d)[0]; M.release(c,w.i); } };
    for(DAY=1;DAY<=180;DAY++){ c.dstr="s"+DAY; c.today=22000+DAY; MM.state.rollDay(c); let left=60, qn=0;
      if(M.freeReady(c))M.pull(c,true); manage();
      for(let b=0;b<2;b++){ const s=BZ.start(c); if(s.err)break; let r; do{ r=BZ.round(c,s,rand()<0.75,rand()<0.5?4000:12000); left--; }while(r&&!r.over); BZ.finish(c,s); }
      while(left-->0)MM.economy.grant(MM.learn.commit(M.pickQ(c,qn++),rand()<0.75,5000,c),c);
      while(c.mm.res.g>=D.RATE2.cost&&g.mons.length<D.RATE2.cap)M.pull(c,false);
      manage(); if(z.pos===1&&!yoko)yoko=DAY; if(DAY===7||DAY===30||DAY===90||DAY===180)at[DAY]={pos:z.pos,dan:BZ.danOf(z.pos).name,pw:M.power(M.kanban(g)),pulls:g.pulls,dex:Object.keys(g.dex).length,ssr:g.mons.filter(p=>M.rarOf(p)>=3).length}; }
    console.log("  自動プレイ:",[7,30,90,180].map(d=>d+"日 "+at[d].dan+at[d].pos+"枚目 つよさ"+at[d].pw+" タマゴ"+at[d].pulls+" 図鑑"+at[d].dex+" SSR以上"+at[d].ssr).join(" / "),yoko?"/ 横綱 "+yoko+"日目":"");
    ok(at[7].pos>=50&&at[7].pos<=60,"7日: 序ノ口〜序二段 ("+at[7].pos+"枚目)");
    ok(at[30].pos>=28&&at[30].pos<=48,"30日: 幕下あたり ("+at[30].pos+"枚目)");
    ok(at[90].pos>=5&&at[90].pos<=30,"90日: 十両〜前頭 ("+at[90].pos+"枚目)");
    ok(at[180].pos<=12,"180日: 前頭の上〜横綱に届く ("+at[180].pos+"枚目)");
    ok(at[30].ssr<=6&&g.mons.every(p=>M.rarOf(p)<=4),"30日でSSR以上は数体まで("+at[30].ssr+")・LGはタマゴから出ない");
    ok(at[30].pw<at[90].pw&&at[90].pw<=at[180].pw&&at[180].pw<1400,"看板のつよさは伸び続け、上限に張りつかない("+at[30].pw+" → "+at[90].pw+" → "+at[180].pw+")");
    const js=JSON.stringify(ST.mm.g2); ok(js.indexOf("NaN")<0&&js.length<60000,"セーブの大きさ "+js.length+" バイト・NaNなし"); }
}
if(require.main===module)console.log(process.exitCode?"FAILED":"ALL OK (v2)");
