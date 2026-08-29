"use strict";
/* ============================================================
   components/overlay.js — モーダル/オーバーレイ(Phase3c 基盤)
   新UI用。旧 .ovl-* とは別クラス .sr-overlay(旧UIを壊さない命名分離)。
   ・純関数。{title, body, actions} → HTML(描画のみ。表示制御は screens/app 側)。
   ・title/body は esc()。actions は「信頼済みHTML断片」(button 出力)を差し込む口。
   非module classic script。名前空間 window.SRApp.overlay。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  function overlay(opts){
    opts = opts || {};
    var inner = "";
    if(opts.title != null && opts.title !== "")
      inner += '<div class="sr-overlay__title">' + esc(opts.title) + '</div>';
    if(opts.body != null && opts.body !== "")
      inner += '<div class="sr-overlay__body">' + esc(opts.body) + '</div>';
    /* actions は components(button 等)が組んだ信頼済みHTML断片 */
    if(typeof opts.actions === "string" && opts.actions)
      inner += '<div class="sr-overlay__actions">' + opts.actions + '</div>';
    return '<div class="sr-overlay" data-overlay>'
         + '<div class="sr-overlay__card" role="dialog" aria-modal="true">'
         + inner
         + '</div></div>';
  }

  APP.overlay = { overlay: overlay, _esc: esc };
})();
