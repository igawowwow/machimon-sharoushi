"use strict";
/* ============================================================
   machimon/core/game.js — セッションの取りまとめ(UIが呼ぶ唯一の窓口)
   ★UI は判断を持たない。街に入る/事件に答える/建てる…をここへ委譲する。
   ★依存の向き: ui/* → core/game.js → core/* → data/*。逆向きの依存を作らない。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  function ctx(o){ return MM.state.ctx(o); }

  /* 街に入る(起動・画面復帰のたびに呼ぶ)。日付更新→放置回収→事件生成 をこの順で行う */
  function enter(o){
    var c=ctx(o);
    var rolled=MM.state.rollDay(c);
    if(!c.mm.on){ c.mm.on=1; c.mm.idle.t=0; }
    var idle=MM.economy.idle(c);
    var list=MM.incident.generate(c);
    save();
    return { c:c, rolled:rolled, idle:idle, incidents:list };
  }

  /* 事件に1問答える。学習確定・報酬・経験値・マイルストーン・音響指示までまとめて返す */
  function answer(o,incId,qid,ok,ms){
    var c=ctx(o);
    var prev=c.mm.combo;
    var r=MM.incident.answer(c,incId,qid,ok,ms);
    var ms2=[];
    for(var guard=0;guard<4;guard++){
      var s=MM.onboard.due(c);
      if(!s)break;
      var f=MM.onboard.fire(c,s);
      if(f)ms2.push(f);
    }
    var audio=ok?MM.audio.layerFor(c.mm.combo):MM.audio.onWrong();
    save();
    return { c:c, reward:r.reward, gain:r.gain, lvUp:r.lvUp, resolved:r.resolved,
             flavor:r.flavor, big:r.big||null, milestones:ms2, audio:audio,
             stepUp:ok&&MM.audio.stepUp(prev,c.mm.combo), combo:c.mm.combo };
  }

  /* ボス1問 */
  function bossStep(o,g,ok,ms){
    var c=ctx(o);
    var r=MM.boss.step(c,g,ok,ms);
    var audio=ok?MM.audio.layerFor(c.mm.combo):MM.audio.onWrong();
    save();
    return { c:c, res:r, audio:audio };
  }

  /* 今日の要約(ホーム表示・記録画面) */
  function summary(o){
    var c=ctx(o);
    var mast=MM.learn.masteryBySub(c);
    var subs=[];
    var names=G.SUBJECTS||[];
    for(var i=0;i<MM.DATA.areas.length;i++){
      var a=MM.DATA.areas[i];
      subs.push({ sub:a.sub, area:a.id, name:names[a.sub]||a.name, pct:Math.round((mast[a.sub]||0)*100), open:!!c.mm.areas[a.id] });
    }
    var pend=MM.incident.pending(c);
    return {
      res:c.mm.res, lv:c.mm.lv, tier:MM.town.tier(c), nextTier:MM.town.nextTier(c),
      day:c.mm.day, combo:c.mm.combo, best:c.mm.best,
      prod:MM.town.production(c), cap:MM.economy.cap(c),
      incidents:pend.length, mons:Object.keys(c.mm.mons).length,
      buildings:MM.town.bldCount(c), subs:subs,
      onboard:MM.onboard.progress(c), exam:MM.exam.phase(c)
    };
  }

  /* 週間有効回答数(North Star Metric) */
  function wea(o){
    var c=ctx(o),n=c.mm.day.eff||0,w=c.mm.w7||[];
    for(var i=0;i<w.length;i++)n+=(w[i]||0);
    return n;
  }

  function save(){ try{ if(typeof G.saveNow==="function")G.saveNow(); }catch(e){} }

  MM.game={ ctx:ctx, enter:enter, answer:answer, bossStep:bossStep, summary:summary, wea:wea, save:save };
})();
