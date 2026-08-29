"use strict";
/* ============================================================
   machimon/core/onboard.js — Day1オンボーディング(説明ゼロで30問)
   ★目標は「勉強を始めた」ではなく「ゲームを始めたら自然に30問解いていた」状態。
   ★チュートリアル文章を出さない。演出の中の1行だけで教える。
   ★報酬イベントの間隔は等間隔にしない(前半を密にする)= 序盤の離脱を防ぐ。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  /* at=累計正解数 / act=起こすこと / say=そのとき出す唯一の説明(1行) */
  var STEPS=[
   {id:"m1", at:1,  act:"coin",   g:100,  say:"事件を解決すると、街にお金が入るモン！"},
   {id:"m3", at:3,  act:"tama",   tama:1, say:"タマゴが割れそうモン…！"},
   {id:"m4", at:4,  act:"hatch",          say:"マチモンは施設で働くモン！"},
   {id:"m5", at:5,  act:"build",  bld:"office", say:"事務所ができたモン！"},
   {id:"m10",at:10, act:"tama",   tama:1, say:"仲間が増えると街が育つモン！"},
   {id:"m15",at:15, act:"corp",   g:500,  say:"会社が相談に来てくれたモン！"},
   {id:"m20",at:20, act:"idle",           say:"街はあなたがいない間も働くモン！"},
   {id:"m25",at:25, act:"gate",           say:"となりの街の門が見えてきたモン！"},
   {id:"m30",at:30, act:"finale", tama:1, mat:5, say:"また明日、新しい事件が起きるモン！"}
  ];

  /* 当日の正解数から、まだ発火していないマイルストーンを1つ返す */
  function due(c){
    var cor=totalCorrect(c);
    for(var i=0;i<STEPS.length;i++){
      var s=STEPS[i];
      if(c.mm.ms[s.id])continue;
      if(cor>=s.at)return s;
    }
    return null;
  }
  function totalCorrect(c){
    var n=0,q=c.ST.q||{};
    for(var k in q)n+=(q[k].c||0);
    return n;
  }

  /* マイルストーンを実行する(UIは戻り値の say と act を演出に流すだけ) */
  function fire(c,s){
    if(!s||c.mm.ms[s.id])return null;
    c.mm.ms[s.id]=1;
    var gain={g:s.g||0,xp:0,ke:0,mat:s.mat||0,tama:s.tama||0};
    MM.economy.apply(gain,c);
    var extra=null;
    if(s.act==="hatch"&&MM.hatch)extra=MM.hatch.hatch(c);
    if(s.act==="build"&&s.bld){
      var key=MM.town.slotKey("rouki",0);
      if(!c.mm.slots[key]){ c.mm.slots[key]={b:s.bld,lv:1,mon:"",day:c.today,q:MM.town.totalAnswered(c)}; extra={build:s.bld}; }
    }
    if(s.act==="idle"&&!c.mm.idle.t)c.mm.idle.t=c.now;
    return { step:s, gain:gain, extra:extra, say:s.say };
  }

  /* 進捗(UIの「あと何問」表示用) */
  function progress(c){
    var cor=totalCorrect(c);
    for(var i=0;i<STEPS.length;i++){
      if(!c.mm.ms[STEPS[i].id])return { next:STEPS[i], now:cor, left:Math.max(0,STEPS[i].at-cor), done:i, total:STEPS.length };
    }
    return { next:null, now:cor, left:0, done:STEPS.length, total:STEPS.length };
  }
  function finished(c){ return !!c.mm.ms.m30; }

  MM.onboard={ STEPS:STEPS, due:due, fire:fire, progress:progress, finished:finished };
})();
