"use strict";
/* ============================================================
   screens/result.js — リザルト(戦果サマリ + 「もう1戦」)(Phase4c)
   ------------------------------------------------------------
   §6 Phase4: 終了後「もう1戦」= result の .btn--primary が再び startToday を呼ぶ(短ループ)。
     render(params):
       ・戦果サマリ(正解/出題/最大コンボ・勝敗)を淡いカードで表示。
       ・唯一の Primary CTA「もう1戦」 data-action="startToday"(単一CTAの再呼)。
       ・二次導線「ホームへ戻る」は ghost(data-tab="home")。
   ・params.result(battle 画面が渡す戦果)or Store.ui.sess を防御的に読む。欠損は 0。
   ・XSS: 全ての動的値は esc()。全ボタン 44px は CSS 側。
   非module classic script。router.register("result")。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function num(v,d){ v=Number(v); return Number.isFinite(v)?v:(d||0); }

  function readResult(params){
    var r = (params && params.result) || null;
    if(!r){ try{ r = G.Store && G.Store.ui && G.Store.ui.sess; }catch(e){} }
    r = r || {};
    return {
      correct: num(r.correct!=null ? r.correct : r.cor, 0),
      total:   num(r.total  !=null ? r.total   : r.ans, 0),
      combo:   num(r.bestCombo!=null ? r.bestCombo : r.combo, 0),
      win:     !!r.win
    };
  }

  function render(params){
    var btn = APP.button, card = APP.card;
    var r = readResult(params);

    var body = '正解 ' + r.correct + ' / ' + r.total + '問'
             + (r.combo ? '　·　最大コンボ ' + r.combo : '');
    var title = r.win ? "戦果あり!" : "今日の戦果";

    var sum = card && card.card
      ? card.card({ title:title, body:body, variant:"accent", className:"result-summary" })
      : '<div class="card result-summary"><div class="card__title">' + esc(title) + '</div>'
        + '<div class="card__body">' + esc(body) + '</div></div>';

    /* 唯一の Primary CTA「もう1戦」= startToday を再び呼ぶ(短ループ) */
    var again = btn && btn.primaryCTA
      ? btn.primaryCTA({ label:"もう1戦", sub:"次の冒険へ", action:"startToday" })
      : '<button type="button" class="btn btn--primary cta" data-action="startToday"><span class="cta__label">もう1戦</span></button>';

    /* 二次導線(ghost・data-tab=home)。静的文字列=XSS安全 */
    var home = '<button type="button" class="btn btn--ghost" data-tab="home">ホームへ戻る</button>';

    return '<section class="screen screen--result" data-screen="result">'
         + sum
         + '<div class="result-cta">' + again + '</div>'
         + '<div class="result-sub">' + home + '</div>'
         + '</section>';
  }

  if(APP.router && typeof APP.router.register==="function"){ APP.router.register("result", render); }

  APP.screens = APP.screens || {};
  APP.screens.result = { render:render };
})();
