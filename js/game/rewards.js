"use strict";
/* ============================================================
   game/rewards.js — 報酬式(コイン/XP/ドロップ)の純ロジック層(DOM非依存)
   ------------------------------------------------------------
   ui-battle.js resolve()/rushKill()/endBattle2()/chestChance() のコイン・XP・ドロップ式を
   純関数へ引き剥がした。学習(採点)とは完全に分離=報酬は学習事実(scoring)を受けて算出。
   ・最重要方針: 「正解の質(attackKind の mult)」を主報酬にする。速度(会心=crit)は
     主報酬にしない=controlled な flat 加点(+2)のみで、乗算係数にしない。
     → 法律は熟読が本質。速く当てる射幸ではなく、深く理解する行動を報いる(非速度偏重)。
   ・乗算係数(coinMult/xpMult/statCoinBonus)は gear/state 由来なので ctx で受け取る(純)。
   移植元: ui-battle.js:404-418(coin/xp)、511(chest)、650(win chest)、440-441(metal)、
           631-645(endBattle2 の mode 別ボーナス)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var SG = G.SRGame = G.SRGame || {};

  function numOr(v, d){ v=Number(v); return Number.isFinite(v) ? v : d; }

  /* ---------- 1問正解の報酬(resolve のコイン/XP 式・無改変移植) ----------
     ctx = {
       loop:1, combo:0, crit:false,
       tierMult:1, tierDmg:0,          // comboTier の mult/dmg(段階ボーナス)
       memMult:1,                       // 長期記憶ボーナス(scheduler.memBonusMult)
       akMult:1,                        // 正解の質(scoring.attackKind → ATK[k].mult)= 主報酬
       review:false, wasDue:false,      // 復習系は XP2倍
       repeat:false,                    // 同日連打は 0.25 倍(丸暗記周回を最適解にしない)
       rev:false,                       // リベンジ戦はコイン2倍
       coinMult:1, xpMult:1, statCoinBonus:0
     }
     戻り値 { coin, xp, xpLeveled } — coin/xp は G.coinsEarned/G.xpEarned に足す表示値、
     xpLeveled は実レベリング用(xpMult 適用済み。gainXp 相当)。 */
  function answerReward(ctx){
    ctx = ctx || {};
    var loop = numOr(ctx.loop,1);
    var combo = numOr(ctx.combo,0);
    var crit = !!ctx.crit;
    var tierMult = numOr(ctx.tierMult,1), tierDmg = numOr(ctx.tierDmg,0);
    var memMult = numOr(ctx.memMult,1), akMult = numOr(ctx.akMult,1);
    var coinMult = numOr(ctx.coinMult,1), xpMult = numOr(ctx.xpMult,1);
    var statCoinBonus = numOr(ctx.statCoinBonus,0);

    /* coin: 速度(crit)は +2 の flat のみ。質(akMult)・段階(tierMult)・記憶(memMult)は乗算。 */
    var coin = (10 + (crit?2:0) + Math.min(combo,10)*2) * loop;
    coin *= tierMult * coinMult * (1 + statCoinBonus);
    if(ctx.rev) coin *= 2;
    if(ctx.repeat) coin *= 0.25;
    coin *= memMult;
    coin *= akMult;                    /* 正解の質で控えめに色付け=主報酬 */
    coin = Math.round(coin);

    /* xp: 同じく crit は +2 の flat。復習/期限は 2倍。質(akMult)・記憶(memMult)は乗算。 */
    var xp = 12 + (crit?2:0) + tierDmg*2;
    if(ctx.review || ctx.wasDue) xp *= 2;
    if(ctx.repeat) xp *= 0.25;
    xp *= memMult;
    xp *= akMult;
    xp = Math.round(xp);

    return { coin:coin, xp:xp, xpLeveled: Math.round(xp*xpMult) };
  }

  /* ---------- 宝箱ドロップ確率(ui-battle.js:527 chestChance) ---------- */
  function chestChance(luck){ return 0.05 + Math.min(0.10, numOr(luck,0)*0.0004); }
  /* 勝利ボーナス宝箱(ui-battle.js:650) */
  function winChestChance(luck){ return 0.35 + Math.min(0.15, numOr(luck,0)*0.0005); }

  /* ---------- メタル討伐報酬(ui-battle.js:440-441) ---------- */
  function metalReward(metal, loop, coinMult, xpMult){
    metal = metal || {};
    var coin = Math.round(numOr(metal.coin,200) * numOr(loop,1) * numOr(coinMult,1));
    var xp   = Math.round(numOr(metal.xp,80) * numOr(xpMult,1));
    return { coin:coin, xp:xp, mat:(metal.rank==="虹"?4:2) };
  }

  /* ---------- バトル終了ボーナス(endBattle2 の mode 別・実装済み kind のみ) ----------
     ctx = { kind, loop:1, firstKill:false, coinMult:1 }
     今 Phase の kind: boss / review / today。
     ・boss  : 初討伐 100*loop、再討伐 30*loop(ui-battle.js:632-633)
     ・review: 80(ui-battle.js:643)
     ・today : 復習60/新規30/挑戦10 の合成コース。区切り達成に控えめな 50 を付与。
     mock/nendo/demon/last/true/surv/train/rev/bm/reco/case は Phase5 で追加。 */
  function endBonus(ctx){
    ctx = ctx || {};
    var loop = numOr(ctx.loop,1), coinMult = numOr(ctx.coinMult,1), b = 0;
    switch(ctx.kind){
      case "boss":   b = (ctx.firstKill ? 100 : 30) * loop; break;
      case "review": b = 80; break;
      case "today":  b = 50; break;
      default:       b = 0;
    }
    return Math.round(b * coinMult);
  }

  SG.rewards = {
    answerReward: answerReward,
    chestChance: chestChance, winChestChance: winChestChance,
    metalReward: metalReward, endBonus: endBonus
  };
})();
