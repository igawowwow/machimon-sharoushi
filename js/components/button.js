"use strict";
/* ============================================================
   components/button.js — ボタン階層(Phase3c 基盤)
   .btn--primary / .btn--secondary / .btn--ghost の3段階。
   Primary CTA だけ強く=唯一の強調(components.css で担保)。
   ・純関数: state を受け取らず、渡された {label,action,arg,variant} から
     HTML文字列を返すだけ(DOM/Store は触らない=依存方向厳守)。
   ・全ての動的値は esc() でエスケープ(生値を innerHTML に入れない=XSS安全)。
   ・全ボタン min-height:44px は CSS 側で強制。
   非module classic script。名前空間 window.SRApp.button。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  var VARIANTS = { primary:1, secondary:1, ghost:1 };

  /* 汎用ボタン。variant 未知なら secondary に丸める(壊さない) */
  function btn(opts){
    opts = opts || {};
    var v = VARIANTS[opts.variant] ? opts.variant : "secondary";
    var cls = "btn btn--" + v + (opts.className ? " " + opts.className : "");
    var attrs = 'class="' + esc(cls) + '"';
    if(opts.action != null) attrs += ' data-action="' + esc(opts.action) + '"';
    if(opts.arg != null)    attrs += ' data-arg="' + esc(opts.arg) + '"';
    if(opts.disabled)       attrs += ' disabled';
    if(opts.ariaLabel != null) attrs += ' aria-label="' + esc(opts.ariaLabel) + '"';
    return '<button type="button" ' + attrs + '>' + esc(opts.label) + '</button>';
  }

  /* 唯一の Primary CTA(主ラベル + 副ラベル)。「今日の冒険」用 */
  function primaryCTA(opts){
    opts = opts || {};
    var attrs = 'class="btn btn--primary cta"';
    if(opts.action != null) attrs += ' data-action="' + esc(opts.action) + '"';
    if(opts.arg != null)    attrs += ' data-arg="' + esc(opts.arg) + '"';
    if(opts.disabled)       attrs += ' disabled';
    var sub = (opts.sub != null && opts.sub !== "")
      ? '<span class="cta__sub">' + esc(opts.sub) + '</span>' : "";
    return '<button type="button" ' + attrs + '>'
         + '<span class="cta__label">' + esc(opts.label) + '</span>'
         + sub
         + '</button>';
  }

  APP.button = { btn: btn, primaryCTA: primaryCTA, _esc: esc };
})();
