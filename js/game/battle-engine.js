"use strict";
/* ============================================================
   game/battle-engine.js — 正規化 Encounter 記述子 + 戦闘状態機械(純・DOM非依存)
   ------------------------------------------------------------
   ui-battle.js の 11 本の start* とグローバル G(mode 文字列比較の塊)を、
   「Encounter 記述子 + capability フラグ + 状態機械」へ正規化した純ロジック層。
   ・G は battle-engine 所有の ephemeral(非永続)。Store/localStorage を触らない。
   ・状態機械: start → answer → resolve → advance → end(phase ガードで順序保証)。
   ・mode 文字列比較を capabilities:{timed,exam,course,infinite} フラグへ置換。
   ・採点(ok 判定)は learning/scoring の責務。engine は「戦闘結果(HP/ライフ/コンボ/メタル)」
     だけを扱う。報酬額/演出/DOM は呼び出し側(screens/battle, game/rewards)の責務。
   ・保全する不変条件:
       - 誤答時 grazed(1戦につき最初の1回だけ HP を減らさない=弱点解析)。
       - メタル: turns>=hp なら討伐可能(逃走前に倒しきれる)。倒せなければ逃走=損失なし(非懲罰)。
       - ボスギミック regen/haste(トドメ後の再生はしない=hp>0 のときだけ regen)。
   ・今 Phase では today/review/boss の 3 種 encounter を実装(mock/nendo/demon/last/true/surv は Phase5)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SG = G.SRGame = G.SRGame || {};

  /* ---- capability テーブル(mode 文字列比較の置換) ---- */
  /* timed  : 制限時間あり(タイマ) / exam : 装備・回復無効の実力測定 /
     course : コース制(既定 問数=ids.length で一区切り) / infinite : プールを周回(尽きたら先頭へ) */
  var CAPS = {
    today:  { timed:false, exam:false, course:true,  infinite:false },
    review: { timed:false, exam:false, course:true,  infinite:false },
    boss:   { timed:true,  exam:false, course:false, infinite:true  }
  };
  function capsFor(kind){ var c=CAPS[kind]; return c ? { timed:c.timed, exam:c.exam, course:c.course, infinite:c.infinite } : null; }

  function idsOf(session){
    if(!session) return [];
    if(Array.isArray(session)) return session.slice();
    if(Array.isArray(session.ids)) return session.ids.slice();
    return [];
  }

  /* ---------- Encounter 記述子の生成 ----------
     kind: "today"|"review"|"boss"
     session: buildSession の戻り値 or ids 配列(today/review) / ボスは opts.ids or session
     opts:  { hp, hpMax, courseCap, subject, gimmick, timeBase, life, lifeMax, shield } */
  function encounterFor(kind, session, opts){
    opts = opts || {};
    var caps = capsFor(kind);
    if(!caps) throw new Error("battle-engine: unsupported kind "+kind+"(mock/nendo/demon/last/true/surv は Phase5)");
    var ids = idsOf(session);
    var hpModel, rewardPolicy;
    if(caps.course){
      var cap = (opts.courseCap!=null) ? opts.courseCap : ids.length;
      hpModel = { type:"count", cap:cap };
      rewardPolicy = { endBonusKind:kind, reviewXp2x:(kind==="review"), loopScaled:true };
    }else{
      var hp = (opts.hp!=null) ? opts.hp : Math.max(1, ids.length);
      hpModel = { type:"hp", hp:hp, hpMax:(opts.hpMax!=null?opts.hpMax:hp) };
      rewardPolicy = { endBonusKind:kind, reviewXp2x:false, loopScaled:true };
    }
    return {
      kind: kind,
      targets: ids,
      hpModel: hpModel,
      timerPolicy: { timed:caps.timed, base:(opts.timeBase!=null?opts.timeBase:null) },
      rewardPolicy: rewardPolicy,
      capabilities: caps,
      subject: (opts.subject!=null ? opts.subject : null),
      gimmick: (kind==="boss" ? (opts.gimmick||null) : null),
      _opts: { life:opts.life, lifeMax:opts.lifeMax, shield:opts.shield }
    };
  }

  var _cur = null; /* engine 所有の ephemeral(非永続)。1度に1戦。 */

  /* ---------- start: Encounter から戦闘状態 G を組み立て ---------- */
  function start(enc){
    if(!enc || !enc.capabilities) throw new Error("battle-engine.start: invalid encounter");
    var o = enc._opts || {};
    var lifeMax = (o.lifeMax!=null) ? o.lifeMax : ((o.life!=null) ? o.life : 3);
    var g = {
      enc: enc, kind: enc.kind, caps: enc.capabilities,
      ids: enc.targets.slice(), idx: 0,
      hp: (enc.hpModel.type==="hp") ? enc.hpModel.hp : 0,
      hpMax: (enc.hpModel.type==="hp") ? enc.hpModel.hpMax : 0,
      courseCap: (enc.hpModel.type==="count") ? enc.hpModel.cap : 0,
      cAns: 0,
      life: (o.life!=null) ? o.life : lifeMax, lifeMax: lifeMax,
      shield: (o.shield!=null) ? o.shield : 0,
      combo: 0, bestCombo: 0,
      miss: 0,
      turn: 0, metal: null, hasteNext: 0,
      analyzed: false,
      wrong: [],
      phase: "await",        /* await → answered → resolved → (await|end) */
      ended: false, over: false, win: false
    };
    _cur = g;
    return g;
  }
  function current(){ return _cur; }

  /* ---------- curId: いま出題中の問題 ID ---------- */
  function curId(g){ g = g||_cur; if(!g||!g.ids.length) return null; return g.ids[g.idx]; }

  /* ---------- メタル出現(course のみ・exam では出さない)----------
     invariant: 討伐可能=turns>=hp。倒せなければ逃走(損失なし)。 */
  function spawnMetal(g, metal){
    g = g||_cur;
    if(!g || g.caps.exam) return false;
    var hp = (metal && metal.hp!=null) ? metal.hp : 2;
    var turns = (metal && metal.turns!=null) ? metal.turns : 3;
    g.metal = Object.assign({}, metal, { hp:hp, hpMax:hp, turns:turns });
    return true;
  }
  function metalDefeatable(metal){ return !!metal && (metal.turns||0) >= (metal.hp||0); }

  /* ---------- answer: 回答受付(guard) ---------- */
  function answer(g, userAns){
    g = g||_cur;
    if(!g || g.phase!=="await") return false;
    g.phase = "answered";
    g._lastAns = userAns;
    return true;
  }

  /* ---------- resolve: 採点結果を戦闘へ反映(HP/ライフ/コンボ/メタル/ギミック) ----------
     outcome = { ok:bool, dmg?:number(既定1), timeout?:bool }
     戻り値 ev = 戦闘イベント(演出は呼び出し側)。 */
  function resolve(g, outcome){
    g = g||_cur; outcome = outcome || {};
    if(!g || g.phase!=="answered") return null;
    g.phase = "resolved";
    var ok = !!outcome.ok;
    var ev = { ok:ok, killedMetal:false, metalFled:false, blocked:false, grazed:false,
               lifeLost:false, missed:false, defeated:false, regen:false, haste:false,
               hp:g.hp, combo:g.combo };

    if(ok){
      g.combo++; if(g.combo>g.bestCombo) g.bestCombo=g.combo;
      if(g.metal){
        g.metal.hp -= 1;
        if(g.metal.hp<=0){ ev.killedMetal=true; g.metal=null; }
      }else if(!g.caps.course){
        var d=(outcome.dmg!=null)?outcome.dmg:1;
        g.hp=Math.max(0, g.hp-d);
        if(g.hp<=0) ev.defeated=true;
      }
      /* course(count)は idx/cAns の前進で進捗。HP バーは持たない。 */
    }else{
      g.combo=0;
      var cid=curId(g); if(cid!=null) g.wrong.push(cid);
      if(g.caps.exam){ g.miss++; ev.missed=true; }
      else if(g.shield>0){ g.shield--; ev.blocked=true; }
      else if(!g.analyzed){ g.analyzed=true; ev.grazed=true; } /* 1戦1回だけ HP を減らさない(弱点解析) */
      else { g.life--; ev.lifeLost=true; }
    }

    /* メタル逃走判定(このターンで倒せなかったら turns 減。0で逃走=損失なし) */
    if(g.metal){
      g.metal.turns--;
      if(g.metal.turns<=0){ ev.metalFled=true; g.metal=null; }
    }

    /* ボスギミック(mode:boss のみ・トドメ後の再生はしない=hp>0 のときだけ regen) */
    if(g.kind==="boss" && g.enc && g.enc.gimmick && g.hp>0){
      g.turn++;
      var gim=g.enc.gimmick;
      if(gim.n>0 && (g.turn % gim.n)===0){
        if(gim.t==="regen"){ g.hp=Math.min(g.hpMax, g.hp+(gim.v||0)); ev.regen=true; }
        else if(gim.t==="haste"){ g.hasteNext=1; ev.haste=true; }
      }
    }

    ev.hp=g.hp; ev.combo=g.combo;
    return ev;
  }

  /* ---------- advance: 次の問題へ / 終了判定 ----------
     戻り値 { done:bool, win:bool }。done=true なら end 済み。 */
  function advance(g){
    g = g||_cur;
    if(!g) return { done:true, win:false };
    if(g.ended) return { done:true, win:g.win };
    if(g.phase!=="resolved") return { done:false, win:false }; /* 順序ガード: resolve 前は進めない */

    if(g.caps.course){
      g.cAns++;
      if(g.life<=0) return end(g,false);
      if(g.courseCap>0 && g.cAns>=g.courseCap) return end(g,true);
    }else{
      if(g.hp<=0) return end(g,true);
      if(g.life<=0) return end(g,false);
    }

    g.idx++;
    if(g.idx>=g.ids.length){
      if(g.caps.infinite){ g.idx=0; }         /* 周回: プールが尽きたら先頭へ(再シャッフルは呼び出し側) */
      else return end(g,true);                 /* course: プールを出し切ったら勝利 */
    }
    g.phase="await"; g._lastAns=undefined;
    return { done:false, win:false };
  }

  function end(g, win){
    g = g||_cur;
    g.ended=true; g.over=true; g.win=!!win; g.phase="end";
    return { done:true, win:!!win };
  }

  /* ---------- capability セレクタ(mode 文字列比較の代替) ---------- */
  function isTimed(g){ g=g||_cur; return !!(g&&g.caps.timed); }
  function isExam(g){ g=g||_cur; return !!(g&&g.caps.exam); }
  function isCourse(g){ g=g||_cur; return !!(g&&g.caps.course); }
  function isInfinite(g){ g=g||_cur; return !!(g&&g.caps.infinite); }
  function isOver(g){ g=g||_cur; return !!(g&&g.over); }
  function courseRemain(g){ g=g||_cur; if(!g||!g.caps.course) return 0; return Math.max(0,(g.courseCap||0)-(g.cAns||0)); }

  SG.battle = {
    CAPS: CAPS, capsFor: capsFor,
    encounterFor: encounterFor, start: start, current: current,
    answer: answer, resolve: resolve, advance: advance, end: end,
    curId: curId, spawnMetal: spawnMetal, metalDefeatable: metalDefeatable,
    isTimed: isTimed, isExam: isExam, isCourse: isCourse, isInfinite: isInfinite,
    isOver: isOver, courseRemain: courseRemain
  };
})();
