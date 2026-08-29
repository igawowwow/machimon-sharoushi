"use strict";
/* ============================================================
   components/tabbar.js — 下部5タブ ナビ(Phase3b 基盤)
   固定 <nav class="tabbar"> の中身を描画し、data-tab で Router.tab に委譲。
   ・ラベル/アイコンは静的文字列のみ(生値を innerHTML に入れない=XSS安全)
   ・全ボタン min-height:44px(タップ領域・CSS側で担保)
   ・この Phase では nav は既定で非表示(body.sr-newui のときだけ表示)。
     旧UIの画面を視覚的に壊さないため=基盤のみ敷く。切替は後Phase。
   非module classic script。名前空間 window.SRApp。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  var TABS = [
    { id:"home",      label:"ホーム", icon:"🏠" },
    { id:"adventure", label:"冒険",   icon:"🗺️" },
    { id:"growth",    label:"育成",   icon:"⚔️" },
    { id:"zukan",     label:"図鑑",   icon:"📖" },
    { id:"more",      label:"その他", icon:"⋯" }
  ];

  function buttonsHtml(active){
    var out = "";
    for(var i=0;i<TABS.length;i++){
      var t = TABS[i];
      var on = (t.id===active);
      out += '<button type="button" class="tabbar__btn'+(on?" is-active":"")+'"'
           + ' data-tab="'+t.id+'"'
           + (on?' aria-current="page"':'')
           + ' aria-label="'+t.label+'">'
           + '<span class="tabbar__icon" aria-hidden="true">'+t.icon+'</span>'
           + '<span class="tabbar__label">'+t.label+'</span>'
           + '</button>';
    }
    return out;
  }

  var TabBar = {
    tabs: TABS,

    /* nav 全体の HTML(index.html が空 nav を置く場合の描画元にもなる) */
    html: function(active){
      return '<nav class="tabbar" data-nav aria-label="メインナビゲーション">'
           + buttonsHtml(active) + '</nav>';
    },

    /* 既設の <nav class="tabbar"> にボタンを流し込む */
    render: function(active){
      var doc = (typeof G.document!=="undefined") ? G.document : null;
      if(!doc || !doc.querySelector) return;
      var nav = doc.querySelector(".tabbar");
      if(!nav) return;
      nav.innerHTML = buttonsHtml(active);
    },

    /* active タブのハイライト更新(未描画なら描画も行う) */
    setActive: function(active){
      var doc = (typeof G.document!=="undefined") ? G.document : null;
      if(!doc || !doc.querySelector) return;
      var nav = doc.querySelector(".tabbar");
      if(!nav) return;
      if(!nav.querySelector || !nav.querySelector(".tabbar__btn")){ this.render(active); return; }
      var btns = nav.querySelectorAll(".tabbar__btn");
      for(var i=0;i<btns.length;i++){
        var b = btns[i];
        var on = b.getAttribute("data-tab")===active;
        if(b.classList){ b.classList.toggle("is-active", on); }
        if(on) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current");
      }
    }
  };

  APP.tabbar = TabBar;
})();
