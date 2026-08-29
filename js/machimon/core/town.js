"use strict";
/* ============================================================
   machimon/core/town.js — 街(エリア解放・建設・配置・生産力)
   ★エリア解放と階層上昇は知識エネルギー(KE)を要求する。KEは学習からしか出ない
     = 「街を発展させたい」が「学習したい」に変換される唯一の接点。
   ★建設操作は2タップで完結する前提の薄いAPI(UIに判断を持たせない)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  function D(){ return MM.DATA; }

  /* ---------- エリア ---------- */
  function areaOpen(c,id){ return !!c.mm.areas[id]; }
  function nextArea(c){
    var as=D().areas.slice().sort(function(a,b){ return a.ord-b.ord; });
    for(var i=0;i<as.length;i++){ if(!areaOpen(c,as[i].id))return as[i]; }
    return null;
  }
  /* 解放。KEが足りなければ false(不足分を知りたい UI は areaCost と res.ke を見る) */
  function openArea(c,id){
    var a=D().areaById[id];
    if(!a||areaOpen(c,id))return false;
    if(!MM.economy.spend(c,"ke",a.ke))return false;
    c.mm.areas[id]=1;
    return true;
  }

  /* ---------- 階層 ---------- */
  function tier(c){ return D().tiers[c.mm.tier]||D().tiers[0]; }
  function nextTier(c){ return D().tiers[c.mm.tier+1]||null; }
  function canTier(c){ var t=nextTier(c); return !!t&&c.mm.res.ke>=t.ke; }
  function upTier(c){
    var t=nextTier(c);
    if(!t||!MM.economy.spend(c,"ke",t.ke))return false;
    c.mm.tier++;
    return true;
  }
  /* その階層で解放済みの新システムか(UIの出し分け用) */
  function has(c,feature){
    var ts=D().tiers;
    for(var i=0;i<=c.mm.tier&&i<ts.length;i++){
      if(ts[i].adds.indexOf(feature)>=0)return true;
    }
    return false;
  }

  /* ---------- スロット・建設 ---------- */
  function slotKey(areaId,i){ return areaId+":"+i; }
  function slotsOf(c,areaId){
    var a=D().areaById[areaId]; if(!a)return [];
    var out=[];
    for(var i=0;i<a.slots;i++){
      var k=slotKey(areaId,i);
      out.push({ key:k, idx:i, area:areaId, data:c.mm.slots[k]||null });
    }
    return out;
  }
  /* そのエリアに建てられる建物(area 一致 or "*") */
  function buildable(c,areaId){
    var a=D().areaById[areaId]; if(!a)return [];
    return D().buildings.filter(function(b){ return b.area===areaId||b.area==="*"; });
  }
  function build(c,key,bid){
    var aid=String(key).split(":")[0];
    if(!areaOpen(c,aid))return false;
    if(c.mm.slots[key])return false;
    var b=D().bldById[bid]; if(!b)return false;
    if(b.area!=="*"&&b.area!==aid)return false;
    var cost=MM.economy.bldCost(bid,1);
    if(!MM.economy.spend(c,"g",cost))return false;
    c.mm.slots[key]={ b:bid, lv:1, mon:"", day:c.today, q:totalAnswered(c) };
    return true;
  }
  function upgrade(c,key){
    var s=c.mm.slots[key]; if(!s)return false;
    if(!has(c,"upgrade"))return false;                 /* 階層「商店街」以降 */
    if(s.lv>=D().BLD_LV_MAX)return false;
    var cost=MM.economy.bldCost(s.b,s.lv+1);
    if(!MM.economy.spend(c,"g",cost))return false;
    s.lv++;
    return true;
  }
  /* 建物には「建った日」と「そのとき解いた累計問題数」が刻まれる(努力の可視化) */
  function totalAnswered(c){
    var n=0,q=c.ST.q||{};
    for(var k in q)n+=((q[k].c||0)+(q[k].w||0));
    return n;
  }

  /* ---------- マチモンの配置 ---------- */
  function place(c,uid,key){
    var m=c.mm.mons[uid], s=c.mm.slots[key];
    if(!m||!s)return false;
    if(!has(c,"place"))return false;                   /* 階層「町」以降 */
    /* 既にいる子を外す */
    for(var k in c.mm.slots){ if(c.mm.slots[k].mon===uid)c.mm.slots[k].mon=""; }
    if(s.mon&&c.mm.mons[s.mon])c.mm.mons[s.mon].place="";
    s.mon=uid; m.place=key;
    return true;
  }
  function unplace(c,uid){
    var m=c.mm.mons[uid]; if(!m)return false;
    for(var k in c.mm.slots){ if(c.mm.slots[k].mon===uid)c.mm.slots[k].mon=""; }
    m.place="";
    return true;
  }
  /* 配置適性: 種族 fit に建物の slotType が含まれるか */
  function fits(sp,bld){ return !!sp&&!!bld&&sp.fit.indexOf(bld.slotType)>=0; }

  /* ---------- 生産力 ---------- */
  /* 1体ぶんの生産力: 基礎 × 段階 × Lv補正 ×(科目一致1.5)×(適性1.2)×(仲bond) */
  function monProd(c,uid){
    var m=c.mm.mons[uid]; if(!m)return 0;
    var sp=D().speciesById[m.sp]; if(!sp)return 0;
    var p=sp.prod*(1+(m.lv-1)*0.02);
    var key=m.place, s=key?c.mm.slots[key]:null;
    if(s){
      var b=D().bldById[s.b], a=D().areaById[String(key).split(":")[0]];
      if(a&&(sp.sub===a.sub))p*=1.5;                  /* 科目一致 */
      if(fits(sp,b))p*=1.2;                           /* 配置適性 */
      p*=(1+bond(c,key)*0.05);                        /* 同じエリアの仲 */
    }
    return p;
  }
  /* 同エリアに配置されている他のマチモン数(上限3=+15%) */
  function bond(c,key){
    var aid=String(key).split(":")[0],n=0;
    for(var k in c.mm.slots){
      if(k===key)continue;
      if(String(k).split(":")[0]!==aid)continue;
      if(c.mm.slots[k].mon)n++;
    }
    return Math.min(3,n);
  }
  function production(c){
    var p=0,D2=D();
    for(var k in c.mm.slots){
      var s=c.mm.slots[k],b=D2.bldById[s.b];
      if(b)p+=b.prod*s.lv;
      if(s.mon)p+=monProd(c,s.mon);
    }
    return Math.round(p*10)/10;
  }
  /* 事件発生率ボーナス(科目別) */
  function incidentBonus(c){
    var out={},D2=D();
    for(var k in c.mm.slots){
      var s=c.mm.slots[k],b=D2.bldById[s.b];
      if(!b||!b.fx||!b.fx.incident)continue;
      var a=D2.areaById[String(k).split(":")[0]];
      if(!a)continue;
      out[a.sub]=(out[a.sub]||0)+b.fx.incident*s.lv;
    }
    return out;
  }
  function bldCount(c){ var n=0; for(var k in c.mm.slots)n++; return n; }

  MM.town={
    areaOpen:areaOpen, nextArea:nextArea, openArea:openArea,
    tier:tier, nextTier:nextTier, canTier:canTier, upTier:upTier, has:has,
    slotKey:slotKey, slotsOf:slotsOf, buildable:buildable, build:build, upgrade:upgrade,
    place:place, unplace:unplace, fits:fits,
    monProd:monProd, bond:bond, production:production, incidentBonus:incidentBonus,
    bldCount:bldCount, totalAnswered:totalAnswered
  };
})();
