"use strict";
/* ============================================================
   app/router.js — 5タブ + 画面内サブ遷移 + 戻るスタック(Phase3b 基盤)
   route = { tab, screen, params }。router.go / router.back / router.tab。
   ・home直帰をやめる: back() は戻るスタックを1段ずつ戻す(画面内サブ遷移を保持)
   ・pushState 連動(best-effort・DOM無くても throw しない)
   ・screen描画時に feature flag(settings.dev.newUI)で 新screens/ か 旧ui-*.js を選ぶ
     → 既定は全て旧(false)。この Phase では画面を切り替えない(旧UI無傷)。
   非module classic script。名前空間 window.SRApp に集約(SRState/engine と非衝突)。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  var TABS = ["home","adventure","growth","zukan","more"];
  /* 各タブの既定 screen(タブ初回タップ時の入口) */
  var DEFAULT_SCREEN = { home:"home", adventure:"world", growth:"equip", zukan:"bestiary", more:"more" };

  function isObj(v){ return v && typeof v==="object" && !Array.isArray(v); }
  function d(){ return (typeof G.document!=="undefined") ? G.document : null; }

  var listeners = [];

  var Router = {
    tabs: TABS,
    route: null,          // 現在の {tab,screen,params}
    stack: [],            // 戻るスタック(過去の route を積む)
    tabMemory: {},        // 各タブの最後の位置(タブ再選択で復元)
    screens: {},          // 新 screens 登録: screenId -> render(params)->htmlString|element
    legacy: {},           // 旧UIブリッジ: tab -> render(route) (旧 ui-*.js を呼ぶ)
    flagAlias: {},        // screenId -> グループflagキー(例 world/subject -> "adventure")。既定空=従来と同一
    _started: false,
    _bound: false,

    /* ---- 登録 API ---- */
    register: function(screenId, fn){ if(typeof fn==="function") this.screens[screenId]=fn; return this; },
    registerLegacy: function(tab, fn){ if(typeof fn==="function") this.legacy[tab]=fn; return this; },

    /* ---- feature flag(settings.dev.newUI + URL ?newui 上書き)。既定 false ---- */
    flags: function(){
      var f = {};
      try{
        var st = G.Store && G.Store.state;
        var dev = st && st.settings && st.settings.dev;
        if(dev && isObj(dev.newUI)){ for(var k in dev.newUI) f[k]=!!dev.newUI[k]; }
      }catch(e){}
      var ov = this._urlFlags();
      for(var j in ov) f[j] = ov[j];
      return f;
    },
    /* 実装済み新screen(ショートハンド ?newui=all の展開先)。未実装は placeholder */
    _implemented: ["home","adventure","world","subject","battle","result","explain"],
    _urlFlags: function(){
      var out = {};
      try{
        var loc = G.location; if(!loc || !loc.search) return out;
        var m = /[?&]newui=([^&]*)/.exec(loc.search);
        if(m){ decodeURIComponent(m[1]).split(",").forEach(function(s){ s=s.trim(); if(s) out[s]=true; }); }
      }catch(e){}
      /* ?newui=all → 実装済み全画面を一括ON(検証用ショートハンド) */
      if(out.all){ this._implemented.forEach(function(s){ out[s]=true; }); }
      return out;
    },
    /* この screen を新UIで描くか(フラグ true かつ 新 screen 登録済み) */
    useNew: function(screenId){
      var f = this.flags();
      var on = !!f[screenId];
      if(!on && this.flagAlias && this.flagAlias[screenId]) on = !!f[this.flagAlias[screenId]];
      return on && typeof this.screens[screenId]==="function";
    },

    /* ---- route 正規化 ---- */
    normalize: function(route){
      var r = isObj(route) ? route : {};
      var tab = (TABS.indexOf(r.tab)>=0) ? r.tab : "home";
      var screen = (typeof r.screen==="string" && r.screen) ? r.screen : DEFAULT_SCREEN[tab];
      var params = isObj(r.params) ? r.params : {};
      return { tab:tab, screen:screen, params:params };
    },

    /* ---- 遷移(戻るスタックに現在を積んでから進む) ---- */
    go: function(route, opts){
      opts = opts || {};
      var next = this.normalize(route);
      var prev = this.route;
      if(prev && !opts.replace && !opts.pop){ this.stack.push(prev); }
      this._transition(next, prev);
      if(!opts.pop){ this._pushState(next, opts.replace); }
      return next;
    },

    /* ---- タブ切替(そのタブの最後の位置を復元・無ければ既定 screen) ---- */
    tab: function(tabId){
      if(TABS.indexOf(tabId)<0) return null;
      var route = this.tabMemory[tabId] || { tab:tabId, screen:DEFAULT_SCREEN[tabId], params:{} };
      return this.go(route);
    },

    /* ---- 戻る(home直帰しない。スタックが空なら現在維持) ---- */
    back: function(){
      if(this.stack.length===0){ return null; }
      var prev = this.stack.pop();
      this._transition(prev, this.route);
      this._pushState(prev, true);   // replace(既に履歴上は戻っている想定)
      try{ if(G.history && typeof G.history.back==="function" && !this._suppressHistoryBack) {} }catch(e){}
      return prev;
    },

    /* ---- 内部: 実際の切替(lifecycle leave→enter→render→通知) ---- */
    _transition: function(next, prev){
      var LC = APP.lifecycle;
      if(LC && prev){ try{ LC.leave(prev); }catch(e){} }
      this.route = next;
      this.tabMemory[next.tab] = next;
      if(LC){ try{ LC.enter(next, prev); }catch(e){} }
      this._render();
      this._notifyTab();
      this._notify();
    },

    /* ---- 描画: 新screen or 旧UIブリッジ or プレースホルダ を #app へ mount ---- */
    _render: function(){
      var route = this.route; if(!route) return;
      var doc = d(); var mount = doc ? doc.querySelector("#app") : null;
      /* 新UI(フラグON)経路 */
      if(this.useNew(route.screen)){
        var out = null; try{ out = this.screens[route.screen](route.params, route); }catch(e){ out = null; }
        if(mount && out!=null){ this._mount(mount, out); }
        return;
      }
      /* 旧UIブリッジ(既定): タブ対応の旧描画関数を呼ぶ(#app は旧関数が自前で差し替える) */
      var lg = this.legacy[route.tab];
      if(typeof lg==="function"){ try{ lg(route); }catch(e){} return; }
      /* どちらも無い → 空スクリーンのプレースホルダ(この Phase は基盤のみ) */
      if(mount){ mount.innerHTML = this._placeholder(route); }
    },
    _mount: function(mount, out){
      if(typeof out==="string"){ mount.innerHTML = out; return; }
      if(out && out.nodeType){ mount.innerHTML=""; mount.appendChild(out); }
    },
    _placeholder: function(route){
      var label = { home:"ホーム", adventure:"冒険", growth:"育成", zukan:"図鑑", more:"その他" }[route.tab] || route.tab;
      /* 静的文字列のみ(生値を innerHTML に入れない=XSS安全) */
      return '<section class="screen screen--placeholder" data-screen="'+route.tab+'">'
           + '<div style="text-align:center;padding:48px 20px;color:#8A7FB0">'
           + '<div style="font-size:34px">🚧</div>'
           + '<div style="font-weight:900;margin-top:10px">'+label+'(準備中)</div>'
           + '<div style="font-size:12px;margin-top:6px">新しい画面はこれから追加されます</div>'
           + '</div></section>';
    },

    /* ---- history 連動(best-effort。DOM無し/失敗でも throw しない) ---- */
    _pushState: function(route, replace){
      try{
        var h = G.history; if(!h || !h.pushState) return;
        var st = { srqRoute:{ tab:route.tab, screen:route.screen, params:route.params } };
        var url = "#" + route.tab + "/" + route.screen;
        if(replace && h.replaceState) h.replaceState(st, "", url);
        else h.pushState(st, "", url);
      }catch(e){}
    },
    /* popstate から呼ぶ: 履歴側の route を反映(スタック操作せず描画のみ) */
    applyState: function(state){
      var r = state && state.srqRoute;
      if(!r) return;
      var next = this.normalize(r);
      var prev = this.route;
      var LC = APP.lifecycle;
      if(LC && prev){ try{ LC.leave(prev); }catch(e){} }
      this.route = next; this.tabMemory[next.tab] = next;
      if(LC){ try{ LC.enter(next, prev); }catch(e){} }
      this._render(); this._notifyTab(); this._notify();
    },

    /* ---- 起動の受け皿(この Phase では main.js が真の起動。ここは並置) ---- */
    start: function(initial){
      if(this._started) return this.route;
      this._started = true;
      if(APP.events && typeof APP.events.bind==="function"){ try{ APP.events.bind(); }catch(e){} }
      /* popstate で戻る/進むに追従 */
      try{
        var self = this;
        if(G.addEventListener){ G.addEventListener("popstate", function(ev){ self.applyState(ev && ev.state); }); }
      }catch(e){}
      this.go(initial || { tab:"home", screen:"home", params:{} }, { replace:true });
      return this.route;
    },

    /* ---- 購読 ---- */
    subscribe: function(fn){
      if(typeof fn==="function") listeners.push(fn);
      return function(){ var i=listeners.indexOf(fn); if(i>=0) listeners.splice(i,1); };
    },
    _notify: function(){ for(var i=0;i<listeners.length;i++){ try{ listeners[i](this.route); }catch(e){} } },
    _notifyTab: function(){
      var TB = APP.tabbar;
      if(TB && typeof TB.setActive==="function" && this.route){ try{ TB.setActive(this.route.tab); }catch(e){} }
    }
  };

  APP.router = Router;
  G.Router = G.Router || Router;   // 旧 engine の Router と衝突しない場合のみ公開
})();
