/* テスト: 種類105と絵 / つよさの式 / 個体差 / タマゴの確率 / 1.x のセーブからの引っ越し / 番付と五番勝負 / 配合 / けいこ /
   特性36・物語・図鑑・かけら交換 / 画面 / 自動プレイ(つり合わせの目安) / 決まり(禁止の言葉・使っていないファイルが無い)
   使い方: node tools/test-v2.js   (npm test から呼ばれる) */
const fs=require("fs"),path=require("path");
const {win,MM,store}=require("./lib-load.js")();
const ok=(c,m)=>{ if(!c){ console.log("✗",m); process.exitCode=1; } else console.log("✓",m); };
const D=MM.DATA, GD=D.garden, M=MM.mon, UI=MM.ui;
const mkRand=(seed)=>()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
const mkCtx=(ST,rand,day)=>MM.state.ctx({ST,today:20000+(day||0),now:1.7e12,rand,dstr:"2026-10-"+String(1+(day||0)).padStart(2,"0")});
const RAR=["N","R","SR","SSR","UR","LG"];
ok(win.Q&&win.Q.length>=3000&&MM.exam.ids().length>=300,"問題 "+win.Q.length+"問 ＋ 本試験形式 "+MM.exam.ids().length+"問");

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
  ok(MM.pxData("m01").length>100&&D.looks.m30,"相棒マチノコ(m01)ほか 1.x の絵は残っている");
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
  const ST={q:{},mm:null}; const c2=mkCtx(ST,()=>0.1); const g=M.W(c2); c2.mm.res.g=1e6; D.RATE2.cap=999;
  const rs=[]; for(let i=0;i<80;i++){ const r=M.pull(c2,false); rs.push(r.mon?M.rarOf(r.mon):-1); }
  ok(rs.slice(0,79).every(x=>x===0)&&rs[79]>=3&&g.pity===0,"80回目でかならずSSR以上(79回目までN → 80回目 "+RAR[rs[79]]+")");
  ok(c2.mm.res.g===1e6-80*D.RATE2.cost,"タマゴ1回 = コイン"+D.RATE2.cost);
  const f1=M.pull(c2,true), f2=M.pull(c2,true); ok(f1.mon&&f2.err,"無料は1日1回");
  D.RATE2.cap=60;
}

