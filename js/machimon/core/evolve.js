"use strict";
/* ============================================================
   machimon/core/evolve.js — 進化(学習ゲート)
   ★進化条件は必ず「Lv + その科目の正解数 + 習熟度(+重要進化はKE)」。
     時間でも課金でもレアリティでも進化しない。
   ★「このマチモンを進化させたい」という欲求を「この科目を克服したい」へ変換する装置。
   ★習熟度は既存の単一定義(box>=3 && !ng && c>0)を使う = 一夜漬けでは満たせない。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  function spOf(c,uid){
    var m=c.mm.mons[uid]; if(!m)return null;
    return MM.DATA.speciesById[m.sp]||null;
  }

  /* 進化条件の充足状況を返す(UIは need をそのまま進捗バーにできる) */
  function check(c,uid){
    var m=c.mm.mons[uid], sp=spOf(c,uid);
    if(!m||!sp)return {ok:false,reason:"none"};
    if(!sp.evo)return {ok:false,reason:"max"};
    var e=sp.evo;
    var mast=MM.learn.masteryBySub(c);
    var sub=sp.sub;
    var correct=(sub>=0)?MM.learn.correctBySub(c,sub):totalCorrect(c);
    var mastery=(sub>=0)?(mast[sub]||0):avgMastery(mast);
    var need={
      lv:{now:m.lv,need:e.lv,ok:m.lv>=e.lv},
      correct:{now:correct,need:e.correct,ok:correct>=e.correct},
      mastery:{now:Math.round(mastery*100),need:Math.round((e.mastery||0)*100),ok:mastery>=(e.mastery||0)},
      ke:{now:c.mm.res.ke,need:e.ke||0,ok:c.mm.res.ke>=(e.ke||0)}
    };
    /* 全科目条件(マチオー): 捨て科目を作る攻略を明確に否定する */
    if(typeof e.allSub==="number"){
      var lowest=1,subs=MM.DATA.areas;
      for(var i=0;i<subs.length;i++){ var v=mast[subs[i].sub]||0; if(v<lowest)lowest=v; }
      need.allSub={now:Math.round(lowest*100),need:Math.round(e.allSub*100),ok:lowest>=e.allSub};
    }
    var ok=true;
    for(var k in need){ if(!need[k].ok)ok=false; }
    return { ok:ok, need:need, to:e.to, toName:(MM.DATA.speciesById[e.to]||{}).name||"" };
  }
  function totalCorrect(c){
    var n=0,q=c.ST.q||{};
    for(var k in q)n+=(q[k].c||0);
    return n;
  }
  function avgMastery(mast){
    var s=0,n=0;
    for(var k in mast){ s+=mast[k]; n++; }
    return n?s/n:0;
  }

  /* 進化の実行。条件を1つでも欠いたら実行しない(課金やアイテムでの短絡は用意しない) */
  function evolve(c,uid){
    var r=check(c,uid);
    if(!r.ok)return null;
    var m=c.mm.mons[uid], sp=spOf(c,uid);
    if(sp.evo.ke>0&&!MM.economy.spend(c,"ke",sp.evo.ke))return null;
    var from=sp.name;
    m.sp=r.to;
    return { uid:uid, from:from, to:r.to, toName:r.toName, stage:(MM.DATA.speciesById[r.to]||{}).stage||2 };
  }

  /* 配置中のマチモンは、その科目の問題を解くと経験値を得る */
  function gainXp(c,sub,ok){
    if(!ok)return [];
    var up=[];
    for(var uid in c.mm.mons){
      var m=c.mm.mons[uid], sp=MM.DATA.speciesById[m.sp];
      if(!sp)continue;
      var match=(sp.sub===sub||sp.sub===-1);
      var placed=!!m.place;
      if(!match&&!placed)continue;
      var g=(match?6:2)*(placed?1.5:1);
      m.xp+=Math.round(g);
      var need=lvNeed(m.lv);
      while(m.xp>=need&&m.lv<50){ m.xp-=need; m.lv++; up.push(uid); need=lvNeed(m.lv); }
    }
    return up;
  }
  function lvNeed(lv){ return 30+(lv-1)*20; }

  /* 「あと何問で進化できるか」= 育成画面から学習への最短導線 */
  function nextGoal(c,uid){
    var r=check(c,uid);
    if(!r.need)return null;
    var n=r.need;
    if(!n.correct.ok)return { kind:"correct", left:n.correct.need-n.correct.now, sub:(spOf(c,uid)||{}).sub };
    if(!n.mastery.ok)return { kind:"mastery", left:n.mastery.need-n.mastery.now, sub:(spOf(c,uid)||{}).sub };
    if(n.allSub&&!n.allSub.ok)return { kind:"allSub", left:n.allSub.need-n.allSub.now, sub:-1 };
    if(!n.lv.ok)return { kind:"lv", left:n.lv.need-n.lv.now, sub:(spOf(c,uid)||{}).sub };
    if(!n.ke.ok)return { kind:"ke", left:n.ke.need-n.ke.now, sub:(spOf(c,uid)||{}).sub };
    return null;
  }

  MM.evolve={ check:check, evolve:evolve, gainXp:gainXp, lvNeed:lvNeed, nextGoal:nextGoal };
})();
