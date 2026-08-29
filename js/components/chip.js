"use strict";
/* ============================================================
   components/chip.js — 小さなラベル/タグ(Phase3c 基盤)
   ミッション/週間/科目タグ等の粒。tap 可能なら min-height:44px を確保。
   ・純関数。{label, icon, variant, action, arg, tap} → HTML。
   ・label/icon(絵文字想定だが)は esc() でエスケープ(XSS安全)。
   非module classic script。名前空間 window.SRApp.chip。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  var VARIANTS = { accent:"chip--accent", yellow:"chip--yellow", mint:"chip--mint" };

  function chip(opts){
    opts = opts || {};
    var cls = "chip";
    if(opts.variant && VARIANTS[opts.variant]) cls += " " + VARIANTS[opts.variant];
    var tappable = !!(opts.action || opts.tap);
    if(tappable) cls += " chip--tap";
    if(opts.className) cls += " " + opts.className;

    var icon = (opts.icon != null && opts.icon !== "")
      ? '<span class="chip__icon" aria-hidden="true">' + esc(opts.icon) + '</span>' : "";
    var inner = icon + '<span class="chip__label">' + esc(opts.label) + '</span>';

    if(tappable){
      var attrs = 'class="' + esc(cls) + '" type="button"';
      if(opts.action != null) attrs += ' data-action="' + esc(opts.action) + '"';
      if(opts.arg != null)    attrs += ' data-arg="' + esc(opts.arg) + '"';
      return '<button ' + attrs + '>' + inner + '</button>';
    }
    return '<span class="' + esc(cls) + '">' + inner + '</span>';
  }

  APP.chip = { chip: chip, _esc: esc };
})();
