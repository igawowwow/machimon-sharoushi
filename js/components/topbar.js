"use strict";
/* ============================================================
   components/topbar.js — 画面上部バー(Phase3c 基盤)
   タイトル + 任意の戻る(←)/右アクション。旧 .topbar とは別クラス .sr-topbar
   (旧UIを視覚的に壊さないため命名を分離)。
   ・純関数。{title, back, backAction, right} → HTML。
   ・戻るは data-action(既定 "back")で app/events → Router.back() に委譲。
   ・title は esc()。right は「信頼済みHTML断片」(components 出力)を差し込む口。
   非module classic script。名前空間 window.SRApp.topbar。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  function topbar(opts){
    opts = opts || {};
    var left = "";
    if(opts.back){
      var act = opts.backAction != null ? opts.backAction : "back";
      left = '<button type="button" class="sr-topbar__btn" data-action="'
           + esc(act) + '" aria-label="戻る">‹</button>';
    }
    var title = '<span class="sr-topbar__title">' + esc(opts.title) + '</span>';
    /* right は components が組んだ信頼済みHTML断片(chip/button 等)。生値は不可。 */
    var right = (typeof opts.right === "string" && opts.right)
      ? '<span class="sr-topbar__right">' + opts.right + '</span>'
      : '<span class="sr-topbar__right"></span>';
    return '<div class="sr-topbar">' + left + title + right + '</div>';
  }

  APP.topbar = { topbar: topbar, _esc: esc };
})();
