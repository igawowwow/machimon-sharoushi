"use strict";
/* ============================================================
   machimon/store-update.js — App Storeの新しい版のお知らせ(2026-10-11)
   ・このアプリは新しい版が App Store でしか入らない。出ていたら起動時にダイアログで
     知らせ、「アップデートする」で App Store のページを開く。
   ・実行はネイティブ(Capacitor)のみ。Web/PWA版は即 return(完全no-op)。
   ・いまの版は window.__mmAppVer(tools/build-www.js がリリースの版を www/index.html へ
     書きこむ)、ストアの版は iTunes Lookup API(審査を通って公開された版だけが返る)。
   ・「あとで」を押したら、その日はもう出さない(翌日また出る)。
   ============================================================ */
(function(){
  var C = (typeof window!=="undefined") ? window.Capacitor : null;
  var native = !!(C && typeof C.isNativePlatform==="function" && C.isNativePlatform());
  if(!native) return;                                   /* Web版は何もしない */
  var MINE = String(window.__mmAppVer||"");
  if(!MINE) return;                                     /* いまの版が分からないなら出さない */

  var APP_ID = "6814888501";
  var LOOKUP = "https://itunes.apple.com/lookup?id="+APP_ID+"&country=jp";
  var STORE  = "itms-apps://apps.apple.com/jp/app/id"+APP_ID;
  var LATER  = "mm-store-later";

  /* "1.10" > "1.9" を正しく比べる(数字の並びとして比較) */
  function newer(a,b){
    var x=String(a||"").split("."), y=String(b||"").split(".");
    for(var i=0;i<Math.max(x.length,y.length);i++){
      var p=parseInt(x[i],10)||0, q=parseInt(y[i],10)||0;
      if(p!==q) return p>q;
    }
    return false;
  }
  function today(){ var d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

  function show(ver){
    if(document.getElementById("storeUpd")) return;
    var o=document.createElement("div");
    o.id="storeUpd";
    o.style.cssText="position:fixed;inset:0;z-index:99999;background:rgba(6,8,20,.78);display:flex;align-items:center;justify-content:center;padding:24px";
    o.innerHTML='<div style="width:100%;max-width:320px;background:#2A2140;border:1px solid #6B5A9C;border-radius:16px;padding:22px 18px;text-align:center;color:#fff;font-family:inherit">'
      +'<div style="font-size:34px;line-height:1">🎁</div>'
      +'<div style="font-size:17px;font-weight:700;margin:10px 0 6px">新しいバージョンがあります</div>'
      +'<div style="font-size:13px;line-height:1.6;color:#C9CEEF;margin-bottom:16px">バージョン '+ver+' が出ました。<br>App Storeでアップデートしてください。</div>'
      +'<button id="storeUpdGo" style="display:block;width:100%;padding:13px;border:0;border-radius:12px;background:#F5B93A;color:#231A00;font-size:15px;font-weight:700">アップデートする</button>'
      +'<button id="storeUpdLater" style="display:block;width:100%;padding:11px;margin-top:8px;border:0;background:transparent;color:#9AA2D4;font-size:13px">あとで</button>'
      +'</div>';
    document.body.appendChild(o);
    document.getElementById("storeUpdGo").onclick=function(){
      window.location.href=STORE;                       /* 外部URLはOS側が開く=App Storeアプリへ */
    };
    document.getElementById("storeUpdLater").onclick=function(){
      try{ localStorage.setItem(LATER, ver+"|"+today()); }catch(e){}
      if(o.parentNode) o.parentNode.removeChild(o);
    };
  }

  /* 起動を邪魔しないよう遅延して実行 */
  setTimeout(function(){
    (async function(){
      var mine=MINE, store="";
      try{
        var res=await fetch(LOOKUP, { cache:"no-store" });
        if(!res || !res.ok) return;
        var j=await res.json();
        store=String(((j.results||[])[0]||{}).version||"");
      }catch(e){ return; }                              /* オフライン等は静かに諦める(次回また) */
      if(!store || !newer(store,mine)) return;
      try{ if(localStorage.getItem(LATER)===store+"|"+today()) return; }catch(e){}
      show(store);
    })();
  }, 3500);
})();
