"use strict";
/* ============================================================
   app/events.js — 単一イベント委譲(Phase3b 基盤)
   ・data-action="name" (+ data-arg) → actionMap[name](arg,ev,el)
   ・data-route="tab/screen?a=1"     → Router.go(parseRoute)
   ・data-tab="home"                 → Router.tab
   1つの delegate リスナで #app / tabbar の click を捕捉。
   ※ inline onclick の全廃は後Phase。ここでは新機構を用意するのみ(旧UIには data-* 属性が無く不干渉)。
   ・自動 bind しない: Router.start() から明示 bind(旧起動と衝突させない=旧UI無傷)。
   非module classic script。名前空間 window.SRApp。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var APP = G.SRApp = G.SRApp || {};

  var actionMap = {};
  var bound = false;

  /* "adventure/subject?si=3&x=a" -> {tab:'adventure',screen:'subject',params:{si:'3',x:'a'}} */
  function parseRoute(str){
    var s = String(str||"");
    var qi = s.indexOf("?");
    var pathPart = qi>=0 ? s.slice(0,qi) : s;
    var queryPart = qi>=0 ? s.slice(qi+1) : "";
    var segs = pathPart.split("/").filter(Boolean);
    var route = { tab: segs[0]||"home", params:{} };
    if(segs[1]) route.screen = segs[1];
    if(queryPart){
      queryPart.split("&").forEach(function(kv){
        if(!kv) return;
        var eq = kv.indexOf("=");
        var k = eq>=0 ? kv.slice(0,eq) : kv;
        var v = eq>=0 ? kv.slice(eq+1) : "";
        try{ route.params[decodeURIComponent(k)] = decodeURIComponent(v); }catch(e){ route.params[k]=v; }
      });
    }
    return route;
  }

  var Events = {
    map: actionMap,
    parseRoute: parseRoute,

    on: function(name, fn){ if(name && typeof fn==="function") actionMap[name]=fn; return this; },
    off: function(name){ delete actionMap[name]; return this; },
    has: function(name){ return typeof actionMap[name]==="function"; },

    /* data-action の実行(委譲ハンドラ / 手動 dispatch 共通) */
    dispatch: function(name, arg, ev, el){
      var fn = actionMap[name];
      if(typeof fn!=="function") return undefined;
      try{ return fn(arg, ev, el); }catch(e){ return undefined; }
    },

    /* 委譲ハンドラ本体(click) */
    handle: function(ev){
      var target = ev && ev.target;
      var el = (target && typeof target.closest==="function")
        ? target.closest("[data-action],[data-route],[data-tab]") : null;
      if(!el || typeof el.getAttribute!=="function") return;
      var R = APP.router;
      var tab = el.getAttribute("data-tab");
      if(tab){ if(R) R.tab(tab); return; }
      var route = el.getAttribute("data-route");
      if(route){ if(R) R.go(parseRoute(route)); return; }
      var action = el.getAttribute("data-action");
      if(action){
        if(ev && typeof ev.preventDefault==="function"){ try{ ev.preventDefault(); }catch(e){} }
        var arg = el.getAttribute("data-arg");
        this.dispatch(action, arg, ev, el);
      }
    },

    /* 1つの委譲リスナを document に張る(冪等) */
    bind: function(root){
      if(bound) return;
      var doc = root || (typeof G.document!=="undefined" ? G.document : null);
      if(!doc || typeof doc.addEventListener!=="function") return;
      var self = this;
      doc.addEventListener("click", function(ev){ self.handle(ev); }, false);
      bound = true;
    },
    isBound: function(){ return bound; }
  };

  APP.events = Events;
})();
