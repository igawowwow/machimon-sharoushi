"use strict";
/* ============================================================
   components/card.js — ミュートな器(Phase3c 基盤)
   強調を Primary CTA に集約するため、カードは控えめ(淡い枠+淡い影)。
   ・純関数。{title, body, meta, variant, className, html} を受け取り HTML を返す。
   ・title/body/meta は esc() でエスケープ(XSS安全)。
   ・opts.html は「呼び出し側が既にエスケープ済み/信頼済みの内部HTML断片」を
     差し込む口(components が組んだ子HTMLを入れ子にする用途)。生ユーザ値は
     必ず body/title/meta 経由で渡すこと。
   非module classic script。名前空間 window.SRApp.card。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  var VARIANTS = { flat:"card--flat", accent:"card--accent" };

  function card(opts){
    opts = opts || {};
    var cls = "card";
    if(opts.variant && VARIANTS[opts.variant]) cls += " " + VARIANTS[opts.variant];
    if(opts.className) cls += " " + opts.className;
    var inner = "";
    if(opts.title != null && opts.title !== "")
      inner += '<div class="card__title">' + esc(opts.title) + '</div>';
    if(opts.body != null && opts.body !== "")
      inner += '<div class="card__body">' + esc(opts.body) + '</div>';
    if(opts.meta != null && opts.meta !== "")
      inner += '<div class="card__meta">' + esc(opts.meta) + '</div>';
    /* 信頼済み内部HTML(components が組んだ子)を末尾に差し込む口 */
    if(typeof opts.html === "string") inner += opts.html;
    return '<div class="' + esc(cls) + '">' + inner + '</div>';
  }

  APP.card = { card: card, _esc: esc };
})();
