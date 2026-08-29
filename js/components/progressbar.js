"use strict";
/* ============================================================
   components/progressbar.js — 進捗バー(Phase3c 基盤)
   XP/正答率/道のり等の共通バー。
   ・純関数。{value, max, variant, slim, label} → HTML。
   ・幅は 0..100 に丸めた「数値」だけを style に出す(文字列注入なし=XSS安全)。
   ・aria(progressbar role + valuenow/max)を付与。label は esc()。
   非module classic script。名前空間 window.SRApp.progressbar。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  /* 0..100 の整数に安全化(NaN/負/超過を丸める) */
  function pct(value, max){
    var v = Number(value), m = Number(max);
    if(!isFinite(v)) v = 0;
    if(!isFinite(m) || m <= 0) m = 100;
    var p = (v / m) * 100;
    if(!isFinite(p) || p < 0) p = 0;
    if(p > 100) p = 100;
    return Math.round(p);
  }

  var FILLS = { accent:"progressbar__fill--accent", yellow:"progressbar__fill--yellow" };

  function progressbar(opts){
    opts = opts || {};
    var p = pct(opts.value, opts.max != null ? opts.max : 100);
    var barCls = "progressbar" + (opts.slim ? " progressbar--slim" : "");
    var fillCls = "progressbar__fill" + (opts.variant && FILLS[opts.variant] ? " " + FILLS[opts.variant] : "");
    var aria = ' role="progressbar" aria-valuenow="' + p + '" aria-valuemin="0" aria-valuemax="100"';
    if(opts.label != null && opts.label !== "") aria += ' aria-label="' + esc(opts.label) + '"';
    return '<div class="' + barCls + '"' + aria + '>'
         + '<div class="' + fillCls + '" style="width:' + p + '%"></div>'
         + '</div>';
  }

  APP.progressbar = { progressbar: progressbar, pct: pct, _esc: esc };
})();
