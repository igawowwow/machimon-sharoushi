"use strict";
/* ============================================================
   machimon/core/garden.js — タマゴ配合 × マチモン街 × 大会(ウイニングポスト式の配合シミュレーション)
   ★時間は「正解10問 = 1週」でしか進まない。ボタンで週を送る仕組みは無い
     = 解けば解くほど季節が巡り、マチモンが育ち、大会が開かれ、ライバルの街も世代交代する。
   ★コインはクイズ(と街の放置生産)からしか来ない。おとなになったマチモンの「稼ぎ」は正解のコインを増やすだけ。
   ★配合理論(爆発力): ニックス / 隠しニックス / 異系の活力 / 同系の固定 / インブリード /
     季節の相性 / 系統の勢い / 得意の重ね。子の素質 = 0.94×両親平均 + 3 + 爆発力×0.6 + ばらつき。
     平均へ戻る力があるので、理論を使わないと代を重ねても強くならない(=配合を考える意味)。
   ★セーブは c.mm.gd の1キー。乱数は c.rand(テストで固定できる)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  function GD(){ return MM.DATA.garden; }
  function obj(v){ return (v&&typeof v==="object"&&!Array.isArray(v))?v:null; }
  function num(v,d,lo,hi){ v=Number(v); if(!isFinite(v))v=d; return Math.max(lo,Math.min(hi,v)); }
  function int(v,d,lo,hi){ return Math.round(num(v,d,lo,hi)); }
  function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
  var KEYS=["h","m","o","j","s"];

  /* ---------- 乱数 ---------- */
  function gauss(r){ var u=0,v=0; while(u===0)u=r(); v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
  function seeded(seed){ var x=Math.abs(Math.floor(seed))%2147483647; if(x<=0)x+=2147483646; return function(){ x=x*16807%2147483647; return (x-1)/2147483646; }; }
  function pick(a,r){ return a[Math.floor(r()*a.length)]; }

  /* ---------- セーブ ---------- */
  function defaults(){
    return { v:1, on:0, y:1, w:1, qc:0, lock:0, fame:0, nid:1, seeds:[], plots:[], fac:{plot:0,water:0,green:0,lab:0,seedbox:0},
             mb:[], rp:[], lines:[], hn:[], hnf:{}, pity:0, pulls:0, breeds:0, water:0,
             done:{}, used:{}, rec:{}, hall:[], awards:[], titles:{}, rv:{}, yr:{pl:{},own:{},mbp:{},lp:{}}, lastYr:{lp:{}},
             total:{run:0,win:0,g1:0,gr:0,pz:0,cats:{}}, ev:[], rank:0, famSeen:{}, pend:[],
             ent:{w:0,n:0}, daily:{d:"",p:{},got:{},all:0}, streak:{d:"",n:0,claimed:""}, shF:{}, medal:0, statue:0, free:"", council:[], trSeen:{}, drops:0, shiny:0 };
  }
  function normPlant(p){
    p=obj(p); if(!p)return null;
    var o={ i:String(p.i||"").slice(0,12), n:String(p.n||"").slice(0,20), f:int(p.f,0,0,8), l:String(p.l||"L00").slice(0,12),
            t:int(p.t,1,0,2), se:int(p.se,0,0,3), c:int(p.c,0,0,5),
            a:Array.isArray(p.a)?p.a.slice(0,6).map(function(x){ return String(x||"").slice(0,12); }):[],
            r:{ w:0,g1:0,gr:0,pz:0,run:0 } };
    for(var i=0;i<KEYS.length;i++)o[KEYS[i]]=int(p[KEYS[i]],30,1,100);
    var r=obj(p.r)||{}; for(var k in o.r)o.r[k]=int(r[k],0,0,1e12);
    if(p.g!=null)o.g=num(p.g,0,0,1e6);
    if(p.bw!=null)o.bw=int(p.bw,0,0,1e7);
    if(p.dead)o.dead=1;
    if(p.mon)o.mon=String(p.mon).slice(0,12);
    if(p.bk!=null)o.bk=int(p.bk,0,0,1e7);
    if(p.cw!=null)o.cw=int(p.cw,0,0,1e7);
    if(p.own)o.own=1;
    if(p.fee!=null)o.fee=int(p.fee,0,0,1e7);
    if(p.ow)o.ow=String(p.ow).slice(0,12);
    if(p.life!=null)o.life=int(p.life,0,0,999);
    if(p.mut)o.mut=1;
    if(p.yb!=null)o.yb=int(p.yb,0,0,9999);
    if(p.tr&&GD().traitById[p.tr])o.tr=p.tr;
    if(p.sh)o.sh=1;
    return o;
  }
  function normalize(raw){
    var s=obj(raw)||{}, o=defaults();
    o.on=s.on?1:0; o.y=int(s.y,1,1,9999); o.w=int(s.w,1,1,48); o.qc=int(s.qc,0,0,999); o.lock=0;
    o.fame=int(s.fame,0,0,1e9); o.nid=int(s.nid,1,1,1e9); o.pity=int(s.pity,0,0,999); o.pulls=int(s.pulls,0,0,1e9);
    o.breeds=int(s.breeds,0,0,1e9); o.water=int(s.water,0,0,1e9); o.rank=int(s.rank,0,0,99);
    var f=obj(s.fac)||{}; for(var k in o.fac)o.fac[k]=int(f[k],0,0,GD().FACILITY[k].max);
    o.seeds=(Array.isArray(s.seeds)?s.seeds:[]).map(normPlant).filter(Boolean).slice(0,200);
    var np=plotCount(o);
    var sp=Array.isArray(s.plots)?s.plots:[];
    for(var i=0;i<np;i++)o.plots.push(sp[i]?normPlant(sp[i]):null);
    o.mb=(Array.isArray(s.mb)?s.mb:[]).map(normPlant).filter(Boolean).slice(0,400);
    o.rp=(Array.isArray(s.rp)?s.rp:[]).map(normPlant).filter(Boolean).slice(0,400);
    o.lines=(Array.isArray(s.lines)?s.lines:[]).filter(obj).slice(0,200).map(function(x){ return {id:String(x.id).slice(0,12),f:int(x.f,0,0,8),name:String(x.name||"").slice(0,24),spec:KEYS.indexOf(x.spec)>=0?x.spec:"h",own:x.own?1:0,y:int(x.y,1,1,9999),from:String(x.from||"").slice(0,12)}; });
    o.hn=(Array.isArray(s.hn)?s.hn:[]).map(String).slice(0,60);
    o.hnf=obj(s.hnf)||{};
    o.done=obj(s.done)||{}; o.used=obj(s.used)||{};
    o.rec=obj(s.rec)||{}; o.titles=obj(s.titles)||{}; o.rv=obj(s.rv)||{}; o.famSeen=obj(s.famSeen)||{};
    o.hall=Array.isArray(s.hall)?s.hall.slice(-100):[];
    o.awards=Array.isArray(s.awards)?s.awards.slice(-120):[];
    var yr=obj(s.yr)||{}; o.yr={pl:obj(yr.pl)||{},own:obj(yr.own)||{},mbp:obj(yr.mbp)||{},lp:obj(yr.lp)||{}};
    var ly=obj(s.lastYr)||{}; o.lastYr={lp:obj(ly.lp)||{}};
    var t=obj(s.total)||{}; o.total={run:int(t.run,0,0,1e9),win:int(t.win,0,0,1e9),g1:int(t.g1,0,0,1e9),gr:int(t.gr,0,0,1e9),pz:int(t.pz,0,0,1e13),cats:obj(t.cats)||{}};
    o.ev=Array.isArray(s.ev)?s.ev.slice(-30):[];
    o.pend=Array.isArray(s.pend)?s.pend.filter(obj).slice(-6):[];
    var dl=obj(s.daily)||{}; o.daily={d:typeof dl.d==="string"?dl.d:"",p:obj(dl.p)||{},got:obj(dl.got)||{},all:dl.all?1:0};
    var sk=obj(s.streak)||{}; o.streak={d:typeof sk.d==="string"?sk.d:"",n:int(sk.n,0,0,1e6),claimed:typeof sk.claimed==="string"?sk.claimed:""}; o.shF=obj(s.shF)||{};
    var en=obj(s.ent)||{}; o.ent={w:int(en.w,0,0,1e7),n:int(en.n,0,0,99)};
    o.medal=int(s.medal,0,0,1e6); o.statue=int(s.statue,0,0,GD().STATUE_MAX); o.free=typeof s.free==="string"?s.free.slice(0,12):"";
    o.council=Array.isArray(s.council)?s.council.slice(-40):[]; o.trSeen=obj(s.trSeen)||{}; o.drops=int(s.drops,0,0,1e9); o.shiny=int(s.shiny,0,0,1e9);
    return o;
  }
  var seen=(typeof WeakSet==="function")?new WeakSet():null;
  function W(c){
    var mm=c.mm;
    if(!mm.gd||!(seen&&seen.has(mm.gd))){ mm.gd=normalize(mm.gd); if(seen)seen.add(mm.gd); }
    var g=mm.gd;
    if(!g.on)init(c,g);
    var np=plotCount(g); while(g.plots.length<np)g.plots.push(null);
    return g;
  }
  function plotCount(g){ var F=GD().FACILITY.plot; return F.base+F.per*(g.fac.plot||0); }
  function seedCap(g){ var F=GD().FACILITY.seedbox; return F.base+F.per*(g.fac.seedbox||0); }

  /* ---------- 初期化(名マチモン・ライバルの街・隠しニックス・最初のタマゴ) ---------- */
  function init(c,g){
    var r=c.rand; g.on=1;
    g.mb=GD().meiboku.map(function(x,i){ return mbFrom(x,i,r); });
    /* 隠しニックス: 異なる子系統のペアを乱数で選ぶ(セーブごとに違う=自分で見つける楽しみ) */
    var L=GD().lines.map(function(l){ return l.id; }), hn={};
    for(var t=0;t<200&&Object.keys(hn).length<GD().HIDDEN_NICKS;t++){ var a=pick(L,r),b=pick(L,r); if(a!==b)hn[pairKey(a,b)]=1; }
    g.hn=Object.keys(hn);
    /* ライバルの街: 各ライバルに5株(成長段階はばらばら) */
    GD().rivals.forEach(function(rv){ for(var k=0;k<5;k++)g.rp.push(rivalPlant(c,g,rv,-Math.floor(r()*20))); });
    /* 最初のタマゴ3つ(N〜R)。最初の1つは成長の速いクローバー=すぐおとなになる体験 */
    g.seeds.push(genSeed(c,g,{rar:1,fam:3,spec:"s"}));
    g.seeds.push(genSeed(c,g,{rar:0,fam:0}));
    g.seeds.push(genSeed(c,g,{rar:0,fam:6}));
    ev(g,"🐣","マチモン育成がはじまった！ タマゴをかえして、クイズに正解して育てよう");
  }
  function mbFrom(x,i,r){
    var line=lineByIdStatic(x[1]), q=x[2], p={ i:"M"+i, n:x[0], f:line.f, l:line.id, t:Math.floor(r()*3), se:Math.floor(r()*4), c:Math.floor(r()*6), a:[], r:{w:0,g1:0,gr:0,pz:0,run:0} };
    KEYS.forEach(function(k){ p[k]=clamp(Math.round(q-8+r()*14+(k===line.spec?10:0)),20,98); });
    p.r.g1=Math.max(0,Math.round((q-65)/4)); p.r.gr=p.r.g1+Math.round(r()*3); p.r.w=p.r.gr+2+Math.round(r()*4);
    p.fee=feeOf(p); p.yb=1;
    return normPlant(p);
  }
  function lineByIdStatic(id){ var L=GD().lines; for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i]; return L[0]; }
  function lineById(g,id){ for(var i=0;i<g.lines.length;i++)if(g.lines[i].id===id)return g.lines[i]; return lineByIdStatic(id); }
  function allLines(g){ return GD().lines.concat(g.lines); }
  function pairKey(a,b){ return a<b?a+"|"+b:b+"|"+a; }

  /* ---------- 暦 ---------- */
  function aw(g){ return (g.y-1)*GD().YEAR_WEEKS+g.w; }
  function season(w){ return Math.floor((w-1)/12); }
  function cal(c){
    var g=W(c), mi=Math.ceil(g.w/4), month=((mi+2)%12)+1, wk=((g.w-1)%4)+1, se=season(g.w);
    return { y:g.y, w:g.w, month:month, wk:wk, season:se, label:"第"+g.y+"年 "+month+"月"+wk+"週", sIcon:GD().SEASON_ICON[se], sName:GD().SEASONS[se],
             qc:g.qc, need:GD().WEEK_NEED };
  }

  /* ---------- 名前・レアリティ ---------- */
  function sum(p){ var s=0; for(var i=0;i<KEYS.length;i++)s+=p[KEYS[i]]||0; return s; }
  function rarity(p){ var R=GD().RARITY, s=sum(p), out=0; for(var i=0;i<R.length;i++)if(s>=R[i].min)out=i; return out; }
  function rarInfo(p){ return GD().RARITY[rarity(p)]; }
  function genName(r){ return pick(GD().NAME_A,r)+pick(GD().NAME_B,r); }
  function grade(v){ return v>=95?"SS":v>=85?"S":v>=75?"A":v>=62?"B":v>=48?"C":v>=35?"D":"E"; }

  /* ---------- タマゴを作る ---------- */
  /* o: {rar|band, fam, line, spec, parents:[A,B]} */
  function genSeed(c,g,o){
    var r=c.rand, GA=GD().GACHA;
    var fam=(o.fam!=null)?o.fam:Math.floor(r()*9);
    var lines=allLines(g).filter(function(l){ return l.f===fam; });
    var line=o.line?lineById(g,o.line):pick(lines,r);
    var band=o.band||GA.band[o.rar||0];
    var target=band[0]+Math.floor(r()*(band[1]-band[0]+1));
    var spec=o.spec||line.spec, w={}, tot=0;
    KEYS.forEach(function(k){ w[k]=0.6+r()*0.8+(k===spec?0.7:0)+(k===GD().families[fam].spec?0.3:0); tot+=w[k]; });
    var p={ i:"s"+(g.nid++), n:genName(r), f:fam, l:line.id, t:Math.floor(r()*3), se:Math.floor(r()*4), c:Math.floor(r()*6), a:[], r:{w:0,g1:0,gr:0,pz:0,run:0} };
    KEYS.forEach(function(k){ p[k]=clamp(Math.round(target*w[k]/tot),1,100); });
    /* 合計を目標へ寄せる(上限100で溢れた分を他へ) */
    for(var guard=0;guard<30&&sum(p)!==target;guard++){
      var d=target-sum(p), k=pick(KEYS,r); p[k]=clamp(p[k]+(d>0?1:-1)*Math.min(Math.abs(d),3),1,100);
    }
    /* 血統: その系統の名マチモンを父に、別の名マチモンを母に(=ガチャのタマゴにも祖先がいる→インブリードが組める) */
    var sires=g.mb.filter(function(m){ return m.l===line.id; }); if(!sires.length)sires=g.mb.filter(function(m){ return m.f===fam; });
    var A=sires.length?pick(sires,r):null, B=pick(g.mb,r);
    if(A&&B&&A.i!==B.i)p.a=[A.i,B.i,A.a[0]||"",A.a[1]||"",B.a[0]||"",B.a[1]||""];
    var ri=rarityOfSum(target);
    if(o.trait)p.tr=o.trait; else if(!o.noTrait&&r()<Math.min(0.9,GD().TRAIT_RATE[Math.min(4,ri)]*(o.traitMul||1)))p.tr=rollTrait(r,ri,o.featured);
    if(!o.noTrait&&r()<GD().SHINY)p.sh=1;
    return normPlant(p);
  }

  function rarityOfSum(s){ var R=GD().RARITY,out=0; for(var i=0;i<R.length;i++)if(s>=R[i].min)out=i; return out; }
  /* 特性の抽選: レアな特性ほど出にくい。高レアのタマゴほどレア特性が出やすい */
  function rollTrait(r,ri,featured){
    if(featured&&r()<0.5)return featured;
    var T=GD().TRAITS, w=T.map(function(t){ return Math.pow(0.45,t.rar)*(1+0.5*ri*(t.rar>=2?1:0)); }), tot=0;
    w.forEach(function(x){ tot+=x; }); var x=r()*tot;
    for(var i=0;i<T.length;i++){ x-=w[i]; if(x<=0)return T[i].id; } return T[0].id;
  }
  function has(p,id){ return !!p&&p.tr===id; }
  function seasonTrait(g){ var ids=["shiki","rainbow","gold","phoenix"]; return ids[season(g.w)]; }
  /* ---------- ガチャ ---------- */
  function rollRar(c,g){
    var GA=GD().GACHA; if(g.pity>=GA.pity)return 2;
    var x=c.rand(),acc=0; for(var i=0;i<GA.rate.length;i++){ acc+=GA.rate[i]; if(x<acc)return i; } return 0;
  }
  function pickupFam(g){ return (aw(g)+3)%9; }
  function banner(id){ var B=GD().BANNERS; for(var i=0;i<B.length;i++)if(B[i].id===id)return B[i]; return B[0]; }
  function costOf(bn,n){ return n>=10?bn.cost10:bn.cost1; }
  function wallet(c,g,bn){ return bn.currency==="medal"?g.medal:(c.mm.res.g||0); }
  function canPull(c,n,bid){ var g=W(c), bn=banner(bid||"normal"); return (wallet(c,g,bn)>=costOf(bn,n)||(bn.id==="normal"&&(c.mm.tix||0)>=n))&&g.seeds.length+(bn.id==="council"&&n>=10?1:n)<=seedCap(g); }
  function freeReady(c){ var g=W(c); return g.free!==c.dstr; }
  function pull(c,n,bid,free){
    var g=W(c), bn=banner(bid||"normal"), cost=costOf(bn,n), cnt=(bn.id==="council"&&n>=10)?1:n;
    if(free){ if(!freeReady(c))return {err:"無料ガチャは1日1回"}; bn=banner("normal"); n=1; cnt=1; cost=0; }
    if(g.seeds.length+cnt>seedCap(g))return {err:"タマゴ倉庫がいっぱい("+seedCap(g)+"個)。かえすか手放してね"};
    if(!free){
      if(bn.currency==="medal"){ if(g.medal<cost)return {err:"メダルが足りない(🏅"+cost+")。街評議会で入賞しよう"}; g.medal-=cost; }
      else if(bn.id==="normal"&&(c.mm.tix||0)>=n){ c.mm.tix-=n; cost=0; bn={currency:"tix",id:"normal"}; }
      else if(!MM.economy.spend(c,"g",cost))return {err:"コインが足りない(🪙"+cost+")。クイズに正解して集めよう"};
    } else g.free=c.dstr;
    var out=[], got=false, pf=pickupFam(g);
    for(var i=0;i<cnt;i++){
      var rar, o={};
      if(bn.id==="council"){ rar=(n>=10)?4:(c.rand()<0.15?4:3); if(n>=10)o.traitMul=99; }
      else { rar=rollRar(c,g); if(n>=10&&i===n-1&&!got)rar=Math.max(2,rar); }
      o.rar=rar;
      o.fam=(bn.id==="pickup")?(c.rand()<0.7?pf:Math.floor(c.rand()*9)):((c.rand()<0.3)?pf:Math.floor(c.rand()*9));
      if(bn.id==="season"){ o.traitMul=3; o.featured=seasonTrait(g); }
      var sd=genSeed(c,g,o);
      if(bn.id==="council"&&n>=10&&!sd.tr)sd.tr=rollTrait(c.rand,4);
      if(bn.id!=="council")g.pity=(rar>=2)?0:g.pity+1; if(rar>=2)got=true;
      g.seeds.push(sd); out.push(sd); noteSeed(g,sd);
    }
    g.pulls+=cnt; dailyAdd(c,g,"g",1);
    titleCheck(c,g);
    return {seeds:out,cost:cost,cur:bn.currency};
  }
  function noteSeed(g,sd){ if(sd.tr)g.trSeen[sd.tr]=1; if(sd.sh)g.shiny++; }
  function dropSeed(c,idx){
    var g=W(c), s=g.seeds[idx]; if(!s)return null;
    g.seeds.splice(idx,1); var mat=1+rarity(s); c.mm.res.mat+=mat; return {mat:mat};
  }

  /* ---------- かえす・育つ ---------- */
  function needOf(p){ return Math.round(90*(1.7-(p.s||50)/100)*(has(p,"sprout")?0.6:1)); }        /* おとなになるまでの成長ポイント(成長100で63、成長1で152) */
  function stage(p){
    if(!p)return -1; if(p.dead)return 6;
    if(p.bw!=null)return 5;
    var f=(p.g||0)/needOf(p); return f<0.1?0:f<0.4?1:f<0.7?2:f<1?3:4;
  }
  /* 図鑑: 族の3つの姿を記録(こども=かえした時 / おとな=おとなになった時 / 最終形=全盛期のSSR以上・伝説) */
  function markDex(c,g,p){
    try{ var fam=GD().families[p.f], st=stage(p), dex=c.mm.dex||(c.mm.dex={});
      if(st>=1||p.g!=null)dex[fam.sp[0]]=1;
      if(st>=4)dex[fam.sp[1]]=1;
      if(st>=4&&(rarity(p)>=3||p.mut)&&statusText(g,p)==="全盛期")dex[fam.sp[2]]=1;
      if(rarity(p)>=5)dex[fam.sp[2]]=1;
      if(p.sh)g.shF[p.f]=1;
    }catch(e){}
  }
  var STAGE_NAME=["タマゴ","ヒナ","こども","わかもの","おとな","全盛期","寿命"];
  function plant(c,seedIdx,plotIdx){
    var g=W(c), s=g.seeds[seedIdx]; if(!s||plotIdx<0||plotIdx>=g.plots.length||g.plots[plotIdx])return null;
    g.seeds.splice(seedIdx,1);
    s.g=0; delete s.bw; delete s.dead; s.cw=aw(g);
    g.plots[plotIdx]=s;
    markDex(c,g,s); daily(c,g);
    titleCheck(c,g);
    return s;
  }
  function lifeOf(g,p){ var T=GD().TYPES[p.t]; return T.ramp+T.peak+8+Math.round((p.j||50)/12)+(g.fac.green||0)*3+(has(p,"phoenix")?12:0); }
  function age(g,p){ return (p.bw!=null)?Math.max(0,aw(g)-p.bw):0; }
  /* おとな後の調子(0.55..top)。遅育きは伸びてから、早育きはすぐピーク。寿命の終盤で衰える */
  function phase(g,p){
    if(!p||p.dead)return 0.4;
    if(p.bw==null)return 0.35+0.35*Math.min(1,(p.g||0)/needOf(p));
    var T=GD().TYPES[p.t], a=age(g,p), life=lifeOf(g,p);
    if(a<T.ramp)return 0.8+0.2*(a/T.ramp);
    if(a<T.ramp+T.peak)return T.top;
    var left=life-a; return Math.max(0.55,Math.min(T.top,0.55+0.45*(left/Math.max(1,life-T.ramp-T.peak))));
  }
  function cur(g,p,k){ var m=phase(g,p); if(has(p,"star"))m*=1.06; if(has(p,"cosmos"))m*=1.10; if(k==="o"&&has(p,"giant"))m*=1.15; return Math.round((p[k]||0)*m); }
  function statusText(g,p){
    var st=stage(p); if(st<4)return STAGE_NAME[st]+" "+Math.min(99,Math.floor((p.g||0)/needOf(p)*100))+"%";
    if(st===6)return "寿命をむかえた";
    var T=GD().TYPES[p.t], a=age(g,p);
    if(a<T.ramp)return "おとなになりたて";
    if(a<T.ramp+T.peak)return "全盛期";
    return "衰え(あと"+Math.max(0,lifeOf(g,p)-a)+"週)";
  }

  /* ---------- 1回答ごと(economy.grant から呼ばれる) ---------- */
  function onAnswer(rw,gain,c){
    if(!c||!c.mm)return null;
    var g=W(c), ok=!!rw.ok, sub=-1;
    try{ var q=(typeof G.qById==="function"&&c.lastQid!=null)?G.qById(c.lastQid):null; if(q&&typeof q.s==="number")sub=q.s; }catch(e){}
    var out={grow:0,bloom:[],yield:0,week:null};
    /* 稼ぎ: おとなのマチモンがいると正解のコインが増える */
    if(ok&&gain&&gain.g>0){ var base0=gain.g, yb=yieldBonus(g); if(yb>0){ var add=Math.round(base0*yb); gain.g+=add; out.yield=add; gain.gy=add; }
      if(g.statue>0){ var sb=Math.round(base0*0.1*g.statue); gain.g+=sb; out.statue=sb; } }
    /* 落としタマゴ: 正解するたびに低確率でタマゴが落ちてくる(コンボで上がる) */
    if(ok&&!rw.fluke&&g.seeds.length<seedCap(g)&&c.rand()<GD().DROP*(1+Math.min(2,(c.mm.combo||0)/10))){
      var dr=rollRar(c,g), sd=genSeed(c,g,{rar:dr}); g.seeds.push(sd); noteSeed(g,sd); g.drops++; out.drop=sd;
      ev(g,"🎁","落としタマゴ！ "+sd.n+"("+rarInfo(sd).name+(sd.tr?"・"+GD().traitById[sd.tr].name:"")+(sd.sh?"・色違い":"")+")"); }
    /* 育成 */
    var base=ok?(2+(g.fac.water||0)):0.5, any=false;
    for(var i=0;i<g.plots.length;i++){ var p=g.plots[i]; if(!p||p.dead)continue; any=true;
      if(p.bw!=null)continue;
      var fam=GD().families[p.f], add2=base+(ok&&fam.sub===sub?2:0)+(ok?monBonus(c,p):0)+(ok&&has(p,"sage")?2:0);
      p.g=(p.g||0)+add2; out.grow+=add2;
      if(p.g>=needOf(p)){ p.bw=aw(g); out.bloom.push(p); g.famSeen[p.f]=1; markDex(c,g,p); ev(g,"🎉",p.n+" がおとなになった！("+rarInfo(p).name+")"); }
    }
    if(ok&&any)g.water++;
    /* 時間: 正解10問で1週(大会の最中は週を止める) */
    if(ok){ dailyAdd(c,g,"q",1); }
    if(ok){ g.qc++; if(g.qc>=GD().WEEK_NEED&&!g.lock){ g.qc=0; out.week=tick(c); } }
    if(out.bloom.length||out.week)titleCheck(c,g);
    gain.garden=out;
    return out;
  }
  function yieldBonus(g){
    var s=0; for(var i=0;i<g.plots.length;i++){ var p=g.plots[i]; if(p&&p.bw!=null&&!p.dead)s+=cur(g,p,"m")/2000*(has(p,"gold")?2:1); }
    return Math.min(2,s);
  }
  function monBonus(c,p){
    if(!p.mon)return 0; var m=c.mm.mons[p.mon]; if(!m){ delete p.mon; return 0; }
    var sp=MM.DATA.speciesById[m.sp]||{stage:1,sub:-1};
    return (sp.stage||1)*0.5+(sp.sub===GD().families[p.f].sub?1.5:0)+(sp.sub===-1?0.5:0);
  }
  function setMon(c,plotIdx,uid){
    var g=W(c), p=g.plots[plotIdx]; if(!p)return false;
    for(var i=0;i<g.plots.length;i++){ var q=g.plots[i]; if(q&&q.mon===uid)delete q.mon; }
    if(uid&&c.mm.mons[uid])p.mon=uid; else delete p.mon;
    return true;
  }

  /* ---------- 活気・街ランク ---------- */
  function scenery(c){
    var g=W(c), s=0;
    for(var i=0;i<g.plots.length;i++){ var p=g.plots[i]; if(p&&!p.dead&&p.bw!=null)s+=(cur(g,p,"h")*0.8+cur(g,p,"o")*0.3)*(has(p,"rainbow")?2:1)*(has(p,"cosmos")?1.5:1)*(p.sh?1.5:1); else if(p&&!p.dead)s+=5; }
    s+=g.statue*120;
    s+=Math.min(3000,g.fame);
    s+=Math.min(GD().MB_MAX,g.mb.filter(function(m){ return m.own; }).length)*60;
    s+=Object.keys(g.titles).length*10;
    return Math.round(s);
  }
  function rankOf(c){
    var s=scenery(c), R=GD().RANKS, i=0; while(i+1<R.length&&s>=R[i+1].need)i++;
    return { idx:i, cur:R[i], next:R[i+1]||null, score:s };
  }
  function rankCheck(c,g){
    var rk=rankOf(c); if(rk.idx>g.rank){ var up=rk.idx-g.rank; g.rank=rk.idx; c.mm.tix=(c.mm.tix||0)+GD().RANK_TIX*up; ev(g,rk.cur.icon,"街ランクUP！「"+rk.cur.name+"」 🎫+"+GD().RANK_TIX*up); return rk; }
    return null;
  }

  /* ---------- 配合 ---------- */
  function ref(c,x){
    var g=W(c); if(!x)return null;
    if(x.k==="p"){ var p=g.plots[x.i]; return (p&&p.bw!=null&&!p.dead)?p:null; }
    if(x.k==="m"){ for(var i=0;i<g.mb.length;i++)if(g.mb[i].i===x.i)return g.mb[i]; }
    return null;
  }
  function famNick(a,b){ var N=GD().NICKS; for(var i=0;i<N.length;i++){ if((N[i][0]===a&&N[i][1]===b)||(N[i][0]===b&&N[i][1]===a))return true; } return false; }
  function bestKey(p){ var b="h"; KEYS.forEach(function(k){ if(p[k]>p[b])b=k; }); return b; }
  function hotLines(g){
    var lp=g.lastYr.lp||{}, arr=Object.keys(lp).sort(function(a,b){ return lp[b]-lp[a]; });
    return arr.slice(0,3);
  }
  /* 配合の理論(プレビュー。状態は変えない) */
  function theory(c,A,B){
    var g=W(c), T=GD().THEORY, out=[], burst=0, sig=GD().SIGMA;
    function add(name,pt,note){ out.push({name:name,pt:pt,note:note||""}); burst+=pt; }
    if(A.f!==B.f&&famNick(A.f,B.f))add("ニックス",T.nick,GD().families[A.f].name+"×"+GD().families[B.f].name+" は相性◎");
    var hk=pairKey(A.l,B.l);
    if(A.l!==B.l&&g.hn.indexOf(hk)>=0){ if(g.hnf[hk]===2)add("隠しニックス",T.hiddenNick,"評議会で教わった黄金配合"); else if(g.hnf[hk])add("隠しニックス",T.hiddenNick,"発見済みの黄金配合"); else add("？？？",T.hiddenNick,"何かが起きる予感…"); }
    if(A.f!==B.f)add("異系の活力",T.hetero,"違う族どうしは丈夫に育つ");
    if(A.l===B.l)add("系統の固定",T.lineFix,"同じ系統=ばらつき小・得意が伸びる");
    /* インブリード: 3代以内に同じ祖先 */
    var sa=[A.i].concat(A.a), sb=[B.i].concat(B.a), common=[];
    for(var i=0;i<sa.length;i++){ if(sa[i]&&sb.indexOf(sa[i])>=0&&common.indexOf(sa[i])<0)common.push(sa[i]); }
    if(A.i===B.i)common=[A.i];
    if(common.length){ var n=Math.min(T.inbreedMax,common.length); add("インブリード",T.inbreed*n,common.map(function(id){ return nameOfId(g,id); }).join("・")+" の血を重ねる(丈夫さ↓)"); }
    if(A.se===B.se)add("季節の相性",T.season,GD().SEASONS[A.se]+"どうし");
    var hot=hotLines(g); if(hot.indexOf(A.l)>=0)add("系統の勢い",T.lineHot,lineById(g,A.l).name+" は昨年のリーディング上位");
    var la=lineById(g,A.l); if(bestKey(A)===la.spec&&bestKey(B)===la.spec)add("得意の重ね",T.doubleSpec,"両親とも"+statName(la.spec)+"が得意");
    if(A.l===B.l)sig*=0.6;
    var grd=burst>=12?"S":burst>=8?"A":burst>=5?"B":burst>=2?"C":"D";
    return { list:out, burst:burst, sigma:sig, grade:grd, inbreed:common.length, same:A.i===B.i };
  }
  function statName(k){ var S=GD().STATS; for(var i=0;i<S.length;i++)if(S[i].k===k)return S[i].name; return k; }
  function nameOfId(g,id){
    for(var i=0;i<g.mb.length;i++)if(g.mb[i].i===id)return g.mb[i].n;
    for(var j=0;j<g.plots.length;j++)if(g.plots[j]&&g.plots[j].i===id)return g.plots[j].n;
    for(var k=0;k<g.hall.length;k++)if(g.hall[k].i===id)return g.hall[k].n;
    return "名もなきマチモン";
  }
  function childMean(A,B,k,th,line){
    var m=0.9*((A[k]+B[k])/2)+5+th.burst*0.6+(k===line.spec&&A.l===B.l?3:0);
    if(k==="j"&&th.inbreed)m-=6*th.inbreed;
    return m;
  }
  function breedCost(c,A,B){ var cost=300; if(A.fee)cost+=A.fee; if(B.fee)cost+=B.fee; return cost; }
  function preview(c,ra,rb){
    var g=W(c), A=ref(c,ra), B=ref(c,rb); if(!A||!B)return null;
    if(ra.k==="m"&&rb.k==="m")return {err:"名マチモンどうしは配合できない(どちらかは自分の街のマチモン)"};
    if(A===B)return {err:"同じマチモンどうしは配合できない"};
    var th=theory(c,A,B), line=lineById(g,A.l), st={};
    KEYS.forEach(function(k){ var m=childMean(A,B,k,th,line); st[k]={mean:clamp(Math.round(m),1,100),lo:clamp(Math.round(m-th.sigma*1.3),1,100),hi:clamp(Math.round(m+th.sigma*1.3),1,100)}; });
    /* モンテカルロ(固定シード=同じ組み合わせは同じ予想) */
    var r=seeded(hash(A.i+"x"+B.i)), N=400, cnt=[0,0,0,0,0,0];
    for(var t=0;t<N;t++){ var s=0; KEYS.forEach(function(k){ s+=clamp(Math.round(childMean(A,B,k,th,line)+gauss(r)*th.sigma),1,100); }); var R=GD().RARITY,ri=0; for(var i=0;i<R.length;i++)if(s>=R[i].min)ri=i; cnt[ri]++; }
    var pr=cnt.map(function(x){ return x/N; });
    var used=(ra.k==="p"&&A.bk===aw(g))||(rb.k==="p"&&B.bk===aw(g));
    return { A:A, B:B, th:th, stats:st, prob:pr, pSSR:pr[3]+pr[4]+pr[5], pUR:pr[4]+pr[5], pLG:pr[5], cost:breedCost(c,A,B), line:line, used:used,
             mutation:th.burst>=10, traits:[A.tr,B.tr].filter(Boolean), pNewTrait:GD().TRAIT_NEW+th.burst*0.004, pShiny:GD().SHINY*((A.sh||B.sh)?2:1) };
  }
  function hash(s){ var h=7; for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%2147483647; return h; }
  function breed(c,ra,rb){
    var g=W(c), pv=preview(c,ra,rb); if(!pv)return {err:"親を2つ選んでね"}; if(pv.err)return pv;
    if(pv.used)return {err:"このマチモンは今週もう配合した。来週(正解あと"+(GD().WEEK_NEED-g.qc)+"問)まで待とう"};
    if(g.seeds.length>=seedCap(g))return {err:"タマゴ倉庫がいっぱい"};
    if(!MM.economy.spend(c,"g",pv.cost))return {err:"コインが足りない(🪙"+pv.cost+")"};
    var A=pv.A,B=pv.B,th=pv.th,line=pv.line,r=c.rand, n=1+((r()<0.15+0.1*(g.fac.lab||0)+((has(A,"lucky")||has(B,"lucky"))?0.25:0))?1:0), out=[];
    var hk=pairKey(A.l,B.l), found=false;
    if(A.l!==B.l&&g.hn.indexOf(hk)>=0&&g.hnf[hk]!==1){ g.hnf[hk]=1; found=true; ev(g,"💡","隠しニックス発見！ "+lineById(g,A.l).name+"×"+lineById(g,B.l).name); }
    for(var t=0;t<n&&g.seeds.length<seedCap(g);t++){
      var p={ i:"s"+(g.nid++), n:genName(r), f:A.f, l:A.l, t:(r()<0.6?(r()<0.5?A.t:B.t):Math.floor(r()*3)), se:(r()<0.5?A.se:B.se), c:Math.floor(r()*6),
              a:[A.i,B.i,A.a[0]||"",A.a[1]||"",B.a[0]||"",B.a[1]||""], r:{w:0,g1:0,gr:0,pz:0,run:0} };
      KEYS.forEach(function(k){ p[k]=clamp(Math.round(childMean(A,B,k,th,line)+gauss(r)*th.sigma),1,100); });
      if(th.inbreed&&r()<0.12*th.inbreed)p.j=clamp(p.j-15,1,100);     /* 虚弱のリスク */
      if(pv.mutation&&r()<GD().MUTATION){ var mk=pick(KEYS,r); p[mk]=clamp(p[mk]+15,1,100); p.mut=1; }
      /* 特性の遺伝・芽生え / 色違い */
      if(A.tr&&r()<GD().TRAIT_INHERIT)p.tr=A.tr; else if(B.tr&&r()<GD().TRAIT_INHERIT)p.tr=B.tr;
      else if(r()<GD().TRAIT_NEW+th.burst*0.004)p.tr=rollTrait(r,rarityOfSum(sum(p)));
      if(r()<GD().SHINY*((A.sh||B.sh)?2:1))p.sh=1;
      var s=normPlant(p); g.seeds.push(s); out.push(s); noteSeed(g,s);
    }
    if(ra.k==="p")A.bk=aw(g); if(rb.k==="p")B.bk=aw(g);
    g.breeds++; dailyAdd(c,g,"b",1);
    titleCheck(c,g,{mut:out.some(function(x){ return x.mut; }),lg:out.some(function(x){ return rarity(x)>=5; })});
    return { seeds:out, found:found, cost:pv.cost, th:th };
  }

  /* ---------- ライバルの街 ---------- */
  function rivalPlant(c,g,rv,bornOffset){
    var r=c.rand, lvl=rv.lv+4+Math.min(40,(g.y-1)*2.5);
    var fam=(r()<0.55)?rv.fam:Math.floor(r()*9);
    var band=[Math.round(lvl*5-40),Math.round(lvl*5+30)];
    var p=genSeed(c,g,{band:band,fam:fam});
    p.ow=rv.id; p.bw=aw(g)+(bornOffset||0); p.life=lifeOf(g,p)+Math.floor(r()*6);
    return p;
  }
  function rivalAlive(g){ var A=aw(g); return g.rp.filter(function(p){ return p.bw<=A&&A-p.bw<(p.life||30); }); }
  function catScore(g,p,cat,wk){
    var Wt=GD().CAT_W[cat]||GD().CAT_W.a, s=0;
    for(var k in Wt)s+=cur(g,p,k)*Wt[k];
    if(p.se===season(wk)||has(p,"shiki"))s+=4;
    return s;
  }

  /* ---------- 大会 ---------- */
  function contestsOf(c,week){
    var g=W(c), w=week||g.w, out=[];
    GD().contests.forEach(function(x){ if(x.w===w)out.push(x); });
    out.push({id:"op"+w,w:w,g:4,name:GD().OPEN.name,cat:["h","m","o","j","a"][w%5]});
    out.push({id:"rk"+w,w:w,g:5,name:GD().ROOKIE.name,cat:"a"});
    out.sort(function(a,b){ return a.g-b.g; });
    return out;
  }
  function contestById(c,id){ var g=W(c); var d=GD().contestById[id]; if(d)return d; var cs=contestsOf(c,g.w); for(var i=0;i<cs.length;i++)if(cs[i].id===id)return cs[i]; return null; }
  function doneKey(g,id){ return g.y+":"+id; }
  function eligible(c,p,def){
    var g=W(c); if(!p||p.dead||p.bw==null)return "まだおとなになっていない";
    if(g.used[p.i]===aw(g))return "今週は出場済み";
    if((g.ent&&g.ent.w===aw(g)?g.ent.n:0)>=GD().ENTRY_MAX)return "今週の出場枠("+GD().ENTRY_MAX+")を使い切った";
    if(def.world&&g.fame<GD().WORLD_FAME)return "名声"+GD().WORLD_FAME+"で出場できる";
    if(def.g===5&&p.r.w>0)return "新人戦は未勝利のみ";
    if(def.g===2&&p.r.w<1)return "1勝以上が必要";
    if(def.g===1&&!(p.r.gr>=1||p.r.w>=3))return "重賞1勝か通算3勝が必要";
    if(def.rookie&&p.bw<(g.y-1)*GD().YEAR_WEEKS)return "今年おとなになったマチモンのみ";
    return "";
  }
  /* 出場者(ライバル)を選ぶ: G1=上位、G2/G3=中位、OP=下位。同じ強豪が何度も現れる=因縁が生まれる */
  function field(c,def,excl){
    var g=W(c), alive=rivalAlive(g).filter(function(p){ return g.used[p.i]!==aw(g)&&p.i!==excl; });
    if(def.world)alive=alive.concat([]);
    if(def.g===5)alive=alive.filter(function(p){ return p.r.w===0; });
    var sc=alive.map(function(p){ var rv=GD().rivalById[p.ow]||{lv:60}; return {p:p,s:catScore(g,p,def.cat,def.w)+(def.world&&/^world/.test(p.ow)?6:0)}; });
    sc.sort(function(a,b){ return b.s-a.s; });
    var n=GD().FIELD-1, N=sc.length, from=0;
    if(def.g===1)from=0; else if(def.g===2)from=Math.floor(N*0.08); else if(def.g===3)from=Math.floor(N*0.2); else if(def.g===4)from=Math.floor(N*0.45); else from=0;
    var pool=sc.slice(from,from+n+6), r=seeded(hash(def.id+":"+aw(g)));
    while(pool.length>n)pool.splice(Math.floor(r()*pool.length),1);
    if(def.world){ /* 世界大会には海外勢を必ず入れる */
      var wr=sc.filter(function(x){ return /^world/.test(x.p.ow)&&pool.indexOf(x)<0; }).slice(0,3);
      for(var i=0;i<wr.length&&pool.length;i++)pool[pool.length-1-i]=wr[i];
    }
    return pool.map(function(x){ return x.p; });
  }
  function isDone(c,id){ var g=W(c); return !!g.done[doneKey(g,id)]; }
  function start(c,cid,plotIdx){
    var g=W(c), def=contestById(c,cid), p=g.plots[plotIdx];
    if(!def||!p||isDone(c,cid))return null;
    if(eligible(c,p,def))return null;
    var subs=openSubs(c), fam=GD().families[p.f];
    var nEx=def.g===1?2:(def.g===2?1:0), nAll=GD().GRADE[def.g].n;
    var qids=MM.learn.pick(nAll-nEx,c,subs.indexOf(fam.sub)>=0&&def.g>=3?{sub:fam.sub}:{subs:subs}).concat(pickExam(c,nEx));
    if(!qids.length)return null;
    g.lock=1;
    return { cid:cid, def:def, pi:plotIdx, pid:p.i, qids:qids, n:qids.length, i:0, hits:0, ms:0, rivals:field(c,def,p.i).map(function(x){ return x.i; }) };
  }
  function openSubs(c){ var out=[]; for(var id in c.mm.areas){ var a=MM.DATA.areaById[id]; if(a)out.push(a.sub); } if(!out.length)out=[0]; return out; }
  function step(c,s,ok,ms){
    var qid=s.qids[s.i]; c.lastQid=qid;
    var rw=MM.learn.commit(qid,ok,ms,c), gain=MM.economy.grant(rw,c);
    try{ MM.evolve.gainXp(c,subOf(qid),ok); }catch(e){}
    s.i++; if(ok){ s.hits++; if(ms>0&&ms<8000)s.ms++; }
    return { ok:ok, gain:gain, over:s.i>=s.n, qid:qid };
  }
  function subOf(qid){ var q=(typeof G.qById==="function")?G.qById(qid):null; return q?q.s:0; }
  function rivalOf(g,id){ for(var i=0;i<g.rp.length;i++)if(g.rp[i].i===id)return g.rp[i]; return null; }
  /* 審査: 部門スコア + 季節 + プレゼン(正解率) + ゆらぎ */
  function judge(c,s){
    var g=W(c), def=s.def, p=g.plots[s.pi]; if(!p||p.i!==s.pid)return null;
    var r=c.rand, board=[];
    var pres=(s.hits/Math.max(1,s.n))*12-4+Math.min(2,s.ms*0.5);
    board.push({me:true,p:p,name:p.n,ow:"me",base:catScore(g,p,def.cat,def.w),pres:pres,score:0});
    s.rivals.forEach(function(id){ var q=rivalOf(g,id); if(!q)return; var rv=GD().rivalById[q.ow]||{lv:60};
      board.push({me:false,p:q,name:q.n,ow:q.ow,base:catScore(g,q,def.cat,def.w),pres:(rv.lv-60)/10+gauss(r)*2,score:0}); });
    board.forEach(function(b){ b.score=Math.round((b.base+b.pres+gauss(r)*3.5)*10)/10; });
    board.sort(function(a,b){ return b.score-a.score; });
    return board;
  }
  function finish(c,s){
    var g=W(c), def=s.def, board=judge(c,s); g.lock=0;
    if(!board)return null;
    var pos=0; for(var i=0;i<board.length;i++)if(board[i].me)pos=i+1;
    var res=settle(c,def,board);
    g.done[doneKey(g,def.id)]=1;
    if(!g.ent||g.ent.w!==aw(g))g.ent={w:aw(g),n:0}; g.ent.n++; dailyAdd(c,g,"c",1);
    var me=board[pos-1].p;
    /* ライバルライバルとの勝敗 */
    var owners=[], seenO={};
    board.forEach(function(b,idx){ if(b.me||seenO[b.ow])return; seenO[b.ow]=1; var rv=GD().rivalById[b.ow]; if(!rv)return;
      var beat=pos<idx+1, x=g.rv[b.ow]||(g.rv[b.ow]={w:0,l:0}); if(beat)x.w++; else x.l++;
      owners.push({id:b.ow,name:rv.name,boss:rv.boss,beat:beat,w:x.w,l:x.l,text:beat?rv.lose:rv.win}); });
    /* 週を止めていた間に溜まった正解ぶん、週を進める */
    var wk=null; if(g.qc>=GD().WEEK_NEED){ g.qc=0; wk=tick(c); }
    titleCheck(c,g);
    rankCheck(c,g);
    return { pos:pos, board:board, prize:res.prize, fame:res.fame, tix:res.tix, def:def, plant:me, owners:owners, week:wk, pres:board[pos-1].pres };
  }
  /* 着順を確定して賞金・名声・記録へ(自分の出場もライバルだけの大会も同じ関数) */
  function settle(c,def,board){
    var g=W(c), GR=GD().GRADE[def.g], out={prize:0,fame:0,tix:0};
    for(var i=0;i<board.length;i++){
      var b=board[i], p=b.p, prize=GR.prize[i]||0;
      p.r.run++; p.r.pz+=prize; g.used[p.i]=aw(g);
      if(i===0){ p.r.w++; if(def.g<=3)p.r.gr++; if(def.g===1)p.r.g1++; }
      /* 年度集計 */
      if(prize){
        var pl=g.yr.pl[p.i]||(g.yr.pl[p.i]={n:p.n,ow:b.me?"me":b.ow,f:p.f,pt:0,h:0,m:0,o:0,wd:0,rk:(p.bw>=(g.y-1)*48)?1:0});
        var pt=(i===0?[0,10,5,3,1,1][def.g]:0)+prize/2000; pl.pt+=pt; if(def.cat in pl)pl[def.cat]+=pt; if(def.world)pl.wd+=pt;
        var ow=b.me?"me":b.ow; g.yr.own[ow]=(g.yr.own[ow]||0)+prize;
        g.yr.lp[p.l]=(g.yr.lp[p.l]||0)+prize;
        for(var a=0;a<2;a++){ var anc=p.a[a]; if(anc)g.yr.mbp[anc]=(g.yr.mbp[anc]||0)+prize; }
      }
      if(b.me){
        out.prize=prize; c.mm.res.g+=prize;
        g.total.run++; g.total.pz+=prize;
        if(i===0){ g.total.win++; if(def.g<=3)g.total.gr++; if(def.g===1){ g.total.g1++; g.total.cats[def.cat]=1; out.tix=1+(def.world?2:0); c.mm.tix=(c.mm.tix||0)+out.tix; }
          out.fame=GR.fame*(def.world?2:1); g.fame+=out.fame; }
        else if(i<3){ out.fame=Math.floor(GR.fame/3); g.fame+=out.fame; }
      }
    }
    if(def.g===1){ var wn=board[0]; var arr=g.rec[def.id]||(g.rec[def.id]=[]); arr.push({y:g.y,n:wn.p.n,ow:wn.me?"me":wn.ow,f:wn.p.f}); while(arr.length>30)arr.shift();
      if(wn.me){ var yk="c"+g.y; g.total.cats[yk]=(g.total.cats[yk]||"")+def.cat; } }
    return out;
  }
  /* ライバルだけで行われた大会(自分が出なかった大会)を裏で開催する */
  function simRivalContest(c,def){
    var g=W(c), f=field(c,def,""), r=c.rand;
    if(f.length<3)return;
    var board=f.map(function(p){ var rv=GD().rivalById[p.ow]||{lv:60}; return {me:false,p:p,ow:p.ow,score:catScore(g,p,def.cat,def.w)+(rv.lv-60)/10+gauss(r)*4}; });
    board.sort(function(a,b){ return b.score-a.score; });
    settle(c,def,board);
    g.done[doneKey(g,def.id)]=1;
  }

  /* ---------- 週送り(正解10問ごと) ---------- */
  function tick(c){
    var g=W(c), out={bloom:[],dead:[],year:null,income:0};
    /* 今週まだ開かれていない大会をライバルだけで開催 */
    contestsOf(c,g.w).forEach(function(def){ if(!isDone(c,def.id))simRivalContest(c,def); });
    g.plots.forEach(function(p){ if(p&&!p.dead)markDex(c,g,p); });
    /* 自分のマチモンの寿命 */
    for(var i=0;i<g.plots.length;i++){ var p=g.plots[i]; if(p&&!p.dead&&p.bw!=null&&age(g,p)>=lifeOf(g,p)){ p.dead=1; out.dead.push(p); ev(g,"🪦",p.n+" が寿命をむかえた。名マチモンにするか、見送りにしよう"); } }
    /* ライバルの世代交代: 寿命が来た株は引退(活躍した株は名マチモンへ)→同じライバルが新しい株をかえす */
    var A=aw(g);
    for(var j=g.rp.length-1;j>=0;j--){ var q=g.rp[j]; if(A-q.bw>=(q.life||30)){
        if(q.r.g1>=1||q.r.gr>=3)addMeiboku(c,g,q,false);
        var rv=GD().rivalById[q.ow]; g.rp.splice(j,1); if(rv)g.rp.push(rivalPlant(c,g,rv,-Math.floor(c.rand()*3)-4)); } }
    /* 自分の名マチモンの種付け料収入(人気=質の順位) */
    var mine=g.mb.filter(function(m){ return m.own; });
    if(mine.length){ var inc=0; mine.forEach(function(m){ inc+=Math.round((m.fee||0)*0.25*(1+rarity(m)*0.4)); }); inc=Math.min(inc,3000); if(inc>0){ c.mm.res.g+=inc; out.income=inc; } }
    if(GD().COUNCIL_WEEKS.indexOf(g.w)>=0)out.council=council(c);
    g.w++;
    if(g.w>GD().YEAR_WEEKS){ out.year=yearEnd(c); g.w=1; g.y++; }
    var cs=contestsOf(c,g.w).filter(function(x){ return x.g===1; });
    ev(g,cal(c).sIcon,cal(c).label+(cs.length?" — 今週は "+cs[0].name+"(G1)":"")+(out.income?" / 種付け料 🪙"+out.income:""));
    rankCheck(c,g);
    if(out.council)g.pend.push({t:"council",res:out.council});
    if(out.year)g.pend.push({t:"year",y:g.y-1,awards:out.year});
    while(g.pend.length>6)g.pend.shift();
    return out;
  }

  /* ---------- 街評議会(12週ごと) ----------
     自分の街の評価 = 活気 + おとなの族の多さ + 特性・色違い。24組の街と比べて順位→表彰。 */
  function townScore(c){
    var g=W(c), fams={}, tr=0, sh=0;
    g.plots.forEach(function(p){ if(p&&!p.dead&&p.bw!=null){ fams[p.f]=1; if(p.tr)tr++; if(p.sh)sh++; } });
    var nf=Object.keys(fams).length;
    var gs=gardenScore(c);
    return { total:Math.round(gs+nf*40+tr*30+sh*50+g.statue*60), scenery:gs, fams:nf, traits:tr, shiny:sh, statue:g.statue };
  }
  function gardenScore(c){ var g=W(c), s=0; for(var i=0;i<g.plots.length;i++){ var p=g.plots[i]; if(p&&!p.dead&&p.bw!=null)s+=(cur(g,p,"h")*0.8+cur(g,p,"o")*0.3)*(has(p,"rainbow")?2:1)*(has(p,"cosmos")?1.5:1)*(p.sh?1.5:1); else if(p&&!p.dead)s+=5; } return Math.round(s); }
  function rivalTowns(c){
    var g=W(c), r=seeded(hash("council"+aw(g)));
    return GD().rivals.map(function(rv){ return { id:rv.id, name:rv.name, boss:rv.boss, score:Math.round((rv.lv-45)*28*(1+0.2*Math.min(40,g.y-1))*(0.85+r()*0.3)) }; });
  }
  function council(c){
    var g=W(c), me=townScore(c), all=rivalTowns(c).concat([{id:"me",name:(c.mm.name||"あなたの街"),score:me.total,me:true}]);
    all.sort(function(a,b){ return b.score-a.score; });
    var pos=0; all.forEach(function(x,i){ if(x.me)pos=i+1; });
    var P=GD().COUNCIL_PRIZE, pr=P[P.length-1]; for(var i=0;i<P.length;i++){ if(pos<=P[i].upto){ pr=P[i]; break; } }
    var got={ medal:pr.medal||0, tix:pr.tix||0, seeds:[], statue:0 };
    g.medal+=got.medal; c.mm.tix=(c.mm.tix||0)+got.tix;
    for(var k=0;k<(pr.seed||0);k++){
      var o={rar:pr.seed>=3?3+(c.rand()<0.25?1:0):(pr.seed===2?2+(c.rand()<0.2?1:0):1+(c.rand()<0.2?1:0))};
      if(pr.seed>=3)o.traitMul=99;
      var sd=genSeed(c,g,o); if(pr.seed>=3&&!sd.tr)sd.tr=rollTrait(c.rand,3);
      if(g.seeds.length<seedCap(g)+5){ g.seeds.push(sd); noteSeed(g,sd); got.seeds.push(sd); }
    }
    if(pr.statue&&g.statue<GD().STATUE_MAX){ g.statue++; got.statue=1; }
    /* 銀賞以上: 隠しニックスのヒント(まだ知らない黄金配合を1つ教えてもらえる) */
    if(pos<=6){ var un=g.hn.filter(function(k){ return !g.hnf[k]; }); if(un.length){ var hk=un[Math.floor(c.rand()*un.length)]; g.hnf[hk]=2; var ab=hk.split("|"); got.hint=lineById(g,ab[0]).name+"×"+lineById(g,ab[1]).name; } }
    var res={ y:g.y, w:g.w, season:season(g.w), pos:pos, prize:pr.name, icon:pr.icon, score:me.total, detail:me, board:all.slice(0,12), got:got, n:all.length };
    g.council.push({y:g.y,s:season(g.w),pos:pos,p:pr.name,sc:me.total}); while(g.council.length>40)g.council.shift();
    ev(g,pr.icon,"街評議会 "+GD().SEASONS[season(g.w)]+"の審査: "+pos+"位 "+pr.name+(got.medal?" 🏅+"+got.medal:"")+(got.statue?" 黄金像+1！":""));
    return res;
  }
  function councilPreview(c){ var g=W(c), me=townScore(c), all=rivalTowns(c).concat([{id:"me",name:(c.mm.name||"あなたの街"),score:me.total,me:true}]);
    all.sort(function(a,b){ return b.score-a.score; }); var pos=0; all.forEach(function(x,i){ if(x.me)pos=i+1; });
    var nextW=GD().COUNCIL_WEEKS.filter(function(w){ return w>=g.w; })[0]||48;
    return { me:me, pos:pos, board:all, weeksLeft:nextW-g.w, nextW:nextW }; }
  function shareText(c){
    var g=W(c), rk=rankOf(c), ts=townScore(c), best=null;
    g.plots.forEach(function(p){ if(p&&p.bw!=null&&!p.dead&&(!best||sum(p)>sum(best)))best=p; });
    return "🏙 MACHIMON 社労士 — "+(c.mm.name||"わたしの街")+"\n街ランク: "+rk.cur.icon+rk.cur.name+" / 街の評価 "+ts.total+"点\n"
      +(best?"自慢の株: "+GD().families[best.f].icon+best.n+"("+rarInfo(best).name+(best.tr?"・"+GD().traitById[best.tr].name:"")+")\n":"")
      +"黄金像 "+g.statue+"体 / G1 "+g.total.g1+"勝 / 第"+g.y+"年\n社労士の問題を解くほど街が育つ #マチモン社労士";
  }

  /* ---------- 年度末 ---------- */
  function yearEnd(c){
    var g=W(c), yr=g.yr, out=[], A=GD().AWARDS;
    function top(fn){ var best=null; for(var id in yr.pl){ var v=fn(yr.pl[id]); if(v>0&&(!best||v>best.v))best={id:id,v:v,x:yr.pl[id]}; } return best; }
    function give(def,who,label,isMe){
      var e={y:g.y,id:def.id,name:def.name,who:label,me:isMe?1:0}; g.awards.push(e); out.push(e);
      if(isMe){ c.mm.tix=(c.mm.tix||0)+(def.tix||0); c.mm.res.g+=def.coin||0; g.fame+=5; if(def.id==="best")g.titles.best=g.titles.best||g.y; if(def.id==="lead")g.titles.lead=g.titles.lead||g.y; }
    }
    function ownName(o){ return o==="me"?"あなた":((GD().rivalById[o]||{}).name||o); }
    [["best",function(x){ return x.pt; }],["h",function(x){ return x.h; }],["m",function(x){ return x.m; }],["o",function(x){ return x.o; }],
     ["rookie",function(x){ return x.rk?x.pt:0; }],["world",function(x){ return x.wd; }]].forEach(function(pr){
      var d=A.filter(function(a){ return a.id===pr[0]; })[0], b=top(pr[1]); if(b)give(d,b.x.n,b.x.n+"("+ownName(b.x.ow)+")",b.x.ow==="me"); });
    var lo=null; for(var o in yr.own){ if(!lo||yr.own[o]>yr.own[lo])lo=o; }
    if(lo)give(A.filter(function(a){ return a.id==="lead"; })[0],lo,ownName(lo)+" 🪙"+yr.own[lo],lo==="me");
    var lm=null; for(var m in yr.mbp){ if(!lm||yr.mbp[m]>yr.mbp[lm])lm=m; }
    if(lm){ var mbo=null; for(var i=0;i<g.mb.length;i++)if(g.mb[i].i===lm)mbo=g.mb[i]; if(mbo)give(A.filter(function(a){ return a.id==="breeder"; })[0],lm,mbo.n+(mbo.own?"(自家)":""),!!mbo.own); }
    while(g.awards.length>120)g.awards.shift();
    /* 系統の勢い・系統確立 */
    g.lastYr={lp:yr.lp};
    lineCheck(c,g);
    /* 名マチモンの人気(種付け料)を実績で更新・古い名マチモンの整理 */
    g.mb.forEach(function(x){ x.fee=feeOf(x,yr.mbp[x.i]||0); });
    if(g.mb.length>160){ g.mb.sort(function(a,b){ return (b.own-a.own)||(mbScore(b)-mbScore(a)); }); g.mb=g.mb.slice(0,160); }
    g.yr={pl:{},own:{},mbp:{},lp:{}};
    for(var k in g.used)delete g.used[k];
    for(var d in g.done)if(d.indexOf((g.y)+":")===0)delete g.done[d];
    return out;
  }
  function mbScore(m){ return sum(m)+(m.r.g1||0)*20+(m.r.gr||0)*6; }
  function feeOf(m,pz){ return Math.round(Math.max(100,(sum(m)-200)*8+(m.r.g1||0)*300+(pz||0)/40)/50)*50; }

  /* ---------- 名マチモン ---------- */
  function canMeiboku(p){ return !!p&&p.bw!=null&&(p.r.g1>=1||p.r.gr>=2||rarity(p)>=3); }
  function mbFull(g){ return g.mb.filter(function(m){ return m.own; }).length>=GD().MB_MAX; }
  function addMeiboku(c,g,p,own){
    var m=normPlant(p); delete m.g; delete m.bw; delete m.dead; delete m.mon; delete m.bk; delete m.cw; delete m.life;
    if(own){ m.own=1; delete m.ow; } m.yb=g.y; m.fee=feeOf(m);
    g.mb.push(m);
    return m;
  }
  function toMeiboku(c,plotIdx){
    var g=W(c), p=g.plots[plotIdx]; if(!canMeiboku(p)||mbFull(g))return null;
    var m=addMeiboku(c,g,p,true);
    g.hall.push({i:p.i,n:p.n,f:p.f,l:p.l,r:p.r,y:g.y,rar:rarity(p),mb:1}); while(g.hall.length>100)g.hall.shift();
    g.plots[plotIdx]=null;
    g.titles.meiboku=g.titles.meiboku||g.y; c.mm.tix=(c.mm.tix||0)+0;
    titleCheck(c,g); rankCheck(c,g);
    ev(g,"👑",m.n+" が名マチモンになった！ ほかの街からも種付けを求められる(毎週 種付け料)");
    return m;
  }
  function compost(c,plotIdx){
    var g=W(c), p=g.plots[plotIdx]; if(!p)return null;
    var mat=1+rarity(p)*2+(p.dead?0:0);
    if(p.r.w>0){ g.hall.push({i:p.i,n:p.n,f:p.f,l:p.l,r:p.r,y:g.y,rar:rarity(p)}); while(g.hall.length>100)g.hall.shift(); }
    g.plots[plotIdx]=null; c.mm.res.mat+=mat; return {mat:mat};
  }
  /* 系統確立: 名マチモンの「子(第1親がその名マチモン)」の名マチモンが3本以上 かつ 子孫の重賞勝ちが8以上 */
  function lineCheck(c,g){
    g.mb.forEach(function(m){
      if(allLines(g).some(function(l){ return l.from===m.i; }))return;
      var sons=g.mb.filter(function(x){ return x.a[0]===m.i; });
      if(sons.length<3)return;
      var gr=0; g.mb.concat(g.rp).forEach(function(x){ if(x.a[0]===m.i||x.a[2]===m.i)gr+=x.r.gr||0; });
      if(gr<8)return;
      var id="N"+(g.lines.length+1), ln={id:id,f:m.f,name:m.n+"系",spec:bestKey(m),own:m.own?1:0,y:g.y,from:m.i};
      g.lines.push(ln); m.l=id; sons.forEach(function(s){ s.l=id; });
      ev(g,"🧬","系統確立！ 「"+ln.name+"」が誕生"+(m.own?"(自家の系統！)":""));
      if(m.own)g.titles.line=g.titles.line||g.y;
    });
  }

  /* ---------- 施設 ---------- */
  function facCost(g,k){ var F=GD().FACILITY[k], lv=g.fac[k]||0; return lv>=F.max?null:F.cost[lv+1]; }
  function upgrade(c,k){
    var g=W(c), cost=facCost(g,k); if(cost==null)return {err:"最大レベル"};
    if(!MM.economy.spend(c,"g",cost))return {err:"コインが足りない(🪙"+cost+")"};
    g.fac[k]++; while(g.plots.length<plotCount(g))g.plots.push(null);
    return {lv:g.fac[k],cost:cost};
  }

  /* ---------- 称号 ---------- */
  function titleCheck(c,g,x){
    x=x||{}; var T=g.titles, got=[];
    function t(id,cond){ if(!T[id]&&cond){ T[id]=g.y; got.push(id); } }
    var plants=g.plots.filter(Boolean), maxR=0;
    g.seeds.concat(plants).forEach(function(p){ maxR=Math.max(maxR,rarity(p)); });
    t("plant1",plants.length>0||g.water>0);
    t("bloom1",plants.some(function(p){ return p.bw!=null; })||Object.keys(g.famSeen).length>0);
    t("breed1",g.breeds>=1); t("breed50",g.breeds>=50); t("breed300",g.breeds>=300);
    var nf=Object.keys(g.hnf).filter(function(k){ return g.hnf[k]===1; }).length; t("nick",nf>=1); t("nick5",nf>=5);
    t("sr",maxR>=2); t("ssr",maxR>=3); t("ur",maxR>=4); t("lg",!!x.lg); t("mut",!!x.mut);
    t("win1",g.total.win>=1); t("g3",g.total.gr>=1); t("g1",g.total.g1>=1); t("g1x10",g.total.g1>=10);
    var cats=g.total.cats||{}; t("allcat",["h","m","o","j","a"].every(function(k){ return cats[k]; }));
    var yc=cats["c"+g.y]||""; t("triple",yc.indexOf("h")>=0&&yc.indexOf("m")>=0&&yc.indexOf("o")>=0);
    t("world",Object.keys(g.rec).some(function(id){ var d=GD().contestById[id]; return d&&d.world&&g.rec[id].some(function(e){ return e.ow==="me"; }); }));
    t("fam9",Object.keys(g.famSeen).length>=9);
    t("rank3",g.rank>=3); t("rank6",g.rank>=6); t("rank10",g.rank>=10);
    t("y5",g.y>=5); t("y20",g.y>=20); t("y50",g.y>=50);
    t("q1000",g.water>=1000); t("q10000",g.water>=10000);
    var beatAll=GD().rivals.every(function(r){ return g.rv[r.id]&&g.rv[r.id].w>0; }); t("allriv",beatAll);
    t("nemesis",GD().rivals.some(function(r){ var v=g.rv[r.id]; return v&&v.l>=2&&v.w>=3; }));
    t("trait",Object.keys(g.trSeen).length>=1); t("trait10",Object.keys(g.trSeen).length>=GD().TRAITS.length); t("shiny",g.shiny>=1);
    t("council1",g.council.some(function(x){ return x.pos<=12; })); t("councilG",g.council.some(function(x){ return x.pos===1; })); t("statue5",g.statue>=5);
    t("meiboku",!!T.meiboku); t("best",!!T.best); t("lead",!!T.lead); t("line",!!T.line);
    got.forEach(function(id){ var d=GD().TITLES.filter(function(z){ return z.id===id; })[0]; if(d){ c.mm.tix=(c.mm.tix||0)+(d.tix||0); ev(g,"🎖","称号「"+d.name+"」 🎫+"+d.tix); } });
    return got;
  }

  /* ---------- お知らせ ---------- */
  function ev(g,icon,text){ g.ev.push({i:icon,t:text,y:g.y,w:g.w}); while(g.ev.length>30)g.ev.shift(); }
  function takePend(c){ var g=W(c); return g.pend.length?g.pend.shift():null; }

  /* ---------- 本試験形式(五肢択一・個数・年度別・選択式) ---------- */
  var EXAM=null;
  function examIds(){
    if(EXAM)return EXAM; EXAM=[];
    try{ if(typeof QBY!=="undefined")QBY.forEach(function(q){ if(q&&(q.examFmt||q.nendo||q.sentaku)&&(q.choices||q.passage))EXAM.push(q.id); }); }catch(e){}
    return EXAM;
  }
  function pickExam(c,n,sub){
    var ids=examIds(), m=MM.learn.masteryBySub(c), cand=[];
    for(var i=0;i<ids.length;i++){ var q=G.qById(ids[i]); if(!q)continue; if(typeof sub==="number"&&q.s!==sub)continue; cand.push({id:q.id,p:MM.learn.priority(q,c,{mastery:m})}); }
    cand.sort(function(a,b){ return b.p-a.p; });
    var top=cand.slice(0,Math.max(12,n*3)), out=[];
    while(out.length<n&&top.length){ var k=Math.floor(c.rand()*Math.min(top.length,8)); out.push(top.splice(k,1)[0].id); }
    return out;
  }
  function isExam(q){ return !!(q&&(q.examFmt||q.nendo||q.sentaku)); }
  /* 合格力(目安): ○×の習熟度 と 本試験形式の正答率 を科目ごとに合成。70%を合格ラインの目安にする */
  function passMeter(c){
    var mast=MM.learn.masteryBySub(c), ex={}, ids=examIds();
    for(var i=0;i<ids.length;i++){ var q=G.qById(ids[i]); if(!q)continue; var st=MM.learn.stat(c,q.id); var e=ex[q.s]||(ex[q.s]={c:0,n:0,tot:0}); e.tot++; if((st.c||0)+(st.w||0)>0){ e.n++; if(st.box>=2||(st.c||0)>(st.w||0))e.c++; } }
    var subs=[], sum=0;
    for(var s2=0;s2<9;s2++){ var mm2=mast[s2]||0, e2=ex[s2]||{c:0,n:0,tot:0}, ea=e2.tot?e2.c/e2.tot:0;
      var v=Math.round((e2.tot?(0.6*mm2+0.4*ea):mm2)*100); subs.push({sub:s2,v:v,mast:Math.round(mm2*100),exam:e2.c+"/"+e2.tot}); sum+=v; }
    var avg=Math.round(sum/9), low=subs.reduce(function(a,x){ return x.v<a.v?x:a; },subs[0]);
    return { subs:subs, avg:avg, low:low, line:70 };
  }

  /* ---------- 毎日: デイリーミッション・連続ログイン ---------- */
  function daily(c,g){
    g=g||W(c); var d=c.dstr||"";
    if(g.daily.d!==d){ g.daily={d:d,p:{},got:{},all:0}; }
    return g.daily;
  }
  function dailyAdd(c,g,id,n){ var dl=daily(c,g); dl.p[id]=(dl.p[id]||0)+n; }
  function dailyList(c){
    var g=W(c), dl=daily(c,g);
    return GD().DAILY.map(function(m){ var v=Math.min(m.need,dl.p[m.id]||0); return {id:m.id,name:m.name,icon:m.icon,need:m.need,now:v,done:v>=m.need,got:!!dl.got[m.id],reward:m.reward}; });
  }
  function giveReward(c,g,r){ var out=[]; if(r.g){ c.mm.res.g+=r.g; out.push("🪙"+r.g); } if(r.tix){ c.mm.tix=(c.mm.tix||0)+r.tix; out.push("🎫"+r.tix); } if(r.medal){ g.medal+=r.medal; out.push("🏅"+r.medal); }
    if(r.egg!=null){ var sd=genSeed(c,g,{rar:r.egg,traitMul:r.egg>=3?3:1}); g.seeds.push(sd); noteSeed(g,sd); out.push("🥚"+rarInfo(sd).name); } return out.join(" "); }
  function claimDaily(c,id){
    var g=W(c), dl=daily(c,g), m=dailyList(c).filter(function(x){ return x.id===id; })[0];
    if(!m||!m.done||m.got)return null;
    dl.got[id]=1; var txt=giveReward(c,g,m.reward), all=null;
    if(!dl.all&&dailyList(c).every(function(x){ return x.got; })){ dl.all=1; all=giveReward(c,g,{egg:GD().DAILY_ALL.rar+(c.rand()<0.2?1:0)}); }
    return {text:txt,all:all};
  }
  function streakInfo(c){
    var g=W(c), sk=g.streak, d=c.dstr||"", today=(sk.claimed===d);
    var yd=""; try{ var dt=new Date(d+"T00:00:00"); dt.setDate(dt.getDate()-1); yd=dt.toISOString().slice(0,10); }catch(e){}
    var cont=(sk.d===yd||sk.d===d);
    var n=today?sk.n:(cont?sk.n+1:1);
    return { n:n, day:((n-1)%7)+1, today:today, reward:GD().STREAK[(n-1)%7] };
  }
  function claimStreak(c){
    var g=W(c), info=streakInfo(c); if(info.today)return null;
    g.streak={d:c.dstr||"",n:info.n,claimed:c.dstr||""};
    var r=info.reward.egg!=null?{egg:info.reward.egg}:info.reward;
    return {day:info.day,n:info.n,text:giveReward(c,g,r)};
  }
  /* ---------- タマゴ(🥚)をかえす: 街の事件で手に入る旧タマゴも、ここで遺伝子つきマチモンになる ---------- */
  function hatchTama(c){
    var g=W(c); if((c.mm.res.tama||0)<1)return null;
    if(g.seeds.length>=seedCap(g)+5)return {err:"タマゴ袋がいっぱい"};
    c.mm.res.tama--;
    var rar=rollRar(c,g); g.pity=(rar>=2)?0:g.pity+1;
    var sd=genSeed(c,g,{rar:rar}); noteSeed(g,sd); g.seeds.push(sd);
    var idx=-1; for(var i=0;i<g.plots.length;i++)if(!g.plots[i]){ idx=i; break; }
    if(idx>=0)plant(c,g.seeds.length-1,idx);
    titleCheck(c,g);
    return {seed:sd,placed:idx};
  }
  /* 街の生産: おとなマチモンの「稼ぎ」が毎時の生産に乗る(=マチモンが育つほど街が発展) */
  function prod(c){
    var g; try{ g=W(c); }catch(e){ return 0; }
    var s=0; for(var i=0;i<g.plots.length;i++){ var p=g.plots[i]; if(p&&!p.dead&&p.bw!=null)s+=cur(g,p,"m")/GD().PROD_DIV; }
    return Math.round(s*10)/10;
  }

  /* ---------- 秘書のひとこと ---------- */
  function advice(c){
    var g=W(c), plants=g.plots.filter(function(p){ return p&&!p.dead; }), bloom=plants.filter(function(p){ return p.bw!=null; });
    var empty=g.plots.filter(function(p){ return !p; }).length, dead=g.plots.filter(function(p){ return p&&p.dead; }).length;
    if(!plants.length&&g.seeds.length)return "おうちが空いてるモン！ まずはタマゴをかえそう";
    if(!plants.length&&!g.seeds.length)return (c.mm.res.g>=GD().GACHA.cost1)?"マチモンガチャを回そう！ 🪙"+GD().GACHA.cost1+"で1回だモン":"クイズに正解してコインを集めよう。🪙"+GD().GACHA.cost1+"でタマゴが1つ買えるモン";
    if(dead)return "寿命をむかえたマチモンがあるモン。名マチモンにするか見送って、おうちを空けよう";
    if(empty&&g.seeds.length)return "空いてるおうちが"+empty+"つあるモン。タマゴをかえそう！";
    var cs=contestsOf(c,g.w).filter(function(d){ return !isDone(c,d.id); });
    if(bloom.length&&cs.length){ var gd=cs[0]; return "今週は「"+gd.name+"」("+GD().GRADE[gd.g].label+")があるモン！ おとなになったマチモンを出場しよう"; }
    if(bloom.length>=2&&g.breeds<3)return "おとなになったマチモンどうしで配合できるモン。🧬配合でもっと強いタマゴを作ろう！";
    var grow=plants.filter(function(p){ return p.bw==null; });
    if(grow.length){ var p=grow[0]; return p.n+" はあと "+Math.max(1,Math.ceil((needOf(p)-(p.g||0))/(2+(g.fac.water||0))))+"問くらいでおとなになるモン。💧クイズで育てる！"; }
    return "正解あと"+(GD().WEEK_NEED-g.qc)+"問で次の週だモン";
  }

  MM.garden={ KEYS:KEYS, STAGE_NAME:STAGE_NAME, defaults:defaults, normalize:normalize, W:W, cal:cal, aw:aw, season:season,
    plotCount:plotCount, seedCap:seedCap, rarity:rarity, rarInfo:rarInfo, sum:sum, grade:grade, statName:statName,
    genSeed:genSeed, pull:pull, canPull:canPull, pickupFam:pickupFam, dropSeed:dropSeed,
    plant:plant, stage:stage, needOf:needOf, phase:phase, cur:cur, age:age, lifeOf:lifeOf, statusText:statusText,
    onAnswer:onAnswer, yieldBonus:yieldBonus, setMon:setMon, monBonus:monBonus,
    scenery:scenery, rankOf:rankOf, theory:theory, preview:preview, breed:breed, ref:ref, lineById:lineById, allLines:allLines, nameOfId:nameOfId, famNick:famNick,
    contestsOf:contestsOf, contestById:contestById, eligible:eligible, isDone:isDone, start:start, step:step, finish:finish, rivalAlive:rivalAlive, catScore:catScore,
    tick:tick, yearEnd:yearEnd, canMeiboku:canMeiboku, mbFull:mbFull, gardenScore:gardenScore, toMeiboku:toMeiboku, compost:compost, facCost:facCost, upgrade:upgrade,
    titleCheck:titleCheck, takePend:takePend, examIds:examIds, pickExam:pickExam, isExam:isExam, passMeter:passMeter, dailyList:dailyList, claimDaily:claimDaily, streakInfo:streakInfo, claimStreak:claimStreak, hatchTama:hatchTama, prod:prod, markDex:markDex, council:council, councilPreview:councilPreview, townScore:townScore, shareText:shareText, banner:banner, freeReady:freeReady, has:has, seasonTrait:seasonTrait, rollTrait:rollTrait, advice:advice, openSubs:openSubs, hotLines:hotLines, feeOf:feeOf, mbScore:mbScore };
  /* 旧タマゴの孵化(オンボーディング・事件報酬)を遺伝子つきマチモンへ差し替える */
  if(MM.hatch){ MM.hatch.hatch=function(c){ var r=hatchTama(c); return (r&&r.seed)?{garden:1,name:r.seed.n,rar:rarity(r.seed),rare:rarity(r.seed)>=3}:null; }; }
})();