/* ---------- 旧セーブからの引っ越し ---------- */
{
  /* 1.x の遊びで作ったセーブ(tools/fixtures/save-v1.json。1.x のコードで遊ばせて書き出したもの)を読みこむ */
  const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"fixtures","save-v1.json"),"utf8")), meta=FX.meta, raw=JSON.stringify(FX.save), rand=mkRand(42);
  const loadV1=()=>{ const ST=JSON.parse(raw); ST.mm=MM.state.normalize(ST.mm); return ST; };
  const ST=loadV1(), c=mkCtx(ST,rand); store["machimon-v1"]=raw; delete store[M.BACKUP_KEY];
  const alive=meta.alive, adults=meta.adults, lg=meta.lg;
  ok(raw.length>30000&&alive>=10&&lg>=1&&ST.mm.gd&&ST.mm.gd.on===1&&ST.mm.tix===meta.tix&&ST.mm.res.g===meta.coin,"1.x のセーブを用意("+raw.length+"バイト・個体"+alive+"・おとな"+adults+"・LG"+lg+")");
  const qBefore=JSON.stringify(ST.q), rqBefore=JSON.stringify(ST.rq), oldGd=JSON.stringify(c.mm.gd);
  ok(qBefore===JSON.stringify(FX.save.q)&&Object.keys(ST.q).length===meta.answered,"読みこんだだけでは 学習の記録は変わらない("+meta.answered+"問ぶん)");
  const m1=JSON.stringify(M.migrateV1toV2(c.mm.gd,c.mm)), m2=JSON.stringify(M.migrateV1toV2(c.mm.gd,c.mm));
  ok(m1===m2&&JSON.stringify(c.mm.gd)===oldGd,"引っ越しを2回かけても同じ結果・元のデータを書きかえない");
  const c2=mkCtx(ST,rand); let g2=null, err=""; try{ g2=M.W(c2); }catch(e){ err=e.message; }
  ok(g2&&!err,"引っ越しで落ちない "+err);
  ok(JSON.stringify(ST.q)===qBefore&&JSON.stringify(ST.rq)===rqBefore,"学習の記録(ST.q / ST.rq)が1バイトも変わらない ("+qBefore.length+"バイト)");
  ok(g2.mons.length===alive&&g2.mig===1,"個体の数が保たれる("+g2.mons.length+")");
  ok(g2.mons.filter(p=>p.lv===10).length===adults&&g2.mons.every(p=>p.lv===1||p.lv===10),"おとなはLv10・それ以外はLv1");
  ok(g2.mons.filter(p=>p.lv===10).every(p=>(g2.dex[p.k]&2)===2)&&Object.keys(g2.dex).filter(k=>g2.dex[k]&2).length<=adults,"1.x で おとな まで育てた種類には「おとなにした」のはんこ");
  ok(g2.mons.filter(p=>p.first).length===lg&&g2.mons.every(p=>M.rarOf(p)<=4),"LGは同じ族のURへ移し「初代」の印");
  ok(g2.mons.every(p=>GD.families[M.kindOf(p).f]&&p.tl.every(t=>t>=0&&t<=10)),"才能は0〜10");
  ok(g2.mons.filter(p=>p.tr.length).length===meta.traits&&g2.mons.filter(p=>p.sh).length===meta.shiny&&Object.keys(g2.sdex).length===meta.shiny&&g2.hall.length===meta.ownMb,"特性・色ちがい・名マチモンの名前を引きつぐ");
  ok(c2.mm.res.g===5000&&g2.shard===7+3*(7+4),"コインは5,000まで・超えたぶんと券はかけらへ(かけら "+g2.shard+")");
  ok(store[M.BACKUP_KEY]===raw,"1.x のセーブを別のキーへ写してある(戻せる)");
  ok(c2.mm.gd===null&&c2.mm.tix===0,"写しが取れたので 1.x のデータは手放す");
  const js=JSON.stringify(ST); ok(js.indexOf("NaN")<0&&js.indexOf("undefined")<0&&js.length<raw.length,"NaN が無い・セーブは小さくなる("+raw.length+" → "+js.length+"バイト)");
  ok(M.kanban(g2)&&M.power(M.kanban(g2))===Math.max(...g2.mons.map(p=>M.power(p))),"いちばん強い子が看板に立つ");
  const g2b=M.W(mkCtx(ST,rand)); ok(g2b===g2,"引っ越しは1回きり(2回目の起動では走らない)");
  const rt=M.normalize(JSON.parse(JSON.stringify(g2))); ok(JSON.stringify(rt.mons)===JSON.stringify(g2.mons)&&rt.kan===g2.kan&&rt.shard===g2.shard,"保存して読み直しても同じ");
  /* 引っ越し直後に起動できる: オープニングを出さずにホームへ。全部の画面が描ける */
  { const STu=loadV1(); win.gameState=STu; const b0=UI.ctx; UI.ctx=()=>mkCtx(STu,rand); let e9=""; try{ UI.open(); }catch(e){ e9=e.message; }
    { const hm=UI.screens.h2(); ok(hm.indexOf("あたらしい遊びに なりました")>0&&hm.indexOf(meta.alive+"体")>0,"引っ越し直後のホームに、1回だけ お知らせが出る"); UI.h2MigOk(); ok(UI.screens.h2().indexOf("あたらしい遊びに なりました")<0&&M.normalize(JSON.parse(JSON.stringify(STu.mm.g2))).mn===1,"「わかった」で消え、もう出ない"); }
    const h=UI.screens.h2(); ok(!e9&&UI.route.screen==="h2"&&h.indexOf("つよさ")>0&&h.indexOf("undefined")<0&&h.indexOf("NaN")<0&&STu.mm.g2.mig===1,"1.x のセーブで起動 → オープニングなしでホーム "+e9);
    let bad=""; ["n2","z2","r2","t2","k2m","bz","bzPre","b2"].forEach(sn=>{ let x=""; try{ if(sn==="b2")UI.b2Open(); UI.bzS.noScroll=1; x=UI.screens[sn]({})||""; }catch(e){ x="ERR"+e.message; } if(x.length<200||x.indexOf("undefined")>=0||x.indexOf("NaN")>=0||x.indexOf("ERR")===0)bad+=sn+" "; });
    ok(!bad,"引っ越し直後に どの画面も描ける "+bad);
    UI.k2Go("new"); const sq=UI.v2.quiz; ok(UI.route.screen==="k2"&&sq&&sq.qid!=null,"引っ越し直後に けいこ が始められる"); UI.v2.quiz=null;
    const done=(q)=>JSON.stringify(Object.keys(q).filter(id=>(q[id].c||0)+(q[id].w||0)>0).sort().map(id=>[id,q[id]])); ok(done(STu.q)===done(JSON.parse(qBefore))&&JSON.stringify(STu.rq)===rqBefore,"起動して画面を回っても 解いた問題の記録は変わらない"); UI.ctx=b0; }
  /* 起動のとき(boot.js): 1.x のセーブを読みこむ前に、まるごと写す */
  { const src=fs.readFileSync(path.join(__dirname,"..","js/machimon/boot.js"),"utf8"); ok(/machimon-v1-backup/.test(src)&&/setItem\(BACKUP,raw\)/.test(src),"boot.js は 1.x のセーブを 形を変える前に写す"); }
  /* 途中で失敗したら: 元のセーブを残し、最初の1体から始める */
  const ST3=loadV1(), keep=ST3.mm.gd, real=MM.legacy.read; MM.legacy.read=()=>{ throw new Error("boom"); };
  const wn=win.console.warn; win.console.warn=()=>{}; let g3=null; try{ g3=M.W(mkCtx(ST3,rand)); }catch(e){} MM.legacy.read=real; win.console.warn=wn;
  ok(g3&&g3.mf===1&&g3.mons.length===1&&ST3.mm.gd===keep&&ST3.mm.res.g===12345,"引っ越しに失敗したら元のセーブをそのまま残す");
  /* 写しが取れない(保存先が使えない)ときも 1.x のデータを消さない */
  const ST4=loadV1(); delete store[M.BACKUP_KEY]; delete store["machimon-v1"];
  const g4=M.W(mkCtx(ST4,rand)); ok(g4.mig===1&&ST4.mm.gd&&ST4.mm.gd.on===1,"写しが取れないときは 1.x のデータをセーブに残す");
  /* 空・壊れたセーブ */
  const g5=M.W(mkCtx({q:{},mm:null},rand)); ok(g5.mons.length===1&&g5.kan===g5.mons[0].i,"空のセーブ: 最初の1体から始まる");
  const bad={q:{},mm:MM.state.normalize({res:{g:"abc"},gd:{on:1,seeds:"x",plots:[{f:"z",h:"NaN",i:5},null,7],mb:null,fac:"no",medal:"many"},g2:"oops"})};
  let g6=null,e6=""; try{ g6=M.W(mkCtx(bad,rand)); }catch(e){ e6=e.message; } ok(g6&&g6.mons.length>=1&&JSON.stringify(bad.mm.g2).indexOf("NaN")<0,"壊れたセーブでも起動できる "+e6);
  const g7=M.normalize({on:1,mons:[{i:"a1",k:"nope"},{i:"a2",k:"k003",lv:"x",tl:[99,-4,"a"],ef:[1e9],na:"zz",tr:["no","star","star"]},"str"],kan:"a9",sub:["a2","a2","q"],shard:-5});
  ok(g7.mons.length===1&&g7.mons[0].lv===1&&g7.mons[0].tl.join()==="10,0,0,0,0"&&g7.mons[0].ef[0]===100&&g7.mons[0].tr.join()==="star"&&g7.kan===""&&g7.shard===0,"壊れた値は安全な値へ丸める");
  { const o=MM.state.normalize({on:1,name:"<b>x",res:{g:50,ke:9},mons:{u1:{sp:"m01"}},slots:{a:1},areas:{rouki:1},ms:{intro:1,tut:1},g2:null}); ok(o.res.g===50&&Object.keys(o.res).length===1&&!o.mons&&!o.slots&&!o.areas&&o.ms.intro===1&&!o.ms.tut&&o.name==="bx","1.x の使わなくなった項目(街・建物 など)は読みこむときに落とす"); }

  /* ---------- 育つ(けいこ) ---------- */
  const STn={q:{},rq:[],mm:null}, cn=mkCtx(STn,mkRand(5)); MM.game.finishIntro(cn,"あたらしい街"); win.gameState=STn; UI.ctx=()=>mkCtx(STn,cn.rand,cn._d||0);
  const gn=M.W(cn), k=M.kanban(gn), c0=cn.mm.res.g;
  let id=MM.learn.pick(1,cn,{subs:[0]})[0]; let gain=MM.economy.grant(MM.learn.commit(id,true,500,cn),cn);
  ok(gain.g===0&&k.xp===0&&cn.mm.res.g===c0,"2秒未満のまぐれ当たりは何も出ない");
  id=MM.learn.pick(1,cn,{subs:[0]})[0]; gain=MM.economy.grant(MM.learn.commit(id,false,4000,cn),cn); ok(gain.g===0&&k.xp===0,"まちがいは何も出ない");
  id=MM.learn.pick(1,cn,{subs:[0]})[0]; gain=MM.economy.grant(MM.learn.commit(id,true,4000,cn),cn);
  ok(gain.g===10&&gain.mon.xp===10&&cn.mm.res.g===c0+10&&Object.keys(cn.mm.res).join()==="g","あたらしい問題の正解 = コイン10・経験10(お金はコインだけ)");
  { const m0=JSON.stringify(gn.mons), c0b=cn.mm.res.g; MM.state.rollDay(cn); MM.game.enter({ST:STn,now:cn.now+86400000*3,rand:cn.rand}); ok(JSON.stringify(gn.mons)===m0&&cn.mm.res.g===c0b,"放置では何も増えない(コインも育ちも)"); }
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
  UI.go("garden"); const r1=UI.route.screen; UI.go("gContest"); const r2=UI.route.screen; UI.go("town"); ok(r1==="h2"&&r2==="h2"&&UI.route.screen==="h2"&&!UI.screens.garden&&!UI.screens.town,"1.x の画面(大会・街評議会・街)は もう無い(名前を呼んでもホームへ)");
  ok(!cn.mm.gd&&!MM.garden&&!MM.town&&!MM.incident&&!MM.boss,"1.x の遊びのコードは読みこまれない・1.x のセーブは作られない");
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
  const fresh=(seed)=>{ const ST={q:{},rq:[],mm:null}; const c=mkCtx(ST,mkRand(seed)); MM.game.finishIntro(c,"番付の街"); M.W(c); return c; };
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
    const exN=s.qids.filter(id=>MM.exam.isExam(win.qById(id))).length; ok(exN===R.exam,"5問のうち本試験形式が"+R.exam+"問 ("+exN+")");
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
  const fresh=(seed)=>{ const ST={q:{},rq:[],mm:null}; const c=mkCtx(ST,mkRand(seed)); MM.game.finishIntro(c,"配合の街"); win.gameState=ST; M.W(c); return c; };
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
  { const id=MM.learn.pick(1,c,{subs:[0],filter:(q,st)=>!MM.learn.seen(st)})[0], lv0=k9.lv; k9.lv=1; k9.tr=[]; k9.xp=0; k9.ef=[0,0,0,0,0]; const gain=MM.economy.grant(MM.learn.commit(id,true,4000,c),c); k9.lv=Math.max(lv0,k9.lv);
    ok(gain.mon.xp===20&&gain.g===10&&Math.abs(gain.mon.ef.o-D.KEIKO.kinds[0].ef*2)<1e-9&&g.boost.ef===9&&g.boost.xp===9,"2倍のあいだは 経験20・けいこ値2倍(コインは増えない)"); }
  /* ごほうび: 順番で決まる・乱数なし */
  { const c2=fresh(12), g2=M.W(c2), out=[]; const cr=c2.rand; let used=0; c2.rand=()=>{ used++; return 0.5; }; BR.give(c2,{t0:6,t1:8,bt:1},out,"x"); c2.rand=cr;
    ok(used===0&&out.length===15&&g2.bt===1&&D.ITEMS.every(t=>g2.items[t.id]>=1),"ごほうびは順番で決まる(乱数なし)・12種すべてが順にもらえる");
    const z=BZ.Z(c2), it0=BR.itemCount(g2); const day=(n)=>{ c2.dstr="g"+n; c2.today=24000+n; MM.state.rollDay(c2); }; let d=1; day(d);
    const bout=(winIt)=>{ if(BZ.leftToday(c2)<=0){ d++; day(d); } const s=BZ.start(c2); const foe=D.bzAt(s.foe); ["h","m","o","j","s"].forEach(k=>{ s.mine[k]=foe.stats[k]*(winIt?3:0.1); }); let r; do{ r=BZ.round(c2,s,false,20000); }while(r&&!r.over); return BZ.finish(c2,s); };
    z.pos=40; let last; for(let i=0;i<7;i++)last=bout(i<3); ok(last.gifts.length===0&&BR.itemCount(g2)===it0,"負け越しの場所に ごほうびは無い");
    for(let i=0;i<7;i++)last=bout(i<5); ok(last.gifts.length===1&&BR.itemCount(g2)===it0+1,"5勝の場所: 育成どうぐ1つ");
    for(let i=0;i<7;i++)last=bout(i<6); ok(last.gifts.length===2&&D.itemById[last.gifts[1].item].tier===1,"6勝の場所: ふつう1つ＋とっておき1つ");
    const bt0=g2.bt; for(let i=0;i<7;i++)last=bout(true); ok(last.gifts.length===2&&last.gifts.every(x=>x.item&&D.itemById[x.item].tier===1)&&g2.bt===bt0,"全勝の場所: とっておき2つ(配合券は出ない=配合券は復習と昇進だけ)");
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
  e0(); let gn=ans(c,qNew,true); ok(gn.g===10&&gn.mon.cls==="new"&&k.ef[2]===K.kinds[0].ef&&k.ef[3]===0&&k.ef[4]===0,"あたらしい問題の正解 → ちから(コイン10・けいこ値 "+K.kinds[0].ef+")");
  e0(); gn=ans(c,qRev,true); ok(gn.g===20&&gn.mon.cls==="rev"&&k.ef[3]===K.kinds[1].ef&&k.ef[2]===0,"復習の正解 → ねばり(コイン20)");
  e0(); gn=ans(c,qLate,true); ok(gn.mon.late&&k.ef[3]===K.kinds[1].ef*2,"7日以上ためた復習は けいこ値2倍");
  e0(); gn=ans(c,qNig,true); ok(gn.g===30&&gn.mon.cls==="nig"&&k.ef[4]===K.kinds[2].ef&&k.ef[2]===0&&k.ef[3]===0,"苦手つぶしの正解 → ひらめき(コイン30)");
  e0(); gn=ans(c,qEarly,true); ok(gn.g<=5&&k.ef.every(v=>v===0),"期限前の問題は ほぼ何も出ない");
  e0(); gn=ans(c,bySub(3)[5].id,false); ok(gn.g===0&&k.ef.every(v=>v===0)&&gn.mon.xp===0,"まちがいは何も出ない");
  e0(); c.mm.combo=4; gn=ans(c,bySub(3)[6].id,true); ok(c.mm.combo===5&&k.ef[0]===K.comboEf&&k.ef[2]===K.kinds[0].ef,"連続正解5問ごとに いきおい");
  e0(); const exId=MM.exam.ids()[0]; gn=ans(c,exId,true); ok(k.ef[1]===K.examEf,"本試験形式の正解で かしこさ");
  e0(); gn=ans(c,qNew,true); ok(gn.g<10&&k.ef.every(v=>v===0),"同じ日のくり返しでは けいこ値は入らない");
  /* 1回10問・4問に1問は本試験形式・あたらしい問題は1回=1科目 */
  { const c2=fresh(22); let s=KE.start(c2,"new"); const sub0=s.sub, subs=new Set(), ex=[]; let n=0;
    while(s.qid!=null){ const q=win.qById(s.qid); subs.add(q.s); ex.push(MM.exam.isExam(q)?1:0); const o=(n%3!==0); const gain=ans(c2,s.qid,o); KE.advance(c2,s,o,gain); n++; }
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
/* ================= スライス7: 特性36・組み合わせ10・物語・図鑑・かけら交換 ================= */
{
  const {mkCtx,mkRand,mon,fresh4:fresh,put4:put}=module.exports; const KE=MM.keiko, BR=MM.breed, BZ=MM.banzuke, K=D.KEIKO, B=D.BREED, R=D.BASHO; const {banHit,rpgHit}=require("./lib-load.js");
  const T=D.TRAITS, TB=D.traitById, Q=win.Q, KEYS=["h","m","o","j","s"];
  const chk=(name,h)=>{ const u=h.indexOf("undefined"), n=h.indexOf("NaN"), b=banHit(h), rp=rpgHit(h); ok(h.length>200&&u<0&&n<0&&!b&&!rp,"render "+name+" ("+h.length+")"+(u>=0?" undefined@"+h.slice(Math.max(0,u-60),u+10):"")+(n>=0?" NaN@"+h.slice(Math.max(0,n-60),n+5):"")+(b?" 禁止語:"+b:"")+(rp?" RPGの言葉:"+rp:"")); };
  /* ---------- 表 ---------- */
  const cats={a:0,b:0,k:0,h:0}; T.forEach(t=>cats[t.cat]++);
  ok(T.length===36&&cats.a===10&&cats.b===12&&cats.k===8&&cats.h===6,"特性36 = 能力10・品評会12・育成8・配合6");
  ok(new Set(T.map(t=>t.id)).size===36&&new Set(T.map(t=>t.name)).size===36&&new Set(T.map(t=>t.icon)).size===36,"特性の id・名前・印が重ならない");
  ok(["gold","shiki","sprout","phoenix","giant","rainbow","lucky","star","sage","cosmos"].every(id=>TB[id]),"旧版からある10個の id は残っている(セーブの特性が消えない)");
  ok(T.every(t=>t.desc.length<=22&&Object.keys(t.fx).length>=1),"説明は一言(22文字まで) "+T.filter(t=>t.desc.length>22).map(t=>t.name).join());
  ok(D.COMBOS.length===10&&D.COMBOS.every(cb=>TB[cb.a]&&TB[cb.b]&&cb.a!==cb.b&&cb.name&&cb.desc)&&new Set(D.COMBOS.map(cb=>[cb.a,cb.b].sort().join())).size===10,"組み合わせは10組");
  /* ---------- 測る道具 ---------- */
  const base=mon({});
  /* 五番勝負の1本ぶん。能力はどれも100・相手の数字は100÷0.85 にそろえ、特性の倍率だけを見る */
  const bout=(tr,o)=>{ o=o||{}; const c=fresh(700+(bout.n=(bout.n||0)+1)), g=M.W(c), k=M.kanban(g); k.tr=tr.slice(); const s=BZ.start(c), foe=D.bzAt(s.foe);
    KEYS.forEach(x=>{ s.mine[x]=100; }); s.under=!!o.under; s.i=o.i||0; s.l=o.l||0; s.w=o.w||0; s.rounds=[]; for(let j=0;j<s.i;j++)s.rounds.push({win:false}); if(o.last)s.rounds[s.rounds.length-1]={win:o.last>0};
    const r=BZ.round(c,s,o.ok!==false,o.ms==null?20000:o.ms); return {me:r.me,foe:r.foe,foeBase:BZ.foeShow(foe,R.order[s.i-1]),names:r.names,fc:s.fc}; };
  /* けいこの1問ぶん */
  const st0=(c,id,o)=>{ c.ST.q[id]=Object.assign({c:1,w:0,ng:false,s:0,bm:false,box:1,due:c.today-1,la:c.today-3,ease:2.3},o||{}); };
  const keiko=(tr,o)=>{ o=o||{}; const c=fresh(900+(keiko.n=(keiko.n||0)+1)), g=M.W(c), k=M.kanban(g); k.tr=tr.slice(); k.lv=o.lv||40; k.xp=0; k.ef=[0,0,0,0,0];
    let id; if(o.exam)id=MM.exam.ids()[0]; else id=Q.filter(q=>q.s===2)[3].id;
    if(o.cls==="rev")st0(c,id); else if(o.cls==="nig")st0(c,id,{ng:true,c:0,w:1,due:c.today});
    if(o.combo)c.mm.combo=o.combo-1;
    const gain=MM.economy.grant(MM.learn.commit(id,true,4000,c),c); return {xp:gain.mon.xp,coin:gain.g,ef:gain.mon.ef,k}; };
  /* 配合を N 回 */
  const brd=(trA,trB,fn,o)=>{ o=o||{}; const c=fresh(1100), g=M.W(c); g.hn=[]; const A=put(c,Object.assign({k:"k001",tl:[10,2,6,6,3],na:"n4",tr:trA},o.A||{})), Bp=put(c,Object.assign({k:"k021",tl:[4,8,6,6,9],na:"n5",tr:trB},o.B||{}));
    const r=mkRand(o.seed||31), d=BR.kindDist(A,Bp,""), cp=BR.compat(g,A,Bp), N=o.n||6000; let n=0; for(let i=0;i<N;i++)if(fn(BR.make(r,g,A,Bp,"",d,cp)))n++; return n/N; };
  const near=(a,b,e)=>Math.abs(a-b)<=(e==null?0.02:e);
  const stat1=(tr,k)=>M.stat(mon({tr}),k)/M.stat(base,k);
  /* ---------- 36種それぞれが 実際に効く ---------- */
  const b0=bout([]), k0n=keiko([]), k0r=keiko([],{cls:"rev"}), k0g=keiko([],{cls:"nig"}), k0e=keiko([],{exam:1});
  const hi0=brd([],[],p=>p.tl[0]===10), up0=brd([],[],p=>p.tl[2]===7), na0=brd([],[],p=>p.na==="n4"||p.na==="n5");
  const CHK={
    giant:()=>near(stat1(["giant"],"o"),1.15)&&stat1(["giant"],"j")===1,
    nebari:()=>near(stat1(["nebari"],"j"),1.15)&&stat1(["nebari"],"o")===1,
    hanayaka:()=>near(stat1(["hanayaka"],"h"),1.15)&&stat1(["hanayaka"],"m")===1,
    pikatto:()=>near(stat1(["pikatto"],"s"),1.15)&&stat1(["pikatto"],"h")===1,
    hakase:()=>near(stat1(["hakase"],"m"),1.15)&&stat1(["hakase"],"s")===1,
    shokunin:()=>near(stat1(["shokunin"],"o"),1.08)&&near(stat1(["shokunin"],"s"),1.08)&&stat1(["shokunin"],"j")===1,
    yutosei:()=>near(stat1(["yutosei"],"j"),1.08)&&near(stat1(["yutosei"],"m"),1.08)&&stat1(["yutosei"],"h")===1,
    sokoage:()=>{ const p0=mon({tl:[5,5,5,1,5]}), p1=mon({tl:[5,5,5,1,5],tr:["sokoage"]}); return near(M.stat(p1,"j")/M.stat(p0,"j"),1.25,0.03)&&KEYS.filter(k=>k!=="j").every(k=>M.stat(p1,k)===M.stat(p0,k)); },
    star:()=>near(M.power(mon({tr:["star"]}))/M.power(base),1.06,0.01),
    cosmos:()=>near(M.power(mon({tr:["cosmos"]}))/M.power(base),1.10,0.01),
    sente:()=>bout(["sente"]).me===120&&bout(["sente"],{i:1}).me===100,
    nakaban:()=>bout(["nakaban"],{i:2}).me===120&&bout(["nakaban"]).me===100,
    musubi:()=>bout(["musubi"],{i:4,w:2,l:2}).me===125&&bout(["musubi"],{i:3}).me===100,
    dohyo:()=>bout(["dohyo"],{i:2,l:2}).me===125&&bout(["dohyo"],{i:2,l:1,w:1}).me===100,
    phoenix:()=>bout(["phoenix"],{i:1,l:1,last:-1}).me===115&&bout(["phoenix"],{i:1,w:1,last:1}).me===100,
    norinori:()=>bout(["norinori"],{i:1,w:1,last:1}).me===110&&bout(["norinori"],{i:1,l:1,last:-1}).me===100,
    hayatochiri:()=>bout(["hayatochiri"],{ok:false}).me===70&&b0.me===100&&bout([],{ok:false}).me===50,
    subayai:()=>bout(["subayai"],{ms:4000}).me===120&&bout([],{ms:4000}).me===110&&bout(["subayai"],{ms:20000}).me===100,
    shiki:()=>bout(["shiki"],{ms:20000}).me===110&&bout(["shiki"],{ms:500}).me===100,
    rainbow:()=>{ const x=bout(["rainbow"]); return x.foe===Math.round(x.foeBase/0.85*0.85*0.95)||near(x.foe/x.foeBase,0.95,0.03); },
    oomono:()=>bout(["oomono"],{under:true}).me===106&&bout(["oomono"],{under:false}).me===100,
    honban:()=>bout(["honban"],{i:3}).me===112&&bout(["honban"],{i:4,w:2,l:2}).me===112&&bout(["honban"],{i:2}).me===100,
    fukushu:()=>keiko(["fukushu"],{cls:"rev"}).xp===Math.round(k0r.xp*1.5)&&keiko(["fukushu"]).xp===k0n.xp,
    sage:()=>keiko(["sage"],{cls:"rev"}).xp===Math.round(k0r.xp*1.15),
    sprout:()=>keiko(["sprout"],{lv:20,cls:"rev"}).xp===Math.round(k0r.xp*1.5)&&keiko(["sprout"],{lv:30,cls:"rev"}).xp===k0r.xp,
    gold:()=>keiko(["gold"],{cls:"rev"}).coin===Math.round(k0r.coin*1.25)&&keiko(["gold"],{cls:"rev"}).xp===k0r.xp,
    nigate:()=>near(keiko(["nigate"],{cls:"nig"}).ef.s,k0g.ef.s*2,1e-9)&&near(keiko(["nigate"]).ef.o,k0n.ef.o,1e-9),
    shinmono:()=>near(keiko(["shinmono"]).ef.o,k0n.ef.o*1.5,1e-9)&&near(keiko(["shinmono"],{cls:"rev"}).ef.j,k0r.ef.j,1e-9),
    nami:()=>keiko(["nami"],{combo:3}).ef.h===K.comboEf&&!keiko([],{combo:3}).ef.h&&keiko([],{combo:5}).ef.h===K.comboEf,
    honshiken:()=>near(keiko(["honshiken"],{exam:1}).ef.m,k0e.ef.m*2,1e-9)&&k0e.ef.m===K.examEf,
    tsutae:()=>near(brd(["tsutae"],[],p=>p.tl[0]===10),hi0+0.15*(1-D.TALENT_W[10]/D.TALENT_W.reduce((a,b)=>a+b,0)),0.025)&&near(brd([],["tsutae"],p=>p.tl[0]===10),brd(["tsutae"],[],p=>p.tl[0]===10),0.03),
    lucky:()=>near(brd(["lucky"],[],p=>p.tl[2]===7)-up0,0.10*0.94,0.02),
    oyayuzuri:()=>near(brd(["oyayuzuri"],[],p=>p.na==="n4"||p.na==="n5"),0.9+0.1*0.2,0.02)&&near(na0,0.6+0.4*0.2,0.02),
    osusowake:()=>near(brd(["osusowake"],[],p=>p.tr.indexOf("osusowake")>=0),0.70)&&near(brd(["star"],[],p=>p.tr.indexOf("star")>=0),B.trait),
    mezurashi:()=>{ const c=fresh(1200), a=put(c,{k:"k004",tr:["mezurashi"]}), b=put(c,{k:"k014"}), a0=put(c,{k:"k004"}); const p1=BR.kindDist(a,b,"").list.find(x=>x.only).p, p0=BR.kindDist(a0,b,"").list.find(x=>x.only).p; return near(p1,p0*1.5,1e-9)&&p0===B.only[2]; },
    yarinaoshi:()=>{ const f=p=>p.tl[0]!==10&&p.tl[0]!==4&&p.tl[0]>=7; return brd(["yarinaoshi"],[],f)>brd([],[],f)*1.4; }
  };
  ok(T.every(t=>typeof CHK[t.id]==="function"),"36種すべてに 効果の検査がある "+T.filter(t=>!CHK[t.id]).map(t=>t.id).join());
  T.forEach(t=>{ let r=false, e=""; try{ r=CHK[t.id](); }catch(x){ e=x.message; } ok(r,"特性「"+t.name+"」("+t.desc+")が 実際に効く "+e); });
  /* ---------- 組み合わせ10組 ---------- */
  const CB={
    c01:()=>bout(["sente","giant"]).me===Math.round(100*1.2*1.1),
    c02:()=>bout(["dohyo","nebari"],{i:2,l:2}).me===Math.round(100*1.25*1.1),
    c03:()=>bout(["musubi","hakase"],{i:4,w:2,l:2}).me===Math.round(100*1.25*1.1),
    c04:()=>bout(["nakaban","hanayaka"],{i:2}).me===132,
    c05:()=>bout(["hayatochiri","sokoage"],{ok:false}).me===80,
    c06:()=>near(M.power(mon({tr:["star","cosmos"]}))/M.power(base),1.06*1.10*1.04,0.01),
    c07:()=>near(stat1(["shokunin","yutosei"],"h"),1.12)&&near(stat1(["shokunin","yutosei"],"o"),1.08),
    c08:()=>keiko(["fukushu","sage"],{cls:"rev"}).xp===Math.round(k0r.xp*1.15*1.25*1.5),
    c09:()=>near(brd(["tsutae","lucky"],[],p=>p.tl[2]===7)-brd(["lucky"],[],p=>p.tl[2]===7),0.05*0.9,0.02)&&near(brd(["tsutae"],["lucky"],p=>p.tl[2]===7),brd(["tsutae","lucky"],[],p=>p.tl[2]===7),0.02),
    c10:()=>bout(["honban","honshiken"],{i:3}).me===Math.round(100*1.12*1.06)
  };
  D.COMBOS.forEach(cb=>{ let r=false, e=""; try{ r=CB[cb.id]()&&M.combosOf([cb.b,cb.a]).length===1&&M.combosOf([cb.a]).length===0; }catch(x){ e=x.message; }
    ok(r,"組み合わせ「"+cb.name+"」("+TB[cb.a].name+"＋"+TB[cb.b].name+")が 実際に効く "+e); });
  /* 見込み(◎▲△▼)は特性こみ。効いた特性の名前が出る */
  { const x=bout(["sente","giant"]); ok(x.fc.rows[0].names.join().indexOf("先手")>=0&&x.fc.rows[0].names.join().indexOf("立ち合い一気")>=0&&x.fc.rows[1].names.length===0&&x.names.length>=2,"取組の前の見込みと1本ごとの画面に、効いている特性の名前が出る");
    const c=fresh(1300), g=M.W(c), k=M.kanban(g); k.tr=["sente"]; const foe=BZ.state(c).foe, f1=BZ.forecast(c,foe,k); k.tr=[]; const f0=BZ.forecast(c,foe,k);
    ok(f1.rows[0].me===Math.round(f0.rows[0].me*1.2)&&f1.rows[1].me===f0.rows[1].me,"見込みの数字は 特性こみ(先手=1本目だけ1.2倍)"); }
  /* 特性のつき方 */
  { const c=fresh(1400), g=M.W(c), cnt={}; const r=mkRand(9); for(let i=0;i<20000;i++){ const t=M.rollTrait(r,0); cnt[t]=(cnt[t]||0)+1; }
    ok(Object.keys(cnt).length===36&&cnt.cosmos<cnt.star&&cnt.star<cnt.sage&&cnt.sage<cnt.giant,"特性の抽選: 36種すべて出る・めずらしいものほど出にくい(宇宙のタマゴ "+cnt.cosmos+" < スター性 "+cnt.star+" < 賢者の書 "+cnt.sage+" < 力持ち "+cnt.giant+")");
    let two=0; const A=put(c,{k:"k001",tr:["sente"]}), Bp=put(c,{k:"k002",tr:["giant"]}), d=BR.kindDist(A,Bp,""), cp=BR.compat(g,A,Bp); for(let i=0;i<4000;i++){ if(BR.make(r,g,A,Bp,"",d,cp).tr.length===2)two++; }
    ok(near(two/4000,B.trait*B.trait,0.02),"配合で 特性を2つとも継ぐことがある(組み合わせを 配合でねらえる) "+(two/40).toFixed(1)+"%");
    const p=put(c,{k:"k001",tr:["sente"]}); g.items.ishi=1; const u=BR.useItem(c,"ishi",p.i); ok(p.tr.length===2&&p.tr[1]!=="sente"&&TB[u.trait],"ひらめきの石は いまと違う特性を1つ足す"); }
  /* ---------- 図鑑のはんこ ---------- */
  { const c=fresh(1500), g=M.W(c), old=M.kanban(g); old.lv=30; const nw=put(c,{k:"k004",tl:[7,7,7,7,7]});
    M.mark(g,nw); M.setKan(c,nw.i); ok(nw.lv===30&&g.dex.k004===1,"看板にした瞬間には「おとなにした」は付かない(Lvを引きついでも)");
    const ids=Q.filter(q=>q.s===4).map(q=>q.id); let n=0, at=0; while(!(g.dex.k004&2)&&n<60){ const gn=MM.economy.grant(MM.learn.commit(ids[n],true,4000,c),c); n++; if(gn.mon.adult)at=n; }
    ok(n===D.ADULT_NEED&&at===n&&nw.kc===D.ADULT_NEED&&(g.dex.k004&3)===3,"看板として "+D.ADULT_NEED+"問 正解すると「おとなにした」("+n+"問目)");
    const kid=put(c,{k:"k005",lv:1}); M.setKan(c,kid.i); kid.lv=3; kid.xp=0; g.dex.k005=1; for(let i=0;i<40;i++){ kid.lv=Math.min(kid.lv,5); MM.economy.grant(MM.learn.commit(ids[100+i],true,4000,c),c); }
    ok(kid.kc===D.ADULT_NEED&&!(g.dex.k005&2),"Lv10より下では、何問正解しても付かない"); kid.lv=10; MM.economy.grant(MM.learn.commit(ids[150],true,4000,c),c); ok((g.dex.k005&2)===2,"Lv10に とどいた後の正解で付く");
    const hi=put(c,{k:"k006",tl:[8,8,8,8,8]}); M.mark(g,hi); const lo=put(c,{k:"k007",tl:[8,8,8,8,7],sh:1}); M.mark(g,lo); ok(g.dex.k006===5&&g.dex.k007===1&&g.sdex.k007===1&&!g.sdex.k006,"才能40以上のはんこ・色ちがいのページ");
    const rt=M.normalize(JSON.parse(JSON.stringify(g))); ok(rt.sdex.k007===1&&rt.dex.k004===g.dex.k004&&M.byId(rt,nw.i).kc===D.ADULT_NEED,"はんこ・色ちがい・正解数は 保存→読み直しで同じ");
    win.gameState=c.ST; const b0=UI.ctx; UI.ctx=()=>c; const zd=UI.screens.z2d({id:"k004"}); chk("z2d(種類のページ)",zd); ok(["見つけた","おとなにした","才能40以上"].every(w=>zd.indexOf(w)>0)&&(zd.match(/mm-v2-strow mm-on/g)||[]).length===2,"種類のページに はんこ3つと条件");
    chk("z2d(配合限定)",UI.screens.z2d({id:"k100"})); const zo=UI.screens.z2d({id:"k105"}); ok(zo.indexOf("生まれ方")>0&&zo.indexOf("×")>0&&zo.indexOf("？？？")>0,"配合限定の種類は、まだでも 生まれ方(族の組)が分かる");
    chk("z2(色ちがい)",UI.screens.z2({tab:"s"})); ok((UI.screens.z2({tab:"s"}).match(/mm-gi-shiny/g)||[]).length===1,"色ちがいのページ: 見つけた種類だけ色ちがいの絵");
    const zt=UI.screens.z2({tab:"tr"}); chk("z2(特性)",zt); ok(T.every(t=>zt.indexOf(t.name)>0&&zt.indexOf(t.desc.replace(/&/g,"&amp;"))>0)&&D.COMBOS.every(cb=>zt.indexOf(cb.name)>0),"特性の一覧に 36種と組み合わせ10組が ぜんぶ出る");
    nw.tr=["sente"]; const nd=UI.screens.n2d({id:nw.i}); ok(nd.indexOf("1本目だけ ×1.2")>0&&nd.indexOf("立ち合い一気")>0,"個体の詳細: 特性のひとこと説明と、あと1つでそろう組み合わせ");
    nw.tr=["sente","giant"]; ok(UI.screens.n2d({id:nw.i}).indexOf("mm-v2-combo")>0,"そろった組み合わせが 個体の詳細に出る"); chk("n2d(特性2つ)",UI.screens.n2d({id:nw.i}));
    UI.ctx=b0; }
  /* ---------- かけら交換 ---------- */
  { const c=fresh(1600), g=M.W(c); win.gameState=c.ST; const b0=UI.ctx; UI.ctx=()=>c;
    const S=BR.shop(c); ok(S.ur.length===9&&S.ssr.length===9&&S.items.length===12&&S.ur.every(x=>x.cost===1000&&x.kind.rar===4&&!x.kind.only)&&S.ssr.every(x=>x.cost===300&&x.kind.rar===3),"かけら交換: 好きなSSR 300・好きなUR 1,000(タマゴから出る9種ずつ)");
    ok(S.items.every(x=>x.cost>=30&&x.cost<=100)&&D.ITEMS.every(t=>D.SHOP_ITEM[t.id]),"育成どうぐは 各30〜100 ("+S.items.map(x=>x.cost).join(",")+")");
    g.shard=299; ok(BR.buyKind(c,"k009").err&&g.shard===299&&g.mons.length===1,"かけらが足りないと交換できない(減らない)");
    g.shard=300; const r1=BR.buyKind(c,"k009"); ok(r1.mon&&r1.mon.k==="k009"&&g.shard===0&&g.mons.length===2&&(g.dex.k009&1)&&r1.isNew,"SSR: かけら300で その種類が なかまになる・図鑑に入る");
    g.shard=1000; const r2=BR.buyKind(c,"k010"); ok(r2.mon&&M.rarOf(r2.mon)===4&&g.shard===0,"UR: かけら1,000");
    g.shard=5000; ok(BR.buyKind(c,"k100").err&&BR.buyKind(c,"k001").err&&BR.buyKind(c,"zzz").err&&g.shard===5000,"配合限定・N〜SR・無い種類は交換できない");
    const s0=g.shard; ok(!BR.buyItem(c,"ishi").err&&g.items.ishi===1&&g.shard===s0-D.SHOP_ITEM.ishi&&BR.buyItem(c,"nope").err,"どうぐ: かけらと交換");
    g.shard=20; ok(BR.buyItem(c,"kawari").err&&g.shard===20,"どうぐも かけらが足りないと交換できない");
    const cap=D.RATE2.cap; D.RATE2.cap=g.mons.length; g.shard=2000; ok(BR.buyKind(c,"k010").err&&g.shard===2000,"なかまがいっぱいのときは むかえられない(かけらは減らない)"); D.RATE2.cap=cap;
    let neg=false; for(let i=0;i<200;i++){ BR.buyItem(c,D.ITEMS[i%12].id); BR.buyKind(c,i%2?"k009":"k010"); if(g.shard<0)neg=true; } ok(!neg&&g.shard>=0,"かけらは負にならない");
    g.shard=450; const hk=UI.screens.z2({tab:"kk"}); chk("z2(かけら交換)",hk); ok(hk.indexOf("好きなUR")>0&&hk.indexOf("好きなSSR")>0&&D.ITEMS.every(t=>hk.indexOf(t.name)>0)&&(hk.match(/mm-v2-kkrow/g)||[]).length===30,"交換の画面: UR9・SSR9・どうぐ12");
    const n0=g.mons.length; UI.kkKind("k019"); ok(UI.route.screen==="kkr"&&g.mons.length===Math.min(n0+1,D.RATE2.cap)&&g.shard===150,"交換すると 生まれた子の画面へ"); chk("kkr",UI.screens.kkr());
    ok(UI.screens.n2().indexOf("かけら交換")>0,"なかま の画面から かけら交換へ行ける"); UI.ctx=b0; }
  /* ---------- 物語 ---------- */
  { const E=D.STORY.eps;
    ok(E.length===8&&E.every((e,i)=>e.no===i+1&&e.title&&e.lines.length>=4&&e.lines.length<=6),"物語は全8話・1話4〜6行");
    ok(E.every(e=>e.lines.every(l=>"nmby".indexOf(l.w)>=0&&l.t.length>=4&&l.t.length<=64)),"1行は長くても64文字");
    const all=E.map(e=>e.title+e.lines.map(l=>l.t).join("")).join(""); ok(!banHit(all)&&!rpgHit(all),"8話すべてに禁止の言葉が無い "+banHit(all)+rpgHit(all));
    const GATE={2:55,3:50,4:44,5:32,6:22,7:8,8:1}; ok(E.every(e=>e.no===1||D.bzAt(GATE[e.no]).rival===e.rival),"第2〜8話の語り手は、その段の関門を守る親方");
    ok(E[4].lines.some(l=>l.t.indexOf("盗まれていません")>=0)&&E[4].lines.some(l=>l.t.indexOf("預")>=0)&&E[7].lines.filter(l=>l.w==="y").length>=3,"第5話で「盗まれたのではなく預けられた」・第8話は横綱が語る");
    /* 段の昇進でひらく */
    const c=fresh(1700), g=M.W(c), z=BZ.Z(c); win.gameState=c.ST; const b0=UI.ctx; UI.ctx=()=>c; let d=1;
    const day=()=>{ d++; c.dstr="st"+d; c.today=26000+d; MM.state.rollDay(c); };
    const fight=(winIt)=>{ if(BZ.leftToday(c)<=0)day(); const s=BZ.start(c), foe=D.bzAt(s.foe); KEYS.forEach(k=>{ s.mine[k]=foe.stats[k]*(winIt?3:0.1); }); let r; do{ r=BZ.round(c,s,true,20000); }while(r&&!r.over); return BZ.finish(c,s); };
    ok(z.story===0&&UI.storyHome(c)===""&&UI.storyList(c).indexOf("？？？")>0&&UI.storyList(c).indexOf(E[0].title+"<")<0,"はじめは1話もひらいていない(題も見えない)");
    UI.stS={ep:1,line:0}; ok(UI.screens.st().indexOf("mm-st-head")<0,"ひらいていない話は読めない");
    const lose=fight(false); ok(z.story===0&&!lose.story,"負けではひらかない");
    const w1=fight(true); ok(z.story===1&&w1.story===1,"はじめて勝つと 第1話");
    const opens=[]; [56,51,45,33,23,9,2].forEach(pos=>{ z.pos=pos; z.n=0; z.w=0; z.l=0; const r=fight(true); opens.push(r.promo&&r.promo.won?r.story:-1); });
    ok(opens.join()==="2,3,4,5,6,7,8"&&z.story===8&&z.pos===1,"昇進の一番に勝つたびに1話ずつ(序二段=2 … 横綱=8) "+opens.join());
    z.story=3; g.sread=0; z.pos=45; const pl=fight(false); ok(z.story===3&&!pl.story,"昇進の一番に負けたら ひらかない");
    /* 読む */
    UI.bzS.res=w1; const hr=UI.screens.bzRes(); ok(hr.indexOf("物語が ひらいた")>0&&hr.indexOf("第1話「"+E[0].title+"」")>0,"取組の結果に「第1話を読む」ボタン");
    ok(UI.storyHome(c).indexOf("第1話")>0&&UI.screens.h2().indexOf("あたらしい話")>0,"まだ読んでいない話は ホームに出る");
    UI.storyRead(1,"h2"); let h1=UI.screens.st(); chk("st(1行目)",h1); ok((h1.match(/mm-st-now/g)||[]).length===1&&h1.indexOf(E[0].lines[1].t)<0&&h1.indexOf("とじる")<0,"1行目だけ出る");
    let taps=0; while(UI.stS.line<E[0].lines.length-1&&taps<10){ UI.storyTap(); taps++; } h1=UI.screens.st(); chk("st(さいご)",h1);
    ok(taps===E[0].lines.length-1&&E[0].lines.every(l=>h1.indexOf(UI.esc(l.t))>0)&&h1.indexOf("とじる")>0,"タップで1行ずつ進み、さいごに「とじる」("+taps+"タップ)");
    UI.storyClose(); ok(g.sread===1&&UI.route.screen==="h2"&&UI.storyHome(c).indexOf("第2話")>0,"とじると 読んだ ことになり、つぎの話がホームに出る");
    UI.storyRead(4); ok(UI.screens.st().indexOf("mm-st-head")<0,"まだひらいていない第4話は読めない");
    g.sread=3; const hl=UI.storyList(c); ok(UI.storyHome(c)===""&&(hl.match(/class="mm-st-row"/g)||[]).length===3&&(hl.match(/mm-st-lock/g)||[]).length===5&&hl.indexOf(E[4].title+"<")<0&&hl.indexOf("十両に上がると")>0,"きろく: ひらいた3話は読み返せる・のこりは題を見せず「◯◯に上がると ひらく」");
    ok(UI.screens.r2().indexOf("消えた看板")>0,"きろく の画面に 物語の一覧"); chk("r2(物語つき)",UI.screens.r2());
    UI.storyRead(2,"r2"); for(let i=0;i<9;i++)UI.storyTap(); UI.storyClose(); ok(g.sread===3&&UI.route.screen==="r2","読み返しても 読んだ数は減らない・きろくへ もどる");
    z.story=8; g.sread=7; UI.storyRead(8); for(let i=0;i<9;i++)UI.storyTap(); const h8=UI.screens.st(); chk("st(第8話)",h8); ok(h8.indexOf("おしまい")>0&&h8.indexOf(UI.esc(D.YOKOZUNA.boss))>0,"第8話は横綱が語り、「おしまい」で終わる");
    const rt=M.normalize(JSON.parse(JSON.stringify(g))); ok(rt.sread===g.sread&&rt.bz.story===8,"物語の進みは 保存→読み直しで同じ");
    UI.ctx=b0; }
  ok(Object.keys(UI.v2ok).every(sn=>UI.screens[sn]),"登録した画面はすべて在る("+Object.keys(UI.v2ok).length+")");
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
  ok((op.match(/class="mm-v2-eggbtn"/g)||[]).length===3&&op.indexOf("横綱")>0,"オープニングは1画面: 物語3行と タマゴ3つ(旧い文言は出ない)");
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
  ok(h.indexOf("あたらしい遊びに なりました")<0,"はじめて遊ぶ人には 引っ越しのお知らせは出ない");
  /* 番付が上がると街の景色がにぎやかになる */
  { const c=UI.ctx(), z=BZ.Z(c), cnt=[], seen=new Set(); for(let i=0;i<6;i++)M.pull(Object.assign(c,{rand:mkRand(40+i)}),true)&&(g.free="");
    [61,55,50,44,32,22,8,1].forEach(pos=>{ z.pos=pos; const sc=UI.scene2(c,g,M.kanban(g)); cnt.push((sc.match(/class="mm-bld/g)||[]).length+(sc.match(/class="mm-walker/g)||[]).length); seen.add(sc); });
    ok(seen.size===8&&cnt.every((v,i)=>i===0||v>=cnt[i-1])&&cnt[7]>cnt[0]+6,"段が上がるほど 街の建物と なかま が増える("+cnt.join("→")+")"); z.pos=61; }
  /* ほかの画面 */
  chk("z2(図鑑)",UI.screens.z2()); ok(text(UI.screens.z2()).indexOf("/105")>0&&(UI.screens.z2().match(/class="mm-dex mm-v2-dex/g)||[]).length===105,"図鑑は105種 × はんこ3つ");
  chk("r2(きろく)",UI.screens.r2()); ok(D.ITEMS.every(it=>UI.screens.r2().indexOf(it.name)>0)&&UI.screens.r2().indexOf("Lvの上限")>0,"きろくに 育成どうぐ12種 と Lvの上限(9科目)");
  chk("n2",UI.screens.n2()); chk("n2d",UI.screens.n2d({id:g.mons[1].i})); chk("t2",UI.screens.t2()); chk("k2m",UI.screens.k2m()); UI.b2Open(); chk("b2",UI.screens.b2()); UI.bzS.noScroll=1; chk("bz",UI.screens.bz()); chk("bzPre",UI.screens.bzPre());
  ["garden","gContest","town","build","zukan","record","gGacha"].forEach(sn=>UI.go(sn)); ok(UI.route.screen==="h2","知らない名前の画面へは行かない(ホームへ寄せる)");
  ok(Object.keys(UI.v2ok).every(sn=>UI.screens[sn]),"登録した画面はすべて在る("+Object.keys(UI.v2ok).length+")");
  UI.ctx=base;

  /* ---------- 自動で遊ばせる(1日60問。配合・けいこ・かけら交換こみ)= つり合わせの目安 ----------
     手ぎわの良い自動プレイなので 到達は上限寄り。数字を直すのは data/kinds.js(KEIKO・LVCAP・GIFT)と data/banzuke.js(ANCHOR)。
     目安: 正答率75% → 30日で幕下あたり・90日で前頭あたり・横綱まで約6か月 / 60% → 止まらず少しずつ上がる / 90% → 3か月より早くは横綱に届かない */
  { const sim=require("./sim-v2.js").run, line=(at,ds)=>ds.map(d=>d+"日 "+at[d].dan+at[d].pos+"枚目 つよさ"+at[d].pw+" Lv"+at[d].lv+" SSR以上"+at[d].ssr+"体 図鑑"+at[d].dex+" 配合"+at[d].breeds+" けいこ値"+at[d].ef+" どうぐ"+at[d].items).join("\n             ");
    const r=sim({seed:42,days:230,marks:[7,30,90,180,230]}), at=r.at;
    console.log("  自動プレイ(正答率75%):\n             "+line(at,[7,30,90,180]),"\n             横綱",r.yoko||"—","日目 / けいこ値が満ちた日",r.efFull||"—","/ 才能40・45・50までの配合",r.t40,r.t45,r.t50);
    ok(at[7].pos>=49&&at[7].pos<=58,"75%・7日: 序二段あたり ("+at[7].dan+at[7].pos+"枚目)");
    ok(at[30].pos>=36&&at[30].pos<=47,"75%・30日: 幕下あたり ("+at[30].dan+at[30].pos+"枚目)");
    ok(at[90].pos>=9&&at[90].pos<=28,"75%・90日: 前頭あたり ("+at[90].dan+at[90].pos+"枚目)");
    ok(at[180].pos<=12,"75%・180日: 三役〜横綱 ("+at[180].dan+at[180].pos+"枚目)");
    ok(r.yoko>=150&&r.yoko<=230,"75%: 横綱まで 約6か月(5〜7か月半) → "+r.yoko+"日目");
    ok(at[30].ssr<=6&&at[90].ssr<=14&&at[30].lg===0&&at[90].lg===0,"SSR以上は 30日で数体・90日で十体ほどまで("+at[30].ssr+"・"+at[90].ssr+"・180日 "+at[180].ssr+")、LGは90日では出ない");
    ok(at[30].pw<at[90].pw&&at[90].pw<at[180].pw&&at[180].pw<1500,"看板のつよさは伸び続け、上限に張りつかない("+at[30].pw+" → "+at[90].pw+" → "+at[180].pw+")");
    ok(at[30].dex>=40&&at[30].dex<=66&&at[180].dex<105,"図鑑: 30日で約半分("+at[30].dex+"種)・180日で "+at[180].dex+"種(105種はうまらない)");
    [30,90,180].forEach(d=>{ const m=at[d].mast, sh=at[d].share, sn=at[d].seen; ok(Math.max(...m)-Math.min(...m)<=6&&Math.max(...sn)-Math.min(...sn)<=6&&Math.max(...sh)<=18,d+"日: 9科目の習熟がそろう("+m.join(",")+"%)・1科目に出題が偏らない(最大"+Math.max(...sh)+"%)"); });
    ok(at[30].lv<=at[30].cap&&at[230].cap===50,"まんべんなく解けば Lvの上限は Lv50 まで開く(30日 Lv"+at[30].lv+"/"+at[30].cap+"・180日 Lv"+at[180].lv+"/"+at[180].cap+")");
    ok(at[30].ef<=80&&at[90].ef<=200&&(!r.efFull||r.efFull>=150),"けいこ値は すぐには満ちない(30日 "+at[30].ef+"・90日 "+at[90].ef+"・満ちた日 "+(r.efFull||"230日より先")+")");
    ok(at[180].items<=80&&at[180].gifts>=40,"育成どうぐは たまりすぎない(180日で もらった"+at[180].gifts+"こ・手もと"+at[180].items+"こ)");
    ok(at[30].breeds<=36&&at[180].tickets>=150,"配合は ほぼ1日1回(30日で"+at[30].breeds+"回・180日で券"+at[180].tickets+"枚)");
    ok(r.t45===0||r.t45>=8,"才能45以上は 配合を重ねてから("+r.t40+"・"+r.t45+"・"+r.t50+"回目)");
    ok(at[180].story>=6&&at[180].stamps>at[30].stamps,"物語は番付といっしょに進む(180日で第"+at[180].story+"話)・はんこは増え続ける("+at[30].stamps+" → "+at[180].stamps+")");
    const js=JSON.stringify(r.ST.mm.g2); ok(js.indexOf("NaN")<0&&js.length<60000,"セーブの大きさ "+js.length+" バイト・NaNなし");
    /* 正答率60%: 止まり切らずに少しずつ上がる */
    const lo=sim({acc:0.6,seed:42,days:180,marks:[30,90,180]});
    console.log("  自動プレイ(正答率60%):\n             "+line(lo.at,[30,90,180]),"\n             番付が動かなかった最長",lo.maxStall,"日");
    ok(lo.at[30].pos>lo.at[90].pos&&lo.at[90].pos>lo.at[180].pos&&lo.at[180].pos<=34&&lo.maxStall<=45,"60%: 止まり切らずに上がる("+lo.at[30].pos+" → "+lo.at[90].pos+" → "+lo.at[180].pos+"枚目・動かなかった最長 "+lo.maxStall+"日)");
    ok(lo.at[30].pw<lo.at[90].pw&&lo.at[90].pw<lo.at[180].pw,"60%: つよさも伸び続ける("+lo.at[30].pw+" → "+lo.at[90].pw+" → "+lo.at[180].pw+")");
    /* 正答率90%: 3か月より早くは横綱に届かない */
    const hi=sim({acc:0.9,seed:42,days:120,marks:[30,90,120]});
    console.log("  自動プレイ(正答率90%):\n             "+line(hi.at,[30,90,120]),"\n             横綱",hi.yoko||"120日より先");
    ok(!hi.yoko||hi.yoko>95,"90%: 3か月より早くは横綱に届かない("+(hi.yoko?hi.yoko+"日目":"120日より先")+"・90日 "+hi.at[90].dan+hi.at[90].pos+"枚目)");
    ok(hi.at[90].pos<at[90].pos+4&&hi.at[30].pos<=at[30].pos+2,"正答率が高いほうが 早く上がる(90日: 90% "+hi.at[90].pos+"枚目・75% "+at[90].pos+"枚目)"); }
}
/* ================= スライス8: 決まり(禁止の言葉・姉妹アプリと違う遊び・使っていないファイルが無い) ================= */
{
  const {banHit,rpgHit}=require("./lib-load.js"); const root=path.join(__dirname,"..");
  const walk=(d,out)=>{ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); if(e.isDirectory()){ if(e.name!=="questions")walk(p,out); } else if(/\.(js|css|html|txt|json)$/.test(e.name)&&e.name!=="save-v1.json")out.push(p); } return out; };
  const files=walk(path.join(root,"js"),[]).concat(walk(path.join(root,"css"),[]),walk(path.join(root,"tools"),[]).filter(p=>!/lib-load\.js$/.test(p)),walk(path.join(root,"docs"),[]),[path.join(root,"index.html"),path.join(root,"sw.js")]);
  const hits=[]; files.forEach(p=>{ const w=banHit(fs.readFileSync(p,"utf8")); if(w)hits.push(path.relative(root,p)+":"+w); });
  ok(!hits.length,"ソースに禁止の言葉が無い("+files.length+"ファイル) "+hits.slice(0,5).join(" "));
  /* 画面に出る文(データの名前・説明・せりふ)に、冒険して戦う遊びの言葉が無い */
  const texts=[].concat(D.kinds.map(k=>k.name),D.TRAITS.map(t=>t.name+t.desc),D.COMBOS.map(t=>t.name+t.desc),D.ITEMS.map(t=>t.name+t.desc),D.natures.map(n=>n.name),D.DAN.map(d=>d.name),
    GD.rivals.map(r=>r.name+r.boss+r.taunt+r.lose+r.win),GD.families.map(f=>f.name),[D.YOKOZUNA.name+D.YOKOZUNA.taunt+D.YOKOZUNA.lose+D.YOKOZUNA.win],D.STORY.eps.map(e=>e.title+e.lines.map(l=>l.t).join("")),[fs.readFileSync(path.join(root,"docs/whatsnew.txt"),"utf8")]);
  const rh=texts.map(t=>rpgHit(t)||banHit(t)).filter(Boolean); ok(!rh.length,"データの文(種類・特性・どうぐ・ライバルのせりふ・物語・お知らせ)に、体力・攻撃・装備・マップ・敵 などの言葉が無い "+rh.join());
  const srcAll=walk(path.join(root,"js","machimon"),[]).map(p=>fs.readFileSync(p,"utf8")).join("\n")+fs.readFileSync(path.join(root,"css/machimon.css"),"utf8")+fs.readFileSync(path.join(root,"index.html"),"utf8");
  ok(!/hp[-_]?bar|damage|attack|equip|dungeon|weapon|skill|enemy|monster/i.test(srcAll.replace(/machimon/gi,"")),"コードと見た目(CSS)にも、体力の棒・ダメージ・攻撃・装備・マップ・敵 の部品が無い");
  /* 読みこむファイルと置いてあるファイルが一致(使わなくなったファイルを残さない) */
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8"), swSrc=fs.readFileSync(path.join(root,"sw.js"),"utf8");
  const scripts=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]), css=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);
  const onDisk=walk(path.join(root,"js"),[]).concat(fs.readdirSync(path.join(root,"js","questions")).map(f=>path.join(root,"js","questions",f))).filter(p=>/\.js$/.test(p)).map(p=>path.relative(root,p)).sort();
  ok(JSON.stringify(scripts.slice().sort())===JSON.stringify(onDisk),"js/ にあるファイルは すべて index.html が読みこむ(あまりなし) "+onDisk.filter(f=>!scripts.includes(f)).concat(scripts.filter(f=>!onDisk.includes(f))).join());
  const cssDisk=fs.readdirSync(path.join(root,"css")).map(f=>"css/"+f).sort(); ok(JSON.stringify(css.slice().sort())===JSON.stringify(cssDisk),"css/ も同じ("+cssDisk.join()+")");
  const assets=[...swSrc.matchAll(/"\.\/([^"]+)"/g)].map(m=>m[1]).filter(Boolean);
  ok(assets.every(a=>fs.existsSync(path.join(root,a)))&&scripts.concat(css).every(f=>assets.includes(f)),"sw.js のキャッシュ一覧: 無いファイルを指さない・読みこむファイルを ぜんぶ持つ "+assets.filter(a=>!fs.existsSync(path.join(root,a))).concat(scripts.concat(css).filter(f=>!assets.includes(f))).join());
  ok(/const C = "machimon-v(\d+)"/.test(swSrc)&&Number(RegExp.$1)>=28,"sw キャッシュ番号 v"+RegExp.$1);
  ok(!/\b(garden|town|incident|boss|hatch|evolve|gacha|tutorial|onboard)\.js/.test(html+swSrc)&&["garden","town","incident","boss","hatch","evolve","gacha","zukan","tutorial","onboard","power","audio"].every(k=>!MM[k]),"1.x の遊びのコード(暦・大会・評議会・街・事件・建設)は 残っていない");
  /* 文字は10px未満にしない */
  const small=(fs.readFileSync(path.join(root,"css/machimon.css"),"utf8")+html).match(/font-size:\s*([0-9.]+)px/g).map(x=>parseFloat(x.split(":")[1])).filter(v=>v<10); ok(!small.length,"CSSに 10px未満の文字が無い "+small.join());
  /* お知らせ(リリースノート) */
  const wn=fs.readFileSync(path.join(root,"docs/whatsnew.txt"),"utf8").trim().split("\n"); ok(wn.length>=3&&wn.length<=5&&wn.every(l=>l.length<=70),"お知らせは3〜5行("+wn.length+"行)");
  /* 全部の画面を、まっさらなセーブで開いて回る(落ちない・禁止の言葉なし) */
  { const ST={q:{},rq:[],mm:null}; win.gameState=ST; const b0=UI.ctx; UI.ctx=()=>MM.state.ctx({ST,rand:module.exports.mkRand(77)}); UI.open(); UI.opPick(0); UI.bzS.noScroll=1; let bad="";
    Object.keys(UI.v2ok).forEach(sn=>{ let h=""; try{ h=UI.screens[sn]({})||""; }catch(e){ h="ERR "+e.message; } const w=banHit(h)||rpgHit(h); if(h.length<200||h.indexOf("undefined")>=0||h.indexOf("NaN")>=0||h.indexOf("ERR")===0||w)bad+=sn+(w?":"+w:"")+" "; });
    ok(!bad,"登録した"+Object.keys(UI.v2ok).length+"画面すべて: まっさらなセーブでも描ける・禁止の言葉なし "+bad); UI.ctx=b0; }
}
if(require.main===module)console.log(process.exitCode?"FAILED":"ALL OK (v2)");
