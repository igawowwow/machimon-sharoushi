"use strict";
/* ============================================================
   screens/adventure.js — 冒険タブ(世界地図 → 科目エリア)(Phase4d)
   ------------------------------------------------------------
   §4(冒険): worldMap + journeyHub + ボスグリッド を【一本化】。
   ・"world"  = 世界地図: 9科目ノード(習得率バー付き)→ 終章「試験の悪魔」(解放ゲート表示)。
   ・"subject"= 科目エリア: 通常戦/復習戦/強敵戦/ボス戦 の4戦種。
       SRS(dueIds)/苦手(wrongIds/leechIds)を「通常戦」に自然合流させ、復習専用へ隔離しすぎない。
   ・各戦種は buildSession 同様に study プールからのみ ids を組み、encounterFor で battle へ渡す。
       本試験形式(examFmt/nendo/case)は pools が study ゲートで弾くため型として混入しない。
   ・ボス戦の解放ゲートも表示も learning/mastery の単一定義(masteryPct)を参照。
   ・フラグ newUI.adventure の背後(router.flagAlias で world/subject を "adventure" に束ねる)。
   ・XSS: 全ての動的値は esc()。data-route/data-action 委譲(inline onclick 無し)。全ボタン 44px は CSS 側。
   非module classic script。名前空間 window.SRApp.screens.adventure。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function uniq(list){ var seen={}, out=[]; for(var i=0;i<list.length;i++){ var k=String(list[i]); if(!seen[k]){ seen[k]=1; out.push(list[i]); } } return out; }
  function env(){ return (APP.actions && APP.actions.buildEnv) ? APP.actions.buildEnv() : null; }
  /* SUBJECTS は const(global-lexical)= window プロパティではないため bare 参照(typeof ガード) */
  function subs(){ return (typeof SUBJECTS!=="undefined" && SUBJECTS) ? SUBJECTS
    : ["労基","安衛","労災","雇用","徴収","健保","国年","厚年","労一"]; }
  function pctMastery(e, si){ try{ return Math.round(G.SRLearning.mastery.masteryPct(e, si)*100); }catch(err){ return 0; } }
  var BOSS_GATE = 60;  /* ボス解放=習得率60%(mastery 単一定義) */

  /* ---------- 世界地図(world) ---------- */
  function worldRender(){
    var e = env(), S = subs(), L = G.SRLearning, rows = "", done = 0;
    for(var i=0;i<S.length;i++){
      var pct = e ? pctMastery(e, i) : 0;
      if(pct>=BOSS_GATE) done++;
      var status = pct>=BOSS_GATE ? "攻略済 ✅" : (pct>0 ? "挑戦中" : "未挑戦");
      var bar = APP.progressbar ? APP.progressbar.progressbar({ value:pct, max:100, variant:"accent", label:"習得率" }) : "";
      rows += '<button type="button" class="adv-node" data-route="adventure/subject?si=' + i + '">'
           +  '<div class="adv-node__head"><span class="adv-node__name">' + esc((i+1) + '. ' + S[i]) + '</span>'
           +  '<span class="adv-node__st">' + esc(status) + '</span></div>' + bar + '</button>';
    }
    var pass = e ? Math.round(G.SRLearning.mastery.passPct(e)) : 0;
    var readiness = 0;
    try{ readiness = G.SRGame.journey.demonReadiness({ passPct:pass }); }catch(err){}
    var locked = done < S.length;
    var demon = '<div class="adv-demon' + (locked?" is-locked":"") + '">'
      + '<div class="adv-demon__name">😈 試験の悪魔</div>'
      + '<div class="adv-demon__meta">' + (locked ? ('あと ' + (S.length-done) + ' 科目 攻略で解放') : ('到達度 ' + readiness + '%')) + '</div>'
      + '</div>';
    return '<section class="screen screen--adventure" data-screen="world">'
      + '<div class="adv-head">🗺️ 冒険の地図 <span class="adv-head__sub">' + done + ' / ' + S.length + ' 科目攻略</span></div>'
      + '<div class="adv-map">' + rows + '</div>' + demon + '</section>';
  }

  /* ---------- 科目エリア(subject) ---------- */
  function warBtn(icon, title, desc, kind, si, locked){
    var attrs = locked ? '' : (' data-action="advStart" data-arg="' + kind + ':' + si + '"');
    return '<button type="button" class="adv-war' + (locked?" is-locked":"") + '"' + attrs + '>'
      + '<div class="adv-war__t">' + esc(icon + ' ' + title) + '</div>'
      + '<div class="adv-war__d">' + esc(desc) + '</div></button>';
  }
  function subjectRender(params){
    params = params || {};
    var si = parseInt(params.si, 10); if(!(si>=0)) si = 0;
    var S = subs(), name = S[si] || ("科目" + si);
    var e = env(), L = G.SRLearning, pools = L.pools;
    var inSub = function(id){ var q = (typeof qById==="function") ? qById(id) : null; return !!q && q.s===si; };
    var due = e ? pools.dueIds(e).filter(inSub).length : 0;
    var weak = e ? uniq(pools.wrongIds(e).concat(pools.leechIds(e))).filter(inSub).length : 0;
    var pct = e ? pctMastery(e, si) : 0;
    var bossLocked = pct < BOSS_GATE;

    var list =
        warBtn("⚔️", "通常戦", "新問中心・SRSと苦手も自然に合流", "normal", si, false)
      + warBtn("🔁", "復習戦", "期限が来た問題を復習" + (due?("（" + due + "問）"):""), "review", si, false)
      + warBtn("💢", "強敵戦", "苦手・沼を集中攻略" + (weak?("（" + weak + "問）"):""), "elite", si, false)
      + warBtn("👹", "ボス戦", bossLocked ? ("習得率" + BOSS_GATE + "%で解放（現 " + pct + "%）") : (name + "の番人に挑む"), "boss", si, bossLocked);

    return '<section class="screen screen--subject" data-screen="subject">'
      + '<div class="adv-sub-head"><button type="button" class="btn btn--ghost adv-back" data-tab="adventure">← 地図</button>'
      + '<span class="adv-sub-name">' + esc((si+1) + '. ' + name) + '</span>'
      + '<span class="adv-sub-pct">習得 ' + pct + '%</span></div>'
      + '<div class="adv-wars">' + list + '</div></section>';
  }

  /* ---------- 戦種の開始(study プールからのみ ids 構成 → encounter → battle) ---------- */
  function advStart(arg){
    var m = /^([a-z]+):(\d+)$/.exec(String(arg||""));
    if(!m) return;
    var kind = m[1], si = parseInt(m[2], 10);
    var e = env(); if(!e) return;
    var L = G.SRLearning, SG = G.SRGame, pools = L.pools;
    var subIds = e.study.filter(function(q){ return q.s===si; }).map(function(q){ return String(q.id); });
    if(!subIds.length) return;
    var inSet = {}; subIds.forEach(function(id){ inSet[id] = 1; });
    var subOnly = function(list){ return list.filter(function(id){ return inSet[String(id)]; }); };
    var size = (APP.actions && APP.actions.sessionSize) ? APP.actions.sessionSize() : 5;
    var ids, enc, encKind;

    if(kind==="review"){
      ids = uniq(subOnly(pools.dueIds(e)));
      if(!ids.length) ids = subIds.slice(0, size);
      ids = ids.slice(0, size);
      enc = SG.battle.encounterFor("review", { ids:ids }); encKind = "review";
    } else if(kind==="elite"){
      ids = uniq(subOnly(pools.wrongIds(e)).concat(subOnly(pools.leechIds(e))));
      if(!ids.length) ids = subIds.slice(0, size);
      ids = ids.slice(0, size);
      enc = SG.battle.encounterFor("review", { ids:ids }); encKind = "review";
    } else if(kind==="boss"){
      ids = shuffle(subIds);
      var hp = Math.max(6, Math.round(subIds.length * 0.3));
      enc = SG.battle.encounterFor("boss", { ids:ids }, { hp:hp, subject:si }); encKind = "boss";
    } else { /* normal: SRS/苦手を通常戦へ自然合流(due → wrong → unseen → 残り) */
      ids = uniq(
        subOnly(pools.dueIds(e))
        .concat(subOnly(pools.wrongIds(e)))
        .concat(subOnly(pools.unseenIds(e)))
        .concat(subIds)
      ).slice(0, size);
      enc = SG.battle.encounterFor("today", { ids:ids }); encKind = "normal";
    }
    var R = APP.router;
    if(R && R.go) R.go({ tab:"adventure", screen:"battle", params:{ kind:encKind, enc:enc, session:{ ids:enc.targets }, subject:si } });
    return { kind:encKind, enc:enc };
  }

  /* ---------- 登録 ---------- */
  if(APP.router && typeof APP.router.register==="function"){
    APP.router.register("world", worldRender);
    APP.router.register("subject", subjectRender);
    /* world/subject を group flag "adventure" に束ねる(既定 false=旧UI) */
    APP.router.flagAlias = APP.router.flagAlias || {};
    APP.router.flagAlias.world = "adventure";
    APP.router.flagAlias.subject = "adventure";
  }
  if(APP.events && typeof APP.events.on==="function"){ APP.events.on("advStart", advStart); }

  APP.screens = APP.screens || {};
  APP.screens.adventure = { world:worldRender, subject:subjectRender, advStart:advStart };
})();
