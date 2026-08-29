"use strict";
/* ============================================================
   machimon/core/economy.js — 報酬・放置収益・コスト
   ★経済の3原則(docs/machimon/04-economy.md)
     ①知識エネルギー(KE)は「学習の質」からしか生まれない。放置・孵化・課金からは1も出ない
     ②放置収益は マチG と 進化素材 のみ。しかも倉庫容量が学習量に連動する
     ③同日周回・既習得連打は報酬倍率で無価値化される(倍率は core/learn.js が算出)
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  var G_BASE=40, XP_BASE=10;
  var MAT_CHANCE=0.10, MAT_CAP=0.35;
  var GAUGE_NEED=10;                 /* マチタマゲージ(倍率の累計がこれに達すると卵1個) */
  var IDLE_MAX_H=8;                  /* 放置で貯まる上限時間 */
  var CAP_BASE=200, CAP_PER_EFF=20, CAP_MAX=20000;
  var XP_PER_LV=200;                 /* 街Lvに必要な知識XP(Lvごとに +200) */

  /* KE の産出は「この関数だけ」。他の経路からは絶対に増やさない(テストで機械検証) */
  function keFor(rw,ctxSt){
    if(!rw.ok)return 0;                       /* 誤答は0 */
    if(rw.fluke)return 0;                     /* まぐれ(2秒未満)は0 */
    if(rw.timing>=2.00)return 8;              /* 沼問題の克服 / 大幅に遅れた復習 */
    if(rw.timing>=1.60)return 3;              /* 期限到来の復習 */
    if(rw.timing>=1.30)return 2;              /* 未学習の初正解 */
    return 0;                                 /* 通常正解・既習得の連打では出ない */
  }

  /* 1回答ぶんの付与。rw は MM.learn.reward/commit の戻り値 */
  function grant(rw,c){
    var mult=rw.mult;
    var gain={g:0,xp:0,ke:0,mat:0,tama:0,lvUp:0};
    gain.g=Math.round(G_BASE*rw.difficulty*mult*coinBonus(c));
    gain.xp=Math.round(XP_BASE*mult);
    gain.ke=keFor(rw,c);
    if(rw.ok&&c.rand()<Math.min(MAT_CAP,MAT_CHANCE*mult))gain.mat=1;
    if(rw.ok&&!rw.fluke){
      c.mm.gauge+=mult;
      while(c.mm.gauge>=GAUGE_NEED){ c.mm.gauge-=GAUGE_NEED; gain.tama++; }
    }
    apply(gain,c);
    return gain;
  }

  function apply(gain,c){
    var r=c.mm.res;
    r.g+=gain.g||0; r.xp+=gain.xp||0; r.ke+=gain.ke||0; r.mat+=gain.mat||0; r.tama+=gain.tama||0;
    /* 街Lv: 知識XPの累計で上がる(放置では1も増えない) */
    var need=lvNeed(c.mm.lv);
    while(r.xp>=need&&c.mm.lv<999){ r.xp-=need; c.mm.lv++; gain.lvUp=(gain.lvUp||0)+1; need=lvNeed(c.mm.lv); }
    return gain;
  }
  function lvNeed(lv){ return XP_PER_LV+(lv-1)*100; }

  /* 建物のコイン増加率(建物 fx.coin の合計) */
  function coinBonus(c){
    var b=1,D=MM.DATA;
    for(var k in c.mm.slots){
      var s=c.mm.slots[k],d=D.bldById[s.b];
      if(d&&d.fx&&d.fx.coin)b+=d.fx.coin*s.lv;
    }
    return b;
  }

  /* ---------- 放置収益 ---------- */
  /* 倉庫容量は「直近7日の有効回答数」に連動する。学べば倉庫が育つ。 */
  function cap(c){
    var eff=0,w=c.mm.w7||[];
    for(var i=0;i<w.length;i++)eff+=w[i]||0;
    eff+=c.mm.day.eff||0;
    return Math.min(CAP_MAX,CAP_BASE+CAP_PER_EFF*eff);
  }
  /* 毎時の生産力(建物 + 配置マチモン) */
  function production(c){
    return (MM.town&&MM.town.production)?MM.town.production(c):0;
  }
  /* 放置ぶんの回収。★マチG と 進化素材 のみ。KE・知識XPは絶対に出さない */
  function idle(c){
    var last=c.mm.idle.t||0;
    if(!last){ c.mm.idle.t=c.now; return {g:0,mat:0,hours:0,capped:false}; }
    var h=Math.max(0,(c.now-last)/3600000);
    var used=Math.min(h,IDLE_MAX_H);
    var p=production(c);
    var raw=Math.floor(p*used);
    var lim=cap(c);
    var g=Math.min(raw,lim);
    var mat=Math.floor(used/4);           /* 4時間ごとに素材1 */
    c.mm.res.g+=g; c.mm.res.mat+=mat;
    c.mm.idle.t=c.now;
    return {g:g,mat:mat,hours:Math.round(used*10)/10,capped:raw>lim,cap:lim,prod:p};
  }

  /* ---------- コスト ---------- */
  function bldCost(bid,lv){
    var d=MM.DATA.bldById[bid]; if(!d)return Infinity;
    return Math.round(d.cost*Math.pow(MM.DATA.COST_GROWTH,(lv||1)-1));
  }
  function areaCost(areaId){
    var a=MM.DATA.areaById[areaId]; return a?a.ke:Infinity;
  }
  function tierCost(idx){
    var t=MM.DATA.tiers[idx]; return t?t.ke:Infinity;
  }
  function spend(c,kind,n){
    var r=c.mm.res;
    if((r[kind]||0)<n)return false;
    r[kind]-=n; return true;
  }

  MM.economy={
    G_BASE:G_BASE, XP_BASE:XP_BASE, GAUGE_NEED:GAUGE_NEED, IDLE_MAX_H:IDLE_MAX_H,
    CAP_BASE:CAP_BASE, CAP_PER_EFF:CAP_PER_EFF, CAP_MAX:CAP_MAX,
    keFor:keFor, grant:grant, apply:apply, lvNeed:lvNeed, coinBonus:coinBonus,
    cap:cap, production:production, idle:idle,
    bldCost:bldCost, areaCost:areaCost, tierCost:tierCost, spend:spend
  };
})();
